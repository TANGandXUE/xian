'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface IronFlowerRef {
  burst: (x: number, y: number) => void;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: { r: number; g: number; b: number };
  trail: { x: number; y: number; life: number }[];
  type: 'main' | 'secondary' | 'ember';
}

/**
 * 打铁花效果 - 中国传统非遗艺术
 * 特点：金黄色火花、向上喷射、重力下落如流星、拖尾效果
 */
export const IronFlower = forwardRef<IronFlowerRef, { className?: string }>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const animationFrameId = useRef<number>(0);

  // 打铁花的颜色：金黄色、橙红色、白热色
  const IRON_COLORS = [
    { r: 255, g: 220, b: 100 }, // 金黄色
    { r: 255, g: 180, b: 50 }, // 橙黄色
    { r: 255, g: 140, b: 30 }, // 橙色
    { r: 255, g: 100, b: 20 }, // 橙红色
    { r: 255, g: 250, b: 220 }, // 白热色（最亮）
  ];

  useImperativeHandle(ref, () => ({
    burst: (x: number, y: number) => {
      // 第一波：核心爆发 - 高速向上喷射
      const coreCount = 60 + Math.random() * 40;
      for (let i = 0; i < coreCount; i++) {
        const baseAngle = -Math.PI / 2;
        const angleSpread = Math.PI * 0.5;
        const angle = baseAngle + (Math.random() - 0.5) * angleSpread;
        const speed = 20 + Math.random() * 25;
        const color = IRON_COLORS[Math.floor(Math.random() * IRON_COLORS.length)];

        sparks.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          maxLife: 1.0,
          size: 2.5 + Math.random() * 3.5,
          color,
          trail: [],
          type: 'main',
        });
      }

      // 第二波：扩散火花 - 更宽的角度
      const spreadCount = 80 + Math.random() * 50;
      for (let i = 0; i < spreadCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        const speed = 12 + Math.random() * 18;
        const color = IRON_COLORS[Math.floor(Math.random() * 4)];

        sparks.current.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          maxLife: 1.0,
          size: 1.5 + Math.random() * 2.5,
          color,
          trail: [],
          type: 'secondary',
        });
      }

      // 第三波：低速星火 - 飘散效果
      const floatCount = 50 + Math.random() * 30;
      for (let i = 0; i < floatCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
        const speed = 5 + Math.random() * 10;
        const color = IRON_COLORS[Math.floor(Math.random() * 3)];

        sparks.current.push({
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 25,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1.0,
          maxLife: 1.0,
          size: 1 + Math.random() * 2,
          color,
          trail: [],
          type: 'secondary',
        });
      }

      // 余烬 - 缓慢上升的小火星
      const emberCount = 40;
      for (let i = 0; i < emberCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;

        sparks.current.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          life: 1.0,
          maxLife: 1.0,
          size: 0.8 + Math.random() * 1.5,
          color: IRON_COLORS[0],
          trail: [],
          type: 'ember',
        });
      }

      // 白热核心闪光 - 最亮的粒子
      const flashCount = 15;
      for (let i = 0; i < flashCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.3;
        const speed = 25 + Math.random() * 15;

        sparks.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          maxLife: 1.0,
          size: 3 + Math.random() * 4,
          color: IRON_COLORS[4], // 白热色
          trail: [],
          type: 'main',
        });
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 清除画布（带淡出效果）
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 使用叠加模式让火花更亮
      ctx.globalCompositeOperation = 'lighter';

      for (let i = sparks.current.length - 1; i >= 0; i--) {
        const spark = sparks.current[i];

        // 保存轨迹 - 主火花轨迹更长
        if (spark.type !== 'ember') {
          spark.trail.push({ x: spark.x, y: spark.y, life: spark.life });
          const maxTrailLength = spark.type === 'main' ? 25 : 18;
          if (spark.trail.length > maxTrailLength) {
            spark.trail.shift();
          }
        }

        // 物理更新
        spark.x += spark.vx;
        spark.y += spark.vy;

        // 重力 - 主火花受重力影响更大
        const gravity = spark.type === 'main' ? 0.6 : spark.type === 'secondary' ? 0.4 : 0.15;
        spark.vy += gravity;

        // 空气阻力
        spark.vx *= 0.99;
        spark.vy *= 0.99;

        // 生命衰减
        const decayRate = spark.type === 'main' ? 0.012 : spark.type === 'secondary' ? 0.015 : 0.008;
        spark.life -= decayRate;

        if (spark.life > 0) {
          // 绘制拖尾
          if (spark.trail.length > 1) {
            for (let j = 0; j < spark.trail.length - 1; j++) {
              const t1 = spark.trail[j];
              const t2 = spark.trail[j + 1];
              const trailLife = (j / spark.trail.length) * spark.life;
              const alpha = trailLife * 0.6;

              ctx.beginPath();
              ctx.moveTo(t1.x, t1.y);
              ctx.lineTo(t2.x, t2.y);
              ctx.strokeStyle = `rgba(${spark.color.r}, ${spark.color.g}, ${spark.color.b}, ${alpha})`;
              ctx.lineWidth = spark.size * trailLife * 0.8;
              ctx.stroke();
            }
          }

          // 绘制火花本体
          const alpha = spark.life;
          const currentSize = spark.size * (0.5 + spark.life * 0.5);

          // 外发光
          const gradient = ctx.createRadialGradient(
            spark.x,
            spark.y,
            0,
            spark.x,
            spark.y,
            currentSize * 3
          );
          gradient.addColorStop(0, `rgba(${spark.color.r}, ${spark.color.g}, ${spark.color.b}, ${alpha})`);
          gradient.addColorStop(0.3, `rgba(${spark.color.r}, ${spark.color.g}, ${spark.color.b}, ${alpha * 0.5})`);
          gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

          ctx.beginPath();
          ctx.arc(spark.x, spark.y, currentSize * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // 核心亮点
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fill();
        } else {
          sparks.current.splice(i, 1);
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 z-50 ${className || ''}`} />
  );
});

IronFlower.displayName = 'IronFlower';
