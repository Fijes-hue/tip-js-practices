
export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }

  if (!isValidPriority(priority)) {
    return { ok: false, error: "priority должен быть одним из: low, medium, high" };
  }

  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority,
    },
  };
  throw new Error("Не реализовано: createTask");
}

export function findTaskById(tasks, id) {
   return tasks.find((task) => task.id === id);
  throw new Error("Не реализовано: findTaskById");
}

export function getPendingTasks(tasks) {
   return tasks.filter((task) => task.completed === false);
  throw new Error("Не реализовано: getPendingTasks");
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
  throw new Error("Не реализовано: getTaskTitles");
}

export function getTaskStats(tasks) {
     const total = tasks.length;

  let completed = 0;
  for (const task of tasks) {
    if (task.completed === true) {
      completed += 1;
    }
  }

  const pending = total - completed;
  const progress = total === 0 ? 0 : completed / total * 100;

  return { total, completed, pending, progress };
  throw new Error("Не реализовано: getTaskStats");
}

export function addTask(tasks, id, title, priority = "medium") {
     if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  const existing = tasks.find((task) => task.id === id);
  if (existing !== undefined) {
    return { ok: false, error: `Задача с id = ${id} уже существует` };
  }

  const created = createTask(id, title, priority);
  if (!created.ok) {
    return created;
  }

  return { ok: true, tasks: [...tasks, created.task] };
  throw new Error("Не реализовано: addTask");
}

export function setTaskCompleted(tasks, id, completed) {
   if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть логическим значением" };
  }

  const found = tasks.find((task) => task.id === id);
  if (found === undefined) {
    return { ok: false, error: `Задача с id = ${id} не найдена` };
  }

  const updated = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );

  return { ok: true, tasks: updated };
  throw new Error("Не реализовано: setTaskCompleted");
}

export function renameTask(tasks, id, title) {
    if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }

  const found = tasks.find((task) => task.id === id);
  if (found === undefined) {
    return { ok: false, error: `Задача с id = ${id} не найдена` };
  }

  const updated = tasks.map((task) =>
    task.id === id ? { ...task, title: titleResult.title } : task
  );

  return { ok: true, tasks: updated };
  throw new Error("Не реализовано: renameTask");
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  const found = tasks.find((task) => task.id === id);
  if (found === undefined) {
    return { ok: false, error: `Задача с id = ${id} не найдена` };
  }

  const updated = tasks.filter((task) => task.id !== id);

  return { ok: true, tasks: updated };
}