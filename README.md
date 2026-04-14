# illo3d

illo3d is a **3D print shop management** web app: clients, jobs, money (transactions and expenses), and inventory. The UI is **React18**, **TypeScript**, **Vite**, and **Tailwind CSS**, with **Zustand** for client state and **TanStack Query** for server state. Google OAuth and optional local CSV fixtures back the data layer.

## Prerequisites

- **Docker** and **Docker Compose** (commands run in containers; Node and pnpm live inside the app image).
- **GNU Make** (`make`) on the host to invoke the workflow targets below.

## First-time setup

1. Clone the repository.
2. From the repo root, run:

   ```bash
   make init
   ```

   This builds the Docker image, starts the stack, copies `.env.example` to `.env` if needed, and installs dependencies inside the container.

3. Edit **`.env`** with your Google OAuth / API credentials as documented in `.env.example`.
4. Start the dev server:

   ```bash
   make dev
   ```

5. Open **http://localhost:5173**.

Day-to-day development: use **`make dev`** after **`make up`** if containers were stopped (`make down`).

## Makefile commands (by category)

### Setup

| Target | Purpose |
|--------|---------|
| `make init` | Build image, start containers, `pnpm install`, seed `.env` from example if missing |

### Docker

| Target | Purpose |
|--------|---------|
| `make up` | Start containers in the background |
| `make down` | Stop containers |
| `make logs` | Follow app container logs |
| `make clean` | Remove containers, volumes, and local images for this project |

### Development

| Target | Purpose |
|--------|---------|
| `make dev` | Vite dev server (with `--host` inside the app container) |
| `make build` | Typecheck and production build to `dist/` |
| `make preview` | Preview production build |

### Dependencies

| Target | Purpose |
|--------|---------|
| `make install` | `pnpm install` in the app container |
| `make add PKG=<name>` | Add runtime dependency |
| `make add-dev PKG=<name>` | Add dev dependency |

### Quality

| Target | Purpose |
|--------|---------|
| `make lint` | ESLint |
| `make format` | Prettier (write) |
| `make test` | Vitest unit tests |
| `make e2e-test` | Playwright e2e (dedicated Vite on port 5174, ephemeral fixtures) |
| `make quality-gate` | **`build` → `lint` → `test` → `e2e-test`** — run before merging or when finishing a change |

### Data / fixtures

| Target | Purpose |
|--------|---------|
| `make restore-fixtures` | Copy golden `fixtures/` into `public/fixtures/` (host; bind-mounted) |

### Utilities

| Target | Purpose |
|--------|---------|
| `make shell` | Interactive shell in the app container |
| `make bash-exec CMD="<command>"` | Run a one-off command in the app container |
| `make sync-main` | Stash WIP, checkout `main`, pull --rebase, pop stash |
| `make sa-drive-empty` | Service-account Drive cleanup script (see Makefile) |

## Tests

- **Unit tests:** `make test` (Vitest).
- **E2E tests:** `make e2e-test` (Playwright; uses Dev Login and isolated fixture root — does not modify `public/fixtures/`).
- **Full gate:** `make quality-gate` — required for CI-style verification (build, lint, unit, e2e).

## Tech stack summary

- **UI:** React, TypeScript, Vite, Tailwind CSS, react-router-dom, react-i18next  
- **State / data:** Zustand, TanStack Query  
- **Auth:** `@react-oauth/google`  
- **Tests:** Vitest, Testing Library, Playwright  
- **Tooling:** ESLint, Prettier, pnpm (inside Docker)
