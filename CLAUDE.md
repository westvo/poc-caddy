# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A standalone proof-of-concept (own git repo, not part of the parent `crm` monorepo's workflow) that
validates **custom-domain routing for SellersStar**: a customer adds their own hostname, verifies
ownership (DNS TXT record or HTTP file), and traffic to that hostname gets reverse-proxied to the
backend, while the management UI (`localhost` / the server's own IP) is routed to the frontend
instead. Caddy is the piece under test — most of the iteration in this repo's history is Caddyfile
routing fixes, not application code.

Three services, run via Docker Compose behind Caddy:

- `be/project-name` — NestJS backend: custom-domain CRUD + verification API, and the catch-all
  "hello" responder that custom domains ultimately hit.
- `fe/my-app` — Next.js 16 (App Router) frontend: currently the default `create-next-app` scaffold,
  serving as the "management UI" target in the routing test.
- `Caddyfile` + `docker-compose.yml` at the repo root — TLS-terminating reverse proxy in front of both.

## Commands

Backend (`be/project-name/`):
```bash
pnpm start:dev      # watch mode, port 5000 by default (PORT env overrides)
pnpm build
pnpm lint            # eslint --fix
pnpm test            # jest unit tests
pnpm test:e2e
```

Frontend (`fe/my-app/`):
```bash
pnpm dev             # next dev
pnpm build
pnpm lint
```

Full stack via Docker (from repo root):
```bash
docker compose up --build
```
This builds `be/project-name` (port 3000 internally) and `fe/my-app` (port 3001 internally) and
fronts them with Caddy on port 80. Caddy config is bind-mounted from the root `Caddyfile`, so edits
take effect on `docker compose restart caddy` without rebuilding the app images.

There is no top-level script that runs both apps together outside Docker — start `be/project-name`
and `fe/my-app` in separate terminals for local (non-Docker) dev.

## Architecture: routing logic

The Caddyfile (root) is the source of truth for which host goes where, and it encodes three cases
that must stay in sync with each other:

1. **Management hosts** (`localhost`, and the server's own IP, currently hardcoded as
   `222.255.214.97`) → routed to `frontend:3001`, except `/custom-domains*` which always goes to
   `api:3000`.
2. **Catch-all `:80`** → any *other* Host header (i.e. a verified customer's custom domain) is routed
   to `api:3000`, which currently just echoes `hello <host>`. The catch-all explicitly excludes the
   management hosts via a `@management host localhost <server-ip>` matcher so it doesn't shadow case 1.
3. `/custom-domains*` and `/.well-known/sellersstar-verify.txt` are always backend routes regardless
   of host, since domain verification must work before/without the frontend being involved.

When changing routing, the server's IP is duplicated in two places in the Caddyfile (its own site
block, and the `@management` matcher in the catch-all block) — keep them consistent, and check
`docker-compose.yml` / commit history for why hardcoding was chosen over a dynamic solution here.

## Architecture: backend domain flow

`be/project-name/src/`:
- `custom-domain.entity.ts` — `CustomDomain` shape: `status` (`pending` → `verified`/`failed`),
  `verification_method` (`txt` | `file`), `verification_token`.
- `custom-domain.service.ts` — in-memory `Map<id, CustomDomain>`, persisted to a flat JSON file
  (`domains.json`, path resolved via `__dirname` — see the `api_domains` volume mount in
  `docker-compose.yml` for how this survives container restarts) rather than a real database. TXT/file
  verification are **simulated** for the POC (`checkTxtRecord`/`checkVerificationFile` just check the
  token is on record, they don't do real DNS/HTTP lookups).
- `custom-domain.controller.ts` — CRUD + `POST :id/verify` + `GET :id/dns-instructions` (the latter
  also resolves and normalizes the caller's server IP for display, stripping Docker-internal ranges).
- `verification.controller.ts` — serves `/.well-known/sellersstar-verify.txt`, looking up the token by
  the incoming `Host` header (this is what `file` verification and the catch-all routing above are
  ultimately exercising).
- `app.controller.ts` — the catch-all's default response (`hello <host>`), standing in for "the actual
  product page for this custom domain."

There's no real database, auth, or module structure here — everything lives directly under `src/`
without the module-per-domain convention used in the main CRM backend.

## Relationship to the parent `crm` monorepo

This directory is its own git repository nested inside `crm/code/`. It does **not** share the parent
project's package manager workspace, lint config, or the module-based NestJS conventions documented
in the parent `crm/CLAUDE.md` (that guidance is for `crm/code/be` and `crm/code/fe`, not this POC).
Treat commands, dependencies, and structure here as independent of the parent repo.
