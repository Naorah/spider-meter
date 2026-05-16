import { requireAdmin } from '$lib/server/auth';
import { prisma } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	await requireAdmin(cookies);
	const body = await request.json().catch(() => null);
	const title = typeof body?.title === 'string' ? body.title.trim() : '';
	const content = typeof body?.body === 'string' ? body.body.trim() : '';

	if (!title || !content) {
		return json({ message: 'Titre et contenu requis' }, { status: 400 });
	}

	const item = await prisma.newsItem.create({ data: { title, body: content } });

	return json({
		ok: true,
		item: {
			id: item.id,
			title: item.title,
			body: item.body,
			publishedAt: item.publishedAt.toISOString()
		}
	});
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	await requireAdmin(cookies);
	const id = Number(url.searchParams.get('id'));
	if (!Number.isInteger(id) || id < 1) {
		return json({ message: 'ID invalide' }, { status: 400 });
	}
	await prisma.newsItem.delete({ where: { id } });
	return json({ ok: true });
};
