'use client';

import React, { useMemo, useRef, useEffect, memo } from 'react';
import { createNoise3D } from 'simplex-noise';
import { StringDimensions } from '@/entities/string-data/model';
import { getBaseColor } from '../color-mixer';

interface OrganicStringProps {
  dimensions: StringDimensions;
  size?: number;
  className?: string;
  id?: string;
}

export const OrganicString = memo(function OrganicString({
  dimensions,
  size = 300,
  className,
  id = 'default',
}: OrganicStringProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<number>(0);
  const noise3D = useMemo(() => createNoise3D(), []);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;

  // 预计算配置
  const config = useMemo(() => {
    const speed = 0.2 + dimensions.pleasure * 1.5;
    const glowSize = 4 + dimensions.empathy * 12;
    const amplitude = 8 + dimensions.pleasure * 12;

    const rC = radius * (0.6 + dimensions.cognition * 0.6);
    const rP = radius * (0.6 + dimensions.pleasure * 0.6);
    const rE = radius * (0.6 + dimensions.empathy * 0.6);

    return { speed, glowSize, amplitude, points: [rC, rP, rE] };
  }, [dimensions, radius]);

  const color = useMemo(() => getBaseColor(dimensions), [dimensions]);

  useEffect(() => {
    if (!pathRef.current) return;

    let startTime = performance.now();

    const animate = (timestamp: number) => {
      if (!pathRef.current) return;

      const elapsed = timestamp - startTime;
      const time = elapsed * 0.001 * config.speed;
      const steps = 48; // 减少点数提升性能
      const pts: { x: number; y: number }[] = [];

      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * Math.PI * 2 - Math.PI / 2;

        const deg = (theta * 180) / Math.PI;
        let effectiveAngle = deg + 90;
        if (effectiveAngle < 0) effectiveAngle += 360;
        effectiveAngle = effectiveAngle % 360;

        let targetR = radius;
        if (effectiveAngle >= 0 && effectiveAngle < 120) {
          const tSection = effectiveAngle / 120;
          const tSmooth = tSection * tSection * (3 - 2 * tSection);
          targetR = config.points[0] * (1 - tSmooth) + config.points[1] * tSmooth;
        } else if (effectiveAngle >= 120 && effectiveAngle < 240) {
          const tSection = (effectiveAngle - 120) / 120;
          const tSmooth = tSection * tSection * (3 - 2 * tSection);
          targetR = config.points[1] * (1 - tSmooth) + config.points[2] * tSmooth;
        } else {
          const tSection = (effectiveAngle - 240) / 120;
          const tSmooth = tSection * tSection * (3 - 2 * tSection);
          targetR = config.points[2] * (1 - tSmooth) + config.points[0] * tSmooth;
        }

        const noiseScale = 0.8;
        const noiseVal = noise3D(Math.cos(theta) * noiseScale, Math.sin(theta) * noiseScale, time);

        const breathing = Math.sin(time) * 4;
        const rFinal = targetR + noiseVal * config.amplitude + breathing;

        const x = cx + Math.cos(theta) * rFinal;
        const y = cy + Math.sin(theta) * rFinal;

        pts.push({ x, y });
      }

      // 生成路径
      let d = '';
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i];
        const p1 = pts[(i + 1) % pts.length];
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;

        if (i === 0) d += `M ${mx} ${my}`;
        else {
          const prev = pts[i];
          d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
        }
      }
      const last = pts[0];
      const firstMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      d += ` Q ${last.x} ${last.y} ${firstMid.x} ${firstMid.y}`;

      pathRef.current.setAttribute('d', d);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cx, cy, radius, config, noise3D]);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={config.glowSize} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          ref={pathRef}
          fill={color}
          fillOpacity={0.15}
          stroke={color}
          strokeWidth={2}
          filter={`url(#glow-${id})`}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
});
