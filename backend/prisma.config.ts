// prisma.config.ts — Prisma 7 configuration
// This file replaces the url/directUrl that used to live in schema.prisma.
// The Prisma CLI reads this for migrations, introspection, and seeding.

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    // For Supabase: use the DIRECT connection string (port 5432) here
    // because Prisma CLI migrations need a non-pooled connection.
    // At runtime, PrismaClient uses the adapter which can point to either URL.
    url: env('DIRECT_URL'),
  },
});
