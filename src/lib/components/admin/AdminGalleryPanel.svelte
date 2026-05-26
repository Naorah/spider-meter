<script lang="ts">
	import AdminPanel from '$lib/components/admin/AdminPanel.svelte';
	import ConfirmModal from '$lib/components/admin/ConfirmModal.svelte';
	import GalleryLightbox from '$lib/components/GalleryLightbox.svelte';
	import { readErrorMessage } from '$lib/admin/api';
	import type { AdminFeedback } from '$lib/admin/types';
	import type { GalleryPhotoListDto, GalleryPhotoListItemDto } from '$lib/types';
	import { Camera, FloppyDisk, Trash } from 'phosphor-svelte';
	import { onMount } from 'svelte';

	let { onSuccess, onError }: AdminFeedback = $props();

	const PAGE_SIZE = 20;

	let caption = $state('');
	let selectedFile = $state<File | null>(null);

	let page = $state(1);
	let list = $state<GalleryPhotoListDto | null>(null);
	let loading = $state(false);
	let editCaptions = $state<Record<number, string>>({});
	let savingCaptionId = $state<number | null>(null);

	let confirmOpen = $state(false);
	let pendingDelete: GalleryPhotoListItemDto | null = $state(null);
	let lightboxItem = $state<GalleryPhotoListItemDto | null>(null);

	function syncEditCaptions(items: GalleryPhotoListItemDto[]) {
		const next: Record<number, string> = {};
		for (const item of items) {
			next[item.id] = item.caption;
		}
		editCaptions = next;
	}

	function setFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		selectedFile = input.files?.[0] ?? null;
	}

	async function loadPage(nextPage: number) {
		loading = true;
		try {
			const res = await fetch(`/api/admin/gallery?page=${nextPage}&pageSize=${PAGE_SIZE}`);
			if (!res.ok) {
				onError(await readErrorMessage(res));
				return;
			}
			list = (await res.json()) as GalleryPhotoListDto;
			page = list.page;
			syncEditCaptions(list.items);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadPage(1);
	});

	async function submit(e: Event) {
		e.preventDefault();
		if (!selectedFile) {
			onError('Choisissez une image avant de publier.');
			return;
		}

		const fd = new FormData();
		fd.set('caption', caption.trim());
		fd.set('file', selectedFile);

		try {
			loading = true;
			const res = await fetch('/api/admin/gallery', { method: 'POST', body: fd });
			if (!res.ok) {
				onError(await readErrorMessage(res));
				return;
			}

			caption = '';
			selectedFile = null;
			onSuccess('Photo publiée');
			await loadPage(1);
		} finally {
			loading = false;
		}
	}

	async function saveCaption(item: GalleryPhotoListItemDto) {
		const nextCaption = (editCaptions[item.id] ?? '').trim();
		if (!nextCaption) {
			onError('La légende ne peut pas être vide.');
			return;
		}
		if (nextCaption === item.caption) return;

		savingCaptionId = item.id;
		try {
			const res = await fetch(`/api/admin/gallery?id=${item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ caption: nextCaption })
			});
			if (!res.ok) {
				onError(await readErrorMessage(res));
				return;
			}
			const body = await res.json();
			if (list) {
				list = {
					...list,
					items: list.items.map((p) => (p.id === item.id ? body.item : p))
				};
			}
			onSuccess('Légende mise à jour');
		} finally {
			savingCaptionId = null;
		}
	}

	function askDelete(item: GalleryPhotoListItemDto) {
		pendingDelete = item;
		confirmOpen = true;
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		const id = pendingDelete.id;
		confirmOpen = false;
		pendingDelete = null;

		const res = await fetch(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
		if (!res.ok) {
			onError(await readErrorMessage(res));
			return;
		}

		onSuccess('Photo supprimée');
		await loadPage(page);
	}
</script>

<AdminPanel>
	<div class="mb-6 flex items-center gap-3">
		<Camera size={28} weight="duotone" class="text-[var(--color-accent)]" />
		<div>
			<h2 class="section-title">Galerie</h2>
			<p class="section-subtitle">Upload, modification de légende et suppression</p>
		</div>
	</div>

	<form class="space-y-4" onsubmit={submit}>
		<label class="field">
			<span class="field-label">Légende</span>
			<input class="field-input" bind:value={caption} required maxlength={200} />
		</label>

		<label class="field">
			<span class="field-label">Photo (max 10 Mo)</span>
			<input
				class="field-input"
				type="file"
				accept="image/*"
				onchange={setFile}
				required
			/>
		</label>

		<button type="submit" class="btn-primary" disabled={loading || !selectedFile}>
			{loading ? 'En cours…' : 'Publier'}
		</button>
	</form>

	{#if list}
		{@const currentPage = list.page}
		{@const totalPages = list.totalPages}
		<div class="mt-8 flex items-center justify-between gap-4">
			<p class="text-sm text-[var(--color-muted)]">
				{list.total} photo(s) — Page {currentPage} / {totalPages}
			</p>
			<div class="flex items-center gap-3">
				<button
					type="button"
					class="btn-secondary"
					disabled={currentPage <= 1 || loading}
					onclick={() => void loadPage(currentPage - 1)}
				>
					← Précédent
				</button>
				<button
					type="button"
					class="btn-secondary"
					disabled={currentPage >= totalPages || loading}
					onclick={() => void loadPage(currentPage + 1)}
				>
					Suivant →
				</button>
			</div>
		</div>

		<ul class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each list.items as item (item.id)}
				<li class="rounded-lg border border-[var(--color-border)] p-3">
					<button
						type="button"
						class="admin-gallery-thumb"
						onclick={() => (lightboxItem = item)}
						aria-label={`Agrandir : ${item.caption}`}
					>
						<img
							src={item.imageUrl}
							alt={item.caption}
							loading="lazy"
							decoding="async"
							class="h-full w-full object-cover"
						/>
					</button>

					<label class="field">
						<span class="field-label">Légende</span>
						<input
							class="field-input"
							maxlength={200}
							bind:value={editCaptions[item.id]}
						/>
					</label>

					<div class="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							class="btn-secondary inline-flex items-center gap-2"
							disabled={savingCaptionId === item.id}
							onclick={() => void saveCaption(item)}
						>
							<FloppyDisk size={16} />
							{savingCaptionId === item.id ? 'Enregistrement…' : 'Enregistrer'}
						</button>
						<button
							type="button"
							class="btn-danger inline-flex items-center gap-2"
							onclick={() => askDelete(item)}
						>
							<Trash size={16} />
							Supprimer
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-8 text-sm text-[var(--color-muted)]">
			{loading ? 'Chargement…' : 'Aucune photo.'}
		</p>
	{/if}
</AdminPanel>

<ConfirmModal
	bind:open={confirmOpen}
	title="Supprimer cette photo ?"
	description="Cette action supprimera la photo et sa légende."
	confirmLabel="Supprimer"
	cancelLabel="Annuler"
	danger={true}
	onConfirm={confirmDelete}
/>

<GalleryLightbox bind:item={lightboxItem} />

<style>
	.admin-gallery-thumb {
		display: block;
		width: 100%;
		margin-bottom: 0.5rem;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: 0.5rem;
		padding: 0;
		border: none;
		background: var(--color-bg-elevated);
		cursor: default;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.admin-gallery-thumb:hover {
		transform: scale(1.02);
		box-shadow: 0 8px 24px -10px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}
</style>
