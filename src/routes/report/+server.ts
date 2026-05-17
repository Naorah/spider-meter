import { prisma } from '$lib/server/db';
import { checkRateLimit, clientRateLimitKey } from '$lib/server/rate-limit';
import {
	logReportRequest,
	sanitizeSearchParams,
	type ReportLogEntry
} from '$lib/server/report-logger';
import { getIotToken } from '$lib/server/settings';
import { tokensMatch } from '$lib/server/token-auth';
import { error, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function parseFloatParam(value: string | null): number | null {
	if (value === null || value.trim() === '') return null;
	const n = Number.parseFloat(value);
	return Number.isFinite(n) ? n : null;
}

function requestContext(
	event: Parameters<RequestHandler>[0]
): Pick<ReportLogEntry, 'ip' | 'userAgent' | 'params'> {
	return {
		ip: event.getClientAddress(),
		userAgent: event.request.headers.get('user-agent'),
		params: sanitizeSearchParams(event.url.searchParams)
	};
}

export const GET: RequestHandler = async (event) => {
	const { url } = event;
	const ctx = requestContext(event);

	const rate = checkRateLimit(clientRateLimitKey(event, 'report'), {
		limit: 120,
		windowMs: 60 * 1000
	});
	if (!rate.allowed) {
		logReportRequest({
			...ctx,
			status: 'rate_limited',
			message: 'Limite de débit dépassée'
		});
		error(429, 'Too Many Requests');
	}

	const expectedToken = await getIotToken();
	const token = url.searchParams.get('token');
	if (!expectedToken || !token || !tokensMatch(expectedToken, token)) {
		logReportRequest({
			...ctx,
			status: 'unauthorized',
			message: 'Token absent ou invalide'
		});
		error(401, 'Unauthorized');
	}

	const humidity = parseFloatParam(url.searchParams.get('hum'));
	const temperature =
		parseFloatParam(url.searchParams.get('temp')) ??
		parseFloatParam(url.searchParams.get('tmp'));
	const deviceId = url.searchParams.get('id')?.trim() || 'unknown';

	if (humidity === null || temperature === null) {
		logReportRequest({
			...ctx,
			status: 'invalid_params',
			message: 'Paramètres hum et temp/tmp requis et numériques'
		});
		error(400, 'Invalid parameters: hum and temp are required');
	}

	const reading = await prisma.sensorReading.create({
		data: { deviceId, humidity, temperature }
	});

	logReportRequest({
		...ctx,
		status: 'success',
		parsed: { deviceId, humidity, temperature },
		readingId: reading.id,
		message: 'Lecture enregistrée'
	});

	return text('OK');
};
