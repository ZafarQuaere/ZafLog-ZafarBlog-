import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cachedApp: App | null | undefined;

function initAdminApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    cachedApp = null;
    return null;
  }
  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    if (getApps().length) {
      cachedApp = getApps()[0]!;
      return cachedApp;
    }
    cachedApp = initializeApp({ credential: cert(json as never) });
    return cachedApp;
  } catch {
    cachedApp = null;
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  const app = initAdminApp();
  if (!app) return null;
  return getFirestore(app);
}
