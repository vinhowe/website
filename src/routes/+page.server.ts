import type { BlogPostSummary } from '$lib/types/blog';
import { listPosts } from '$lib/posts';

export const load = async (): Promise<{ posts: BlogPostSummary[] }> => {
	return { posts: listPosts() };
};
