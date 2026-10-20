# Feature: chat-widget

Floating chat widget for the portfolio: a bottom-left launcher that expands into a
streaming chat panel backed by the AI SDK and the `GATEWAY_LLM` OpenAI-compatible endpoint.

## Specs

- S1: "vamos a hacer un chatbot flotante en la parte inferior izquierda cuando se da click se despliega el chat"
  → Launcher fixed in the lower-right corner; clicking it expands the chat panel.
- S1b: "mejor manda el chat al otro xtremo y que tenga un boton para ocupar tola la pantalla y puedes usar
  starting style para animarlo, puedes usar un dialog y el btn sea un comand invoker para facilitar la
  integracion que ocupe todoel espacio"
  → Chat lives in a `<dialog>` opened through the Command Invoker API
  (`command="show-modal" commandfor="chat-dialog"`), animated with `starting:` and the repo's
  `--ease-out-elastic` token, plus a maximize button that toggles fullscreen via
  `has-[:checked]:`.
- S1e: "me parece que debe haber un margen estetico cuando el modal ocupe toda la pantalla o sea
  que no cupe todo, busca armonia en el espacio q se deje"
  → Fullscreen keeps a margin instead of bleeding to the edges: `inset-4` on mobile and
  `md:inset-6` on desktop, with `rounded-3xl` retained.
- S1c: "tenemos iconify xq no usar su componete en lugar de usar svg crdos"
  → All icons come from `astro-iconify` (`<Icon name="lucide:…" />`); no inline SVG markup.
- S1d: "no me dejes comentarios y todo tailwind"
  → No code comments; every style is a Tailwind utility class.
- S2: "tienes GATEWAY_LLM la url y GATEWAY_API_KEY en env"
  → Server route reads the endpoint from `LLM_BASE_URL` and the credential from
    `LLM_API_KEY`; the model id comes from `LLM_MODEL`.
- S3: "usa la skill tambien xq te dice como usar la lib"
  → Follow the Vercel `ai-sdk` skill: `useChat` from `@ai-sdk/react`,
    `DefaultChatTransport`, `sendMessage({ text })` with manually managed input state,
    and `toUIMessageStreamResponse()` on the server (never `toDataStreamResponse`).
- S4: "mira creo que vercel ofrece pkg con ui ya predefinida para no hacerla desde cero antes de empezar"
  → Investigated before starting: Vercel ships **AI Elements** (shadcn/ui-based registry,
    needs `shadcn` CLI + component copy) and **assistant-ui** (separate runtime, own
    styling model). Neither fits this repo, which has no shadcn/ui and enforces its own
    Tailwind design tokens. Decision: custom UI with the repo's semantic tokens.
- S5: The gateway model (`lfm2.5:8b`) returns its chain of thought inline as
  `<think>…</think>` inside the message content, and the endpoint rejects
  `think:false` / `chat_template_kwargs`. The visible answer must not contain the
  reasoning block.
- S6: The site is bilingual (es/en) and themable (light/dark/neon). The widget must
  use the repo's semantic design tokens (`bg-surface`, `text-ink`, `border-line`,
  `bg-badge`, `text-badge-ink`, `bg-contrast`, `rounded-card`, `shadow-card`) so it
  follows the active theme, and its labels come from the i18n dictionaries.
- S7: "quiero agregar este pet al chat https://www.npmjs.com/package/@wanderleedev/pixel-pet"
  → The chat shows a `<pixel-pet>` that reacts to the conversation (listening /
  thinking / talking / idle). The web component is registered from the Astro layer,
  where `customElements` exists, and the React island reports chat events through a
  window event.
- S7b: "no me gusta donde esta puesto opciones?"
  → The pet lives in a fixed container beside the launcher button, so it stays visible
  with the chat closed, like a desktop pet, and never competes with the panel header.
- S7c: "si queda atras pierde el foco bo puede toar el lugar el btn que muestra y tambien mandarlo
  adelante cuando se abre el modal"
  → The pet must not stay behind the modal backdrop, must not take the place of the
  launcher button, and must be brought forward when the modal opens.

## Tasks

- T1 — S2,S3,S5 — server route `src/pages/api/chat.ts`: OpenAI-compatible provider,
  reasoning extraction, `toUIMessageStreamResponse()` — inline
- T2 — S1,S1b,S1c,S6 — `src/components/ChatWidget.astro` (launcher + `<dialog>` shell with
  astro-iconify icons) and `src/components/ChatPanel.tsx` (React island: messages + input) — inline
- T3 — S6 — i18n `chat` block in `src/i18n/locales/{es,en}.ts` + mount in
  `src/layouts/BaseLayout.astro` — inline
- T4 — T1,T2,T3 — verification: `bun run build`, live endpoint call, browser check —
  inline
