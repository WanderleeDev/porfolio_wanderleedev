#!/usr/bin/env bash
# Carga los secrets del Worker desde .env local.
# Uso: bash scripts/setup-secrets.sh [--dry-run]
#
# Usa `wrangler secret bulk`: un solo request con los N secretos, sin desplegar
# el Worker. No usa valores en argv (quedarían en el historial del shell):
# los valores viajan en un archivo temporal que se borra siempre.
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
)

# El nombre del Worker sale de wrangler.jsonc para no duplicar la verdad.
# Se lee con sed y NO con un parser JSON: wrangler.jsonc es jsonc (lleva
# comentarios) y limpiarlos con un re.sub ingenuo de `//` rompe cualquier valor
# que contenga "https://" — el script moría antes de subir nada.
# `"name"` aparece una sola vez en el archivo, así que no hay ambigüedad.
worker="$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' wrangler.jsonc | head -1)"

if [ -z "$worker" ]; then
  echo "No pude leer el nombre del Worker de wrangler.jsonc"; exit 1
fi

echo "Worker: $worker"

# El archivo de secretos vive fuera del repo y se borra siempre, incluso si el
# comando falla: son valores, no configuración versionada.
# Formato wrangler: JSON simple {"KEY": "value"} (no el {type,name,text} de cf).
tmpfile="$(mktemp)"
trap 'rm -f "$tmpfile"' EXIT

python3 - "$tmpfile" "${secrets[@]}" <<'PY'
import json
import os
import sys

path, names = sys.argv[1], sys.argv[2:]
payload = {}
for name in names:
    value = os.environ.get(name)
    if value:
        payload[name] = value
    else:
        print(f"Saltando {name} (vacío en .env)", file=sys.stderr)

if not payload:
    print("No hay secretos para subir (todos vacíos en .env)", file=sys.stderr)
    sys.exit(1)

with open(path, "w", encoding="utf-8") as handle:
    json.dump(payload, handle)
PY

bunx wrangler secret bulk "$tmpfile" --name "$worker" "$@"

echo "Listo."
