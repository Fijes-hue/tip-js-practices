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

function printTasks(label, tasks) {
  console.log(`\n${label}`);
  console.table(
    tasks.map(({ id, title, completed, priority }) => ({
      id,
      title,
      completed,
      priority,
    }))
  );
}

function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(
    `${label}: всего ${total}; выполнено ${completed}; осталось ${pending}; ` +
      (total === 0 ? "Задач пока нет" : `прогресс ${progress.toFixed(1)}%`)
  );
}

function applyResult(state, result) {
  if (result.ok) {
    return result.tasks;
  }
  console.error(`Ошибка: ${result.error}`);
  return state;
}

console.log("=".repeat(70));
console.log("ПР2. Общий демонстрационный сценарий");
console.log("=".repeat(70));

let currentTasks = demoTasks;

printTasks("Исходный набор:", currentTasks);
console.log("Названия:", getTaskTitles(currentTasks));
console.log(
  "Невыполненные id:",
  getPendingTasks(currentTasks).map((task) => task.id)
);
printStats("Исходная сводка", currentTasks);

currentTasks = applyResult(currentTasks, addTask(currentTasks, 20, "Добавить проверку", "high"));
printStats("После добавления id = 20", currentTasks);

currentTasks = applyResult(currentTasks, setTaskCompleted(currentTasks, 4, true));
printStats("После выполнения id = 4", currentTasks);

currentTasks = applyResult(
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска")
);
printStats("После переименования id = 10", currentTasks);

currentTasks = applyResult(currentTasks, removeTask(currentTasks, 7));
printStats("После удаления id = 7", currentTasks);

console.log("Итоговые id:", currentTasks.map((task) => task.id));
console.log("Невыполненные id:", getPendingTasks(currentTasks).map((task) => task.id));

console.log("Попытка повторного добавления id = 20:");
const failed = addTask(currentTasks, 20, "Дубликат", "low");
console.log(failed);
currentTasks = applyResult(currentTasks, failed);
console.log("Состояние после отказа:", currentTasks.map((task) => task.id));

console.log("\nИсходный demoTasks не изменился:");
console.log(demoTasks.map((task) => task.id));


console.log("\n" + "=".repeat(70));
console.log(`ПР2. Индивидуальный сценарий. Вариант ${variantNumber}`);
console.log("=".repeat(70));

let variantCurrent = variantTasks;

printTasks("Исходный набор варианта:", variantCurrent);
printStats("Исходная сводка варианта", variantCurrent);

variantCurrent = applyResult(
  variantCurrent,
  addTask(variantCurrent, 80, "Опубликовать документацию", "low")
);
printStats("После добавления id = 80", variantCurrent);

variantCurrent = applyResult(variantCurrent, setTaskCompleted(variantCurrent, 11, true));
printStats("После completed = true для id = 11", variantCurrent);

variantCurrent = applyResult(
  variantCurrent,
  renameTask(variantCurrent, 23, "Составить финальную структуру разделов")
);
printStats("После переименования id = 23", variantCurrent);

variantCurrent = applyResult(variantCurrent, removeTask(variantCurrent, 37));
printStats("После удаления id = 37", variantCurrent);

console.log("Итоговые id варианта:", variantCurrent.map((task) => task.id));

console.log("\n--- Обработка отказа в варианте ---");
console.log("Попытка повторного добавления id = 80:");
const variantFailed = addTask(variantCurrent, 80, "Ещё одна задача", "low");
console.log(variantFailed);
variantCurrent = applyResult(variantCurrent, variantFailed);
console.log("Состояние после отказа:", variantCurrent.map((task) => task.id));

console.log("\nИсходный variantTasks не изменился:");
console.log(variantTasks.map((task) => task.id));

console.log("\n--- Дополнительные чтения ---");
console.log("findTaskById(demoTasks, 4) ->", findTaskById(demoTasks, 4));
console.log('findTaskById(demoTasks, "4") ->', findTaskById(demoTasks, "4"));
console.log("findTaskById(demoTasks, 777) ->", findTaskById(demoTasks, 777));

console.log("\n--- createTask ---");
console.log(createTask(20, "Новая задача", "high"));
console.log(createTask(0, "Новая задача"));
console.log(createTask(20, "   "));
console.log(createTask(20, "Новая задача", "urgent"));