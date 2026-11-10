import { ApiError } from "./errors.js";

const ALLOWED_PARAMS = new Set(["completed", "priority", "categoryId", "q"]);
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Принимает строку, возвращает положительный safe integer или null.
// Регулярка /^[1-9]\d*$/ отсекает '01', '1.5', '1e2', '4abc', '-1', '0'.
export function parsePositiveId(raw) {
  if (typeof raw !== "string") return null;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

// URLSearchParams -> { completed: boolean|null, priority: string|null,
// categoryId: number|null, q: string }. Бросает ApiError(400, INVALID_QUERY).
export function parseFilters(searchParams) {
  // 1. Имена параметров: только разрешённые, без повторов.
  const seen = new Set();
  for (const name of searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(name)) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        `Неизвестный параметр: ${name}.`,
      );
    }
    if (seen.has(name)) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        `Повторяющийся параметр: ${name}.`,
      );
    }
    seen.add(name);
  }

  const filters = { completed: null, priority: null, categoryId: null, q: "" };

  // 2. completed: строго 'true' или 'false', никакого Boolean().
  if (searchParams.has("completed")) {
    const raw = searchParams.get("completed");
    if (raw !== "true" && raw !== "false") {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "completed должен быть true или false.",
      );
    }
    filters.completed = raw === "true";
  }

  // 3. priority: строго из трёх значений с учётом регистра.
  if (searchParams.has("priority")) {
    const raw = searchParams.get("priority");
    if (!ALLOWED_PRIORITIES.has(raw)) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "priority должен быть low, medium или high.",
      );
    }
    filters.priority = raw;
  }

  // 4. categoryId: положительный safe integer без ведущих нулей.
  if (searchParams.has("categoryId")) {
    const raw = searchParams.get("categoryId");
    const value = parsePositiveId(raw);
    if (value === null) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "categoryId должен быть положительным целым.",
      );
    }
    filters.categoryId = value;
  }

  // 5. q: trim, длина <= 100. Пустая строка допустима.
  if (searchParams.has("q")) {
    const raw = searchParams.get("q");
    const trimmed = raw.trim();
    if (trimmed.length > 100) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "q не должен превышать 100 символов.",
      );
    }
    filters.q = trimmed;
  }

  return filters;
}
