'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '@/features/visualization/color-mixer';

interface FusionAnimationProps {
  user1: ProcessedUser;
  user2: ProcessedUser;
  isActive: boolean;
  onComplete: () => void;
}

export function FusionAnimation({ user1, user2, isActive, onComplete }: FusionAnimationProps) {
  const [phase, setPhase] = useState<'approach' | 'merge' | 'flash' | 'done'>('approach');
  const color1 = getBaseColor(user1.dimensions);
  const color2 = getBaseColor(user2.dimensions);

  useEffect(() => {
    if (!isActive) {
      setPhase('approach');
      return;
    }

    // 动画序列：靠近 → 融合 → 闪光 → 完成
    const timer1 = setTimeout(() => setPhase('merge'), 800);
    const timer2 = setTimeout(() => setPhase('flash'), 1800);
    const timer3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        {/* 两个三角形 */}
        <div className="relative w-[400px] h-[400px]">
          {/* 三角形1 - 从左边靠近 */}
          <motion.div
            className="absolute"
            initial={{ x: -150, y: 0, rotate: 0 }}
            animate={
              phase === 'approach'
                ? { x: -150, y: 0, rotate: 0 }
                : phase === 'merge'
                ? { x: 0, y: 0, rotate: 180, scale: 0.8 }
                : { x: 0, y: 0, rotate: 180, scale: 1 }
            }
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <Triangle color={color1} size={120} />
          </motion.div>

          {/* 三角形2 - 从右边靠近 */}
          <motion.div
            className="absolute"
            initial={{ x: 150, y: 0, rotate: 180 }}
            animate={
              phase === 'approach'
                ? { x: 150, y: 0, rotate: 180 }
                : phase === 'merge'
                ? { x: 0, y: 0, rotate: 0, scale: 0.8 }
                : { x: 0, y: 0, rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <Triangle color={color2} size={120} />
          </motion.div>

          {/* 融合后的光芒 */}
          {(phase === 'merge' || phase === 'flash') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.8], scale: [0.5, 1.5, 1.2] }}
              transition={{ duration: 1 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${color1}60 0%, ${color2}40 50%, transparent 70%)`,
                filter: 'blur(30px)',
              }}
            />
          )}

          {/* 闪光效果 */}
          {phase === 'flash' && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [1, 0], scale: [0, 3] }}
                transition={{ duration: 0.8 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full bg-white"
                style={{ filter: 'blur(20px)' }}
              />
              {/* 光芒射线 */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [1, 0], scale: [0, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="absolute left-1/2 top-1/2 w-[2px] h-[150px] bg-gradient-to-t from-white to-transparent"
                  style={{
                    transformOrigin: 'bottom center',
                    transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </>
          )}
        </div>

        {/* 文字 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-1/4 text-center"
        >
          <p className="text-2xl font-bold text-white mb-2">灵魂共振</p>
          <p className="text-white/60 text-sm">两条弦完美融合</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Triangle({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon
        points="50,10 90,80 10,80"
        fill={`url(#grad-${color})`}
        stroke={color}
        strokeWidth="2"
        filter="url(#glow)"
      />
    </svg>
  );
}
