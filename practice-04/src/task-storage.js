export const STORAGE_VERSION = 1;

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

function isValidTask(task) {
  if (task === null || typeof task !== "object" || Array.isArray(task)) return false;
  if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
  if (typeof task.title !== "string") return false;
  const trimmed = task.title.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  if (task.title !== trimmed) return false; 
  if (typeof task.completed !== "boolean") return false;
  if (!ALLOWED_PRIORITIES.has(task.priority)) return false;
  return true;
}

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const seen = new Set();
  for (const task of value) {
    if (!isValidTask(task)) return false;
    if (seen.has(task.id)) return false;
    seen.add(task.id);
  }
  return true;
}

function cloneTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallbackCopy = cloneTasks(fallbackTasks);

  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return {
      ok: false,
      source: "fallback",
      tasks: fallbackCopy,
      error: `Не удалось прочитать сохранённые данные: ${error.message}`,
    };
  }

  if (raw === null) {
    return { ok: true, source: "initial", tasks: fallbackCopy };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      source: "fallback",
      tasks: fallbackCopy,
      error: "Сохранённые данные повреждены (некорректный JSON)",
    };
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    parsed.version !== STORAGE_VERSION ||
    !isValidTaskList(parsed.tasks)
  ) {
    return {
      ok: false,
      source: "fallback",
      tasks: fallbackCopy,
      error: "Сохранённые данные не соответствуют схеме",
    };
  }

  return { ok: true, source: "storage", tasks: cloneTasks(parsed.tasks) };
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Список задач не соответствует схеме хранения" };
  }

  const payload = JSON.stringify({ version: STORAGE_VERSION, tasks });

  try {
    storage.setItem(key, payload);
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить данные: ${error.message}` };
  }

  return { ok: true };
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
  }
  return { ok: true };
}