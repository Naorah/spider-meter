<script lang="ts">
	import type { MoltDto } from '$lib/types';
	import { Butterfly } from 'phosphor-svelte';

	let { molts }: { molts: MoltDto[] } = $props();

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
</script>

{#if molts.length > 0}
	<section class="animate-fade-up animate-delay-4 px-6 py-14 sm:px-10 lg:px-16">
		<div class="mx-auto max-w-5xl">
			<div class="mb-8 flex items-center gap-3">
				<Butterfly size={28} weight="duotone" class="text-[var(--color-accent)]" />
				<div>
					<h2 class="section-title">Mues</h2>
					<p class="section-subtitle">Historique des changements de cuticule</p>
				</div>
			</div>

			<ol class="relative space-y-4 border-l border-[var(--color-border)] pl-6">
				{#each molts as molt (molt.id)}
					<li class="relative">
						<span
							class="molt-timeline-dot pointer-events-none absolute top-6 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-bg)]"
							aria-hidden="true"
						></span>
						<article class="card card--no-lift p-5">
							<p class="font-semibold">{molt.name}</p>
							<p class="mt-1 text-sm text-[var(--color-muted)]">
								{dateFormatter.format(new Date(molt.moltDate))}
							</p>
						</article>
					</li>
				{/each}
			</ol>
		</div>
	</section>
{/if}
