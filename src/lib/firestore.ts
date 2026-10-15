// Firestore 客户端（懒加载）。有 GCP 凭据时返回 Firestore 实例，否则返回 null。
// 仅服务端使用，客户端组件不得引入。

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let _db: Firestore | null = null;
let _initFailed = false;

export function getFirestoreDb(): Firestore | null {
  if (_db) return _db;
  if (_initFailed) return null;

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!keyPath || !projectId) return null;

  try {
    const key = JSON.parse(readFileSync(keyPath, 'utf8'));
    if (getApps().length === 0) {
      initializeApp({ credential: cert(key), projectId });
    }
    _db = getFirestore();
    return _db;
  } catch (e) {
    console.error('[Firestore] 初始化失败:', (e as Error).message);
    _initFailed = true;
    return null;
  }
}

/** 判断当前是否使用 Firestore 后端 */
export function useFirestore(): boolean {
  return getFirestoreDb() !== null;
}
