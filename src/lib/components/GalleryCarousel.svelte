<script lang="ts">
	import GalleryLightbox from '$lib/components/GalleryLightbox.svelte';
	import type { GalleryPhotoListDto, GalleryPhotoListItemDto } from '$lib/types';
	import { CaretLeft, CaretRight, Images } from 'phosphor-svelte';
	import { onMount } from 'svelte';

	const PAGE_SIZE = 3;

	let items = $state<GalleryPhotoListItemDto[]>([]);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalPhotos = $state(0);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let lightboxItem = $state<GalleryPhotoListItemDto | null>(null);
	let slideVisible = $state(true);

	let trackEl = $state<HTMLElement | null>(null);
	let touchStartX = $state(0);

	const canPrev = $derived(currentPage > 1);
	const canNext = $derived(currentPage < totalPages);

	async function loadPage(page: number) {
		if (loading) return;

		loading = true;
		error = null;
		slideVisible = false;

		try {
			const res = await fetch(`/api/gallery?page=${page}&pageSize=${PAGE_SIZE}`);
			if (!res.ok) {
				error = 'Impossible de charger la galerie.';
				return;
			}

			const data = (await res.json()) as GalleryPhotoListDto;
			items = data.items;
			currentPage = data.page;
			totalPages = data.totalPages;
			totalPhotos = data.total;
		} catch {
			error = 'Erreur réseau pendant le chargement.';
		} finally {
			loading = false;
			requestAnimationFrame(() => {
				slideVisible = true;
			});
		}
	}

	function goToPage(page: number) {
		const target = Math.max(1, Math.min(page, totalPages));
		if (target === currentPage && items.length > 0) return;
		void loadPage(target);
	}

	function prev() {
		if (canPrev) goToPage(currentPage - 1);
	}

	function next() {
		if (canNext) goToPage(currentPage + 1);
	}

	function onSectionKeyDown(e: KeyboardEvent) {
		if (lightboxItem) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			prev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			next();
		}
	}

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0]?.clientX ?? 0;
	}

	function onTouchEnd(e: TouchEvent) {
		const endX = e.changedTouches[0]?.clientX ?? 0;
		const delta = endX - touchStartX;
		const threshold = 48;
		if (delta > threshold) prev();
		else if (delta < -threshold) next();
	}

	onMount(() => {
		void loadPage(1);
	});
</script>

<section
	id="galerie"
	class="animate-fade-up animate-delay-5 scroll-mt-28 px-6 py-14 sm:px-10 lg:px-16"
