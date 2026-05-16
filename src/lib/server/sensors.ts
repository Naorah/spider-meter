import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/db';
import type { SensorReadingDto } from '$lib/types';

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

export async function getSensorReadings(): Promise<{
	latest: SensorReadingDto | null;
	history: SensorReadingDto[];
}> {
	const limit = Number(env.CHART_READINGS_LIMIT) || 72;

	const latestRow = await prisma.sensorReading.findFirst({
		orderBy: { createdAt: 'desc' }
	});

	const historyRows = await prisma.sensorReading.findMany({
		orderBy: { createdAt: 'desc' },
		take: limit
	});
	historyRows.reverse();

	return {
		latest: latestRow ? toDto(latestRow) : null,
		history: historyRows.map(toDto)
	};
}
