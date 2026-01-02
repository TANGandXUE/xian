'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '@/features/visualization/color-mixer';

interface BounceAnimationProps {
  user1: ProcessedUser;
  user2: ProcessedUser;
  matchPercentage: number;
  isActive: boolean;
  onComplete: () => void;
}

export function BounceAnimation({ user1, user2, matchPercentage, isActive, onComplete }: BounceAnimationProps) {
  const [phase, setPhase] = useState<'impact' | 'bounce' | 'scatter' | 'done'>('impact');
  const color1 = getBaseColor(user1.dimensions);
  const color2 = getBaseColor(user2.dimensions);

  // 生成随机碎片
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i / 12) * Math.PI * 2,
      distance: 80 + Math.random() * 60,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 0.2,
      color: i % 2 === 0 ? color1 : color2,
    }));
  }, [color1, color2]);

  useEffect(() => {
    if (!isActive) {
      setPhase('impact');
      return;
    }

    // 动画序列：碰撞 → 弹开 → 碎片散开 → 完成
    const timer1 = setTimeout(() => setPhase('bounce'), 600);
    const timer2 = setTimeout(() => setPhase('scatter'), 1200);
    const timer3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2200);

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
        <div className="relative w-[500px] h-[400px]">
          {/* 碰撞闪光 */}
          {phase === 'impact' && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
              transition={{ duration: 0.4 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full"
              style={{ background: `radial-gradient(circle, white 0%, ${color1}50 50%, transparent 70%)` }}
            />
          )}

          {/* 三角形1 - 带物理弹跳 */}
          <motion.div
            className="absolute"
            initial={{ x: -30, y: 0, rotate: 0 }}
            animate={
              phase === 'impact'
                ? { x: [-30, -10, -30], y: 0, rotate: [0, 8, -5, 0], scale: [1, 1.1, 0.95, 1] }
                : phase === 'bounce'
                  ? { x: -120, y: -40, rotate: -15, scale: 0.9 }
                  : { x: -200, y: -80, rotate: -25, opacity: 0, scale: 0.7 }
            }
            transition={
              phase === 'impact'
                ? { duration: 0.5, ease: 'easeOut' }
                : { type: 'spring', stiffness: 100, damping: 12 }
            }
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <Triangle color={color1} size={100} glow />
          </motion.div>

          {/* 三角形2 - 带物理弹跳 */}
          <motion.div
            className="absolute"
            initial={{ x: 30, y: 0, rotate: 0 }}
            animate={
              phase === 'impact'
                ? { x: [30, 10, 30], y: 0, rotate: [0, -8, 5, 0], scale: [1, 1.1, 0.95, 1] }
                : phase === 'bounce'
                  ? { x: 120, y: 40, rotate: 15, scale: 0.9 }
                  : { x: 200, y: 80, rotate: 25, opacity: 0, scale: 0.7 }
            }
            transition={
              phase === 'impact'
                ? { duration: 0.5, ease: 'easeOut' }
                : { type: 'spring', stiffness: 100, damping: 12 }
            }
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <Triangle color={color2} size={100} glow />
          </motion.div>

          {/* 排斥力场波纹 - 多层 */}
          {(phase === 'bounce' || phase === 'scatter') && (
            <>
              {[0, 0.1, 0.2].map((delay, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.8, scale: 0.3 }}
                  animate={{ opacity: 0, scale: 2.5 }}
                  transition={{ duration: 0.8, delay, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: 100,
                    height: 100,
                    border: `2px solid rgba(239, 68, 68, ${0.5 - i * 0.15})`,
                    boxShadow: `0 0 20px rgba(239, 68, 68, ${0.3 - i * 0.1})`,
                  }}
                />
              ))}
            </>
          )}

          {/* 碎片粒子 */}
          {(phase === 'bounce' || phase === 'scatter') && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1
              }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                opacity: 0,
                scale: 0.3,
                rotate: p.angle * 180,
              }}
              transition={{
                duration: 0.8,
                delay: p.delay,
                ease: 'easeOut',
              }}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
              }}
            />
          ))}

          {/* X 标记 - 带震动 */}
          {phase === 'impact' && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: [0, 1.3, 1], rotate: 0 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <motion.div
                animate={{ x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0] }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-5xl text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
              >
                ✕
              </motion.div>
            </motion.div>
          )}

          {/* 低匹配率文字 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: phase === 'scatter' ? 0 : 1,
              y: 0,
              scale: phase === 'scatter' ? 0.8 : 1,
            }}
            transition={{ delay: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-6 text-center"
          >
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-red-400 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            >
              频率不匹配
            </motion.p>
            <p className="text-white/50 text-sm">
              契合度 <span className="text-red-400 font-medium">{matchPercentage}%</span>，继续寻找共振
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Triangle({ color, size, glow }: { color: string; size: number; glow?: boolean }) {
  const id = `grad-bounce-${color.replace('#', '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={glow ? { filter: `drop-shadow(0 0 10px ${color})` } : undefined}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <polygon
        points="50,15 85,75 15,75"
        fill={`url(#${id})`}
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
