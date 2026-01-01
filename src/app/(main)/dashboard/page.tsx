'use client';

import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { MysticalString } from '@/features/visualization/components/MysticalString';
import { ParticleBurst, ParticleBurstRef } from '@/features/visualization/components/ParticleBurst';
import { VSBattle } from '@/features/visualization/components/VSBattle';
import { MatchResult } from '@/features/visualization/components/MatchResult';
import { CollisionPanel } from '@/features/match/components/collision-panel';
import { useUsers } from '@/entities/user/hooks';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '@/features/visualization/color-mixer';
import { generatePersonaDescription, calculateSimilarity } from '@/features/visualization/lib/dimension-calculator';
import { useHandGesture } from '@/hooks/useHandGesture';

// 动态导入 Three.js 组件避免 SSR 问题
const CosmicBackground = dynamic(
  () => import('@/features/visualization/components/CosmicBackground').then((mod) => mod.CosmicBackground),
  { ssr: false }
);

type CollisionPhase = 'idle' | 'particles' | 'vsBattle' | 'matchResult' | 'details';

interface CollisionState {
  phase: CollisionPhase;
  user1: ProcessedUser | null;
  user2: ProcessedUser | null;
}

// 生成随机位置（确保间距足够）
function generateRandomPositions(count: number, width: number, height: number, margin: number = 120) {
  const positions: { x: number; y: number }[] = [];
  const minDistance = 200; // 最小间距
  const maxAttempts = 100;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let position: { x: number; y: number } | null = null;

    while (attempts < maxAttempts) {
      const x = margin + Math.random() * (width - margin * 2);
      const y = margin + Math.random() * (height - margin * 2);

      // 检查与已有位置的距离
      let valid = true;
      for (const existing of positions) {
        const dist = Math.sqrt(Math.pow(x - existing.x, 2) + Math.pow(y - existing.y, 2));
        if (dist < minDistance) {
          valid = false;
          break;
        }
      }

      if (valid) {
        position = { x, y };
        break;
      }
      attempts++;
    }

    // 如果找不到合适位置，使用网格布局作为后备
    if (!position) {
      const cols = Math.ceil(Math.sqrt(count));
      const col = i % cols;
      const row = Math.floor(i / cols);
      position = {
        x: margin + (col + 0.5) * ((width - margin * 2) / cols),
        y: margin + (row + 0.5) * ((height - margin * 2) / Math.ceil(count / cols)),
      };
    }

    positions.push(position);
  }

  return positions;
}

