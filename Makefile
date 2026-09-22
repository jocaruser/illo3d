.PHONY: help init up serve stop-dev urls down logs logs-dev dev build preview install add add-dev lint format test e2e-test quality-gate ci audit budget react-doctor bash-exec shell clean sa-drive-empty sync-main restore-fixtures imports-fixture

APP = docker compose exec app
E2E_VITE_PORT ?= 5174

# Background dev server (started by `make up` / `make init`). The container's
# published port maps to 5173 inside, so the server must hold exactly that port:
# --strictPort makes a clash fail loudly instead of silently moving to 5174,
# which would leave the published host port dead.
DEV_VITE_PORT = 5173
DEV_PID = /tmp/illo3d-dev-vite.pid
DEV_LOG = /tmp/illo3d-dev-vite.log

.DEFAULT_GOAL := help

# ============ HELP ============
help: ## List available commands
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ============ SETUP ============
init: ## Build images, start containers, install deps, seed .env, serve the app
	@echo "🚀 Initializing illo3d..."
	@test -f .env || cp .env.example .env
	docker compose build
	docker compose up -d
	$(MAKE) install
	$(MAKE) serve
	@echo ""
	@echo "✅ Ready!"
	@$(MAKE) --no-print-directory urls
	@echo ""
	@echo "   Edit .env with your Google credentials for live Sheets/Drive."
	@echo "   'make logs-dev' follows the server, 'make stop-dev' stops it."

# ============ DOCKER ============
up: ## Start containers and the dev server in the background
	docker compose up -d
	$(MAKE) serve
	@$(MAKE) --no-print-directory urls

