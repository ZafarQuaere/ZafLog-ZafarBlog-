import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cachedApp: App | null | undefined;

function initAdminApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set!");
    cachedApp = null;
    return null;
  }
  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    if (getApps().length) {
      cachedApp = getApps()[0]!;
      console.log("[firebase-admin] Reusing existing app");
      return cachedApp;
    }
    cachedApp = initializeApp({ credential: cert(json as never) });
    console.log("[firebase-admin] Initialized new app, project:", json.project_id);
    return cachedApp;
  } catch (e) {
    console.error("[firebase-admin] Failed to initialize:", e);
    cachedApp = null;
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  const app = initAdminApp();
  if (!app) return null;
  return getFirestore(app);
}
