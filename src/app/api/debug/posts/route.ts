import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function toSortableTimestamp(value: unknown): number {
  if (!value || typeof value !== "object" || !("toDate" in value)) return 0;
  try {
    return (value as { toDate: () => Date }).toDate().getTime();
  } catch {
    return 0;
  }
}

export async function GET() {
  const db = getAdminDb();

  if (!db) {
    return NextResponse.json({
      error: "Admin DB not initialized",
      env: {
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        keyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length,
      },
    }, { status: 500 });
  }

  try {
    // Get all posts
    const allPosts = await db.collection("posts").limit(20).get();

    // Match the homepage behavior: include published docs even if publishedAt is missing.
    const publishedPosts = await db.collection("posts").where("status", "==", "published").get();
    const sortedPublishedPosts = [...publishedPosts.docs].sort(
      (left, right) =>
        Math.max(
          toSortableTimestamp(right.data().publishedAt),
          toSortableTimestamp(right.data().updatedAt),
          toSortableTimestamp(right.data().createdAt),
        ) -
        Math.max(
          toSortableTimestamp(left.data().publishedAt),
          toSortableTimestamp(left.data().updatedAt),
          toSortableTimestamp(left.data().createdAt),
        ),
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalPosts: allPosts.size,
        publishedPosts: publishedPosts.size,
        publishedWithoutPublishedAt: publishedPosts.docs.filter((d) => !d.data().publishedAt).length,
      },
      allPosts: allPosts.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        status: d.data().status,
        publishedAt: d.data().publishedAt ? "set" : "missing",
        category: d.data().category,
      })),
      publishedPosts: sortedPublishedPosts.slice(0, 10).map((d) => ({
        id: d.id,
        title: d.data().title,
        status: d.data().status,
        publishedAt: d.data().publishedAt ? "set" : "missing",
        category: d.data().category,
      })),
    });
  } catch (e) {
    return NextResponse.json({
      error: "Query failed",
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    }, { status: 500 });
  }
}
