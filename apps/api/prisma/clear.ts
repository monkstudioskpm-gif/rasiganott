import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all content from the database...');

  await prisma.titleCast.deleteMany({});
  await prisma.titleCrew.deleteMany({});
  await prisma.titleGenre.deleteMany({});
  await prisma.titleTag.deleteMany({});
  await prisma.watchlistItem.deleteMany({});
  await prisma.reaction.deleteMany({});
  await prisma.watchProgress.deleteMany({});
  await prisma.funding.deleteMany({});
  await prisma.episode.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.title.deleteMany({});
  await prisma.person.deleteMany({});

  console.log('✓ All database content has been deleted successfully!');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
