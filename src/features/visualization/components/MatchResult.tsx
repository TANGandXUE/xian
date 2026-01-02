'use client';

import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '../color-mixer';

export interface AIAnalysis {
  percentage: number;
  summary: string;
  highlights: string[];
  chemistry: string;
}

interface MatchResultProps {
  user1: ProcessedUser;
  user2: ProcessedUser;
  matchPercentage: number;
  isActive: boolean;
  onComplete: () => void;
  onViewDetails: (analysis: AIAnalysis | null) => void;
  isGestureEnabled?: boolean; // 手势模式是否启用
  gestureGrab?: boolean; // 手势握拳状态
}

// 缓存 AI 分析结果
const analysisCache = new Map<string, AIAnalysis>();

function getCacheKey(user1: ProcessedUser, user2: ProcessedUser): string {
  const ids = [user1.id, user2.id].sort();
  return `${ids[0]}_${ids[1]}`;
}

/**
 * 匹配结果揭晓动画
 * 先显示计算结果，AI 在后台增强
 */
export const MatchResult = memo(function MatchResult({
  user1,
  user2,
  matchPercentage: fallbackPercentage,
  isActive,
  onComplete,
  onViewDetails,
  isGestureEnabled = false,
  gestureGrab = false,
}: MatchResultProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [displayNumber, setDisplayNumber] = useState(0);
  const [phase, setPhase] = useState<'counting' | 'reveal' | 'complete'>('counting');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);

  const color1 = getBaseColor(user1.dimensions);
  const color2 = getBaseColor(user2.dimensions);

  // 立即开始数字动画，同时后台获取 AI 分析
  useEffect(() => {
    if (!isActive) return;

    const cacheKey = getCacheKey(user1, user2);
    const cached = analysisCache.get(cacheKey);

    if (cached) {
      // 有缓存，直接使用
      setAiAnalysis(cached);
      setAiLoading(false);
      setPhase('counting');
      return;
    }

    // 无缓存，先用计算值，后台请求 AI
    setAiAnalysis(null);
    setAiLoading(true);
    setAiProgress(0);
    setPhase('counting');

    // 模拟进度条
    const progressInterval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    fetch('/api/match/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1, user2 }),
    })
      .then((res) => res.json())
      .then((data: AIAnalysis) => {
        setAiProgress(100);
        setTimeout(() => {
          setAiAnalysis(data);
          setAiLoading(false);
          // 缓存结果
          analysisCache.set(cacheKey, data);
        }, 200);
      })
      .catch((err) => {
        console.error('AI analysis failed:', err);
        setAiProgress(100);
        const fallback: AIAnalysis = {
          percentage: fallbackPercentage,
          summary: '两个灵魂在宇宙中相遇',
          highlights: ['共同的兴趣', '相似的价值观'],
          chemistry: '两条弦在时空中交织',
        };
        setAiAnalysis(fallback);
        setAiLoading(false);
        analysisCache.set(cacheKey, fallback);
      })
      .finally(() => {
        clearInterval(progressInterval);
      });

    return () => clearInterval(progressInterval);
  }, [isActive, user1, user2, fallbackPercentage]);

  // 只有 AI 返回后才使用真实百分比，否则显示 "?"
  const hasAiResult = aiAnalysis !== null;
  const finalPercentage = aiAnalysis?.percentage ?? fallbackPercentage;

  // 确定效果等级 - 只在有 AI 结果时才确定
  const effectLevel = hasAiResult
    ? (finalPercentage >= 80 ? 'gold' : finalPercentage >= 60 ? 'blue' : 'normal')
    : 'pending';
  const message =
    effectLevel === 'gold'
      ? '灵魂共鸣'
      : effectLevel === 'blue'
        ? '有缘相遇'
        : effectLevel === 'normal'
          ? '擦肩而过'
          : '分析中...';

  // 数字滚动效果 - AI 返回后才开始真正的动画
  useEffect(() => {
    if (phase !== 'counting' || !isActive || !hasAiResult) return;

    let current = 0;
    const duration = 1500;
    const startTime = Date.now();
    const targetPercentage = finalPercentage;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 缓动函数
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * targetPercentage);
      setDisplayNumber(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPhase('reveal');
        setTimeout(() => setPhase('complete'), 800);
      }
    };

    requestAnimationFrame(animate);
  }, [phase, isActive, hasAiResult, finalPercentage]);

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
      } else if (effectLevel === 'pending') {
        // 等待效果 - 紫色旋转光环
        for (let i = 0; i < 2; i++) {
          const radius = 120 + i * 60;
          const startAngle = time * 2 + i * Math.PI;
          const endAngle = startAngle + Math.PI;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, startAngle, endAngle);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 - i * 0.15})`;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // 中心脉冲
        const pulseSize = 80 + Math.sin(time * 3) * 20;
        const pulseGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseSize);
        pulseGradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        pulseGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
        pulseGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = pulseGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
        ctx.fill();
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
      } else if (effectLevel === 'pending') {
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        coreGradient.addColorStop(0.3, 'rgba(168, 85, 247, 0.4)');
        coreGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
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
      onViewDetails(aiAnalysis);
    }
  }, [phase, onViewDetails, aiAnalysis]);

  // 手势握拳触发查看详情
  const prevGestureGrabRef = useRef(false);
  useEffect(() => {
    if (!isActive) return;

    // 检测 gestureGrab 从 false 变为 true（握拳动作）
    if (gestureGrab && !prevGestureGrabRef.current && phase === 'complete') {
      handleClick();
    }
    prevGestureGrabRef.current = gestureGrab;
  }, [isActive, gestureGrab, phase, handleClick]);

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

        {/* 匹配数字 */}
        <motion.div
          key="percentage"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: phase === 'reveal' ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span
            className="text-8xl md:text-9xl font-black inline-block bg-clip-text"
            style={{
              backgroundImage:
                effectLevel === 'gold'
                  ? 'linear-gradient(180deg, #fff 0%, #ffd700 40%, #ff8c00 100%)'
                  : effectLevel === 'blue'
                    ? 'linear-gradient(180deg, #fff 0%, #64b5f6 40%, #1976d2 100%)'
                    : effectLevel === 'pending'
                      ? 'linear-gradient(180deg, #fff 0%, #a855f7 40%, #7c3aed 100%)'
                      : 'linear-gradient(180deg, #fff 0%, #999 100%)',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              filter: effectLevel === 'gold'
                ? 'drop-shadow(0 0 40px rgba(255,215,0,0.5))'
                : effectLevel === 'blue'
                  ? 'drop-shadow(0 0 40px rgba(100,180,255,0.5))'
                  : effectLevel === 'pending'
                    ? 'drop-shadow(0 0 40px rgba(168,85,247,0.5))'
                    : 'drop-shadow(0 0 20px rgba(150,150,150,0.3))',
            }}
          >
            {hasAiResult ? `${displayNumber}%` : '?'}
          </span>
        </motion.div>

        {/* AI 分析进度条 */}
        <AnimatePresence>
          {aiLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 w-64"
            >
              <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                <span>AI 分析中...</span>
                <span>{Math.round(aiProgress)}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                    width: `${aiProgress}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 描述文字 */}
        <AnimatePresence>
          {phase !== 'counting' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center max-w-md"
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

              {/* AI 分析摘要 */}
              {aiAnalysis && phase === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 space-y-3"
                >
                  <p className="text-white/80 text-sm italic">"{aiAnalysis.chemistry}"</p>
                  <p className="text-white/60 text-xs">{aiAnalysis.summary}</p>

                  {/* 共同点标签 */}
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {aiAnalysis.highlights.map((highlight, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="px-3 py-1 text-xs rounded-full"
                        style={{
                          background: effectLevel === 'gold'
                            ? 'rgba(255, 215, 0, 0.2)'
                            : effectLevel === 'blue'
                              ? 'rgba(100, 180, 255, 0.2)'
                              : 'rgba(150, 150, 150, 0.2)',
                          border: `1px solid ${effectLevel === 'gold' ? '#ffd700' : effectLevel === 'blue' ? '#64b5f6' : '#999'}40`,
                          color: effectLevel === 'gold' ? '#ffd700' : effectLevel === 'blue' ? '#64b5f6' : '#ccc',
                        }}
                      >
                        {highlight}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === 'complete' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 text-sm text-white/50"
                >
                  {isGestureEnabled ? '点击或握拳查看详细对比' : '点击查看详细对比'}
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
