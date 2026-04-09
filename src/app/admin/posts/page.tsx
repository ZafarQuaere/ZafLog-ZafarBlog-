"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { formatPostDate } from "@/utils/formatDate";
import { formSelectClass } from "@/lib/form-classes";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  featuredUrl?: string;
  updatedAt?: string;
  storagePath?: string;
};

const PAGE_SIZE = 10;

export default function AdminPostsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const db = getFirebaseDb();
      const [postSnap, catSnap] = await Promise.all([
        getDocs(query(collection(db, "posts"), orderBy("updatedAt", "desc"))),
        getDocs(collection(db, "categories")),
      ]);
      const cats = catSnap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? "") }));
      setCategories(cats);
      setRows(
        postSnap.docs.map((d) => {
          const data = d.data();
          const u = data.updatedAt;
          let updatedAt: string | undefined;
          if (u && typeof u === "object" && "toDate" in u) {
            updatedAt = (u as { toDate: () => Date }).toDate().toISOString();
          }
          return {
            id: d.id,
            title: String(data.title ?? ""),
            slug: String(data.slug ?? ""),
            status: String(data.status ?? ""),
            category: String(data.category ?? ""),
            featuredUrl: String(data.featuredImage?.url ?? ""),
            storagePath: String(data.featuredImage?.storagePath ?? ""),
            updatedAt,
          };
        }),
      );
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (search.trim() && !r.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [rows, statusFilter, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    pageRows.forEach((r) => {
      next[r.id] = checked;
    });
    setSelected((s) => ({ ...s, ...next }));
  }

  async function bulkDelete() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} post(s)?`)) return;
    const batch = writeBatch(getFirebaseDb());
    for (const id of ids) {
      const row = rows.find((r) => r.id === id);
      if (row?.storagePath) {
        try {
          await deleteObject(ref(getFirebaseStorage(), row.storagePath));
        } catch {
          // ignore
        }
      }
      batch.delete(doc(getFirebaseDb(), "posts", id));
    }
    await batch.commit();
    setRows((r) => r.filter((x) => !ids.includes(x.id)));
    setSelected({});
  }

  async function deleteOne(id: string) {
    if (!window.confirm("Delete this post?")) return;
    const row = rows.find((r) => r.id === id);
    if (row?.storagePath) {
      try {
        await deleteObject(ref(getFirebaseStorage(), row.storagePath));
      } catch {
        // ignore
      }
    }
    await deleteDoc(doc(getFirebaseDb(), "posts", id));
    setRows((r) => r.filter((x) => x.id !== id));
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  if (loading) return <p className="text-sm text-zinc-500">Loading posts…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Posts</h1>
          <p className="text-sm text-muted">Manage, filter, and publish content.</p>
        </div>
        <Link href="/admin/posts/new">
          <Button type="button">New post</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className={`${formSelectClass} w-auto min-w-[11rem]`}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(0);
          }}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          className={`${formSelectClass} w-auto min-w-[12rem]`}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Search title…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <Button type="button" variant="danger" onClick={() => void bulkDelete()}>
          Delete selected
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60">
            <tr>
              <th className="px-3 py-2 text-left">
                <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} aria-label="Select all on page" />
              </th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300">Image</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300">Title</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300">Category</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300">Status</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300">Date</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-600 dark:text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!selected[r.id]}
                    onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.checked }))}
                    aria-label={`Select ${r.title}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="relative h-12 w-16 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                    {r.featuredUrl ? (
                      <Image src={r.featuredUrl} alt="" fill className="object-cover" sizes="64px" />
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">{r.title || "Untitled"}</td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{catName(r.category)}</td>
                <td className="px-3 py-2 capitalize text-zinc-600 dark:text-zinc-300">{r.status}</td>
                <td className="px-3 py-2 text-zinc-500">{r.updatedAt ? formatPostDate(r.updatedAt) : "—"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/posts/edit/${r.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                      Edit
                    </Link>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => void deleteOne(r.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!pageRows.length ? (
          <p className="p-6 text-center text-sm text-zinc-500">No posts match your filters.</p>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="secondary"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {safePage + 1} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
