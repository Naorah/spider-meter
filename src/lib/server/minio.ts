import { env } from '$env/dynamic/private';
import { Client } from 'minio';

type MinioConfig = {
	endPoint: string;
	port?: number;
	useSSL: boolean;
	accessKey: string;
	secretKey: string;
	bucket: string;
};

let cachedClient: Client | null = null;
let cachedConfig: MinioConfig | null = null;
let bucketEnsured = false;

function parseEndpoint(endpointRaw: string): { endPoint: string; port?: number; useSSL: boolean } {
	const raw = endpointRaw.trim();
	if (!raw) throw new Error('MINIO_ENDPOINT vide.');

	if (raw.startsWith('http://') || raw.startsWith('https://')) {
		const u = new URL(raw);
		return {
			endPoint: u.hostname,
			port: u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80,
			useSSL: u.protocol === 'https:'
		};
	}

	// Support: "host:port"
	if (raw.includes(':')) {
		const [host, portRaw] = raw.split(':');
		return { endPoint: host, port: Number(portRaw), useSSL: false };
	}

	// Support: "host" (défaut HTTP)
	return { endPoint: raw, port: 9000, useSSL: false };
}

function requireConfig(): MinioConfig {
	if (cachedConfig) return cachedConfig;

	const endpointRaw = env.MINIO_ENDPOINT?.trim();
	const bucket = env.MINIO_BUCKET?.trim();
	const accessKey = env.MINIO_USER?.trim();
	const secretKey = env.MINIO_PASSWORD?.trim();

	if (!endpointRaw || !bucket || !accessKey || !secretKey) {
		throw new Error(
			'Configuration MinIO manquante. Ajoutez MINIO_ENDPOINT, MINIO_BUCKET, MINIO_USER, MINIO_PASSWORD dans .env.'
		);
	}

	const { endPoint, port, useSSL } = parseEndpoint(endpointRaw);
	cachedConfig = { endPoint, port, useSSL, accessKey, secretKey, bucket };
	return cachedConfig;
}

export function getMinioClient(): Client {
	if (cachedClient) return cachedClient;
	const cfg = requireConfig();
	cachedClient = new Client({
		endPoint: cfg.endPoint,
		port: cfg.port,
		useSSL: cfg.useSSL,
		accessKey: cfg.accessKey,
		secretKey: cfg.secretKey
	});
	return cachedClient;
}

export function getGalleryBucket(): string {
	return requireConfig().bucket;
}

export function galleryObjectKey(objectId: string, extLower: string): string {
	const safeExt = extLower.replace(/^\./, '').toLowerCase();
	return `gallery/${objectId}.${safeExt}`;
}

async function ensureBucketExists(): Promise<void> {
	if (bucketEnsured) return;
	const client = getMinioClient();
	const bucket = getGalleryBucket();
	try {
		const exists = await (client as any).bucketExists(bucket);
		if (!exists) {
			// La région peut être ignorée côté MinIO dans la plupart des cas.
			await (client as any).makeBucket(bucket, 'us-east-1');
		}
	} finally {
		bucketEnsured = true;
	}
}

export async function minioPutObject(objectKey: string, buffer: Buffer, mimeType: string): Promise<void> {
	const client = getMinioClient();
	const bucket = getGalleryBucket();
	await ensureBucketExists();

	// putObject accepte Buffer + taille + metadata (Content-Type).
	await (client as any).putObject(bucket, objectKey, buffer, buffer.length, { 'Content-Type': mimeType });
}

export async function minioRemoveObject(objectKey: string): Promise<void> {
	const client = getMinioClient();
	const bucket = getGalleryBucket();
	await ensureBucketExists();

	try {
		await (client as any).removeObject(bucket, objectKey);
	} catch (err) {
		// Le bucket peut déjà contenir/ ne pas contenir l’objet : on tolère l’absence lors de la suppression.
		// (On ne relaye l’erreur que si MinIO est manifestement indisponible.)
		const message = err instanceof Error ? err.message : String(err);
		if (!message.toLowerCase().includes('not found')) throw err;
	}
}

export async function minioGetObjectStream(objectKey: string): Promise<NodeJS.ReadableStream> {
	const client = getMinioClient();
	const bucket = getGalleryBucket();
	await ensureBucketExists();

	// getObject renvoie un stream Readable côté Node.
	const obj = await (client as any).getObject(bucket, objectKey);
	return obj as NodeJS.ReadableStream;
}

