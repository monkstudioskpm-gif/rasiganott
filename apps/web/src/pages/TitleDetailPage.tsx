import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, getPersonInitials, progressApi } from '../lib/api';
import { Play, Star, Clock, Heart, ArrowLeft, Volume2, VolumeX, IndianRupee, Film, Tv, RotateCcw } from 'lucide-react';
import { Title } from '@rasigan/shared';
import { SupportModal } from '../components/SupportModal';
import { getSeasonsForTitle } from '../lib/seasons';
import { useVideoEngine } from '../features/player/useVideoEngine';
import { TitleDetailSkeleton } from '../components/Skeleton';

function TitleTrailerBanner({ trailerUrl, streamType }: { trailerUrl: string; streamType?: string }) {
  const { videoRef, isMuted, toggleMute } = useVideoEngine({
    src: trailerUrl,
    streamType: (streamType as any) || (trailerUrl.includes('.m3u8') ? 'HLS' : 'MP4'),
    autoPlay: true,
    muted: true,
  });

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d15] via-[#0b0d15]/40 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

      {/* Floating Sound Toggle Button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-md cursor-pointer pointer-events-auto"
        title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
      </button>
    </>
  );
}

export function TitleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [isSaved, setIsSaved] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const { data: homeData } = useQuery({
    queryKey: ['home'],
    queryFn: api.getHome,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['title', slug],
    queryFn: () => api.getTitleBySlug(slug || ''),
    enabled: !!slug,
  });

  const title: Title | undefined = data?.title;
  // Filter out the current movie from recommended list!
  const recommendedTitles = (homeData?.trending || []).filter(
    (item: any) => item.id !== title?.id && item.slug !== title?.slug
  );

  const [savedProgress, setSavedProgress] = useState<{ positionSec: number; durationSec: number; completed?: boolean } | null>(null);

  // Check if saved to Watchlist & fetch watch progress
  useEffect(() => {
    if (title) {
      const watchlist = JSON.parse(localStorage.getItem('rasigan_watchlist') || '[]');
      setIsSaved(watchlist.some((item: any) => item.id === title.id));

      try {
        const local = localStorage.getItem(`rasigan_watch_progress_${title.id}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.positionSec > 5 && !parsed.completed) {
            setSavedProgress(parsed);
          }
        }
      } catch {}

      progressApi.getProgress(title.id).then((res) => {
        if (res?.progress && res.progress.positionSec > 5 && !res.progress.completed) {
          setSavedProgress(res.progress);
        }
      }).catch(() => {});
    }
  }, [title]);

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleSave = () => {
    if (!title) return;
    const watchlist = JSON.parse(localStorage.getItem('rasigan_watchlist') || '[]');
    let updated;
    if (isSaved) {
      updated = watchlist.filter((item: any) => item.id !== title.id);
      setIsSaved(false);
    } else {
      updated = [
        {
          id: title.id,
          slug: title.slug,
          title: title.title,
          posterUrl: title.posterUrl,
          kind: title.kind,
          language: title.language,
          year: title.year,
          addedAt: new Date().toISOString(),
        },
        ...watchlist,
      ];
      setIsSaved(true);
    }
    localStorage.setItem('rasigan_watchlist', JSON.stringify(updated));
  };

  if (isLoading) {
    return <TitleDetailSkeleton />;
  }

  if (isError || !title) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Title Not Found</h2>
        <p className="text-gray-400 text-sm max-w-md">{error?.message || 'The requested title could not be found.'}</p>
        <Link to="/" className="px-6 py-3 bg-sky-500 text-white rounded-xl font-bold text-sm">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const trailerUrl = title.trailerUrl || title.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const seasons = getSeasonsForTitle(title);
  const selectedSeason = seasons.find((s) => s.number === selectedSeasonNumber) || seasons[0];

  const handleResumeClick = (posSec: number) => {
    if (title.orientation === 'VERTICAL') {
      navigate(`/shots?titleId=${title.id}`);
      return;
    }
    navigate(`/watch/${title.id}?t=${Math.floor(posSec)}`);
  };

  const handleStartOverClick = () => {
    try {
      localStorage.removeItem(`rasigan_watch_progress_${title.id}`);
    } catch {}
    setSavedProgress(null);
    progressApi.saveProgress({
      titleId: title.id,
      positionSec: 0,
      durationSec: title.durationMin ? title.durationMin * 60 : 600,
    });
    if (title.orientation === 'VERTICAL') {
      navigate(`/shots?titleId=${title.id}`);
      return;
    }
    navigate(`/watch/${title.id}?t=0`);
  };

  const handleWatchClick = (episodeId?: string, isTrailer = false) => {
    if (title.orientation === 'VERTICAL') {
      navigate(`/shots?titleId=${title.id}`);
      return;
    }
    if (isTrailer) {
      navigate(`/watch/${title.id}?type=trailer`);
    } else if (title.kind === 'WEB_SERIES' && episodeId) {
      navigate(`/watch/${title.id}/${episodeId}`);
    } else {
      navigate(`/watch/${title.id}`);
    }
  };

  return (
    <div className="py-4 md:py-8 px-2 sm:px-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Razorpay Creator Support Modal */}
      <SupportModal title={title} isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* Main Container Card (Exact ZETTA Middle Phone Screen Design) */}
      <div className="bg-[#0b0d15] border border-white/10 rounded-3xl overflow-hidden shadow-2xl space-y-6 text-gray-100">
        {/* 1. Backdrop Video Header with Autoplay Video Trailer & Back Arrow */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <TitleTrailerBanner trailerUrl={trailerUrl} streamType={title.streamType || undefined} />

          {/* Top Floating Controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-md pointer-events-auto cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Database Content ID Badge overlay on top of video */}
            <div className="px-2.5 py-1 rounded-xl bg-black/70 border border-white/20 backdrop-blur-md text-[10px] font-mono text-gray-300 font-medium shadow-lg max-w-[180px] truncate" title={`Content ID: ${title.id}`}>
              ID: {title.id}
            </div>

            <div className="w-10"></div>
          </div>
        </div>

        {/* 2. Content Details Section (Exact ZETTA Layout) */}
        <div className="p-6 sm:p-8 space-y-6 -mt-8 relative z-10">
          {/* Title Header & Favorite Heart Button */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">{title.title}</h1>
              {title.tagline && <p className="text-xs sm:text-sm text-rose-300 italic font-medium pt-1">{title.tagline}</p>}
            </div>

            <button
              onClick={handleToggleSave}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors flex-none shadow-md ${
                isSaved
                  ? 'bg-rose-600/30 border-rose-500 text-rose-400'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-gray-300 hover:text-rose-400'
              }`}
              title={isSaved ? 'Saved to Watchlist' : 'Save for Later'}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Metadata Chips Row: Year, Language, Certificate, Run Time, Genres, Rating */}
          <div className="flex flex-wrap items-center gap-2">
            {title.year && (
              <span className="px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-gray-200">
                {title.year}
              </span>
            )}
            {title.language && (
              <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-400/30 text-xs font-semibold text-sky-300">
                {title.language}
              </span>
            )}
            {title.ageRating && (
              <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-400/40 text-xs font-black text-purple-300 tracking-wider">
                {title.ageRating}
              </span>
            )}
            {title.durationMin && (
              <span className="px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> {title.durationMin} mins
              </span>
            )}
            {title.categories?.map((cat: any) => (
              <span key={cat.id} className="px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-gray-200">
                {cat.name}
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> {title.editorRating ? title.editorRating.toFixed(1) : '9.1'}
            </span>
          </div>

          {/* Action Buttons Row */}
          {savedProgress && savedProgress.positionSec > 5 && !savedProgress.completed ? (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Resume Watch Button */}
                <button
                  onClick={() => handleResumeClick(savedProgress.positionSec)}
                  className="h-11 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/35 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Watch ({formatDuration(savedProgress.positionSec)})</span>
                </button>

                {/* Start Over Button */}
                <button
                  onClick={handleStartOverClick}
                  className="h-11 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-gray-200 hover:text-white font-bold text-xs sm:text-sm border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  title="Restart from beginning"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Start Over</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Trailer Button */}
                <button
                  onClick={() => handleWatchClick(undefined, true)}
                  className="h-10 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-xs border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-sky-400" />
                  <span>Watch Trailer</span>
                </button>

                {/* Support Creator Button */}
                {title.fundingEnabled ? (
                  <button
                    onClick={() => setIsSupportOpen(true)}
                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Support</span>
                  </button>
                ) : (
                  <button
                    onClick={handleToggleSave}
                    className="h-10 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 font-bold text-xs border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-rose-500 fill-current' : ''}`} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Button 1: Watch Now (Blue Theme) */}
              <button
                onClick={() => handleWatchClick(selectedSeason?.episodes?.[0]?.id)}
                className="h-10 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/35 active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch Now</span>
              </button>

              {/* Button 2: Watch Trailer */}
              <button
                onClick={() => handleWatchClick(undefined, true)}
                className="h-10 px-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-sky-400" />
                <span>Trailer</span>
              </button>

              {/* Button 3: Support Creator (₹) or Save */}
              {title.fundingEnabled ? (
                <button
                  onClick={() => setIsSupportOpen(true)}
                  className="h-10 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Support</span>
                </button>
              ) : (
                <button
                  onClick={handleToggleSave}
                  className="h-10 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 font-bold text-xs border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-rose-500 fill-current' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              )}
            </div>
          )}

          {/* About Section (ZETTA Style) */}
          <div className="space-y-2 pt-2">
            <h3 className="text-base font-bold text-white tracking-tight">About</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">{title.description}</p>
          </div>

          {/* Cast Section (Avatar + Name Chips with Bio Popovers) */}
          {title?.cast && title.cast.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-white tracking-tight">Cast</h3>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {title.cast.map((c: any, idx: number) => {
                  const personObj = typeof c.person === 'object' && c.person ? c.person : null;
                  const displayName = personObj?.name || c.name || c.personName || 'Cast Member';
                  const photoUrl = personObj?.photoUrl || c.photoUrl || null;
                  const charName = c.characterName || null;
                  const personBio = personObj?.bio || c.bio || `${displayName} plays a key character in this production.`;

                  return (
                    <div
                      key={c.personId || idx}
                      onClick={() =>
                        setSelectedPerson(
                          selectedPerson?.id === (c.personId || `c-${idx}`)
                            ? null
                            : { id: c.personId || `c-${idx}`, name: displayName, photoUrl, bio: personBio }
                        )
                      }
                      className="relative flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 cursor-pointer flex-none transition-all active:scale-95 group"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-dark-card flex-none">
                        {photoUrl ? (
                          <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center border border-sky-400/40 shadow-sm">
                            {getPersonInitials(displayName)}
                          </div>
                        )}
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-xs font-semibold text-white group-hover:text-sky-300">{displayName}</p>
                        {charName && <p className="text-[10px] text-gray-400">as {charName}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bio Popover Modal / Overlay */}
              {selectedPerson && (
                <div className="mt-3 p-4 rounded-2xl bg-[#141724] border border-sky-500/30 text-left space-y-2 relative shadow-xl animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => setSelectedPerson(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-lg"
                  >
                    ✕
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-sky-400 flex-none">
                      {selectedPerson.photoUrl ? (
                        <img src={selectedPerson.photoUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center border border-sky-400/40 shadow-sm">
                          {getPersonInitials(selectedPerson.name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{selectedPerson.name}</h4>
                      <p className="text-[10px] text-sky-400 font-semibold">Cast Member</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    {selectedPerson.bio || 'No short bio available for this cast member.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Crew Section */}
          {title?.crew && title.crew.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-base font-bold text-white tracking-tight">Crew</h3>
              <div className="flex flex-wrap gap-2">
                {title.crew.map((cr: any, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-gray-300">
                    <strong className="text-gray-100">{cr.role === 'OTHER' ? (cr.customRole || 'Crew') : cr.role}:</strong> {cr.person?.name || 'Unknown'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Web Series Episodes List (if Web Series) */}
          {title.kind === 'WEB_SERIES' && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sky-400" /> Episodes
                </h3>
                {seasons.length > 1 && (
                  <select
                    value={selectedSeasonNumber}
                    onChange={(e) => setSelectedSeasonNumber(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs font-bold focus:outline-none"
                  >
                    {seasons.map((s: any) => (
                      <option key={s.id || s.number} value={s.number}>
                        Season {s.number}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2.5">
                {selectedSeason?.episodes?.map((ep: any) => (
                  <div
                    key={ep.id || ep.number}
                    onClick={() => handleWatchClick(ep.id)}
                    className="glass-card p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-sky-400/50 transition-all group gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-20 h-14 flex-none rounded-xl overflow-hidden bg-dark-card relative border border-white/10">
                        <img src={ep.thumbnailUrl || title.posterUrl} alt={ep.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 fill-current text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <h4 className="font-bold text-xs text-white truncate group-hover:text-sky-400 transition-colors">
                          E{ep.number} • {ep.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{ep.durationMin || 30} mins</p>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[11px] font-bold hover:bg-sky-500 hover:text-white transition-colors flex-none">
                      Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended For You Section (Matching ZETTA Mockup) */}
          {recommendedTitles.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">Recommended for you</h3>
                <Link to="/browse/movies" className="text-xs font-semibold text-rose-400 hover:text-rose-300">
                  See all
                </Link>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {recommendedTitles.slice(0, 5).map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/title/${item.slug}`}
                    className="flex-none w-28 space-y-1 block group"
                  >
                    <div className="aspect-poster rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform shadow-md">
                      <img src={item.verticalPosterUrl || item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-rose-400 transition-colors">
                      {item.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
