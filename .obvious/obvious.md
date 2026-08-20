# FlatFilers/test-repo — SKMZ

Web app for querying programmers by their skills via a GraphQL API.
Upstream demo project: [Shpota/skmz](https://github.com/Shpota/skmz).

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend | Go + gqlgen (GraphQL) | `server/go.mod` declares `go 1.13`; builds fine with Go 1.23.4 |
| Database | MongoDB | compose uses `mongo:4.2.2`; sandbox runs 7.0.14 (driver-compatible) |
| Frontend | React 16 + Create React App + Apollo | `react-scripts 3.3.0` (webpack 4 era) |
| CI | Travis (`.travis.yml`) | `go test` in `server/`, `npm test` in `webapp/` |

## Commands

### 1. Infrastructure — MongoDB on :27017

With Docker (repo-canonical):
```sh
docker-compose -f docker-compose-dev.yml up
```

In this sandbox (no Docker; mongod 7.0.14 + mongosh 2.3.8 preinstalled):
```sh
mkdir -p /home/user/mongodb-data
/opt/mongodb/bin/mongod --dbpath /home/user/mongodb-data --port 27017 \
  --bind_ip 127.0.0.1 --logpath /home/user/mongod.log --fork
/opt/mongosh/bin/mongosh "mongodb://127.0.0.1:27017/programmers" \
  --quiet --file server/db/mongo.init   # seed 8 programmers (fresh dbpath only)
```

### 2. Backend — GraphQL API on :8080

```sh
cd server
go run server.go    # or: go build -o /tmp/skmz-server . && /tmp/skmz-server
```
- Endpoint: `POST http://localhost:8080/query` · Playground: http://localhost:8080/playground
- Mongo host is `localhost:27017` unless env `profile=prod` (then `db:27017`, CORS off)

### 3. Frontend — CRA dev server on :3000

```sh
cd webapp
npm ci
NODE_OPTIONS=--openssl-legacy-provider npm start   # flag required on Node >= 17
```
- API URL comes from `webapp/.env.development` → `REACT_APP_API_URL=http://localhost:8080`

### Tests

```sh
cd server && go test ./...
cd webapp && CI=true NODE_OPTIONS=--openssl-legacy-provider npx react-scripts test --watchAll=false
```

### Sample GraphQL query

```graphql
query { programmers(skill: "go") { name title company skills { name icon importance } } }
```

## Environment variables

| Var | Scope | Dev value | Notes |
|---|---|---|---|
| `REACT_APP_API_URL` | webapp build | `http://localhost:8080` | set in `webapp/.env.development` |
| `profile` | server runtime | unset | `prod` only inside docker-compose (Mongo host `db`, CORS off) |

No secrets are required to run locally.

## Codebase map

See [codebase-map.md](codebase-map.md).

## Sandbox snapshot

| Field | Value |
|---|---|
| Snapshot ID | `z1a0bkhg3fc6jiruhsly:default` |
| Captured | 2026-08-20T21:02:24.710Z |
| Baked in | Go 1.23.4 (`/usr/local/go`), MongoDB 7.0.14 (`/opt/mongodb`), mongosh (`/opt/mongosh`), `webapp/node_modules`, Go module/build caches, seeded Mongo data (`/home/user/mongodb-data`), Playwright + Chromium (`/home/user/e2e`), evidence screenshots (`/home/user/evidence`) |

Processes do not survive a snapshot resume — restart mongod, server, and webapp with the commands above.

## Local Verification Summary

**Status: HEALTHY — verified 2026-08-20 (UTC).**

| Check | Result |
|---|---|
| MongoDB :27017 | up; `programmers.programmers` holds 8 seeded docs |
| GraphQL API :8080 | `POST /query` with `programmers(skill:"go")` → 2 matches (Tobi Schmidt, Bob Dogman); `/playground` → HTTP 200 |
| Webapp :3000 | dev server compiled successfully; HTTP 200 |
| Primary user flow (browser) | Playwright + headless Chromium: initial load renders all 8 programmer cards; typing `go` in the search box filters to 2; **0 console errors** |
| Go tests | `go test ./...` — ok for all 4 packages containing tests |
| Webapp tests | 3/3 passed across 2 Jest suites (`App.test.js`, `Skill.test.js`) |
| Evidence | `/home/user/evidence/webapp-initial.png`, `/home/user/evidence/webapp-filtered-go.png` |

Known non-blocking issues:
- `go vet ./...` reports pre-existing "composite literal uses unkeyed fields" warnings in `server/db` (vet is not a CI gate; `.travis.yml` runs `go test` only).
- `react-scripts 3.3.0` predates Node 17; the OpenSSL legacy provider flag is mandatory on modern Node.
