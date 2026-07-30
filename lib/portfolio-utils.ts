import type { Category, CategoryLayout, CategoryPaneData, MediaPage, Project } from "./types";

export function slugify(value = ""): string {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizeUrl(value = "#"): string {
  if (!value) return "#";
  const trimmed = String(value).trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed;
  }
  return trimmed.startsWith("./") || trimmed.startsWith("/") ? trimmed : `https://${trimmed}`;
}

export function getProjectDescription(project: Project): string {
  const candidates = [
    project.description,
    project.content,
    project.summary,
    project.details,
    project.shortDescription,
  ];
  return candidates.find((value) => String(value || "").trim())?.trim() ?? "";
}

/** Sorts by `createdAt` (millis). */
export function sortByCreatedAt<T extends { createdAt?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

function normalizeSortOrder(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
}

export function sortCategories(items: Category[]): Category[] {
  return [...items].sort((a, b) => {
    const sortOrderDifference = normalizeSortOrder(a.sortOrder) - normalizeSortOrder(b.sortOrder);
    if (sortOrderDifference !== 0) return sortOrderDifference;

    const createdAtDifference = (a.createdAt ?? 0) - (b.createdAt ?? 0);
    if (createdAtDifference !== 0) return createdAtDifference;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function getCategoryTabSlug(category: Category): string {
  return slugify(category.slug || category.name || category.id || "tab");
}

export function getSubCategoryAnchorId(category: Category): string {
  return slugify(category.name || category.slug || category.id || "category");
}

function normalizeValue(value = ""): string {
  return String(value || "").trim().toLowerCase();
}

export function getCategoryLayout(category: Category, itemSource: "projects" | "media" = "projects"): CategoryLayout {
  const configured = normalizeValue(
    category.layout || category.layoutType || category.displayType || category.cardType || category.variant
  );

  const layoutMap: Record<string, CategoryLayout> = {
    "business-card": "business-card",
    businesscard: "business-card",
    "business-cards": "business-card",
    logo: "logo",
    logos: "logo",
    "logo-design": "logo",
    "logo-designs": "logo",
    "mobile-app": "mobile-app",
    "mobile-apps": "mobile-app",
    "app-design": "mobile-app",
    "app-designs": "mobile-app",
    gallery: "gallery",
    masonry: "gallery",
    media: "gallery",
  };

  if (configured && layoutMap[configured]) return layoutMap[configured];
  return itemSource === "media" ? "gallery" : "default";
}

export function isRealTitle(rawTitle?: string): boolean {
  const title = String(rawTitle || "").trim();
  return Boolean(title && title.toLowerCase() !== "untitled project");
}

export type CardAction =
  | { kind: "link"; href: string }
  | { kind: "modal"; modalProject: { title: string; description: string; imageUrl: string; link: string } };

/**
 * "projects" items with a link navigate straight to the live site; everything else
 * (media/gallery items, or projects without a link) opens the preview modal instead.
 */
export function resolveCardAction(project: Project, itemSource: "projects" | "media"): CardAction {
  const rawTitle = String(project.title || project.name || "").trim();
  const title = isRealTitle(rawTitle) ? rawTitle : "";
  const link = String(project.link || "").trim();
  const hasLink = Boolean(link);

  if (hasLink && itemSource === "projects") {
    return { kind: "link", href: sanitizeUrl(link) };
  }

  return {
    kind: "modal",
    modalProject: {
      title,
      description: getProjectDescription(project),
      imageUrl: sanitizeUrl(project.imageUrl),
      link: hasLink ? sanitizeUrl(link) : "",
    },
  };
}

export function buildCategoryPaneData({
  category,
  allCategories,
  mediaPage,
  projects,
}: {
  category: Category;
  allCategories: Category[];
  mediaPage: MediaPage;
  projects: Project[];
}): CategoryPaneData {
  const subCategories = sortCategories(allCategories.filter((item) => item.parentId === category.id));

  if (mediaPage.items.length) {
    return {
      subCategories,
      itemSource: "media",
      layout: getCategoryLayout(category, "media"),
      items: mediaPage.items,
      mediaCursor: mediaPage.cursor,
      mediaHasMore: mediaPage.hasMore,
    };
  }

  return {
    subCategories,
    itemSource: "projects",
    layout: getCategoryLayout(category, "projects"),
    items: projects,
    mediaCursor: null,
    mediaHasMore: false,
  };
}
