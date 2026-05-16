<script lang="ts">
	import { Clock, Drop, Plant, Thermometer } from 'phosphor-svelte';
	import type { SensorReadingDto } from '$lib/types';

	let { latest }: { latest: SensorReadingDto | null } = $props();

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	const numberFormatter = new Intl.NumberFormat('fr-FR', {
		maximumFractionDigits: 1
	});
</script>

<section class="animate-fade-up animate-delay-2 px-6 py-14 sm:px-10 lg:px-16">
	<div class="mx-auto max-w-5xl">
		<div class="mb-6 flex items-center gap-3">
			<Plant size={28} weight="duotone" class="text-[var(--color-accent)]" />
			<div>
				<h2 class="section-title">Habitat actuel</h2>
				<p class="section-subtitle">Conditions en temps réel — mise à jour automatique toutes les 30&nbsp;s</p>
			</div>
		</div>

		{#if latest}
			<div class="mt-8 grid gap-5 sm:grid-cols-3">
				<article class="card p-6">
					<div class="flex items-center gap-3 text-[var(--color-humidity)]">
						<Drop size={32} weight="duotone" />
						<span class="text-sm text-[var(--color-muted)]">Humidité</span>
					</div>
					<p class="mt-4 text-4xl font-bold tabular-nums">
						{numberFormatter.format(latest.humidity)}<span class="text-2xl text-[var(--color-muted)]">%</span>
					</p>
				</article>

				<article class="card p-6">
					<div class="flex items-center gap-3 text-[var(--color-temperature)]">
						<Thermometer size={32} weight="duotone" />
						<span class="text-sm text-[var(--color-muted)]">Température</span>
					</div>
					<p class="mt-4 text-4xl font-bold tabular-nums">
						{numberFormatter.format(latest.temperature)}<span class="text-2xl text-[var(--color-muted)]">°C</span>
					</p>
				</article>

				<article class="card p-6 sm:col-span-1">
					<div class="flex items-center gap-3 text-[var(--color-accent)]">
						<Clock size={28} weight="duotone" />
						<span class="text-sm text-[var(--color-muted)]">Dernière mise à jour</span>
					</div>
					<p class="mt-4 text-lg font-semibold">{dateFormatter.format(new Date(latest.createdAt))}</p>
					<p class="mt-2 truncate text-xs text-[var(--color-muted)]" title={latest.deviceId}>
						Sonde : {latest.deviceId}
					</p>
				</article>
			</div>
		{:else}
			<div class="card mt-8 p-10 text-center">
				<Drop size={48} weight="duotone" class="mx-auto text-[var(--color-muted)]" />
				<p class="mt-4 text-lg font-medium">En attente de la première sonde…</p>
				<p class="mt-2 text-sm text-[var(--color-muted)]">
					Les données apparaîtront dès le premier rapport Shelly sur <code class="text-[var(--color-accent)]">/report</code>.
				</p>
			</div>
		{/if}
	</div>
</section>
