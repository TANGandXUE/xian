'use client';

import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ParticleBurstRef {
  burst: (x: number, y: number, color1?: string, color2?: string) => void;
}

interface BurstEvent {
  id: number;
  position: THREE.Vector3;
  color1: THREE.Color;
  color2: THREE.Color;
  startTime: number;
}

/**
 * Three.js 粒子爆发效果
 * 两个弦碰撞时产生的能量冲击波
 */
export const ParticleBurst = forwardRef<ParticleBurstRef, { className?: string }>(
  ({ className }, ref) => {
    const [bursts, setBursts] = useState<BurstEvent[]>([]);
    const burstIdRef = useRef(0);

    useImperativeHandle(ref, () => ({
      burst: (screenX: number, screenY: number, color1 = '#ffd700', color2 = '#ff6b00') => {
        // 将屏幕坐标转换为 Three.js 坐标
        const x = (screenX / window.innerWidth) * 2 - 1;
        const y = -(screenY / window.innerHeight) * 2 + 1;

        const newBurst: BurstEvent = {
          id: burstIdRef.current++,
          position: new THREE.Vector3(x * 5, y * 3, 0),
          color1: new THREE.Color(color1),
          color2: new THREE.Color(color2),
          startTime: Date.now(),
        };

        setBursts((prev) => [...prev, newBurst]);

        // 3秒后移除
        setTimeout(() => {
          setBursts((prev) => prev.filter((b) => b.id !== newBurst.id));
        }, 3000);
      },
    }));

    return (
      <div className={`fixed inset-0 pointer-events-none z-10 ${className || ''}`}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent', pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.5} />
          {bursts.map((burst) => (
            <ParticleSystem key={burst.id} burst={burst} />
          ))}
        </Canvas>
      </div>
    );
  }
);

ParticleBurst.displayName = 'ParticleBurst';

/**
 * 单个粒子系统
 */
function ParticleSystem({ burst }: { burst: BurstEvent }) {
  const pointsRef = useRef<THREE.Points>(null);
  const trailsRef = useRef<THREE.Points>(null);

  const PARTICLE_COUNT = 800;
  const TRAIL_COUNT = 200;

  // 主粒子
  const { positions, velocities, colors, sizes, lifetimes } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const lifetimes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // 初始位置在爆发点
      positions[i3] = burst.position.x;
      positions[i3 + 1] = burst.position.y;
      positions[i3 + 2] = burst.position.z;

      // 球形爆发速度
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.5 + Math.random() * 2;

      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 0.3; // 略微向上
      velocities[i3 + 2] = Math.cos(phi) * speed * 0.3;

      // 颜色混合
      const colorMix = Math.random();
      const color = new THREE.Color().lerpColors(burst.color1, burst.color2, colorMix);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // 大小
      sizes[i] = 0.02 + Math.random() * 0.06;

      // 生命周期
      lifetimes[i] = 0.5 + Math.random() * 0.5;
    }

    return { positions, velocities, colors, sizes, lifetimes };
  }, [burst]);

  // 拖尾粒子
  const trailData = useMemo(() => {
    const positions = new Float32Array(TRAIL_COUNT * 3);
    const velocities = new Float32Array(TRAIL_COUNT * 3);
    const colors = new Float32Array(TRAIL_COUNT * 3);
    const sizes = new Float32Array(TRAIL_COUNT);

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = burst.position.x;
      positions[i3 + 1] = burst.position.y;
      positions[i3 + 2] = burst.position.z;

      // 流星般的轨迹
      const angle = (i / TRAIL_COUNT) * Math.PI * 2;
      const speed = 1 + Math.random() * 1.5;
      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3 + 1] = Math.sin(angle) * speed * 0.6 + 0.5;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;

      // 白热色
      colors[i3] = 1;
      colors[i3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i3 + 2] = 0.7 + Math.random() * 0.3;

      sizes[i] = 0.03 + Math.random() * 0.04;
    }

    return { positions, velocities, colors, sizes };
  }, [burst]);

  useFrame(() => {
    if (!pointsRef.current || !trailsRef.current) return;

    const elapsed = (Date.now() - burst.startTime) / 1000;
    const geometry = pointsRef.current.geometry;
    const trailGeometry = trailsRef.current.geometry;

    // 更新主粒子
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const life = lifetimes[i];

      if (elapsed < life) {
        const progress = elapsed / life;

        // 位置更新 + 重力
        posAttr.array[i3] += velocities[i3] * 0.016;
        posAttr.array[i3 + 1] += velocities[i3 + 1] * 0.016 - 0.001 * elapsed;
        posAttr.array[i3 + 2] += velocities[i3 + 2] * 0.016;

        // 速度衰减
        velocities[i3] *= 0.99;
        velocities[i3 + 1] *= 0.99;
        velocities[i3 + 2] *= 0.99;

        // 大小和透明度衰减
        sizeAttr.array[i] = sizes[i] * (1 - progress * 0.5);

        // 颜色渐变到暗红
        const fade = 1 - progress;
        colorAttr.array[i3] = colors[i3] * fade + 0.3 * (1 - fade);
        colorAttr.array[i3 + 1] = colors[i3 + 1] * fade * 0.5;
        colorAttr.array[i3 + 2] = colors[i3 + 2] * fade * 0.3;
      } else {
        sizeAttr.array[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    // 更新拖尾粒子
    const trailPosAttr = trailGeometry.attributes.position as THREE.BufferAttribute;
    const trailColorAttr = trailGeometry.attributes.color as THREE.BufferAttribute;
    const trailSizeAttr = trailGeometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const i3 = i * 3;
      const life = 0.8 + (i / TRAIL_COUNT) * 0.4;

      if (elapsed < life) {
        const progress = elapsed / life;

        trailPosAttr.array[i3] += trailData.velocities[i3] * 0.012;
        trailPosAttr.array[i3 + 1] += trailData.velocities[i3 + 1] * 0.012 - 0.002 * elapsed;
        trailPosAttr.array[i3 + 2] += trailData.velocities[i3 + 2] * 0.012;

        trailData.velocities[i3] *= 0.98;
        trailData.velocities[i3 + 1] *= 0.98;

        const fade = 1 - progress;
        trailSizeAttr.array[i] = trailData.sizes[i] * fade;
        trailColorAttr.array[i3] = fade;
        trailColorAttr.array[i3 + 1] = fade * 0.8;
        trailColorAttr.array[i3 + 2] = fade * 0.5;
      } else {
        trailSizeAttr.array[i] = 0;
      }
    }

    trailPosAttr.needsUpdate = true;
    trailColorAttr.needsUpdate = true;
    trailSizeAttr.needsUpdate = true;
  });

  // 自定义着色器材质
  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return (
    <>
      <points ref={pointsRef} material={particleMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
      </points>
      <points ref={trailsRef} material={particleMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailData.colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[trailData.sizes, 1]} />
        </bufferGeometry>
      </points>
    </>
  );
}
