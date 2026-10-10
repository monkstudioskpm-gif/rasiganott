import { useState, useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { feedApi } from '../lib/api';
import {
  Share2,
  Play,
  Loader2,
  IndianRupee,
  Film,
  Volume2,
  VolumeX,
  ArrowLeft,
  Heart,
  Sparkles,
  Scissors,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { FeedResponseItem, Title } from '@rasigan/shared';
import { SupportModal } from '../components/SupportModal';
import { useVideoEngine } from '../features/player/useVideoEngine';
import { ShotsFeedSkeleton } from '../components/Skeleton';

export function ShotsPage() {
  const [searchParams] = useSearchParams();
  const targetTitleId = searchParams.get('titleId');
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [supportTarget, setSupportTarget] = useState<Title | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Telemetry events buffer
  const eventsBufferRef = useRef<Record<string, unknown>[]>([]);

  // Infinite Query for Unlimited Shots Feed (SPEC_ADDENDUM_C)
  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['shots-feed'],
    queryFn: ({ pageParam }) => feedApi.getFeed({ cursor: pageParam, limit: 10 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || `infinite_page_${Date.now()}`,
  });

  // Flatten items across all fetched pages
  const rawItems: FeedResponseItem[] = (data?.pages.flatMap((p) => p?.items || [])) || [];

  // Guaranteed endless scrolling: if rawItems is available, loop with varied clip windows
  const items: FeedResponseItem[] = (() => {
    if (rawItems.length === 0) return [];
    let pool = [...rawItems];
    if (targetTitleId) {
      const idx = pool.findIndex((it) => it.titleId === targetTitleId || it.slug === targetTitleId);
      if (idx > 0) {
        const [target] = pool.splice(idx, 1);
        pool = [target, ...pool];
      }
    }
    // Repeat items to ensure uninterrupted infinite scroll
    if (pool.length > 0 && pool.length < 50) {
      const multiplied: FeedResponseItem[] = [];
      const repeatCount = Math.max(2, Math.ceil(50 / pool.length));
      for (let r = 0; r < repeatCount; r++) {
        for (const it of pool) {
          multiplied.push({
            ...it,
            clipStartSec: it.mode === 'CLIP' && it.durationSec > 60
              ? Math.max(15, (it.clipStartSec || 30) + (r * 19) % Math.max(20, it.durationSec - 50))
              : it.clipStartSec,
          });
        }
      }
      return multiplied;
    }
    return pool;
  })();

  const requestId = data?.pages?.[0]?.requestId || `shots_${Date.now()}`;

  // Flush telemetry events to backend
  const flushEvents = useCallback(() => {
    if (eventsBufferRef.current.length === 0) return;
    const batch = [...eventsBufferRef.current];
    eventsBufferRef.current = [];
    feedApi.recordEvents(requestId, batch).catch(() => {});
  }, [requestId]);

  useEffect(() => {
    const timer = setInterval(flushEvents, 8000);
    return () => {
      clearInterval(timer);
      flushEvents();
    };
  }, [flushEvents]);

  // Handle snapping scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    if (height === 0) return;
    const index = Math.round(containerRef.current.scrollTop / height);
    if (index !== activeIndex && index >= 0 && index < items.length) {
      setActiveIndex(index);
    }

    // Prefetch next page when nearing end of current batch
    if (index >= items.length - 4 && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSkipNext = () => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const nextIdx = activeIndex + 1;
    if (nextIdx < items.length) {
      containerRef.current.scrollTo({
        top: nextIdx * height,
        behavior: 'smooth',
      });
      setActiveIndex(nextIdx);
    } else {
      fetchNextPage();
    }
  };

  const toggleLike = (id: string) => {
    setLikedMap((prev) => {
      const next = !prev[id];
      eventsBufferRef.current.push({
        titleId: id,
        liked: next,
        timestamp: Date.now(),
      });
      return { ...prev, [id]: next };
    });
  };

  const openSupportModal = (item: FeedResponseItem) => {
    const pseudoTitle: Title = {
      id: item.titleId,
      slug: item.slug,
      title: item.title,
      description: item.description,
      kind: item.kind as Title['kind'],
      orientation: item.orientation as Title['orientation'],
      status: 'PUBLISHED',
      language: 'Tamil',
      subtitles: [],
      audioTracks: [],
      posterUrl: item.posterUrl,
      verticalPosterUrl: item.verticalPosterUrl,
      bannerUrl: item.bannerUrl,
      fundingEnabled: item.fundingEnabled,
      creatorName: item.creatorName,
      editorRating: item.editorRating,
      isFeatured: false,
      feedEligible: true,
    };
    eventsBufferRef.current.push({
      titleId: item.titleId,
      openedSupport: true,
      timestamp: Date.now(),
    });
    setSupportTarget(pseudoTitle);
  };

  if (isLoading) {
    return <ShotsFeedSkeleton />;
  }

  if (isError || items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
          <Flame className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Shots Available Yet</h3>
        <p className="text-xs text-gray-400 max-w-sm">
          Fresh highlight reels and vertical clips will appear here as new cinema content is published.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg transition-all"
          >
            Retry Feed
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SupportModal
        title={supportTarget}
        isOpen={!!supportTarget}
        onClose={() => setSupportTarget(null)}
      />

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black/90 border border-sky-400/40 text-sky-300 text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Shots Fullscreen/Card Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-[calc(100dvh-5rem)] md:max-w-md md:h-[86vh] md:my-2 mx-auto overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-none md:rounded-3xl border-0 md:border md:border-white/10 glass-panel shadow-2xl relative bg-black select-none"
      >
        {items.map((item, idx) => (
          <ShotItem
            key={`${item.titleId}-${item.episodeId || 'main'}-${idx}`}
            item={item}
            position={idx}
            isActive={idx === activeIndex}
            isLiked={!!likedMap[item.titleId]}
            onToggleLike={() => toggleLike(item.titleId)}
            onOpenSupport={() => openSupportModal(item)}
            onSkipNext={handleSkipNext}
            onShowToast={showToast}
            eventsBufferRef={eventsBufferRef}
          />
        ))}

        {isFetchingNextPage && (
          <div className="h-24 w-full flex items-center justify-center text-xs text-gray-400 snap-start">
            <Loader2 className="w-5 h-5 text-sky-400 animate-spin mr-2" />
            Loading more shots...
          </div>
        )}
      </div>
    </>
  );
}

interface ShotItemProps {
  item: FeedResponseItem;
  position: number;
  isActive: boolean;
  isLiked: boolean;
  onToggleLike: () => void;
  onOpenSupport: () => void;
  onSkipNext: () => void;
  onShowToast: (msg: string) => void;
  eventsBufferRef: React.MutableRefObject<Record<string, unknown>[]>;
}

function ShotItem({
  item,
  position,
  isActive,
  isLiked,
  onToggleLike,
  onOpenSupport,
  onSkipNext,
  onShowToast,
  eventsBufferRef,
}: ShotItemProps) {
  const navigate = useNavigate();

  const [loops, setLoops] = useState(0);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentDisplaySec, setCurrentDisplaySec] = useState(0);
  const [clipTotalSec, setClipTotalSec] = useState(0);

  const watchDurationRef = useRef(0);
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isClipMode = item.mode === 'CLIP';
  const clipStart = item.clipStartSec || 0;
  const clipEnd = item.clipEndSec || (item.durationSec > 0 ? Math.min(60, item.durationSec) : 45);
  const expectedClipDuration = Math.max(1, clipEnd - clipStart);

  // Video Engine Integration per AGENTS.md
  const {
    videoRef,
    isPlaying,
    isMuted,
    play,
    pause,
    togglePlay,
    toggleMute,
    seek,
  } = useVideoEngine({
    src: item.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    streamType: item.streamUrl.includes('.m3u8') ? 'HLS' : 'MP4',
    autoPlay: isActive,
    muted: true, // starts muted so mobile autoplay policies always permit playback
    startPositionSec: isClipMode ? clipStart : 0,
    onTimeUpdate: (currentTime: number) => {
      // Loop enforcement in CLIP mode (§C3)
      if (isClipMode) {
        if (currentTime >= clipEnd) {
          // Loop back to clip start
          seek(clipStart);
          setLoops((l) => {
            const nextL = l + 1;
            if (nextL >= 2) {
              setShowFullPrompt(true);
            }
            return nextL;
          });
          return;
        }

        // Relative progress calculation (0:00 to L)
        const elapsed = Math.max(0, Math.min(expectedClipDuration, currentTime - clipStart));
        const pct = (elapsed / expectedClipDuration) * 100;
        setCurrentProgress(pct);
        setCurrentDisplaySec(Math.floor(elapsed));
        setClipTotalSec(Math.round(expectedClipDuration));
      } else {
        // FULL mode
        const total = item.durationSec || 60;
        const pct = Math.min(100, (currentTime / total) * 100);
        setCurrentProgress(pct);
        setCurrentDisplaySec(Math.floor(currentTime));
        setClipTotalSec(Math.round(total));
      }
    },
    onError: () => {
      console.warn(`Shot playback error for title ${item.title}`);
      onShowToast('Playback issue, skipping to next shot...');
      onSkipNext();
    },
  });

  // Track playback and watch-time telemetry when active
  useEffect(() => {
    if (isActive) {
      play();
      window.dispatchEvent(new CustomEvent('playerStateChange', { detail: { isPlaying: true } }));

      // Impression telemetry
      eventsBufferRef.current.push({
        titleId: item.titleId,
        episodeId: item.episodeId,
        mode: item.mode,
        clipStartSec: item.clipStartSec,
        clipEndSec: item.clipEndSec,
        position,
        type: 'IMPRESSION',
        timestamp: Date.now(),
      });

      // Watch-time timer (every second)
      watchDurationRef.current = 0;
      watchTimerRef.current = setInterval(() => {
        watchDurationRef.current += 1;
        const watched = watchDurationRef.current;

        if (watched === 3) {
          eventsBufferRef.current.push({
            titleId: item.titleId,
            mode: item.mode,
            watchedSec: 3,
            type: 'WATCH_3S',
          });
        }
        if (watched === 10) {
          eventsBufferRef.current.push({
            titleId: item.titleId,
            mode: item.mode,
            watchedSec: 10,
            type: 'WATCH_10S',
          });
        }
      }, 1000);
    } else {
      pause();
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
      }
      if (watchDurationRef.current > 0) {
        eventsBufferRef.current.push({
          titleId: item.titleId,
          mode: item.mode,
          watchedSec: watchDurationRef.current,
          loops,
          type: 'WATCH_END',
        });
      }
    }

    return () => {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
      }
    };
  }, [isActive, play, pause, item, position, loops, eventsBufferRef]);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleWatchFull = () => {
    eventsBufferRef.current.push({
      titleId: item.titleId,
      clickedWatchFull: true,
      timestamp: Date.now(),
    });
    navigate(`/watch/${item.titleId}`);
  };

  const handleWatchFromHere = () => {
    const curTime = videoRef.current ? Math.floor(videoRef.current.currentTime) : clipStart;
    eventsBufferRef.current.push({
      titleId: item.titleId,
      clickedWatchFull: true,
      fromHighlight: true,
      timestamp: Date.now(),
    });
    navigate(`/watch/${item.titleId}?t=${curTime}`);
  };

  return (
    <div className="h-full w-full snap-start snap-always relative overflow-hidden flex items-center justify-center bg-black select-none">
      {/* Top Left Back Button (Goes to Home) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate('/');
        }}
        className="absolute top-4 left-4 z-30 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all shadow-md active:scale-95 cursor-pointer"
        title="Go to Home"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Top Right Mode Pill */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-md text-[10px] font-extrabold uppercase tracking-wider">
        {isClipMode ? (
          <>
            <Scissors className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300">Highlight • {expectedClipDuration}s</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span className="text-sky-300">9:16 Full Cut</span>
          </>
        )}
      </div>

      {/* Ambient Blurred Backdrop for 9:16 letterbox harmony */}
      <img
        src={item.verticalPosterUrl || item.posterUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-125 pointer-events-none"
      />

      {/* Video Element: object-contain preserves full frame letterboxing without aggressive crop */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted={isMuted}
        onClick={togglePlay}
        className="relative z-10 w-full h-full object-contain cursor-pointer"
      />

      {/* Play/Pause or Buffering Indicator */}
      {isActive && !isPlaying ? (
        <div className="absolute z-20 pointer-events-none w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-sky-400 backdrop-blur-md shadow-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        </div>
      ) : !isPlaying ? (
        <div className="absolute z-20 pointer-events-none w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-2xl">
          <Play className="w-7 h-7 fill-current ml-1 text-white" />
        </div>
      ) : null}

      {/* Dark Bottom & Top Gradients for Contrast Readability */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

      {/* Subtle Loop Prompt (Appears after 2 complete loops) */}
      {showFullPrompt && (
        <div className="absolute top-16 inset-x-4 z-30 p-2.5 rounded-2xl bg-sky-950/80 border border-sky-400/40 backdrop-blur-xl shadow-2xl flex items-center justify-between animate-fade-in text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-xs font-bold">Enjoying this scene?</span>
          </div>
          <button
            onClick={handleWatchFull}
            className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-extrabold shadow-md transition-all active:scale-95"
          >
            ▶ Watch full
          </button>
        </div>
      )}

      {/* Compact Right Action Rail */}
      <div className="absolute right-3 bottom-20 md:bottom-12 z-20 flex flex-col items-center gap-2.5 sm:gap-3 text-white">
        {/* Sound Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="flex flex-col items-center gap-0.5 group cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 backdrop-blur-md transition-all flex items-center justify-center group-active:scale-90 shadow-md">
            {isMuted ? <VolumeX className="w-4 h-4 text-sky-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </div>
          <span className="text-[8px] font-bold">{isMuted ? 'Muted' : 'Sound'}</span>
        </button>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          className="flex flex-col items-center gap-0.5 group cursor-pointer"
          title="Like Shot"
        >
          <div
            className={`w-9 h-9 rounded-full border backdrop-blur-md transition-all flex items-center justify-center group-active:scale-90 shadow-md ${
              isLiked
                ? 'bg-rose-500/80 border-rose-400 text-white shadow-rose-500/30'
                : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-white scale-110' : 'text-white'} transition-transform`} />
          </div>
          <span className="text-[8px] font-bold">{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Support Creator (₹) */}
        {item.fundingEnabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSupport();
            }}
            className="flex flex-col items-center gap-0.5 group cursor-pointer"
            title="Support this Creator"
          >
            <div className="w-9 h-9 rounded-full bg-amber-500 border border-amber-400/50 text-white shadow-md shadow-amber-500/30 backdrop-blur-md transition-all flex items-center justify-center group-active:scale-90 animate-pulse">
              <IndianRupee className="w-4 h-4 font-black" />
            </div>
            <span className="text-[8px] font-black text-amber-300 tracking-wider uppercase">Support</span>
          </button>
        )}

        {/* Watch Full Movie */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWatchFull();
          }}
          className="flex flex-col items-center gap-0.5 group cursor-pointer"
          title="Watch Full Movie"
        >
          <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white hover:bg-sky-500/80 hover:border-sky-400 backdrop-blur-md transition-all flex items-center justify-center group-active:scale-90 shadow-md">
            <Film className="w-4 h-4 text-sky-300" />
          </div>
          <span className="text-[8px] font-extrabold text-sky-300 tracking-tight">Full Film</span>
        </button>

        {/* Share Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const shareUrl = `${window.location.origin}/shots?titleId=${item.titleId}`;
            if (navigator.share) {
              navigator.share({ title: item.title, url: shareUrl }).catch(() => {});
            } else {
              navigator.clipboard.writeText(shareUrl);
              onShowToast('Link copied to clipboard!');
            }
          }}
          className="flex flex-col items-center gap-0.5 group cursor-pointer"
          title="Share Shot"
        >
          <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 backdrop-blur-md transition-all flex items-center justify-center group-active:scale-90 shadow-md">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-[8px] font-bold">Share</span>
        </button>

        {/* Skip to Next indicator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkipNext();
          }}
          className="flex flex-col items-center gap-0.5 group cursor-pointer opacity-80 hover:opacity-100"
          title="Next Shot"
        >
          <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 text-gray-300 flex items-center justify-center">
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
          <span className="text-[7px] text-gray-400 font-medium">Next</span>
        </button>
      </div>

      {/* Bottom Overlay Info & Dual CTAs */}
      <div className="absolute bottom-20 md:bottom-5 left-3 right-16 z-20 space-y-2 text-white">
        {/* Creator Info */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-bold text-sky-300 truncate">
            @{item.creatorName || 'Rasigan Creator'}
          </div>
          {item.label && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold border border-sky-400/30">
              {item.label}
            </span>
          )}
        </div>

        {/* Clickable Title Name */}
        <button
          onClick={() => navigate(`/title/${item.slug}`)}
          className="text-left font-black text-sm text-white hover:text-sky-300 transition-colors tracking-tight leading-tight block w-full hover:underline cursor-pointer"
          title={`View details for ${item.title}`}
        >
          {item.title}
        </button>

        {/* Genres & Rating Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-medium text-gray-300">
          <span className="text-amber-400 font-bold">★ {item.editorRating ? item.editorRating.toFixed(1) : '9.1'}</span>
          <span>•</span>
          {(item.genres || []).slice(0, 2).map((g) => (
            <span key={g} className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200">
              {g}
            </span>
          ))}
        </div>

        {/* Short Synopsis */}
        {item.description && (
          <p className="text-[10px] text-gray-300 line-clamp-1 leading-tight">{item.description}</p>
        )}

        {/* Dual Call-to-Actions Bar (§C4) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleWatchFull}
            className="flex-1 py-1.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-[11px] shadow-lg shadow-sky-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Watch full movie</span>
          </button>

          {isClipMode && (
            <button
              onClick={handleWatchFromHere}
              className="py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-[11px] backdrop-blur-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Resume movie right from this highlight moment"
            >
              <span>Watch from here</span>
              <span className="text-sky-300">⏱</span>
            </button>
          )}
        </div>

        {/* Clip-Relative Progress Bar (0:00 to L) */}
        <div className="space-y-0.5 pt-1">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full transition-all duration-200"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[8px] text-gray-400 font-mono">
            <span>{formatSec(currentDisplaySec)}</span>
            <span>{formatSec(clipTotalSec)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
