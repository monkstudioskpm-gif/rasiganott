import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Shield, Wallet, User as UserIcon } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentCat = searchParams.get('cat') || 'all';
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check local storage for active role and user profile
    const role = localStorage.getItem('user_role');
    setUserRole(role);
    try {
      const stored = localStorage.getItem('rasigan_user');
      setCurrentUser(stored ? JSON.parse(stored) : null);
    } catch {}
  }, [location.pathname]);

  const navItems = [
    { id: 'all', name: 'Home', path: '/?cat=all' },
    { id: 'movies', name: 'Movies', path: '/?cat=movies' },
    { id: 'web-series', name: 'Web Series', path: '/?cat=web-series' },
    { id: 'short-films', name: 'Short Films', path: '/?cat=short-films' },
    { id: 'shots', name: 'Shots', path: '/shots' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
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
            const isShotsPage = (location.pathname === '/shots' || location.pathname === '/reels') && item.id === 'shots';
            const isHomePage = location.pathname === '/';
            const isActive = isShotsPage || (isHomePage && (currentCat === item.id || (item.id === 'all' && (currentCat === 'all' || !currentCat))));

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

        {/* Actions (Search, Role Shortcuts, & User Profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/search"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/5 transition-all duration-200"
            title="Search movies, series..."
          >
            <Search className="w-5 h-5 text-gray-200" />
          </Link>

          {/* Creator Studio Link (Automatically detected for CREATOR role) */}
          {userRole === 'CREATOR' && (
            <Link
              to="/creator"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold shadow-sm shadow-emerald-500/20 transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Creator Studio</span>
            </Link>
          )}

          {/* Admin Panel Link (Automatically detected for ADMIN role) */}
          {userRole === 'ADMIN' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 text-xs font-extrabold shadow-sm shadow-sky-500/20 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* Profile / Sign In Pill */}
          {currentUser ? (
            <Link
              to="/library"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs transition-all duration-200"
              title={`${currentUser.name} (${userRole || 'Member'})`}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-sky-500/20 border border-sky-400/40 flex items-center justify-center flex-shrink-0">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                )}
              </div>
              <span className="truncate max-w-[90px] hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
              {userRole === 'ADMIN' && (
                <span className="px-1.5 py-0.2 rounded-md bg-sky-500 text-[9px] font-black text-white uppercase">ADMIN</span>
              )}
              {userRole === 'CREATOR' && (
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-[9px] font-black text-white uppercase">CREATOR</span>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-all duration-300 shadow-md shadow-sky-500/30 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
