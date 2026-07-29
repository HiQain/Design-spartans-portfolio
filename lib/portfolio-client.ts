"use client";

import type { MediaPage } from "./types";
import type { CategoryPaneData } from "./portfolio";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!.replace(/\/+$/, "");
const CATEGORY_PAGE_SIZE = 10;

export async function fetchCategoryPaneData(categoryId: string): Promise<CategoryPaneData> {
  const response = await fetch(`/api/category/${categoryId}`);
  if (!response.ok) {
    throw new Error(`Failed to load category "${categoryId}": ${response.status}`);
  }
  return response.json();
}

export async function fetchNextMediaPage(categoryId: string, cursorMillis: number | null): Promise<MediaPage> {
  const url = new URL(`${API_BASE_URL}/media`);
  url.searchParams.set("mainCategoryId", categoryId);
  url.searchParams.set("limit", String(CATEGORY_PAGE_SIZE));
  if (cursorMillis != null) url.searchParams.set("cursor", String(cursorMillis));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load media page for "${categoryId}": ${response.status}`);
  }
  return response.json();
}
