# Codebase Map — FlatFilers/test-repo (SKMZ)

Folder-level overview, depth-capped at 2.

| Path                     | Kind      | Purpose                                                                                        |
|--------------------------|-----------|------------------------------------------------------------------------------------------------|
| `server/`                | Go app    | GraphQL API (gqlgen) + MongoDB access — the backend                                            |
| `server/cors/`           | Go pkg    | CORS wrapper applied to the GraphQL handler when `profile != prod`                              |
| `server/db/`             | Go pkg    | MongoDB data layer: `GetProgrammers(skill)` with case-insensitive regex filter; `mongo.init` seed script |
| `server/gql/`            | Go pkg    | GraphQL resolver; `schema.graphql` SDL; `gen/` gqlgen-generated executable schema               |
| `server/model/`          | Go pkg    | Domain models: `Programmer`, `Skill`                                                            |
| `server/server.go`       | Go        | Entry point: Mongo client, `/query`, `/playground`, static `/webapp` file server, listens on :8080 |
| `webapp/`                | React app | Create React App frontend — search programmers by skill                                         |
| `webapp/src/`            | JS        | `App.js` (Apollo client + search state), `search/SearchBox.js`, `programmers/` cards, `skills/`  |
| `webapp/public/`         | static    | `index.html`, icons, manifest                                                                   |
| `docker-compose.yml`     | compose   | Production stack: builds the Dockerfile, app on :8080 + MongoDB                                 |
| `docker-compose-dev.yml` | compose   | Dev MongoDB only (mongo:4.2.2 on :27017, auto-seeded from `server/db/mongo.init`)               |
| `Dockerfile`             | docker    | 3-stage build: webapp build → Go build → alpine runtime                                         |
| `.travis.yml`            | CI        | Legacy Travis config: `go test` (server) + `npm test` (webapp)                                  |
| `README.md`              | docs      | Setup, run, and development instructions                                                        |
