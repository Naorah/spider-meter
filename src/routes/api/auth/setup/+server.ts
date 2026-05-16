import { countAdmins, createAdminUser, setSessionCookie } from '$lib/server/auth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const adminCount = await countAdmins();
	if (adminCount > 0) {
		return json({ message: 'Un compte admin existe déjà' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	const username = typeof body?.username === 'string' ? body.username.trim() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!username || password.length < 8) {
		return json({ message: 'Nom d’utilisateur et mot de passe (8+ car.) requis' }, { status: 400 });
	}

	const user = await createAdminUser(username, password);
	setSessionCookie(cookies, user.id);
	return json({ ok: true });
};
