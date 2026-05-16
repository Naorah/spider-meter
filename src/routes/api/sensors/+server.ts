import { getSensorReadings } from '$lib/server/sensors';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const readings = await getSensorReadings();
	return json(readings);
};
