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
  link?: string;
  mainCategoryId?: string;
  mainCategoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  categoryId?: string;
  categoryName?: string;
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
  items: Project[];
  mediaCursor: number | null;
  mediaHasMore: boolean;
}

export interface MediaPage {
  items: MediaItem[];
  /** createdAt (ms since epoch) of the last item, used as the next page's startAfter cursor. */
  cursor: number | null;
  hasMore: boolean;
}
