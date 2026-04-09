import type { Post } from "@/types/post";
import type { Category } from "@/types/category";
import { PostCard } from "@/components/blog/PostCard";

export function RelatedPosts({
  posts,
  categoryMap,
}: {
  posts: Post[];
  categoryMap: Map<string, Category>;
}) {
  if (!posts.length) return null;
  return (
    <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Related posts</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} category={categoryMap.get(p.category) ?? null} />
        ))}
      </div>
    </section>
  );
}
