# 闲 - 产品需求文档 (PRD)

## 产品名称

**闲** (Xián)

## 命名理念

源自宇宙弦理论（String Theory）—— 弦是一切物质的基本构成单位。我们将每个用户的本源数据可视化为三角形（弦的基础形态），体现**第一性原则**：从最本源、最真实的数据出发，还原用户最真实的自我。

## 产品概述

一个基于真实社交媒体数据的轻社交Web应用，通过数据可视化和AI场景生成，帮助用户建立更真实的社交连接。

## 核心理念

- **去伪存真**：不依赖用户自我包装，通过抖音真实行为数据呈现用户本质
- **第一性原则**：如同弦理论将宇宙归一到最基础单位，我们从用户最本源的数据出发
- **减少障碍**：消除因数据包装产生的交流误会

## 核心功能

### 1. 数据可视化（弦形态）
- 将用户的抖音行为数据转化为独特的三角形（弦）
- 形状反映用户的数据特征和行为模式
- 页面上分布展示多个用户的弦

### 2. 碰撞交互
- 拖拽自己的弦与他人碰撞
- 松手触发信息展示

### 3. 双维度信息展示

**维度一：数据对比**
- 展示两个用户的数据差异
- 对比观看偏好、评论风格、内容创作等

**维度二：AI场景化性格分析**
- 基于数据倾向生成具体场景故事
- 以故事形式呈现用户在特定场景下的可能表现

## 产品价值

1. **真实匹配**：基于真实数据进行社交匹配
2. **深度了解**：场景化描述帮助提前了解对方
3. **精准社交**：弦形相近者更易找到灵魂伴侣
4. **增强信任**：第一性原则增加社交可信度

## 弦形态算法

### 思维三维度模型

三角形的三个顶点代表人的思维三个维度：

```
        求知 (Cognition)
           /\
          /  \
         /    \
        /      \
       /________\
 共情              愉悦
(Empathy)      (Pleasure)
```

| 维度 | 本质 | 心理驱动 |
|------|------|----------|
| **求知** | "我想理解这个世界" | 好奇心、掌控感、确定性 |
| **共情** | "我想与世界连接" | 归属感、被理解、情感释放 |
| **愉悦** | "我想此刻快乐" | 多巴胺、放松、逃避现实 |

### 视频类型 → 维度映射

| 视频类型 | 求知 | 共情 | 愉悦 |
|----------|------|------|------|
| 知识科普 | 0.9 | 0.1 | 0.0 |
| 新闻资讯 | 0.7 | 0.2 | 0.1 |
| 教程技能 | 0.8 | 0.1 | 0.1 |
| 情感故事 | 0.1 | 0.8 | 0.1 |
| 音乐MV | 0.1 | 0.6 | 0.3 |
| 宠物萌宠 | 0.0 | 0.5 | 0.5 |
| 搞笑段子 | 0.0 | 0.1 | 0.9 |
| 游戏直播 | 0.1 | 0.2 | 0.7 |
| 美食探店 | 0.2 | 0.2 | 0.6 |
| 励志鸡汤 | 0.3 | 0.5 | 0.2 |
| 社会议题 | 0.5 | 0.4 | 0.1 |

### 行为权重加成

| 行为 | 权重 | 理由 |
|------|------|------|
| 刷过 | ×1.0 | 基础权重 |
| 看完 >80% | ×1.5 | 真正感兴趣 |
| 点赞 | ×2.0 | 主动认可 |
| 评论 | ×2.5 | 强烈互动 |
| 深夜观看 | ×1.3 | 更真实 |

### 颜色计算

三维度对应 RGB 色彩空间：

```
求知 → 蓝色 (B)
共情 → 红色 (R)
愉悦 → 绿色 (G)
```

```typescript
const color = {
  r: Math.round(empathy * 2.55),
  g: Math.round(pleasure * 2.55),
  b: Math.round(cognition * 2.55)
}
```

---

## 二、技术架构

### 技术栈

