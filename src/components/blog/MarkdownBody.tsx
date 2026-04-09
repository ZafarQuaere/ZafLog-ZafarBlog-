"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const text = String(children).replace(/\n$/, "");
    const isBlock = Boolean(match) || text.includes("\n");
    if (!isBlock) {
      return (
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800" {...props}>
          {children}
        </code>
      );
    }
    const language = match?.[1] ?? "text";
    const value = text;
    return (
      <SyntaxHighlighter language={language} style={oneDark} PreTag="div" className="rounded-lg text-sm">
        {value}
      </SyntaxHighlighter>
    );
  },
  img({ src, alt }) {
    /* Markdown images use remote/arbitrary URLs — avoid next/image here */
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src ?? ""}
        alt={alt ?? ""}
        className="my-4 max-h-[480px] w-full rounded-lg object-contain"
        loading="lazy"
      />
    );
  },
};

export function MarkdownBody({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
