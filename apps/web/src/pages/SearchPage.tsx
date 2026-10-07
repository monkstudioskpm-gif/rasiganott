import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Search, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SearchPage() {
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.getTitles({ q: query, limit: '50' }),
    enabled: query.trim().length > 0,
  });

  const titles = data?.titles || [];

  return (
    <div className="space-y-8 pb-24 md:pb-12 max-w-7xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Search Catalog</h1>
        <div className="relative max-w-2xl">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search titles, cast names, genres..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-400 text-base focus:outline-none focus:border-sky-500/60 focus:bg-white/[0.08] transition-all"
            autoFocus
          />
        </div>
      </div>

      {isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-center text-white">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Searching catalog...</p>
        </div>
      )}

      {!isLoading && query.trim() && titles.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-3 glass-panel rounded-3xl">
          <h3 className="text-lg font-bold text-white">No Results for "{query}"</h3>
          <p className="text-xs text-gray-400">Try searching for a different movie, short film, or actor.</p>
        </div>
      )}

      {!isLoading && titles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {titles.map((title) => (
            <Link key={title.id} to={`/title/${title.slug}`} className="group space-y-2 block">
              <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-lg">
                <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{title.editorRating ? title.editorRating.toFixed(1) : '8.8'}</span>
                </div>
              </div>
              <div className="px-1">
                <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate">
                  {title.title}
                </h4>
                <p className="text-xs text-gray-400">{title.language}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
