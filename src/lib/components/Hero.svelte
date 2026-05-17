<script lang="ts">
	import { onMount } from 'svelte';

	const SMALL_SRC = '/phidippus-small.jpg';
	const BIG_SRC = '/phidippus-big.jpg';
	const SWAP_DELAY_MS = 1000;

	let { title = 'Spider-Meter', subtitle = 'Suivi d’habitat pour arachnide' } = $props();

	let showBig = $state(false);

	onMount(() => {
		let bigLoaded = false;
		let delayDone = false;

		const trySwap = () => {
			if (bigLoaded && delayDone) showBig = true;
		};

		const timer = window.setTimeout(() => {
			delayDone = true;
			trySwap();
		}, SWAP_DELAY_MS);

		const img = new Image();
		img.onload = () => {
			bigLoaded = true;
			trySwap();
		};
		img.src = BIG_SRC;

		return () => clearTimeout(timer);
	});
</script>

<section class="relative min-h-[55vh] overflow-hidden">
	<div class="absolute inset-0">
		<img
			src={SMALL_SRC}
			alt="Phidippus — araignée sauteuse"
			class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
			class:opacity-0={showBig}
			fetchpriority="high"
		/>
		<img
			src={BIG_SRC}
			alt=""
			aria-hidden="true"
			class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
			class:opacity-100={showBig}
			decoding="async"
		/>
	</div>
	<div
		class="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/70 to-black/30"
	></div>
	<div class="relative z-10 flex min-h-[55vh] flex-col justify-end px-6 pb-14 pt-24 sm:px-10 lg:px-16">
		<div class="animate-fade-up max-w-2xl">
			<p class="mb-2 text-sm font-medium tracking-widest text-[var(--color-accent)] uppercase">
				Monitoring terrarium
			</p>
			<h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
			<p class="mt-4 max-w-lg text-lg text-[var(--color-muted)]">{subtitle}</p>
		</div>
	</div>
</section>
