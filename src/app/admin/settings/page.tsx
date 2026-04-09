"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import imageCompression from "browser-image-compression";

export default function AdminSettingsPage() {
  const [title, setTitle] = useState("Blog");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState({ url: "", path: "" });
  const [favicon, setFavicon] = useState({ url: "", path: "" });
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [profilePicture, setProfilePicture] = useState({ url: "", path: "" });
  const [contactRecipientEmail, setContactRecipientEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const logoRef = useRef<HTMLInputElement>(null);
  const favRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const snap = await getDoc(doc(getFirebaseDb(), "settings", "site"));
      if (snap.exists()) {
        const d = snap.data();
        setTitle(String(d.title ?? "Blog"));
        setDescription(String(d.description ?? ""));
        setLogo({ url: String(d.logo ?? ""), path: "" });
        setFavicon({ url: String(d.favicon ?? ""), path: "" });
        const a = d.author as Record<string, unknown> | undefined;
        setAuthorName(String(a?.name ?? ""));
        setAuthorEmail(String(a?.email ?? ""));
        setAuthorBio(String(a?.bio ?? ""));
        setProfilePicture({ url: String(a?.profilePicture ?? ""), path: "" });
        setContactRecipientEmail(String(d.contactRecipientEmail ?? ""));
      }
      setLoading(false);
    })();
  }, []);

  async function uploadSiteFile(file: File, key: "logo" | "favicon" | "profile") {
    const compressed =
      file.type.startsWith("image/") && file.size > 300_000
        ? await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 512, useWebWorker: true })
        : file;
    const ext = compressed.type.split("/")[1] || "png";
    const path =
      key === "logo"
        ? `images/site/logo.${ext}`
        : key === "favicon"
          ? `images/site/favicon.${ext}`
          : `images/site/author-profile.${ext}`;
    const storageRef = ref(getFirebaseStorage(), path);
    await uploadBytes(storageRef, compressed, { contentType: compressed.type });
    const url = await getDownloadURL(storageRef);
    if (key === "logo") setLogo({ url, path });
    if (key === "favicon") setFavicon({ url, path });
    if (key === "profile") setProfilePicture({ url, path });
  }

  async function save() {
    await setDoc(
      doc(getFirebaseDb(), "settings", "site"),
      {
        title: title.trim(),
        description: description.trim(),
        logo: logo.url,
        favicon: favicon.url,
        author: {
          name: authorName.trim(),
          email: authorEmail.trim(),
          bio: authorBio.trim(),
          profilePicture: profilePicture.url,
        },
        contactRecipientEmail: contactRecipientEmail.trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setMsg("Settings saved.");
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500">Site identity, author profile, and contact defaults.</p>
      </div>

      {msg ? <p className="text-sm text-green-700 dark:text-green-400">{msg}</p> : null}

      <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Site</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Logo</p>
            <div className="mb-2 flex h-16 items-center gap-2">
              {logo.url ? <Image src={logo.url} alt="" width={64} height={64} className="rounded-md object-contain" /> : null}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadSiteFile(f, "logo");
              }}
            />
            <Button type="button" variant="secondary" onClick={() => logoRef.current?.click()}>
              Upload logo
            </Button>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Favicon</p>
            <div className="mb-2 flex h-16 items-center gap-2">
              {favicon.url ? (
                <Image src={favicon.url} alt="" width={32} height={32} className="rounded-md object-contain" />
              ) : null}
            </div>
            <input
              ref={favRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadSiteFile(f, "favicon");
              }}
            />
            <Button type="button" variant="secondary" onClick={() => favRef.current?.click()}>
              Upload favicon
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Author</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Bio</label>
          <Textarea rows={4} value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Profile picture</p>
          {profilePicture.url ? (
            <Image src={profilePicture.url} alt="" width={96} height={96} className="mb-2 rounded-full object-cover" />
          ) : null}
          <input
            ref={profileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadSiteFile(f, "profile");
            }}
          />
          <Button type="button" variant="secondary" onClick={() => profileRef.current?.click()}>
            Upload profile picture
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Email</h2>
        <p className="text-sm text-zinc-500">
          Contact form delivery uses <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">EMAIL_API_KEY</code>{" "}
          (Resend) on the server. Set the default recipient here (also used as fallback for{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">CONTACT_EMAIL</code>).
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium">Default contact recipient</label>
          <Input
            type="email"
            value={contactRecipientEmail}
            onChange={(e) => setContactRecipientEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </section>

      <Button type="button" onClick={() => void save()}>
        Save settings
      </Button>
    </div>
  );
}
