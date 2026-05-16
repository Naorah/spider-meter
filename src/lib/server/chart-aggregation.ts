import { prisma } from '$lib/server/db';
import type { ChartPointCount, ChartPointDto, ChartRange, ChartSeriesDto } from '$lib/types';

const RANGE_MS: Record<ChartRange, number> = {
	day: 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	month: 30 * 24 * 60 * 60 * 1000
};

const VALID_POINTS: ChartPointCount[] = [10, 20, 50, 100];

export function parseChartRange(value: string | null): ChartRange {
	if (value === 'week' || value === 'month') return value;
	return 'day';
}

export function parseChartPoints(value: string | null): ChartPointCount {
	const n = Number(value);
	if (VALID_POINTS.includes(n as ChartPointCount)) return n as ChartPointCount;
	return 20;
}

function rawPoints(
	readings: { createdAt: Date; humidity: number; temperature: number }[],
	metric: 'humidity' | 'temperature'
): ChartPointDto[] {
	return readings.map((r) => ({
		x: r.createdAt.toISOString(),
		y: metric === 'humidity' ? r.humidity : r.temperature
	}));
}

/** Regroupe les lectures en `targetCount` blocs contigus et moyenne chaque bloc. */
function downsampleByAveraging(
	readings: { createdAt: Date; humidity: number; temperature: number }[],
	targetCount: number,
	metric: 'humidity' | 'temperature'
): ChartPointDto[] {
	const n = readings.length;
	const points: ChartPointDto[] = [];
	const groupSize = n / targetCount;

	for (let i = 0; i < targetCount; i++) {
		const start = Math.floor(i * groupSize);
		const end = Math.floor((i + 1) * groupSize);
		const slice = readings.slice(start, end);
		if (slice.length === 0) continue;

		let sumY = 0;
		let sumT = 0;
		for (const r of slice) {
			sumY += metric === 'humidity' ? r.humidity : r.temperature;
			sumT += r.createdAt.getTime();
		}

		points.push({
			x: new Date(sumT / slice.length).toISOString(),
			y: sumY / slice.length
		});
	}

	return points;
}

export async function getAggregatedChartSeries(
	range: ChartRange,
	pointCount: ChartPointCount,
	metric: 'humidity' | 'temperature'
): Promise<ChartSeriesDto> {
	const now = Date.now();
	const windowMs = RANGE_MS[range];
	const from = new Date(now - windowMs);

	const readings = await prisma.sensorReading.findMany({
		where: { createdAt: { gte: from } },
		orderBy: { createdAt: 'asc' }
	});

	const rawCount = readings.length;
	let points: ChartPointDto[];
	let aggregated: boolean;

	if (rawCount === 0) {
		points = [];
		aggregated = false;
	} else if (rawCount <= pointCount) {
		points = rawPoints(readings, metric);
		aggregated = false;
	} else {
		points = downsampleByAveraging(readings, pointCount, metric);
		aggregated = true;
	}

	return {
		points,
		meta: {
			range,
			points: pointCount,
			bucketMs: aggregated ? windowMs / pointCount : 0,
			rawCount,
			displayedCount: points.length,
			aggregated
		}
	};
}
