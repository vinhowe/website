<script lang="ts">
	// A fixed WebGPU canvas behind the page. Whenever layout can have changed it reads the
	// viewport rectangle and band colour of each element marked data-glow and colours every
	// pixel by the nearest cards: a Voronoi of the cards with soft edges, so each card's colour
	// runs out to the page edge until another card is closer. softness is the width of the
	// blend where two cards touch, and spread how fast that width grows with distance from the
	// nearest card. chroma and lightness push each band colour in OKLab before it is drawn.
	// Without WebGPU the canvas stays transparent and the page background shows.
	import { onMount } from 'svelte';

	let {
		softness = 6,
		spread = 0.5,
		chroma = 1,
		lightness = 0
	}: { softness?: number; spread?: number; chroma?: number; lightness?: number } = $props();

	const MAX_GLOWS = 16;
	const UNIFORM_BYTES = 32 + MAX_GLOWS * 32;

	const shader = /* wgsl */ `
		struct Glow { rect: vec4<f32>, color: vec4<f32> }
		struct Uniforms {
			softness: f32,
			spread: f32,
			count: u32,
			pad: u32,
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
			// Weights are relative to the nearest card, so only distance differences matter:
			// far from everything the nearest card still wins outright, and the exponentials
			// never underflow. The blend width grows with that nearest distance, so seams are
			// tight where cards touch and loose out in the open margins.
			var dmin = 1e9;
			for (var i = 0u; i < u.count; i++) {
				dmin = min(dmin, boxDist(pos.xy, u.glows[i].rect));
			}
			let soft = u.softness + u.spread * dmin;
			var acc = vec3(0.0);
			var wsum = 0.0;
			for (var i = 0u; i < u.count; i++) {
				let g = u.glows[i];
				let w = exp(-(boxDist(pos.xy, g.rect) - dmin) / soft);
				acc += g.color.rgb * w;
				wsum += w;
			}
			return vec4(acc / wsum, 1.0);
		}
	`;

	let canvas: HTMLCanvasElement;

	// Resolve any CSS colour string to RGBA floats by painting it onto a 2D canvas.
	function makeColorResolver() {
		const probe = document.createElement('canvas');
		probe.width = probe.height = 1;
		const ctx = probe.getContext('2d', { willReadFrequently: true })!;
		const cache: Record<string, [number, number, number, number]> = Object.create(null);
		return (css: string): [number, number, number, number] => {
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

	// sRGB <-> OKLab, so band colours can be pushed perceptually rather than per channel.
	const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
	function pushColor(rgb: number[]): [number, number, number, number] {
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
			const colorOf = new WeakMap<Element, [number, number, number, number]>();

			const resize = () => {
				const dpr = window.devicePixelRatio || 1;
				canvas.width = Math.round(window.innerWidth * dpr);
				canvas.height = Math.round(window.innerHeight * dpr);
				dirty = true;
			};

			// Draw only when layout can have changed: scroll, resize, an element resizing, or
			// cards being added or removed (page navigation). Never on a timer.
			let scheduled = false;
			const schedule = () => {
				if (scheduled || stopped) return;
				scheduled = true;
				frame = requestAnimationFrame(render);
			};

			let elements: Element[] = [];
			let paper: [number, number, number, number] = [1, 1, 1, 1];
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

			const render = () => {
				scheduled = false;
				if (stopped || document.hidden) return;

				const dpr = window.devicePixelRatio || 1;
				f32[0] = softness * dpr;
				f32[1] = spread;
				u32[2] = elements.length;
				f32.set(paper.slice(0, 3), 4);
				elements.forEach((el, i) => {
					let color = colorOf.get(el);
					if (!color) {
						// The band variable names the card's colour; cards paint no background.
						const style = getComputedStyle(el);
						color = pushColor(
							resolve(style.getPropertyValue('--band').trim() || style.backgroundColor)
						);
						colorOf.set(el, color);
					}
					const r = el.getBoundingClientRect();
					const o = 8 + i * 8;
					f32[o] = r.left * dpr;
					f32[o + 1] = r.top * dpr;
					f32[o + 2] = r.width * dpr;
					f32[o + 3] = r.height * dpr;
					f32.set(color, o + 4);
				});

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

			const onResize = () => {
				resize();
				schedule();
			};
			window.addEventListener('resize', onResize);
			window.addEventListener('scroll', schedule, { passive: true });
			document.addEventListener('visibilitychange', schedule);
			const mutationObserver = new MutationObserver(collectSoon);
			mutationObserver.observe(document.body, { childList: true, subtree: true });

			resize();
			collect();

			cleanup = () => {
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
