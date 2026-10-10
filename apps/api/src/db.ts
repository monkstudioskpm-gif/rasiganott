import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  let formatted = rawUrl;
  // If using Supabase pooler or port 6543, ensure pgbouncer=true is present
  if ((formatted.includes('pooler.supabase.com') || formatted.includes(':6543')) && !formatted.includes('pgbouncer=true')) {
    formatted += (formatted.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }
  if (!formatted.includes('connection_limit=')) {
    formatted += (formatted.includes('?') ? '&' : '?') + 'connection_limit=1';
  }
  return formatted;
}

const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: ['error'],
  });

globalForPrisma.prisma = prisma;

let migrationDone = false;

export async function ensureSchemaUpgrades(): Promise<void> {
  if (migrationDone) return;
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "durationSec" INTEGER;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "verticalVideoUrl" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "feedEligible" BOOLEAN NOT NULL DEFAULT true;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS "durationSec" INTEGER;`);

    try {
      await prisma.$executeRawUnsafe(`UPDATE "Title" SET "durationSec" = "durationMin" * 60 WHERE "durationSec" IS NULL AND "durationMin" IS NOT NULL;`);
      await prisma.$executeRawUnsafe(`UPDATE "Episode" SET "durationSec" = "durationMin" * 60 WHERE "durationSec" IS NULL AND "durationMin" IS NOT NULL;`);
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "ViewSource" AS ENUM ('CATALOG', 'FEED_FULL', 'EXTERNAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "FeedMode" AS ENUM ('CLIP', 'FULL'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ViewEvent" (
          "id" TEXT PRIMARY KEY,
          "titleId" TEXT NOT NULL,
          "episodeId" TEXT,
          "userId" TEXT,
          "anonId" TEXT,
          "source" "ViewSource" NOT NULL DEFAULT 'CATALOG',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "FeedImpression" (
          "id" TEXT PRIMARY KEY,
          "requestId" TEXT NOT NULL,
          "strategy" TEXT NOT NULL,
          "userId" TEXT,
          "anonId" TEXT,
          "titleId" TEXT NOT NULL,
          "episodeId" TEXT,
          "mode" "FeedMode" NOT NULL,
          "clipStartSec" INTEGER,
          "clipEndSec" INTEGER,
          "position" INTEGER NOT NULL,
          "watchedSec" INTEGER NOT NULL DEFAULT 0,
          "loops" INTEGER NOT NULL DEFAULT 0,
          "skipped" BOOLEAN NOT NULL DEFAULT false,
          "clickedWatchFull" BOOLEAN NOT NULL DEFAULT false,
          "liked" BOOLEAN NOT NULL DEFAULT false,
          "wishlisted" BOOLEAN NOT NULL DEFAULT false,
          "openedSupport" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch {}

    migrationDone = true;
    console.log('[Schema] Auto schema upgrades applied successfully.');
  } catch (err) {
    console.warn('[Schema] Auto schema upgrade note:', err);
  }
}

export default prisma;
