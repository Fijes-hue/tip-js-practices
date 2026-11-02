import { useState } from "react";
import { tasks as initialTasks, categories } from "./data.js";
import { createInitialFilters } from "./variant.js";
import TaskForm from "./components/TaskForm.jsx";
import TaskFilters from "./components/TaskFilters.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskStats from "./components/TaskStats.jsx";
import {
  addTask,
  getTaskStats,
  selectTasks,
  toggleTask,
  updateTask,
} from "./domain/task-service.js";

export default function App() {
  const [tasks, setTasks] = useState(() =>
    initialTasks.map((task) => ({ ...task })),
  );
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);

  const visibleTasks = selectTasks(tasks.filters);
  const stats = getTaskStats(task);
  const editingTasks =
    editingId === null
      ? null
      : (task.find((task) => task.id === editingId) ?? null);

  function handleSave(value) {
    if (editingId === null) {
      setTasks((previous) => addTask(previous, value, nextId(previous)));
    } else {
      const exists = task.some((task) => task.id === editingId);
      if (!exists) {
        setEditingId(null);
        return false;
      }
      setTasks((previous) => updateTask(previous, editingId, value));
      setEditingId(null);
    }
    return true;
  }
  function handleToddle(id) {
    setTasks((previous) => toggleTask(previous, id));
  }
  function handleEdit(id) {
    setEditingId(id);
  }

  function handleDelete(id) {
    if (!window.confirm("Удалить задачу?")) return;
    setTasks((previous) => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
  }

  function handleCancel() {
    setEditingId(null);
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>
        ПР7: данные в памяти. Обновление страницы восстанавливает исходный
        набор.
      </p>
      <p role="status">
        Заготовка запущена. В наборе {tasks.length} задач, категорий:{" "}
        {categories.length}.
      </p>
      <TaskStats />
      <TaskFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />
      <TaskForm categories={categories} />
      <TaskList tasks={[]} categories={categories} />
    </main>
  );
}
