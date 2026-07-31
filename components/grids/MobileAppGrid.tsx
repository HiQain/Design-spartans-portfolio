import ProjectCardLink from "@/components/ProjectCardLink";
import SmartImage from "@/components/SmartImage";
import { resolveCardAction } from "@/lib/portfolio-utils";
import type { Project } from "@/lib/types";

export default function MobileAppGrid({ items, itemSource }: { items: Project[]; itemSource: "projects" | "media" }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((project) => {
        const action = resolveCardAction(project, itemSource);
        const title = project.title || project.name || "Mobile app";

        return (
          <ProjectCardLink
            key={project.id}
            action={action}
            ariaLabel={title}
            className="block w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[4/3] w-full">
              {project.imageUrl ? (
                <SmartImage
                  src={project.imageUrl}
                  alt={title}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
          </ProjectCardLink>
        );
      })}
    </div>
  );
}
