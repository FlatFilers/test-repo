# FlatFilers/test-repo — SKMZ

Agent guidance for working in this repository. Written by the Obvious onboarding run on
2026-08-24 after a verified local-dev bring-up in the repo sandbox. See
`.obvious/codebase-map.md` for the folder map and `.obvious/skills/local-dev/SKILL.md`
for full sandbox bring-up steps.

## Repository

SKMZ — a web application for querying programmers by their skills via a GraphQL API.
Go + gqlgen backend, React frontend, MongoDB storage. Upstream project: github.com/Shpota/skmz.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Go, module `github.com/shpota/skmz` | `go 1.13` directive; built with Go 1.27 in sandbox |
| GraphQL | 99designs/gqlgen | v0.10.2 |
| DB driver | go.mongodb.org/mongo-driver | v1.5.1 |
| Database | MongoDB | 4.2.2 (per compose files) |
| Frontend | React via Create React App | react 16.12, react-scripts 3.3.0 |
| Web data layer | apollo-boost + @apollo/react-hooks | ~0.4.7 / ~3.1.3 |
| Styling | Materialize CSS + Font Awesome | loaded from CDN in `webapp/public/index.html` |

## Services and ports

| Service | Port | Notes |
|---|---|---|
| Go GraphQL API | 8080 | `/query` (GraphQL endpoint), `/playground` (GraphQL Playground) |
| MongoDB | 27017 | database `programmers`, collection `programmers` |
| React dev server | 3000 | calls the API directly at `REACT_APP_API_URL` |

## Commands

Verified in the repo sandbox on 2026-08-24. Run from the repo root unless noted.

| Task | Command |
|---|---|
| Start dev MongoDB (canonical, needs Docker) | `docker-compose -f docker-compose-dev.yml up` |
| Start dev MongoDB (this sandbox, no Docker) | `mongod --dbpath /home/user/mongodb-data --bind_ip 127.0.0.1 --port 27017 --logpath /home/user/mongodb-data/mongod.log --fork` |
| Seed MongoDB | `mongo --quiet localhost:27017/programmers server/db/mongo.init` |
| Start API | `cd server && go run server.go` (listens on :8080) |
| Start webapp | `cd webapp && npm install && npm start` (listens on :3000; on Node >= 17 prefix with `NODE_OPTIONS=--openssl-legacy-provider`) |
| Server tests | `cd server && go test -race ./...` |
| Webapp tests | `cd webapp && CI=true npm test -- --watchAll=false` |
| Webapp production build | `cd webapp && npm run build` |
| Full production stack (needs Docker) | `docker-compose up` → http://localhost:8080 |

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `profile` | server | `prod` → Mongo at `mongodb://db:27017` (compose network); unset/other → `mongodb://localhost:27017` and CORS disabled for dev. Not a secret. |
| `REACT_APP_API_URL` | webapp | API base URL. Committed: `http://localhost:8080` in `webapp/.env.development`, empty in `.env.production` (same-origin). |

No secrets or credentials are required for local development.

## Codebase map

See `.obvious/codebase-map.md`. Summary: `server/` is the Go GraphQL API (entrypoint
`server.go`; packages `db`, `gql` + generated `gql/gen`, `cors`, `model`); `webapp/` is
the React CRA app (components under `src/programmers`, `src/search`, `src/skills`);
infra at the root: `Dockerfile`, `docker-compose.yml` (prod), `docker-compose-dev.yml`
(dev DB), `.travis.yml` (CI).

## Primary user flow

Search programmers by skill: the React app (http://localhost:3000) sends
`programmers(skill: ...)` to the GraphQL API at `http://localhost:8080/query`, which
regex-matches `skills.name` (case-insensitive prefix match) in MongoDB and renders the
matching programmer cards. The same query can be run in the GraphQL Playground at
http://localhost:8080/playground.

## Local Verification Summary

Verified in the repo sandbox on 2026-08-24 (reproduction steps in
`.obvious/skills/local-dev/SKILL.md`):

- MongoDB 4.2.2 running on 127.0.0.1:27017; `programmers.programmers` seeded with 8
  records from `server/db/mongo.init`.
- GraphQL API on :8080 — `POST /query` with `programmers(skill: "go")` returned 2
  results (Tobi Schmidt, Bob Dogman); `skill: "java"` returned 6 results;
  `/playground` returned HTTP 200.
- React dev server on :3000 — compiled successfully, HTTP 200; headless Chromium
  rendered the app and all 8 seeded programmers appeared in the DOM (screenshot:
  `/home/user/evidence/webapp-home.png`).
- `go test -race ./...` (server) — all packages PASS.
- `CI=true npm test -- --watchAll=false` (webapp) — 2 suites, 3 tests PASS.
- `npm run build` (webapp) — production build succeeds.

## Sandbox snapshot

- Snapshot ID: `o47x9alpu4yuzhv0zp5k:default`
- Captured: 2026-08-24T15:33:37Z
- State: Go 1.27 and Node 20 installed, webapp deps installed, MongoDB 4.2.2 seeded
  and running, API and webapp dev servers running.

## Known quirks

- `go vet ./...` reports pre-existing "unkeyed fields" warnings in `server/db`
  (`bson.D` literals) — warnings only; `go test` passes.
- `server.go` serves static files from `/webapp` (production container layout); in
  local dev the frontend runs separately on :3000.
- react-scripts 3.3.0 (webpack 4) needs `NODE_OPTIONS=--openssl-legacy-provider` on
  Node >= 17, otherwise the dev server fails with `ERR_OSSL_EVP_UNSUPPORTED`.
- The sandbox has no Docker daemon; run MongoDB natively as shown above (same 4.2.2
  version as the compose files).
