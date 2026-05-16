import { IOT_SERVER_TOKEN } from '$env/static/private';
import { prisma } from '$lib/server/db';
import { error, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function parseFloatParam(value: string | null): number | null {
	if (value === null || value.trim() === '') return null;
	const n = Number.parseFloat(value);
	return Number.isFinite(n) ? n : null;
}

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token || token !== IOT_SERVER_TOKEN) {
		error(401, 'Unauthorized');
	}

	const humidity = parseFloatParam(url.searchParams.get('hum'));
	const temperature =
		parseFloatParam(url.searchParams.get('temp')) ??
		parseFloatParam(url.searchParams.get('tmp'));
	const deviceId = url.searchParams.get('id')?.trim() || 'unknown';

	if (humidity === null || temperature === null) {
		error(400, 'Invalid parameters: hum and temp are required');
	}

	await prisma.sensorReading.create({
		data: { deviceId, humidity, temperature }
	});

	return text('OK');
};
