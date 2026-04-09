"use client";

import { Link2 } from "lucide-react";
import { Button } from "@/components/common/Button";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  const links = [
    { href: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`, label: "X / Twitter" },
    { href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, label: "Facebook" },
    { href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, label: "LinkedIn" },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Share:</span>
      {links.map(({ href, label }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="secondary" className="!px-3 !py-1 text-xs" aria-label={`Share on ${label}`}>
            {label}
          </Button>
        </a>
      ))}
      <Button type="button" variant="ghost" className="!px-2" onClick={copyLink} aria-label="Copy link">
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
