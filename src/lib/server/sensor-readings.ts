import { prisma } from '$lib/server/db';
import type { CompareOp, SensorPageSize } from '$lib/admin/sensor-filters';
import { SENSOR_PAGE_SIZES } from '$lib/admin/sensor-filters';
import type { SensorReadingDto, SensorReadingListDto } from '$lib/types';
import type { Prisma } from '@prisma/client';

function toDto(reading: {
	id: number;
	deviceId: string;
	humidity: number;
	temperature: number;
	createdAt: Date;
}): SensorReadingDto {
	return {
		id: reading.id,
		deviceId: reading.deviceId,
		humidity: reading.humidity,
		temperature: reading.temperature,
		createdAt: reading.createdAt.toISOString()
	};
}

function parseCompareOp(value: string | null): CompareOp | undefined {
	if (value === 'gt' || value === 'gte' || value === 'lt' || value === 'lte' || value === 'eq') {
		return value;
	}
	return undefined;
}

function parseFloatParam(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

function numericFilter(value: number, op: CompareOp): Prisma.FloatFilter {
	switch (op) {
		case 'gt':
			return { gt: value };
		case 'gte':
			return { gte: value };
		case 'lt':
			return { lt: value };
		case 'lte':
			return { lte: value };
		case 'eq':
			return { equals: value };
	}
}

export type ParsedSensorReadingQuery = {
	page: number;
	pageSize: SensorPageSize;
	temperature?: number;
	tempOp?: CompareOp;
	humidity?: number;
	humidityOp?: CompareOp;
	dateFrom?: string;
	dateTo?: string;
};

export function parseSensorReadingQuery(searchParams: URLSearchParams): ParsedSensorReadingQuery {
	const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
	const rawSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
	const pageSize: SensorPageSize = SENSOR_PAGE_SIZES.includes(rawSize as SensorPageSize)
		? (rawSize as SensorPageSize)
		: 20;

	const temperature = parseFloatParam(searchParams.get('temperature'));
	const tempOp = parseCompareOp(searchParams.get('tempOp'));
	const humidity = parseFloatParam(searchParams.get('humidity'));
	const humidityOp = parseCompareOp(searchParams.get('humidityOp'));

	const dateFrom = searchParams.get('dateFrom')?.trim() || undefined;
	const dateTo = searchParams.get('dateTo')?.trim() || undefined;

	return {
		page,
		pageSize,
		temperature,
		tempOp: temperature !== undefined ? tempOp : undefined,
		humidity,
		humidityOp: humidity !== undefined ? humidityOp : undefined,
		dateFrom,
		dateTo
	};
}

export function validateSensorReadingQuery(query: ParsedSensorReadingQuery): string | null {
	if (query.temperature !== undefined && !query.tempOp) {
		return 'Opérateur de température requis';
	}
	if (query.humidity !== undefined && !query.humidityOp) {
		return 'Opérateur d’humidité requis';
	}
	return null;
}

function buildWhere(query: ParsedSensorReadingQuery): Prisma.SensorReadingWhereInput {
	const where: Prisma.SensorReadingWhereInput = {};

	if (query.temperature !== undefined && query.tempOp) {
		where.temperature = numericFilter(query.temperature, query.tempOp);
	}
	if (query.humidity !== undefined && query.humidityOp) {
		where.humidity = numericFilter(query.humidity, query.humidityOp);
	}
	if (query.dateFrom || query.dateTo) {
		where.createdAt = {};
		if (query.dateFrom) {
			const from = new Date(query.dateFrom);
			if (!Number.isNaN(from.getTime())) where.createdAt.gte = from;
		}
		if (query.dateTo) {
			const to = new Date(query.dateTo);
			if (!Number.isNaN(to.getTime())) {
				if (query.dateTo.length === 10) to.setHours(23, 59, 59, 999);
				where.createdAt.lte = to;
			}
		}
	}

	return where;
}

export async function listSensorReadings(
	query: ParsedSensorReadingQuery
): Promise<SensorReadingListDto> {
	const where = buildWhere(query);
	const skip = (query.page - 1) * query.pageSize;

	const [total, rows] = await Promise.all([
		prisma.sensorReading.count({ where }),
		prisma.sensorReading.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip,
			take: query.pageSize
		})
	]);

	return {
		items: rows.map(toDto),
		total,
		page: query.page,
		pageSize: query.pageSize,
		totalPages: total === 0 ? 1 : Math.ceil(total / query.pageSize)
	};
}

export async function deleteSensorReading(id: number): Promise<boolean> {
	const result = await prisma.sensorReading.deleteMany({ where: { id } });
	return result.count > 0;
}