| 层级 | 技术选型 | 说明 |
| --- | --- | --- |
| 框架 | Next.js 15 (App Router) | React 全栈框架，SSR/SSG/API Routes |
| 语言 | TypeScript | 类型安全 |
| 样式 | Tailwind CSS v4 | 原子化 CSS |
| UI 组件 | shadcn/ui | 基于 Radix UI，代码可控 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 数据库 | SQLite + Prisma | 轻量数据库 + 类型安全 ORM |
| 部署 | Vercel / 自托管 | 一键部署或 Docker 自托管 |

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 全栈应用                          │
├─────────────────────────────────────────────────────────────┤
│  前端层 (React + App Router)                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐          │
│  │ 登录授权 │  │ 弦可视化 │  │ 碰撞交互 + 结果  │          │
│  └──────────┘  └──────────┘  └──────────────────┘          │
│                                                             │
│  状态管理: Zustand    UI: shadcn/ui + Tailwind CSS          │
├─────────────────────────────────────────────────────────────┤
│  后端层 (API Routes + Server Actions)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐          │
│  │  Auth    │  │  User    │  │     Match        │          │
│  │  API     │  │  API     │  │     API          │          │
│  └──────────┘  └──────────┘  └──────────────────┘          │
│  ┌──────────┐  ┌──────────┐                                 │
│  │  Douyin  │  │    AI    │                                 │
│  │  API     │  │   API    │                                 │
│  └──────────┘  └──────────┘                                 │
├─────────────────────────────────────────────────────────────┤
│  数据层                                                      │
│  ┌──────────────────────────────────────────────┐          │
│  │  Prisma ORM  →  SQLite Database              │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### API 路由设计

```typescript
// Auth - 认证相关
POST   /api/auth/douyin/callback   // 抖音OAuth回调
POST   /api/auth/refresh           // 刷新Token
POST   /api/auth/logout            // 登出

// User - 用户相关
GET    /api/users/me               // 获取当前用户
GET    /api/users/me/string        // 获取我的弦数据
GET    /api/users/online           // 获取在线用户列表（弦展示）
DELETE /api/users/me               // 注销账号

// Match - 匹配相关
POST   /api/match/collision        // 发起碰撞
GET    /api/match/result/:id       // 获取碰撞结果
GET    /api/match/history          // 历史匹配记录

// AI - AI生成
POST   /api/ai/generate-scene      // 生成场景故事（内部调用）
```

---

## 三、安全问题

### 1. 认证授权

```typescript
// middleware.ts - Next.js 中间件认证
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')

  if (!token && request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*']
}
```

### 2. 数据加密

```typescript
// 敏感字段加密存储 - Prisma 中间件
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'create') {
    if (params.args.data.douyinToken) {
      params.args.data.douyinToken = encrypt(params.args.data.douyinToken)
    }
  }
  return next(params)
})
```

### 3. 限流配置

```typescript
// 使用 rate-limiter-flexible 或 upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 每分钟100次
})

// API Route 中使用
const { success } = await ratelimit.limit(identifier)
if (!success) {
  return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
}
```

### 4. 输入验证

```typescript
// 使用 zod 进行类型安全的输入验证
import { z } from 'zod'

const CollisionSchema = z.object({
  targetUserId: z.string().cuid(),
})

// API Route 中使用
export async function POST(request: Request) {
  const body = await request.json()
  const result = CollisionSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // 处理逻辑...
}
```

### 5. 安全清单

| 风险 | 措施 |
| --- | --- |
| XSS | React 自动转义 + CSP Header |
| CSRF | SameSite Cookie + 双重验证 |
| SQL注入 | Prisma 参数化查询 |
| 敏感数据泄露 | Server Actions 隐藏敏感逻辑 |
| Token泄露 | HttpOnly Cookie 存储 |
| 抖音Token | 服务端存储，前端不可见 |

---

## 四、边界 Case 处理

### 全局错误处理

```typescript
// app/error.tsx - Next.js 错误边界
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>出错了</h2>
      <button onClick={() => reset()}>重试</button>
    </div>
  )
}
```

### 具体场景处理

| 场景 | 后端处理 | 前端处理 |
| --- | --- | --- |
| 抖音授权失败 | 返回 401 + 错误信息 | 重定向到授权页 |
| 用户数据为空 | 返回 `{ data: null, isEmpty: true }` | 显示默认弦 + 提示 |
| AI超时(30s) | Promise.race + 兜底文案 | 显示loading后展示兜底 |
| 目标用户不存在 | 返回 404 | 提示"用户已离开" |
| 并发碰撞 | 数据库事务锁 | 按钮 disable + loading |
| 限流触发 | 返回 429 | Toast提示"操作过频繁" |
| 数据库连接失败 | 健康检查 + 告警 | 全局错误页 |

