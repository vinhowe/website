import type { BlogPostSummary } from '$lib/types/blog';

type PostMetadata = {
	title: string;
	date?: string | Date;
	summary?: string;
};

type PostRecord = BlogPostSummary & { sortValue: number };

const blogModules = import.meta.glob('./blog/*/+page.svx', {
	eager: true
});

export const load = async (): Promise<{ posts: BlogPostSummary[] }> => {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});

	const posts = Object.entries(blogModules)
		.reduce<PostRecord[]>((acc, [path, module]) => {
			const segments = path.replace('./blog/', '').split('/');
			const slug = segments[0];

			const { metadata } = module as { metadata?: PostMetadata };
			if (!metadata?.title || !slug) {
				return acc;
			}

			const rawDate = metadata.date;
			const isoDate =
				rawDate instanceof Date
					? rawDate.toISOString().slice(0, 10)
					: typeof rawDate === 'string' && rawDate.length > 0
						? rawDate
						: undefined;
			const dateValue = isoDate ? new Date(`${isoDate}T00:00:00Z`) : undefined;

			acc.push({
				slug,
				title: metadata.title,
				date: isoDate,
				summary: metadata.summary,
				formattedDate: dateValue ? formatter.format(dateValue) : undefined,
				sortValue: dateValue?.getTime() ?? 0
			});

			return acc;
		}, [])
		.sort((a, b) => b.sortValue - a.sortValue)
		.map(({ sortValue, ...post }) => {
			void sortValue;
			return post;
		});

	return { posts };
};
