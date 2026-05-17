<script lang="ts">
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { Gear } from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let loginOpen = $state(false);
	let needsSetup = $state(false);
	let redirectTo = $state('/admin');

	async function openLoginModal() {
		const res = await fetch('/api/auth/setup');
		if (res.ok) {
			const data = await res.json();
			needsSetup = Boolean(data.available);
		}
		loginOpen = true;
	}

	onMount(async () => {
		const params = page.url.searchParams;
		if (params.get('login') === '1') {
			redirectTo = params.get('redirect') || '/admin';
			await openLoginModal();
		}
	});
</script>

<header class="border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-md">
	<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
		<a href="/" class="text-sm font-semibold tracking-wide text-[var(--color-text)]">
			Spider-Meter
		</a>
		<button
			type="button"
			class="btn-secondary inline-flex items-center gap-2"
			onclick={openLoginModal}
		>
			<Gear size={18} weight="duotone" />
			Admin
		</button>
	</div>
</header>

<LoginModal bind:open={loginOpen} {needsSetup} {redirectTo} />