>
	<div class="mx-auto max-w-5xl">
		<div class="mb-6 flex items-center gap-3">
			<Images size={28} weight="duotone" class="text-[var(--color-accent)]" />
			<div>
				<h2 class="section-title">Galerie</h2>
				<p class="section-subtitle">Photos du terrarium — cliquez sur une image pour l’agrandir</p>
			</div>
		</div>

		{#if error}
			<p class="mb-4 text-sm text-red-400">{error}</p>
		{:else if !loading && totalPhotos === 0}
			<p class="text-center text-sm text-[var(--color-muted)]">Aucune photo pour le moment.</p>
		{:else}
			<div
				class="gallery-carousel card card--no-lift p-4 sm:p-6"
				role="region"
				aria-label="Carrousel photos"
				tabindex="0"
				onkeydown={onSectionKeyDown}
			>
				<div class="gallery-carousel__toolbar">
					{#if totalPhotos > 0}
						<p class="gallery-carousel__count" aria-live="polite">
							<span class="tabular-nums">{totalPhotos}</span>
							{totalPhotos === 1 ? 'photo' : 'photos'}
							<span class="text-[var(--color-muted)]"> · </span>
							Page <span class="tabular-nums">{currentPage}</span> / <span class="tabular-nums">{totalPages}</span>
						</p>
					{/if}
				</div>

				<div class="gallery-carousel__stage">
					<button
						type="button"
						class="gallery-carousel__nav gallery-carousel__nav--prev"
						aria-label="Page précédente"
						disabled={!canPrev || loading}
						onclick={prev}
					>
						<CaretLeft size={22} weight="bold" />
					</button>

					<div
						bind:this={trackEl}
						class="gallery-carousel__track"
						class:gallery-carousel__track--visible={slideVisible}
						class:gallery-carousel__track--loading={loading}
						role="group"
						aria-label="Photos de la page"
						ontouchstart={onTouchStart}
						ontouchend={onTouchEnd}
					>
						{#if loading && items.length === 0}
							<div class="gallery-carousel__skeleton-grid" aria-hidden="true">
								{#each Array(PAGE_SIZE) as _, i (i)}
									<div class="gallery-carousel__skeleton"></div>
								{/each}
							</div>
						{:else}
							<ul class="gallery-carousel__grid">
								{#each items as item (item.id)}
									<li class="gallery-carousel__slide">
										<button
											type="button"
											class="gallery-carousel__card"
											onclick={() => (lightboxItem = item)}
											aria-label={`Agrandir : ${item.caption}`}
										>
											<div class="gallery-carousel__media">
												<img
													src={item.imageUrl}
													alt={item.caption}
													loading="lazy"
													decoding="async"
												/>
											</div>
											<p class="gallery-carousel__caption">{item.caption}</p>
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<button
						type="button"
						class="gallery-carousel__nav gallery-carousel__nav--next"
						aria-label="Page suivante"
						disabled={!canNext || loading}
						onclick={next}
					>
						<CaretRight size={22} weight="bold" />
					</button>
				</div>

				{#if totalPages > 1}
					<nav class="gallery-carousel__dots" aria-label="Pagination de la galerie">
						{#each Array(totalPages) as _, i (i)}
							{@const page = i + 1}
							<button
								type="button"
								class="gallery-carousel__dot"
								class:gallery-carousel__dot--active={page === currentPage}
								aria-label={`Page ${page}`}
								aria-current={page === currentPage ? 'true' : undefined}
								disabled={loading}
								onclick={() => goToPage(page)}
							></button>
						{/each}
					</nav>
				{/if}
			</div>
		{/if}
	</div>
</section>

<GalleryLightbox bind:item={lightboxItem} />

<style>
	.gallery-carousel {
		overflow: hidden;
	}

	.gallery-carousel__toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		min-height: 1.25rem;
	}

	.gallery-carousel__count {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-muted);
		letter-spacing: 0.02em;
	}

	.gallery-carousel__stage {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.gallery-carousel__stage {
			gap: 0.75rem;
		}
	}

	.gallery-carousel__nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-bg) 60%, transparent);
		color: var(--color-text);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background 0.2s ease,
			color 0.2s ease,
			transform 0.2s ease,
			opacity 0.2s ease;
	}

	@media (min-width: 640px) {
		.gallery-carousel__nav {
			width: 2.75rem;
			height: 2.75rem;
		}
	}

	.gallery-carousel__nav:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--color-accent) 50%, var(--color-border));
		color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
		transform: scale(1.05);
	}

	.gallery-carousel__nav:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.gallery-carousel__track {
		min-width: 0;
		opacity: 0;
		transform: translateY(6px);
		transition:
			opacity 0.35s ease,
			transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.gallery-carousel__track--visible {
		opacity: 1;
		transform: translateY(0);
	}

	.gallery-carousel__track--loading {
		pointer-events: none;
	}

	.gallery-carousel__grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.gallery-carousel__grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.gallery-carousel__grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.gallery-carousel__slide {
		min-width: 0;
	}

	.gallery-carousel__card {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		border-radius: 0.85rem;
		transition: transform 0.25s ease;
	}

	.gallery-carousel__card:hover {
		transform: translateY(-3px);
	}

	.gallery-carousel__card:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 3px;
	}

	.gallery-carousel__media {
		position: relative;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		box-shadow: 0 8px 24px -12px color-mix(in srgb, #000 50%, transparent);
	}

	.gallery-carousel__card:hover .gallery-carousel__media {
		border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
		box-shadow:
			0 12px 32px -12px color-mix(in srgb, var(--color-accent) 25%, transparent),
			0 0 0 1px color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.gallery-carousel__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.gallery-carousel__card:hover .gallery-carousel__media img {
		transform: scale(1.04);
	}

	.gallery-carousel__caption {
		margin: 0.65rem 0 0;
		padding-inline: 0.15rem;
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.3;
		color: var(--color-text);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.gallery-carousel__dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.45rem;
		margin-top: 1.25rem;
		padding-top: 0.25rem;
	}

	.gallery-carousel__dot {
		width: 0.45rem;
		height: 0.45rem;
		padding: 0;
		border: none;
		border-radius: 9999px;
		background: var(--color-border);
		cursor: pointer;
		transition:
			width 0.25s ease,
			background 0.25s ease,
			opacity 0.2s ease;
	}

	.gallery-carousel__dot:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent) 60%, var(--color-border));
	}

	.gallery-carousel__dot--active {
		width: 1.35rem;
		background: var(--color-accent);
	}

	.gallery-carousel__dot:disabled {
		opacity: 0.5;
		cursor: wait;
	}

	.gallery-carousel__skeleton-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.gallery-carousel__skeleton-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.gallery-carousel__skeleton-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.gallery-carousel__skeleton {
		aspect-ratio: 4 / 3;
		border-radius: 0.75rem;
		background: linear-gradient(
			110deg,
			var(--color-bg) 0%,
			color-mix(in srgb, var(--color-border) 40%, var(--color-bg)) 45%,
			var(--color-bg) 90%
		);
		background-size: 200% 100%;
		animation: gallery-carousel-shimmer 1.2s ease-in-out infinite;
	}

	@keyframes gallery-carousel-shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: -100% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.gallery-carousel__track,
		.gallery-carousel__media img,
		.gallery-carousel__card,
		.gallery-carousel__nav,
		.gallery-carousel__dot {
			transition-duration: 0.01ms !important;
			animation: none !important;
		}

		.gallery-carousel__track {
			opacity: 1;
			transform: none;
		}
	}
</style>
