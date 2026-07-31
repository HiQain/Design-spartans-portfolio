"use client";

import { motion } from "framer-motion";
import ProjectCardLink from "@/components/ProjectCardLink";
import { resolveCardAction } from "@/lib/portfolio-utils";
import type { Project } from "@/lib/types";

export default function MasonryGallery({ items, itemSource }: { items: Project[]; itemSource: "projects" | "media" }) {
  return (
    <div className="columns-1 gap-3 md:columns-3 lg:columns-4 [column-fill:_balance]">
      {items.map((project, index) => {
        const action = resolveCardAction(project, itemSource);
        const title = project.title || project.name || `Project ${index + 1}`;

        return (
          <motion.div
            key={project.id}
            className="mb-3 break-inside-avoid"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ProjectCardLink
              action={action}
              ariaLabel={title}
              className="block w-full overflow-hidden rounded-xl bg-neutral-100 shadow-md ring-1 ring-black/5 transition hover:shadow-xl"
            >
              {project.imageUrl ? (
                <img src={project.imageUrl} alt={title} loading="lazy" decoding="async" className="block w-full" />
              ) : null}
            </ProjectCardLink>
          </motion.div>
        );
      })}
    </div>
  );
}
