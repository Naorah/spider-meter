<script lang="ts">
	let { title = 'Spider-Meter', subtitle = 'Suivi d’habitat pour arachnide' } = $props();
</script>

<section class="relative min-h-[55vh] overflow-hidden">
	<img
		src="/phidippus.jpg"
		alt="Phidippus — araignée sauteuse"
		class="absolute inset-0 h-full w-full object-cover"
	/>
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
