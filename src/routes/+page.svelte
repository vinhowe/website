<script lang="ts">
	import VinHeader from '$lib/components/VinHeader.svelte';
	import type { BlogPostSummary } from '$lib/types/blog';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { VIN_PERSON } from '$lib/structuredData';

	const { data }: { data: PageData } = $props();
	const posts = data.posts ?? [];

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

			if (diff >= 0 && diff < newMs) {
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
		<h3 class="font-mono text-sm font-semibold tracking-wider text-neutral-600 uppercase">
			{year}
		</h3>
	</div>
{/snippet}

{#snippet postPreview(post: BlogPostSummary, isNew: boolean)}
	<div class="flex items-baseline justify-between gap-3">
		<div class="items-baseline">
			<a class="font-medium text-blue-500 hover:text-blue-600" href={`/blog/${post.slug}`}>
				{#if isNew}
					<span class="font-mono text-sm font-semibold tracking-wider text-orange-500 uppercase mr-1"
						>New&ensp;post</span
					>
				{/if}
				{post.title}</a
			>
		</div>
		{#if !isNew && post.formattedDate}
			<span
				class="shrink-0 font-mono text-[11px] font-semibold tracking-widest text-neutral-500 uppercase"
				>{post.formattedDate}</span
			>
		{/if}
	</div>
{/snippet}

<div class="flex h-full w-full items-start justify-center bg-slate-400">
	<div class="xs:m-3 flex max-w-3xl flex-col bg-slate-100 p-8 text-slate-800 sm:m-6 sm:p-14">
		<VinHeader />
		<div class="prose max-w-none flex-col text-justify leading-normal [&_a]:no-underline">
			{#if newPosts.length}
				<div class="-mt-3 mb-8 flex flex-col gap-1">
					{#each newPosts as post}
						{@render postPreview(post, true)}
					{/each}
				</div>
			{/if}
			<p>
				I&rsquo;m a Master's student in computer science at Brigham Young University, having
				recently completed a Bachelor's in BYU's Applied and Computational Mathematics program. I
				work with David Wingate in his
				<a
					class="text-blue-500 hover:text-blue-600"
					href="https://www.linkedin.com/company/perception-control-and-cognition-lab/"
					>Perception, Control, and Cognition Lab</a
				>, where I study language models broadly.
			</p>
			<p>
				I built a chatroom that used large language models to improve polarizing political
				conversations.
				<b
					><a
						class="text-blue-500 hover:text-blue-600"
						href="https://doi.org/10.1073/pnas.2311627120"
						>My group published a paper about it in PNAS</a
					></b
				>.
			</p>
			<h3>Research Interests</h3>
			<p>
				I&rsquo;m broadly interested in NLP and large language models. Right now, I&rsquo;m studying
				what kinds of useful inductive biases self-supervision fails to induce even after training
				on trillions(!) of tokens of natural language data.
			</p>
			{#if posts.length}
				<h3>Blog</h3>
				<div class="flex flex-col gap-1">
					{#each posts as post}
						{@render postPreview(post, false)}
					{/each}
				</div>
			{/if}
			<h3>Publications</h3>
			{@render yearHeading(2024)}
			<p>
				<a
					class="font-medium text-blue-500 hover:text-blue-600"
					href="https://doi.org/10.1073/pnas.2311627120"
				>
					<img
						src="/gsae-preview.png"
						alt="Diagram of gradient sparse autoencoder (gSAE)"
						class="border border-neutral-200 md:w-3/4 [&]:my-4"
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
				<a
					class="font-medium text-blue-500 hover:text-blue-600"
					href="https://doi.org/10.1073/pnas.2311627120"
				>
					<img
						src="/chatroom-preview.png"
						alt="Preview of chatroom"
						class="border border-neutral-200 md:w-3/4 [&]:my-4"
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
			<h3>Projects</h3>
			{@render yearHeading(2025)}
			<p>
				<a href="https://sequence.toys">
					<img
						src="/sequence-toy-preview.png"
						alt="Preview of Sequence Toy"
						class="border border-neutral-200 md:w-3/4 [&]:my-4"
					/>
				</a>
				<b class="font-medium"
					>I created
					<a class="text-blue-500 hover:text-blue-600" href="https://sequence.toys">Sequence Toy</a
					></b
				>, a web playground for training small language models with WebGPU.
			</p>
			{@render yearHeading(2021)}
			<p>
				<b class="font-medium">I wrote the software the drives &ldquo;The Wall,&rdquo;</b>
				the floor-to-ceiling interactive display in the lobby of BYU&rsquo;s computer science building.
			</p>
		</div>
	</div>
</div>
