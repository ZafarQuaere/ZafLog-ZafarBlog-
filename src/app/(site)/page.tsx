import Link from "next/link";
import { connection } from "next/server";
import { PostCard } from "@/components/blog/PostCard";
import { CategoryBadge } from "@/components/blog/CategoryBadge";
import { Pagination } from "@/components/common/Pagination";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAllCategories, getPublishedPostsPage } from "@/lib/posts-server";

const PAGE_SIZE = 9;

/** Always fetch fresh post lists so new publishes and edits show up without long ISR delays. */
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page ?? "0") || 0);
  const { posts, total } = await getPublishedPostsPage({ pageSize: PAGE_SIZE, pageIndex: page });
  const categories = await getAllCategories();
  const adminDbReady = getAdminDb() !== null;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <div className="flex-1">
        <section className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Latest posts</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Stories, tutorials, and updates.</p>
        </section>

        {!posts.length ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {adminDbReady ? (
              <>No published posts yet. Create and publish a post from the admin panel.</>
            ) : (
              <>
                No published posts yet. Add{" "}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">FIREBASE_SERVICE_ACCOUNT_KEY</code>{" "}
                in <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code> for server-side
                listing, then publish from the admin panel.
              </>
            )}
          </p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} category={categoryMap.get(post.category) ?? null} />
              ))}
            </div>
            <Pagination basePath="/" page={page} totalPages={totalPages} />
          </>
        )}
      </div>

      <aside className="w-full shrink-0 lg:w-64">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Categories</h2>
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li key={c.id}>
              <CategoryBadge name={c.name} slug={c.slug} className="w-full justify-center" />
            </li>
          ))}
          {!categories.length ? <li className="text-sm text-zinc-500">No categories yet.</li> : null}
        </ul>
        <Link
          href="/admin"
          className="mt-6 inline-block text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Manage content →
        </Link>
      </aside>
    </div>
  );
}
