"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import imageCompression from "browser-image-compression";

type MediaRow = {
  id: string;
  url: string;
  storagePath: string;
  filename: string;
  size: number;
  contentType: string;
  createdAt?: string;
};

export default function AdminMediaPage() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const db = getFirebaseDb();
    const snap = await getDocs(query(collection(db, "media"), orderBy("createdAt", "desc")));
    setRows(
      snap.docs.map((d) => {
        const data = d.data();
        const c = data.createdAt;
        let createdAt: string | undefined;
        if (c && typeof c === "object" && "toDate" in c) {
          createdAt = (c as { toDate: () => Date }).toDate().toISOString();
        }
        return {
          id: d.id,
          url: String(data.url ?? ""),
          storagePath: String(data.storagePath ?? ""),
          filename: String(data.filename ?? ""),
          size: Number(data.size ?? 0),
          contentType: String(data.contentType ?? ""),
          createdAt,
        };
      }),
    );
  }

  useEffect(() => {
    void (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  async function onFile(file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    const compressed =
      file.type.startsWith("image/") && file.size > 500_000
        ? await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true })
        : file;
    const safe = file.name.replace(/\s+/g, "_");
    const path = file.type.startsWith("video/")
      ? `videos/library/${Date.now()}-${safe}`
      : `images/library/${Date.now()}-${safe}`;
    const storageRef = ref(getFirebaseStorage(), path);
    await uploadBytes(storageRef, compressed, { contentType: compressed.type });
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(getFirebaseDb(), "media"), {
      url,
      storagePath: path,
      filename: file.name,
      contentType: compressed.type,
      size: compressed.size,
      createdAt: serverTimestamp(),
    });
    await refresh();
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      alert("URL copied");
    } catch {
      // ignore
    }
  }

  async function remove(row: MediaRow) {
    if (!window.confirm("Delete this media item? It may still be referenced in posts.")) return;
    try {
      await deleteObject(ref(getFirebaseStorage(), row.storagePath));
    } catch {
      // ignore
    }
    await deleteDoc(doc(getFirebaseDb(), "media", row.id));
    await refresh();
  }

  const filtered = rows.filter((r) => r.filename.toLowerCase().includes(search.trim().toLowerCase()));

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Media library</h1>
          <p className="text-sm text-zinc-500">Upload assets and copy URLs into Markdown.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search filename…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="button" onClick={() => inputRef.current?.click()}>
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void onFile(f);
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
              {r.contentType.startsWith("video/") ? (
                <video src={r.url} className="h-full w-full object-cover" controls />
              ) : (
                <Image src={r.url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              )}
            </div>
            <div className="space-y-2 p-3 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{r.filename}</p>
              <p>{Math.round(r.size / 1024)} KB</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => void copyUrl(r.url)}>
                  Copy URL
                </Button>
                <Button type="button" variant="danger" className="!px-2 !py-1 text-xs" onClick={() => void remove(r)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!filtered.length ? <p className="text-sm text-zinc-500">No media found.</p> : null}
    </div>
  );
}
