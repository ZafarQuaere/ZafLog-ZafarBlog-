import type { Metadata } from "next";
import { connection } from "next/server";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/common/Pagination";
import { formSelectClass } from "@/lib/form-classes";
import { getAllCategories, searchPublishedPosts } from "@/lib/posts-server";

const searchInputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Search",
};

const PAGE_SIZE = 9;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(0, Number(sp.page ?? "0") || 0);
  const categoryFilter = sp.category;

  const categories = await getAllCategories();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  let results = q ? await searchPublishedPosts(q) : [];
  if (categoryFilter) {
    results = results.filter((p) => p.category === categoryFilter);
  }

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = results.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Search</h1>
      <p className="mb-8 text-muted">
        {q ? `Results for “${q}”` : "Enter a search query in the header."}
      </p>

      <form className="mb-8 flex max-w-xl flex-col gap-3 sm:flex-row" action="/search" method="get">
        <input name="q" defaultValue={q} placeholder="Search posts…" className={searchInputClass} />
        <select name="category" defaultValue={categoryFilter ?? ""} className={`${formSelectClass} w-full sm:w-auto`}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search
        </button>
      </form>

      {!slice.length ? (
        <p className="text-zinc-600 dark:text-zinc-400">No results.</p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {slice.map((post) => (
              <PostCard key={post.id} post={post} category={categoryMap.get(post.category) ?? null} />
            ))}
          </div>
          <Pagination
            basePath="/search"
            page={page}
            totalPages={totalPages}
            searchParams={{ q: q || undefined, category: categoryFilter || undefined }}
          />
        </>
      )}
    </div>
  );
}
