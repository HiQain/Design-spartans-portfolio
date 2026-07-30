"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { X } from "./icons";

export interface ModalProject {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

interface ModalContextValue {
  openProject: (project: ModalProject) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useProjectModal(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useProjectModal must be used within a ProjectModalProvider");
  }
  return context;
}

export function ProjectModalProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<ModalProject | null>(null);
  const [open, setOpen] = useState(false);

  const value = useMemo<ModalContextValue>(
    () => ({
      openProject: (project: ModalProject) => {
        setActiveProject(project);
        setOpen(true);
      },
    }),
    []
  );

  const imageOnly = !activeProject?.description && !activeProject?.link;

  return (
    <ModalContext.Provider value={value}>
      {children}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content
            className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 focus:outline-none ${imageOnly
              ? "max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)] w-fit"
              : "max-h-[calc(100vh-3rem)] max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-w-5xl"
              }`}
          >
            {!imageOnly && activeProject?.title ? (
              <Dialog.Title className="px-6 pt-5 font-condensed text-xl font-bold uppercase tracking-wide text-brand sm:px-8 sm:text-2xl">
                {activeProject.title}
              </Dialog.Title>
            ) : (
              <Dialog.Title className="sr-only">Project preview</Dialog.Title>
            )}
            <Dialog.Description className="sr-only">
              {activeProject?.description || "Project image preview"}
            </Dialog.Description>

            <Dialog.Close
              aria-label="Close"
              className={`absolute right-3 top-3 z-10 rounded-full p-1.5 shadow transition ${imageOnly
                ? "bg-black/60 text-white hover:bg-black/80"
                : "bg-white/90 text-neutral-700 hover:bg-white hover:text-brand"
                }`}
            >
              <X className="h-5 w-5" />
            </Dialog.Close>

            {imageOnly ? (
              activeProject?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeProject.imageUrl}
                  alt="Project preview"
                  className="block max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)] w-auto rounded-2xl object-contain"
                />
              ) : null
            ) : (
              <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-5 overflow-y-auto p-6 sm:p-8 md:flex-row md:items-start">
                {activeProject?.imageUrl ? (
                  <div className="relative w-full shrink-0 overflow-hidden rounded-2xl bg-neutral-100 shadow-md md:w-[58%]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProject.imageUrl}
                      alt={activeProject.title || "Project preview"}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col gap-4 text-left">
                  {activeProject?.description ? (
                    <p className="font-sans leading-relaxed text-neutral-700">{activeProject.description}</p>
                  ) : null}
                  {activeProject?.link ? (
                    <a
                      href={activeProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center justify-center rounded-full bg-brand px-6 py-3 font-condensed text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
                    >
                      Launch Website
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ModalContext.Provider>
  );
}
