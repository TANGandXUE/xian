/**
 * Mock 数据生成脚本
 * 运行: node scripts/generate-mock-data.js
 */

const fs = require('fs')
const path = require('path')

// ============ 配置 ============

const CONFIG = {
  userCount: 10,
  daysRange: 30,
  outputDir: path.join(__dirname, '../data'),
}

// ============ 视频类型权重 ============

const CATEGORY_WEIGHTS = {
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

const CATEGORIES = Object.keys(CATEGORY_WEIGHTS)

// ============ 评论模板 ============

// 通用抽象/玩梗评论（任何视频都可能出现）
const ABSTRACT_COMMENTS = [
  "6", "666", "？", "...", "。", "啊？", "绝了", "无语",
  "下次不许再发了（已关注）", "不许发了（已收藏点赞关注）",
  "我不理解但我大受震撼", "DNA动了", "好似", "典",
  "什么玩意", "抽象", "太抽象了", "乐", "乐了",
  "赢", "输", "急了", "急", "你急了", "孝死",
  "蚌埠住了", "绷", "绷不住了", "麻", "麻了", "无敌",
  "确实", "真的假的", "假的真的", "不好评价",
  "来了来了", "就这？", "一般", "还行", "有点东西",
  "差不多得了", "正常", "合理", "有被笑到",
  "笑拥了", "家人们谁懂啊", "救命", "完蛋",
  "真实", "真", "假", "雀食", "确食", "yyds",
  "xswl", "awsl", "nsdd", "u1s1", "yysy",
  "我超", "啊这", "这...", "好好好", "行行行",
  "鉴定为", "鉴定完毕", "已阅", "告辞", "润了",
  "不敢说话", "我选择死亡", "建议", "危", "非常危",
  "什么成分", "纯的吗", "假的吧", "真的吗我不信",
  "没绷住", "顶不住", "笑死我了", "妈耶",
]

// 阴阳怪气/杠精评论
const SARCASTIC_COMMENTS = [
  "这也能火？", "这有什么好看的", "不就是...",
  "我早就知道了", "又来", "还发", "别发了",
  "毫无营养", "浪费时间", "纯纯浪费流量",
  "下一个", "划走了", "没意思", "无聊",
  "格局小了", "眼界打开", "你们不懂",
  "懂的都懂", "不懂的也不用懂了", "听君一席话",
  "听君一席话如听一席话", "说了等于没说",
  "有一说一", "我就不一样", "我反正觉得一般",
  "过于真实", "你是懂xx的", "这是能说的吗",
]

// 视频类型相关评论
const CATEGORY_COMMENTS = {
  "知识科普": [
    "涨知识了", "学到了", "收藏了", "马住",
    "收藏等于学会", "收藏从未停止学习从未开始",
    "我看不懂但我大受震撼", "硬核", "太专业了",
    "开始听懂了结尾又懵了", "建议直接背诵全文",
  ],
  "新闻资讯": [
    "关注", "持续关注", "等后续", "mark",
    "又是魔幻的一天", "离谱", "地球不适合人类居住",
    "互联网是有记忆的", "截图保存", "会回来的",
  ],
  "教程技能": [
    "一看就会一做就废", "手残党告辞",
    "保姆级教程", "已收藏（然后再也不看）",
    "眼睛：我会了 手：你会个屁", "我直接截图",
  ],
  "情感故事": [
    "看哭了", "破防", "泪目", "真的假的",
    "编的吧", "我信你个鬼", "演的", "剧本",
    "真情实感我是傻子", "又被骗眼泪",
  ],
  "音乐MV": [
    "单曲循环", "已加歌单", "太好听了", "耳朵怀孕",
    "歌名歌名歌名", "是什么歌", "求歌名",
    "第38遍", "打卡", "这首歌陪我度过了...",
  ],
  "励志鸡汤": [
    "每天都来一碗", "正能量", "转发了",
    "这碗我干了", "又到了每日喝鸡汤的时间",
    "看完感觉自己能统一全球", "三分钟热度启动",
  ],
  "搞笑段子": [
    "哈哈哈哈哈", "笑死", "已笑疯", "妈耶",
    "救命", "笑到邻居报警", "笑出腹肌了",
    "一整个笑麻", "显眼包", "太他妈搞笑了",
    "笑容逐渐变态", "越看越抽象",
  ],
  "游戏直播": [
    "操作秀", "这波无敌", "求带", "主播几点播",
    "下播了？", "托吧", "演的", "这也能输",
    "队友的问题", "网络问题", "卡了卡了",
  ],
  "美食探店": [
    "求地址", "在哪", "多少钱", "看饿了",
    "流口水", "热量爆炸", "减肥失败",
    "好吃是好吃就是胖10斤", "这不纯纯痛风套餐",
  ],
  "宠物萌宠": [
    "想rua", "想偷", "可爱", "萌死",
    "想要", "这是能养的吗", "流口水（bushi",
    "我家主子不允许我看这个", "awsl",
  ],
  "社会议题": [
    "评论区要火速保护", "不敢评论", "我选择沉默",
    "在这能说吗", "边吃瓜边沉默",
    "希望不要删", "希望有后续", "典中典",
  ],
}

function generateComment(category) {
  const r = Math.random()
  // 40% 抽象/通用评论
  if (r < 0.40) {
    return randomChoice(ABSTRACT_COMMENTS)
  }
  // 15% 阴阳怪气
  if (r < 0.55) {
    return randomChoice(SARCASTIC_COMMENTS)
  }
  // 45% 类型相关评论
  return randomChoice(CATEGORY_COMMENTS[category] || ABSTRACT_COMMENTS)
}

// ============ 用户人设 ============

const PERSONAS = [
  { type: 'cognition', tendency: { cognition: 0.75, empathy: 0.15, pleasure: 0.10 } },
  { type: 'empathy', tendency: { cognition: 0.15, empathy: 0.75, pleasure: 0.10 } },
  { type: 'pleasure', tendency: { cognition: 0.10, empathy: 0.15, pleasure: 0.75 } },
  { type: 'cog_emp', tendency: { cognition: 0.45, empathy: 0.45, pleasure: 0.10 } },
  { type: 'cog_ple', tendency: { cognition: 0.45, empathy: 0.10, pleasure: 0.45 } },
  { type: 'emp_ple', tendency: { cognition: 0.10, empathy: 0.45, pleasure: 0.45 } },
  { type: 'balanced', tendency: { cognition: 0.33, empathy: 0.34, pleasure: 0.33 } },
  { type: 'extreme_cog', tendency: { cognition: 0.92, empathy: 0.05, pleasure: 0.03 } },
  { type: 'extreme_emp', tendency: { cognition: 0.03, empathy: 0.92, pleasure: 0.05 } },
  { type: 'extreme_ple', tendency: { cognition: 0.05, empathy: 0.03, pleasure: 0.92 } },
]

// 边界用户标记
const EDGE_CASES = {
  newUser: [0, 1],           // 新用户 - 只有10-20条记录
  silentUser: [2, 3],        // 沉默用户 - 从不点赞评论
  activeUser: [4, 5],        // 活跃用户 - 高互动
  singlePref: [6, 7],        // 单一偏好 - 90%同类型
  nightOwl: [8, 9],          // 深夜党 - 50%深夜观看
}

// ============ 工具函数 ============

function random(min, max) {
  return Math.random() * (max - min) + min
}

function randomInt(min, max) {
  return Math.floor(random(min, max + 1))
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedRandomChoice(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [key, weight] of Object.entries(weights)) {
    r -= weight
    if (r <= 0) return key
  }
  return Object.keys(weights)[0]
}

function generateId(prefix, index) {
  return `${prefix}_${String(index).padStart(3, '0')}`
}

function randomDate(daysAgo) {
  const now = new Date()
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime())
  return new Date(randomTime)
}