### 空值处理策略

```typescript
// 服务端
async function getUserString(userId: string) {
  const data = await prisma.userData.findUnique({ where: { userId } })

  if (!data || !data.douyinData) {
    return {
      string: generateDefaultString(), // 默认弦
      isEmpty: true,
      message: '数据不足，展示默认形态',
    }
  }

  return { string: calculateString(data), isEmpty: false }
}
```

---

## 五、开发规范

### 1. 架构设计理念

本项目采用 **Feature-based Architecture**（功能驱动架构），核心原则：

| 原则 | 说明 |
| --- | --- |
| **路由与逻辑分离** | `app/` 目录仅负责路由定义，业务逻辑放在 `features/` |
| **功能模块化** | 按业务功能（而非技术类型）组织代码 |
| **单向依赖** | 上层可依赖下层，下层不可依赖上层 |
| **共置原则** | 相关文件放在一起（组件+样式+测试+类型） |

**依赖层级（从上到下）：**

```
app/        → 路由入口，仅导入和组装
features/   → 业务功能模块（auth, match, visualization）
entities/   → 业务实体（user, string-data）
shared/     → 共享代码（ui, lib, hooks, types）
```

### 2. 项目目录结构

```
xian/
├── prisma/                           # Prisma ORM
│   ├── schema.prisma                # 数据库模型定义
│   └── migrations/                  # 迁移文件
│
├── public/                           # 静态资源
│   └── assets/
│
├── src/
│   ├── app/                          # Next.js App Router（仅路由）
│   │   ├── layout.tsx               # 根布局
│   │   ├── page.tsx                 # 首页（导入 features）
│   │   ├── globals.css              # 全局样式
│   │   ├── error.tsx                # 全局错误边界
│   │   ├── loading.tsx              # 全局加载状态
│   │   ├── not-found.tsx            # 404 页面
│   │   │
│   │   ├── (auth)/                  # 认证路由组（不影响 URL）
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # → /login
│   │   │   └── callback/
│   │   │       └── page.tsx         # → /callback
│   │   │
│   │   ├── (main)/                  # 主功能路由组
│   │   │   ├── layout.tsx           # 主功能布局（导航栏等）
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # → /dashboard
│   │   │   └── match/
│   │   │       ├── page.tsx         # → /match
│   │   │       └── [id]/
│   │   │           └── page.tsx     # → /match/:id
│   │   │
│   │   └── api/                     # API Routes
│   │       ├── auth/
│   │       │   ├── callback/route.ts
│   │       │   ├── refresh/route.ts
│   │       │   └── logout/route.ts
│   │       ├── users/
│   │       │   ├── me/route.ts
│   │       │   └── online/route.ts
│   │       ├── match/
│   │       │   ├── collision/route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── history/route.ts
│   │       └── ai/
│   │           └── generate-scene/route.ts
│   │
│   ├── features/                     # 业务功能模块
│   │   ├── auth/                    # 认证功能
│   │   │   ├── components/          # 功能专属组件
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── oauth-button.tsx
│   │   │   ├── hooks/               # 功能专属 hooks
│   │   │   │   └── use-auth.ts
│   │   │   ├── actions/             # Server Actions
│   │   │   │   └── auth.actions.ts
│   │   │   ├── lib/                 # 功能专属工具
│   │   │   │   └── token.ts
│   │   │   ├── types.ts             # 功能类型定义
│   │   │   └── index.ts             # 公开导出
│   │   │
│   │   ├── visualization/           # 弦可视化功能
│   │   │   ├── components/
│   │   │   │   ├── string-canvas.tsx    # 画布容器
│   │   │   │   ├── string-shape.tsx     # 弦形态组件
│   │   │   │   └── shape-renderer.tsx   # 形态渲染器
│   │   │   ├── hooks/
│   │   │   │   ├── use-canvas.ts
│   │   │   │   └── use-drag.ts
│   │   │   ├── lib/
│   │   │   │   ├── shape-calculator.ts  # 形态计算
│   │   │   │   └── animation.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── match/                   # 碰撞匹配功能
│   │       ├── components/
│   │       │   ├── collision-area.tsx
│   │       │   ├── result-panel.tsx
│   │       │   └── compare-view.tsx
│   │       ├── hooks/
│   │       │   └── use-collision.ts
│   │       ├── actions/
│   │       │   └── match.actions.ts
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   ├── entities/                     # 业务实体
│   │   ├── user/
│   │   │   ├── model.ts             # 用户模型/类型
│   │   │   ├── api.ts               # 用户相关 API 调用
│   │   │   └── index.ts
│   │   │
│   │   └── string-data/
│   │       ├── model.ts             # 弦数据模型
│   │       ├── api.ts
│   │       └── index.ts
│   │
│   ├── shared/                       # 共享代码
│   │   ├── ui/                      # UI 组件（shadcn/ui）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── index.ts             # 统一导出
│   │   │
│   │   ├── layouts/                 # 布局组件
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── lib/                     # 工具库
│   │   │   ├── utils.ts             # 通用工具函数
│   │   │   ├── db.ts                # Prisma 客户端单例
│   │   │   ├── api-client.ts        # API 请求封装
│   │   │   └── constants.ts         # 全局常量
│   │   │
│   │   ├── hooks/                   # 通用 Hooks
│   │   │   ├── use-media-query.ts
│   │   │   ├── use-local-storage.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types/                   # 全局类型定义
│   │   │   ├── api.ts               # API 响应类型
│   │   │   ├── common.ts            # 通用类型
│   │   │   └── index.ts
│   │   │
│   │   └── config/                  # 配置
│   │       └── site.ts              # 站点配置
│   │
│   ├── stores/                       # Zustand 状态管理
│   │   ├── user.store.ts            # 用户状态
│   │   ├── ui.store.ts              # UI 状态
│   │   └── index.ts
│   │
│   └── generated/                    # 自动生成的代码
│       └── prisma/                  # Prisma Client
│
├── .env                              # 环境变量
├── .env.example                      # 环境变量示例
├── components.json                   # shadcn/ui 配置
├── next.config.ts                    # Next.js 配置
├── tailwind.config.ts                # Tailwind 配置
├── tsconfig.json                     # TypeScript 配置
└── package.json
```

