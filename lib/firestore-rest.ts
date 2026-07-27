import "server-only";

/**
 * Minimal Firestore REST client used for server-side reads (build time / SSR / ISR
 * revalidation). The `firebase/firestore` SDK's default Node transport hangs
 * indefinitely on this project's larger collections (some documents embed base64
 * data-URI images, pushing collection payloads into the multi-megabyte range) -
 * confirmed by isolated testing where the SDK never resolved on the `projects`
 * collection while a plain HTTPS fetch completed in a few seconds per page. Plain
 * `fetch()` against the REST API sidesteps that transport entirely. The browser-side
 * "load more" pagination (lib/portfolio-client.ts) keeps using the SDK, since it runs
 * natively in real browsers where the SDK's transport isn't an issue.
 */

const PROJECT_ID = "designspartans-portfolio";
const API_KEY = "AIzaSyC8ixThMuTncx0LWw4kVFtJ4nOeTmq2iGc";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const REVALIDATE_SECONDS = 60;

/**
 * Next's built-in fetch/data cache refuses to store responses over 2MB (this project's
 * `projects`/`media` collections regularly exceed that - see file header). That means
 * every request would otherwise re-run the full paginated REST fetch (tens of seconds).
 * This plain in-memory cache has no such size limit and sits in front of every call
 * below, so only the first request per key within REVALIDATE_SECONDS pays that cost -
 * subsequent ones (e.g. every `next dev` reload) return instantly from memory.
 */
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

async function withMemoryCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const data = await fn();
  memoryCache.set(key, { data, expiresAt: Date.now() + REVALIDATE_SECONDS * 1000 });
  return data;
}

type FirestoreValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  referenceValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDoc = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

function decodeValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("stringValue" in value) return value.stringValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("timestampValue" in value) return value.timestampValue ? Date.parse(value.timestampValue) : 0;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue?.fields);
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue> | undefined): Record<string, unknown> {
  if (!fields) return {};
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function decodeDoc<T>(doc: FirestoreDoc): T {
  const id = doc.name.split("/").pop() as string;
  return { ...decodeFields(doc.fields), id } as T;
}

async function listCollection(collectionId: string, orderByField?: string): Promise<FirestoreDoc[]> {
  const results: FirestoreDoc[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE_URL}/${collectionId}`);
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("pageSize", "100");
    if (orderByField) url.searchParams.set("orderBy", orderByField);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) {
      throw new Error(`Firestore REST list "${collectionId}" failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { documents?: FirestoreDoc[]; nextPageToken?: string };
    results.push(...(data.documents ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return results;
}

export async function fetchCollection<T>(collectionId: string): Promise<T[]> {
  return withMemoryCache(`collection:${collectionId}`, async () => {
    try {
      const docs = await listCollection(collectionId, "createdAt");
      return docs.map((docItem) => decodeDoc<T>(docItem));
    } catch {
      const docs = await listCollection(collectionId);
      return docs.map((docItem) => decodeDoc<T>(docItem));
    }
  });
}

export async function fetchDocument<T>(collectionId: string, docId: string): Promise<T | null> {
  return withMemoryCache(`doc:${collectionId}/${docId}`, async () => {
    const url = `${BASE_URL}/${collectionId}/${docId}?key=${API_KEY}`;
    const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Firestore REST get "${collectionId}/${docId}" failed: ${response.status}`);
    return decodeDoc<T>(await response.json());
  });
}

interface RunQueryOptions {
  collectionId: string;
  whereEquals?: { field: string; value: string };
  orderByField?: string;
  startAfterMillis?: number;
  limit: number;
}

export async function runQuery<T>(options: RunQueryOptions): Promise<T[]> {
  return withMemoryCache(`query:${JSON.stringify(options)}`, async () => {
    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId: options.collectionId }],
      limit: options.limit,
    };

    if (options.whereEquals) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: options.whereEquals.field },
          op: "EQUAL",
          value: { stringValue: options.whereEquals.value },
        },
      };
    }

    if (options.orderByField) {
      structuredQuery.orderBy = [{ field: { fieldPath: options.orderByField }, direction: "ASCENDING" }];
    }

    if (options.startAfterMillis) {
      structuredQuery.startAt = {
        values: [{ timestampValue: new Date(options.startAfterMillis).toISOString() }],
        before: false,
      };
    }

    const response = await fetch(`${BASE_URL}:runQuery?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredQuery }),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(`Firestore REST runQuery on "${options.collectionId}" failed: ${response.status} ${body}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const rows = (await response.json()) as { document?: FirestoreDoc }[];
    return rows.filter((row) => row.document).map((row) => decodeDoc<T>(row.document as FirestoreDoc));
  });
}
