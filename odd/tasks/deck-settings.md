# Deck settings + minimapa

> Engranaje de configuración entre los pickers de idioma y tema. Maneja el
> bloqueo vertical, la vista general y un minimapa persistente. Trabaja en el
> worktree `feat/deck-settings` (basado en `feat/redesign`).

## Specs

- S1. Entre el selector de idioma y el de tema hay un **engranaje (⚙)** que
  abre un panel con tres interruptores:
  - **Bloqueo vertical** — encendido = el eje vertical del deck queda bloqueado
    (sin scroll ni snap), igual que el botón 🔒 actual.
  - **Vista general** — encendido = se muestra el botón ⊞ Vista general;
    apagado = se oculta.
  - **Minimapa** — encendido = se muestra el minimapa; apagado = se oculta.
- S2. Las tres opciones se **persisten** en `localStorage` (clave `wdev-deck`)
  y se aplican al recargar.
- S3. Los botones sueltos existentes (**🔒** y **⊞**) **se mantienen**. El
  interruptor de bloqueo vertical y el botón 🔒 controlan el mismo estado y
  deben mantenerse sincronizados.
- S4. El **minimapa** es un rectángulo en la **esquina inferior derecha**, con
  los slides **a escala** (miniaturas), el slide actual **resaltado**, y clic
  para saltar a ese slide. Sin dependencias nuevas.
- S5. Sin comentarios en el código nuevo (política del repo).

## Tasks

- T1 · S2 · module · `deck-settings.ts` (load/save/subscribe + bus) · commit 1
- T2 · S1,S2 · ui · engranaje + panel en `ThemePicker.astro` · commit 2
- T3 · S2,S3 · controller · aplicar settings en init + reaccionar a `deck:settings` · commit 3
- T4 · S4 · controller · minimapa (thumbnails a escala, click jump) · commit 4
- T5 · verify · build + playwright · (sin commit)

## Log

- L1 (usuario): "en un worktree puedes agregar entre el selector de idioma y
  theme selector un settings ahi manejamos el vertical slide blocking, si
  tambien si mostrar un vista general y si mostrar un minimap"
- L2 (usuario, decision): minimapa = "un cuadrado o rectangulo en el lado
  derecho inferior con los slides a scale donde este resaltado el current".
  Botones sueltos = "Dejarlos tambien".
- L3 (verificacion, 4365): gear abre panel con 3 switches; minimapa se muestra
  390x93 abajo-derecha con 3 thumbs 120x75 (clones reales de los <section>
  escalados), current=idx1; click thumb va a 1/3; lock toggle desbloquea y
  sincroniza el boton suelto 🔓; overview toggle oculta ⊞; localStorage
  {lock,overview,minimap} persiste tras reload; 0 errores de consola desktop y
  mobile 390px. Bug corregido: el switch usaba hasAttribute('data-on') (siempre
  presente) y el CSS data-[on]: matcheaba cualquier valor -> se paso a
  comparar el valor con data-[on=true]:.
