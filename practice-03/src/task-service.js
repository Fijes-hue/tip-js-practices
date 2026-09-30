
const PRIORITIES = ["low", "medium", "high"];

function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function normalizeTitle(value) {
  if (typeof value !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }

  const title = value.trim();

  if (title.length === 0) {
    return { ok: false, error: "Название не должно быть пустым" };
  }

  if (title.length > 100) {
    return { ok: false, error: "Название не должно превышать 100 символов" };
  }

  return { ok: true, title };
}

function isValidPriority(priority) {
  return PRIORITIES.includes(priority);
}

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  const normalized = normalizeTitle(title);
  if (!normalized.ok) {
    return normalized;
  }

  if (!isValidPriority(priority)) {
    return { ok: false, error: 'Приоритет должен быть "low", "medium" или "high"' };
  }

  return {
    ok: true,
    task: {
      id,
      title: normalized.title,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "id число" };
  }

  if (tasks.some((task) => task.id === id)) {
    return { ok: false, error: `Задача с id = ${id} уже существует` };
  }

  const created = createTask(id, title, priority);
  if (!created.ok) {
    return created;
  }

  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "id число" };
  }

  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть логическим значением" };
  }

  const target = findTaskById(tasks, id);
  if (target === undefined) {
    return { ok: false, error: `Задача с id = ${id} не найдена` };
  }

  const next = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );

  return { ok: true, tasks: next };
}

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) {
    return { ok: false, error: "id число" };
  }

  const normalized = normalizeTitle(title);
  if (!normalized.ok) {
    return normalized;
  }

  const target = findTaskById(tasks, id);
  if (target === undefined) {
    return { ok: false, error: `Задача с id = ${id} не найдена` };
  }

  const next = tasks.map((task) =>
    task.id === id ? { ...task, title: normalized.title } : task
  );

  return { ok: true, tasks: next };
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "id число" };
  }

  const target = findTaskById(tasks, id);
  if (target === undefined) {
    return { ok: false, error: `Задача с id = ${id} не найдена` };
  }

  const next = tasks.filter((task) => task.id !== id);

  return { ok: true, tasks: next };
}