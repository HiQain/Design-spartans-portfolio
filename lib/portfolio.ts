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
