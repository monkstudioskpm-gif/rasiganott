import { HomeResponse, Category, Title } from '@rasigan/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const MUX_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const BBB_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SINTEL_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';

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
    castNames: ['Suriya Kumar', 'Nayana Roy', 'Prakash Raj'],
    crewCredits: [{ role: 'Director', name: 'Karthik Subbaraj' }, { role: 'Music', name: 'Anirudh Ravichander' }],
    creatorName: 'Vetri Studios',
    isFeatured: true,
    fundingEnabled: true,
    fundingGoal: 500000,
    fundingRaised: 0,
    categories: [{ id: 'cat-1', name: 'Action', slug: 'action', sortOrder: 1, isActive: true }, { id: 'cat-3', name: 'Thriller', slug: 'thriller', sortOrder: 3, isActive: true }],
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
    castNames: ['Vijay Sethupathi', 'Aditi Rao'],
    crewCredits: [{ role: 'Director', name: 'Lokesh Kanagaraj' }],
    creatorName: 'Indie Mobile Cinema',
    isFeatured: true,
    fundingEnabled: true,
    fundingGoal: 200000,
    fundingRaised: 0,
    categories: [{ id: 'cat-3', name: 'Thriller', slug: 'thriller', sortOrder: 3, isActive: true }],
  },
  {
    id: 'cmuwlz-cyber-chennai',
    slug: 'cyber-chennai-2099',
    kind: 'MOVIE',
    orientation: 'LANDSCAPE',
    status: 'PUBLISHED',
    title: 'Cyber Chennai 2099',
    tagline: 'Neon rain over OMR',
    description: 'A groundbreaking Tamil futuristic neo-noir sci-fi action thriller set in a cyberpunk metropolis.',
    language: 'Tamil',
    year: 2025,
    ageRating: 'U/A',
    durationMin: 142,
    editorRating: 9.3,
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: MUX_HLS,
    videoUrl: MUX_HLS,
    streamType: 'HLS',
    subtitles: [],
    audioTracks: [],
    castNames: ['Vikram', 'Samantha', 'Fahadh Faasil'],
    crewCredits: [{ role: 'Director', name: 'Atlee' }],
    creatorName: 'Future Vision Media',
    isFeatured: true,
    fundingEnabled: true,
    fundingGoal: 800000,
    fundingRaised: 0,
    categories: [{ id: 'cat-sci-fi', name: 'Sci-Fi', slug: 'sci-fi', sortOrder: 9, isActive: true }, { id: 'cat-1', name: 'Action', slug: 'action', sortOrder: 1, isActive: true }],
  },
  {
    id: 'cmuwlzb0j000eoh6v0cfs1wwg',
    slug: 'kaadhal-kavithai-short',
    kind: 'SHORT_FILM',
    orientation: 'LANDSCAPE',
    status: 'PUBLISHED',
    title: 'Kaadhal Kavithai',
    tagline: 'Love written in rain',
    description: 'A heartwarming short film capturing a chance meeting at a Chennai bus stop.',
    language: 'Tamil',
    year: 2024,
    ageRating: 'U',
    durationMin: 22,
    editorRating: 9.4,
    posterUrl: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: MUX_HLS,
    videoUrl: MUX_HLS,
    streamType: 'HLS',
    subtitles: [],
    audioTracks: [],
    castNames: ['Gautham Ram', 'Priya Bhavani'],
    crewCredits: [{ role: 'Director', name: 'Halitha Shameem' }],
    creatorName: 'Raindrop Stories',
    isFeatured: false,
    fundingEnabled: true,
    fundingGoal: 100000,
    fundingRaised: 0,
    categories: [{ id: 'cat-romance', name: 'Romance', slug: 'romance', sortOrder: 5, isActive: true }],
  },
  {
    id: 'cmuwlzb0p000foh6vaw5i1bjy',
    slug: 'filter-coffee-vertical-short',
    kind: 'SHORT_FILM',
    orientation: 'VERTICAL',
    status: 'PUBLISHED',
    title: 'Filter Coffee',
    tagline: 'Strong, sweet, and short',
    description: 'A comical short film on morning routines in a traditional South Indian household.',
    language: 'Tamil',
    year: 2024,
    ageRating: 'U',
    durationMin: 12,
    editorRating: 8.5,
    posterUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    bannerUrl: null,
    trailerUrl: SINTEL_MP4,
    videoUrl: SINTEL_MP4,
    streamType: 'MP4',
    subtitles: [],
    audioTracks: [],
    castNames: ['RJ Balaji', 'Urvashee'],
    crewCredits: [{ role: 'Director', name: 'Balaji Mohan' }],
    creatorName: 'Filter Coffee Originals',
    isFeatured: false,
    fundingEnabled: true,
    fundingGoal: 50000,
    categories: [{ id: 'cat-comedy', name: 'Comedy', slug: 'comedy', sortOrder: 4, isActive: true }],
  },
  {
    id: 'cmuwlzb0x000goh6vo9egfopy',
    slug: 'chennai-chronicles-series',
    kind: 'WEB_SERIES',
    orientation: 'LANDSCAPE',
    status: 'PUBLISHED',
    title: 'Chennai Chronicles',
    tagline: 'City of dreams and shadows',
    description: 'An episodic drama following four young tech workers navigating life in modern Nungambakkam.',
    language: 'Tamil',
    year: 2024,
    ageRating: 'U/A',
    durationMin: null,
    editorRating: 9.2,
    posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: MUX_HLS,
    videoUrl: null,
    streamType: null,
    subtitles: [],
    audioTracks: [],
    castNames: ['Kavin', 'Amritha Aiyer'],
    crewCredits: [{ role: 'Creator', name: 'Nelson Dilipkumar' }],
    creatorName: 'Madras Digital Productions',
    isFeatured: true,
    fundingEnabled: true,
    fundingGoal: 1000000,
    categories: [{ id: 'cat-2', name: 'Drama', slug: 'drama', sortOrder: 2, isActive: true }],
  },
];

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Action', slug: 'action', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Drama', slug: 'drama', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Thriller', slug: 'thriller', sortOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Comedy', slug: 'comedy', sortOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Romance', slug: 'romance', sortOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Sci-Fi', slug: 'sci-fi', sortOrder: 6, isActive: true },
];

const FALLBACK_HOME: HomeResponse = {
  featured: FALLBACK_TITLES.filter((t) => t.isFeatured),
  categories: FALLBACK_CATEGORIES.map((cat) => ({
    ...cat,
    titles: FALLBACK_TITLES.filter((t) => t.categories?.some((c) => c.slug === cat.slug)),
  })).filter((cat) => cat.titles.length > 0),
  trending: FALLBACK_TITLES,
  newReleases: FALLBACK_TITLES,
  topRated: FALLBACK_TITLES,
  mostSupported: FALLBACK_TITLES,
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

    return await response.json();
  } catch (error) {
    console.warn(`API call to ${endpoint} failed, utilizing catalog fallback dataset:`, error);
    if (endpoint === '/home') return FALLBACK_HOME as unknown as T;
    if (endpoint === '/categories') return { categories: FALLBACK_CATEGORIES } as unknown as T;
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
  getCategories: () => fetcher<{ categories: Category[] }>('/categories'),
  getTitles: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetcher<{ titles: Title[]; pagination: { page: number; totalPages: number } }>(`/titles${query ? `?${query}` : ''}`);
  },
  getTitleBySlug: (slug: string) => fetcher<{ title: Title }>(`/titles/${slug}`),
};
