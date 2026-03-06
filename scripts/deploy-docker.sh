#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.deploy.yml"

if [ ! -f .env.deploy ]; then
  cp .env.deploy.example .env.deploy
  echo "[deploy] created .env.deploy from template. Please edit secrets before production use."
fi

$COMPOSE up -d --build

echo "[deploy] stack started"
$COMPOSE ps

if [ "${1:-}" = "--seed" ]; then
  echo "[deploy] running seed"
  $COMPOSE exec app npm run db:seed
fi