<script lang="ts">
  let { data } = $props();
</script>

<div class="callback-container">
  {#if data.error}
    <p class="error">HCB connection failed: {data.error}</p>
    <a href="/admin">Back to admin</a>
  {:else}
    <p>Connecting to HCB...</p>
  {/if}
</div>

<style>
  .callback-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-family: sans-serif;
    color: #e8e0d4;
    background: #4b4840;
  }

  .error {
    color: #ff6b6b;
  }

  a {
    color: #e8e0d4;
    margin-top: 1rem;
  }
</style>
