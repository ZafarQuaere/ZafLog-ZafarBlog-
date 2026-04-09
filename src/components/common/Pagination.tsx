import Link from "next/link";
import clsx from "clsx";

export function Pagination({
  basePath,
  page,
  totalPages,
  searchParams,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const qs = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams ?? {}).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  const prev = Math.max(0, page - 1);
  const next = Math.min(totalPages - 1, page + 1);

  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
      <PaginationLink href={qs(prev)} disabled={page <= 0}>
        Previous
      </PaginationLink>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Page <span className="font-medium text-zinc-900 dark:text-zinc-100">{page + 1}</span> of{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
      </span>
      <PaginationLink href={qs(next)} disabled={page >= totalPages - 1}>
        Next
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  children,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="rounded-md px-3 py-1 text-sm text-zinc-400 dark:text-zinc-600">{children}</span>
    );
  }
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800",
      )}
    >
      {children}
    </Link>
  );
}
