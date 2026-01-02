import { StringDimensions } from '@/entities/string-data/model';

// 视频类型到维度的映射（来自 README）
const VIDEO_CATEGORY_WEIGHTS: Record<string, { cognition: number; empathy: number; pleasure: number }> = {
  '知识科普': { cognition: 0.9, empathy: 0.1, pleasure: 0.0 },
  '新闻资讯': { cognition: 0.7, empathy: 0.2, pleasure: 0.1 },
  '教程技能': { cognition: 0.8, empathy: 0.1, pleasure: 0.1 },
  '情感故事': { cognition: 0.1, empathy: 0.8, pleasure: 0.1 },
  '音乐MV': { cognition: 0.1, empathy: 0.6, pleasure: 0.3 },
  '宠物萌宠': { cognition: 0.0, empathy: 0.5, pleasure: 0.5 },
  '搞笑段子': { cognition: 0.0, empathy: 0.1, pleasure: 0.9 },
  '游戏直播': { cognition: 0.1, empathy: 0.2, pleasure: 0.7 },
  '美食探店': { cognition: 0.2, empathy: 0.2, pleasure: 0.6 },
  '励志鸡汤': { cognition: 0.3, empathy: 0.5, pleasure: 0.2 },
  '社会议题': { cognition: 0.5, empathy: 0.4, pleasure: 0.1 },
};

interface WatchRecord {
  videoId: string;
  category: string;
  watchPercent: number;
  duration: number;
  liked: boolean;
  commented: boolean;
  watchedAt: string;
  isNightWatch: boolean;
  comment?: string;
}

/**
 * 计算单条观看记录的行为权重
 */
function calculateBehaviorWeight(record: WatchRecord): number {
  let weight = 1.0; // 基础权重：刷过

  // 看完 >80%
  if (record.watchPercent >= 0.8) {
    weight *= 1.5;
  }

  // 点赞
  if (record.liked) {
    weight *= 2.0;
  }

  // 评论
  if (record.commented) {
    weight *= 2.5;
  }

  // 深夜观看
  if (record.isNightWatch) {
    weight *= 1.3;
  }

  return weight;
}

/**
 * 从用户观看历史计算三维度
 */
export function calculateDimensions(watchHistory: WatchRecord[]): StringDimensions {
  if (!watchHistory || watchHistory.length === 0) {
    // 默认均衡值
    return { cognition: 0.33, empathy: 0.33, pleasure: 0.33 };
  }

  let totalCognition = 0;
  let totalEmpathy = 0;
  let totalPleasure = 0;
  let totalWeight = 0;

  for (const record of watchHistory) {
    const categoryWeights = VIDEO_CATEGORY_WEIGHTS[record.category];
    if (!categoryWeights) continue;

    const behaviorWeight = calculateBehaviorWeight(record);

    totalCognition += categoryWeights.cognition * behaviorWeight;
    totalEmpathy += categoryWeights.empathy * behaviorWeight;
    totalPleasure += categoryWeights.pleasure * behaviorWeight;
    totalWeight += behaviorWeight;
  }

  if (totalWeight === 0) {
    return { cognition: 0.33, empathy: 0.33, pleasure: 0.33 };
  }

  // 归一化到 0-1
  const rawCognition = totalCognition / totalWeight;
  const rawEmpathy = totalEmpathy / totalWeight;
  const rawPleasure = totalPleasure / totalWeight;

  // 确保值在 0-1 范围内
  return {
    cognition: Math.min(1, Math.max(0, rawCognition)),
    empathy: Math.min(1, Math.max(0, rawEmpathy)),
    pleasure: Math.min(1, Math.max(0, rawPleasure)),
  };
}

/**
 * 获取维度的中文名称
 */
export function getDimensionLabel(dimension: keyof StringDimensions): string {
  const labels: Record<keyof StringDimensions, string> = {
    cognition: '求知',
    empathy: '共情',
    pleasure: '愉悦',
  };
  return labels[dimension];
}

/**
 * 计算两个用户之间的相似度（余弦相似度）
 */
export function calculateSimilarity(a: StringDimensions, b: StringDimensions): number {
  const dotProduct = a.cognition * b.cognition + a.empathy * b.empathy + a.pleasure * b.pleasure;
  const magnitudeA = Math.sqrt(a.cognition ** 2 + a.empathy ** 2 + a.pleasure ** 2);
  const magnitudeB = Math.sqrt(b.cognition ** 2 + b.empathy ** 2 + b.pleasure ** 2);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 获取主导维度
 */
export function getDominantDimension(dims: StringDimensions): keyof StringDimensions {
  if (dims.cognition >= dims.empathy && dims.cognition >= dims.pleasure) {
    return 'cognition';
  }
  if (dims.empathy >= dims.cognition && dims.empathy >= dims.pleasure) {
    return 'empathy';
  }
  return 'pleasure';
}

/**
 * 生成用户画像描述
 */
export function generatePersonaDescription(dims: StringDimensions): string {
  const dominant = getDominantDimension(dims);
  const descriptions: Record<keyof StringDimensions, string[]> = {
    cognition: ['理性探索者', '知识追寻者', '逻辑思考者'],
    empathy: ['情感共鸣者', '温暖连接者', '心灵感知者'],
    pleasure: ['快乐追求者', '轻松享乐派', '生活乐天派'],
  };

  const index = Math.floor(dims[dominant] * 2.99);
  return descriptions[dominant][index] || descriptions[dominant][0];
}
