<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	let { children, class: className = '' }: { children: Snippet; class?: string } = $props();
</script>

<div class="flex min-h-screen w-full items-start justify-center bg-paper">
	<div
		class={twMerge(
			'flex max-w-3xl flex-col bg-paper text-slate-800 sm:mx-6 sm:mb-6 sm:border sm:border-t-[3px] sm:border-black',
			className
		)}
	>
		{@render children()}
		<!-- Closing rule: mirrors the header rule, nothing beneath it -->
		<div class="h-5 border-t border-black sm:h-7"></div>
	</div>
</div>
