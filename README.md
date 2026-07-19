# illo3d

illo3d is a **3D print shop management** web app: clients, jobs, money (transactions and expenses), and inventory. The UI is **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**, with **Zustand** for state over an in-memory workbook snapshot. Shops live in the user's own storage — Google Drive (Sheets) or a local folder of CSVs — behind swappable repository implementations. See `ARCHITECTURE.md` for the design.

## Development standards commitment

Per the Aircury development standards, illo3d is an **internal tool in production**. The agreed level per dimension:

**R2 D3 C4 E4 L3 S2 Y2 O1 B1 P2 U1 A2**

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

### Specs wiki

The behaviour specs in `specs/` are published as a public wiki at
**<https://jocaruser.github.io/github-md-live-wiki/>**, hosted by the wiki engine's own
repository ([jocaruser/github-md-live-wiki](https://github.com/jocaruser/github-md-live-wiki)).
The wiki **fetches the `.md` files from GitHub at view time** — merged spec changes are
visible immediately with no deploy anywhere — with a version menu covering any release,
branch head, or commit id, search, and on-device translation (ADR-0014).

| Target | Purpose |
|--------|---------|
| `make wiki` | Same wiki on <http://localhost:5176> via the engine's image (see the `wiki` service in `docker-compose.yml`); your working-tree `specs/` appears as the **local** entry in its version menu (refresh to see edits) |

### Dependencies

| Target | Purpose |
|--------|---------|
| `make install` | `pnpm install` in the app container |
| `make add PKG=<name>` | Add runtime dependency |
| `make add-dev PKG=<name>` | Add dev dependency |

### Quality

| Target | Purpose |
|--------|---------|
| `make lint` | ESLint (0 errors required) |
| `make format` | Prettier (write) |
| `make test` | Vitest unit tests with **100% coverage thresholds** |
| `make audit` | Dependency vulnerability gate — fails on high/critical advisories |
| `make budget` | Performance budget — gzipped bundle must stay within `scripts/check-bundle-budget.mjs` limits |
| `make e2e-test` | Playwright e2e (dedicated Vite on port 5174, ephemeral fixtures); also runs in GitHub CI on PRs |
| `make quality-gate` | Sequential full gate: `build` → `lint` → `react-doctor` → `test` → `e2e-test` |
| `make ci` | Same checks as CI: fast ones (`build`, `lint`, `react-doctor`, `test`, `audit`) in parallel, then `e2e-test` |

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

The app is deployed to **GitHub Pages**.

- **App URL:** `https://<your-username>.github.io/illo3d/`
- **Workflow:** `.github/workflows/deploy.yml` — runs on manual dispatch, and the release workflow dispatches it after tagging
- **Specs wiki:** hosted separately on the engine repository's Pages (<https://jocaruser.github.io/github-md-live-wiki/>); it needs no deploys from this repo — spec changes merged to `main` appear there immediately

### Required repository setup

1. Go to **Settings → Secrets and variables → Actions** and add:
   - `VITE_GOOGLE_CLIENT_ID` — your Google OAuth client ID
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.

Deploys then run from **Actions → Deploy to GitHub Pages** (manual dispatch), and automatically after each release.

## Tests

- **Unit tests:** `make test` (Vitest). Prefer strong coverage on changed code so logic bugs surface before CI.
- **E2E tests:** `make e2e-test` (Playwright; uses Dev Login and isolated fixture root — does not modify `public/fixtures/`). Every PR runs this in GitHub Actions; run it locally when changing flows Playwright covers or when reproducing a CI e2e failure.
- **Local quality gate:** `make quality-gate` (sequential) or `make ci` (parallel fast checks, then e2e) — both cover build, lint, react-doctor, unit tests; `make ci` adds the dependency audit.

### Branch protection

The `main` branch requires **1 approved review** before merging. `dependabot[bot]` is exempted — its pull requests are auto-approved by CI and merge automatically once all quality checks pass. These settings are configured in **GitHub → Settings → Branches**.

## Tech stack summary

- **UI:** React, TypeScript, Vite, Tailwind CSS, react-router-dom, react-i18next  
- **State / data:** Zustand over an in-memory workbook snapshot (see `ARCHITECTURE.md`)  
- **Auth:** `@react-oauth/google`  
- **Tests:** Vitest, Testing Library, Playwright  
- **Tooling:** ESLint, Prettier, pnpm (inside Docker)
