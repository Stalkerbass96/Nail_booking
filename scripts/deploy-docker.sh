#!/usr/bin/env bash
set -euo pipefail

# Always use the deployment env file for both compose substitution and container env.
COMPOSE="docker compose --env-file .env.deploy -f docker-compose.deploy.yml"
LOG_TAIL_LINES="${LOG_TAIL_LINES:-60}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[deploy] missing required command: $1"
    exit 1
  fi
}

show_logs() {
  echo "[deploy] recent postgres logs"
  $COMPOSE logs --tail="$LOG_TAIL_LINES" postgres || true
  echo "[deploy] recent app logs"
  $COMPOSE logs --tail="$LOG_TAIL_LINES" app || true
  echo "[deploy] recent auto-cancel-worker logs"
  $COMPOSE logs --tail="$LOG_TAIL_LINES" auto-cancel-worker || true
}

on_error() {
  local exit_code=$?
  echo "[deploy] failed with exit code ${exit_code}"
  echo "[deploy] compose status"
  $COMPOSE ps || true
  show_logs
  exit "$exit_code"
}

trap on_error ERR

if [ ! -f .env.deploy ]; then
  cp .env.deploy.example .env.deploy
  echo "[deploy] created .env.deploy from template"
  echo "[deploy] edit .env.deploy before exposing this server to the internet"
fi

require_command docker
require_command curl

if ! docker compose version >/dev/null 2>&1; then
  echo "[deploy] docker compose plugin is not available"
  exit 1
fi

get_env_value() {
  local key="$1"
  grep -E "^${key}=" .env.deploy | tail -n 1 | cut -d '=' -f 2-
}

require_non_empty_env() {
  local key="$1"
  local value
  value="$(get_env_value "$key")"
  if [ -z "$value" ]; then
    echo "[deploy] .env.deploy is missing required value: $key"
    exit 1
  fi
}

warn_placeholder_env() {
  local key="$1"
  local value
  value="$(get_env_value "$key")"
  if [ -z "$value" ]; then
    echo "[deploy] warning: $key is empty"
    return 0
  fi

  case "$value" in
    change-me-*|replace-with-*|your-*|example-* )
      echo "[deploy] warning: $key still looks like a placeholder"
      ;;
  esac
}

APP_PORT="$(get_env_value APP_PORT)"
APP_PORT=${APP_PORT:-3000}
APP_BASE_URL="$(get_env_value APP_BASE_URL)"

require_non_empty_env APP_PORT
require_non_empty_env POSTGRES_DB
require_non_empty_env POSTGRES_USER
require_non_empty_env POSTGRES_PASSWORD
require_non_empty_env CRON_SECRET
require_non_empty_env ADMIN_AUTH_SECRET
require_non_empty_env ADMIN_SEED_PASSWORD
require_non_empty_env APP_BASE_URL

warn_placeholder_env POSTGRES_PASSWORD
warn_placeholder_env CRON_SECRET
warn_placeholder_env ADMIN_AUTH_SECRET
warn_placeholder_env ADMIN_SEED_PASSWORD

if printf '%s' "$APP_BASE_URL" | grep -Eq '127\.0\.0\.1|localhost'; then
  echo "[deploy] warning: APP_BASE_URL points to localhost"
  echo "[deploy] warning: this is okay for local testing, but LINE/self-link URLs will be invalid for real users"
fi

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

wait_for_http() {
  local url="$1"
  for _ in $(seq 1 60); do
    if curl --silent --show-error --fail "$url" >/dev/null; then
      echo "[deploy] http ready: $url"
      return 0
    fi
    sleep 2
  done

  echo "[deploy] http health check timed out: $url"
  return 1
}

echo "[deploy] validating compose file"
$COMPOSE config >/dev/null

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
wait_for_http "http://127.0.0.1:${APP_PORT}/api/public/categories"

echo "[deploy] stack started"
$COMPOSE ps

echo "[deploy] app should be reachable at http://<server-ip>:${APP_PORT}"
echo "[deploy] admin login: http://<server-ip>:${APP_PORT}/admin/login"
echo "[deploy] local health check: curl http://127.0.0.1:${APP_PORT}/api/public/categories"
echo "[deploy] configured APP_BASE_URL: ${APP_BASE_URL}"
echo "[deploy] if nginx is configured, verify https separately after this step"
