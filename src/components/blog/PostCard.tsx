import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/types/post";
import type { Category } from "@/types/category";
import { CategoryBadge } from "@/components/blog/CategoryBadge";
import { formatPostDate } from "@/utils/formatDate";
import { estimateReadTimeMinutes } from "@/utils/readTime";
import { truncateText } from "@/utils/truncate";

export function PostCard({
  post,
  category,
}: {
  post: Post;
  category?: Category | null;
}) {
  const readTime = estimateReadTimeMinutes(post.content);
  const excerpt = post.excerpt || truncateText(post.content.replace(/```[\s\S]*?```/g, ""), 150);
  const displayDate = post.publishedAt ?? post.updatedAt ?? post.createdAt;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/blog/${post.slug}`} className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {post.featuredImage?.url ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {category ? <CategoryBadge name={category.name} slug={category.slug} /> : null}
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatPostDate(displayDate)} · {readTime} min read
          </span>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
            {post.title}
          </h2>
        </Link>
        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{excerpt}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Read more
        </Link>
      </div>
    </article>
  );
}
