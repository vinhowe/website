<script lang="ts">
	import VinHeader from '$lib/components/VinHeader.svelte';
	import InkImage from '$lib/components/InkImage.svelte';
	import PageFrame from '$lib/components/PageFrame.svelte';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { VIN_PERSON } from '$lib/structuredData';

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
						author: VIN_PERSON,
						image: headerImageUrl,
						publisher: {
							'@type': 'Organization',
							name: "Vin Howe's Blog"
						}
					},
					null,
					2
				).replace(/</g, '\\u003c')
			: undefined
	);
</script>

<svelte:head>
	<title>{title} - Vin Howe</title>
	{#if summary}
		<meta name="description" content={summary} />
	{/if}

	<!-- Open Graph -->
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	{#if summary}
		<meta property="og:description" content={summary} />
	{/if}
	<meta property="og:url" content={canonicalUrl} />
	{#if headerImageUrl}
		<meta property="og:image" content={headerImageUrl} />
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content={headerImageUrl ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	{#if summary}
		<meta name="twitter:description" content={summary} />
	{/if}
	{#if headerImageUrl}
		<meta name="twitter:image" content={headerImageUrl} />
	{/if}

	<meta name="citation_title" content={title} />
	<meta name="citation_author" content="Howe, Vin" />
	{#if citationPublicationDate}
		<meta name="citation_publication_date" content={citationPublicationDate} />
	{/if}
	<meta name="citation_journal_title" content="Vin Howe's Blog" />
	<meta name="citation_fulltext_html_url" content={canonicalUrl} />
	{#if jsonLdBlogPosting}
		{@html `<script type="application/ld+json">${jsonLdBlogPosting}</script>`}
	{/if}
</svelte:head>

<PageFrame>
	<div data-glow class="border border-black [--band:white]">
		<VinHeader />
	</div>
	<article
		data-glow
		class="prose -mt-px max-w-none border border-black ink-band bg-paper-post/0 px-5 py-5 hyphens-auto [--band:var(--color-paper-post)] [--ink-chroma:0.025] sm:px-7 sm:py-7"
	>
		<header class="mb-3 sm:mb-4">
			{#if headerImageUrl}
				<div class="-mx-5 sm:mx-0">
					<InkImage src={headerImageUrl} alt={title} class="mb-7 border border-black sm:mb-10" />
				</div>
			{/if}
			<h1 class="mb-2 text-2xl font-normal">{title}</h1>
			<span class="mt-2 mb-3 text-xs tracking-wide text-[var(--ink)]/70 uppercase tabular-nums">
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
				class="overflow-x-auto px-3 py-2 font-mono text-[11px] leading-relaxed">{bibtexEntry}</pre>
		{/if}
	</article>
</PageFrame>
