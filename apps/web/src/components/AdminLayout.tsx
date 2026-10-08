import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Plus,
  Users,
  Tag,
  Shield,
  ExternalLink,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOutAdmin = () => {
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const navItems = [
    { label: 'Overview & Catalog', path: '/admin', icon: LayoutDashboard },
    { label: ' Add Content', path: '/admin/titles/new', icon: Plus },
    { label: 'Cast & Crew', path: '/admin/people', icon: Users },
    { label: 'Genres & Tags', path: '/admin/genres', icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col font-sans">
      {/* Dedicated Admin Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-white/10 backdrop-blur-xl shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Admin Badge */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2 group">
              <span className="font-black text-xl tracking-tighter text-white">
                RASIGAN<span className="text-sky-400">.</span>
              </span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-extrabold uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              <span>Admin Panel</span>
            </div>
          </div>

          {/* Admin Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin' || location.pathname === '/admin/titles'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'text-white bg-sky-500 shadow-lg shadow-sky-500/25 font-extrabold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Header Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
              title="Return to OTT Viewer Web App"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">View Main App</span>
            </Link>

            <button
              onClick={handleSignOutAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
              title="Sign out of Admin role"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-slate-900 border-t border-white/5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin' || location.pathname === '/admin/titles'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 flex-none ${
                  isActive
                    ? 'text-white bg-sky-500 font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Admin Dedicated Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-gray-400">Rasigan OTT v2 Administrative Control Panel</span>
          </div>
          <div className="text-[11px] text-gray-500">
            Protected & Restricted System • Schema v2.0 Supabase
          </div>
        </div>
      </footer>
    </div>
  );
}
