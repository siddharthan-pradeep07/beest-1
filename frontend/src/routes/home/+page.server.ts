import { redirect } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const BACKEND_URL = env.BACKEND_URL ?? 'http://localhost:3001';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) redirect(302, '/');

	// Check if user has elevated permissions (don't block page load on failure)
	let role: string | null = null;
	let needsIntent = false;
	let events = [];
	const token = cookies.get('auth_token');
	if (token) {
		try {
			const res = await fetch(`${BACKEND_URL}/api/auth/scope?scope=reviewer`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				role = data.perms ?? null;
			}
		} catch { /* non-critical */ }

		// One-time "hackathon or shop?" prompt — shows until the user answers.
		try {
			const res = await fetch(`${BACKEND_URL}/api/auth/intent`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				needsIntent = data.needsPrompt === true;
			}
		} catch { /* non-critical — just don't show the prompt */ }

		try {
			const eventRes = await fetch(`${BACKEND_URL}/api/admin/events/upcoming`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (eventRes.ok) {
				events = await eventRes.json();
			}
		} catch {
			/* non-critical */
		}
	}

	return { user, role, needsIntent, events };
};
