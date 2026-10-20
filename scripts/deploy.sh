#!/usr/bin/env bash
# Deploy the website: backup DB -> build -> verify assets -> restart systemd
# unit -> health check (HTML + CSS) -> rollback to the previous build on failure.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/causal-memory-website}"
SERVICE="${SERVICE:-causal-memory-web}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"

cd "$APP_DIR"
ts="$(date +%Y%m%d-%H%M%S)"
log="/tmp/site-deploy-$ts.log"
echo "[deploy] $(git log --oneline -1 2>/dev/null || true)"

mkdir -p "$BACKUP_DIR"
if [ -f prisma/dev.db ]; then
  cp prisma/dev.db "$BACKUP_DIR/dev.db.$ts"
  echo "[1/5] db backed up: $BACKUP_DIR/dev.db.$ts"
else
  echo "[1/5] no prisma/dev.db, skipping db backup"
fi

if [ -d .next ]; then
  rm -rf .next.prev
  cp -a .next .next.prev
  echo "[2/5] previous build kept in .next.prev"
fi

echo "[3/5] building (log: $log)"
if ! npm run build >"$log" 2>&1; then
  echo "[deploy] BUILD FAILED — tail:"
  tail -20 "$log"
  [ -d .next.prev ] && { rm -rf .next; mv .next.prev .next; echo "[deploy] restored previous build"; }
  exit 1
fi

[ -f .next/BUILD_ID ] || { echo "[deploy] missing .next/BUILD_ID"; exit 1; }
if ! find .next/static -name '*.css' | head -1 | grep -q .; then
  echo "[deploy] build produced no CSS chunks"; exit 1
fi

echo "[4/5] restarting $SERVICE"
systemctl restart "$SERVICE"

echo "[5/5] health check"
ok=0
for _ in $(seq 1 25); do
  code="$(curl -s -o /tmp/deploy-health.html -w '%{http_code}' "$HEALTH_URL" || true)"
  if [ "$code" = "200" ]; then
    css="$(grep -oE '/_next/static/chunks/[^" ]+\.css' /tmp/deploy-health.html | head -1 || true)"
    if [ -n "$css" ]; then
      css_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000$css" || true)"
      if [ "$css_code" = "200" ]; then ok=1; break; fi
    fi
  fi
  sleep 1
done

if [ "$ok" != "1" ]; then
  echo "[deploy] HEALTH CHECK FAILED — rolling back"
  if [ -d .next.prev ]; then
    rm -rf .next
    mv .next.prev .next
    systemctl restart "$SERVICE"
    sleep 5
    echo "[deploy] rolled back to previous build"
  fi
  exit 1
fi

echo "[deploy] OK — $HEALTH_URL 200, css 200"
