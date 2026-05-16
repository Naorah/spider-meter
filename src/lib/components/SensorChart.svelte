<script lang="ts">
	import { browser } from '$app/environment';
	import {
		CategoryScale,
		Chart,
		Filler,
		Legend,
		LinearScale,
		LineController,
		LineElement,
		PointElement,
		TimeScale,
		Tooltip,
		type ChartConfiguration
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import { fr } from 'date-fns/locale';
	import type { SensorReadingDto } from '$lib/types';
	import { onMount } from 'svelte';

	type Metric = 'humidity' | 'temperature';

	let {
		history,
		metric,
		label,
		color,
		unit,
		yMin: yMinProp,
		yMax: yMaxProp
	}: {
		history: SensorReadingDto[];
		metric: Metric;
		label: string;
		color: string;
		unit: string;
		yMin?: number;
		yMax?: number;
	} = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart = $state<Chart<'line'> | null>(null);

	const registered = (() => {
		let done = false;
		return () => {
			if (done) return;
			Chart.register(
				LineController,
				LineElement,
				PointElement,
				LinearScale,
				TimeScale,
				CategoryScale,
				Tooltip,
				Legend,
				Filler
			);
			done = true;
		};
	})();

	function buildPoints(readings: SensorReadingDto[]) {
		return readings.map((r) => ({
			x: new Date(r.createdAt).getTime(),
			y: metric === 'humidity' ? r.humidity : r.temperature
		}));
	}

	function yBounds(points: { y: number }[]) {
		const yMin =
			yMinProp ?? (metric === 'humidity' ? 0 : Math.min(...points.map((d) => d.y)) - 2);
		const yMax =
			yMaxProp ?? (metric === 'humidity' ? 100 : Math.max(...points.map((d) => d.y)) + 2);
		return { yMin, yMax };
	}

	function chartConfig(points: { x: number; y: number }[]): ChartConfiguration<'line'> {
		const { yMin, yMax } = yBounds(points);

		return {
			type: 'line',
			data: {
				datasets: [
					{
						label,
						data: points,
						borderColor: color,
						backgroundColor: color,
						parsing: false,
						spanGaps: false,
						tension: 0.35,
						pointRadius: 3,
						pointHoverRadius: 6,
						borderWidth: 2,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				interaction: { mode: 'nearest', intersect: false },
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const y = ctx.parsed.y;
								if (y == null) return label;
								return `${label} : ${y.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${unit}`;
							}
						}
					}
				},
				scales: {
					x: {
						type: 'time',
						adapters: { date: { locale: fr } },
						time: { tooltipFormat: 'PPp' },
						grid: { color: 'rgba(155, 152, 168, 0.12)' },
						ticks: { color: '#9b98a8', maxTicksLimit: 6 }
					},
					y: {
						min: yMin,
						max: yMax,
						grid: { color: 'rgba(155, 152, 168, 0.12)' },
						ticks: {
							color: '#9b98a8',
							callback: (v) => `${v}${unit}`
						}
					}
				}
			}
		};
	}

	$effect(() => {
		if (!browser || !canvas) return;

		const points = buildPoints(history);

		if (points.length === 0) {
			chart?.destroy();
			chart = null;
			return;
		}

		registered();

		if (chart) {
			chart.data.datasets[0].data = points;
			const { yMin, yMax } = yBounds(points);
			if (chart.options.scales?.y) {
				chart.options.scales.y.min = yMin;
				chart.options.scales.y.max = yMax;
			}
			chart.update('none');
			return;
		}

		chart = new Chart(canvas, chartConfig(points));
	});

	onMount(() => () => {
		chart?.destroy();
		chart = null;
	});
</script>

<article class="card flex h-72 flex-col p-5 sm:h-80">
	<h3 class="mb-4 text-sm font-semibold text-[var(--color-muted)]">{label}</h3>
	{#if history.length === 0}
		<p class="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
			Pas encore assez de données pour tracer l’historique.
		</p>
	{:else}
		<div class="relative min-h-0 flex-1">
			<canvas bind:this={canvas} class="h-full w-full"></canvas>
		</div>
	{/if}
</article>
