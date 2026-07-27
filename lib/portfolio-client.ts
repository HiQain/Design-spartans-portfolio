"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizeTimestamp } from "./portfolio-utils";
import type { MediaItem, MediaPage } from "./types";
import type { CategoryPaneData } from "./portfolio";

const CATEGORY_PAGE_SIZE = 10;

export async function fetchCategoryPaneData(categoryId: string): Promise<CategoryPaneData> {
  const response = await fetch(`/api/category/${categoryId}`);
  if (!response.ok) {
    throw new Error(`Failed to load category "${categoryId}": ${response.status}`);
  }
  return response.json();
}

export async function fetchNextMediaPage(categoryId: string, cursorMillis: number | null): Promise<MediaPage> {
  const constraints: QueryConstraint[] = [where("mainCategoryId", "==", categoryId), orderBy("createdAt", "asc")];

  if (cursorMillis) {
    constraints.push(startAfter(Timestamp.fromMillis(cursorMillis)));
  }

  constraints.push(limit(CATEGORY_PAGE_SIZE));

  const snapshot = await getDocs(query(collection(db, "media"), ...constraints));
  const items: MediaItem[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    return { ...data, id: docSnap.id, createdAt: normalizeTimestamp(data.createdAt as never) } as MediaItem;
  });

  return {
    items,
    cursor: items.length ? (items[items.length - 1].createdAt ?? null) : null,
    hasMore: items.length === CATEGORY_PAGE_SIZE,
  };
}
