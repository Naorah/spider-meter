import { prisma } from '$lib/server/db';
import type { MoltDto, NewsItemDto, NewsItemSummaryDto, SpiderProfileDto } from '$lib/types';

const dateLabelFormatter = new Intl.DateTimeFormat('fr-FR', {
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

function toSpiderProfile(row: {
	name: string;
	commonName: string;
	scientificName: string;
	speciesNotes: string;
	movedInDate: Date;
}): SpiderProfileDto {
	return {
		name: row.name,
		commonName: row.commonName,
		scientificName: row.scientificName,
		speciesNotes: row.speciesNotes,
		movedInDate: row.movedInDate.toISOString(),
		movedInLabel: dateLabelFormatter.format(row.movedInDate)
	};
}

export async function getSpiderProfile(): Promise<SpiderProfileDto | null> {
	const row = await prisma.spiderProfile.findUnique({ where: { id: 1 } });
	return row ? toSpiderProfile(row) : null;
}

export async function getMolts(): Promise<MoltDto[]> {
	const rows = await prisma.molt.findMany({
		orderBy: [{ moltDate: 'desc' }, { sortOrder: 'asc' }]
	});
	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		moltDate: r.moltDate.toISOString(),
		sortOrder: r.sortOrder
	}));
}

export async function getLatestNews(): Promise<NewsItemDto | null> {
	const row = await prisma.newsItem.findFirst({ orderBy: { publishedAt: 'desc' } });
	if (!row) return null;
	return {
		id: row.id,
		title: row.title,
		body: row.body,
		publishedAt: row.publishedAt.toISOString()
	};
}

export async function getNewsHistory(limit = 20): Promise<NewsItemDto[]> {
	const rows = await prisma.newsItem.findMany({
		orderBy: { publishedAt: 'desc' },
		take: limit
	});
	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		body: r.body,
		publishedAt: r.publishedAt.toISOString()
	}));
}

export async function getNewsHistorySummaries(limit = 20): Promise<NewsItemSummaryDto[]> {
	const rows = await prisma.newsItem.findMany({
		orderBy: { publishedAt: 'desc' },
		take: limit,
		select: { id: true, title: true, publishedAt: true }
	});
	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		publishedAt: r.publishedAt.toISOString()
	}));
}

export async function getPublicContent() {
	const [spider, molts, latestNews, newsHistory] = await Promise.all([
		getSpiderProfile(),
		getMolts(),
		getLatestNews(),
		getNewsHistory(10)
	]);

	return { spider, molts, latestNews, newsHistory };
}
