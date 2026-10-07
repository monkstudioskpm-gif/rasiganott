import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Plus,
  Users,
  Tag,
  Wallet,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  ArrowUpRight,
  Tv,
  Smartphone,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { Title } from '@rasigan/shared';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    totalTitles: number;
    publishedTitles: number;
    draftTitles: number;
    totalPeople: number;
    totalGenres: number;
    totalTags: number;
    totalFundingRaised: number;
  } | null>(null);

  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, titlesRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAllTitles(),
      ]);

      setStats(statsRes.stats);
      setTitles(titlesRes.titles || []);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err);
      setError(err?.message || 'Failed to load admin dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTogglePublish = async (id: string) => {
    try {
      setTogglingId(id);
      const res = await adminApi.togglePublishTitle(id);
      setTitles((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: res.status as any } : t))
      );
      if (stats) {
        setStats({
          ...stats,
          publishedTitles: res.status === 'PUBLISHED' ? stats.publishedTitles + 1 : stats.publishedTitles - 1,
          draftTitles: res.status === 'DRAFT' ? stats.draftTitles + 1 : stats.draftTitles - 1,
        });
      }
    } catch (err) {
      alert('Failed to update title status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTitle = async (id: string, titleName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${titleName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(id);
      await adminApi.deleteTitle(id);
      setTitles((prev) => prev.filter((t) => t.id !== id));
      if (stats) {
        setStats({ ...stats, totalTitles: stats.totalTitles - 1 });
      }
    } catch (err) {
      alert('Failed to delete title.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTitles = titles.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKind = kindFilter === 'ALL' || t.kind === kindFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesKind && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-950/40 via-dark-card to-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-8 glass-panel shadow-2xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Overview of catalog statistics, content management, cast & crew database, and genre configuration.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            to="/admin/titles/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>＋ New Content</span>
          </Link>

          <Link
            to="/admin/people"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Cast & Crew</span>
          </Link>

          <Link
            to="/admin/genres"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Genres & Tags</span>
          </Link>

          <Link
            to="/creator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Creator Earnings</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Titles */}
        <div className="bg-dark-card border border-white/10 rounded-3xl p-5 space-y-2 glass-panel shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Titles</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats ? stats.totalTitles : '—'}</span>
            <span className="text-xs text-sky-400 font-semibold">
              ({stats ? stats.publishedTitles : 0} published)
            </span>
          </div>
        </div>

        {/* Drafts Count */}
        <div className="bg-dark-card border border-white/10 rounded-3xl p-5 space-y-2 glass-panel shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Draft Content</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats ? stats.draftTitles : '—'}</span>
            <span className="text-xs text-amber-400 font-semibold">Pending publish</span>
          </div>
        </div>

        {/* People Database */}
        <div className="bg-dark-card border border-white/10 rounded-3xl p-5 space-y-2 glass-panel shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cast & Crew</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats ? stats.totalPeople : '—'}</span>
            <span className="text-xs text-gray-400">Profiles linked</span>
          </div>
        </div>

        {/* Total Funding */}
        <div className="bg-dark-card border border-white/10 rounded-3xl p-5 space-y-2 glass-panel shadow-lg">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Raised</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              ₹{stats ? stats.totalFundingRaised.toLocaleString('en-IN') : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Catalog Management Table */}
      <div className="bg-dark-card border border-white/10 rounded-3xl p-6 glass-panel shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Film className="w-5 h-5 text-sky-400" />
              <span>Catalog Management</span>
            </h2>
            <p className="text-xs text-gray-400">View, publish, edit, or remove titles in the system catalog.</p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Kind Filter */}
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Types</option>
              <option value="MOVIE">Movies</option>
              <option value="WEB_SERIES">Web Series</option>
              <option value="SHORT_FILM">Short Films</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading catalog dataset...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchDashboardData}
              className="ml-auto underline font-bold text-rose-300 hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTitles.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No titles found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchQuery || kindFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filters.'
                : 'Click "＋ New Content" to add your first movie, web series, or short film.'}
            </p>
          </div>
        )}

        {/* Titles Table */}
        {!loading && !error && filteredTitles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-3 px-4">Content Title</th>
                  <th className="py-3 px-4">Kind</th>
                  <th className="py-3 px-4">Orientation</th>
                  <th className="py-3 px-4">Genres</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTitles.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Title & Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-10 h-14 rounded-lg object-cover bg-slate-800 border border-white/10 flex-shrink-0 shadow-md"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <Link
                            to={`/title/${item.slug}`}
                            className="font-bold text-white hover:text-sky-400 transition-colors truncate block text-sm"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            <span>{item.language || 'Tamil'}</span>
                            {item.year && <span>• {item.year}</span>}
                            {item.ageRating && (
                              <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-bold">
                                {item.ageRating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kind */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-[11px]">
                        {item.kind === 'MOVIE' ? 'Movie' : item.kind === 'WEB_SERIES' ? 'Web Series' : 'Short Film'}
                      </span>
                    </td>

                    {/* Orientation */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                        {item.orientation === 'VERTICAL' ? (
                          <>
                            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                            <span>Vertical</span>
                          </>
                        ) : (
                          <>
                            <Tv className="w-3.5 h-3.5 text-blue-400" />
                            <span>Landscape</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Genres */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.genres && item.genres.length > 0 ? (
                          item.genres.map((g: any, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[10px]"
                            >
                              {g.name || g.genre?.name || g}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 italic text-[11px]">No genres</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge + Quick Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(item.id)}
                        disabled={togglingId === item.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all border ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                        title="Click to toggle Draft / Published"
                      >
                        {item.status === 'PUBLISHED' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/title/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="View detail page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          to={`/admin/titles/${item.id}/edit`}
                          className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors"
                          title="Edit title"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteTitle(item.id, item.title)}
                          disabled={deletingId === item.id}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50"
                          title="Delete title"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
