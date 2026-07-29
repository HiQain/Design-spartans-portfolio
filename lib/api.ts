import "server-only";

/**
 * Thin fetch wrapper against the custom Express/MySQL API that replaced
 * Firestore. Unlike the old Firestore REST client this replaces, there's no
 * need for a custom in-memory cache or a "missing index" fallback path -
 * those existed specifically to work around Firestore documents that
 * embedded multi-megabyte base64 images, which no longer exist now that
 * images are uploaded files served by URL. Next's built-in fetch cache
 * handles revalidation directly.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be set");
}

const REVALIDATE_SECONDS = 60;

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) {
    throw new Error(`API GET ${path} failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}
