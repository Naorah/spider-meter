import { getPublicContent } from '$lib/server/content';
import { getLatestSensorReading } from '$lib/server/sensors';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [content, latest] = await Promise.all([getPublicContent(), getLatestSensorReading()]);

	return {
		...content,
		latest
	};
};
