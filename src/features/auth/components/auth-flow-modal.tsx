'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 示例视频数据（用于演示，实际使用时可替换为用户输入）
const DEMO_VIDEOS = [
    { title: '心理学：为什么我们总是被相似的人吸引', tags: ['心理学', '科普', '情感'] },
    { title: '一个人的夜晚，听听这首歌', tags: ['音乐', '治愈', '深夜'] },
    { title: '猫咪看到主人回家的反应', tags: ['萌宠', '猫咪', '治愈'] },
    { title: '如何在职场中保持真实的自己', tags: ['职场', '成长', '心理'] },
    { title: '这个反转太绝了哈哈哈', tags: ['搞笑', '段子', '反转'] },
    { title: 'MBTI人格深度解析', tags: ['MBTI', '心理学', '性格'] },
];

type FlowStep = 'idle' | 'confirm' | 'loading' | 'summary' | 'error';

interface AuthFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthFlowModal({ isOpen, onClose }: AuthFlowModalProps) {
    const [step, setStep] = useState<FlowStep>('idle');
    const [isDetailExpanded, setIsDetailExpanded] = useState(true);
    const [userData, setUserData] = useState<SummaryData | null>(null);
    const [error, setError] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setIsDetailExpanded(true);
            setError('');
        } else {
            setStep('idle');
            setIsDetailExpanded(true);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        setStep('loading');

        // 最小加载时间 4 秒，让用户有仪式感
        const MIN_LOADING_TIME = 4000;
        const startTime = Date.now();

        try {
            // 调用真实 API 分析视频数据
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos: DEMO_VIDEOS }),
            });
            const result = await response.json();

            // 确保至少等待最小加载时间
            const elapsed = Date.now() - startTime;
            if (elapsed < MIN_LOADING_TIME) {
                await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
            }

            if (result.success && result.data) {
                setUserData(result.data);
                setStep('summary');
            } else {
                setError(result.error || '分析失败');
                setStep('error');
            }
        } catch (err) {
            console.error('API error:', err);
            // 即使出错也等待最小时间，避免闪烁
            const elapsed = Date.now() - startTime;
            if (elapsed < MIN_LOADING_TIME) {
                await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
            }
            setError('无法连接到分析服务，请确保服务正在运行');
            setStep('error');
        }
    };

    const handleStartMatching = () => {
        onClose();
        router.push('/dashboard');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center"
                >
                    {/* 确认授权步骤 */}
                    {step === 'confirm' && (
                        <ConfirmStep onConfirm={handleConfirm} onCancel={onClose} />
                    )}

                    {/* 加载步骤 */}
                    {step === 'loading' && <LoadingStep />}

                    {/* 错误步骤 */}
                    {step === 'error' && (
                        <ErrorStep error={error} onRetry={handleConfirm} onClose={onClose} />
                    )}

                    {/* 总结步骤 */}
                    {step === 'summary' && userData && (
                        <SummaryStep
                            data={userData}
                            isDetailExpanded={isDetailExpanded}
                            onToggleDetail={() => setIsDetailExpanded(!isDetailExpanded)}
                            onStartMatching={handleStartMatching}
                            onClose={onClose}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function ConfirmStep({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-md w-full mx-4 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center"
        >
            <div className="text-5xl mb-6">🔐</div>
            <h2 className="text-2xl font-bold mb-4 text-white">授权确认</h2>
            <p className="text-white/60 mb-8 leading-relaxed">
                是否确认授权获取您的抖音数据？
                <br />
                <span className="text-white/40 text-sm">我们将分析您的浏览、点赞、评论记录</span>
            </p>

            <div className="flex gap-4">
                <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                >
                    取消
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:opacity-90 transition-all"
                >
                    确认授权
                </button>
            </div>
        </motion.div>
    );
}

function LoadingStep() {
    const [progress, setProgress] = useState(0);
    const loadingTexts = [
        '正在连接抖音服务器...',
        '正在获取浏览记录...',
        '正在分析点赞数据...',
        '正在解析评论内容...',
        'AI 正在生成您的画像...',
    ];
    const [textIndex, setTextIndex] = useState(0);

    // 4秒内完成进度条，配合 MIN_LOADING_TIME
    const TOTAL_DURATION = 4000;

    useEffect(() => {
        const startTime = Date.now();

        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            // 使用缓动函数让进度更自然：开始快，接近100%时放慢
            const rawProgress = Math.min(elapsed / TOTAL_DURATION, 1);
            // easeOutQuart 缓动
            const easedProgress = 1 - Math.pow(1 - rawProgress, 4);
            setProgress(easedProgress * 100);
        }, 50);

        // 每800ms切换文字
        const textInterval = setInterval(() => {
            setTextIndex((i) => (i + 1) % loadingTexts.length);
        }, 800);

        return () => {
            clearInterval(progressInterval);
            clearInterval(textInterval);
        };
    }, []);

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center"
        >
            {/* 脉冲动画 */}
            <div className="relative w-32 h-32 mx-auto mb-8">
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.3, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    className="absolute inset-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                />
                <div className="absolute inset-8 rounded-full bg-black flex items-center justify-center">
                    <span className="text-3xl">📊</span>
                </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">正在分析您的数据</h2>
            <motion.p
                key={textIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/50 mb-6"
            >
                {loadingTexts[textIndex]}
            </motion.p>

            {/* 进度条 */}
            <div className="w-64 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </motion.div>
    );
}

function ErrorStep({ error, onRetry, onClose }: { error: string; onRetry: () => void; onClose: () => void }) {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-md w-full mx-4 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center"
        >
            <div className="text-5xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-white">分析失败</h2>
            <p className="text-white/60 mb-8 leading-relaxed">{error}</p>
            <div className="flex gap-4">
                <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                >
                    取消
                </button>
                <button
                    onClick={onRetry}
                    className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:opacity-90 transition-all"
                >
                    重试
                </button>
            </div>
        </motion.div>
    );
}

