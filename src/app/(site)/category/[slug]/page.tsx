import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/common/Pagination";
import { getAllCategories, getPostsByCategorySlug } from "@/lib/posts-server";

const PAGE_SIZE = 9;

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getAllCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Category" };
  return {
    title: cat.name,
    description: cat.description || `Posts in ${cat.name}`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page ?? "0") || 0);
  const { posts, total, category } = await getPostsByCategorySlug(slug, PAGE_SIZE, page);
  if (!category) notFound();

  const categories = await getAllCategories();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{category.description}</p>
        ) : null}
      </header>

      {!posts.length ? (
        <p className="text-zinc-600 dark:text-zinc-400">No posts in this category yet.</p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} category={categoryMap.get(post.category) ?? null} />
            ))}
          </div>
          <Pagination basePath={`/category/${slug}`} page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
