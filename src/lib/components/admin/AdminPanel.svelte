<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<section class="admin-panel card card--no-lift mt-6 p-6" role="tabpanel">
	{@render children()}
</section>
