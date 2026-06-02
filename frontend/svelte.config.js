import adapter from '@sveltejs/adapter-node';

// CSP is applied to production builds only. In `vite dev`, Vite's HMR client
// uses inline/eval scripts that a strict policy would break — and dev isn't the
// threat surface. Production is where Super Admins issue real HCB grants, so
// that's where the script-src lockdown matters.
const dev = process.env.NODE_ENV !== 'production';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		...(dev
			? {}
			: {
					csp: {
						// SvelteKit auto-adds hashes/nonces for its own inline scripts.
						mode: 'auto',
						directives: {
							// The critical control: only first-party scripts run. This
							// blocks injected <script>, inline on* handlers, and
							// javascript: URLs — i.e. the XSS → /api/admin/hcb/card-grant
							// money-theft path. All of the app's assets are same-origin.
							'script-src': ['self'],
							'object-src': ['none'],
							'base-uri': ['self']
						}
					}
				})
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
