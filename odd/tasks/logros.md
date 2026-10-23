# Logros — overlay a pantalla completa con logros automáticos

## Objetivo

Un botón de trofeo junto a créditos que abre una vista a pantalla completa donde se
acumulan los logros desbloqueados al explorar el sitio.

## Alcance

- `src/components/logros/Logros.astro`: overlay, timeline de GSAP y grilla de logros.
- `src/lib/achievements.ts`: definiciones, store `unlocked` (nano store) y `unlock()`.
- `src/lib/logros-store.ts`: estado central `isOpen`/`progress`, `toggleLogros()`,
  `requestUnlock()` (toast si es nuevo) y `mount()` que conecta el store al diálogo.
- `src/lib/toast.ts`: aviso único y auto-descartable (3,2 s), framework-agnostic,
  sin dependencias; respeta `prefers-reduced-motion`.
- `src/components/deck/deck-settings.ts`: el estado del deck es ahora un nano
  store `map` (`settings`); `loadSettings`/`saveSettings`/`updateSetting`
  conservan firma y comportamiento; `subscribeSettings` reemplaza el CustomEvent
  `deck:settings` (el controlador del deck lo suscribe y descarta la notificación
  inicial, ya aplicada por `loadSettings`).
- `src/components/MusicPlayer.astro`: `requestUnlock("soundtrack")` (con toast).
- `src/components/ThemePicker.astro`: el botón de logros llama a `toggleLogros()`
  del store; el cambio de tema llama a `requestUnlock("theme-tour")`.
- `src/components/deck/deck-controller.ts`: reacciona a los ajustes vía
  `subscribeSettings` en vez de escuchar `deck:settings`.
- `src/pages/index.astro`, `src/pages/en/index.astro`: montaje del componente.

## Decisiones

- El overlay es un bloque a pantalla completa que entra desde abajo (no un modal
  centrado): el deck y la barra retroceden con `scale 0.94` / `opacity 0.35` detrás.
- Dentro del bloque, dos sub bloques (cabecera y grilla) suben con rotación leve
  (±3°) y se enderezan; después las cards entran escalonadas.
- Todo entra en un viewport: `auto-rows-fr` reparte el alto disponible y no hay scroll
  (verificado 1440×900 y 390×844).
- Logros automáticos, sin backend: `localStorage["wdev-logros"]` guarda los ids y
  `unlock()` emite `logros:unlocked` para refrescar la vista abierta.
- Logros definidos: `hello-world` (visitar), `theme-tour` (cambiar tema),
  `soundtrack` (play), `credits` (abrir créditos), `chat` (respuesta del chat),
  `curiosity` (abrir la lista).
- Animación con GSAP: una sola `timeline` construida pausada. Abrir es `play()`,
  cerrar es `reverse()`, así el cierre recorre la misma coreografía al revés sin
  duplicarla. `onReverseComplete` cierra el dialog.
- `onReverseComplete` limpia los estilos inline del deck y la barra: un
  `transform` inline (aunque sea identidad) crea containing block para sus hijos
  `fixed`.
- El toggle reanuda con `play()` si la timeline venía en reversa, en vez de
  reiniciar la animación.
- Iconos siempre por `Icon.astro` (`lucide:x`, `lucide:lock`, `lucide:check`), sin
  SVG crudo.
- El `<dialog>` y su bloque raíz usan `overflow-clip`, no `overflow-hidden`:
  `hidden` sigue siendo un contenedor scrolleable por código, y `showModal()`
  enfoca el botón de cerrar → scroll-into-view movía el panel ~488px hacia
  arriba (la cabecera se recortaba y volvía durante la entrada). `clip` no es
  scrolleable, así que el panel nunca se pasa del viewport.
- Se descartó el listener de clic-fuera: el bloque cubre todo el viewport, así
  que no existe un "afuera" donde hacer clic.
