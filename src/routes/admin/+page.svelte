<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AdminAccountForm from '$lib/components/admin/AdminAccountForm.svelte';
	import AdminFlash from '$lib/components/admin/AdminFlash.svelte';
	import AdminMoltsPanel from '$lib/components/admin/AdminMoltsPanel.svelte';
	import AdminNewsPanel from '$lib/components/admin/AdminNewsPanel.svelte';
	import AdminGalleryPanel from '$lib/components/admin/AdminGalleryPanel.svelte';
	import AdminSensorsPanel from '$lib/components/admin/AdminSensorsPanel.svelte';
	import AdminSpiderForm from '$lib/components/admin/AdminSpiderForm.svelte';
	import AdminTabs from '$lib/components/admin/AdminTabs.svelte';
	import AdminTokenPanel from '$lib/components/admin/AdminTokenPanel.svelte';
	import { parseAdminTab, type AdminTab } from '$lib/admin/types';

	let { data } = $props();

	let activeTab = $state<AdminTab>('spider');
	let message = $state('');
	let error = $state('');

	$effect(() => {
		activeTab = parseAdminTab(page.url.searchParams.get('tab'));
	});

	function selectTab(id: AdminTab) {
		const url = new URL(page.url);
		url.searchParams.set('tab', id);
		goto(`${url.pathname}?${url.searchParams.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function onSuccess(text: string) {
		message = text;
		error = '';
		setTimeout(() => (message = ''), 4000);
	}

	function onError(text: string) {
		error = text;
		message = '';
	}
</script>

<AdminFlash {message} {error} />

<AdminTabs activeTab={activeTab} onSelect={selectTab} />

{#if activeTab === 'spider'}
	<AdminSpiderForm spider={data.spider} {onSuccess} {onError} />
{/if}

{#if activeTab === 'token'}
	<AdminTokenPanel
		iotTokenMasked={data.iotTokenMasked}
		hasIotToken={data.hasIotToken}
		{onSuccess}
		{onError}
	/>
{/if}

{#if activeTab === 'molts'}
	<AdminMoltsPanel molts={data.molts} {onSuccess} {onError} />
{/if}

{#if activeTab === 'news'}
	<AdminNewsPanel news={data.news} {onSuccess} {onError} />
{/if}

{#if activeTab === 'sensors'}
	<AdminSensorsPanel {onSuccess} {onError} />
{/if}

{#if activeTab === 'gallery'}
	<AdminGalleryPanel {onSuccess} {onError} />
{/if}

{#if activeTab === 'account'}
	<AdminAccountForm username={data.user.username} {onSuccess} {onError} />
{/if}
