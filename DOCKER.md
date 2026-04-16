# Docker Deployment Guide

## Сборка образа

```bash
docker build -t calendar-booking .
```

## Запуск контейнера

### Базовый запуск (порт 3000 по умолчанию)
```bash
docker run -p 3000:3000 calendar-booking
```

### Запуск с кастомным портом
```bash
docker run -p 8080:8080 -e PORT=8080 calendar-booking
```

### Запуск в фоновом режиме
```bash
docker run -d -p 3000:3000 --name calendar-app calendar-booking
```

## Проверка работы

```bash
# Health check
curl http://localhost:3000/up

# API endpoints
curl http://localhost:3000/public/owner
curl http://localhost:3000/public/event-types

# Frontend (откроет React приложение)
curl http://localhost:3000/
```

## Архитектура

- **Frontend**: React 19 + Vite → собирается в `frontend/dist/`
- **Backend**: Ruby on Rails 7 API-only + Puma
- **Production**: Rails раздаёт статические файлы из `public/` (включая собранный frontend)
- **Client-side routing**: Обрабатывается через fallback route (`*path` → `static#index`)

## Environment Variables

- `PORT` - порт, на котором запускается приложение (по умолчанию: 3000)
- `RAILS_ENV` - установлено в `production` в образе
- `RAILS_LOG_LEVEL` - уровень логирования (по умолчанию: info)
