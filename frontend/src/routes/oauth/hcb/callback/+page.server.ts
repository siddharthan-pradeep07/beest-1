import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { proxyWithRefresh } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

const BACKEND_URL = env.BACKEND_URL ?? 'http://localhost:3001';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('hcb_oauth_state');

	// One-time cookie — always clear it.
	cookies.delete('hcb_oauth_state', { path: '/' });

	if (!code || !state || !storedState) {
		const oauthError =
			url.searchParams.get('error_description') ?? url.searchParams.get('error');
		if (oauthError) console.error(`HCB OAuth error from provider: ${oauthError}`);
		return { error: 'HCB connection could not be completed. Please try again.' };
	}

	// handle-callback is Super Admin guarded — proxyWithRefresh forwards the admin's JWT.
	const res = await proxyWithRefresh(cookies, `${BACKEND_URL}/api/admin/hcb/handle-callback`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code, state, storedState })
	});

	if (!res.ok) {
		return { error: 'HCB connection failed. Make sure you are signed in as a Super Admin.' };
	}

	redirect(302, '/admin?hcb=connected');
};
