import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout")
    return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network")
    return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response")
    return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404)
    return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http")
    return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

export function createAppController({
  api,
  view,
  validateDraft = validateTaskDraft,
} = {}) {
  if (
    !api ||
    typeof api.loadInitialData !== "function" ||
    typeof api.getTasks !== "function"
  ) {
    throw new TypeError("api с методами loadInitialData и getTasks обязателен");
  }
  if (
    !view ||
    typeof view.setListState !== "function" ||
    typeof view.setTasks !== "function" ||
    typeof view.setCategories !== "function" ||
    typeof view.setTotal !== "function"
  ) {
    throw new TypeError(
      "view с обязательными методами представления обязателен",
    );
  }

  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;
  let categoriesLoaded = false;
  let activeController = null;
  let loadSequence = 0;
  let destroyed = false;

  function cancelActive() {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  function applySuccessfulLoad(payload, sequence) {
    if (destroyed) return;
    if (sequence !== loadSequence) return;

    tasks = payload.tasks;
    if (Array.isArray(payload.categories)) {
      categories = payload.categories;
      categoriesLoaded = true;
    }

    view.setCategories(categories);
    view.setTasks(tasks, categories);
    view.setTotal(payload.meta?.total ?? tasks.length);
    view.setListState(tasks.length === 0 ? "empty" : "ready");

    if (editingId !== null && !tasks.some((task) => task.id === editingId)) {
      editingId = null;
      view.setFormTask(null);
    }
  }

  function applyFailedLoad(error, sequence) {
    if (destroyed) return;
    if (sequence !== loadSequence) return;
    if (error instanceof ApiError && error.kind === "aborted") return;

    tasks = [];
    view.setTasks([], categories);
    view.setTotal(0);
    view.setListState("error", messageForError(error));
  }

  async function loadCurrentTasks() {
    cancelActive(); // отмена предыдущего
    activeController = new AbortController();
    const sequence = ++loadSequence;
    const signal = activeController.signal;

    view.setListState("loading"); // до await

    try {
      const payload = await api.getTasks(filters, { signal });
      applySuccessfulLoad(
        { tasks: payload.tasks, categories: null, meta: payload.meta },
        sequence,
      );
    } catch (error) {
      applyFailedLoad(error, sequence);
    }
  }

  async function loadInitial(filtersArg) {
    cancelActive();
    activeController = new AbortController();
    const sequence = ++loadSequence;
    const signal = activeController.signal;

    filters = { ...filtersArg };
    view.setListState("loading"); // до await

    try {
      const payload = await api.loadInitialData(filters, { signal });
      applySuccessfulLoad(
        {
          tasks: payload.tasks,
          categories: payload.categories,
          meta: payload.meta,
        },
        sequence,
      );
    } catch (error) {
      applyFailedLoad(error, sequence);
    }
  }

  async function start(initialFilters = {}) {
    await loadInitial(initialFilters);
  }

  async function applyFilters(newFilters) {
    filters = { ...newFilters };
    if (categoriesLoaded) {
      await loadCurrentTasks();
    } else {
      await loadInitial(filters);
    }
  }

  async function refresh() {
    if (categoriesLoaded) await loadCurrentTasks();
    else await loadInitial(filters);
  }

  function beginEdit(id) {
    if (!Number.isSafeInteger(id) || id <= 0) return;
    const task = tasks.find((item) => item.id === id);
    if (!task) {
      view.notify("Задача не найдена в текущей выборке.", "error");
      return;
    }
    editingId = id;
    view.setFormTask(task);
    view.showFormErrors({});
    view.notify("");
  }

  function cancelEdit() {
    editingId = null;
    view.setFormTask(null);
    view.showFormErrors({});
  }

  async function withMutation(work) {
    view.setMutationPending(true);
    try {
      const result = await work();
      await loadCurrentTasks();
      return result;
    } finally {
      view.setMutationPending(false);
    }
  }

  async function submit(draft) {
    const checked = validateDraft(draft, categories);
    if (!checked.valid) {
      view.showFormErrors(checked.errors);
      view.notify("Проверьте выделенные поля.", "error");
      return;
    }
    view.showFormErrors({});

    const isEditing = editingId !== null;
    const id = editingId;

    try {
      if (isEditing) {
        await withMutation(async () => {
          await api.updateTask(id, checked.value);
          view.notify("Изменения сохранены.", "success");
        });
      } else {
        await withMutation(async () => {
          await api.createTask(checked.value);
          view.notify("Задача добавлена.", "success");
        });
      }
      editingId = null;
      view.setFormTask(null);
    } catch (error) {
      view.notify(messageForError(error), "error");
    }
  }

  async function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    try {
      await withMutation(async () => {
        await api.setTaskCompleted(id, !task.completed);
        view.notify("Статус обновлён.", "success");
      });
    } catch (error) {
      view.notify(messageForError(error), "error");
    }
  }

  async function deleteTask(id) {
    try {
      await withMutation(async () => {
        await api.deleteTask(id);
        view.notify("Задача удалена.", "success");
      });
    } catch (error) {
      view.notify(messageForError(error), "error");
    }
  }

  async function resetData() {
    view.setMutationPending(true);
    try {
      await api.resetDemoData();
      view.notify("Учебные данные восстановлены.", "success");
      cancelActive();
      await loadCurrentTasks();
    } catch (error) {
      view.notify(messageForError(error), "error");
    } finally {
      view.setMutationPending(false);
    }
  }

  function destroy() {
    destroyed = true;
    cancelActive();
  }

  return {
    start,
    applyFilters,
    refresh,
    submit,
    beginEdit,
    cancelEdit,
    toggleTask,
    deleteTask,
    resetData,
    destroy,
  };
}
