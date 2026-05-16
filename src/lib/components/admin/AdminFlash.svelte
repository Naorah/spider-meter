<script lang="ts">
	let { message = '', error = '' }: { message?: string; error?: string } = $props();
</script>

{#if message}
	<p class="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
		{message}
	</p>
{/if}
{#if error}
	<p class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
{/if}
