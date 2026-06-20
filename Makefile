.PHONY: help build up down ps logs setup migrate seed restart

COMPOSE := docker compose
ARTISAN := $(COMPOSE) run --rm --user root --entrypoint php backend artisan

help:
	@echo "LMS SaaS — comandos locales"
	@echo "  make build    Construir imágenes"
	@echo "  make up       Levantar todos los servicios"
	@echo "  make down     Parar y quitar contenedores"
	@echo "  make setup    Primera vez: claves, migraciones y datos demo"
	@echo "  make migrate  Ejecutar migraciones"
	@echo "  make seed     Cargar datos demo"
	@echo "  make ps       Estado de servicios"
	@echo "  make logs     Logs (todos los servicios)"

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

setup:
	@bash scripts/setup.sh

migrate:
	$(ARTISAN) migrate --force

seed:
	$(ARTISAN) db:seed --force

restart:
	$(COMPOSE) restart backend horizon scheduler nginx
