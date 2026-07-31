import BusinessCardGrid from "@/components/grids/BusinessCardGrid";
import LogoGrid from "@/components/grids/LogoGrid";
import MasonryGallery from "@/components/grids/MasonryGallery";
import MobileAppGrid from "@/components/grids/MobileAppGrid";
import WebCardGrid from "@/components/grids/WebCardGrid";
import { getSubCategoryAnchorId, sortByCreatedAt } from "@/lib/portfolio-utils";
import type { Category, CategoryLayout, Project } from "@/lib/types";

const GRID_BY_LAYOUT: Record<CategoryLayout, typeof WebCardGrid> = {
  default: WebCardGrid,
  "business-card": BusinessCardGrid,
  logo: LogoGrid,
  "mobile-app": MobileAppGrid,
  gallery: MasonryGallery,
};

export function LayoutGrid({
  layout,
  items,
  itemSource,
}: {
  layout: CategoryLayout;
  items: Project[];
  itemSource: "projects" | "media";
}) {
  const Grid = GRID_BY_LAYOUT[layout] ?? WebCardGrid;
  return <Grid items={sortByCreatedAt(items)} itemSource={itemSource} />;
}

export default function CategorySections({
  subCategories,
  items,
  itemSource,
  layout,
}: {
  subCategories: Category[];
  items: Project[];
  itemSource: "projects" | "media";
  layout: CategoryLayout;
}) {
  if (!subCategories.length) {
    if (!items.length) return <NoData />;
    return <LayoutGrid layout={layout} items={items} itemSource={itemSource} />;
  }

  const sections = subCategories
    .map((subCategory) => {
      const relatedItems = items.filter((item) => {
        const itemSubCategoryId = item.subCategoryId || item.categoryId;
        const itemSubCategoryName = item.subCategoryName || item.categoryName;
        return itemSubCategoryId === subCategory.id || itemSubCategoryName === subCategory.name;
      });

      if (!relatedItems.length) return null;

      return (
        <div key={subCategory.id} className="mb-16 last:mb-0">
          <h2 id={getSubCategoryAnchorId(subCategory)} className="section-heading mb-8 scroll-mt-4 text-2xl sm:text-3xl">
            {subCategory.name}
          </h2>
          <LayoutGrid layout={layout} items={relatedItems} itemSource={itemSource} />
        </div>
      );
    })
    .filter(Boolean);

  if (!sections.length) return <NoData title={subCategories[0]?.name} />;

  return <>{sections}</>;
}

function NoData({ title }: { title?: string }) {
  return (
    <div className="py-16 text-center">
      {title ? <h2 className="section-heading mb-4 text-2xl sm:text-3xl">{title}</h2> : null}
      <p className="font-condensed text-lg text-neutral-500">No data available for this section right now.</p>
    </div>
  );
}
