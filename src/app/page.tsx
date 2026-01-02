'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AuthFlowModal } from '@/features/auth';

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* 深空背景 */}
      <CosmicBackground />

      {/* 粒子星空 */}
      <StarField />

      {/* 动态光晕跟随鼠标 */}
      {isMounted && (
        <motion.div
          className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: mousePos.x * 3 + windowSize.width / 2 - 300,
            y: mousePos.y * 3 + windowSize.height / 2 - 300,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        />
      )}

      {/* 中央三角形装饰 */}
      <FloatingTriangles />

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center w-full">

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 relative w-full">
          {/* Logo 区域 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 text-center"
          >
            {/* 主标题 */}
            <h1 className="text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter select-none">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 8s ease infinite',
                }}
              >
                闲
              </span>
            </h1>

            {/* Universe 标题行 */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="h-[1px] bg-gradient-to-r from-transparent to-white/30"
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-2xl md:text-3xl tracking-[0.5em] text-white/60 font-light"
              >
                UNIVERSE
              </motion.span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="h-[1px] bg-gradient-to-l from-transparent to-white/30"
              />
            </div>

            {/* 副标题 - 我们的弦构成了整个世界 */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-6 text-lg md:text-xl text-white/50 tracking-widest font-light"
            >
              我们的「弦」构成了整个世界
            </motion.p>
          </motion.div>

          {/* 理念文案 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 1 }}
            className="text-center mb-12 max-w-2xl"
          >
            <p className="text-base md:text-lg text-white/40 leading-loose">
              在弦理论中，宇宙万物由振动的弦构成
              <br />
              <span className="text-white/60">每个人都是独特频率的振动</span>
              <br />
              当频率共鸣，灵魂相遇
            </p>
          </motion.div>

          {/* CTA 按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.6 }}
          >
            <motion.button
              onClick={() => setIsAuthModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-16 py-5 rounded-full overflow-hidden"
            >
              {/* 按钮背景 */}
              <div
                className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                }}
              />
              {/* 光晕效果 */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  filter: 'blur(20px)',
                  transform: 'scale(1.2)',
                }}
              />
              {/* 边框光效 */}
              <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40 transition-colors" />

              <span className="relative z-10 text-xl font-semibold tracking-wider flex items-center gap-4">
                开始配对
                <motion.span
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-2xl"
                >
                  ✦
                </motion.span>
              </span>
            </motion.button>
          </motion.div>

          {/* 向下滚动提示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 3, duration: 2, repeat: Infinity }}
            className="absolute bottom-10 text-white/30 text-sm tracking-widest"
          >
            SCROLL TO EXPLORE
          </motion.div>
        </section>

        {/* 核心理念 Section */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center py-20 px-6 relative">
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <ConceptCard
              title="第一性原则"
              subtitle="First Principles"
              description="从最本源、最真实的数据出发，还原用户最真实的自我，而非经过修饰的社交面具。"
              icon="⚛️"
              delay={0.2}
            />
            <ConceptCard
              title="去伪存真"
              subtitle="Truth"
              description="不依赖用户的主观填写，通过抖音真实行为数据（浏览、点赞、评论）呈现用户本质。"
              icon="👁️"
              delay={0.4}
            />
            <ConceptCard
              title="灵魂共振"
              subtitle="Resonance"
              description="当两个人的弦频率相近时，会产生强烈的共鸣。我们在寻找那个与你同频共振的灵魂。"
              icon="〰️"
              delay={0.6}
            />
          </div>
        </section>

        {/* 流程演示 Section */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center py-20 px-6 relative bg-black/20 backdrop-blur-sm">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-20 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
          >
            工作原理
          </motion.h2>

          <div className="w-full max-w-5xl">
            <ProcessFlow />
          </div>
        </section>

        {/* 算法维度 Section */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center py-20 px-6 relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-16 text-center text-white/80"
          >
            思维三维度模型
          </motion.h2>

          <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center justify-center">
            <DimensionDetail
              title="求知"
              en="Cognition"
              color="#60a5fa"
              desc="好奇心 · 掌控感 · 确定性"
              tags={['科普', '新闻', '教程', '技能']}
            />
            <DimensionDetail
              title="共情"
              en="Empathy"
              color="#f472b6"
              desc="归属感 · 被理解 · 情感释放"
              tags={['情感', '故事', '萌宠', '音乐']}
            />
            <DimensionDetail
              title="愉悦"
              en="Pleasure"
              color="#4ade80"
              desc="多巴胺 · 放松 · 逃避现实"
              tags={['搞笑', '游戏', '美食', '段子']}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-24 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-3xl text-center"
          >
            <p className="text-lg text-white/70 leading-relaxed">
              我们通过分析你观看视频的类型、时长、互动行为（点赞、评论），
              <br />
              计算出你在三个维度上的分布，从而构建出独一无二的「弦」形态。
            </p>
          </motion.div>
        </section>

        {/* 底部 Footer */}
        <footer className="w-full py-12 text-center border-t border-white/5 bg-black/40 backdrop-blur-md">
          <p className="text-white/20 text-sm tracking-widest uppercase mb-4">
            String Theory · Soul Resonance
          </p>
          <p className="text-white/10 text-xs">
            © 2026 Xian Universe. All rights reserved.
          </p>
        </footer>

      </div>

      {/* CSS 动画 */}
      <style jsx global>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {/* 授权流程弹窗 */}
      <AuthFlowModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

function ConceptCard({ title, subtitle, description, icon, delay }: { title: string; subtitle: string; description: string; icon: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors group"
    >
      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-2xl font-bold mb-1 text-white/90">{title}</h3>
      <p className="text-sm text-white/40 tracking-widest uppercase mb-4">{subtitle}</p>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ProcessFlow() {
  const steps = [
    {
      title: "数据获取",
      en: "Data Acquisition",
      desc: "基于抖音 API 获取用户真实的视频浏览、点赞、评论数据，捕捉最原始的行为足迹。",
      icon: "📥",
      color: "#22d3ee", // Cyan
    },
    {
      title: "深度理解",
      en: "Deep Understanding",
      desc: "结合视频链接，AI 深度解析每一个视频的内容含义，提取深层语义标签。",
      icon: "🧠",
      color: "#a78bfa", // Violet
    },
    {
      title: "画像构建",
      en: "Profile Construction",
      desc: "基于海量语义标签，为用户构建独一无二的「弦」形态画像，还原真实自我。",
      icon: "👤",
      color: "#e879f9", // Fuchsia
    },
    {
      title: "灵魂匹配",
      en: "Soul Matching",
      desc: "计算不同用户画像之间的共振频率，在茫茫人海中找到与你同频的灵魂。",
      icon: "❤️",
      color: "#fb7185", // Rose
    },
  ];

  return (
    <div className="relative w-full py-10">
      {/* 桌面端连接线 (SVG 动画) */}
      <div className="absolute top-[88px] left-0 w-full h-20 hidden md:block pointer-events-none overflow-visible z-0">
        <svg className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="50%" stopColor="#e879f9" stopOpacity="1" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
            </linearGradient>
            <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 基础轨道 */}
          <path
            d="M 100 10 H 1100"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            fill="none"
            className="w-full"
            vectorEffect="non-scaling-stroke"
          />

          {/* 流动光效 */}
          <motion.path
            d="M 0 10 H 2000"
            stroke="url(#flowGradient)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="200 600"
            animate={{ strokeDashoffset: [-800, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            filter="url(#glowLine)"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            className="relative flex flex-col items-center text-center group"
          >
            {/* 图标容器 */}
            <div className="relative mb-8">
              {/* 动态光晕背景 */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: step.color }}
              />

              {/* 核心图标 */}
              <div
                className="w-20 h-20 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-3xl relative z-10 backdrop-blur-xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2"
                style={{
                  boxShadow: `0 0 20px ${step.color}30`,
                  borderColor: `${step.color}40`
                }}
              >
                {step.icon}
              </div>

              {/* 序号标记 */}
              <div
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black border flex items-center justify-center text-xs font-bold z-20"
                style={{ borderColor: step.color, color: step.color }}
              >
                {index + 1}
              </div>
            </div>

            {/* 文本内容 */}
            <h3 className="text-xl font-bold mb-1 text-white/90 group-hover:text-white transition-colors">
              {step.title}
            </h3>
            <p className="text-xs text-white/30 tracking-widest uppercase mb-4 font-medium">
              {step.en}
            </p>
            <p className="text-sm text-white/50 leading-relaxed px-2 group-hover:text-white/70 transition-colors">
              {step.desc}
            </p>

            {/* 移动端连接线 */}
            {index < steps.length - 1 && (
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: 40 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.2, duration: 0.5 }}
                className="w-0.5 bg-gradient-to-b from-white/20 to-transparent my-6 md:hidden"
                style={{ background: `linear-gradient(to bottom, ${step.color}60, transparent)` }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DimensionDetail({ title, en, color, desc, tags }: { title: string; en: string; color: string; desc: string; tags: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative">
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center border-2"
          style={{ borderColor: `${color}40`, background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }}
        >
          <div
            className="w-24 h-24 rounded-full opacity-50 blur-xl absolute"
            style={{ backgroundColor: color }}
          />
          <span className="text-3xl font-bold relative z-10" style={{ color }}>{title}</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-white/30 tracking-[0.2em] uppercase mb-2">{en}</p>
        <p className="text-sm text-white/60 mb-3">{desc}</p>
        <div className="flex gap-2 justify-center">
          {tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DimensionOrb({ dimension, label, color, delay }: { dimension: string; label: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className="flex flex-col items-center gap-3"
    >
      <motion.div
        animate={{
          boxShadow: [
            `0 0 20px ${color}40`,
            `0 0 40px ${color}60`,
            `0 0 20px ${color}40`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}10)`,
          border: `1px solid ${color}50`,
        }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </motion.div>
      <span className="text-sm text-white/50 tracking-widest">{label}</span>
    </motion.div>
  );
}

function CosmicBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 深空渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0f0a1a 0%, #050208 50%, #000 100%)',
        }}
      />

      {/* 星云效果 */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-1/4 w-[800px] h-[600px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(88,28,135,0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.05, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[500px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(30,64,175,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}

function StarField() {
  // 性能优化：使用 CSS 渲染静态星星，仅少数用 JS 动画
  const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number; twinkle: boolean; duration: number; delay: number }[]>([]);

  // 只在客户端初始化一次
  useEffect(() => {
    const STAR_COUNT = 150;
    const newStars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      newStars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        twinkle: i < 20,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2,
      });
    }
    setStars(newStars);
  }, []);

  if (stars.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className={`absolute rounded-full bg-white ${star.twinkle ? 'animate-pulse' : ''}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDuration: star.twinkle ? `${star.duration}s` : undefined,
            animationDelay: star.twinkle ? `${star.delay}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function FloatingTriangles() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      {/* 外层三角形 */}
      <motion.svg
        width="500"
        height="500"
        viewBox="0 0 100 100"
        className="absolute opacity-[0.04]"
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        <polygon points="50,10 90,80 10,80" fill="none" stroke="url(#gradient1)" strokeWidth="0.3" />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#f093fb" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* 中层三角形 */}
      <motion.svg
        width="350"
        height="350"
        viewBox="0 0 100 100"
        className="absolute opacity-[0.06]"
        animate={{ rotate: -360 }}
        transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
      >
        <polygon points="50,15 85,75 15,75" fill="none" stroke="url(#gradient2)" strokeWidth="0.4" />
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#764ba2" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* 内层三角形 */}
      <motion.svg
        width="200"
        height="200"
        viewBox="0 0 100 100"
        className="absolute opacity-[0.08]"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <polygon points="50,20 80,70 20,70" fill="none" stroke="url(#gradient3)" strokeWidth="0.5" />
        <defs>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5576c" />
            <stop offset="100%" stopColor="#667eea" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
