# Design system — WanderleeDev Portfolio

Synced from: `src/styles/global.css` (tokens centralizados), `src/components/typography/Title.astro`, `src/components/Icon.astro`.

Themes: `.light` (default), `.dark`, `.neon`, `.konami`. Components only use semantic Tailwind classes (`bg-surface`, `text-ink`, `text-soft`, `text-muted`, `border-line`, `bg-badge`, `text-badge-ink`) — never raw hex.

## Colors (default `.light`; values per theme)

| Token | Usage | Light | Dark | Neon | Konami |
| --- | --- | --- | --- | --- | --- |
| `--color-surface` | card backgrounds | `#ffffff` | `#161824` | `transparent` | `#120507` |
| `--color-ink` | main text | `#111111` | `#eceef3` | `#f2f4fa` | `#ffffff` |
| `--color-contrast` | text on colored surfaces | `#ffffff` | `#161824` | `#101424` | `#0a0405` |
| `--color-soft` | secondary text | `#6b7280` | `#a3a9bf` | `#b9c0d8` | `#e3d6d8` |
| `--color-muted` | tertiary text, eyebrows, hints | `#9ca3af` | `#6b7280` | `#8b93ad` | `#a08e91` |
| `--color-line` | borders, dividers | `#e5e7eb` | `#3a3f55` | `#2a2f45` | `#3a1216` |
| `--color-badge` | secondary surface fills (chat bubble) | `#e5e5e5` | `#3a3f55` | `#1c2133` | `#1e0a0d` |
| `--color-badge-ink` | text on badge | `#374151` | `#eceef3` | `#eef1f8` | `#ffeef0` |
| `--color-field` | form input backgrounds | `#ffffff` | `#161824` | `#171c30` | `#100405` |
| `--ct-acc` | contact accent (star glow, contact) | `#4f46e5` | `#8fa0ff` | `#8fa0ff` | `#e11d2e` |

Page backgrounds per theme:
- `.light`: `#ffffff`
- `.dark`: `#161824`
- `.neon`: `#000` + radial glows (`#38bdf859`, `#8b5cf647`)
- `.konami`: `#080405` + scanline gradient + radials (`#b6001466`, `#da291c4d`)

## Typography

| Token | Font | Usage |
| --- | --- | --- |
| `--font-sans` (Inter) | auto-hosted via Fonts API (`astro.config.mjs`) | UI and body text; `font-sans` |
| `--font-fira-sans-extra-condensed` (Fira Sans Extra Condensed) | same | Titles (inherited from `<Title />`) |

`<Title>` base: `font-black uppercase leading-[0.9] tracking-tight text-ink`. Size scales (default `family="condensed"`):

| Level | Size |
| --- | --- |
| 1 | `clamp(3rem,10vw,8rem)` |
| 2 | `clamp(2.5rem,7vw,5rem)` |
| 3 | `clamp(1.75rem,4.5vw,3rem)` |
| 4–6 | smaller steps |

## Radius & shadows

| Token | Value |
| --- | --- |
| `--radius-card` | `1rem` |
| `--shadow-card` | `0 20px 50px -30px rgba(0,0,0,0.25)` |

Contact slide panel uses a larger card: `rounded-[1.75rem]` + `shadow-[0_36px_90px_-52px_rgb(0_0_0_/_0.45)]`.

## Motion

| Token | Behavior |
| --- | --- |
| `--ease-out-elastic` | elastic entrance (badge, dialog) |
| `--animate-move-x` | step displacement (intro cat) |
| `--animate-badge-spin` | 14s linear infinite rotation |

Respect `prefers-reduced-motion`.

## Components

| Component | Notes |
| --- | --- |
| Contact slide panel | two-column grid `lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]`, left `bg-badge/20`, right `bg-badge/10` |
| Email channel row | `rounded-2xl border-line bg-surface p-1.5 pl-4`, copy button `bg-badge text-badge-ink`, hover `bg-ink text-contrast` |
| Social links | `size-10 rounded-full border border-line bg-surface`, hover `bg-badge` |
| Availability chip | `rounded-full border border-line bg-surface px-3 py-1.5`, emerald-500 dot |
| `<Icon>` | icons from `@iconify-json/lucide` in `pack:name` form |
| Focus styles | `focus-visible:outline-2 outline-offset-2 outline-ink` on interactive elements |
| Custom cursors | `cursor.svg` / `pointer.svg` / `text-cursor.svg` via `/cursor.svg` URLs |
