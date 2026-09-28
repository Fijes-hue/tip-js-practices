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
console.log("Вариант:", variantNumber);
console.log("Задач в общем наборе:", demoTasks.length);
console.log("Задач в индивидуальном наборе:", variantTasks.length);

console.log("\n\n══════ ОБЩИЙ СЦЕНАРИЙ ══════");

console.log("\nНазвания задач:", getTaskTitles(demoTasks));
console.log(
  "Невыполненные id:",
  getPendingTasks(demoTasks).map((t) => t.id)
);
console.log("Поиск id=4:", findTaskById(demoTasks, 4)?.title);
console.log("Поиск id=777:", findTaskById(demoTasks, 777));

printStats(demoTasks, "Исходный набор");

let currentTasks = demoTasks;

let result = addTask(currentTasks, 20, "Добавить проверку", "high");
currentTasks = applyResult(currentTasks, result, "addTask id=20");
printStats(currentTasks, "После добавления id=20");

result = setTaskCompleted(currentTasks, 4, true);
currentTasks = applyResult(currentTasks, result, "setTaskCompleted id=4");
printStats(currentTasks, "После выполнения id=4");

result = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
currentTasks = applyResult(currentTasks, result, "renameTask id=10");
printStats(currentTasks, "После переименования id=10");

result = removeTask(currentTasks, 7);
currentTasks = applyResult(currentTasks, result, "removeTask id=7");
printStats(currentTasks, "После удаления id=7");

console.log("\n--- Проверка отказа: повторяющийся id ---");
result = addTask(currentTasks, 20, "Дубликат", "low");
if (!result.ok) {
  console.error(`Ожидаемый отказ: ${result.error}`);
} else {
  console.error("ОШИБКА: дубликат не был отклонён!");
}


console.log("\n--- Проверка сохранности demoTasks ---");
console.log("demoTasks.length:", demoTasks.length, "(ожидается 4)");
console.log(
  "demoTasks ids:",
  demoTasks.map((t) => t.id),
  "(ожидается [1, 4, 7, 10])"
);
console.log(
  "id=4 completed:",
  findTaskById(demoTasks, 4).completed,
  "(ожидается false)"
);
console.log(
  "id=10 title:",
  findTaskById(demoTasks, 10).title,
  "(ожидается 'Оформить README')"
);


console.log("\n\n══════ ИНДИВИДУАЛЬНЫЙ СЦЕНАРИЙ (вариант 8) ══════");

console.log("\nНазвания задач:", getTaskTitles(variantTasks));
console.log(
  "Невыполненные id:",
  getPendingTasks(variantTasks).map((t) => t.id)
);

printStats(variantTasks, "Исходный набор варианта");

let variantState = variantTasks;


result = addTask(variantState, 80, "Согласовать финальный макет", "low");
variantState = applyResult(variantState, result, "addTask id=80");
printStats(variantState, "После добавления id=80");


result = setTaskCompleted(variantState, 11, true);
variantState = applyResult(variantState, result, "setTaskCompleted id=11");
printStats(variantState, "После выполнения id=11");


result = renameTask(variantState, 23, "Утвердить структуру разделов");
variantState = applyResult(variantState, result, "renameTask id=23");
printStats(variantState, "После переименования id=23");


result = removeTask(variantState, 37);
variantState = applyResult(variantState, result, "removeTask id=37");
printStats(variantState, "После удаления id=37");


console.log("\n--- Проверка отказа: повтор id=80 ---");
result = addTask(variantState, 80, "Дубликат", "low");
if (!result.ok) {
  console.error(`Ожидаемый отказ: ${result.error}`);
} else {
  console.error("ОШИБКА: дубликат не был отклонён!");
}

console.log("\nИтоговые id:", variantState.map((t) => t.id));

console.log("\n--- Проверка сохранности variantTasks ---");
console.log("variantTasks.length:", variantTasks.length, "(ожидается 6)");
console.log(
  "variantTasks ids:",
  variantTasks.map((t) => t.id),
  "(ожидается [11, 23, 37, 41, 58, 64])"
);