<script lang="ts">
	// A fixed WebGPU canvas behind the page. Whenever layout can have changed it reads the
	// viewport rectangle and band colour of each element marked data-glow and colours every
	// pixel by the nearest cards: a Voronoi of the cards with soft edges, so each card's colour
	// runs out to the page edge until another card is closer.
	//
	// Hovering a card darkens its colour and tightens every seam that touches it; both are
	// driven by damped springs stepped per frame, so the motion is physical rather than keyed.
	// A seam's width is the smaller of the two cards meeting there, plus spread times the
	// distance from the nearest card, so seams loosen out in the open margins. chroma and
	// lightness push every band colour in OKLab before it is drawn.
	// Without WebGPU the canvas stays transparent and the page background shows.
	import { onMount } from 'svelte';

	let {
		softness = 24,
		hoverSoftness = 2,
		spread = 0.5,
		chroma = 2.5,
		lightness = -0.03,
		darkChroma = 1,
		darkLightness = 0,
		stiffness = 180,
		damping = 20
	}: {
		/** Seam width in CSS px where two cards touch, at rest. */
		softness?: number;
		/** Seam width for seams touching the hovered card. */
		hoverSoftness?: number;
		/** How fast seam width grows per px of distance from the nearest card. */
		spread?: number;
		/** OKLab chroma multiplier and lightness offset applied to every band colour. */
		chroma?: number;
		lightness?: number;
		/** The same, applied on top for a card's hovered colour. */
		darkChroma?: number;
		darkLightness?: number;
		/** Spring constants shared by every animated value. */
		stiffness?: number;
		damping?: number;
	} = $props();

	const MAX_GLOWS = 16;
	const GLOW_FLOATS = 12;
	const UNIFORM_BYTES = 32 + MAX_GLOWS * GLOW_FLOATS * 4;

	const shader = /* wgsl */ `
		// color.a is how far the card has moved toward dark (0..1); dark.a is its seam width.
		struct Glow { rect: vec4<f32>, color: vec4<f32>, dark: vec4<f32> }
		struct Uniforms {
			spread: f32,
			pad0: f32,
			count: u32,
			pad1: u32,
			paper: vec3<f32>,
			pad2: f32,
			glows: array<Glow, ${MAX_GLOWS}>,
		}
		@group(0) @binding(0) var<uniform> u: Uniforms;

		@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
			var p = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
			return vec4(p[i], 0.0, 1.0);
		}

		// Distance from p to the rectangle (x, y, w, h); zero inside.
		fn boxDist(p: vec2<f32>, r: vec4<f32>) -> f32 {
			let half = r.zw * 0.5;
			return length(max(abs(p - (r.xy + half)) - half, vec2(0.0)));
		}

		@fragment fn fs(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
			if (u.count == 0u) {
				return vec4(u.paper, 1.0);
			}
			// Nearest and second-nearest cards: the seam here is between those two, and takes
			// the tighter of their widths. Weights are relative to the nearest distance, so only
			// differences matter and the exponentials never underflow.
			var d1 = 1e9;
			var d2 = 1e9;
			var n1 = 0u;
			var n2 = 0u;
			for (var i = 0u; i < u.count; i++) {
				let d = boxDist(pos.xy, u.glows[i].rect);
				if (d < d1) { d2 = d1; n2 = n1; d1 = d; n1 = i; }
				else if (d < d2) { d2 = d; n2 = i; }
			}
			let soft = max(min(u.glows[n1].dark.a, u.glows[n2].dark.a), 0.5) + u.spread * d1;
			var acc = vec3(0.0);
			var wsum = 0.0;
			for (var i = 0u; i < u.count; i++) {
				let g = u.glows[i];
				let w = exp(-(boxDist(pos.xy, g.rect) - d1) / soft);
				acc += mix(g.color.rgb, g.dark.rgb, g.color.a) * w;
				wsum += w;
			}
			return vec4(acc / wsum, 1.0);
		}
	`;

	let canvas: HTMLCanvasElement;

	type Rgba = [number, number, number, number];

	// Resolve any CSS colour string to RGBA floats by painting it onto a 2D canvas.
	function makeColorResolver() {
		const probe = document.createElement('canvas');
		probe.width = probe.height = 1;
		const ctx = probe.getContext('2d', { willReadFrequently: true })!;
		const cache: Record<string, Rgba> = Object.create(null);
		return (css: string): Rgba => {
			let c = cache[css];
			if (!c) {
				ctx.clearRect(0, 0, 1, 1);
				ctx.fillStyle = css;
				ctx.fillRect(0, 0, 1, 1);
				const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
				c = [r / 255, g / 255, b / 255, a / 255];
				cache[css] = c;
			}
			return c;
		};
	}

	// sRGB <-> OKLab, so a card's dark colour is a perceptual push of its band colour.
	const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
	function pushColor(rgb: Rgba, chroma: number, lightness: number): Rgba {
		const [r, g, b] = rgb.map(toLinear);
		const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
		const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
		const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
		const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s + lightness;
		const A = (1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s) * chroma;
		const B = (0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s) * chroma;
		const l2 = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
		const m2 = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
		const s2 = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
		const clamp = (c: number) => Math.min(1, Math.max(0, toSrgb(c)));
		return [
			clamp(4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2),
			clamp(-1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2),
			clamp(-0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2),
			1
		];
	}

	onMount(() => {
		if (!('gpu' in navigator)) return;
		let stopped = false;
		let frame = 0;
		let cleanup = () => {};

		(async () => {
			const adapter = await navigator.gpu.requestAdapter();
			if (!adapter || stopped) return;
			const device = await adapter.requestDevice();
			const context = canvas.getContext('webgpu');
			if (!context) return;
			const format = navigator.gpu.getPreferredCanvasFormat();
			context.configure({ device, format, alphaMode: 'opaque' });

			const module = device.createShaderModule({ code: shader });
			const pipeline = device.createRenderPipeline({
				layout: 'auto',
				vertex: { module, entryPoint: 'vs' },
				fragment: { module, entryPoint: 'fs', targets: [{ format }] },
				primitive: { topology: 'triangle-list' }
			});
			const uniformBuffer = device.createBuffer({
				size: UNIFORM_BYTES,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
			});
			const bindGroup = device.createBindGroup({
				layout: pipeline.getBindGroupLayout(0),
				entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
			});

			const data = new ArrayBuffer(UNIFORM_BYTES);
			const f32 = new Float32Array(data);
			const u32 = new Uint32Array(data);
			const previous = new Float32Array(f32.length);
			let dirty = true;
			const resolve = makeColorResolver();

			// Per-card state: colours, and a spring each for seam width and the dark mix.
			type Card = {
				color: Rgba;
				dark: Rgba;
				soft: number;
				softV: number;
				mix: number;
				mixV: number;
			};
			const cardOf = new WeakMap<Element, Card>();
			let hovered: Element | null = null;
			let lastTime = 0;

			// One step of a damped spring toward target; the flag is true while still moving.
			const step = (
				x: number,
				v: number,
				target: number,
				dt: number
			): [number, number, boolean] => {
				v += (-stiffness * (x - target) - damping * v) * dt;
				x += v * dt;
				const moving = Math.abs(v) > 1e-3 || Math.abs(x - target) > 1e-3;
				return moving ? [x, v, true] : [target, 0, false];
			};

			const resize = () => {
				const dpr = window.devicePixelRatio || 1;
				canvas.width = Math.round(window.innerWidth * dpr);
				canvas.height = Math.round(window.innerHeight * dpr);
				dirty = true;
			};

			// Draw only when layout can have changed or a spring is moving. Never on a timer.
			let scheduled = false;
			const schedule = () => {
				if (scheduled || stopped) return;
				scheduled = true;
				frame = requestAnimationFrame(render);
			};

			let elements: Element[] = [];
			let paper: Rgba = [1, 1, 1, 1];
			const sizeObserver = new ResizeObserver(schedule);
			const collect = () => {
				sizeObserver.disconnect();
				sizeObserver.observe(document.body);
				elements = Array.from(document.querySelectorAll('[data-glow]')).slice(0, MAX_GLOWS);
				for (const el of elements) sizeObserver.observe(el);
				paper = resolve(getComputedStyle(document.body).backgroundColor);
				dirty = true;
				schedule();
			};
			// DOM mutations arrive in bursts while a page mounts; re-collect once per frame, after
			// the burst, rather than forcing layout on every batch.
			let collectPending = false;
			const collectSoon = () => {
				if (collectPending) return;
				collectPending = true;
				requestAnimationFrame(() => {
					collectPending = false;
					if (!stopped) collect();
				});
			};

			const render = (now: number) => {
				scheduled = false;
				if (stopped || document.hidden) return;
				const dt = Math.min(0.032, lastTime ? (now - lastTime) / 1000 : 0.016);
				lastTime = now;

				const dpr = window.devicePixelRatio || 1;
				f32[0] = spread;
				u32[2] = elements.length;
				f32.set(paper.slice(0, 3), 4);
				let animating = false;
				elements.forEach((el, i) => {
					let card = cardOf.get(el);
					if (!card) {
						// The band variable names the card's colour; cards paint no background.
						const style = getComputedStyle(el);
						const band = resolve(style.getPropertyValue('--band').trim() || style.backgroundColor);
						const color = pushColor(band, chroma, lightness);
						card = {
							color,
							dark: pushColor(color, darkChroma, darkLightness),
							soft: softness,
							softV: 0,
							mix: 0,
							mixV: 0
						};
						cardOf.set(el, card);
					}
					const isHovered = el === hovered;
					let moving: boolean;
					[card.soft, card.softV, moving] = step(
						card.soft,
						card.softV,
						isHovered ? hoverSoftness : softness,
						dt
					);
					animating ||= moving;
					[card.mix, card.mixV, moving] = step(card.mix, card.mixV, isHovered ? 1 : 0, dt);
					animating ||= moving;

					const r = el.getBoundingClientRect();
					const o = 8 + i * GLOW_FLOATS;
					f32[o] = r.left * dpr;
					f32[o + 1] = r.top * dpr;
					f32[o + 2] = r.width * dpr;
					f32[o + 3] = r.height * dpr;
					f32[o + 4] = card.color[0];
					f32[o + 5] = card.color[1];
					f32[o + 6] = card.color[2];
					f32[o + 7] = Math.min(1, Math.max(0, card.mix));
					f32[o + 8] = card.dark[0];
					f32[o + 9] = card.dark[1];
					f32[o + 10] = card.dark[2];
					f32[o + 11] = card.soft * dpr;
				});
				if (animating) schedule();
				else lastTime = 0;

				let changed = dirty;
				for (let i = 0; i < f32.length && !changed; i++) changed = f32[i] !== previous[i];
				if (!changed) return;
				previous.set(f32);
				dirty = false;
				device.queue.writeBuffer(uniformBuffer, 0, data);

				const encoder = device.createCommandEncoder();
				const pass = encoder.beginRenderPass({
					colorAttachments: [
						{ view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store' }
					]
				});
				pass.setPipeline(pipeline);
				pass.setBindGroup(0, bindGroup);
				pass.draw(3);
				pass.end();
				device.queue.submit([encoder.finish()]);
			};

			// Hover tracking: the innermost marked card under the pointer, or none.
			const onPointerOver = (e: PointerEvent) => {
				const next = (e.target as Element | null)?.closest('[data-glow]') ?? null;
				if (next !== hovered) {
					hovered = next;
					schedule();
				}
			};
			const onPointerLeave = () => {
				if (hovered) {
					hovered = null;
					schedule();
				}
			};
			const onResize = () => {
				resize();
				schedule();
			};
			document.addEventListener('pointerover', onPointerOver);
			document.documentElement.addEventListener('pointerleave', onPointerLeave);
			window.addEventListener('resize', onResize);
			window.addEventListener('scroll', schedule, { passive: true });
			document.addEventListener('visibilitychange', schedule);
			const mutationObserver = new MutationObserver(collectSoon);
			mutationObserver.observe(document.body, { childList: true, subtree: true });

			resize();
			collect();

			cleanup = () => {
				document.removeEventListener('pointerover', onPointerOver);
				document.documentElement.removeEventListener('pointerleave', onPointerLeave);
				window.removeEventListener('resize', onResize);
				window.removeEventListener('scroll', schedule);
				document.removeEventListener('visibilitychange', schedule);
				mutationObserver.disconnect();
				sizeObserver.disconnect();
			};
		})();

		return () => {
			stopped = true;
			cancelAnimationFrame(frame);
			cleanup();
		};
	});
</script>

<canvas
	bind:this={canvas}
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 -z-10 h-full w-full"
></canvas>
