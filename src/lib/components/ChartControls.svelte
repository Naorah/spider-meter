<script lang="ts">
	import type { ChartPointCount, ChartRange } from '$lib/types';

	let {
		range = $bindable('week' as ChartRange),
		points = $bindable(20 as ChartPointCount),
		rawCount = 0,
		displayedCount = 0,
		aggregated = false
	}: {
		range?: ChartRange;
		points?: ChartPointCount;
		rawCount?: number;
		displayedCount?: number;
		aggregated?: boolean;
	} = $props();

	const ranges: { value: ChartRange; label: string }[] = [
		{ value: 'day', label: 'Jour' },
		{ value: 'week', label: 'Semaine' },
		{ value: 'month', label: 'Mois' }
	];

	const pointOptions: ChartPointCount[] = [10, 20, 50, 100];

	const resolutionHint = $derived.by(() => {
		if (rawCount === 0) return 'Aucune mesure sur cette période.';
		if (!aggregated) {
			return `${displayedCount} mesure${displayedCount > 1 ? 's' : ''} affichée${displayedCount > 1 ? 's' : ''} (toutes les données).`;
		}
		return `${rawCount} mesures regroupées en ${displayedCount} points (moyennes).`;
	});
</script>

<div class="space-y-5">
	<div>
		<p class="mb-2 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">Période</p>
		<div class="flex flex-wrap gap-2">
			{#each ranges as r (r.value)}
				<button
					type="button"
					class="btn-toggle"
					class:btn-toggle-active={range === r.value}
					onclick={() => (range = r.value)}
				>
					{r.label}
				</button>
			{/each}
		</div>
	</div>

	<div>
		<p class="mb-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
			Résolution max.
		</p>
		<p class="mb-2 text-xs text-[var(--color-muted)]">
			Plafond d’affichage : au-delà, les mesures sont moyennées ; en dessous, chaque mesure est
			affichée.
		</p>
		<div class="flex flex-wrap gap-2">
			{#each pointOptions as n (n)}
				<button
					type="button"
					class="btn-toggle"
					class:btn-toggle-active={points === n}
					onclick={() => (points = n)}
				>
					{n}
				</button>
			{/each}
		</div>
		<p class="mt-3 text-xs text-[var(--color-accent)]">{resolutionHint}</p>
	</div>
</div>
