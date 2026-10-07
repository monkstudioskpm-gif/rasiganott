import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Play, Star, Info, ChevronRight, ChevronLeft, Film, Tv, Video, Sparkles, Smartphone, SlidersHorizontal, X, Check, ChevronUp } from 'lucide-react';
import { Title } from '@rasigan/shared';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState<boolean>(false);

  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: api.getHome,
  });

  const featured = data?.featured || [];
  const allTitles = data?.trending || [];
  const popularTitles = data?.topRated || [];
  const newReleases = data?.newReleases || [];

  const genreCards = [
    { name: 'ACTION', slug: 'action', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80' },
    { name: 'COMEDY', slug: 'comedy', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
    { name: 'ROMANCE', slug: 'romance', image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&auto=format&fit=crop&q=80' },
    { name: 'HORROR', slug: 'horror', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80' },
    { name: 'ANIMATION', slug: 'family', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80' },
    { name: 'DOCUMENTARY', slug: 'documentary', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&auto=format&fit=crop&q=80' },
  ];

  const categoryChips = [
    { id: 'all', name: 'Home / All', icon: Sparkles },
    { id: 'movies', name: 'Movies', icon: Film },
    { id: 'web-series', name: 'Web Series', icon: Tv },
    { id: 'short-films', name: 'Short Films', icon: Video },
    { id: 'vertical', name: 'Vertical Reels', icon: Smartphone },
    { id: 'action', name: 'Action', icon: Sparkles },
    { id: 'thriller', name: 'Thriller', icon: Sparkles },
    { id: 'romance', name: 'Romance', icon: Sparkles },
    { id: 'comedy', name: 'Comedy', icon: Sparkles },
    { id: 'horror', name: 'Horror', icon: Sparkles },
  ];

  const filterByCat = (titles: Title[]) => {
    if (!selectedCategory || selectedCategory === 'all' || selectedCategory === 'home') {
      return titles;
    }
    if (selectedCategory === 'movies') {
      return titles.filter((t) => t.kind === 'MOVIE');
    }
    if (selectedCategory === 'web-series') {
      return titles.filter((t) => t.kind === 'WEB_SERIES');
    }
    if (selectedCategory === 'short-films') {
      return titles.filter((t) => t.kind === 'SHORT_FILM');
    }
    if (selectedCategory === 'vertical') {
      return titles.filter((t) => t.orientation === 'VERTICAL');
    }
    return titles.filter((t) =>
      t.categories?.some((c: any) => c.slug === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()) ||
      t.kind?.toLowerCase() === selectedCategory.toLowerCase()
    );
  };

  const filteredFeatured = filterByCat(featured.length > 0 ? featured : allTitles);
  const heroItem = filteredFeatured.length > 0 ? filteredFeatured[heroIndex % filteredFeatured.length] : undefined;
  const secondaryHero = filteredFeatured.length > 1 ? filteredFeatured[(heroIndex + 1) % filteredFeatured.length] : heroItem;

  const popularFiltered = filterByCat(allTitles);
  const top10Filtered = filterByCat(allTitles).slice(0, 10);
  const seriesFiltered = filterByCat(newReleases);
  const recommendationsFiltered = filterByCat(popularTitles);

  const activeCategoryObj = categoryChips.find((c) => c.id === selectedCategory) || categoryChips[0];

  const handlePrevHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filteredFeatured.length === 0) return;
    setHeroIndex((prev) => (prev === 0 ? filteredFeatured.length - 1 : prev - 1));
  };

  const handleNextHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filteredFeatured.length === 0) return;
    setHeroIndex((prev) => (prev === filteredFeatured.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-semibold tracking-wide">Loading Rasigan Experience...</p>
      </div>
    );
  }

  const isCategoryFiltered = selectedCategory !== 'all' && selectedCategory !== 'home';
  const hasNoContent = popularFiltered.length === 0 && top10Filtered.length === 0 && seriesFiltered.length === 0 && recommendationsFiltered.length === 0;

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Desktop & Mobile Category Selection Header Bar */}
      <section className="space-y-3">
        {/* Desktop Chips (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categoryChips.map((chip) => {
            const isActive = selectedCategory === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{chip.name}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Header Category Selector Trigger Bar */}
        <div className="flex sm:hidden items-center justify-between p-3 rounded-2xl glass-panel border border-white/10 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Filter:</span>
            <span className="px-3 py-1 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-extrabold text-sky-300">
              {activeCategoryObj.name}
            </span>
          </div>

          <button
            onClick={() => setShowCategoryDrawer(true)}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/30 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Select Category ▾</span>
          </button>
        </div>
      </section>

      {/* Mobile Floating Category Selector Button (Bottom Right) */}
      <button
        onClick={() => setShowCategoryDrawer(true)}
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-2xl shadow-sky-500/50 border border-white/20 active:scale-95 transition-all"
        title="Choose Content Category"
      >
        <SlidersHorizontal className="w-4 h-4 text-white" />
        <span>Category: {activeCategoryObj.name}</span>
        <ChevronUp className="w-4 h-4 text-sky-200" />
      </button>

      {/* Mobile Category Selection Pop-up Drawer Sheet */}
      {showCategoryDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowCategoryDrawer(false)}
        >
          <div
            className="w-full sm:max-w-md bg-[#0d0f1a] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl text-white animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" /> Choose Category
                </h3>
                <p className="text-[11px] text-gray-400">Filters all video content on home screen</p>
              </div>

              <button
                onClick={() => setShowCategoryDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto no-scrollbar py-1">
              {categoryChips.map((chip) => {
                const isActive = selectedCategory === chip.id;
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.id}
                    onClick={() => {
                      setSelectedCategory(chip.id);
                      setShowCategoryDrawer(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-md shadow-sky-500/20'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-gray-400'}`} />
                      <span className="truncate">{chip.name}</span>
                    </div>

                    {isActive && <Check className="w-4 h-4 text-sky-400 flex-none ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Top Hero Feature Banner */}
      {heroItem && (
        <section className="space-y-3">
          <div className="relative min-h-[50vh] sm:min-h-[60vh] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl group flex items-end">
            <div className="absolute inset-0">
              <img
                src={heroItem.bannerUrl || heroItem.posterUrl}
                alt={heroItem.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080e] via-[#07080e]/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#07080e]/95 via-[#07080e]/40 to-transparent"></div>
            </div>

            {filteredFeatured.length > 1 && (
              <>
                <button
                  onClick={handlePrevHero}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-xl"
                  title="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextHero}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-xl"
                  title="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="relative z-10 p-6 sm:p-12 space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-extrabold text-sky-300 uppercase tracking-wider">
                  Featured {activeCategoryObj.name}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">{heroItem.title}</h1>

              <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 leading-relaxed font-normal">
                {heroItem.description}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> IMDb {heroItem.editorRating ? heroItem.editorRating.toFixed(1) : '9.1'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-gray-200">
                  {heroItem.year || 2025}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-sky-300">
                  {heroItem.categories?.map((c: any) => c.name).join(', ') || heroItem.kind}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => navigate(`/watch/${heroItem.id}`)}
                  className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-sky-500/30 flex items-center gap-2 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Now
                </button>

                <button
                  onClick={() => navigate(`/title/${heroItem.slug}`)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-md"
                >
                  <Info className="w-4 h-4 text-sky-400" /> Details
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Empty State if category filter yields no results */}
      {hasNoContent && (
        <section className="py-16 px-6 rounded-3xl glass-panel border border-white/10 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">No videos in "{activeCategoryObj.name}"</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            There are currently no items matching this category. Tap below to view all content.
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-500/30 transition-all active:scale-95"
          >
            Show All Content
          </button>
        </section>
      )}

      {/* 4. "Popular On Rasigan" Row */}
      {popularFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Popular {isCategoryFiltered ? activeCategoryObj.name : 'On Rasigan'}
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{popularFiltered.length} titles</span>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 px-1">
            {popularFiltered.map((title) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group flex-none w-40 sm:w-52 space-y-2 block"
              >
                <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-xl border border-white/10">
                  <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-current" /> {title.editorRating ? title.editorRating.toFixed(1) : '9.1'}
                  </div>
                </div>

                <div className="px-1 space-y-0.5">
                  <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate">
                    {title.title}
                  </h4>
                  <p className="text-xs text-gray-400">{title.language} • {title.year || 2025}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Genres Quick-Select Grid */}
      {!isCategoryFiltered && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight">Browse Genres</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {genreCards.map((genre) => (
              <button
                key={genre.name}
                onClick={() => setSelectedCategory(genre.slug)}
                className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden glass-panel border border-white/10 group cursor-pointer shadow-lg"
              >
                <img src={genre.image} alt={genre.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-sky-900/60 transition-colors flex items-center justify-center p-2 text-center">
                  <span className="font-black text-xs sm:text-sm tracking-wider text-white drop-shadow-md">
                    {genre.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 6. Top 10 Ranked Row */}
      {top10Filtered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Top 10 {isCategoryFiltered ? activeCategoryObj.name : 'Titles'}
            </h3>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 px-2">
            {top10Filtered.map((title: Title, index: number) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group flex-none flex items-center gap-2 block"
              >
                <span className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-200 via-gray-500 to-gray-800 -mr-4 select-none drop-shadow-2xl">
                  {index + 1}
                </span>

                <div className="relative w-36 sm:w-44 aspect-poster rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform duration-300 shadow-2xl flex-none border border-white/10">
                  <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-current" /> {title.editorRating ? title.editorRating.toFixed(1) : '9.0'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Secondary Hero Highlight */}
      {secondaryHero && !hasNoContent && (
        <section className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0">
            <img src={secondaryHero.bannerUrl || secondaryHero.posterUrl} alt={secondaryHero.title} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080e] via-[#07080e]/90 to-transparent"></div>
          </div>

          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-bold text-sky-300 uppercase tracking-wider">
              Featured Highlight
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{secondaryHero.title}</h2>
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 leading-relaxed">
              {secondaryHero.description}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/watch/${secondaryHero.id}`)}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-sky-500/30 flex items-center gap-2 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> Play
              </button>

              <button
                onClick={() => navigate(`/title/${secondaryHero.slug}`)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-md"
              >
                <Info className="w-4 h-4 text-sky-400" /> View Info
              </button>
            </div>
          </div>

          <div className="relative z-10 hidden sm:flex gap-3 flex-none">
            <div className="w-36 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/15 glass-card">
              <img src={secondaryHero.posterUrl} alt={secondaryHero.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* 8. Web Series / Series Selection Row */}
      {seriesFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {isCategoryFiltered ? `${activeCategoryObj.name} Selection` : 'Unrivaled Selection of Series'}
            </h3>
          </div>

          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-3 px-1">
            {seriesFiltered.map((title: Title) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group flex-none w-40 sm:w-52 space-y-2 block"
              >
                <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-xl border border-white/10">
                  <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-current" /> {title.editorRating ? title.editorRating.toFixed(1) : '8.8'}
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
        </section>
      )}

      {/* 9. Personalized Recommendations Grid */}
      {recommendationsFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Recommended {isCategoryFiltered ? activeCategoryObj.name : 'For You'}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recommendationsFiltered.slice(0, 10).map((title: Title) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group space-y-2 block"
              >
                <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-xl border border-white/10">
                  <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-current" /> {title.editorRating ? title.editorRating.toFixed(1) : '8.7'}
                  </div>
                </div>

                <div className="px-1">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate">
                    {title.title}
                  </h4>
                  <p className="text-[11px] text-gray-400">{title.language} • {title.year || 2025}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
