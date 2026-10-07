import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Heart, Share2, Play, Pause, Loader2, IndianRupee, Tv, Check, Film, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { Title } from '@rasigan/shared';
import { SupportModal } from '../components/SupportModal';
import { useVideoEngine } from '../features/player/useVideoEngine';

export function ReelsPage() {
  const [searchParams] = useSearchParams();
  const targetTitleId = searchParams.get('titleId');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [supportTitle, setSupportTitle] = useState<Title | null>(null);

  const [displayTitles, setDisplayTitles] = useState<Title[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['reels'],
    queryFn: () => api.getTitles({ limit: '50' }),
  });

  useEffect(() => {
    if (!data?.titles || data.titles.length === 0) return;

    const verticalOnly = data.titles.filter((t) => t.orientation === 'VERTICAL');
    const pool = [...(verticalOnly.length > 0 ? verticalOnly : data.titles)];

    let selected: Title[] = [];
    if (targetTitleId) {
      const idx = pool.findIndex((t) => t.id === targetTitleId || t.slug === targetTitleId);
      if (idx !== -1) {
        selected.push(pool[idx]);
        pool.splice(idx, 1);
      }
    }

    // Shuffle the remaining titles randomly for a fresh 10-video vertical feed
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const finalFeed = [...selected, ...shuffled].slice(0, 10);
    setDisplayTitles(finalFeed);
  }, [data, targetTitleId]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    if (height === 0) return;
    const index = Math.round(containerRef.current.scrollTop / height);
    if (index !== activeIndex && index >= 0 && index < displayTitles.length) {
      setActiveIndex(index);
    }
  };

  const toggleLike = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 text-center text-white">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Loading Vertical Video Reels...</p>
      </div>
    );
  }

  return (
    <>
      {/* Support Creator Razorpay Modal rendered at root level */}
      <SupportModal title={supportTitle} isOpen={!!supportTitle} onClose={() => setSupportTitle(null)} />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-[calc(100vh-4.5rem)] md:max-w-md md:h-[84vh] md:my-3 mx-auto overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-none md:rounded-3xl border-0 md:border md:border-white/10 glass-panel shadow-2xl relative"
      >
        {displayTitles.map((title, idx) => (
          <ReelsItem
            key={title.id}
            title={title}
            isActive={idx === activeIndex}
            isLiked={!!likedMap[title.id]}
            onToggleLike={() => toggleLike(title.id)}
            onOpenSupport={() => setSupportTitle(title)}
          />
        ))}
      </div>
    </>
  );
}

