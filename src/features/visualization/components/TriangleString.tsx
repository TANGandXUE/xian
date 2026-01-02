'use client';

import React, { useMemo, useRef, useEffect, memo } from 'react';
import { StringDimensions } from '@/entities/string-data/model';
import { getBaseColor } from '../color-mixer';

interface TriangleStringProps {
  dimensions: StringDimensions;
  size?: number;
  className?: string;
  id?: string;
  isGrabbed?: boolean;
  isColliding?: boolean;
}

/**
 * 三角形弦组件 - 大尺寸 + 高级特效版本
 * 三个顶点代表：求知(顶部)、愉悦(右下)、共情(左下)
 */
export const TriangleString = memo(function TriangleString({
  dimensions,
  size = 240,
  className,
  id = 'default',
  isGrabbed = false,
  isColliding = false,
}: TriangleStringProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = size * 0.38;

  const config = useMemo(() => {
    const angles = [
      -Math.PI / 2,      // 顶部 - 求知
      Math.PI / 6,       // 右下 - 愉悦
      (5 * Math.PI) / 6, // 左下 - 共情
    ];

    const radii = [
      baseRadius * (0.6 + dimensions.cognition * 0.5),
      baseRadius * (0.6 + dimensions.pleasure * 0.5),
      baseRadius * (0.6 + dimensions.empathy * 0.5),
    ];

    return { angles, radii };
  }, [dimensions, baseRadius]);

  const color = useMemo(() => getBaseColor(dimensions), [dimensions]);

  // 解析颜色为 RGB
  const colorRgb = useMemo(() => {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 100, g: 150, b: 255 };
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, size, size);

      const breathScale = 1 + Math.sin(time * 1.5) * 0.03;
      const rotationOffset = Math.sin(time * 0.5) * 0.02;

      // 计算三个顶点
      const vertices = config.angles.map((angle, i) => {
        const r = config.radii[i] * breathScale;
        const a = angle + rotationOffset;
        return {
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
        };
      });

      // 绘制外发光层（多层叠加）
      for (let layer = 3; layer >= 0; layer--) {
        const layerScale = 1 + layer * 0.15;
        const layerOpacity = 0.1 - layer * 0.02;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(layerScale, layerScale);
        ctx.translate(-cx, -cy);

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);

        // 使用贝塞尔曲线创建圆滑三角形
        for (let i = 0; i < 3; i++) {
          const curr = vertices[i];
          const next = vertices[(i + 1) % 3];
          const midX = (curr.x + next.x) / 2;
          const midY = (curr.y + next.y) / 2;
          ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        }
        ctx.closePath();

        ctx.shadowColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.8)`;
        ctx.shadowBlur = 30 + layer * 15;
        ctx.fillStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${layerOpacity})`;
        ctx.fill();
        ctx.restore();
      }

      // 绘制能量流动效果
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 内部能量流
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
      gradient.addColorStop(0, `rgba(${colorRgb.r + 50}, ${colorRgb.g + 50}, ${colorRgb.b + 50}, 0.3)`);
      gradient.addColorStop(0.5, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 0; i < 3; i++) {
        const curr = vertices[i];
        const next = vertices[(i + 1) % 3];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      // 绘制主三角形边框
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 0; i < 3; i++) {
        const curr = vertices[i];
        const next = vertices[(i + 1) % 3];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
      ctx.closePath();

      // 渐变填充
      const fillGradient = ctx.createLinearGradient(
        vertices[0].x, vertices[0].y,
        (vertices[1].x + vertices[2].x) / 2, (vertices[1].y + vertices[2].y) / 2
      );
      fillGradient.addColorStop(0, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.25)`);
      fillGradient.addColorStop(1, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.1)`);
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // 边框
      ctx.strokeStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.8)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制三个顶点能量球
      for (let i = 0; i < 3; i++) {
        const v = vertices[i];
        const pulse = Math.sin(time * 2 + i * 2) * 0.3 + 0.7;
        const ballRadius = 6 + pulse * 4;

        // 能量球光晕
        const ballGlow = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, ballRadius * 3);
        ballGlow.addColorStop(0, `rgba(255, 255, 255, ${0.8 * pulse})`);
        ballGlow.addColorStop(0.3, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${0.5 * pulse})`);
        ballGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = ballGlow;
        ctx.beginPath();
        ctx.arc(v.x, v.y, ballRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // 能量球核心
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
        ctx.beginPath();
        ctx.arc(v.x, v.y, ballRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 绘制中心能量核心
      const coreRadius = 8 + Math.sin(time * 3) * 2;
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 4);
      coreGlow.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
      coreGlow.addColorStop(0.2, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.6)`);
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // 能量连接线（从中心到顶点）
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const v = vertices[i];
        const lineGradient = ctx.createLinearGradient(cx, cy, v.x, v.y);
        const lineOpacity = 0.1 + Math.sin(time * 2 + i) * 0.05;
        lineGradient.addColorStop(0, `rgba(255, 255, 255, ${lineOpacity})`);
        lineGradient.addColorStop(1, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${lineOpacity * 0.5})`);

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(v.x, v.y);
        ctx.stroke();
      }

      // 抓取状态额外效果
      if (isGrabbed) {
        ctx.globalCompositeOperation = 'lighter';
        const grabGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
        grabGlow.addColorStop(0, `rgba(255, 255, 255, 0.1)`);
        grabGlow.addColorStop(0.5, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.05)`);
        grabGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grabGlow;
        ctx.fillRect(0, 0, size, size);
      }

      // 碰撞状态脉冲效果
      if (isColliding) {
        const pulseSize = size * 0.6 + Math.sin(time * 8) * 20;
        ctx.globalCompositeOperation = 'lighter';
        const collisionGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseSize);
        collisionGlow.addColorStop(0, `rgba(255, 200, 100, 0.3)`);
        collisionGlow.addColorStop(0.5, `rgba(255, 150, 50, 0.1)`);
        collisionGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = collisionGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [cx, cy, baseRadius, config, colorRgb, size, isGrabbed, isColliding]);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="w-full h-full" />
    </div>
  );
});
