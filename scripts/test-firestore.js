// Local Firestore connectivity check.
// Usage: node scripts/test-firestore.js
// Note: this project uses the named Firestore database `buildercup2026`, not `(default)`.
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'buildercup2026';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'buildercup2026-511504';
const KEY_PATH =
  process.env.SERVICE_ACCOUNT_PATH ||
  '/Users/yujiejiang/gcp-keys/rebloom-backend.json';

const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
const app = initializeApp({ credential: cert(key), projectId: PROJECT_ID });
const db = getFirestore(app, DATABASE_ID);

async function main() {
  try {
    await db.collection('_test').doc('connection').set({
      timestamp: new Date().toISOString(),
      message: 'Firestore connection test',
    });
    console.log('Firestore write succeeded');

    const doc = await db.collection('_test').doc('connection').get();
    console.log('Firestore read succeeded:', doc.data());

    await db.collection('_test').doc('connection').delete();
    console.log('Firestore delete succeeded');
  } catch (e) {
    console.log('Firestore operation failed:', e.code, e.message);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));
