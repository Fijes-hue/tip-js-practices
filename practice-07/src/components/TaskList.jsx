import TaskItem from "./TaskItem.jsx";

export default function TaskList({
  tasks,
  categories,
  onToggle,
  onEdit,
  onDelete,
}) {
  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <section aria-label="Список задач">
      <h2>Задачи</h2>
      <p>
        Найдено: <strong>{tasks.length}</strong>
      </p>

      {tasks.length === 0 ? (
        <p role="status">Нет задач по выбранному фильтру.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={categoryMap.get(task.categoryId)}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
