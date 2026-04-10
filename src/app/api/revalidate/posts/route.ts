import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

type RevalidateBody = {
  slug?: string;
  previousSlug?: string;
  categorySlug?: string;
  previousCategorySlug?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RevalidateBody | null;

  // Collect literal paths to revalidate (catches ISR-cached specific pages).
  const literalPaths = new Set<string>(["/", "/search"]);
  if (body?.slug) literalPaths.add(`/blog/${body.slug}`);
  if (body?.previousSlug) literalPaths.add(`/blog/${body.previousSlug}`);
  if (body?.categorySlug) literalPaths.add(`/category/${body.categorySlug}`);
  if (body?.previousCategorySlug) literalPaths.add(`/category/${body.previousCategorySlug}`);

  for (const path of literalPaths) {
    revalidatePath(path);
  }

  // Revalidate the dynamic page patterns to purge ALL cached slug variants.
  // Using type:'page' correctly handles the [slug] dynamic segment.
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/category/[slug]", "page");

  // Revalidate the (site) layout — this cascades to every page under it
  // and is the most reliable way to flush the whole public site cache.
  revalidatePath("/(site)", "layout");

  // Revalidate the sitemap so it reflects the latest published posts.
  revalidatePath("/sitemap.xml");

  return NextResponse.json({
    revalidated: true,
    literalPaths: [...literalPaths],
    patterns: ["/blog/[slug]", "/category/[slug]", "/(site)"],
  });
}
