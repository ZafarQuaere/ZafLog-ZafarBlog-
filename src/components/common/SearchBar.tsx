"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

export function SearchBar({ placeholder = "Search posts…" }: { placeholder?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-1 dark:border-zinc-600/80 dark:bg-zinc-900/50">
      <Input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="flex-1 border-0 bg-transparent shadow-none ring-0 focus:ring-0 dark:bg-transparent"
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
