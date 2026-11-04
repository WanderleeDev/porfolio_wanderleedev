# WanderleeDev Portfolio

This repository contains the source code for the WanderleeDev portfolio, developed to showcase fullstack web development projects and skills.

Below is a summary of the technologies I work with and my featured projects.

## 🛠 Technologies (Tech Skills)

*   **My Main Stack:** PostgreSQL, NestJS, Angular, Node.js
*   **Frontend:** HTML5, CSS3, JavaScript, TypeScript, Angular, React, Next.js, Astro, Vue.js, TailwindCSS, Sass, NgRx, GreenSock (GSAP)
*   **Backend:** Node.js, NestJS, Express, PostgreSQL, Java, Spring Boot, Python, FastAPI
*   **Tools:** Git, GitHub, Docker, Trello

## 🚀 Featured Projects

### 1. Ecommerce
*Technologies: Angular, Sass, TypeScript, Flowbite*
A complete e-commerce platform featuring a JWT authentication system, a shopping cart with local persistent storage, and a real-time notification system for order updates.

### 2. Ubuntu Desktop
*Technologies: Angular, TailwindCSS, TypeScript, NgRx*
A functional copy of the Ubuntu 22.04 desktop. It demonstrates complex component architecture and state management, replicating applications like the terminal, calendar, and a code editor.

### 3. Ngx-theme-stack
*Technologies: Angular, TypeScript*
A modern Angular library with Server-Side Rendering (SSR) support, designed to efficiently manage dark mode, light mode, and custom themes using Angular Signals.

### 4. Switch 2 Clone
*Technologies: Vue, TailwindCSS, TypeScript*
A clone of the Nintendo Switch 2 landing page focused on achieving a fully responsive, pixel-perfect design. It uses viewport units for fluid scaling across any device size.

## 🎵 Music catalog

The player in the bottom slide reads its tracks from a single source: `data/music.json` (bucket `porfolio-music` on R2). Each song declares `slug`, `title`, `artist`, `mp3` and `cover`; both URLs must live under the catalog `base_url`, and `src/lib/music-catalog.ts` validates that with zod at import time, so a wrong host breaks the build instead of the player. The catalog also declares `cover_size` (`500x500`): the covers are square at that size, and the player uses it as the `width`/`height` of every cover image so the disc never stretches.

A song may also declare `accent`, a `#rrggbb` color taken from its own cover. That color drives two things: the player card always carries a soft tint of the active track's accent (`color-mix(in oklab, accent 14%, surface)`), and the slide that hosts the player shows the active cover blurred behind everything while audio is playing. The tint follows the selected track; the blurred backdrop only appears while it sounds. A catalog without `accent` still builds and falls back to the plain card surface.

Adding a song means adding one object to that JSON — no component or tool changes. The only file that pins the playlist is `tests/lib/music-catalog.test.ts`, which asserts the expected slug order; update that list when the songs change.

Once audio is playing, a small pill appears in the bottom-left corner with the cover, the title and prev/pause/next. It is mounted once by `src/components/deck/Deck.astro` (`src/components/deck/MusicWidget.astro`) and only shows while the player's own slide is out of view: on that slide the card already carries the full transport, so the pill would be a duplicate. It never touches the `<audio>` element — it reads `nowPlaying` and sends `playerCommand` through `src/components/music-player/player-store.ts`, the same bridge the chat uses. The rule lives in `src/components/deck/music-widget.ts` and is pinned by its test.

The player opens with a fixed track, resolved by slug in `src/components/music-player/tracks.ts` (`START_SLUG`), not by position: reordering the playlist keeps the same opening track, and a missing slug falls back to the first one. To open with another song, change that slug; `src/components/music-player/tracks.test.ts` pins it.

The disc is a real object rather than a cropped cover: a 3.5% black rim around the art, a bevel, 14% grooves and an 8% center hole, all in the scoped styles of `src/components/MusicPlayer.astro`. The four directions that were compared live in `design/vinyl-disc/` (self-contained artboards with sliders for each value); `02-vinilo-real.html` is the one in production.

The fan of track cards is driven by `fanGeometry(length)` (`src/components/music-player/player-core.ts`): the center card sits upright and on top, and both rotation and sink grow towards the edges, so adding or removing songs needs no hand-tuned numbers. Each card is tinted with its own `accent` — a gradient on the card face and a tinted border, both built with `color-mix`, falling back to the plain surface for a catalog without accents. The outer cards sink and rotate past the row's baseline, so the container reserves that flight with `fanFlight()` (the sink plus the corner peak of the rotation): without it, `overflow-x: auto` — which the browser also applies to the Y axis — clips their base. On mobile the six cards do not fit, so the row becomes a scroll-snapped carousel with faded edges and a row of dots, the active one stretched and painted with that song's `accent` (moved by the same selection code that updates the rest of the UI; the dots stay `aria-hidden` because the `NN / NN` counter already says it in words). The deck's minimap is hidden there (`@media (max-width: 639px)` in `src/components/deck/Deck.astro`), since the side arrows are hidden at that size too and navigation happens by swiping.

The same catalog is exposed over HTTP:

```
GET /api/music   →   { bucket, base_url, songs: [...] }
```

The player does not call that endpoint (it imports the module and renders on the server); the route exists for any other consumer and for inspecting the catalog by hand.

## 🧪 Playground

Dedicated spaces for experimenting and testing new technologies:
*   **Angular Ecosystem:** Robust architecture practices with advanced state management using NgRx, RxJS, and Angular Signals.
*   **React Ecosystem:** Highly interactive applications built on Next.js, optimized for SEO and performance, utilizing Zustand, React Query, and Shadcn.
