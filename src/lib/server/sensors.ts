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

export async function getLatestSensorReading(): Promise<SensorReadingDto | null> {
	const latestRow = await prisma.sensorReading.findFirst({
		orderBy: { createdAt: 'desc' }
	});
	return latestRow ? toDto(latestRow) : null;
}

/** @deprecated Utiliser getLatestSensorReading — conservé pour compatibilité API */
export async function getSensorReadings(): Promise<{
	latest: SensorReadingDto | null;
	history: SensorReadingDto[];
}> {
	const latest = await getLatestSensorReading();
	return { latest, history: latest ? [latest] : [] };
}