function ReelsItem({
  title,
  isActive,
  isLiked,
  onToggleLike,
  onOpenSupport,
}: {
  title: Title;
  isActive: boolean;
  isLiked: boolean;
  onToggleLike: () => void;
  onOpenSupport: () => void;
}) {
  const navigate = useNavigate();
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);
  const [selectedEpUrl, setSelectedEpUrl] = useState<string | null>(null);

  const activeVideoUrl = selectedEpUrl || title.videoUrl || title.trailerUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const {
    videoRef,
    isPlaying,
    isMuted,
    play,
    pause,
    togglePlay,
    toggleMute,
  } = useVideoEngine({
    src: activeVideoUrl,
    streamType: title.streamType || (activeVideoUrl.includes('.m3u8') ? 'HLS' : 'MP4'),
    autoPlay: isActive,
    muted: false,
  });

  useEffect(() => {
    if (isActive) {
      play();
      window.dispatchEvent(new CustomEvent('playerStateChange', { detail: { isPlaying: true } }));
    } else {
      pause();
    }
  }, [isActive, play, pause]);

  const episodes = title.seasons?.[0]?.episodes || [];

  return (
    <div className="h-full w-full snap-start snap-always relative overflow-hidden flex items-center justify-center bg-black select-none">
      {/* Top Left Back Button (Goes to Home) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate('/');
        }}
        className="absolute top-3 left-3 z-30 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all shadow-md active:scale-95 cursor-pointer"
        title="Go to Home"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Video Element connected via useVideoEngine (HLS & MP4 supported) */}
      <video
        ref={videoRef}
        loop
        playsInline
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Play/Pause Center Overlay Indicator when paused (Center mute option removed as requested) */}
      {!isPlaying && (
        <div className="absolute z-20 pointer-events-none w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-xl">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>
      )}

      {/* Compact Right Action Rail */}
      <div className="absolute right-2 bottom-12 z-20 flex flex-col items-center gap-2 text-white">
        {/* Mute/Unmute Sound Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="flex flex-col items-center gap-0.5 group"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          <div className="w-7 h-7 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 backdrop-blur-md transition-all duration-200 flex items-center justify-center group-active:scale-90">
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-sky-400" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className="text-[8px] font-bold">{isMuted ? 'Muted' : 'Sound'}</span>
        </button>

        {/* Support Creator Button (Indian Rupee Icon ₹) */}
        <button onClick={onOpenSupport} className="flex flex-col items-center gap-0.5 group">
          <div className="w-7 h-7 rounded-full bg-amber-500 border border-amber-400/50 text-white shadow-md shadow-amber-500/30 backdrop-blur-md transition-all duration-200 flex items-center justify-center group-active:scale-90 animate-pulse">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
          <span className="text-[8px] font-black text-amber-300 tracking-wider uppercase">Support</span>
        </button>

        {/* Watch Full Button */}
        <button
          onClick={() => navigate(`/title/${title.slug}`)}
          className="flex flex-col items-center gap-0.5 group"
          title="Watch Full Movie/Series"
        >
          <div className="w-7 h-7 rounded-full bg-black/50 border border-white/20 text-white hover:bg-sky-500/80 hover:border-sky-400 backdrop-blur-md transition-all duration-200 flex items-center justify-center group-active:scale-90 shadow-md">
            <Film className="w-3.5 h-3.5 text-sky-300" />
          </div>
          <span className="text-[8px] font-extrabold text-sky-300 tracking-tight">Watch full</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: title.title, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }
          }}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="w-7 h-7 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 backdrop-blur-md transition-all duration-200 flex items-center justify-center group-active:scale-90">
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[8px] font-bold">Share</span>
        </button>

        {/* Episodes Drawer Trigger Button (Series only) */}
        {title.kind === 'WEB_SERIES' && (
          <button onClick={() => setShowEpisodesDrawer(true)} className="flex flex-col items-center gap-0.5 group">
            <div className="w-7 h-7 rounded-full bg-sky-500 border border-sky-400 text-white shadow-md backdrop-blur-md flex items-center justify-center">
              <Tv className="w-3.5 h-3.5" />
            </div>
            <span className="text-[8px] font-bold text-sky-300">Episodes</span>
          </button>
        )}
      </div>

      {/* Bottom Text Overlay (Nicely positioned above bottom nav when paused) */}
      <div className="absolute bottom-4 sm:bottom-3 left-3 right-12 z-20 space-y-1 text-white">
        {/* Creator Handle */}
        <div className="text-[10px] font-semibold text-gray-300 truncate">
          @{title.creatorName || 'Rasigan Creator'}
        </div>

        {/* Clickable Title Name */}
        <button
          onClick={() => navigate(`/title/${title.slug}`)}
          className="text-left font-extrabold text-xs text-white hover:text-sky-300 transition-colors tracking-tight leading-tight block w-full hover:underline cursor-pointer"
          title={`View details for ${title.title}`}
        >
          {title.title}
        </button>

        {/* Plays & Rating */}
        <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-300">
          <span className="text-sky-300">▶ 145K Plays</span>
          <span>•</span>
          <span className="text-amber-400">⭐ {title.editorRating ? title.editorRating.toFixed(1) : '9.1'}</span>
        </div>

        {/* Short Description */}
        <p className="text-[10px] text-gray-400 line-clamp-1 leading-tight">{title.description}</p>

        {/* "See all episodes" Trigger Button for Web Series */}
        {title.kind === 'WEB_SERIES' && (
          <button
            onClick={() => setShowEpisodesDrawer(true)}
            className="w-full py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-sky-300 transition-all flex items-center justify-between mt-1"
          >
            <span className="flex items-center gap-1">
              <Tv className="w-3 h-3 text-sky-400" /> See all episodes ({episodes.length || 2} Parts)
            </span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Episodes Bottom Drawer Popup */}
      {showEpisodesDrawer && (
        <div className="absolute inset-x-0 bottom-0 z-40 bg-[#090b10]/95 border-t border-white/20 rounded-t-3xl p-4 space-y-3 backdrop-blur-xl animate-fade-in text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
              Episodes list ({title.title})
            </h4>
            <button onClick={() => setShowEpisodesDrawer(false)} className="text-xs text-gray-400 hover:text-white font-bold px-2 py-1 bg-white/10 rounded-lg">
              ✕ Close
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {(episodes.length > 0 ? episodes : [
              { number: 1, name: 'Part 1: The Beginning', videoUrl: title.videoUrl },
              { number: 2, name: 'Part 2: The Climax', videoUrl: title.trailerUrl },
            ]).map((ep: any) => (
              <button
                key={ep.number}
                onClick={() => {
                  setSelectedEpUrl(ep.videoUrl);
                  setShowEpisodesDrawer(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                  selectedEpUrl === ep.videoUrl
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200'
                }`}
              >
                <span>Part {ep.number}: {ep.name}</span>
                <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
