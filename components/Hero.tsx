import Image from "next/image";
import type { TopContent } from "@/lib/types";

export default function Hero({ topContent }: { topContent: TopContent | null }) {
  const title = topContent?.title || "Our Recent Projects";
  const description =
    topContent?.content ||
    "Everyone can talk the talk but hardly anyone follows it through. That’s where the Design Spartans differ! Just like the Spartans from back in the day, our digital warriors never back down from a challenge and only stop when the client admits total satisfaction. Have a look at what we can do!";

  return (
    <section className="relative overflow-hidden bg-[#0a0e1a] py-14 sm:py-20">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff26 1px, transparent 1px), linear-gradient(to bottom, #ffffff26 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-brand/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-accent/30 blur-[100px]" />

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <div className="mx-auto mb-8 h-36 w-36 sm:h-44 sm:w-44">
          <Image
            src="/logo.webp"
            alt="Design Spartans"
            width={165}
            height={165}
            priority
            className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          />
        </div>

        <h1 className="font-display text-3xl uppercase tracking-wide text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>

        <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand to-accent" />

        <p className="mt-6 text-lg leading-relaxed text-white/70 font-condensed">{description}</p>
      </div>
    </section>
  );
}