function getTimeSlot() {
  // 时间分布
  const slots = {
    'night': 0.15,      // 00:00-05:00
    'early': 0.05,      // 06:00-08:00
    'morning': 0.08,    // 09:00-11:00
    'lunch': 0.12,      // 12:00-13:00
    'afternoon': 0.10,  // 14:00-17:00
    'dinner': 0.08,     // 18:00-19:00
    'evening': 0.35,    // 20:00-23:00
    'other': 0.07,
  }

  const slot = weightedRandomChoice(slots)

  const hourRanges = {
    'night': [0, 5],
    'early': [6, 8],
    'morning': [9, 11],
    'lunch': [12, 13],
    'afternoon': [14, 17],
    'dinner': [18, 19],
    'evening': [20, 23],
    'other': [0, 23],
  }

  const [minH, maxH] = hourRanges[slot]
  return {
    hour: randomInt(minH, maxH),
    isNight: slot === 'night'
  }
}

function getVideoDuration() {
  const r = Math.random()
  if (r < 0.20) return randomInt(5, 15)       // < 15秒
  if (r < 0.65) return randomInt(15, 60)      // 15-60秒
  if (r < 0.90) return randomInt(60, 180)     // 1-3分钟
  return randomInt(180, 600)                   // > 3分钟
}

