import { getLatestSensorReading } from '$lib/server/sensors';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const latest = await getLatestSensorReading();
	return json({ latest, history: latest ? [latest] : [] });
};
