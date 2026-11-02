const PRIORITY_LABELS = { low: "Низкий", medium: "Средний", high: "Высокий" };

export default function TaskItem({
  task,
  categoryName,
  onToggle,
  onEdit,
  onDelete,
}) {
  return (
    <li>
      <h3>{task.title}</h3>
      <p>
        Статус: <strong>{task.completed ? "Выполнена" : "В работе"}</strong>
        {" · "}
        Приоритет: {PRIORITY_LABELS[task.priority] ?? task.priority}
        {" · "}
        Категория: {categoryName ?? "Без категории"}
      </p>
      <div className="actions">
        <button type="button" onClick={() => onToggle(task.id)}>
          {task.completed ? "Вернуть в работу" : "Выполнена"}
        </button>
        <button type="button" onClick={() => onEdit(task.id)}>
          Изменить
        </button>
        <button type="button" onClick={() => onDelete(task.id)}>
          Удалить
        </button>
      </div>
    </li>
  );
}
