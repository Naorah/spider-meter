<script lang="ts">
	import AdminPanel from '$lib/components/admin/AdminPanel.svelte';
	import { readErrorMessage } from '$lib/admin/api';
	import type { AdminFeedback } from '$lib/admin/types';

	let {
		iotTokenMasked: initialMasked,
		hasIotToken: initialHasToken,
		onSuccess,
		onError
	}: {
		iotTokenMasked: string | null;
		hasIotToken: boolean;
	} & AdminFeedback = $props();

	let iotToken = $state<string | null>(null);
	let iotMasked = $state<string | null>(null);
	let hasIotToken = $state(false);

	$effect.pre(() => {
		iotMasked = initialMasked;
		hasIotToken = initialHasToken;
		iotToken = null;
	});

	async function generateToken() {
		const res = await fetch('/api/admin/iot-token', { method: 'POST' });
		if (res.ok) {
			const body = await res.json();
			iotToken = body.token;
			hasIotToken = true;
			iotMasked = `${body.token.slice(0, 4)}••••••••${body.token.slice(-4)}`;
			onSuccess('Token généré — copiez-le maintenant');
		} else {
			onError(await readErrorMessage(res));
		}
	}

	function copyToken() {
		if (iotToken) navigator.clipboard.writeText(iotToken);
	}
</script>

<AdminPanel>
	<h2 class="section-title">Token sondes Shelly</h2>
	<p class="section-subtitle mt-1">
		Paramètre <code class="text-[var(--color-accent)]">token</code> dans l’URL HTTP de la Shelly
	</p>
	{#if hasIotToken && iotMasked}
		<p class="mt-4 font-mono text-sm">{iotMasked}</p>
	{:else}
		<p class="mt-4 text-sm text-[var(--color-muted)]">Aucun token en base (repli .env possible)</p>
	{/if}
	{#if iotToken}
		<p class="mt-2 break-all font-mono text-xs text-[var(--color-accent)]">{iotToken}</p>
		<button type="button" class="btn-secondary mt-2" onclick={copyToken}>Copier le token</button>
	{/if}
	<button type="button" class="btn-primary mt-4" onclick={generateToken}>
		Générer un token (32 car.)
	</button>
</AdminPanel>
