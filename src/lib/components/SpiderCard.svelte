<script lang="ts">
	import { Bug, Calendar, Info } from 'phosphor-svelte';

	type SpiderInfo = {
		name: string;
		commonName: string;
		scientificName: string;
		speciesNotes: string;
		movedInLabel: string;
	};

	let { spider }: { spider: SpiderInfo } = $props();
</script>

<section class="animate-fade-up animate-delay-1 px-6 py-14 sm:px-10 lg:px-16">
	<div class="mx-auto max-w-5xl">
		<h2 class="section-title">Fiche de l’occupante</h2>
		<p class="section-subtitle">Identité et date d’emménagement</p>

		<div class="mt-8 grid gap-5 sm:grid-cols-2">
			<article class="card p-6">
				<div class="mb-4 flex items-center gap-3 text-[var(--color-accent)]">
					<Bug size={28} weight="duotone" />
					<h3 class="font-semibold">Identité</h3>
				</div>
				<dl class="space-y-3 text-sm">
					<div class="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
						<dt class="text-[var(--color-muted)]">Prénom / surnom</dt>
						<dd class="font-medium">{spider.name}</dd>
					</div>
					<div class="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
						<dt class="text-[var(--color-muted)]">Nom commun</dt>
						<dd class="font-medium">{spider.commonName}</dd>
					</div>
					<div class="flex justify-between gap-4">
						<dt class="text-[var(--color-muted)]">Espèce</dt>
						<dd class="font-medium italic">{spider.scientificName}</dd>
					</div>
				</dl>
			</article>

			<article class="card p-6">
				<div class="mb-4 flex items-center gap-3 text-[var(--color-accent)]">
					<Calendar size={28} weight="duotone" />
					<h3 class="font-semibold">Emménagement</h3>
				</div>
				<p class="text-3xl font-bold tracking-tight">{spider.movedInLabel}</p>
				<p class="mt-2 text-sm text-[var(--color-muted)]">Date d’arrivée au terrarium</p>
			</article>

			<article class="card p-6 sm:col-span-2">
				<div class="mb-3 flex items-center gap-3 text-[var(--color-accent)]">
					<Info size={28} weight="duotone" />
					<h3 class="font-semibold">Notes d’espèce</h3>
				</div>
				<p class="text-[var(--color-muted)] leading-relaxed">{spider.speciesNotes}</p>
			</article>
		</div>
	</div>
</section>
