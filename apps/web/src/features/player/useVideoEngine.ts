import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

export interface VideoQuality {
  id: number;
  label: string; // e.g. "720p", "1080p", "Auto"
  height: number;
  bitrate: number;
}

export interface UseVideoEngineOptions {
  src: string;
  streamType?: 'HLS' | 'MP4' | 'DASH' | null;
  autoPlay?: boolean;
  muted?: boolean;
  startPositionSec?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export function isBunnyStreamUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('b-cdn.net') || url.includes('bunnycdn') || (url.includes('.m3u8') && url.includes('playlist'));
}

export function useVideoEngine({
  src,
  streamType = 'HLS',
  autoPlay = false,
  muted = false,
  startPositionSec = 0,
  onTimeUpdate,
  onEnded,
  onError,
}: UseVideoEngineOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number>(-1); // -1 for Auto
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBunnyStream = isBunnyStreamUrl(src);

  // Clean up HLS instance safely on unmount
  const cleanupEngine = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.warn('HLS destroy warning:', e);
      }
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    cleanupEngine();

    const isHls = src.includes('.m3u8') || streamType === 'HLS' || isBunnyStreamUrl(src);

    // Enable mobile inline playback and apply initial mute
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    if (muted) {
      video.muted = true;
      setIsMuted(true);
    }

    const triggerAutoplay = () => {
      if (!autoPlay || !video) return;
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Mobile browser autoplay policy: mute and retry
          video.muted = true;
          setIsMuted(true);
          video.play().catch((err) => console.warn('Muted autoplay fallback failed:', err));
        });
      }
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        capLevelToPlayerSize: true,
        startLevel: -1, // Auto quality selection
        maxBufferLength: 30,
        backBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const parsedQualities: VideoQuality[] = data.levels.map((level, idx) => ({
          id: idx,
          label: `${level.height || 720}p`,
          height: level.height || 720,
          bitrate: level.bitrate || 0,
        }));
        setQualities(parsedQualities);

        if (startPositionSec > 0) {
          video.currentTime = startPositionSec;
        }

        triggerAutoplay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Bunny Stream / HLS network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Bunny Stream / HLS media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error:', data);
              setError('Fatal video stream error. Please check URL or network connection.');
              cleanupEngine();
              if (onError) onError(new Error(data.details));
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || isHls) {
      // Native HLS (Safari iOS/macOS)
      video.src = src;
      if (startPositionSec > 0) {
        video.currentTime = startPositionSec;
      }
      triggerAutoplay();
    } else {
      video.src = src;
      if (startPositionSec > 0) {
        video.currentTime = startPositionSec;
      }
      triggerAutoplay();
    }

    return () => {
      cleanupEngine();
      if (video) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [src, streamType, autoPlay, startPositionSec, cleanupEngine, onError]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration || 0);
      }
    };
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  // Controls API
  const play = useCallback(() => {
    videoRef.current?.play().catch((err) => console.warn('Play error:', err));
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((err) => console.warn('Play error:', err));
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const seek = useCallback((timeSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(timeSec, videoRef.current.duration || timeSec));
    }
  }, []);

  const skip = useCallback((deltaSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + deltaSec, videoRef.current.duration || 0));
    }
  }, []);

  const setVolumeLevel = useCallback((val: number) => {
    if (videoRef.current) {
      const clamped = Math.max(0, Math.min(1, val));
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  const setQuality = useCallback((qualityIndex: number) => {
    setCurrentQualityIndex(qualityIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityIndex; // -1 for Auto, 0..N for manual quality
    }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, []);

  return {
    videoRef,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    bufferedEnd,
    qualities,
    currentQualityIndex,
    playbackSpeed,
    isBuffering,
    error,
    isBunnyStream,
    play,
    pause,
    togglePlay,
    seek,
    skip,
    setVolumeLevel,
    toggleMute,
    setQuality,
    setPlaybackSpeed,
  };
}

