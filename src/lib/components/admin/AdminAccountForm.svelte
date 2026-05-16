<script lang="ts">
	import AdminPanel from '$lib/components/admin/AdminPanel.svelte';
	import { readErrorMessage } from '$lib/admin/api';
	import type { AdminFeedback } from '$lib/admin/types';

	let {
		username,
		onSuccess,
		onError
	}: { username: string } & AdminFeedback = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	async function submit(e: Event) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			onError('Les mots de passe ne correspondent pas');
			return;
		}
		const res = await fetch('/api/admin/password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword, newPassword })
		});
		if (res.ok) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			onSuccess('Mot de passe mis à jour');
		} else {
			onError(await readErrorMessage(res));
		}
	}
</script>

<AdminPanel>
	<h2 class="section-title">Compte admin</h2>
	<p class="section-subtitle mt-1">Connecté en tant que <strong>{username}</strong></p>
	<form class="mt-4 space-y-4" onsubmit={submit}>
		<label class="field">
			<span class="field-label">Mot de passe actuel</span>
			<input class="field-input" type="password" bind:value={currentPassword} required />
		</label>
		<label class="field">
			<span class="field-label">Nouveau mot de passe</span>
			<input class="field-input" type="password" bind:value={newPassword} minlength="8" required />
		</label>
		<label class="field">
			<span class="field-label">Confirmer</span>
			<input
				class="field-input"
				type="password"
				bind:value={confirmPassword}
				minlength="8"
				required
			/>
		</label>
		<button type="submit" class="btn-primary">Changer le mot de passe</button>
	</form>
</AdminPanel>
