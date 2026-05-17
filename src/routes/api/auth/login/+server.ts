import { env } from '$env/dynamic/private';
import {
	authenticateUser,
	countAdmins,
	createAdminUser,
	setSessionCookie
} from '$lib/server/auth';
import { checkRateLimit, clientRateLimitKey } from '$lib/server/rate-limit';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	const { request, cookies } = event;

	const rate = checkRateLimit(clientRateLimitKey(event, 'auth-login'), {
		limit: 10,
		windowMs: 15 * 60 * 1000
	});
	if (!rate.allowed) {
		return json(
			{ message: 'Trop de tentatives. Réessayez plus tard.' },
			{ status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
		);
	}

	const body = await request.json().catch(() => null);
	const username = typeof body?.username === 'string' ? body.username.trim() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!username || !password) {
		return json({ message: 'Identifiants requis' }, { status: 400 });
	}

	const adminCount = await countAdmins();
	if (adminCount === 0) {
		const bootstrapUser = env.ADMIN_USERNAME?.trim();
		const bootstrapPass = env.ADMIN_PASSWORD;
		if (bootstrapUser && bootstrapPass && username === bootstrapUser && password === bootstrapPass) {
			const user = await createAdminUser(username, password);
			setSessionCookie(cookies, user.id);
			return json({ ok: true, bootstrapped: true });
		}
		return json(
			{
				message:
					'Aucun compte admin. Créez le premier compte via le bouton Admin (configuration initiale).'
			},
			{ status: 403 }
		);
	}

	const user = await authenticateUser(username, password);
	if (!user) {
		return json({ message: 'Identifiants incorrects' }, { status: 401 });
	}

	setSessionCookie(cookies, user.id);
	return json({ ok: true });
};
