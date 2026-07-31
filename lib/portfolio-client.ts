import { apiGet } from "./api";
import { loadCategoryPaneData } from "./portfolio-utils";
import type { Category, CategoryPaneData, MediaPage, Project } from "./types";

const CATEGORY_PAGE_SIZE = 10;

export async function fetchCategoryPaneData(categoryId: string, allCategories: Category[]): Promise<CategoryPaneData> {
  const category = allCategories.find((item) => item.id === categoryId);
  if (!category) {
    throw new Error(`Category "${categoryId}" not found.`);
  }

  return loadCategoryPaneData({
    category,
    allCategories,
    fetchMedia: (subCategoryId) =>
      apiGet<MediaPage>("/media", {
        mainCategoryId: categoryId,
        subCategoryId: subCategoryId ?? undefined,
        limit: CATEGORY_PAGE_SIZE,
      }),
    fetchProjects: () => apiGet<Project[]>("/projects", { mainCategoryId: categoryId }),
  });
}

export async function fetchNextMediaPage(
  categoryId: string,
  cursor: string | null,
  subCategoryId?: string | null,
): Promise<MediaPage> {
  return apiGet<MediaPage>("/media", {
    mainCategoryId: categoryId,
    subCategoryId: subCategoryId ?? undefined,
    limit: CATEGORY_PAGE_SIZE,
    cursor: cursor ?? undefined,
  });
}
