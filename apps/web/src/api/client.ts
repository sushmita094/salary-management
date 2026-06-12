/** Base path for API calls; Vite proxies /api to the Express server in dev. */
const API_BASE = "/api";

/** Minimal typed GET helper. The full data layer grows with the directory feature. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
