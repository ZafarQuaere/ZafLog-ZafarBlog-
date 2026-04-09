import type { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { toIso } from "@/lib/serialize";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const db = getAdminDb();
  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  if (!db) return entries;

  const snap = await db.collection("posts").where("status", "==", "published").get();
  snap.forEach((doc) => {
    const d = doc.data();
    const slug = String(d.slug ?? "");
    if (!slug) return;
    const last = toIso(d.updatedAt) ?? toIso(d.publishedAt);
    entries.push({
      url: `${base}/blog/${slug}`,
      lastModified: last ? new Date(last) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  const cats = await db.collection("categories").get();
  cats.forEach((doc) => {
    const slug = String(doc.data().slug ?? "");
    if (!slug) return;
    entries.push({
      url: `${base}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  });

  entries.push({ url: `${base}/about`, lastModified: new Date() });
  entries.push({ url: `${base}/contact`, lastModified: new Date() });
  entries.push({ url: `${base}/search`, lastModified: new Date() });

  return entries;
}
