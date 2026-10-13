# ReBloom AI · 她径

> 让女性的 AI 选择，从 **Why me** 走向 **Why not me**。
>
> 面向女性的 AI 职业转型赋能平台：以「证据驱动」的方式，把过往经验翻译成 AI 时代的可迁移能力，用**同辈互助（免费）+ 专业导师（付费担保）双轨**陪伴每一位女性完成转型。

**当前状态：产品原型（Phase 1）**

- 全部页面与交互流程已实现，使用**服务端内存数据层**（`globalThis` 单例）模拟 Firestore；
- **AI Coach 暂未接入真实模型**：`src/lib/ai.ts` 为单点占位层（规则式回复），将来替换即可接入 agent platform；
- **尚未部署**（本地可完整跑通）。

---

## 1. 目录结构

```
bloomforher/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 全局布局：AuthProvider + Navbar + footer
│   │   ├── globals.css             # Tailwind 指令 + 金属质感工具类
│   │   ├── page.tsx                # 落地页：6 步旅程图 + hero
│   │   ├── onboarding/             # 旅程 ① 建档（8 屏表单）
│   │   ├── skills/                 # 旅程 ② 技能发现（可迁移技能 + 自信度矫正板）
│   │   ├── opportunities/          # 旅程 ③ AI 机会（岗位匹配 + 女性友好赛道）
│   │   ├── tasks-lab/              # 旅程 ④ 实操任务（提交 → 流式反馈 + 评分）
│   │   ├── plan/                   # 旅程 ⑤ 30 天回归计划（可暂停/调整）
│   │   ├── plaza/ + plaza/[id]/    # 对话广场（小红书式图文社区 · 我愿同行 · 免费同辈互助）
│   │   ├── community/              # 导师社区
│   │   ├── mentors/[id]/           # 导师详情 + 档期预约
│   │   ├── my-sessions/            # 我的预约（同辈互助区 + 导师会话区）
│   │   ├── coach/                  # 贯穿层 A：AI Coach（SSE 流式，占位回复）
│   │   ├── evidence/               # 贯穿层 B：证据库 +「我可以」墙
│   │   ├── dashboard/              # 工作台：旅程进度 + 自信度环 + 影响力数据
│   │   ├── become-mentor/          # 申请成为导师
│   │   ├── mentor/manage/          # 导师管理台（资料/档期/预约）
│   │   └── api/                    # 全部 API 路由（nodejs runtime）
│   ├── components/                 # 通用组件（Navbar/AuthProvider/ui/JourneyBanner）
│   └── lib/
│       ├── types.ts                # 领域类型（对齐数据模型）
│       ├── constants.ts            # 阶段标签 / 自信度公式 / 花名 / 导航
│       ├── mockData.ts             # 种子数据（与 scripts/seed.ts 单一事实来源）
│       ├── store.ts                # 服务端内存数据层（getDB 单例）
│       ├── ai.ts                   # ⬅ AI 占位层（将来接 agent 的唯一改动点）
│       ├── accounts.ts             # 客户端安全常量（演示账号）
│       ├── session.ts              # 服务端会话（cookie，替代 Firebase Auth）
│       └── client.ts               # 前端请求封装（apiGet / apiSend）
├── scripts/seed.ts                 # ⬅ 幂等播种脚本（firebase-admin，先清后插）
├── firestore.rules                 # Firestore 安全规则（§6 完整实现）
├── firestore.indexes.json          # 复合索引清单
├── storage.rules                   # Cloud Storage 规则（简历/证明私有）
├── firebase.json / .firebaserc     # Firebase 配置（project: rebloom-cup）
├── apphosting.yaml                 # Firebase App Hosting 配置
├── .env.example                    # 环境变量清单
└── legacy/                         # 旧版 Vite 前端 + Express 后端（保留 git 历史，未删除）
```

## 2. 文字版架构图

```
┌──────────────────────────── 浏览器（Next.js App Router · Client Components）────────────────────────────┐
│  落地页 → onboarding → skills → opportunities → tasks-lab → plan                                        │
│  对话广场 / 导师社区 / 我的预约 / AI Coach / 证据库 / 工作台                                            │
│           │  apiGet / apiSend（src/lib/client.ts）                                                       │
└───────────┼──────────────────────────────────────────────────────────────────────────────────────────┘
            │  HTTP / SSE
┌───────────▼─────────────────────  Next.js Route Handlers（runtime = nodejs）─────────────────────────────┐
│  /api/auth/session  /api/skills  /api/opportunities  /api/plan  /api/plan-tasks  /api/tasks-lab(+submit) │
│  /api/evidence  /api/coach/chat(SSE)  /api/plaza(+[id]+willing)  /api/peer-chats                          │
│  /api/mentors(+[id])  /api/mentor/profile  /api/mentor/slots  /api/bookings  /api/reviews                │
│  /api/circles(+[id])  /api/dashboard  /api/profile  /api/my-sessions                                     │
│           │                                                                                              │
│           ├─▶ src/lib/store.ts     服务端内存数据层（globalThis 单例，模拟 Firestore）                    │
│           └─▶ src/lib/ai.ts        AI 占位层（buildSkillProfile / coachReply / evaluateSubmission …）      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │  将来：接 agent platform（AI Coach）
            ▼
    Google Agent Platform 上的 ReBloom AI Coach Agent ──▶ Gemini
            │
            ▼  部署时替换内存层为真实持久化
   Firebase（Auth 邮箱+Google / Firestore Native / Storage）──▶ 规则 firestore.rules + 索引
```

