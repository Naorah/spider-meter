import { requireAdmin } from '$lib/server/auth';
import {
	deleteSensorReading,
	listSensorReadings,
	parseSensorReadingQuery,
	validateSensorReadingQuery
} from '$lib/server/sensor-readings';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies }) => {
	await requireAdmin(cookies);

	const query = parseSensorReadingQuery(url.searchParams);
	const validationError = validateSensorReadingQuery(query);
	if (validationError) {
		return json({ message: validationError }, { status: 400 });
	}

	const result = await listSensorReadings(query);
	return json(result);
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	await requireAdmin(cookies);

	const id = Number(url.searchParams.get('id'));
	if (!Number.isInteger(id) || id < 1) {
		return json({ message: 'ID invalide' }, { status: 400 });
	}

	const deleted = await deleteSensorReading(id);
	if (!deleted) {
		return json({ message: 'Relevé introuvable' }, { status: 404 });
	}

	return json({ ok: true });
};
