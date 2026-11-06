#!/usr/bin/env bash
# Carga los secrets del Worker desde .env local.
# Uso: bash scripts/setup-secrets.sh [--dry-run]
#
# Usa `cf workers secrets bulk`: un solo request con los N secretos, sin desplegar
# el Worker (el CLI avisa que cambiar secretos de a uno crea una versión por
# llamada y que para varios conviene el patch en lote). Tampoco usa
# `cf deploy --secrets-file` a propósito: eso publicaría el build que tengas en
# `.cloudflare/output`, posiblemente viejo, desde tu máquina.
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

# El nombre del Worker sale de cloudflare.config.ts para no duplicar la verdad.
worker="$(python3 -c "
import re
src = open('cloudflare.config.ts', encoding='utf-8').read()
found = re.search(r'worker:\s*\{.*?name:\s*\"([^\"]+)\"', src, re.S)
print(found.group(1) if found else '')
")"

if [ -z "$worker" ]; then
  echo "No pude leer el nombre del Worker de cloudflare.config.ts"; exit 1
fi

# El archivo de secretos vive fuera del repo y se borra siempre, incluso si el
# comando falla: son valores, no configuración versionada.
tmpfile="$(mktemp)"
trap 'rm -f "$tmpfile"' EXIT

# JSON Merge Patch: cada secreto va como {type, name, text}. Lo arma python para
# no pelear con el escaping de comillas, backslashes y saltos de línea.
python3 - "$tmpfile" "${secrets[@]}" <<'PY'
import json
import os
import sys

path, names = sys.argv[1], sys.argv[2:]
payload = {}
for name in names:
    value = os.environ.get(name)
    if value:
        payload[name] = {"type": "secret_text", "name": name, "text": value}
    else:
        print(f"Saltando {name} (vacío en .env)", file=sys.stderr)

if not payload:
    print("No hay secretos para subir (todos vacíos en .env)", file=sys.stderr)
    sys.exit(1)

with open(path, "w", encoding="utf-8") as handle:
    json.dump(payload, handle)
PY

bunx cf workers secrets bulk --worker "$worker" --secrets "@$tmpfile" "$@"

echo "Listo."