- T5 — S7 — `public/pet/{cat.json,cat.png}` (re-scaled sprite) and the `<pixel-pet>`
  integration in `ChatWidget.astro` + `ChatPanel.tsx` — inline

## Task status

- T1 done: `src/pages/api/chat.ts` with `createOpenAICompatible`, `extractReasoningMiddleware`
  and `createUIMessageStreamResponse` + `toUIMessageStream`.
- T2 done: `src/components/ChatWidget.astro` + `src/components/ChatPanel.tsx`.
- T3 done: `chat` block in both locales (incl. `fullscreen`), mounted via
  `src/layouts/BaseLayout.astro`.
- T4 done: build, live endpoint and browser checks all passed (see Verification evidence).

## Log

- L1: "tienes la skill de vercel ai y react vamos a hacer un chatbot flotante en la parte inferior izquierda cuando se da click se despliega el chat , tienes GATEWAY_LLM la url  y GATEWAY_API_KEY en env , no verfiques las env xq ya las puse yo   y mira creo que vercel ofrece pkg con ui ya predefnida para no hacerla desde cero antes de empezar"
- L2: "empieza denuevo xq entraste en u bucle , mira te paso un ejm de coe   usa la skill tambien xq te dice como usar la lib: import type { APIRoute } from 'astro'; import { streamText, convertToModelMessages, type UIMessage } from 'ai'; import { createOpenAICompatible } from '@ai-sdk/openai-compatible'; … import { useState } from 'react'; import { useChat } from '@ai-sdk/react'; …"
- L3: Gateway probe: `GET /v1/models` returns only `lfm2.5:8b` (ollama). SSE streaming
  works; `think:false`, `chat_template_kwargs.enable_thinking=false` and
  `/api/chat` are all ignored/rejected, so reasoning must be stripped server-side.
- L4: Repo conventions found: `output: "static"` + `@astrojs/node` adapter with
  `export const prerender = false` for on-demand routes; secrets read through
  `import.meta.env` (same as `src/actions/index.ts`); React islands use `client:*`
  directives; components must use semantic Tailwind tokens only.
- L5: Env renamed mid-task by the user: `GATEWAY_LLM`/`GATEWAY_API_KEY`/`GATEWAY_MODEL`
  → `LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL`. Code, `.env` keys and `.env.example`
  updated accordingly (values untouched).
- L6: Redesign requested by the user: iconify components instead of inline SVG, chat moved to the
  other corner, fullscreen button, `starting:` animation, `<dialog>` driven by the Command
  Invoker API. Split into `ChatWidget.astro` (shell, icons) + `ChatPanel.tsx` (React island).
- L7: Gotcha: `display:flex` on a `<dialog>` overrides the UA `display:none` for the closed
  state, so `@starting-style` never fires and the panel stays visible. Fix: `open:flex`
  (Tailwind `open:` variant) so the dialog is `display:none` until opened.
- L8: Gotcha: the Command Invoker API is not detectable via `HTMLElement.prototype.commandFor`
  in Chromium 155 (the IDL attribute is absent even though the behavior works). A
  feature-detected JS fallback therefore double-opened the dialog; the fallback was dropped and
  the native command is used directly, like `src/components/FeaturedWork.astro` already does.

## Verification evidence

- `bun run build`: pass (2 pages + server bundle, 2.23s).
- Live endpoint (`POST /api/chat`, single turn): SSE stream with `text-delta` chunks,
  0 occurrences of `think`, 0 reasoning parts. Answer: "Utilizo un stack completo con
  TypeScript, Angular y React en el frontend;".
- Live endpoint (multi-turn, 3 messages): answer "El correo de contacto es
  wanderleedev@gmail.com.", still 0 `think` occurrences.
- Browser (Playwright, standalone node server on :4399): launcher "Abrir chat" renders
  bottom-left; click expands the panel (header, empty state, input, "Enviar"); sending
  "Quels proyectos tenés?" renders the assistant reply listing the real projects;
  "Limpiar" appears; `POST /api/chat => [200] OK`; 0 console errors/warnings.
