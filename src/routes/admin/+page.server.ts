import { getNewsHistory, getMolts, getSpiderProfile } from '$lib/server/content';
import { getIotToken } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [spider, molts, news, iotToken] = await Promise.all([
		getSpiderProfile(),
		getMolts(),
		getNewsHistory(50),
		getIotToken()
	]);

	return {
		spider,
		molts,
		news,
		iotTokenMasked: iotToken
			? `${iotToken.slice(0, 4)}••••••••${iotToken.slice(-4)}`
			: null,
		hasIotToken: Boolean(iotToken)
	};
};
