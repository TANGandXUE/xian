/**
 * Video Analyzer API 客户端
 * 用于与独立的 video-analyzer 服务通信
 * 当服务不可用时，使用本地模拟分析
 */

const VIDEO_ANALYZER_URL = process.env.VIDEO_ANALYZER_URL || 'http://localhost:3001';

// 视频分类关键词映射
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '知识科普': ['科普', '知识', '解读', '原理', '科学', '历史', '揭秘', '真相', '分析', '研究'],
  '新闻资讯': ['新闻', '资讯', '头条', '热点', '事件', '报道', '最新', '突发'],
  '教程技能': ['教程', '教学', '入门', '技巧', '学习', '怎么', '如何', '方法', '攻略'],
  '情感故事': ['情感', '故事', '爱情', '感人', '真实', '经历', '心酸', '泪目', '催泪'],
  '音乐MV': ['音乐', 'MV', '歌曲', '翻唱', '原创', '演唱', '歌手', '专辑'],
  '励志鸡汤': ['励志', '正能量', '加油', '坚持', '成功', '梦想', '奋斗', '努力'],
  '搞笑段子': ['搞笑', '爆笑', '沙雕', '段子', '整蛊', '恶搞', '笑死', '哈哈'],
  '游戏直播': ['游戏', '直播', '电竞', '王者', '吃鸡', '英雄联盟', 'MC', '原神'],
  '美食探店': ['美食', '探店', '吃播', '测评', '好吃', '餐厅', '小吃', '做饭', '食谱'],
  '宠物萌宠': ['宠物', '萌宠', '猫', '狗', '可爱', '萌', '喵', '汪'],
  '社会议题': ['社会', '讨论', '观点', '评论', '思考', '现象', '问题', '争议'],
};

// 分类权重 [求知, 共情, 愉悦]
const CATEGORY_WEIGHTS: Record<string, [number, number, number]> = {
  '知识科普': [0.9, 0.1, 0.0],
  '新闻资讯': [0.7, 0.2, 0.1],
  '教程技能': [0.8, 0.1, 0.1],
  '情感故事': [0.1, 0.8, 0.1],
  '音乐MV': [0.1, 0.6, 0.3],
  '励志鸡汤': [0.3, 0.5, 0.2],
  '搞笑段子': [0.0, 0.1, 0.9],
  '游戏直播': [0.1, 0.2, 0.7],
  '美食探店': [0.2, 0.2, 0.6],
  '宠物萌宠': [0.0, 0.5, 0.5],
  '社会议题': [0.5, 0.4, 0.1],
};

/**
 * 本地模拟分析单个视频
 */
function localAnalyzeVideo(video: {
  title: string;
  description?: string;
  tags?: string[];
  url?: string;
}): VideoAnalysis {
  const text = `${video.title} ${video.description || ''} ${(video.tags || []).join(' ')}`.toLowerCase();

  let matchedCategory = '搞笑段子'; // 默认分类
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(kw => text.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedCategory = category;
    }
  }

  const weights = CATEGORY_WEIGHTS[matchedCategory] || [0.33, 0.33, 0.34];

  return {
    url: video.url,
    title: video.title,
    category: matchedCategory,
    weights: weights as [number, number, number],
    summary: `基于内容分析，该视频属于${matchedCategory}类别`,
    confidence: maxMatches >= 2 ? 'high' : 'low',
    metadata: {
      tags: video.tags || [matchedCategory],
      duration: Math.floor(Math.random() * 300 + 30),
    },
  };
}

export interface VideoAnalysis {
  url?: string;
  platform?: string;
  title: string;
  category: string;
  weights: [number, number, number]; // [求知, 共情, 愉悦]
  summary: string;
  confidence: 'high' | 'low';
  metadata?: {
    channel?: string;
    duration?: number;
    thumbnail?: string;
    tags?: string[];
  };
}

export interface AnalyzeUrlResponse {
  success: boolean;
  data?: VideoAnalysis;
  error?: string;
  cached?: boolean;
  took?: string;
}

export interface AnalyzeVideosResponse {
  success: boolean;
  data?: VideoAnalysis[];
  count?: number;
  error?: string;
  took?: string;
}

/**
 * 分析单个视频链接
 */
export async function analyzeUrl(url: string): Promise<AnalyzeUrlResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${VIDEO_ANALYZER_URL}/analyze/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.json();
  } catch {
    // 服务不可用，使用本地模拟
    console.log('[video-analyzer] 服务不可用，使用本地模拟分析');
    const title = extractTitleFromUrl(url);
    return {
      success: true,
      data: localAnalyzeVideo({ title, url }),
      cached: false,
    };
  }
}

/**
 * 从 URL 提取视频标题（模拟）
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // 尝试从路径中提取有意义的部分
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return decodeURIComponent(parts[parts.length - 1].replace(/[-_]/g, ' '));
    }
    return `视频 ${urlObj.hostname}`;
  } catch {
    return '未知视频';
  }
}

/**
 * 批量分析视频链接（最多10个）
 */
export async function analyzeUrls(urls: string[]): Promise<{
  success: boolean;
  data?: Array<VideoAnalysis & { success: boolean; error?: string }>;
  took?: string;
}> {
  const response = await fetch(`${VIDEO_ANALYZER_URL}/analyze/urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
  return response.json();
}

/**
 * 直接分析视频数据（无需链接）
 */
export async function analyzeVideos(
  videos: Array<{
    title: string;
    description?: string;
    tags?: string[];
    author?: string;
  }>
): Promise<AnalyzeVideosResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${VIDEO_ANALYZER_URL}/analyze/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.json();
  } catch {
    // 服务不可用，使用本地模拟
    console.log('[video-analyzer] 服务不可用，使用本地模拟分析');
    const analyzed = videos.map(v => localAnalyzeVideo(v));
    return {
      success: true,
      data: analyzed,
      count: analyzed.length,
    };
  }
}
