const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;
  let title;
  let priority;

  // --- Приоритет ---
  const rawPriority = draft?.priority;
  if (typeof rawPriority !== "string" || !ALLOWED_PRIORITIES.has(rawPriority)) {
    errors.priority = 'Приоритет должен быть "low", "medium" или "high"';
  } else {
    priority = rawPriority;
  }

  // --- Название ---
  const rawTitle = draft?.title;
  if (typeof rawTitle !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    const trimmed = rawTitle.trim();
    if (trimmed.length === 0) {
      errors.title = "Название не должно быть пустым";
    } else if (trimmed.length > 100) {
      errors.title = "Название не должно превышать 100 символов";
    } else {
      title = trimmed;
    }
  }

  // --- Идентификатор ---
  if (editingId === null) {
    // Режим создания: id приходит из черновика.
    const rawId = draft?.id;
    let numericId = NaN;

    if (typeof rawId === "number") {
      numericId = rawId;
    } else if (typeof rawId === "string" && rawId.trim() !== "") {
      numericId = Number(rawId);
    }

    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      errors.id = "Идентификатор должен быть положительным целым числом";
    } else if (tasks.some((task) => task.id === numericId)) {
      errors.id = `Задача с id = ${numericId} уже существует`;
    } else {
      id = numericId;
    }
  } else {
    // Режим редактирования: id берётся из editingId.
    if (!Number.isSafeInteger(editingId) || editingId <= 0) {
      errors.id = "Некорректный идентификатор редактируемой задачи";
    } else if (!tasks.some((task) => task.id === editingId)) {
      errors.id = `Задача с id = ${editingId} не найдена`;
    } else {
      id = editingId;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { id, title, priority } };
}
