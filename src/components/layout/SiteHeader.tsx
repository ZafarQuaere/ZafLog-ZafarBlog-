import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import type { SiteSettings } from "@/types/settings";
import { DarkModeToggle } from "@/components/common/DarkModeToggle";
import { SearchBar } from "@/components/common/SearchBar";

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
            {settings.logo ? (
              <Image src={settings.logo} alt="" width={36} height={36} className="rounded-md" />
            ) : null}
            <span>{settings.title}</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300 md:flex">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white">
              Home
            </Link>
            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-white">
              About
            </Link>
            <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white">
              Contact
            </Link>
            <Link href="/search" className="hover:text-zinc-900 dark:hover:text-white">
              Search
            </Link>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1 md:max-w-xs">
            <Suspense fallback={<div className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" aria-hidden />}>
              <SearchBar />
            </Suspense>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
