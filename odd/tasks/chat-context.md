# Feature: chat context from the dictionaries

## Objective

Feed the chat model a generated, single-source-of-truth view of the portfolio, and stop
showing the raw chain of thought by default.

## Problem

- `SYSTEM_PROMPT` in `src/pages/api/chat.ts` hardcodes a "Featured projects" list that
  drifted from `src/i18n/locales/*.ts`: it lists a project that does not exist
  (Portfolio AI Chat), uses different descriptions, and ignores the request locale.
- The tool cards render before the intro sentence, because the server-side `execute`
  resolves in 0 ms while the model's text still streams.
- With `sendReasoning: true` the visitor sees raw English `<think>` output by default.

## Why

Generated context turns the prompt into the slot where retrieval lands later (RAG), and
removes a hand-maintained duplicate of the portfolio data.

## Scope

- `src/i18n/portfolio-context.ts` (new): compact, deterministic, locale-aware projection
  of projects and stack.
- `src/pages/api/chat.ts`: build the system prompt per locale; drop the hardcoded list.
- `src/components/ChatPanel.tsx`: render text before tool cards.
- `src/components/chat/ReasoningBlock.tsx`: collapsed by default, live elapsed counter.

Out of scope: RAG itself, model-authored card payloads, filter chip in the card header.

## Tasks

- [x] T1 Build `buildPortfolioContext(locale)` from the dictionaries.
- [x] T2 Inject it into a per-locale system prompt and delete the hardcoded list.
- [x] T3 Order text parts before tool cards.
- [x] T4 Collapse reasoning by default with an elapsed counter.

## Acceptance criteria

- The prompt no longer carries a hand-written project list.
- A visitor asking about projects sees the intro sentence above the card.
- While the model thinks, the UI shows a live counter, not raw reasoning.

## Constraints

- Card payloads stay deterministic (tool `execute`), never model-authored.
- Stack labels derive from `devicon:*` ids, because the dictionaries store icons.

## Evidence

- `getProjects`/`getStack` read from `src/i18n/locales/{es,en}.ts` (`portfolio-data.ts:19`).
- Compact projection measured at ~230 tokens, cached by the gateway prefix cache.
- `pnpm`-free repo: build with `bun run build`.

## Next step

Verify with a live request that the model answers from the context and still calls the
card tool.
