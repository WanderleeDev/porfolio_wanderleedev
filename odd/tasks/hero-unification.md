# Feature: hero-unification

## Objective
Merge MainBackground + HeroFan into one component that owns the intro
(badge/cat curtain), the stars canvas and the hero content, so the
hand-off between them is a single source of truth.

## Specs
S1. One component owns the intro curtain, the stars canvas and the hero content.
    `BaseLayout.astro` no longer injects a global background; `MainBackground.astro`
    and `HeroFan.astro` stop existing as separate components.
S2. The curtain has an opaque background that hides the hero during the intro,
    and the warp/stars canvas animation is still visible during the intro.
    Required paint order, bottom to top:
    hero content -> curtain (opaque) -> canvas -> badge.
S3. The tech-card rotations are preserved (`-rotate-6`, `rotate-2`, `-rotate-2`,
    `rotate-6`) and the hover restores them (`hover:rotate-0 hover:scale-105`).
S4. The hero reveal is driven by the component's own CSS through `--delay`;
    no GSAP writes inline transform/scale/rotate on hero elements.
S5. Dead code is removed: `.hero-fade` (matches 0 elements), the ScrollToPlugin
    call `gsap.set(document, {scrollTo: 0})`, and the `<head>` inline script that
    queried `#curtain` before the body existed.
S6. `astro build` passes and the intro still runs end to end on a first visit.

## Tasks
| ID | Spec | Route | Commit |
|----|------|-------|--------|
| T1 | S1 | inline | create `src/components/Hero.astro` merging both components |
| T2 | S2,S4 | inline | curtain opaque + layer order + CSS reveal with `--delay` |
| T3 | S3 | inline | drop GSAP from hero so card rotate/hover survive |
| T4 | S1,S5 | inline | remove from BaseLayout (background + dead head script) |
| T5 | S1 | inline | repoint es/en index at `Hero`, delete both old components |
| T6 | S6 | inline | build + browser verification of first visit and repeat visit |

## Log
L1 (user, verbatim): "me gustaria unifincar el mainbackground con el herofan"
L2 (user, decision): merge into a single component; BaseLayout stops injecting
   the global background; the old file is deleted.
L3 (user, decision): unify plus clean dead code in this same change.
L4 (user, verbatim): "si pones la cortina iugual se termianra viendo la animacion
   inicial de canvas?  y si veo que los rotate de las cards no se conservan"
   -> answered: with today's z-values (curtain 1000 > canvas 999) an opaque curtain
   WOULD hide the warp. Fix is layer order hero -> curtain -> canvas -> badge.
   Confirmed the rotations are lost: GSAP writes inline `rotate: none; scale: none`
   on every `.tech-card` (computed rotate = "none" on all four).
L5 (user, decision): fix the fan; rotated cards plus live hover.
L6 (parent, evidence): Title.astro renders `<h1 class>` without the astro scope
   attribute, so the compound rule `.hero-reveal .hero-word` compiled by Astro to
   `.hero-reveal[cid] .hero-word[cid]` never matched (computed transitionDelay 0s,
   display inline 155px vs inline-block 115px measured in browser).

## Verification evidence
### Before (all measured in browser, not inferred)
- curtain transparent: `rgba(0,0,0,0)`; canvas z 999; hero z auto/static.
- `.tech-card` computed rotate "none" x4 -> fan flat, hover dead (GSAP inline override).
- `.hero-word` computed transitionDelay "0s" -> the rule never matched.
- console: `Invalid property scrollTo` + `GSAP target not found` x2 (3 warnings).
- `.hero-fade` matched 0 elements.
### After
- `astro build`: pass, 2 pages.
- console: 0 errors, 0 warnings (was 3 warnings).
- `#hero .tech-card` rotate: `-6deg, 2deg, -2deg, 6deg` (fan restored).
- hover on card 0: `-6deg/none` -> `0deg/1.05`, `matches(':hover')` true.
- `.hero-word`: `display: inline-block`, delays `0s / 0.1s / 0.2s` (--delay now applied).
- layer order: curtain z20 / canvas z30 / badge z40; canvas ABOVE curtain so the
  warp stays visible (the point the user asked about).
- curtain opaque in all three themes, hero hidden during intro (`elementFromPoint(640,190).id === "curtain"`):
  light `rgb(255,255,255)`, dark `rgb(22,24,36)`, neon `rgb(16,20,36)`.
