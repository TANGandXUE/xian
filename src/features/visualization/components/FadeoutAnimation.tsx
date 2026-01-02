'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '@/features/visualization/color-mixer';

interface FadeoutAnimationProps {
  user1: ProcessedUser;
  user2: ProcessedUser;
  isActive: boolean;
  onComplete: () => void;
}

export function FadeoutAnimation({ user1, user2, isActive, onComplete }: FadeoutAnimationProps) {
  const [phase, setPhase] = useState<'glow' | 'fade' | 'done'>('glow');
  const color1 = getBaseColor(user1.dimensions);
  const color2 = getBaseColor(user2.dimensions);

  // 混合色
  const mixedColor = `linear-gradient(135deg, ${color1}, ${color2})`;

  useEffect(() => {
    if (!isActive) {
      setPhase('glow');
      return;
    }

    // 动画序列：发光 → 渐隐融合 → 完成
    const timer1 = setTimeout(() => setPhase('fade'), 1000);
    const timer2 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center"
      >
        {/* 背景渐隐 */}
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: phase === 'fade' ? 0 : 0.6 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-black backdrop-blur-sm"
        />

        {/* 中心融合光球 */}
        <div className="relative">
          {/* 外层脉冲光环 */}
          <motion.div
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{
              opacity: phase === 'fade' ? [0.6, 0.3, 0] : [0.4, 0.8, 0.4],
              scale: phase === 'fade' ? [1, 1.5, 2] : [1, 1.2, 1],
            }}
            transition={{
              duration: phase === 'fade' ? 1.5 : 2,
              repeat: phase === 'fade' ? 0 : Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full"
            style={{
              background: `radial-gradient(circle, ${color1}40 0%, ${color2}30 50%, transparent 70%)`,
              filter: 'blur(30px)',
            }}
          />

          {/* 核心融合体 */}
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: phase === 'fade' ? [1, 0.5, 0] : 1,
              scale: phase === 'fade' ? [1, 0.8, 0.3] : [1, 1.05, 1],
            }}
            transition={{
              duration: phase === 'fade' ? 1.5 : 1.5,
              repeat: phase === 'fade' ? 0 : Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-[120px] h-[120px] rounded-full"
            style={{
              background: mixedColor,
              boxShadow: `0 0 60px ${color1}80, 0 0 100px ${color2}60`,
            }}
          >
            {/* 内部纹理 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full opacity-50"
              style={{
                background: `conic-gradient(from 0deg, ${color1}, ${color2}, ${color1})`,
              }}
            />
          </motion.div>

          {/* 漂浮粒子 */}
          {phase === 'glow' && [...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.cos(i * Math.PI / 3) * 80,
                y: Math.sin(i * Math.PI / 3) * 80,
                opacity: 0.8,
              }}
              animate={{
                x: Math.cos(i * Math.PI / 3) * 60,
                y: Math.sin(i * Math.PI / 3) * 60,
                opacity: [0.8, 0.4, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
              className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
              style={{
                backgroundColor: i % 2 === 0 ? color1 : color2,
                boxShadow: `0 0 10px ${i % 2 === 0 ? color1 : color2}`,
              }}
            />
          ))}
        </div>

        {/* 文字 */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'fade' ? 0 : 1 }}
          transition={{ duration: 1 }}
          className="absolute bottom-1/4 text-center"
        >
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xl font-light text-white/80 tracking-widest"
          >
            灵魂已连接
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
