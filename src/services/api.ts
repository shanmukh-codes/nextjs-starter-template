/**
 * Base API client for all external backend requests.
 *
 * Usage (in Server Actions or RSC only — never import in client components):
 *   import { apiClient } from "@/services/api";
 *   const data = await apiClient.get<Product[]>("/products");
 *
 * The base URL and auth token are server-only env vars and never sent to the browser.
 */

const API_BASE_URL = process.env.API_BASE_URL;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

if (!API_BASE_URL) {
  // Warn at startup — don't throw so the app still boots for frontend-only work
  console.warn("[api] API_BASE_URL is not set. External API calls will fail.");
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(API_SECRET_KEY ? { Authorization: `Bearer ${API_SECRET_KEY}` } : {}),
    ...(extraHeaders as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`API error ${response.status}: ${message}`);
  }

  // Return null for 204 No Content
  if (response.status === 204) return null as T;

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
