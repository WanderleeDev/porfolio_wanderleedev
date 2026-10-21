# Music player in the bottom slide

## Objective

Add an audio player to the bottom vertical slide of the "Principal" column
(`VSlide title="Abajo"`, currently a placeholder heading), composed of two
stacked pieces: the player controls on top and an arched fan of track cards
below, inspired by the reference fan of AI logos.

## Problem

The vertical stack of the central column ends in a placeholder
(`Contenido inferior`). The site has no audio surface beyond the chat pet's
incidental meow, and the reference design (fan of AI logos on cards) has no
counterpart in the deck.

## Why

The deck is the navigation model of the portfolio. The bottom slide is the only
unused slot, and a player is the natural place to show the AI stack with an
interactive, non-textual surface while staying inside the existing design
system (surface / ink / line / badge tokens).

## Scope

- New component `src/components/MusicPlayer.astro` with its own client script.
- New `player` block in `src/i18n/locales/es.ts` and `en.ts`.
- Wire the component into `src/pages/index.astro`, replacing the `Abajo`
  placeholder.
- No new dependencies, no new audio assets: `/meowth.mp3` is the demo source
  for every track until real files land.

Out of scope: Media Session API, persistence of volume/track across reloads,
routing the player to the other slides, new icon sets.

## Constraints

- Only semantic tokens from `src/styles/global.css` (surface, ink, contrast,
  soft, muted, line, badge, badge-ink, radius-card, shadow-card). No loose hex.
- `astro-iconify` fetches icons from `api.iconify.design` at build time and
  throws on unknown names in production. Verified names only.
- The deck controller (lines 214-236 of `src/components/deck/deck-controller.ts`)
  captures Arrow/Home/End on `window` and calls `preventDefault`. The player
  must stop propagation of those keys while focus is inside it.
- Reduced motion: equalizer animation must not run when the user prefers
  reduced motion.
- Artifacts in English; UI copy comes from the i18n locales.

## Tasks

- [x] T1 — Add the `player` copy block to `es.ts` and `en.ts` (eyebrow, title,
  subtitle, play, pause, prev, next, progress, volume, mute, unmute, select).
- [x] T2 — Build `src/components/MusicPlayer.astro`: player card (cover, now
  playing, equalizer, seek, transport, volume) plus the arched fan of seven
  track cards driven by per-card CSS custom properties.
- [x] T3 — Render `<MusicPlayer />` inside `VSlide title="Abajo"` in
  `src/pages/index.astro`.
- [x] T4 — Verify: production build, deck keyboard behavior, playback,
  track switching, theming in light/dark/neon.
- [x] T5 — Cover the player logic with `bun:test` after the review correction.

## Acceptance criteria

- The bottom slide shows the fan under the player card, no placeholder heading.
- Clicking a card selects that track, lifts the card and syncs cover, title and
  artist in the player.
- Play/pause, prev/next, seek and volume work; a finished track advances.
- The equalizer only animates while audio plays.
- Arrow keys inside the player never move the deck.
- `bun run build` succeeds and the three themes render with tokens only.

## Route

- T1, T3: delegated writer together with T2 (multi-file write).
- T2: delegated writer (single writer, no parallel writers).
- T4: parent spot check plus build run.

## Checks

- `bunx astro build` (or `bun run build`) — must end without errors.
- Manual: dev server on port 4321, bottom slide of the central column.

## Progress

- Created on branch `feat/music-player`.
- T1-T3 implemented and checked with headless Chromium at 1440x900, 1280x720,
  1024x768 and 390x844.
- `bun run build` completes without errors, so the seven `simple-icons` names
  plus the `lucide` transport icons all resolve.
- Fan geometry moved to `svh`-relative sizes after the first render clipped on
  mobile and collided with the deck's bottom control at 720px height.

## T5: unit coverage for the player logic

Review correction (finding R3-004): the component's contract shipped with only
manual evidence.

- `src/components/music-player/player-core.ts` extracts the pure logic:
  `formatTime`, `clamp`, `wrapIndex`, `nextTrackIndex`, `seekPercent`,
  `seekTime`, `applyVolumeInput`, `toggleMute`, `transportLabelKey`,
  `isGuardedDeckKey`.
- `src/components/music-player/player-core.test.ts` covers every export with
  `bun:test`; `bun test` reports 9 pass / 0 fail.
- `src/components/MusicPlayer.astro` delegates to those helpers instead of
  keeping duplicated inline copies. Runtime behaviour unchanged.
- `package.json` gains `"test": "bun test"`.
- Commit `071deb9`.

## Verification evidence

- Card selection syncs cover, title, artist and `aria-pressed`; the demo clip
  ends and advances to the next track.
- Arrow keys pressed with focus inside the player do not scroll the deck
  (`scrollTop` unchanged).
- Light, dark and neon render with tokens only.
- `bun test`: 9 pass, 0 fail, 18 assertions.
- `bun run build`: completes, both locales prerendered.
- Known limitation: `.fan-card` rotations overflow the fan box by ~60px, so at
  720px viewport height the deck's fixed down button grazes the bottom tips of
  the outer cards. The deck's fixed side arrows also overlap the player card on
  narrow viewports, the same way they overlap other full-width slides.

## Next step

- Replace `DEMO_SRC` (`/meowth.mp3`, 0.63s) with one real mp3 per track; the
  card's `data-src` is the single point of change if each track gets its own
  `src`.
- DOM-level coverage of the event wiring (click, ended, keydown) still needs a
  DOM harness; the current suite covers the pure logic only.

