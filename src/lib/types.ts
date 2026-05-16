export type SensorReadingDto = {
	id: number;
	deviceId: string;
	humidity: number;
	temperature: number;
	createdAt: string;
};

export type SpiderProfileDto = {
	name: string;
	commonName: string;
	scientificName: string;
	speciesNotes: string;
	movedInDate: string;
	movedInLabel: string;
};

export type MoltDto = {
	id: number;
	name: string;
	moltDate: string;
	sortOrder: number;
};

export type NewsItemDto = {
	id: number;
	title: string;
	body: string;
	publishedAt: string;
};

export type ChartRange = 'day' | 'week' | 'month';
export type ChartPointCount = 10 | 20 | 50 | 100;

export type ChartPointDto = {
	x: string;
	y: number;
};

export type ChartSeriesDto = {
	points: ChartPointDto[];
	meta: {
		range: ChartRange;
		points: ChartPointCount;
		bucketMs: number;
		rawCount: number;
		partial: boolean;
	};
};
