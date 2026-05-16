import { requireAdminPage } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const user = await requireAdminPage(cookies, url);
	return { user: { id: user.id, username: user.username } };
};
