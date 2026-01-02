'use client';

import React, { useEffect, useRef, memo } from 'react';

/**
 * 极致沉浸太空背景
 * 包含：星云流动、星系旋转、流星、闪烁恒星、粒子效果
 */
export const SpaceBackground = memo(function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    // 生成恒星
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // 星云粒子
    const nebulaParticles: NebulaParticle[] = [];
    for (let i = 0; i < 80; i++) {
      nebulaParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 100 + Math.random() * 200,
        color: i % 3 === 0 ? 'purple' : i % 3 === 1 ? 'blue' : 'pink',
        opacity: 0.02 + Math.random() * 0.04,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.1,
      });
    }

    // 流星
    const meteors: Meteor[] = [];
    const spawnMeteor = () => {
      if (meteors.length < 3 && Math.random() < 0.005) {
        meteors.push({
          x: Math.random() * width,
          y: -50,
          speed: 8 + Math.random() * 12,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
          length: 80 + Math.random() * 120,
          life: 1,
        });
      }
    };

    // 星系
    const galaxy = {
      x: width * 0.7,
      y: height * 0.3,
      rotation: 0,
      arms: 3,
      size: 150,
    };

    let time = 0;

    const render = () => {
      time += 0.016;

      // 清除画布
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, width, height);

      // 深空渐变
      const spaceGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height)
      );
      spaceGradient.addColorStop(0, '#0a0a1f');
      spaceGradient.addColorStop(0.5, '#050510');
      spaceGradient.addColorStop(1, '#020206');
      ctx.fillStyle = spaceGradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制星云
      ctx.globalCompositeOperation = 'screen';
      for (const nebula of nebulaParticles) {
        nebula.x += nebula.vx;
        nebula.y += nebula.vy;

        // 边界循环
        if (nebula.x < -nebula.size) nebula.x = width + nebula.size;
        if (nebula.x > width + nebula.size) nebula.x = -nebula.size;
        if (nebula.y < -nebula.size) nebula.y = height + nebula.size;
        if (nebula.y > height + nebula.size) nebula.y = -nebula.size;

        const gradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.size
        );

        const colors = {
          purple: ['rgba(100, 50, 150,', 'rgba(60, 20, 100,'],
          blue: ['rgba(30, 80, 150,', 'rgba(15, 40, 100,'],
          pink: ['rgba(150, 50, 100,', 'rgba(100, 20, 60,'],
        };

        const c = colors[nebula.color];
        const pulse = Math.sin(time * 0.5 + nebula.x * 0.01) * 0.3 + 0.7;
        gradient.addColorStop(0, c[0] + (nebula.opacity * pulse) + ')');
        gradient.addColorStop(0.5, c[1] + (nebula.opacity * 0.5 * pulse) + ')');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(nebula.x - nebula.size, nebula.y - nebula.size, nebula.size * 2, nebula.size * 2);
      }

      // 绘制星系
      ctx.globalCompositeOperation = 'lighter';
      galaxy.rotation += 0.001;
      drawGalaxy(ctx, galaxy, time);

      // 绘制恒星
      ctx.globalCompositeOperation = 'lighter';
      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase) * 0.5 + 0.5;
        const brightness = star.brightness * twinkle;

        // 恒星光晕
        const glowGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 4
        );
        glowGradient.addColorStop(0, `rgba(200, 220, 255, ${brightness})`);
        glowGradient.addColorStop(0.3, `rgba(150, 180, 255, ${brightness * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // 恒星核心
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 生成和绘制流星
      spawnMeteor();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];

        meteor.x += Math.cos(meteor.angle) * meteor.speed;
        meteor.y += Math.sin(meteor.angle) * meteor.speed;
        meteor.life -= 0.01;

        if (meteor.life <= 0 || meteor.y > height + 100) {
          meteors.splice(i, 1);
          continue;
        }

        // 流星尾迹
        const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
        const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;

        const meteorGradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        meteorGradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.life})`);
        meteorGradient.addColorStop(0.3, `rgba(200, 220, 255, ${meteor.life * 0.5})`);
        meteorGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

        ctx.strokeStyle = meteorGradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // 流星头部光晕
        const headGlow = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, 10);
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${meteor.life})`);
        headGlow.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
});

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface NebulaParticle {
  x: number;
  y: number;
  size: number;
  color: 'purple' | 'blue' | 'pink';
  opacity: number;
  vx: number;
  vy: number;
}

interface Meteor {
  x: number;
  y: number;
  speed: number;
  angle: number;
  length: number;
  life: number;
}

function drawGalaxy(ctx: CanvasRenderingContext2D, galaxy: { x: number; y: number; rotation: number; arms: number; size: number }, time: number) {
  const { x, y, rotation, arms, size } = galaxy;

  for (let arm = 0; arm < arms; arm++) {
    const armAngle = (arm / arms) * Math.PI * 2 + rotation;

    for (let i = 0; i < 60; i++) {
      const distance = (i / 60) * size;
      const spiralAngle = armAngle + distance * 0.03;
      const spread = (Math.random() - 0.5) * 20;

      const px = x + Math.cos(spiralAngle) * distance + spread;
      const py = y + Math.sin(spiralAngle) * distance * 0.4 + spread * 0.4;

      const brightness = (1 - i / 60) * 0.5;
      const starSize = 1 + Math.random() * 1.5;

      ctx.fillStyle = `rgba(200, 180, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(px, py, starSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 星系核心
  const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
  coreGradient.addColorStop(0, 'rgba(255, 250, 240, 0.4)');
  coreGradient.addColorStop(0.5, 'rgba(200, 180, 255, 0.2)');
  coreGradient.addColorStop(1, 'rgba(150, 100, 200, 0)');
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
}
