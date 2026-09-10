<script lang="ts">
	import VinHeader from '$lib/components/VinHeader.svelte';
	import InkImage from '$lib/components/InkImage.svelte';
	import PageFrame from '$lib/components/PageFrame.svelte';
	import type { BlogPostSummary } from '$lib/types/blog';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { VIN_PERSON } from '$lib/structuredData';

	const { data }: { data: PageData } = $props();
	const posts = data.posts ?? [];

	// Section bands. Headed sections get one step less top padding: the heading's
	// line box carries more leading above its caps than a paragraph has below its baseline.
	const section =
		'prose -mt-px max-w-none border-black px-5 py-5 leading-normal text-justify hyphens-auto sm:px-7 sm:py-7';
	const headed = `${section} border pt-4 sm:pt-6`;

	// Preview images share one CSS width ladder so they line up. Diagrams are a single render that
	// the browser scales; the dithered Wall is rendered by scripts/tritone.py at each ladder width
	// (from --spacing-preview) and shown pixelated so its dots map 1:1 to CSS pixels.
	const preview =
		'my-4 box-content w-[248px] border border-black min-[460px]:w-[372px] min-[560px]:w-preview';
	const previewDithered = `${preview} [image-rendering:pixelated]`;
	const wallSources = [
		{ media: '(min-width: 560px)', srcset: '/tmcb-wall-tritone-496.png' },
		{ media: '(min-width: 460px)', srcset: '/tmcb-wall-tritone-372.png' }
	];

	let newPostMap: Record<string, boolean> = $state({});
	const newPosts = $derived(posts.filter((post) => newPostMap[post.slug]));

	const profileLdJson = JSON.stringify(
		{
			'@context': 'https://schema.org',
			'@type': 'ProfilePage',
			dateCreated: '2025-11-20T00:00:00-05:00',
			dateModified: '2025-11-20T00:00:00-05:00',
			mainEntity: VIN_PERSON
		},
		null,
		2
	).replace(/</g, '\\u003c');

	onMount(() => {
		const now = new Date();
		const newMs = 10 * 24 * 60 * 60 * 1000;

		const nextMap: Record<string, boolean> = {};

		for (const post of posts) {
			if (!post.date) continue;
			const postDate = new Date(`${post.date}T00:00:00Z`);
			const diff = now.getTime() - postDate.getTime();

			if (diff < newMs) {
				nextMap[post.slug] = true;
			}
		}

		newPostMap = nextMap;
	});
</script>

<svelte:head>
	<title>Vin Howe</title>
	<meta property="og:type" content="profile" />
	<meta property="og:title" content="Vin Howe" />
	<meta property="og:url" content="https://vin.how" />
	<meta property="og:description" content="Vin Howe's personal website" />
	<meta property="twitter:card" content="summary" />
	<meta property="twitter:title" content="Vin Howe" />
	<meta property="twitter:url" content="https://vin.how" />
	<meta name="description" content="Vin Howe's personal website" />
	{@html `<script type="application/ld+json">${profileLdJson}</script>`}
</svelte:head>

