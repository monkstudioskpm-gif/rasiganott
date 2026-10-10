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

export default prisma;
