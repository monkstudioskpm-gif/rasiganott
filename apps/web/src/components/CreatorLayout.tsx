import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, ExternalLink, LogOut, Sparkles } from 'lucide-react';

interface CreatorLayoutProps {
  children: ReactNode;
}

export function CreatorLayout({ children }: CreatorLayoutProps) {
  const navigate = useNavigate();

  const handleSignOutCreator = () => {
    localStorage.removeItem('user_role');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col font-sans">
      {/* Dedicated Creator Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-white/10 backdrop-blur-xl shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Creator Badge */}
          <div className="flex items-center gap-3">
            <Link to="/creator" className="flex items-center gap-2 group">
              <span className="font-black text-xl tracking-tighter text-white">
                RASIGAN<span className="text-emerald-400">.</span>
              </span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest">
              <Wallet className="w-3 h-3" />
              <span>Creator Studio</span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
              title="Return to OTT Viewer Web App"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">View Main App</span>
            </Link>

            <button
              onClick={handleSignOutCreator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
              title="Sign out of Creator account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Creator Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Creator Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-gray-400">Rasigan OTT Creator Portal</span>
          </div>
          <div className="text-[11px] text-gray-500">
            Transparent Earnings & Revenue Share Breakdown
          </div>
        </div>
      </footer>
    </div>
  );
}
