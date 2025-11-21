<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="preconnect" href="https://use.typekit.net" crossorigin="anonymous" />
	<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous" />
	<link
		rel="preload"
		href="https://use.typekit.net/ixr7lrv.css"
		as="style"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex-swap.min.css"
		as="style"
		crossorigin="anonymous"
	/>
	<link rel="stylesheet" href="https://use.typekit.net/ixr7lrv.css" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex-swap.min.css"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="/Berkeley Mono Variable.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
</svelte:head>

{@render children()}
