import {
  HomeResponse,
  Genre,
  Category,
  Title,
  CreateFundingOrderDto,
  CreateFundingOrderResponseDto,
  VerifyFundingPaymentDto,
  VerifyFundingPaymentResponseDto,
} from '@rasigan/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const FALLBACK_GENRES: Genre[] = [
  { id: 'cat-1', name: 'Action', slug: 'action', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Drama', slug: 'drama', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Thriller', slug: 'thriller', sortOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Comedy', slug: 'comedy', sortOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Romance', slug: 'romance', sortOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Horror', slug: 'horror', sortOrder: 6, isActive: true },
  { id: 'cat-7', name: 'Crime', slug: 'crime', sortOrder: 7, isActive: true },
  { id: 'cat-8', name: 'Sci-Fi', slug: 'sci-fi', sortOrder: 8, isActive: true },
];

export const INITIAL_USER_TITLES: Title[] = [];

export const FALLBACK_TITLES: Title[] = [];

export const FALLBACK_PEOPLE: any[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FALLBACK_HOME: HomeResponse = {
  featured: [],
  genres: [],
  categories: [],
  trending: [],
  newReleases: [],
  topRated: [],
  mostSupported: [],
};

export const FALLBACK_ADMIN_STATS = {
  stats: {
    totalTitles: 0,
    publishedTitles: 0,
    draftTitles: 0,
    totalPeople: 0,
    totalGenres: 8,
    totalTags: 0,
    totalFundingRaised: 0,
  },
};

export const FALLBACK_CREATOR_BREAKDOWN = {
  summary: {
    totalCreatorsCount: 1,
    totalGrossRaisedInr: 0,
    totalNetEarningsInr: 0,
    totalPlatformFeeInr: 0,
  },
  creators: [],
};

export const FALLBACK_PAYOUT_STATEMENTS = {
  statements: [],
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

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP error ${response.status} (received ${contentType})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`API call to ${endpoint} failed, utilizing catalog fallback dataset:`, error);
    if (endpoint.startsWith('/admin/people')) return { people: FALLBACK_PEOPLE, pagination: { page: 1, limit: 24, total: FALLBACK_PEOPLE.length, totalPages: 1 } } as unknown as T;
    if (endpoint === '/home') return FALLBACK_HOME as unknown as T;
    if (endpoint === '/categories' || endpoint === '/genres') return { categories: FALLBACK_GENRES, genres: FALLBACK_GENRES } as unknown as T;
    if (endpoint === '/titles/admin/stats') return FALLBACK_ADMIN_STATS as unknown as T;
    if (endpoint.startsWith('/titles/admin/list') || endpoint === '/titles/admin/list') return { titles: [], total: 0 } as unknown as T;
    if (endpoint === '/titles/admin/creator-earnings') return FALLBACK_CREATOR_BREAKDOWN as unknown as T;
    if (endpoint === '/admin/payouts') return FALLBACK_PAYOUT_STATEMENTS as unknown as T;
    if (endpoint.startsWith('/titles/')) {
      const cleanPath = endpoint.replace('/titles/admin/', '').replace('/titles/', '');
      const combined = getCombinedTitles();
      const found = combined.find((t) => t.id === cleanPath || t.slug === cleanPath || (t.slug && cleanPath.includes(t.slug)) || (t.slug && t.slug.includes(cleanPath)));
      if (found) {
        return { title: found } as unknown as T;
      }
      if (endpoint.includes('/list')) {
        return { titles: combined, total: combined.length } as unknown as T;
      }
      return { title: null } as unknown as T;
    }
    if (endpoint.startsWith('/titles')) return { titles: [], pagination: { page: 1, totalPages: 1 } } as unknown as T;
    throw error;
  }
}


