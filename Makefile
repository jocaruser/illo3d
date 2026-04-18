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

# Forward CI env into the container so Vitest can tune parallelism (GitHub sets CI=true on the host).
test:
	docker compose exec -e CI -e GITHUB_ACTIONS app pnpm test

restore-fixtures:
	rm -rf public/fixtures/*
	mkdir -p public/fixtures
	cp -r fixtures/* public/fixtures/

# Vite runs in app (Alpine + musl node_modules); Playwright runs in playwright image (glibc browsers).
# Start e2e Vite with nohup so it survives the exec shell exiting (plain `vite &` can be SIGHUP'd).
e2e-test:
	docker compose up -d app
	docker compose exec app rm -rf .e2e-fixtures
	docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite.pid /tmp/illo3d-e2e-vite.log; true'
	docker compose exec -d app sh -c 'VITE_E2E=true VITE_FIXTURES_ROOT=/app/.e2e-fixtures VITE_GOOGLE_API_KEY=e2e-mock-google-api-key VITE_GOOGLE_CLIENT_ID=e2e-mock-google-client-id nohup pnpm exec vite --port 5174 --host 0.0.0.0 >>/tmp/illo3d-e2e-vite.log 2>&1 & echo $$! > /tmp/illo3d-e2e-vite.pid'
	@n=0; until docker compose exec app wget -q -O- http://127.0.0.1:5174/ >/dev/null 2>&1; do \
		n=$$((n+1)); \
		if [ $$n -gt 120 ]; then echo 'E2E: Vite did not become ready on port 5174 (see /tmp/illo3d-e2e-vite.log in app container)'; docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite.pid'; exit 1; fi; \
		sleep 0.5; \
	done
	docker compose run --rm -e PLAYWRIGHT_BASE_URL=http://web:5174 playwright pnpm exec playwright test
	@docker compose exec app sh -c 'kill $$(cat /tmp/illo3d-e2e-vite.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/illo3d-e2e-vite.pid'
	@docker compose exec app rm -rf .e2e-fixtures

# ============ ESCAPE HATCH ============
bash-exec:
	$(APP) $(CMD)

shell:
	docker compose exec app sh

sa-drive-empty:
	$(APP) node scripts/empty-sa-drive.mjs
