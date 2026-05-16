export type CompareOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

export const COMPARE_OPS: CompareOp[] = ['gt', 'gte', 'eq', 'lte', 'lt'];

export const COMPARE_OP_LABELS: Record<CompareOp, string> = {
	gt: '>',
	gte: '≥',
	eq: '=',
	lte: '≤',
	lt: '<'
};

export const SENSOR_PAGE_SIZES = [20, 50, 100] as const;
export type SensorPageSize = (typeof SENSOR_PAGE_SIZES)[number];

export type SensorReadingFilters = {
	page: number;
	pageSize: SensorPageSize;
	temperature: string;
	tempOp: CompareOp;
	humidity: string;
	humidityOp: CompareOp;
	dateFrom: string;
	dateTo: string;
};

export function defaultSensorFilters(): SensorReadingFilters {
	return {
		page: 1,
		pageSize: 20,
		temperature: '',
		tempOp: 'gte',
		humidity: '',
		humidityOp: 'gte',
		dateFrom: '',
		dateTo: ''
	};
}

export function buildSensorReadingsQuery(filters: SensorReadingFilters): string {
	const params = new URLSearchParams();
	params.set('page', String(filters.page));
	params.set('pageSize', String(filters.pageSize));

	const temp = filters.temperature.trim();
	if (temp !== '') {
		params.set('temperature', temp);
		params.set('tempOp', filters.tempOp);
	}

	const hum = filters.humidity.trim();
	if (hum !== '') {
		params.set('humidity', hum);
		params.set('humidityOp', filters.humidityOp);
	}

	if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
	if (filters.dateTo) params.set('dateTo', filters.dateTo);

	return params.toString();
}
