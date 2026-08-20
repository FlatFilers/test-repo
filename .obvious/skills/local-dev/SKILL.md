---
name: local-dev
description: Bring up and verify the SKMZ dev stack (MongoDB + Go GraphQL server + React webapp) in this repo sandbox
---

# Local Dev — SKMZ (FlatFilers/test-repo)

Durable record of the onboarding run on 2026-08-20. The sandbox has **no Docker**;
MongoDB, Go, and mongosh are preinstalled from the snapshot. Node is v20.

## Bring-up sequence

```sh
# 1. MongoDB :27017 (data dir already seeded in the snapshot)
mkdir -p /home/user/mongodb-data
/opt/mongodb/bin/mongod --dbpath /home/user/mongodb-data --port 27017 \
  --bind_ip 127.0.0.1 --logpath /home/user/mongod.log --fork
# re-seed only if the dbpath is fresh:
/opt/mongosh/bin/mongosh "mongodb://127.0.0.1:27017/programmers" \
  --quiet --file server/db/mongo.init

# 2. Backend :8080
export PATH=/usr/local/go/bin:$PATH
cd server && go run server.go     # first build downloads modules (cached in snapshot)

# 3. Frontend :3000
cd webapp && NODE_OPTIONS=--openssl-legacy-provider npm start
```

## Gotchas learned during onboarding

- **Node >= 17 + react-scripts 3.3.0**: webpack 4 hashing breaks with OpenSSL 3.
  Always prefix webapp commands with `NODE_OPTIONS=--openssl-legacy-provider`
  (`npm start`, `npm test`, `npm run build`).
- **Use `npm ci`, not `npm install`**, to avoid rewriting the v1 lockfile and dirtying the tree.
- **Go**: repo declares `go 1.13`; Go 1.23.4 (at `/usr/local/go/bin`) compiles and tests it cleanly.
- **`go vet ./...` fails** on pre-existing "unkeyed fields" warnings in `server/db` — not a CI gate
  (`.travis.yml` runs `go test` only). Do not "fix" this in passing.
- **mongo-driver v1.5.1 vs MongoDB 7.0**: works fine (OP_MSG + legacy handshake).
- **Server static route**: `http.Handle("/", http.FileServer(http.Dir("/webapp")))` 404s outside
  Docker — expected in local dev; only `/query` and `/playground` matter.
- **`profile` env var**: unset locally → Mongo host `localhost`, CORS enabled. Set `prod` only in compose.
- Background dev servers keep an exec call open — start them with
  `nohup ... > log 2>&1 < /dev/null &` and poll the port in a follow-up call.

## Verification checklist (all green on 2026-08-20)

1. `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/playground` → `200`
2. `curl -s -X POST http://localhost:8080/query -H 'Content-Type: application/json' \
   -d '{"query":"{ programmers(skill: \"go\") { name company } }"}'` → 2 programmers
3. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → `200`
4. `cd server && go test ./...` → ok
5. `cd webapp && CI=true NODE_OPTIONS=--openssl-legacy-provider npx react-scripts test --watchAll=false` → 3/3
6. Browser flow (Playwright + Chromium in `/home/user/e2e`, script `verify.mjs`):
   load :3000 → 8 programmer cards; type `go` in `#search_string` → 2 cards; 0 console errors.
   Screenshots land in `/home/user/evidence/`.

## Tooling locations (from snapshot)

| Tool | Path |
|---|---|
| Go 1.23.4 | `/usr/local/go/bin/go` |
| mongod 7.0.14 | `/opt/mongodb/bin/mongod` |
| mongosh 2.3.8 | `/opt/mongosh/bin/mongosh` |
| Playwright + Chromium | `/home/user/e2e` (node_modules + `~/.cache/ms-playwright`) |
| Mongo data | `/home/user/mongodb-data` (seeded) |
| Server/webapp logs | `/home/user/server.log`, `/home/user/webapp.log` |
