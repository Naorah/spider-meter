import { requireAdmin } from '$lib/server/auth';
import { prisma } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	await requireAdmin(cookies);
	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const moltDate = body?.moltDate ? new Date(body.moltDate) : null;

	if (!name || !moltDate || Number.isNaN(moltDate.getTime())) {
		return json({ message: 'Nom et date requis' }, { status: 400 });
	}

	const molt = await prisma.molt.create({
		data: { name, moltDate, sortOrder: 0 }
	});

	return json({
		ok: true,
		molt: { id: molt.id, name: molt.name, moltDate: molt.moltDate.toISOString(), sortOrder: molt.sortOrder }
	});
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	await requireAdmin(cookies);
	const id = Number(url.searchParams.get('id'));
	if (!Number.isInteger(id) || id < 1) {
		return json({ message: 'ID invalide' }, { status: 400 });
	}
	await prisma.molt.delete({ where: { id } });
	return json({ ok: true });
};
