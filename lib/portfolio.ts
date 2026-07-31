import { apiGet } from "./api";
import { loadCategoryPaneData } from "./portfolio-utils";
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

async function fetchMediaPage(categoryId: string, subCategoryId: string | null): Promise<MediaPage> {
  return apiGet<MediaPage>("/media", {
    mainCategoryId: categoryId,
    subCategoryId: subCategoryId ?? undefined,
    limit: CATEGORY_PAGE_SIZE,
  });
}

/**
 * Full content for a single category pane. Only ever fetches that one category's items
 * (never the whole projects/media collection), while the client lazily fetches every
 * category beyond the one rendered first.
 */
export async function getCategoryPaneData(category: Category, allCategories: Category[]): Promise<CategoryPaneData> {
  return loadCategoryPaneData({
    category,
    allCategories,
    fetchMedia: (subCategoryId) => fetchMediaPage(category.id, subCategoryId),
    fetchProjects: () => fetchProjectsForCategory(category.id),
  });
}
