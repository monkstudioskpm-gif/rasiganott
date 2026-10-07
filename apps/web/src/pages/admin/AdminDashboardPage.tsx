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
  Tv,
  Smartphone,
  Check,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Layers,
  FileText,
  Copy,
  Receipt,
  CheckCircle,
  X,
  Send,
  CreditCard,
} from 'lucide-react';
import {
  adminApi,
  FALLBACK_ADMIN_STATS,
  FALLBACK_CREATOR_BREAKDOWN,
  FALLBACK_PAYOUT_STATEMENTS,
} from '../../lib/api';
import { Title } from '@rasigan/shared';

interface CreatorBreakdownItem {
  creatorName: string;
  titlesCount: number;
  grossRaisedInr: number;
  netEarningsInr: number;
  platformFeeInr: number;
  payoutStatus: 'PAID' | 'PROCESSING' | 'PENDING';
  titles: Array<{ id: string; title: string; posterUrl: string; kind: string; grossRaisedInr: number; netEarningsInr: number }>;
}

interface PayoutStatementItem {
  id: string;
  statementNumber: string;
  creatorName: string;
  cycle: string;
  period: string;
  grossAmountInr: number;
  netPayableInr: number;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING';
  paymentUtrNumber: string;
  paidAt: string;
  titlesCount: number;
}

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'creators' | 'payouts'>('catalog');

  const [stats, setStats] = useState<{
    totalTitles: number;
    publishedTitles: number;
    draftTitles: number;
    totalPeople: number;
    totalGenres: number;
    totalTags: number;
    totalFundingRaised: number;
  }>(FALLBACK_ADMIN_STATS.stats);

  const [titles, setTitles] = useState<Title[]>([]);
  const [creatorsData, setCreatorsData] = useState<{
    summary: { totalCreatorsCount: number; totalGrossRaisedInr: number; totalNetEarningsInr: number; totalPlatformFeeInr: number };
    creators: CreatorBreakdownItem[];
  }>(FALLBACK_CREATOR_BREAKDOWN as any);

  const [payoutsData, setPayoutsData] = useState<PayoutStatementItem[]>(
    FALLBACK_PAYOUT_STATEMENTS.statements as any
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Filters for catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('ALL');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);

  // Payout Completion Modal State
  const [selectedPayout, setSelectedPayout] = useState<PayoutStatementItem | null>(null);
  const [modalAmount, setModalAmount] = useState<number>(0);
  const [modalUtr, setModalUtr] = useState<string>('');
  const [modalDate, setModalDate] = useState<string>('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, titlesRes, creatorsRes, payoutsRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getAllTitles(),
        adminApi.getCreatorEarningsBreakdown(),
        adminApi.getPayoutStatements(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
        setStats(statsRes.value.stats);
      }

      if (titlesRes.status === 'fulfilled' && titlesRes.value?.titles && titlesRes.value.titles.length > 0) {
        setTitles(titlesRes.value.titles);
      }

      if (creatorsRes.status === 'fulfilled' && creatorsRes.value?.summary) {
        setCreatorsData(creatorsRes.value);
      }

      if (payoutsRes.status === 'fulfilled' && payoutsRes.value?.statements) {
        setPayoutsData(payoutsRes.value.statements as any);
      }
    } catch (err: any) {
      console.error('Failed to fetch backend data, displaying mock admin fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const openPayoutModal = (stmt: PayoutStatementItem) => {
    setSelectedPayout(stmt);
    setModalAmount(stmt.netPayableInr);
    setModalUtr(stmt.paymentUtrNumber.startsWith('UTR9') || stmt.paymentUtrNumber.startsWith('UTR8') ? stmt.paymentUtrNumber : `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    setModalDate(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;
    if (!modalUtr.trim()) {
      alert('Please enter the bank transaction UTR / reference number.');
      return;
    }

    try {
      setIsSubmittingPayout(true);
      await adminApi.completePayoutStatement(selectedPayout.id, {
        amountInr: Number(modalAmount),
        paymentUtrNumber: modalUtr.trim(),
        paidAt: modalDate.trim(),
      });

      // Update local statement state
      setPayoutsData((prev) =>
        prev.map((s) =>
          s.id === selectedPayout.id
            ? {
                ...s,
                status: 'COMPLETED',
                netPayableInr: Number(modalAmount),
                paymentUtrNumber: modalUtr.trim(),
                paidAt: modalDate.trim(),
              }
            : s
        )
      );

      setSelectedPayout(null);
    } catch (err) {
      alert('Failed to save payout status.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

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
    if (!window.confirm(`Are you sure you want to delete "${titleName}"? Action cannot be undone.`)) {
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

  const filteredPayouts = payoutsData.filter((p) => {
    if (payoutStatusFilter === 'ALL') return true;
    return p.status === payoutStatusFilter;
  });

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Header Banner - Clean Minimalist Dark Glassmorphism */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 p-6 md:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Admin Overview & Management
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-2xl leading-relaxed">
              Manage video catalog titles, publish statuses, cast & crew database, and review creator earnings & payouts.
            </p>
          </div>

          {/* Clean Shortcut Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/titles/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>＋ Add Content</span>
            </Link>

            <Link
              to="/admin/people"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cast & Crew</span>
            </Link>

            <Link
              to="/admin/genres"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Genres</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Catalog Titles */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Catalog Titles</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">{titles.length || stats.totalTitles}</div>
            <div className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{stats.publishedTitles} Published</span>
              <span className="text-gray-500">•</span>
              <span className="text-amber-400">{stats.draftTitles} Drafts</span>
            </div>
          </div>
        </div>

        {/* Total Creator Revenue */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Gross Support Raised</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-400">
              ₹{creatorsData.summary.totalGrossRaisedInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-gray-400">Total gross funds collected</div>
          </div>
        </div>

        {/* Creator Net Payouts */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Creator Net Earnings</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-indigo-300">
              ₹{creatorsData.summary.totalNetEarningsInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-gray-400">Total net payable to creators</div>
          </div>
        </div>

        {/* Active Creators Count */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Active Creators</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {creatorsData.summary.totalCreatorsCount}
            </div>
            <div className="text-[11px] text-gray-400">Registered creators & studios</div>
          </div>
        </div>
      </div>

      {/* Clean Tab Switcher */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Catalog Management</span>
          <span className="ml-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px]">
            {titles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'creators'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Creator Earnings Breakdown</span>
          <span className="ml-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px]">
            {creatorsData.creators.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'payouts'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Creator Payout Statements & UTR</span>
          <span className="ml-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px]">
            {payoutsData.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Catalog Management Table */}
      {activeTab === 'catalog' && (
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <span>All Catalog Content</span>
              </h2>
              <p className="text-xs text-gray-400">
                Filter titles, check publish status, or edit content details.
              </p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Kinds</option>
                <option value="MOVIE">Movies</option>
                <option value="WEB_SERIES">Web Series</option>
                <option value="SHORT_FILM">Short Films</option>
              </select>

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

          {/* Table */}
          {filteredTitles.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-extrabold">
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTitles.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="w-10 h-14 rounded-xl object-cover bg-slate-800 border border-white/10 flex-shrink-0 shadow-md"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <Link
                              to={`/title/${item.slug}`}
                              className="font-extrabold text-white hover:text-sky-400 transition-colors truncate block text-sm"
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

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-[11px]">
                          {item.kind === 'MOVIE' ? 'Movie' : item.kind === 'WEB_SERIES' ? 'Web Series' : 'Short Film'}
                        </span>
                      </td>

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

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-300 font-medium">
                        {item.creatorName || 'Indie Studio'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(item.id)}
                          disabled={togglingId === item.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold transition-all border ${
                            item.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                          title="Click to toggle status"
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

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/title/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            title="View title page"
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
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
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
      )}

      {/* TAB 2: Creator Earnings Breakdown (Which Creator gets how much) */}
      {activeTab === 'creators' && (
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Creator Earnings & Revenue Distribution</span>
              </h2>
              <p className="text-xs text-gray-400">
                Detailed view of gross revenue collected per creator and their net earnings payable.
              </p>
            </div>

            {/* Summary Tag */}
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Total Net Creator Earnings: ₹{creatorsData.summary.totalNetEarningsInr.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Creators List Cards */}
          <div className="space-y-4">
            {creatorsData.creators.map((creator, idx) => {
              const isExpanded = expandedCreator === creator.creatorName;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden transition-all duration-200 hover:border-white/20"
                >
                  {/* Main Row Header */}
                  <div
                    onClick={() => setExpandedCreator(isExpanded ? null : creator.creatorName)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {creator.creatorName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                          <span>{creator.creatorName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                            {creator.titlesCount} {creator.titlesCount === 1 ? 'Title' : 'Titles'}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Status: <span className="text-emerald-400 font-bold">Active Creator</span>
                        </p>
                      </div>
                    </div>

                    {/* Amounts & Expand Arrow */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase font-bold text-[10px]">Gross Support</div>
                        <div className="text-sm font-extrabold text-gray-200">
                          ₹{creator.grossRaisedInr.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-emerald-400 uppercase font-bold text-[10px]">Creator Net Earnings</div>
                        <div className="text-base font-black text-emerald-400">
                          ₹{creator.netEarningsInr.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-400 uppercase font-bold text-[10px]">Platform Fee</div>
                        <div className="text-xs font-bold text-gray-400">
                          ₹{creator.platformFeeInr.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail View: Per-Title Earnings */}
                  {isExpanded && (
                    <div className="p-5 border-t border-white/10 bg-slate-950/40 space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Per-Title Earnings Breakdown for {creator.creatorName}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {creator.titles.map((t) => (
                          <div
                            key={t.id}
                            className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={t.posterUrl}
                                alt={t.title}
                                className="w-9 h-12 rounded-lg object-cover bg-slate-800"
                              />
                              <div>
                                <div className="font-bold text-white text-xs">{t.title}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-semibold">
                                  {t.kind}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-extrabold text-emerald-400">
                                ₹{t.netEarningsInr.toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                Gross: ₹{t.grossRaisedInr.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Creator Payout Statements (Actionable Mark Payout Done + UTR) */}
      {activeTab === 'payouts' && (
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-400" />
                <span>Creator Payout Management & Bank Transfer Status</span>
              </h2>
              <p className="text-xs text-gray-400">
                Monthly creator payouts are processed manually by Admin. Click "Mark Payout Done" to enter bank transfer UTR and payout amount.
              </p>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-purple-500 font-bold"
              >
                <option value="ALL">All Payout Statuses</option>
                <option value="COMPLETED">Completed / Paid</option>
                <option value="PROCESSING">Processing / Pending</option>
              </select>
            </div>
          </div>

          {/* Payout Statements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-3 px-4">Statement # & Creator</th>
                  <th className="py-3 px-4">Payout Cycle</th>
                  <th className="py-3 px-4">Gross Collected</th>
                  <th className="py-3 px-4">Net Amount Paid</th>
                  <th className="py-3 px-4">Payout Status</th>
                  <th className="py-3 px-4">Payment UTR / Ref Number</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayouts.map((stmt) => (
                  <tr key={stmt.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Statement # & Creator Name */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-white text-sm flex items-center gap-2">
                          <span>{stmt.creatorName}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono font-semibold">
                          {stmt.statementNumber}
                        </div>
                      </div>
                    </td>

                    {/* Cycle & Period */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-200">{stmt.cycle}</div>
                        <div className="text-[10px] text-gray-400">{stmt.period}</div>
                      </div>
                    </td>

                    {/* Gross Collected */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-300 font-bold">
                      ₹{stmt.grossAmountInr.toLocaleString('en-IN')}
                    </td>

                    {/* Net Paid */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-black text-emerald-400 text-sm">
                      ₹{stmt.netPayableInr.toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {stmt.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>COMPLETED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-extrabold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>PROCESSING</span>
                        </span>
                      )}
                    </td>

                    {/* Payment UTR Number */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${stmt.status === 'COMPLETED' ? 'text-purple-300 bg-purple-500/10 border-purple-500/20' : 'text-gray-400 bg-white/5 border-white/10'}`}>
                          {stmt.paymentUtrNumber}
                        </span>
                        {stmt.paymentUtrNumber.startsWith('UTR') && !stmt.paymentUtrNumber.includes('PROCESSING') && (
                          <button
                            onClick={() => handleCopyUtr(stmt.paymentUtrNumber)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Copy UTR number"
                          >
                            {copiedUtr === stmt.paymentUtrNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Admin Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {stmt.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => openPayoutModal(stmt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Payout Done</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openPayoutModal(stmt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-sky-400" />
                          <span>Update UTR</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Payout Completion Modal Dialog */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPayout(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Process Creator Payout
              </h2>
              <p className="text-xs text-gray-400">
                Mark payout statement <strong className="text-sky-400 font-mono">{selectedPayout.statementNumber}</strong> as completed. Entered details will reflect directly in creator's portal.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Creator Studio:</span>
                <span className="font-extrabold text-white">{selectedPayout.creatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payout Cycle:</span>
                <span className="font-bold text-gray-200">{selectedPayout.cycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gross Support Collected:</span>
                <span className="font-bold text-emerald-400">₹{selectedPayout.grossAmountInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleSavePayout} className="space-y-4">
              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  Net Payout Amount (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-base focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* UTR / Reference ID Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  Bank Transaction UTR / Ref Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR982341029384"
                  value={modalUtr}
                  onChange={(e) => setModalUtr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-[10px] text-gray-400">
                  Enter NEFT / RTGS / IMPS bank reference number. This will be shown on the creator statement.
                </p>
              </div>

              {/* Payment Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  Settlement Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingPayout ? 'Saving...' : 'Save & Complete Payout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
