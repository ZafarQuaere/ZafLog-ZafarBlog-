"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { Button } from "@/components/common/Button";
import { formatPostDate } from "@/utils/formatDate";

export default function AdminDashboardPage() {
  const [published, setPublished] = useState(0);
  const [drafts, setDrafts] = useState(0);
  const [categories, setCategories] = useState(0);
  const [recent, setRecent] = useState<
    { id: string; title: string; status: string; updatedAt?: string }[]
  >([]);

  useEffect(() => {
    void (async () => {
      const db = getFirebaseDb();
      const [pubSnap, draftSnap, catSnap, recentSnap] = await Promise.all([
        getDocs(query(collection(db, "posts"), where("status", "==", "published"))),
        getDocs(query(collection(db, "posts"), where("status", "==", "draft"))),
        getDocs(collection(db, "categories")),
        getDocs(query(collection(db, "posts"), orderBy("updatedAt", "desc"), limit(5))),
      ]);
      setPublished(pubSnap.size);
      setDrafts(draftSnap.size);
      setCategories(catSnap.size);
      setRecent(
        recentSnap.docs.map((d) => {
          const data = d.data();
          const u = data.updatedAt;
          let updatedAt: string | undefined;
          if (u && typeof u === "object" && "toDate" in u) {
            updatedAt = (u as { toDate: () => Date }).toDate().toISOString();
          }
          return {
            id: d.id,
            title: String(data.title ?? ""),
            status: String(data.status ?? ""),
            updatedAt,
          };
        }),
      );
    })();
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Welcome back — here’s a quick overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Published posts</p>
          <p className="mt-1 text-3xl font-semibold">{published}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Drafts</p>
          <p className="mt-1 text-3xl font-semibold">{drafts}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Categories</p>
          <p className="mt-1 text-3xl font-semibold">{categories}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/posts/new">
          <Button type="button">New post</Button>
        </Link>
        <Link href="/admin/categories">
          <Button type="button" variant="secondary">
            Manage categories
          </Button>
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Recent posts</h2>
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {recent.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 bg-white px-4 py-3 dark:bg-zinc-900">
              <div>
                <Link href={`/admin/posts/edit/${p.id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                  {p.title || "Untitled"}
                </Link>
                <p className="text-xs text-zinc-500">
                  {p.status} · {p.updatedAt ? formatPostDate(p.updatedAt) : "—"}
                </p>
              </div>
              <Link href={`/admin/posts/edit/${p.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                Edit
              </Link>
            </li>
          ))}
          {!recent.length ? <li className="px-4 py-6 text-sm text-zinc-500">No posts yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
