import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.spiderProfile.upsert({
		where: { id: 1 },
		create: {
			id: 1,
			name: 'Béboune',
			commonName: '—',
			scientificName: 'Phidippus Regius',
			speciesNotes:
				'Phidippus regius est l’une des plus grandes espèces d’araignées sauteuses d’Amérique du Nord et des Caraïbes. Elle est connue pour son comportement curieux et sa vision exceptionnelle.',
			movedInDate: new Date('2026-05-15')
		},
		update: {}
	});
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
