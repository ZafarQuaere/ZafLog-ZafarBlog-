import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import type { Post } from "@/types/post";
import type { Category } from "@/types/category";
import { getAdminDb } from "@/lib/firebase-admin";
import { toIso } from "@/lib/serialize";

function mapPostDoc(id: string, data: DocumentData): Post {
  return {
    id,
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    content: String(data.content ?? ""),
    excerpt: String(data.excerpt ?? ""),
    featuredImage: {
      url: String(data.featuredImage?.url ?? ""),
      alt: String(data.featuredImage?.alt ?? ""),
      storagePath: String(data.featuredImage?.storagePath ?? ""),
    },
    category: String(data.category ?? ""),
    status: data.status === "draft" ? "draft" : "published",
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    publishedAt: toIso(data.publishedAt),
    author: {
      name: String(data.author?.name ?? ""),
      email: String(data.author?.email ?? ""),
    },
  };
}

function mapCategoryDoc(id: string, data: DocumentData): Category {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    description: String(data.description ?? ""),
    createdAt: toIso(data.createdAt),
  };
}

export async function getPublishedPostsPage(params: {
  pageSize: number;
  pageIndex: number;
}): Promise<{ posts: Post[]; total: number }> {
  const db = getAdminDb();
  if (!db) return { posts: [], total: 0 };

  try {
    const col = db.collection("posts");
    const base = col.where("status", "==", "published").orderBy("publishedAt", "desc");
    const totalSnap = await base.count().get();
    const total = totalSnap.data().count;
    const snap = await base.offset(params.pageIndex * params.pageSize).limit(params.pageSize).get();
    const posts = snap.docs.map((d) => mapPostDoc(d.id, d.data()));
    return { posts, total };
  } catch {
    return { posts: [], total: 0 };
  }
}

export async function getPostBySlugPublic(slug: string): Promise<Post | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("posts").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const post = mapPostDoc(doc.id, doc.data());
  if (post.status !== "published") return null;
  return post;
}

export async function getRelatedPosts(categoryId: string, excludeId: string): Promise<Post[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snap = await db
      .collection("posts")
      .where("status", "==", "published")
      .where("category", "==", categoryId)
      .orderBy("publishedAt", "desc")
      .limit(6)
      .get();
    const posts = snap.docs.map((d) => mapPostDoc(d.id, d.data())).filter((p) => p.id !== excludeId);
    return posts.slice(0, 3);
  } catch {
    return [];
  }
}

export async function getRecentPublishedPosts(limitCount: number): Promise<Post[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snap = await db
      .collection("posts")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(limitCount)
      .get();
    return snap.docs.map((d) => mapPostDoc(d.id, d.data()));
  } catch {
    return [];
  }
}

export async function getPostsByCategorySlug(
  categorySlug: string,
  pageSize: number,
  pageIndex: number,
): Promise<{ posts: Post[]; total: number; category: Category | null }> {
  const db = getAdminDb();
  if (!db) return { posts: [], total: 0, category: null };

  try {
    const catSnap = await db.collection("categories").where("slug", "==", categorySlug).limit(1).get();
    if (catSnap.empty) return { posts: [], total: 0, category: null };
    const catDoc = catSnap.docs[0]!;
    const category = mapCategoryDoc(catDoc.id, catDoc.data());

    const col = db.collection("posts");
    const base = col
      .where("status", "==", "published")
      .where("category", "==", category.id)
      .orderBy("publishedAt", "desc");
    const totalSnap = await base.count().get();
    const total = totalSnap.data().count;
    const snap = await base.offset(pageIndex * pageSize).limit(pageSize).get();
    const posts = snap.docs.map((d) => mapPostDoc(d.id, d.data()));
    return { posts, total, category };
  } catch {
    return { posts: [], total: 0, category: null };
  }
}

export async function getAllCategories(): Promise<Category[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db.collection("categories").orderBy("name").get();
  return snap.docs.map((d) => mapCategoryDoc(d.id, d.data()));
}

export async function getSiteSettingsServer(): Promise<Record<string, unknown> | null> {
  const db = getAdminDb();
  if (!db) return null;
  const doc = await db.collection("settings").doc("site").get();
  if (!doc.exists) return null;
  return doc.data() ?? null;
}

export async function getPageDocServer(pageId: string): Promise<Record<string, unknown> | null> {
  const db = getAdminDb();
  if (!db) return null;
  const doc = await db.collection("pages").doc(pageId).get();
  if (!doc.exists) return null;
  return doc.data() ?? null;
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db.collection("posts").where("status", "==", "published").select("slug").get();
  return snap.docs.map((d) => String(d.data().slug ?? "")).filter(Boolean);
}

export async function searchPublishedPosts(query: string): Promise<Post[]> {
  const db = getAdminDb();
  if (!db) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const snap = await db.collection("posts").where("status", "==", "published").orderBy("publishedAt", "desc").limit(200).get();
  return snap.docs
    .map((d) => mapPostDoc(d.id, d.data()))
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q),
    );
}
