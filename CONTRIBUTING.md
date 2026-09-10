# Contributing

Thanks for your interest in contributing to SKMZ.

## Local development setup

You need [Docker](https://www.docker.com), [Docker Compose](https://docs.docker.com/compose/),
[Node.js](https://nodejs.org/en/), and [Go](https://golang.org/dl/) installed.

### Start the dev database

```sh
docker-compose -f docker-compose-dev.yml up
```

This starts a local MongoDB instance on port `27017`, populated with the test
records from `server/db/mongo.init`.

### Run the Go server

From the `server` folder:

```sh
go run server.go
```

This compiles and runs the backend. Once running, the API and the
[GraphQL Playground](http://localhost:8080/playground) are available.

### Run the React webapp

From the `webapp` folder:

```sh
npm install
npm start
```

The site is served at http://localhost:3000 and reloads automatically as
files are saved. Backend changes require restarting the Go server.

## Running tests

### Go server tests

From the `server` folder:

```sh
go test ./...
```

### Webapp tests

From the `webapp` folder:

```sh
npm test
```

## Branch naming

Recent branches in this repository follow a `<type>/<short-description>`
pattern, for example `feat/search-clear-and-result-count`,
`fix/webapp-search-variables-debounce`, and `ci/add-github-actions`. Use a
type prefix (`feat`, `fix`, `ci`, `chore`, `docs`, `test`, etc.) that matches
the nature of the change, followed by a short, hyphenated description.

## Commit conventions

Commit messages in this repository follow the
[Conventional Commits](https://www.conventionalcommits.org/) style, prefixing
the summary with a type such as `feat:`, `fix:`, `ci:`, `chore:`, `docs:`, or
`deps:`, for example `ci: add github actions workflow for go and webapp
builds` and `fix: use GraphQL variables and debounce webapp skill search`.
