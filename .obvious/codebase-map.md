# Codebase Map — FlatFilers/test-repo (SKMZ)

Folder-level overview, depth cap 2. Verified 2026-08-24.

| Path | Kind | Purpose |
|---|---|---|
| `server/` | Go app | GraphQL API backend (module `github.com/shpota/skmz`); entrypoint `server.go` wires `/query`, `/playground`, and static file serving |
| `server/cors/` | Go package | Dev CORS-disabling middleware (`cors.Disable`), applied when `profile != prod` |
| `server/db/` | Go package | MongoDB access: `GetProgrammers(skill)` with case-insensitive prefix regex on `skills.name`; `mongo.init` is the seed script mounted by both compose files |
| `server/gql/` | Go package | GraphQL resolver (`Resolver`, `queryResolver.Programmers`) and `schema.graphql` (Programmer, Skill, Query types) |
| `server/gql/gen/` | Go package | gqlgen-generated executable schema (`generated.go`, DO NOT EDIT) |
| `server/model/` | Go package | Domain models: `Programmer`, `Skill` |
| `webapp/` | React app | Create React App frontend (`react-scripts` 3.3.0, React 16.12, Apollo) |
| `webapp/src/` | source | App shell (`App.js` with ApolloClient, `index.js`), tests, and components in `src/programmers/`, `src/search/`, `src/skills/` |
| `webapp/public/` | static | `index.html` (Materialize + Font Awesome via CDN), icons, manifest |
| `Dockerfile` | infra | Multi-stage build: node build of webapp → Go build of server → alpine runtime serving on :8080 |
| `docker-compose.yml` | infra | Production stack: app on :8080 + mongo 4.2.2 (seeded from `server/db/mongo.init`) |
| `docker-compose-dev.yml` | infra | Dev database only: mongo 4.2.2 on :27017 with seed |
| `.travis.yml` | CI | Two jobs: `go test -race` in `server/`, `npm test` in `webapp/` |
