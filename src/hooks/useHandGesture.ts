'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface HandState {
  isTracking: boolean;
  isGrabbing: boolean;
  position: { x: number; y: number } | null;
}

interface UseHandGestureOptions {
  onGrab?: (x: number, y: number) => void;
  onMove?: (x: number, y: number) => void;
  onRelease?: (x: number, y: number) => void;
}

// MediaPipe 类型定义
interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface HandsResults {
  multiHandLandmarks?: Landmark[][];
}

/**
 * 手势识别 Hook
 * 使用 MediaPipe Hands 识别手部动作（从 CDN 动态加载）
 */
export function useHandGesture(options: UseHandGestureOptions = {}) {
  const { onGrab, onMove, onRelease } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef<unknown>(null);
  const cameraRef = useRef<unknown>(null);
  const animationRef = useRef<number>(0);

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handState, setHandState] = useState<HandState>({
    isTracking: false,
    isGrabbing: false,
    position: null,
  });

  const prevGrabbingRef = useRef(false);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  // 使用 ref 存储最新的回调，避免闭包问题
  const callbacksRef = useRef({ onGrab, onMove, onRelease });
  useEffect(() => {
    callbacksRef.current = { onGrab, onMove, onRelease };
  }, [onGrab, onMove, onRelease]);

  // 判断是否是抓取手势
  const isGrabbingGesture = useCallback((landmarks: Landmark[]): boolean => {
    const palmBase = landmarks[0];
    const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    const fingerBases = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];

    let curledFingers = 0;

    for (let i = 0; i < 4; i++) {
      const tip = fingerTips[i];
      const base = fingerBases[i];

      const tipDist = Math.sqrt(
        Math.pow(tip.x - palmBase.x, 2) + Math.pow(tip.y - palmBase.y, 2)
      );
      const baseDist = Math.sqrt(
        Math.pow(base.x - palmBase.x, 2) + Math.pow(base.y - palmBase.y, 2)
      );

      if (tipDist < baseDist * 1.3) {
        curledFingers++;
      }
    }

    return curledFingers >= 3;
  }, []);

  // 处理结果
  const onResults = useCallback(
    (results: HandsResults) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        const palmCenter = {
          x: (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3,
          y: (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3,
        };

        const screenX = (1 - palmCenter.x) * window.innerWidth;
        const screenY = palmCenter.y * window.innerHeight;

        const isGrabbing = isGrabbingGesture(landmarks);

        // 绘制手部指示
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        // 绘制十字准心
        const cx = palmCenter.x * canvas.width;
        const cy = palmCenter.y * canvas.height;
        const crossSize = isGrabbing ? 8 : 12;
        const lineWidth = isGrabbing ? 3 : 2;

        ctx.strokeStyle = isGrabbing ? '#ff6b6b' : '#4ecdc4';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        // 水平线
        ctx.beginPath();
        ctx.moveTo(cx - crossSize, cy);
        ctx.lineTo(cx + crossSize, cy);
        ctx.stroke();

        // 垂直线
        ctx.beginPath();
        ctx.moveTo(cx, cy - crossSize);
        ctx.lineTo(cx, cy + crossSize);
        ctx.stroke();

        // 中心点
        ctx.fillStyle = isGrabbing ? '#ff6b6b' : '#4ecdc4';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [5, 9], [9, 10], [10, 11], [11, 12],
          [9, 13], [13, 14], [14, 15], [15, 16],
          [13, 17], [17, 18], [18, 19], [19, 20],
          [0, 17],
        ];
        for (const [i, j] of connections) {
          ctx.beginPath();
          ctx.moveTo(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height);
          ctx.lineTo(landmarks[j].x * canvas.width, landmarks[j].y * canvas.height);
          ctx.stroke();
        }

        ctx.restore();

        // 触发回调（使用 ref 获取最新的回调）
        const { onGrab, onMove, onRelease } = callbacksRef.current;
        if (isGrabbing && !prevGrabbingRef.current) {
          onGrab?.(screenX, screenY);
        } else if (!isGrabbing && prevGrabbingRef.current) {
          onRelease?.(screenX, screenY);
        } else if (isGrabbing) {
          onMove?.(screenX, screenY);
        }

        prevGrabbingRef.current = isGrabbing;
        lastPositionRef.current = { x: screenX, y: screenY };

        setHandState({
          isTracking: true,
          isGrabbing,
          position: { x: screenX, y: screenY },
        });
      } else {
        if (prevGrabbingRef.current && lastPositionRef.current) {
          callbacksRef.current.onRelease?.(lastPositionRef.current.x, lastPositionRef.current.y);
        }
        prevGrabbingRef.current = false;

        setHandState({
          isTracking: false,
          isGrabbing: false,
          position: null,
        });
      }
    },
    [isGrabbingGesture]
  );

  // 加载 MediaPipe 脚本
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  // 启动手势识别
  const enable = useCallback(async () => {
    if (isEnabled || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // 加载 MediaPipe 脚本
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      // 请求摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });

      // 创建视频元素
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;

      // 创建画布
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      canvas.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 160px;
        height: 120px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        transform: scaleX(-1);
      `;
      document.body.appendChild(canvas);
      canvasRef.current = canvas;

      // 等待视频准备好
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      await video.play();

      // 初始化 MediaPipe Hands
      // @ts-expect-error - MediaPipe 全局变量
      const Hands = window.Hands;
      const hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);
      handsRef.current = hands;

      // 使用 requestAnimationFrame 循环发送帧
      const sendFrame = async () => {
        if (handsRef.current && videoRef.current && videoRef.current.readyState >= 2) {
          try {
            // @ts-expect-error - MediaPipe 方法
            await handsRef.current.send({ image: videoRef.current });
          } catch (e) {
            console.error('Hand detection error:', e);
          }
        }
        animationRef.current = requestAnimationFrame(sendFrame);
      };

      animationRef.current = requestAnimationFrame(sendFrame);

      setIsEnabled(true);
    } catch (err) {
      console.error('手势识别初始化失败:', err);
      setError(err instanceof Error ? err.message : '无法访问摄像头');
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, isLoading, onResults]);

  // 停止手势识别
  const disable = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current = null;
    }

    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }

    handsRef.current = null;
    cameraRef.current = null;
    setIsEnabled(false);
    setHandState({
      isTracking: false,
      isGrabbing: false,
      position: null,
    });
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disable();
    };
  }, [disable]);

  return {
    isEnabled,
    isLoading,
    error,
    handState,
    enable,
    disable,
  };
}
