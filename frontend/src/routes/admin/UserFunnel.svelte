<script lang="ts">
	import { onMount } from 'svelte';

	interface FunnelPayload {
		signedUp: number;
		loggedIn: number;
		linkedHackatime: number;
		submittedProject: number;
		approvedProject: number;
	}

	let payload = $state<FunnelPayload | null>(null);
	let error = $state(false);

	interface Stage {
		label: string;
		count: number;
	}

	const stages: Stage[] = $derived.by(() => {
		if (!payload) return [];
		return [
			{ label: 'Signed up', count: payload.signedUp },
			{ label: 'Logged in', count: payload.loggedIn },
			{ label: 'Hackatime synced', count: payload.linkedHackatime },
			{ label: 'Submitted project', count: payload.submittedProject },
			{ label: 'Approved project', count: payload.approvedProject }
		];
	});

	const maxCount = $derived(stages.length > 0 ? Math.max(...stages.map((s) => s.count), 1) : 1);
	const topCount = $derived(stages.length > 0 ? stages[0].count : 0);

	// SVG uses a 100×100 viewBox per column with preserveAspectRatio=none,
	// so it stretches to fill the column. A stage's "height" is its count
	// expressed as a fraction of the max count, centered vertically.
	const CHART_VB = 100;
	const CHART_MID = CHART_VB / 2;

	function stageHeight(count: number): number {
		return maxCount === 0 ? 0 : (count / maxCount) * CHART_VB;
	}

	function trapezoidPath(leftCount: number, rightCount: number): string {
		const lh = stageHeight(leftCount);
		const rh = stageHeight(rightCount);
		const lTop = CHART_MID - lh / 2;
		const lBot = CHART_MID + lh / 2;
		const rTop = CHART_MID - rh / 2;
		const rBot = CHART_MID + rh / 2;
		return `M0,${lTop} L0,${lBot} L100,${rBot} L100,${rTop} Z`;
	}

	function pct(n: number): string {
		if (topCount === 0) return '—';
		return `${((n / topCount) * 100).toFixed(2)}%`;
	}

	function stageColor(i: number, total: number): string {
		// Blue that lightens toward the narrow end.
		const t = total <= 1 ? 0 : i / (total - 1);
		const lightness = 55 + t * 20; // 55% → 75%
		return `hsl(210, 60%, ${lightness}%)`;
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/admin/stats/funnel');
			if (!res.ok) {
				error = true;
				return;
			}
			payload = await res.json();
		} catch {
			error = true;
		}
	});
</script>

<div class="funnel-card">
	<div class="funnel-header">
		<span class="funnel-title">User Funnel</span>
	</div>
	{#if error}
		<p class="funnel-msg">Failed to load.</p>
	{:else if !payload}
		<p class="funnel-msg">Loading…</p>
	{:else}
		<div class="funnel">
			{#each stages as stage, i}
				{@const leftCount = i === 0 ? stage.count : stages[i - 1].count}
				<div class="funnel-col">
					<div class="funnel-col-label">{i + 1}. {stage.label}</div>
					<div class="funnel-col-chart">
						<svg class="funnel-svg" viewBox="0 0 {CHART_VB} {CHART_VB}" preserveAspectRatio="none">
							<path d={trapezoidPath(leftCount, stage.count)} fill={stageColor(i, stages.length)} />
						</svg>
					</div>
					<div class="funnel-col-footer">
						{#if i === 0}
							<div class="funnel-pct">100%</div>
							<div class="funnel-count">{stage.count.toLocaleString()} users</div>
						{:else}
							<div class="funnel-pct">{pct(stage.count)}</div>
							<div class="funnel-count">{stage.count.toLocaleString()}</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.funnel-card {
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem;
		background: #1e1e1e;
		border: 2px solid #444;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.funnel-header {
		margin-bottom: 0.75rem;
	}

	.funnel-title {
		font-size: 0.8rem;
		color: #888;
		letter-spacing: 0.02em;
	}

	.funnel-msg {
		margin: 0.5rem 0;
		color: #888;
		font-size: 0.85rem;
	}

	.funnel {
		display: flex;
		width: 100%;
		min-height: 280px;
	}

	.funnel-col {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		min-width: 0;
		border-right: 1px solid #2a2a2a;
	}

	.funnel-col:last-child {
		border-right: none;
	}

	.funnel-col-label {
		font-size: 0.78rem;
		color: #c8c8c8;
		padding: 0.25rem 0.5rem 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.funnel-col-chart {
		position: relative;
		flex: 1 1 auto;
		min-height: 180px;
	}

	.funnel-svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.funnel-col-footer {
		padding: 0.5rem;
		min-height: 2.5rem;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1rem;
	}

	.funnel-pct {
		font-size: 0.85rem;
		color: #e0e0e0;
		font-weight: 600;
	}

	.funnel-count {
		font-size: 0.75rem;
		color: #888;
	}
</style>
