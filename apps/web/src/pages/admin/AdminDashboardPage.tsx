import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Film,
  Plus,
  Users,
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
  TrendingUp,
  ChevronRight,
  Layers,
  Copy,
  Receipt,
  CheckCircle,
  X,
  Send,
  CreditCard,
  UserPlus,
  Clapperboard,
  Building2,
  UserCheck,
  ShieldCheck,
  BarChart3,
  Star,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';
import {
  adminApi,
  FALLBACK_ADMIN_STATS,
  FALLBACK_CREATOR_BREAKDOWN,
  FALLBACK_PAYOUT_STATEMENTS,
  getAppearanceSettings,
  getStoredRankings,
  AppearanceSettings,
} from '../../lib/api';
import { Title } from '@rasigan/shared';

interface CreatorBreakdownItem {
  id?: string;
  creatorName: string;
  email?: string;
  upiId?: string;
  assignedTitleIds?: string[];
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

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  createdAt?: string;
}

interface PaymentCapture {
  id: string;
  amountInr: number;
  donorName: string;
  donorEmail: string;
  razorpayPaymentId: string;
  paidAt: string;
  status: string;
  message?: string | null;
}

interface TitleAnalytics {
  titleId: string;
  title: string;
  slug: string;
  kind: string;
  orientation: string;
  posterUrl: string;
  bannerUrl?: string | null;
  creatorName: string;
  publishedAt: string;
  fundingGoal: number;
  fundingRaised: number;
  fundingPercent: number;
  supportersCount: number;
  totalViews: number;
  watchTimeHours: number;
  editorRating: number;
  likesCount: number;
  payments: PaymentCapture[];
}

