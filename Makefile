.PHONY: help dev dev-down test lint format check migrate clean

help:
	@echo "🛒 Smarket Development Commands:"
	@echo "  make dev          - Start all infrastructure & microservices via Docker Compose"
	@echo "  make dev-down     - Stop Docker Compose services"
	@echo "  make test         - Run test suite for all microservices (Python, Go, Rust)"
	@echo "  make lint         - Run linters (Ruff, Go vet, Cargo clippy)"
	@echo "  make format       - Format code across services"
	@echo "  make migrate      - Apply Alembic migrations head on Auth, Product & Cart services"
	@echo "  make clean        - Remove temporary build & test artifacts"

dev:
	cd infra && docker compose up -d --build

dev-down:
	cd infra && docker compose down

test:
	python scripts/run_service_tests.py
	cd services/products_etl && go test ./...
	cd services/search_service && cargo test

lint:
	uv run ruff check .
	cd services/products_etl && go vet ./...
	cd services/search_service && cargo clippy

format:
	uv run ruff format .
	cd services/products_etl && gofmt -w .

migrate:
	cd services/auth_service && alembic upgrade head
	cd services/product_service && alembic upgrade head
	cd services/cart_service && alembic upgrade head
	cd services/reviews_service && alembic upgrade head
	cd services/audit_service && alembic upgrade head

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*-integration-tests" -exec rm -rf {} + 2>/dev/null || true
