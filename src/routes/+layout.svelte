<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
    <title>Vin Howe</title>
</svelte:head>

{@render children()}
