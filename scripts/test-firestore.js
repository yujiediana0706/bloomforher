const admin = require('firebase-admin');
const fs = require('fs');

const key = JSON.parse(fs.readFileSync('/Users/yujiejiang/gcp-keys/rebloom-backend.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'buildercup2026-511504',
});

const db = admin.firestore();

async function main() {
  try {
    await db.collection('_test').doc('connection').set({
      timestamp: new Date().toISOString(),
      message: 'Phase 1 Firestore connection test',
    });
    console.log('✅ Firestore 写入成功');

    const doc = await db.collection('_test').doc('connection').get();
    console.log('✅ Firestore 读取成功:', doc.data());

    await db.collection('_test').doc('connection').delete();
    console.log('✅ Firestore 删除成功');
  } catch (e) {
    console.log('❌ Firestore 操作失败:', e.message);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));
