import { loadSettings, subscribeSettings } from './deck-settings';

type Cell = { type: 'h' | 'v'; i: number; row: number; col: number; title: string };

// Clases Tailwind reutilizables
const ARROW_OFF = 'pointer-events-none';
const THUMB = 'flex flex-col items-center justify-center gap-1.5 p-4 rounded-[18px] border-2 border-transparent bg-slate-800 text-slate-50 cursor-pointer transition-all enabled:hover:scale-[1.03] enabled:hover:border-sky-400 disabled:opacity-35 disabled:cursor-not-allowed';
const THUMB_CURRENT = ['border-sky-400', 'ring-4', 'ring-sky-400/20'];
const NATIVE_COMMAND = 'commandForElement' in HTMLButtonElement.prototype;

export function initDeck(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const qa = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const instant = 'instant' as ScrollBehavior;

  // Los controles son hijos directos del root: con `:scope >` no se confunden
  // con los data-* homónimos que usan los componentes slotteados (por ej. el
  // prev/next de temas del MusicPlayer).
  const track = q<HTMLElement>(':scope > [data-track]')!;
  const hslides = [...track.querySelectorAll<HTMLElement>(':scope > [data-hslide]')];
  const holder = q<HTMLElement>('[data-vtrack]');
  const vslides = holder
    ? [...holder.querySelectorAll<HTMLElement>(':scope > [data-vslide]')]
    : [];
  const holderIndex = holder
    ? hslides.indexOf(holder.closest<HTMLElement>('[data-hslide]')!)
    : -1;

  const start = Number(root.dataset.start ?? 0);
  const vstart = Number(root.dataset.vstart ?? 0);
  const settings = loadSettings();

  const prevBtn = q<HTMLButtonElement>(':scope > [data-prev]')!;
  const nextBtn = q<HTMLButtonElement>(':scope > [data-next]')!;
  const upBtn = q<HTMLButtonElement>(':scope > [data-up]')!;
  const downBtn = q<HTMLButtonElement>(':scope > [data-down]')!;
  const counter = q<HTMLElement>('[data-counter]')!;
  const panel = q<HTMLDialogElement>('[data-overview-panel]')!;
  const ovWrap = q<HTMLElement>('[data-ov-wrap]');
  if (!panel.id) panel.id = 'deck-overview';
  const grid = q<HTMLElement>('[data-ov-grid]')!;
  const taskChecks = qa<HTMLInputElement>('[data-task]');
  const taskCount = q<HTMLElement>('[data-task-count]');

  let current = start;
  let vCurrent = vstart;
  let locked = settings.lock;

  // ===== Movimiento =====
  function goTo(i: number, behavior: ScrollBehavior = 'smooth') {
    const idx = Math.max(0, Math.min(i, hslides.length - 1));
    track.scrollTo({ left: hslides[idx].offsetLeft, behavior });
  }

  function goToV(i: number, behavior: ScrollBehavior = 'smooth') {
    if (!holder || locked) return;
    const idx = Math.max(0, Math.min(i, vslides.length - 1));
    holder.scrollTo({ top: vslides[idx].offsetTop, behavior });
  }

  // ===== Estado visual =====
  function updateUI() {
    counter.textContent = `${current + 1} / ${hslides.length}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === hslides.length - 1;

    const onHolder = current === holderIndex;
    upBtn.disabled = !holder || locked || !onHolder || vCurrent === 0;
    downBtn.disabled = !holder || locked || !onHolder || vCurrent === vslides.length - 1;

    // Congelar el vertical: sin overflow ni snap
    if (holder) {
      holder.classList.toggle('overflow-hidden', locked);
      holder.classList.toggle('overflow-y-auto', !locked);
      holder.classList.toggle('snap-y', !locked);
      holder.classList.toggle('snap-mandatory', !locked);
      holder.classList.toggle('snap-none', locked);
    }
    updateMinimapActive();
  }

  function setLock(on: boolean) {
    locked = on;
    updateUI();
  }

  // ===== Observadores =====
  const hObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          current = hslides.indexOf(e.target as HTMLElement);
          updateUI();
        }
      });
    },
    { root: track, threshold: [0.6] }
  );
  hslides.forEach((s) => hObserver.observe(s));

  if (holder) {
    const vObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            vCurrent = vslides.indexOf(e.target as HTMLElement);
            updateUI();
          }
        });
      },
      { root: holder, threshold: [0.6] }
    );
    vslides.forEach((s) => vObserver.observe(s));
  }

  // ===== Controles =====
  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  upBtn.addEventListener('click', () => goToV(vCurrent - 1));
  downBtn.addEventListener('click', () => goToV(vCurrent + 1));

  // ===== Flechas flotantes =====
  // Se pueden ocultar para navegar sólo con el minimapa. `display` inline
  // (y no el atributo `hidden`) porque las utilidades `flex` del botón le
  // ganan al `[hidden]` del user agent.
  let arrowsOn = settings.arrows;
  function setArrows(on: boolean) {
    arrowsOn = on;
    [prevBtn, nextBtn, upBtn, downBtn].forEach((btn) => {
      btn.style.display = on ? '' : 'none';
    });
  }

  // ===== Tareas =====
  function syncTasks() {
    const done = taskChecks.filter((c) => c.checked).length;
    if (taskCount) taskCount.textContent = `${done}/${taskChecks.length}`;
    const shouldLock = done !== taskChecks.length;
    if (locked !== shouldLock) setLock(shouldLock);
  }
  taskChecks.forEach((c) => c.addEventListener('change', syncTasks));

  // ===== Vista general =====
  // Cada slide horizontal ocupa una columna. Los verticales ocupan la columna
  // del holder, cada uno en su propia fila.
  const cells: Cell[] = [];
  hslides.forEach((s, j) =>
    cells.push({
      type: 'h',
      i: j,
      row: holder ? vstart : 0,
      col: j,
      title: s.dataset.title ?? `Slide ${j + 1}`,
    })
  );
  vslides.forEach((s, i) => {
    if (i === vstart) return;
    cells.push({
      type: 'v',
      i,
      row: i,
      col: holderIndex,
      title: s.dataset.title ?? `Vertical ${i + 1}`,
    });
  });

  function renderOverview() {
    // El número de columnas y filas depende de cuántos slides haya
    grid.style.gridTemplateColumns = `repeat(${hslides.length}, minmax(0, 1fr))`;
    grid.style.gridTemplateRows = `repeat(${Math.max(vslides.length, 1)}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    cells.forEach((c) => {
      const b = document.createElement('button');
      b.className = THUMB;
      b.style.gridColumn = String(c.col + 1);
      b.style.gridRow = String(c.row + 1);
      b.innerHTML = `<span class="text-sky-400 text-[.7rem] tracking-[.12em] uppercase">${c.type === 'v' ? 'Vertical' : 'Horizontal'}</span><strong class="text-center font-bold text-[clamp(.9rem,2vw,1.4rem)]"></strong>`;
      b.querySelector('strong')!.textContent = c.title;

      const isCurrent =
        c.type === 'h'
          ? current === c.i && !(c.i === holderIndex && vCurrent !== vstart)
          : current === holderIndex && vCurrent === c.i;
      if (isCurrent) b.classList.add(...THUMB_CURRENT);

      if (c.type === 'v' && locked) {
        b.disabled = true;
        b.title = 'Desbloquea el vertical para ir aquí';
      }

      b.addEventListener('click', () => jumpTo(c));
      grid.appendChild(b);
    });
  }

  function jumpTo(c: Cell) {
    closeOverview();
    if (c.type === 'h') {
      goTo(c.i, instant);
    } else {
      goTo(holderIndex, instant);
      goToV(c.i, instant);
    }
  }

  function openOverview() {
    renderOverview();
    if (!panel.open) panel.showModal();
  }

  function closeOverview() {
    if (panel.open) panel.close();
  }

  panel.addEventListener('click', (e) => {
    if (e.target === panel || e.target === ovWrap) closeOverview();
  });

  // ===== Minimapa =====
  // Esquema en cruz: columna central (arriba / principal / abajo) flanqueada
  // por los slides horizontales vecinos.
  const minimap = document.createElement('div');
  minimap.className =
    'fixed bottom-6 right-6 z-30 grid grid-cols-[48px_48px_48px] grid-rows-[48px_48px_48px] items-center justify-items-center gap-1.5 rounded-[22px] border border-white/20 bg-slate-900/85 p-3 shadow-lg backdrop-blur-md';
  minimap.setAttribute('data-minimap', '');
  minimap.setAttribute('role', 'group');
  minimap.setAttribute('aria-label', 'Minimapa del deck');
  minimap.style.display = 'none';
  root.appendChild(minimap);

  const MM_CELL =
    'block h-full w-full cursor-pointer rounded-[10px] border-2 bg-white/5 transition-colors hover:border-sky-400';
  const MM_ON_BORDER = 'rgb(56 189 248)';
  const MM_OFF_BORDER = 'rgb(255 255 255 / 0.2)';
  const MM_ON_FILL = 'rgb(56 189 248 / 0.18)';
  const MM_OFF_FILL = 'rgb(255 255 255 / 0.05)';

  type MmCell = { el: HTMLButtonElement; kind: 'h' | 'v'; i: number; hiddenWhenLocked?: boolean };
  const mmCells: MmCell[] = [];
  let expandBtn: HTMLButtonElement | null = null;

  function mmButton(label: string, placement: string, onClick: () => void) {
    const box = document.createElement('button');
    box.type = 'button';
    box.setAttribute('aria-label', label);
    box.className = `${MM_CELL} ${placement}`;
    box.addEventListener('click', onClick);
    minimap.appendChild(box);
    return box;
  }

  // Navegación a un slide vertical: el mapa es explícito, así que mueve la
  // columna aunque el bloqueo vertical esté activo.
  function scrollV(i: number) {
    if (!holder) return;
    const idx = Math.max(0, Math.min(i, vslides.length - 1));
    if (current !== holderIndex) goTo(holderIndex);
    holder.scrollTo({ top: vslides[idx].offsetTop, behavior: 'smooth' });
  }

  function buildMinimap() {
    minimap.innerHTML = '';
    mmCells.length = 0;
    if (hslides.length === 0) return;

    // Botón expandir: esquina libre de la grilla. Usa el invocador de comandos
    // nativo (`command="show-modal"`) para abrir el <dialog> de vista general.
    expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className =
      'col-start-3 row-start-1 justify-self-end self-start flex size-5 cursor-pointer items-center justify-center rounded-[6px] border border-white/20 bg-white/5 text-white/55 transition-colors hover:border-sky-400 hover:text-sky-400';
    expandBtn.setAttribute('aria-label', 'Abrir vista general');
    expandBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
    if (NATIVE_COMMAND) {
      expandBtn.setAttribute('command', 'show-modal');
      expandBtn.setAttribute('commandfor', panel.id);
      expandBtn.addEventListener('click', renderOverview);
    } else {
      expandBtn.addEventListener('click', openOverview);
    }
    expandBtn.style.display = settings.overview ? '' : 'none';
    minimap.appendChild(expandBtn);

    const center = holderIndex >= 0 ? holderIndex : Math.floor(hslides.length / 2);
    const left = center - 1;
    const right = center + 1;

    if (vslides.length > 0) {
      mmCells.push({
        kind: 'v',
        i: 0,
        hiddenWhenLocked: true,
        el: mmButton(vslides[0].dataset.title ?? 'Arriba', 'col-start-2 row-start-1', () => scrollV(0)),
      });
    }
    if (left >= 0) {
      mmCells.push({
        kind: 'h',
        i: left,
        el: mmButton(hslides[left].dataset.title ?? `Slide ${left + 1}`, 'col-start-1 row-start-2', () => goTo(left)),
      });
    }
    const middle = holder && vslides.length > 1 ? 1 : -1;
    mmCells.push(
      middle >= 0
        ? {
            kind: 'v',
            i: middle,
            el: mmButton(hslides[center].dataset.title ?? `Slide ${center + 1}`, 'col-start-2 row-start-2', () => scrollV(middle)),
          }
        : {
            kind: 'h',
            i: center,
            el: mmButton(hslides[center].dataset.title ?? `Slide ${center + 1}`, 'col-start-2 row-start-2', () => goTo(center)),
          },
    );
    if (right < hslides.length) {
      mmCells.push({
        kind: 'h',
        i: right,
        el: mmButton(hslides[right].dataset.title ?? `Slide ${right + 1}`, 'col-start-3 row-start-2', () => goTo(right)),
      });
    }
    if (vslides.length > 2) {
      const last = vslides.length - 1;
      mmCells.push({
        kind: 'v',
        i: last,
        hiddenWhenLocked: true,
        el: mmButton(vslides[last].dataset.title ?? 'Abajo', 'col-start-2 row-start-3', () => scrollV(last)),
      });
    }
  }

  function updateMinimapActive() {
    mmCells.forEach(({ el, kind, i, hiddenWhenLocked }) => {
      const on = kind === 'h' ? i === current : current === holderIndex && i === vCurrent;
      el.style.borderColor = on ? MM_ON_BORDER : MM_OFF_BORDER;
      el.style.backgroundColor = on ? MM_ON_FILL : MM_OFF_FILL;
      el.setAttribute('aria-current', on ? 'true' : 'false');
      // Con el vertical bloqueado no se muestran los slides de arriba/abajo,
      // pero la grilla conserva su lugar.
      const off = hiddenWhenLocked === true && locked;
      el.style.visibility = off ? 'hidden' : '';
      el.tabIndex = off ? -1 : 0;
    });
  }

  // ===== Ajustes: reacciona al store. La primera notificación es el valor
  // inicial (idéntico a `loadSettings()` ya aplicado arriba) y se descarta. =====
  let settingsFirst = true;
  subscribeSettings((s) => {
    if (settingsFirst) { settingsFirst = false; return; }
    if (s.lock !== locked) setLock(s.lock);
    if (expandBtn) expandBtn.style.display = s.overview ? '' : 'none';
    minimap.style.display = s.minimap ? '' : 'none';
    if (s.arrows !== arrowsOn) setArrows(s.arrows);
  });

  // Otro modal abierto (ej. la vista de créditos) toma el foco: el deck no
  // se navega con las flechas mientras esté.
  const otherModalOpen = () =>
    [...document.querySelectorAll('dialog[open]')].some((d) => d.id !== panel.id);

  const NAV_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ']);

  // ===== Teclado =====
  window.addEventListener('keydown', (e) => {
    if (otherModalOpen()) {
      // Sin preventDefault el navegador scrollea el track del deck por su cuenta.
      if (NAV_KEYS.has(e.key)) e.preventDefault();
      return;
    }
    if (e.key === 'Escape') return closeOverview();
    if (panel.open) return;

    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); goTo(current + 1); break;
      case 'ArrowLeft':  e.preventDefault(); goTo(current - 1); break;
      case 'ArrowDown':
        e.preventDefault();
        if (current === holderIndex) goToV(vCurrent + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (current === holderIndex) goToV(vCurrent - 1);
        break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End':  e.preventDefault(); goTo(hslides.length - 1); break;
    }
  });

  // ===== Estado inicial =====
  track.scrollLeft = hslides[start]?.offsetLeft ?? 0;
  if (holder && vslides[vstart]) holder.scrollTop = vslides[vstart].offsetTop;

  buildMinimap();
  updateMinimapActive();
  minimap.style.display = settings.minimap ? '' : 'none';
  setArrows(settings.arrows);

  updateUI();
}
