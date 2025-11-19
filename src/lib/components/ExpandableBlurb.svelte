<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { ChevronRight } from 'lucide-svelte';
	import { onMount } from 'svelte';

	// Svelte 5 style
	let {
		collapsedText = 'Show more',
		expandedText = collapsedText,
		children,
		contentClass: contentClassName = '',
		containerClass: containerClassName = ''
	} = $props();

	// Render expanded on the server so the SSR HTML is open,
	// then collapse on the client once JS has loaded.
	let expanded = $state(true);
	const contentId = `expandable-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 9)}`;

	onMount(() => {
		expanded = false;
	});

	const toggle = () => {
		expanded = !expanded;
	};
</script>

<div class={twMerge('w-full border border-slate-400 bg-slate-200', containerClassName)}>
	<button
		type="button"
		class="flex w-full cursor-pointer items-center gap-1 px-2 text-left font-medium focus:outline-none"
		aria-expanded={expanded}
		aria-controls={contentId}
		onclick={toggle}
	>
		<ChevronRight
			class={twMerge(
				'size-4 translate-y-[0.5px] transition-transform duration-100',
				expanded ? 'rotate-90' : ''
			)}
		/>
		{expanded ? expandedText : collapsedText}
	</button>

	{#if expanded}
		<div id={contentId} class={twMerge('m-2', contentClassName)}>
			{@render children()}
		</div>
	{/if}
</div>
