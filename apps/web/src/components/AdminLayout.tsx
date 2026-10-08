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
  Clapperboard,
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
    { label: 'Add Content', path: '/admin/titles/new', icon: Plus },
    { label: 'Creators & Studios', path: '/admin?tab=creators-list', icon: Clapperboard },
    { label: 'Cast & Crew', path: '/admin/people', icon: Users },
    { label: 'Genres & Tags', path: '/admin/genres', icon: Tag },
  ];


  return (
    <div className="min-h-screen bg-[#090D16] text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Dedicated Admin Top Navigation Header - Premium Obsidian Glassmorphism */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/95 border-b border-cyan-500/20 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Vibrant Admin Shield Badge */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 font-black text-sm group-hover:scale-105 transition-transform">
                R
              </div>
              <span className="font-black text-xl tracking-tighter text-white">
                RASIGAN<span className="text-cyan-400">.</span>
              </span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest shadow-inner">
              <Shield className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Admin Panel</span>
            </div>
          </div>

          {/* Admin Navigation Pills with Glowing Active States */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin' || location.pathname === '/admin/titles'
                  : item.path.startsWith('/admin?')
                  ? location.pathname === '/admin' && location.search.includes('creators')
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 border border-cyan-400/30 scale-[1.02]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400/70'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 text-xs font-bold transition-all shadow-sm"
              title="Return to OTT Viewer Web App"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">View Main App</span>
            </Link>

            <button
              onClick={handleSignOutAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-extrabold transition-all shadow-sm active:scale-95"
              title="Sign out of Admin role"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-[#0B0F19] border-t border-cyan-500/10 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin' || location.pathname === '/admin/titles'
                : item.path.startsWith('/admin?')
                ? location.pathname === '/admin' && location.search.includes('creators')
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1.5 flex-none ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30'
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
      <footer className="border-t border-white/10 bg-[#070A12] py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-extrabold text-gray-400">Rasigan OTT v2 Administrative Control Center</span>
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            Protected Admin System • Supabase PostgreSQL Integrated
          </div>
        </div>
      </footer>
    </div>
  );
}