export function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const subParam = searchParams.get('sub');

  const [activeTab, setActiveTab] = useState<'catalog' | 'creators-list' | 'creators' | 'payouts' | 'appearance'>('catalog');
  const [appearanceSubTab, setAppearanceSubTab] = useState<'ranking' | 'featured' | 'sections'>('ranking');
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(getAppearanceSettings());
  const [titleRankings, setTitleRankings] = useState<Record<string, number>>(getStoredRankings());
  const [rankingsKindFilter, setRankingsKindFilter] = useState<'ALL' | 'MOVIE' | 'SHORT_FILM' | 'WEB_SERIES'>('ALL');
  const [rankingsSearch, setRankingsSearch] = useState('');
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);

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
  }>(FALLBACK_CREATOR_BREAKDOWN as unknown as {
    summary: { totalCreatorsCount: number; totalGrossRaisedInr: number; totalNetEarningsInr: number; totalPlatformFeeInr: number };
    creators: CreatorBreakdownItem[];
  });

  const [payoutsData, setPayoutsData] = useState<PayoutStatementItem[]>(
    FALLBACK_PAYOUT_STATEMENTS.statements as unknown as PayoutStatementItem[]
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

  // Add Creator / Search Users Modal State
  const [isAddCreatorOpen, setIsAddCreatorOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [foundUsers, setFoundUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [creatorStudioName, setCreatorStudioName] = useState('');
  const [newCreatorEmail, setNewCreatorEmail] = useState('');
  const [newCreatorUpi, setNewCreatorUpi] = useState('');
  const [newCreatorAssignedTitleIds, setNewCreatorAssignedTitleIds] = useState<string[]>([]);
  const [isSubmittingCreator, setIsSubmittingCreator] = useState(false);
  const [creatorSuccessMsg, setCreatorSuccessMsg] = useState<string | null>(null);

  // Edit Creator Modal State
  const [editingCreator, setEditingCreator] = useState<CreatorBreakdownItem | null>(null);
  const [editCreatorName, setEditCreatorName] = useState('');
  const [editCreatorEmail, setEditCreatorEmail] = useState('');
  const [editCreatorUpi, setEditCreatorUpi] = useState('');
  const [editAssignedTitleIds, setEditAssignedTitleIds] = useState<string[]>([]);
  const [isSavingEditCreator, setIsSavingEditCreator] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [dbUsers, setDbUsers] = useState<UserItem[]>([]);
  const [loadingDbUsers, setLoadingDbUsers] = useState(false);
  const [editUserSearchQuery, setEditUserSearchQuery] = useState('');

  // Quick Edit Title Metadata Modal State (Realtime DB updates)
  const [quickEditTitle, setQuickEditTitle] = useState<Title | null>(null);
  const [quickYear, setQuickYear] = useState('2025');
  const [quickLanguage, setQuickLanguage] = useState('Tamil');
  const [quickAgeRating, setQuickAgeRating] = useState('U/A');
  const [quickDurationMin, setQuickDurationMin] = useState('90');
  const [quickPosterUrl, setQuickPosterUrl] = useState('');
  const [quickVerticalPosterUrl, setQuickVerticalPosterUrl] = useState('');
  const [quickBannerUrl, setQuickBannerUrl] = useState('');
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);
  const [quickEditSuccess, setQuickEditSuccess] = useState<string | null>(null);

  // YouTube Studio Style Title Analytics State
  const [selectedAnalytics, setSelectedAnalytics] = useState<TitleAnalytics | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Listen to URL parameters for tab and sub-tab selection (Sidebar navigation sync)
  useEffect(() => {
    if (tabParam === 'catalog') {
      setActiveTab('catalog');
    } else if (tabParam === 'appearance') {
      setActiveTab('appearance');
      if (subParam === 'ranking' || subParam === 'featured' || subParam === 'sections') {
        setAppearanceSubTab(subParam);
      }
    } else if (tabParam === 'creators-list') {
      setActiveTab('creators-list');
    } else if (tabParam === 'creators') {
      setActiveTab('creators');
    } else if (tabParam === 'payouts') {
      setActiveTab('payouts');
    }
  }, [tabParam, subParam]);

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
        setCreatorsData(creatorsRes.value as unknown as {
          summary: { totalCreatorsCount: number; totalGrossRaisedInr: number; totalNetEarningsInr: number; totalPlatformFeeInr: number };
          creators: CreatorBreakdownItem[];
        });
      }

      if (payoutsRes.status === 'fulfilled' && payoutsRes.value?.statements) {
        setPayoutsData(payoutsRes.value.statements as unknown as PayoutStatementItem[]);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch backend data, displaying mock admin fallback:', err);
      setError('Could not connect to server. Showing cached offline data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openTitleAnalytics = async (titleId: string) => {
    try {
      setIsLoadingAnalytics(true);
      const res = await adminApi.getTitleAnalytics(titleId);
      if (res?.analytics) {
        setSelectedAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Failed to load title analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const loadDatabaseUsers = async (q: string = '') => {
    try {
      setLoadingDbUsers(true);
      const res = await adminApi.searchUsers(q);
      if (res?.users) {
        setDbUsers(res.users);
        if (!q.trim()) {
          setFoundUsers(res.users);
        }
      }
    } catch (e) {
      console.error('Failed to load database users:', e);
    } finally {
      setLoadingDbUsers(false);
    }
  };

  const handleOpenAddCreator = () => {
    setIsAddCreatorOpen(true);
    setSelectedUser(null);
    setCreatorStudioName('');
    setNewCreatorEmail('');
    setNewCreatorUpi('');
    setNewCreatorAssignedTitleIds([]);
    setUserSearchQuery('');
    loadDatabaseUsers('');
  };

  const handleSearchUsers = async (q: string) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      loadDatabaseUsers('');
      return;
    }
    try {
      setSearchingUsers(true);
      const res = await adminApi.searchUsers(q);
      if (res?.users) {
        setFoundUsers(res.users);
      }
    } catch (e) {
      console.error('Failed to search users:', e);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleCreateCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorStudioName.trim()) {
      alert('Please enter a Creator / Studio Name');
      return;
    }
    const emailToUse = (selectedUser?.email || newCreatorEmail.trim()).toLowerCase();
    if (!emailToUse) {
      alert('Please select a registered database user or enter a creator email address');
      return;
    }
    try {
      setIsSubmittingCreator(true);
      const res = await adminApi.addCreator({
        creatorName: creatorStudioName.trim(),
        email: emailToUse,
        userId: selectedUser?.id,
        upiId: newCreatorUpi.trim() || undefined,
        assignedTitleIds: newCreatorAssignedTitleIds,
      });

      if (res?.success) {
        await fetchDashboardData();
        setCreatorSuccessMsg(`Successfully registered "${creatorStudioName.trim()}" in database!`);
        setTimeout(() => {
          setCreatorSuccessMsg(null);
          setIsAddCreatorOpen(false);
          setSelectedUser(null);
          setCreatorStudioName('');
          setNewCreatorEmail('');
          setNewCreatorUpi('');
          setNewCreatorAssignedTitleIds([]);
          setUserSearchQuery('');
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to add creator:', err);
      alert('Failed to register creator');
    } finally {
      setIsSubmittingCreator(false);
    }
  };

  const handleOpenEditCreator = (c: CreatorBreakdownItem) => {
    setEditingCreator(c);
    setEditCreatorName(c.creatorName);
    const initialEmail = c.email || (c.creatorName.toLowerCase().includes('cupice') ? 'monkstudioskpm@gmail.com' : '');
    setEditCreatorEmail(initialEmail);
    setEditCreatorUpi(c.upiId || '');
    const currentAssigned = c.assignedTitleIds && c.assignedTitleIds.length > 0
      ? c.assignedTitleIds
      : (c.titles ? c.titles.map((t) => t.id) : []);
    setEditAssignedTitleIds(currentAssigned);
    setEditSuccessMsg(null);
    setEditUserSearchQuery('');
    loadDatabaseUsers('');
  };

  const handleSaveEditCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreator) return;
    if (!editCreatorName.trim()) {
      alert('Please enter a Creator / Studio Name');
      return;
    }
    if (!editCreatorEmail.trim()) {
      alert('Please enter a valid creator email address');
      return;
    }

    try {
      setIsSavingEditCreator(true);
      await adminApi.updateCreator(editingCreator.id || editingCreator.creatorName, {
        creatorName: editCreatorName.trim(),
        email: editCreatorEmail.trim().toLowerCase(),
        upiId: editCreatorUpi.trim(),
        assignedTitleIds: editAssignedTitleIds,
      });

      setEditSuccessMsg(`Successfully saved "${editCreatorName.trim()}" to database!`);
      await fetchDashboardData();
      setTimeout(() => {
        setEditSuccessMsg(null);
        setEditingCreator(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to update creator:', err);
      alert('Failed to update creator');
    } finally {
      setIsSavingEditCreator(false);
    }
  };

  const handleDeleteCreator = async (c: CreatorBreakdownItem) => {
    if (!window.confirm(`Are you sure you want to remove Creator Studio "${c.creatorName}"?`)) {
      return;
    }
    try {
      await adminApi.deleteCreator(c.id || c.creatorName);
      await fetchDashboardData();
      if (editingCreator?.creatorName === c.creatorName) {
        setEditingCreator(null);
      }
    } catch (err) {
      console.error('Failed to delete creator:', err);
      alert('Failed to delete creator');
    }
  };

  const handleOpenQuickEdit = (t: Title) => {
    setQuickEditTitle(t);
    setQuickYear(t.year ? String(t.year) : '2025');
    setQuickLanguage(t.language || 'Tamil');
    setQuickAgeRating(t.ageRating || 'U/A');
    setQuickDurationMin(t.durationMin ? String(t.durationMin) : '90');
    setQuickPosterUrl(t.posterUrl || '');
    setQuickVerticalPosterUrl(t.verticalPosterUrl || '');
    setQuickBannerUrl(t.bannerUrl || '');
    setQuickEditSuccess(null);
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditTitle) return;
    try {
      setIsSavingQuickEdit(true);
      const parsedYear = quickYear ? parseInt(quickYear, 10) : undefined;
      const parsedDuration = quickDurationMin ? parseInt(quickDurationMin, 10) : undefined;

      const payload = {
        year: parsedYear,
        language: quickLanguage.trim(),
        ageRating: quickAgeRating.trim(),
        durationMin: parsedDuration,
        posterUrl: quickPosterUrl.trim() || undefined,
        verticalPosterUrl: quickVerticalPosterUrl.trim() || undefined,
        bannerUrl: quickBannerUrl.trim() || undefined,
      };

      await adminApi.updateTitle(quickEditTitle.id, payload);

      // Update state in real-time in the titles list
      setTitles((prev) =>
        prev.map((t) =>
          t.id === quickEditTitle.id
            ? {
                ...t,
                year: parsedYear ?? t.year,
                language: quickLanguage.trim(),
                ageRating: quickAgeRating.trim(),
                durationMin: parsedDuration ?? t.durationMin,
                posterUrl: quickPosterUrl.trim() || t.posterUrl,
                verticalPosterUrl: quickVerticalPosterUrl.trim() || t.verticalPosterUrl,
                bannerUrl: quickBannerUrl.trim() || t.bannerUrl,
              }
            : t
        )
      );

      setQuickEditSuccess(`Saved metadata & artwork for "${quickEditTitle.title}" to database!`);
      setTimeout(() => {
        setQuickEditSuccess(null);
        setQuickEditTitle(null);
      }, 1100);
    } catch (err) {
      console.error('Failed to save quick edit:', err);
      alert('Failed to save metadata to database.');
    } finally {
      setIsSavingQuickEdit(false);
    }
  };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const openPayoutModal = (stmt: PayoutStatementItem) => {
    setSelectedPayout(stmt);
    setModalAmount(stmt.netPayableInr);
    setModalUtr(stmt.paymentUtrNumber && stmt.paymentUtrNumber.startsWith('UTR9') || (stmt.paymentUtrNumber && stmt.paymentUtrNumber.startsWith('UTR8')) ? stmt.paymentUtrNumber : `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`);
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
    } catch (err: unknown) {
      console.error('Failed to save payout:', err);
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
        prev.map((t) => (t.id === id ? { ...t, status: res.status as 'PUBLISHED' | 'DRAFT' } : t))
      );
      if (stats) {
        setStats({
          ...stats,
          publishedTitles: res.status === 'PUBLISHED' ? stats.publishedTitles + 1 : stats.publishedTitles - 1,
          draftTitles: res.status === 'DRAFT' ? stats.draftTitles + 1 : stats.draftTitles - 1,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to toggle status:', err);
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
      setTitles((prev) => prev.filter((t) => t.id !== id && t.slug !== id));
      if (stats) {
        setStats({ ...stats, totalTitles: Math.max(0, stats.totalTitles - 1) });
      }
      fetchDashboardData().catch(() => {});
    } catch (err: unknown) {
      console.error('Failed to delete title:', err);
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
      {loading && (
        <div className="w-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center justify-between animate-pulse shadow-lg">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Connecting to Supabase PostgreSQL real-time catalog database...</span>
          </span>
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-lg">
          {error}
        </div>
      )}

      {/* Top Header Banner - Clean Balanced Alignment */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-[#0E172A] to-[#0A0F1D] border border-cyan-500/25 p-6 md:p-8 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-black uppercase tracking-widest shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Administrative Overview & Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Rasigan Admin Dashboard
            </h1>
            <p className="text-xs md:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Manage video catalog content, publish status, register creators by database search, and settle monthly payouts with UTR numbers.
            </p>
          </div>

          {/* Balanced Header Shortcut Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/admin/titles/new"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Content</span>
            </Link>

            <button
              onClick={() => {
                setActiveTab('creators-list');
                handleOpenAddCreator();
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Creator</span>
            </button>

            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete ALL content from the database? This will clear all titles so you can add them manually one by one.')) {
                  await adminApi.clearAllContent();
                  setTitles([]);
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-extrabold transition-all active:scale-95"
              title="Delete all content from database to add manually"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear DB</span>
            </button>

            <Link
              to="/admin/people"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Cast & Crew</span>
            </Link>

            <button
              onClick={() => setActiveTab('appearance')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-purple-500/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Appearance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics Cards - Curated Vibrant Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-950 border border-cyan-500/30 backdrop-blur-xl space-y-3 shadow-xl relative overflow-hidden group hover:border-cyan-400/50 transition-all">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-[11px] font-black uppercase tracking-wider">Catalog Titles</span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 shadow-inner">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">{titles.length || stats.totalTitles}</div>
            <div className="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{stats.publishedTitles} Published</span>
              <span className="text-gray-500">•</span>
              <span className="text-amber-400">{stats.draftTitles} Drafts</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-950 border border-emerald-500/30 backdrop-blur-xl space-y-3 shadow-xl relative overflow-hidden group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[11px] font-black uppercase tracking-wider">Gross Support Raised</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-inner">
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

        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-violet-500/10 via-slate-900/80 to-slate-950 border border-violet-500/30 backdrop-blur-xl space-y-3 shadow-xl relative overflow-hidden group hover:border-violet-400/50 transition-all">
          <div className="flex items-center justify-between text-violet-300">
            <span className="text-[11px] font-black uppercase tracking-wider">Creator Net Earnings</span>
            <div className="p-2.5 rounded-2xl bg-violet-500/20 text-violet-300 shadow-inner">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-violet-300">
              ₹{creatorsData.summary.totalNetEarningsInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-gray-400">Total net payable to creators</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-950 border border-amber-500/30 backdrop-blur-xl space-y-3 shadow-xl relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-[11px] font-black uppercase tracking-wider">Active Creators</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shadow-inner">
              <Building2 className="w-4 h-4" />
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

      {/* Main Tab Switcher - Vibrant Horizontal Scrollable Pills */}
      <div className="flex overflow-x-auto no-scrollbar items-center gap-2 border-b border-white/10 pb-3 -mx-2 px-2 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/40'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Catalog</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
            {titles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('creators-list')}
          className={`shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'creators-list'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/40'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Clapperboard className="w-4 h-4" />
          <span>Creators</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
            {creatorsData.summary.totalCreatorsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          className={`shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'creators'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/40'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Revenue</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'payouts'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400/40'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payouts & UTR</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
            {payoutsData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'appearance'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400/40'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Appearance & Ranking</span>
        </button>
      </div>

      {/* TAB 1: Catalog Management Table */}
      {activeTab === 'catalog' && (
        <div className="rounded-3xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>All Catalog Content</span>
              </h2>
              <p className="text-xs text-gray-400">
                Filter titles, inspect YouTube Studio analytics, check publish status, or edit content details.
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
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 font-semibold"
              >
                <option value="ALL">All Kinds</option>
                <option value="MOVIE">Movies</option>
                <option value="WEB_SERIES">Web Series</option>
                <option value="SHORT_FILM">Short Films</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 font-semibold"
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
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-black">
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Poster Link</th>
                    <th className="py-3 px-4">Movie Video Link</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTitles.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.posterUrl || item.verticalPosterUrl || item.bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'}
                            alt={item.title}
                            className="w-10 h-14 rounded-xl object-cover bg-slate-800 border border-white/10 flex-shrink-0 shadow-md"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <Link
                              to={`/title/${item.slug}`}
                              className="font-black text-white hover:text-cyan-400 transition-colors truncate block text-sm"
                            >
                              {item.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              <span className="font-semibold text-gray-300">{item.language || 'Tamil'}</span>
                              {item.year && <span>• {item.year}</span>}
                              {item.ageRating && (
                                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-black">
                                  {item.ageRating}
                                </span>
                              )}
                              {item.durationMin && <span>• {item.durationMin}m</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.posterUrl || item.verticalPosterUrl ? (
                          <a
                            href={(item.posterUrl || item.verticalPosterUrl) ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-mono transition-colors max-w-[150px] truncate"
                            title={(item.posterUrl || item.verticalPosterUrl) ?? undefined}
                          >
                            <span className="truncate">{item.posterUrl || item.verticalPosterUrl}</span>
                          </a>
                        ) : (
                          <span className="text-gray-500 italic text-[11px]">No Poster Link</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.videoUrl ? (
                          <a
                            href={item.videoUrl ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors max-w-[170px] truncate"
                            title={item.videoUrl ?? undefined}
                          >
                            <span className="truncate">{item.videoUrl}</span>
                          </a>
                        ) : (
                          <span className="text-gray-500 italic text-[11px]">No Movie Link</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold text-[11px]">
                          {item.kind === 'MOVIE' ? 'Movie' : item.kind === 'WEB_SERIES' ? 'Web Series' : 'Short Film'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-300 text-xs font-semibold">
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

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-200 font-bold">
                        {item.creatorName || 'Indie Studio'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(item.id)}
                          disabled={togglingId === item.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all border ${
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
                          <button
                            onClick={() => openTitleAnalytics(item.id)}
                            className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
                            title="View YouTube Studio Analytics & Payment Captures"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/title/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            title="View title page"
                          >
                            <Eye className="w-4 h-4 text-cyan-400" />
                          </Link>

                          <button
                            onClick={() => handleOpenQuickEdit(item)}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                            title="Quick Edit Year, Language, Certificate & Runtime (Realtime DB)"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/admin/titles/${item.id}/edit`}
                            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
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

      {/* TAB 2: Creators & Database User Promotion */}
      {activeTab === 'creators-list' && (
        <div className="rounded-3xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-amber-400" />
                <span>Creators Management & Database User Promotion</span>
              </h2>
              <p className="text-xs text-gray-400">
                View all active creator studios across Rasigan OTT or search database users to assign new creators.
              </p>
            </div>

            <button
              onClick={handleOpenAddCreator}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/30 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Creator by Searching Users</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creatorsData.creators.map((c, i) => (
              <div
                key={c.id || i}
                className="p-5 rounded-2xl bg-white/[0.03] border border-amber-500/20 flex flex-col justify-between gap-4 hover:border-amber-400/40 transition-all shadow-md group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">
                      {c.creatorName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                        <span>{c.creatorName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          {c.titlesCount} {c.titlesCount === 1 ? 'Title' : 'Titles'}
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified Creator Studio</span>
                      </div>
                      {c.email && (
                        <div className="text-[11px] font-mono text-cyan-300 mt-1 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-cyan-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] uppercase font-bold text-gray-400">Net Payable</div>
                    <div className="text-base font-black text-emerald-400">
                      ₹{c.netEarningsInr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-400 truncate">
                    {c.upiId ? (
                      <span className="font-mono text-amber-300/90">UPI: {c.upiId}</span>
                    ) : (
                      <span className="text-gray-500 text-[10px]">No UPI ID configured</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCreator(c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCreator(c)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all active:scale-95"
                      title="Remove Creator Studio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Revenue Breakdown */}
      {activeTab === 'creators' && (
        <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
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

            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-2 shadow-inner">
              <TrendingUp className="w-4 h-4" />
              <span>Total Net Creator Earnings: ₹{creatorsData.summary.totalNetEarningsInr.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-4">
            {creatorsData.creators.map((creator, idx) => {
              const isExpanded = expandedCreator === creator.creatorName;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden transition-all duration-200 hover:border-emerald-500/30"
                >
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

                  {isExpanded && (
                    <div className="p-5 border-t border-white/10 bg-slate-950/60 space-y-4">
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

      {/* TAB 4: Creator Payout Statements */}
      {activeTab === 'payouts' && (
        <div className="rounded-3xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-black">
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
                  <tr key={stmt.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-black text-white text-sm flex items-center gap-2">
                          <span>{stmt.creatorName}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono font-semibold">
                          {stmt.statementNumber}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-200">{stmt.cycle}</div>
                        <div className="text-[10px] text-gray-400">{stmt.period}</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-300 font-bold">
                      ₹{stmt.grossAmountInr.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-black text-emerald-400 text-sm">
                      ₹{stmt.netPayableInr.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {stmt.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-black text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>COMPLETED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-black text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>PROCESSING</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${stmt.status === 'COMPLETED' ? 'text-purple-300 bg-purple-500/10 border-purple-500/20' : 'text-gray-400 bg-white/5 border-white/10'}`}>
                          {stmt.paymentUtrNumber}
                        </span>
                        {stmt.paymentUtrNumber && stmt.paymentUtrNumber.startsWith('UTR') && !stmt.paymentUtrNumber.includes('PROCESSING') && (
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

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {stmt.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => openPayoutModal(stmt)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Payout Done</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openPayoutModal(stmt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-cyan-400" />
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

      {/* TAB 5: Appearance & Realtime Ranking Management Studio */}
      {activeTab === 'appearance' && (
        <div className="rounded-3xl bg-slate-900/80 border border-purple-500/25 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
          {/* Studio Header & Sub-Tab Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Appearance & Realtime Ranking Studio</span>
              </h2>
              <p className="text-xs text-gray-400">
                Control section order, feature pinned titles in top carousels, and manage custom rank ordering across Movies, Short Films, and Web Series in real time.
              </p>
            </div>

            {/* Sub-tab Switcher Buttons */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAppearanceSubTab('ranking');
                  setSearchParams({ tab: 'appearance', sub: 'ranking' });
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  appearanceSubTab === 'ranking' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                🏆 Title Rankings ({titles.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppearanceSubTab('featured');
                  setSearchParams({ tab: 'appearance', sub: 'featured' });
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  appearanceSubTab === 'featured' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                📌 Featured Hero Pins
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppearanceSubTab('sections');
                  setSearchParams({ tab: 'appearance', sub: 'sections' });
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  appearanceSubTab === 'sections' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                🎨 Section Controls
              </button>
            </div>
          </div>

          {/* Realtime Save Notification Toast */}
          {saveStatusMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveStatusMsg}</span>
            </div>
          )}

          {/* SUB-TAB 1: Realtime Custom Title Ranking Studio */}
          {appearanceSubTab === 'ranking' && (
            <div className="space-y-4">
              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {(['ALL', 'MOVIE', 'SHORT_FILM', 'WEB_SERIES'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setRankingsKindFilter(k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        rankingsKindFilter === k ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {k === 'ALL' ? 'All' : k === 'MOVIE' ? 'Movies' : k === 'SHORT_FILM' ? 'Short Films' : 'Web Series'}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search title to change rank..."
                    value={rankingsSearch}
                    onChange={(e) => setRankingsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Ranking List Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Rank (#)</th>
                      <th className="py-3 px-4">Title & Poster</th>
                      <th className="py-3 px-4">Kind</th>
                      <th className="py-3 px-4">Vertical Banner</th>
                      <th className="py-3 px-4">Custom Rank Value</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {titles
                      .filter((t) => rankingsKindFilter === 'ALL' || t.kind === rankingsKindFilter)
                      .filter((t) => !rankingsSearch || t.title.toLowerCase().includes(rankingsSearch.toLowerCase()))
                      .map((t, idx, arr) => {
                        const currentRank = titleRankings[t.id] !== undefined ? titleRankings[t.id] : (t.sortRank ?? idx + 1);
                        return (
                          <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 font-black text-sm text-purple-400">
                              #{idx + 1}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={t.verticalPosterUrl || t.posterUrl}
                                  alt={t.title}
                                  className="w-10 h-14 object-cover rounded-xl border border-white/10 shadow"
                                />
                                <div>
                                  <span className="font-extrabold text-white block text-sm">{t.title}</span>
                                  <span className="text-[10px] text-gray-400">{t.language} • {t.year || 2025} • {t.editorRating || '9.0'}★</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 font-bold text-[10px] border border-white/10 uppercase">
                                {t.kind}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {t.verticalPosterUrl ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                                  9:16 Attached
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                                  Fallback Poster
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={currentRank}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...titleRankings, [t.id]: val };
                                  setTitleRankings(updated);
                                  adminApi.updateTitleRankings(updated);
                                  setSaveStatusMsg(`Rank for "${t.title}" updated to #${val} in realtime!`);
                                  setTimeout(() => setSaveStatusMsg(null), 2500);
                                }}
                                className="w-20 px-2.5 py-1.5 rounded-xl bg-dark-card border border-purple-400/40 text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-purple-300"
                              />
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => {
                                    if (idx === 0) return;
                                    const prevTitle = arr[idx - 1];
                                    const newRankings = {
                                      ...titleRankings,
                                      [t.id]: idx,
                                      [prevTitle.id]: idx + 1,
                                    };
                                    setTitleRankings(newRankings);
                                    adminApi.updateTitleRankings(newRankings);
                                    setSaveStatusMsg(`Moved "${t.title}" up in realtime rank!`);
                                    setTimeout(() => setSaveStatusMsg(null), 2500);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 font-bold text-xs disabled:opacity-30 border border-white/10"
                                >
                                  ▲ Up
                                </button>

                                <button
                                  type="button"
                                  disabled={idx === arr.length - 1}
                                  onClick={() => {
                                    if (idx === arr.length - 1) return;
                                    const nextTitle = arr[idx + 1];
                                    const newRankings = {
                                      ...titleRankings,
                                      [t.id]: idx + 2,
                                      [nextTitle.id]: idx + 1,
                                    };
                                    setTitleRankings(newRankings);
                                    adminApi.updateTitleRankings(newRankings);
                                    setSaveStatusMsg(`Moved "${t.title}" down in realtime rank!`);
                                    setTimeout(() => setSaveStatusMsg(null), 2500);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 font-bold text-xs disabled:opacity-30 border border-white/10"
                                >
                                  ▼ Down
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: Featured Hero Pins & Multi-Selection */}
          {appearanceSubTab === 'featured' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between">
                <span><strong>Hero Carousel Pinning:</strong> Select multiple titles to feature in the top hero carousels for Home, Movies, Short Films, and Web Series pages.</span>
                <span className="px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 font-bold text-xs">
                  {appearanceSettings.featuredTitleIds?.length || 0} Titles Featured
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {titles.map((t) => {
                  const isFeat = appearanceSettings.featuredTitleIds?.includes(t.id) || t.isFeatured;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        const currentList = appearanceSettings.featuredTitleIds || [];
                        const updated = isFeat
                          ? currentList.filter((id) => id !== t.id)
                          : [...currentList, t.id];
                        const newSettings = { ...appearanceSettings, featuredTitleIds: updated };
                        setAppearanceSettings(newSettings);
                        adminApi.updateAppearanceSettings(newSettings);
                        setSaveStatusMsg(`Updated top hero carousel pinning for "${t.title}"!`);
                        setTimeout(() => setSaveStatusMsg(null), 2500);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isFeat
                          ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <img src={t.verticalPosterUrl || t.posterUrl} alt={t.title} className="w-12 h-16 object-cover rounded-xl border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-xs block text-white truncate">{t.title}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{t.kind}</span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isFeat ? 'bg-purple-500 text-white border-purple-300' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                            {isFeat ? '★ Featured in Hero' : 'Unpinned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: Page Section Customization */}
          {appearanceSubTab === 'sections' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Home Page Section Controls</span>
                </h3>

                <div className="space-y-2">
                  {appearanceSettings.homeSections.map((sec, idx) => (
                    <div key={sec.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-mono text-xs text-purple-400 font-bold">#{idx + 1}</span>
                        <input
                          type="text"
                          value={sec.name}
                          onChange={(e) => {
                            const updatedSecs = [...appearanceSettings.homeSections];
                            updatedSecs[idx].name = e.target.value;
                            const newSettings = { ...appearanceSettings, homeSections: updatedSecs };
                            setAppearanceSettings(newSettings);
                            adminApi.updateAppearanceSettings(newSettings);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedSecs = [...appearanceSettings.homeSections];
                            updatedSecs[idx].enabled = !updatedSecs[idx].enabled;
                            const newSettings = { ...appearanceSettings, homeSections: updatedSecs };
                            setAppearanceSettings(newSettings);
                            adminApi.updateAppearanceSettings(newSettings);
                            setSaveStatusMsg(`Section "${sec.name}" visibility updated!`);
                            setTimeout(() => setSaveStatusMsg(null), 2500);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                            sec.enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {sec.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* YouTube Studio Style Content Analytics Modal */}
      {selectedAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-[#0B0F19] border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAnalytics(null)}
              className="absolute top-5 right-5 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title Header Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-white/10 pb-6">
              <img
                src={selectedAnalytics.posterUrl}
                alt={selectedAnalytics.title}
                className="w-16 h-24 rounded-2xl object-cover border border-white/10 shadow-lg flex-shrink-0"
              />
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider">
                  <BarChart3 className="w-3 h-3" />
                  <span>Content Performance Analytics</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedAnalytics.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                  <span>Studio: <strong className="text-white">{selectedAnalytics.creatorName}</strong></span>
                  <span>•</span>
                  <span>Format: <strong className="text-purple-300">{selectedAnalytics.kind} ({selectedAnalytics.orientation})</strong></span>
                </div>
              </div>
            </div>

            {/* 4 Performance Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-cyan-400 text-xs font-bold">
                  <span>Total Plays</span>
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-white">{selectedAnalytics.totalViews.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">{selectedAnalytics.watchTimeHours} hrs watch time</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                  <span>Support Raised</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-emerald-400">₹{selectedAnalytics.fundingRaised.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-gray-400">{selectedAnalytics.fundingPercent}% of ₹{selectedAnalytics.fundingGoal.toLocaleString('en-IN')}</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
                  <span>Supporters</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-white">{selectedAnalytics.supportersCount}</div>
                <div className="text-[10px] text-gray-400">Direct backers</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-pink-400 text-xs font-bold">
                  <span>Rating & Likes</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-xl font-black text-white">{selectedAnalytics.editorRating} ★</div>
                <div className="text-[10px] text-gray-400">{selectedAnalytics.likesCount} viewer likes</div>
              </div>
            </div>

            {/* Funding Goal Progress Bar */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-300">Crowdfunding Target Progress</span>
                <span className="text-emerald-400">₹{selectedAnalytics.fundingRaised.toLocaleString('en-IN')} / ₹{selectedAnalytics.fundingGoal.toLocaleString('en-IN')} ({selectedAnalytics.fundingPercent}%)</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedAnalytics.fundingPercent}%` }}
                />
              </div>
            </div>

            {/* Payment Captures Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Captured Database Payments & Razorpay Transactions</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 uppercase text-[10px] font-mono">
                      <th className="py-2.5 px-3">Donor / Supporter</th>
                      <th className="py-2.5 px-3">Razorpay Payment ID</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedAnalytics.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{p.donorName}</div>
                          <div className="text-[10px] text-gray-400">{p.donorEmail}</div>
                          {p.message && <div className="text-[10px] text-rose-300 italic mt-0.5">"{p.message}"</div>}
                        </td>

                        <td className="py-3 px-3 font-mono text-purple-300 text-xs">
                          {p.razorpayPaymentId}
                        </td>

                        <td className="py-3 px-3 font-black text-emerald-400 text-sm">
                          ₹{p.amountInr.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            {p.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-gray-400 whitespace-nowrap">
                          {new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Creator / Promote User Modal Dialog */}
      {isAddCreatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F172A] border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddCreatorOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Add Creator & Promote User
              </h2>
              <p className="text-xs text-gray-400">
                Search all registered users in the database by name or email, then assign their Creator Studio name.
              </p>
            </div>

            {creatorSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{creatorSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCreator} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-300 block">
                  1. Select Registered User OR Enter Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {searchingUsers && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {foundUsers.length > 0 && !selectedUser && (
                  <div className="max-h-36 overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 divide-y divide-white/5">
                    {foundUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setNewCreatorEmail(u.email);
                          if (!creatorStudioName) {
                            setCreatorStudioName(`${u.name}'s Studio`);
                          }
                        }}
                        className="p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover bg-slate-800"
                          />
                          <div>
                            <div className="font-extrabold text-white text-xs">{u.name}</div>
                            <div className="text-[10px] text-gray-400">{u.email}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedUser ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <span className="text-gray-300">Selected User: <strong className="text-amber-300">{selectedUser.name}</strong> ({selectedUser.email})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setNewCreatorEmail('');
                    }}
                    className="text-[10px] text-rose-400 font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 block">
                    Or Enter Creator Email Manually:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="e.g. creator@example.com"
                      value={newCreatorEmail}
                      onChange={(e) => setNewCreatorEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-300 block">
                  2. Creator / Studio Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madurai Film Works"
                    value={creatorStudioName}
                    onChange={(e) => setCreatorStudioName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-extrabold text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-300 block">
                  3. Settlement UPI ID (Optional)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. creator@okhdfcbank"
                    value={newCreatorUpi}
                    onChange={(e) => setNewCreatorUpi(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-300 block">
                  4. Assign Catalog Titles (Optional)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-white/5 border border-white/10 p-2">
                  {titles.length === 0 ? (
                    <p className="text-xs text-gray-500 p-2">No catalog titles available.</p>
                  ) : (
                    titles.map((t) => {
                      const isChecked = newCreatorAssignedTitleIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-white/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCreatorAssignedTitleIds([...newCreatorAssignedTitleIds, t.id]);
                              } else {
                                setNewCreatorAssignedTitleIds(newCreatorAssignedTitleIds.filter((id) => id !== t.id));
                              }
                            }}
                            className="rounded border-white/20 text-amber-500 focus:ring-0"
                          />
                          <img src={t.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=80&auto=format&fit=crop&q=80'} alt={t.title} className="w-6 h-8 object-cover rounded" />
                          <span className="text-white font-bold text-xs truncate">{t.title}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddCreatorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingCreator}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingCreator ? 'Saving...' : 'Assign & Save Creator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Creator Modal Dialog */}
      {editingCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F172A] border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingCreator(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Edit3 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Edit Creator Studio & Scope
              </h2>
              <p className="text-xs text-gray-400">
                Update studio name, email, UPI ID, and assigned titles in the database.
              </p>
            </div>

            {editSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditCreator} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-300 block">
                  Creator / Studio Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={editCreatorName}
                    onChange={(e) => setEditCreatorName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-extrabold text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Select User from Database (1-Click Assignment) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-300 block">
                    Select User from Database (1-Click Assignment)
                  </label>
                  {loadingDbUsers && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" /> Loading users...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search registered user by name or email..."
                    value={editUserSearchQuery}
                    onChange={(e) => {
                      setEditUserSearchQuery(e.target.value);
                      loadDatabaseUsers(e.target.value);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {dbUsers.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-white/5 border border-white/10 p-2">
                    {dbUsers
                      .filter(
                        (u) =>
                          !editUserSearchQuery ||
                          u.name.toLowerCase().includes(editUserSearchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(editUserSearchQuery.toLowerCase())
                      )
                      .map((u) => {
                        const isSelected = editCreatorEmail.toLowerCase() === u.email.toLowerCase();
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              setEditCreatorEmail(u.email);
                              if (!editCreatorName.trim()) {
                                setEditCreatorName(u.name);
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-500/20 border border-amber-500/40'
                                : 'hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                                alt={u.name}
                                className="w-7 h-7 rounded-full object-cover bg-slate-800 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-extrabold text-white text-xs truncate">{u.name}</div>
                                <div className="text-[10px] text-gray-400 truncate">{u.email}</div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-white/5 text-amber-400 hover:bg-amber-500/15'
                              }`}
                            >
                              {isSelected ? 'Assigned ✓' : 'Assign'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-300 block">
                  Creator Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="creator@example.com"
                    value={editCreatorEmail}
                    onChange={(e) => setEditCreatorEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  When this user logs in with this email, their role is set to CREATOR and their dashboard will only display content assigned to this studio.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-300 block">
                  Settlement UPI ID (Optional)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. creator@okhdfcbank"
                    value={editCreatorUpi}
                    onChange={(e) => setEditCreatorUpi(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-300 block">
                    Assigned Catalog Content & Titles ({editAssignedTitleIds.length} Selected)
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold">Scoped to Creator</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl bg-white/5 border border-white/10 p-2.5">
                  {titles.length === 0 ? (
                    <p className="text-xs text-gray-400 p-2">No titles available in catalog.</p>
                  ) : (
                    titles.map((t) => {
                      const isChecked = editAssignedTitleIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                            isChecked ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditAssignedTitleIds([...editAssignedTitleIds, t.id]);
                                } else {
                                  setEditAssignedTitleIds(editAssignedTitleIds.filter((id) => id !== t.id));
                                }
                              }}
                              className="rounded border-white/20 text-amber-500 focus:ring-0"
                            />
                            <img
                              src={t.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=80&auto=format&fit=crop&q=80'}
                              alt={t.title}
                              className="w-7 h-10 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-white truncate">{t.title}</div>
                              <div className="text-[10px] text-gray-400">{t.kind} • {t.creatorName || 'Unassigned'}</div>
                            </div>
                          </div>
                          {isChecked && (
                            <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCreator(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEditCreator}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isSavingEditCreator ? 'Saving...' : 'Save to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Payout Completion Modal Dialog */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F172A] border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPayout(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Process Creator Payout
              </h2>
              <p className="text-xs text-gray-400">
                Mark payout statement <strong className="text-cyan-400 font-mono">{selectedPayout.statementNumber}</strong> as completed. Entered details will reflect directly in creator's portal.
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingPayout ? 'Saving...' : 'Save & Complete Payout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Edit Metadata Modal Dialog (Year, Language, Certificate, Runtime) */}
      {quickEditTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F172A] border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setQuickEditTitle(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Edit Movie Details & Metadata
              </h2>
              <p className="text-xs text-gray-400">
                Update release year, audio language, censor certificate, and runtime in the database real-time.
              </p>
            </div>

            {/* Target Title Card */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <img
                src={quickEditTitle.posterUrl || quickEditTitle.verticalPosterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'}
                alt={quickEditTitle.title}
                className="w-10 h-14 rounded-xl object-cover flex-shrink-0 bg-slate-800"
              />
              <div className="min-w-0">
                <div className="font-extrabold text-white text-sm truncate">{quickEditTitle.title}</div>
                <div className="text-[11px] text-gray-400">
                  {quickEditTitle.kind} • {quickEditTitle.orientation} • {quickEditTitle.creatorName || 'Indie Studio'}
                </div>
              </div>
            </div>

            {quickEditSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{quickEditSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Release Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-300 block">
                    Release Year <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1950"
                    max="2035"
                    required
                    value={quickYear}
                    onChange={(e) => setQuickYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-extrabold text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Audio Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-300 block">
                    Language <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={quickLanguage}
                    onChange={(e) => setQuickLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Malayalam">Malayalam (മലയാളം)</option>
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="English">English</option>
                  </select>
                </div>

                {/* Certificate / Censor Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-300 block">
                    Certificate (Age Rating) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={quickAgeRating}
                    onChange={(e) => setQuickAgeRating(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="U">U (Universal / All Ages)</option>
                    <option value="U/A">U/A (Parental Guidance)</option>
                    <option value="A">A (Adults 18+)</option>
                    <option value="U/A 7+">U/A 7+</option>
                    <option value="U/A 13+">U/A 13+</option>
                    <option value="U/A 16+">U/A 16+</option>
                  </select>
                </div>

                {/* Run Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-300 block">
                    Run Time (Minutes) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="600"
                      required
                      placeholder="e.g. 120"
                      value={quickDurationMin}
                      onChange={(e) => setQuickDurationMin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    {quickDurationMin && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">
                        {Math.floor(parseInt(quickDurationMin || '0', 10) / 60)}h {parseInt(quickDurationMin || '0', 10) % 60}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Poster & Artwork URLs */}
                <div className="sm:col-span-2 space-y-3 pt-2 border-t border-white/5">
                  <p className="text-xs font-bold text-amber-400">Artwork & Posters (URLs only - Realtime Sync)</p>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-300 block">
                      Poster URL (Standard / Grid Card)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={quickPosterUrl}
                      onChange={(e) => setQuickPosterUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-300 block">
                        Vertical Poster URL (9:16 Portrait)
                      </label>
                      <input
                        type="url"
                        placeholder="https://... (portrait 9:16)"
                        value={quickVerticalPosterUrl}
                        onChange={(e) => setQuickVerticalPosterUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-300 block">
                        Hero Banner URL (16:9 Landscape)
                      </label>
                      <input
                        type="url"
                        placeholder="https://... (landscape 16:9)"
                        value={quickBannerUrl}
                        onChange={(e) => setQuickBannerUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Artwork Preview */}
                  {(quickPosterUrl || quickVerticalPosterUrl || quickBannerUrl) && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-white/5">
                      {quickPosterUrl && (
                        <div className="text-center">
                          <span className="text-[9px] text-gray-400 block mb-1">Poster</span>
                          <img
                            src={quickPosterUrl}
                            alt="Poster preview"
                            className="w-12 h-16 object-cover rounded border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {quickVerticalPosterUrl && (
                        <div className="text-center">
                          <span className="text-[9px] text-gray-400 block mb-1">Vertical</span>
                          <img
                            src={quickVerticalPosterUrl}
                            alt="Vertical preview"
                            className="w-10 h-16 object-cover rounded border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {quickBannerUrl && (
                        <div className="text-center">
                          <span className="text-[9px] text-gray-400 block mb-1">Banner</span>
                          <img
                            src={quickBannerUrl}
                            alt="Banner preview"
                            className="w-24 h-14 object-cover rounded border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setQuickEditTitle(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingQuickEdit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingQuickEdit ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Save to Database Realtime</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
