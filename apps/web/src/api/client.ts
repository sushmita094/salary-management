import type { ApiError } from "@acme/shared";

/** API base path; the Vite dev proxy forwards `/api/*` to the Express server. */
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

/**
 * A failed request, parsed from the backend's `{ error: { code, message, details? } }`
 * envelope so components get structured errors (incl. field `details` for forms).
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiError) {
    super(body.error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}

/**
 * Central 401 handler. The auth layer registers a callback (clear session +
 * redirect to /login) so an expired session never strands the user. Auth probes
 * (login, /auth/me) opt out so a normal "not signed in" 401 doesn't loop.
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: string;
  /** JSON body — serialised and sent with `application/json`. */
  body?: unknown;
  /** Multipart body — sent as-is (the browser sets the boundary header). */
  formData?: FormData;
  /** `"blob"` for file downloads; defaults to JSON. */
  responseType?: "json" | "blob";
  /** Skip the global 401 handler (used by auth probes). */
  skipUnauthorizedHandler?: boolean;
  signal?: AbortSignal;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const json = (await response.json()) as ApiError;
    if (json?.error?.message) return json;
  } catch {
    // fall through to a synthetic envelope
  }
  return { error: { code: "UNKNOWN", message: `Request failed (${response.status})` } };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    // The session is an httpOnly cookie — always send credentials.
    credentials: "include",
    signal: options.signal,
  };

  if (options.formData) {
    init.body = options.formData;
  } else if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, init);

  if (response.status === 401 && !options.skipUnauthorizedHandler) {
    unauthorizedHandler?.();
  }
  if (!response.ok) {
    throw new ApiRequestError(response.status, await parseError(response));
  }

  if (response.status === 204) return undefined as T;
  if (options.responseType === "blob") return (await response.blob()) as T;
  return (await response.json()) as T;
}

/** The typed API client: verbs, JSON bodies, multipart upload, and blob download. */
export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", formData }),
  download: (path: string, options?: RequestOptions) =>
    request<Blob>(path, { ...options, method: "GET", responseType: "blob" }),
};
