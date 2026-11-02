const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function validateTaskDraft(draft, categories) {
  const errors = {};
  let title;
  let priority;
  let categoryId;

  const rawTitle = draft?.title;
  if (typeof rawTitle !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    const trimmed = rawTitle.trim();
    if (trimmed.length === 0) {
      errors.title = "Название не должно быть пустым.";
    } else if (trimmed.length > 100) {
      errors.title = "Название не должно превышать 100 символов.";
    } else {
      title = trimmed;
    }
  }

  const rawPriority = draft?.priority;
  if (typeof rawPriority !== "string" || !ALLOWED_PRIORITIES.has(rawPriority)) {
    errors.priority = 'Приоритет должен быть "low", "medium" или "high".';
  } else {
    priority = rawPriority;
  }

  const rawCategory = draft?.categoryId;
  let numericCategory = NaN;
  if (typeof rawCategory === "number") {
    numericCategory = rawCategory;
  } else if (
    typeof rawCategory === "string" &&
    /^\d+$/.test(rawCategory.trim())
  ) {
    numericCategory = Number(rawCategory);
  }

  if (!isPositiveSafeInteger(numericCategory)) {
    errors.categoryId = "Категория должна быть выбрана.";
  } else if (
    !Array.isArray(categories) ||
    !categories.some((category) => category.id === numericCategory)
  ) {
    errors.categoryId = "Такой категории не существует.";
  } else {
    categoryId = numericCategory;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }
  return { valid: true, value: { title, priority, categoryId }, errors: {} };
}

export function selectTasks(tasks, filters) {
  const q = (filters.q ?? "").trim().toLowerCase();
  const { completed, priority, categoryId } = filters;

  return tasks.filter((task) => {
    if (q && !task.title.toLowerCase().includes(q)) return false;

    if (completed === "true" && task.completed !== true) return false;
    if (completed === "false" && task.completed !== false) return false;

    if (priority && task.priority !== priority) return false;
    if (categoryId && String(task.categoryId) !== categoryId) return false;
    return true;
  });
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  return { total, completed, active: total - completed };
}

export function addTask(tasks, value, id) {
  if (!isPositiveSafeInteger(id)) {
    throw new TypeError("id должен быть положительным безопасным целым числом");
  }
  if (tasks.some((task) => task.id === id)) {
    throw new Error(`Задача с id = ${id} уже существует`);
  }
  return [...tasks, { id, ...value, completed: false }];
}

export function updateTask(tasks, id, value) {
  return tasks.map((task) =>
    task.id === id
      ? {
          ...task,
          title: value.title,
          priority: value.priority,
          categoryId: value.categoryId,
        }
      : task,
  );
}

export function toggleTask(tasks, id) {
  return tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  );
}

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}
