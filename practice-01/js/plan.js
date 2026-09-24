"use strict";

const totalTasks = 14
const completedTasks = 4
const dailyLimit = 4

if ( typeof totalTasks !== "number" || typeof completedTasks !== "number" || typeof dailyLimit !== "number" ||
  !Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) || !Number.isInteger(dailyLimit))
{
  console.log("Ошибка: значения должны быть целыми числами")
} else if (totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > totalTasks ||
  dailyLimit < 1 || dailyLimit > 1000 ) {
  console.log("Ошибка: некорректные данные")
} else {
  let remaining = totalTasks - completedTasks
  let day = 0

  if (remaining === 0) {
    console.log("Все задачи уже выполнены")
  } else {
    console.log(`Осталось задач: ${remaining}`)

    while (remaining > 0) {
      day += 1
      const doneToday = Math.min(dailyLimit, remaining)
      remaining -= doneToday
      console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`)
    }
  }

  console.log(`Потребуется дней: ${day}`)
}