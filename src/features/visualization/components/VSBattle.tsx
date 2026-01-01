'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '../color-mixer';

interface VSBattleProps {
  user1: ProcessedUser;
  user2: ProcessedUser;
  isActive: boolean;
  onComplete: () => void;
}

/**
 * VS 对决动画组件 - 星际科幻风格
 * 特效：能量波纹扩散、光束碰撞、VS 文字动画
 */
export const VSBattle = memo(function VSBattle({
  user1,
  user2,
  isActive,
  onComplete,
}: VSBattleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [phase, setPhase] = useState<'enter' | 'clash' | 'peak' | 'exit'>('enter');

  const color1 = getBaseColor(user1.dimensions);
  const color2 = getBaseColor(user2.dimensions);

  // 解析颜色
  const parseColor = (color: string) => {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 100, g: 150, b: 255 };
  };

  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  useEffect(() => {
    if (!isActive) return;

    // 阶段控制
    setPhase('enter');
    const clashTimer = setTimeout(() => setPhase('clash'), 600);
    const peakTimer = setTimeout(() => setPhase('peak'), 1200);
    const exitTimer = setTimeout(() => setPhase('exit'), 1800);
    const completeTimer = setTimeout(() => onComplete(), 2200);

    return () => {
      clearTimeout(clashTimer);
      clearTimeout(peakTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, onComplete]);

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

    let time = 0;
    const particles: Particle[] = [];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: { r: number; g: number; b: number };
      size: number;
    }

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 暗色背景遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 能量波纹扩散
      ctx.globalCompositeOperation = 'lighter';
      const waveCount = 5;
      for (let i = 0; i < waveCount; i++) {
        const waveProgress = ((time * 0.5 + i * 0.2) % 1);
        const waveRadius = waveProgress * Math.max(canvas.width, canvas.height) * 0.8;
        const waveOpacity = (1 - waveProgress) * 0.15;

        // 左侧波纹
        const gradient1 = ctx.createRadialGradient(cx * 0.3, cy, 0, cx * 0.3, cy, waveRadius);
        gradient1.addColorStop(0, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0)`);
        gradient1.addColorStop(0.8, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, ${waveOpacity})`);
        gradient1.addColorStop(1, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0)`);
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(cx * 0.3, cy, waveRadius, 0, Math.PI * 2);
        ctx.fill();

        // 右侧波纹
        const gradient2 = ctx.createRadialGradient(cx * 1.7, cy, 0, cx * 1.7, cy, waveRadius);
        gradient2.addColorStop(0, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0)`);
        gradient2.addColorStop(0.8, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, ${waveOpacity})`);
        gradient2.addColorStop(1, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0)`);
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(cx * 1.7, cy, waveRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 光束碰撞效果
      if (phase === 'clash' || phase === 'peak') {
        const beamIntensity = phase === 'peak' ? 1 : 0.6;

        // 左侧光束
        const beam1Gradient = ctx.createLinearGradient(0, cy, cx, cy);
        beam1Gradient.addColorStop(0, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0)`);
        beam1Gradient.addColorStop(0.5, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, ${0.4 * beamIntensity})`);
        beam1Gradient.addColorStop(1, `rgba(255, 255, 255, ${0.8 * beamIntensity})`);

        ctx.beginPath();
        ctx.moveTo(0, cy - 40);
        ctx.lineTo(cx, cy);
        ctx.lineTo(0, cy + 40);
        ctx.closePath();
        ctx.fillStyle = beam1Gradient;
        ctx.fill();

        // 右侧光束
        const beam2Gradient = ctx.createLinearGradient(canvas.width, cy, cx, cy);
        beam2Gradient.addColorStop(0, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0)`);
        beam2Gradient.addColorStop(0.5, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, ${0.4 * beamIntensity})`);
        beam2Gradient.addColorStop(1, `rgba(255, 255, 255, ${0.8 * beamIntensity})`);

        ctx.beginPath();
        ctx.moveTo(canvas.width, cy - 40);
        ctx.lineTo(cx, cy);
        ctx.lineTo(canvas.width, cy + 40);
        ctx.closePath();
        ctx.fillStyle = beam2Gradient;
        ctx.fill();

        // 碰撞中心爆发
        const burstRadius = 80 + Math.sin(time * 10) * 20;
        const burstGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, burstRadius);
        burstGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * beamIntensity})`);
        burstGradient.addColorStop(0.3, `rgba(255, 200, 150, ${0.5 * beamIntensity})`);
        burstGradient.addColorStop(1, 'rgba(255, 150, 100, 0)');
        ctx.fillStyle = burstGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, burstRadius, 0, Math.PI * 2);
        ctx.fill();

        // 生成碰撞粒子
        if (Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 5 + Math.random() * 10;
          particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: Math.random() > 0.5 ? rgb1 : rgb2,
            size: 2 + Math.random() * 3,
          });
        }
      }

      // 更新和绘制粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life > 0) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${p.life})`);
          gradient.addColorStop(0.5, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.life * 0.5})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          particles.splice(i, 1);
        }
      }

      // 闪电效果
      if (phase === 'peak' && Math.random() < 0.1) {
        drawLightning(ctx, cx * 0.5, cy, cx, cy, rgb1);
        drawLightning(ctx, cx * 1.5, cy, cx, cy, rgb2);
      }

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, phase, rgb1, rgb2]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* VS 文字 */}
      <AnimatePresence>
        {(phase === 'clash' || phase === 'peak') && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative">
              {/* VS 光晕 */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span
                  className="text-[180px] font-black text-transparent"
                  style={{
                    WebkitTextStroke: '2px rgba(255,255,255,0.3)',
                    filter: 'blur(20px)',
                  }}
                >
                  VS
                </span>
              </motion.div>

              {/* VS 主体 */}
              <motion.span
                animate={{
                  textShadow: [
                    '0 0 30px rgba(255,200,100,0.8), 0 0 60px rgba(255,150,50,0.5)',
                    '0 0 50px rgba(255,220,150,1), 0 0 100px rgba(255,180,80,0.7)',
                    '0 0 30px rgba(255,200,100,0.8), 0 0 60px rgba(255,150,50,0.5)',
                  ],
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="text-[120px] font-black text-white tracking-wider"
                style={{
                  background: 'linear-gradient(180deg, #fff 0%, #ffd700 50%, #ff8c00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                VS
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 左侧用户标识 */}
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: phase !== 'exit' ? 1 : 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="absolute left-[10%] top-1/2 -translate-y-1/2"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${color1} 0%, transparent 70%)`,
              boxShadow: `0 0 40px ${color1}, 0 0 80px ${color1}50`,
            }}
          >
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${color1}, white)`,
              }}
            />
          </motion.div>
          <span className="text-lg font-bold text-white/90">{user1.nickname}</span>
        </div>
      </motion.div>

      {/* 右侧用户标识 */}
      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: phase !== 'exit' ? 1 : 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="absolute right-[10%] top-1/2 -translate-y-1/2"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${color2} 0%, transparent 70%)`,
              boxShadow: `0 0 40px ${color2}, 0 0 80px ${color2}50`,
            }}
          >
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${color2}, white)`,
              }}
            />
          </motion.div>
          <span className="text-lg font-bold text-white/90">{user2.nickname}</span>
        </div>
      </motion.div>
    </div>
  );
});

/**
 * 绘制闪电效果
 */
function drawLightning(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: { r: number; g: number; b: number }
) {
  const segments = 8;
  const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 50;
    const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
    points.push({ x, y });
  }
  points.push({ x: x2, y: y2 });

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
  ctx.lineWidth = 3;
  ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
  ctx.shadowBlur = 20;
  ctx.stroke();

  // 内部更亮的线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;
}
