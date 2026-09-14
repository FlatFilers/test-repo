---
name: local-dev
description: Bring up and verify the SKMZ dev stack (MongoDB 4.2.2, Go GraphQL API on :8080, React dev server on :3000) inside this repo sandbox
---

# Local Dev — SKMZ (FlatFilers/test-repo)

Durable record of the LOCAL-DEV onboarding run on 2026-08-24. Everything below was
executed and verified in this sandbox (snapshot `o47x9alpu4yuzhv0zp5k:default`).

## Sandbox environment (provisioned in the snapshot)

- Go 1.27.0 at `/usr/local/go` (`go` on PATH); modules cached in `~/go/pkg/mod`
- Node v20.20.2 / npm 10.8.2; webapp deps installed with `npm ci --legacy-peer-deps`
- MongoDB 4.2.2 (debian10 build) at `/opt/mongodb`, `mongod`/`mongo` on PATH;
  `libssl1.1` installed from the Debian archive (required by mongod 4.2)
- Chromium installed for headless-browser evidence
- No Docker daemon — MongoDB runs natively instead of
  `docker-compose -f docker-compose-dev.yml up` (same 4.2.2 version)
- Data dir `/home/user/mongodb-data` (persisted, already seeded with 8 programmers)

## Start the stack

1. MongoDB:

   ```sh
   mongod --dbpath /home/user/mongodb-data --bind_ip 127.0.0.1 --port 27017 \
     --logpath /home/user/mongodb-data/mongod.log --fork
   ```

   Re-seed if empty: `mongo --quiet localhost:27017/programmers server/db/mongo.init`

2. API (expects MongoDB on localhost:27017; do NOT set `profile=prod` in dev):

   ```sh
   cd server && go run server.go    # listens on :8080
   ```

3. Webapp:

   ```sh
   cd webapp
   NODE_OPTIONS=--openssl-legacy-provider BROWSER=none npm start   # listens on :3000
   ```

   `NODE_OPTIONS=--openssl-legacy-provider` is required: react-scripts 3.3.0
   (webpack 4) fails on Node 20 / OpenSSL 3 with `ERR_OSSL_EVP_UNSUPPORTED` otherwise.

## Verify

```sh
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/playground   # 200
curl -s -X POST http://localhost:8080/query -H 'Content-Type: application/json' \
  -d '{"query":"{ programmers(skill: \"go\") { name company } }"}'
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/             # 200
```

## Tests and checks

```sh
cd server && go test -race ./...                                              # all PASS
cd webapp && CI=true NODE_OPTIONS=--openssl-legacy-provider npm test -- --watchAll=false   # 3/3 PASS
cd webapp && NODE_OPTIONS=--openssl-legacy-provider npm run build             # build OK
```

`go vet ./...` reports pre-existing "unkeyed fields" warnings in `server/db`
(`bson.D` literals) — informational only; `go test` passes.

## Evidence captured on 2026-08-24

- GraphQL `programmers(skill: "go")` → Tobi Schmidt (Amazon), Bob Dogman (Doggy Inc.);
  `skill: "java"` → 6 programmers; `/playground` → HTTP 200
- Headless Chromium screenshot of http://localhost:3000/ — all 8 seeded programmers
  rendered in the DOM (`/home/user/evidence/webapp-home.png`)
- `go test -race ./...` — PASS for `main`, `cors`, `db`, `gql` packages
- Webapp Jest — 2 suites / 3 tests PASS
- `npm run build` — production build succeeds
