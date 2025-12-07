# Grimoire

On-demand API documentation server that turns any published npm package into browsable TypeDoc output. The app is built with Hono and runs entirely with an in-memory file system so it can bundle its runtime dependencies.

## Features
- Fetches package metadata and tarballs from the npm registry, then runs TypeDoc with a permissive tsconfig to handle mixed JS/TS sources.
- Serves the generated HTML from an in-memory Volume and caches results in an LRU cache to avoid repeat work for the same package.
- Ships a snapshot of `node_modules` into MemFS, letting the bundled server run without reading from disk at runtime.
- Minimal landing page for quickly jumping to `/react/`, `/vue/`, `/three/`, `/zod/`, or any other package name.

## Requirements
- Node.js 18+ (for `fetch` and ES modules).
- npm.

## Install
```sh
npm install
```

## Build and run
```sh
npm run build
npm start
```
`npm start` runs the prestart build and then launches `dist/server.js`, listening on `http://localhost:3000`.

## Usage
- Visit `http://localhost:3000` and enter an npm package name, or navigate directly to `/:package/`.
- The server downloads the latest release of the package, renders TypeDoc output into memory, and serves the files under `/docs/`.

## Development scripts
- `npm run typecheck` – TypeScript type checks.
- `npm run lint` – oxlint static analysis.
- `npm run format` – apply formatting via oxfmt.
- `npm run test` – run Node test files.
- `npm run snapshot` – rebuild `src/snapshot/node_modules.json` when updating TypeDoc or its highlighting dependencies.
