#!/bin/sh
set -e
# Create/migrate the SQLite schema on first boot (idempotent).
./node_modules/.bin/prisma db push --skip-generate
# db push adds the tenant column; backfill it and the read-compat alias map.
# The SQL is idempotent and safe to run on every boot.
./node_modules/.bin/prisma db execute --file prisma/backfill-tenants.sql --schema prisma/schema.prisma
exec node server.js
