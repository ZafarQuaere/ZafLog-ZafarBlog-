import { MarkdownBody } from "@/components/blog/MarkdownBody";

export function PostContent({ content }: { content: string }) {
  return (
    <div
      className={
        "prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-24 " +
        "prose-p:leading-relaxed prose-p:text-zinc-700 dark:prose-p:text-zinc-300 " +
        "prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 " +
        "prose-a:text-blue-600 prose-pre:bg-transparent prose-pre:p-0 dark:prose-a:text-blue-400"
      }
    >
      <MarkdownBody content={content} />
    </div>
  );
}
