<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	let { children, class: className = '' }: { children: Snippet; class?: string } = $props();
</script>

<div class="flex min-h-screen w-full items-start justify-center bg-paper">
	<div
		class={twMerge(
			'flex max-w-[45rem] flex-col bg-paper text-slate-800 sm:m-6 sm:border sm:border-t-[3px] sm:border-black',
			className
		)}
	>
		{@render children()}
	</div>
</div>