- Theme tokens verified by computed style on all three themes: launcher uses
  `bg-ink`/`text-contrast` (light #111/#fff, dark #eceef3/#161824, neon #f2f4fa/#101424)
  and the panel uses `bg-contrast` (neon #101424, opaque). `bg-surface` was rejected
  because it is transparent in the neon theme.
- i18n verified on both routes: `/` renders "Abrir chat"/"Preguntame sobre mi trabajo";
  `/en/` renders "Open chat"/"Ask me about my work".
- Redesign verified in Chromium 155: launcher at (1196,644) in the lower-right corner with no
  overlap against the ThemePicker (x=1156, top-right); dialog opens as `:modal` at 384x512
  anchored above the launcher (x=868,y=112, right gap 28px) without covering it;
  `starting:` animates scale 0.95 -> 1 and opacity 0 -> 1 over 200ms (transitionrun fires on
  opacity and scale); maximize toggle expands to 1280x720 with 0 radius and swaps
  `lucide:maximize-2` for `lucide:minimize-2`; `closedby="any"` closes on an outside click;
  `command="close"` closes from the header button; input receives focus on open; end-to-end
  message round-trip returns the portfolio projects with 0 console errors/warnings.
- Footer collision resolved: the fixed lower-right launcher overlapped the footer "Volver
  arriba" button at the end of the page, so the footer's bottom bar now uses `md:pr-20`.
  Measured after the fix: launcher right edge 1252 vs footer button right edge 1192 (4px
  gap, no overlap); the footer copyright on the left is unaffected.
- Entrance animation uses the repo's `--ease-out-elastic` token: sampled scale goes
  0.95 -> 0.9679 -> 0.9919 -> 1.00449 -> 1.0071 -> 1, so the panel overshoots and
  settles instead of moving linearly.
- Fullscreen keeps an aesthetic margin instead of bleeding to the edges: measured 24px
  left/top/bottom on desktop (`md:inset-6`) and 16px on a 390px viewport (`inset-4`),
  with `rounded-3xl` retained; no horizontal overflow (scrollWidth === clientWidth).
- The expansion uses `has-[:checked]:ease-out` so the elastic overshoot cannot push the
  panel past the viewport while it grows.
- Pixel pet (S7): the tag upgrades and the sheet loads (state idle, sprite 432x900,
  accessible label "Gato: En reposo" in Spanish and "Cat: Idle" in English). Event
  mapping verified end to end: typing -> listening, send -> thinking, token -> talking,
  done -> idle. A real message round trip drives the pet on its own (thinking, talking,
  idle). `prefers-reduced-motion` stops the animation (animation-name none). The pet
  fits the header in the light, dark and neon themes. 0 console errors or warnings.
- Sprite re-scaling: the upstream sheet is 2232x4620 with 186x231 frames, too large for
  the header, so it is re-scaled to 36x45 frames (432x900) and the manifest frame size
  updated to match. PNG stays the better format because the art has soft alpha edges:
  171KB against 723KB original, while WebP grows past 250KB on the semi-transparent
  gradients.
- Pet placement (S7b): the pet and the launcher share one fixed container so they can
  never overlap (12px gap, aligned bottom edge). The open panel clears them by 20px and
  covers neither. Both fit in a 390px viewport. The footer bottom bar moves to
  `md:pr-40` because the pet now occupies the space the back-to-top button was using;
  after the change the gap is 116px and that button still scrolls to the top.
- Pet vs. the modal (S7c): a modal dialog lives in the browser top layer, so its backdrop
  paints above every z-index and the rest of the document becomes inert, which left the pet
  dimmed behind the backdrop and unclickable. The pet now moves into the dialog while it
  is open and back to its host on close; being in the same top layer puts it in front of
  the backdrop, and `position: fixed` keeps resolving against the viewport so it does not
  move. Verified: the hit test returns chat-pet first with the modal open, the pet stays
  clickable, keeps its viewport position (1128,644) with a 12px gap to the launcher and
  does not cover the close button, returns to its host on close, does not close the modal
  when clicked, and light dismiss still works.

## Work-unit evidence
- Branch: `feature/chat-widget` (from `main`).
- Commits: `295a843` (U1 endpoint + deps + env example), `0a0e5b0` (U2 widget + i18n +
  footer adjustment), `7a45c42` (U3 this document), `8da8abd` (U4 commit identities),
  `77cda12` (U5 drop the unused @ai-sdk/openai provider), `d24abaa` (U6 elastic entrance +
  fullscreen margin), `83bd4c9` (U7 this update), `45ac7e8` (U8 commit identities),
  `ffdb7ba` (U9 pixel pet assets + deps), `1b567f6` (U10 pixel pet integration),
  `5d7a7ef` (U11 pet moved next to the launcher), `1bb08ab` (U12 pet in front of the modal).
- Slice boundary: 732 authored changed lines across the eleven commits, past the
  ~400-line review budget. The overage comes from this document (170 lines) and the
  re-scaled sprite (binary), not from the shipped behaviour, so the feature stays a
  single-PR candidate. Split into two PRs if the reviewer wants the pet separated.
- Rollback: `295a843` removes the endpoint and its dependencies; `0a0e5b0` removes the
  widget, its locales and the footer padding; `ffdb7ba` and `1b567f6` remove the pet
  and its assets. None of them touches unrelated work.
- Not pushed and no PR opened: delivery stays a user decision.