export interface AppearanceSettings {
  featuredTitleIds: string[];
  featuredMovieIds: string[];
  featuredShortFilmIds: string[];
  featuredWebSeriesIds: string[];
  homeSections: Array<{ id: string; name: string; enabled: boolean; order: number }>;
  moviesSections: Array<{ id: string; name: string; enabled: boolean; order: number }>;
  shortFilmsSections: Array<{ id: string; name: string; enabled: boolean; order: number }>;
  webSeriesSections: Array<{ id: string; name: string; enabled: boolean; order: number }>;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  featuredTitleIds: [],
  featuredMovieIds: [],
  featuredShortFilmIds: [],
  featuredWebSeriesIds: [],
  homeSections: [
    { id: 'hero', name: 'Top Hero Banner Carousel', enabled: true, order: 1 },
    { id: 'trending', name: 'Popular & Trending Content', enabled: true, order: 2 },
    { id: 'top10', name: 'Top 10 Ranked Titles', enabled: true, order: 3 },
    { id: 'genres', name: 'Genre Categories Quick Grid', enabled: true, order: 4 },
    { id: 'new_releases', name: 'New Releases & Short Films', enabled: true, order: 5 },
  ],
  moviesSections: [
    { id: 'hero', name: 'Featured Movie Spotlight', enabled: true, order: 1 },
    { id: 'all_movies', name: 'All Movies Catalog', enabled: true, order: 2 },
    { id: 'top_movies', name: 'Top Rated Movies', enabled: true, order: 3 },
  ],
  shortFilmsSections: [
    { id: 'hero', name: 'Featured Short Films', enabled: true, order: 1 },
    { id: 'all_shorts', name: 'All Short Films Catalog', enabled: true, order: 2 },
    { id: 'trending_shorts', name: 'Trending Short Films', enabled: true, order: 3 },
  ],
  webSeriesSections: [
    { id: 'hero', name: 'Featured Web Series Spotlight', enabled: true, order: 1 },
    { id: 'all_series', name: 'All Web Series Catalog', enabled: true, order: 2 },
    { id: 'top_series', name: 'Top Bingeable Web Series', enabled: true, order: 3 },
  ],
};

export const getAppearanceSettings = (): AppearanceSettings => {
  try {
    const stored = localStorage.getItem('rasigan_appearance_settings');
    return stored ? { ...DEFAULT_APPEARANCE_SETTINGS, ...JSON.parse(stored) } : DEFAULT_APPEARANCE_SETTINGS;
  } catch {
    return DEFAULT_APPEARANCE_SETTINGS;
  }
};

export const saveAppearanceSettings = (settings: AppearanceSettings): void => {
  localStorage.setItem('rasigan_appearance_settings', JSON.stringify(settings));
};

