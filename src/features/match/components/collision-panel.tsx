'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { StringDimensions } from '@/entities/string-data/model';
import {
  calculateSimilarity,
  getDimensionLabel,
  generatePersonaDescription,
} from '@/features/visualization/lib/dimension-calculator';
import { getBaseColor } from '@/features/visualization/color-mixer';

interface CollisionPanelProps {
  user1: ProcessedUser | null;
  user2: ProcessedUser | null;
  onClose: () => void;
  isOpen: boolean;
}

export function CollisionPanel({ user1, user2, onClose, isOpen }: CollisionPanelProps) {
  if (!user1 || !user2) return null;

  const similarity = calculateSimilarity(user1.dimensions, user2.dimensions);
  const similarityPercent = Math.round(similarity * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部装饰线 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
            >
              ✕
            </button>

            <div className="p-8">
              {/* 标题 */}
              <h2 className="text-2xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300">
                弦之共鸣
              </h2>

              {/* 用户对比 */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <UserCard user={user1} />
                <UserCard user={user2} />
              </div>

              {/* 相似度 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <span className="text-white/60 text-sm">共鸣度</span>
                  <span
                    className="text-3xl font-bold"
                    style={{
                      color: getSimilarityColor(similarityPercent),
                    }}
                  >
                    {similarityPercent}%
                  </span>
                </div>
              </div>

              {/* 维度对比图 */}
              <DimensionCompare dims1={user1.dimensions} dims2={user2.dimensions} />

              {/* AI 场景描述 */}
              <SceneDescription user1={user1} user2={user2} similarity={similarity} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function UserCard({ user }: { user: ProcessedUser }) {
  const color = getBaseColor(user.dimensions);
  const persona = generatePersonaDescription(user.dimensions);

  return (
    <div className="text-center">
      <div
        className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${color}40, ${color}20)`,
          border: `2px solid ${color}60`,
        }}
      >
        {user.nickname.slice(-1)}
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{user.nickname}</h3>
      <p className="text-sm text-white/50">{persona}</p>
    </div>
  );
}

function DimensionCompare({ dims1, dims2 }: { dims1: StringDimensions; dims2: StringDimensions }) {
  const dimensions: (keyof StringDimensions)[] = ['cognition', 'empathy', 'pleasure'];
  const colors = {
    cognition: '#60A5FA', // 蓝色
    empathy: '#F87171', // 红色
    pleasure: '#4ADE80', // 绿色
  };

  return (
    <div className="space-y-4 mb-8">
      <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider text-center">
        维度对比
      </h4>
      {dimensions.map((dim) => (
        <div key={dim} className="space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>{getDimensionLabel(dim)}</span>
            <span>
              {Math.round(dims1[dim] * 100)}% / {Math.round(dims2[dim] * 100)}%
            </span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            {/* 用户1的条 */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dims1[dim] * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ backgroundColor: colors[dim], opacity: 0.8 }}
            />
            {/* 用户2的条 - 用虚线边框表示 */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dims2[dim] * 100}%` }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="absolute top-0 left-0 h-full rounded-full border-2 border-dashed"
              style={{ borderColor: colors[dim] }}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-center gap-6 text-xs text-white/40 mt-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-white/30 rounded-full" /> 用户1
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-2 border-dashed border-white/30 rounded-full" /> 用户2
        </span>
      </div>
    </div>
  );
}

function SceneDescription({
  user1,
  user2,
  similarity,
}: {
  user1: ProcessedUser;
  user2: ProcessedUser;
  similarity: number;
}) {
  const scenes = generateSceneText(user1, user2, similarity);

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="text-lg">✨</span> AI 场景预测
      </h4>
      <p className="text-white/80 leading-relaxed">{scenes}</p>
    </div>
  );
}

function generateSceneText(user1: ProcessedUser, user2: ProcessedUser, similarity: number): string {
  const persona1 = generatePersonaDescription(user1.dimensions);
  const persona2 = generatePersonaDescription(user2.dimensions);

  if (similarity > 0.9) {
    return `两位灵魂高度共鸣！作为${persona1}和${persona2}，你们在深夜刷到同一条视频时，可能会在评论区相遇。一起探索知识的海洋，分享生活的点滴，这份默契难能可贵。`;
  } else if (similarity > 0.7) {
    return `${user1.nickname}是${persona1}，${user2.nickname}是${persona2}。当你们坐在同一张沙发上刷手机，偶尔会因为同一个搞笑视频相视而笑，但更多时候，你们在各自的精彩里找到平衡。`;
  } else if (similarity > 0.5) {
    return `一个${persona1}，一个${persona2}。这种差异反而可能成为互补的力量——当${user1.nickname}沉浸在某个领域时，${user2.nickname}会带来不同的视角和惊喜。`;
  } else {
    return `${persona1}遇上${persona2}，像是两个平行世界的交汇。虽然你们的信息流截然不同，但正是这种差异，让每次对话都充满新鲜感和可能性。`;
  }
}

function getSimilarityColor(percent: number): string {
  if (percent >= 80) return '#4ADE80'; // 绿色
  if (percent >= 60) return '#FACC15'; // 黄色
  if (percent >= 40) return '#FB923C'; // 橙色
  return '#F87171'; // 红色
}
