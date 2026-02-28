.PHONY: init up down logs dev build preview install add add-dev lint format test bash-exec shell clean

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
lint:
	$(APP) pnpm lint

format:
	$(APP) pnpm format

test:
	$(APP) pnpm test

# ============ ESCAPE HATCH ============
bash-exec:
	$(APP) $(CMD)

shell:
	docker compose exec app sh
