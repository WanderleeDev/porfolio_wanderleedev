# RAG sobre Vectorize (adiós Qdrant)

> Migración del retrieval del chat de Qdrant (autohospedado) a Cloudflare Vectorize
> (binding nativo). Objetivo: cero servicios que mantener y cero librerías que
> puedan no correr en workerd. Rama `dev`.

## Specs

- **S1** — «vamonos a migracion a vectorize»: el retrieval del chat pasa a usar
  Cloudflare Vectorize a través del binding `VECTORIZE`, sin SDK ni cliente HTTP
  propio.
- **S2** — «primero borra todo lo referente a qdrant»: al terminar no queda
  ninguna referencia a Qdrant en el repo (código, config, env, secrets, tests,
  scripts ni dependencias). Se ejecuta al final de la migración, no al principio:
  borrar antes deja el chat sin retrieval y el árbol sin compilar.

## Contexto verificado

- Corpus chico (portfolio), embeddings `qwen3-embedding:0.6b` → **512 dimensiones**.
- Hoy: `src/lib/qdrant.ts` (`searchCorpus`, fetch puro), `src/lib/rag/qdrant.ts`
  (alias + versionado + híbrido), `src/lib/rag/sparse.ts` (encoder sparse),
  `src/lib/rag/points.ts` (arma `{dense, sparse}`), scripts `build-rag-index.ts`,
  `ingest-qdrant.ts`, `query-rag.ts`.
- Vectorize: denso únicamente, escrituras **asíncronas**, sin `score_threshold`,
  sin alias (sí `namespace`), dims inmutables.
- El binding **no existe** en `astro dev` (adapter de Node), sólo en workerd.

## Tasks

| ID | Tarea | Specs | Ruta |
| --- | --- | --- | --- |
| T1 | Crear el índice `portfolio-corpus` (512 dims, cosine) y el binding en `wrangler.jsonc` | S1 | dueño (requiere `wrangler login`) |
| T2 | `src/lib/rag/vectorize.ts`: query al binding (lectura dinámica de `cloudflare:workers`) + filtro de `RAG_MIN_SCORE` en el Worker. Sin cambio de firma: `searchCorpus(embedding, limit)` se mantiene | S1 | worker |
| T3 | `searchCorpus` delega en Vectorize y cae a un índice NDJSON en memoria cuando no hay binding (dev con adapter de Node). Archivo: `data/rag-vectors.ndjson`, gitignoreado | S1 | worker |
| T4 | Ingesta: el script existente emite `data/rag-vectors.ndjson` (`{id, values, metadata:{text,source}}`) listo para `wrangler vectorize insert` | S1 | worker |
| T5 | Verificación: chat real en producción devuelve stream con contexto | S1 | worker + dueño (deploy) |
| T6 | **Contraer**: borrar `src/lib/qdrant.ts`, `src/lib/rag/qdrant.ts`, `sparse.ts`, `points.ts`, scripts de Qdrant, `QDRANT_*` del schema / `.env.example` / `setup-secrets.sh`, tests de Qdrant y la dep | S2 | worker |
| T7 | Mejora posterior: boost por keyword sobre el texto de la pregunta (recupera parte del híbrido perdido). Requiere pasar la pregunta a `searchCorpus` | S1 | worker |

## Log

- **L1** — «vamonos a migracion a vectorize pero primero borra todo lo referente a
  qdrant» (pedido del dueño). Ajuste acordado: el borrado (T6) va al final para
  no dejar el chat sin retrieval a mitad de camino.
- **T2, T3 y T4** — completadas y verificadas: `src/lib/rag/vectorize.ts`
  (binding + filtro `RAG_MIN_SCORE` en el Worker), `api/chat.ts` cambia sólo el
  import, `build-rag-index.ts` emite `data/rag-vectors.ndjson` (76 vectores).
  **117 tests verdes**, build verde. Commits `3ca73a2` y `8071ed8`.
- **T1** — completada por el dueño: índice `portfolio-corpus` (512 dims) creado
  y binding `VECTORIZE` (`remote: true`) agregado a `wrangler.jsonc`.
- **Ingesta** — 76 vectores desde el corpus real; `vectorCount = 76` y
  `processedUpToDatetime` presente (indexación completa).
- **T5** — deploy en `dev` verde y **chat real en producción = 200 con stream**,
  mencionando 8 proyectos reales del corpus. Latencia: **31 s** (61 s en local).
- **Bug del camino de dimensiones**: el gateway devuelve 1024 dims por defecto y
  Vectorize esperaba 512 (`40006`) → se fijó `dimensions: LLM_EMBEDDING_DIMENSIONS`
  en `llm.ts` y slice de seguridad en `vectorize.ts` (`f57dc27`).
- **Modelo de chat**: el servidor sirve `lfm3:1.7b` (no existe `lfm2.5:8b`);
  `LLM_MODEL` ya cargado en Variables de GitHub como `lfm3:1.7b` y redeployado.