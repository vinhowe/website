<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	let { children, class: className = '' }: { children: Snippet; class?: string } = $props();
</script>

<div class="flex min-h-screen w-full items-start justify-center">
	<div
		class={twMerge(
			'm-gutter flex w-full max-w-[45rem] min-w-0 flex-col gap-gutter text-slate-800 sm:m-6',
			className
		)}
	>
		{@render children()}
	</div>
</div>
