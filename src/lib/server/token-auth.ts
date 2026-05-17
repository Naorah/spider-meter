import { timingSafeEqual } from 'node:crypto';

export function tokensMatch(expected: string, provided: string): boolean {
	const a = Buffer.from(expected, 'utf8');
	const b = Buffer.from(provided, 'utf8');
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
