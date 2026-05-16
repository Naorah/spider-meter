<script lang="ts">
	import type { ChartPointCount, ChartRange } from '$lib/types';

	let {
		range = $bindable('week' as ChartRange),
		points = $bindable(20 as ChartPointCount)
	}: {
		range?: ChartRange;
		points?: ChartPointCount;
	} = $props();

	const ranges: { value: ChartRange; label: string }[] = [
		{ value: 'day', label: 'Jour' },
		{ value: 'week', label: 'Semaine' },
		{ value: 'month', label: 'Mois' }
	];

	const pointOptions: ChartPointCount[] = [10, 20, 50, 100];
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
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
		<p class="mb-2 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
			Points affichés
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
	</div>
</div>
