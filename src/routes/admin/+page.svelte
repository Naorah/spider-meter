<script lang="ts">
	import type { MoltDto, NewsItemDto } from '$lib/types';
	import { Plus, Trash } from 'phosphor-svelte';

	let { data } = $props();

	let spider = $state({
		name: data.spider?.name ?? '',
		commonName: data.spider?.commonName ?? '',
		scientificName: data.spider?.scientificName ?? '',
		speciesNotes: data.spider?.speciesNotes ?? '',
		movedInDate: data.spider?.movedInDate?.slice(0, 10) ?? '2026-05-15'
	});

	let molts = $state<MoltDto[]>([...data.molts]);
	let news = $state<NewsItemDto[]>([...data.news]);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let newMoltName = $state('');
	let newMoltDate = $state(new Date().toISOString().slice(0, 10));

	let newsTitle = $state('');
	let newsBody = $state('');

	let iotToken = $state<string | null>(null);
	let iotMasked = $state(data.iotTokenMasked);
	let hasIotToken = $state(data.hasIotToken);

	let message = $state('');
	let error = $state('');

	function flash(ok: string) {
		message = ok;
		error = '';
		setTimeout(() => (message = ''), 4000);
	}

	async function saveSpider(e: Event) {
		e.preventDefault();
		const res = await fetch('/api/admin/spider', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(spider)
		});
		if (res.ok) flash('Fiche enregistrée');
		else error = (await res.json().catch(() => ({}))).message ?? 'Erreur';
	}

	async function changePassword(e: Event) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			error = 'Les mots de passe ne correspondent pas';
			return;
		}
		const res = await fetch('/api/admin/password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword, newPassword })
		});
		if (res.ok) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			flash('Mot de passe mis à jour');
		} else error = (await res.json().catch(() => ({}))).message ?? 'Erreur';
	}

	async function generateToken() {
		const res = await fetch('/api/admin/iot-token', { method: 'POST' });
		const body = await res.json().catch(() => ({}));
		if (res.ok) {
			iotToken = body.token;
			hasIotToken = true;
			iotMasked = `${body.token.slice(0, 4)}••••••••${body.token.slice(-4)}`;
			flash('Token généré — copiez-le maintenant');
		} else error = body.message ?? 'Erreur';
	}

	async function addMolt(e: Event) {
		e.preventDefault();
		const res = await fetch('/api/admin/molts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newMoltName, moltDate: newMoltDate })
		});
		const body = await res.json().catch(() => ({}));
		if (res.ok) {
			molts = [body.molt, ...molts];
			newMoltName = '';
			flash('Mue ajoutée');
		} else error = body.message ?? 'Erreur';
	}

	async function deleteMolt(id: number) {
		const res = await fetch(`/api/admin/molts?id=${id}`, { method: 'DELETE' });
		if (res.ok) {
			molts = molts.filter((m) => m.id !== id);
			flash('Mue supprimée');
		}
	}

	async function addNews(e: Event) {
		e.preventDefault();
		const res = await fetch('/api/admin/news', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: newsTitle, body: newsBody })
		});
		const body = await res.json().catch(() => ({}));
		if (res.ok) {
			news = [body.item, ...news];
			newsTitle = '';
			newsBody = '';
			flash('Actualité publiée');
		} else error = body.message ?? 'Erreur';
	}

	async function deleteNews(id: number) {
		const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
		if (res.ok) {
			news = news.filter((n) => n.id !== id);
			flash('Actualité supprimée');
		}
	}

	function copyToken() {
		if (iotToken) navigator.clipboard.writeText(iotToken);
	}

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
</script>

