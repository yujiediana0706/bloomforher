// Firestore client (lazy-loaded). Returns a Firestore instance when a GCP
// project is configured, otherwise returns null.
// Server-side only; must not be imported by client components.

import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let _db: Firestore | null = null;
let _initFailed = false;

// The project does not use the `(default)` Firestore database: it is named
// `buildercup2026`. Targeting `(default)` yields `5 NOT_FOUND`, so the
// database id must always be passed explicitly.
const DEFAULT_DATABASE_ID = 'buildercup2026';

export function getFirestoreDb(): Firestore | null {
  if (_db) return _db;
  if (_initFailed) return null;

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
  const databaseId = process.env.FIRESTORE_DATABASE_ID || DEFAULT_DATABASE_ID;

  // Without a project id there is nothing to talk to.
  if (!projectId) return null;

  try {
    let app: App;
    if (getApps().length === 0) {
      if (keyPath) {
        // Local development: explicit service account key file.
        const key = JSON.parse(readFileSync(keyPath, 'utf8'));
        app = initializeApp({ credential: cert(key), projectId });
      } else {
        // Cloud Run: use Application Default Credentials from the runtime
        // service account (same pattern as the Agent client).
        app = initializeApp({ projectId });
      }
    } else {
      app = getApp();
    }
    _db = getFirestore(app, databaseId);
    return _db;
  } catch (e) {
    console.error('[Firestore] init failed:', (e as Error).message);
    _initFailed = true;
    return null;
  }
}

/** Whether the Firestore backend is currently in use. */
export function useFirestore(): boolean {
  return getFirestoreDb() !== null;
}
