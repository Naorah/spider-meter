import { requireAdmin } from '$lib/server/auth';
import { generateIotToken, getIotToken, setIotToken } from '$lib/server/settings';
import { json, type RequestHandler } from '@sveltejs/kit';

function maskToken(token: string | null): string | null {
	if (!token) return null;
	if (token.length <= 8) return '••••••••';
	return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}

export const GET: RequestHandler = async ({ cookies }) => {
	await requireAdmin(cookies);
	const token = await getIotToken();
	return json({ masked: maskToken(token), hasToken: Boolean(token) });
};

export const POST: RequestHandler = async ({ cookies }) => {
	await requireAdmin(cookies);
	const token = generateIotToken();
	await setIotToken(token);
	return json({ ok: true, token });
};
