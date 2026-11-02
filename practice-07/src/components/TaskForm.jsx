import { useState } from "react";
import { validateTaskDraft } from "../domain/task-service.js";

function emptyDraft(categories) {
  return {
    title: "",
    priority: "medium",
    categoryId: categories.length > 0 ? String(categories[0].id) : "",
  };
}

function draftFromTask(task, categories) {
  if (!task) return emptyDraft(categories);
  return {
    title: task.title,
    priority: task.priority,
    categoryId: String(task.categoryId),
  };
}

export default function TaskForm({
  categories,
  initialTask = null,
  onSave,
  onCancel,
}) {
  const [draft, setDraft] = useState(() =>
    draftFromTask(initialTask, categories),
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const isEditing = initialTask !== null;

  const update = (field) => (event) => {
    setDraft((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
    setMessage("");
  };

  function handleSubmit(event) {
    event.preventDefault();
    const checked = validateTaskDraft(draft, categories);
    if (!checked.valid) {
      setErrors(checked.errors);
      setMessage("Проверьте выделенные поля.");
      return;
    }
    const saved = onSave(checked.value);
    if (saved === true) {
      setDraft(emptyDraft(categories));
      setErrors({});
      setMessage(isEditing ? "Изменения сохранены." : "Задача добавлена.");
    } else {
      setErrors({});
      setMessage("Не удалось сохранить изменения.");
    }
  }

  function handleCancel() {
    setDraft(emptyDraft(categories));
    setErrors({});
    setMessage("");
    onCancel();
  }

  return (
    <section aria-label="Форма задачи">
      <h2>
        {isEditing
          ? `Редактирование задачи #${initialTask.id}`
          : "Новая задача"}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="form-title">Название</label>
          <input
            id="form-title"
            type="text"
            value={draft.title}
            onChange={update("title")}
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "form-title-error" : undefined}
          />
          {errors.title && (
            <p id="form-title-error" className="error" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="form-priority">Приоритет</label>
          <select
            id="form-priority"
            value={draft.priority}
            onChange={update("priority")}
            aria-invalid={errors.priority ? "true" : "false"}
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          {errors.priority && (
            <p className="error" role="alert">
              {errors.priority}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="form-category">Категория</label>
          <select
            id="form-category"
            value={draft.categoryId}
            onChange={update("categoryId")}
            aria-invalid={errors.categoryId ? "true" : "false"}
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="error" role="alert">
              {errors.categoryId}
            </p>
          )}
        </div>

        <div className="actions">
          <button type="submit">
            {isEditing ? "Сохранить" : "Добавить задачу"}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancel}>
              Отменить
            </button>
          )}
        </div>

        <p role="status">{message}</p>
      </form>
    </section>
  );
}