// ============ 生成函数 ============

function selectCategoryByTendency(tendency, singlePref = false, singleCategory = null) {
  if (singlePref && singleCategory && Math.random() < 0.9) {
    return singleCategory
  }

  // 根据 tendency 计算每个类别的选择概率
  const categoryProbs = {}

  for (const [cat, weights] of Object.entries(CATEGORY_WEIGHTS)) {
    const [cog, emp, ple] = weights
    const prob = cog * tendency.cognition + emp * tendency.empathy + ple * tendency.pleasure
    categoryProbs[cat] = prob
  }

  return weightedRandomChoice(categoryProbs)
}

function generateWatchRecord(index, tendency, options = {}) {
  const { silentUser, activeUser, nightOwl, singlePref, singleCategory } = options

  const category = selectCategoryByTendency(tendency, singlePref, singleCategory)
  const duration = getVideoDuration()

  // 观看完成度
  let watchPercent
  const r = Math.random()
  if (r < 0.25) watchPercent = random(0.1, 0.3)
  else if (r < 0.60) watchPercent = random(0.3, 0.6)
  else if (r < 0.85) watchPercent = random(0.6, 0.8)
  else watchPercent = random(0.8, 1.0)

  // 点赞和评论
  let liked = false
  let commented = false

  if (!silentUser) {
    // 80% 的记录有评论
    commented = Math.random() < 0.80
    liked = Math.random() < 0.30
  }

  // 时间
  const date = randomDate(CONFIG.daysRange)
  let timeSlot = getTimeSlot()

  if (nightOwl && Math.random() < 0.5) {
    timeSlot = { hour: randomInt(0, 5), isNight: true }
  }

  date.setHours(timeSlot.hour, randomInt(0, 59), randomInt(0, 59))

  const record = {
    videoId: generateId('video', randomInt(1, 10000)),
    category,
    watchPercent: Math.round(watchPercent * 100) / 100,
    duration,
    liked,
    commented,
    watchedAt: date.toISOString(),
    isNightWatch: timeSlot.isNight,
  }

  // 只有评论时才添加 comment 字段
  if (commented) {
    record.comment = generateComment(category)
  }

  return record
}

