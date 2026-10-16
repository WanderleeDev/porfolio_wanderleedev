# Tech Stack — sección "Tecnologías"

Rediseño a 2 columnas: título sticky a la izquierda, cards de cada grupo apilándose a la
derecha. Un solo componente: `src/components/TechStack.astro`, estilos con utilidades Tailwind
(sin bloque `<style>` propio).

## Specs
- S1 — "para la parte de Tecnologías vamos a hacer un rediseño sera de 2 cols el un lado el titulo tech ejm fornt y en la otra col la card con las tech y hace un sticky top haciendo scroll va haciendo stacking la siguiente card y se muestra el siguiente tiulo de kla secction card".
  Concretado: 2 columnas; izquierda el título del grupo activo (Frontend / Backend / Tools) sticky en top; derecha la card con las techs de ese grupo; al scrollear, la siguiente card tapa a la anterior y el título de la izquierda pasa al grupo activo.
- S2 — "si" (respuesta a: habilitar la sección en la página ES). Concretado: `src/pages/index.astro` renderiza la sección.
- S3 — "avevr opodo mal no funciona xq duplicate secciones de tecnologias borra ambas y empieza denuevo usa tailwnd xq me metes css".
  Concretado: eliminar las dos secciones duplicadas (`Experimental.astro` `id="my-stack"` y `TechJourney.astro` `id="tech-journey"`, ambas leyendo `skills.list`) y dejar una sola; estilos con Tailwind, sin bloque `<style>` propio.

## Tasks
- T1 — `TechStack.astro` nuevo y las dos páginas (ES/EN) apuntando a él (S1, S2). Hecho, **sin commit**.
- T2 — borrar `Experimental.astro` y `TechJourney.astro` (S3). Hecho, **sin commit**.
- T3 — verificación estática y funcional (S1, S3). OK, evidencia en L7.
- T4 — contenido AI & Tools (S4). Hecho, **sin commit**: `Tools` → `AI & Tools` en ES/EN + clave `skillDescriptions`; npm fuera y `selfhst:hermes-agent` adentro; `alsoUsed` con `devicon:intellij` / `IntelliJ IDEA`; etiquetas `skills.groupsLabel` / `skills.alsoUsedLabel` (`Ocasionalmente usado` / `Occasionally used`); `TechStack.astro` deriva los grupos de `skills.list.slice(1)` en vez de literales.

## Log
- L1 — "para la parte de Tecnologías vamos a hacer un rediseño sera de 2 cols el un lado el titulo tech ejm fornt  y en la otra col la card con las tech  y hace un sticky  top  haciendo scroll va haciendo stacking la siguiente card y se muestra el siguiente tiulo de kla secction card"
- L2 — "no cambaste nada"
- L3 — "si"
- L4 — "avevr opodo mal no funciona xq duplicate secciones de tecnologias  borra ambas y empieza denuevo  usa tailwnd xq me metes css"
- L5 — Corrección de un error propio: afirmé que el layout 2-col sticky ya existía y que solo faltaba el título del grupo. Era falso; el archivo real era el recorrido horizontal con pin de GSAP. La causa real de "no funciona" era otra: dos componentes renderizando la misma sección en la página ES.
- L6 — Defectos hallados por la verificación funcional y su causa: (a) el observer tomaba la **primera** card del DOM; como cada card es más alta que la banda de detección, la card 0 seguía cruzándola siempre y el título nunca avanzaba → se corrigió tomando la **última** card que cruza la banda (la de mayor z-index, la que tapa). (b) las cards medían ~416px, menos que la viewport, así que el bloque contenedor se agotaba y el stack se desarmaba enseguida → `md:min-h-[75vh]`.
- L7 — Evidencia (preview :4331 + playwright-cli): `techSections: ["tech-stack"]` (una sola), 3 cards; `activosEnOrden: ["frontend","backend","tools"]` en desktop, móvil y reduced motion; card 0 pega en 96px y card 1 en 112px mientras la siguiente sube; móvil: encabezado pegado a top:0 en 72/101 muestras (85px de alto), cards no sticky; reduced motion: un solo título opaco, 0 errores de consola; estático: 0 etiquetas `<style>`, utilidades Tailwind generadas (`md:sticky`, `md:top-28`, `md:z-30`, `data-[active=true]`, `minmax(12rem,20rem)`).
- L8 — Commit pendiente de decisión del usuario: las dos páginas traen cambios previos ajenos a este trabajo (docblock borrado, `FeaturedWork` con `items={projects}`, `MoreWork` comentado), así que commitearlas enteras mezclaría trabajo en curso.
- L9 — Pedido de contenido: "genial ahora tambien usado no esta bien y podriamos agega intelijideaes es ocasionalmente usado xq da a entender que se uso poco pero si se tiene algo de conocimiento, en tools deberia ser ai & tools y podemos agrega intelijide y quitar npm y hermes agent puedes editar el en y es ts para unificarlos".
- L10 — Aclaración del usuario: "hermes agent es lo que debes agregar mas bien en lugar de npm". Hermes Agent es el agente open-source de Nous Research; el selfhst:hermes-agent` confirma que ese es el icono (`selfhst` = apps self-hosted). No existía `hermes` en el repo: se agrego en lugar de npm, con el azul de marca `#0000F2`; IntelliJ IDEA trae su propio gradiente hardcodeado en `devicon:intellij` (`#ff8100`), así que el `color` de la data solo aplica a iconos monocromos.
- L11 — Evidencia post-cambios: build OK; `dist`: `AI & Tools`=4 menciones, `Hermes Agent`=2, `IntelliJ`=2, `Ocasionalmente usado`=3, `npm`=0; EN: `Occasionally used`=3; `astro-icon="selfhst:hermes-agent"` y `devicon:intellij` inline en ambas páginas. Navegador ES y EN: una sola `tech-stack`, cards `[frontend, backend, ai-&-tools]`, activos en orden `[frontend, backend, ai-&-tools]`, tiles de AI & Tools con Hermes Agent y sin npm, `IntelliJ IDEA` en el footer del grupo.