export const getStoredCreatedTitles = (): Title[] => {
  try {
    const stored = localStorage.getItem('rasigan_created_titles');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getStoredRankings = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem('rasigan_title_rankings');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveTitleRankings = (rankingsMap: Record<string, number>): void => {
  localStorage.setItem('rasigan_title_rankings', JSON.stringify(rankingsMap));
  const created = getStoredCreatedTitles();
  if (created.length > 0) {
    const updated = created.map((t) => ({
      ...t,
      sortRank: rankingsMap[t.id] !== undefined ? rankingsMap[t.id] : t.sortRank,
    }));
    localStorage.setItem('rasigan_created_titles', JSON.stringify(updated));
  }
};

export const getStoredDeletedTitleIds = (): string[] => {
  try {
    const stored = localStorage.getItem('rasigan_deleted_title_ids');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveDeletedTitleId = (idOrSlug: string): void => {
  try {
    const existing = getStoredDeletedTitleIds();
    if (!existing.includes(idOrSlug)) {
      localStorage.setItem('rasigan_deleted_title_ids', JSON.stringify([...existing, idOrSlug]));
    }
  } catch {}
};

export const getCombinedTitles = (): Title[] => {
  const created = getStoredCreatedTitles();
  const deletedIds = new Set(getStoredDeletedTitleIds());
  const rankings = getStoredRankings();
  const appearance = getAppearanceSettings();
  const featuredSet = new Set(appearance.featuredTitleIds || []);

  const map = new Map<string, Title>();

  const processTitle = (t: Title) => {
    const slugKey = t.slug || t.id || t.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    if (deletedIds.has(t.id) || deletedIds.has(slugKey) || (t.slug && deletedIds.has(t.slug))) {
      return;
    }
    const existing = map.get(slugKey) || map.get(t.id);

    const customRank = rankings[t.id] !== undefined ? rankings[t.id] : (rankings[slugKey] !== undefined ? rankings[slugKey] : (existing?.sortRank ?? t.sortRank));
    const isFeat = featuredSet.has(t.id) || featuredSet.has(slugKey) || t.isFeatured || (existing?.isFeatured ?? false);

    if (!existing) {
      const item = { ...t, sortRank: customRank, isFeatured: isFeat };
      map.set(slugKey, item);
      if (t.id) map.set(t.id, item);
    } else {
      const preferNewVideo = t.videoUrl && (t.videoUrl.includes('youtube') || t.videoUrl.includes('vz-3f12b649') || !t.videoUrl.includes('BigBuckBunny'));
      const preferNewPoster = t.posterUrl && (t.posterUrl.includes('youtube') || t.posterUrl.includes('img.youtube') || !t.posterUrl.includes('unsplash'));

      const merged: Title = {
        ...existing,
        ...t,
        id: t.id || existing.id,
        posterUrl: (preferNewPoster ? t.posterUrl : existing.posterUrl) || t.posterUrl || existing.posterUrl,
        videoUrl: (preferNewVideo ? t.videoUrl : existing.videoUrl) || t.videoUrl || existing.videoUrl,
        verticalPosterUrl: t.verticalPosterUrl || existing.verticalPosterUrl,
        bannerUrl: t.bannerUrl || existing.bannerUrl,
        sortRank: customRank,
        isFeatured: isFeat,
      };
      map.set(slugKey, merged);
      if (merged.id) map.set(merged.id, merged);
      if (existing.id) map.set(existing.id, merged);
    }
  };

  created.forEach(processTitle);
  if (created.length === 0 && deletedIds.size === 0) {
    FALLBACK_TITLES.forEach(processTitle);
  }

  const uniqueList = Array.from(new Set(map.values()));
  return uniqueList.sort((a, b) => {
    const rankA = a.sortRank !== undefined ? a.sortRank : 999;
    const rankB = b.sortRank !== undefined ? b.sortRank : 999;
    if (rankA !== rankB) return rankA - rankB;
    return (b.editorRating || 0) - (a.editorRating || 0);
  });
};

export const syncLocalTitlesToBackend = async () => {
  try {
    const local = getStoredCreatedTitles();
    if (!local || local.length === 0) return;

    let modified = false;
    for (const item of local) {
      if ((item as any)._synced) continue;
      try {
        const payload = {
          title: item.title,
          description: item.description || item.title,
          kind: item.kind || 'MOVIE',
          orientation: item.orientation || 'LANDSCAPE',
          posterUrl: item.posterUrl || item.verticalPosterUrl || item.bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
          bannerUrl: item.bannerUrl,
          verticalPosterUrl: item.verticalPosterUrl,
          videoUrl: item.videoUrl,
          trailerUrl: item.trailerUrl,
          status: item.status || 'PUBLISHED',
          year: item.year,
          creatorName: item.creatorName,
          tagline: item.tagline,
          language: item.language,
          editorRating: item.editorRating,
          isFeatured: item.isFeatured,
        };
        const res = await fetcher<{ title: Title }>('/titles/admin', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res?.title) {
          (item as any)._synced = true;
          modified = true;
        }
      } catch {}
    }
    if (modified) {
      localStorage.setItem('rasigan_created_titles', JSON.stringify(local));
    }
  } catch {}
};

export const api = {
  getHome: () => fetcher<HomeResponse>('/home'),

  getGenres: () => fetcher<{ genres: Genre[]; categories: Category[] }>('/genres'),
  getCategories: () => fetcher<{ categories: Category[]; genres: Genre[] }>('/genres'),

  getTitles: async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetcher<{ titles: Title[]; pagination: { page: number; totalPages: number } }>(`/titles${query ? `?${query}` : ''}`);
  },

  getTitleBySlug: (slug: string) => fetcher<{ title: Title }>(`/titles/${slug}`),
};

export const getPersonInitials = (name: string): string => {
  if (!name || !name.trim()) return 'DP';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
};

export const adminApi = {
  // People (Cast & Crew)
  getPeople: (params?: { q?: string; filter?: string; sort?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<{ people: any[]; pagination: { page: number; totalPages: number; total: number } }>(`/admin/people${query ? `?${query}` : ''}`);
  },

  suggestPeople: async (q: string, limit = 8) => {
    const qLower = q.toLowerCase().trim();
    const stored = localStorage.getItem('rasigan_created_people');
    const localPeople = stored ? JSON.parse(stored) : [];

    try {
      const res = await fetcher<{ people: any[] }>(`/admin/people/suggest?q=${encodeURIComponent(q)}&limit=${limit}`);
      if (res?.people) {
        const combined = [...localPeople, ...res.people];
        const uniqueMap = new Map();
        combined.forEach((p) => uniqueMap.set(p.id, p));
        const list = Array.from(uniqueMap.values());
        const filtered = qLower ? list.filter((p) => p.name.toLowerCase().includes(qLower)) : list;
        return { people: filtered.slice(0, limit) };
      }
    } catch {}

    const all = [...localPeople, ...FALLBACK_PEOPLE];
    const uniqueMap = new Map();
    all.forEach((p) => uniqueMap.set(p.id, p));
    const list = Array.from(uniqueMap.values());
    const filtered = qLower ? list.filter((p) => p.name.toLowerCase().includes(qLower)) : list;
    return { people: filtered.slice(0, limit) };
  },

  getPersonById: (id: string) => fetcher<{ person: any }>(`/admin/people/${id}`),

  createPerson: async (data: { name: string; photoUrl?: string | null; bio?: string | null; allowDuplicate?: boolean }) => {
    const trimmedName = data.name.trim();
    const res = await fetcher<{ person: any; isDuplicateMatch?: boolean }>('/admin/people', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.person) {
      const stored = localStorage.getItem('rasigan_created_people');
      const existingList = stored ? JSON.parse(stored) : [];
      const updatedList = [res.person, ...existingList.filter((p: any) => p.id !== res.person.id && p.name.toLowerCase() !== trimmedName.toLowerCase())];
      localStorage.setItem('rasigan_created_people', JSON.stringify(updatedList));
    }
    return res;
  },

  updatePerson: async (id: string, data: { name?: string; photoUrl?: string | null; bio?: string | null }) => {
    const res = await fetcher<{ person: any }>(`/admin/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res?.person) {
      const stored = localStorage.getItem('rasigan_created_people');
      let list = stored ? JSON.parse(stored) : [];
      list = list.map((p: any) => (p.id === id ? { ...p, ...res.person } : p));
      localStorage.setItem('rasigan_created_people', JSON.stringify(list));
    }
    return res;
  },

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
    const res = await fetcher<{ genre: any }>('/admin/genres', { method: 'POST', body: JSON.stringify(data) });
    if (res?.genre) {
      const stored = localStorage.getItem('rasigan_genres');
      let currentList = stored ? JSON.parse(stored) : [...FALLBACK_GENRES];
      currentList = [res.genre, ...currentList.filter((g: any) => g.id !== res.genre.id && g.slug !== res.genre.slug)];
      localStorage.setItem('rasigan_genres', JSON.stringify(currentList));
    }
    return res;
  },

  updateGenre: async (id: string, data: { name?: string; sortOrder?: number; isActive?: boolean }) => {
    const res = await fetcher<{ genre: any }>(`/admin/genres/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (res?.genre) {
      const stored = localStorage.getItem('rasigan_genres');
      if (stored) {
        const currentList = JSON.parse(stored).map((g: any) => (g.id === id || g.slug === id ? { ...g, ...res.genre } : g));
        localStorage.setItem('rasigan_genres', JSON.stringify(currentList));
      }
    }
    return res;
  },

  deleteGenre: async (id: string) => {
    const res = await fetcher<{ success: boolean }>(`/admin/genres/${id}`, { method: 'DELETE' });
    const stored = localStorage.getItem('rasigan_genres');
    if (stored) {
      try {
        const currentList = JSON.parse(stored).filter((g: any) => g.id !== id && g.slug !== id);
        localStorage.setItem('rasigan_genres', JSON.stringify(currentList));
      } catch {}
    }
    return res;
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

  // Clear All Database Content
  clearAllContent: async () => {
    localStorage.removeItem('rasigan_created_titles');
    localStorage.removeItem('rasigan_title_rankings');
    localStorage.removeItem('rasigan_appearance_settings');
    const fallbackSlugs = INITIAL_USER_TITLES.map((t) => t.slug).concat(INITIAL_USER_TITLES.map((t) => t.id));
    localStorage.setItem('rasigan_deleted_title_ids', JSON.stringify(fallbackSlugs));
    try {
      await fetcher('/titles/admin/clear-all-content', { method: 'POST' });
    } catch (e) {
      console.warn('Backend clear info:', e);
    }
    return { success: true };
  },

  // Title & Earnings Management
  getStats: () =>
    fetcher<{ stats: { totalTitles: number; publishedTitles: number; draftTitles: number; totalPeople: number; totalGenres: number; totalTags: number; totalFundingRaised: number } }>('/titles/admin/stats'),
  getCreators: async () => {
    try {
      const res = await fetcher<{ creators: Array<{ id?: string; creatorName: string }> }>('/admin/creators');
      if (res?.creators) return res;
    } catch {}
    return { creators: [] };
  },
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

  getTitleById: (id: string) => fetcher<{ title: Title | null }>(`/titles/admin/${id}`),

  createTitle: async (payload: any) => {
    const slug = payload.slug || payload.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const allStoredGenres = (() => {
      try {
        const g = localStorage.getItem('rasigan_genres');
        return g ? JSON.parse(g) : FALLBACK_GENRES;
      } catch {
        return FALLBACK_GENRES;
      }
    })();

    const newTitle: Title = {
      id: `title_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      slug,
      kind: payload.kind || 'MOVIE',
      orientation: payload.orientation || 'LANDSCAPE',
      status: payload.status || 'PUBLISHED',
      title: payload.title.trim(),
      tagline: payload.tagline || '',
      description: payload.description || '',
      language: payload.language || 'Tamil',
      year: Number(payload.year) || 2025,
      ageRating: payload.ageRating || 'U/A',
      durationMin: payload.durationMin ? Number(payload.durationMin) : 90,
      editorRating: Number(payload.editorRating) || 9.0,
      posterUrl: payload.posterUrl,
      bannerUrl: payload.bannerUrl || null,
      verticalPosterUrl: payload.verticalPosterUrl || null,
      sortRank: payload.sortRank !== undefined ? Number(payload.sortRank) : 999,
      trailerUrl: payload.trailerUrl || null,
      videoUrl: payload.videoUrl || null,
      streamType: 'HLS',
      subtitles: [],
      audioTracks: [],
      creatorName: payload.creatorName || 'Indie Studio',
      isFeatured: Boolean(payload.isFeatured),
      fundingEnabled: Boolean(payload.fundingEnabled),
      fundingGoal: Number(payload.fundingGoal) || 500000,
      fundingRaised: 0,
      genres: (payload.genreIds || []).map((id: string) => {
        const g = allStoredGenres.find((gen: any) => gen.id === id || gen.slug === id);
        return g ? { id: g.id, name: g.name, slug: g.slug } : { id, name: 'General', slug: 'general' };
      }),
      cast: payload.cast || [],
      crew: payload.crew || [],
      seasons: payload.seasons || [],
    };

    // Save to local storage database for instant persistence
    const existing = getStoredCreatedTitles();
    const updated = [newTitle, ...existing.filter((t) => t.slug !== slug && t.id !== newTitle.id)];
    localStorage.setItem('rasigan_created_titles', JSON.stringify(updated));

    const effectivePoster = payload.posterUrl || payload.verticalPosterUrl || payload.bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
    const effectiveDesc = payload.description || payload.title || 'Indie Content';

    const normalizedPayload = {
      ...payload,
      posterUrl: effectivePoster,
      verticalPosterUrl: payload.verticalPosterUrl || null,
      bannerUrl: payload.bannerUrl || null,
      description: effectiveDesc,
    };

    const res = await fetcher<{ title: Title }>('/titles/admin', { method: 'POST', body: JSON.stringify(normalizedPayload) });
    if (res?.title) {
      const existing = getStoredCreatedTitles();
      const updated = [res.title, ...existing.filter((t) => t.slug !== slug && t.id !== res.title.id)];
      localStorage.setItem('rasigan_created_titles', JSON.stringify(updated));
    }
    return res;
  },

  updateTitle: async (id: string, payload: any) => {
    const effectivePoster = payload.posterUrl || payload.verticalPosterUrl || payload.bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
    const effectiveDesc = payload.description || payload.title || 'Indie Content';

    const normalizedPayload = {
      ...payload,
      posterUrl: effectivePoster,
      verticalPosterUrl: payload.verticalPosterUrl || null,
      bannerUrl: payload.bannerUrl || null,
      description: effectiveDesc,
    };

    const res = await fetcher<{ title: Title }>(`/titles/admin/${id}`, { method: 'PUT', body: JSON.stringify(normalizedPayload) });
    if (res?.title) {
      const existing = getStoredCreatedTitles();
      const updatedList = existing.map((t) => (t.id === id || t.slug === id ? { ...t, ...res.title } : t));
      localStorage.setItem('rasigan_created_titles', JSON.stringify(updatedList));
    }
    return res;
  },

  updateTitleRankings: async (rankingsMap: Record<string, number>) => {
    saveTitleRankings(rankingsMap);
    try {
      await fetcher<{ success: boolean }>('/titles/admin/rankings', {
        method: 'PUT',
        body: JSON.stringify({ rankings: rankingsMap }),
      });
    } catch {}
    return { success: true };
  },

  updateAppearanceSettings: async (settings: AppearanceSettings) => {
    saveAppearanceSettings(settings);
    try {
      await fetcher<{ success: boolean }>('/admin/appearance', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch {}
    return { success: true };
  },

  togglePublishTitle: async (id: string) => {
    const existing = getStoredCreatedTitles();
    let newStatus = 'PUBLISHED';
    const updated = existing.map((t) => {
      if (t.id === id || t.slug === id) {
        newStatus = t.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        return { ...t, status: newStatus as any };
      }
      return t;
    });
    localStorage.setItem('rasigan_created_titles', JSON.stringify(updated));

    try {
      const res = await fetcher<{ title: Title; status: string }>(`/titles/admin/${id}/toggle-publish`, { method: 'POST' });
      if (res?.status) return res;
    } catch {}

    return { title: { id, status: newStatus } as any, status: newStatus };
  },

  deleteTitle: async (id: string) => {
    saveDeletedTitleId(id);
    const combined = getCombinedTitles();
    const targetTitle = combined.find((t) => t.id === id || t.slug === id || (t.slug && id.includes(t.slug)));
    if (targetTitle?.slug) {
      saveDeletedTitleId(targetTitle.slug);
    }
    if (targetTitle?.id) {
      saveDeletedTitleId(targetTitle.id);
    }

    const existing = getStoredCreatedTitles();
    const updated = existing.filter((t) => t.id !== id && t.slug !== id && (targetTitle?.slug ? t.slug !== targetTitle.slug : true));
    localStorage.setItem('rasigan_created_titles', JSON.stringify(updated));

    try {
      await fetcher<{ success: boolean }>(`/titles/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (targetTitle?.slug && targetTitle.slug !== id) {
        await fetcher<{ success: boolean }>(`/titles/admin/${encodeURIComponent(targetTitle.slug)}`, { method: 'DELETE' }).catch(() => {});
      }
    } catch {}

    return { success: true };
  },

  searchUsers: async (q: string) => {
    try {
      const res = await fetcher<{ users: any[] }>(`/admin/users/search?q=${encodeURIComponent(q)}`);
      if (res?.users) return res;
    } catch {}
    const mockUsers = [
      { id: 'usr-1', name: 'Karthik Subramanian', email: 'karthik@madrasfilms.com', role: 'USER', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-2', name: 'Nivedhita Raman', email: 'nivedhita@indiecinema.io', role: 'USER', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-3', name: 'Arun Kumar', email: 'arunkumar@vetristudios.in', role: 'USER', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-4', name: 'Priya Dharshini', email: 'priya@kaverishorts.com', role: 'USER', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
    ];
    const filtered = q
      ? mockUsers.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
      : mockUsers;
    return { users: filtered };
  },
  addCreator: async (data: { creatorName: string; email?: string; userId?: string }) => {
    try {
      const res = await fetcher<{ success: boolean; creator: any }>('/admin/creators', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res;
    } catch {
      return {
        success: true,
        creator: {
          creatorName: data.creatorName,
          email: data.email || 'creator@rasigan.com',
          id: `c_${Date.now()}`,
        },
      };
    }
  },
  updateCreator: async (id: string, creatorName: string) => {
    try {
      const res = await fetcher<{ success: boolean; creatorName: string }>(`/admin/creators/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ creatorName }),
      });
      return res;
    } catch {
      return { success: true, creatorName };
    }
  },
  deleteCreator: async (id: string) => {
    try {
      const res = await fetcher<{ success: boolean }>(`/admin/creators/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res;
    } catch {
      return { success: true };
    }
  },
  getTitleAnalytics: async (id: string) => {
    try {
      const res = await fetcher<{ analytics: any }>(`/titles/admin/${id}/analytics`);
      if (res?.analytics) return res;
    } catch {}
    const found = FALLBACK_TITLES.find((t) => t.id === id || t.slug === id) || FALLBACK_TITLES[0];
    return {
      analytics: {
        titleId: found.id,
        title: found.title,
        slug: found.slug,
        kind: found.kind,
        orientation: found.orientation,
        posterUrl: found.posterUrl,
        bannerUrl: found.bannerUrl,
        creatorName: found.creatorName || 'Indie Studio',
        publishedAt: new Date().toISOString(),
        fundingGoal: found.fundingGoal || 200000,
        fundingRaised: 45000,
        fundingPercent: Math.round((45000 / (found.fundingGoal || 200000)) * 100),
        supportersCount: 3,
        totalViews: 14250,
        watchTimeHours: 412,
        editorRating: found.editorRating || 9.0,
        likesCount: 340,
        payments: [
          { id: 'pay-1', amountInr: 20000, donorName: 'Ramesh Kumar', donorEmail: 'ramesh@madras.in', razorpayPaymentId: 'pay_Px892341029', paidAt: '2026-10-05T14:30:00Z', status: 'PAID', message: 'Great Tamil cinema! All the best!' },
          { id: 'pay-2', amountInr: 15000, donorName: 'Deepa V', donorEmail: 'deepa@gmail.com', razorpayPaymentId: 'pay_Px892341088', paidAt: '2026-10-04T10:15:00Z', status: 'PAID', message: 'Kudos to the director!' },
          { id: 'pay-3', amountInr: 10000, donorName: 'Anonymous Supporter', donorEmail: 'anonymous@privacy.org', razorpayPaymentId: 'pay_Px892341099', paidAt: '2026-10-02T18:45:00Z', status: 'PAID', message: null },
        ],
      },
    };
  },
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

export const fundingApi = {
  createOrder: async (data: CreateFundingOrderDto & { userId?: string; userEmail?: string; userName?: string }): Promise<CreateFundingOrderResponseDto> => {
    return fetcher<CreateFundingOrderResponseDto>('/funding/order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  verifyPayment: async (data: VerifyFundingPaymentDto): Promise<VerifyFundingPaymentResponseDto> => {
    return fetcher<VerifyFundingPaymentResponseDto>('/funding/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getMyFundings: async (userId?: string): Promise<{ fundings: any[] }> => {
    return fetcher<{ fundings: any[] }>(`/funding/mine${userId ? `?userId=${userId}` : ''}`);
  },
  getAllFundings: async (): Promise<{ fundings: any[] }> => {
    return fetcher<{ fundings: any[] }>('/funding/list');
  },
};

export const authApi = {
  loginWithGoogle: async (credential: string): Promise<{ success: boolean; user: any; token: string }> => {
    return fetcher<{ success: boolean; user: any; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },
  getMe: async (): Promise<{ user: any }> => {
    return fetcher<{ user: any }>('/auth/me');
  },
  logout: async (): Promise<{ success: boolean }> => {
    return fetcher<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },
};


