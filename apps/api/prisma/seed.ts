import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_GENRES = [
  { name: 'Action', slug: 'action', sortOrder: 1 },
  { name: 'Drama', slug: 'drama', sortOrder: 2 },
  { name: 'Thriller', slug: 'thriller', sortOrder: 3 },
  { name: 'Comedy', slug: 'comedy', sortOrder: 4 },
  { name: 'Romance', slug: 'romance', sortOrder: 5 },
  { name: 'Horror', slug: 'horror', sortOrder: 6 },
  { name: 'Crime', slug: 'crime', sortOrder: 7 },
  { name: 'Sci-Fi', slug: 'sci-fi', sortOrder: 8 },
];

const DEFAULT_TAGS = [
  'action', 'drama', 'thriller', 'comedy', 'village', 'family', 'romance',
  'chennai', 'sci-fi', 'horror', 'crime', 'mystery', 'short', 'vertical',
  'revenge', 'dark', 'indie', 'musical', '90s', 'retro'
];

const DEFAULT_PEOPLE = [
  { name: 'Vijay Sethupathi', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', bio: 'Acclaimed Indian actor working predominantly in Tamil cinema.' },
  { name: 'Samantha Ruth Prabhu', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', bio: 'Award-winning actress known for powerhouse performances.' },
  { name: 'Lokesh Kanagaraj', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', bio: 'Visionary filmmaker known for high-octane action blockbusters.' },
  { name: 'Anirudh Ravichander', photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80', bio: 'Chart-topping music composer and playback singer.' },
  { name: 'Suriya Sivakumar', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80', bio: 'Versatile actor and film producer.' },
  { name: 'Fahadh Faasil', photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', bio: 'National award winning actor known for intense role choices.' },
  { name: 'Trisha Krishnan', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', bio: 'Leading actress with over two decades in South Indian cinema.' },
  { name: 'Dhanush K', photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80', bio: 'Multi-faceted actor, director, lyricist and producer.' },
  { name: 'Nelson Dilipkumar', photoUrl: null, bio: 'Director known for dark comedy action films.' },
  { name: 'Santhosh Narayanan', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80', bio: null },
  { name: 'Halitha Shameem', photoUrl: null, bio: null },
  { name: 'Karthik Subbaraj', photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80', bio: 'Pioneer of modern Tamil indie wave cinema.' },
  { name: 'Manikandan R', photoUrl: null, bio: 'Rising star actor and dialogue writer.' },
];

const MUX_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const BBB_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const POSTERS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80',
];

const BANNERS = [
  'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
];

const BASE_TITLES = [
  { name: 'Viking Wolf', tagline: 'Unleash the beast inside', cat: ['action', 'thriller', 'horror'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Kung Fu Panda 4', tagline: 'The Dragon Warrior returns', cat: ['action', 'comedy'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Blade Runner 2049', tagline: 'The key to the future is finally unearthed', cat: ['sci-fi', 'thriller', 'action'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Night Call', tagline: 'One phone call. Zero escape.', cat: ['thriller', 'crime'], kind: 'MOVIE', ori: 'VERTICAL' },
  { name: 'Kaadhal Kavithai', tagline: 'Love written in rain', cat: ['romance', 'drama'], kind: 'SHORT_FILM', ori: 'LANDSCAPE' },
  { name: 'Filter Coffee', tagline: 'Strong, sweet, and short', cat: ['comedy'], kind: 'SHORT_FILM', ori: 'VERTICAL' },
  { name: 'Chennai Chronicles', tagline: 'City of dreams and shadows', cat: ['drama', 'comedy'], kind: 'WEB_SERIES', ori: 'LANDSCAPE' },
  { name: 'Reels of Madurai', tagline: 'Micro stories from the temple city', cat: ['comedy'], kind: 'WEB_SERIES', ori: 'VERTICAL' },
  { name: 'Cyber Chennai 2099', tagline: 'Neon rain over OMR', cat: ['sci-fi', 'action'], kind: 'MOVIE', ori: 'LANDSCAPE' },
  { name: 'Ghost of Kodaikanal', tagline: 'Mist hides secrets', cat: ['horror', 'thriller'], kind: 'MOVIE', ori: 'LANDSCAPE' },
];

async function main() {
  console.log('Seeding Rasigan OTT v2 database with Addendum B specs...');

  // 1. Genres
  const genreMap = new Map<string, string>();
  for (const g of DEFAULT_GENRES) {
    const created = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name, sortOrder: g.sortOrder },
      create: { name: g.name, slug: g.slug, sortOrder: g.sortOrder, isActive: true },
    });
    genreMap.set(g.slug, created.id);
  }

  // 2. Tags
  const tagMap = new Map<string, string>();
  for (const tagName of DEFAULT_TAGS) {
    const created = await prisma.tag.upsert({
      where: { name: tagName.toLowerCase() },
      update: {},
      create: { name: tagName.toLowerCase() },
    });
    tagMap.set(tagName.toLowerCase(), created.id);
  }

  // 3. People
  const peopleRecords: any[] = [];
  for (const p of DEFAULT_PEOPLE) {
    const nameKey = p.name.toLowerCase().trim().replace(/\s+/g, ' ');
    const existing = await prisma.person.findFirst({ where: { nameKey } });
    if (existing) {
      peopleRecords.push(existing);
    } else {
      const created = await prisma.person.create({
        data: {
          name: p.name,
          nameKey,
          photoUrl: p.photoUrl,
          bio: p.bio,
        },
      });
      peopleRecords.push(created);
    }
  }

  // Generate 52 titles
  let count = 1;
  for (let i = 0; i < 52; i++) {
    try {
      const base = BASE_TITLES[i % BASE_TITLES.length];
    const uniqueSlug = `${base.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${count}`;
    const titleName = `${base.name} ${count > 1 ? `vol. ${count}` : ''}`.trim();

    const createdTitle = await prisma.title.upsert({
      where: { slug: uniqueSlug },
      update: {
        title: titleName,
        kind: base.kind as any,
        orientation: base.ori as any,
        status: 'PUBLISHED',
        tagline: base.tagline,
        description: `${base.name} brings an unmatched cinematic experience with gripping storytelling and immersive visuals.`,
        language: i % 2 === 0 ? 'Tamil' : 'English',
        year: 2023 + (i % 3),
        ageRating: i % 4 === 0 ? 'A' : 'U/A',
        durationMin: base.kind === 'WEB_SERIES' ? null : 90 + (i * 3) % 60,
        editorRating: parseFloat((8.0 + (i % 20) * 0.1).toFixed(1)),
        posterUrl: POSTERS[i % POSTERS.length],
        bannerUrl: base.ori === 'LANDSCAPE' ? BANNERS[i % BANNERS.length] : null,
        trailerUrl: MUX_HLS,
        videoUrl: i % 2 === 0 ? MUX_HLS : BBB_MP4,
        streamType: 'HLS',
        creatorName: `Studio ${1 + (i % 7)} Originals`,
        isFeatured: i < 5,
        fundingEnabled: true,
        fundingGoal: 200000 + i * 50000,
        publishedAt: new Date(),
      },
      create: {
        slug: uniqueSlug,
        kind: base.kind as any,
        orientation: base.ori as any,
        status: 'PUBLISHED',
        title: titleName,
        tagline: base.tagline,
        description: `${base.name} brings an unmatched cinematic experience with gripping storytelling and immersive visuals.`,
        language: i % 2 === 0 ? 'Tamil' : 'English',
        year: 2023 + (i % 3),
        ageRating: i % 4 === 0 ? 'A' : 'U/A',
        durationMin: base.kind === 'WEB_SERIES' ? null : 90 + (i * 3) % 60,
        editorRating: parseFloat((8.0 + (i % 20) * 0.1).toFixed(1)),
        posterUrl: POSTERS[i % POSTERS.length],
        bannerUrl: base.ori === 'LANDSCAPE' ? BANNERS[i % BANNERS.length] : null,
        trailerUrl: MUX_HLS,
        videoUrl: i % 2 === 0 ? MUX_HLS : BBB_MP4,
        streamType: 'HLS',
        creatorName: `Studio ${1 + (i % 7)} Originals`,
        isFeatured: i < 5,
        fundingEnabled: true,
        fundingGoal: 200000 + i * 50000,
        publishedAt: new Date(),
      },
    });

    // Link Genres
    for (const catSlug of base.cat) {
      const gId = genreMap.get(catSlug);
      if (gId) {
        await prisma.titleGenre.upsert({
          where: { titleId_genreId: { titleId: createdTitle.id, genreId: gId } },
          update: {},
          create: { titleId: createdTitle.id, genreId: gId },
        });
      }
    }

    // Link Tags
    const tagsToAssign = ['chennai', 'action', 'indie', base.ori.toLowerCase()];
    for (const tagItem of tagsToAssign) {
      const tId = tagMap.get(tagItem);
      if (tId) {
        await prisma.titleTag.upsert({
          where: { titleId_tagId: { titleId: createdTitle.id, tagId: tId } },
          update: {},
          create: { titleId: createdTitle.id, tagId: tId },
        });
      }
    }

    // Link Cast
    const castPerson1 = peopleRecords[i % peopleRecords.length];
    const castPerson2 = peopleRecords[(i + 1) % peopleRecords.length];
    await prisma.titleCast.upsert({
      where: { titleId_personId: { titleId: createdTitle.id, personId: castPerson1.id } },
      update: { order: 0, characterName: 'Protagonist' },
      create: { titleId: createdTitle.id, personId: castPerson1.id, order: 0, characterName: 'Protagonist' },
    });
    await prisma.titleCast.upsert({
      where: { titleId_personId: { titleId: createdTitle.id, personId: castPerson2.id } },
      update: { order: 1, characterName: 'Antagonist' },
      create: { titleId: createdTitle.id, personId: castPerson2.id, order: 1, characterName: 'Antagonist' },
    });

    // Link Crew
    const director = peopleRecords[2]; // Lokesh
    const composer = peopleRecords[3]; // Anirudh
    await prisma.titleCrew.upsert({
      where: { titleId_personId_role: { titleId: createdTitle.id, personId: director.id, role: 'DIRECTOR' } },
      update: {},
      create: { titleId: createdTitle.id, personId: director.id, role: 'DIRECTOR' },
    });
    await prisma.titleCrew.upsert({
      where: { titleId_personId_role: { titleId: createdTitle.id, personId: composer.id, role: 'MUSIC_DIRECTOR' } },
      update: {},
      create: { titleId: createdTitle.id, personId: composer.id, role: 'MUSIC_DIRECTOR' },
    });

      count++;
    } catch (err) {
      console.error('Error seeding item ' + i + ':', err);
    }
  }

  console.log(`Successfully seeded ${count - 1} content items with genres, tags, cast, crew!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
