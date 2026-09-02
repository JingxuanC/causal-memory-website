#!/bin/sh
set -e
# Create/migrate the SQLite schema on first boot (idempotent)
./node_modules/.bin/prisma db push --skip-generate
exec node server.js
