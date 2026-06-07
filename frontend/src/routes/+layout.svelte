<script lang="ts">
	let { children } = $props();

	let impersonating = $state(false);

	function checkImpersonating() {
		impersonating = document.cookie.split(';').some(c => c.trim().startsWith('impersonating='));
	}

	async function endImpersonation() {
		const res = await fetch('/api/auth/end-impersonate', { method: 'POST' });
		if (res.ok) {
			window.location.href = '/admin';
		}
	}

	function captureAttribution() {
		const alreadySet = document.cookie
			.split(';')
			.some(c => c.trim().startsWith('attribution='));
		if (alreadySet) return;

		const params = new URLSearchParams(window.location.search);
		const utm_source = params.get('utm_source');
		const utm_medium = params.get('utm_medium');
		const utm_campaign = params.get('utm_campaign');
		const referrer = document.referrer || null;
		const landing_path = window.location.pathname || null;

		// Only set the cookie if there's something worth attributing
		if (!utm_source && !utm_medium && !utm_campaign && !referrer) return;

		const data = { utm_source, utm_medium, utm_campaign, referrer, landing_path };
		const value = encodeURIComponent(JSON.stringify(data));
		const maxAge = 60 * 60 * 24 * 30; // 30 days
		document.cookie = `attribution=${value}; path=/; max-age=${maxAge}; samesite=lax`;
	}

	$effect(() => {
		if (typeof document === 'undefined') return;
		checkImpersonating();
		captureAttribution();
		if (typeof localStorage !== 'undefined' && localStorage.getItem('customCursor') !== 'off') {
			document.documentElement.classList.add('custom-cursor');
		}
	});
</script>

<svelte:head>
	<title>Beest</title>
</svelte:head>

{#if impersonating}
	<button class="end-impersonate" onclick={endImpersonation}>
		End Impersonation
	</button>
{/if}

{@render children()}

<style>
	:global(*), :global(*::before), :global(*::after) {
		box-sizing: border-box;
	}

	:global(html) {
		min-height: 100%;
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		font-family: "Courier New", monospace;
		background-color: #47453f;
		color: #e6f4fe;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
		-webkit-text-size-adjust: 100%;
		overflow-x: hidden;
		overflow-y: auto;
	}

	:global(img), :global(svg), :global(video), :global(canvas), :global(picture) {
		display: block;
		max-width: 100%;
		height: auto;
	}

	:global(button), :global(input), :global(textarea), :global(select) {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		font: inherit;
		background-repeat: no-repeat;
	}

	:global(button) {
		line-height: 1.1;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	:global(a:focus-visible), :global(button:focus-visible), :global(input:focus-visible) {
		outline: 2px solid #93b4cd;
		outline-offset: 3px;
	}
	.end-impersonate {
		position: fixed;
		top: 12px;
		right: 12px;
		z-index: 99999;
		background: #cc2222;
		color: #fff;
		border: 2px solid #ff4444;
		padding: 8px 18px;
		font-size: 14px;
		font-weight: 700;
		border-radius: 6px;
		cursor: pointer;
		box-shadow: none;
		transition: background 0.15s;
	}
	.end-impersonate:hover {
		background: #ee3333;
	}

	@media (pointer: fine) {
		:global(html.custom-cursor *) {
			cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='28' viewBox='0 0 32 36'%3E%3Cpolygon points='3,2 3,30 12,23 19,34 25,31 18,20 29,17' fill='%23ffffff' stroke='%234b4840' stroke-width='3' stroke-linejoin='round'/%3E%3C/svg%3E") 2 2, auto;
		}

		:global(html.custom-cursor *:active) {
			cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='36' viewBox='0 0 32 36'%3E%3Cpolygon points='3,2 3,30 12,23 19,34 25,31 18,20 29,17' fill='%23ffffff' stroke='%234b4840' stroke-width='3' stroke-linejoin='round'/%3E%3C/svg%3E") 3 2, auto;
		}
	}
</style>
