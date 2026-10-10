import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Search, Star, X, Sparkles, Clock, TrendingUp, Play, Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getShortTitle } from './HomePage';
import { Title } from '@rasigan/shared';
import { GridCatalogSkeleton } from '../components/Skeleton';

const TRENDING_SEARCH_TAGS = [
  'Kodi Melam',
  'Double Meaning',
  'No Sudu No Soranai',
  'Cupice Productions',
  'Action',
  'Comedy',
  'Short Films',
  'Web Series',
];

const GENRE_TAGS = [
  { name: 'Action', slug: 'action' },
  { name: 'Comedy', slug: 'comedy' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Thriller', slug: 'thriller' },
  { name: 'Horror', slug: 'horror' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'ALL' | 'MOVIE' | 'WEB_SERIES' | 'SHORT_FILM'>('ALL');
  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  // Load user watch history from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rasigan_watch_history') || '[]');
      if (Array.isArray(saved)) {
        setWatchHistory(saved);
      }
    } catch {
      setWatchHistory([]);
    }
  }, []);

  // Live Search Query
  const { data: searchData, isLoading: isSearching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.getTitles({ q: query, limit: '50' }),
    enabled: query.trim().length > 0,
  });

  // Recommended Content for Initial (Empty query) State
  const { data: catalogData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['search-recommended'],
    queryFn: () => api.getTitles({ limit: '20' }),
    enabled: query.trim().length === 0,
  });

  const searchResults = (searchData?.titles || []).filter((title) => {
    if (selectedFormat === 'ALL') return true;
    return title.kind === selectedFormat;
  });

  const recommendedTitles: Title[] = catalogData?.titles || [];

  return (
    <div className="space-y-10 pb-24 md:pb-16 max-w-6xl mx-auto px-2 sm:px-4">
      {/* 1. Centered Header & Unique Search Input Box */}
      <div className="flex flex-col items-center text-center space-y-5 pt-4 sm:pt-8 max-w-2xl mx-auto">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Rasigan Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Search Catalog
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Find independent movies, web series, short films, and creators
          </p>
        </div>

        {/* Unique Glowing Centered Search Bar */}
        <div className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-3xl blur opacity-30 group-focus-within:opacity-80 transition duration-500"></div>
          <div className="relative flex items-center bg-[#0d101d] border border-white/15 group-focus-within:border-sky-400/80 rounded-2xl sm:rounded-3xl shadow-2xl transition-all">
            <Search className="w-5 h-5 ml-4 sm:ml-5 text-gray-400 group-focus-within:text-sky-400 transition-colors flex-none" />
            <input
              type="text"
              placeholder="Search by title, director, actors, genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3.5 sm:py-4 bg-transparent text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none"
              autoFocus
            />
            {query.trim().length > 0 && (
              <button
                onClick={() => setQuery('')}
                className="mr-3 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Format Filter Capsules */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {[
            { id: 'ALL', label: 'All Content' },
            { id: 'MOVIE', label: 'Movies' },
            { id: 'WEB_SERIES', label: 'Web Series' },
            { id: 'SHORT_FILM', label: 'Short Films' },
          ].map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFormat === fmt.id
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/10'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. LIVE SEARCH RESULTS (When query is typed) */}
      {query.trim().length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Search Results {searchResults.length > 0 && <span className="text-sky-400 text-sm">({searchResults.length})</span>}
            </h2>
            <button onClick={() => setQuery('')} className="text-xs font-semibold text-gray-400 hover:text-sky-300">
              Clear Search
            </button>
          </div>

          {isSearching && <GridCatalogSkeleton count={5} />}

          {!isSearching && searchResults.length === 0 && (
            <div className="min-h-[35vh] flex flex-col items-center justify-center text-center p-8 space-y-3 glass-panel rounded-3xl border border-white/10 max-w-xl mx-auto">
              <Search className="w-10 h-10 text-gray-500" />
              <h3 className="text-base font-bold text-white">No results found for "{query}"</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Try searching with alternate spellings, or click one of the trending search tags below:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {TRENDING_SEARCH_TAGS.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold hover:bg-sky-500/20"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {searchResults.map((title) => (
                <Link key={title.id} to={`/title/${title.slug}`} className="group space-y-2 block">
                  <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-lg border border-white/10">
                    <img
                      src={title.verticalPosterUrl || title.posterUrl}
                      alt={title.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1 text-[11px] font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{title.editorRating ? title.editorRating.toFixed(1) : '8.8'}</span>
                    </div>
                  </div>
                  <div className="px-1 space-y-0.5">
                    <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate" title={title.title}>
                      {getShortTitle(title.title)}
                    </h4>
                    <p className="text-xs text-gray-400">{title.language} • {title.year || 2025}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. POPULAR & RECOMMENDED CONTENT (When search input is empty) */}
      {query.trim().length === 0 && (
        <div className="space-y-10">
          {/* Trending Searches Quick Tags */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Trending Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* User Watch History (Continue Watching / Watched Recently) */}
          {watchHistory.length > 0 && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>Continue Watching (From Your History)</span>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('rasigan_watch_history');
                    setWatchHistory([]);
                  }}
                  className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {watchHistory.map((item) => (
                  <Link
                    key={item.id}
                    to={`/title/${item.slug}`}
                    className="flex-none w-36 sm:w-44 space-y-2 group block"
                  >
                    <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform duration-300 shadow-md border border-white/10">
                      <img
                        src={item.verticalPosterUrl || item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-1 space-y-0.5">
                      <h4 className="font-bold text-xs text-gray-200 group-hover:text-sky-400 transition-colors truncate" title={item.title}>
                        {getShortTitle(item.title)}
                      </h4>
                      <p className="text-[10px] text-gray-400">{item.language || 'Tamil'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Content Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Recommended For You</span>
              </div>
              <Link to="/browse/movies" className="text-xs font-bold text-sky-400 hover:text-sky-300">
                Explore All →
              </Link>
            </div>

            {isCatalogLoading ? (
              <GridCatalogSkeleton count={10} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {recommendedTitles.slice(0, 10).map((title) => (
                  <Link key={title.id} to={`/title/${title.slug}`} className="group space-y-2 block">
                    <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-lg border border-white/10">
                      <img
                        src={title.verticalPosterUrl || title.posterUrl}
                        alt={title.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1 text-[11px] font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{title.editorRating ? title.editorRating.toFixed(1) : '8.8'}</span>
                      </div>
                    </div>
                    <div className="px-1 space-y-0.5">
                      <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate" title={title.title}>
                        {getShortTitle(title.title)}
                      </h4>
                      <p className="text-xs text-gray-400">{title.language} • {title.year || 2025}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Browse Categories Quick Grid */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Browse By Genre</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {GENRE_TAGS.map((genre) => (
                <button
                  key={genre.name}
                  onClick={() => navigate(`/browse/${genre.slug}`)}
                  className="py-3 px-3 rounded-2xl glass-panel border border-white/10 hover:border-sky-400/50 hover:bg-sky-500/15 bg-white/[0.03] text-gray-300 hover:text-white font-bold text-xs sm:text-sm text-center transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
