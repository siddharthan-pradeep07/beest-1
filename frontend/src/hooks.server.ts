import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const host = event.request.headers.get('host');
	if (host === 'beast.hackclub.com') {
		const target = `https://beest.hackclub.com${event.url.pathname}${event.url.search}`;
		throw redirect(308, target);
	}
	return resolve(event);
};
