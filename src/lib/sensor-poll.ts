import type { SensorReadingDto } from '$lib/types';

export const SENSOR_POLL_INTERVAL_MS = 30_000;

export type SensorPollData = {
	latest: SensorReadingDto | null;
	history: SensorReadingDto[];
};

export async function fetchSensorReadings(): Promise<SensorPollData> {
	const response = await fetch('/api/sensors');
	if (!response.ok) {
		throw new Error(`Échec de la récupération des capteurs (${response.status})`);
	}
	return response.json();
}
