import { prisma } from '$lib/server/db';
import { galleryObjectKey, minioPutObject, minioRemoveObject } from '$lib/server/minio';
import sizeOf from 'image-size';
import { randomUUID } from 'node:crypto';
import type { GalleryPhotoDto, GalleryPhotoListDto, GalleryPhotoListItemDto } from '$lib/types';

export const GALLERY_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;
type AllowedExt = (typeof ALLOWED_EXTENSIONS)[number];

const EXT_TO_MIME: Record<AllowedExt, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	gif: 'image/gif'
};

function extFromFilename(filename: string): AllowedExt | null {
	const cleaned = filename.trim();
	const dot = cleaned.lastIndexOf('.');
	if (dot === -1) return null;
	const ext = cleaned.slice(dot + 1).toLowerCase();
	if (!ALLOWED_EXTENSIONS.includes(ext as AllowedExt)) return null;
	return ext as AllowedExt;
}

function getMagicMime(buffer: Buffer): string | null {
	// JPEG: FF D8 FF
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (buffer.length >= 8) {
		const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
		let ok = true;
		for (let i = 0; i < pngSig.length; i++) if (buffer[i] !== pngSig[i]) ok = false;
		if (ok) return 'image/png';
	}

	// GIF: GIF87a or GIF89a
	if (buffer.length >= 6) {
		const head = buffer.subarray(0, 6).toString('ascii');
		if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif';
	}

	// WEBP: RIFF....WEBP
	if (buffer.length >= 12) {
		const riff = buffer.subarray(0, 4).toString('ascii');
		const webp = buffer.subarray(8, 12).toString('ascii');
		if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
	}

	return null;
}

async function readBuffer(file: File): Promise<Buffer> {
	const ab = await file.arrayBuffer();
	return Buffer.from(ab);
}

export async function validateGalleryUpload(file: File): Promise<{
	buffer: Buffer;
	extLower: AllowedExt;
	mimeType: string;
	width: number | null;
	height: number | null;
	sizeBytes: number;
}> {
	if (!file) throw new Error('Fichier manquant');
	if (file.size > GALLERY_MAX_BYTES) {
		throw new Error(`Taille max 10Mo dépassée (${Math.round(file.size / 1024 / 1024)}Mo).`);
	}

	const extLower = extFromFilename(file.name);
	if (!extLower) {
		throw new Error('Extension non autorisée. Utilisez jpg, jpeg, png, webp ou gif.');
	}

	const buffer = await readBuffer(file);

	const expectedMime = EXT_TO_MIME[extLower];
	const actualMime = getMagicMime(buffer);
	if (!actualMime) throw new Error('Fichier non reconnu comme image.');
	if (actualMime !== expectedMime) {
		throw new Error('Extension/mime incohérents. Le contenu ne correspond pas au type déclaré.');
	}

	const dims = sizeOf(buffer);
	const width = (dims as any)?.width;
	const height = (dims as any)?.height;
	if (typeof width !== 'number' || typeof height !== 'number') {
		throw new Error('Impossible de lire les dimensions de l’image.');
	}
	if (width <= 0 || height <= 0) throw new Error('Dimensions image invalides.');

	return {
		buffer,
		extLower,
		mimeType: expectedMime,
		width,
		height,
		sizeBytes: buffer.byteLength
	};
}

function toGalleryDto(row: {
	id: number;
	caption: string;
	width: number | null;
	height: number | null;
	createdAt: Date;
}): GalleryPhotoDto {
	return {
		id: row.id,
		caption: row.caption,
		createdAt: row.createdAt.toISOString(),
		width: row.width,
		height: row.height
	};
}

function toListItem(dto: GalleryPhotoDto): GalleryPhotoListItemDto {
	return {
		...dto,
		imageUrl: `/api/gallery/${dto.id}/image`
	};
}

export async function listGalleryPhotos(page: number, pageSize: number = DEFAULT_PAGE_SIZE): Promise<GalleryPhotoListDto> {
	const safePageSize = Math.max(1, Math.min(pageSize, 100));
	const total = await prisma.galleryPhoto.count();
	const totalPages = Math.max(1, Math.ceil(total / safePageSize));
	const safePage = Math.max(1, Math.min(page, totalPages));

	const rows = await prisma.galleryPhoto.findMany({
		orderBy: { createdAt: 'desc' },
		skip: (safePage - 1) * safePageSize,
		take: safePageSize
	});

	const items = rows.map((r) => toListItem(toGalleryDto(r)));

	return {
		items,
		total,
		page: safePage,
		pageSize: safePageSize,
		totalPages
	};
}

export async function createGalleryPhoto(caption: string, file: File): Promise<GalleryPhotoListItemDto> {
	const validated = await validateGalleryUpload(file);
	const objectId = randomUUID();
	const objectKey = galleryObjectKey(objectId, validated.extLower);

	await minioPutObject(objectKey, validated.buffer, validated.mimeType);

	const photo = await prisma.galleryPhoto.create({
		data: {
			objectKey,
			caption,
			mimeType: validated.mimeType,
			sizeBytes: validated.sizeBytes,
			width: validated.width,
			height: validated.height
		}
	});

	return toListItem(toGalleryDto(photo));
}

export async function updateGalleryPhotoCaption(
	id: number,
	caption: string
): Promise<GalleryPhotoListItemDto | null> {
	const trimmed = caption.trim();
	if (!trimmed) throw new Error('Légende requise');
	if (trimmed.length > 200) throw new Error('Légende trop longue (200 caractères max).');

	const existing = await prisma.galleryPhoto.findUnique({ where: { id } });
	if (!existing) return null;

	const photo = await prisma.galleryPhoto.update({
		where: { id },
		data: { caption: trimmed }
	});

	return toListItem(toGalleryDto(photo));
}

export async function deleteGalleryPhoto(id: number): Promise<boolean> {
	const row = await prisma.galleryPhoto.findUnique({ where: { id } });
	if (!row) return false;

	try {
		await minioRemoveObject(row.objectKey);
	} finally {
		await prisma.galleryPhoto.delete({ where: { id } });
	}

	return true;
}

