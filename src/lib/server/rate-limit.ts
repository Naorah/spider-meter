type Bucket = {
	count: number;
	resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
	limit: number;
	windowMs: number;
};

export type RateLimitResult = {
	allowed: boolean;
	retryAfterSec: number;
};

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
	const now = Date.now();
	let bucket = buckets.get(key);

	if (!bucket || now >= bucket.resetAt) {
		bucket = { count: 0, resetAt: now + options.windowMs };
		buckets.set(key, bucket);
	}

	bucket.count += 1;

	const allowed = bucket.count <= options.limit;
	const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

	return { allowed, retryAfterSec };
}

export function clientRateLimitKey(event: { getClientAddress: () => string }, scope: string): string {
	return `${scope}:${event.getClientAddress()}`;
}
