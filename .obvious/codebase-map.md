# Codebase Map — FlatFilers/test-repo (SKMZ)

Two sub-apps: a Go/GraphQL backend (`server/`) and a React frontend (`webapp/`), plus Docker/CI wiring at the root.

| Path | Kind | Purpose |
|---|---|---|
| `server/` | Go module | GraphQL backend (`github.com/shpota/skmz`), serves API + static frontend in prod |
| `server/server.go` | file | `main`: Mongo connect, routes `/query`, `/playground`, `/` (static `/webapp`), listens on :8080 |
| `server/cors/` | pkg | Dev-only CORS middleware (`cors.Disable`, active when `profile != prod`) |
| `server/db/` | pkg | MongoDB access layer (`GetProgrammers(skill)` regex filter) + `mongo.init` seed script (8 programmers) |
| `server/gql/` | pkg | gqlgen resolver (`Programmers` query) + `schema.graphql` (Programmer, Skill, Query types) |
| `server/gql/gen/` | pkg | gqlgen-generated executable schema — do not edit by hand |
| `server/model/` | pkg | gqlgen-generated domain models — do not edit by hand |
| `webapp/` | CRA app | React frontend (`react-scripts 3.3.0`, Apollo Client) |
| `webapp/src/` | dir | App shell (`App.js` wires Apollo → `REACT_APP_API_URL/query`) + features: `programmers/` (card list), `search/` (skill filter input), `skills/` (clickable skill chips) |
| `webapp/public/` | dir | Static assets, `index.html`, manifest |
| `Dockerfile` | file | Multi-stage prod build: Node 12 builds webapp → Go 1.13 builds server → alpine runtime |
| `docker-compose.yml` | file | Prod: `app` (:8080) + `db` (mongo 4.2) |
| `docker-compose-dev.yml` | file | Dev: mongo 4.2 on :27017 with `mongo.init` seed mounted |
| `.travis.yml` | file | CI: Go test matrix (server) + Node 12 test matrix (webapp) |
| `README.md` | doc | Setup/run instructions, sample GraphQL query |
