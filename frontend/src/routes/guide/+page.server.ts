import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const prerender = false;

const BACKEND_URL = env.BACKEND_URL ?? 'http://localhost:3001';

type ReviewStat = { projectType: string; avgSeconds: number; sampleCount: number };

export const load: PageServerLoad = async () => {
	let stats: ReviewStat[] = [];
	try {
		const res = await fetch(`${BACKEND_URL}/api/projects/review-stats`);
		if (res.ok) stats = (await res.json()) as ReviewStat[];
	} catch {
		// Backend unreachable: render the guide without stats rather than fail the page.
	}
	return { reviewStats: stats };
};
