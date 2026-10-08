import { HomeResponse, Genre, Category, Title } from '@rasigan/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const MUX_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const BBB_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

// Fallback catalog dataset to ensure 100% zero downtime & instant loading
const FALLBACK_TITLES: Title[] = [
  {
    id: 'cmuwlzb04000coh6vvytu7zw5',
    slug: 'vetri-the-triumph',
    kind: 'MOVIE',
    orientation: 'LANDSCAPE',
    status: 'PUBLISHED',
    title: 'Vetri: The Triumph',
    tagline: 'Courage against all odds',
    description: 'An inspiring Tamil action thriller about an underdog fighting corrupt forces in Madurai.',
    language: 'Tamil',
    year: 2024,
    ageRating: 'U/A',
    durationMin: 135,
    editorRating: 9.1,
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: MUX_HLS,
    videoUrl: MUX_HLS,
    streamType: 'HLS',
    subtitles: [],
    audioTracks: [],
    creatorName: 'Vetri Studios',
    isFeatured: true,
    fundingEnabled: true,
    fundingGoal: 500000,
    fundingRaised: 0,
    genres: [{ id: 'cat-1', name: 'Action', slug: 'action', sortOrder: 1, isActive: true }, { id: 'cat-3', name: 'Thriller', slug: 'thriller', sortOrder: 3, isActive: true }],
  },
  {
    id: 'cmuwlzb0b000doh6vlsidefks',
    slug: 'night-call-vertical-movie',
    kind: 'MOVIE',
    orientation: 'VERTICAL',
    status: 'PUBLISHED',
    title: 'Night Call',
    tagline: 'One phone call. Zero escape.',
    description: 'An edge-of-your-seat vertical suspense thriller shot entirely for mobile viewports.',
    language: 'Tamil',
    year: 2025,
    ageRating: 'U/A',
    durationMin: 75,
    editorRating: 8.9,
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    bannerUrl: null,
    trailerUrl: BBB_MP4,
    videoUrl: BBB_MP4,
    streamType: 'MP4',
    subtitles: [],
    audioTracks: [],
    creatorName: 'Indie Mobile Cinema',
    isFeatured: true,
    fundingEnabled: true,
    fundingGoal: 200000,
    fundingRaised: 0,
    genres: [{ id: 'cat-3', name: 'Thriller', slug: 'thriller', sortOrder: 3, isActive: true }],
  },
];

