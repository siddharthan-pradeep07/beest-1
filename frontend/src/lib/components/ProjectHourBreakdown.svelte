<script lang="ts">
  let {
    totalHours = null,
    aiHours = null,
    nonAiHours = null,
    perProject = [],
    startDate = null,
    loading = false,
  }: {
    totalHours: number | null;
    aiHours: number | null;
    nonAiHours: number | null;
    perProject?: { name: string; hours: number }[];
    startDate?: string | null;
    loading?: boolean;
  } = $props();

  const size = 120;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const total = $derived(totalHours ?? 0);
  const ai = $derived(aiHours ?? 0);
  const nonAi = $derived(nonAiHours ?? 0);
  const aiDash = $derived(total > 0 ? (ai / total) * circumference : 0);
  const nonAiDash = $derived(total > 0 ? (nonAi / total) * circumference : 0);
  const aiOffset = 0;
  const nonAiOffset = $derived(aiDash);
  const emptyDash = $derived(Math.max(0, circumference - aiDash - nonAiDash));

  const totalLabel = $derived(total > 0 ? `${Math.round(total * 10) / 10}h` : 'No data yet');
  const aiLabel = $derived(ai > 0 ? `${Math.round(ai * 10) / 10}h` : '0h');
  const nonAiLabel = $derived(nonAi > 0 ? `${Math.round(nonAi * 10) / 10}h` : '0h');
</script>

<section class="breakdown-card" aria-busy={loading}>
  <div class="breakdown-header">
    <div>
      <span class="breakdown-title">Hackatime Hours</span>
      {#if startDate}
        <span class="breakdown-subtitle">Since {startDate}</span>
      {/if}
    </div>
    {#if loading}
      <span class="breakdown-loading">Loading…</span>
    {/if}
  </div>

  <div class="breakdown-inner">
    <div class="donut-wrap">
      <svg viewBox="0 0 {size} {size}" class="donut">
        <circle
          class="donut-ring"
          cx="{center}"
          cy="{center}"
          r="{radius}"
          fill="none"
          stroke-width="16"
        />

        {#if total > 0}
          <circle
            class="donut-segment ai"
            cx="{center}"
            cy="{center}"
            r="{radius}"
            fill="none"
            stroke-width="16"
            stroke-dasharray="{aiDash} {circumference - aiDash}"
            stroke-dashoffset="{-aiOffset}"
          />
          <circle
            class="donut-segment nonai"
            cx="{center}"
            cy="{center}"
            r="{radius}"
            fill="none"
            stroke-width="16"
            stroke-dasharray="{nonAiDash} {circumference - nonAiDash}"
            stroke-dashoffset="{-nonAiOffset}"
          />
          <circle
            class="donut-segment empty"
            cx="{center}"
            cy="{center}"
            r="{radius}"
            fill="none"
            stroke-width="16"
            stroke-dasharray="{emptyDash} {circumference - emptyDash}"
            stroke-dashoffset="{-aiOffset - nonAiOffset}"
          />
        {/if}
      </svg>
      <div class="donut-center">
        <strong>{totalLabel}</strong>
        <span>Tracked</span>
      </div>
    </div>

    <div class="breakdown-details">
      <div class="breakdown-item">
        <span class="dot ai"></span>
        <div>
          <span class="breakdown-label">AI hours</span>
          <strong>{aiLabel}</strong>
        </div>
      </div>
      <div class="breakdown-item">
        <span class="dot nonai"></span>
        <div>
          <span class="breakdown-label">Non-AI hours</span>
          <strong>{nonAiLabel}</strong>
        </div>
      </div>
      {#if perProject.length > 0}
        <div class="project-breakdown">
          <span class="breakdown-label">Per project</span>
          <ul>
            {#each perProject as item}
              <li>{item.name}: {Math.round(item.hours * 10) / 10}h</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .breakdown-card {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e7e2d8);
    border-radius: 18px;
    padding: 1rem;
    max-width: 100%;
    box-shadow: var(--shadow-soft, 0 10px 30px rgba(0, 0, 0, 0.06));
  }

  .breakdown-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .breakdown-title {
    display: block;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .breakdown-subtitle {
    display: block;
    color: var(--muted, #6f6b65);
    font-size: 0.95rem;
    margin-top: 0.25rem;
  }

  .breakdown-loading {
    color: var(--muted, #6f6b65);
    font-size: 0.95rem;
  }

  .breakdown-inner {
    display: grid;
    grid-template-columns: minmax(0, 160px) 1fr;
    gap: 1rem;
    align-items: center;
  }

  .donut-wrap {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .donut {
    transform: rotate(-90deg);
    width: 100%;
    height: 100%;
  }

  .donut-ring,
  .donut-segment {
    vector-effect: non-scaling-stroke;
    stroke-linecap: round;
    transform-origin: 50% 50%;
  }

  .donut-ring {
    stroke: var(--surface-border, #f1ede9);
  }

  .donut-segment.ai {
    stroke: var(--color-ai, #5f76e8);
  }

  .donut-segment.nonai {
    stroke: var(--color-nonai, #f08b5b);
  }

  .donut-segment.empty {
    stroke: transparent;
  }

  .donut-center {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    pointer-events: none;
  }

  .donut-center strong {
    display: block;
    font-size: 1.15rem;
    margin-bottom: 0.15rem;
  }

  .breakdown-details {
    display: grid;
    gap: 0.75rem;
  }

  .breakdown-item {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot.ai {
    background: var(--color-ai, #5f76e8);
  }

  .dot.nonai {
    background: var(--color-nonai, #f08b5b);
  }

  .breakdown-label {
    display: block;
    color: var(--muted, #6f6b65);
    font-size: 0.95rem;
  }

  .project-breakdown ul {
    margin: 0.5rem 0 0;
    padding-left: 1rem;
    color: var(--muted, #6f6b65);
    font-size: 0.95rem;
  }

  .project-breakdown li {
    margin-bottom: 0.25rem;
  }
</style>
