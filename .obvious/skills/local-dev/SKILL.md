---
name: local-dev
description: How to run the SKMZ dev stack (Go GraphQL API, React webapp, MongoDB) in this sandbox
---

# Local Dev — SKMZ (FlatFilers/test-repo)

Durable record of the onboarding run (2026-08-21). The sandbox has **no Docker
daemon**, so all services run as native processes. Everything below was verified
working at snapshot time (`tv44i8cyka59wvy2szyh:default`).

## What is installed (baked into the snapshot)

- Go 1.23.4 → `/usr/local/go` (`go` on PATH)
- MongoDB 4.2.2 (official debian10 tarball) → `/usr/local/mongodb-linux-x86_64-debian10-4.2.2/`
  with `mongod` + `mongo` symlinked into `/usr/local/bin`; `libssl1.1` installed from
  the Debian bullseye archive (the debian10 build links against it)
- Chromium (apt) for headless verification and screenshots
- webapp `node_modules` installed with npm 10.8.2 / Node 20.20.2; `package-lock.json`
  left untouched in git (restore with `git checkout -- webapp/package-lock.json` after
  any `npm install`)

## Running services

| Service           | How it runs                                                                                              | Restart command |
|-------------------|----------------------------------------------------------------------------------------------------------|-----------------|
| MongoDB 4.2.2     | systemd unit `mongod-skmz`; dbpath `/var/lib/mongodb`, log `/var/log/mongodb/mongod.log`, 127.0.0.1:27017 | `sudo systemctl restart mongod-skmz` |
| GraphQL API       | `/home/user/bin/skmz-server` (built from `server/`), log `/home/user/logs/skmz-server.log`, port 8080     | `pkill -x skmz-server; (nohup /home/user/bin/skmz-server > /home/user/logs/skmz-server.log 2>&1 &)` |
| Webapp dev server | `npm start` in `webapp/` (react-scripts), port 3000                                                       | `cd webapp && BROWSER=none NODE_OPTIONS=--openssl-legacy-provider nohup npm start > /home/user/logs/skmz-webapp.log 2>&1 &` |

## Setup from scratch (if the sandbox is ever rebuilt)

1. Install Go 1.23.4: `curl -sSL https://go.dev/dl/go1.23.4.linux-amd64.tar.gz | sudo tar -C /usr/local -xz`
2. Install `libssl1.1` (bullseye deb from `deb.debian.org/debian/pool/main/o/openssl/`) and the
   MongoDB 4.2.2 debian10 tarball from `fastdl.mongodb.org` into `/usr/local`; symlink
   `mongod` and `mongo` into `/usr/local/bin`
3. Create and enable the `mongod-skmz` systemd unit (flags as in the table above)
4. Seed: `mongo --quiet localhost:27017/programmers server/db/mongo.init` → 8 programmers
5. Build the API: `cd server && go build -o /home/user/bin/skmz-server .`
6. Webapp deps: `cd webapp && npm install`

## Verification commands (all confirmed 2026-08-21)

- GraphQL: `curl -s -X POST localhost:8080/query -H 'Content-Type: application/json' -d '{"query":"{ programmers(skill: \"go\") { name company } }"}'` → Tobi Schmidt, Bob Dogman
- Webapp: `curl -s -o /dev/null -w '%{http_code}\n' localhost:3000` → 200
- DB: `mongo --quiet localhost:27017/programmers --eval 'db.programmers.countDocuments({})'` → 8
- Headless browser DOM check: `chromium --headless=new --no-sandbox --disable-gpu --dump-dom --virtual-time-budget=15000 localhost:3000` → contains all 8 programmer names
- Screenshot: `chromium --headless=new --no-sandbox --disable-gpu --screenshot=out.png --window-size=1280,900 --virtual-time-budget=15000 localhost:3000`
- Tests: `cd server && go test -race ./...` (4/4) · `cd webapp && CI=true NODE_OPTIONS=--openssl-legacy-provider npm test -- --watchAll=false` (3/3)

## Known quirks

- `NODE_OPTIONS=--openssl-legacy-provider` is REQUIRED for webapp start/test on Node >= 17
  (webpack 4 md4 hash vs OpenSSL 3)
- `systemctl` prints a harmless "Failed to connect to system scope bus" warning (no dbus
  in this VM); the unit still starts — verify with `pgrep -ax mongod`
- Never `pkill -f skmz-server` — the pattern matches your own shell's command line and
  kills it; use `pkill -x skmz-server` instead
- Server `/` route 404s in dev (static dir `/webapp` only exists in the production image)
- `go vet ./...` fails on pre-existing unkeyed `bson.D` literals — use `go test` as the gate
- The server env var is lowercase `profile` (not `PROFILE`); unset means dev mode
