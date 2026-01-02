'use client';

import { useEffect, useRef, useState } from 'react';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 尝试自动播放
    const tryPlay = () => {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // 自动播放被阻止，等待用户交互
        setIsPlaying(false);
      });
    };

    tryPlay();

    // 用户交互后自动播放
    const handleInteraction = () => {
      if (!isPlaying && audio.paused) {
        audio.play().then(() => setIsPlaying(true));
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [isPlaying]);

  return (
    <audio
      ref={audioRef}
      src="/bgm.mp3"
      loop
      preload="auto"
      style={{ display: 'none' }}
    />
  );
}
