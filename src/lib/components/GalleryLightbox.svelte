<script lang="ts">
	import { X } from 'phosphor-svelte';
	import { onMount } from 'svelte';

	export type GalleryLightboxItem = {
		imageUrl: string;
		caption: string;
	};

	let { item = $bindable<GalleryLightboxItem | null>(null) }: {
		item?: GalleryLightboxItem | null;
	} = $props();

	function close() {
		item = null;
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	onMount(() => {
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

	$effect(() => {
		document.body.style.overflow = item ? 'hidden' : '';
	});
</script>

{#if item}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="gallery-lightbox"
		role="dialog"
		aria-modal="true"
		aria-label="Image agrandie"
		onclick={close}
		tabindex="-1"
	>
		<button type="button" class="gallery-lightbox__close btn-icon" aria-label="Fermer" onclick={close}>
			<X size={24} />
		</button>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="gallery-lightbox__content" onclick={(e) => e.stopPropagation()}>
			<img src={item.imageUrl} alt={item.caption} class="gallery-lightbox__img" />
			<p class="gallery-lightbox__caption">{item.caption}</p>
		</div>
	</div>
{/if}

<style>
	.gallery-lightbox {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: color-mix(in srgb, #000 75%, transparent);
		backdrop-filter: blur(8px);
		animation: gallery-lightbox-in 0.25s ease both;
	}

	@keyframes gallery-lightbox-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.gallery-lightbox__close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 2;
		color: var(--color-text);
		background: color-mix(in srgb, var(--color-bg-elevated) 80%, transparent);
	}

	.gallery-lightbox__content {
		max-width: min(92vw, 56rem);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.gallery-lightbox__img {
		max-width: 100%;
		max-height: calc(90vh - 4rem);
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		box-shadow: 0 24px 60px -20px #000;
	}

	.gallery-lightbox__caption {
		text-align: center;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		max-width: 40rem;
	}
</style>
