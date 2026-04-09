import Link from "next/link";
import clsx from "clsx";

export function CategoryBadge({
  name,
  slug,
  className,
}: {
  name: string;
  slug: string;
  className?: string;
}) {
  return (
    <Link
      href={`/category/${slug}`}
      className={clsx(
        "inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900 ring-1 ring-violet-200/80 transition hover:bg-violet-200/90 dark:bg-violet-950/80 dark:text-violet-100 dark:ring-violet-800 dark:hover:bg-violet-900/80",
        className,
      )}
    >
      {name}
    </Link>
  );
}
