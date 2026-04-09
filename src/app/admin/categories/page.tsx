"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { slugifyTitle } from "@/utils/slugify";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";

type CategoryRow = { id: string; name: string; slug: string; description: string };

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<(CategoryRow & { postCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function refresh() {
    const db = getFirebaseDb();
    const [cats, posts] = await Promise.all([
      getDocs(collection(db, "categories")),
      getDocs(collection(db, "posts")),
    ]);
    const countByCat: Record<string, number> = {};
    posts.forEach((p) => {
      const c = String(p.data().category ?? "");
      if (!c) return;
      countByCat[c] = (countByCat[c] ?? 0) + 1;
    });
    setRows(
      cats.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name ?? ""),
          slug: String(data.slug ?? ""),
          description: String(data.description ?? ""),
          postCount: countByCat[d.id] ?? 0,
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

  function openNew() {
    setEditing(null);
    setName("");
    setDescription("");
    setOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditing(row);
    setName(row.name);
    setDescription(row.description);
    setOpen(true);
  }

  async function save() {
    if (!name.trim()) return;
    const slug = slugifyTitle(name);
    if (editing) {
      await updateDoc(doc(getFirebaseDb(), "categories", editing.id), {
        name: name.trim(),
        slug,
        description: description.trim(),
      });
    } else {
      await addDoc(collection(getFirebaseDb(), "categories"), {
        name: name.trim(),
        slug,
        description: description.trim(),
        createdAt: serverTimestamp(),
      });
    }
    setOpen(false);
    await refresh();
  }

  async function remove(row: CategoryRow & { postCount: number }) {
    if (row.postCount > 0) {
      alert(`Cannot delete: ${row.postCount} post(s) use this category. Reassign posts first.`);
      return;
    }
    if (!window.confirm(`Delete category “${row.name}”?`)) return;
    await deleteDoc(doc(getFirebaseDb(), "categories", row.id));
    await refresh();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Categories</h1>
          <p className="text-sm text-zinc-500">Organize posts with categories.</p>
        </div>
        <Button type="button" onClick={openNew}>
          Add category
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300">Posts</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{r.name}</p>
                  <p className="text-xs text-zinc-500">{r.slug}</p>
                  {r.description ? <p className="mt-1 text-zinc-600 dark:text-zinc-400">{r.description}</p> : null}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.postCount}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" onClick={() => void remove(r)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-6 text-center text-sm text-zinc-500">No categories yet.</p> : null}
      </div>

      <Modal open={open} title={editing ? "Edit category" : "New category"} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
