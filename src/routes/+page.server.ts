import { getSensorReadings } from '$lib/server/sensors';
import { spider } from '$lib/spider';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const readings = await getSensorReadings();

	return {
		spider,
		...readings
	};
};
