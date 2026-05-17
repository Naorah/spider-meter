import { assertProductionSecrets, getSessionUser } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

assertProductionSecrets();

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
		const user = await getSessionUser(event.cookies);
		if (!user) {
			if (pathname.startsWith('/api/')) {
				return new Response(JSON.stringify({ message: 'Non authentifié' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			redirect(303, `/?login=1&redirect=${encodeURIComponent(pathname)}`);
		}
		event.locals.user = { id: user.id, username: user.username };
	}

	return resolve(event);
};
