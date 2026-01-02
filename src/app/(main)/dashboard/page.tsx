'use client';

import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { MysticalString } from '@/features/visualization/components/MysticalString';
import { ParticleBurst, ParticleBurstRef } from '@/features/visualization/components/ParticleBurst';
import { VSBattle } from '@/features/visualization/components/VSBattle';
import { MatchResult, AIAnalysis } from '@/features/visualization/components/MatchResult';
import { FusionAnimation } from '@/features/visualization/components/FusionAnimation';
import { BounceAnimation } from '@/features/visualization/components/BounceAnimation';
import { FadeoutAnimation } from '@/features/visualization/components/FadeoutAnimation';
import { CollisionPanel } from '@/features/match/components/collision-panel';
import { useUsers } from '@/entities/user/hooks';
import { ProcessedUser } from '@/entities/user/model';
import { getBaseColor } from '@/features/visualization/color-mixer';
import { generatePersonaDescription, calculateSimilarity } from '@/features/visualization/lib/dimension-calculator';
import { useHandGesture } from '@/hooks/useHandGesture';

const CosmicBackground = dynamic(
  () => import('@/features/visualization/components/CosmicBackground').then((mod) => mod.CosmicBackground),
  { ssr: false }
);

// 画布尺寸 - 缩小以便初始全部显示
const CANVAS_SIZE = 2000;
const STRING_SIZE = 180;

// 匹配率阈值 - 高于此值显示融合动画
const HIGH_MATCH_THRESHOLD = 60;

type CollisionPhase = 'idle' | 'particles' | 'vsBattle' | 'matchResult' | 'details' | 'fusion' | 'bounce' | 'fadeout';

interface CollisionState {
  phase: CollisionPhase;
  user1: ProcessedUser | null;
  user2: ProcessedUser | null;
  grabbedId: string | null;
  originalPos: { x: number; y: number } | null;
}

// 用户自己的数据 "老己"
const SELF_USER: ProcessedUser = {
  id: 'self',
  nickname: '老己',
  avatar: '',
  personaType: 'self',
  dimensions: { cognition: 0.7, empathy: 0.8, pleasure: 0.6 },
  watchHistory: [],
  meta: { isNewUser: false, isSilentUser: false, isActiveUser: true, isSinglePref: false, isNightOwl: false },
};

// 在画布上生成紧凑位置（围绕中心分布，全部可见）
function generateCanvasPositions(count: number, canvasSize: number) {
  const positions: { x: number; y: number }[] = [];
  const center = canvasSize / 2;
  const minDistance = 220; // 弦之间最小距离
  const centerExcludeRadius = 180; // 中心"老己"的保护区

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let position: { x: number; y: number } | null = null;

    while (attempts < 100) {
      // 紧凑环形分布
      const ring = Math.floor(i / 6) + 1;
      const angleBase = (i % 6) * (Math.PI / 3);
      const angleOffset = (Math.random() - 0.5) * 0.4;
      const angle = angleBase + angleOffset + ring * 0.2;
      const baseDistance = centerExcludeRadius + ring * 200;
      const distance = baseDistance + (Math.random() - 0.5) * 60;

      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;

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

    if (!position) {
      // 备用：规则环形分布
      const ring = Math.floor(i / 6) + 1;
      const angleOffset = (i % 6) * (Math.PI / 3) + (ring % 2) * (Math.PI / 6);
      const dist = centerExcludeRadius + ring * 200;
      position = {
        x: center + Math.cos(angleOffset) * dist,
        y: center + Math.sin(angleOffset) * dist,
      };
    }

    positions.push(position);
  }

  return positions;
}

