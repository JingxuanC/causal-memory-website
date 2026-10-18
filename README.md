# causal-memory website

Official website for [causal-memory](https://github.com/JingxuanC/causal-memory) — an agent memory system with a causal core.

**Stack:** Next.js 16 (App Router) · Tailwind CSS 4 · Auth.js v5 (GitHub OAuth) · Prisma 6 + SQLite · gray-matter/remark for content

## Pages

| Route | What |
|---|---|
| `/` | Landing — hero, compaction-survival, capability matrix, CausalEval summary, 3-step quickstart |
| `/docs/*` | Documentation (markdown in `content/docs/`, frontmatter `order` controls the sidebar) |
| `/benchmarks` | CausalEval + fact-recall + capability test results |
| `/playground` | Interactive engine visualizations (iframes from `public/playground/`) |
| `/blog/*` | Blog posts (markdown in `content/blog/`) with comments (GitHub sign-in required) |
| `/book/*` | 《高性价比人生指南》online reading (markdown in `content/book/`, CC BY 4.0 from [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter)) with per-chapter comments and AI chat (sign-in required; user's BYOK key, or deployment-level `AI_API_KEY`) |
| `/pricing` | Open-core tiers: Community / Cloud / Enterprise |
| `/dashboard` | Cloud dashboard — GitHub sign-in, personal API token create/revoke |

## Local development

```bash
npm install
cp .env.example .env
# Fill in AUTH_SECRET (openssl rand -base64 32), AUTH_GITHUB_ID, AUTH_GITHUB_SECRET
npx prisma db push
npm run dev
```

### GitHub OAuth App setup (required for sign-in)

GitHub does not allow creating OAuth Apps via CLI, so do this once manually:

1. Go to https://github.com/settings/developers → **New OAuth App**
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID / Secret into `.env` as `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`

For production, create a second OAuth App with the production domain and set the env vars in your hosting platform.

## Environment variables

See [.env.example](.env.example). `DATABASE_URL` defaults to SQLite (`file:./dev.db`); for production use Postgres (Neon / Vercel Postgres) and update `prisma/schema.prisma`'s datasource provider accordingly.

## Alpha Desk product page

`/alpha-desk` is the public download + Pro application page. It reuses the
existing key-request pipeline:

1. Download: `GET /api/alpha-desk/download` streams `ALPHA_DESK_ZIP_PATH`
   (or redirects to `ALPHA_DESK_DOWNLOAD_URL`).
2. Apply: the page submits to the existing `/api/key-request` proxy with
   groups `alpha,memory`.
3. Claim: `POST /api/alpha-desk/claim` picks up the approved mcphub cloud key
   once, embeds it in an offline-signed `ADK1.…` license, and returns it. The
   cloud key is never stored by the website.

Deployment variables (see `.env.example`):

```bash
ALPHA_DESK_ZIP_PATH=/app/data/alpha-desk-0.1.2-dev.zip
ALPHA_LICENSE_PRIVATE_KEY_PATH=/app/secrets/alpha-license-private.pem
ALPHA_LICENSE_PUBLIC_KEY_PATH=/app/secrets/alpha-license-public.pem
ALPHA_LICENSE_DAYS=365
```

The private key is the same keypair as `alpha-desk/product/license/public.pem`.
Mount it read-only; do not commit it. Offline licenses cannot be revoked, so a
leaked signing key is equivalent to a leaked license mint. If that risk is not
acceptable, replace the claim route with a manual signing step.

Deploy on the host that serves causal-memory.com:

```bash
# local: upload the release and the signing keypair
scp alpha-desk-0.1.2-dev.zip root@47.90.253.85:/opt/causal-memory-website/data/
scp ec-private.pem root@47.90.253.85:/opt/causal-memory-website/secrets/alpha-license-private.pem
scp public.pem   root@47.90.253.85:/opt/causal-memory-website/secrets/alpha-license-public.pem

# server: pull, configure, rebuild
cd /opt/causal-memory-website
git pull
chmod 600 secrets/alpha-license-private.pem
cat >> .env <<'EOF'
ALPHA_DESK_ZIP_PATH=/app/data/alpha-desk-0.1.2-dev.zip
ALPHA_LICENSE_PRIVATE_KEY_PATH=/app/secrets/alpha-license-private.pem
ALPHA_LICENSE_PUBLIC_KEY_PATH=/app/secrets/alpha-license-public.pem
ALPHA_LICENSE_DAYS=365
EOF
docker compose up -d --build
```

The existing live `/api/key-request` proxy already reaches quota-platform, so
the apply and claim flow uses the same approval queue.

## Docker deployment (self-hosted server)

```bash
cp .env.example .env   # fill AUTH_SECRET, AUTH_GITHUB_ID/SECRET, ADMIN_EMAILS, AUTH_URL
docker compose up -d --build
```

- SQLite data persists in `./data` (volume → `/app/data`)
- Blog/docs markdown lives in `./content` (volume → `/app/content`) — **dropping a new `.md` file into `content/blog/` publishes it immediately, no rebuild/restart**
- Admins (emails in `ADMIN_EMAILS`) can also publish posts from the browser at `/dashboard`
- Schema setup runs automatically on container start (`prisma db push`)

Put Caddy or nginx in front for TLS:

```
# Caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

Remember to create a production GitHub OAuth App whose callback URL is
`https://your-domain.com/api/auth/callback/github`, and set `AUTH_URL=https://your-domain.com`.

## Content editing

- Docs: add/edit `content/docs/*.md` (frontmatter: `title`, `description`, `order`)
- Blog: add/edit `content/blog/*.md` (frontmatter: `title`, `date`, `description`)
- Demo assets live in `public/demo/`, playground HTML in `public/playground/`

## Cloud endpoint (roadmap)

The dashboard issues real per-user API tokens (SHA-256 hashed at rest, shown once). The hosted memory endpoint itself is a separate deployment: run the main repo's HTTP transport (`causal-memory http --port 9938`) behind a proxy that maps these bearer tokens to per-user stores.
