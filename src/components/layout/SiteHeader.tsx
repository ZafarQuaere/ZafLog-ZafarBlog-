import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import type { SiteSettings } from "@/types/settings";
import { DarkModeToggle } from "@/components/common/DarkModeToggle";
import { SearchBar } from "@/components/common/SearchBar";

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
            {settings.logo ? (
              <Image src={settings.logo} alt="" width={36} height={36} className="rounded-md" />
            ) : null}
            <span>{settings.title}</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1.5 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800/90 dark:hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-2.5 py-1.5 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800/90 dark:hover:text-white"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="rounded-lg px-2.5 py-1.5 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800/90 dark:hover:text-white"
            >
              Contact
            </Link>
            <Link
              href="/search"
              className="rounded-lg px-2.5 py-1.5 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800/90 dark:hover:text-white"
            >
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
