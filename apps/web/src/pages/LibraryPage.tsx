import { useState, useEffect } from 'react';
import { Bookmark, Clock, Heart, Award, Play, Trash2, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'history' | 'liked' | 'supported'>('watchlist');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [supported, setSupported] = useState<any[]>([]);

  useEffect(() => {
    const savedWatchlist = JSON.parse(localStorage.getItem('rasigan_watchlist') || '[]');
    setWatchlist(savedWatchlist);

    const savedSupported = JSON.parse(localStorage.getItem('rasigan_supported') || '[]');
    setSupported(savedSupported);
  }, []);

  const handleRemoveWatchlist = (id: string) => {
    const updated = watchlist.filter((item) => item.id !== id);
    setWatchlist(updated);
    localStorage.setItem('rasigan_watchlist', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      <div className="border-b border-white/10 pb-3">
        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">My Profile & Library</h1>
        <p className="text-xs text-gray-400">View saved movies, watch history, and supported creators</p>
      </div>

      {/* Sleek Aligned Horizontal Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'watchlist', label: `Watchlist (${watchlist.length})`, icon: Bookmark },
          { id: 'history', label: 'Continue Watching', icon: Clock },
          { id: 'liked', label: 'Liked', icon: Heart },
          { id: 'supported', label: `Supported (${supported.length})`, icon: Award },
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

      {/* Watchlist Tab Content */}
      {activeTab === 'watchlist' && (
        <>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map((item) => (
                <div key={item.id} className="group space-y-2 block relative">
                  <Link to={`/title/${item.slug}`} className="block">
                    <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.02] shadow-md">
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
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-2 glass-panel rounded-3xl">
              <Bookmark className="w-10 h-10 text-gray-500" />
              <h3 className="text-base font-bold text-white">Your Watchlist is Empty</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Click "Save for Later" on any movie page to save it to your profile.
              </p>
            </div>
          )}
        </>
      )}

      {/* Supported Creators Tab Content */}
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
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-2 glass-panel rounded-3xl">
              <Award className="w-10 h-10 text-gray-500" />
              <h3 className="text-base font-bold text-white">No Supported Creators Yet</h3>
            </div>
          )}
        </>
      )}

      {/* History & Liked Tabs */}
      {(activeTab === 'history' || activeTab === 'liked') && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-2 glass-panel rounded-3xl">
          <Clock className="w-10 h-10 text-gray-500" />
          <h3 className="text-base font-bold text-white capitalize">{activeTab} section</h3>
          <p className="text-xs text-gray-400 max-w-xs">Sign in to sync your watch progress across all devices.</p>
        </div>
      )}
    </div>
  );
}
