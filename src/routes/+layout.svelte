<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Spider-Meter — Suivi terrarium</title>
	<meta
		name="description"
		content="Monitoring d’habitat pour arachnide : humidité, température et historique des sondes."
	/>
</svelte:head>

{@render children()}
