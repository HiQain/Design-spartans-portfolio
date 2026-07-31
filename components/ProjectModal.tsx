"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppleLogo, GooglePlay, X } from "./icons";

export interface ModalProject {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  playStoreLink?: string;
  appStoreLink?: string;
  isFlipCard?: boolean;
  secondaryImageUrl?: string;
}

// Rendered iframe size, in the site's own desktop-layout coordinate space - the iframe
// is drawn at full desktop width, then visually scaled down to fit the preview box, so
// the embedded site always renders its desktop breakpoint instead of a squished mobile one.
const DESKTOP_WIDTH = 1440;
const DESKTOP_HEIGHT = 2000;

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function WebsitePreview({
  link,
  title,
  loaded,
  onLoad,
  wide,
}: {
  link: string;
  title: string;
  loaded: boolean;
  onLoad: () => void;
  wide: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateScale = () => setScale(el.clientWidth / DESKTOP_WIDTH);
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl shadow-md md:flex-none ${wide ? "" : "md:w-[58%]"
        }`}
    >
      <div className="flex shrink-0 items-center gap-1.5 bg-neutral-800 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <div className="ml-2 min-w-0 flex-1 truncate rounded bg-neutral-700 px-2 py-0.5 text-center font-sans text-[10px] text-neutral-300">
          {getHostname(link)}
        </div>
      </div>
      <div
        ref={viewportRef}
        className={`relative w-full flex-1 overflow-hidden bg-neutral-100 ${wide
          ? "min-h-[160px] sm:min-h-[420px] md:min-h-[520px]"
          : "min-h-[240px] sm:min-h-[300px] md:min-h-[340px]"
          }`}
      >
        {scale > 0 ? (
          <div
            className="absolute left-0 top-0"
            style={{ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left" }}
          >
            <iframe
              key={link}
              src={link}
              title={title || "Website preview"}
              scrolling="no"
              tabIndex={-1}
              loading="eager"
              onLoad={onLoad}
              style={{ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT }}
              className={`website-autoscroll-frame pointer-events-none border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
                }`}
            />
          </div>
        ) : null}
        {!loaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-brand" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FlipCard({
  imageUrl,
  secondaryImageUrl,
  title,
}: {
  imageUrl: string;
  secondaryImageUrl: string;
  title: string;
}) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Size the box to the image's own aspect ratio (capped to a max footprint) instead
  // of a fixed shape, so portrait cards and landscape mockups alike fill it exactly
  // with no empty letterboxing on the sides.
  const maxBox = isDesktop ? 416 : 260;
  let boxWidth = maxBox;
  let boxHeight = maxBox;
  if (natural && natural.w > 0 && natural.h > 0) {
    const ratio = natural.w / natural.h;
    if (ratio >= 1) {
      boxWidth = maxBox;
      boxHeight = maxBox / ratio;
    } else {
      boxHeight = maxBox;
      boxWidth = maxBox * ratio;
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 sm:p-10">
      <div className="[perspective:1600px]">
        <div
          className="relative animate-[spin3d_7s_linear_infinite] [transform-style:preserve-3d]"
          style={{ width: boxWidth, height: boxHeight }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] [backface-visibility:hidden]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={title || "Preview"}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
                  }
                }}
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {secondaryImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondaryImageUrl}
                alt={title ? `${title} (back)` : "Preview (back)"}
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
        </div>
      </div>
      {title ? (
        <p className="font-condensed text-base font-semibold uppercase tracking-wide text-white sm:text-lg">{title}</p>
      ) : null}
    </div>
  );
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
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const value = useMemo<ModalContextValue>(
    () => ({
      openProject: (project: ModalProject) => {
        setIframeLoaded(false);
        setActiveProject(project);
        setOpen(true);
      },
    }),
    []
  );

  const isFlipCard = Boolean(activeProject?.isFlipCard);
  const hasSideContent = Boolean(activeProject?.description || activeProject?.link);
  // No description/link to fill a second column - show a bare, edge-to-edge image
  // (with Play Store/App Store buttons overlaid on it, if present) instead of the
  // padded white two-column card.
  const imageOnly = !isFlipCard && !hasSideContent;
  // Nothing to show in the sidebar column (no description/store links) - show a bare
  // edge-to-edge website preview instead of the padded white card.
  const hasSidebarPanel = Boolean(
    activeProject?.description || activeProject?.playStoreLink || activeProject?.appStoreLink
  );
  const wide = !isFlipCard && !imageOnly && !hasSidebarPanel;
  const bare = isFlipCard || imageOnly || wide;

  return (
    <ModalContext.Provider value={value}>
      {children}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content
            className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 focus:outline-none ${isFlipCard
              ? "max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] w-fit"
              : imageOnly
                ? "max-h-[calc(100vh-5rem)] max-w-[calc(100vw-1rem)] w-fit"
                : wide
                  ? "flex max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)] w-[90vw] sm:w-fit flex-col overflow-hidden"
                  : "flex max-h-[calc(100vh-3rem)] max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-w-5xl"
              }`}
          >
            {!bare && activeProject?.title ? (
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
              className={`absolute right-3 top-3 z-10 rounded-full p-1.5 shadow transition ${bare
                ? "bg-black/60 text-white hover:bg-black/80"
                : "bg-white/90 text-neutral-700 hover:bg-white hover:text-brand"
                }`}
            >
              <X className="h-5 w-5" />
            </Dialog.Close>

            {isFlipCard ? (
              <FlipCard
                key={activeProject?.imageUrl}
                imageUrl={activeProject?.imageUrl ?? ""}
                secondaryImageUrl={activeProject?.secondaryImageUrl ?? ""}
                title={activeProject?.title ?? ""}
              />
            ) : imageOnly ? (
              activeProject?.imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeProject.imageUrl}
                    alt={activeProject.title || "Project preview"}
                    className="block max-h-[calc(100vh-5rem)] max-w-[calc(100vw-1rem)] w-auto rounded-2xl object-contain"
                  />

                  {activeProject?.playStoreLink || activeProject?.appStoreLink ? (
                    <div className="absolute inset-x-0 bottom-0 flex flex-nowrap items-center justify-center gap-2 rounded-b-2xl bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pb-3 pt-10 sm:gap-3 sm:pb-4">
                      {activeProject?.playStoreLink ? (
                        <a
                          href={activeProject.playStoreLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-white shadow-lg transition hover:bg-neutral-800 sm:gap-2 sm:px-4 sm:py-2"
                        >
                          <GooglePlay className="h-5 w-5 shrink-0 sm:h-7 sm:w-7" />
                          <span className="flex flex-col items-start leading-none">
                            <span className="font-sans text-[7px] uppercase tracking-wide text-neutral-300 sm:text-[10px]">
                              Get it on
                            </span>
                            <span className="font-sans text-[11px] font-semibold sm:text-sm">Google Play</span>
                          </span>
                        </a>
                      ) : null}
                      {activeProject?.appStoreLink ? (
                        <a
                          href={activeProject.appStoreLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-white shadow-lg transition hover:bg-neutral-800 sm:gap-2 sm:px-4 sm:py-2"
                        >
                          <AppleLogo className="h-4 w-4 shrink-0 sm:h-6 sm:w-6" />
                          <span className="flex flex-col items-start leading-none">
                            <span className="font-sans text-[7px] uppercase tracking-wide text-neutral-300 sm:text-[10px]">
                              Download on the
                            </span>
                            <span className="font-sans text-[11px] font-semibold sm:text-sm">App Store</span>
                          </span>
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null
            ) : wide ? (
              <div className="flex min-h-0 flex-1 flex-col items-center gap-4 p-3 sm:p-4">
                <div className="w-full sm:w-[64rem]">
                  <WebsitePreview
                    link={activeProject!.link}
                    title={activeProject!.title}
                    loaded={iframeLoaded}
                    onLoad={() => setIframeLoaded(true)}
                    wide
                  />
                </div>
                <div className="flex shrink-0 justify-center">
                  <a
                    href={activeProject!.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center justify-center rounded-full bg-brand px-6 py-3 font-condensed text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
                  >
                    Launch Website
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-5 p-6 sm:p-8">
                <div className="flex min-h-0 flex-1 flex-col gap-5 md:flex-row">
                  {activeProject?.link ? (
                    <WebsitePreview
                      link={activeProject.link}
                      title={activeProject.title}
                      loaded={iframeLoaded}
                      onLoad={() => setIframeLoaded(true)}
                      wide={wide}
                    />
                  ) : activeProject?.imageUrl ? (
                    <div
                      className={`relative w-full shrink-0 overflow-hidden rounded-2xl bg-neutral-100 shadow-md md:min-h-0 ${wide ? "" : "md:w-[58%]"
                        }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeProject.imageUrl}
                        alt={activeProject.title || "Project preview"}
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  ) : null}

                  {activeProject?.description || activeProject?.playStoreLink || activeProject?.appStoreLink ? (
                    <div className="flex min-w-0 shrink-0 flex-col gap-4 text-left md:min-h-0 md:flex-1">
                      {activeProject?.description ? (
                        <p className="font-sans leading-relaxed text-neutral-700">{activeProject.description}</p>
                      ) : null}
                      {activeProject?.playStoreLink || activeProject?.appStoreLink ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {activeProject?.playStoreLink ? (
                            <a
                              href={activeProject.playStoreLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white shadow-lg transition hover:bg-neutral-800"
                            >
                              <GooglePlay className="h-7 w-7 shrink-0" />
                              <span className="flex flex-col items-start leading-none">
                                <span className="font-sans text-[10px] uppercase tracking-wide text-neutral-300">
                                  Get it on
                                </span>
                                <span className="font-sans text-sm font-semibold">Google Play</span>
                              </span>
                            </a>
                          ) : null}
                          {activeProject?.appStoreLink ? (
                            <a
                              href={activeProject.appStoreLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white shadow-lg transition hover:bg-neutral-800"
                            >
                              <AppleLogo className="h-6 w-6 shrink-0" />
                              <span className="flex flex-col items-start leading-none">
                                <span className="font-sans text-[10px] uppercase tracking-wide text-neutral-300">
                                  Download on the
                                </span>
                                <span className="font-sans text-sm font-semibold">App Store</span>
                              </span>
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {activeProject?.link ? (
                  <div className="flex shrink-0 justify-center">
                    <a
                      href={activeProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center justify-center rounded-full bg-brand px-6 py-3 font-condensed text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
                    >
                      Launch Website
                    </a>
                  </div>
                ) : null}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ModalContext.Provider>
  );
}
