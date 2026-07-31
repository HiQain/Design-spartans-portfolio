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

/**
 * Sorts by `sortOrder` (admin drag-and-drop, ascending) first, falling back to
 * `createdAt` descending - so items nobody has manually reordered yet naturally
 * show newest-first, matching the server's own ordering.
 */
export function sortByCreatedAt<T extends { sortOrder?: number; createdAt?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const sortOrderDifference = normalizeSortOrder(a.sortOrder) - normalizeSortOrder(b.sortOrder);
    if (sortOrderDifference !== 0) return sortOrderDifference;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });
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

const PLACEHOLDER_TITLES = new Set(["untitled", "untitled project"]);

export function isRealTitle(rawTitle?: string): boolean {
  const title = String(rawTitle || "").trim();
  return Boolean(title && !PLACEHOLDER_TITLES.has(title.toLowerCase()));
}

export type CardAction =
  | { kind: "link"; href: string }
  | {
      kind: "modal";
      modalProject: {
        title: string;
        description: string;
        imageUrl: string;
        link: string;
        playStoreLink: string;
        appStoreLink: string;
        isFlipCard: boolean;
        secondaryImageUrl: string;
      };
    };

// Categories with a front/back image pair - shown as an auto-rotating 3D card in
// the modal (only when both images are actually present; a single image just
// shows statically like any other item).
const FLIP_CARD_CATEGORIES = new Set(["merchandise & apparel", "branding materials"]);

/**
 * Every card opens the preview modal (image + description + Launch Website /
 * Play Store / App Store buttons) instead of navigating away directly.
 */
export function resolveCardAction(project: Project, itemSource: "projects" | "media"): CardAction {
  const rawTitle = String(project.title || project.name || "").trim();
  const title = isRealTitle(rawTitle) ? rawTitle : "";
  const link = String(project.link || "").trim();
  const hasLink = Boolean(link);
  const playStoreLink = String(project.playStoreLink || "").trim();
  const appStoreLink = String(project.appStoreLink || "").trim();
  const secondaryImageUrl = String(project.secondaryImageUrl || "").trim();
  const isFlipCard = FLIP_CARD_CATEGORIES.has(normalizeValue(project.mainCategoryName)) && Boolean(secondaryImageUrl);

  return {
    kind: "modal",
    modalProject: {
      title,
      description: getProjectDescription(project),
      imageUrl: sanitizeUrl(project.imageUrl),
      link: hasLink ? sanitizeUrl(link) : "",
      playStoreLink: playStoreLink ? sanitizeUrl(playStoreLink) : "",
      appStoreLink: appStoreLink ? sanitizeUrl(appStoreLink) : "",
      isFlipCard,
      secondaryImageUrl: secondaryImageUrl ? sanitizeUrl(secondaryImageUrl) : "",
    },
  };
}

/**
 * Shared by both the eager first-pane fetch (portfolio.ts) and the on-demand
 * per-tab fetch (portfolio-client.ts) - both just hand in an `apiGet`-backed
 * `fetchMedia`/`fetchProjects` pair, so the branching logic (media vs. projects,
 * flat vs. per-subcategory) only has to live in one place.
 *
 * A cheap flat probe page decides itemSource (whether this category has any media
 * rows at all, falling back to projects if not) exactly like before. When the
 * category does have subCategories, that probe is then discarded in favor of one
 * independent page per subcategory - see the `mediaPagesBySubCategory` doc comment
 * in types.ts for why a single shared feed doesn't work once sortOrder is in play.
 */
export async function loadCategoryPaneData({
  category,
  allCategories,
  fetchMedia,
  fetchProjects,
}: {
  category: Category;
  allCategories: Category[];
  fetchMedia: (subCategoryId: string | null) => Promise<MediaPage>;
  fetchProjects: () => Promise<Project[]>;
}): Promise<CategoryPaneData> {
  const subCategories = sortCategories(allCategories.filter((item) => item.parentId === category.id));
  const probePage = await fetchMedia(null);

  if (!probePage.items.length) {
    const projects = await fetchProjects();
    return {
      subCategories,
      itemSource: "projects",
      layout: getCategoryLayout(category, "projects"),
      items: projects,
      mediaCursor: null,
      mediaHasMore: false,
      mediaPagesBySubCategory: null,
    };
  }

  if (!subCategories.length) {
    return {
      subCategories,
      itemSource: "media",
      layout: getCategoryLayout(category, "media"),
      items: probePage.items,
      mediaCursor: probePage.cursor,
      mediaHasMore: probePage.hasMore,
      mediaPagesBySubCategory: null,
    };
  }

  const subCategoryPages = await Promise.all(subCategories.map((sub) => fetchMedia(sub.id)));
  const mediaPagesBySubCategory: Record<string, MediaPage> = {};
  subCategories.forEach((sub, index) => {
    mediaPagesBySubCategory[sub.id] = subCategoryPages[index]!;
  });

  return {
    subCategories,
    itemSource: "media",
    layout: getCategoryLayout(category, "media"),
    items: [],
    mediaCursor: null,
    mediaHasMore: false,
    mediaPagesBySubCategory,
  };
}
