const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL)?.replace(
  /\/+$/,
  ""
);
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL must be set");
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API GET ${path} failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}
