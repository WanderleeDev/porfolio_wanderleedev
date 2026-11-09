import { loadSettings, saveSettings, subscribeSettings, updateSetting } from './deck-settings';
import { minimapUnlocked, verticalUnlocked } from '../../lib/unlocks';
import { reducedMotion } from '../../utils/env';

type Cell = { type: 'h' | 'v'; i: number; row: number; col: number; title: string };

const ARROW_OFF = 'pointer-events-none';
const THUMB = 'flex flex-col items-center justify-center gap-1.5 p-4 rounded-[18px] border-2 border-transparent bg-slate-800 text-slate-50 cursor-pointer transition-all enabled:hover:scale-[1.03] enabled:hover:border-sky-400 disabled:opacity-35 disabled:cursor-not-allowed';
const THUMB_CURRENT = ['ring-4', 'ring-sky-400/25'];
const ACTIVE_BORDER = 'rgb(56 189 248)';
const IDLE_BORDER = 'rgb(255 255 255 / 0.2)';
const ACTIVE_FILL = 'rgb(56 189 248 / 0.18)';
const IDLE_FILL = 'rgb(255 255 255 / 0.05)';
const NATIVE_COMMAND = 'commandForElement' in HTMLButtonElement.prototype;

export function initDeck(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const instant = 'instant' as ScrollBehavior;

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

  const stored = loadSettings();
  if (verticalUnlocked.get() && !stored.lockTouched && stored.lock) {
    saveSettings({ ...stored, lock: false });
  }
  if (minimapUnlocked.get() && !stored.minimapTouched && !stored.minimap) {
    saveSettings({ ...loadSettings(), minimap: true });
  }
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

  let current = start;
  let vCurrent = vstart;
  let locked = !verticalUnlocked.get() || settings.lock;
  let introPending = !document.documentElement.classList.contains('hero-ready');

  function goTo(i: number, behavior: ScrollBehavior = 'smooth') {
    if (introPending) return;
    const idx = Math.max(0, Math.min(i, hslides.length - 1));
    track.scrollTo({ left: hslides[idx].offsetLeft, behavior });
  }

  function goToV(i: number, behavior: ScrollBehavior = 'smooth') {
    if (introPending || !holder || locked) return;
    const idx = Math.max(0, Math.min(i, vslides.length - 1));
    holder.scrollTo({ top: vslides[idx].offsetTop, behavior });
  }

  function updateUI() {
    counter.textContent = `${current + 1} / ${hslides.length}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === hslides.length - 1;

    const onHolder = current === holderIndex;
    upBtn.disabled = !holder || locked || !onHolder || vCurrent === 0;
    downBtn.disabled = !holder || locked || !onHolder || vCurrent === vslides.length - 1;

    if (holder) {
      holder.classList.toggle('overflow-hidden', locked);
      holder.classList.toggle('overflow-y-auto', !locked);
      holder.classList.toggle('snap-y', !locked);
      holder.classList.toggle('snap-mandatory', !locked);
      holder.classList.toggle('snap-none', locked);
    }

    hslides.forEach((slide, i) => {
      slide.inert = introPending || i !== current;
    });
    vslides.forEach((slide, i) => {
      slide.inert = introPending || i !== vCurrent;
    });

    updateMinimapActive();
  }

  function setLock(on: boolean) {
    locked = on;
    updateUI();
  }

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

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  upBtn.addEventListener('click', () => goToV(vCurrent - 1));
  downBtn.addEventListener('click', () => goToV(vCurrent + 1));

  let arrowsOn = settings.arrows;
  function setArrows(on: boolean) {
    arrowsOn = on;
    [prevBtn, nextBtn, upBtn, downBtn].forEach((btn) => {
      btn.style.display = on ? '' : 'none';
    });
  }

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
    grid.style.gridTemplateColumns = `repeat(${hslides.length}, minmax(0, 1fr))`;
    grid.style.gridTemplateRows = `repeat(${Math.max(vslides.length, 1)}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    cells.forEach((c) => {
      if (locked && c.type === 'v') return;

      const b = document.createElement('button');
      b.className = THUMB;
      b.style.gridColumn = String(c.col + 1);
      b.style.gridRow = String(c.row + 1);
      b.innerHTML = `<span class="text-sky-400 text-[.7rem] tracking-[.12em] uppercase">${c.type === 'v' ? 'Vertical' : 'Horizontal'}</span><strong class="text-center font-bold text-[clamp(.9rem,2vw,1.4rem)]"></strong>`;
      b.querySelector('strong')!.textContent = c.title;

      const isCurrent =
        c.type === 'h'
          ? current === c.i && (locked || !(c.i === holderIndex && vCurrent !== vstart))
          : current === holderIndex && vCurrent === c.i;
      if (isCurrent) {
        b.classList.add(...THUMB_CURRENT);
        b.style.borderColor = ACTIVE_BORDER;
        b.style.backgroundColor = ACTIVE_FILL;
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

  const minimap = document.createElement('div');
  minimap.className =
    'fixed bottom-6 right-6 z-30 grid grid-cols-[48px_48px_48px] grid-rows-[48px_48px_48px] items-center justify-items-center gap-1.5 rounded-[22px] border border-white/20 bg-slate-900/85 p-3 shadow-lg backdrop-blur-md origin-bottom-right';
  minimap.setAttribute('data-minimap', '');
  minimap.setAttribute('data-closing', '');
  minimap.setAttribute('role', 'group');
  minimap.setAttribute('aria-label', 'Minimapa del deck');
  root.appendChild(minimap);

  function setMinimapVisible(on: boolean) {
    if (on) minimap.removeAttribute('data-closing');
    else minimap.setAttribute('data-closing', '');
  }

  const MM_CELL =
    'flex h-full w-full cursor-pointer items-center justify-center rounded-[10px] border-2 bg-white/5 transition-[color,background-color,border-color,scale] hover:border-sky-400';

  type MmCell = {
    el: HTMLButtonElement;
    dot: HTMLSpanElement;
    halo: HTMLSpanElement;
    kind: 'h' | 'v';
    i: number;
    hiddenWhenLocked?: boolean;
  };
  const mmCells: MmCell[] = [];
  let expandBtn: HTMLButtonElement | null = null;

  function mmButton(label: string, placement: string, onClick: () => void) {
    const box = document.createElement('button');
    box.type = 'button';
    box.setAttribute('aria-label', label);
    box.className = `${MM_CELL} ${placement}`;
    box.addEventListener('click', onClick);
    const dot = document.createElement('span');
    dot.className =
      'pointer-events-none relative flex size-3 scale-0 opacity-0 transition-[scale,opacity] duration-200 ease-out motion-reduce:transition-none';
    const halo = document.createElement('span');
    halo.className =
      'absolute inline-flex h-full w-full animate-none rounded-full bg-sky-400 opacity-75 motion-reduce:animate-none';
    const core = document.createElement('span');
    core.className = 'relative inline-flex size-3 rounded-full bg-sky-500';
    dot.append(halo, core);
    dot.setAttribute('aria-hidden', 'true');
    box.appendChild(dot);
    minimap.appendChild(box);
    return { el: box, dot, halo };
  }

  function scrollV(i: number) {
    if (introPending || !holder) return;
    const idx = Math.max(0, Math.min(i, vslides.length - 1));
    if (current !== holderIndex) goTo(holderIndex);
    holder.scrollTo({ top: vslides[idx].offsetTop, behavior: 'smooth' });
  }

  function buildMinimap() {
    minimap.innerHTML = '';
    mmCells.length = 0;
    if (hslides.length === 0) return;

    expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className =
      'flex size-5 cursor-pointer items-center justify-center rounded-[6px] border border-sky-400 bg-sky-400 text-slate-950 transition-colors hover:border-sky-300 hover:bg-sky-300';
    expandBtn.setAttribute('aria-label', 'Abrir vista general');
    const expandIcon = document.getElementById('mm-expand-icon');
    if (expandIcon instanceof HTMLTemplateElement) {
      expandBtn.append(expandIcon.content.cloneNode(true));
    }
    if (NATIVE_COMMAND) {
      expandBtn.setAttribute('command', 'show-modal');
      expandBtn.setAttribute('commandfor', panel.id);
      expandBtn.addEventListener('click', renderOverview);
    } else {
      expandBtn.addEventListener('click', openOverview);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className =
      'flex size-5 cursor-pointer items-center justify-center rounded-[6px] border border-red-400 bg-red-500 text-white transition-colors hover:border-red-300 hover:bg-red-400';
    closeBtn.setAttribute('aria-label', 'Cerrar minimapa');
    const closeIcon = document.getElementById('mm-close-icon');
    if (closeIcon instanceof HTMLTemplateElement) {
      closeBtn.append(closeIcon.content.cloneNode(true));
    }
    closeBtn.addEventListener('click', () => {
      saveSettings({ ...loadSettings(), minimap: false, minimapTouched: true });
    });

    const mapActions = document.createElement('div');
    mapActions.className =
      'col-start-3 row-start-1 justify-self-end self-start flex items-center gap-1';
    mapActions.append(closeBtn, expandBtn);
    minimap.appendChild(mapActions);

    const center = holderIndex >= 0 ? holderIndex : Math.floor(hslides.length / 2);
    const left = center - 1;
    const right = center + 1;

    if (vslides.length > 0) {
      mmCells.push({
        kind: 'v',
        i: 0,
        hiddenWhenLocked: true,
        ...mmButton(vslides[0].dataset.title ?? 'Arriba', 'col-start-2 row-start-1', () => scrollV(0)),
      });
    }
    if (left >= 0) {
      mmCells.push({
        kind: 'h',
        i: left,
        ...mmButton(hslides[left].dataset.title ?? `Slide ${left + 1}`, 'col-start-1 row-start-2', () => goTo(left)),
      });
    }
    const middle = holder && vslides.length > 1 ? 1 : -1;
    mmCells.push(
      middle >= 0
        ? {
            kind: 'v',
            i: middle,
            ...mmButton(hslides[center].dataset.title ?? `Slide ${center + 1}`, 'col-start-2 row-start-2', () => scrollV(middle)),
          }
        : {
            kind: 'h',
            i: center,
            ...mmButton(hslides[center].dataset.title ?? `Slide ${center + 1}`, 'col-start-2 row-start-2', () => goTo(center)),
          },
    );
    if (right < hslides.length) {
      mmCells.push({
        kind: 'h',
        i: right,
        ...mmButton(hslides[right].dataset.title ?? `Slide ${right + 1}`, 'col-start-3 row-start-2', () => goTo(right)),
      });
    }
    if (vslides.length > 2) {
      const last = vslides.length - 1;
      mmCells.push({
        kind: 'v',
        i: last,
        hiddenWhenLocked: true,
        ...mmButton(vslides[last].dataset.title ?? 'Abajo', 'col-start-2 row-start-3', () => scrollV(last)),
      });
    }
  }

  function updateMinimapActive() {
    mmCells.forEach(({ el, dot, halo, kind, i, hiddenWhenLocked }) => {
      const on = locked
        ? kind === 'h'
          ? i === current
          : i === vstart && current === holderIndex
        : kind === 'h'
          ? i === current && !(i === holderIndex && vCurrent !== vstart)
          : current === holderIndex && i === vCurrent;
      el.style.borderColor = on ? ACTIVE_BORDER : IDLE_BORDER;
      el.style.backgroundColor = on ? ACTIVE_FILL : IDLE_FILL;
      el.style.scale = on ? '1.08' : '';
      el.setAttribute('aria-current', on ? 'true' : 'false');
      dot.classList.toggle('opacity-100', on);
      dot.classList.toggle('scale-100', on);
      halo.classList.toggle('animate-ping', on);
      halo.classList.toggle('animate-none', !on);
      const off = hiddenWhenLocked === true && locked;
      el.style.visibility = off ? 'hidden' : '';
      el.tabIndex = off ? -1 : 0;
    });
  }

  let settingsFirst = true;
  subscribeSettings((s) => {
    if (settingsFirst) { settingsFirst = false; return; }
    if (!verticalUnlocked.get()) {
      if (!locked) setLock(true);
    } else if (s.lock !== locked) {
      setLock(s.lock);
    }
    setMinimapVisible(Boolean(s.minimap && minimapUnlocked.get()));
    if (s.arrows !== arrowsOn) setArrows(s.arrows);
  });

  let firstMinimapUnlock = true;
  minimapUnlocked.subscribe((on) => {
    if (firstMinimapUnlock) { firstMinimapUnlock = false; return; }
    if (!on) return;
    const s = loadSettings();
    if (!s.minimapTouched) updateSetting('minimap', true);
    else setMinimapVisible(s.minimap);
  });

  let firstVerticalUnlock = true;
  verticalUnlocked.subscribe((on) => {
    if (firstVerticalUnlock) { firstVerticalUnlock = false; return; }
    if (!on) return;
    const s = loadSettings();
    if (!s.lockTouched) updateSetting('lock', false);
    else if (s.lock !== locked) setLock(s.lock);
  });

  const otherModalOpen = () =>
    [...document.querySelectorAll('dialog[open]')].some((d) => d.id !== panel.id);

  const NAV_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ']);

  const isEditableTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    target.closest('textarea, input, select, [contenteditable]:not([contenteditable="false"])') !== null;

  window.addEventListener('keydown', (e) => {
    if (introPending) return;
    if (isEditableTarget(e.target)) return;
    if (otherModalOpen()) {
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

  track.scrollLeft = hslides[start]?.offsetLeft ?? 0;
  if (holder && vslides[vstart]) holder.scrollTop = vslides[vstart].offsetTop;

  buildMinimap();
  updateMinimapActive();
  setMinimapVisible(Boolean(settings.minimap && minimapUnlocked.get()));
  setArrows(settings.arrows);

  updateUI();

  const controls = [prevBtn, nextBtn, upBtn, downBtn, minimap];

  function releaseDeck() {
    introPending = false;
    root.inert = false;
    updateUI();
    track.style.overflow = '';
    if (holder) holder.style.overflow = '';
    controls.forEach((el) => {
      if (el.style.opacity !== '0') return;
      el.style.opacity = '';
      if (reducedMotion) return;
      const target = Number(getComputedStyle(el).opacity);
      el.animate([{ opacity: 0 }, { opacity: Number.isFinite(target) ? target : 1 }], {
        duration: 450,
        easing: 'ease-out',
      });
    });
  }

  if (introPending) {
    root.inert = true;
    controls.forEach((el) => { el.style.opacity = '0'; });
    track.style.overflow = 'hidden';
    if (holder) holder.style.overflow = 'hidden';
    window.addEventListener('hero:revealed', releaseDeck, { once: true });
  }
}
