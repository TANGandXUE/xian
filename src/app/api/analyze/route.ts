import { NextRequest, NextResponse } from 'next/server';
import { analyzeUrl, analyzeVideos, VideoAnalysis } from '@/lib/video-analyzer';

// xian 项目的 11 种视频分类权重
const CATEGORY_WEIGHTS: Record<string, [number, number, number]> = {
  '知识科普': [0.9, 0.1, 0.0],
  '新闻资讯': [0.7, 0.2, 0.1],
  '教程技能': [0.8, 0.1, 0.1],
  '情感故事': [0.1, 0.8, 0.1],
  '音乐MV':   [0.1, 0.6, 0.3],
  '励志鸡汤': [0.3, 0.5, 0.2],
  '搞笑段子': [0.0, 0.1, 0.9],
  '游戏直播': [0.1, 0.2, 0.7],
  '美食探店': [0.2, 0.2, 0.6],
  '宠物萌宠': [0.0, 0.5, 0.5],
  '社会议题': [0.5, 0.4, 0.1],
};

interface WatchHistoryItem {
  title: string;
  url: string;
  tags: string[];
  duration: string;
  category: string;
}

interface AnalyzeResult {
  dimensions: { cognition: number; empathy: number; pleasure: number };
  summary: string;
  watchHistory: WatchHistoryItem[];
  likes: { title: string; url: string }[];
  comments: { title: string; url: string; content: string }[];
}

/**
 * POST /api/analyze
 * 分析视频数据并生成用户画像
 *
 * 请求体：
 * - urls: 视频链接数组（可选）
 * - videos: 视频数据数组（可选）[{title, tags, description}]
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, videos } = body;

    let analyzedVideos: VideoAnalysis[] = [];

    // 来源1: 视频链接
    if (urls && Array.isArray(urls) && urls.length > 0) {
      const results = await Promise.allSettled(
        urls.slice(0, 10).map((url: string) => analyzeUrl(url))
      );

      analyzedVideos = results
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; data?: VideoAnalysis }> =>
          r.status === 'fulfilled' && r.value.success && !!r.value.data
        )
        .map(r => r.value.data!);
    }
    // 来源2: 直接传入视频数据
    else if (videos && Array.isArray(videos) && videos.length > 0) {
      const result = await analyzeVideos(videos);
      if (result.success && result.data) {
        analyzedVideos = result.data;
      }
    }

    if (analyzedVideos.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有可分析的视频数据' },
        { status: 400 }
      );
    }

    // 计算三维度
    const dimensions = calculateDimensions(analyzedVideos);

    // 生成 AI 评语
    const summary = generateSummary(dimensions, analyzedVideos);

    // 构建观看历史
    const watchHistory: WatchHistoryItem[] = analyzedVideos.map((v, i) => ({
      title: v.title,
      url: v.url || `https://example.com/video/${i}`,
      tags: v.metadata?.tags || [v.category],
      duration: formatDuration(v.metadata?.duration || Math.floor(Math.random() * 300 + 30)),
      category: v.category,
    }));

    // 模拟点赞和评论（基于分析结果）
    const likes = analyzedVideos
      .filter(() => Math.random() < 0.3)
      .map(v => ({ title: v.title, url: v.url || '' }));

    const comments = analyzedVideos
      .filter(() => Math.random() < 0.1)
      .map(v => ({
        title: v.title,
        url: v.url || '',
        content: generateComment(v.category),
      }));

    const result: AnalyzeResult = {
      dimensions,
      summary,
      watchHistory,
      likes,
      comments,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { success: false, error: '分析失败，请确保视频分析服务正在运行' },
      { status: 500 }
    );
  }
}

// 计算三维度
function calculateDimensions(videos: VideoAnalysis[]) {
  let cognition = 0, empathy = 0, pleasure = 0;

  videos.forEach(video => {
    const weights = CATEGORY_WEIGHTS[video.category] || [0.33, 0.33, 0.34];
    cognition += weights[0];
    empathy += weights[1];
    pleasure += weights[2];
  });

  const total = cognition + empathy + pleasure;
  if (total === 0) {
    return { cognition: 0.33, empathy: 0.33, pleasure: 0.34 };
  }

  return {
    cognition: Math.round((cognition / total) * 100) / 100,
    empathy: Math.round((empathy / total) * 100) / 100,
    pleasure: Math.round((pleasure / total) * 100) / 100,
  };
}

// 生成 AI 评语
function generateSummary(
  dimensions: { cognition: number; empathy: number; pleasure: number },
  videos: VideoAnalysis[]
): string {
  const traits: string[] = [];

  if (dimensions.cognition > 0.4) {
    traits.push('你对知识有着强烈的渴望，善于思考和探索未知领域');
  }
  if (dimensions.empathy > 0.4) {
    traits.push('你富有同理心，容易与他人产生情感共鸣');
  }
  if (dimensions.pleasure > 0.4) {
    traits.push('你懂得享受生活，善于在日常中发现乐趣');
  }

  // 分析主要观看类别
  const categories = videos.map(v => v.category);
  const categoryCount: Record<string, number> = {};
  categories.forEach(c => { categoryCount[c] = (categoryCount[c] || 0) + 1; });
  const topCategory = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (topCategory) {
    const categoryTraits: Record<string, string> = {
      '知识科普': '你是一个热爱学习的探索者，追求真理和智慧',
      '情感故事': '你内心细腻，容易被真挚的情感所打动',
      '搞笑段子': '你拥有乐观的心态，笑声是你生活的调味剂',
      '宠物萌宠': '你充满爱心，温柔是你最大的特质',
      '游戏直播': '你享受竞技的乐趣，有着不服输的精神',
      '音乐MV': '你对艺术有独特的感知力，音乐是你的灵魂伴侣',
    };
    if (categoryTraits[topCategory]) {
      traits.push(categoryTraits[topCategory]);
    }
  }

  return traits.length > 0
    ? traits.join('。') + '。期待找到与你灵魂共振的人。'
    : '你是一个独特的个体，拥有丰富的内心世界。期待找到与你灵魂共振的人。';
}

// 格式化时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 生成评论
function generateComment(category: string): string {
  const comments: Record<string, string[]> = {
    '知识科普': ['学到了！', '涨知识了', '原来如此'],
    '情感故事': ['太感动了', '看哭了', '说到心坎里了'],
    '搞笑段子': ['哈哈哈笑死', '太搞笑了', '笑出腹肌'],
    '宠物萌宠': ['好可爱啊', '萌化了', '想养一只'],
    '游戏直播': ['大神带带我', '玩得真好', '学到了'],
  };
  const pool = comments[category] || ['不错', '赞', '支持'];
  return pool[Math.floor(Math.random() * pool.length)];
}
