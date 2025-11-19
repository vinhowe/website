<script lang="ts">
	import VinHeader from '$lib/components/VinHeader.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const posts = data.posts ?? [];
</script>

<svelte:head>
	<title>Vin Howe</title>
</svelte:head>

{#snippet yearHeading(year: number)}
	<div class="not-prose contents">
		<h3 class="font-mono text-base font-medium tracking-wider text-neutral-500 uppercase">
			{year}
		</h3>
	</div>
{/snippet}

<div class="flex h-full w-full items-start justify-center bg-slate-400">
	<div class="m-3 flex flex-col max-w-3xl bg-slate-100 p-8 text-slate-800 sm:m-6 sm:p-14">
		<VinHeader />
		<div class="prose [&_a]:no-underline flex-col text-justify max-w-none">
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
			<h2>Research Interests</h2>
			<p>
				I&rsquo;m broadly interested in NLP and large language models. Right now, I&rsquo;m studying
				what kinds of useful inductive biases self-supervision fails to induce even after training
				on trillions(!) of tokens of natural language data.
			</p>
			{#if posts.length}
				<h2>Blog</h2>
				<div class="flex flex-col gap-1">
					{#each posts as post}
						<div class="flex items-baseline justify-between gap-4">
							<a class="font-medium text-blue-500 hover:text-blue-600" href={`/blog/${post.slug}`}
								>{post.title}</a
							>
							{#if post.formattedDate}
								<span class="shrink-0 font-mono text-xs tracking-wider text-neutral-500 uppercase"
									>{post.formattedDate}</span
								>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
			<h2>Publications</h2>
			{@render yearHeading(2024)}
			<p>
				<a
					class="font-medium text-blue-500 hover:text-blue-600"
					href="https://doi.org/10.1073/pnas.2311627120"
				>
					<img
						src="/gsae-preview.png"
						alt="Diagram of gradient sparse autoencoder (gSAE)"
						class="mb-2 border border-neutral-200 md:w-3/4"
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
						class="mb-2 border border-neutral-200 md:w-3/4"
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
			<h2>Projects</h2>
			{@render yearHeading(2025)}
			<p>
				<a href="https://sequence.toys">
					<img
						src="/sequence-toy-preview.png"
						alt="Preview of Sequence Toy"
						class="mb-2 border border-neutral-200 md:w-3/4"
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
