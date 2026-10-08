import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoEngine } from './useVideoEngine';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Settings, ArrowLeft, Gauge, IndianRupee, Heart, Tv, X } from 'lucide-react';
import { SupportModal } from '../../components/SupportModal';
import { Title } from '@rasigan/shared';

interface Props {
  videoUrl: string;
  streamType?: 'HLS' | 'MP4' | 'DASH' | null;
  titleName: string;
  subtitleLabel?: string;
  titleObj?: Title | null;
  onBack?: () => void;
}

export function LandscapePlayer({ videoUrl, streamType = 'HLS', titleName, subtitleLabel, titleObj, onBack }: Props) {
  const navigate = useNavigate();
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEpisodesMenu, setShowEpisodesMenu] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [dismissSupportPopup, setDismissSupportPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'quality' | 'speed'>('quality');
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    videoRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    bufferedEnd,
    qualities,
    currentQualityIndex,
    playbackSpeed,
    isBuffering,
    error,
    isBunnyStream,
    togglePlay,
    seek,
    skip,
    toggleMute,
    setQuality,
    setPlaybackSpeed,
  } = useVideoEngine({
    src: videoUrl,
    streamType,
    autoPlay: true,
  });

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSettingsMenu(false);
        setShowEpisodesMenu(false);
      }, 2000);
    }
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('playerStateChange', { detail: { isPlaying } }));
    return () => {
      window.dispatchEvent(new CustomEvent('playerStateChange', { detail: { isPlaying: false } }));
    };
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFullscreenToggle = async () => {
    const video = videoRef.current as any;
    const elem = playerContainerRef.current as any;
    const doc = document as any;

    // Check iOS Safari native video fullscreen support first
    if (video && typeof video.webkitEnterFullscreen === 'function') {
      try {
        video.webkitEnterFullscreen();
        return;
      } catch (e) {
        console.warn('WebKit video fullscreen error:', e);
      }
    }

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }

        // Lock screen orientation to landscape on mobile
        const orientation = screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
        if (orientation && 'lock' in orientation) {
          await (orientation as any).lock('landscape').catch((err: any) => console.log('Orientation lock:', err));
        }
      } catch (e) {
        console.warn('Fullscreen error:', e);
      }
    } else {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen().catch(() => {});
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen().catch(() => {});
      }
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft' || e.key === 'j') {
        skip(-10);
      } else if (e.code === 'ArrowRight' || e.key === 'l') {
        skip(10);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFullscreenToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, toggleMute]);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const episodesList = titleObj?.seasons?.[0]?.episodes || [];

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full min-h-[70vh] md:min-h-[85vh] bg-black overflow-hidden flex items-center justify-center select-none group"
    >
      {/* Support Creator Razorpay Modal */}
      {titleObj && (
        <SupportModal title={titleObj} isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Buffering Spinner Overlay (Sleek minimalist loader without text) */}
      {isBuffering && (
        <div className="absolute z-30 flex items-center justify-center p-3.5 rounded-full bg-black/60 backdrop-blur-md border border-sky-400/30 shadow-2xl shadow-sky-500/20 animate-pulse">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-sky-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 border-r-sky-400 animate-spin"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></div>
          </div>
        </div>
      )}

      {/* Fatal Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center space-y-4">
          <p className="text-rose-400 font-bold text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm"
          >
            Retry Stream
          </button>
        </div>
      )}

      {/* PAUSE CREATOR SUPPORT OVERLAY POPUP (Appears when video is PAUSED, centered above timeline) */}
      {!isPlaying && !isBuffering && !dismissSupportPopup && (
        <div className="absolute bottom-24 sm:bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-xs sm:max-w-sm w-[90%] sm:w-auto glass-panel border border-amber-500/40 p-2.5 sm:p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-fade-in bg-black/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-none">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white leading-tight">Do you like this content?</span>
              <span className="text-[11px] font-semibold text-amber-400 leading-tight">Support the creator</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-none">
            <button
              onClick={() => setShowSupportModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-md shadow-amber-500/30 transition-transform active:scale-95 whitespace-nowrap"
            >
              <IndianRupee className="w-3.5 h-3.5" /> Support
            </button>
            <button
              onClick={() => setDismissSupportPopup(true)}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Player Controls Overlay */}
      <div
        className={`absolute inset-0 z-20 flex flex-col justify-between p-4 pb-20 md:p-6 md:pb-6 bg-black/60 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-white hover:text-sky-400 transition-colors p-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-bold tracking-tight">{titleName}</span>
              {subtitleLabel && <span className="text-xs text-gray-400 font-medium">({subtitleLabel})</span>}
            </button>
            {isBunnyStream && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold backdrop-blur-md shadow-sm">
                <span>🐰</span> Bunny Stream HLS
              </span>
            )}
          </div>

          <button
            onClick={handleFullscreenToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/30 transition-transform active:scale-95 sm:hidden"
            title="Rotate & Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5" /> Fullscreen
          </button>
        </div>

        {/* Center Compact Glass Play/Pause & Skip Buttons (Absolute Centering) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center gap-6 pointer-events-auto">
          <button
            onClick={() => skip(-10)}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105 active:scale-90"
            title="Rewind 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/25 backdrop-blur-md flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skip(10)}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105 active:scale-90"
            title="Forward 10s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Bar: Timeline Seek & Controls */}
        <div className="space-y-2">
          {/* Progress Seek Bar */}
          <div className="relative group/seek flex items-center h-4 cursor-pointer">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative group-hover/seek:h-2 transition-all">
              <div
                className="absolute top-0 bottom-0 left-0 bg-white/40"
                style={{ width: `${(bufferedEnd / (duration || 1)) * 100}%` }}
              ></div>
              <div
                className="absolute top-0 bottom-0 left-0 bg-sky-500"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              ></div>
            </div>

            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Episodes Drawer Button for Web Series */}
              {(titleObj?.kind === 'WEB_SERIES' || episodesList.length > 0) && (
                <button
                  onClick={() => {
                    setShowEpisodesMenu(!showEpisodesMenu);
                    setShowSettingsMenu(false);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/40 border border-sky-400/40 text-sky-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  title="See All Episodes"
                >
                  <Tv className="w-3.5 h-3.5" /> Episodes
                </button>
              )}

              <button onClick={toggleMute} className="p-1.5 text-gray-300 hover:text-white transition-colors" title="Mute/Unmute">
                {isMuted ? <VolumeX className="w-4 h-4 text-sky-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowEpisodesMenu(false);
                }}
                className="p-1.5 text-gray-300 hover:text-sky-400 transition-colors relative"
                title="Settings (Quality & Speed)"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={handleFullscreenToggle}
                className="p-1.5 text-gray-300 hover:text-white transition-colors"
                title="Fullscreen / Auto Rotate"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Menu Popup (Positioned directly above bottom controls) */}
      {showSettingsMenu && (
        <div className="absolute bottom-24 md:bottom-16 right-3 sm:right-6 z-40 w-60 sm:w-64 max-h-[60vh] overflow-y-auto bg-dark-card/95 border border-white/15 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl space-y-3 animate-fade-in text-gray-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('quality')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                activeTab === 'quality'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Quality
            </button>
            <button
              onClick={() => setActiveTab('speed')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                activeTab === 'speed'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" /> Speed
            </button>
          </div>

          {activeTab === 'quality' && (
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setQuality(-1)}
                className={`w-full text-left px-3.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                  currentQualityIndex === -1
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                    : 'hover:bg-white/5 text-gray-300 font-medium'
                }`}
              >
                <span>Auto</span>
                {currentQualityIndex === -1 && <span className="text-sky-400 font-bold">✓</span>}
              </button>

              {qualities.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setQuality(q.id)}
                  className={`w-full text-left px-3.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                    currentQualityIndex === q.id
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                      : 'hover:bg-white/5 text-gray-300 font-medium'
                  }`}
                >
                  <span>{q.label}</span>
                  {currentQualityIndex === q.id && <span className="text-sky-400 font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'speed' && (
            <div className="space-y-1 text-xs">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`w-full text-left px-3.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                    playbackSpeed === spd
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                      : 'hover:bg-white/5 text-gray-300 font-medium'
                  }`}
                >
                  <span>{spd}x</span>
                  {playbackSpeed === spd && <span className="text-sky-400 font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Episodes Menu Popup for Web Series (Positioned directly above bottom controls) */}
      {showEpisodesMenu && (
        <div className="absolute bottom-24 md:bottom-16 right-6 sm:right-16 z-40 w-72 bg-[#090b10]/95 border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3 animate-fade-in text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" /> Episodes List
            </h4>
            <button onClick={() => setShowEpisodesMenu(false)} className="text-xs text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar text-xs">
            {(episodesList.length > 0 ? episodesList : [
              { number: 1, name: 'Episode 1: Roommate Blues', videoUrl: titleObj?.videoUrl || videoUrl },
              { number: 2, name: 'Episode 2: The Pitch', videoUrl: titleObj?.trailerUrl || videoUrl },
            ]).map((ep: any) => (
              <button
                key={ep.number}
                onClick={() => {
                  if (titleObj?.id && ep.id) {
                    navigate(`/watch/${titleObj.id}/${ep.id}`);
                  }
                  setShowEpisodesMenu(false);
                }}
                className="w-full p-2 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 text-left flex items-center justify-between font-medium transition-all group"
              >
                <span className="truncate">E{ep.number} • {ep.name}</span>
                <Play className="w-3.5 h-3.5 text-sky-400 fill-current flex-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
