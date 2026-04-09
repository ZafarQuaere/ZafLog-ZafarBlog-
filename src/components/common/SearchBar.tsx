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
    <form onSubmit={onSubmit} className="flex w-full max-w-md gap-2">
      <Input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
