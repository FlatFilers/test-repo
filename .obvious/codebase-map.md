# Codebase Map — test-repo (SKMZ)

Folder-level overview (depth 2). Two apps: Go GraphQL API (`server/`) and React SPA (`webapp/`).

| Path | What it is |
|---|---|
| `server/` | Go backend: entrypoint `server.go` (HTTP on :8080, gqlgen handler, Mongo client) |
| `server/cors/` | CORS middleware applied to `/query` in non-prod profile |
| `server/db/` | MongoDB access (`db.go`: `GetProgrammers(skill)`) + `mongo.init` seed script (8 programmers) |
| `server/gql/` | GraphQL layer: `schema.graphql`, `resolver.go`, `gqlgen.yml`, `gen/` (generated code — do not hand-edit) |
| `server/model/` | Domain models (`Programmer`, `Skill`) |
| `webapp/` | React SPA (CRA): Apollo Client queries `/query`; `.env.development` points at `http://localhost:8080` |
| `webapp/public/` | Static assets (index.html, icons, manifest) |
| `webapp/src/` | App source: `App.js` (Apollo client + search state), `search/SearchBox.js`, `programmers/` (list + card), `skills/` (skill chips) |
| root | `Dockerfile` (multi-stage: webapp build + Go build), `docker-compose.yml` (prod), `docker-compose-dev.yml` (dev MongoDB), `.travis.yml` (CI: go test + jest) |

Data flow: `webapp/src/App.js` runs `programmers(skill:)` queries against `server` `/query` → `server/gql/resolver.go` → `server/db/db.go` → MongoDB `programmers.programmers`.
