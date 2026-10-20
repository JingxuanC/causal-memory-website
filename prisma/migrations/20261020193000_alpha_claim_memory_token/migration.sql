-- Cloud-memory Pro claim: tenant-bound ApiToken, LicenseClaim ledger,
-- BridgeOutbox retry queue and TenantAlias compatibility map.
--
-- SQLite. Existing production databases were created with `prisma db push`
-- and have no _prisma_migrations table; see docs/CLOUD-MEMORY-PRO-CLAIM.md
-- for the db-push + backfill path. This file is the canonical schema change
-- for a fresh `prisma migrate deploy` database.

ALTER TABLE "ApiToken" ADD COLUMN "tenant" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ApiToken" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "ApiToken" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'dashboard';

-- Existing tokens keep working: canonicalise every legacy row to u_<userId>.
UPDATE "ApiToken" SET "tenant" = 'u_' || "userId" WHERE "tenant" = '';

CREATE INDEX "ApiToken_userId_revokedAt_idx" ON "ApiToken"("userId", "revokedAt");
CREATE INDEX "ApiToken_expiresAt_idx" ON "ApiToken"("expiresAt");

CREATE TABLE "LicenseClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reqNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenant" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "features" TEXT NOT NULL DEFAULT '[]',
    "memoryGranted" BOOLEAN NOT NULL DEFAULT false,
    "memoryTokenId" TEXT,
    "alphaKeyId" TEXT NOT NULL DEFAULT '',
    "alphaKeyName" TEXT NOT NULL DEFAULT '',
    "licenseSha256" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorCode" TEXT NOT NULL DEFAULT '',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LicenseClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LicenseClaim_memoryTokenId_fkey" FOREIGN KEY ("memoryTokenId") REFERENCES "ApiToken" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LicenseClaim_reqNo_key" ON "LicenseClaim"("reqNo");
CREATE UNIQUE INDEX "LicenseClaim_memoryTokenId_key" ON "LicenseClaim"("memoryTokenId");
CREATE INDEX "LicenseClaim_userId_idx" ON "LicenseClaim"("userId");
CREATE INDEX "LicenseClaim_status_idx" ON "LicenseClaim"("status");

CREATE TABLE "BridgeOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "op" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tenant" TEXT NOT NULL DEFAULT '',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);
CREATE INDEX "BridgeOutbox_processedAt_createdAt_idx" ON "BridgeOutbox"("processedAt", "createdAt");

CREATE TABLE "TenantAlias" (
    "legacyTenant" TEXT NOT NULL PRIMARY KEY,
    "tenant" TEXT NOT NULL,
    "userId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "TenantAlias_tenant_idx" ON "TenantAlias"("tenant");

-- Known legacy mapping: the current GitHub email -> canonical u_<id> tenant.
INSERT OR IGNORE INTO "TenantAlias" ("legacyTenant", "tenant", "userId", "note")
SELECT "email", 'u_' || "id", "id", 'backfill: current email'
FROM "User"
WHERE "email" IS NOT NULL AND "email" <> '';