function generateUser(index, persona) {
  const userId = generateId('user', index + 1)

  // 确定边界情况
  const isNewUser = EDGE_CASES.newUser.includes(index)
  const isSilentUser = EDGE_CASES.silentUser.includes(index)
  const isActiveUser = EDGE_CASES.activeUser.includes(index)
  const isSinglePref = EDGE_CASES.singlePref.includes(index)
  const isNightOwl = EDGE_CASES.nightOwl.includes(index)

  // 确定视频数量
  let videoCount
  if (isNewUser) {
    videoCount = randomInt(3, 5)
  } else {
    videoCount = randomInt(5, 10)
  }

  // 单一偏好用户的主类别
  let singleCategory = null
  if (isSinglePref) {
    // 根据 tendency 选择主类别
    const { cognition, empathy, pleasure } = persona.tendency
    if (cognition > empathy && cognition > pleasure) {
      singleCategory = randomChoice(["知识科普", "教程技能", "新闻资讯"])
    } else if (empathy > cognition && empathy > pleasure) {
      singleCategory = randomChoice(["情感故事", "音乐MV", "励志鸡汤"])
    } else {
      singleCategory = randomChoice(["搞笑段子", "游戏直播", "美食探店"])
    }
  }

  // 生成观看记录
  const watchHistory = []
  for (let i = 0; i < videoCount; i++) {
    watchHistory.push(generateWatchRecord(i, persona.tendency, {
      silentUser: isSilentUser,
      activeUser: isActiveUser,
      nightOwl: isNightOwl,
      singlePref: isSinglePref,
      singleCategory,
    }))
  }

  // 按时间排序
  watchHistory.sort((a, b) => new Date(a.watchedAt) - new Date(b.watchedAt))

  return {
    id: userId,
    nickname: `用户${String(index + 1).padStart(3, '0')}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    personaType: persona.type,
    watchHistory,
    createdAt: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000).toISOString(),
    _meta: {
      isNewUser,
      isSilentUser,
      isActiveUser,
      isSinglePref,
      isNightOwl,
    }
  }
}

function calculateStringData(user) {
  let cognitionScore = 0
  let empathyScore = 0
  let pleasureScore = 0
  let totalWeight = 0

  for (const record of user.watchHistory) {
    const [cog, emp, ple] = CATEGORY_WEIGHTS[record.category]

    // 基础权重
    let weight = 1.0

    // 观看完成度加成
    if (record.watchPercent > 0.8) weight *= 1.5

    // 点赞加成
    if (record.liked) weight *= 2.0

    // 评论加成
    if (record.commented) weight *= 2.5

    // 深夜加成
    if (record.isNightWatch) weight *= 1.3

    cognitionScore += cog * weight
    empathyScore += emp * weight
    pleasureScore += ple * weight
    totalWeight += weight
  }

  // 归一化到 0-100
  const total = cognitionScore + empathyScore + pleasureScore

  let cognition, empathy, pleasure

  if (total === 0) {
    cognition = empathy = pleasure = 33
  } else {
    cognition = Math.round((cognitionScore / total) * 100)
    empathy = Math.round((empathyScore / total) * 100)
    pleasure = Math.round((pleasureScore / total) * 100)
  }

  // 计算颜色
  const color = {
    r: Math.round(empathy * 2.55),
    g: Math.round(pleasure * 2.55),
    b: Math.round(cognition * 2.55),
  }

  // 找最后活跃时间
  const lastRecord = user.watchHistory[user.watchHistory.length - 1]

  return {
    userId: user.id,
    cognition,
    empathy,
    pleasure,
    color,
    totalVideos: user.watchHistory.length,
    lastActive: lastRecord ? lastRecord.watchedAt : user.createdAt,
  }
}

// ============ 主函数 ============

function main() {
  console.log('开始生成 Mock 数据...\n')

  // 打乱人设顺序
  const shuffledPersonas = [...PERSONAS].sort(() => Math.random() - 0.5)

  // 生成用户
  const users = []
  const stringDataList = []

  for (let i = 0; i < CONFIG.userCount; i++) {
    const persona = shuffledPersonas[i]
    const user = generateUser(i, persona)
    const stringData = calculateStringData(user)

    users.push(user)
    stringDataList.push(stringData)

    console.log(`[${i + 1}/${CONFIG.userCount}] ${user.id} - ${persona.type} - ${user.watchHistory.length}条记录`)
  }

  // 统计
  console.log('\n========== 统计 ==========')
  console.log(`总用户数: ${users.length}`)
  console.log(`总观看记录: ${users.reduce((sum, u) => sum + u.watchHistory.length, 0)}`)

  const avgCognition = Math.round(stringDataList.reduce((sum, s) => sum + s.cognition, 0) / stringDataList.length)
  const avgEmpathy = Math.round(stringDataList.reduce((sum, s) => sum + s.empathy, 0) / stringDataList.length)
  const avgPleasure = Math.round(stringDataList.reduce((sum, s) => sum + s.pleasure, 0) / stringDataList.length)

  console.log(`平均维度: 求知=${avgCognition}, 共情=${avgEmpathy}, 愉悦=${avgPleasure}`)

  // 创建输出目录
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true })
  }

  // 写入文件
  const usersPath = path.join(CONFIG.outputDir, 'users.json')
  const stringsPath = path.join(CONFIG.outputDir, 'strings.json')

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8')
  fs.writeFileSync(stringsPath, JSON.stringify(stringDataList, null, 2), 'utf-8')

  console.log(`\n已生成文件:`)
  console.log(`  - ${usersPath}`)
  console.log(`  - ${stringsPath}`)

  console.log('\n完成!')
}

main()
