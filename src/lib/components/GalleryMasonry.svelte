<script lang="ts">
	import GalleryLightbox from '$lib/components/GalleryLightbox.svelte';
	import type { GalleryPhotoListDto, GalleryPhotoListItemDto } from '$lib/types';
	import { onMount } from 'svelte';

	const PAGE_SIZE = 24;

	let items = $state<GalleryPhotoListItemDto[]>([]);
	let nextPage = $state(1);
	let totalPages = $state<number | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let lightboxItem = $state<GalleryPhotoListItemDto | null>(null);

	let sentinelEl = $state<HTMLElement | null>(null);

	async function loadMore() {
		if (loading) return;
		if (totalPages !== null && nextPage > totalPages) return;

		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/gallery?page=${nextPage}&pageSize=${PAGE_SIZE}`);
			if (!res.ok) {
				error = 'Impossible de charger la galerie.';
				return;
			}

			const data = (await res.json()) as GalleryPhotoListDto;
			items = [...items, ...data.items];
			nextPage = data.page + 1;
			totalPages = data.totalPages;
		} catch {
			error = 'Erreur réseau pendant le chargement.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadMore();
	});

	$effect(() => {
		if (!sentinelEl) return;

		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					void loadMore();
				}
			},
			{
				root: null,
				rootMargin: '400px 0px',
				threshold: 0.01
			}
		);

		io.observe(sentinelEl);
		return () => io.disconnect();
	});
</script>

<section class="px-6 py-14 sm:px-10 lg:px-16">
	<div class="mx-auto max-w-6xl">
		<h2 class="section-title">Galerie</h2>
		<p class="section-subtitle">Photos du terrarium — cliquez sur une image pour l’agrandir</p>

		{#if error}
			<p class="mt-6 text-sm text-red-400">{error}</p>
		{/if}

		<ul class="gallery-masonry mt-8">
			{#each items as item (item.id)}
				<li class="gallery-tile">
					<button
						type="button"
						class="gallery-tile__btn"
						onclick={() => (lightboxItem = item)}
						aria-label={`Agrandir : ${item.caption}`}
					>
						<img
							src={item.imageUrl}
							alt={item.caption}
							loading="lazy"
							decoding="async"
						/>
					</button>
					<p class="gallery-caption">{item.caption}</p>
				</li>
			{/each}
		</ul>

		<div class="mt-10 text-center text-sm text-[var(--color-muted)]">
			{#if loading}
				Chargement…
			{:else if items.length === 0 && !error}
				Aucune photo pour le moment.
			{/if}
		</div>

		<div bind:this={sentinelEl} class="h-8" aria-hidden="true"></div>
	</div>
</section>

<GalleryLightbox bind:item={lightboxItem} />

<style>
	.gallery-masonry {
		columns: 1;
		column-gap: 1rem;
	}

	@media (min-width: 640px) {
		.gallery-masonry {
			columns: 2;
		}
	}

	@media (min-width: 1024px) {
		.gallery-masonry {
			columns: 3;
		}
	}

	.gallery-tile {
		break-inside: avoid;
		display: inline-block;
		width: 100%;
		margin-bottom: 1rem;
	}

	.gallery-tile__btn {
		display: block;
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: default;
		border-radius: 0.85rem;
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.gallery-tile__btn:hover {
		transform: scale(1.02);
		box-shadow: 0 12px 32px -12px color-mix(in srgb, var(--color-accent) 35%, transparent);
	}

	.gallery-tile__btn img {
		width: 100%;
		display: block;
		border-radius: 0.85rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-elevated);
	}

	.gallery-caption {
		margin-top: 0.55rem;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.25;
		padding-inline: 0.1rem;
	}
</style>
