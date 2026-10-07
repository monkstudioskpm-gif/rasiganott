import { useState } from 'react';
import { Star, Clock, X, Heart, ArrowLeft, Play, Tv } from 'lucide-react';
import { Title } from '@rasigan/shared';
import { useNavigate } from 'react-router-dom';
import { getSeasonsForTitle } from '../lib/seasons';

interface Props {
  title: Title | null;
  onClose: () => void;
  recommendedTitles?: Title[];
  onSelectTitle?: (title: Title) => void;
}

export function TitleDetailModal({ title, onClose, recommendedTitles = [], onSelectTitle }: Props) {
  const navigate = useNavigate();
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);

  if (!title) return null;

  const seasons = getSeasonsForTitle(title);
  const selectedSeason = seasons.find((s) => s.number === selectedSeasonNumber) || seasons[0];

  // Generate cast avatar placeholders if images not provided
  const castList = title.cast && title.cast.length > 0 ? title.cast.map(c => c.person?.name || 'Cast Member') : ['Suriya Kumar', 'Nayana Roy', 'Prakash Raj', 'Vijay Sethupathi'];

  const getCastAvatar = (index: number) => {
    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    ];
    return avatars[index % avatars.length];
  };

  const handlePlayTitle = () => {
    onClose();
    if (title.kind === 'WEB_SERIES' && selectedSeason?.episodes?.[0]?.id) {
      navigate(`/watch/${title.id}/${selectedSeason.episodes[0].id}`);
    } else {
      navigate(`/watch/${title.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div
        className="relative w-full max-w-lg sm:max-w-xl min-h-screen sm:min-h-0 bg-[#0c0e17] border border-white/10 sm:rounded-3xl overflow-hidden shadow-2xl text-gray-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls (Back Button & Close Button) */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Backdrop Header with Central Circular Cyan Play Button (ZETTA Style) */}
        <div className="relative h-80 sm:h-96 w-full overflow-hidden">
          <img
            src={title.bannerUrl || title.posterUrl}
            alt={title.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e17] via-[#0c0e17]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Central Glowing Cyan Play Button (ZETTA Style) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handlePlayTitle}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white flex items-center justify-center shadow-2xl shadow-sky-500/60 transition-all duration-300 transform hover:scale-110 active:scale-95 group"
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1 group-hover:scale-105 transition-transform" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 space-y-6 -mt-6 relative z-10">
          {/* Title Header & Favorite Heart */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">{title.title}</h2>
              {title.tagline && <p className="text-xs sm:text-sm text-sky-400 font-medium pt-1">{title.tagline}</p>}
            </div>

            <button className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-300 hover:text-rose-500 flex items-center justify-center transition-colors flex-none">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* ZETTA Style Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            {title.categories?.map((cat: any) => (
              <span key={cat.id} className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-gray-200">
                {cat.name}
              </span>
            ))}
            {title.durationMin && (
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> {title.durationMin}M
              </span>
            )}
            <span className="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-bold text-sky-300 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> {title.editorRating ? title.editorRating.toFixed(1) : '8.7'}
            </span>
            <span className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-[10px] font-mono text-rose-300 font-bold" title="Database Content ID">
              ID: {title.id}
            </span>
          </div>

          {/* About Section */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white tracking-tight">About</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">{title.description}</p>
          </div>

          {/* Cast Section (Circular Avatars matching ZETTA Mockup) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white tracking-tight">Cast</h3>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {castList.map((actor: string, idx: number) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 text-center flex-none w-16">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/15 bg-dark-card shadow-md">
                    <img src={getCastAvatar(idx)} alt={actor} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] text-gray-300 font-medium line-clamp-2 leading-tight">{actor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Web Series Episodes Section (Rendered at bottom of Web Series modal) */}
          {title.kind === 'WEB_SERIES' && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sky-400" /> Episodes
                </h3>
                {seasons.length > 1 && (
                  <select
                    value={selectedSeasonNumber}
                    onChange={(e) => setSelectedSeasonNumber(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 rounded-xl bg-[#131625] border border-white/15 text-white text-xs font-bold focus:outline-none"
                  >
                    {seasons.map((s) => (
                      <option key={s.id || s.number} value={s.number}>
                        Season {s.number}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar">
                {selectedSeason?.episodes?.map((ep) => (
                  <div
                    key={ep.id || ep.number}
                    onClick={() => {
                      onClose();
                      navigate(`/watch/${title.id}/${ep.id}`);
                    }}
                    className="glass-card p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-sky-400/50 transition-all group gap-3 border border-white/5 bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-12 flex-none rounded-xl overflow-hidden bg-black relative border border-white/10">
                        <img src={ep.thumbnailUrl || title.posterUrl} alt={ep.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 fill-current text-white" />
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

          {/* Recommended For You Section (ZETTA Style) */}
          {recommendedTitles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">Recommended for you</h3>
                <span className="text-xs font-semibold text-sky-400">See all</span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {recommendedTitles.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectTitle && onSelectTitle(item)}
                    className="flex-none w-28 space-y-1 cursor-pointer group"
                  >
                    <div className="aspect-poster rounded-xl overflow-hidden glass-card group-hover:scale-105 transition-transform">
                      <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

