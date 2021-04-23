#!/bin/bash
set -e

# Build the SvelteKit source so we start with the latest.
npm run build

# Start SvelteKit dev server in the background.
npx svelte-kit dev &

# Give SvelteKit time to write out its initial output
# so that it doesn’t obstruct the sudo prompt
# from Site.js (if any).
sleep 0.5

# Start Site.js
site

# Kill the background SvelteKit process
pkill -P $$
