#!/usr/bin/env bash
# Carga los secrets del Worker desde .env local.
# Uso: bash scripts/setup-secrets.sh
set -euo pipefail

if [ ! -f .env ]; then
  echo "No se encontró .env"; exit 1
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a

secrets=(
  RESEND_API_KEY CONTACT_TO_EMAIL CONTACT_FROM_EMAIL
  RESEND_TEMPLATE_ID RESEND_TEMPLATE_ID_EN
  GEMINI_API_KEY LLM_BASE_URL LLM_API_KEY
  QDRANT_URL QDRANT_API_KEY
)

for name in "${secrets[@]}"; do
  val="${!name:-}"
  if [ -z "$val" ]; then
    echo "Saltando $name (vacío en .env)"; continue
  fi
  printf '%s' "$val" | npx wrangler secret put "$name"
done

echo "Listo."
