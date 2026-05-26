import { prisma } from '$lib/server/db';
import { minioGetObjectStream } from '$lib/server/minio';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) {
		return json({ message: 'ID invalide' }, { status: 400 });
	}

	const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
	if (!photo) {
		return json({ message: 'Photo introuvable' }, { status: 404 });
	}

	const stream = await minioGetObjectStream(photo.objectKey);
	return new Response(stream as any, {
		headers: {
			'Content-Type': photo.mimeType,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};

