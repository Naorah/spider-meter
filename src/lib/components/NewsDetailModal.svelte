<script lang="ts">
	import type { NewsItemDto } from '$lib/types';
	import { X } from 'phosphor-svelte';
	import { onMount } from 'svelte';

	let {
		open = $bindable(false),
		item = $bindable<NewsItemDto | null>(null)
	}: {
		open?: boolean;
		item?: NewsItemDto | null;
	} = $props();

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	function close() {
		open = false;
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
		document.body.style.overflow = open ? 'hidden' : '';
	});
</script>

{#if open && item}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="news-detail-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="news-detail-title"
		onclick={close}
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="news-detail-modal__panel card" onclick={(e) => e.stopPropagation()}>
			<div class="news-detail-modal__header">
				<div class="min-w-0 flex-1">
					<p class="news-detail-modal__date">
						{dateFormatter.format(new Date(item.publishedAt))}
					</p>
					<h2 id="news-detail-title" class="news-detail-modal__title">{item.title}</h2>
				</div>
				<button type="button" class="btn-icon news-detail-modal__close" aria-label="Fermer" onclick={close}>
					<X size={22} />
				</button>
			</div>
			<div class="news-detail-modal__body">
				<p class="whitespace-pre-wrap leading-relaxed text-[var(--color-muted)]">{item.body}</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.news-detail-modal {
		position: fixed;
		inset: 0;
		z-index: 55;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		background: color-mix(in srgb, #000 72%, transparent);
		backdrop-filter: blur(8px);
		animation: news-detail-modal-in 0.25s ease both;
	}

	@keyframes news-detail-modal-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.news-detail-modal__panel {
		width: 100%;
		max-width: 36rem;
		max-height: min(88vh, 40rem);
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		animation: news-detail-panel-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes news-detail-panel-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.news-detail-modal__header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem 1.25rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	@media (min-width: 640px) {
		.news-detail-modal__header {
			padding: 1.5rem 1.5rem 1.15rem;
		}
	}

	.news-detail-modal__date {
		margin: 0 0 0.35rem;
		font-size: 0.8rem;
		color: var(--color-muted);
	}

	.news-detail-modal__title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 600;
		line-height: 1.3;
		color: var(--color-accent);
	}

	@media (min-width: 640px) {
		.news-detail-modal__title {
			font-size: 1.35rem;
		}
	}

	.news-detail-modal__close {
		flex-shrink: 0;
		color: var(--color-text);
	}

	.news-detail-modal__body {
		padding: 1.15rem 1.25rem 1.35rem;
		overflow-y: auto;
	}

	@media (min-width: 640px) {
		.news-detail-modal__body {
			padding: 1.25rem 1.5rem 1.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.news-detail-modal,
		.news-detail-modal__panel {
			animation: none !important;
		}
	}
</style>
