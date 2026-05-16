import { clearSessionCookie } from '$lib/server/auth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	clearSessionCookie(cookies);
	return json({ ok: true });
};
