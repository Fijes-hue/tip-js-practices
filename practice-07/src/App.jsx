// src/App.jsx
import { useState } from "react";
import { tasks as initialTasks, categories } from "./data.js";
import { createInitialFilters } from "./variant.js";
import {
  selectTasks,
  getTaskStats,
  addTask,
  updateTask,
  toggleTask,
  removeTask,
} from "./domain/task-service.js";
import TaskForm from "./components/TaskForm.jsx";
import TaskFilters from "./components/TaskFilters.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskStats from "./components/TaskStats.jsx";

export default function App() {
  const [tasks, setTasks] = useState(() =>
    initialTasks.map((task) => ({ ...task })),
  );
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);

  // Вычисляемые значения (не хранятся в состоянии)
  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask =
    editingId !== null ? (tasks.find((t) => t.id === editingId) ?? null) : null;

  // Обработчики
  function handleToggle(id) {
    setTasks((previous) => toggleTask(previous, id));
  }

  function handleDelete(id) {
    if (!window.confirm("Удалить задачу?")) return;
    setTasks((previous) => removeTask(previous, id));
    if (editingId === id) {
      setEditingId(null);
    }
  }

  function handleEdit(id) {
    setEditingId(id);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  function handleSave(value) {
    if (editingId !== null) {
      // Редактирование
      const taskExists = tasks.some((t) => t.id === editingId);
      if (!taskExists) return false;
      setTasks((previous) => updateTask(previous, editingId, value));
      setEditingId(null);
      return true;
    } else {
      // Создание
      const nextId =
        tasks.length === 0 ? 1 : Math.max(...tasks.map((t) => t.id)) + 1;
      try {
        setTasks((previous) => addTask(previous, value, nextId));
        return true;
      } catch {
        return false;
      }
    }
  }

  function handleResetFilters() {
    setFilters({ q: "", completed: "", priority: "", categoryId: "" });
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>
        ПР7: данные в памяти. Обновление страницы восстанавливает исходный
        набор.
      </p>

      <TaskStats stats={stats} />

      <TaskFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      <TaskForm
        key={editingId ?? "new"}
        categories={categories}
        initialTask={editingTask}
        onSave={handleSave}
        onCancel={handleCancelEdit}
      />

      <TaskList
        tasks={visibleTasks}
        categories={categories}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
