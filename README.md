# ReBloom AI · 她径

> 让女性的 AI 选择，从 **Why me** 走向 **Why not me**。
>
> 面向女性的 AI 职业转型赋能平台：以「证据驱动」的方式，把过往经验翻译成 AI 时代的可迁移能力，用**同辈互助（免费）+ 专业导师（付费担保）双轨**陪伴每一位女性完成转型。

**当前状态：产品原型（Phase 2 — Cloud Run 已部署）**

- ✅ 全部页面与交互流程已实现，使用**双模式数据层**（内存 fallback + Firestore 持久化）；
- ✅ **Agent Platform 已接入**：5 个独立 Agent（评估、教练、记忆、主动、匹配）在 GCP Agent Studio 运行，通过 Reasoning Engine 调用；
- ✅ **Cloud Run 已部署**（见 §8）。

---

## 1. 目录结构

```
bloomforher/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 全局布局：AuthProvider + Navbar + footer
│   │   ├── globals.css             # Tailwind 指令 + 金属质感工具类
│   │   ├── page.tsx                # 落地页：三步核心链路 + hero
│   │   ├── onboarding/             # 旅程 ① 建档（多屏表单）
│   │   ├── skills/                 # 旅程 ② 技能发现（可迁移技能 + 自信度矫正板）
│   │   ├── opportunities/          # 旅程 ③ AI 机会（岗位匹配 + 女性友好赛道）
│   │   ├── tasks-lab/              # 旅程 ④ 实操任务（提交 → 流式反馈 + 评分）
│   │   ├── plan/                   # 旅程 ⑤ 30 天回归计划（可暂停/调整）
│   │   ├── plaza/ + plaza/[id]/    # 对话广场（小红书式图文社区 · 我愿同行 · 免费同辈互助）
│   │   ├── community/              # 导师社区
│   │   ├── mentors/[id]/           # 导师详情 + 档期预约
│   │   ├── my-sessions/            # 我的预约（同辈互助区 + 导师会话区）
│   │   ├── coach/                  # 贯穿层 A：AI Mentor（SSE 流式）
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
│       ├── store.ts                # 双模式数据层（内存 + Firestore 同步）
│       ├── firestore.ts            # GCP Firestore 客户端（懒加载）
│       ├── ai.ts                   # ⬅ Agent Platform 调用层（5 个 Agent）
│       ├── agent-client.ts         # Reasoning Engine query API 客户端
│       ├── accounts.ts             # 客户端安全常量（演示账号）
│       ├── session.ts              # 服务端会话（cookie，替代 Firebase Auth）
│       └── client.ts               # 前端请求封装（apiGet / apiSend）
├── scripts/seed.ts                 # ⬅ 幂等播种脚本（firebase-admin，先清后插）
├── Dockerfile                      # Cloud Run 容器镜像（node:20-alpine + standalone）
├── cloudbuild.yaml                 # Cloud Build CI/CD（构建 → 推送 → 部署）
├── firestore.rules                 # Firestore 安全规则
├── firestore.indexes.json          # 复合索引清单
└── .env.local                      # 环境变量（Agent endpoint / GOOGLE_CLOUD_PROJECT）
```

---

## 2. GCP 技术架构

```
┌──────────────────────────────────── 浏览器（Next.js App Router · React 18）────────────────────────────────────┐
│  落地页 → onboarding → skills → opportunities → tasks-lab → plan                                               │
│  对话广场 / 导师社区 / 我的预约 / AI Mentor / 证据库 / 工作台                                                   │
│  导航栏仅保留「首页 · AI Mentor · 对话广场」，其余收拢至 AI Mentor「更多功能」                                    │
└───────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │  HTTP / SSE
┌───────────▼────────────────────────────── Next.js Route Handlers（runtime = nodejs）────────────────────────────┐
│  /api/auth/session  /api/skills  /api/opportunities  /api/plan  /api/plan-tasks  /api/tasks-lab(+submit)         │
│  /api/evidence  /api/coach/chat(SSE)  /api/plaza(+[id]+willing)  /api/peer-chats                                │
│  /api/mentors(+[id])  /api/mentor/profile  /api/mentor/slots  /api/bookings  /api/reviews                       │
│  /api/circles(+[id])  /api/dashboard  /api/profile  /api/my-sessions                                            │
│                                                                                                                  │
│  ├─▶ src/lib/store.ts          双模式数据层（内存 fallback + Firestore 持久化）                                │
│  └─▶ src/lib/ai.ts             Agent Platform 调用层（7 个函数 → 5 个 Agent）                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │
            │  内部网络调用（GCP OAuth token endpoint，Cloud Run 内网可用）
            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  GCP Agent Studio — 5 个独立 Agent（Gemini 模型）                                                                │
│  ├─ rebloom-assessment      评估 Agent：技能画像、机会分析、回归计划、实操任务、提交评分                           │
│  ├─ rebloom-coach           教练 Agent：AI Mentor 对话、内容安全审核、周度总结                                     │
│  ├─ rebloom-memory          记忆 Agent：RAG 知识库检索（公共职业知识 + 用户私有记忆）                             │
│  ├─ rebloom-proactive       主动 Agent：触发式提醒、行为分析、干预策略                                             │
│  └─ rebloom-mentor-match    匹配 Agent：导师推荐匹配                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
  Cloud Firestore（持久化）   /   Google Cloud Storage（简历/证明）
```

### Agent 调用链路

