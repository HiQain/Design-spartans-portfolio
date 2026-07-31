import ProjectCardLink from "@/components/ProjectCardLink";
import SmartImage from "@/components/SmartImage";
import { resolveCardAction } from "@/lib/portfolio-utils";
import type { Project } from "@/lib/types";

export default function BusinessCardGrid({ items, itemSource }: { items: Project[]; itemSource: "projects" | "media" }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((project) => {
        const action = resolveCardAction(project, itemSource);
        const title = project.title || project.name || "Business card";

        return (
          <ProjectCardLink
            key={project.id}
            action={action}
            ariaLabel={title}
            className="block overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[7/4] w-full">
              {project.imageUrl ? (
                <SmartImage
                  src={project.imageUrl}
                  alt={title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
