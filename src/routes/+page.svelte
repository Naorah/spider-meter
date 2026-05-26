<script lang="ts">
	import HabitatLive from '$lib/components/HabitatLive.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import HistoryCharts from '$lib/components/HistoryCharts.svelte';
	import MoltsSection from '$lib/components/MoltsSection.svelte';
	import NewsSection from '$lib/components/NewsSection.svelte';
	import SpiderCard from '$lib/components/SpiderCard.svelte';
	import { fetchSensorReadings, SENSOR_POLL_INTERVAL_MS } from '$lib/sensor-poll';
	import type { SensorReadingDto } from '$lib/types';
	import { onMount } from 'svelte';

	let { data } = $props();

	let latest = $state<SensorReadingDto | null>(null);

	$effect.pre(() => {
		latest = data.latest;
	});

	onMount(() => {
		let cancelled = false;

		const refresh = async () => {
			try {
				const readings = await fetchSensorReadings();
				if (!cancelled) latest = readings.latest;
			} catch {
				// ignore
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

<NewsSection latest={data.latestNews} history={data.newsHistory} />

{#if data.spider}
	<SpiderCard spider={data.spider} />
{/if}

<HabitatLive {latest} />

<HistoryCharts />

<MoltsSection molts={data.molts} />

<footer class="border-t border-[var(--color-border)] px-6 py-8 text-center text-sm text-[var(--color-muted)]">
	Spider-Meter — monitoring terrarium
</footer>
