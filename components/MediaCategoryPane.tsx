"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CategorySections from "@/components/CategorySections";
import { fetchNextMediaPage } from "@/lib/portfolio-client";
import type { Category, CategoryLayout, Project } from "@/lib/types";

export default function MediaCategoryPane({
  categoryId,
  subCategories,
  layout,
  initialItems,
  initialCursor,
  initialHasMore,
}: {
  categoryId: string;
  subCategories: Category[];
  layout: CategoryLayout;
  initialItems: Project[];
  initialCursor: number | null;
  initialHasMore: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const page = await fetchNextMediaPage(categoryId, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error(`Failed to load more items for category "${categoryId}".`, error);
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [categoryId, cursor, hasMore]);

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

  return (
    <div>
      <CategorySections subCategories={subCategories} items={items} itemSource="media" layout={layout} />

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-10">
          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
