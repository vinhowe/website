<script lang="ts">
	import { onMount } from 'svelte';

	let onVinHow = $state(false);

	onMount(() => {
		onVinHow = window.location.hostname === 'vin.how';
	});
</script>

<div
	class="not-prose flex flex-col gap-1 border-t-[3px] border-black ink-band bg-white/0 px-5 py-5 [--band:var(--color-paper-header)] sm:px-7 sm:py-7"
>
	<h1 class="text-xl font-medium tracking-tight">
		<a href="/">Vin Howe</a>
	</h1>
	<p
		class="[&_a]:underline [&_a]:decoration-[var(--ink)]/50 [&_a]:decoration-dotted [&_a]:decoration-[1.5px] [&_a]:underline-offset-2 [&_a:hover]:decoration-[var(--ink)] [&_a:hover]:decoration-solid"
	>
		<a href="https://x.com/vinhowe">Twitter</a>
		(<a target="_blank" href="https://x.com/messages/compose?recipient_id=1286805122115280896"
			>DM me</a
		>) ·
		<a href="https://scholar.google.com/citations?user=nOym4IEAAAAJ">Google Scholar</a>
		·
		<a href="https://github.com/vinhowe">GitHub</a>
		·
		<a href="https://www.linkedin.com/in/tvinhowe/">LinkedIn</a>
		·
		<a href="https://calendly.com/tvin">Calendly</a>
		·
		{#if onVinHow}
			vin @ this domain
		{:else}
			vin @ <a href="https://vin.how">my other domain</a>
		{/if}
	</p>
</div>
