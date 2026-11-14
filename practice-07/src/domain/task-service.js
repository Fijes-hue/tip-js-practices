// src/domain/task-service.js
// Чистые функции: без React, DOM, сети, случайных значений и изменения аргументов.

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// --- Валидация черновика формы ---
export function validateTaskDraft(draft, categories) {
  const errors = {};

  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return {
      valid: false,
      value: null,
      errors: { title: "Черновик должен быть объектом." },
    };
  }

  // title
  const rawTitle = draft.title;
  let title = "";
  if (typeof rawTitle !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    title = rawTitle.trim();
    if (title.length < 1) {
      errors.title = "Название не может быть пустым.";
    } else if (title.length > 100) {
      errors.title = "Название должно быть не длиннее 100 символов.";
    }
  }

  // priority
  const priority = draft.priority;
  if (typeof priority !== "string" || !ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Приоритет должен быть low, medium или high.";
  }

  // categoryId: должна быть строго целым положительным числом, существующим в справочнике
  const rawCategoryId = draft.categoryId;
  let categoryId = null;
  if (
    rawCategoryId === "" ||
    rawCategoryId === null ||
    rawCategoryId === undefined
  ) {
    errors.categoryId = "Выберите категорию.";
  } else {
    // Строгая проверка: только строка, состоящая из цифр, ИЛИ уже число.
    // parseInt('2x') === 2, поэтому так нельзя — нужна полная валидность.
    let parsed = null;
    if (typeof rawCategoryId === "number") {
      if (Number.isInteger(rawCategoryId) && rawCategoryId > 0) {
        parsed = rawCategoryId;
      }
    } else if (typeof rawCategoryId === "string") {
      if (/^[1-9]\d*$/.test(rawCategoryId)) {
        const n = Number(rawCategoryId);
        if (Number.isSafeInteger(n)) parsed = n;
      }
    }

    if (parsed === null) {
      errors.categoryId = "Категория должна быть положительным целым числом.";
    } else {
      const ids = new Set((categories ?? []).map((c) => c.id));
      if (!ids.has(parsed)) {
        errors.categoryId = "Указана неизвестная категория.";
      } else {
        categoryId = parsed;
      }
    }
  }

  const valid = Object.keys(errors).length === 0;
  const value = valid ? { title, priority, categoryId } : null;
  return { valid, value, errors };
}

// --- Фильтрация ---
export function selectTasks(tasks, filters) {
  const q = typeof filters.q === "string" ? filters.q.trim().toLowerCase() : "";
  const completedFilter = filters.completed; // '' | 'true' | 'false'
  const priorityFilter = filters.priority; // '' | 'low' | 'medium' | 'high'
  const categoryIdFilter =
    filters.categoryId === "" || filters.categoryId == null
      ? null
      : Number(filters.categoryId);

  return tasks.filter((task) => {
    if (q && !task.title.toLowerCase().includes(q)) return false;

    if (completedFilter === "true" && !task.completed) return false;
    if (completedFilter === "false" && task.completed) return false;

    if (priorityFilter && task.priority !== priorityFilter) return false;

    if (categoryIdFilter !== null && task.categoryId !== categoryIdFilter)
      return false;

    return true;
  });
}

// --- Статистика по всему массиву ---
export function getTaskStats(tasks) {
  let completed = 0;
  for (const task of tasks) {
    if (task.completed) completed += 1;
  }
  return {
    total: tasks.length,
    completed,
    active: tasks.length - completed,
  };
}

// --- Операции изменения (возвращают новый массив) ---

export function addTask(tasks, value, id) {
  // Проверка id: целое положительное, не занятое
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError("id должен быть положительным целым числом.");
  }
  if (tasks.some((t) => t.id === id)) {
    throw new Error(`Задача с id ${id} уже существует.`);
  }

  const newTask = {
    id,
    title: value.title,
    priority: value.priority,
    categoryId: value.categoryId,
    completed: false,
  };
  return [...tasks, newTask];
}

export function updateTask(tasks, id, value) {
  let found = false;
  const next = tasks.map((task) => {
    if (task.id !== id) return task;
    found = true;
    return {
      ...task,
      title: value.title,
      priority: value.priority,
      categoryId: value.categoryId,
      // completed сохраняется
    };
  });
  // Неизвестный id — возвращаем тот же массив (контракт ПР7)
  return found ? next : tasks;
}

export function toggleTask(tasks, id) {
  let found = false;
  const next = tasks.map((task) => {
    if (task.id !== id) return task;
    found = true;
    return { ...task, completed: !task.completed };
  });
  return found ? next : tasks;
}

export function removeTask(tasks, id) {
  const next = tasks.filter((task) => task.id !== id);
  // Если id не найден — длина не изменится, вернётся массив с теми же элементами.
  // Чтобы сохранить контракт "возврат той же ссылки при отсутствии изменений":
  return next.length === tasks.length ? tasks : next;
}
