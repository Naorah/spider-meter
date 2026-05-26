<script lang="ts">
	import ChartControls from '$lib/components/ChartControls.svelte';
	import SensorChart from '$lib/components/SensorChart.svelte';
	import type { ChartPointCount, ChartRange, ChartSeriesDto } from '$lib/types';
	import { ChartLine } from 'phosphor-svelte';
	import { onMount } from 'svelte';

	let range = $state<ChartRange>('week');
	let pointCount = $state<ChartPointCount>(20);
	let humiditySeries = $state<ChartSeriesDto | null>(null);
	let temperatureSeries = $state<ChartSeriesDto | null>(null);
	let loading = $state(false);

	const chartMeta = $derived(humiditySeries?.meta ?? temperatureSeries?.meta ?? null);

	async function loadCharts() {
		loading = true;
		try {
			const res = await fetch(
				`/api/sensors/chart?range=${range}&points=${pointCount}`
			);
			if (!res.ok) return;
			const data = await res.json();
			humiditySeries = data.humidity;
			temperatureSeries = data.temperature;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		range;
		pointCount;
		void loadCharts();
	});

	onMount(() => {
		const id = setInterval(loadCharts, 30_000);
		return () => clearInterval(id);
	});
</script>

<section id="historique" class="animate-fade-up animate-delay-3 scroll-mt-28 px-6 py-14 sm:px-10 lg:px-16">
	<div class="mx-auto max-w-5xl">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-center gap-3">
				<ChartLine size={28} weight="duotone" class="text-[var(--color-accent)]" />
				<div>
					<h2 class="section-title">Historique</h2>
					<p class="section-subtitle">
						Les intervalles vides reflètent les rapports réels de la sonde
					</p>
				</div>
			</div>
			{#if loading}
				<span class="text-sm text-[var(--color-muted)]">Mise à jour…</span>
			{/if}
		</div>

		<div class="card card--no-lift mt-6 p-5">
			<ChartControls
				bind:range
				bind:points={pointCount}
				rawCount={chartMeta?.rawCount ?? 0}
				displayedCount={chartMeta?.displayedCount ?? 0}
				aggregated={chartMeta?.aggregated ?? false}
			/>
		</div>

		<div class="mt-8 grid gap-5 lg:grid-cols-2">
			<SensorChart
				points={humiditySeries?.points ?? []}
				metric="humidity"
				label="Humidité"
				color="#5ec4e8"
				unit="%"
			/>
			<SensorChart
				points={temperatureSeries?.points ?? []}
				metric="temperature"
				label="Température"
				color="#e8a85e"
				unit="°C"
			/>
		</div>
	</div>
</section>
