import { requireAdmin } from '$lib/server/auth';
import {
	createGalleryPhoto,
	deleteGalleryPhoto,
	listGalleryPhotos,
	updateGalleryPhotoCaption
} from '$lib/server/gallery';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies }) => {
	await requireAdmin(cookies);

	const page = Number(url.searchParams.get('page') ?? 1);
	const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

	const safePage = Number.isFinite(page) && page > 0 ? page : 1;
	const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;

	const result = await listGalleryPhotos(safePage, safePageSize);
	return json(result);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	await requireAdmin(cookies);

	const form = await request.formData();
	const captionRaw = form.get('caption');
	const fileRaw = form.get('file');

	const caption = typeof captionRaw === 'string' ? captionRaw.trim() : '';
	if (!caption) {
		return json({ message: 'Légende requise' }, { status: 400 });
	}

	if (!fileRaw || typeof (fileRaw as any).arrayBuffer !== 'function') {
		return json({ message: 'Fichier image requis' }, { status: 400 });
	}

	const file = fileRaw as unknown as File;

	try {
		const item = await createGalleryPhoto(caption, file);
		return json({ ok: true, item });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return json({ message }, { status: 400 });
	}
};

export const PATCH: RequestHandler = async ({ request, url, cookies }) => {
	await requireAdmin(cookies);

	const id = Number(url.searchParams.get('id'));
	if (!Number.isInteger(id) || id < 1) {
		return json({ message: 'ID invalide' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	const caption = typeof body?.caption === 'string' ? body.caption.trim() : '';
	if (!caption) {
		return json({ message: 'Légende requise' }, { status: 400 });
	}

	try {
		const item = await updateGalleryPhotoCaption(id, caption);
		if (!item) return json({ message: 'Photo introuvable' }, { status: 404 });
		return json({ ok: true, item });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return json({ message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	await requireAdmin(cookies);

	const id = Number(url.searchParams.get('id'));
	if (!Number.isInteger(id) || id < 1) {
		return json({ message: 'ID invalide' }, { status: 400 });
	}

	const ok = await deleteGalleryPhoto(id);
	if (!ok) return json({ message: 'Photo introuvable' }, { status: 404 });

	return json({ ok: true });
};

