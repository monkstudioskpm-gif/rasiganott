import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Smartphone, Search, Library, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Reset player playing status on navigation
    setIsPlaying(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePlayerState = (e: any) => {
      if (location.pathname === '/shots' || location.pathname === '/reels') {
        setIsPlaying(false);
        return;
      }
      setIsPlaying(!!e.detail?.isPlaying);
    };
    window.addEventListener('playerStateChange', handlePlayerState);
    return () => window.removeEventListener('playerStateChange', handlePlayerState);
  }, [location.pathname]);

  const isLogged = typeof window !== 'undefined' && !!localStorage.getItem('rasigan_user');
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Shots', path: '/shots', icon: Smartphone },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Library', path: '/library', icon: Library },
    { label: 'Profile', path: isLogged ? '/library' : '/login', icon: User },
  ];

  const isAdminOrCreatorRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/creator');
  if (isAdminOrCreatorRoute) return null;

  const isVerticalPage = location.pathname === '/shots' || location.pathname === '/reels';
  const shouldHide = isPlaying && !isVerticalPage;

  return (
    <nav
      className={`md:hidden fixed bottom-3 left-4 right-4 z-50 glass-panel border border-white/10 rounded-2xl p-1.5 shadow-2xl shadow-black/80 transition-all duration-300 transform ${
        shouldHide ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'
      }`}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/shots' && location.pathname === '/reels');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white bg-sky-500 shadow-md shadow-sky-500/30 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-white' : ''} transition-transform duration-200`} />
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
