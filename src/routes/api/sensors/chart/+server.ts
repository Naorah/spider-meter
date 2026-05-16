import {
	getAggregatedChartSeries,
	parseChartPoints,
	parseChartRange
} from '$lib/server/chart-aggregation';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const range = parseChartRange(url.searchParams.get('range'));
	const points = parseChartPoints(url.searchParams.get('points'));

	const [humidity, temperature] = await Promise.all([
		getAggregatedChartSeries(range, points, 'humidity'),
		getAggregatedChartSeries(range, points, 'temperature')
	]);

	return json({ humidity, temperature });
};
