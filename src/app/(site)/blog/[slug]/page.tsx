import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostContent } from "@/components/blog/PostContent";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CategoryBadge } from "@/components/blog/CategoryBadge";
import {
  getAllCategories,
  getPostBySlugPublic,
  getRecentPublishedPosts,
  getRelatedPosts,
} from "@/lib/posts-server";
import { formatPostDate } from "@/utils/formatDate";
import { estimateReadTimeMinutes } from "@/utils/readTime";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { getAllPublishedSlugs } = await import("@/lib/posts-server");
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

// When no Admin SDK is configured at build time, still allow on-demand rendering.
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugPublic(slug);
  if (!post) return { title: "Not found" };
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      publishedTime: post.publishedAt ?? undefined,
      images: post.featuredImage?.url ? [{ url: post.featuredImage.url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage?.url ? [post.featuredImage.url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlugPublic(slug);
  if (!post) notFound();

  const categories = await getAllCategories();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const category = categoryMap.get(post.category) ?? null;

  let related = await getRelatedPosts(post.category, post.id);
  if (related.length < 3) {
    const recent = await getRecentPublishedPosts(12);
    const merged = [...related];
    for (const p of recent) {
      if (p.id === post.id) continue;
      if (merged.some((m) => m.id === p.id)) continue;
      merged.push(p);
      if (merged.length >= 3) break;
    }
    related = merged.slice(0, 3);
  }

  const readTime = estimateReadTimeMinutes(post.content);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const shareUrl = `${siteUrl}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.featuredImage?.url ? [post.featuredImage.url] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          {category ? (
            <>
              <li>
                <Link href={`/category/${category.slug}`} className="hover:text-zinc-800 dark:hover:text-zinc-200">
                  {category.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          ) : null}
          <li className="text-zinc-800 dark:text-zinc-200">{post.title}</li>
        </ol>
      </nav>

      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {category ? <CategoryBadge name={category.name} slug={category.slug} /> : null}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatPostDate(post.publishedAt)} · {readTime} min read
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">{post.title}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          By <span className="font-medium text-zinc-900 dark:text-zinc-100">{post.author.name}</span>
        </p>
      </header>

      {post.featuredImage?.url ? (
        <div className="relative mb-10 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1152px) 100vw, 1152px"
          />
        </div>
      ) : null}

      <PostContent content={post.content} />

      <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <ShareButtons title={post.title} url={shareUrl} />
      </div>

      <RelatedPosts posts={related} categoryMap={categoryMap} />
    </article>
  );
}
