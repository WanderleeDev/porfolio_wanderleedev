# Tech Stack titles
Header: 2-column sticky stacking redesign keeps its per-group section titles.

## Specs
- S1 — User: "hace un sticky top haciendo scroll va haciendo stacking la siguiente card y se muestra el siguiente tiulo de kla secction card".
- S2 — The sticky left column of TechJourney.astro must show the group title (Frontend, Backend, Tools) while that group's card is active, and switch to the next group's title as the next card stacks over the previous one during scroll.

## Tasks
- [x] T1 — Add per-group sticky title (S1, S2) | commit f34e4e5

## Log
- L1 — User request: "para la parte de Tecnologías vamos a hacer un rediseño sera de 2 cols el un lado el titulo tech ejm fornt y en la otra col la card con las tech y hace un sticky top haciendo scroll va haciendo stacking la siguiente card y se muestra el siguiente tiulo de kla secction card"
- L2 — Evidence: TechJourney.astro already renders the 2-col sticky-stacking layout with a sticky left column and stacking cards. The left column currently shows only "Tech"; the group title appears inside each card. Fixed the sticky column to render the active group title that switches as cards stack.
