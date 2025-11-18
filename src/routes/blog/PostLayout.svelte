<script lang="ts">
	import VinHeader from '$lib/components/VinHeader.svelte';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	type DateInput = string | Date | undefined;

	let {
		title,
		date,
		summary,
		headerImage,
		author = 'Vin Howe',
		children
	}: {
		title: string;
		date: DateInput;
		summary: string | undefined;
		headerImage?: string | undefined;
		author?: string;
		children: Snippet;
	} = $props();

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

	// Eagerly import all images under the blog directory and expose as URLs.
	// This lets frontmatter specify a path or filename located alongside the post.
	const imageModules = import.meta.glob('./**/*.{png,jpg,jpeg,webp,avif,gif}', {
		query: '?url',
		import: 'default',
		eager: true
	}) as Record<string, string>;

	function resolveHeaderImageUrl(input?: string): string | undefined {
		if (!input) return undefined;
		const normalized = input.replace(/^\.?\//, '');

		// Try exact relative match from blog root
		const exactKey = `./${normalized}`;
		if (imageModules[exactKey]) return imageModules[exactKey];

		// Fallback: find any asset whose path ends with the provided value
		for (const [key, url] of Object.entries(imageModules)) {
			if (key.endsWith(`/${normalized}`)) return url;
		}
		return undefined;
	}

	const headerImageUrl = resolveHeaderImageUrl(headerImage);

	const isoDate = resolvedDate ? resolvedDate.toISOString().slice(0, 10) : undefined;
	const citationPublicationDate = isoDate ? isoDate.replace(/-/g, '/') : undefined;
	const year = resolvedDate?.getUTCFullYear();

	function computeCitationKey(
		titleValue: string,
		authorValue: string,
		yearValue: number
	): string | undefined {
		if (!titleValue) return undefined;

		const normalizedAuthor = authorValue.toLowerCase().replace(/[^a-z0-9]+/g, '');
		return `${normalizedAuthor}${yearValue}`;
	}

	const canonicalUrl = $derived(page.url.href);
	let accessDateIso = $state<string | undefined>();

	onMount(() => {
		accessDateIso = new Date().toISOString().slice(0, 10);
	});

	const bibtexEntry = $derived(
		(() => {
			if (!isoDate || !year) return undefined;

			const key = computeCitationKey(title, author, year);
			if (!key) return undefined;

			const fields = [
				author && `  author = {${author}}`,
				`  title = {${title}}`,
				`  date = {${isoDate}}`,
				`  url = {${canonicalUrl}}`,
				accessDateIso && `  urldate = {${accessDateIso}}`
			].filter(Boolean) as string[];

			return `@online{${key},\n${fields.join(',\n')}\n}`;
		})()
	);

	const jsonLdBlogPosting = $derived(
		isoDate
			? JSON.stringify(
					{
						'@context': 'https://schema.org',
						'@type': 'BlogPosting',
						headline: title,
						description: summary,
						datePublished: isoDate,
						dateModified: isoDate,
						url: canonicalUrl,
						mainEntityOfPage: {
							'@type': 'WebPage',
							'@id': canonicalUrl
						},
						author: {
							'@type': 'Person',
							name: author
						},
						image: headerImageUrl,
						publisher: {
							'@type': 'Organization',
							name: "Vin Howe's Blog"
						}
					},
					null,
					2
				)
			: undefined
	);
</script>

<svelte:head>
	<title>{title} - Vin Howe</title>
	{#if summary}
		<meta name="description" content={summary} />
	{/if}
	<meta name="citation_title" content={title} />
	<meta name="citation_author" content="Howe, Vin" />
	{#if citationPublicationDate}
		<meta name="citation_publication_date" content={citationPublicationDate} />
	{/if}
	<meta name="citation_journal_title" content="Vin Howe's Blog" />
	<meta name="citation_fulltext_html_url" content={canonicalUrl} />
	{#if jsonLdBlogPosting}
		<script type="application/ld+json">
			{jsonLdBlogPosting}
		</script>
	{/if}
</svelte:head>

<div class="flex h-full w-full items-start justify-center bg-slate-400">
	<div class="m-3 flex w-full max-w-3xl flex-col bg-slate-100 p-8 text-slate-800 sm:m-6 sm:p-14">
		<VinHeader />
		<article class="prose flex max-w-none flex-col text-slate-800 prose-neutral">
			<header class="mt-0 mb-3 sm:mt-5 sm:mb-4">
				{#if headerImageUrl}
					<div class="-mx-8 w-screen sm:mx-0 sm:w-full">
						<img src={headerImageUrl} alt={title} class="not-prose mb-7 sm:mb-10" />
					</div>
				{/if}
				<h1 class="mb-2 text-2xl font-normal text-slate-800">{title}</h1>
				<span class="mt-2 mb-3 font-mono text-xs tracking-wide text-slate-600 uppercase">
					Blog post &middot;
					{#if formattedDate}
						<span>{formattedDate}</span>
					{/if}
				</span>
			</header>
			{@render children()}

			{#if bibtexEntry}
				<h2 class="my-2">Citation</h2>
				<pre
					class="overflow-x-auto rounded bg-slate-900 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-50">{bibtexEntry}</pre>
			{/if}
		</article>
	</div>
</div>
