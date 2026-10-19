import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message, cause) {
  return new ApiError(message, { kind: "invalid-response", cause });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    isPositiveSafeInteger(value.id) &&
    typeof value.title === "string" &&
    value.title.trim().length >= 1 &&
    value.title.trim().length <= 100 &&
    typeof value.completed === "boolean" &&
    ALLOWED_PRIORITIES.has(value.priority) &&
    isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    isPositiveSafeInteger(value.id) &&
    typeof value.name === "string" &&
    value.name.trim().length >= 1 &&
    value.name.trim().length <= 100,
  );
}

function hasUniqueIds(items) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
  }
  return true;
}

function normalizeFilters(filters) {
  if (filters === undefined) return {};
  if (
    filters === null ||
    typeof filters !== "object" ||
    Array.isArray(filters)
  ) {
    throw new TypeError("Фильтры должны быть объектом");
  }

  for (const key of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}`);
    }
  }

  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(filters, "completed")) {
    if (typeof filters.completed !== "boolean") {
      throw new TypeError("completed должен быть логическим значением");
    }
    normalized.completed = filters.completed;
  }
  if (Object.prototype.hasOwnProperty.call(filters, "priority")) {
    if (
      typeof filters.priority !== "string" ||
      !ALLOWED_PRIORITIES.has(filters.priority)
    ) {
      throw new TypeError('priority должен быть "low", "medium" или "high"');
    }
    normalized.priority = filters.priority;
  }
  if (Object.prototype.hasOwnProperty.call(filters, "categoryId")) {
    if (!isPositiveSafeInteger(filters.categoryId)) {
      throw new TypeError("categoryId должен быть положительным целым числом");
    }
    normalized.categoryId = filters.categoryId;
  }
  if (Object.prototype.hasOwnProperty.call(filters, "q")) {
    if (typeof filters.q !== "string") {
      throw new TypeError("q должен быть строкой");
    }
    const trimmed = filters.q.trim();
    if (trimmed.length > 100) {
      throw new TypeError("q не должен превышать 100 символов");
    }
    normalized.q = trimmed;
  }

  return normalized;
}

function normalizeCreateDraft(draft) {
  if (draft === null || typeof draft !== "object" || Array.isArray(draft)) {
    throw new TypeError("Черновик создания должен быть объектом");
  }
  const result = {};
  for (const key of ["title", "priority", "categoryId"]) {
    if (!(key in draft)) throw new TypeError(`Не хватает поля ${key}`);
    result[key] = draft[key];
  }
  return result;
}

function normalizeUpdateChanges(changes) {
  if (
    changes === null ||
    typeof changes !== "object" ||
    Array.isArray(changes)
  ) {
    throw new TypeError("Изменения должны быть объектом");
  }
  const allowed = ["title", "priority", "categoryId", "completed"];
  const result = {};
  for (const key of Object.keys(changes)) {
    if (!allowed.includes(key)) {
      throw new TypeError(`Неизвестное поле изменения: ${key}`);
    }
    result[key] = changes[key];
  }
  if (Object.keys(result).length === 0) {
    throw new TypeError("Изменение должно содержать хотя бы одно поле");
  }
  return result;
}

function assertTaskCollectionPayload(payload) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw invalidResponse("Ответ списка задач должен быть объектом");
  }
  if (!Array.isArray(payload.data)) {
    throw invalidResponse("Поле data должно быть массивом");
  }
  for (const task of payload.data) {
    if (!isTask(task))
      throw invalidResponse("Одна из задач не соответствует схеме");
  }
  if (!hasUniqueIds(payload.data)) {
    throw invalidResponse("Задачи содержат повторяющиеся id");
  }
  const meta = payload.meta;
  if (meta !== undefined) {
    if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
      throw invalidResponse("Поле meta должно быть объектом");
    }
    if (meta.total !== undefined && meta.total !== payload.data.length) {
      throw invalidResponse("meta.total не совпадает с длиной data");
    }
  }
  return payload;
}

function assertSingleTaskPayload(payload) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw invalidResponse("Ответ должен быть объектом");
  }
  if (!isTask(payload.data)) {
    throw invalidResponse("Задача не соответствует схеме");
  }
  return payload.data;
}

function assertCategoriesPayload(payload) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw invalidResponse("Ответ категорий должен быть объектом");
  }
  if (!Array.isArray(payload.data)) {
    throw invalidResponse("Поле data категорий должно быть массивом");
  }
  for (const category of payload.data) {
    if (!isCategory(category)) {
      throw invalidResponse("Одна из категорий не соответствует схеме");
    }
  }
  if (!hasUniqueIds(payload.data)) {
    throw invalidResponse("Категории содержат повторяющиеся id");
  }
  return payload.data;
}

function assertResetPayload(payload) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw invalidResponse("Ответ reset должен быть объектом");
  }
  const data = payload.data;
  if (
    !data ||
    typeof data !== "object" ||
    data.reset !== true ||
    !Number.isSafeInteger(data.total)
  ) {
    throw invalidResponse("Ответ reset имеет неверную схему");
  }
  return { reset: true, total: data.total };
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client.requestJson обязателен");
  }

  async function getTasks(filters, { signal } = {}) {
    const normalized = normalizeFilters(filters);
    const hasQuery = Object.keys(normalized).length > 0;
    const payload = await client.requestJson(
      "/tasks",
      hasQuery ? { query: normalized, signal } : { signal },
    );
    const checked = assertTaskCollectionPayload(payload);
    const meta =
      checked.meta && typeof checked.meta === "object"
        ? checked.meta
        : { total: checked.data.length, filters: normalized };
    return { tasks: checked.data, meta };
  }

  async function getTaskById(id, { signal } = {}) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError(
        "id должен быть положительным безопасным целым числом",
      );
    }
    const payload = await client.requestJson(`/tasks/${id}`, { signal });
    return assertSingleTaskPayload(payload);
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", { signal });
    return assertCategoriesPayload(payload);
  }

  async function loadInitialData(filters, { signal } = {}) {
    const normalized = normalizeFilters(filters);
    const [taskResult, categories] = await Promise.all([
      getTasks(normalized, { signal }),
      getCategories({ signal }),
    ]);
    const meta =
      taskResult.meta && typeof taskResult.meta === "object"
        ? taskResult.meta
        : { total: taskResult.tasks.length, filters: normalized };
    if (meta.filters === undefined) meta.filters = normalized;
    return { tasks: taskResult.tasks, categories, meta };
  }

  async function createTask(draft, { signal } = {}) {
    const normalized = normalizeCreateDraft(draft);
    const payload = await client.requestJson("/tasks", {
      method: "POST",
      body: normalized,
      signal,
    });
    return assertSingleTaskPayload(payload);
  }

  async function updateTask(id, changes, { signal } = {}) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError(
        "id должен быть положительным безопасным целым числом",
      );
    }
    const normalized = normalizeUpdateChanges(changes);
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: normalized,
      signal,
    });
    return assertSingleTaskPayload(payload);
  }

  async function setTaskCompleted(id, completed, { signal } = {}) {
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть логическим значением");
    }
    return updateTask(id, { completed }, { signal });
  }

  async function deleteTask(id, { signal } = {}) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError(
        "id должен быть положительным безопасным целым числом",
      );
    }
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "DELETE",
      signal,
    });
    if (payload !== null) {
      throw invalidResponse("DELETE должен возвращать 204 без тела");
    }
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", {
      method: "POST",
      signal,
    });
    return assertResetPayload(payload);
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}
