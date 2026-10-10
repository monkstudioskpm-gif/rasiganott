import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Play, Star, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { Title } from '@rasigan/shared';
import { Footer } from '../components/Footer';

export function getShortTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  const trimmed = rawTitle.trim();
  if (trimmed.includes('|')) {
    return trimmed.split('|')[0].trim();
  }
  return trimmed;
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('cat') || 'all';

  const [heroIndex, setHeroIndex] = useState<number>(0);

  // Mobile Touch Swipe States for Hero Banner Carousel
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: api.getHome,
  });

  const featured = data?.featured || [];
  const allTitles = data?.trending || [];
  const popularTitles = data?.topRated || [];
  const newReleases = data?.newReleases || [];

  const genreButtons = [
    { name: 'Action', slug: 'action' },
    { name: 'Comedy', slug: 'comedy' },
    { name: 'Romance', slug: 'romance' },
    { name: 'Horror', slug: 'horror' },
    { name: 'Thriller', slug: 'thriller' },
    { name: 'Drama', slug: 'drama' },
    { name: 'Animation', slug: 'family' },
    { name: 'Documentary', slug: 'documentary' },
  ];

  // Professional Plain Text Category Buttons (Icons/Emojis removed)
  const categoryChips = [
    { id: 'all', name: 'Home' },
    { id: 'movies', name: 'Movies' },
    { id: 'web-series', name: 'Web Series' },
    { id: 'short-films', name: 'Short Films' },
    { id: 'vertical', name: 'Vertical' },
  ];

  const handleSelectCategory = (catId: string) => {
    if (catId === 'vertical') {
      navigate('/reels');
      return;
    }
    setSearchParams({ cat: catId });
  };

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
    return titles;
  };

  const filteredFeatured = filterByCat(featured.length > 0 ? featured : allTitles);
  const heroItem = filteredFeatured.length > 0 ? filteredFeatured[heroIndex % filteredFeatured.length] : undefined;
  const secondaryHero = filteredFeatured.length > 1 ? filteredFeatured[(heroIndex + 1) % filteredFeatured.length] : heroItem;

  const popularFiltered = filterByCat(allTitles);
  const top10Filtered = filterByCat(allTitles).slice(0, 10);
  const seriesFiltered = filterByCat(newReleases);
  const recommendationsFiltered = filterByCat(popularTitles);

  const activeCategoryObj = categoryChips.find((c) => c.id === selectedCategory) || categoryChips[0];

  const handlePrevHero = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (filteredFeatured.length === 0) return;
    setHeroIndex((prev) => (prev === 0 ? filteredFeatured.length - 1 : prev - 1));
  };

  const handleNextHero = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (filteredFeatured.length === 0) return;
    setHeroIndex((prev) => (prev === filteredFeatured.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for mobile swipe gesture on Hero Banner
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 35;

    if (distance > minSwipeDistance) {
      handleNextHero();
    } else if (distance < -minSwipeDistance) {
      handlePrevHero();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-semibold tracking-wide">Loading your content...</p>
      </div>
    );
  }

  const isCategoryFiltered = selectedCategory !== 'all' && selectedCategory !== 'home';
  const hasNoContent = popularFiltered.length === 0 && top10Filtered.length === 0 && seriesFiltered.length === 0 && recommendationsFiltered.length === 0;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Main Top Hero Feature Banner with Controls High at top-4 sm:top-6 */}
      {heroItem && (
        <section className="space-y-3">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative min-h-[50vh] sm:min-h-[60vh] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl group flex items-end select-none touch-pan-y"
          >
            {/* Background Artwork */}
            <div className="absolute inset-0">
              <img
                src={heroItem.bannerUrl || heroItem.posterUrl}
                alt={heroItem.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080e] via-[#07080e]/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#07080e]/95 via-[#07080e]/40 to-transparent"></div>
            </div>

            {/* Carousel Control Arrows — Positioned high at top-4 sm:top-6 to NEVER disturb bottom title text */}
            {filteredFeatured.length > 1 && (
              <>
                <button
                  onClick={handlePrevHero}
                  className="absolute left-4 sm:left-6 top-4 sm:top-6 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-xl"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextHero}
                  className="absolute right-4 sm:right-6 top-4 sm:top-6 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-xl"
                  title="Next Slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Hero Overlay Content */}
            <div className="relative z-10 p-6 sm:p-12 space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-extrabold text-sky-300 uppercase tracking-wider">
                  Featured {activeCategoryObj.name}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md line-clamp-2" title={heroItem.title}>
                {getShortTitle(heroItem.title)}
              </h1>

              <p className="text-xs sm:text-sm text-gray-300 line-clamp-1 leading-relaxed font-normal" title={heroItem.description}>
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

          {/* Carousel Dots */}
          {filteredFeatured.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-1">
              {filteredFeatured.map((_: unknown, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`transition-all duration-300 ${
                    idx === heroIndex % filteredFeatured.length
                      ? 'w-6 h-2 rounded-full bg-sky-500'
                      : 'w-2 h-2 rounded-full bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. Horizontally Swipeable Category Selection Bar (Positioned Directly Below Hero Banner) */}
      <section className="py-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {categoryChips.map((chip) => {
            const isActive = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handleSelectCategory(chip.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-none ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 font-extrabold'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                {chip.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Empty State if category filter yields no results */}
      {hasNoContent && (
        <section className="py-16 px-6 rounded-3xl glass-panel border border-white/10 text-center space-y-4 max-w-lg mx-auto my-8">
          <h3 className="text-xl font-black text-white">No videos in "{activeCategoryObj.name}"</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            There are currently no items matching this category. Tap below to view all content.
          </p>
          <button
            onClick={() => setSearchParams({ cat: 'all' })}
            className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-500/30 transition-all active:scale-95"
          >
            Show All Content
          </button>
        </section>
      )}

      {/* 4. "Popular On Rasigan" Row */}
      {popularFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug min-w-0 pr-2">
              Popular {isCategoryFiltered ? activeCategoryObj.name : 'On Rasigan'}
            </h3>
            <Link
              to={`/browse/${selectedCategory === 'all' ? 'movies' : selectedCategory}`}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 whitespace-nowrap flex-none shrink-0 self-center border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 rounded-xl transition-all hover:bg-sky-500/20 active:scale-95"
            >
              <span>Explore all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 px-1">
            {popularFiltered.map((title) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group flex-none w-40 sm:w-52 space-y-2 block"
              >
                <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-xl border border-white/10">
                  <img src={title.verticalPosterUrl || title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
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
                  <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate" title={title.title}>
                    {getShortTitle(title.title)}
                  </h4>
                  <p className="text-xs text-gray-400">{title.language} • {title.year || 2025}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Genres Quick-Select Buttons (Sleek button capsules, no images) */}
      {!isCategoryFiltered && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">Browse Genres</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {genreButtons.map((genre) => (
              <button
                key={genre.name}
                onClick={() => setSearchParams({ cat: genre.slug })}
                className="py-3.5 px-4 rounded-2xl glass-panel border border-white/10 hover:border-sky-400/60 bg-white/[0.04] hover:bg-sky-500/15 transition-all duration-300 font-bold text-sm text-gray-200 hover:text-white flex items-center justify-center text-center shadow-lg hover:shadow-sky-500/10 active:scale-95 cursor-pointer group"
              >
                <span className="tracking-wide group-hover:scale-105 transition-transform">
                  {genre.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 6. Top 10 Ranked Row */}
      {top10Filtered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug min-w-0 pr-2">
              Top 10 {isCategoryFiltered ? activeCategoryObj.name : 'Titles'}
            </h3>
            <Link
              to={`/browse/${selectedCategory === 'all' ? 'movies' : selectedCategory}`}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 whitespace-nowrap flex-none shrink-0 self-center border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 rounded-xl transition-all hover:bg-sky-500/20 active:scale-95"
            >
              <span>Explore all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
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
                  <img src={title.verticalPosterUrl || title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight line-clamp-2" title={secondaryHero.title}>
              {getShortTitle(secondaryHero.title)}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-1 leading-relaxed" title={secondaryHero.description}>
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
              <img src={secondaryHero.verticalPosterUrl || secondaryHero.posterUrl} alt={secondaryHero.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* 8. Web Series / Series Selection Row */}
      {seriesFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug min-w-0 pr-2">
              {isCategoryFiltered ? `${activeCategoryObj.name} Selection` : 'Unrivaled Selection of Series'}
            </h3>
            <Link
              to="/browse/web-series"
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 whitespace-nowrap flex-none shrink-0 self-center border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 rounded-xl transition-all hover:bg-sky-500/20 active:scale-95"
            >
              <span>Explore all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-3 px-1">
            {seriesFiltered.map((title: Title) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group flex-none w-40 sm:w-52 space-y-2 block"
              >
                <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-xl border border-white/10">
                  <img src={title.verticalPosterUrl || title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-current" /> {title.editorRating ? title.editorRating.toFixed(1) : '8.8'}
                  </div>
                </div>

                <div className="px-1">
                  <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate" title={title.title}>
                    {getShortTitle(title.title)}
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
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug min-w-0 pr-2">
              Recommended {isCategoryFiltered ? activeCategoryObj.name : 'For You'}
            </h3>
            <Link
              to="/browse/movies"
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 whitespace-nowrap flex-none shrink-0 self-center border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 rounded-xl transition-all hover:bg-sky-500/20 active:scale-95"
            >
              <span>Explore all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recommendationsFiltered.slice(0, 10).map((title: Title) => (
              <Link
                key={title.id}
                to={`/title/${title.slug}`}
                className="group space-y-2 block"
              >
                <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-xl border border-white/10">
                  <img src={title.verticalPosterUrl || title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-current" /> {title.editorRating ? title.editorRating.toFixed(1) : '8.7'}
                  </div>
                </div>

                <div className="px-1">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate" title={title.title}>
                    {getShortTitle(title.title)}
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
