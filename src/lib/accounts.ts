// 客户端安全的会话常量（不含任何服务端依赖，可被 client component 安全导入）。

export const SESSION_COOKIE = 'rebloom_uid';

export const DEMO_ACCOUNTS = [
  {
    uid: 'demo_returner',
    email: 'demo.returner@rebloom.test',
    password: 'ReBloom123!',
    label: '产后回归 · 林知夏（完整数据）',
  },
  {
    uid: 'demo_explorer',
    email: 'demo.explorer@rebloom.test',
    password: 'ReBloom123!',
    label: '在校探索 · 陈思远（全新账号）',
  },
  {
    uid: 'demo_mentor1',
    email: 'demo.mentor1@rebloom.test',
    password: 'ReBloom123!',
    label: '导师 · 林知夏',
  },
  {
    uid: 'demo_mentor2',
    email: 'demo.mentor2@rebloom.test',
    password: 'ReBloom123!',
    label: '导师 · 周明远',
  },
  {
    uid: 'demo_mentor3',
    email: 'demo.mentor3@rebloom.test',
    password: 'ReBloom123!',
    label: '导师 · 苏叶',
  },
] as const;
