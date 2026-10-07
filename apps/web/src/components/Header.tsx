import { Link, useLocation } from 'react-router-dom';
import { Search, Smartphone, Film, Tv, Video, Sparkles } from 'lucide-react';

export function Header() {
  const location = useLocation();

  const navItems = [
    { label: 'Movies', path: '/browse/movies', icon: Film },
    { label: 'Web Series', path: '/browse/web-series', icon: Tv },
    { label: 'Short Films', path: '/browse/short-films', icon: Video },
    { label: 'Vertical', path: '/reels', icon: Smartphone },
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/"
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap flex-none ${
              location.pathname === '/'
                ? 'text-white bg-sky-500/20 border border-sky-400/40 shadow-sm shadow-sky-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Home
          </Link>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-none ${
                  isActive
                    ? 'text-white bg-sky-500/20 border border-sky-400/40 shadow-sm shadow-sky-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-gray-400'}`} />}
                <span>{item.label}</span>
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
