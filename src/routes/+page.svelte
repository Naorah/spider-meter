<script lang="ts">
	import HabitatLive from '$lib/components/HabitatLive.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SensorChart from '$lib/components/SensorChart.svelte';
	import SpiderCard from '$lib/components/SpiderCard.svelte';
	import { fetchSensorReadings, SENSOR_POLL_INTERVAL_MS } from '$lib/sensor-poll';
	import type { SensorReadingDto } from '$lib/types';
	import { onMount } from 'svelte';
	import { ChartLine } from 'phosphor-svelte';

	let { data } = $props();

	let latest = $state<SensorReadingDto | null>(null);
	let history = $state<SensorReadingDto[]>([]);

	$effect.pre(() => {
		latest = data.latest;
		history = data.history;
	});

	onMount(() => {
		let cancelled = false;

		const refresh = async () => {
			try {
				const readings = await fetchSensorReadings();
				if (!cancelled) {
					latest = readings.latest;
					history = readings.history;
				}
			} catch {
				// ignore les erreurs réseau ponctuelles
			}
		};

		const intervalId = setInterval(refresh, SENSOR_POLL_INTERVAL_MS);

		const onVisible = () => {
			if (document.visibilityState === 'visible') void refresh();
		};
		document.addEventListener('visibilitychange', onVisible);

		return () => {
			cancelled = true;
			clearInterval(intervalId);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});
</script>

<Hero />

<SpiderCard spider={data.spider} />

<HabitatLive {latest} />

<section class="animate-fade-up animate-delay-3 px-6 py-14 sm:px-10 lg:px-16">
	<div class="mx-auto max-w-5xl">
		<div class="flex items-center gap-3">
			<ChartLine size={28} weight="duotone" class="text-[var(--color-accent)]" />
			<div>
				<h2 class="section-title">Historique</h2>
				<p class="section-subtitle">
					Dernières lectures — mise à jour automatique toutes les 30&nbsp;s
				</p>
			</div>
		</div>

		<div class="mt-8 grid gap-5 lg:grid-cols-2">
			<SensorChart
				{history}
				metric="humidity"
				label="Humidité"
				color="#5ec4e8"
				unit="%"
			/>
			<SensorChart
				{history}
				metric="temperature"
				label="Température"
				color="#e8a85e"
				unit="°C"
			/>
		</div>
	</div>
</section>

<footer class="border-t border-[var(--color-border)] px-6 py-8 text-center text-sm text-[var(--color-muted)]">
	Spider-Meter — monitoring terrarium
</footer>
