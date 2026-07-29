import "server-only";

import { apiGet } from "./api";
import { getCategoryLayout, sortCategories } from "./portfolio-utils";
import type { Category, CategoryLayout, MediaPage, Project, TopContent } from "./types";

const CATEGORY_PAGE_SIZE = 10;

export async function getCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/categories");
}

export async function getTopContent(): Promise<TopContent | null> {
  return apiGet<TopContent | null>("/top-content");
}

async function fetchProjectsForCategory(categoryId: string): Promise<Project[]> {
  return apiGet<Project[]>("/projects", { mainCategoryId: categoryId });
}

async function fetchMediaPage(categoryId: string, cursorMillis: number | null): Promise<MediaPage> {
  return apiGet<MediaPage>("/media", {
    mainCategoryId: categoryId,
    cursor: cursorMillis ?? undefined,
    limit: CATEGORY_PAGE_SIZE,
  });
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
 * (never the whole projects/media collection) - see app/api/category/[categoryId]/route.ts,
 * which the client calls this from lazily for every category beyond the one rendered on
 * first load. Dead-link filtering for `projects` now happens server-side in the API's daily
 * cron job (isHidden), not per-request here.
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

  const categoryProjects = await fetchProjectsForCategory(category.id);

  return {
    subCategories,
    itemSource: "projects",
    layout: getCategoryLayout(category, "projects"),
    items: categoryProjects,
    mediaCursor: null,
    mediaHasMore: false,
  };
}
