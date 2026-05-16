<script lang="ts">
	import AdminPanel from '$lib/components/admin/AdminPanel.svelte';
	import { readErrorMessage } from '$lib/admin/api';
	import type { AdminFeedback } from '$lib/admin/types';
	import type { SpiderProfileDto } from '$lib/types';

	let { spider: initial, onSuccess, onError }: { spider: SpiderProfileDto | null } & AdminFeedback =
		$props();

	let name = $state('');
	let commonName = $state('');
	let scientificName = $state('');
	let speciesNotes = $state('');
	let movedInDate = $state('2026-05-15');

	$effect.pre(() => {
		name = initial?.name ?? '';
		commonName = initial?.commonName ?? '';
		scientificName = initial?.scientificName ?? '';
		speciesNotes = initial?.speciesNotes ?? '';
		movedInDate = initial?.movedInDate?.slice(0, 10) ?? '2026-05-15';
	});

	async function submit(e: Event) {
		e.preventDefault();
		const res = await fetch('/api/admin/spider', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, commonName, scientificName, speciesNotes, movedInDate })
		});
		if (res.ok) onSuccess('Fiche enregistrée');
		else onError(await readErrorMessage(res));
	}
</script>

<AdminPanel>
	<h2 class="section-title">Fiche de l’occupante</h2>
	<form class="mt-6 space-y-4" onsubmit={submit}>
		<label class="field">
			<span class="field-label">Prénom / surnom</span>
			<input class="field-input" bind:value={name} required />
		</label>
		<label class="field">
			<span class="field-label">Nom commun</span>
			<input class="field-input" bind:value={commonName} />
		</label>
		<label class="field">
			<span class="field-label">Nom scientifique</span>
			<input class="field-input" bind:value={scientificName} required />
		</label>
		<label class="field">
			<span class="field-label">Date d’emménagement</span>
			<input class="field-input" type="date" bind:value={movedInDate} required />
		</label>
		<label class="field">
			<span class="field-label">Notes d’espèce</span>
			<textarea class="field-input min-h-28" bind:value={speciesNotes}></textarea>
		</label>
		<button type="submit" class="btn-primary">Enregistrer la fiche</button>
	</form>
</AdminPanel>
