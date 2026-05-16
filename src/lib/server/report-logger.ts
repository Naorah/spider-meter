import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import pino from 'pino';

const logDir = process.env.LOG_DIR ?? join(process.cwd(), 'logs');
const reportLogPath = process.env.REPORT_LOG_PATH ?? join(logDir, 'report.log');

if (!existsSync(logDir)) {
	mkdirSync(logDir, { recursive: true });
}

const isDev = process.env.NODE_ENV !== 'production';

const streams: pino.StreamEntry[] = [
	{
		level: 'info',
		stream: pino.destination({ dest: reportLogPath, sync: false, mkdir: true })
	}
];

if (isDev) {
	streams.push({
		level: 'info',
		stream: pino.transport({
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
				ignore: 'pid,hostname'
			}
		})
	});
} else {
	streams.push({ level: 'info', stream: process.stdout });
}

export const reportLogger = pino(
	{
		level: process.env.LOG_LEVEL ?? 'info',
		base: { service: 'spider-meter', channel: 'report' },
		timestamp: pino.stdTimeFunctions.isoTime
	},
	pino.multistream(streams)
);

export type ReportLogStatus = 'success' | 'unauthorized' | 'invalid_params';

export type ReportLogEntry = {
	status: ReportLogStatus;
	params: Record<string, string>;
	parsed?: {
		deviceId: string;
		humidity: number;
		temperature: number;
	};
	ip: string;
	userAgent: string | null;
	message?: string;
	readingId?: number;
};

/** Masque le token ; conserve les autres paramètres tels quels. */
export function sanitizeSearchParams(searchParams: URLSearchParams): Record<string, string> {
	const params: Record<string, string> = {};
	for (const [key, value] of searchParams.entries()) {
		params[key] = key === 'token' ? '[redacted]' : value;
	}
	return params;
}

export function logReportRequest(entry: ReportLogEntry): void {
	const level = entry.status === 'success' ? 'info' : 'warn';

	reportLogger[level](
		{
			event: 'report.request',
			status: entry.status,
			params: entry.params,
			parsed: entry.parsed,
			ip: entry.ip,
			userAgent: entry.userAgent,
			readingId: entry.readingId,
			message: entry.message
		},
		entry.message ?? `Report ${entry.status}`
	);
}