- first visit (prod build): curtain block, heroReady false, overflow hidden, intro-seen null,
  canvas painted (5786 sampled alpha>0 px during warp).
- repeat visit (prod build, intro-seen=1): curtain+badge none, canvas z0, heroReady true,
  overflow free, cards animating with rotate intact.
- cards stay hidden (opacity 0) during the warp, as in the pre-refactor behaviour.
- `/en` served 200, layer order identical, badge present.
- repeat visit never showed the curtain (`display` sampled as `none` on all 12 samples
  across load) -> no badge flash on return visits.
- compiled production script resolves `const isDev = false`, so the inline skip works
  in prod and the intro always runs in dev.
### Open / not mine
- The working tree also holds PRE-EXISTING uncommitted work unrelated to this task
  (17 files: `global.css` -87, `brutalist` removed from the theme list, `Experimental`,
  `FeaturedWork` prop change, `TechJourney`/`MoreWork` commented out, i18n, cloudinary).
  `BaseLayout.astro` and both page files mix that work with this change, so a commit
  must be staged surgically. Not committed: no explicit user request, and we are on
  the default branch `main`.
### RED for the head-script bug (reproduced, not asserted)
Minimal harness `<html><head><script>document.querySelector('#curtain').classList.add(...)`
with `#curtain` in body -> `TypeError: Cannot read properties of null (reading 'classList')`,
class never applied. The same script exists in HEAD at `BaseLayout.astro:98-101`.
### Regression I caught in my own diff
Parity diff against the old `<style>` block found I had dropped the four
`@property --hero-color-*` declarations; without them `transition: --hero-color-N`
cannot interpolate and the hover gradient would snap. Restored.
I also dropped a real `window.scrollTo(0, 0)` (not the broken `gsap.set(document,{scrollTo:0})`)
and restored it.

## Independent verification (gentle-ai-verify, task mva7a3d4-1-iyt4)
Verdicts: S1-S6 all PASS; `bun run build` exit 0 confirmed independently. It reproduced the
parity claims statically (`@property` x4, `:has()` x4, rotates, no GSAP on cards).
All browser-measured "After" claims were correctly reported as unavailable to it (no browser).

### Regression it found in MY diff (valid, fixed)
ThemePicker is `z-[999]` (`src/components/ThemePicker.astro:19`) and the old curtain was
`z-1000`, so it covered the picker. My first layout used z-20/30/40, which let the picker float
above the intro (visible in my own earlier screenshot as the ES + monitor buttons).
Fixed: curtain `z-[1000]`, canvas `z-[1001]`, badge layer `z-[1002]`. Re-verified in browser:
z 1000/1001/1002 vs picker 999; `elementFromPoint` at the picker corner returns `curtain`;
on a repeat visit the picker is visible again and the fan rotates are intact.

### Findings it attributed to this change that are NOT mine (checked)
It diffed against HEAD, but HEAD is not the state this work started from: the tree already
carried uncommitted work.
- "Dropped `#bar-1`/`#bar-2` bars": those lived in `HEAD:src/components/IntroCurtain.astro`,
  ALREADY deleted (unstaged `D`) before this task began. The file read at the start had no
  bars (grep for `bar-1` found none).
- "`.also__title` scoped-vs-Title mismatch": the latent bug is REAL and measured - the rule
  declares `margin:2rem 0 1rem`, `letter-spacing:0.18em`, `color:var(--soft)`; computed in
  browser `margin 0px`, `letterSpacing -1.2px`, `color rgb(17,17,17)`. But in HEAD it was a
  native `<h3 class="also__title">` that matched; the worktree switched it to `<Title level={3}>`.
  Pre-existing uncommitted work, not this change.
- `FeaturedWork` props, `cloudinary.ts` default transform, `ScrollSmoother`, `.brutalist`
  removal, es/en page divergence: files this change never touched.

### Its note that does hold here
Hero's main script casts `getElementById(...) as HTMLElement` without a null guard (the old
`IntroCurtain` guarded). Safe because Hero always renders those ids; left as-is, since adding
guards would be defensive noise rather than a fix.

## Work-unit evidence
- Commit: pending (no explicit user request; and the tree mixes unrelated uncommitted work)

## Next step
- Await the user's decision on branch + surgical commit.