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

3. Edit **`.env`** with your Google OAuth credentials as documented in `.env.example`. **Never commit `.env`** — it is already in `.gitignore`.
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
| `make e2e-test` | Playwright e2e (dedicated Vite on port 5174, ephemeral fixtures); also runs in GitHub CI on PRs |
| `make quality-gate` | **`build` → `lint` → `test`** — local/agent check before finishing a change (fast; no e2e) |

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

## Deployment

The app is deployed to **GitHub Pages** automatically on every push to `main`.

- **Live URL:** `https://<your-username>.github.io/illo3d/`
- **Workflow:** `.github/workflows/deploy.yml`

### Required repository setup

1. Go to **Settings → Secrets and variables → Actions** and add:
   - `VITE_GOOGLE_CLIENT_ID` — your Google OAuth client ID
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.

The next push to `main` will trigger the deploy workflow.

## Tests

- **Unit tests:** `make test` (Vitest). Prefer strong coverage on changed code so logic bugs surface before CI.
- **E2E tests:** `make e2e-test` (Playwright; uses Dev Login and isolated fixture root — does not modify `public/fixtures/`). Every PR runs this in GitHub Actions; run it locally when changing flows Playwright covers or when reproducing a CI e2e failure.
- **Local quality gate:** `make quality-gate` — **build**, **lint**, and **unit tests** only (fast feedback). CI still runs **e2e** after unit tests.

### Branch protection

The `main` branch requires **1 approved review** before merging. `dependabot[bot]` is exempted — its pull requests are auto-approved by CI and merge automatically once all quality checks pass. These settings are configured in **GitHub → Settings → Branches**.

## Tech stack summary

- **UI:** React, TypeScript, Vite, Tailwind CSS, react-router-dom, react-i18next  
- **State / data:** Zustand, TanStack Query  
- **Auth:** `@react-oauth/google`  
- **Tests:** Vitest, Testing Library, Playwright  
- **Tooling:** ESLint, Prettier, pnpm (inside Docker)
