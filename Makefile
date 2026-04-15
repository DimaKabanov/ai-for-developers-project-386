PHONY: install dev build prism clean help lint lint-fix format format-check stylelint stylelint-fix check

.DEFAULT_GOAL := help

VITE_PORT := 5173
PRISM_PORT := 3000

help:
	@echo "Доступные команды:"
	@echo "  make install          - Установка всех зависимостей (корень + frontend)"
	@echo "  make dev              - Запуск frontend dev-сервера на localhost:$(VITE_PORT)"
	@echo "  make build            - Сборка production версии"
	@echo "  make lint             - Проверка кода ESLint (frontend)"
	@echo "  make lint-fix         - Автоисправление ошибок ESLint"
	@echo "  make format           - Форматирование кода Prettier"
	@echo "  make format-check     - Проверка форматирования Prettier"
	@echo "  make stylelint        - Проверка CSS Stylelint"
	@echo "  make stylelint-fix    - Автоисправление CSS Stylelint"
	@echo "  make check            - Полная проверка (lint + stylelint + format-check + build)"
	@echo "  make prism            - Запуск Prism мок-сервера на http://localhost:$(PRISM_PORT)"
	@echo "  make prism-stop       - Остановка Prism сервера"
	@echo "  make clean            - Очистка node_modules и сборок"
	@echo "  make clean-all        - Полная очистка включая lock-файлы"

install:
	@echo "Установка зависимостей в корне..."
	npm install
	@echo "Установка зависимостей во frontend..."
	cd frontend && npm install
	@echo "Все зависимости установлены!"

dev:
	@echo "Запуск dev-сервера на http://localhost:$(VITE_PORT)"
	cd frontend && npm run dev

build:
	@echo "Сборка production..."
	cd frontend && npm run build

lint:
	@echo "Проверка ESLint..."
	cd frontend && npm run lint

lint-fix:
	@echo "Автоисправление ESLint..."
	cd frontend && npm run lint:fix

format:
	@echo "Форматирование Prettier..."
	cd frontend && npm run format

format-check:
	@echo "Проверка форматирования Prettier..."
	cd frontend && npm run format:check

stylelint:
	@echo "Проверка Stylelint..."
	cd frontend && npm run stylelint

stylelint-fix:
	@echo "Автоисправление Stylelint..."
	cd frontend && npm run stylelint:fix

check:
	@echo "Полная проверка качества кода..."
	cd frontend && npm run check

prism:
	@echo "Запуск Prism на http://localhost:$(PRISM_PORT)"
	npx prism mock frontend/public/openapi.yaml --port $(PRISM_PORT) --cors || echo "Ошибка: Prism не установлен. Установите: npm install -g @stoplight/prism-cli"

prism-stop:
	@echo "Остановка Prism..."
	-pkill -f "prism mock" || true

clean:
	@echo "Очистка..."
	-rm -rf frontend/node_modules
	-rm -rf frontend/dist
	-rm -rf node_modules
	@echo "Очистка завершена"

clean-all: clean
	@echo "Полная очистка..."
	-rm -rf frontend/package-lock.json
	-rm -rf package-lock.json
	@echo "Полная очистка завершена"

.PHONY: install dev build prism clean help
