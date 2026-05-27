<script lang="ts">
	import NewsDetailModal from '$lib/components/NewsDetailModal.svelte';
	import type { NewsItemDto } from '$lib/types';
	import { Article, Newspaper } from 'phosphor-svelte';

	let {
		latest,
		history = []
	}: {
		latest: NewsItemDto | null;
		history?: NewsItemDto[];
	} = $props();

	let detailOpen = $state(false);
	let detailItem = $state<NewsItemDto | null>(null);

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	const older = $derived(history.filter((n) => n.id !== latest?.id).slice(0, 5));

	function openArchive(item: NewsItemDto) {
		detailItem = item;
		detailOpen = true;
	}
</script>

{#if latest}
	<section id="actualites" class="animate-fade-up animate-delay-1 scroll-mt-28 px-6 py-14 sm:px-10 lg:px-16">
		<div class="mx-auto max-w-5xl">
			<div class="mb-6 flex items-center gap-3">
				<Newspaper size={28} weight="duotone" class="text-[var(--color-accent)]" />
				<div>
					<h2 class="section-title">Actualité</h2>
					<p class="section-subtitle">{dateFormatter.format(new Date(latest.publishedAt))}</p>
				</div>
			</div>

			<article class="card p-6 sm:p-8">
				<h3 class="text-xl font-semibold text-[var(--color-accent)]">{latest.title}</h3>
				<p class="mt-4 leading-relaxed whitespace-pre-wrap text-[var(--color-muted)]">{latest.body}</p>
			</article>

			{#if older.length > 0}
				<details class="card mt-4 p-4">
					<summary class="cursor-pointer text-sm font-medium text-[var(--color-muted)]">
						Archives ({older.length})
					</summary>
					<ul class="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
						{#each older as item (item.id)}
							<li class="news-archive-item">
								<div class="news-archive-item__text">
									<p class="text-xs text-[var(--color-muted)]">
										{dateFormatter.format(new Date(item.publishedAt))}
									</p>
									<p class="font-medium">{item.title}</p>
								</div>
								<button
									type="button"
									class="news-archive-item__btn"
									aria-label={`Lire l’actualité : ${item.title}`}
									onclick={() => openArchive(item)}
								>
									<Article size={18} weight="duotone" />
									<span>Lire</span>
								</button>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</div>
	</section>

	<NewsDetailModal bind:open={detailOpen} bind:item={detailItem} />
{/if}

<style>
	.news-archive-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.news-archive-item__text {
		min-width: 0;
		flex: 1;
	}

	.news-archive-item__btn {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-bg-elevated) 70%, transparent);
		color: var(--color-text);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			color 0.2s ease,
			background 0.2s ease,
			transform 0.2s ease;
	}

	.news-archive-item__btn:hover {
		border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
		color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
		transform: translateY(-1px);
	}

	.news-archive-item__btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
