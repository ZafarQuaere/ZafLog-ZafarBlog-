"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/common/Button";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200/80 bg-zinc-900 text-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-700/50 p-5">
        <Link href="/admin" className="text-lg font-semibold tracking-tight text-white">
          Admin
        </Link>
        <p className="mt-0.5 text-xs text-zinc-400">Blog CMS</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "rounded-lg px-3 py-2.5 text-sm font-medium transition",
              pathname === l.href
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-700/50 p-2">
        <Link
          href="/"
          className="mb-2 block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          View site
        </Link>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => signOut(getFirebaseAuth())}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
