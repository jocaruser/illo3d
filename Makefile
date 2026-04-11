.PHONY: init up down logs dev build preview install add add-dev lint format test e2e-test quality-gate bash-exec shell clean sa-drive-empty sync-main restore-fixtures

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
	@STASHED=0; \
	if git stash push -u -m "sync-main: WIP before checkout/pull --rebase"; then \
		STASHED=1; \
	else \
		ec=$$?; \
		if [ $$ec -ne 1 ]; then exit $$ec; fi; \
	fi; \
	git checkout main; \
	git pull --rebase; \
	if [ $$STASHED -eq 1 ]; then \
		git stash pop; \
	fi

# ============ DEVELOPMENT ============
dev:
	$(APP) pnpm dev --host

build:
	$(APP) pnpm build

preview:
	$(APP) pnpm preview --host

# ============ DEPENDENCIES ============
install:
	$(APP) pnpm install

add:
	$(APP) pnpm add $(PKG)

add-dev:
	$(APP) pnpm add -D $(PKG)

# ============ QUALITY ============
# Run all quality checks. Use this before finishing any code change.
quality-gate: build lint test e2e-test
	@echo ""
	@echo "✅ Quality gate passed"

lint:
	$(APP) pnpm lint

format:
	$(APP) pnpm format

test:
	$(APP) pnpm test

restore-fixtures:
	rm -rf public/fixtures/*
	mkdir -p public/fixtures
	cp -r fixtures/* public/fixtures/

# Vite runs in app (Alpine + musl node_modules); Playwright runs in playwright image (glibc browsers).
e2e-test:
	docker compose up -d app
	docker compose exec app rm -rf .e2e-fixtures
	docker compose exec -d app sh -c 'VITE_FIXTURES_ROOT=/app/.e2e-fixtures VITE_LOCAL_CSV_FIXTURE_FOLDER=happy-path VITE_SHOW_DEV_LOGIN=true pnpm exec vite --port 5174 --host 0.0.0.0 & echo $$! > /tmp/illo3d-e2e-vite.pid'
	@n=0; until docker compose exec app wget -q -O- http://127.0.0.1:5174/ >/dev/null 2>&1; do \
		n=$$((n+1)); \
		if [ $$n -gt 60 ]; then echo 'E2E: Vite did not become ready on port 5174'; docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite.pid'; exit 1; fi; \
		sleep 0.5; \
	done
	docker compose run --rm -e PLAYWRIGHT_SKIP_WEBSERVER=1 -e PLAYWRIGHT_BASE_URL=http://web:5174 playwright pnpm exec playwright test
	@docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite.pid'
	@docker compose exec app rm -rf .e2e-fixtures

# ============ ESCAPE HATCH ============
bash-exec:
	$(APP) $(CMD)

shell:
	docker compose exec app sh

sa-drive-empty:
	$(APP) node scripts/empty-sa-drive.mjs
