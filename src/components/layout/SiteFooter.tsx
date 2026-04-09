import Link from "next/link";
import type { SiteSettings } from "@/types/settings";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-10 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{settings.title}</p>
          <p className="mt-1 max-w-md">{settings.description}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Admin
          </Link>
          <Link href="/search" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Search
          </Link>
        </div>
      </div>
    </footer>
  );
}
