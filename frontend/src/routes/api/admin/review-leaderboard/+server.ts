import { env } from '$env/dynamic/private';
import { proxyWithRefresh } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const BACKEND_URL = env.BACKEND_URL ?? 'http://localhost:3001';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const window = url.searchParams.get('window') ?? '7d';
	return proxyWithRefresh(cookies, `${BACKEND_URL}/api/admin/review-leaderboard?window=${encodeURIComponent(window)}`);
};
