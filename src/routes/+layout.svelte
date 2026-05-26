<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { page } from '$app/state';

	let { children, data } = $props();
	const meta = $derived(data.meta);
	const isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href={meta.url} />

	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<meta name="theme-color" content="#0f0f12" />

	<!-- Open Graph (Discord, Facebook, LinkedIn, etc.) -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={meta.name} />
	<meta property="og:locale" content={meta.locale} />
	<meta property="og:url" content={meta.url} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:image" content={meta.image} />
	<meta property="og:image:alt" content="Phidippus — araignée du terrarium Spider-Meter" />

	<!-- Twitter / X -->
	<meta name="twitter:card" content={meta.twitterCard} />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image} />
	<meta name="twitter:image:alt" content="Phidippus — araignée du terrarium Spider-Meter" />
</svelte:head>

{#if !isAdminRoute}
	<SiteHeader />
{/if}

{@render children()}
