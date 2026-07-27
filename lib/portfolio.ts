// OLD CODE

import "server-only";

import { fetchCollection, fetchDocument, runQuery } from "./firestore-rest";
import { getCategoryLayout, sortByCreatedAt, sortCategories } from "./portfolio-utils";
import type { Category, CategoryLayout, MediaItem, MediaPage, Project, TopContent } from "./types";

const CATEGORY_PAGE_SIZE = 10;

export async function getCategories(): Promise<Category[]> {
  return fetchCollection<Category>("categories");
}

export async function getTopContent(): Promise<TopContent | null> {
  return fetchDocument<TopContent>("topContent", "primary");
}

/**
 * Queries a collection filtered to one category, instead of fetching the whole
 * collection and filtering in memory. The `projects`/`media` collections run into the
 * tens of megabytes across all categories combined (some documents embed base64 images),
 * so fetching everything just to show one category's items was the main cause of slow
 * first loads and the "items over 2MB can not be cached" warnings.
 */
// Until the composite index (mainCategoryId + createdAt) exists for `projects`/`media`,
// queries combining that filter with ordering fail and fall back to an unordered read.
// That fallback is capped well below the ordered path's limit so one oversized category
// can't balloon a response into the tens of megabytes - create the index (Firestore
// surfaces a direct console link in the "requires an index" error) to lift this cap.
const NO_INDEX_FALLBACK_LIMIT = 60;

async function fetchItemsForCategory<T extends { createdAt?: number }>(
  collectionId: string,
  categoryId: string
): Promise<T[]> {
  try {
    return await runQuery<T>({
      collectionId,
      whereEquals: { field: "mainCategoryId", value: categoryId },
      orderByField: "createdAt",
      limit: 1000,
    });
  } catch (error) {
    if ((error as { status?: number }).status !== 400) throw error;

    return sortByCreatedAt(
      await runQuery<T>({
        collectionId,
        whereEquals: { field: "mainCategoryId", value: categoryId },
        limit: NO_INDEX_FALLBACK_LIMIT,
      })
    );
  }
}

async function fetchMediaPage(categoryId: string, cursorMillis: number | null): Promise<MediaPage> {
  try {
    const items = await runQuery<MediaItem>({
      collectionId: "media",
      whereEquals: { field: "mainCategoryId", value: categoryId },
      orderByField: "createdAt",
      startAfterMillis: cursorMillis ?? undefined,
      limit: CATEGORY_PAGE_SIZE,
    });

    return {
      items,
      cursor: items.length ? (items[items.length - 1].createdAt ?? null) : null,
      hasMore: items.length === CATEGORY_PAGE_SIZE,
    };
  } catch (error) {
    if ((error as { status?: number }).status !== 400) throw error;

    const items = sortByCreatedAt(
      await runQuery<MediaItem>({
        collectionId: "media",
        whereEquals: { field: "mainCategoryId", value: categoryId },
        limit: NO_INDEX_FALLBACK_LIMIT,
      })
    );

    return { items, cursor: null, hasMore: false };
  }
}

export async function getInitialMediaPage(categoryId: string): Promise<MediaPage> {
  return fetchMediaPage(categoryId, null);
}

export interface CategoryPaneData {
  subCategories: Category[];
  itemSource: "projects" | "media";
  layout: CategoryLayout;
  items: Project[];
  mediaCursor: number | null;
  mediaHasMore: boolean;
}

/**
 * Full content for a single category pane. Only ever fetches that one category's items
 * (never the whole `projects`/`media` collection) - see app/api/category/[categoryId]/route.ts,
 * which the client calls this from lazily for every category beyond the one rendered on
 * first load.
 */
export async function getCategoryPaneData(category: Category, allCategories: Category[]): Promise<CategoryPaneData> {
  const subCategories = sortCategories(allCategories.filter((item) => item.parentId === category.id));
  const mediaPage = await getInitialMediaPage(category.id);

  if (mediaPage.items.length) {
    return {
      subCategories,
      itemSource: "media",
      layout: getCategoryLayout(category, "media"),
      items: mediaPage.items,
      mediaCursor: mediaPage.cursor,
      mediaHasMore: mediaPage.hasMore,
    };
  }

  const categoryProjects = await fetchItemsForCategory<Project>("projects", category.id);

  return {
    subCategories,
    itemSource: "projects",
    layout: getCategoryLayout(category, "projects"),
    items: categoryProjects,
    mediaCursor: null,
    mediaHasMore: false,
  };
}