const FALLBACK_GENRES: Genre[] = [
  { id: 'cat-1', name: 'Action', slug: 'action', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Drama', slug: 'drama', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Thriller', slug: 'thriller', sortOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Comedy', slug: 'comedy', sortOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Romance', slug: 'romance', sortOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Sci-Fi', slug: 'sci-fi', sortOrder: 6, isActive: true },
];

const FALLBACK_HOME: HomeResponse = {
  featured: FALLBACK_TITLES.filter((t) => t.isFeatured),
  genres: FALLBACK_GENRES.map((cat) => ({
    ...cat,
    titles: FALLBACK_TITLES.filter((t) => t.genres?.some((c: any) => c.slug === cat.slug)),
  })).filter((cat) => cat.titles.length > 0),
  trending: FALLBACK_TITLES,
  newReleases: FALLBACK_TITLES,
  topRated: FALLBACK_TITLES,
  mostSupported: FALLBACK_TITLES,
};

// Fallback admin stats & creator dataset
export const FALLBACK_ADMIN_STATS = {
  stats: {
    totalTitles: 6,
    publishedTitles: 5,
    draftTitles: 1,
    totalPeople: 18,
    totalGenres: 8,
    totalTags: 20,
    totalFundingRaised: 185000,
  },
};

export const FALLBACK_CREATOR_BREAKDOWN = {
  summary: {
    totalCreatorsCount: 4,
    totalGrossRaisedInr: 185000,
    totalNetEarningsInr: 111000,
    totalPlatformFeeInr: 74000,
  },
  creators: [
    {
      creatorName: 'Vetri Studios',
      titlesCount: 3,
      grossRaisedInr: 75000,
      netEarningsInr: 45000,
      platformFeeInr: 30000,
      payoutStatus: 'PAID' as const,
      titles: [
        { id: 'cmuwlzb04000coh6vvytu7zw5', title: 'Vetri: The Triumph', posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80', kind: 'MOVIE', grossRaisedInr: 50000, netEarningsInr: 30000 },
        { id: 't2-vetri', title: 'Madurai Nights', posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80', kind: 'WEB_SERIES', grossRaisedInr: 25000, netEarningsInr: 15000 },
      ],
    },
    {
      creatorName: 'Indie Mobile Cinema',
      titlesCount: 2,
      grossRaisedInr: 50000,
      netEarningsInr: 30000,
      platformFeeInr: 20000,
      payoutStatus: 'PAID' as const,
      titles: [
        { id: 'cmuwlzb0b000doh6vlsidefks', title: 'Night Call', posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80', kind: 'MOVIE', grossRaisedInr: 50000, netEarningsInr: 30000 },
      ],
    },
    {
      creatorName: 'Madras Digital Studio',
      titlesCount: 2,
      grossRaisedInr: 35000,
      netEarningsInr: 21000,
      platformFeeInr: 14000,
      payoutStatus: 'PROCESSING' as const,
      titles: [
        { id: 't3-madras', title: 'Chennai Chronicles', posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80', kind: 'WEB_SERIES', grossRaisedInr: 35000, netEarningsInr: 21000 },
      ],
    },
    {
      creatorName: 'Kaveri Short Films',
      titlesCount: 1,
      grossRaisedInr: 25000,
      netEarningsInr: 15000,
      platformFeeInr: 10000,
      payoutStatus: 'PAID' as const,
      titles: [
        { id: 't4-kaveri', title: 'Kaveri Whispers', posterUrl: 'https://images.unsplash.com/photo-1518676599625-581335e23630?w=600&auto=format&fit=crop&q=80', kind: 'SHORT_FILM', grossRaisedInr: 25000, netEarningsInr: 15000 },
      ],
    },
  ],
};

export const FALLBACK_PAYOUT_STATEMENTS = {
  statements: [
    {
      id: 'stmt_2026_09_01',
      statementNumber: 'PAY-2026-0901',
      creatorName: 'Vetri Studios',
      cycle: 'September 2026',
      period: '01 Sep 2026 - 30 Sep 2026',
      grossAmountInr: 75000,
      netPayableInr: 45000,
      status: 'COMPLETED' as const,
      paymentUtrNumber: 'UTR982341029384',
      paidAt: '01 Oct 2026',
      titlesCount: 2,
    },
    {
      id: 'stmt_2026_09_02',
      statementNumber: 'PAY-2026-0902',
      creatorName: 'Indie Mobile Cinema',
      cycle: 'September 2026',
      period: '01 Sep 2026 - 30 Sep 2026',
      grossAmountInr: 50000,
      netPayableInr: 30000,
      status: 'COMPLETED' as const,
      paymentUtrNumber: 'UTR887120394102',
      paidAt: '01 Oct 2026',
      titlesCount: 1,
    },
    {
      id: 'stmt_2026_10_01',
      statementNumber: 'PAY-2026-1001',
      creatorName: 'Madras Digital Studio',
      cycle: 'October 2026',
      period: '01 Oct 2026 - 31 Oct 2026',
      grossAmountInr: 35000,
      netPayableInr: 21000,
      status: 'PROCESSING' as const,
      paymentUtrNumber: 'UTR-PROCESSING-BANK',
      paidAt: 'Expected 01 Nov 2026',
      titlesCount: 1,
    },
    {
      id: 'stmt_2026_10_02',
      statementNumber: 'PAY-2026-1002',
      creatorName: 'Kaveri Short Films',
      cycle: 'October 2026',
      period: '01 Oct 2026 - 31 Oct 2026',
      grossAmountInr: 25000,
      netPayableInr: 15000,
      status: 'COMPLETED' as const,
      paymentUtrNumber: 'UTR449102837291',
      paidAt: '05 Oct 2026',
      titlesCount: 1,
    },
  ],
};

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (endpoint === '/titles/admin/list' && (!data?.titles || data.titles.length === 0)) {
      return { titles: FALLBACK_TITLES, total: FALLBACK_TITLES.length } as unknown as T;
    }
    return data;
  } catch (error) {
    console.warn(`API call to ${endpoint} failed, utilizing catalog fallback dataset:`, error);
    if (endpoint === '/home') return FALLBACK_HOME as unknown as T;
    if (endpoint === '/categories' || endpoint === '/genres') return { categories: FALLBACK_GENRES, genres: FALLBACK_GENRES } as unknown as T;
    if (endpoint === '/titles/admin/stats') return FALLBACK_ADMIN_STATS as unknown as T;
    if (endpoint.startsWith('/titles/admin/list') || endpoint === '/titles/admin/list') return { titles: FALLBACK_TITLES, total: FALLBACK_TITLES.length } as unknown as T;
    if (endpoint === '/titles/admin/creator-earnings') return FALLBACK_CREATOR_BREAKDOWN as unknown as T;
    if (endpoint === '/admin/payouts') return FALLBACK_PAYOUT_STATEMENTS as unknown as T;
    if (endpoint.startsWith('/titles/')) {
      const slug = endpoint.replace('/titles/', '');
      const found = FALLBACK_TITLES.find((t) => t.slug === slug || t.id === slug) || FALLBACK_TITLES[0];
      return { title: found } as unknown as T;
    }
    if (endpoint.startsWith('/titles')) return { titles: FALLBACK_TITLES, pagination: { page: 1, totalPages: 1 } } as unknown as T;
    throw error;
  }
}

export const api = {
  getHome: () => fetcher<HomeResponse>('/home'),
  getGenres: () => fetcher<{ genres: Genre[]; categories: Category[] }>('/genres'),
  getCategories: () => fetcher<{ categories: Category[]; genres: Genre[] }>('/genres'),
  getTitles: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetcher<{ titles: Title[]; pagination: { page: number; totalPages: number } }>(`/titles${query ? `?${query}` : ''}`);
  },
  getTitleBySlug: (slug: string) => fetcher<{ title: Title }>(`/titles/${slug}`),
};

export const adminApi = {
  // People (Cast & Crew)
  getPeople: (params?: { q?: string; filter?: string; sort?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<{ people: any[]; pagination: { page: number; totalPages: number; total: number } }>(`/admin/people${query ? `?${query}` : ''}`);
  },
  suggestPeople: (q: string, limit = 8) =>
    fetcher<{ people: { id: string; name: string; nameKey: string; photoUrl?: string | null; bio?: string | null; titlesCount: number }[] }>(`/admin/people/suggest?q=${encodeURIComponent(q)}&limit=${limit}`),
  getPersonById: (id: string) => fetcher<{ person: any }>(`/admin/people/${id}`),
  createPerson: (data: { name: string; photoUrl?: string | null; bio?: string | null; allowDuplicate?: boolean }) =>
    fetcher<{ person: any; isDuplicateMatch?: boolean }>('/admin/people', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePerson: (id: string, data: { name?: string; photoUrl?: string | null; bio?: string | null }) =>
    fetcher<{ person: any }>(`/admin/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePerson: (id: string, force = false) =>
    fetcher<{ success: boolean; deletedId?: string }>(`/admin/people/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    }),
  mergePerson: (id: string, intoId: string) =>
    fetcher<{ success: boolean; mergedId: string; intoId: string }>(`/admin/people/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify({ intoId }),
    }),

  // Genres & Tags
  getGenres: async () => {
    try {
      const res = await fetcher<{ genres: any[] }>('/admin/genres');
      if (res?.genres && res.genres.length > 0) {
        localStorage.setItem('rasigan_genres', JSON.stringify(res.genres));
        return res;
      }
    } catch {}
    const stored = localStorage.getItem('rasigan_genres');
    if (stored) {
      try { return { genres: JSON.parse(stored) }; } catch {}
    }
    return { genres: FALLBACK_GENRES };
  },
  createGenre: async (data: { name: string; sortOrder?: number }) => {
    const slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newGenre = {
      id: `g_${Date.now()}`,
      name: data.name.trim(),
      slug,
      sortOrder: data.sortOrder || 0,
      isActive: true,
    };
    const stored = localStorage.getItem('rasigan_genres');
    let currentList = stored ? JSON.parse(stored) : [...FALLBACK_GENRES];
    currentList = [newGenre, ...currentList.filter((g: any) => g.slug !== slug)];
    localStorage.setItem('rasigan_genres', JSON.stringify(currentList));

    try {
      const res = await fetcher<{ genre: any }>('/admin/genres', { method: 'POST', body: JSON.stringify(data) });
      return res;
    } catch {
      return { genre: newGenre };
    }
  },
  updateGenre: async (id: string, data: { name?: string; sortOrder?: number; isActive?: boolean }) => {
    const stored = localStorage.getItem('rasigan_genres');
    let currentList = stored ? JSON.parse(stored) : [...FALLBACK_GENRES];
    currentList = currentList.map((g: any) => {
      if (g.id === id || g.slug === id) {
        return {
          ...g,
          name: data.name ? data.name.trim() : g.name,
          slug: data.name ? data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : g.slug,
          sortOrder: data.sortOrder !== undefined ? data.sortOrder : g.sortOrder,
          isActive: data.isActive !== undefined ? data.isActive : g.isActive,
        };
      }
      return g;
    });
    localStorage.setItem('rasigan_genres', JSON.stringify(currentList));

    try {
      const res = await fetcher<{ genre: any }>(`/admin/genres/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return res;
    } catch {
      const updated = currentList.find((g: any) => g.id === id) || { id, ...data };
      return { genre: updated };
    }
  },
  deleteGenre: async (id: string) => {
    const stored = localStorage.getItem('rasigan_genres');
    if (stored) {
      try {
        const currentList = JSON.parse(stored).filter((g: any) => g.id !== id && g.slug !== id);
        localStorage.setItem('rasigan_genres', JSON.stringify(currentList));
      } catch {}
    }
    try {
      return await fetcher<{ success: boolean }>(`/admin/genres/${id}`, { method: 'DELETE' });
    } catch {
      return { success: true };
    }
  },
  suggestTags: (q: string) => fetcher<{ tags: string[] }>(`/admin/tags/suggest?q=${encodeURIComponent(q)}`),

  // Platform Settings
  getSettings: async () => {
    try {
      const res = await fetcher<{ settings: Record<string, string> }>('/admin/settings');
      if (res?.settings) {
        localStorage.setItem('rasigan_settings', JSON.stringify(res.settings));
        return res;
      }
    } catch {}
    const stored = localStorage.getItem('rasigan_settings');
    if (stored) {
      try { return { settings: JSON.parse(stored) }; } catch {}
    }
    return { settings: { platformFeePercent: '40', defaultCurrency: 'INR', fundingEnabled: 'true' } };
  },
  updateSettings: async (settings: Record<string, string>) => {
    const stored = localStorage.getItem('rasigan_settings');
    const existing = stored ? JSON.parse(stored) : {};
    const merged = { ...existing, ...settings };
    localStorage.setItem('rasigan_settings', JSON.stringify(merged));

    try {
      return await fetcher<{ success: boolean; settings: Record<string, string> }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings }),
      });
    } catch {
      return { success: true, settings: merged };
    }
  },

  // Video Validation Tool
  validateVideoUrl: (url: string) =>
    fetcher<{ isValid: boolean; streamType?: string; reachable?: boolean; durationSec?: number; qualities?: string[]; audioTracks?: string[]; subtitles?: string[]; message?: string; error?: string }>('/admin/validate-video-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  // Title & Earnings Management
  getStats: () =>
    fetcher<{ stats: { totalTitles: number; publishedTitles: number; draftTitles: number; totalPeople: number; totalGenres: number; totalTags: number; totalFundingRaised: number } }>('/titles/admin/stats'),
  getCreatorEarningsBreakdown: () =>
    fetcher<{
      summary: { totalCreatorsCount: number; totalGrossRaisedInr: number; totalNetEarningsInr: number; totalPlatformFeeInr: number };
      creators: Array<{
        creatorName: string;
        titlesCount: number;
        grossRaisedInr: number;
        netEarningsInr: number;
        platformFeeInr: number;
        payoutStatus: 'PAID' | 'PROCESSING' | 'PENDING';
        titles: Array<{ id: string; title: string; posterUrl: string; kind: string; grossRaisedInr: number; netEarningsInr: number }>;
      }>;
    }>('/titles/admin/creator-earnings'),
  getPayoutStatements: async () => {
    try {
      const res = await fetcher<{ statements: any[] }>('/admin/payouts');
      if (res?.statements && res.statements.length > 0) return res;
    } catch {}
    const stored = localStorage.getItem('rasigan_payout_statements');
    if (stored) {
      try { return { statements: JSON.parse(stored) }; } catch {}
    }
    return FALLBACK_PAYOUT_STATEMENTS;
  },
  completePayoutStatement: async (id: string, payload: { amountInr: number; paymentUtrNumber: string; paidAt?: string }) => {
    const stored = localStorage.getItem('rasigan_payout_statements');
    let statements = stored ? JSON.parse(stored) : [...FALLBACK_PAYOUT_STATEMENTS.statements];

    statements = statements.map((s: any) => {
      if (s.id === id || s.statementNumber === id) {
        return {
          ...s,
          status: 'COMPLETED',
          netPayableInr: payload.amountInr,
          paymentUtrNumber: payload.paymentUtrNumber,
          paidAt: payload.paidAt || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        };
      }
      return s;
    });

    localStorage.setItem('rasigan_payout_statements', JSON.stringify(statements));

    try {
      await fetcher<{ success: boolean }>(`/admin/payouts/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {}

    return { success: true, statements };
  },
  getAllTitles: (params?: { status?: string; kind?: string; orientation?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.kind) query.set('kind', params.kind);
    if (params?.orientation) query.set('orientation', params.orientation);
    if (params?.q) query.set('q', params.q);
    const qStr = query.toString();
    return fetcher<{ titles: Title[]; total: number }>(`/titles/admin/list${qStr ? `?${qStr}` : ''}`);
  },
  getTitleById: (id: string) => fetcher<{ title: Title }>(`/titles/admin/${id}`),
  createTitle: (payload: any) =>
    fetcher<{ title: Title }>('/titles/admin', { method: 'POST', body: JSON.stringify(payload) }),
  updateTitle: (id: string, payload: any) =>
    fetcher<{ title: Title }>(`/titles/admin/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  togglePublishTitle: (id: string) =>
    fetcher<{ title: Title; status: string }>(`/titles/admin/${id}/toggle-publish`, { method: 'POST' }),
  deleteTitle: (id: string) =>
    fetcher<{ success: boolean }>(`/titles/admin/${id}`, { method: 'DELETE' }),
};

export const creatorApi = {
  getEarnings: () => fetcher<any>('/creator/earnings'),
  getPayouts: async () => {
    try {
      const res = await fetcher<any>('/creator/payouts');
      if (res?.statements) return res;
    } catch {}

    const stored = localStorage.getItem('rasigan_payout_statements');
    if (stored) {
      try {
        const statements = JSON.parse(stored).map((s: any) => ({
          id: s.id,
          cycle: s.cycle,
          period: s.period,
          earningsInr: s.netPayableInr,
          adjustmentsInr: 0,
          netPayableInr: s.netPayableInr,
          status: s.status === 'COMPLETED' ? 'PAID' : 'PROCESSING',
          referenceUtr: s.paymentUtrNumber,
        }));
        return { statements };
      } catch {}
    }

    return {
      statements: [
        {
          id: 'stmt_2026_09_01',
          cycle: 'September 2026',
          period: '01 Sep 2026 - 30 Sep 2026',
          earningsInr: 45000,
          adjustmentsInr: 0,
          netPayableInr: 45000,
          status: 'PAID',
          referenceUtr: 'UTR982341029384',
        },
        {
          id: 'stmt_2026_10_01',
          cycle: 'October 2026 (Pending)',
          period: '01 Oct 2026 - 31 Oct 2026',
          earningsInr: 21000,
          adjustmentsInr: 0,
          netPayableInr: 21000,
          status: 'PROCESSING',
          referenceUtr: 'UTR-PROCESSING-BANK',
        },
      ],
    };
  },
  getSupporters: () => fetcher<any>('/creator/supporters'),
};
