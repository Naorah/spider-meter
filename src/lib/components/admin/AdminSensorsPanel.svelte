<script lang="ts">
	import AdminPanel from '$lib/components/admin/AdminPanel.svelte';
	import ConfirmModal from '$lib/components/admin/ConfirmModal.svelte';
	import { readErrorMessage } from '$lib/admin/api';
	import {
		buildSensorReadingsQuery,
		COMPARE_OP_LABELS,
		COMPARE_OPS,
		defaultSensorFilters,
		SENSOR_PAGE_SIZES,
		type CompareOp,
		type SensorPageSize,
		type SensorReadingFilters
	} from '$lib/admin/sensor-filters';
	import type { AdminFeedback } from '$lib/admin/types';
	import type { SensorReadingDto, SensorReadingListDto } from '$lib/types';
	import { Clock, Cpu, Drop, Funnel, Thermometer, Trash } from 'phosphor-svelte';

	let { onSuccess, onError }: AdminFeedback = $props();

	let filters = $state<SensorReadingFilters>(defaultSensorFilters());
	let applied = $state<SensorReadingFilters>(defaultSensorFilters());
	let list = $state<SensorReadingListDto | null>(null);
	let loading = $state(false);

	let confirmOpen = $state(false);
	let pendingDelete = $state<SensorReadingDto | null>(null);

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});
	const numberFormatter = new Intl.NumberFormat('fr-FR', {
		maximumFractionDigits: 1
	});

	async function loadReadings() {
		loading = true;
		try {
			const res = await fetch(`/api/admin/sensor-readings?${buildSensorReadingsQuery(applied)}`);
			if (res.ok) {
				list = await res.json();
			} else {
				onError(await readErrorMessage(res));
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadReadings();
	});

	function applyFilters(e: Event) {
		e.preventDefault();
		applied = { ...filters, page: 1 };
	}

	function resetFilters() {
		filters = defaultSensorFilters();
		applied = defaultSensorFilters();
	}

	function setPageSize(size: SensorPageSize) {
		filters = { ...filters, pageSize: size, page: 1 };
		applied = { ...applied, pageSize: size, page: 1 };
	}

	function goToPage(page: number) {
		if (!list || page < 1 || page > list.totalPages) return;
		applied = { ...applied, page };
		filters = { ...filters, page };
	}

	function openDelete(reading: SensorReadingDto) {
		pendingDelete = reading;
		confirmOpen = true;
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		const res = await fetch(`/api/admin/sensor-readings?id=${pendingDelete.id}`, {
			method: 'DELETE'
		});
		if (res.ok) {
			if (list && list.items.length === 1 && applied.page > 1) {
				applied = { ...applied, page: applied.page - 1 };
				filters = { ...filters, page: applied.page };
			}
			confirmOpen = false;
			pendingDelete = null;
			await loadReadings();
			onSuccess('Relevé supprimé');
		} else {
			onError(await readErrorMessage(res));
		}
	}

	function deleteDescription(): string {
		if (!pendingDelete) return '';
		const when = dateFormatter.format(new Date(pendingDelete.createdAt));
		return `Supprimer le relevé du ${when} (${numberFormatter.format(pendingDelete.temperature)} °C, ${numberFormatter.format(pendingDelete.humidity)} %) ? Cette action est irréversible.`;
	}
</script>

<AdminPanel>
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h2 class="section-title">Relevés sondes</h2>
			<p class="section-subtitle mt-1">Historique complet des mises à jour Shelly</p>
		</div>
		{#if list}
			<p class="text-sm text-[var(--color-muted)]">
				{list.total} relevé{list.total !== 1 ? 's' : ''}
			</p>
		{/if}
	</div>

	<form class="sensor-filters mt-6" onsubmit={applyFilters}>
		<div class="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
			<Funnel size={18} weight="duotone" />
			Filtres
		</div>

		<div class="sensor-filters-grid">
			<div class="sensor-filter-group">
				<span class="field-label">Température (°C)</span>
				<div class="sensor-filter-row">
					<select class="field-input sensor-filter-op" bind:value={filters.tempOp}>
						{#each COMPARE_OPS as op (op)}
							<option value={op}>{COMPARE_OP_LABELS[op as CompareOp]}</option>
						{/each}
					</select>
					<input
						class="field-input"
						type="number"
						step="0.1"
						placeholder="ex. 24"
						bind:value={filters.temperature}
					/>
				</div>
			</div>

			<div class="sensor-filter-group">
				<span class="field-label">Humidité (%)</span>
				<div class="sensor-filter-row">
					<select class="field-input sensor-filter-op" bind:value={filters.humidityOp}>
						{#each COMPARE_OPS as op (op)}
							<option value={op}>{COMPARE_OP_LABELS[op as CompareOp]}</option>
						{/each}
					</select>
					<input
						class="field-input"
						type="number"
						step="0.1"
						min="0"
						max="100"
						placeholder="ex. 65"
						bind:value={filters.humidity}
					/>
				</div>
			</div>

			<label class="field">
				<span class="field-label">Date du</span>
				<input class="field-input" type="date" bind:value={filters.dateFrom} />
			</label>

			<label class="field">
				<span class="field-label">Date au</span>
				<input class="field-input" type="date" bind:value={filters.dateTo} />
			</label>
		</div>

		<div class="mt-4 flex flex-wrap gap-3">
			<button type="submit" class="btn-primary">Appliquer les filtres</button>
			<button type="button" class="btn-secondary" onclick={resetFilters}>Réinitialiser</button>
		</div>
	</form>

	<div class="mt-8 flex flex-wrap items-center justify-between gap-4">
		<span class="text-sm text-[var(--color-muted)]">Éléments par page</span>
		<div class="flex flex-wrap gap-2">
			{#each SENSOR_PAGE_SIZES as size (size)}
				<button
					type="button"
					class="btn-toggle"
					class:btn-toggle-active={applied.pageSize === size}
					onclick={() => setPageSize(size)}
				>
					{size}
				</button>
			{/each}
		</div>
	</div>

	{#if loading && !list}
		<p class="mt-8 text-sm text-[var(--color-muted)]">Chargement…</p>
	{:else if list}
		<ul class="mt-6 space-y-2" class:opacity-60={loading}>
			{#each list.items as reading (reading.id)}
				<li
					class="sensor-reading-row flex flex-col gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
						<div class="flex items-center gap-2 text-sm">
							<Cpu size={18} weight="duotone" class="shrink-0 text-[var(--color-muted)]" />
							<span class="truncate font-mono text-xs">{reading.deviceId}</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							<Thermometer
								size={18}
								weight="duotone"
								class="shrink-0 text-[var(--color-temperature)]"
							/>
							<span class="tabular-nums">
								{numberFormatter.format(reading.temperature)}
								<span class="text-[var(--color-muted)]">°C</span>
							</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							<Drop size={18} weight="duotone" class="shrink-0 text-[var(--color-humidity)]" />
							<span class="tabular-nums">
								{numberFormatter.format(reading.humidity)}
								<span class="text-[var(--color-muted)]">%</span>
							</span>
						</div>
						<div class="flex items-center gap-2 text-sm text-[var(--color-muted)]">
							<Clock size={18} weight="duotone" class="shrink-0" />
							<time datetime={reading.createdAt}>
								{dateFormatter.format(new Date(reading.createdAt))}
							</time>
						</div>
					</div>
					<button
						type="button"
						class="btn-icon shrink-0 self-end text-red-400 sm:self-center"
						onclick={() => openDelete(reading)}
						aria-label="Supprimer le relevé du {dateFormatter.format(new Date(reading.createdAt))}"
					>
						<Trash size={18} />
					</button>
				</li>
			{:else}
				<p class="text-sm text-[var(--color-muted)]">Aucun relevé ne correspond aux critères.</p>
			{/each}
		</ul>

		{#if list && list.total > 0}
			{@const pageList = list}
			<nav
				class="mt-6 flex flex-wrap items-center justify-between gap-4"
				aria-label="Pagination des relevés"
			>
				<p class="text-sm text-[var(--color-muted)]">
					Page {pageList.page} sur {pageList.totalPages}
				</p>
				<div class="flex gap-2">
					<button
						type="button"
						class="btn-secondary"
						disabled={pageList.page <= 1 || loading}
						onclick={() => goToPage(pageList.page - 1)}
					>
						Précédent
					</button>
					<button
						type="button"
						class="btn-secondary"
						disabled={pageList.page >= pageList.totalPages || loading}
						onclick={() => goToPage(pageList.page + 1)}
					>
						Suivant
					</button>
				</div>
			</nav>
		{/if}
	{/if}
</AdminPanel>

<ConfirmModal
	bind:open={confirmOpen}
	title="Supprimer ce relevé ?"
	description={deleteDescription()}
	confirmLabel="Supprimer"
	onConfirm={confirmDelete}
/>
