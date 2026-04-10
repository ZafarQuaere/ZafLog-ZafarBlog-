import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackServiceAccountPath = path.resolve(
  __dirname,
  "../blogwebsite-53f01-firebase-adminsdk-fbsvc-3f101c170a.json",
);

function parseServiceAccount(raw) {
  return JSON.parse(raw.trim().replace(/^['"]|['"]$/g, ""));
}

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      return parseServiceAccount(raw);
    } catch {
      // Fall through to file-based fallback for local repair runs.
    }
  }

  if (existsSync(fallbackServiceAccountPath)) {
    return JSON.parse(readFileSync(fallbackServiceAccountPath, "utf8"));
  }

  throw new Error(
    "No usable service account found. Set FIREBASE_SERVICE_ACCOUNT_KEY or provide the local admin SDK JSON file.",
  );
}

function ensureApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const serviceAccount = loadServiceAccount();
  return initializeApp({ credential: cert(serviceAccount) });
}

function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && "toDate" in value) {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function pickPublishedAt(data) {
  const updatedAt = toDateValue(data.updatedAt);
  if (updatedAt) {
    return { date: updatedAt, source: "updatedAt" };
  }

  const createdAt = toDateValue(data.createdAt);
  if (createdAt) {
    return { date: createdAt, source: "createdAt" };
  }

  return { date: new Date(), source: "now" };
}

async function main() {
  const shouldWrite = process.argv.includes("--write");
  ensureApp();
  const db = getFirestore();

  const snap = await db.collection("posts").where("status", "==", "published").get();
  const candidates = snap.docs
    .filter((doc) => !doc.data().publishedAt)
    .map((doc) => {
      const data = doc.data();
      const { date, source } = pickPublishedAt(data);
      return {
        id: doc.id,
        title: String(data.title ?? ""),
        slug: String(data.slug ?? ""),
        source,
        publishedAt: date,
      };
    });

  console.log(`Published posts scanned: ${snap.size}`);
  console.log(`Posts missing publishedAt: ${candidates.length}`);

  if (!candidates.length) {
    console.log("Nothing to repair.");
    return;
  }

  for (const candidate of candidates.slice(0, 20)) {
    console.log(
      `- ${candidate.id} | ${candidate.title || "(untitled)"} | slug=${candidate.slug || "(missing)"} | source=${candidate.source} | publishedAt=${candidate.publishedAt.toISOString()}`,
    );
  }

  if (candidates.length > 20) {
    console.log(`...and ${candidates.length - 20} more.`);
  }

  if (!shouldWrite) {
    console.log("");
    console.log("Dry run only. Re-run with --write to persist the backfill.");
    return;
  }

  let batch = db.batch();
  let batchSize = 0;
  let updated = 0;

  for (const candidate of candidates) {
    batch.update(db.collection("posts").doc(candidate.id), {
      publishedAt: candidate.publishedAt,
      repairedAt: FieldValue.serverTimestamp(),
    });
    batchSize += 1;
    updated += 1;

    if (batchSize === 450) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  console.log("");
  console.log(`Repair complete. Updated ${updated} published post(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
