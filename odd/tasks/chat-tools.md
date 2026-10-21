# Chat tool calling (generative UI)

> El modelo llama herramientas y el chat renderiza tarjetas con datos
> estructurados. Worktree `feat/chat-tools` (basado en `feat/redesign`).

## Specs

- S1. El endpoint `/api/chat` (AI SDK v7) agrega herramientas con `tool({
  description, inputSchema, execute })` y `stopWhen: stepCountIs(3)` para
  permitir texto → herramienta → texto.
- S2. Dos herramientas para empezar:
  - `showProjects`: devuelve los proyectos destacados reales del portafolio.
  - `showStack`: devuelve el stack categorizado real.
- S3. Las tarjetas muestran **datos reales** (i18n), no lo que invente el
  modelo. El locale se pasa por la header `x-locale` del request.
- S4. El cliente renderiza las partes del mensaje (`parts`): texto,
  `tool-showProjects`, `tool-showStack`, y estados pendientes (esqueleto).
- S5. Tarjetas: `ProjectsCard` y `TechnologiesCard` (React), con los tokens
  semánticos del chat. Sin iconos en v1 (pills de texto); iconos = follow-up.
- S6. El pet sigue reaccionando igual (basado en el status de useChat).
- S7. Sin comentarios en código nuevo.

## Tasks

- T1 · S1 · deps · doc + `zod` · commit 1
- T2 · S3 · module · helper de datos por locale · commit 1
- T3 · S1,S2,S3 · server · tools en `chat.ts` · commit 2
- T4 · S4,S5 · ui · `ProjectsCard` + `TechnologiesCard` · commit 3
- T5 · S4,S6 · ui · refactor `ChatPanel` a parts + header `x-locale` · commit 3
- T6 · verify · build + playwright · (sin commit)

## Log

- L1 (usuario): "ahora si vamos a implemntar el tool calling en un worktree"
- L2 (usuario, decision): tarjetas primero = "Proyectos + Stack".
- L3 (decision técnica): sin `@iconify/react` (solo astro-iconify, Astro-only)
  -> tarjetas con pills de texto en v1, iconos quedan como follow-up. Locale por
  header `x-locale`. Datos reales de `projects.list` y `stack.list` en i18n.
- L4 (verificacion, 4372): tool calling funciona. `showProjects`/`showStack`
  devuelven datos REALES de i18n; las tarjetas renderizan (PROYECTOS con
  Ecommerce/Ubuntu/Ngx-theme/Switch 2; Stack con Frontend/Backend/AI&Tools).
  Pet thinking->idle, 0 errores consola, mobile 390 sin scroll H.
  Bug arreglado: TechnologiesCard crash React #62 por componente anidado
  `TechRow` + `style`-string -> reescrita plana con `style`-objeto.
  Nota: los chips de guia mandan prompts de texto; si el modelo llama la
  herramienta sale tarjeta, si no sale texto (depende del modelo).
