"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { formSelectClass } from "@/lib/form-classes";
import { slugifyTitle } from "@/utils/slugify";
import { excerptFromContent } from "@/utils/truncate";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { FeaturedImageField } from "@/components/admin/FeaturedImageField";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import imageCompression from "browser-image-compression";

type Status = "draft" | "published";

async function revalidatePostViews(payload: {
  slug?: string;
  previousSlug?: string;
  categorySlug?: string;
  previousCategorySlug?: string;
}) {
  try {
    await fetch("/api/revalidate/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Public routes are rendered request-time, so a failed revalidation request
    // should not block the editor flow.
  }
}

export function PostEditor({ postId: initialPostId }: { postId?: string }) {
  const router = useRouter();
  const generatedId = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `post-${Date.now()}`;
  }, []);
  const postId = initialPostId ?? generatedId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categorySlugMap, setCategorySlugMap] = useState<Record<string, string>>({});
  const [featured, setFeatured] = useState({ url: "", alt: "", storagePath: "" });
  const [savedStatus, setSavedStatus] = useState<Status>("draft");
  const [loading, setLoading] = useState(!!initialPostId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  /**
   * Tracks whether the post data has finished loading.
   * Autosave MUST NOT fire until this is true — otherwise it races with the
   * loading useEffect and can write `status: 'draft'` to a published post
   * before the real status is read from Firestore.
   */
  const loadedRef = useRef(!initialPostId);
  const stateRef = useRef({
    title,
    slug,
    content,
    category,
    featured,
    savedStatus,
    postId,
    initialPostId,
  });

  useEffect(() => {
    stateRef.current = { title, slug, content, category, featured, savedStatus, postId, initialPostId };
  }, [title, slug, content, category, featured, savedStatus, postId, initialPostId]);

  useEffect(() => {
    void (async () => {
      const snap = await getDocs(collection(getFirebaseDb(), "categories"));
      const nextCategories = snap.docs.map((d) => ({
        id: d.id,
        name: String(d.data().name ?? ""),
        slug: String(d.data().slug ?? ""),
      }));
      setCategories(nextCategories.map(({ id, name }) => ({ id, name })));
      setCategorySlugMap(
        Object.fromEntries(nextCategories.map(({ id, slug }) => [id, slug])),
      );
    })();
  }, []);

  useEffect(() => {
    if (!initialPostId) return;
    void (async () => {
      const d = await getDoc(doc(getFirebaseDb(), "posts", initialPostId));
      if (!d.exists()) {
        setLoading(false);
        // Mark as loaded even on not-found so autosave won't be blocked.
        loadedRef.current = true;
        setMessage("Post not found.");
        return;
      }
      const data = d.data();
      setTitle(String(data.title ?? ""));
      setSlug(String(data.slug ?? ""));
      setSlugTouched(true);
      setContent(String(data.content ?? ""));
      setCategory(String(data.category ?? ""));
      setFeatured({
        url: String(data.featuredImage?.url ?? ""),
        alt: String(data.featuredImage?.alt ?? ""),
        storagePath: String(data.featuredImage?.storagePath ?? ""),
      });
      const loadedStatus = data.status === "published" ? "published" : "draft";
      setSavedStatus(loadedStatus);
      // Update stateRef immediately so the autosave interval sees the correct
      // status as soon as loading finishes — before the next React render cycle.
      stateRef.current.savedStatus = loadedStatus;
      setLoading(false);
      // Only allow autosave AFTER we have the real status from Firestore.
      loadedRef.current = true;
    })();
  }, [initialPostId]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugifyTitle(title));
  }, [title, slugTouched]);

  const persist = useCallback(
    async (nextStatus: Status, silent?: boolean) => {
      const s = stateRef.current;
      if (savingRef.current) {
        return false;
      }
      if (!s.title.trim()) {
        if (!silent) setMessage("Title is required");
        return false;
      }
      if (!s.slug.trim()) {
        if (!silent) setMessage("Slug is required");
        return false;
      }
      if (!s.category) {
        if (!silent) setMessage("Category is required");
        return false;
      }
      if (!s.featured.url) {
        if (!silent) setMessage("Featured image is required");
        return false;
      }

      savingRef.current = true;
      setSaving(true);
      try {
        const db = getFirebaseDb();
        const qslug = query(collection(db, "posts"), where("slug", "==", s.slug), limit(5));
        const snap = await getDocs(qslug);
        const conflict = snap.docs.some((d) => d.id !== s.postId);
        if (conflict) {
          if (!silent) setMessage("Slug already exists");
          return false;
        }

        const user = getFirebaseAuth().currentUser;
        const refDoc = doc(db, "posts", s.postId);
        const existingSnap = await getDoc(refDoc);
        const excerpt = excerptFromContent(s.content);
        const payload: Record<string, unknown> = {
          title: s.title,
          slug: s.slug,
          content: s.content,
          excerpt,
          featuredImage: s.featured,
          category: s.category,
          status: nextStatus,
          updatedAt: serverTimestamp(),
          author: {
            name: user?.displayName || user?.email?.split("@")[0] || "Author",
            email: user?.email || "",
          },
        };

        if (nextStatus === "published") {
          const prev = existingSnap.data();
          if (!prev?.publishedAt) {
            payload.publishedAt = serverTimestamp();
          }
        }

        if (!existingSnap.exists()) {
          payload.createdAt = serverTimestamp();
        }

        await setDoc(refDoc, payload, { merge: true });
        const previous = existingSnap.data();
        await revalidatePostViews({
          slug: s.slug,
          previousSlug: typeof previous?.slug === "string" ? previous.slug : undefined,
          categorySlug: categorySlugMap[s.category],
          previousCategorySlug:
            typeof previous?.category === "string" ? categorySlugMap[previous.category] : undefined,
        });
        if (!silent) setMessage(nextStatus === "published" ? "Published." : "Draft saved.");
        setSavedStatus(nextStatus);
        if (!s.initialPostId) {
          router.replace(`/admin/posts/edit/${s.postId}`);
        }
        return true;
      } catch (e) {
        console.error(e);
        if (!silent) setMessage("Save failed.");
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [categorySlugMap, router],
  );

  useEffect(() => {
    // Draft autosave should never:
    //  1. Demote a published post (check savedStatus === "draft")
    //  2. Fire before the post has loaded from Firestore (check loadedRef)
    //  3. Overlap a manual save (check savingRef)
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (!loadedRef.current) return; // post not fully loaded yet
      if (!s.title.trim()) return;
      if (s.savedStatus !== "draft") return; // never demote a published post
      if (savingRef.current) return;
      void persist("draft", true);
    }, 30000);
    return () => window.clearInterval(id);
  }, [persist]);

  async function onInlineFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
    const safeName = file.name.replace(/\s+/g, "_");
    const path = `images/inline/${postId}/${Date.now()}-${safeName}`;
    const storageRef = ref(getFirebaseStorage(), path);
    await uploadBytes(storageRef, compressed, { contentType: compressed.type });
    const url = await getDownloadURL(storageRef);
    setContent((c) => `${c}\n\n![](${url})\n\n`);
  }

  async function onDelete() {
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, "posts", postId);
      const existingSnap = await getDoc(docRef);
      const previous = existingSnap.data();
      if (featured.storagePath) {
        try {
          await deleteObject(ref(getFirebaseStorage(), featured.storagePath));
        } catch {
          // ignore
        }
      }
      await deleteDoc(docRef);
      await revalidatePostViews({
        previousSlug: typeof previous?.slug === "string" ? previous.slug : undefined,
        previousCategorySlug:
          typeof previous?.category === "string" ? categorySlugMap[previous.category] : undefined,
      });
      router.replace("/admin/posts");
    } catch (e) {
      console.error(e);
      setMessage("Delete failed.");
    } finally {
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading post…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {initialPostId ? "Edit post" : "New post"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => void persist("draft")}>
            Save draft
          </Button>
          <Button type="button" disabled={saving} onClick={() => void persist("published")}>
            {savedStatus === "published" ? "Update" : "Publish"}
          </Button>
          {initialPostId ? (
            <Button type="button" variant="danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {message ? <p className="text-sm font-medium text-muted">{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className={formSelectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 block text-sm font-medium">Current status</p>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {savedStatus === "published" ? "Published" : "Draft"}
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Use “Save draft” or “Publish” to change the saved state explicitly.
            </p>
          </div>
        </div>
        <FeaturedImageField postId={postId} value={featured} onChange={setFeatured} />
      </div>

      <input
        ref={inlineInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onInlineFile(f);
        }}
      />

      <MarkdownEditor
        value={content}
        onChange={setContent}
        onInsertImage={() => inlineInputRef.current?.click()}
      />

      <Modal open={confirmOpen} title="Delete post?" onClose={() => setConfirmOpen(false)}>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => void onDelete()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
