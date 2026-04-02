<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Beest</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	@media (pointer: fine) {
		:global(*) {
			cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='28' viewBox='0 0 32 36'%3E%3Cpolygon points='3,2 3,30 12,23 19,34 25,31 18,20 29,17' fill='%23ffffff' stroke='%234b4840' stroke-width='3' stroke-linejoin='round'/%3E%3C/svg%3E") 2 2, auto;
		}

		:global(*:active) {
			cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='36' viewBox='0 0 32 36'%3E%3Cpolygon points='3,2 3,30 12,23 19,34 25,31 18,20 29,17' fill='%23ffffff' stroke='%234b4840' stroke-width='3' stroke-linejoin='round'/%3E%3C/svg%3E") 3 2, auto;
		}
	}
</style>