# Probes the PUBLISHED host URL, not just the in-container port: Vite prints
# "ready" and answers on 127.0.0.1 a moment before it reliably accepts forwarded
# connections, which is how `make up` used to finish on a URL that still hung.
# Requires 3 consecutive successes: Vite's dep optimizer intermittently blocks the
# event loop during warm-up, so a single passing probe can be followed by a hang.
# Falls back to curl -> wget -> in-container probe so it works on a bare host.
# Idempotent: if something already answers, leave it alone.
serve: ## Start the Vite dev server in the background inside the app container
	@bound=$$(docker compose port app $(DEV_VITE_PORT) 2>/dev/null | head -n1); \
	port=$${bound##*:}; port=$${port:-$(DEV_VITE_PORT)}; \
	probe() { \
		if command -v curl >/dev/null 2>&1; then curl -fs -m 2 -o /dev/null "http://localhost:$$port/" 2>/dev/null; \
		elif command -v wget >/dev/null 2>&1; then wget -q -T 2 -O- "http://localhost:$$port/" >/dev/null 2>&1; \
		else docker compose exec -T app wget -q -O- "http://127.0.0.1:$(DEV_VITE_PORT)/" >/dev/null 2>&1; fi; \
	}; \
	if probe; then \
		echo "Dev server already serving http://localhost:$$port"; \
	else \
		docker compose exec -d -T app sh -c 'rm -f $(DEV_LOG); nohup pnpm exec vite --host --port $(DEV_VITE_PORT) --strictPort >>$(DEV_LOG) 2>&1 & echo $$! > $(DEV_PID)'; \
		ok=0; n=0; \
		while [ $$ok -lt 3 ]; do \
			if probe; then ok=$$((ok+1)); else ok=0; fi; \
			n=$$((n+1)); \
			if [ $$n -gt 180 ]; then \
				echo "Dev server did not serve http://localhost:$$port within 90s. Last log lines:"; \
				docker compose exec -T app sh -c 'tail -20 $(DEV_LOG) 2>/dev/null'; \
				exit 1; \
			fi; \
			sleep 0.5; \
		done; \
		echo "Dev server serving http://localhost:$$port"; \
	fi

stop-dev: ## Stop the background dev server
	@docker compose exec -T app sh -c 'kill $$(cat $(DEV_PID) 2>/dev/null) 2>/dev/null; pkill -f "vite --host --port $(DEV_VITE_PORT)" 2>/dev/null; rm -f $(DEV_PID); true' 2>/dev/null || true

urls: ## Reprint service addresses without restarting
	@bound=$$(docker compose port app $(DEV_VITE_PORT) 2>/dev/null | head -n1); \
	port=$${bound##*:}; \
	if [ -z "$$bound" ]; then \
		echo "App:                 not running — run 'make up' (host port: $${APP_PORT:-5173})"; \
	elif curl -fs -m 2 -o /dev/null "http://localhost:$$port/" 2>/dev/null \
		|| wget -q -T 2 -O- "http://localhost:$$port/" >/dev/null 2>&1; then \
		echo "App:                 http://localhost:$$port"; \
	else \
		echo "App:                 http://localhost:$$port — container up, not serving yet; run 'make serve'"; \
	fi
	@echo "E2E preview (in-container): http://localhost:$(E2E_VITE_PORT)"

down: ## Stop containers
	docker compose down

logs: ## Follow app container logs
	docker compose logs -f app

logs-dev: ## Follow the background dev server log
	docker compose exec app sh -c 'touch $(DEV_LOG); tail -f $(DEV_LOG)'

clean: ## Remove containers, volumes, and local images
	docker compose down -v --rmi local

# ============ GIT ============
# Saves WIP (tracked + untracked), switches to main, rebases on origin, then reapplies WIP if a stash was created.
# If `git stash pop` reports conflicts, resolve them in the working tree; the stash entry is consumed.
sync-main: ## Checkout main and pull --rebase (autostash)
	git checkout main && git pull --rebase --autostash

# ============ DEVELOPMENT ============
# `make up` already leaves a server running in the background; this reclaims the
# port and runs one in the foreground instead, when you want the log stream
# attached to your terminal. Ctrl-C stops it (then `make serve` to get it back).
dev: stop-dev ## Vite dev server in the foreground on :5173 (Ctrl-C to stop)
	$(APP) pnpm exec vite --host --port $(DEV_VITE_PORT) --strictPort

build: ## Typecheck and production build
	$(APP) pnpm build

preview: ## Preview the production build
	$(APP) pnpm preview --host

# ============ DEPENDENCIES ============
install: ## pnpm install inside the app container
	$(APP) sh -c 'export CI=true && pnpm install'

add: ## Add runtime dependency (PKG=<name>)
	$(APP) pnpm add -w $(PKG)

add-dev: ## Add dev dependency (PKG=<name>)
	$(APP) pnpm add -w -D $(PKG)

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

lint: ## ESLint (0 errors required; FILES="<paths>" to scope, default .)
	$(APP) pnpm exec eslint $${FILES:-.} --max-warnings 0

react-doctor: ## React Doctor over changed files vs main
	$(APP) sh -c 'if ! git show-ref --quiet refs/heads/main; then git fetch origin main:refs/heads/main 2>/dev/null || true; fi; pnpm exec react-doctor . --offline --scope changed --base main --blocking warning'

format: ## Prettier (write)
	$(APP) pnpm format

# Forward CI env into the container so Vitest can tune parallelism (GitHub sets CI=true on the host).
test: ## Vitest unit tests, 100% coverage thresholds (FILES="<paths>" to scope; thresholds still apply globally)
	docker compose exec -e CI=${CI} -e GITHUB_ACTIONS=${GITHUB_ACTIONS} app pnpm exec vitest run $${FILES}

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
	docker compose up -d app google-mock
	docker compose exec app rm -rf .e2e-fixtures
	docker compose exec app mkdir -p .e2e-google-mock
	docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).log; true'
	docker compose exec -T app sh -c 'VITE_E2E=true VITE_GOOGLE_CLIENT_ID=e2e-mock-google-client-id VITE_GOOGLE_DRIVE_API_BASE=http://google-mock:8790/drive/v3 VITE_GOOGLE_DRIVE_UPLOAD_API_BASE=http://google-mock:8790/upload/drive/v3 VITE_GOOGLE_SHEETS_API_BASE=http://google-mock:8790/v4 pnpm exec vite build --base=/ --outDir dist-e2e --logLevel warn'
	docker compose exec -d -T app sh -c 'VITE_FIXTURES_ROOT=/app/.e2e-fixtures nohup pnpm exec vite preview --base=/ --port $(E2E_VITE_PORT) --host 0.0.0.0 --outDir dist-e2e >>/tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).log 2>&1 & echo $$! > /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid'
	@n=0; until docker compose exec app wget -q -O- http://127.0.0.1:$(E2E_VITE_PORT)/ >/dev/null 2>&1; do \
		n=$$((n+1)); \
		if [ $$n -gt 120 ]; then echo 'E2E: Vite did not become ready on port $(E2E_VITE_PORT) (see /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).log in app container)'; docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid'; exit 1; fi; \
		sleep 0.5; \
	done
	@n=0; until docker compose exec app wget -q -O- --header='Authorization: Bearer readiness' 'http://google-mock:8790/drive/v3/files?q=trashed%3Dfalse' >/dev/null 2>&1; do \
		n=$$((n+1)); \
		if [ $$n -gt 60 ]; then echo 'E2E: google-mock did not become ready on :8790'; docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite-$(E2E_VITE_PORT).pid'; exit 1; fi; \
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
