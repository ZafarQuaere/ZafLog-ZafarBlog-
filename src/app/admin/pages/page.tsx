"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

type Tab = "about" | "contact";

export default function AdminPagesPage() {
  const [tab, setTab] = useState<Tab>("about");
  const [about, setAbout] = useState("");
  const [contactMd, setContactMd] = useState("");
  const [formEnabled, setFormEnabled] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const db = getFirebaseDb();
      const [aboutSnap, contactSnap] = await Promise.all([
        getDoc(doc(db, "pages", "about")),
        getDoc(doc(db, "pages", "contact")),
      ]);
      if (aboutSnap.exists()) setAbout(String(aboutSnap.data()?.content ?? ""));
      if (contactSnap.exists()) {
        const d = contactSnap.data();
        setContactMd(String(d?.content ?? ""));
        setFormEnabled(d?.formEnabled !== false);
        setRecipientEmail(String(d?.recipientEmail ?? ""));
      }
      setLoading(false);
    })();
  }, []);

  async function saveAbout() {
    await setDoc(
      doc(getFirebaseDb(), "pages", "about"),
      { content: about, updatedAt: serverTimestamp() },
      { merge: true },
    );
    setMsg("About page saved.");
  }

  async function saveContact() {
    await setDoc(
      doc(getFirebaseDb(), "pages", "contact"),
      {
        content: contactMd,
        formEnabled,
        recipientEmail: recipientEmail.trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setMsg("Contact page saved.");
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Pages</h1>
        <p className="text-sm text-zinc-500">Edit public About and Contact pages.</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "about"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
              : "border-transparent text-zinc-500"
          }`}
          onClick={() => setTab("about")}
        >
          About
        </button>
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "contact"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
              : "border-transparent text-zinc-500"
          }`}
          onClick={() => setTab("contact")}
        >
          Contact
        </button>
      </div>

      {msg ? <p className="text-sm text-green-700 dark:text-green-400">{msg}</p> : null}

      {tab === "about" ? (
        <div className="space-y-4">
          <MarkdownEditor value={about} onChange={setAbout} />
          <Button type="button" onClick={() => void saveAbout()}>
            Save About page
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <MarkdownEditor value={contactMd} onChange={setContactMd} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} />
              Enable contact form
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium">Form recipient email</label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Overrides site default if set"
              />
            </div>
          </div>
          <Button type="button" onClick={() => void saveContact()}>
            Save Contact page
          </Button>
        </div>
      )}
    </div>
  );
}
