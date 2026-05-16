<script lang="ts">
	import AdminPanel from '$lib/components/admin/AdminPanel.svelte';
	import { readErrorMessage } from '$lib/admin/api';
	import type { AdminFeedback } from '$lib/admin/types';
	import type { NewsItemDto } from '$lib/types';
	import { Trash } from 'phosphor-svelte';

	let { news: initial, onSuccess, onError }: { news: NewsItemDto[] } & AdminFeedback = $props();

	let news = $state<NewsItemDto[]>([]);
	let newsTitle = $state('');
	let newsBody = $state('');

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

	$effect.pre(() => {
		news = [...initial];
	});

	async function addNews(e: Event) {
		e.preventDefault();
		const res = await fetch('/api/admin/news', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: newsTitle, body: newsBody })
		});
		if (res.ok) {
			const body = await res.json();
			news = [body.item, ...news];
			newsTitle = '';
			newsBody = '';
			onSuccess('Actualité publiée');
		} else {
			onError(await readErrorMessage(res));
		}
	}

	async function deleteNews(id: number) {
		const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
		if (res.ok) {
			news = news.filter((n) => n.id !== id);
			onSuccess('Actualité supprimée');
		} else {
			onError(await readErrorMessage(res));
		}
	}
</script>

<AdminPanel>
	<h2 class="section-title">Actualités</h2>
	<form class="mt-4 space-y-4" onsubmit={addNews}>
		<label class="field">
			<span class="field-label">Titre</span>
			<input class="field-input" bind:value={newsTitle} required />
		</label>
		<label class="field">
			<span class="field-label">Contenu</span>
			<textarea class="field-input min-h-28" bind:value={newsBody} required></textarea>
		</label>
		<button type="submit" class="btn-primary">Publier</button>
	</form>
	<ul class="mt-8 space-y-3">
		{#each news as item (item.id)}
			<li class="rounded-lg border border-[var(--color-border)] p-4">
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-xs text-[var(--color-muted)]">
							{dateFormatter.format(new Date(item.publishedAt))}
						</p>
						<p class="font-semibold">{item.title}</p>
						<p class="mt-2 line-clamp-3 text-sm text-[var(--color-muted)]">{item.body}</p>
					</div>
					<button
						type="button"
						class="btn-icon shrink-0 text-red-400"
						onclick={() => deleteNews(item.id)}
						aria-label="Supprimer l’actualité {item.title}"
					>
						<Trash size={18} />
					</button>
				</div>
			</li>
		{:else}
			<p class="text-sm text-[var(--color-muted)]">Aucune actualité.</p>
		{/each}
	</ul>
</AdminPanel>
