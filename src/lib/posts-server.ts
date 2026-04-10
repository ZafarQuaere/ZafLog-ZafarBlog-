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

function getPostSortTimestamp(post: Post): number {
  const iso = post.publishedAt ?? post.updatedAt ?? post.createdAt;
  if (!iso) return 0;
  const timestamp = Date.parse(iso);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortPublishedPosts(posts: Post[]): Post[] {
  return [...posts].sort((left, right) => getPostSortTimestamp(right) - getPostSortTimestamp(left));
}

export async function getPublishedPostsPage(params: {
  pageSize: number;
  pageIndex: number;
}): Promise<{ posts: Post[]; total: number }> {
  const db = getAdminDb();
  if (!db) {
    console.warn(
      "[posts-server] getPublishedPostsPage: Admin DB not available. Check FIREBASE_SERVICE_ACCOUNT_KEY.",
    );
    return { posts: [], total: 0 };
  }

  try {
    // NOTE: We deliberately do NOT use orderBy('publishedAt') here.
    // Firestore silently excludes documents where the orderBy field is missing/null,
    // which would cause posts published before the publishedAt field was introduced
    // (or posts where publishedAt failed to write) to disappear from listings.
    // Instead we fetch all published posts and sort in memory, which gracefully
    // handles missing fields by falling back to updatedAt → createdAt → 0.
    const snap = await db.collection("posts").where("status", "==", "published").get();
    const posts = sortPublishedPosts(snap.docs.map((d) => mapPostDoc(d.id, d.data())));
    const total = posts.length;
    const start = params.pageIndex * params.pageSize;
    return { posts: posts.slice(start, start + params.pageSize), total };
  } catch (e) {
    console.error("[posts-server] getPublishedPostsPage failed:", e);
    return { posts: [], total: 0 };
  }
}

export async function getPostBySlugPublic(slug: string): Promise<Post | null> {
  const db = getAdminDb();
  if (!db) {
    console.warn("[posts-server] getPostBySlugPublic: Admin DB not available.");
    return null;
  }
  try {
    const snap = await db.collection("posts").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0]!;
    const post = mapPostDoc(doc.id, doc.data());
    if (post.status !== "published") return null;
    return post;
  } catch (e) {
    console.error("[posts-server] getPostBySlugPublic failed for slug:", slug, e);
    return null;
  }
}

export async function getRelatedPosts(categoryId: string, excludeId: string): Promise<Post[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snap = await db
      .collection("posts")
      .where("status", "==", "published")
      .where("category", "==", categoryId)
      .get();
    const posts = sortPublishedPosts(snap.docs.map((d) => mapPostDoc(d.id, d.data()))).filter((p) => p.id !== excludeId);
    return posts.slice(0, 3);
  } catch {
    return [];
  }
}

export async function getRecentPublishedPosts(limitCount: number): Promise<Post[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    // Same rationale as getPublishedPostsPage: avoid orderBy('publishedAt') since
    // documents missing that field are silently excluded by Firestore.
    const snap = await db.collection("posts").where("status", "==", "published").get();
    return sortPublishedPosts(snap.docs.map((d) => mapPostDoc(d.id, d.data()))).slice(0, limitCount);
  } catch (e) {
    console.error("[posts-server] getRecentPublishedPosts failed:", e);
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

    const snap = await db
      .collection("posts")
      .where("status", "==", "published")
      .where("category", "==", category.id)
      .get();
    const posts = sortPublishedPosts(snap.docs.map((d) => mapPostDoc(d.id, d.data())));
    const total = posts.length;
    const start = pageIndex * pageSize;
    return { posts: posts.slice(start, start + pageSize), total, category };
  } catch (e) {
    console.error("[posts-server] getPostsByCategorySlug failed:", e);
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
  const snap = await db.collection("posts").where("status", "==", "published").limit(200).get();
  return sortPublishedPosts(snap.docs.map((d) => mapPostDoc(d.id, d.data())))
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q),
    );
}
