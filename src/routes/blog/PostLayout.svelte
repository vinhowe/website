<script lang="ts">
	import VinHeader from '$lib/components/VinHeader.svelte';
	import type { Snippet } from 'svelte';

	type DateInput = string | Date | undefined;

	let {
		title,
		date,
		summary,
		children
	}: { title: string; date: DateInput; summary: string | undefined; children: Snippet } = $props();

	const resolvedDate =
		date instanceof Date
			? new Date(`${date.toISOString().slice(0, 10)}T00:00:00Z`)
			: typeof date === 'string' && date.length > 0
				? new Date(`${date}T00:00:00Z`)
				: undefined;

	const formattedDate = resolvedDate
		? new Intl.DateTimeFormat('en-US', {
				timeZone: 'UTC',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			}).format(resolvedDate)
		: undefined;
</script>

<svelte:head>
	<title>{title}</title>
	{#if summary}
		<meta name="description" content={summary} />
	{/if}
</svelte:head>

<div class="flex h-full w-full items-start justify-center bg-slate-400">
	<div class="m-3 flex w-full max-w-3xl flex-col bg-slate-100 p-8 text-slate-800 sm:m-6 sm:p-14">
		<VinHeader />
		<article class="prose flex max-w-none flex-col text-slate-800 prose-neutral">
			<header class="mb-6">
				<h1 class="mb-2 text-2xl font-normal text-slate-800">{title}</h1>
				<span class="mt-2 mb-3 font-mono text-xs tracking-wide text-slate-600 uppercase">
					Blog post &middot;
					{#if formattedDate}
						<span>{formattedDate}</span>
					{/if}
				</span>
			</header>
			{@render children()}
		</article>
	</div>
</div>
