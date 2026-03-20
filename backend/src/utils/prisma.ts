import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 7 requires a driver adapter for all database connections.
 * We use @prisma/adapter-pg which connects via the `pg` driver.
 *
 * DATABASE_URL should be your Supabase Transaction pooler (port 6543)
 * for best performance at runtime.
 * DIRECT_URL (port 5432) is used by prisma.config.ts for migrations.
 */

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
