'use client';

import React, { useEffect, useRef, memo, useMemo } from 'react';
import { StringDimensions } from '@/entities/string-data/model';
import { getBaseColor } from '../color-mixer';

interface MysticalStringProps {
  dimensions: StringDimensions;
  size?: number;
  className?: string;
  id?: string;
  isGrabbed?: boolean;
  isColliding?: boolean;
}

/**
 * 玄幻风格三角形弦
 * 特点：符文边缘、能量粒子流动、内部神秘图案、空灵光晕
 */
export const MysticalString = memo(function MysticalString({
  dimensions,
  size = 200,
  className,
  id = 'default',
  isGrabbed = false,
  isColliding = false,
}: MysticalStringProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<EdgeParticle[]>([]);

  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = size * 0.38;

  // 计算三个顶点
  const vertices = useMemo(() => {
    const angles = [
      -Math.PI / 2,      // 顶部
      Math.PI / 6,       // 右下
      (5 * Math.PI) / 6, // 左下
    ];
    const radii = [
      baseRadius * (0.7 + dimensions.cognition * 0.4),
      baseRadius * (0.7 + dimensions.pleasure * 0.4),
      baseRadius * (0.7 + dimensions.empathy * 0.4),
    ];
    return angles.map((angle, i) => ({
      x: cx + Math.cos(angle) * radii[i],
      y: cy + Math.sin(angle) * radii[i],
      radius: radii[i],
    }));
  }, [dimensions, baseRadius, cx, cy]);

  const color = useMemo(() => getBaseColor(dimensions), [dimensions]);

  const colorRgb = useMemo(() => {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 100, g: 150, b: 255 };
  }, [color]);

  // 初始化边缘粒子
  useEffect(() => {
    particlesRef.current = [];
    for (let i = 0; i < 60; i++) {
      particlesRef.current.push({
        edge: Math.floor(Math.random() * 3),
        t: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
        size: 1 + Math.random() * 2,
        brightness: 0.5 + Math.random() * 0.5,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size * 2; // 高分辨率
    canvas.height = size * 2;
    ctx.scale(2, 2);

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, size, size);

      const breathScale = 1 + Math.sin(time * 1.2) * 0.02;
      const rotationOffset = time * 0.1;

      // 计算当前顶点位置
      const currentVertices = vertices.map((v, i) => {
        const angle = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6][i] + Math.sin(time * 0.5 + i) * 0.02;
        const r = v.radius * breathScale;
        return {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        };
      });

      // ========== 外层光晕 ==========
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 多层光晕
      for (let layer = 4; layer >= 0; layer--) {
        const glowRadius = baseRadius * (1.2 + layer * 0.15);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        const alpha = 0.08 - layer * 0.015;
        gradient.addColorStop(0, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${alpha})`);
        gradient.addColorStop(0.6, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ========== 内部神秘图案 ==========
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 内部旋转符文圈
      const runeRadius = baseRadius * 0.5;
      ctx.strokeStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < 3; i++) {
        const r = runeRadius * (0.4 + i * 0.25);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // 符文标记
        const runeCount = 6 + i * 2;
        for (let j = 0; j < runeCount; j++) {
          const angle = (j / runeCount) * Math.PI * 2 + rotationOffset * (i % 2 === 0 ? 1 : -1);
          const rx = cx + Math.cos(angle) * r;
          const ry = cy + Math.sin(angle) * r;

          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 2 + j) * 0.2})`;
          ctx.beginPath();
          ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 内部三角形
      ctx.strokeStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.2)`;
      ctx.lineWidth = 0.5;
      const innerScale = 0.4;
      ctx.beginPath();
      ctx.moveTo(cx + (currentVertices[0].x - cx) * innerScale, cy + (currentVertices[0].y - cy) * innerScale);
      for (let i = 1; i <= 3; i++) {
        const v = currentVertices[i % 3];
        ctx.lineTo(cx + (v.x - cx) * innerScale, cy + (v.y - cy) * innerScale);
      }
      ctx.stroke();

      ctx.restore();

      // ========== 主三角形 ==========
      ctx.save();

      // 绘制三角形路径（用于裁剪和描边）
      const drawTrianglePath = () => {
        ctx.beginPath();
        ctx.moveTo(currentVertices[0].x, currentVertices[0].y);
        for (let i = 0; i < 3; i++) {
          const curr = currentVertices[i];
          const next = currentVertices[(i + 1) % 3];
          // 贝塞尔曲线创建圆滑边缘
          const cpX = (curr.x + next.x) / 2;
          const cpY = (curr.y + next.y) / 2;
          ctx.quadraticCurveTo(
            curr.x + (cpX - curr.x) * 0.1,
            curr.y + (cpY - curr.y) * 0.1,
            cpX,
            cpY
          );
        }
        ctx.closePath();
      };

      // 内部渐变填充
      drawTrianglePath();
      const fillGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
      fillGradient.addColorStop(0, `rgba(${colorRgb.r + 30}, ${colorRgb.g + 30}, ${colorRgb.b + 30}, 0.15)`);
      fillGradient.addColorStop(0.5, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.08)`);
      fillGradient.addColorStop(1, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.03)`);
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // 边缘发光描边（多层）
      for (let i = 3; i >= 0; i--) {
        drawTrianglePath();
        ctx.strokeStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${0.3 - i * 0.06})`;
        ctx.lineWidth = 3 + i * 2;
        ctx.shadowColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.5)`;
        ctx.shadowBlur = 10 + i * 5;
        ctx.stroke();
      }

      // 核心描边
      drawTrianglePath();
      ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();

      // ========== 顶点能量核心 ==========
      for (let i = 0; i < 3; i++) {
        const v = currentVertices[i];
        const pulse = Math.sin(time * 2.5 + i * 2.1) * 0.4 + 0.6;

        // 外部光晕
        const glowGradient = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 20);
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * pulse})`);
        glowGradient.addColorStop(0.3, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${0.5 * pulse})`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // 核心点
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();

        // 符文环绕
        const orbitRadius = 12;
        for (let j = 0; j < 3; j++) {
          const orbitAngle = time * 1.5 + (j / 3) * Math.PI * 2 + i * 1.2;
          const ox = v.x + Math.cos(orbitAngle) * orbitRadius;
          const oy = v.y + Math.sin(orbitAngle) * orbitRadius;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time * 3 + j) * 0.2})`;
          ctx.beginPath();
          ctx.arc(ox, oy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ========== 边缘流动粒子 ==========
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const particle of particlesRef.current) {
        particle.t += particle.speed;
        if (particle.t > 1) particle.t = 0;

        const start = currentVertices[particle.edge];
        const end = currentVertices[(particle.edge + 1) % 3];
        const px = start.x + (end.x - start.x) * particle.t;
        const py = start.y + (end.y - start.y) * particle.t;

        const gradient = ctx.createRadialGradient(px, py, 0, px, py, particle.size * 3);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.brightness})`);
        gradient.addColorStop(0.5, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${particle.brightness * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // ========== 中心能量核心 ==========
      const coreSize = 8 + Math.sin(time * 2) * 2;
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 4);
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGradient.addColorStop(0.2, `rgba(${colorRgb.r + 50}, ${colorRgb.g + 50}, ${colorRgb.b + 50}, 0.6)`);
      coreGradient.addColorStop(0.5, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.3)`);
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // ========== 抓取状态 ==========
      if (isGrabbed) {
        ctx.globalCompositeOperation = 'lighter';
        const grabGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
        grabGradient.addColorStop(0, `rgba(255, 255, 255, 0.15)`);
        grabGradient.addColorStop(0.5, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.1)`);
        grabGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grabGradient;
        ctx.fillRect(0, 0, size, size);
      }

      // ========== 碰撞状态 ==========
      if (isColliding) {
        ctx.globalCompositeOperation = 'lighter';
        const collisionPulse = Math.sin(time * 8) * 0.5 + 0.5;
        const collisionGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.6);
        collisionGradient.addColorStop(0, `rgba(255, 200, 100, ${0.3 * collisionPulse})`);
        collisionGradient.addColorStop(0.5, `rgba(255, 150, 50, ${0.15 * collisionPulse})`);
        collisionGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = collisionGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [cx, cy, baseRadius, vertices, colorRgb, size, isGrabbed, isColliding]);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        className="w-full h-full"
        style={{ width: size, height: size }}
      />
    </div>
  );
});

interface EdgeParticle {
  edge: number;
  t: number;
  speed: number;
  size: number;
  brightness: number;
}
