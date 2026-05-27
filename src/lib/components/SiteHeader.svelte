<script lang="ts">
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { goto } from '$app/navigation';
	import { Gear } from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	const DETACH_START = 6;
	const DETACH_END = 88;

	let loginOpen = $state(false);
	let needsSetup = $state(false);
	let redirectTo = $state('/admin');
	let detach = $state(0);
	let headerEl = $state<HTMLElement | null>(null);
	let shellEl = $state<HTMLElement | null>(null);
	let prefersReducedMotion = $state(false);

	let anchor = $state({ x: 0, y: 0, w: 0 });

	const isFloating = $derived(detach > 0.12);
	const headerHeight = $derived(64 + detach * 18);

	type Strand = { id: string; d: string; delay: number; opacity: number };

	let strands = $state<Strand[]>([]);

	function clamp01(v: number) {
		return Math.min(1, Math.max(0, v));
	}

	function computeDetach(scrollY: number) {
		return clamp01((scrollY - DETACH_START) / (DETACH_END - DETACH_START));
	}

	function buildStrands(ax: number, ay: number, vw: number): Strand[] {
		const anchors = [
			{ x: -40, y: -8 },
			{ x: vw * 0.18, y: -4 },
			{ x: vw * 0.5, y: -6 },
			{ x: vw * 0.82, y: -4 },
			{ x: vw + 40, y: -8 },
			{ x: vw * 0.33, y: ay * 0.12 },
			{ x: vw * 0.67, y: ay * 0.11 }
		];

		return anchors.map((from, i) => {
			const midX = from.x + (ax - from.x) * 0.45 + Math.sin(i * 1.7) * 28;
			const midY = from.y + (ay - from.y) * 0.38 + Math.cos(i * 2.1) * 18;
			const d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${ax} ${ay}`;
			const opacity = 0.22 + (i % 3) * 0.06;
			return { id: `s-${i}`, d, delay: i * 0.04, opacity };
		});
	}

	function updateGeometry() {
		if (!headerEl || typeof window === 'undefined') return;
		const rect = headerEl.getBoundingClientRect();
		const shellRect = shellEl?.getBoundingClientRect();
		const ax = shellRect
			? shellRect.left + shellRect.width / 2
			: rect.left + rect.width / 2;
		const ay = rect.bottom;
		anchor = { x: ax, y: ay, w: rect.width };
		strands = buildStrands(ax, ay, window.innerWidth);
	}

	function onScroll() {
		detach = computeDetach(window.scrollY);
		updateGeometry();
	}

	async function openLoginModal() {
		const res = await fetch('/api/auth/setup');
		if (res.ok) {
			const data = await res.json();
			needsSetup = Boolean(data.available);
		}
		loginOpen = true;
	}

	async function isAuthenticated(): Promise<boolean> {
		try {
			const res = await fetch('/api/auth/status');
			if (!res.ok) return false;
			const data = await res.json();
			return Boolean(data.authenticated);
		} catch {
			return false;
		}
	}

	async function openAdmin() {
		if (await isAuthenticated()) {
			await goto('/admin');
			return;
		}
		await openLoginModal();
	}

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const params = page.url.searchParams;
		if (params.get('login') === '1') {
			redirectTo = params.get('redirect') || '/admin';
			void (async () => {
				if (await isAuthenticated()) {
					await goto(redirectTo);
					return;
				}
				await openLoginModal();
			})();
		}

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', updateGeometry);

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', updateGeometry);
		};
	});

	$effect(() => {
		if (!headerEl) return;
		updateGeometry();
		const ro = new ResizeObserver(updateGeometry);
		ro.observe(headerEl);
		if (shellEl) ro.observe(shellEl);
		return () => ro.disconnect();
	});
</script>

<!-- Réserve l'espace sous la barre fixe -->
<div
	class="pointer-events-none"
	style="height: {headerHeight}px"
	aria-hidden="true"
></div>

<!-- Toile d'araignée (viewport) — se déchire au scroll -->
{#if !prefersReducedMotion && detach < 0.98}
	<svg
		class="site-header-web"
		aria-hidden="true"
		style="--detach: {detach}"
	>
		{#each strands as strand (strand.id)}
			<path
				class="site-header-web__strand"
				d={strand.d}
				style="
					--strand-delay: {strand.delay}s;
					--strand-base-opacity: {strand.opacity};
					--strand-dash: {520 + detach * 180};
				"
			/>
		{/each}
		{#if detach > 0.2 && detach < 0.85}
			<circle
				class="site-header-web__snap"
				cx={anchor.x}
				cy={anchor.y}
				r={6 + detach * 14}
				style="--detach: {detach}"
			/>
		{/if}
	</svg>
{/if}

<!-- Particules de déchirement -->
{#if !prefersReducedMotion && detach > 0.35 && detach < 0.72}
	<div class="site-header-tear-bits" aria-hidden="true" style="--detach: {detach}">
		{#each Array(8) as _, i}
			<span
				class="site-header-tear-bits__bit"
				style="
					left: calc({anchor.x}px + {(i - 4) * 11}px);
					top: calc({anchor.y}px - 4px);
					--bit-i: {i};
					--detach: {detach};
				"
			></span>
		{/each}
	</div>
{/if}

<header
	bind:this={headerEl}
	class="site-header"
	class:site-header--floating={isFloating}
	style="--detach: {detach}"
>
	<div bind:this={shellEl} class="site-header__shell">
		<div class="site-header__inner">
			<a href="/" class="site-header__brand">
				<span class="site-header__brand-mark" aria-hidden="true"></span>
				<span>Spider-Meter</span>
			</a>

			<button
				type="button"
				class="site-header__admin-btn"
				aria-label="Administration"
				onclick={() => void openAdmin()}
			>
				<Gear size={20} weight="bold" />
			</button>
		</div>
	</div>
</header>

<LoginModal bind:open={loginOpen} {needsSetup} {redirectTo} />
