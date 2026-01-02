# Mock 数据规范

## 概述

| 配置项 | 值 |
|--------|-----|
| 用户数量 | 50 |
| 时间范围 | 最近 30 天 |
| AI 场景 | 暂不 Mock，后续接真实 AI |
| 头像 | 占位图 |

---

## 数据结构

### 视频类型

```typescript
type VideoCategory =
  | "知识科普" | "新闻资讯" | "教程技能"  // 求知倾向
  | "情感故事" | "音乐MV" | "励志鸡汤"    // 共情倾向
  | "搞笑段子" | "游戏直播" | "美食探店"  // 愉悦倾向
  | "宠物萌宠" | "社会议题"              // 混合倾向
```

### 视频类型 → 维度权重

```typescript
const categoryWeights: Record<VideoCategory, [number, number, number]> = {
  // [求知, 共情, 愉悦]
  "知识科普": [0.9, 0.1, 0.0],
  "新闻资讯": [0.7, 0.2, 0.1],
  "教程技能": [0.8, 0.1, 0.1],
  "情感故事": [0.1, 0.8, 0.1],
  "音乐MV":   [0.1, 0.6, 0.3],
  "励志鸡汤": [0.3, 0.5, 0.2],
  "搞笑段子": [0.0, 0.1, 0.9],
  "游戏直播": [0.1, 0.2, 0.7],
  "美食探店": [0.2, 0.2, 0.6],
  "宠物萌宠": [0.0, 0.5, 0.5],
  "社会议题": [0.5, 0.4, 0.1],
}
```

### 观看记录

```typescript
interface WatchRecord {
  videoId: string           // 视频ID
  category: VideoCategory   // 视频类型
  watchPercent: number      // 0-1，观看完成度
  duration: number          // 视频时长（秒）
  liked: boolean            // 是否点赞
  commented: boolean        // 是否评论
  watchedAt: string         // ISO 时间戳
}
```

### 用户

```typescript
interface MockUser {
  id: string                // 用户ID，格式: user_001
  nickname: string          // 昵称，格式: 用户001
  avatar: string            // 占位图 URL
  watchHistory: WatchRecord[]
  createdAt: string         // 注册时间
}
```

### 弦数据（计算结果）

```typescript
interface StringData {
  userId: string
  cognition: number         // 0-100 求知维度
  empathy: number           // 0-100 共情维度
  pleasure: number          // 0-100 愉悦维度
  color: { r: number, g: number, b: number }
  totalVideos: number       // 总观看数
  lastActive: string        // 最后活跃时间
}
```

### 碰撞记录

```typescript
interface CollisionRecord {
  id: string
  userA: string             // 发起方用户ID
  userB: string             // 目标方用户ID
  comparison: {
    cognitionDiff: number   // 求知差值
    empathyDiff: number     // 共情差值
    pleasureDiff: number    // 愉悦差值
    similarity: number      // 0-100 相似度
  }
  aiStory: string | null    // AI 场景故事（后续接入）
  createdAt: string
}
```

---

## 用户人设分布

50 个用户按以下分布生成：

| 类型 | 特征 | 数量 |
|------|------|------|
| 求知主导 | cognition > 70, 其他 < 40 | 8 |
| 共情主导 | empathy > 70, 其他 < 40 | 8 |
| 愉悦主导 | pleasure > 70, 其他 < 40 | 10 |
| 求知+共情 | 两者 > 55, pleasure < 35 | 5 |
| 求知+愉悦 | 两者 > 55, empathy < 35 | 5 |
| 共情+愉悦 | 两者 > 55, cognition < 35 | 5 |
| 均衡型 | 三者差距 < 15 | 6 |
| 极端型 | 某项 > 90 或 < 10 | 3 |

---

## 观看记录生成规则

### 数量分布

| 用户类型 | 视频数量范围 |
|----------|--------------|
| 轻度用户 | 50 - 100 |
| 中度用户 | 100 - 250 |
| 重度用户 | 250 - 400 |

比例：轻度 30%，中度 50%，重度 20%

### 行为权重

| 行为 | 权重 | 触发概率 |
|------|------|----------|
| 刷过 | ×1.0 | 100% |
| 看完 >80% | ×1.5 | 15-25% |
| 点赞 | ×2.0 | 8-12% |
| 评论 | ×2.5 | 2-4% |
| 深夜观看 (00:00-05:00) | ×1.3 | 15-25% |

### 时间分布

```
00:00-05:00  深夜    15%  ← 真实偏好
06:00-08:00  早间    5%
09:00-11:00  上午    8%
12:00-13:00  午休    12%
14:00-17:00  下午    10%
18:00-19:00  晚饭    8%
20:00-23:00  晚间    35%  ← 主要使用时段
其他               7%
```

### 视频时长分布

| 时长 | 占比 |
|------|------|
| < 15秒 | 20% |
| 15-60秒 | 45% |
| 1-3分钟 | 25% |
| > 3分钟 | 10% |

---

## 边界用户

50 个用户中需包含以下边界场景：

| 场景 | 数量 | 说明 |
|------|------|------|
| 新用户 | 2 | 只有 10-20 条记录 |
| 沉默用户 | 2 | 从不点赞评论 |
| 活跃用户 | 2 | 点赞率 > 30%，评论率 > 10% |
| 单一偏好 | 2 | 90% 以上看同一类型 |
| 深夜党 | 2 | 50% 以上深夜观看 |

---

## 占位图

使用 DiceBear 或类似服务生成：

```
https://api.dicebear.com/7.x/avataaars/svg?seed=user_001
```

或使用固定占位：

```
https://placehold.co/100x100/333/fff?text=U01
```
