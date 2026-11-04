import { listPosts } from '$lib/posts';
import { SITE_URL } from '$lib/site';

export const prerender = true;

export const GET = () => {
	const posts = listPosts();
	const entries = [
		// The homepage changes whenever a post is added
		{ loc: `${SITE_URL}/`, lastmod: posts[0]?.date },
		...posts.map((post) => ({ loc: `${SITE_URL}/blog/${post.slug}`, lastmod: post.date }))
	];

	const urls = entries
		.map(
			({ loc, lastmod }) =>
				`  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`
		)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
};
