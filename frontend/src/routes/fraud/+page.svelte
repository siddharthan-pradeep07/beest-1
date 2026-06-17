<!-- src/routes/fraud/+page.svelte — Beest's version of fraud.hackclub.com -->
<svelte:head>
	<title>So now you're banned...</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="fraud-page">
	<div class="container">
		<header class="header">
			<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path
					fill-rule="evenodd"
					d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
					clip-rule="evenodd"
				/>
			</svg>
			<h1>So now you're banned; what's next?</h1>
			<p class="intro-text">
				Hey - if you're reading this, you've been banned from Beest. There are a few reasons this might have
				happened: you may be over 18 and therefore not eligible, you may have attempted to cheat the time
				tracking system, you may have conducted yourself poorly and had it result in a ban, or we may have
				simply made a mistake. Beest keeps its own ban list, separate from Hackatime - so you can be banned
				from Beest without being banned from Hackatime itself. If you don't know why you're banned, reach out
				to the team - or to the fraud squad if it's related to Hackatime hour fraud.
			</p>
		</header>

		<main>
			<section>
				<h2>First, what happened?</h2>
				<p>
					Hack Club is a community built on trust. There are two reasons you can be banned from Beest:
				</p>
				<ul>
					<li>
						<strong>Hackatime fraud:</strong> some people attempt to abuse that trust to get free stuff.
						The fraud department uses certain metrics to attempt to detect people unfairly gaining hours
						on Hackatime.
					</li>
					<li>
						<strong>Conduct:</strong> harassing staff or otherwise violating the
						<a href="https://hackclub.com/conduct">Hack Club Code of Conduct</a>.
					</li>
				</ul>
			</section>

			<section>
				<h2>What's next?</h2>
				<p>
					Your next actions depend on the nature of your ban. However, the overarching theme is that we're
					all human, and mistakes happen on both sides.
				</p>

				<h3>If you truly violated the rules:</h3>
				<p>
					We believe people can learn and grow from their mistakes. We're all teens here, and we believe
					learning from our mistakes is the most important way to grow as a person. We appreciate honesty.
					Whether you attempted to game the system or treated staff or other members poorly, the best path
					forward is:
				</p>
				<ul>
					<li>Acknowledge that you made a mistake.</li>
					<li>Explain why it occurred - why did you do this?</li>
					<li>
						Show us that you understand what you did wrong, and that you plan to approach things
						differently going on.
					</li>
				</ul>
				<p>
					First, though, it's worth taking a moment to think about the bigger picture here. Hack Club isn't
					some faceless corporation with endless pockets; we're a non-profit relying on donations. Every
					sticker, every piece of hardware, every opportunity we offer is funded by people who believe in
					our mission to help young makers.
				</p>
				<p>
					When someone games the system, it takes away valuable resources from another teen who was playing
					by the rules. It's a crummy thing to do, and we hope that's something you'll really sit with for a
					minute.
				</p>
				<p>
					This isn't about making excuses or debating the details of the ban. If you made a mistake, we want
					to see that you'll learn from this experience.
				</p>

				<h3>If this was our mistake:</h3>
				<p>
					It's completely possible that this ban was done in error. We're all humans, and sometimes we
					misjudge Hackatime data. If you were banned for fraud and believe it was a mistake, we would like
					to see some proof that you were truly working honestly.
				</p>
				<div class="path-info">
					<p>
						If you're using VSCode or something based on VSCode (e.g. Cursor), we would appreciate it if
						you could send us a zip of your timeline folder. This should be at:
					</p>
					<ul>
						<li><strong>Windows:</strong> <code>C:\Users\&lt;YourUsername&gt;\AppData\Roaming\Code\User\History</code></li>
						<li><strong>Linux:</strong> <code>~/.config/Code/User/History</code></li>
						<li><strong>MacOS:</strong> <code>~/Library/Application Support/Code/User/History</code></li>
					</ul>
				</div>
				<p>
					If you're using a different editor, we would appreciate a timelapse of your screen while coding.
					If you're working through your timelapse, then your Hackatime activity should line up with your
					previous activity.
				</p>
				<p>
					If you were banned for a conduct violation and believe it was a mistake, reach out and walk us
					through what happened from your side - context matters, and we'll take another look.
				</p>
			</section>

			<section>
				<h2>Who do I contact?</h2>
				<p>Where to send your appeal depends on which ban you're dealing with:</p>
				<div class="path-info">
					<ul>
						<li>
							<strong>Banned from Hackatime?</strong> Reach out to the fraud squad - your ban applies
							across Hack Club programs, so it needs to be resolved with them directly.
						</li>
						<li>
							<strong>Just banned from Beest?</strong> Message <strong>@euanripper</strong> on the Hack
							Club Slack and we can talk it through.
						</li>
					</ul>
				</div>
			</section>

			<p class="final-note">
				To reiterate: we're all humans. We're always open to discussing the specifics of your punishment on a
				case-by-case basis - all that we ask for is your honesty.
			</p>
		</main>
	</div>
</div>

<style>
	.fraud-page {
		--background-color: #121212;
		--surface-color: #1e1e1e;
		--primary-text-color: #e0e0e0;
		--secondary-text-color: #a0a0a0;
		--accent-color: #ec3750;
		--code-bg-color: #2a2a2a;

		min-height: 100vh;
		background-color: var(--background-color);
		color: var(--primary-text-color);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		line-height: 1.7;
		font-size: 16px;
	}

	.container {
		max-width: 720px;
		margin: 0 auto;
		padding: 4rem 1.5rem;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.icon {
		color: var(--accent-color);
		width: 64px;
		height: 64px;
		margin: 0 auto 1rem;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.2;
		margin: 0 0 1rem 0;
	}

	h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--accent-color);
		margin-top: 3rem;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--surface-color);
	}

	h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #ffffff;
		margin-top: 2rem;
		margin-bottom: 0.5rem;
	}

	p {
		margin-bottom: 1.5rem;
		color: var(--primary-text-color);
	}

	.intro-text {
		font-size: 1.1rem;
		color: var(--secondary-text-color);
		max-width: 90%;
		margin: 0 auto;
	}

	ul {
		list-style: none;
		padding-left: 0;
	}

	li {
		position: relative;
		padding-left: 25px;
		margin-bottom: 1rem;
	}

	li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--accent-color);
		font-size: 1.5rem;
		line-height: 1;
	}

	a {
		color: var(--accent-color);
		text-decoration: underline;
	}

	code {
		background-color: var(--code-bg-color);
		border-radius: 4px;
		padding: 0.2em 0.4em;
		font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
		font-size: 0.9em;
		color: #f0f0f0;
		display: inline-block;
		word-break: break-all;
	}

	.path-info {
		background-color: var(--surface-color);
		border-left: 4px solid var(--accent-color);
		padding: 0.5rem 1.5rem;
		border-radius: 0 8px 8px 0;
		margin: 1.5rem 0;
	}

	.final-note {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid var(--surface-color);
		color: var(--secondary-text-color);
		font-style: italic;
		text-align: center;
	}

	@media (max-width: 600px) {
		h1 {
			font-size: 2rem;
		}
		.container {
			padding: 2rem 1rem;
		}
	}
</style>
