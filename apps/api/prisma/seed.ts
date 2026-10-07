import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Action', slug: 'action', sortOrder: 1 },
  { name: 'Drama', slug: 'drama', sortOrder: 2 },
  { name: 'Thriller', slug: 'thriller', sortOrder: 3 },
  { name: 'Comedy', slug: 'comedy', sortOrder: 4 },
  { name: 'Romance', slug: 'romance', sortOrder: 5 },
  { name: 'Horror', slug: 'horror', sortOrder: 6 },
  { name: 'Crime', slug: 'crime', sortOrder: 7 },
  { name: 'Family', slug: 'family', sortOrder: 8 },
  { name: 'Sci-Fi', slug: 'sci-fi', sortOrder: 9 },
  { name: 'Devotional', slug: 'devotional', sortOrder: 10 },
  { name: 'Documentary', slug: 'documentary', sortOrder: 11 },
  { name: 'Experimental', slug: 'experimental', sortOrder: 12 },
];

const MUX_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const BBB_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SINTEL_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';

const POSTERS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80',
];

const BANNERS = [
  'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
];

const BASE_TITLES = [
  { name: 'Viking Wolf', tagline: 'Unleash the beast inside', cat: ['action', 'thriller', 'horror'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Kung Fu Panda 4', tagline: 'The Dragon Warrior returns', cat: ['action', 'family', 'comedy'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Blade Runner 2049', tagline: 'The key to the future is finally unearthed', cat: ['sci-fi', 'thriller', 'action'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Night Call', tagline: 'One phone call. Zero escape.', cat: ['thriller', 'crime'], kind: 'MOVIE', ori: 'VERTICAL' },
  { name: 'Kaadhal Kavithai', tagline: 'Love written in rain', cat: ['romance', 'drama'], kind: 'SHORT_FILM', ori: 'LANDSCAPE' },
  { name: 'Filter Coffee', tagline: 'Strong, sweet, and short', cat: ['comedy', 'family'], kind: 'SHORT_FILM', ori: 'VERTICAL' },
  { name: 'Chennai Chronicles', tagline: 'City of dreams and shadows', cat: ['drama', 'comedy'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'Reels of Madurai', tagline: 'Micro stories from the temple city', cat: ['comedy', 'experimental'], kind: 'WEB_SERIES', ori: 'VERTICAL' },
  { name: 'Cyber Chennai 2099', tagline: 'Neon rain over OMR', cat: ['sci-fi', 'action'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Ghost of Kodaikanal', tagline: 'Mist hides secrets', cat: ['horror', 'thriller'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Vertical Mystery X', tagline: '60 seconds of suspense', cat: ['thriller', 'mystery'], kind: 'MOVIE', ori: 'VERTICAL' },
  { name: 'Indie Street Shorts', tagline: 'Short vertical tales', cat: ['drama', 'experimental'], kind: 'SHORT_FILM', ori: 'VERTICAL' },
  { name: 'The Nun II', tagline: 'The greatest evil in the conjuring universe', cat: ['horror', 'thriller'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Army of the Dead', tagline: 'Always bet on dead', cat: ['action', 'horror'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'The Croods: New Age', tagline: 'The future ain’t what it used to be', cat: ['family', 'comedy'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'The Gray Man', tagline: 'To find the ultimate asset', cat: ['action', 'thriller'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Vertical Love Notes', tagline: 'Romantic micro stories', cat: ['romance'], kind: 'SHORT_FILM', ori: 'VERTICAL' },
  { name: 'Hotel Transylvania 4', tagline: 'Change can be scary', cat: ['family', 'comedy'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Joker: Folie à Deux', tagline: 'The world is a stage', cat: ['drama', 'crime', 'thriller'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Pirates of the Caribbean', tagline: 'Dead men tell no tales', cat: ['action', 'drama'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'The Matrix Resurrections', tagline: 'Return to the source', cat: ['sci-fi', 'action'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Money Heist: Korea', tagline: 'Joint economic area', cat: ['crime', 'action', 'thriller'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'Vertical Crime Beat', tagline: 'Undercover 9:16', cat: ['crime', 'action'], kind: 'WEB_SERIES', ori: 'VERTICAL' },
  { name: 'Prison Break S5', tagline: 'Break out of darkness', cat: ['action', 'thriller', 'crime'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'Game of Thrones: House of Dragon', tagline: 'Fire and Blood', cat: ['action', 'drama'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'Stranger Things 5', tagline: 'Every story has an end', cat: ['sci-fi', 'horror', 'thriller'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'Squid Game S2', tagline: 'Let the real games begin', cat: ['thriller', 'drama'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'All of Us Are Dead', tagline: 'School is out forever', cat: ['horror', 'action'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'Metro Pulse Vertical', tagline: 'Vertical city beat', cat: ['crime', 'thriller'], kind: 'MOVIE', ori: 'VERTICAL' },
  { name: 'Sunset Coffee', tagline: 'Late evening love story', cat: ['romance'], kind: 'SHORT_FILM', ori: 'VERTICAL' },
  { name: 'Cyberpunk Reels', tagline: 'Neon lights 9:16', cat: ['sci-fi'], kind: 'SHORT_FILM', ori: 'VERTICAL' },
  { name: 'Madras Auto Driver', tagline: 'Stories from the meter', cat: ['comedy', 'drama'], kind: 'WEB_SERIES', ori: 'VERTICAL' },
  { name: 'Ghost Stories 9:16', tagline: 'Spooky vertical reels', cat: ['horror'], kind: 'MOVIE', ori: 'VERTICAL' },
  { name: 'Vertical Comedy Club', tagline: 'Instant laughs in 9:16', cat: ['comedy'], kind: 'WEB_SERIES', ori: 'VERTICAL' },
  { name: 'Sci-Fi Shorts 9:16', tagline: 'Future in your pocket', cat: ['sci-fi'], kind: 'SHORT_FILM', ori: 'VERTICAL' },
  { name: 'Kantara: Legend', tagline: 'A divine tale of forests', cat: ['drama', 'action'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Drishyam 2', tagline: 'The visual deception', cat: ['thriller', 'crime'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Avengers: Endgame', tagline: 'Part of the journey is the end', cat: ['action', 'sci-fi'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Black Adam', tagline: 'The time of heroes is over', cat: ['action', 'sci-fi'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Dune: Part Two', tagline: 'Long live the fighters', cat: ['sci-fi', 'action'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'The Garfield Movie', tagline: 'Outdoor adventure awaits', cat: ['family', 'comedy'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Nowhere', tagline: 'Survival at sea', cat: ['thriller', 'drama'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'They Cloned Tyrone', tagline: 'Uncover the conspiracy', cat: ['comedy', 'sci-fi'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Under the Skin', tagline: 'Alien perspective', cat: ['sci-fi', 'horror'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'The Voyeurs', tagline: 'Obsession takes over', cat: ['thriller', 'romance'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'The Little Things', tagline: 'Every clue matters', cat: ['crime', 'thriller'], kind: 'MOVIE', ori: 'LANDSCAPE' },
];

async function main() {
  console.log('Seeding 50+ content titles into Rasigan OTT v2 database...');

  // 1. Categories
  const categoryMap = new Map<string, string>();
  for (const cat of DEFAULT_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, isActive: true },
    });
    categoryMap.set(cat.slug, created.id);
  }

  // Generate 52 titles total
  const fullTitles = [];
  let count = 1;

  for (let i = 0; i < 52; i++) {
    const base = BASE_TITLES[i % BASE_TITLES.length];
    const uniqueSlug = `${base.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${count}`;
    const titleObj = {
      slug: uniqueSlug,
      kind: base.kind as any,
      orientation: base.ori as any,
      status: 'PUBLISHED' as const,
      title: `${base.name} ${count > 1 ? `vol. ${count}` : ''}`.trim(),
      tagline: base.tagline,
      description: `${base.name} brings an unmatched cinematic experience with gripping storytelling, stellar performances, and immersive visuals.`,
      language: i % 2 === 0 ? 'Tamil' : 'English',
      year: 2023 + (i % 3),
      ageRating: i % 4 === 0 ? 'A' : 'U/A',
      durationMin: base.kind === 'WEB_SERIES' ? null : 90 + (i * 3) % 60,
      editorRating: parseFloat((8.0 + (i % 20) * 0.1).toFixed(1)),
      posterUrl: POSTERS[i % POSTERS.length],
      bannerUrl: base.ori === 'LANDSCAPE' ? BANNERS[i % BANNERS.length] : null,
      trailerUrl: MUX_HLS,
      videoUrl: i % 2 === 0 ? MUX_HLS : BBB_MP4,
      streamType: 'HLS' as const,
      castNames: JSON.stringify(['Suriya Kumar', 'Samantha Roy', 'Vijay Sethupathi', 'Fahadh Faasil']),
      crewCredits: JSON.stringify([{ role: 'Director', name: 'Lokesh Kanagaraj' }, { role: 'Music', name: 'Anirudh Ravichander' }]),
      creatorName: `Studio ${1 + (i % 7)} Originals`,
      isFeatured: i < 5,
      fundingEnabled: true,
      fundingGoal: 200000 + i * 50000,
      publishedAt: new Date(),
      categorySlugs: base.cat,
    };

    fullTitles.push(titleObj);
    count++;
  }

  for (const t of fullTitles) {
    const { categorySlugs, ...titleFields } = t;

    const createdTitle = await prisma.title.upsert({
      where: { slug: t.slug },
      update: { ...titleFields },
      create: { ...titleFields },
    });

    for (const catSlug of categorySlugs) {
      const catId = categoryMap.get(catSlug);
      if (catId) {
        await prisma.titleCategory.upsert({
          where: {
            titleId_categoryId: { titleId: createdTitle.id, categoryId: catId },
          },
          update: {},
          create: { titleId: createdTitle.id, categoryId: catId },
        });
      }
    }
  }

  console.log(`Successfully seeded ${fullTitles.length} content items!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
