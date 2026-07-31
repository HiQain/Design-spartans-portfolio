export interface Category {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
  /** Milliseconds since epoch. */
  createdAt?: number;
  layout?: string;
  layoutType?: string;
  displayType?: string;
  cardType?: string;
  variant?: string;
}

export interface Project {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  summary?: string;
  details?: string;
  shortDescription?: string;
  imageUrl?: string;
  secondaryImageUrl?: string;
  link?: string;
  mainCategoryId?: string;
  mainCategoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  categoryId?: string;
  categoryName?: string;
  playStoreLink?: string;
  appStoreLink?: string;
  sortOrder?: number;
  /** Milliseconds since epoch. */
  createdAt?: number;
}

export type MediaItem = Project;

export interface TopContent {
  logoUrl?: string;
  title?: string;
  content?: string;
}

export type CategoryLayout =
  | "default"
  | "business-card"
  | "logo"
  | "mobile-app"
  | "gallery";

export interface CategoryPaneData {
  subCategories: Category[];
  itemSource: "projects" | "media";
  layout: CategoryLayout;
  /** Used for itemSource "projects", and for "media" when there are no subCategories. */
  items: Project[];
  mediaCursor: string | null;
  mediaHasMore: boolean;
  /**
   * Used for itemSource "media" when subCategories.length > 0: one independently
   * paginated page per subcategory, keyed by subCategoryId. Fetching/paginating media
   * per-subcategory (instead of one flat feed for the whole main category) keeps a
   * subcategory's own manual sort order from being buried behind another, untouched
   * subcategory's items - see MediaSubCategoryPane.
   */
  mediaPagesBySubCategory: Record<string, MediaPage> | null;
}

export interface MediaPage {
  items: MediaItem[];
  /** Opaque keyset cursor ("sortOrder.createdAt.id") for the next page; pass back as-is. */
  cursor: string | null;
  hasMore: boolean;
}
