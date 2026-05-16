import { IOT_SERVER_TOKEN } from '$env/static/private';
import { prisma } from '$lib/server/db';

const IOT_TOKEN_KEY = 'iot_token';

export async function getIotToken(): Promise<string | null> {
	const row = await prisma.appSetting.findUnique({ where: { key: IOT_TOKEN_KEY } });
	if (row?.value) return row.value;
	return IOT_SERVER_TOKEN || null;
}

export async function setIotToken(token: string): Promise<void> {
	await prisma.appSetting.upsert({
		where: { key: IOT_TOKEN_KEY },
		create: { key: IOT_TOKEN_KEY, value: token },
		update: { value: token }
	});
}

export function generateIotToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
