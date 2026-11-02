// A saffron dot that follows the pointer and grows into a label over links.

export function initCursor(): void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector<HTMLElement>('.cursor')!;
  const label = el.querySelector<HTMLElement>('.cursor-label')!;
  document.documentElement.classList.add('has-cursor');

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let cx = x;
  let cy = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
    if (target) {
      label.textContent = target.dataset.cursor ?? '';
      el.classList.add('is-big');
    } else {
      el.classList.remove('is-big');
    }
  });

  document.addEventListener('pointerleave', () => (el.style.opacity = '0'));
  document.addEventListener('pointerenter', () => (el.style.opacity = ''));

  const tick = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();

  // Buttons lean towards the cursor a little, like magnets.
  for (const btn of document.querySelectorAll<HTMLElement>('.pill, .sound, .email')) {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  }

  // Hero stickers drift with the mouse at different depths.
  const stickers = [...document.querySelectorAll<HTMLElement>('.sticker')];
  addEventListener('pointermove', (e) => {
    const nx = e.clientX / innerWidth - 0.5;
    const ny = e.clientY / innerHeight - 0.5;
    for (const s of stickers) {
      const d = Number(s.dataset.depth ?? 1);
      s.style.setProperty('--px', `${-nx * 40 * d}px`);
      s.style.setProperty('--py', `${-ny * 30 * d}px`);
    }
  });
}
