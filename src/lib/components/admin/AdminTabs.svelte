<script lang="ts">
	import { ADMIN_TABS, type AdminTab } from '$lib/admin/types';

	let {
		activeTab,
		onSelect
	}: {
		activeTab: AdminTab;
		onSelect: (tab: AdminTab) => void;
	} = $props();
</script>

<nav class="admin-tabs" aria-label="Sections d’administration">
	{#each ADMIN_TABS as tab (tab.id)}
		<button
			type="button"
			class="admin-tab"
			class:admin-tab-active={activeTab === tab.id}
			aria-selected={activeTab === tab.id}
			role="tab"
			onclick={() => onSelect(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</nav>
