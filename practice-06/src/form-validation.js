const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};
  let title;
  let priority;
  let categoryId;

  const rawTitle = draft?.title;
  if (typeof rawTitle !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    const trimmed = rawTitle.trim();
    if (trimmed.length === 0) {
      errors.title = "Название не должно быть пустым.";
    } else if (trimmed.length > 100) {
      errors.title = "Название не должно превышать 100 символов.";
    } else {
      title = trimmed;
    }
  }

  const rawPriority = draft?.priority;
  if (typeof rawPriority !== "string" || !ALLOWED_PRIORITIES.has(rawPriority)) {
    errors.priority = 'Приоритет должен быть "low", "medium" или "high".';
  } else {
    priority = rawPriority;
  }

  const rawCategory = draft?.categoryId;
  const numericCategory =
    typeof rawCategory === "string" && rawCategory.trim() !== ""
      ? Number(rawCategory)
      : rawCategory;

  if (!Number.isSafeInteger(numericCategory) || numericCategory <= 0) {
    errors.categoryId = "Категория должна быть выбрана.";
  } else if (
    !Array.isArray(categories) ||
    !categories.some((category) => category.id === numericCategory)
  ) {
    errors.categoryId = "Такой категории не существует.";
  } else {
    categoryId = numericCategory;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }

  return { valid: true, value: { title, priority, categoryId }, errors: {} };
}
