import { apiGet } from "./api";
import { buildCategoryPaneData, sortCategories } from "./portfolio-utils";
import type { Category, CategoryPaneData, MediaPage, Project, TopContent } from "./types";

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

/**
 * Full content for a single category pane. Only ever fetches that one category's items
 * (never the whole projects/media collection), while the client lazily fetches every
 * category beyond the one rendered first.
 */
export async function getCategoryPaneData(category: Category, allCategories: Category[]): Promise<CategoryPaneData> {
  const mediaPage = await getInitialMediaPage(category.id);
  const categoryProjects = await fetchProjectsForCategory(category.id);
  return buildCategoryPaneData({
    category,
    allCategories,
    mediaPage,
    projects: categoryProjects,
  });
}