### 3. 目录职责说明

| 目录 | 职责 | 示例 |
| --- | --- | --- |
| `app/` | **仅路由定义**，不含业务逻辑。页面组件从 `features/` 导入 | `page.tsx` 导入 `<Dashboard />` |
| `features/` | 业务功能模块，包含该功能的组件、hooks、actions、类型 | `auth/`, `match/`, `visualization/` |
| `entities/` | 业务实体的模型定义和 API 调用 | `user/`, `string-data/` |
| `shared/ui/` | 通用 UI 组件（shadcn/ui），无业务逻辑 | `Button`, `Card`, `Input` |
| `shared/lib/` | 通用工具函数和服务 | `utils.ts`, `db.ts`, `api-client.ts` |
| `shared/hooks/` | 通用自定义 Hooks | `useMediaQuery`, `useLocalStorage` |
| `shared/types/` | 全局类型定义 | API 响应类型、通用接口 |
| `stores/` | Zustand 全局状态 | `user.store.ts`, `ui.store.ts` |

### 4. 路由约定

| 约定 | 语法 | 示例 |
| --- | --- | --- |
| 路由组 | `(groupName)` | `(auth)/login` → `/login` |
| 动态路由 | `[param]` | `match/[id]` → `/match/123` |
| 可选捕获 | `[[...slug]]` | `docs/[[...slug]]` → `/docs`, `/docs/a/b` |
| 私有文件夹 | `_folderName` | `_components/` 不可路由 |
| 并行路由 | `@slotName` | `@modal/` 并行渲染 |

### 5. Feature 模块结构

每个 Feature 模块遵循统一结构：

```
features/[feature-name]/
├── components/              # 功能专属组件
│   ├── feature-component.tsx
│   └── sub-component.tsx
├── hooks/                   # 功能专属 Hooks
│   └── use-feature.ts
├── actions/                 # Server Actions
│   └── feature.actions.ts
├── lib/                     # 功能专属工具
│   └── helper.ts
├── types.ts                 # 功能类型定义
└── index.ts                 # 公开导出（Barrel Export）
```