export default function DashboardPage() {
  const { users, loading, error } = useUsers();
  const particleBurstRef = useRef<ParticleBurstRef>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 画布偏移（用于平移）
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const [collisionState, setCollisionState] = useState<CollisionState>({
    phase: 'idle',
    user1: null,
    user2: null,
    grabbedId: null,
    originalPos: null,
  });

  // 弦的位置状态（画布坐标）
  const [stringPositions, setStringPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [grabbedStringId, setGrabbedStringId] = useState<string | null>(null);
  const [collidingWith, setCollidingWith] = useState<ProcessedUser | null>(null);
  const [nearbyUser, setNearbyUser] = useState<ProcessedUser | null>(null); // 接近但未碰撞
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  // 记录抓取前的原始位置
  const originalPosRef = useRef<{ x: number; y: number } | null>(null);

  // 所有用户（包括自己）
  const allUsers = useMemo(() => [SELF_USER, ...users], [users]);

  // 初始化画布位置（居中显示）
  useEffect(() => {
    const centerOffset = {
      x: window.innerWidth / 2 - CANVAS_SIZE / 2,
      y: window.innerHeight / 2 - CANVAS_SIZE / 2,
    };
    setCanvasOffset(centerOffset);
  }, []);

  // 初始化弦位置
  useEffect(() => {
    if (users.length > 0 && Object.keys(stringPositions).length === 0) {
      const center = CANVAS_SIZE / 2;
      const positions = generateCanvasPositions(users.length, CANVAS_SIZE);

      const posMap: Record<string, { x: number; y: number }> = {
        // "老己" 在正中心
        self: { x: center, y: center },
      };

      users.forEach((user, i) => {
        posMap[user.id] = positions[i];
      });

      setStringPositions(posMap);
    }
  }, [users, stringPositions]);

  // 屏幕坐标转画布坐标
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: screenX - canvasOffset.x,
      y: screenY - canvasOffset.y,
    };
  }, [canvasOffset]);

  // 画布坐标转屏幕坐标
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX + canvasOffset.x,
      y: canvasY + canvasOffset.y,
    };
  }, [canvasOffset]);

  // 检测碰撞和接近（画布坐标）
  const checkCollision = useCallback(
    (x: number, y: number, excludeId: string): { colliding: ProcessedUser | null; nearby: ProcessedUser | null } => {
      const COLLISION_RADIUS = 90;
      const NEARBY_RADIUS = 150; // 接近预警半径

      let colliding: ProcessedUser | null = null;
      let nearby: ProcessedUser | null = null;
      let nearestDist = Infinity;

      for (const user of allUsers) {
        if (user.id === excludeId) continue;
        const pos = stringPositions[user.id];
        if (!pos) continue;

        const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));

        if (dist < COLLISION_RADIUS * 2) {
          colliding = user;
          break; // 已碰撞，直接返回
        } else if (dist < NEARBY_RADIUS * 2 && dist < nearestDist) {
          nearestDist = dist;
          nearby = user;
        }
      }
      return { colliding, nearby };
    },
    [allUsers, stringPositions]
  );

  // 手势回调
  const handleGrab = useCallback(
    (screenX: number, screenY: number) => {
      if (collisionState.phase !== 'idle') return;

      const canvasPos = screenToCanvas(screenX, screenY);
      let nearestId: string | null = null;
      let nearestDist = Infinity;

      for (const [id, pos] of Object.entries(stringPositions)) {
        const dist = Math.sqrt(Math.pow(canvasPos.x - pos.x, 2) + Math.pow(canvasPos.y - pos.y, 2));
        if (dist < 120 && dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
        }
      }

      if (nearestId) {
        setGrabbedStringId(nearestId);
        // 记录原始位置
        originalPosRef.current = stringPositions[nearestId] || null;
        if (navigator.vibrate) navigator.vibrate(20);
      } else {
        // 没抓到弦，开始平移画布
        setIsPanning(true);
        panStartRef.current = { x: screenX, y: screenY, offsetX: canvasOffset.x, offsetY: canvasOffset.y };
      }
    },
    [collisionState.phase, stringPositions, screenToCanvas, canvasOffset]
  );

  const handleMove = useCallback(
    (screenX: number, screenY: number) => {
      if (collisionState.phase !== 'idle') return;

      if (isPanning) {
        // 平移画布
        const dx = screenX - panStartRef.current.x;
        const dy = screenY - panStartRef.current.y;
        setCanvasOffset({
          x: panStartRef.current.offsetX + dx,
          y: panStartRef.current.offsetY + dy,
        });
        return;
      }

      if (!grabbedStringId) return;

      const canvasPos = screenToCanvas(screenX, screenY);
      setStringPositions((prev) => ({
        ...prev,
        [grabbedStringId]: canvasPos,
      }));

      const { colliding, nearby } = checkCollision(canvasPos.x, canvasPos.y, grabbedStringId);

      if (colliding !== collidingWith) {
        setCollidingWith(colliding);
        if (colliding && navigator.vibrate) {
          navigator.vibrate([15, 30, 15]);
        }
      }

      // 更新接近状态
      if (!colliding && nearby !== nearbyUser) {
        setNearbyUser(nearby);
      } else if (colliding) {
        setNearbyUser(null);
      }
    },
    [collisionState.phase, isPanning, grabbedStringId, screenToCanvas, checkCollision, collidingWith, nearbyUser]
  );

  const handleRelease = useCallback(
    (screenX: number, screenY: number) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (!grabbedStringId) return;

      if (collidingWith) {
        const user1 = allUsers.find((u) => u.id === grabbedStringId);
        if (user1) {
          const color1 = getBaseColor(user1.dimensions);
          const color2 = getBaseColor(collidingWith.dimensions);

          setCollisionState({
            phase: 'particles',
            user1,
            user2: collidingWith,
            grabbedId: grabbedStringId,
            originalPos: originalPosRef.current,
          });
          particleBurstRef.current?.burst(screenX, screenY, color1, color2);

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
      setNearbyUser(null);
    },
    [isPanning, grabbedStringId, collidingWith, allUsers]
  );

  // 手势识别
  const { isEnabled, isLoading, enable, disable, handState } = useHandGesture({
    onGrab: handleGrab,
    onMove: handleMove,
    onRelease: handleRelease,
  });

  // 鼠标/触摸处理
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (collisionState.phase !== 'idle' || isEnabled) return;

      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      let nearestId: string | null = null;
      let nearestDist = Infinity;

      for (const [id, pos] of Object.entries(stringPositions)) {
        const dist = Math.sqrt(Math.pow(canvasPos.x - pos.x, 2) + Math.pow(canvasPos.y - pos.y, 2));
        if (dist < 100 && dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
        }
      }

      if (nearestId) {
        e.preventDefault();
        setGrabbedStringId(nearestId);
        // 记录原始位置
        originalPosRef.current = stringPositions[nearestId] || null;
        if (navigator.vibrate) navigator.vibrate(10);
      } else {
        // 开始平移
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY, offsetX: canvasOffset.x, offsetY: canvasOffset.y };
      }
    },
    [collisionState.phase, isEnabled, screenToCanvas, stringPositions, canvasOffset]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (collisionState.phase !== 'idle' || isEnabled) return;

      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setCanvasOffset({
          x: panStartRef.current.offsetX + dx,
          y: panStartRef.current.offsetY + dy,
        });
        return;
      }

      if (!grabbedStringId) return;

      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setStringPositions((prev) => ({
        ...prev,
        [grabbedStringId]: canvasPos,
      }));

      const { colliding, nearby } = checkCollision(canvasPos.x, canvasPos.y, grabbedStringId);

      if (colliding !== collidingWith) {
        setCollidingWith(colliding);
        if (colliding && navigator.vibrate) {
          navigator.vibrate([15, 30, 15]);
        }
      }

      // 更新接近状态
      if (!colliding && nearby !== nearbyUser) {
        setNearbyUser(nearby);
      } else if (colliding) {
        setNearbyUser(null);
      }
    },
    [collisionState.phase, isEnabled, isPanning, grabbedStringId, screenToCanvas, checkCollision, collidingWith, nearbyUser]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isEnabled) return;

      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (grabbedStringId && collidingWith) {
        const user1 = allUsers.find((u) => u.id === grabbedStringId);
        if (user1) {
          const color1 = getBaseColor(user1.dimensions);
          const color2 = getBaseColor(collidingWith.dimensions);

          setCollisionState({
            phase: 'particles',
            user1,
            user2: collidingWith,
            grabbedId: grabbedStringId,
            originalPos: originalPosRef.current,
          });
          particleBurstRef.current?.burst(e.clientX, e.clientY, color1, color2);

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
      setNearbyUser(null);
    },
    [isEnabled, isPanning, grabbedStringId, collidingWith, allUsers]
  );

  const matchPercentage = useMemo(() => {
    if (!collisionState.user1 || !collisionState.user2) return 0;
    return Math.round(
      calculateSimilarity(collisionState.user1.dimensions, collisionState.user2.dimensions) * 100
    );
  }, [collisionState.user1, collisionState.user2]);

  const handleVSComplete = useCallback(() => {
    setCollisionState((prev) => ({ ...prev, phase: 'matchResult' }));
  }, []);

  const handleViewDetails = useCallback((analysis: AIAnalysis | null) => {
    setAiAnalysis(analysis);
    const percent = analysis?.percentage ?? matchPercentage;

    if (percent >= HIGH_MATCH_THRESHOLD) {
      // 高匹配率：进入融合动画，完成后显示详情
      setCollisionState((prev) => ({ ...prev, phase: 'fusion' }));
    } else {
      // 低匹配率：直接显示详情，关闭时再弹开
      setCollisionState((prev) => ({ ...prev, phase: 'details' }));
    }
  }, [matchPercentage]);

  // 融合动画完成后显示详情
  const handleFusionComplete = useCallback(() => {
    setCollisionState((prev) => ({ ...prev, phase: 'details' }));
  }, []);

  // 弹开动画：恢复原位并关闭
  const handleBounceComplete = useCallback(() => {
    // 将拖拽的弦恢复到原位
    if (collisionState.grabbedId && collisionState.originalPos) {
      setStringPositions((prev) => ({
        ...prev,
        [collisionState.grabbedId!]: collisionState.originalPos!,
      }));
    }
    // 重置状态
    setCollisionState({ phase: 'idle', user1: null, user2: null, grabbedId: null, originalPos: null });
    setAiAnalysis(null);
  }, [collisionState.grabbedId, collisionState.originalPos]);

  const handleClosePanel = useCallback(() => {
    const percent = aiAnalysis?.percentage ?? matchPercentage;

    if (percent < HIGH_MATCH_THRESHOLD) {
      // 低匹配率：关闭详情后触发弹开动画
      setCollisionState((prev) => ({ ...prev, phase: 'bounce' }));
    } else {
      // 高匹配率：显示融合渐隐效果
      setCollisionState((prev) => ({ ...prev, phase: 'fadeout' }));
    }
  }, [aiAnalysis?.percentage, matchPercentage]);

  // 融合渐隐完成
  const handleFadeoutComplete = useCallback(() => {
    setCollisionState({ phase: 'idle', user1: null, user2: null, grabbedId: null, originalPos: null });
    setAiAnalysis(null);
  }, []);

  // 手势关闭面板：在 details 阶段，握拳后张开手可关闭
  const gestureCloseRef = useRef<{ enteredDetailsAt: number; grabbedInDetails: boolean }>({
    enteredDetailsAt: 0,
    grabbedInDetails: false,
  });

  // 记录进入 details 的时间
  useEffect(() => {
    if (collisionState.phase === 'details') {
      gestureCloseRef.current.enteredDetailsAt = Date.now();
      gestureCloseRef.current.grabbedInDetails = false;
    }
  }, [collisionState.phase]);

  // 监听手势变化
  useEffect(() => {
    if (!isEnabled || collisionState.phase !== 'details') return;

    // 确保进入 details 后至少 500ms 才响应手势关闭（避免误触发）
    const timeSinceEntered = Date.now() - gestureCloseRef.current.enteredDetailsAt;
    if (timeSinceEntered < 500) return;

    if (handState.isGrabbing) {
      // 在 details 阶段握拳了
      gestureCloseRef.current.grabbedInDetails = true;
    } else if (gestureCloseRef.current.grabbedInDetails) {
      // 之前在 details 阶段握过拳，现在张开了 -> 关闭
      gestureCloseRef.current.grabbedInDetails = false;
      handleClosePanel();
    }
  }, [isEnabled, handState.isGrabbing, collisionState.phase, handleClosePanel]);

  // 回到中心
  const handleCenterView = useCallback(() => {
    setCanvasOffset({
      x: window.innerWidth / 2 - CANVAS_SIZE / 2,
      y: window.innerHeight / 2 - CANVAS_SIZE / 2,
    });
  }, []);

  // 回到自己（定位到 self 弦）
  const handleGoToSelf = useCallback(() => {
    const selfPos = stringPositions['self'];
    if (selfPos) {
      setCanvasOffset({
        x: window.innerWidth / 2 - selfPos.x,
        y: window.innerHeight / 2 - selfPos.y,
      });
    }
  }, [stringPositions]);

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
      className="h-screen bg-black text-white relative overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none', cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* 宇宙背景 */}
      <CosmicBackground />

      {/* 粒子效果 */}
      <ParticleBurst ref={particleBurstRef} />

      {/* 可移动画布 */}
      <div
        ref={canvasRef}
        className="absolute"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
        }}
      >
        {/* 画布网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />

        {/* 所有弦 */}
        {allUsers.map((user) => {
          const pos = stringPositions[user.id];
          if (!pos) return null;

          const isGrabbed = grabbedStringId === user.id;
          const isColliding = collidingWith?.id === user.id || (isGrabbed && collidingWith !== null);
          const isNearby = nearbyUser?.id === user.id || (isGrabbed && nearbyUser !== null);
          const isSelf = user.id === 'self';

          return (
            <StringNode
              key={user.id}
              user={user}
              position={pos}
              isGrabbed={isGrabbed}
              isColliding={isColliding}
              isNearby={isNearby}
              isDisabled={collisionState.phase !== 'idle'}
              isSelf={isSelf}
            />
          );
        })}
      </div>

      {/* 手势准心 */}
      <AnimatePresence>
        {isEnabled && handState.position && (() => {
          const cursorPos = grabbedStringId && stringPositions[grabbedStringId]
            ? canvasToScreen(stringPositions[grabbedStringId].x, stringPositions[grabbedStringId].y)
            : handState.position;

          return (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed pointer-events-none z-[999]"
              style={{ left: cursorPos.x, top: cursorPos.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[3px] transition-all ${grabbedStringId ? 'w-[24px] bg-red-500' : 'w-[40px] bg-cyan-400'}`} style={{ boxShadow: grabbedStringId ? '0 0 12px rgba(239,68,68,0.8)' : '0 0 10px rgba(34,211,238,0.6)' }} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] transition-all ${grabbedStringId ? 'h-[24px] bg-red-500' : 'h-[40px] bg-cyan-400'}`} style={{ boxShadow: grabbedStringId ? '0 0 12px rgba(239,68,68,0.8)' : '0 0 10px rgba(34,211,238,0.6)' }} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${grabbedStringId ? 'w-2 h-2 bg-red-400' : 'w-1.5 h-1.5 bg-cyan-300'}`} />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 头部 - 极简关闭按钮 */}
      <header className="fixed top-0 left-0 z-20 p-6 pointer-events-auto">
        <Link href="/">
          <button
            className="group relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-110"
            aria-label="返回首页"
          >
            <span className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/60 group-hover:text-white transition-colors relative z-10"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </Link>
      </header>

      {/* 顶部右侧功能区 - 悬浮 */}
      <div className="fixed top-0 right-0 z-20 p-6 flex items-center gap-2 pointer-events-auto">
        {/* 回到自己 */}
        <button
          onClick={handleGoToSelf}
          className="group px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/20 transition-all backdrop-blur-md"
        >
          <span className="group-hover:scale-110 inline-block transition-transform">◉</span> 找到我
        </button>

        {/* 回到中心 */}
        <button
          onClick={handleCenterView}
          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-all backdrop-blur-md"
        >
          ⌖ 中心
        </button>

        {/* 手势开关 */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!isLoading) isEnabled ? disable() : enable(); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all backdrop-blur-md ${isEnabled ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'} ${isLoading ? 'opacity-50' : ''}`}
        >
          {isLoading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />加载中...</> : isEnabled ? <><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />手势识别中</> : <><span>✋</span>启用手势</>}
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400">{allUsers.length} 弦在共振</span>
        </div>
      </div>

      {/* 操作提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 text-center"
      >
        <p className="text-white/20 text-xs tracking-wider">
          {isEnabled ? '握拳抓取弦 · 张开手释放' : '拖拽移动画布 · 拖拽弦到另一个弦碰撞'}
        </p>
      </motion.div>

      {/* VS 对决 */}
      {collisionState.user1 && collisionState.user2 && (
        <VSBattle
          user1={collisionState.user1}
          user2={collisionState.user2}
          isActive={collisionState.phase === 'vsBattle'}
          onComplete={handleVSComplete}
        />
      )}

      {/* 匹配结果 */}
      {collisionState.user1 && collisionState.user2 && (
        <MatchResult
          user1={collisionState.user1}
          user2={collisionState.user2}
          matchPercentage={matchPercentage}
          isActive={collisionState.phase === 'matchResult'}
          onComplete={() => { }}
          onViewDetails={handleViewDetails}
          isGestureEnabled={isEnabled}
          gestureGrab={isEnabled && handState.isGrabbing}
        />
      )}

      {/* 融合动画 - 高匹配率 */}
      {collisionState.user1 && collisionState.user2 && (
        <FusionAnimation
          user1={collisionState.user1}
          user2={collisionState.user2}
          isActive={collisionState.phase === 'fusion'}
          onComplete={handleFusionComplete}
        />
      )}

      {/* 弹开动画 - 低匹配率 */}
      {collisionState.user1 && collisionState.user2 && (
        <BounceAnimation
          user1={collisionState.user1}
          user2={collisionState.user2}
          matchPercentage={aiAnalysis?.percentage ?? matchPercentage}
          isActive={collisionState.phase === 'bounce'}
          onComplete={handleBounceComplete}
        />
      )}

      {/* 融合渐隐动画 - 高匹配率关闭时 */}
      {collisionState.user1 && collisionState.user2 && (
        <FadeoutAnimation
          user1={collisionState.user1}
          user2={collisionState.user2}
          isActive={collisionState.phase === 'fadeout'}
          onComplete={handleFadeoutComplete}
        />
      )}

      {/* 详情面板 */}
      <CollisionPanel
        user1={collisionState.user1}
        user2={collisionState.user2}
        aiAnalysis={aiAnalysis}
        isOpen={collisionState.phase === 'details'}
        onClose={handleClosePanel}
      />
    </div>
  );
}

/**
 * 弦节点
 */
const StringNode = memo(function StringNode({
  user,
  position,
  isGrabbed,
  isColliding,
  isNearby,
  isDisabled,
  isSelf,
}: {
  user: ProcessedUser;
  position: { x: number; y: number };
  isGrabbed: boolean;
  isColliding: boolean;
  isNearby: boolean;
  isDisabled: boolean;
  isSelf: boolean;
}) {
  const color = useMemo(() => getBaseColor(user.dimensions), [user.dimensions]);
  const persona = useMemo(() => generatePersonaDescription(user.dimensions), [user.dimensions]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: isGrabbed ? 1.15 : isColliding ? 1.1 : isNearby ? 1.05 : 1,
      }}
      transition={isGrabbed ? { type: 'tween', duration: 0.05 } : { type: 'spring', damping: 25, stiffness: 200 }}
      className={`absolute group ${isGrabbed ? 'z-50 cursor-grabbing' : 'cursor-grab'} ${isDisabled && !isGrabbed ? 'opacity-40' : ''}`}
      style={{
        left: position.x - STRING_SIZE / 2,
        top: position.y - STRING_SIZE / 2,
        width: STRING_SIZE,
        height: STRING_SIZE,
      }}
    >
      {/* "老己" 特殊光环 */}
      {isSelf && (
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-8 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,150,0,0.1) 40%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      )}

      {/* 碰撞能量场 */}
      {isColliding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 2 }}
          className="absolute inset-0 rounded-full -z-10"
          style={{ background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`, filter: 'blur(30px)' }}
        />
      )}

      {/* 接近预警光环 - 脉冲效果 */}
      {isNearby && !isColliding && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1.3, 1.5, 1.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full -z-10"
          style={{
            background: `radial-gradient(circle, ${color}30 0%, transparent 60%)`,
            filter: 'blur(25px)',
            border: `2px dashed ${color}40`,
          }}
        />
      )}

      {/* 抓取光环 */}
      {isGrabbed && !isColliding && !isNearby && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 rounded-full -z-10"
          style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 60%)`, filter: 'blur(20px)' }}
        />
      )}

      {/* 弦 */}
      <MysticalString
        id={`string-${user.id}`}
        dimensions={user.dimensions}
        size={STRING_SIZE}
        isGrabbed={isGrabbed}
        isColliding={isColliding}
      />

      {/* 用户标签 - 默认显示简化版，hover显示完整 */}
      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="flex flex-col items-center gap-1.5">
          {/* 昵称 - 始终显示 */}
          <span
            className={`font-medium drop-shadow-lg transition-all duration-200 ${
              isSelf
                ? 'text-lg text-amber-400'
                : isGrabbed || isColliding
                  ? 'text-sm text-white'
                  : 'text-xs text-white/70 group-hover:text-sm group-hover:text-white/90'
            }`}
          >
            {isSelf ? '老己' : user.nickname}
          </span>

          {/* 人格标签 - hover或交互时显示 */}
          {!isSelf && (
            <div className={`transition-all duration-200 ${isGrabbed || isColliding ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}>
              <span
                className="text-[10px] px-2.5 py-0.5 rounded-full backdrop-blur-md"
                style={{ background: `${color}20`, color: color, border: `1px solid ${color}40`, boxShadow: `0 0 12px ${color}25` }}
              >
                {persona}
              </span>
            </div>
          )}

          {/* 老己特殊标识 */}
          {isSelf && (
            <span className="text-[10px] text-amber-400/60 tracking-wider">YOU</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
