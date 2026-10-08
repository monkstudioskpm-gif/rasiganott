import { HomeResponse, Genre, Category, Title } from '@rasigan/shared';

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

export const FALLBACK_TITLES: Title[] = [];

export const FALLBACK_PEOPLE = [
  { id: 'p1', name: 'Vijay Sethupathi', nameKey: 'vijay sethupathi', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', bio: 'Acclaimed Indian actor working predominantly in Tamil cinema.', titlesCount: 8, rolesUsed: ['Actor'] },
  { id: 'p2', name: 'Samantha Ruth Prabhu', nameKey: 'samantha ruth prabhu', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', bio: 'Award-winning actress known for powerhouse performances.', titlesCount: 8, rolesUsed: ['Actor'] },
  { id: 'p3', name: 'Lokesh Kanagaraj', nameKey: 'lokesh kanagaraj', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', bio: 'Visionary filmmaker known for high-octane action blockbusters.', titlesCount: 52, rolesUsed: ['DIRECTOR'] },
  { id: 'p4', name: 'Anirudh Ravichander', nameKey: 'anirudh ravichander', photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80', bio: 'Chart-topping music composer and playback singer.', titlesCount: 52, rolesUsed: ['MUSIC_DIRECTOR'] },
  { id: 'p5', name: 'Suriya Sivakumar', nameKey: 'suriya sivakumar', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80', bio: 'Versatile actor and film producer.', titlesCount: 8, rolesUsed: ['Actor'] },
  { id: 'p6', name: 'Fahadh Faasil', nameKey: 'fahadh faasil', photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', bio: 'National award winning actor known for intense role choices.', titlesCount: 8, rolesUsed: ['Actor'] },
  { id: 'p7', name: 'Trisha Krishnan', nameKey: 'trisha krishnan', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', bio: 'Leading actress with over two decades in South Indian cinema.', titlesCount: 8, rolesUsed: ['Actor'] },
  { id: 'p8', name: 'Dhanush K', nameKey: 'dhanush k', photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80', bio: 'Multi-faceted actor, director, lyricist and producer.', titlesCount: 8, rolesUsed: ['Actor'] },
  { id: 'p9', name: 'Nelson Dilipkumar', nameKey: 'nelson dilipkumar', photoUrl: null, bio: 'Director known for dark comedy action films.', titlesCount: 4, rolesUsed: ['DIRECTOR'] },
  { id: 'p10', name: 'Santhosh Narayanan', nameKey: 'santhosh narayanan', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80', bio: null, titlesCount: 4, rolesUsed: ['MUSIC_DIRECTOR'] },
  { id: 'p11', name: 'Halitha Shameem', nameKey: 'halitha shameem', photoUrl: null, bio: null, titlesCount: 2, rolesUsed: ['DIRECTOR'] },
  { id: 'p12', name: 'Karthik Subbaraj', nameKey: 'karthik subbaraj', photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80', bio: 'Pioneer of modern Tamil indie wave cinema.', titlesCount: 4, rolesUsed: ['DIRECTOR'] },
  { id: 'p13', name: 'Manikandan R', nameKey: 'manikandan r', photoUrl: null, bio: 'Rising star actor and dialogue writer.', titlesCount: 4, rolesUsed: ['Actor'] },
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

export const FALLBACK_ADMIN_STATS = {
  stats: {
    totalTitles: 52,
    publishedTitles: 52,
    draftTitles: 0,
    totalPeople: 13,
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
      creatorName: 'Studio 1 Originals',
      titlesCount: 8,
      grossRaisedInr: 75000,
      netEarningsInr: 45000,
      platformFeeInr: 30000,
      payoutStatus: 'PAID' as const,
      titles: [
        { id: 'title_fallback_1', title: 'Viking Wolf', posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80', kind: 'MOVIE', grossRaisedInr: 50000, netEarningsInr: 30000 },
      ],
    },
    {
      creatorName: 'Indie Mobile Cinema',
      titlesCount: 8,
      grossRaisedInr: 50000,
      netEarningsInr: 30000,
      platformFeeInr: 20000,
      payoutStatus: 'PAID' as const,
      titles: [
        { id: 'title_fallback_4', title: 'Night Call', posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80', kind: 'MOVIE', grossRaisedInr: 50000, netEarningsInr: 30000 },
      ],
    },
    {
      creatorName: 'Madras Digital Studio',
      titlesCount: 8,
      grossRaisedInr: 35000,
      netEarningsInr: 21000,
      platformFeeInr: 14000,
      payoutStatus: 'PROCESSING' as const,
      titles: [
        { id: 'title_fallback_7', title: 'Chennai Chronicles', posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80', kind: 'WEB_SERIES', grossRaisedInr: 35000, netEarningsInr: 21000 },
      ],
    },
    {
      creatorName: 'Kaveri Short Films',
      titlesCount: 8,
      grossRaisedInr: 25000,
      netEarningsInr: 15000,
      platformFeeInr: 10000,
      payoutStatus: 'PAID' as const,
      titles: [
        { id: 'title_fallback_5', title: 'Kaadhal Kavithai', posterUrl: 'https://images.unsplash.com/photo-1518676599625-581335e23630?w=600&auto=format&fit=crop&q=80', kind: 'SHORT_FILM', grossRaisedInr: 25000, netEarningsInr: 15000 },
      ],
    },
  ],
};

export const FALLBACK_PAYOUT_STATEMENTS = {
  statements: [
    {
      id: 'stmt_2026_09_01',
      statementNumber: 'PAY-2026-0901',
      creatorName: 'Studio 1 Originals',
      cycle: 'September 2026',
      period: '01 Sep 2026 - 30 Sep 2026',
      grossAmountInr: 75000,
      netPayableInr: 45000,
      status: 'COMPLETED' as const,
      paymentUtrNumber: 'UTR982341029384',
      paidAt: '01 Oct 2026',
      titlesCount: 8,
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
      titlesCount: 8,
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
      titlesCount: 8,
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
      titlesCount: 8,
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
    if (endpoint.startsWith('/admin/people')) return { people: FALLBACK_PEOPLE, pagination: { page: 1, limit: 24, total: FALLBACK_PEOPLE.length, totalPages: 1 } } as unknown as T;
    if (endpoint === '/home') return FALLBACK_HOME as unknown as T;
    if (endpoint === '/categories' || endpoint === '/genres') return { categories: FALLBACK_GENRES, genres: FALLBACK_GENRES } as unknown as T;
    if (endpoint === '/titles/admin/stats') return FALLBACK_ADMIN_STATS as unknown as T;
    if (endpoint.startsWith('/titles/admin/list') || endpoint === '/titles/admin/list') return { titles: FALLBACK_TITLES, total: FALLBACK_TITLES.length } as unknown as T;
    if (endpoint === '/titles/admin/creator-earnings') return FALLBACK_CREATOR_BREAKDOWN as unknown as T;
    if (endpoint === '/admin/payouts') return FALLBACK_PAYOUT_STATEMENTS as unknown as T;
    if (endpoint.startsWith('/titles/')) {
      const slug = endpoint.replace('/titles/', '');
      const combined = getCombinedTitles();
      const found = combined.find((t) => t.slug === slug || t.id === slug);
      if (found) {
        return { title: found } as unknown as T;
      }
      return { title: combined[0] || FALLBACK_TITLES[0] } as unknown as T;
    }
    if (endpoint.startsWith('/titles')) return { titles: FALLBACK_TITLES, pagination: { page: 1, totalPages: 1 } } as unknown as T;
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
  featuredTitleIds: ['title_fallback_1', 'title_fallback_2', 'title_fallback_3'],
  featuredMovieIds: ['title_fallback_1', 'title_fallback_2'],
  featuredShortFilmIds: ['title_fallback_5', 'title_fallback_6'],
  featuredWebSeriesIds: ['title_fallback_7', 'title_fallback_8'],
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

export const getCombinedTitles = (): Title[] => {
  const created = getStoredCreatedTitles();
  const rankings = getStoredRankings();
  const appearance = getAppearanceSettings();
  const featuredSet = new Set(appearance.featuredTitleIds || []);

  const map = new Map<string, Title>();
  created.forEach((t) => {
    const customRank = rankings[t.id] !== undefined ? rankings[t.id] : t.sortRank;
    const isFeat = featuredSet.has(t.id) || t.isFeatured;
    map.set(t.id, { ...t, sortRank: customRank, isFeatured: isFeat });
  });

  FALLBACK_TITLES.forEach((t) => {
    if (!map.has(t.id) && !map.has(t.slug)) {
      const customRank = rankings[t.id] !== undefined ? rankings[t.id] : t.sortRank;
      const isFeat = featuredSet.has(t.id) || t.isFeatured;
      map.set(t.id, { ...t, sortRank: customRank, isFeatured: isFeat });
    }
  });

  const list = Array.from(map.values());
  return list.sort((a, b) => {
    const rankA = a.sortRank !== undefined ? a.sortRank : 999;
    const rankB = b.sortRank !== undefined ? b.sortRank : 999;
    if (rankA !== rankB) return rankA - rankB;
    return (b.editorRating || 0) - (a.editorRating || 0);
  });
};

export const api = {
  getHome: async () => {
    const combined = getCombinedTitles();
    const published = combined.filter((t) => t.status === 'PUBLISHED');

    try {
      const res = await fetcher<HomeResponse>('/home');
      if (res?.trending && res.trending.length > 0) {
        const createdPublished = getStoredCreatedTitles().filter((t) => t.status === 'PUBLISHED');
        if (createdPublished.length > 0) {
          const mergedTrendingMap = new Map();
          [...createdPublished, ...res.trending].forEach((t) => mergedTrendingMap.set(t.id, t));
          const finalTrending = Array.from(mergedTrendingMap.values());

          const updatedGenres = (res.genres || []).map((cat) => {
            const matchingCreated = createdPublished.filter((t) =>
              t.genres?.some((c: any) => c.slug === cat.slug || c.name?.toLowerCase() === cat.name?.toLowerCase())
            );
            return {
              ...cat,
              titles: [...matchingCreated, ...(cat.titles || [])],
            };
          });

          return {
            ...res,
            featured: [...createdPublished.filter((t) => t.isFeatured), ...(res.featured || [])],
            trending: finalTrending,
            newReleases: [...createdPublished, ...(res.newReleases || [])],
            genres: updatedGenres,
          };
        }
        return res;
      }
    } catch {}

    const genres = FALLBACK_GENRES.map((cat) => ({
      ...cat,
      titles: published.filter((t) => t.genres?.some((c: any) => c.slug === cat.slug || c.id === cat.id || c.name?.toLowerCase() === cat.name.toLowerCase())),
    })).filter((cat) => cat.titles.length > 0);

    return {
      featured: published.filter((t) => t.isFeatured),
      trending: published,
      newReleases: published,
      topRated: [...published].sort((a, b) => (b.editorRating || 0) - (a.editorRating || 0)),
      mostSupported: published,
      genres,
    };
  },

  getGenres: () => fetcher<{ genres: Genre[]; categories: Category[] }>('/genres'),
  getCategories: () => fetcher<{ categories: Category[]; genres: Genre[] }>('/genres'),

  getTitles: async (params?: Record<string, string>) => {
    const combined = getCombinedTitles();
    let published = combined.filter((t) => t.status === 'PUBLISHED');

    if (params?.kind) {
      published = published.filter((t) => t.kind === params.kind);
    }
    if (params?.orientation) {
      published = published.filter((t) => t.orientation === params.orientation);
    }
    if (params?.q) {
      const qLower = params.q.toLowerCase();
      published = published.filter(
        (t) =>
          t.title.toLowerCase().includes(qLower) ||
          t.description?.toLowerCase().includes(qLower) ||
          t.genres?.some((g: any) => g.name?.toLowerCase().includes(qLower))
      );
    }

    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetcher<{ titles: Title[]; pagination: { page: number; totalPages: number } }>(`/titles${query ? `?${query}` : ''}`);
      if (res?.titles && res.titles.length > 0) {
        const createdPublished = getStoredCreatedTitles().filter((t) => t.status === 'PUBLISHED');
        const map = new Map();
        [...createdPublished, ...res.titles].forEach((t) => map.set(t.id, t));
        let merged = Array.from(map.values());
        if (params?.kind) merged = merged.filter((t) => t.kind === params.kind);
        if (params?.q) merged = merged.filter((t) => t.title.toLowerCase().includes(params.q!.toLowerCase()));
        return { titles: merged, pagination: { page: 1, totalPages: 1 } };
      }
    } catch {}

    return { titles: published, pagination: { page: 1, totalPages: 1 } };
  },

  getTitleBySlug: async (slug: string) => {
    const combined = getCombinedTitles();
    const foundLocal = combined.find((t) => t.slug === slug || t.id === slug);
    if (foundLocal) {
      return { title: foundLocal };
    }

    try {
      const res = await fetcher<{ title: Title }>(`/titles/${slug}`);
      if (res?.title) return res;
    } catch {}

    return { title: combined[0] || FALLBACK_TITLES[0] };
  },
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
  getPeople: async (params?: { q?: string; filter?: string; sort?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    const stored = localStorage.getItem('rasigan_created_people');
    const localPeople = stored ? JSON.parse(stored) : [];

    try {
      const res = await fetcher<{ people: any[]; pagination: { page: number; totalPages: number; total: number } }>(`/admin/people${query ? `?${query}` : ''}`);
      if (res?.people) {
        const uniqueMap = new Map();
        [...localPeople, ...res.people].forEach((p) => uniqueMap.set(p.id, p));
        let list = Array.from(uniqueMap.values());
        if (params?.q) {
          const qLower = params.q.toLowerCase();
          list = list.filter((p) => p.name.toLowerCase().includes(qLower));
        }
        return { people: list, pagination: { page: 1, totalPages: 1, total: list.length } };
      }
    } catch {}

    const merged = [...localPeople, ...FALLBACK_PEOPLE];
    const uniqueMap = new Map();
    merged.forEach((p) => uniqueMap.set(p.id, p));
    let list = Array.from(uniqueMap.values());

    if (params?.q) {
      const qLower = params.q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(qLower));
    }
    return { people: list, pagination: { page: 1, totalPages: 1, total: list.length } };
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
    const newPerson = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      nameKey: trimmedName.toLowerCase(),
      photoUrl: data.photoUrl || null,
      bio: data.bio || null,
      titlesCount: 0,
    };

    // Save to local storage database for instant auto-save and persistence
    const stored = localStorage.getItem('rasigan_created_people');
    const existingList = stored ? JSON.parse(stored) : [];
    const updatedList = [newPerson, ...existingList.filter((p: any) => p.name.toLowerCase() !== trimmedName.toLowerCase())];
    localStorage.setItem('rasigan_created_people', JSON.stringify(updatedList));

    try {
      const res = await fetcher<{ person: any; isDuplicateMatch?: boolean }>('/admin/people', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res?.person) {
        return res;
      }
    } catch {}

    return { person: newPerson, isDuplicateMatch: false };
  },
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

  // Clear All Database Content
  clearAllContent: async () => {
    localStorage.removeItem('rasigan_created_titles');
    localStorage.removeItem('rasigan_title_rankings');
    localStorage.removeItem('rasigan_appearance_settings');
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
  getAllTitles: async (params?: { status?: string; kind?: string; orientation?: string; q?: string }) => {
    const combined = getCombinedTitles();
    let list = combined;

    if (params?.status) {
      list = list.filter((t) => t.status === params.status);
    }
    if (params?.kind) {
      list = list.filter((t) => t.kind === params.kind);
    }
    if (params?.orientation) {
      list = list.filter((t) => t.orientation === params.orientation);
    }
    if (params?.q) {
      const qLower = params.q.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(qLower) || t.description?.toLowerCase().includes(qLower));
    }

    try {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.kind) query.set('kind', params.kind);
      if (params?.orientation) query.set('orientation', params.orientation);
      if (params?.q) query.set('q', params.q);
      const qStr = query.toString();
      const res = await fetcher<{ titles: Title[]; total: number }>(`/titles/admin/list${qStr ? `?${qStr}` : ''}`);
      if (res?.titles && res.titles.length > 0) {
        const created = getStoredCreatedTitles();
        const map = new Map();
        [...created, ...res.titles].forEach((t) => map.set(t.id, t));
        let merged = Array.from(map.values());
        if (params?.status) merged = merged.filter((t) => t.status === params.status);
        if (params?.kind) merged = merged.filter((t) => t.kind === params.kind);
        if (params?.q) merged = merged.filter((t) => t.title.toLowerCase().includes(params.q!.toLowerCase()));
        return { titles: merged, total: merged.length };
      }
    } catch {}

    return { titles: list, total: list.length };
  },

  getTitleById: async (id: string) => {
    const combined = getCombinedTitles();
    const foundLocal = combined.find((t) => t.id === id || t.slug === id);

    try {
      const res = await fetcher<{ title: Title }>(`/titles/admin/${id}`);
      if (res?.title) return res;
    } catch {}

    if (foundLocal) {
      return { title: foundLocal };
    }
    return { title: FALLBACK_TITLES[0] };
  },

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

    try {
      const res = await fetcher<{ title: Title }>('/titles/admin', { method: 'POST', body: JSON.stringify(payload) });
      if (res?.title) return res;
    } catch {}

    return { title: newTitle };
  },

  updateTitle: async (id: string, payload: any) => {
    const existing = getStoredCreatedTitles();
    let updatedTitle: Title | null = null;

    const updatedList = existing.map((t) => {
      if (t.id === id || t.slug === id) {
        updatedTitle = {
          ...t,
          ...payload,
          verticalPosterUrl: payload.verticalPosterUrl !== undefined ? payload.verticalPosterUrl : t.verticalPosterUrl,
          sortRank: payload.sortRank !== undefined ? Number(payload.sortRank) : t.sortRank,
          year: payload.year ? Number(payload.year) : t.year,
          editorRating: payload.editorRating ? Number(payload.editorRating) : t.editorRating,
        };
        return updatedTitle;
      }
      return t;
    });

    if (updatedTitle) {
      localStorage.setItem('rasigan_created_titles', JSON.stringify(updatedList));
    }

    try {
      const res = await fetcher<{ title: Title }>(`/titles/admin/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (res?.title) return res;
    } catch {}

    return { title: updatedTitle || { id, ...payload } as any };
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
    const existing = getStoredCreatedTitles();
    const updated = existing.filter((t) => t.id !== id && t.slug !== id);
    localStorage.setItem('rasigan_created_titles', JSON.stringify(updated));

    try {
      await fetcher<{ success: boolean }>(`/titles/admin/${id}`, { method: 'DELETE' });
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
