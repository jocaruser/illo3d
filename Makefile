.PHONY: init up down logs dev build preview install add add-dev lint format test e2e-test quality-gate react-doctor bash-exec shell clean sa-drive-empty sync-main restore-fixtures imports-fixture

APP = docker compose exec app

# ============ SETUP ============
init:
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
up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f app

clean:
	docker compose down -v --rmi local

# ============ GIT ============
# Saves WIP (tracked + untracked), switches to main, rebases on origin, then reapplies WIP if a stash was created.
# If `git stash pop` reports conflicts, resolve them in the working tree; the stash entry is consumed.
sync-main:
	git checkout main && git pull --rebase --autostash

# ============ DEVELOPMENT ============
dev:
	$(APP) pnpm dev --host

build:
	$(APP) pnpm build

preview:
	$(APP) pnpm preview --host

# ============ DEPENDENCIES ============
install:
	$(APP) sh -c 'export CI=true && pnpm install'

add:
	$(APP) pnpm add $(PKG)

add-dev:
	$(APP) pnpm add -D $(PKG)

# ============ QUALITY ============
# Local quality gate: build, lint, unit tests, and e2e tests. Use before finishing any code change.
quality-gate: build lint react-doctor test e2e-test
	@echo ""
	@echo "✅ Quality gate passed (build, lint, react-doctor, unit tests, e2e tests)"

lint:
	$(APP) pnpm lint

react-doctor:
	$(APP) sh -c 'git fetch origin main:refs/heads/main && pnpm exec react-doctor . --offline --scope changed --base main --blocking warning'

format:
	$(APP) pnpm format

# Forward CI env into the container so Vitest can tune parallelism (GitHub sets CI=true on the host).
test:
	docker compose exec -e CI=${CI} -e GITHUB_ACTIONS=${GITHUB_ACTIONS} app pnpm test

restore-fixtures:
	rm -rf public/fixtures/*
	mkdir -p public/fixtures
	cp -r fixtures/* public/fixtures/

# Regenerate fixtures/imports from docs/sources/*_db_import and docs/sources/inventory_current
imports-fixture:
	node scripts/build-imports-fixture.mjs

# E2E tests use the dev server (port 5173) with Playwright route interception for fixtures.
# The dev server must be running (make dev) before running e2e tests.
e2e-test:
	docker compose up -d app
	@echo "Checking if dev server is running on port 5173..."
	@docker compose exec app sh -c 'for i in 1 2 3 4 5; do if wget -q -O- http://127.0.0.1:5173/ >/dev/null 2>&1; then echo "Dev server is ready"; exit 0; fi; sleep 1; done; echo "ERROR: Dev server is not running on port 5173. Please run \"make dev\" first."; exit 1'
	docker compose exec app rm -rf .e2e-fixtures
	docker compose run --rm -e PLAYWRIGHT_BASE_URL=http://web:5173 playwright pnpm exec playwright test
	@docker compose exec app rm -rf .e2e-fixtures

# ============ ESCAPE HATCH ============
bash-exec:
	$(APP) $(CMD)

shell:
	docker compose exec app sh

sa-drive-empty:
	$(APP) node scripts/empty-sa-drive.mjs
