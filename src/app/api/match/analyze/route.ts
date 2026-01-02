import { NextRequest, NextResponse } from 'next/server';
import { ProcessedUser } from '@/entities/user/model';

const API_KEY = 'sk-VsC0gO8mQkr7VKWfcRb0WUKkfkSyDmyR2fXNCCmzYwFxzmJ9';
const BASE_URL = 'https://api.bltcy.ai';
const MODEL = 'claude-sonnet-4-5-20250929';

interface MatchAnalysis {
  percentage: number;
  summary: string;
  highlights: string[];
  chemistry: string;
}

export async function POST(request: NextRequest) {
  try {
    const { user1, user2 } = await request.json() as { user1: ProcessedUser; user2: ProcessedUser };

    if (!user1 || !user2) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    // 分析维度差异，为AI提供更具体的上下文
    const cogDiff = Math.abs(user1.dimensions.cognition - user2.dimensions.cognition);
    const empDiff = Math.abs(user1.dimensions.empathy - user2.dimensions.empathy);
    const pleDiff = Math.abs(user1.dimensions.pleasure - user2.dimensions.pleasure);

    const cogAnalysis = cogDiff < 0.2 ? '认知频率相近' : cogDiff < 0.4 ? '认知互补' : '认知差异明显';
    const empAnalysis = empDiff < 0.2 ? '情感共振强烈' : empDiff < 0.4 ? '情感互补' : '情感维度差异大';
    const pleAnalysis = pleDiff < 0.2 ? '愉悦追求一致' : pleDiff < 0.4 ? '愉悦观互补' : '愉悦追求不同';

    // 获取用户的主导维度
    const getDominant = (dims: typeof user1.dimensions) => {
      if (dims.cognition >= dims.empathy && dims.cognition >= dims.pleasure) return '求知者';
      if (dims.empathy >= dims.cognition && dims.empathy >= dims.pleasure) return '共情者';
      return '愉悦者';
    };

    const user1Type = getDominant(user1.dimensions);
    const user2Type = getDominant(user2.dimensions);

    // 提取独特的观看分类（防止 watchHistory 为空或 undefined）
    const history1 = user1.watchHistory || [];
    const history2 = user2.watchHistory || [];
    const categories1 = Array.from(new Set(history1.slice(0, 15).map(v => v.category)));
    const categories2 = Array.from(new Set(history2.slice(0, 15).map(v => v.category)));
    const commonCategories = categories1.filter(c => categories2.includes(c));

    // 随机种子让每次结果略有不同
    const randomSeed = Date.now() % 1000;
    const creativeHints = [
      '用星辰和银河的意象',
      '用量子纠缠的比喻',
      '用音乐和和弦的隐喻',
      '用光与色彩的意象',
      '用海洋与潮汐的比喻',
      '用四季轮回的意象',
      '用火焰与温度的隐喻',
      '用时空旅行的意象'
    ];
    const creativeHint = creativeHints[randomSeed % creativeHints.length];

    const systemPrompt = `你是「闲·Universe」的灵魂共鸣分析师。在这个世界里，每个人都是独特频率振动的"弦"，当两条弦相遇，就会产生独特的共鸣。

你的任务是分析两条弦的共鸣程度，给出极具个性化、诗意且独特的分析。

重要规则：
1. 每次分析必须完全不同，禁止使用模板化语言
2. chemistry 描述必须针对这两个具体用户的特点，不要泛泛而谈
3. 必须提及用户的具体特征（如观看偏好、维度特点）
4. 用${creativeHint}来描述他们的关系
5. highlights 必须是具体的共同点，不能是"共同的兴趣"这种泛泛之词`;

    const userPrompt = `分析以下两条弦的共鸣：

【${user1.nickname}】- ${user1Type}型弦
• 求知能量: ${(user1.dimensions.cognition * 100).toFixed(0)}%
• 共情能量: ${(user1.dimensions.empathy * 100).toFixed(0)}%
• 愉悦能量: ${(user1.dimensions.pleasure * 100).toFixed(0)}%
• 偏好领域: ${categories1.length > 0 ? categories1.slice(0, 6).join('、') : '探索中'}

【${user2.nickname}】- ${user2Type}型弦
• 求知能量: ${(user2.dimensions.cognition * 100).toFixed(0)}%
• 共情能量: ${(user2.dimensions.empathy * 100).toFixed(0)}%
• 愉悦能量: ${(user2.dimensions.pleasure * 100).toFixed(0)}%
• 偏好领域: ${categories2.length > 0 ? categories2.slice(0, 6).join('、') : '探索中'}

维度分析：${cogAnalysis}，${empAnalysis}，${pleAnalysis}
${commonCategories.length > 0 ? `共同兴趣领域: ${commonCategories.join('、')}` : '兴趣领域差异较大，可能互相带来新世界'}

请用 JSON 返回分析结果：
{
  "percentage": 0-100的契合度(基于维度相似性和兴趣重叠度计算),
  "summary": "20字以内，针对${user1.nickname}和${user2.nickname}的独特关系总结",
  "highlights": ["具体共同点1", "具体共同点2", "具体共同点3"],
  "chemistry": "40-60字，${creativeHint}，描述${user1.nickname}与${user2.nickname}相遇时的独特共鸣画面"
}

只返回 JSON。`;

    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API Error:', error);
      return NextResponse.json({ error: 'AI API failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 解析 JSON 响应
    try {
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis: MatchAnalysis = JSON.parse(jsonMatch[0]);
        return NextResponse.json(analysis);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
    }

    // 如果解析失败，返回基于实际数据的结果
    const avgDiff = (cogDiff + empDiff + pleDiff) / 3;
    const percentage = Math.round((1 - avgDiff) * 100);

    // 生成具体的 highlights
    const highlights: string[] = [];
    if (cogDiff < 0.3) highlights.push(`都热衷${user1Type === '求知者' ? '探索知识' : '理性思考'}`);
    if (empDiff < 0.3) highlights.push('情感共鸣强烈');
    if (pleDiff < 0.3) highlights.push('愉悦追求一致');
    if (commonCategories.length > 0) highlights.push(`共同喜欢${commonCategories[0]}`);
    while (highlights.length < 3) highlights.push(`${user1Type}与${user2Type}的碰撞`);

    return NextResponse.json({
      percentage,
      summary: `${user1.nickname}与${user2.nickname}的弦产生共鸣`,
      highlights: highlights.slice(0, 3),
      chemistry: `${user1.nickname}的${user1Type}之弦与${user2.nickname}的${user2Type}之弦相遇，在${cogAnalysis}的频率中，两条弦开始共振，编织出独特的和声。`,
    });

  } catch (error) {
    console.error('Match analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
