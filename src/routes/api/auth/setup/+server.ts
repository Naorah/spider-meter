import { countAdmins, createAdminUser, setSessionCookie } from '$lib/server/auth';
import { checkRateLimit, clientRateLimitKey } from '$lib/server/rate-limit';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const rate = checkRateLimit(clientRateLimitKey(event, 'auth-setup-get'), {
		limit: 30,
		windowMs: 60 * 1000
	});
	if (!rate.allowed) {
		return json(
			{ message: 'Trop de tentatives. Réessayez plus tard.' },
			{ status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
		);
	}

	const adminCount = await countAdmins();
	return json({ available: adminCount === 0 });
};

export const POST: RequestHandler = async (event) => {
	const { request, cookies } = event;
	const rate = checkRateLimit(clientRateLimitKey(event, 'auth-setup'), {
		limit: 5,
		windowMs: 60 * 60 * 1000
	});
	if (!rate.allowed) {
		return json(
			{ message: 'Trop de tentatives. Réessayez plus tard.' },
			{ status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
		);
	}

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
