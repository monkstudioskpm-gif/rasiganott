import { useState, useEffect, useRef } from 'react';
import { Bookmark, Clock, Heart, Award, Play, Trash2, IndianRupee, Shield, Sparkles, LogOut, CheckCircle2, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fundingApi, authApi } from '../lib/api';

interface AuthUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN' | 'CREATOR' | string;
}

interface WatchHistoryItem {
  id: string;
  slug: string;
  title: string;
  posterUrl: string;
  verticalPosterUrl?: string;
  language?: string;
  year?: number | string;
  watchedAt?: string;
}

interface WatchlistItem {
  id: string;
  slug: string;
  title: string;
  posterUrl: string;
  language?: string;
}

interface SupportedItem {
  id: string;
  titleId: string;
  titleName: string;
  posterUrl: string;
  creatorName: string;
  amountInr: number;
  paidAt?: string;
}

export function LibraryPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const u = localStorage.getItem('rasigan_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'history' | 'watchlist' | 'supported' | 'liked'>('history');
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [supported, setSupported] = useState<SupportedItem[]>([]);
  const [liked, setLiked] = useState<any[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isGsiRendered, setIsGsiRendered] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Sync user profile from server session if available
  useEffect(() => {
    authApi
      .getMe()
      .then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('rasigan_user', JSON.stringify(res.user));
          localStorage.setItem('user_role', res.user.role);
        }
      })
      .catch(() => {});
  }, []);

  // Load local data
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('rasigan_watch_history') || '[]');
      setHistory(savedHistory);
    } catch {}

    try {
      const savedWatchlist = JSON.parse(localStorage.getItem('rasigan_watchlist') || '[]');
      setWatchlist(savedWatchlist);
    } catch {}

    try {
      const savedSupported = JSON.parse(localStorage.getItem('rasigan_supported') || '[]');
      setSupported(savedSupported);
    } catch {}

    try {
      const savedLiked = JSON.parse(localStorage.getItem('rasigan_liked') || '[]');
      setLiked(savedLiked);
    } catch {}

    fundingApi
      .getMyFundings()
      .then((res) => {
        if (res?.fundings && res.fundings.length > 0) {
          const apiItems = res.fundings.map((f: any) => ({
            id: f.id,
            titleId: f.title?.id || f.titleId,
            titleName: f.title?.title || 'Supported Film',
            posterUrl: f.title?.posterUrl || '',
            creatorName: f.title?.creatorName || 'Creator',
            amountInr: f.amountInr,
            paidAt: f.paidAt,
          }));
          setSupported((prev) => {
            const ids = new Set(prev.map((p) => p.id || p.titleId));
            const merged = [...prev];
            apiItems.forEach((item: SupportedItem) => {
              if (!ids.has(item.id) && !ids.has(item.titleId)) {
                merged.push(item);
              }
            });
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sign in gate for library when not logged in
  useEffect(() => {
    if (currentUser) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '102651788040-f80qjr6hok5b2i1nt8pcke7bnnr035j8.apps.googleusercontent.com';

    const loadGsiScript = () => {
      const googleObj = (window as any).google;
      if (googleObj?.accounts?.id) {
        initGsi();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    };

    const initGsi = () => {
      const googleObj = (window as any).google;
      if (!googleObj?.accounts?.id) return;
      try {
        googleObj.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setIsAuthLoading(true);
            try {
              const res = await authApi.loginWithGoogle(response.credential);
              if (res?.user) {
                setCurrentUser(res.user);
                localStorage.setItem('rasigan_user', JSON.stringify(res.user));
                localStorage.setItem('user_role', res.user.role);
              }
            } catch (err) {
              console.error('Google Sign-In Error:', err);
            } finally {
              setIsAuthLoading(false);
            }
          },
          auto_select: false,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          googleObj.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            shape: 'pill',
            theme: 'filled_black',
            text: 'continue_with',
            size: 'large',
            logo_alignment: 'left',
            width: 280,
          });
          setIsGsiRendered(true);
        }
      } catch (e) {
        console.warn('Library GSI init notice:', e);
      }
    };

    loadGsiScript();
  }, [currentUser]);

  const handlePrompt = () => {
    const googleObj = (window as any).google;
    if (googleObj?.accounts?.id) {
      googleObj.accounts.id.prompt();
    } else {
      navigate('/login');
    }
  };

  const handleRemoveHistory = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem('rasigan_watch_history', JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('rasigan_watch_history');
  };

  const handleRemoveWatchlist = (id: string) => {
    const updated = watchlist.filter((item) => item.id !== id);
    setWatchlist(updated);
    localStorage.setItem('rasigan_watchlist', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('user_role');
    localStorage.removeItem('rasigan_user');
    setCurrentUser(null);
    setIsLoggingOut(false);
  };

  // Get initials for profile fallback
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* User Profile Header Card */}
      {currentUser ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-[#0e1424] to-slate-900/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            {/* User Avatar & Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-xl shadow-sky-500/20 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-2xl text-sky-300">{getInitials(currentUser.name)}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{currentUser.name}</h1>
                  {currentUser.role === 'ADMIN' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Shield className="w-3 h-3 text-sky-400" />
                      <span>ADMIN</span>
                    </span>
                  )}
                  {currentUser.role === 'CREATOR' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>CREATOR</span>
                    </span>
                  )}
                  {currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-gray-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-sky-400" />
                      <span>MEMBER</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 font-mono">{currentUser.email}</p>

                {/* Summary Chips */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 font-medium">
                    <strong className="text-sky-400 font-bold">{history.length}</strong> Watched
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 font-medium">
                    <strong className="text-sky-400 font-bold">{watchlist.length}</strong> Saved
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 font-medium">
                    <strong className="text-emerald-400 font-bold">{supported.length}</strong> Supported
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
              {currentUser.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {currentUser.role === 'CREATOR' && (
                <Link
                  to="/creator"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Creator Studio</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sign-In Invitation if not logged in */
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#101628] to-slate-900 border border-white/10 p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center mx-auto shadow-md">
            <UserIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">Sign In to Your Library</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Access your personalized watch history, saved watchlist, and support your favorite Tamil creators.
            </p>
          </div>

          <div className="flex justify-center pt-2 min-h-[44px]">
            <div ref={googleBtnRef} className={isGsiRendered ? 'flex justify-center' : 'hidden'} />
            {!isGsiRendered && (
              <button
                onClick={handlePrompt}
                disabled={isAuthLoading}
                className="px-6 py-2.5 rounded-full bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs shadow-xl transition-all flex items-center gap-2.5"
              >
                {isAuthLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                ) : (
                  <span>Continue with Google</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sleek Aligned Horizontal Tabs Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'history', label: `Continue Watching (${history.length})`, icon: Clock },
            { id: 'watchlist', label: `Watchlist (${watchlist.length})`, icon: Bookmark },
            { id: 'supported', label: `Supported (${supported.length})`, icon: Award },
            { id: 'liked', label: `Liked (${liked.length})`, icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`h-9 px-3.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-2 whitespace-nowrap flex-none ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 border border-sky-400'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-none" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'history' && history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors flex-none px-2 py-1"
          >
            Clear All
          </button>
        )}
      </div>

      {/* TAB 1: Continue Watching / Watch History */}
      {activeTab === 'history' && (
        <>
          {history.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((item) => (
                <div key={item.id} className="group space-y-2 block relative">
                  <Link to={`/watch/${item.id}`} className="block">
                    <div className="relative aspect-video sm:aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.02] shadow-md bg-dark-card border border-white/10">
                      <img
                        src={item.posterUrl || item.verticalPosterUrl || ''}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/50">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between px-1">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-xs text-gray-100 truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-400">{item.language || 'Tamil'}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveHistory(item.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-h-[35vh] flex flex-col items-center justify-center text-center p-6 space-y-3 glass-panel rounded-3xl">
              <Clock className="w-10 h-10 text-gray-500" />
              <h3 className="text-base font-bold text-white">No Watch History Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Movies and series you stream will appear here so you can pick up right where you left off.
              </p>
              <Link
                to="/"
                className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                Browse Titles
              </Link>
            </div>
          )}
        </>
      )}

      {/* TAB 2: Watchlist Content */}
      {activeTab === 'watchlist' && (
        <>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map((item) => (
                <div key={item.id} className="group space-y-2 block relative">
                  <Link to={`/title/${item.slug}`} className="block">
                    <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.02] shadow-md bg-dark-card border border-white/10">
                      <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-7 h-7 fill-current text-white" />
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between px-1">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-xs text-gray-100 truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-400">{item.language}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveWatchlist(item.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-h-[35vh] flex flex-col items-center justify-center text-center p-6 space-y-2 glass-panel rounded-3xl">
              <Bookmark className="w-10 h-10 text-gray-500" />
              <h3 className="text-base font-bold text-white">Your Watchlist is Empty</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Click "Save for Later" on any title page to build your personal streaming library.
              </p>
              <Link
                to="/"
                className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                Explore Titles
              </Link>
            </div>
          )}
        </>
      )}

      {/* TAB 3: Supported Creators Content */}
      {activeTab === 'supported' && (
        <>
          {supported.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {supported.map((sup) => (
                <div key={sup.id} className="glass-panel p-4 rounded-2xl space-y-2 border border-rose-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-18 rounded-xl overflow-hidden bg-dark-card border border-white/10 flex-none">
                      <img src={sup.posterUrl} alt={sup.titleName} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{sup.titleName}</h4>
                      <p className="text-[11px] text-rose-400 font-medium">Creator: {sup.creatorName}</p>
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <IndianRupee className="w-3 h-3" /> Funded ₹{sup.amountInr}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-h-[35vh] flex flex-col items-center justify-center text-center p-6 space-y-2 glass-panel rounded-3xl">
              <Award className="w-10 h-10 text-gray-500" />
              <h3 className="text-base font-bold text-white">No Supported Creators Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Support independent Tamil filmmakers through micro-fundings to see your contributions here.
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 4: Liked Titles */}
      {activeTab === 'liked' && (
        <>
          {liked.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {liked.map((item) => (
                <div key={item.id} className="group space-y-2 block relative">
                  <Link to={`/title/${item.slug || item.id}`} className="block">
                    <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.02] shadow-md bg-dark-card border border-white/10">
                      <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-7 h-7 fill-current text-white" />
                      </div>
                    </div>
                  </Link>
                  <h4 className="font-bold text-xs text-gray-100 truncate">{item.title}</h4>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-h-[35vh] flex flex-col items-center justify-center text-center p-6 space-y-2 glass-panel rounded-3xl">
              <Heart className="w-10 h-10 text-gray-500" />
              <h3 className="text-base font-bold text-white">No Liked Content</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Like titles and vertical clips to easily find them later.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
