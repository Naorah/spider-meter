import { hashPassword, requireAdmin, verifyPassword } from '$lib/server/auth';
import { prisma } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await requireAdmin(cookies);
	const body = await request.json().catch(() => null);
	const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
	const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

	if (!currentPassword || newPassword.length < 8) {
		return json({ message: 'Mot de passe actuel et nouveau (8+ car.) requis' }, { status: 400 });
	}

	const ok = await verifyPassword(currentPassword, user.passwordHash);
	if (!ok) {
		return json({ message: 'Mot de passe actuel incorrect' }, { status: 401 });
	}

	await prisma.adminUser.update({
		where: { id: user.id },
		data: { passwordHash: await hashPassword(newPassword) }
	});

	return json({ ok: true });
};
