#!/bin/bash
set -e

if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
	exit 0
fi

echo "==> Checking gh authentication..."
gh auth status || { echo "ERROR: gh not authenticated"; exit 1; }

if [ ! -d "node_modules" ]; then
	echo "==> Installing dependencies..."
	corepack enable && pnpm install
else
	echo "==> Dependencies already installed, skipping."
fi

echo "==> Fetching .env from Gist..."
gh gist view e17877eb0ee23f89dbcc160ed594629e --raw > .env || { echo "ERROR: Failed to fetch .env"; exit 1; }

echo "==> Applying DB migrations..."
pnpm db:apply:local

echo "==> Remote setup complete."
