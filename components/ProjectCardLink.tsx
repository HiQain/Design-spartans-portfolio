"use client";

import type { ReactNode } from "react";
import type { CardAction } from "@/lib/portfolio-utils";
import { useProjectModal } from "./ProjectModal";

export default function ProjectCardLink({
  action,
  className,
  ariaLabel,
  children,
}: {
  action: CardAction;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { openProject } = useProjectModal();

  if (action.kind === "link") {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={() => openProject(action.modalProject)}
    >
      {children}
    </button>
  );
}
