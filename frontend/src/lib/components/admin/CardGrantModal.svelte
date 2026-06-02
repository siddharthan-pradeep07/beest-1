<script lang="ts">
	// Popup for issuing an HCB card grant against a fulfillment order. Fields are
	// pre-filled from the backend but editable; the backend re-validates and caps
	// the amount on submit, so this form is convenience, not the source of truth.
	import { onMount } from 'svelte';

	type Prefill = {
		recipientEmail: string;
		suggestedAmountCents: number | null;
		purpose: string;
		orgId: string;
		alreadyGranted: boolean;
		existingGrantId: string | null;
	};

	let {
		order,
		onClose,
		onGranted
	}: {
		order: { id: string; userName: string; itemName: string; pipesSpent: number };
		onClose: () => void;
		onGranted: (grantId: string) => void;
	} = $props();

	let loading = $state(true);
	let loadError = $state('');
	let prefill = $state<Prefill | null>(null);

	// Editable form fields
	let amountDollars = $state('');
	let email = $state('');
	let purpose = $state('');

	let submitting = $state(false);
	let submitError = $state('');
	let successGrantId = $state('');

	const centsToDollars = (c: number | null) => (c == null ? '' : (c / 100).toFixed(2));

	// Parse the dollar input to whole cents, or null if invalid.
	let amountCents = $derived.by(() => {
		const v = parseFloat(amountDollars);
		if (!Number.isFinite(v) || v <= 0) return null;
		return Math.round(v * 100);
	});

	let canSubmit = $derived(
		!submitting &&
			!loading &&
			!!prefill &&
			!prefill.alreadyGranted &&
			amountCents != null &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
	);

	onMount(async () => {
		try {
			const res = await fetch(`/api/admin/hcb/prefill/${order.id}`);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				loadError = body?.message ?? body?.error ?? 'Failed to load grant details';
				return;
			}
			const data: Prefill = await res.json();
			prefill = data;
			amountDollars = centsToDollars(data.suggestedAmountCents);
			email = data.recipientEmail ?? '';
			purpose = data.purpose ?? '';
		} catch {
			loadError = 'Failed to load grant details';
		} finally {
			loading = false;
		}
	});

	async function submit() {
		if (!canSubmit || amountCents == null) return;
		const confirmed = confirm(
			`Issue a REAL card grant of $${(amountCents / 100).toFixed(2)} to ${email.trim()}?\n\nThis moves real money and cannot be undone here.`
		);
		if (!confirmed) return;

		submitting = true;
		submitError = '';
		try {
			const res = await fetch('/api/admin/hcb/card-grant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: order.id,
					amountCents,
					email: email.trim(),
					purpose: purpose.trim() || null
				})
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) {
				submitError = body?.message ?? body?.error ?? 'Grant failed';
				return;
			}
			successGrantId = body.grantId;
			onGranted(body.grantId);
		} catch {
			submitError = 'Network error issuing grant';
		} finally {
			submitting = false;
		}
	}
</script>

<div
	class="cg-overlay"
	role="button"
	tabindex="0"
	onclick={onClose}
	onkeydown={(e) => {
		if (e.key === 'Escape') onClose();
	}}
>
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div class="cg-modal" role="dialog" aria-modal="true" aria-label="Issue card grant" tabindex="-1" onclick={(e) => e.stopPropagation()}>
		<header class="cg-head">
			<h3>Issue card grant</h3>
			<button class="cg-x" onclick={onClose} aria-label="Close">×</button>
		</header>

		<p class="cg-sub">
			Order: <strong>{order.itemName}</strong> · {order.userName} · {order.pipesSpent} pipes
		</p>

		{#if loading}
			<p class="cg-info">Loading…</p>
		{:else if loadError}
			<p class="cg-error">{loadError}</p>
		{:else if successGrantId}
			<p class="cg-success">✓ Grant issued — <code>{successGrantId}</code></p>
			<div class="cg-actions">
				<button class="btn btn-primary" onclick={onClose}>Done</button>
			</div>
		{:else if prefill?.alreadyGranted}
			<p class="cg-error">
				A grant was already issued for this order (<code>{prefill.existingGrantId}</code>). Refusing to
				issue a second one.
			</p>
			<div class="cg-actions">
				<button class="btn" onclick={onClose}>Close</button>
			</div>
		{:else if prefill}
			<div class="cg-org">Issuing org: <code>{prefill.orgId}</code></div>

			<label class="cg-field">
				<span>Amount (USD) <span class="cg-hint">— suggested from pipes, editable</span></span>
				<input
					type="number"
					min="0"
					step="0.01"
					bind:value={amountDollars}
					inputmode="decimal"
				/>
			</label>

			<label class="cg-field">
				<span>Recipient email</span>
				<input type="email" bind:value={email} autocomplete="off" />
			</label>

			<label class="cg-field">
				<span>Purpose (≤30 chars)</span>
				<input type="text" bind:value={purpose} maxlength="30" />
			</label>

			{#if submitError}
				<p class="cg-error">{submitError}</p>
			{/if}

			<div class="cg-actions">
				<button class="btn" onclick={onClose} disabled={submitting}>Cancel</button>
				<button class="btn btn-primary" onclick={submit} disabled={!canSubmit}>
					{submitting ? 'Issuing…' : 'Approve & issue grant'}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.cg-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}
	.cg-modal {
		background: #3a3832;
		color: #e8e0d4;
		border: 1px solid #5a564c;
		border-radius: 8px;
		width: 100%;
		max-width: 460px;
		max-height: 90vh;
		overflow-y: auto;
		padding: 1.25rem;
		font-family: sans-serif;
	}
	.cg-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.cg-head h3 {
		margin: 0;
		font-size: 1.15rem;
	}
	.cg-x {
		background: none;
		border: none;
		color: #e8e0d4;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
	}
	.cg-sub {
		margin: 0.5rem 0 0.75rem;
		font-size: 0.85rem;
		opacity: 0.8;
	}
	.cg-org {
		font-size: 0.8rem;
		opacity: 0.75;
		margin-bottom: 0.75rem;
	}
	.cg-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
		font-size: 0.85rem;
	}
	.cg-field input {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #5a564c;
		background: #2c2a25;
		color: #e8e0d4;
	}
	.cg-hint {
		opacity: 0.6;
		font-weight: 400;
	}
	.cg-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.btn {
		padding: 0.5rem 0.9rem;
		border-radius: 4px;
		border: 1px solid #5a564c;
		background: #2c2a25;
		color: #e8e0d4;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-primary {
		background: #ec3750;
		border-color: #ec3750;
		color: #fff;
		font-weight: 600;
	}
	.cg-error {
		color: #ff6b6b;
		font-size: 0.85rem;
	}
	.cg-success {
		color: #6bd968;
		font-size: 0.9rem;
	}
	.cg-info {
		opacity: 0.8;
	}
	code {
		background: #2c2a25;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
	}
</style>
