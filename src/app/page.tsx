'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 动态背景 */}
      <AnimatedBackground />

      {/* 中央三角形装饰 */}
      <FloatingTriangle />

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-8"
        >
          <h1 className="text-8xl md:text-9xl font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
              闲
            </span>
          </h1>
          <p className="text-center text-xl text-white/40 tracking-[0.3em] mt-2">XIÁN</p>
        </motion.div>

        {/* 副标题 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center mb-12 max-w-lg"
        >
          <p className="text-lg md:text-xl text-white/60 leading-relaxed mb-4">
            源自弦理论的灵感
            <br />
            每个人都是独特的振动频率
          </p>
          <p className="text-sm text-white/30">
            通过真实数据呈现最真实的你，找到灵魂共鸣
          </p>
        </motion.div>

        {/* 特性展示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex gap-8 mb-12 flex-wrap justify-center"
        >
          <FeatureCard icon="🔍" title="求知" description="理性与好奇" color="blue" />
          <FeatureCard icon="💫" title="共情" description="连接与理解" color="pink" />
          <FeatureCard icon="✨" title="愉悦" description="快乐与放松" color="green" />
        </motion.div>

        {/* CTA 按钮 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-12 py-4 rounded-full overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
              <span className="relative z-10 text-lg font-medium tracking-wide flex items-center gap-3">
                进入宇宙
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  →
                </motion.span>
              </span>
            </motion.button>
          </Link>
        </motion.div>

        {/* 底部信息 */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 text-center"
        >
          <p className="text-white/20 text-xs tracking-widest uppercase">第一性原则 · 去伪存真</p>
        </motion.footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: 'blue' | 'pink' | 'green';
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`px-6 py-4 rounded-xl bg-gradient-to-b ${colors[color]} border backdrop-blur-sm`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-white/40">{description}</p>
    </motion.div>
  );
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a0a20_0%,_#000_50%)]" />
      {/* 动态光斑 - 使用固定初始位置 */}
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -50, 0], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -80, 0], y: [0, 80, 0], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, 60, 0], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
      />
    </div>
  );
}

function FloatingTriangle() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
      <motion.svg
        width="600"
        height="600"
        viewBox="0 0 100 100"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <polygon points="50,15 85,75 15,75" fill="none" stroke="white" strokeWidth="0.5" />
        <polygon points="50,25 75,65 25,65" fill="none" stroke="white" strokeWidth="0.3" />
        <polygon points="50,35 65,55 35,55" fill="none" stroke="white" strokeWidth="0.2" />
      </motion.svg>
    </div>
  );
}
