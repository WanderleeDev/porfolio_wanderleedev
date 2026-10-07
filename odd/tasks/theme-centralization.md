# Feature: theme-centralization

## Objective
Centralize text/bg colors under light vars, mirror them into Tailwind v4 @theme so components use only Tailwind classes, generate dark version, and make ThemePicker restore from localStorage with system fallback.

## Problem
- Tokens live in @theme (--color-rd-*, --color-dark-*) + :root aliases, but no `.light` scope and no class-based dark variant.
- Components use hardcoded Tailwind neutrals (bg-white, text-neutral-*) and hex (bg-[#eceef3]) instead of semantic classes.
- ThemePicker already reads localStorage with system fallback but has no head anti-FOUC script and weak validation.

## Why
Single source of truth for light/dark, no hex spread, only Tailwind semantic classes.

## Scope
- src/styles/global.css (@theme, :root/.light, .dark, custom-variant)
- src/components/ThemePicker.astro (validation + system listener + UI sync)
- src/pages/index.astro + src/pages/en/index.astro (inline anti-FOUC head script)
- src/components/HeroFan.astro, FeaturedWork.astro, TechJourney.astro, MoreWork.astro (light homologation, keep brand accents)
- src/components/RedesignContact.astro, RedesignFooter.astro (dark surfaces via tokens)
- Route: delegated direct degraded to inline (Task provider blocked: OpenCode free tier Console) — evidence: ses_eea7fc2b1ffeJjzdyoijzlqYy4

## Constraints
- Tailwind v4 (@import tailwindcss, @theme). Dark via class needs @custom-variant.
- Brand/icon hex in i18n + TechJourney accents stay as data (not theme).
- RedesignContact is intentionally dark section, independent of page theme.

## Checklist
- [ ] T1 centralize tokens: :root/.light semantic + @theme + .dark overrides + color-scheme + custom-variant dark
- [ ] T2 homologate light components to bg-surface/text-ink/etc (no bg-white/text-neutral hardcodes)
- [ ] T3 dark version: .dark token values verified + contact/footer use dark tokens
- [ ] T4 picker: getSaved validation, localStorage -> system fallback, change listener updates UI, head anti-FOUC in both pages
- [ ] T5 verification: astro build + grep no hex outside allowed + manual theme switch

## Authorized scope
Files listed in Scope only. No new deps. No Visual changes beyond theme correctness.

## Acceptance criteria
- Only Tailwind semantic classes for surface/ink/muted/border/badge in themed sections.
- `localStorage wdev-theme` respected; empty/corrupt -> prefers-color-scheme.
- No FOUC on reload; system change updates UI when mode=system.
- `astro build` passes.

## Progress
- 2026-10-07: doc created, route inline degraded (explorer Task blocked).
- T1 done: @custom-variant dark, semantic @theme, :root/.light + .dark, color-scheme, body bg/ink, p inherit.
- T2 done: HeroFan/FeaturedWork/TechJourney -> bg-surface/text-ink/soft/muted/border-line/bg-badge; Contact/Footer -> bg-dark-*/text-dark-*.
- T3 done: .dark overrides verified; contact keeps --c-* dark independent.
- T4 done: picker validates localStorage, system fallback, UI sync on system change; anti-FOUC inline in both pages.
- T6 contrast fix reverted per user review (tokens back to soft #6b7280 / muted #9ca3af light).
- T7 done: contact block fully themed via --ct-* (light ink/acc #4f46e5/err #dc2626, dark back to dark palette); button + links use semantic classes.
- T8 done: Inter for non-titles (font-sans token + faces 400/500/700/800, classes renamed).
- T9 done: carousel prev/next arrows flanking the pill (relative step + wrap).
- T10 done: neon theme (black + sky/violet glows, transparent surface, picker option + anti-FOUC).
- T11 done: brutalist theme (paper, black hairlines, yellow badge w/ hard shadow).
- T12 done: pixel theme (pico-8 palette, squared pill/buttons, Press Start 2P on pill/options).
- T13 done: frutiger aero theme (glossy sky gradient, glass badge, glossy submit).
- Engram mirror: pending (mem_save blocked: multiple active runtime sessions).

## Verification evidence
- `bun run build`: pass (2 pages, 1.32s).
- grep themed hardcodes (bg-white/text-neutral-/bg-neutral-/bg-[#]): 0 matches.
- `git diff --stat`: 9 files, +123/-36.

## Next step
- Manual: switch system/light/dark in picker, reload (no FOUC), system change with mode=system.

## Work-unit evidence
- Commit: 69164b0 `feat(theme): centralize light/dark tokens in Tailwind theme with system picker`
- Assess: risk medium (executable_change FeaturedWork.astro), review_due false, reason under_budget (216 lines). Slice pending until budget.
