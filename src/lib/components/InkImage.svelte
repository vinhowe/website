<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	// A three-tone image whose black becomes a deep version of the surrounding band colour.
	// The overlay screens the ink colour onto the image (black -> ink, white stays white),
	// then the whole group multiplies onto the band. Ink colour derives from the --band
	// variable set on an ancestor; see the ink-overlay utility in app.css.
	let { src, alt, class: className = '' }: { src: string; alt: string; class?: string } = $props();
</script>

<span class={twMerge('relative isolate block mix-blend-multiply', className)}>
	<img {src} {alt} class="block w-full [&]:my-0" />
	<span aria-hidden="true" class="pointer-events-none absolute inset-0 ink-overlay mix-blend-screen"
	></span>
</span>
