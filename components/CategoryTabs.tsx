"use client";

import { useEffect, useRef, useState } from "react";
import CategorySections from "@/components/CategorySections";
import MediaCategoryPane from "@/components/MediaCategoryPane";
import { fetchCategoryPaneData } from "@/lib/portfolio-client";
import type { Category, CategoryPaneData } from "@/lib/types";
import { ChevronDown } from "./icons";

export interface TabDefinition {
  id: string;
  name: string;
  tabSlug: string;
  subCategories: { id: string; name: string; anchorId: string }[];
}

export default function CategoryTabs({
  categories,
  tabs,
  initialCategoryId,
  initialPaneData,
}: {
  categories: Category[];
  tabs: TabDefinition[];
  initialCategoryId: string;
  initialPaneData: CategoryPaneData;
}) {
  const [activeId, setActiveId] = useState(initialCategoryId);
  const [paneDataById, setPaneDataById] = useState<Record<string, CategoryPaneData>>({
    [initialCategoryId]: initialPaneData,
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // An anchor waiting on its pane's data to arrive and render before it can scroll into
  // view - covers both a shared "?tab=x#anchor" URL and clicking a subcategory whose tab
  // hasn't loaded yet. Cleared once the scroll actually happens.
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null);
  const hasSyncedFromUrl = useRef(false);
  const navWrapperRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLElement>(null);
  const paneDataByIdRef = useRef(paneDataById);
  paneDataByIdRef.current = paneDataById;
  const loadingIdsRef = useRef(new Set<string>());
  // Drives the mobile-only "you can scroll this row" indicator below the tab strip.
  const [navScrollMetrics, setNavScrollMetrics] = useState({ canScroll: false, progress: 0, thumbRatio: 1 });

  const ensurePaneLoaded = (categoryId: string) => {
    if (paneDataByIdRef.current[categoryId] || loadingIdsRef.current.has(categoryId)) return;

    loadingIdsRef.current.add(categoryId);
    fetchCategoryPaneData(categoryId, categories)
      .then((data) => {
        setPaneDataById((prev) => ({ ...prev, [categoryId]: data }));
      })
      .catch((error) => {
        console.error(`Failed to load category "${categoryId}".`, error);
      })
      .finally(() => {
        loadingIdsRef.current.delete(categoryId);
      });
  };

  // Once the active tab's data has actually rendered, scroll to whichever subcategory
  // anchor is pending (from a shared URL or a dropdown click) and clear it.
  useEffect(() => {
    if (!pendingAnchor || !paneDataById[activeId]) return;

    const anchor = pendingAnchor;
    setPendingAnchor(null);

    const scrollToAnchor = () => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "auto", block: "start" });
    };

    // Images in the pane (including sections above the target) often finish loading and
    // reflow the page after this frame, which pushes the anchor away from the top and
    // leaves the previous section's tail still visible - on both mobile and desktop.
    // Re-run the scroll a few times as things settle so the heading actually lands (and
    // stays) at the very top. Deliberately not cleaned up on re-run: setPendingAnchor(null)
    // above itself changes this effect's own dependency, so a cleanup here would cancel
    // these timers immediately, before any of them get a chance to fire.
    [0, 150, 400, 900].forEach((delay) => {
      window.setTimeout(() => requestAnimationFrame(scrollToAnchor), delay);
    });
  }, [pendingAnchor, activeId, paneDataById]);

  // Tracks how far the horizontally-scrollable tab strip has scrolled so the mobile
  // indicator bar below it can reflect scroll position (and hide once nothing overflows).
  useEffect(() => {
    const nav = navScrollRef.current;
    if (!nav) return;

    const updateScrollMetrics = () => {
      const { scrollLeft, scrollWidth, clientWidth } = nav;
      const maxScroll = scrollWidth - clientWidth;
      setNavScrollMetrics({
        canScroll: maxScroll > 1,
        progress: maxScroll > 0 ? scrollLeft / maxScroll : 0,
        thumbRatio: Math.min(1, clientWidth / scrollWidth),
      });
    };

    updateScrollMetrics();
    nav.addEventListener("scroll", updateScrollMetrics, { passive: true });
    window.addEventListener("resize", updateScrollMetrics);
    return () => {
      nav.removeEventListener("scroll", updateScrollMetrics);
      window.removeEventListener("resize", updateScrollMetrics);
    };
  }, [tabs]);

  const activateBySlug = (slug: string, anchorId?: string) => {
    const tab = tabs.find((item) => item.tabSlug === slug);
    if (!tab) return false;

    setActiveId(tab.id);
    ensurePaneLoaded(tab.id);
    if (anchorId) setPendingAnchor(anchorId);

    return true;
  };

  useEffect(() => {
    if (hasSyncedFromUrl.current) return;
    hasSyncedFromUrl.current = true;

    const requestedSlug = new URLSearchParams(window.location.search).get("tab");
    const requestedHash = decodeURIComponent(window.location.hash.replace(/^#/, "")).trim();

    if (requestedSlug) {
      activateBySlug(requestedSlug, requestedHash || undefined);
    } else if (requestedHash) {
      const owningTab = tabs.find((tab) => tab.subCategories.some((sub) => sub.anchorId === requestedHash));
      if (owningTab) activateBySlug(owningTab.tabSlug, requestedHash);
    }

    const onPopState = () => {
      const slug = new URLSearchParams(window.location.search).get("tab");
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, "")).trim();
      if (slug) activateBySlug(slug, hash || undefined);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the mega-dropdown on outside click.
  useEffect(() => {
    if (!openDropdown) return;

    function handlePointerDown(event: MouseEvent) {
      if (navWrapperRef.current && !navWrapperRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openDropdown]);

  const toggleDropdown = (tabId: string) => {
    setOpenDropdown((current) => (current === tabId ? null : tabId));
  };

  const selectTab = (tabId: string, anchorId?: string) => {
    setActiveId(tabId);
    setOpenDropdown(null);
    ensurePaneLoaded(tabId);
    setPendingAnchor(anchorId ?? null);

    const tab = tabs.find((item) => item.id === tabId);
    if (tab) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab.tabSlug);
      url.hash = anchorId ?? "";
      window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const activeDropdownTab = tabs.find((tab) => tab.id === openDropdown);

  const NAV_INDICATOR_WIDTH = 64;
  const navThumbWidth = Math.max(18, navScrollMetrics.thumbRatio * NAV_INDICATOR_WIDTH);
  const navThumbOffset = navScrollMetrics.progress * (NAV_INDICATOR_WIDTH - navThumbWidth);

  return (
    <div className="pt-10 sm:pt-10">
      <div ref={navWrapperRef} className="relative mx-auto max-w-6xl px-4">
        <nav
          ref={navScrollRef}
          className="no-scrollbar flex flex-nowrap justify-start gap-2 overflow-x-auto pb-0 sm:justify-center"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const hasDropdown = tab.subCategories.length > 0;

            return (
              <div key={tab.id} className="shrink-0">
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    onMouseEnter={() => ensurePaneLoaded(tab.id)}
                    onFocus={() => ensurePaneLoaded(tab.id)}
                    onTouchStart={() => ensurePaneLoaded(tab.id)}
                    className={`font-condensed h-10 whitespace-nowrap text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${hasDropdown ? "rounded-l-full pl-4 pr-1.5" : "rounded-full px-4"
                      } ${isActive
                        ? "bg-brand text-white shadow-lg shadow-brand/30"
                        : "border border-brand bg-white text-brand hover:bg-brand/5"
                      } ${hasDropdown ? "border-r-0" : ""}`}
                  >
                    {tab.name}
                  </button>

                  {hasDropdown ? (
                    <button
                      type="button"
                      aria-label={`${tab.name} subcategories`}
                      onClick={() => toggleDropdown(tab.id)}
                      onMouseEnter={() => ensurePaneLoaded(tab.id)}
                      onFocus={() => ensurePaneLoaded(tab.id)}
                      onTouchStart={() => ensurePaneLoaded(tab.id)}
                      className={`flex h-10 w-7 items-center justify-center rounded-r-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${isActive
                        ? "bg-brand text-white"
                        : "border border-l-0 border-brand text-brand hover:bg-brand/5"
                        }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </nav>

        {navScrollMetrics.canScroll ? (
          <div className="mx-auto mt-2 h-1 w-16 overflow-hidden rounded-full bg-neutral-200 sm:hidden">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${navThumbWidth}px`, transform: `translateX(${navThumbOffset}px)` }}
            />
          </div>
        ) : null}

        {activeDropdownTab ? (
          <div className="absolute left-1/2 top-full z-20 mt-3 w-[min(72rem,92vw)] max-w-md -translate-x-1/2 rounded-2xl border-t-4 border-brand bg-white p-5 shadow-2xl sm:max-w-none">
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {activeDropdownTab.subCategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => selectTab(activeDropdownTab.id, sub.anchorId)}
                  className="mb-1 block w-full break-inside-avoid rounded-lg px-3 py-2 text-left font-condensed text-sm font-semibold tracking-wide text-neutral-800 transition hover:bg-brand/10 hover:text-brand"
                >
                  {sub.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          const data = paneDataById[tab.id];

          if (!data) {
            if (!isActive) return null;
            return (
              <div key={tab.id} className="flex justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            );
          }

          return (
            <div key={tab.id} className={isActive ? "block" : "hidden"}>
              {data.itemSource === "media" ? (
                <MediaCategoryPane
                  categoryId={tab.id}
                  subCategories={data.subCategories}
                  layout={data.layout}
                  initialItems={data.items}
                  initialCursor={data.mediaCursor}
                  initialHasMore={data.mediaHasMore}
                  initialSubCategoryPages={data.mediaPagesBySubCategory}
                />
              ) : (
                <CategorySections
                  subCategories={data.subCategories}
                  items={data.items}
                  itemSource="projects"
                  layout={data.layout}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
