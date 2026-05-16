<script lang="ts">
	import { X } from 'phosphor-svelte';

	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel = 'Confirmer',
		cancelLabel = 'Annuler',
		danger = true,
		onConfirm
	}: {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onConfirm: () => void | Promise<void>;
	} = $props();

	let loading = $state(false);

	async function confirm() {
		loading = true;
		try {
			await onConfirm();
		} finally {
			loading = false;
		}
	}

	function close() {
		open = false;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
	>
		<div class="card w-full max-w-md p-6">
			<div class="mb-4 flex items-start justify-between gap-4">
				<h2 id="confirm-title" class="text-lg font-semibold">{title}</h2>
				<button type="button" class="btn-icon" onclick={close} aria-label="Fermer">
					<X size={20} />
				</button>
			</div>
			<p class="text-sm text-[var(--color-muted)]">{description}</p>
			<div class="mt-6 flex flex-wrap justify-end gap-3">
				<button type="button" class="btn-secondary" onclick={close} disabled={loading}>
					{cancelLabel}
				</button>
				<button
					type="button"
					class={danger ? 'btn-danger' : 'btn-primary'}
					onclick={confirm}
					disabled={loading}
				>
					{loading ? 'En cours…' : confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