## 3. 数据模型（Firestore 集合，对齐规范 §6）

| 集合 | 结构要点 |
| --- | --- |
| `users/{uid}` | 档案：name/email/currentRole/targetRole/skills[]/goals[]/constraints/lifeStage/confidenceSelf/journeyStep/coffeeAvailability[]/communityAgreed |
| `publicProfiles/{uid}` | 社区可见字段子集（供广场预约读取；避免暴露完整私有档案） |
| `skillProfiles/{uid}` | 技能发现：transferableSkills[] + uniqueValue + confidenceCalibration[] |
| `opportunityReports/{uid}` | 机会分析：roleMatches[] + womenFriendlyTracks[] + genderRiskHints[] |
| `returnPlans/{uid}` / `planTasks/{id}` | 30 天计划与任务（learning/practice/milestone） |
| `labTasks/{id}` | 实操任务 + submissions[]（含 rubric 反馈与评分） |
| `evidences/{id}` | 证据库：8 种 type + source(auto/manual) + tags[] + relatedId + isPublic |
| `plazaPosts/{id}` + `comments/` + `willingToHelp/{helperUid}` + `private/meta` | 广场；**authorId 存于 private 子文档，非本人不可读** |
| `peerChats/{id}` | 同辈免费预约：requested→confirmed→completed，含 chatLink/appreciation |
| `mentors/{id}` / `mentorSlots/{id}` | 导师与档期（**导师文档永不含 meetingLink**） |
| `bookings/{id}` / `packageOrders/{id}` / `reviews/{id}` / `endorsements/{id}` | 付费担保交易链路（held→confirmed→completed→released） |
| `posts/{id}` + `comments/` / `kudos/` / `reports/` | 圈子通用 |
| `conversations/{uid}/messages/{mid}` | AI Coach 对话记录 |

**关键业务规则**：证据自动沉淀（测评/计划勾选/任务提交/released 赠言/peer chat 完成后的感谢/帖子加油达 3/里程碑 1·5·10）；自信度 = 起始 40 + 加权（导师背书 8、同辈感谢 6、测评 6、作品 6、任务进展 3、里程碑 5、同辈认可 2），上限 100；匿名花名、并发 409、越权 403、未登录 401。

## 4. 设计系统

科技 × 简约 × 温暖。主基调为**银色金属感**（页面底 `#EEF0F4`、卡片白、`rounded-2xl`、极浅金属渐变条用于导航下沿与进度轨道）；点缀暖色：暖珊瑚橘 `#E8725C`（主 CTA / 当前步高亮 / 加油态）、柔粉 `#F3B8C8` / 杏粉 `#F9E4E0`（证据墙 / 求助帖 /「我可以」标签）、强调文字石板蓝灰 `#3E4C63`、状态色 confirmed 石板蓝 / released 暖绿 `#7FB685` / rejected 暖红。中文字体使用系统字体栈（不依赖被墙的 Google Fonts）。完整色板见 [tailwind.config.ts](tailwind.config.ts)。

---

## 5. 本地运行

```bash
npm install
npm run dev            # http://localhost:3000
```

无需任何凭据即可运行（数据为内存模拟）。构建与类型校验：

```bash
npx tsc --noEmit       # 类型检查
npm run build          # 生产构建
```

### 演示账号（密码统一 `ReBloom123!`）

| 账号 | 说明 |
| --- | --- |
| `demo.returner@rebloom.test` | 产后回归 · 林知夏（**完整数据**：技能发现 + 机会分析 + 30 天计划 + 2 个实操任务 + 8 条证据 + 2 条 released 导师预约 + 1 条 completed peer chat） |
| `demo.explorer@rebloom.test` | 在校探索 · 陈思远（全新账号，适合从零体验完整 6 步旅程） |
| `demo.mentor1@rebloom.test` | 导师 · 林知夏（前大厂 AI 产品经理，¥299 / ¥1299） |
| `demo.mentor2@rebloom.test` | 导师 · 周明远（女性科技创业者，¥399 / ¥1799） |
| `demo.mentor3@rebloom.test` | 导师 · 苏叶（AI 运营专家，¥199 / ¥899） |

> 原型阶段登录为页面内「演示账号切换」，尚未接 Firebase Auth。

---

## 6. 环境变量清单

见 [.env.example](.env.example)。关键项：

