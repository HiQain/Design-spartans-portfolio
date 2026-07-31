import { useEffect, useState } from "react";
import CategoryTabs, { type TabDefinition } from "@/components/CategoryTabs";
import Hero from "@/components/Hero";
import { ProjectModalProvider } from "@/components/ProjectModal";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { getCategories, getCategoryPaneData, getTopContent } from "@/lib/portfolio";
import { getCategoryTabSlug, getSubCategoryAnchorId, sortCategories } from "@/lib/portfolio-utils";
import type { Category, CategoryPaneData, TopContent } from "@/lib/types";

const SITE_TITLE = "Design Spartans | Web Design, Logo Design and Digital Marketing";
const SITE_DESCRIPTION =
  "Design Spartans is a digital agency that provides logo design, web design & development, digital marketing and other digital services to boost businesses.";
const META_IMAGE = "/meta-banner.jpg";

function buildTabs(categories: Category[]): TabDefinition[] {
  return sortCategories(categories.filter((category) => !category.parentId)).map((category) => ({
    id: category.id,
    name: category.name,
    tabSlug: getCategoryTabSlug(category),
    subCategories: sortCategories(categories.filter((item) => item.parentId === category.id)).map((sub) => ({
      id: sub.id,
      name: sub.name,
      anchorId: getSubCategoryAnchorId(sub),
    })),
  }));
}

function useDocumentMetadata() {
  useEffect(() => {
    document.title = SITE_TITLE;

    const ensureMeta = (selector: string, attributes: Record<string, string>) => {
      let element = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }

      for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
      }
    };

    ensureMeta('meta[name="description"]', { name: "description", content: SITE_DESCRIPTION });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: SITE_TITLE });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: SITE_DESCRIPTION });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: META_IMAGE });
    ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: SITE_TITLE });
    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: SITE_DESCRIPTION });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: META_IMAGE });
  }, []);
}

export default function App() {
  useDocumentMetadata();

  const [categories, setCategories] = useState<Category[]>([]);
  const [topContent, setTopContent] = useState<TopContent | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  const [initialPaneData, setInitialPaneData] = useState<CategoryPaneData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      setIsLoading(true);
      setError(null);

      try {
        const [allCategories, heroContent] = await Promise.all([getCategories(), getTopContent()]);
        const mainCategories = sortCategories(allCategories.filter((category) => !category.parentId));
        const defaultCategory = mainCategories[0] ?? null;
        const paneData = defaultCategory ? await getCategoryPaneData(defaultCategory, allCategories) : null;

        if (cancelled) return;

        setCategories(allCategories);
        setTopContent(heroContent);
        setInitialCategoryId(defaultCategory?.id ?? null);
        setInitialPaneData(paneData);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Failed to load portfolio data.";
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = buildTabs(categories);

  return (
    <>
      <main>
        <Hero topContent={topContent} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : error ? (
          <div className="px-4 py-20 text-center">
            <h2 className="section-heading text-3xl">Unable to load portfolio</h2>
            <p className="mt-4 font-condensed text-lg text-neutral-500">{error}</p>
          </div>
        ) : initialCategoryId && initialPaneData ? (
          <ProjectModalProvider>
            <CategoryTabs
              categories={categories}
              tabs={tabs}
              initialCategoryId={initialCategoryId}
              initialPaneData={initialPaneData}
            />
          </ProjectModalProvider>
        ) : (
          <div className="py-20 text-center">
            <h2 className="section-heading text-3xl">No data found</h2>
            <p className="mt-4 font-condensed text-lg text-neutral-500">No categories available right now.</p>
          </div>
        )}
      </main>
      <ScrollToTopButton />
    </>
  );
}
