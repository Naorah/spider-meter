<script lang="ts">
	import { goto } from '$app/navigation';
	import { SignOut } from 'phosphor-svelte';

	let { children, data } = $props();

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/');
	}
</script>

<header class="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
	<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
		<div>
			<a href="/" class="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">← Accueil</a>
			<p class="font-semibold">Administration</p>
			<p class="text-xs text-[var(--color-muted)]">{data.user.username}</p>
		</div>
		<button type="button" class="btn-secondary inline-flex items-center gap-2" onclick={logout}>
			<SignOut size={18} />
			Déconnexion
		</button>
	</div>
</header>

<main class="px-6 py-10 sm:px-10">
	<div class="mx-auto max-w-3xl space-y-6">
		{@render children()}
	</div>
</main>

