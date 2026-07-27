import ProjectCardLink from "@/components/ProjectCardLink";
import SmartImage from "@/components/SmartImage";
import { resolveCardAction } from "@/lib/portfolio-utils";
import type { Project } from "@/lib/types";

export default function LogoGrid({ items, itemSource }: { items: Project[]; itemSource: "projects" | "media" }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((project) => {
        const action = resolveCardAction(project, itemSource);
        const title = project.title || project.name || "Logo";

        return (
          <ProjectCardLink
            key={project.id}
            action={action}
            ariaLabel={title}
            className="block overflow-hidden rounded-xl bg-white p-3 shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-square w-full">
              {project.imageUrl ? (
                <SmartImage
                  src={project.imageUrl}
                  alt={title}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="object-contain"
                />
              ) : null}
            </div>
          </ProjectCardLink>
        );
      })}
    </div>
  );
}
