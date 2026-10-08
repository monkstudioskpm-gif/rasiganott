import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_GENRES = [
  { name: 'Short Films', slug: 'short-films', sortOrder: 1 },
  { name: 'Action', slug: 'action', sortOrder: 2 },
  { name: 'Drama', slug: 'drama', sortOrder: 3 },
  { name: 'Comedy', slug: 'comedy', sortOrder: 4 },
];

const USER_TITLES = [
  {
    title: 'Kodi Melam | Republic day | கொடி மேளம் | Happy Independence day',
    slug: 'kodi-melam-republic-day-happy-independence-day',
    kind: 'SHORT_FILM',
    orientation: 'LANDSCAPE',
    tagline: 'Kodi Melam Tamil Short Film',
    description: 'Kodi Melam is a short film produced by Cupice Productions (12:02) that focuses on the spirit of Independence Day. The narrative features a variety of characters, including a news reporter (Sowthra) and a freedom fighter (M Gurusamy), who gather to discuss a...',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    creatorName: 'cupice productions',
    isFeatured: true,
  },
  {
    title: 'No Sudu No Soranai | Kena Puna Part 2',
    slug: 'no-sudu-no-soranai-kena-puna-part-2',
    kind: 'SHORT_FILM',
    orientation: 'LANDSCAPE',
    tagline: 'Kena Puna Part 2 Tamil Short Film',
    description: 'No Sudu No Soranai is the official continuation and Part 2 of Kena Puna Tamil Short Film produced by cupice productions.',
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    creatorName: 'cupice productions',
    isFeatured: true,
  },
  {
    title: 'Kena Puna | Tamil Short Film',
    slug: 'kena-puna-tamil-short-film',
    kind: 'SHORT_FILM',
    orientation: 'LANDSCAPE',
    tagline: 'Kena Puna Tamil Short Film',
    description: 'Kena Puna is an engaging Tamil short film produced by Cupice Productions.',
    posterUrl: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    creatorName: 'Cupice Productions',
    isFeatured: true,
  },
  {
    title: 'Double Meaning | Tamil Short Film',
    slug: 'double-meaning-tamil-short-film',
    kind: 'SHORT_FILM',
    orientation: 'LANDSCAPE',
    tagline: 'Double Meaning Tamil Short Film',
    description: 'Double Meaning is an entertaining comedy drama Tamil short film produced by Cupice Productions.',
    posterUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    creatorName: 'Cupice Productions',
    isFeatured: true,
  },
];

async function main() {
  console.log('Seeding Rasigan OTT v2 database with user titles...');

  const genreMap = new Map<string, string>();
  for (const g of DEFAULT_GENRES) {
    const created = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name, sortOrder: g.sortOrder },
      create: { name: g.name, slug: g.slug, sortOrder: g.sortOrder, isActive: true },
    });
    genreMap.set(g.slug, created.id);
  }

  for (const item of USER_TITLES) {
    const created = await prisma.title.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        kind: item.kind as any,
        orientation: item.orientation as any,
        status: 'PUBLISHED',
        posterUrl: item.posterUrl,
        videoUrl: item.videoUrl,
        creatorName: item.creatorName,
        isFeatured: item.isFeatured,
      },
      create: {
        slug: item.slug,
        title: item.title,
        description: item.description,
        kind: item.kind as any,
        orientation: item.orientation as any,
        status: 'PUBLISHED',
        posterUrl: item.posterUrl,
        videoUrl: item.videoUrl,
        streamType: 'MP4',
        creatorName: item.creatorName,
        tagline: item.tagline,
        language: 'Tamil',
        year: 2025,
        ageRating: 'U/A',
        durationMin: 15,
        editorRating: 9.0,
        isFeatured: item.isFeatured,
        fundingEnabled: true,
        publishedAt: new Date(),
      },
    });

    const shortFilmsGenreId = genreMap.get('short-films');
    if (shortFilmsGenreId) {
      await prisma.titleGenre.upsert({
        where: { titleId_genreId: { titleId: created.id, genreId: shortFilmsGenreId } },
        update: {},
        create: { titleId: created.id, genreId: shortFilmsGenreId },
      });
    }

    console.log('Seeded title:', created.title);
  }

  console.log('Successfully seeded user titles!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
