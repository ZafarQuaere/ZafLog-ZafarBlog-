import { MarkdownBody } from "@/components/blog/MarkdownBody";

export function PostContent({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-pre:bg-transparent prose-pre:p-0 dark:prose-a:text-blue-400">
      <MarkdownBody content={content} />
    </div>
  );
}
