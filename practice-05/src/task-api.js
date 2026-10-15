import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
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
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
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
    if (typeof filters.priority !== "string" || !ALLOWED_PRIORITIES.has(filters.priority)) {
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

function assertTaskCollectionPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw invalidResponse("Ответ списка задач должен быть объектом");
  }
  if (!Array.isArray(payload.data)) {
    throw invalidResponse("Поле data должно быть массивом");
  }
  for (const task of payload.data) {
    if (!isTask(task)) {
      throw invalidResponse("Одна из задач не соответствует схеме");
    }
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

function assertTaskPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw invalidResponse("Ответ задачи должен быть объектом");
  }
  if (!isTask(payload.data)) {
    throw invalidResponse("Задача не соответствует схеме");
  }
  return payload.data;
}

function assertCategoriesPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
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
  const meta = payload.meta;
  if (meta !== undefined && meta !== null && typeof meta === "object"
    && meta.total !== undefined && meta.total !== payload.data.length) {
    throw invalidResponse("meta.total категорий не совпадает с длиной data");
  }
  return payload.data;
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client.requestJson обязателен");
  }

  async function getTasks(filters) {
    const normalized = normalizeFilters(filters);
    const hasQuery = Object.keys(normalized).length > 0;
    const payload = await client.requestJson("/tasks", hasQuery
      ? { query: normalized }
      : undefined);

    const checked = assertTaskCollectionPayload(payload);
    const meta = checked.meta && typeof checked.meta === "object"
      ? checked.meta
      : { total: checked.data.length, filters: normalized };

    return { tasks: checked.data, meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным безопасным целым числом");
    }
    const payload = await client.requestJson(`/tasks/${id}`);
    return assertTaskPayload(payload);
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    return assertCategoriesPayload(payload);
  }

  async function loadInitialData(filters) {
    const normalized = normalizeFilters(filters);
    const hasQuery = Object.keys(normalized).length > 0;

    const [taskResult, categories] = await Promise.all([
      getTasks(normalized),
      getCategories(),
    ]);

    const meta = taskResult.meta && typeof taskResult.meta === "object"
      ? taskResult.meta
      : { total: taskResult.tasks.length, filters: normalized };

    if (meta.filters === undefined) {
      meta.filters = normalized;
    }
    void hasQuery;

    return { tasks: taskResult.tasks, categories, meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
