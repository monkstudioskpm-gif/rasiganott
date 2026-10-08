import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Star, Loader2 } from 'lucide-react';
import { Kind } from '@rasigan/shared';

export function BrowsePage() {
  const { kind } = useParams<{ kind: string }>();
  const [selectedFormat, setSelectedFormat] = useState<'ALL' | 'LANDSCAPE' | 'VERTICAL'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'title'>('newest');

  // Convert route param to Kind enum
  let mappedKind: Kind | undefined;
  if (kind === 'movies') mappedKind = 'MOVIE';
  if (kind === 'short-films') mappedKind = 'SHORT_FILM';
  if (kind === 'web-series') mappedKind = 'WEB_SERIES';

  const { data, isLoading } = useQuery({
    queryKey: ['browse', kind, selectedFormat, sortBy],
    queryFn: () => {
      const params: Record<string, string> = { sort: sortBy, limit: '50' };
      if (mappedKind) params.kind = mappedKind;
      if (selectedFormat !== 'ALL') params.orientation = selectedFormat;
      return api.getTitles(params);
    },
  });

  const titles = data?.titles || [];

  return (
    <div className="space-y-8 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight capitalize">
            {kind?.replace('-', ' ')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">Explore published {kind?.replace('-', ' ')} catalog</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
            {(['ALL', 'LANDSCAPE', 'VERTICAL'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFormat === fmt ? 'bg-sky-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-dark-card border border-white/15 text-white text-xs font-bold focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
            <option value="title">A - Z</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-center text-white">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Fetching titles...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && titles.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-3 glass-panel rounded-3xl">
          <h3 className="text-lg font-bold text-white">No Titles Found</h3>
          <p className="text-xs text-gray-400 max-w-sm">No titles match the selected category or filter options.</p>
        </div>
      )}

      {/* Grid of Titles */}
      {!isLoading && titles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {titles.map((title) => (
            <Link
              key={title.id}
              to={`/title/${title.slug}`}
              className="group space-y-2 block"
            >
              <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-lg">
                <img src={title.verticalPosterUrl || title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{title.editorRating ? title.editorRating.toFixed(1) : '8.8'}</span>
                </div>
              </div>

              <div className="px-1">
                <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate">
                  {title.title}
                </h4>
                <p className="text-xs text-gray-400">{title.language} • {title.year || 2025}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