- Se descartó el invoker nativo (`command`/`commandfor`): con la timeline en
  reversa el cierre ya pasa por JS y el invoker no aportaba nada.
- Se descartó la versión 100% CSS (@starting-style + `allow-discrete` + `overlay`)
  aunque el código andaba: `overlay` es solo Chromium (Firefox bug 1841456
  abierto, Safari sin soporte) y en Firefox el dialog pasa a `display: none` en el
  mismo instante de `close()`, sin animación (medido). Envolverlo costaba un gate
  de `transitionend` + timeout y ~150 líneas netas más que la timeline, sin sacar
  GSAP del bundle (Hero y FeaturedWork ya lo usan, este último con Draggable).

## Tareas

- [x] Definiciones y store de logros (`src/lib/achievements.ts`).
- [x] Overlay a pantalla completa con animación de capas y sub bloques.
- [x] Grilla de logros con estado bloqueado/desbloqueado y contador.
- [x] Disparadores: visita, tema, música, créditos, chat, apertura del panel.
- [x] Verificación responsive y de build.
- [x] Refactor Nano Stores: `logros-store.ts` + `toast.ts` (toast por logro nuevo).
- [x] Migrate `deck-settings.ts` a nano store `map` + `subscribeSettings`.

## Verificación

- `bun run build` OK.
- Visita limpia: `hello-world` se guarda al cargar; abrir el panel desbloquea `curiosity` (2/6).
- Cambiar tema, abrir créditos y reproducir un track llevan el store a 5/6 y persisten
  tras recargar.
- Sin scroll ni desborde horizontal en 1440×900 y 390×844 (medido sobre `dialog`, sheet y grilla).
- Reduced motion: `progress(1)` al abrir y `progress(0)` + `close()` al cerrar, sin animar.
- Chrome y Firefox: abrir con `play()`, cerrar con `reverse()` y el dialog queda
  cerrado en `onReverseComplete`; el toggle a mitad de reversa reanuda con
  `play()` en vez de reiniciar.
- Al cerrar, deck y barra quedan sin estilos inline (`style=""`), así que no
  arrastran un containing block para sus hijos `fixed`.
- Iconos: `lucide:x`, `lucide:lock` y `lucide:check` resuelven por `Icon.astro`.
- Entrada sin overshoot: el bloque arranca en `top: 720` (un viewport abajo),
  termina en `0`, `minTop` nunca baja de 0 y `root.scrollTop` queda en 0, en
  Chrome y Firefox.
- `chat` sin probar de punta a punta (requiere respuesta real del endpoint de chat).

## Pendiente

- Resolver la autoridad de review RDD que quedó stale (cambios posteriores al freeze).
- Commits: el árbol tiene trabajo previo sin commitear (`Icon.astro`, chat) que no
  corresponde a esta feature; no se commiteó para no mezclarlo.

## Verificación — refactor Nano Stores + toast

- `bun run build` OK; `bun test` 9/9; `bunx tsc` sin errores en los archivos
  del refactor (los únicos errores restantes son pre-existentes en `ChatPanel.tsx`,
  `chat/*` y `player-core.test.ts`).
- Chrome + Firefox: al abrir el panel (botón o store), el toast
  "Logro desbloqueado: Curiosidad" aparece visible; al cerrar, el deck queda sin
  estilos inline (`style=""`).
- `requestUnlock("hello-world")` y `requestUnlock("curiosity")` dejan `2 / 6`
  en el contador; `localStorage["wdev-logros"]` persiste.
- El deck sigue reaccionando a los toggles de settings: el controlador ahora se
  suscribe a `subscribeSettings` y descarta la notificación inicial (ya aplicada
  por `loadSettings`), así que no hay doble aplicación.
- Grep: `logros:unlocked`, `logros:toggle` y `deck:settings` no quedan en código
  (solo en comments de documentación).
- `credits:toggle` y `chat:event` siguen vivos: son eventos de dominio de otras
  features y se consumen aquí solo para disparar `requestUnlock`.
