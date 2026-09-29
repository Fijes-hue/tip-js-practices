import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

console.log("ПР2. Демонстрационный сценарий");
console.log("Количество задач в общем наборе:", demoTasks.length);
console.log("Номер варианта:", variantNumber);
console.log("Количество задач в индивидуальном наборе:", variantTasks.length);

let currentTasks = demoTasks;

console.log("=== ИСХОДНЫЕ ЗАДАЧИ ===");
console.log("Задачи:", currentTasks);
console.log("Названия задач:", getTaskTitles(currentTasks));
console.log("Невыполненные задачи:", getPendingTasks(currentTasks));

let stats = getTaskStats(currentTasks);
console.log(
  `Сводка: всего — ${stats.total}, выполнено — ${stats.completed}, ` +
  `осталось — ${stats.pending}, прогресс — ${stats.progress.toFixed(1)}%`
);

let result = addTask(currentTasks, 20, "Добавить проверку", "high");

if (result.ok) {
  currentTasks = result.tasks;
  console.log("\n=== ДОБАВЛЕНИЕ ЗАДАЧИ id=20 ===");
  console.log("Задача успешно добавлена.");
  console.log("Текущее состояние:", currentTasks);
} else {
  console.error(`Ошибка при добавлении задачи: ${result.error}`);
}

result = setTaskCompleted(currentTasks, 4, true);

if (result.ok) {
  currentTasks = result.tasks;
  console.log("\n=== ЗАВЕРШЕНИЕ ЗАДАЧИ id=4 ===");
  console.log("Задача id=4 отмечена как выполненная.");
  console.log("Текущее состояние:", currentTasks);
} else {
  console.error(`Ошибка при завершении задачи: ${result.error}`);
}

result = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");

if (result.ok) {
  currentTasks = result.tasks;
  console.log("\n=== ПЕРЕИМЕНОВАНИЕ ЗАДАЧИ id=10 ===");
  console.log("Задача id=10 переименована.");
  console.log("Текущее состояние:", currentTasks);
} else {
  console.error(`Ошибка при переименовании задачи: ${result.error}`);
}

result = removeTask(currentTasks, 7);

if (result.ok) {
  currentTasks = result.tasks;
  console.log("\n=== УДАЛЕНИЕ ЗАДАЧИ id=7 ===");
  console.log("Задача id=7 удалена.");
  console.log("Текущее состояние:", currentTasks);
} else {
  console.error(`Ошибка при удалении задачи: ${result.error}`);
}

console.log("\n=== ПРОВЕРКА ОБРАБОТКИ ОТКАЗОВ ===");

result = addTask(currentTasks, 20, "Дубликат", "low");
if (result.ok) {
  currentTasks = result.tasks;
  console.log("Дубликат добавлен (неожиданно).");
} else {
  console.error(`Отказ (повторяющийся id): ${result.error}`);
}

result = setTaskCompleted(currentTasks, 1, "yes");
if (result.ok) {
  currentTasks = result.tasks;
  console.log("Статус изменён (неожиданно).");
} else {
  console.error(`Отказ (неверный тип completed): ${result.error}`);
}

result = removeTask(currentTasks, 999);
if (result.ok) {
  currentTasks = result.tasks;
  console.log("Задача удалена (неожиданно).");
} else {
  console.error(`Отказ (задача не найдена): ${result.error}`);
}

result = renameTask(currentTasks, 1, "   ");
if (result.ok) {
  currentTasks = result.tasks;
  console.log("Задача переименована (неожиданно).");
} else {
  console.error(`Отказ (пустое название): ${result.error}`);
}

console.log("\n=== ПРОВЕРКА НЕИЗМЕННОСТИ ИСХОДНЫХ ДАННЫХ ===");
console.log("Исходный demoTasks:", demoTasks);
console.log(
  "demoTasks не изменился:",
  demoTasks.length === 4 &&
  demoTasks[0].id === 1 &&
  demoTasks[1].id === 4 &&
  demoTasks[2].id === 7 &&
  demoTasks[3].id === 10
);

console.log("\n=== ИТОГОВАЯ СВОДКА ===");
stats = getTaskStats(currentTasks);
console.log(
  `Всего: ${stats.total}; выполнено: ${stats.completed}; ` +
  `осталось: ${stats.pending}; прогресс: ${stats.progress.toFixed(1)}%`
);

if (stats.total === 0) {
  console.log("Задач пока нет");
}

console.log(`\n=== ВАРИАНТ ${variantNumber} ===`);
console.log("Задачи варианта:", variantTasks);
console.log("Названия задач варианта:", getTaskTitles(variantTasks));

const variantStats = getTaskStats(variantTasks);
console.log(
  `Сводка варианта: всего — ${variantStats.total}, ` +
  `выполнено — ${variantStats.completed}, ` +
  `осталось — ${variantStats.pending}, ` +
  `прогресс — ${variantStats.progress.toFixed(1)}%`
);

console.log("\n=== ДЕМОНСТРАЦИЯ createTask И findTaskById ===");

const created = createTask(99, "Новая задача из createTask", "low");
if (created.ok) {
  console.log("createTask успешно:", created.task);
} else {
  console.error(`createTask: ${created.error}`);
}

const found = findTaskById(currentTasks, 4);
if (found !== undefined) {
  console.log("findTaskById(4):", found);
} else {
  console.log("Задача с id=4 не найдена.");
}