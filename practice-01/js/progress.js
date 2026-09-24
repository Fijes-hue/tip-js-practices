"use strict";
const totalTasks = 14
const completedTasks = 4

if (typeof totalTasks !== "number" || typeof completedTasks !== "number" || !Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
   console.log("Ошибка: значения должны быть целыми числами")
}
else if (totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > totalTasks){
   console.log("Ошибка: некорректные данные")
} else if (totalTasks === 0 && completedTasks === 0) {
   console.log("Задач пока нет")
} else{
   var procent = (completedTasks/totalTasks)*100
   var ost = totalTasks - completedTasks

   var status
   if (completedTasks === 0){
      status = 'Не начато'
   } else if (completedTasks === totalTasks){
      status = 'Завершено'
   } else {
      status = "В работе"
   }
   console.log(`Всего задач: ${totalTasks}`)
   console.log(`Выполнено: ${completedTasks}`)
   console.log(`Осталось: ${ost}`)
   console.log(`Прогресс: ${procent.toFixed(1)}%`)
   console.log(`Статус: ${status}`)
}