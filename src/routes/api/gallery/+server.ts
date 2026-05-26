import { listGalleryPhotos } from '$lib/server/gallery';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? 1);
	const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

	const safePage = Number.isFinite(page) && page > 0 ? page : 1;
	const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;

	const result = await listGalleryPhotos(safePage, safePageSize);
	return json(result);
};

