import { requireAdmin } from '$lib/server/auth';
import { prisma } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({ request, cookies }) => {
	await requireAdmin(cookies);
	const body = await request.json().catch(() => null);

	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const commonName = typeof body?.commonName === 'string' ? body.commonName.trim() : '';
	const scientificName = typeof body?.scientificName === 'string' ? body.scientificName.trim() : '';
	const speciesNotes = typeof body?.speciesNotes === 'string' ? body.speciesNotes.trim() : '';
	const movedInDate = body?.movedInDate ? new Date(body.movedInDate) : null;

	if (!name || !scientificName || !movedInDate || Number.isNaN(movedInDate.getTime())) {
		return json({ message: 'Champs invalides' }, { status: 400 });
	}

	await prisma.spiderProfile.upsert({
		where: { id: 1 },
		create: { id: 1, name, commonName, scientificName, speciesNotes, movedInDate },
		update: { name, commonName, scientificName, speciesNotes, movedInDate }
	});

	return json({ ok: true });
};
