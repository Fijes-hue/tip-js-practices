export class ApiError extends Error {
  constructor(
    message,
    {
      kind,
      status = null,
      code = null,
      details = null,
      url = null,
      cause,
    } = {},
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

// Соединяет абсолютный baseUrl, путь и непустые query-параметры.
export function buildUrl(baseUrl, path, query = {}) {
  const base = String(baseUrl);
  if (!/^https?:\/\//i.test(base)) {
    throw new TypeError("baseUrl должен быть абсолютным http(s)-адресом");
  }
  if (/[?#]/.test(base)) {
    throw new TypeError("baseUrl не должен содержать query или hash");
  }
  if (typeof path !== "string" || path.length === 0) {
    throw new TypeError("path должен быть непустой строкой");
  }

  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);

  if (query !== null && typeof query === "object" && !Array.isArray(query)) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function isAbsoluteHttpUrl(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  if (!/^https?:\/\//i.test(value)) return false;
  if (/[?#]/.test(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function buildCombinedSignal(timeoutMs, externalSignal) {
  const signals = [AbortSignal.timeout(timeoutMs)];
  if (externalSignal) signals.push(externalSignal);
  return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
}

function isAbortLikeError(error) {
  if (!error) return false;
  const name = error.name;
  return name === "AbortError" || name === "TimeoutError";
}

// requestJson(path, { method, query, body, signal, timeoutMs } = {})
// поддерживает GET, POST, PATCH и DELETE; ответ 204 преобразуется в null.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  if (!isAbsoluteHttpUrl(baseUrl)) {
    throw new TypeError(
      "baseUrl должен быть абсолютным http(s)-адресом без query и hash",
    );
  }
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом");
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  async function requestJson(
    path,
    { method = "GET", query, body, signal, timeoutMs: override } = {},
  ) {
    const normalizedMethod = String(method).toUpperCase();
    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      throw new TypeError(`Неподдерживаемый HTTP-метод: ${method}`);
    }
    if (normalizedMethod === "GET" && body !== undefined) {
      throw new TypeError("GET-запрос не должен содержать тело");
    }
    if (
      override !== undefined &&
      (!Number.isSafeInteger(override) || override <= 0)
    ) {
      throw new TypeError("timeoutMs должен быть положительным целым числом");
    }

    const effectiveTimeout = override ?? timeoutMs;
    const url = buildUrl(normalizedBase, path, query);
    const combinedSignal = buildCombinedSignal(effectiveTimeout, signal);

    const headers = { Accept: "application/json" };
    let serializedBody;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      serializedBody = JSON.stringify(body);
    }

    const options = {
      method: normalizedMethod,
      headers,
      signal: combinedSignal,
    };
    if (serializedBody !== undefined) options.body = serializedBody;

    let response;
    try {
      response = await fetchFn(url, options);
    } catch (error) {
      const name = error?.name ?? "";
      if (name === "AbortError" || name === "TimeoutError") {
        const externallyAborted = Boolean(signal?.aborted);
        throw new ApiError(
          externallyAborted
            ? "Запрос отменён вызывающим кодом."
            : "Превышено время ожидания ответа.",
          {
            kind: externallyAborted ? "aborted" : "timeout",
            url,
            cause: error,
          },
        );
      }
      throw new ApiError("Не удалось получить ответ от сервера.", {
        kind: "network",
        url,
        cause: error,
      });
    }

    if (!(response instanceof Response)) {
      throw new ApiError(
        "Сервер вернул неожидаемое значение вместо Response.",
        {
          kind: "invalid-response",
          url,
        },
      );
    }

    // HTTP-ошибка — до проверки Content-Type успешного ответа.
    if (!response.ok) {
      let code = null;
      let details = null;
      let message = `Запрос завершился со статусом HTTP ${response.status}.`;
      try {
        const payload = await response.json();
        if (
          payload &&
          typeof payload === "object" &&
          payload.error &&
          typeof payload.error === "object"
        ) {
          if (
            typeof payload.error.message === "string" &&
            payload.error.message.trim().length > 0
          ) {
            message = payload.error.message;
          }
          if (typeof payload.error.code === "string") code = payload.error.code;
          if (payload.error.details !== undefined)
            details = payload.error.details;
        }
      } catch {
        // Не-JSON тело у HTTP-ошибки допустимо.
      }
      throw new ApiError(message, {
        kind: "http",
        status: response.status,
        code,
        details,
        url,
      });
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiError("Ожидался ответ в формате JSON.", {
        kind: "invalid-response",
        status: response.status,
        url,
      });
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("Не удалось разобрать JSON успешного ответа.", {
        kind: "invalid-response",
        status: response.status,
        url,
        cause: error,
      });
    }
  }

  return { requestJson };
}