**index.ts 示例：**

```typescript
// features/auth/index.ts
export { LoginForm } from './components/login-form'
export { useAuth } from './hooks/use-auth'
export type { AuthState, LoginCredentials } from './types'
```

### 6. 命名规范

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| 目录名 | kebab-case | `string-data/`, `use-auth/` |
| 组件文件 | kebab-case | `login-form.tsx`, `string-shape.tsx` |
| 组件导出 | PascalCase | `export function LoginForm()` |
| Hooks 文件 | kebab-case + use- | `use-auth.ts`, `use-collision.ts` |
| Hooks 导出 | camelCase + use | `export function useAuth()` |
| Actions 文件 | kebab-case + .actions | `auth.actions.ts` |
| 类型文件 | kebab-case | `types.ts` 或 `feature.types.ts` |
| Store 文件 | kebab-case + .store | `user.store.ts` |
| 工具函数 | camelCase | `formatDate()`, `calculateShape()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 环境变量 | UPPER_SNAKE_CASE | `DATABASE_URL`, `NEXT_PUBLIC_*` |

### 7. 组件设计原则

**分层原则：**

```
shared/ui/     → 原子组件：Button, Input, Card（无业务逻辑）
shared/layouts/→ 布局组件：Header, Sidebar（结构性）
features/*/    → 功能组件：LoginForm, StringShape（含业务逻辑）
app/           → 页面组件：page.tsx（组装和路由）
```

**组件拆分原则：**

| 原则 | 说明 |
| --- | --- |
| 单一职责 | 一个组件只做一件事 |
| 100 行原则 | 超过 100 行考虑拆分 |
| 2 次复用 | 复用 2 次以上提取为共享组件 |
| 状态下沉 | 状态尽量靠近使用它的组件 |

### 8. Server vs Client 组件

**默认使用 Server Component**，仅在以下情况使用 Client Component：

```typescript
'use client'  // 必须在文件顶部声明

// 需要 'use client' 的场景：
// 1. React Hooks: useState, useEffect, useContext, useReducer
// 2. 浏览器 API: window, document, localStorage, navigator
// 3. 事件处理: onClick, onChange, onSubmit
// 4. 状态管理: Zustand store
// 5. 实时交互: 拖拽、动画、Canvas 操作
// 6. 第三方客户端库: 部分 npm 包
```

**最佳实践：**

```
app/
├── page.tsx              # Server Component（默认）
└── (main)/
    └── dashboard/
        ├── page.tsx      # Server Component - 数据获取
        └── _components/
            └── chart.tsx  # Client Component - 交互图表
```

### 9. 导入路径别名

```typescript
// tsconfig.json 配置
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// 使用示例
import { Button } from '@/shared/ui'
import { useAuth } from '@/features/auth'
import { User } from '@/entities/user'
import { useUserStore } from '@/stores'
```

### 10. ESLint 配置

```javascript
// eslint.config.mjs
import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 禁止未使用变量
      "@typescript-eslint/no-unused-vars": "error",
      // 禁止 any 类型
      "@typescript-eslint/no-explicit-any": "error",
      // 组件命名必须 PascalCase
      "react/jsx-pascal-case": "error",
    }
  }
]

export default eslintConfig
```

---

## 六、开发原则（参考 CLAUDE.md）

### 核心原则

1. **单一职责原则** - 每个组件、函数只负责一个明确的职责
2. **最简代码原则** - 不做向后兼容，保证代码最简化
3. **类型严格原则** - 所有 TypeScript 类型必须正确，不使用 any
4. **KISS 原则** - 保持简单直接，如果需要解释就是太复杂了
5. **文档置信度原则** - 绝不基于推测写代码，必须基于真实可验证的技术文档

### 错误处理

- 失败快速，提供描述性错误信息
- 包含调试所需的上下文
- 在适当的层级处理错误
- 永远不要静默吞掉异常

### 质量门禁

- [ ] 测试编写并通过
- [ ] 代码遵循项目规范
- [ ] 无 linter/formatter 警告
- [ ] 提交信息清晰
- [ ] 实现符合计划
- [ ] 无无 issue 编号的 TODO 
