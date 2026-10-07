import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Shield, ChevronDown, Plus, Users, Wallet, Tag, LayoutDashboard } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentCat = searchParams.get('cat') || 'all';
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check local storage for active role (set via login or admin toggle)
    const role = localStorage.getItem('user_role');
    setUserRole(role);

    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [location.pathname]);

  const navItems = [
    { id: 'all', name: 'Home', path: '/?cat=all' },
    { id: 'movies', name: 'Movies', path: '/?cat=movies' },
    { id: 'web-series', name: 'Web Series', path: '/?cat=web-series' },
    { id: 'short-films', name: 'Short Films', path: '/?cat=short-films' },
    { id: 'vertical', name: 'Vertical', path: '/reels' },
  ];

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/creator');
  const showAdminControls = userRole === 'ADMIN' || userRole === 'CREATOR' || isAdminRoute;

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

        {/* Actions (Search, Admin/Creator menu when active, & Sign In) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/search"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/5 transition-all duration-200"
            title="Search movies, series..."
          >
            <Search className="w-5 h-5 text-gray-200" />
          </Link>

          {/* Admin / Creator Menu Dropdown (Only rendered if logged in as Admin/Creator or on admin route) */}
          {showAdminControls && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Menu</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAdminMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Admin Tools
                  </div>

                  <Link
                    to="/admin"
                    onClick={() => setIsAdminMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-sky-400 font-bold hover:bg-white/10 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-sky-400" />
                    <span>Admin Dashboard</span>
                  </Link>

                  <Link
                    to="/admin/titles/new"
                    onClick={() => setIsAdminMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-sky-400" />
                    <span>＋ Add Content</span>
                  </Link>

                  <Link
                    to="/admin/people"
                    onClick={() => setIsAdminMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Cast & Crew</span>
                  </Link>

                  <Link
                    to="/admin/genres"
                    onClick={() => setIsAdminMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>Genres & Tags</span>
                  </Link>

                  <div className="px-3 py-1.5 border-t border-white/10 text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">
                    Creator Tools
                  </div>

                  <Link
                    to="/creator"
                    onClick={() => setIsAdminMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-emerald-400 hover:bg-white/10 transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Earnings Dashboard</span>
                  </Link>
                </div>
              )}
            </div>
          )}

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