export default function DashboardPage() {
  const { users, loading, error } = useUsers();
  const particleBurstRef = useRef<ParticleBurstRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [collisionState, setCollisionState] = useState<CollisionState>({
    phase: 'idle',
    user1: null,
    user2: null,
  });

  // 弦的位置状态
  const [stringPositions, setStringPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [grabbedStringId, setGrabbedStringId] = useState<string | null>(null);
  const [collidingWith, setCollidingWith] = useState<ProcessedUser | null>(null);

  // 初始化随机位置
  useEffect(() => {
    if (users.length > 0 && Object.keys(stringPositions).length === 0) {
      const width = window.innerWidth;
      const headerHeight = 120; // 头部区域高度
      const height = window.innerHeight - headerHeight;
      const positions = generateRandomPositions(users.length, width, height, 100);

      const posMap: Record<string, { x: number; y: number }> = {};
      users.forEach((user, i) => {
        // 加上 header 高度偏移，使用视口坐标
        posMap[user.id] = {
          x: positions[i].x,
          y: positions[i].y + headerHeight,
        };
      });
      setStringPositions(posMap);
    }
  }, [users, stringPositions]);

  // 检测碰撞
  const checkCollision = useCallback(
    (x: number, y: number, excludeId: string): ProcessedUser | null => {
      const COLLISION_RADIUS = 90;

      for (const user of users) {
        if (user.id === excludeId) continue;
        const pos = stringPositions[user.id];
        if (!pos) continue;

        const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        if (dist < COLLISION_RADIUS * 2) {
          return user;
        }
      }
      return null;
    },
    [users, stringPositions]
  );

  // 手势识别回调
  const handleGrab = useCallback(
    (x: number, y: number) => {
      if (collisionState.phase !== 'idle') return;

      // 找到最近的弦
      let nearestId: string | null = null;
      let nearestDist = Infinity;

      for (const [id, pos] of Object.entries(stringPositions)) {
        const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        if (dist < 120 && dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
        }
      }

      if (nearestId) {
        setGrabbedStringId(nearestId);
        if (navigator.vibrate) navigator.vibrate(20);
      }
    },
    [collisionState.phase, stringPositions]
  );

  const handleMove = useCallback(
    (x: number, y: number) => {
      if (!grabbedStringId || collisionState.phase !== 'idle') return;

      // 更新被抓取弦的位置
      setStringPositions((prev) => ({
        ...prev,
        [grabbedStringId]: { x, y },
      }));

      // 检测碰撞
      const colliding = checkCollision(x, y, grabbedStringId);
      if (colliding !== collidingWith) {
        setCollidingWith(colliding);
        if (colliding && navigator.vibrate) {
          navigator.vibrate([15, 30, 15]);
        }
      }
    },
    [grabbedStringId, collisionState.phase, checkCollision, collidingWith]
  );

  const handleRelease = useCallback(
    (x: number, y: number) => {
      if (!grabbedStringId) return;

      // 如果正在碰撞，触发碰撞事件
      if (collidingWith) {
        const user1 = users.find((u) => u.id === grabbedStringId);
        if (user1) {
          const color1 = getBaseColor(user1.dimensions);
          const color2 = getBaseColor(collidingWith.dimensions);

          setCollisionState({
            phase: 'particles',
            user1,
            user2: collidingWith,
          });

          particleBurstRef.current?.burst(x, y, color1, color2);

          if (navigator.vibrate) {
            navigator.vibrate([50, 30, 100, 30, 50]);
          }

          setTimeout(() => {
            setCollisionState((prev) => ({ ...prev, phase: 'vsBattle' }));
          }, 1200);
        }
      }

      setGrabbedStringId(null);
      setCollidingWith(null);
    },
    [grabbedStringId, collidingWith, users]
  );

  // 手势识别
  const { isEnabled, isLoading, enable, disable, handState } = useHandGesture({
    onGrab: handleGrab,
    onMove: handleMove,
    onRelease: handleRelease,
  });

  // 鼠标/触摸拖拽处理
  const handlePointerDown = useCallback(
    (userId: string, e: React.PointerEvent) => {
      if (collisionState.phase !== 'idle' || isEnabled) return;
      e.preventDefault();
      setGrabbedStringId(userId);
      if (navigator.vibrate) navigator.vibrate(10);
    },
    [collisionState.phase, isEnabled]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!grabbedStringId || collisionState.phase !== 'idle' || isEnabled) return;

      const x = e.clientX;
      const y = e.clientY;

      setStringPositions((prev) => ({
        ...prev,
        [grabbedStringId]: { x, y },
      }));

      const colliding = checkCollision(x, y, grabbedStringId);
      if (colliding !== collidingWith) {
        setCollidingWith(colliding);
        if (colliding && navigator.vibrate) {
          navigator.vibrate([15, 30, 15]);
        }
      }
    },
    [grabbedStringId, collisionState.phase, isEnabled, checkCollision, collidingWith]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isEnabled) return;
      handleRelease(e.clientX, e.clientY);
    },
    [isEnabled, handleRelease]
  );

  // 计算匹配度
  const matchPercentage = useMemo(() => {
    if (!collisionState.user1 || !collisionState.user2) return 0;
    return Math.round(
      calculateSimilarity(collisionState.user1.dimensions, collisionState.user2.dimensions) * 100
    );
  }, [collisionState.user1, collisionState.user2]);

  const handleVSComplete = useCallback(() => {
    setCollisionState((prev) => ({ ...prev, phase: 'matchResult' }));
  }, []);

  const handleViewDetails = useCallback(() => {
    setCollisionState((prev) => ({ ...prev, phase: 'details' }));
  }, []);

  const handleClosePanel = useCallback(() => {
    setCollisionState({ phase: 'idle', user1: null, user2: null });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-t-violet-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white/40 text-sm tracking-[0.3em] uppercase">进入宇宙</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center text-red-400 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg mb-2">宇宙出现了裂缝</p>
          <p className="text-sm text-white/40">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white relative overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Three.js 宇宙背景 */}
      <CosmicBackground />

      {/* Three.js 粒子爆发效果层 */}
      <ParticleBurst ref={particleBurstRef} />

      {/* 手势十字准心指示器 */}
      <AnimatePresence>
        {isEnabled && handState.position && (() => {
          // 如果抓住了弦，准心锁定在弦的中心
          const cursorPos = grabbedStringId && stringPositions[grabbedStringId]
            ? stringPositions[grabbedStringId]
            : handState.position;

          return (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed pointer-events-none z-[999]"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* 十字准心 */}
              <div className="relative">
                {/* 水平线 */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[3px] transition-all duration-100 ${
                    grabbedStringId ? 'w-[24px] bg-red-500' : 'w-[40px] bg-cyan-400'
                  }`}
                  style={{
                    boxShadow: grabbedStringId
                      ? '0 0 12px rgba(239, 68, 68, 0.8)'
                      : '0 0 10px rgba(34, 211, 238, 0.6)',
                  }}
                />
                {/* 垂直线 */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] transition-all duration-100 ${
                    grabbedStringId ? 'h-[24px] bg-red-500' : 'h-[40px] bg-cyan-400'
                  }`}
                  style={{
                    boxShadow: grabbedStringId
                      ? '0 0 12px rgba(239, 68, 68, 0.8)'
                      : '0 0 10px rgba(34, 211, 238, 0.6)',
                  }}
                />
                {/* 中心点 */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-100 ${
                    grabbedStringId ? 'w-2 h-2 bg-red-400' : 'w-1.5 h-1.5 bg-cyan-300'
                  }`}
                />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 头部 */}
      <header className="relative z-20 p-4 md:p-6 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/5 pointer-events-auto">
        <div className="flex items-center gap-3 md:gap-4">
          <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400">
            闲 · Universe
          </h1>
          <span className="hidden md:inline-block px-3 py-1 text-[10px] rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400/60 uppercase tracking-widest">
            弦理论
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* 手势识别开关 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isLoading) {
                if (isEnabled) {
                  disable();
                } else {
                  enable();
                }
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all pointer-events-auto
              ${isEnabled
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }
              ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
            `}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                加载中...
              </>
            ) : isEnabled ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                手势识别中
              </>
            ) : (
              <>
                <span className="text-base">✋</span>
                启用手势
              </>
            )}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400">{users.length} 弦在共振</span>
          </div>
        </div>
      </header>

      {/* 游戏提示 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 text-center py-3"
      >
        <p className="text-white/25 text-sm">
          {isEnabled ? '握拳抓取弦体 · 移动碰撞 · 张开释放' : '拖拽弦体 · 碰撞产生共鸣'}
        </p>
      </motion.div>

      {/* 主游戏区 - 随机布局 */}
      <main className="relative z-10 w-full h-[calc(100vh-120px)]">
        {users.map((user) => {
          const pos = stringPositions[user.id];
          if (!pos) return null;

          const isGrabbed = grabbedStringId === user.id;
          const isColliding = collidingWith?.id === user.id || (isGrabbed && collidingWith !== null);

          return (
            <StringNode
              key={user.id}
              user={user}
              position={pos}
              isGrabbed={isGrabbed}
              isColliding={isColliding}
              isDisabled={collisionState.phase !== 'idle'}
              useGesture={isEnabled}
              onPointerDown={(e) => handlePointerDown(user.id, e)}
            />
          );
        })}
      </main>

      {/* VS 对决动画 */}
      {collisionState.user1 && collisionState.user2 && (
        <VSBattle
          user1={collisionState.user1}
          user2={collisionState.user2}
          isActive={collisionState.phase === 'vsBattle'}
          onComplete={handleVSComplete}
        />
      )}

      {/* 匹配结果动画 */}
      {collisionState.user1 && collisionState.user2 && (
        <MatchResult
          user1={collisionState.user1}
          user2={collisionState.user2}
          matchPercentage={matchPercentage}
          isActive={collisionState.phase === 'matchResult'}
          onComplete={() => {}}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* 详细对比面板 */}
      <CollisionPanel
        user1={collisionState.user1}
        user2={collisionState.user2}
        isOpen={collisionState.phase === 'details'}
        onClose={handleClosePanel}
      />
    </div>
  );
}

/**
 * 弦节点组件
 */
const StringNode = memo(function StringNode({
  user,
  position,
  isGrabbed,
  isColliding,
  isDisabled,
  useGesture,
  onPointerDown,
}: {
  user: ProcessedUser;
  position: { x: number; y: number };
  isGrabbed: boolean;
  isColliding: boolean;
  isDisabled: boolean;
  useGesture: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const color = useMemo(() => getBaseColor(user.dimensions), [user.dimensions]);
  const persona = useMemo(() => generatePersonaDescription(user.dimensions), [user.dimensions]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: isGrabbed ? 1.15 : isColliding ? 1.1 : 1,
      }}
      transition={
        isGrabbed
          ? { type: 'tween', duration: 0.05 }
          : { type: 'spring', damping: 25, stiffness: 200 }
      }
      onPointerDown={useGesture ? undefined : onPointerDown}
      className={`
        fixed group touch-none
        ${useGesture ? 'pointer-events-none' : isGrabbed ? 'cursor-grabbing z-50' : 'cursor-grab'}
        ${isDisabled && !isGrabbed ? 'opacity-40' : ''}
      `}
      style={{
        touchAction: 'none',
        left: position.x - 90,
        top: position.y - 90,
      }}
    >
      {/* 碰撞能量场 */}
      {isColliding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 2 }}
          className="absolute inset-0 rounded-full -z-10"
          style={{
            background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
        />
      )}

      {/* 抓取光环 */}
      {isGrabbed && !isColliding && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 rounded-full -z-10"
          style={{
            background: `radial-gradient(circle, ${color}40 0%, transparent 60%)`,
            filter: 'blur(20px)',
          }}
        />
      )}

      {/* 玄幻弦 */}
      <MysticalString
        id={`string-${user.id}`}
        dimensions={user.dimensions}
        size={180}
        isGrabbed={isGrabbed}
        isColliding={isColliding}
      />

      {/* 用户信息 */}
      <div
        className={`
          absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap
          transition-opacity duration-300 pointer-events-none
          ${isGrabbed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-white/90 drop-shadow-lg">{user.nickname}</span>
          <span
            className="text-[11px] px-3 py-1 rounded-full backdrop-blur-md"
            style={{
              background: `${color}25`,
              color: color,
              border: `1px solid ${color}50`,
              boxShadow: `0 0 20px ${color}30`,
            }}
          >
            {persona}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