| 变量 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` / `..._AUTH_DOMAIN` / `..._PROJECT_ID` / `..._STORAGE_BUCKET` / `..._MESSAGING_SENDER_ID` / `..._APP_ID` | 浏览器端 Firebase 配置 |
| `GEMINI_API_KEY` | 服务端 AI 密钥（**现阶段留空即可**，AI 未接入） |
| `SERVICE_ACCOUNT_PATH` / `GOOGLE_APPLICATION_CREDENTIALS` | 播种脚本使用服务账号 |
| `FIREBASE_PROJECT_ID` | 默认 `rebloom-cup` |

---

## 7. 接下来：接入 AI Coach agent（agent platform）

AI 相关逻辑全部收敛在 [src/lib/ai.ts](file:///Users/yujiejiang/bloomforher/src/lib/ai.ts) 单点。接入步骤：

1. 在 agent platform 搭好 ReBloom AI Coach Agent，按 §5.7 配置 system prompt（注入：用户档案、lifeStage、技能发现、机会分析、30 天计划进度、最近 5 条证据、近期预约；红线：证据重构法、暂停不等于淘汰、情绪低落时引导去广场、不虚构经历、不给医疗/法律建议）。
2. 在项目内新增 agent 调用客户端（替换 `ai.ts` 内 `coachReply` 等占位实现），`/api/coach/chat` 保持 SSE 流式输出不变。
3. 配置 `GEMINI_API_KEY`（或 agent 服务的凭据）为 App Hosting secret。

## 8. 部署（Firebase App Hosting）

> 规范要求实际执行并写入 README；**当前处于原型阶段，尚未部署**，以下为执行清单。

1. `npm i -g firebase-tools` → `firebase login`；Firebase Console 新建项目 `rebloom-cup`，启用 Authentication（邮箱 + Google）、Firestore Native、Storage。
2. Google AI Studio 申请 `GEMINI_API_KEY`，在 App Hosting 配置为服务端 secret；`NEXT_PUBLIC_FIREBASE_*` 配普通环境变量（见 [apphosting.yaml](apphosting.yaml)）。
3. `firebase init apphosting firestore storage`；部署规则与索引：
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
4. 代码推 GitHub，App Hosting 连仓库部署（或 `firebase apphosting:backends:create`）；**region 选 `asia-southeast1`**。
5. 本地放置服务账号私钥，运行播种：
   ```bash
   SERVICE_ACCOUNT_PATH=./serviceAccountKey.json npm run seed
   ```
6. 部署后按验收标准走一遍（见下）。

**重新部署 / 重新播种**

```bash
firebase deploy                       # 重新部署
npm run seed                          # 重新播种（幂等：先清后插）
```

**线上 URL**：`待部署（部署后填写，如 https://rebloom-cup.web.app）`

---

## 9. 验收自检（§11）

| 项 | 状态 |
| --- | --- |
| `npm run build` 通过 | ✅ 37 条路由全部构建成功 |
| `npx tsc --noEmit` 通过 | ✅ 无类型错误 |
| 无 simulator 残留 / 无管理员入口 | ✅ |
| 色板符合 §8（银灰金属底 + 珊瑚橘/柔粉点缀） | ✅ |
| 6 步旅程 + 广场 + 导师 + Coach + 证据库 + 工作台全流程可交互 | ✅（内存数据层） |
| AI 回复为真实模型 | ⏳ 待接 agent platform（当前为占位层） |
| 线上 URL + GitHub + 部署 | ⏳ 待部署 |

## 10. 30 秒演示口播脚本

> （对应 §11 端到端 Demo，用 `demo.explorer` 从零跑一条，或直接用 `demo.returner` 看完整数据）

「很多女性不是没有能力，是**低估了自己和技术的相关性**。ReBloom 做的事很简单——

**第一，把经验翻译成证据。** 建档后，技能发现页告诉你：你带过的项目、协调过的人，本身就是 AI 岗位要的能力，并用一张『自评 vs AI』矫正板，把被低估的自己找回来。

**第二，把方向变成可执行。** AI 机会页给出 3 个匹配岗位和女性友好赛道；实操任务让你 30 分钟做出第一个 AI 作品、拿到反馈和评分；30 天计划适配你的节奏——**暂停不等于淘汰**。

**第三，让陪伴变成双轨。** 情绪低落时，AI Coach 不灌鸡汤，而是**调出你自己的证据**，把『凭什么是我』重构为『为什么不能是我』，并建议你去**对话广场**看看别的姐妹——广场是公益的，一句『I'm willing to help』就能约上一位同辈免费聊天；需要更专业的支持时，再约认证导师，费用托管、**只有你确认会话完成才会放款**。

所有正向反馈——导师背书、同辈感谢、加油——都会自动沉淀成你证据库里一条条『**我可以**』。

从 **Why me**，到 **Why not me**。」

---

## 附：脚本与配置速查

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发（内存数据） |
| `npm run build` / `npm start` | 生产构建 / 启动 |
| `npx tsc --noEmit` | 类型检查 |
| `npm run seed` | 幂等播种 Firestore（需服务账号） |
| `firebase deploy` | 部署规则/索引（App Hosting 部署见 §8） |
