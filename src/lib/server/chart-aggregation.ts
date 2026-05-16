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

	const bucketMs = windowMs / pointCount;
	const buckets: { sum: number; count: number; center: number }[] = Array.from(
		{ length: pointCount },
		(_, i) => ({
			sum: 0,
			count: 0,
			center: from.getTime() + bucketMs * (i + 0.5)
		})
	);

	for (const reading of readings) {
		const t = reading.createdAt.getTime();
		const index = Math.min(Math.floor((t - from.getTime()) / bucketMs), pointCount - 1);
		if (index < 0) continue;
		const value = metric === 'humidity' ? reading.humidity : reading.temperature;
		buckets[index].sum += value;
		buckets[index].count += 1;
	}

	const points: ChartPointDto[] = [];
	for (const bucket of buckets) {
		if (bucket.count === 0) continue;
		points.push({
			x: new Date(bucket.center).toISOString(),
			y: bucket.sum / bucket.count
		});
	}

	return {
		points,
		meta: {
			range,
			points: pointCount,
			bucketMs,
			rawCount: readings.length,
			partial: readings.length < pointCount
		}
	};
}
