import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

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
    
    // Get published posts with the same query as homepage
    const publishedPosts = await db
      .collection("posts")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(10)
      .get();

    return NextResponse.json({
      success: true,
      stats: {
        totalPosts: allPosts.size,
        publishedPosts: publishedPosts.size,
      },
      allPosts: allPosts.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        status: d.data().status,
        publishedAt: d.data().publishedAt ? "set" : "missing",
        category: d.data().category,
      })),
      publishedPosts: publishedPosts.docs.map((d) => ({
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
