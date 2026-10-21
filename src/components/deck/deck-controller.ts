import { loadSettings } from './deck-settings';

type Cell = { type: 'h' | 'v'; i: number; row: number; col: number; title: string };

// Clases Tailwind reutilizables
const ARROW_OFF = 'pointer-events-none';
const PANEL_OPEN = ['opacity-100', 'pointer-events-auto', 'scale-100'];
const PANEL_CLOSED = ['opacity-0', 'pointer-events-none', 'scale-[1.08]'];
const THUMB = 'flex flex-col items-center justify-center gap-1.5 p-4 rounded-[18px] border-2 border-transparent bg-slate-800 text-slate-50 cursor-pointer transition-all enabled:hover:scale-[1.03] enabled:hover:border-sky-400 disabled:opacity-35 disabled:cursor-not-allowed';
const THUMB_CURRENT = ['border-sky-400', 'ring-4', 'ring-sky-400/20'];

export function initDeck(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const qa = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const instant = 'instant' as ScrollBehavior;

  const track = q<HTMLElement>('[data-track]')!;
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

  const prevBtn = q<HTMLButtonElement>('[data-prev]')!;
  const nextBtn = q<HTMLButtonElement>('[data-next]')!;
  const upBtn = q<HTMLButtonElement>('[data-up]')!;
  const downBtn = q<HTMLButtonElement>('[data-down]')!;
  const counter = q<HTMLElement>('[data-counter]')!;
  const lockBtn = q<HTMLButtonElement>('[data-lock]')!;
  const overviewBtn = q<HTMLButtonElement>('[data-overview]')!;
  const panel = q<HTMLElement>('[data-overview-panel]')!;
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

    lockBtn.hidden = !holder;
    lockBtn.textContent = locked ? '🔒 Vertical bloqueado' : '🔓 Vertical libre';
    lockBtn.setAttribute('aria-pressed', String(locked));
    lockBtn.classList.toggle('border-sky-400', !locked);
    lockBtn.classList.toggle('text-sky-400', !locked);

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
  lockBtn.addEventListener('click', () => setLock(!locked));

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
    grid.style.gridTemplateColumns = `repeat(${hslides.length}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${Math.max(vslides.length, 1)}, 1fr)`;
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
    panel.classList.remove(...PANEL_CLOSED);
    panel.classList.add(...PANEL_OPEN);
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeOverview() {
    panel.classList.remove(...PANEL_OPEN);
    panel.classList.add(...PANEL_CLOSED);
    panel.setAttribute('aria-hidden', 'true');
  }

  overviewBtn.addEventListener('click', openOverview);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) closeOverview();
  });

  // ===== Minimapa =====
  const minimap = document.createElement('div');
  minimap.className =
    'fixed bottom-6 right-6 z-30 flex gap-1.5 rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-lg backdrop-blur-md';
  minimap.setAttribute('data-minimap', '');
  minimap.setAttribute('aria-label', 'Minimapa del deck');
  minimap.style.display = 'none';
  root.appendChild(minimap);

  const mmThumbs: HTMLButtonElement[] = [];
  function buildMinimap() {
    minimap.innerHTML = '';
    mmThumbs.length = 0;
    hslides.forEach((slide, i) => {
      const box = document.createElement('button');
      box.type = 'button';
      box.setAttribute('aria-label', slide.dataset.title ?? `Slide ${i + 1}`);
      box.className =
        'relative block h-[75px] w-[120px] shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent bg-slate-800/60 transition-colors hover:border-sky-400';
      const rect = slide.getBoundingClientRect();
      const scale = 75 / (rect.height || window.innerHeight);
      const inner = document.createElement('div');
      inner.className = 'absolute inset-0 origin-top-left';
      inner.style.width = `${rect.width}px`;
      inner.style.height = `${rect.height}px`;
      inner.style.transform = `scale(${scale})`;
      const clone = slide.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('canvas,astro-island,script,style').forEach((el) => el.remove());
      clone.removeAttribute('data-hslide');
      clone.removeAttribute('data-title');
      inner.appendChild(clone);
      box.appendChild(inner);
      box.addEventListener('click', () => goTo(i, instant));
      minimap.appendChild(box);
      mmThumbs.push(box);
    });
  }

  function updateMinimapActive() {
    mmThumbs.forEach((b, i) => b.classList.toggle('border-sky-400', i === current));
  }

  window.addEventListener('deck:settings', (e) => {
    const s = e.detail as { lock: boolean; overview: boolean; minimap: boolean };
    if (s.lock !== locked) setLock(s.lock);
    overviewBtn.style.display = s.overview ? '' : 'none';
    minimap.style.display = s.minimap ? '' : 'none';
  });

  // ===== Teclado =====
  window.addEventListener('keydown', (e) => {
    if (e.key === 'o' || e.key === 'O') {
      panel.classList.contains('opacity-100') ? closeOverview() : openOverview();
      return;
    }
    if (e.key === 'Escape') return closeOverview();

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

  overviewBtn.style.display = settings.overview ? '' : 'none';
  buildMinimap();
  updateMinimapActive();
  minimap.style.display = settings.minimap ? '' : 'none';

  updateUI();
}