// NEW CODE

// import "server-only";

// import { fetchCollection, fetchDocument, runQuery } from "./firestore-rest";
// import { getCategoryLayout, sanitizeUrl, sortByCreatedAt, sortCategories } from "./portfolio-utils";
// import type { Category, CategoryLayout, MediaItem, MediaPage, Project, TopContent } from "./types";

// const CATEGORY_PAGE_SIZE = 10;

// export async function getCategories(): Promise<Category[]> {
//   return fetchCollection<Category>("categories");
// }

// export async function getTopContent(): Promise<TopContent | null> {
//   return fetchDocument<TopContent>("topContent", "primary");
// }

// /**
//  * Queries a collection filtered to one category, instead of fetching the whole
//  * collection and filtering in memory. The `projects`/`media` collections run into the
//  * tens of megabytes across all categories combined (some documents embed base64 images),
//  * so fetching everything just to show one category's items was the main cause of slow
//  * first loads and the "items over 2MB can not be cached" warnings.
//  */
// // Until the composite index (mainCategoryId + createdAt) exists for `projects`/`media`,
// // queries combining that filter with ordering fail and fall back to an unordered read.
// // That fallback is capped well below the ordered path's limit so one oversized category
// // can't balloon a response into the tens of megabytes - create the index (Firestore
// // surfaces a direct console link in the "requires an index" error) to lift this cap.
// const NO_INDEX_FALLBACK_LIMIT = 60;

// async function fetchItemsForCategory<T extends { createdAt?: number }>(
//   collectionId: string,
//   categoryId: string
// ): Promise<T[]> {
//   try {
//     return await runQuery<T>({
//       collectionId,
//       whereEquals: { field: "mainCategoryId", value: categoryId },
//       orderByField: "createdAt",
//       limit: 1000,
//     });
//   } catch (error) {
//     if ((error as { status?: number }).status !== 400) throw error;

//     return sortByCreatedAt(
//       await runQuery<T>({
//         collectionId,
//         whereEquals: { field: "mainCategoryId", value: categoryId },
//         limit: NO_INDEX_FALLBACK_LIMIT,
//       })
//     );
//   }
// }

// async function fetchMediaPage(categoryId: string, cursorMillis: number | null): Promise<MediaPage> {
//   try {
//     const items = await runQuery<MediaItem>({
//       collectionId: "media",
//       whereEquals: { field: "mainCategoryId", value: categoryId },
//       orderByField: "createdAt",
//       startAfterMillis: cursorMillis ?? undefined,
//       limit: CATEGORY_PAGE_SIZE,
//     });

//     return {
//       items,
//       cursor: items.length ? (items[items.length - 1].createdAt ?? null) : null,
//       hasMore: items.length === CATEGORY_PAGE_SIZE,
//     };
//   } catch (error) {
//     if ((error as { status?: number }).status !== 400) throw error;

//     const items = sortByCreatedAt(
//       await runQuery<MediaItem>({
//         collectionId: "media",
//         whereEquals: { field: "mainCategoryId", value: categoryId },
//         limit: NO_INDEX_FALLBACK_LIMIT,
//       })
//     );

//     return { items, cursor: null, hasMore: false };
//   }
// }

// export async function getInitialMediaPage(categoryId: string): Promise<MediaPage> {
//   return fetchMediaPage(categoryId, null);
// }

// // A dead client website shouldn't stay listed as a live case study - but the cost of
// // wrongly hiding a real, working project (bad for the client's business) is far higher
// // than the cost of occasionally still showing a genuinely dead one. So this only ever
// // hides a link on a *definitive* dead signal - the domain doesn't resolve, or the server
// // actively refused the connection. Timeouts, 403s (often bot-blocking), 500s, and any
// // other ambiguous response are treated as "keep it visible". Confirmed-dead results are
// // cached for an hour; everything else is re-checked next time rather than cached, so a
// // transient failure self-corrects instead of sticking.
// const LIVE_CHECK_TTL_MS = 60 * 60 * 1000;
// const LIVE_CHECK_TIMEOUT_MS = 8000;
// const deadUrlCache = new Map<string, number>();

