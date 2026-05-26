<script lang="ts">
	import type { NewsItemDto, NewsItemSummaryDto } from '$lib/types';
	import { Newspaper } from 'phosphor-svelte';

	let {
		latest,
		history = []
	}: {
		latest: NewsItemDto | null;
		history?: NewsItemSummaryDto[];
	} = $props();

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	const older = $derived(history.filter((n) => n.id !== latest?.id).slice(0, 5));
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
							<li>
								<p class="text-xs text-[var(--color-muted)]">
									{dateFormatter.format(new Date(item.publishedAt))}
								</p>
								<p class="font-medium">{item.title}</p>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</div>
	</section>
{/if}
