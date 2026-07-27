import CategoryTabs, { type TabDefinition } from "@/components/CategoryTabs";
import Hero from "@/components/Hero";
import { ProjectModalProvider } from "@/components/ProjectModal";
import { getCategories, getCategoryPaneData, getTopContent } from "@/lib/portfolio";
import { getCategoryTabSlug, getSubCategoryAnchorId, sortCategories } from "@/lib/portfolio-utils";

export const revalidate = 60;

export default async function Home() {
  const [categories, topContent] = await Promise.all([getCategories(), getTopContent()]);

  const mainCategories = sortCategories(categories.filter((category) => !category.parentId));

  const tabs: TabDefinition[] = mainCategories.map((category) => ({
    id: category.id,
    name: category.name,
    tabSlug: getCategoryTabSlug(category),
    subCategories: sortCategories(categories.filter((item) => item.parentId === category.id)).map((sub) => ({
      id: sub.id,
      name: sub.name,
      anchorId: getSubCategoryAnchorId(sub),
    })),
  }));

  // Only the default (first) category's items are fetched and rendered on the initial
  // load - every other tab is fetched on demand client-side (see CategoryTabs +
  // app/api/category/[categoryId]). Eagerly rendering every category up front (including
  // their often image-heavy items) was bloating the page into a many-megabyte payload.
  const defaultCategory = mainCategories[0] ?? null;
  const initialPaneData = defaultCategory ? await getCategoryPaneData(defaultCategory, categories) : null;

  return (
    <main>
      <Hero topContent={topContent} />

      {defaultCategory && initialPaneData ? (
        <ProjectModalProvider>
          <CategoryTabs tabs={tabs} initialCategoryId={defaultCategory.id} initialPaneData={initialPaneData} />
        </ProjectModalProvider>
      ) : (
        <div className="py-20 text-center">
          <h2 className="section-heading text-3xl">No data found</h2>
          <p className="mt-4 font-condensed text-lg text-neutral-500">No categories available right now.</p>
        </div>
      )}
    </main>
  );
}