```
用户消息 → /api/coach/chat → src/lib/ai.ts/coachReply()
                                              │
                                              ▼
                          src/lib/agent-client.ts/callAgentEndpoint()
                                              │
                                              ▼
                          projects/{project}/locations/{location}/reasoningEngines/{id}/:query
                                              │
                                              ▼
                          ReBloom Coach Agent（Gemini，注入 4 层记忆）
                                              │
                                              ▼
                          SSE 流式返回 → 浏览器
```

**内容安全审核**：对话广场发帖前，自动调用 rebloom-coach Agent 进行温和内容审核（仅拦截仇恨言论/暴力威胁/歧视/色情/恶意攻击，正常分享/吐槽/消极表达均放行）。

---

## 3. 数据模型（Firestore 集合）

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

---

## 4. 设计系统

科技 × 简约 × 温暖。主基调为**银色金属感**（页面底 `#EEF0F4`、卡片白、`rounded-2xl`、极浅金属渐变条用于导航下沿与进度轨道）；点缀暖色：暖珊瑚橘 `#E8725C`（主 CTA / 当前步高亮 / 加油态）、柔粉 `#F3B8C8` / 杏粉 `#F9E4E0`（证据墙 / 求助帖 /「我可以」标签）、强调文字石板蓝灰 `#3E4C63`、状态色 confirmed 石板蓝 / released 暖绿 `#7FB685` / rejected 暖红。中文字体使用系统字体栈（不依赖 Google Fonts）。完整色板见 [tailwind.config.ts](tailwind.config.ts)。

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
| `demo.explorer@rebloom.test` | 在校探索 · 陈思远（全新账号，适合从零体验完整旅程） |
| `demo.mentor1@rebloom.test` | 导师 · 林知夏（前大厂 AI 产品经理，¥299 / ¥1299） |
| `demo.mentor2@rebloom.test` | 导师 · 周明远（女性科技创业者，¥399 / ¥1799） |
| `demo.mentor3@rebloom.test` | 导师 · 苏叶（AI 运营专家，¥199 / ¥899） |

> 原型阶段登录为页面内「演示账号切换」，尚未接 Firebase Auth。

---

## 6. 环境变量清单

见 [.env.example](.env.example)。关键项：

| 变量 | 用途 |
| --- | --- |
| `AGENT_ENDPOINT_ASSESSMENT` | 评估 Agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_COACH` | 教练 Agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_MEMORY` | 记忆 Agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_PROACTIVE` | 主动 Agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_MENTOR_MATCH` | 匹配 Agent Reasoning Engine endpoint |
| `GOOGLE_CLOUD_PROJECT` | GCP 项目 ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | 服务账号路径（本地播种用） |
| `NEXT_PUBLIC_FIREBASE_*` | 浏览器端 Firebase 配置 |

---

## 7. Agent Platform 架构

5 个独立 Agent 在 GCP Agent Studio 创建，通过 Reasoning Engine `query` API 调用：

| Agent | 职责 | AI 函数映射 |
| --- | --- | --- |
| **rebloom-assessment** | 评估 Agent | `buildSkillProfile` / `buildOpportunityReport` / `buildReturnPlan` / `buildLabTasks` / `evaluateSubmission` |
| **rebloom-coach** | 教练 Agent | `coachReply` / `buildWeeklyConfidenceSummary` / `moderateContent` |
| **rebloom-memory** | 记忆 Agent | RAG 知识库检索（公共职业知识 + 用户私有记忆） |
| **rebloom-proactive** | 主动 Agent | 触发式提醒、行为分析、干预策略 |
| **rebloom-mentor-match** | 匹配 Agent | 导师推荐匹配 |

**Prompt 注入 4 层记忆**：所有上传简历的解析文本、coachNote、跟踪的行动项 + 技能、诊断报告关键结论。

**本地开发限制**：中国大陆网络无法访问 GCP OAuth token endpoint，Agent 调用自动回退到占位逻辑；部署到 Cloud Run 后 GCP 内部网络无限制，Agent 调用正常。

---

## 8. 部署（Cloud Run）

### 架构

```
GitHub (main 分支) → Cloud Build 触发器 → Docker 构建 → GCR → Cloud Run
```

### 已完成的配置

1. ✅ Cloud Build 触发器：push 到 `main` 分支自动触发
2. ✅ `Dockerfile`：`node:20-alpine` + multi-stage + standalone 输出
3. ✅ `cloudbuild.yaml`：3 步（build → push → deploy），Agent endpoint 直接写死
4. ✅ Cloud Run 服务：`rebloom-ai`，region `asia-southeast1`，允许未认证访问

### 线上 URL

**https://rebloom-ai-107927033625.asia-southeast1.run.app**

### 重新部署

推送代码到 `main` 分支即可自动触发 Cloud Build：

```bash
git push origin main
```

或在 GCP Console → Cloud Build → 触发器 → 手动触发。

---

## 9. 验收自检

| 项 | 状态 |
| --- | --- |
| `npm run build` 通过 | ✅ 37 条路由全部构建成功 |
| `npx tsc --noEmit` 通过 | ✅ 无类型错误 |
| 无 simulator 残留 / 无管理员入口 | ✅ |
| 色板符合 §8（银灰金属底 + 珊瑚橘/柔粉点缀） | ✅ |
| 核心链路（诊断 → AI Mentor → 对话广场）全流程可交互 | ✅ |
| AI 回复为真实模型 | ✅ Agent Platform 已接入 |
| 内容安全审核 | ✅ rebloom-coach 温和审核 |
| 线上 URL + GitHub + Cloud Run 部署 | ✅ |

---

## 10. 30 秒演示口播脚本

> （用 `demo.returner` 登录，体验完整数据）

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
| `git push origin main` | 触发 Cloud Build 自动部署 |