// async function checkOnce(url: string): Promise<"alive" | "dead" | "uncertain"> {
//   try {
//     const response = await fetch(url, {
//       method: "GET",
//       redirect: "follow",
//       signal: AbortSignal.timeout(LIVE_CHECK_TIMEOUT_MS),
//     });

//     // 404/410 is the one HTTP status that unambiguously means "this page is gone".
//     if (response.status === 404 || response.status === 410) return "dead";
//     return "alive";
//   } catch (error) {
//     const code = (error as { cause?: { code?: string } })?.cause?.code;
//     // DNS not resolving or a refused connection usually means the domain/server is gone -
//     // but DNS lookups from this process have shown to be occasionally flaky on their own
//     // (confirmed against domains that resolve fine elsewhere), so this alone isn't treated
//     // as proof; callers require it to reproduce across multiple attempts. Anything else
//     // (timeout, TLS hiccup, etc.) is "can't tell" and never counts toward "dead".
//     return code === "ENOTFOUND" || code === "ECONNREFUSED" ? "dead" : "uncertain";
//   }
// }

// async function isDefinitelyDead(url: string): Promise<boolean> {
//   const cachedExpiry = deadUrlCache.get(url);
//   if (cachedExpiry && cachedExpiry > Date.now()) return true;

//   // Require the same dead signal on 3 separate attempts (with backoff) before believing
//   // it - a single ENOTFOUND/timeout is too easy to get from a transient resolver hiccup.
//   for (let attempt = 0; attempt < 3; attempt++) {
//     if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));

//     const result = await checkOnce(url);
//     if (result === "alive") return false;
//     if (result === "uncertain") return false;
//   }

//   deadUrlCache.set(url, Date.now() + LIVE_CHECK_TTL_MS);
//   return true;
// }

// // Running dozens of these checks fully in parallel (one category can have 70+ projects)
// // starves the event loop enough that individual fetches spuriously time out - confirmed
// // by the same URL succeeding every time in isolation but failing under full concurrency.
// // A small concurrency limit keeps each check running under realistic conditions.
// const LIVE_CHECK_CONCURRENCY = 4;

// async function filterLiveProjects(projects: Project[]): Promise<Project[]> {
//   const results: (Project | null)[] = new Array(projects.length);
//   let nextIndex = 0;

//   async function worker() {
//     while (nextIndex < projects.length) {
//       const index = nextIndex++;
//       const project = projects[index];
//       const rawLink = String(project.link || "").trim();

//       if (!rawLink) {
//         results[index] = project;
//         continue;
//       }

//       const dead = await isDefinitelyDead(sanitizeUrl(rawLink));
//       results[index] = dead ? null : project;
//     }
//   }

//   await Promise.all(Array.from({ length: Math.min(LIVE_CHECK_CONCURRENCY, projects.length) }, worker));

//   return results.filter((project): project is Project => project !== null);
// }

// export interface CategoryPaneData {
//   subCategories: Category[];
//   itemSource: "projects" | "media";
//   layout: CategoryLayout;
//   items: Project[];
//   mediaCursor: number | null;
//   mediaHasMore: boolean;
// }

// /**
//  * Full content for a single category pane. Only ever fetches that one category's items
//  * (never the whole `projects`/`media` collection) - see app/api/category/[categoryId]/route.ts,
//  * which the client calls this from lazily for every category beyond the one rendered on
//  * first load.
//  */
// export async function getCategoryPaneData(category: Category, allCategories: Category[]): Promise<CategoryPaneData> {
//   const subCategories = sortCategories(allCategories.filter((item) => item.parentId === category.id));
//   const mediaPage = await getInitialMediaPage(category.id);

//   if (mediaPage.items.length) {
//     return {
//       subCategories,
//       itemSource: "media",
//       layout: getCategoryLayout(category, "media"),
//       items: mediaPage.items,
//       mediaCursor: mediaPage.cursor,
//       mediaHasMore: mediaPage.hasMore,
//     };
//   }

//   const categoryProjects = await fetchItemsForCategory<Project>("projects", category.id);
//   const liveProjects = await filterLiveProjects(categoryProjects);

//   return {
//     subCategories,
//     itemSource: "projects",
//     layout: getCategoryLayout(category, "projects"),
//     items: liveProjects,
//     mediaCursor: null,
//     mediaHasMore: false,
//   };
// }
