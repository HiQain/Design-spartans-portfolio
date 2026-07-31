import { apiGet } from "./api";
import { buildCategoryPaneData } from "./portfolio-utils";
import type { Category, CategoryPaneData, MediaPage, Project } from "./types";

const CATEGORY_PAGE_SIZE = 10;

export async function fetchCategoryPaneData(categoryId: string, allCategories: Category[]): Promise<CategoryPaneData> {
  const category = allCategories.find((item) => item.id === categoryId);
  if (!category) {
    throw new Error(`Category "${categoryId}" not found.`);
  }

  const mediaPage = await apiGet<MediaPage>("/media", {
    mainCategoryId: categoryId,
    limit: CATEGORY_PAGE_SIZE,
  });

  const projects = mediaPage.items.length
    ? []
    : await apiGet<Project[]>("/projects", { mainCategoryId: categoryId });

  return buildCategoryPaneData({
    category,
    allCategories,
    mediaPage,
    projects,
  });
}

export async function fetchNextMediaPage(categoryId: string, cursorMillis: number | null): Promise<MediaPage> {
  return apiGet<MediaPage>("/media", {
    mainCategoryId: categoryId,
    limit: CATEGORY_PAGE_SIZE,
    cursor: cursorMillis ?? undefined,
  });
}
