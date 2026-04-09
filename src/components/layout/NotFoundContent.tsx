import Link from "next/link";

/** Inner 404 card — use inside `(site)/layout` (no duplicate header/footer). */
export function NotFoundContent() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center md:py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface px-8 py-12 shadow-xl shadow-zinc-900/8 dark:shadow-black/50">
        <p className="bg-gradient-to-br from-violet-600 to-indigo-600 bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-7xl">
          404
        </p>
        <div className="mx-auto my-6 h-px w-20 bg-gradient-to-r from-transparent via-border to-transparent" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">This page could not be found.</h1>
        <p className="mt-3 text-pretty text-muted leading-relaxed">
          The link may be broken, or the page may have been removed.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
