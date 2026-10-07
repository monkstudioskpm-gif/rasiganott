import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentCat = searchParams.get('cat') || 'all';

  const navItems = [
    { id: 'all', name: 'Home', path: '/?cat=all' },
    { id: 'movies', name: 'Movies', path: '/?cat=movies' },
    { id: 'web-series', name: 'Web Series', path: '/?cat=web-series' },
    { id: 'short-films', name: 'Short Films', path: '/?cat=short-films' },
    { id: 'vertical', name: 'Vertical', path: '/reels' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo (ZETTA Style Bold Brand) */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-2xl tracking-tighter text-white font-sans">
              RASIGAN<span className="text-sky-400 font-extrabold text-2xl">.</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links (Clean plain-text pills matching user screenshot) */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isReelsPage = location.pathname === '/reels' && item.id === 'vertical';
            const isHomePage = location.pathname === '/';
            const isActive = isReelsPage || (isHomePage && (currentCat === item.id || (item.id === 'all' && (currentCat === 'all' || !currentCat))));

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap flex-none ${
                  isActive
                    ? 'text-white bg-sky-500 shadow-md shadow-sky-500/30 font-extrabold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions (ZETTA Style Search Icon & Sign In) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/search"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/5 transition-all duration-200"
            title="Search movies, series..."
          >
            <Search className="w-5 h-5 text-gray-200" />
          </Link>

          <Link
            to="/login"
            className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-all duration-300 shadow-md shadow-sky-500/30 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
