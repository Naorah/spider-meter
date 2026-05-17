import { getSessionUser } from '$lib/server/auth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	const user = await getSessionUser(cookies);
	return json({
		authenticated: Boolean(user),
		username: user?.username ?? null
	});
};
