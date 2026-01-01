'use client';

import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '../color-mixer';

interface MatchResultProps {
  user1: ProcessedUser;
  user2: ProcessedUser;
  matchPercentage: number;
  isActive: boolean;
  onComplete: () => void;
  onViewDetails: () => void;
}

/**
 * 匹配结果揭晓动画
 * 根据匹配度显示不同效果：
 * - >80%: 金色光芒 + 星星特效 + "灵魂共鸣"
 * - 60-80%: 蓝色光芒 + "有缘相遇"
 * - <60%: 普通显示 + "擦肩而过"
 */
export const MatchResult = memo(function MatchResult({
  user1,
  user2,
  matchPercentage,
  isActive,
  onComplete,
  onViewDetails,
}: MatchResultProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [displayNumber, setDisplayNumber] = useState(0);
  const [phase, setPhase] = useState<'counting' | 'reveal' | 'complete'>('counting');

  const color1 = getBaseColor(user1.dimensions);
  const color2 = getBaseColor(user2.dimensions);

  // 确定效果等级
  const effectLevel = matchPercentage >= 80 ? 'gold' : matchPercentage >= 60 ? 'blue' : 'normal';
  const message =
    effectLevel === 'gold'
      ? '灵魂共鸣'
      : effectLevel === 'blue'
        ? '有缘相遇'
        : '擦肩而过';

  // 数字滚动效果
  useEffect(() => {
    if (!isActive) return;

    setPhase('counting');
    let current = 0;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 缓动函数
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * matchPercentage);
      setDisplayNumber(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPhase('reveal');
        setTimeout(() => setPhase('complete'), 800);
      }
    };

    requestAnimationFrame(animate);
  }, [isActive, matchPercentage]);

  // Canvas 特效
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    interface Star {
      x: number;
      y: number;
      size: number;
      angle: number;
      speed: number;
      opacity: number;
    }

    const stars: Star[] = [];
    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景暗化
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';

      // 根据效果等级绘制不同背景
      if (effectLevel === 'gold') {
        // 金色光芒放射
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + time * 0.2;
          const length = 300 + Math.sin(time * 2 + i) * 50;

          const gradient = ctx.createLinearGradient(
            cx,
            cy,
            cx + Math.cos(angle) * length,
            cy + Math.sin(angle) * length
          );
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(
            cx + Math.cos(angle - 0.1) * length,
            cy + Math.sin(angle - 0.1) * length
          );
          ctx.lineTo(
            cx + Math.cos(angle + 0.1) * length,
            cy + Math.sin(angle + 0.1) * length
          );
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // 生成星星
        if (phase === 'reveal' && Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 100 + Math.random() * 200;
          stars.push({
            x: cx + Math.cos(angle) * distance,
            y: cy + Math.sin(angle) * distance,
            size: 3 + Math.random() * 5,
            angle: angle,
            speed: 2 + Math.random() * 3,
            opacity: 1,
          });
        }

        // 绘制星星
        for (let i = stars.length - 1; i >= 0; i--) {
          const star = stars[i];
          star.x += Math.cos(star.angle) * star.speed;
          star.y += Math.sin(star.angle) * star.speed;
          star.opacity -= 0.02;

          if (star.opacity > 0) {
            drawStar(ctx, star.x, star.y, star.size, star.opacity);
          } else {
            stars.splice(i, 1);
          }
        }
      } else if (effectLevel === 'blue') {
        // 蓝色能量环
        for (let i = 0; i < 3; i++) {
          const radius = 100 + i * 80 + Math.sin(time * 2 + i) * 20;
          const opacity = 0.3 - i * 0.08;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(100, 180, 255, ${opacity})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // 粒子效果
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + time * 0.5;
          const distance = 150 + Math.sin(time * 3 + i * 0.5) * 30;
          const x = cx + Math.cos(angle) * distance;
          const y = cy + Math.sin(angle) * distance;
          const size = 2 + Math.sin(time * 2 + i) * 1;

          ctx.fillStyle = `rgba(150, 200, 255, ${0.5 + Math.sin(time * 2 + i) * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 普通效果 - 简单光晕
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
        gradient.addColorStop(0, 'rgba(150, 150, 150, 0.3)');
        gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.1)');
        gradient.addColorStop(1, 'rgba(50, 50, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 200, 0, Math.PI * 2);
        ctx.fill();
      }

      // 中心光晕
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
      if (effectLevel === 'gold') {
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.5)');
        coreGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
      } else if (effectLevel === 'blue') {
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        coreGradient.addColorStop(0.3, 'rgba(100, 180, 255, 0.4)');
        coreGradient.addColorStop(1, 'rgba(50, 100, 200, 0)');
      } else {
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        coreGradient.addColorStop(0.5, 'rgba(150, 150, 150, 0.2)');
        coreGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
      }
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 150, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, effectLevel, phase]);

  const handleClick = useCallback(() => {
    if (phase === 'complete') {
      onViewDetails();
    }
  }, [phase, onViewDetails]);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* 匹配数字 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* 两个用户标识 */}
        <div className="flex items-center gap-8 mb-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-16 h-16 rounded-full mb-2"
              style={{
                background: `linear-gradient(135deg, ${color1}, white)`,
                boxShadow: `0 0 20px ${color1}`,
              }}
            />
            <span className="text-sm text-white/70">{user1.nickname}</span>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-2xl"
            style={{
              color:
                effectLevel === 'gold'
                  ? '#ffd700'
                  : effectLevel === 'blue'
                    ? '#64b5f6'
                    : '#999',
            }}
          >
            ♥
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-16 h-16 rounded-full mb-2"
              style={{
                background: `linear-gradient(135deg, ${color2}, white)`,
                boxShadow: `0 0 20px ${color2}`,
              }}
            />
            <span className="text-sm text-white/70">{user2.nickname}</span>
          </motion.div>
        </div>

        {/* 匹配百分比 */}
        <motion.div
          animate={
            phase === 'reveal'
              ? {
                  scale: [1, 1.2, 1],
                  textShadow:
                    effectLevel === 'gold'
                      ? [
                          '0 0 20px rgba(255,215,0,0.5)',
                          '0 0 60px rgba(255,215,0,0.8)',
                          '0 0 20px rgba(255,215,0,0.5)',
                        ]
                      : effectLevel === 'blue'
                        ? [
                            '0 0 20px rgba(100,180,255,0.5)',
                            '0 0 60px rgba(100,180,255,0.8)',
                            '0 0 20px rgba(100,180,255,0.5)',
                          ]
                        : undefined,
                }
              : {}
          }
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span
            className="text-8xl md:text-9xl font-black"
            style={{
              background:
                effectLevel === 'gold'
                  ? 'linear-gradient(180deg, #fff 0%, #ffd700 40%, #ff8c00 100%)'
                  : effectLevel === 'blue'
                    ? 'linear-gradient(180deg, #fff 0%, #64b5f6 40%, #1976d2 100%)'
                    : 'linear-gradient(180deg, #fff 0%, #999 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow:
                effectLevel === 'gold'
                  ? '0 0 40px rgba(255,215,0,0.5)'
                  : effectLevel === 'blue'
                    ? '0 0 40px rgba(100,180,255,0.5)'
                    : '0 0 20px rgba(150,150,150,0.3)',
            }}
          >
            {displayNumber}%
          </span>
        </motion.div>

        {/* 描述文字 */}
        <AnimatePresence>
          {phase !== 'counting' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <p
                className="text-2xl font-bold tracking-widest"
                style={{
                  color:
                    effectLevel === 'gold'
                      ? '#ffd700'
                      : effectLevel === 'blue'
                        ? '#64b5f6'
                        : '#999',
                }}
              >
                {message}
              </p>
              {phase === 'complete' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-sm text-white/50"
                >
                  点击查看详细对比
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

/**
 * 绘制星星
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number
) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
  gradient.addColorStop(0.5, `rgba(255, 215, 0, ${opacity * 0.7})`);
  gradient.addColorStop(1, `rgba(255, 150, 0, ${opacity * 0.3})`);

  ctx.fillStyle = gradient;
  ctx.fill();
}
