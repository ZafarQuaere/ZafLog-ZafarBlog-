"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export function FeaturedImageField({
  postId,
  value,
  onChange,
}: {
  postId: string;
  value: { url: string; alt: string; storagePath: string };
  onChange: (v: { url: string; alt: string; storagePath: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const ext = compressed.type.split("/")[1] || "jpg";
      const path = `images/featured/${postId}/featured.${ext}`;
      const storageRef = ref(getFirebaseStorage(), path);
      if (value.storagePath && value.storagePath !== path) {
        try {
          await deleteObject(ref(getFirebaseStorage(), value.storagePath));
        } catch {
          // ignore
        }
      }
      await uploadBytes(storageRef, compressed, { contentType: compressed.type });
      const url = await getDownloadURL(storageRef);
      onChange({ url, alt: value.alt || file.name.replace(/\.[^.]+$/, ""), storagePath: path });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Featured image</p>
      <div
        className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition ${
          drag ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900" : "border-zinc-300 dark:border-zinc-600"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {value.url ? (
          <div className="relative h-48 w-full max-w-lg">
            <Image src={value.url} alt={value.alt || ""} fill className="object-contain" />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{busy ? "Uploading…" : "Drop an image here or click to browse"}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          Replace
        </Button>
        {value.storagePath ? (
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              try {
                await deleteObject(ref(getFirebaseStorage(), value.storagePath));
              } catch {
                // ignore
              }
              onChange({ url: "", alt: "", storagePath: "" });
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Alt text</label>
        <Input value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
      </div>
    </div>
  );
}