{#snippet yearHeading(year: number)}
	<div class="not-prose contents">
		<h3 class="text-sm font-medium tracking-wider tabular-nums">
			{year}
		</h3>
	</div>
{/snippet}

{#snippet postPreview(post: BlogPostSummary, isNew: boolean)}
	<div class="flex items-baseline justify-between gap-3">
		<div class="items-baseline">
			<a class="font-medium" href={`/blog/${post.slug}`}>
				{#if isNew}
					<span
						class="mr-1 font-mono text-sm font-semibold tracking-wider text-orange-500 uppercase"
						>New&ensp;post</span
					>
				{/if}
				{post.title}</a
			>
		</div>
		{#if !isNew && post.formattedDate}
			<span
				class="shrink-0 text-xs font-medium tracking-wider text-[var(--ink)]/70 uppercase tabular-nums"
				>{post.formattedDate}</span
			>
		{/if}
	</div>
{/snippet}

<PageFrame class="xl:max-w-[90rem]">
	<!-- Two ragged columns from xl up. Below that the column wrappers dissolve (display: contents)
	     and the order utilities restore the single-column reading order. -->
	<div class="flex flex-col gap-gutter xl:flex-row xl:items-start">
		<div class="contents xl:flex xl:w-1/2 xl:min-w-0 xl:flex-col xl:gap-gutter">
			<div data-glow class="border border-black [--band:white]">
				<VinHeader />
				<section class="{section} ink-band pt-0 [--band:var(--color-paper-header)] sm:pt-0">
					{#if newPosts.length}
						<div class="-mt-3 mb-8 flex flex-col gap-1">
							{#each newPosts as post}
								{@render postPreview(post, true)}
							{/each}
						</div>
					{/if}
					<p>
						I&rsquo;m a
						<a href="https://www.matsprogram.org/">MATS</a>
						10.0/10.1 scholar supervised by
						<a href="https://www.oliversourbut.net/">Oliver Sourbut</a>, where I'm working on a
						benchmark for multi-agent epistemic propensities. I'm also a Master's student in
						computer science at Brigham Young University; under the supervision of
						<a href="https://science.byu.edu/directory/david-wingate">David Wingate</a>, I study
						learning mechanics in LLMs. Previously, I did my Bachelor's in BYU's Applied and
						Computational Mathematics program.
					</p>
				</section>
			</div>
			{#if posts.length}
				<section data-glow class="{headed} order-3 ink-band [--band:var(--color-paper-blog)]">
					<h3>Blog</h3>
					<div class="flex flex-col gap-1">
						{#each posts as post}
							{@render postPreview(post, false)}
						{/each}
					</div>
				</section>
			{/if}
			<section data-glow class="{headed} order-5 ink-band [--band:var(--color-paper-projects)]">
				<h3>Projects</h3>
				{@render yearHeading(2025)}
				<p>
					<a href="https://sequence.toys" class="{preview} block no-underline">
						<InkImage src="/sequence-toy-preview-tritone.png" alt="Preview of Sequence Toy" />
					</a>
					<b class="font-medium"
						>I created
						<a href="https://sequence.toys">Sequence Toy</a></b
					>, a web playground for training small language models with WebGPU.
				</p>
				{@render yearHeading(2021)}
				<p>
					<InkImage
						src="/tmcb-wall-tritone-248.png"
						sources={wallSources}
						alt="The Wall, a floor-to-ceiling display in the lobby of BYU's computer science building"
						class={previewDithered}
					/>
					<b class="font-medium">I wrote the software the drives &ldquo;The Wall,&rdquo;</b>
					the floor-to-ceiling interactive display in the lobby of BYU&rsquo;s computer science building.
				</p>
			</section>
		</div>
		<div
			class="contents xl:-ml-px xl:flex xl:w-[calc(50%+1px)] xl:min-w-0 xl:flex-col xl:gap-gutter"
		>
			<section
				data-glow
				class="{headed} order-2 ink-band [--band:var(--color-paper-research)] xl:mt-0"
			>
				<h3>Research Interests</h3>
				<p>
					I'm interested in deeply understanding AI to prevent catastrophic risks. In particular, <a
						href="https://arxiv.org/abs/2605.19284">I've researched learning mechanics</a
					>
					to help predict how AI (mis)generalizes, and, as part of
					<a href="https://www.matsprogram.org/">MATS</a>, I've benchmarked multi-agent epistemics
					to help determine if agents are responsible enough to be trusted with our knowledge
					commons. Previously, I worked on pro-social applications of AI, like creating
					<a href="https://doi.org/10.1073/pnas.2311627120"
						>a chatroom that used AI suggestions to help improve online political conversations</a
					>.
				</p>
			</section>
			<section data-glow class="{headed} order-4 ink-band [--band:var(--color-paper-publications)]">
				<h3>Publications</h3>
				{@render yearHeading(2026)}
				<p>
					<a class="font-medium" href="https://arxiv.org/abs/2605.19284">
						<InkImage
							src="/compartmentalization-preview-tritone.png"
							alt="Preview of compartmentalization preprint"
							class={preview}
						/>
						Language models struggle with compartmentalization</a
					>
					<br />
					<b class="font-medium">Thomas V Howe</b>, David Wingate
					<br />
					<i>Preprint</i>
				</p>
				{@render yearHeading(2024)}
				<p>
					<a class="font-medium" href="https://aclanthology.org/2025.findings-naacl.423/">
						<InkImage
							src="/gsae-preview-tritone.png"
							alt="Diagram of gradient sparse autoencoder (gSAE)"
							class={preview}
						/>
						Features that Make a Difference: Leveraging Gradients for Improved Dictionary Learning</a
					>
					<br />
					Jeffrey Olmo, Jared Wilson, Max Forsey, Bryce Hepner,
					<b class="font-medium">Thomas V Howe</b>, David Wingate
					<br />
					<i>Findings of the Association for Computational Linguistics</i>
				</p>
				{@render yearHeading(2023)}
				<p>
					<a class="font-medium" href="https://doi.org/10.1073/pnas.2311627120">
						<InkImage
							src="/chatroom-preview-tritone.png"
							alt="Preview of chatroom"
							class={preview}
						/>
						Leveraging AI for democratic discourse: Chat interventions can improve online political conversations
						at scale</a
					>
					<br />
					Lisa P Argyle, Christopher A Bail, Ethan C Busby, Joshua R Gubler,
					<b class="font-medium">Thomas V Howe</b>, Christopher Rytting, Taylor Sorensen, David
					Wingate
					<br />
					<i>Proceedings of the National Academy of Sciences</i>
				</p>
			</section>
		</div>
	</div>
</PageFrame>
