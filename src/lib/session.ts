// 轻量本地会话（原型阶段，替代 Firebase Auth）。
// 通过 cookie 记录当前登录的演示账号 uid。
// 注意：本模块含服务端依赖（next/headers），仅可在 server component / route handler 中导入；
//      面向客户端的常量请从 '@/lib/accounts' 导入。

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { DEMO_ACCOUNTS, SESSION_COOKIE } from './accounts';

export { DEMO_ACCOUNTS, SESSION_COOKIE };

/** 服务端组件/route 读取当前 uid */
export function getSessionUid(): string | null {
  const value = cookies().get(SESSION_COOKIE)?.value;
  return value || null;
}

/** route handler 读取当前 uid */
export function getUidFromRequest(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value || null;
}

/** 演示密码校验 */
export function verifyDemoLogin(
  email: string,
  password: string
): string | null {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (account && account.password === password) return account.uid;
  return null;
}
