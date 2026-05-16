import { DATABASE_URL } from '$env/static/private';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '$lib/server/generated/prisma/client';
import { dev } from '$app/environment';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
	const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL });
	return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (dev) globalForPrisma.prisma = prisma;
