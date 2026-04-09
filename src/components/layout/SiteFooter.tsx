import Link from "next/link";
import type { SiteSettings } from "@/types/settings";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-auto border-t border-border bg-zinc-50/90 py-12 text-sm text-muted dark:bg-zinc-900/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">{settings.title}</p>
          <p className="mt-1 max-w-md leading-relaxed">{settings.description}</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/admin/login" className="font-medium transition hover:text-foreground">
            Admin
          </Link>
          <Link href="/search" className="font-medium transition hover:text-foreground">
            Search
          </Link>
        </div>
      </div>
    </footer>
  );
}
