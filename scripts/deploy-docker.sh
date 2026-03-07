#!/usr/bin/env bash
set -euo pipefail

# Always use the deployment env file for both compose substitution and container env.
COMPOSE="docker compose --env-file .env.deploy -f docker-compose.deploy.yml"

if [ ! -f .env.deploy ]; then
  cp .env.deploy.example .env.deploy
  echo "[deploy] created .env.deploy from template"
  echo "[deploy] edit .env.deploy before exposing this server to the internet"
fi

APP_PORT=$(grep -E '^APP_PORT=' .env.deploy | tail -n 1 | cut -d '=' -f 2)
APP_PORT=${APP_PORT:-3000}

wait_for_postgres() {
  local cid
  cid="$($COMPOSE ps -q postgres)"
  if [ -z "$cid" ]; then
    echo "[deploy] postgres container not found"
    exit 1
  fi

  for _ in $(seq 1 60); do
    local status
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$cid")
    if [ "$status" = "healthy" ]; then
      echo "[deploy] postgres is healthy"
      return 0
    fi
    sleep 2
  done

  echo "[deploy] postgres did not become healthy in time"
  exit 1
}

echo "[deploy] building images"
$COMPOSE build app auto-cancel-worker

echo "[deploy] starting postgres"
$COMPOSE up -d postgres
wait_for_postgres

echo "[deploy] applying migrations"
$COMPOSE run --rm app npm run prisma:migrate:deploy

if [ "${1:-}" = "--seed" ]; then
  echo "[deploy] running seed"
  $COMPOSE run --rm app npm run db:seed
fi

echo "[deploy] starting app and worker"
$COMPOSE up -d app auto-cancel-worker

echo "[deploy] stack started"
$COMPOSE ps

echo "[deploy] app should be reachable at http://<server-ip>:${APP_PORT}"
