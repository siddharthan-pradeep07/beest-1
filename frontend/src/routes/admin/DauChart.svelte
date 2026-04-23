<script lang="ts">
	import { onMount } from 'svelte';
	import { LineChart } from 'layerchart';
	import { scaleUtc } from 'd3-scale';
	import { utcFormat } from 'd3-time-format';

	interface HistoryPoint {
		date: string;
		count: number;
	}
	interface Payload {
		history: HistoryPoint[];
		today: { count: number; timestamp: number };
	}

	let payload = $state<Payload | null>(null);
	let error = $state(false);

	interface ChartPoint {
		time: Date;
		count: number;
		label: string;
	}

	const shortDate = utcFormat('%b %-d');
	const longDate = utcFormat('%a %b %-d');

	const points: ChartPoint[] = $derived.by(() => {
		if (!payload) return [];
		const rows: ChartPoint[] = payload.history.map((h) => ({
			time: new Date(h.date + 'T00:00:00Z'),
			count: h.count,
			label: longDate(new Date(h.date + 'T00:00:00Z'))
		}));
		rows.push({
			time: new Date(payload.today.timestamp),
			count: payload.today.count,
			label: 'Today (rolling 24h)'
		});
		return rows;
	});

	const todayCount = $derived(payload?.today.count ?? null);

	onMount(async () => {
		try {
			const res = await fetch('/api/admin/stats/dau/history');
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

<div class="dau-card">
	<div class="dau-header">
		<span class="dau-title">Daily Active Users</span>
		<span class="dau-today">{todayCount ?? '…'} <small>today</small></span>
	</div>
	<div class="dau-chart">
		{#if error}
			<p class="dau-msg">Failed to load.</p>
		{:else if !payload}
			<p class="dau-msg">Loading…</p>
		{:else if points.length === 0}
			<p class="dau-msg">No data.</p>
		{:else}
			<LineChart
				data={points}
				x="time"
				xScale={scaleUtc()}
				yDomain={[0, null]}
				padding={{ top: 8, bottom: 24, left: 44, right: 16 }}
				series={[{ key: 'count', value: 'count', label: 'Active users', color: '#8bd0f7' }]}
				points
				props={{
					xAxis: {
						format: (v: Date) => shortDate(v),
						ticks: 6,
						tickLabelProps: { class: 'dau-tick' }
					},
					yAxis: {
						format: (v: number) => String(v),
						ticks: 4,
						tickLabelProps: { class: 'dau-tick' }
					},
					grid: { class: 'dau-grid' },
					rule: { class: 'dau-rule' },
					spline: { class: 'dau-line' },
					points: { class: 'dau-dot', r: 3.5 },
					highlight: { points: { class: 'dau-dot-hover', r: 5 } },
					tooltip: {
						root: {
							classes: { root: 'dau-tooltip', container: 'dau-tooltip-inner' }
						},
						header: {
							format: (v: Date | string) => longDate(new Date(v as Date)),
							classes: { root: 'dau-tooltip-header' }
						},
						item: {
							classes: { root: 'dau-tooltip-item', label: 'dau-tooltip-label' }
						}
					}
				}}
			/>
		{/if}
	</div>
</div>

<style>
	.dau-card {
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem;
		background: #1e1e1e;
		border: 2px solid #444;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.dau-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.dau-title {
		font-size: 0.8rem;
		color: #888;
		letter-spacing: 0.02em;
	}

	.dau-today {
		font-size: 1.5rem;
		font-weight: 700;
		color: #e0e0e0;
		line-height: 1;
	}

	.dau-today small {
		font-size: 0.7rem;
		font-weight: 500;
		color: #888;
		margin-left: 0.25rem;
	}

	.dau-chart {
		height: 240px;
		width: 100%;
	}

	.dau-msg {
		margin: 0;
		padding-top: 4rem;
		text-align: center;
		color: #888;
		font-size: 0.85rem;
	}

	.dau-chart :global(.dau-tick) {
		fill: #c8c8c8 !important;
		stroke: none !important;
		font-size: 11px;
	}

	.dau-chart :global(.dau-line) {
		stroke: #8bd0f7;
		stroke-width: 2;
		fill: none;
	}

	.dau-chart :global(.dau-dot) {
		fill: #8bd0f7;
		stroke: #1e1e1e;
		stroke-width: 1.5;
	}

	.dau-chart :global(.dau-dot-hover) {
		fill: #c3e4fb;
		stroke: #1e1e1e;
		stroke-width: 2;
	}

	.dau-chart :global(.dau-grid) {
		stroke: #2a2a2a;
	}

	.dau-chart :global(.dau-rule) {
		stroke: #555;
	}

	.dau-chart :global(.tick) {
		stroke: #444;
	}

	/* Layerchart's Tooltip root uses Tailwind classes (absolute z-50) that
	   aren't defined in this project, so it falls back to static positioning
	   and breaks the layout. Re-apply the positioning it expects. */
	.dau-chart :global(.dau-tooltip) {
		position: absolute;
		z-index: 50;
		pointer-events: none;
	}

	.dau-chart :global(.dau-tooltip-inner) {
		background: #2a2a2a;
		color: #e0e0e0;
		border: 1px solid #555;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		white-space: nowrap;
	}

	.dau-chart :global(.dau-tooltip-header) {
		font-weight: 600;
		color: #e0e0e0;
		margin-bottom: 2px;
	}

	.dau-chart :global(.dau-tooltip-item) {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		color: #c8c8c8;
	}

	.dau-chart :global(.dau-tooltip-label) {
		color: #888;
	}
</style>
