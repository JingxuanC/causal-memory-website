-- Idempotent backfill for deployments that upgrade with `prisma db push`
-- (the Docker entrypoint runs this after db push). Adds no secrets.
UPDATE "ApiToken" SET "tenant" = 'u_' || "userId" WHERE "tenant" = '' OR "tenant" IS NULL;

INSERT OR IGNORE INTO "TenantAlias" ("legacyTenant", "tenant", "userId", "note")
SELECT "email", 'u_' || "id", "id", 'backfill: current email'
FROM "User"
WHERE "email" IS NOT NULL AND "email" <> '';
