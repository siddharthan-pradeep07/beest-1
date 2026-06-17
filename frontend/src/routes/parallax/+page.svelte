<!-- Standalone render of the landing-page hero parallax, layer 6 (6.webp) removed. -->
<script lang="ts">
  import { onMount } from 'svelte';

  let scrollY = $state(0);
  const PARALLAX_TRAVEL = 700;
  const rawProgress = $derived(Math.min(scrollY / PARALLAX_TRAVEL, 1));
  const easedProgress = $derived(rawProgress * (2 - rawProgress));

  // Time-based entrance reveal: waiting → animating → done (mirrors the landing page)
  let animPhase = $state<'waiting' | 'animating' | 'done'>('waiting');
  let animValue = $state(0);
  const animEased = $derived(
    animPhase === 'animating' ? animValue * (2 - animValue) : animPhase === 'done' ? 1 : 0
  );
  const progress = $derived(Math.max(easedProgress, animEased));
  const pxRemaining = $derived(PARALLAX_TRAVEL * (1 - progress));
  const postScroll = $derived(Math.max(scrollY - PARALLAX_TRAVEL, 0));
  let heroHeight = $state(0);

  // Same layer stack as the landing hero, minus 6.webp (layer 6).
  const layers = [
    { src: '', x: 0, rot: 0, scale: 0, drift: 0, isBg: true },
    { src: '/images/beest-cropped/2.webp', x: 0, rot: 0.003, scale: 0.0003, drift: 0.02, offsetY: -60 },
    { src: '/images/beest-cropped/3.webp', x: 0, rot: 0, scale: 0, drift: 0.04, crop: { left: 0, top: 53.5926, width: 100, height: 46.4074 } },
    { src: '/images/beest-cropped/4.webp', x: 0, rot: 0, scale: 0, drift: 0.06, crop: { left: 0, top: 64.6667, width: 44.5625, height: 21.9259 } },
    { src: '/images/beest-cropped/5.webp', x: 0, rot: 0, scale: 0, drift: 0.08, crop: { left: 13.7708, top: 67.2222, width: 86.2292, height: 32.7778 } },
    { src: '/images/beest-cropped/7.webp', x: 0.06, rot: 0, scale: 0, drift: 0.04, stretchX: 0.00015, crop: { left: 0, top: 57.5556, width: 89.5625, height: 42.4444 } },
    { src: '/images/beest-cropped/8.webp', x: 0, rot: 0, scale: 0, drift: 0.08, crop: { left: 3.625, top: 79.1852, width: 25, height: 10.0741 } },
    { src: '/images/beest-cropped/9.webp', x: 0, rot: 0, scale: 0, drift: 0.08, crop: { left: 10.1667, top: 60.4444, width: 88.4375, height: 36.2593 } },
    { src: '/images/beest-cropped/10.webp', x: 0, rot: 0, scale: 0, drift: 0.16, crop: { left: 37.3333, top: 46.8519, width: 62.6667, height: 53.1481 } },
    { src: '/images/beest-cropped/11.webp', x: 0, rot: 0, scale: 0, drift: 0.20, offsetY: 10, crop: { left: 65.625, top: 72.0741, width: 34.375, height: 27.9259 } },
  ];

  onMount(() => {
    const animDelay = setTimeout(() => {
      animPhase = 'animating';
      const duration = 2500;
      const start = performance.now();
      let raf: number;
      const tick = (now: number) => {
        animValue = Math.min((now - start) / duration, 1);
        if (animValue < 1) raf = requestAnimationFrame(tick);
        else animPhase = 'done';
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, 1000);
    return () => clearTimeout(animDelay);
  });
</script>

<svelte:window bind:scrollY />

<div class="saturate-wrap">
  <div class="top-bg">
    <div class="hero-wrap">
      <div class="hero-parallax" bind:clientHeight={heroHeight}>
        {#each layers as layer, i}
          {#if layer.isBg}
            <div class="hero-layer hero-layer-bg" style="z-index: {i};"></div>
          {:else}
            <img
              src={layer.src}
              alt=""
              class="hero-layer"
              class:hero-layer-cropped={!!layer.crop}
              style="z-index: {i}; transform-origin: top center; {layer.crop ? `left: ${layer.crop.left}%; top: ${layer.crop.top}%; width: ${layer.crop.width}%; height: ${layer.crop.height}%;` : ''} transform: translateX({pxRemaining * layer.x}px) translateY({(layer.offsetY ?? 0) - postScroll * layer.drift}px) rotate({pxRemaining * layer.rot}deg) scale({1 + pxRemaining * layer.scale}) scaleX({1 + pxRemaining * (layer.stretchX ?? 0)}) scaleY({heroHeight ? layer.crop ? 1 + (postScroll * layer.drift) / (heroHeight * layer.crop.height / 100) : (heroHeight + postScroll * layer.drift) / heroHeight : 1});"
              fetchpriority={i === 0 ? 'high' : 'auto'}
              loading={i <= 2 ? 'eager' : 'lazy'}
              decoding="async"
            />
          {/if}
        {/each}
        <svg class="hero-strata" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="0,38 60,35 120,40 180,32 240,28 300,25 340,30 380,26 440,22 500,26 560,30 620,24 680,28 720,35 780,40 840,44 880,40 940,46 1000,50 1060,46 1100,42 1140,48 1200,52 1260,48 1300,44 1340,50 1400,46 1440,42 1440,80 0,80" fill="#4b4840" />
        </svg>
      </div>
    </div>
  </div>
  <!-- scroll room so the postScroll drift is scrubbable -->
  <div class="scroll-spacer"></div>
  <div class="beest-bottom">BEEST</div>
</div>

<style>
  @font-face {
    font-family: "Stone Breaker";
    src: url("/fonts/Stone Breaker.woff2") format("woff2");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  .saturate-wrap {
    filter: saturate(1.5);
  }
  .top-bg {
    background: #4b4840;
    position: relative;
  }
  .hero-wrap {
    position: relative;
    line-height: 0;
    z-index: 1;
  }
  .hero-parallax {
    position: relative;
    width: 100%;
    aspect-ratio: 4800 / 2700;
    overflow: hidden;
  }
  .hero-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    will-change: transform;
    pointer-events: none;
  }
  .hero-layer-cropped {
    inset: auto;
    object-fit: fill;
  }
  .hero-layer-bg {
    background: linear-gradient(to bottom, #8aadc8 0%, #99b7cf 25%, #a9c3d8 50%, #b0c9dc 75%);
  }
  .hero-strata {
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 80px;
    display: block;
    z-index: 12;
  }
  .scroll-spacer {
    height: 1500px;
    background: #47453f;
  }
  .beest-bottom {
    background: #47453f;
    color: #ffffff;
    font-family: "Stone Breaker", "Courier New", monospace;
    font-size: clamp(64px, 14vw, 220px);
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1;
    text-align: center;
    padding: 0 0 48px;
  }
</style>
