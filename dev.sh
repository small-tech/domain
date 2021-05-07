#!/bin/bash

# Start Site.js
site &

# Start SvelteKit dev server in the background.
NODE_TLS_REJECT_UNAUTHORIZED=0 npx svelte-kit dev

# Kill the background Site.js process
pkill -P $$
