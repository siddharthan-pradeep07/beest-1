import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { tryRefreshToken } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const BACKEND_URL = env.BACKEND_URL ?? 'http://localhost:3001';

/**
 * Starts the HCB OAuth connect flow. Asks the backend (Super Admin guarded) to
 * mint an authorize URL + state, stores the state in an httpOnly cookie for CSRF
 * verification on the callback, then redirects the browser to HCB.
 */
export const GET: RequestHandler = async ({ cookies }) => {
	let token = cookies.get('auth_token');
	if (!token) {
		token = (await tryRefreshToken(cookies)) ?? undefined;
		if (!token) redirect(302, '/');
	}

	let res = await fetch(`${BACKEND_URL}/api/admin/hcb/connect`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (res.status === 401) {
		const refreshed = await tryRefreshToken(cookies);
		if (refreshed) {
			res = await fetch(`${BACKEND_URL}/api/admin/hcb/connect`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${refreshed}` }
			});
		}
	}

	if (!res.ok) {
		return new Response('Failed to start HCB connection (are you a Super Admin?)', {
			status: 502
		});
	}

	const { url, state } = await res.json();

	cookies.set('hcb_oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.NODE_ENV === 'production',
		maxAge: 600
	});

	redirect(302, url);
};
