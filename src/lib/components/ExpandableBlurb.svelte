<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	// Svelte 5 style
	let {
		collapsedText = 'Show more',
		expandedText = 'Hide',
		children,
		class: className = ''
	} = $props();

	let expanded = $state(false);
	const contentId = `expandable-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 9)}`;

	const toggle = () => {
		expanded = !expanded;
	};
</script>

<div class="w-full border border-slate-400 bg-slate-300">
	<button
		type="button"
		class="px-2 cursor-pointer text-left font-medium focus:outline-none w-full"
		aria-expanded={expanded}
		aria-controls={contentId}
		onclick={toggle}
	>
		{expanded ? expandedText : collapsedText}
	</button>

	{#if expanded}
		<div id={contentId} class={twMerge('m-2', className)}>
			{@render children()}
		</div>
	{/if}
</div>
