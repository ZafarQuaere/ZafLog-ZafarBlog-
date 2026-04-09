"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { MarkdownBody } from "@/components/blog/MarkdownBody";
import { Bold, Code, Heading2, Heading3, Italic, Link2, List, ListOrdered, Maximize2, Minimize2 } from "lucide-react";

export function MarkdownEditor({
  value,
  onChange,
  onInsertImage,
}: {
  value: string;
  onChange: (next: string) => void;
  onInsertImage?: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<"split" | "write" | "preview">("split");
  const [fullscreen, setFullscreen] = useState(false);

  function replaceSelection(transform: (sel: string, start: number, end: number) => { next: string; caret: number }) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end);
    const { next, caret } = transform(sel, start, end);
    onChange(next);
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function wrap(b: string, a: string = b) {
    replaceSelection((sel, start, end) => ({
      next: value.slice(0, start) + b + sel + a + value.slice(end),
      caret: start + b.length + sel.length + a.length,
    }));
  }

  function insertAtLineStart(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      const caret = start + prefix.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col gap-3 bg-white p-4 dark:bg-zinc-950"
          : "flex flex-col gap-3"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" className="!px-2" onClick={() => wrap("**", "**")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" className="!px-2" onClick={() => wrap("_", "_")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" className="!px-2" onClick={() => insertAtLineStart("## ")} title="H2">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" className="!px-2" onClick={() => insertAtLineStart("### ")} title="H3">
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="!px-2"
          onClick={() => insertAtLineStart("- ")}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="!px-2"
          onClick={() => insertAtLineStart("1. ")}
          title="Ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" className="!px-2" onClick={() => wrap("[", "](url)")} title="Link">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" className="!px-2" onClick={() => wrap("`", "`")} title="Code">
          <Code className="h-4 w-4" />
        </Button>
        {onInsertImage ? (
          <Button type="button" variant="secondary" onClick={onInsertImage}>
            Image
          </Button>
        ) : null}
        <div className="mx-2 hidden h-6 w-px bg-zinc-200 sm:block dark:bg-zinc-700" />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="split">Side by side</option>
          <option value="write">Write</option>
          <option value="preview">Preview</option>
        </select>
        <Button type="button" variant="ghost" className="!px-2" onClick={() => setFullscreen((f) => !f)}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <div
        className={
          mode === "split"
            ? "grid min-h-[420px] flex-1 gap-4 lg:grid-cols-2"
            : "flex min-h-[420px] flex-1 flex-col"
        }
      >
        {(mode === "write" || mode === "split") && (
          <Textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[420px] flex-1 font-mono text-sm leading-relaxed"
            placeholder="Write in Markdown…"
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div className="max-h-full overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownBody content={value || "_Nothing to preview yet._"} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
