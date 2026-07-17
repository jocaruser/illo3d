.PHONY: help init up down logs dev build preview install add add-dev lint format test e2e-test quality-gate ci audit budget react-doctor bash-exec shell clean sa-drive-empty sync-main restore-fixtures imports-fixture

APP = docker compose exec app
E2E_VITE_PORT ?= 5174

.DEFAULT_GOAL := help

# ============ HELP ============
help: ## List available commands
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ============ SETUP ============
init: ## Build images, start containers, install deps, seed .env
	@echo "🚀 Initializing illo3d..."
	@test -f .env || cp .env.example .env
	docker compose build
	docker compose up -d
	$(MAKE) install
	@echo ""
	@echo "✅ Ready! Next steps:"
	@echo "   1. Edit .env with your Google credentials"
	@echo "   2. Run 'make dev' to start dev server"
	@echo "   3. Open http://localhost:5173"

# ============ DOCKER ============
up: ## Start containers in the background
	docker compose up -d

down: ## Stop containers
	docker compose down

logs: ## Follow app container logs
	docker compose logs -f app

clean: ## Remove containers, volumes, and local images
	docker compose down -v --rmi local

# ============ GIT ============
# Saves WIP (tracked + untracked), switches to main, rebases on origin, then reapplies WIP if a stash was created.
# If `git stash pop` reports conflicts, resolve them in the working tree; the stash entry is consumed.
sync-main: ## Checkout main and pull --rebase (autostash)
	git checkout main && git pull --rebase --autostash

# ============ DEVELOPMENT ============
dev: ## Vite dev server on :5173
	$(APP) pnpm dev --host

build: ## Typecheck and production build
	$(APP) pnpm build

preview: ## Preview the production build
	$(APP) pnpm preview --host

# ============ DEPENDENCIES ============
install: ## pnpm install inside the app container
	$(APP) sh -c 'export CI=true && pnpm install'

add: ## Add runtime dependency (PKG=<name>)
	$(APP) pnpm add $(PKG)

add-dev: ## Add dev dependency (PKG=<name>)
	$(APP) pnpm add -D $(PKG)

# ============ QUALITY ============
# Local quality gate: build, lint, unit tests, and e2e tests. Use before finishing any code change.
quality-gate: build lint react-doctor test e2e-test ## Sequential full gate: build, lint, react-doctor, unit, e2e
	@echo ""
	@echo "✅ Quality gate passed (build, lint, react-doctor, unit tests, e2e tests)"

# CI entrypoint: the independent checks run in parallel, then e2e (it owns the
# container's Vite port and CPU, so racing it against the unit suite flakes).
ci: ## Run all checks; fast ones in parallel, then e2e
	$(MAKE) -j4 budget lint react-doctor test audit
	$(MAKE) e2e-test

audit: ## Dependency vulnerability gate (fails on high/critical)
	$(APP) pnpm audit --audit-level=high

budget: build ## Performance budget: gzipped bundle within limits (P2)
	$(APP) node scripts/check-bundle-budget.mjs

lint: ## ESLint (0 errors required)
	$(APP) pnpm lint

react-doctor: ## React Doctor over changed files vs main
	$(APP) sh -c 'if ! git show-ref --quiet refs/heads/main; then git fetch origin main:refs/heads/main 2>/dev/null || true; fi; pnpm exec react-doctor . --offline --scope changed --base main --blocking warning'

format: ## Prettier (write)
	$(APP) pnpm format

# Forward CI env into the container so Vitest can tune parallelism (GitHub sets CI=true on the host).
test: ## Vitest unit tests with 100% coverage thresholds
	docker compose exec -e CI=${CI} -e GITHUB_ACTIONS=${GITHUB_ACTIONS} app pnpm test

restore-fixtures: ## Copy golden fixtures/ into public/fixtures/
	rm -rf public/fixtures/*
	mkdir -p public/fixtures
	cp -r fixtures/* public/fixtures/

# Regenerate fixtures/imports from docs/sources/*_db_import and docs/sources/inventory_current
imports-fixture: ## Regenerate fixtures/imports from docs/sources
	node scripts/build-imports-fixture.mjs

# Vite runs in app (Alpine + musl node_modules); Playwright runs in playwright image (glibc browsers).
# The suite exercises the PRODUCTION bundle: `vite build` with the e2e env baked in (import.meta.env
# is inlined at build time), served by `vite preview` so minification/CSP/chunking issues fail e2e.
# `--base=/` because specs address the server root (GitHub Pages' /illo3d/ base is path-only).
# `tsc` is skipped here — typechecking is the build gate's job.
# Start the server with nohup so it survives the exec shell exiting (plain `vite &` can be SIGHUP'd).
# -T disables pseudo-TTY allocation to prevent signal issues when the exec session detaches.
e2e-test: ## Playwright e2e suite against a production build (Vite preview on :5174)
	docker compose up -d app
	docker compose exec app rm -rf .e2e-fixtures
	docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).log; true'
	docker compose exec -T app sh -c 'VITE_E2E=true VITE_GOOGLE_CLIENT_ID=e2e-mock-google-client-id pnpm exec vite build --base=/ --outDir dist-e2e --logLevel warn'
	docker compose exec -d -T app sh -c 'VITE_FIXTURES_ROOT=/app/.e2e-fixtures nohup pnpm exec vite preview --base=/ --port $(E2E_VITE_PORT) --host 0.0.0.0 --outDir dist-e2e >>/tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).log 2>&1 & echo $$! > /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid'
	@n=0; until docker compose exec app wget -q -O- http://127.0.0.1:$(E2E_VITE_PORT)/ >/dev/null 2>&1; do \
		n=$$((n+1)); \
		if [ $$n -gt 120 ]; then echo 'E2E: Vite did not become ready on port $(E2E_VITE_PORT) (see /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).log in app container)'; docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid'; exit 1; fi; \
		sleep 0.5; \
	done
	docker compose run --rm -e PLAYWRIGHT_BASE_URL=http://web:$(E2E_VITE_PORT) playwright pnpm exec playwright test
	@docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid'
	@docker compose exec app rm -rf .e2e-fixtures

# ============ ESCAPE HATCH ============
bash-exec: ## Run a one-off command in the app container (CMD="...")
	$(APP) $(CMD)

shell: ## Interactive shell in the app container
	docker compose exec app sh

sa-drive-empty: ## Service-account Drive cleanup script
	$(APP) node scripts/empty-sa-drive.mjs
