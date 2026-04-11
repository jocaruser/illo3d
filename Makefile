.PHONY: init up down logs dev build preview install add add-dev lint format test e2e-test quality-gate bash-exec shell clean sa-drive-empty sync-main

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

e2e-test:
	docker compose run --rm -e PLAYWRIGHT_BASE_URL=http://web:5173 playwright pnpm exec playwright test

# ============ ESCAPE HATCH ============
bash-exec:
	$(APP) $(CMD)

shell:
	docker compose exec app sh

sa-drive-empty:
	$(APP) node scripts/empty-sa-drive.mjs
