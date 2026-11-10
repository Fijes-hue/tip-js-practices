import { Router } from "express";
import { ApiError } from "./errors.js";
import { parsePositiveId, parseFilters } from "./validation.js";

const ALLOW_HEADER = "GET, HEAD, OPTIONS";

function methodNotAllowed(path) {
  return (req, res, next) => {
    res.set("Allow", ALLOW_HEADER);
    next(
      new ApiError(
        405,
        "METHOD_NOT_ALLOWED",
        `Метод ${req.method} не поддерживается для ${path}.`,
      ),
    );
  };
}

export function createRouter(store) {
  const router = Router({ caseSensitive: true });

  router.get("/health", (req, res) => {
    res.json({ data: { status: "ok" } });
  });

  router.get("/categories", (req, res) => {
    const data = store.listCategories();
    res.json({ data, meta: { total: data.length } });
  });

  router.get("/tasks", (req, res) => {
    const url = new URL(req.originalUrl, "http://localhost");
    const filters = parseFilters(url.searchParams);
    const data = store.listTasks(filters);
    res.json({ data, meta: { total: data.length, filters } });
  });

  router.get("/tasks/:id", (req, res, next) => {
    // Бросания внутри синхронного обработчика Express 5 передаёт в errorHandler.
    const id = parsePositiveId(req.params.id);
    if (id === null) {
      throw new ApiError(
        400,
        "INVALID_ID",
        "Некорректный идентификатор задачи.",
      );
    }
    const task = store.getTask(id);
    if (task === null) {
      throw new ApiError(404, "TASK_NOT_FOUND", "Задача не найдена.", { id });
    }
    res.json({ data: task });
  });

  // 405 для четырёх известных путей — строго ПОСЛЕ GET-маршрутов.
  router.all("/health", methodNotAllowed("/health"));
  router.all("/categories", methodNotAllowed("/categories"));
  router.all("/tasks", methodNotAllowed("/tasks"));
  router.all("/tasks/:id", methodNotAllowed("/tasks/:id"));

  return router;
}
