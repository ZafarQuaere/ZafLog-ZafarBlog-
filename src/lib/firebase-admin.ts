import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Cached app reference.
 * - `undefined` = not yet attempted
 * - `App` = successfully initialized
 *
 * We deliberately do NOT cache `null` (initialization failure) so that
 * transient errors (e.g. a bad cold-start JSON parse) don't permanently
 * disable all server-side data fetching for the lifetime of this process.
 * The env var is checked on every call when no app exists yet, which is
 * safe because `initializeApp` itself is idempotent via `getApps()` guard.
 */
let cachedApp: App | undefined;

function initAdminApp(): App | null {
  // Return the already-initialized app immediately.
  if (cachedApp !== undefined) return cachedApp;

  // Reuse an app that was initialized by another module in this process.
  const existing = getApps();
  if (existing.length) {
    cachedApp = existing[0]!;
    console.log("[firebase-admin] Reusing existing app");
    return cachedApp;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set — server-side reads are disabled.",
    );
    // Do NOT cache null here; allow future requests to retry once the var is available.
    return null;
  }

  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    cachedApp = initializeApp({ credential: cert(json as never) });
    console.log("[firebase-admin] Initialized new app, project:", json.project_id);
    return cachedApp;
  } catch (e) {
    console.error("[firebase-admin] Failed to initialize:", e);
    // Do NOT cache null — let the next request retry.
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  const app = initAdminApp();
  if (!app) return null;
  return getFirestore(app);
}
