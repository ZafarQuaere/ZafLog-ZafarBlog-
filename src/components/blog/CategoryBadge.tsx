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
        "inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
        className,
      )}
    >
      {name}
    </Link>
  );
}
