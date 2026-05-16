<script lang="ts">
	import { goto } from '$app/navigation';
	import { X } from 'phosphor-svelte';

	let {
		open = $bindable(false),
		needsSetup = false,
		redirectTo = '/admin'
	}: {
		open?: boolean;
		needsSetup?: boolean;
		redirectTo?: string;
	} = $props();

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			if (needsSetup) {
				if (password !== confirmPassword) {
					error = 'Les mots de passe ne correspondent pas';
					return;
				}
				const res = await fetch('/api/auth/setup', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username, password })
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) {
					error = data.message ?? 'Échec de la création du compte';
					return;
				}
			} else {
				const res = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username, password })
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) {
					error = data.message ?? 'Connexion refusée';
					return;
				}
			}

			open = false;
			await goto(redirectTo);
		} finally {
			loading = false;
		}
	}

	function close() {
		open = false;
		error = '';
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="login-title"
	>
		<div class="card w-full max-w-md p-6 sm:p-8">
			<div class="mb-6 flex items-start justify-between gap-4">
				<div>
					<h2 id="login-title" class="text-xl font-semibold">
						{needsSetup ? 'Créer le compte admin' : 'Connexion admin'}
					</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">
						{needsSetup
							? 'Première configuration — choisissez vos identifiants.'
							: 'Accédez au panel d’administration.'}
					</p>
				</div>
				<button type="button" class="btn-icon" onclick={close} aria-label="Fermer">
					<X size={20} />
				</button>
			</div>

			<form class="space-y-4" onsubmit={submit}>
				<label class="field">
					<span class="field-label">Nom d’utilisateur</span>
					<input class="field-input" bind:value={username} autocomplete="username" required />
				</label>
				<label class="field">
					<span class="field-label">Mot de passe</span>
					<input
						class="field-input"
						type="password"
						bind:value={password}
						autocomplete={needsSetup ? 'new-password' : 'current-password'}
						required
						minlength={needsSetup ? 8 : undefined}
					/>
				</label>
				{#if needsSetup}
					<label class="field">
						<span class="field-label">Confirmer le mot de passe</span>
						<input
							class="field-input"
							type="password"
							bind:value={confirmPassword}
							autocomplete="new-password"
							required
							minlength="8"
						/>
					</label>
				{/if}

				{#if error}
					<p class="text-sm text-red-400">{error}</p>
				{/if}

				<button type="submit" class="btn-primary w-full" disabled={loading}>
					{loading ? 'Connexion…' : needsSetup ? 'Créer et continuer' : 'Se connecter'}
				</button>
			</form>
		</div>
	</div>
{/if}
