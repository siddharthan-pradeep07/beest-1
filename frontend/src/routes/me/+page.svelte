<script lang="ts">
  import HomePage from '../home/+page.svelte';

  let { data }: { data: any } = $props();
</script>

<HomePage {data} />
