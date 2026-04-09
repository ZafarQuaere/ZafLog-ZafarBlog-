import type { Metadata } from "next";
import { PostContent } from "@/components/blog/PostContent";
import { getPageDocServer } from "@/lib/posts-server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const data = await getPageDocServer("about");
  const content = String(data?.content ?? "_Add your About page content from the admin panel._");

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">About</h1>
      <PostContent content={content} />
    </div>
  );
}
