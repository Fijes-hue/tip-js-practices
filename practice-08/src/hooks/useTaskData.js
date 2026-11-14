import { useEffect, useRef, useState } from "react";

const emptySnapshot = { tasks: [], categories: [], meta: { total: 0 } };

// Хук синхронизирует React с HTTP API: загрузка по фильтрам, отмена устаревших
// запросов, операции изменения с блокировкой повторного вызова и повторным GET.
export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);

  const [revision, setRevision] = useState(0);

  // Служебные ссылки не вызывают перерисовку и доступны между рендерами.
  const mountedRef = useRef(true);
  const activeControllerRef = useRef(null); // текущий GET
  const mutationControllerRef = useRef(null); // текущая мутация (одна одновременно)

  // Значения фильтров, разложенные по примитивам — зависимости эффекта стабильны.
  const q = filters.q;
  const completed = filters.completed;
  const priority = filters.priority;
  const categoryId = filters.categoryId;

  // Эффект монтирования: отметка активности + отмена обеих операций при unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeControllerRef.current?.abort();
      mutationControllerRef.current?.abort();
      activeControllerRef.current = null;
      mutationControllerRef.current = null;
    };
  }, []);

  // Эффект загрузки: реагирует на смену фильтров и revision (refresh / после мутации).
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setStatus("loading");
    setError(null);

    // Временный лог для скриншота 2:
    console.log("isLoading:", true, "tasks.length:", snapshot.tasks.length);

    async function load() {
      try {
        const result = await api.loadInitialData(
          { q, completed, priority, categoryId },
          { signal: controller.signal },
        );
        if (!active || controller.signal.aborted) return;
        if (!mountedRef.current) return;
        setSnapshot({
          tasks: result.tasks,
          categories: result.categories,
          meta: result.meta,
        });
        setStatus("ready");
        setError(null);

        // Временный лог для скриншота 2:
        console.log("isLoading:", false, "tasks.length:", result.tasks.length);
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        if (caught?.kind === "aborted") return;
        setError(caught);
        setStatus("error");
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [api, q, completed, priority, categoryId, revision]);

  function refresh() {
    setRevision((previous) => previous + 1);
  }

  // Общая обёртка мутации: немедленная блокировка через ref до первого await,
  // отдельный контроллер, повторный GET при успехе, раздельные ошибки.
  async function mutate(operation) {
    if (!mountedRef.current) return false;
    if (mutationControllerRef.current) return false;

    const controller = new AbortController();
    mutationControllerRef.current = controller;

    setPending(true);
    setMutationError(null);

    try {
      await operation({ signal: controller.signal });
      if (controller.signal.aborted) return false;
      if (!mountedRef.current) return false;
      refresh();
      return true;
    } catch (caught) {
      if (controller.signal.aborted) return false;
      if (!mountedRef.current) return false;
      if (caught?.kind === "aborted") return false;
      setMutationError(caught);
      return false;
    } finally {
      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
      }
      if (mountedRef.current) setPending(false);
    }
  }

  async function saveTask(id, value) {
    return mutate(({ signal }) =>
      id === null
        ? api.createTask(value, { signal })
        : api.updateTask(id, value, { signal }),
    );
  }

  async function toggleTask(task) {
    return mutate(({ signal }) =>
      api.setTaskCompleted(task.id, !task.completed, { signal }),
    );
  }

  async function deleteTask(id) {
    return mutate(({ signal }) => api.deleteTask(id, { signal }));
  }

  async function resetData() {
    return mutate(({ signal }) => api.resetDemoData({ signal }));
  }

  return {
    snapshot,
    status,
    error,
    mutationError,
    pending,
    refresh,
    saveTask,
    toggleTask,
    deleteTask,
    resetData,
  };
}
