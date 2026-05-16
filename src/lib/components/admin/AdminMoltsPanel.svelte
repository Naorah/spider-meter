<script lang="ts">
	import AdminPanel from '$lib/components/admin/AdminPanel.svelte';
	import { readErrorMessage } from '$lib/admin/api';
	import type { AdminFeedback } from '$lib/admin/types';
	import type { MoltDto } from '$lib/types';
	import { Plus, Trash } from 'phosphor-svelte';

	let { molts: initial, onSuccess, onError }: { molts: MoltDto[] } & AdminFeedback = $props();

	let molts = $state<MoltDto[]>([]);
	let newMoltName = $state('');
	let newMoltDate = $state('');

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

	$effect.pre(() => {
		molts = [...initial];
		newMoltDate = new Date().toISOString().slice(0, 10);
	});

	async function addMolt(e: Event) {
		e.preventDefault();
		const res = await fetch('/api/admin/molts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newMoltName, moltDate: newMoltDate })
		});
		if (res.ok) {
			const body = await res.json();
			molts = [body.molt, ...molts];
			newMoltName = '';
			onSuccess('Mue ajoutée');
		} else {
			onError(await readErrorMessage(res));
		}
	}

	async function deleteMolt(id: number) {
		const res = await fetch(`/api/admin/molts?id=${id}`, { method: 'DELETE' });
		if (res.ok) {
			molts = molts.filter((m) => m.id !== id);
			onSuccess('Mue supprimée');
		} else {
			onError(await readErrorMessage(res));
		}
	}
</script>

<AdminPanel>
	<h2 class="section-title">Mues</h2>
	<form class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onsubmit={addMolt}>
		<label class="field flex-1">
			<span class="field-label">Nom</span>
			<input class="field-input" bind:value={newMoltName} placeholder="Mue L5…" required />
		</label>
		<label class="field">
			<span class="field-label">Date</span>
			<input class="field-input" type="date" bind:value={newMoltDate} required />
		</label>
		<button type="submit" class="btn-primary inline-flex items-center gap-2 sm:mb-0.5">
			<Plus size={18} weight="bold" />
			Ajouter
		</button>
	</form>
	<ul class="mt-6 space-y-2">
		{#each molts as molt (molt.id)}
			<li
				class="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3"
			>
				<div>
					<p class="font-medium">{molt.name}</p>
					<p class="text-xs text-[var(--color-muted)]">
						{dateFormatter.format(new Date(molt.moltDate))}
					</p>
				</div>
				<button
					type="button"
					class="btn-icon text-red-400"
					onclick={() => deleteMolt(molt.id)}
					aria-label="Supprimer la mue {molt.name}"
				>
					<Trash size={18} />
				</button>
			</li>
		{:else}
			<p class="text-sm text-[var(--color-muted)]">Aucune mue enregistrée.</p>
		{/each}
	</ul>
</AdminPanel>
