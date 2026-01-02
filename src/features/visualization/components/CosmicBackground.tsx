'use client';

import React, { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Three.js 宇宙背景
 * 真实感太空：星空、星云、深空效果
 */
export const CosmicBackground = memo(function CosmicBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000005', pointerEvents: 'none' }}
      >
        {/* 多层星空 */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        <Stars radius={50} depth={30} count={1000} factor={2} saturation={0.5} fade speed={0.3} />

        {/* 星云层 */}
        <NebulaField />

        {/* 深空尘埃 */}
        <CosmicDust />

        {/* 远处星系 */}
        <DistantGalaxy position={[3, 1.5, -8]} color="#8b5cf6" />
        <DistantGalaxy position={[-4, -1, -10]} color="#3b82f6" scale={0.6} />
      </Canvas>

      {/* 叠加渐变层 */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
    </div>
  );
});

/**
 * 星云场
 */
function NebulaField() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#1a0533') },
        uColor2: { value: new THREE.Color('#0a1628') },
        uColor3: { value: new THREE.Color('#0f0a1a') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;

        // 简化的噪声函数
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec2 uv = vUv;
          float t = uTime * 0.02;

          // 多层星云
          float n1 = fbm(uv * 3.0 + t * 0.5);
          float n2 = fbm(uv * 5.0 - t * 0.3);
          float n3 = fbm(uv * 8.0 + vec2(t * 0.2, -t * 0.1));

          // 颜色混合
          vec3 color = mix(uColor1, uColor2, n1);
          color = mix(color, uColor3, n2 * 0.5);

          // 亮点
          float stars = pow(n3, 8.0) * 0.5;
          color += vec3(stars);

          // 整体透明度
          float alpha = (n1 * 0.3 + n2 * 0.2) * 0.8;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[20, 12]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * 宇宙尘埃粒子
 */
function CosmicDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 500;

  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = Math.random() * -10 - 2;

      sizes[i] = Math.random() * 0.02 + 0.005;

      // 淡蓝色/紫色色调
      const hue = 0.6 + Math.random() * 0.2;
      const color = new THREE.Color().setHSL(hue, 0.5, 0.6);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, sizes, colors };
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float uTime;
          void main() {
            vColor = color;
            vec3 pos = position;
            pos.y += sin(uTime * 0.5 + position.x * 2.0) * 0.05;
            pos.x += cos(uTime * 0.3 + position.y * 2.0) * 0.03;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
            gl_FragColor = vec4(vColor, alpha * 0.6);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
    </points>
  );
}

/**
 * 远处的星系
 */
function DistantGalaxy({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const STAR_COUNT = 200;

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      // 螺旋星系形状
      const arm = Math.floor(Math.random() * 2);
      const distance = Math.random() * 0.8;
      const angle = distance * Math.PI * 4 + arm * Math.PI;
      const spread = 0.1 * (1 - distance);

      positions[i3] = Math.cos(angle) * distance + (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread * 0.3;
      positions[i3 + 2] = Math.sin(angle) * distance * 0.4 + (Math.random() - 0.5) * spread;

      sizes[i] = (1 - distance) * 0.03 + 0.01;
    }

    return { positions, sizes };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* 星系核心 */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
