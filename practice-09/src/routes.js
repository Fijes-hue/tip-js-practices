import { Router } from "express";
import { ApiError } from "./errors.js";
import { parsePositiveId, parseFilters } from "./validation.js";
import express from "express";

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
  router.post("/tasks", express.json(), (req, res, next) => {
    const body = req.body ?? {};

    // Проверка title
    const rawTitle = body.title;
    if (typeof rawTitle !== "string") {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "title должен быть строкой.", {
          title: "Название обязательно.",
        }),
      );
    }
    const title = rawTitle.trim();
    if (title.length === 0) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "title не должен быть пустым.", {
          title: "Название не должно быть пустым.",
        }),
      );
    }
    if (title.length > 100) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "title слишком длинный.", {
          title: "Не более 100 символов.",
        }),
      );
    }

    // Проверка priority
    const allowed = ["low", "medium", "high"];
    if (!allowed.includes(body.priority)) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "priority неверный.", {
          priority: "Ожидается low, medium или high.",
        }),
      );
    }

    // Проверка categoryId
    if (!Number.isSafeInteger(body.categoryId) || body.categoryId <= 0) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "categoryId неверный.", {
          categoryId: "Положительное целое число.",
        }),
      );
    }

    // Успех
    const task = {
      id: 999,
      title,
      completed: false,
      priority: body.priority,
      categoryId: body.categoryId,
    };
    res.status(201).json({ data: task });
  });
  router.all("/categories", methodNotAllowed("/categories"));
  router.all("/tasks", methodNotAllowed("/tasks"));
  router.all("/tasks/:id", methodNotAllowed("/tasks/:id"));

  return router;
}
