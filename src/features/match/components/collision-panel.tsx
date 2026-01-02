'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedUser } from '@/entities/user/model';
import { StringDimensions } from '@/entities/string-data/model';
import {
  getDimensionLabel,
  generatePersonaDescription,
} from '@/features/visualization/lib/dimension-calculator';
import { getBaseColor } from '@/features/visualization/color-mixer';

export interface AIAnalysis {
  percentage: number;
  summary: string;
  highlights: string[];
  chemistry: string;
}

interface CollisionPanelProps {
  user1: ProcessedUser | null;
  user2: ProcessedUser | null;
  aiAnalysis: AIAnalysis | null;
  onClose: () => void;
  isOpen: boolean;
}

export function CollisionPanel({ user1, user2, aiAnalysis, onClose, isOpen }: CollisionPanelProps) {
  if (!user1 || !user2) return null;

  const similarityPercent = aiAnalysis?.percentage ?? 50;

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
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[85vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部装饰线 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white z-10"
            >
              ✕
            </button>

            <div className="p-5 overflow-y-auto flex-1">
              {/* 标题 */}
              <h2 className="text-xl font-bold text-center mb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300">
                弦之共鸣
              </h2>

              {/* 用户对比 */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <UserCard user={user1} />
                <UserCard user={user2} />
              </div>

              {/* 相似度 */}
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <span className="text-white/60 text-sm">共鸣度</span>
                  <span
                    className="text-2xl font-bold"
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
              <SceneDescription aiAnalysis={aiAnalysis} />
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
        className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${color}40, ${color}20)`,
          border: `2px solid ${color}60`,
        }}
      >
        {user.nickname.slice(-1)}
      </div>
      <h3 className="text-base font-semibold text-white mb-0.5">{user.nickname}</h3>
      <p className="text-xs text-white/50">{persona}</p>
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
    <div className="space-y-2 mb-5">
      <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider text-center">
        维度对比
      </h4>
      {dimensions.map((dim) => (
        <div key={dim} className="space-y-0.5">
          <div className="flex justify-between text-xs text-white/60">
            <span>{getDimensionLabel(dim)}</span>
            <span>
              {Math.round(dims1[dim] * 100)}% / {Math.round(dims2[dim] * 100)}%
            </span>
          </div>
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
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
              className="absolute top-0 left-0 h-full rounded-full border border-dashed"
              style={{ borderColor: colors[dim] }}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-center gap-4 text-xs text-white/40 mt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-white/30 rounded-full" /> 用户1
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 border border-dashed border-white/30 rounded-full" /> 用户2
        </span>
      </div>
    </div>
  );
}

function SceneDescription({ aiAnalysis }: { aiAnalysis: AIAnalysis | null }) {
  if (!aiAnalysis) {
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-sm">✨</span> AI 分析
        </h4>
        <p className="text-white/60 text-sm">暂无 AI 分析结果</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="text-sm">✨</span> AI 分析
      </h4>

      {/* 化学反应描述 */}
      <p className="text-white/80 text-sm leading-relaxed italic mb-2">"{aiAnalysis.chemistry}"</p>

      {/* 总结 */}
      <p className="text-white/60 text-xs mb-3">{aiAnalysis.summary}</p>

      {/* 共同点标签 */}
      <div className="flex flex-wrap gap-1.5">
        {aiAnalysis.highlights.map((highlight, i) => (
          <span
            key={i}
            className="px-2 py-0.5 text-xs rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300"
          >
            {highlight}
          </span>
        ))}
      </div>
    </div>
  );
}

function getSimilarityColor(percent: number): string {
  if (percent >= 80) return '#4ADE80'; // 绿色
  if (percent >= 60) return '#FACC15'; // 黄色
  if (percent >= 40) return '#FB923C'; // 橙色
  return '#F87171'; // 红色
}