{#if message}
	<p class="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
		{message}
	</p>
{/if}
{#if error}
	<p class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
{/if}

<section class="card p-6">
	<h2 class="section-title">Fiche de l’occupante</h2>
	<form class="mt-6 space-y-4" onsubmit={saveSpider}>
		<label class="field">
			<span class="field-label">Prénom / surnom</span>
			<input class="field-input" bind:value={spider.name} required />
		</label>
		<label class="field">
			<span class="field-label">Nom commun</span>
			<input class="field-input" bind:value={spider.commonName} />
		</label>
		<label class="field">
			<span class="field-label">Nom scientifique</span>
			<input class="field-input" bind:value={spider.scientificName} required />
		</label>
		<label class="field">
			<span class="field-label">Date d’emménagement</span>
			<input class="field-input" type="date" bind:value={spider.movedInDate} required />
		</label>
		<label class="field">
			<span class="field-label">Notes d’espèce</span>
			<textarea class="field-input min-h-28" bind:value={spider.speciesNotes}></textarea>
		</label>
		<button type="submit" class="btn-primary">Enregistrer la fiche</button>
	</form>
</section>

<section class="card p-6">
	<h2 class="section-title">Token sondes Shelly</h2>
	<p class="section-subtitle mt-1">
		Paramètre <code class="text-[var(--color-accent)]">token</code> dans l’URL HTTP de la Shelly
	</p>
	{#if hasIotToken && iotMasked}
		<p class="mt-4 font-mono text-sm">{iotMasked}</p>
	{:else}
		<p class="mt-4 text-sm text-[var(--color-muted)]">Aucun token en base (repli .env possible)</p>
	{/if}
	{#if iotToken}
		<p class="mt-2 break-all font-mono text-xs text-[var(--color-accent)]">{iotToken}</p>
		<button type="button" class="btn-secondary mt-2" onclick={copyToken}>Copier le token</button>
	{/if}
	<button type="button" class="btn-primary mt-4" onclick={generateToken}>Générer un token (32 car.)</button>
</section>

<section class="card p-6">
	<h2 class="section-title">Mues</h2>
	<form class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onsubmit={addMolt}>
		<label class="field flex-1">
			<span class="field-label">Nom</span>
			<input class="field-input" bind:value={newMoltName} placeholder="Mue L5…" required />
		</label>
		<label class="field">
			<span class="field-label">Date</span>
			<input class="field-input" type="date" bind:value={newMoltDate} required />
		</label>
		<button type="submit" class="btn-primary inline-flex items-center gap-2 sm:mb-0.5">
			<Plus size={18} weight="bold" />
			Ajouter
		</button>
	</form>
	<ul class="mt-6 space-y-2">
		{#each molts as molt (molt.id)}
			<li class="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3">
				<div>
					<p class="font-medium">{molt.name}</p>
					<p class="text-xs text-[var(--color-muted)]">
						{dateFormatter.format(new Date(molt.moltDate))}
					</p>
				</div>
				<button
					type="button"
					class="btn-icon text-red-400"
					onclick={() => deleteMolt(molt.id)}
					aria-label="Supprimer"
				>
					<Trash size={18} />
				</button>
			</li>
		{:else}
			<p class="text-sm text-[var(--color-muted)]">Aucune mue enregistrée.</p>
		{/each}
	</ul>
</section>

<section class="card p-6">
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
						<p class="mt-2 text-sm text-[var(--color-muted)] line-clamp-3">{item.body}</p>
					</div>
					<button
						type="button"
						class="btn-icon shrink-0 text-red-400"
						onclick={() => deleteNews(item.id)}
						aria-label="Supprimer"
					>
						<Trash size={18} />
					</button>
				</div>
			</li>
		{:else}
			<p class="text-sm text-[var(--color-muted)]">Aucune actualité.</p>
		{/each}
	</ul>
</section>

<section class="card p-6">
	<h2 class="section-title">Compte admin</h2>
	<form class="mt-4 space-y-4" onsubmit={changePassword}>
		<label class="field">
			<span class="field-label">Mot de passe actuel</span>
			<input class="field-input" type="password" bind:value={currentPassword} required />
		</label>
		<label class="field">
			<span class="field-label">Nouveau mot de passe</span>
			<input class="field-input" type="password" bind:value={newPassword} minlength="8" required />
		</label>
		<label class="field">
			<span class="field-label">Confirmer</span>
			<input class="field-input" type="password" bind:value={confirmPassword} minlength="8" required />
		</label>
		<button type="submit" class="btn-primary">Changer le mot de passe</button>
	</form>
</section>