interface SummaryData {
    dimensions: { cognition: number; empathy: number; pleasure: number };
    summary: string;
    watchHistory: { title: string; url: string; tags: string[]; duration: string }[];
    likes: { title: string; url: string }[];
    comments: { title: string; url: string; content: string }[];
}

function SummaryStep({
    data,
    isDetailExpanded,
    onToggleDetail,
    onStartMatching,
    onClose,
}: {
    data: SummaryData;
    isDetailExpanded: boolean;
    onToggleDetail: () => void;
    onStartMatching: () => void;
    onClose: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full h-full overflow-y-auto p-6 md:p-10"
        >
            <div className="max-w-6xl mx-auto">
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="fixed top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all z-10"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* 标题 */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="text-5xl mb-4"
                    >
                        ✨
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">您的弦画像</h1>
                    <p className="text-white/40">基于真实数据生成</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左侧：三维度 + 总结 */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 三维度可视化 */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h2 className="text-lg font-semibold text-white/80 mb-6">思维三维度</h2>
                            <div className="grid grid-cols-3 gap-6">
                                <DimensionBar label="求知" en="Cognition" value={data.dimensions.cognition} color="#60a5fa" />
                                <DimensionBar label="共情" en="Empathy" value={data.dimensions.empathy} color="#f472b6" />
                                <DimensionBar label="愉悦" en="Pleasure" value={data.dimensions.pleasure} color="#4ade80" />
                            </div>
                        </div>

                        {/* AI 评语 */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h2 className="text-lg font-semibold text-white/80 mb-4">AI 评语</h2>
                            <p className="text-white/60 leading-relaxed">{data.summary}</p>
                        </div>

                        {/* 开始匹配按钮 */}
                        <button
                            onClick={onStartMatching}
                            className="w-full py-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3"
                        >
                            开始寻找共振
                            <motion.span
                                animate={{ x: [0, 6, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                →
                            </motion.span>
                        </button>
                    </div>

                    {/* 右侧：详细数据 */}
                    <div className="lg:col-span-1">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <button
                                onClick={onToggleDetail}
                                className="w-full flex items-center justify-between text-white/70 hover:text-white transition-colors p-2"
                            >
                                <span className="font-semibold">原始数据</span>
                                <motion.svg
                                    animate={{ rotate: isDetailExpanded ? 180 : 0 }}
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </motion.svg>
                            </button>

                            <AnimatePresence>
                                {isDetailExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                            {/* 浏览记录 */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                                                    <span>👁️</span> 浏览记录 ({data.watchHistory.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {data.watchHistory.map((item, i) => (
                                                        <div key={i} className="p-3 rounded-lg bg-white/5 text-xs">
                                                            <a href={item.url} target="_blank" rel="noopener" className="text-violet-400 hover:underline line-clamp-1">
                                                                {item.title}
                                                            </a>
                                                            <div className="flex items-center gap-2 mt-2 text-white/30">
                                                                <span>{item.duration}</span>
                                                                <span>·</span>
                                                                <span className="line-clamp-1">{item.tags.join(', ')}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 点赞记录 */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                                                    <span>❤️</span> 点赞记录 ({data.likes.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {data.likes.map((item, i) => (
                                                        <div key={i} className="p-3 rounded-lg bg-white/5 text-xs">
                                                            <a href={item.url} target="_blank" rel="noopener" className="text-pink-400 hover:underline line-clamp-1">
                                                                {item.title}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 评论记录 */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                                                    <span>💬</span> 评论记录 ({data.comments.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {data.comments.map((item, i) => (
                                                        <div key={i} className="p-3 rounded-lg bg-white/5 text-xs">
                                                            <a href={item.url} target="_blank" rel="noopener" className="text-cyan-400 hover:underline line-clamp-1">
                                                                {item.title}
                                                            </a>
                                                            <p className="mt-2 text-white/50 italic">"{item.content}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function DimensionBar({ label, en, value, color }: { label: string; en: string; value: number; color: string }) {
    const percentage = Math.round(value * 100);

    return (
        <div className="text-center">
            <div className="relative h-32 w-full flex items-end justify-center mb-3">
                {/* 背景条 */}
                <div className="absolute inset-x-0 bottom-0 h-full rounded-lg bg-white/5" />
                {/* 填充条 */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                    className="absolute inset-x-0 bottom-0 rounded-lg"
                    style={{ backgroundColor: `${color}40` }}
                />
                {/* 数值 */}
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="relative text-2xl font-bold"
                    style={{ color }}
                >
                    {percentage}%
                </motion.span>
            </div>
            <p className="text-white/80 font-semibold">{label}</p>
            <p className="text-white/30 text-xs uppercase tracking-wider">{en}</p>
        </div>
    );
}
