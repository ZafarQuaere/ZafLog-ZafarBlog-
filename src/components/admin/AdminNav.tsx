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
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <Link href="/admin" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Admin
        </Link>
        <p className="text-xs text-zinc-500">Blog CMS</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              pathname === l.href
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
        <Link
          href="/"
          className="mb-2 block rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
