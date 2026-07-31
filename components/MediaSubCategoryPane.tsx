"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid } from "@/components/CategorySections";
import { fetchNextMediaPage } from "@/lib/portfolio-client";
import { getSubCategoryAnchorId } from "@/lib/portfolio-utils";
import type { Category, CategoryLayout, MediaPage } from "@/lib/types";

/**
 * Owns its own items/cursor/hasMore, scoped to a single subcategory - each
 * subcategory paginates independently instead of sharing one feed for the whole
 * main category, so this subcategory's own manual sort order (set via admin
 * drag-reorder) isn't at the mercy of how many untouched items sit in every
 * other subcategory under the same main category.
 */
export default function MediaSubCategoryPane({
  categoryId,
  subCategory,
  layout,
  initialPage,
}: {
  categoryId: string;
  subCategory: Category;
  layout: CategoryLayout;
  initialPage: MediaPage;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [cursor, setCursor] = useState(initialPage.cursor);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const page = await fetchNextMediaPage(categoryId, cursor, subCategory.id);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error(`Failed to load more items for subcategory "${subCategory.id}".`, error);
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [categoryId, cursor, hasMore, subCategory.id]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (!items.length) return null;

  return (
    <div className="mb-16 last:mb-0">
      <h2 id={getSubCategoryAnchorId(subCategory)} className="section-heading mb-8 scroll-mt-4 text-2xl sm:text-3xl">
        {subCategory.name}
      </h2>
      <LayoutGrid layout={layout} items={items} itemSource="media" />

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
