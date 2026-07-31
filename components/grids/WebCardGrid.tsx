import ProjectCardLink from "@/components/ProjectCardLink";
import SmartImage from "@/components/SmartImage";
import { isRealTitle, resolveCardAction } from "@/lib/portfolio-utils";
import type { Project } from "@/lib/types";

export default function WebCardGrid({ items, itemSource }: { items: Project[]; itemSource: "projects" | "media" }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((project) => {
        const action = resolveCardAction(project, itemSource);
        const rawTitle = project.title || project.name || "";
        const showTitle = isRealTitle(rawTitle);

        return (
          <div key={project.id} className="group">
            <ProjectCardLink action={action} className="block w-full text-left" ariaLabel={showTitle ? rawTitle : "Project preview"}>
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-md transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
                style={{
                  borderTop: "5px solid rgb(24, 23, 23)",
                  borderBottom: "5px solid rgb(66, 66, 66)",
                  borderLeft: "5px solid rgb(70, 70, 70)",
                  borderRight: "5px solid rgb(0, 0, 0)",
                }}
              >
                {project.imageUrl ? (
                  <SmartImage
                    src={project.imageUrl}
                    alt={showTitle ? rawTitle : "Project image"}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>
              {showTitle ? (
                <h3 className="mt-4 text-center font-condensed text-lg font-semibold text-accent">{rawTitle}</h3>
              ) : null}
            </ProjectCardLink>
          </div>
        );
      })}
    </div>
  );
}
