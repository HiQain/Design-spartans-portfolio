"use client";

import { useEffect, useRef, useState } from "react";
import CategorySections from "@/components/CategorySections";
import MediaCategoryPane from "@/components/MediaCategoryPane";
import { fetchCategoryPaneData } from "@/lib/portfolio-client";
import type { CategoryPaneData } from "@/lib/portfolio";
import { ChevronDown } from "./icons";

export interface TabDefinition {
  id: string;
  name: string;
  tabSlug: string;
  subCategories: { id: string; name: string; anchorId: string }[];
}

export default function CategoryTabs({
  tabs,
  initialCategoryId,
  initialPaneData,
}: {
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
  const paneDataByIdRef = useRef(paneDataById);
  paneDataByIdRef.current = paneDataById;
  const loadingIdsRef = useRef(new Set<string>());

  const ensurePaneLoaded = (categoryId: string) => {
    if (paneDataByIdRef.current[categoryId] || loadingIdsRef.current.has(categoryId)) return;

    loadingIdsRef.current.add(categoryId);
    fetchCategoryPaneData(categoryId)
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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "auto", block: "start" });
      });
    });
  }, [pendingAnchor, activeId, paneDataById]);

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

  return (
    <div className="pt-10 sm:pt-14">
      <div ref={navWrapperRef} className="relative mx-auto max-w-6xl px-4">
        <nav className="no-scrollbar flex flex-nowrap justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
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
                    className={`font-condensed h-10 whitespace-nowrap px-4 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      hasDropdown ? "rounded-l-full" : "rounded-full"
                    } ${
                      isActive
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
                      className={`flex h-10 w-8 items-center justify-center rounded-r-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                        isActive
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
