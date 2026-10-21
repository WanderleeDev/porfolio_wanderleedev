# Vista de créditos (texto en scroll)

> Vista extra del deck con una animación de texto subiendo, al estilo créditos
> de película, con la info real del perfil (rol, stack, proyectos, contacto).
> Worktree `feat/credits` (basado en `feat/redesign` @ `3722dea`).

## Specs

- S1. La vista de créditos es **otra vista del deck**, no un reemplazo: el
  deck sigueavigando igual y la vista se abre y se cierra sin perder el
  lugar.
- S2. El texto **sube** de abajo hacia arriba, en loop continuo, con un
  ritmo lento y legible (nada de scroll a velocidad de demo).
- S3. Todo el contenido sale del **i18n existente** (`hero`, `skills.list`,
  `projects.list`, `contactSection`, `footer`): nada hardcodeado, nada
  inventado.
- S4. El contenido, en orden de créditos:
  1. Rol y nombre (`hero.title` + `hero.titleSecond`).
  2. Categorías del stack con sus tecnologías (`skills.list`).
  3. Proyectos con su descripción corta (`projects.list`).
  4. Contacto (`contactSection` + `footer`).
  5. Cierre con el nombre.
- S5. Estética de créditos: fondo del tema actual, tipografía
  **condensada** (`--font-fira-sans-extra-condensed`, que ya existe en el
  theme y hoy no se usa), texto centrado, roles en versalitas y trackeo
  amplio.
- S6. Con `prefers-reduced-motion` la animación **no** corre: el texto queda
  fijo y se scrollea a mano.
- S7. La vista se puede **pausar** (hover o botón) y **reiniciar** al
  terminar el loop.
- S8. Debe andar bien en mobile (390px) sin scroll horizontal de página.
- S9. Sin comentarios en el código. Solo clases Tailwind con tokens
  semánticos (`bg-surface`, `text-ink`, `text-soft`, `text-muted`,
  `border-line`), nunca hex sueltos.
- S10. Todo en español e inglés (el deck ya es bilingüe).

## Tasks

- T1. `src/components/credits/Credits.astro`: overlay `<dialog>` con el
  scroll en loop, pausa, reinicio y reduced-motion. — S1, S2, S5, S6, S7, S9
- T2. `src/i18n/credits.ts`: arma la lista de créditos (rol, stack, proyectos,
  contacto, cierre) desde el i18n. — S3, S4
- T3. Integración: botón disparador en el cluster de controles flotantes,
  tecla `c`, y guard en el deck para que no navegue con el modal abierto. — S1
- T4. Claves i18n de la vista (`credits.*`) en `es.ts` / `en.ts`. — S4, S10
- T5. Verificación: desktop 1280x800, mobile 390x844, reduced-motion, sin
  errores de consola, sin scroll horizontal. — S6, S8, S10

## Log

- L1. "ey tiene la data rpecalculada de las card? xq resuelve rapido pero
  luego muestra el texto no esamos usando la data traida ?"
- L2. "necesito que crees otra vista que sea credits o creditos donde se
  mueestre una aniamcion de texto subiendo con info del porfilo tech proyects
  etc, primero planteemos la scene y todo esto en un worktree"
- L3. Decisión del parent: la vista se plantea primero (este doc) y se
  implementa después de que el usuario apruebe la escena.
- L4. Trabajo concurrente ajeno: el árbol principal tiene cambios sin
  commitear de otra sesión (feature de chat context). El worktree
  `feat/credits` se creó desde `feat/redesign` @ `3722dea` y no los incluye.
  La vista de créditos no toca `api/chat.ts` ni `ChatPanel.tsx`, así que no
  debería cruzar con ese trabajo.
- L5. Decisiones del usuario: **overlay** (no otra page) y ritmo **lento con
  pausa y reinicio**. El overlay se justificó porque el deck ya tiene el
  patrón (`<dialog>`, `html:has(dialog[open])`, tecla `o`) y una page
  aparte rompe la narrativa del deck.
- L6. Implementación: overlay `<dialog id="deck-credits">` con el track
  duplicado (loop sin costura), velocidad calculada desde el alto real del
  contenido (45px/s → ~48s por vuelta), máscara de fade arriba y abajo.
  Disparadores: botón `lucide:scroll-text` en el cluster flotante + tecla
  `c` (ignora teclas tipeadas en el chat). Botones de pausa, reinicio y
  cerrar.
- L7. Bugs encontrados y corregidos durante la verificación:
  - `toggleAttribute` dejaba `data-paused=""` y el CSS pedía `="true"` → la
    pausa no congelaba. Ahora se setea el valor explícito.
  - El deck se scrolleaba con las flechas aunque el modal estaba abierto: no
    era el handler (ya estaba bloqueado) sino el **scroll nativo** del
    navegador sobre el track. Se corta con `preventDefault` de las teclas de
    navegación cuando hay otro modal abierto.
  - La duración se medía antes de `showModal()` (sin layout) → 0. Ahora se
    mide con el diálogo abierto.
  - `buildTrack` duplicaba el track ya duplicado en la segunda apertura →
    ahora se reconstruye desde los nodos originales.
  - Los nombres de tech salían como "Postgresql" / "Html5" → mapa de nombres
    reales en `portfolio-data.ts` (`techLabel`).
  - Las techs de "ocasionalmente usado" se mezclaban con las principales →
    línea propia con la etiqueta real del i18n.
- L8. Verificado (4394): abre con botón y con `c`, Esc cierra, pausa
  congela, reinicia, el deck no se mueve con las flechas mientras está
  abierto, `c` no dispara al escribir en el chat, reduced-motion desactiva la
  animación y deja scroll manual, mobile 390 sin overflow horizontal, 0
  errores de consola, y `/en` muestra la versión en inglés.
