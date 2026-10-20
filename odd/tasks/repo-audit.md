# Feature: repo-audit

## Objective
Audit the whole repo: remove unused data (i18n keys, CSS tokens, files), strip stale comments, convert remaining component CSS to Tailwind, and rename components to semantic names.

## Problem
- Dead files still shipped: `GridProjects.astro`, `MoreWork.astro`, `RedesignHead.astro`, `utils/cloudinary.ts`, `public/gato-sprite.png`.
- Dead i18n keys in both locales: `journey.introTitle/outroTitle/outroDesc`, `skills.groupsLabel/attr_data`, `projects.sectionTitle/sectionDescription/attr_data`, `contactSection.submitSubject/sentence/aria/status.network`, `footer.rights`.
- Dead CSS tokens/utilities in `global.css`: `--color-rd-*` (+ `--rd-*` aliases), `--c-*`, `--ct-ink`, `--ct-err`, `--text-hero/section/sub`, `--spacing-120`, `--breakpoint-xs`, `.section-page`, `.font-inherit`, `.font-banner`, `.bg-tag`, `.float-element`, `.clip-bevel`.
- Component CSS instead of Tailwind: `ThemePicker.astro` has a ~160-line `<style>` block; `Hero.astro` has a global `<style>` block.
- Historical names: `RedesignFooter.astro`, `RedesignContact.astro`.
- Comments carry archaeology (S2/S3/S4 markers, "the old copy lived in <head>", "previous version") instead of current intent.

## Why
Dead weight misleads every future change; Tailwind-only styling keeps one styling system; semantic names stop the "Redesign" prefix from outliving the redesign.

## Scope
- src/components/** (rename, dead files, CSS→Tailwind, comments)
- src/i18n/locales/{es,en}.ts (dead keys)
- src/styles/global.css (dead tokens/utilities)
- src/utils/** (dead file, rename, trim exports)
- public/gato-sprite.png (dead asset)
- src/pages/{index,en/index}.astro (imports)

## Constraints
- No visual change except where a dead rule is removed. ThemePicker and Hero must render identically.
- No new deps. Tailwind v4 only.
- es/en locales stay structurally identical.
- `hero.title` must be wired into Hero.astro instead of the hardcoded "Fullstack,".
- Comments to keep: only non-obvious constraints (z-index ordering, canvas layering). Everything else goes.

## Tasks
- [ ] T1 delete dead files: GridProjects, MoreWork, RedesignHead, utils/cloudinary.ts, public/gato-sprite.png; trim utils/selectors.ts to `$`; rename utils/extra.ts → utils/env.ts
- [ ] T2 rename RedesignFooter.astro → Footer.astro, RedesignContact.astro → ContactSection.astro; update page imports
- [ ] T3 purge dead i18n keys in es+en; wire hero.title into Hero.astro
- [ ] T4 purge dead CSS tokens and utilities in global.css
- [ ] T5 convert ThemePicker.astro `<style>` block to Tailwind utilities
- [ ] T6 reduce Hero.astro global `<style>` to Tailwind classes on the elements
- [ ] T7 strip stale/archaeological comments across src
- [ ] T8 verify: `bun run build` + browser smoke (es/en, 3 themes, form submit, carousel)

## Acceptance criteria
- No file in src/ or public/ without an importer/reference.
- No i18n key in es/en that no component reads.
- No CSS custom property or utility class in global.css without a consumer.
- Zero `<style>` blocks outside global.css.
- No component name prefixed with "Redesign".
- `bun run build` passes; pages render identical in light/dark/neon.

## Log
- L1 (2026-10-19) User request: "audites el repo total buscando data q no e use quietar coentarios y transformar css en tailwind, si ha codigo que ya no s usa y ademas renombra los componetes q sean mas semanticos, ejm q es eso de redesign fotter deberia ser simpemnte foote"
- Audit performed with per-token/per-key usage scans over src/**. Findings above are measured, not guessed.
