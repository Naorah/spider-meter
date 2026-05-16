import { env } from '$env/dynamic/private';
import { site } from '$lib/site';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	const origin = env.ORIGIN?.replace(/\/$/, '') ?? url.origin;
	const pageUrl = origin + url.pathname;
	const image = new URL(site.ogImagePath, origin).href;

	return {
		meta: {
			...site,
			url: pageUrl,
			image
		}
	};
};
