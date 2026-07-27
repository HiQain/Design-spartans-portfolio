import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-brand text-6xl">404</p>
      <h1 className="section-heading mt-6 text-2xl sm:text-3xl">Page Not Found</h1>
      <p className="mt-6 max-w-md font-condensed text-lg text-neutral-600">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-brand px-8 py-3 font-condensed text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
      >
        Back to Home
      </Link>
    </main>
  );
}
