// Knightly: a little chess knight who keeps visitors company. The eyes follow
// the cursor, it blinks, and it has something to say in every section.

import { sound, YAMAN_AAROH } from './sound';

const LINES: Record<string, string> = {
  top: 'Hi! I’m Knightly. Hanee made me. Try hovering her name ♪',
  work: 'These are Hanee’s favourite builds. The chess one is my cousin!',
  play: 'Psst… can you find the checkmate? I believe in you.',
  path: 'From Gujarat to Toronto, one commit at a time.',
  contact: 'Say hi to Hanee! Her inbox is open. ✦',
};

const POKES = [
  'Hehe, that tickles!',
  'I only move in L-shapes, you know.',
  'Sa… Re… Ga… 🎶',
  'Hanee beats me at chess. Every. Time.',
  'Have you tried the carrom board?',
];

const SVG = `
<svg viewBox="0 0 120 130" aria-hidden="true">
  <ellipse cx="60" cy="122" rx="34" ry="6" fill="rgba(23,19,14,0.15)"/>
  <path d="M28 116 h64 a6 6 0 0 0 -6 -12 h-52 a6 6 0 0 0 -6 12z" fill="#17130e"/>
  <path d="M36 104 C34 86 40 74 50 66 C40 66 30 70 24 76 C16 70 18 58 26 50 C34 40 44 30 58 26 L62 14 L70 26 C88 32 98 50 96 74 C95 88 90 98 84 104 Z" fill="#ff5a1f"/>
  <path d="M62 14 L70 26 L60 27 Z" fill="#c9400f"/>
  <path d="M70 30 C82 36 90 50 90 66" stroke="#ffd2b8" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
  <g class="eye-l"><ellipse cx="52" cy="48" rx="7" ry="8" fill="#fff"/><circle class="pupil" cx="52" cy="49" r="3.6" fill="#17130e"/></g>
  <g class="eye-r"><ellipse cx="70" cy="46" rx="6" ry="7" fill="#fff"/><circle class="pupil" cx="70" cy="47" r="3.2" fill="#17130e"/></g>
  <ellipse cx="42" cy="60" rx="5" ry="3" fill="#ff9f7a" opacity="0.8"/>
  <path d="M30 66 Q34 70 38 66" stroke="#17130e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="27" cy="58" r="1.6" fill="#17130e"/>
</svg>`;

export function initMascot(reducedMotion: boolean): void {
  const root = document.createElement('div');
  root.className = 'mascot';
  root.innerHTML = `<p class="mascot-bubble" role="status" aria-live="polite"></p><button class="mascot-body" type="button" aria-label="Knightly the mascot. Click to say hi">${SVG}</button>`;
  document.body.append(root);
  const bubble = root.querySelector<HTMLElement>('.mascot-bubble')!;
  const body = root.querySelector<HTMLButtonElement>('.mascot-body')!;
  const pupils = [...root.querySelectorAll<SVGCircleElement>('.pupil')];
  const eyes = [...root.querySelectorAll<SVGGElement>('.eye-l, .eye-r')];

  let hideTimer = 0;
  const say = (text: string, ms = 4200) => {
    bubble.textContent = text;
    root.classList.add('is-talking');
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => root.classList.remove('is-talking'), ms);
  };

  // A new line whenever a new section comes into view.
  let current = '';
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = (e.target as HTMLElement).id || 'top';
        if (id !== current && LINES[id]) {
          current = id;
          say(LINES[id]);
        }
      }
    },
    // A thin band across the middle of the screen, so tall sections count too.
    { rootMargin: '-45% 0px -45% 0px' },
  );
  for (const id of ['work', 'play', 'path', 'contact']) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
  setTimeout(() => say(LINES.top), 1800);

  // Eyes follow the pointer.
  addEventListener('pointermove', (e) => {
    const r = body.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 3);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 300) * 2.6;
    for (const p of pupils) p.setAttribute('transform', `translate(${(dx / d) * k} ${(dy / d) * k})`);
  });

  // Blink now and then.
  if (!reducedMotion) {
    const blink = () => {
      eyes.forEach((g) => g.classList.add('is-blink'));
      setTimeout(() => eyes.forEach((g) => g.classList.remove('is-blink')), 140);
      setTimeout(blink, 2500 + Math.random() * 3500);
    };
    setTimeout(blink, 2000);
  }

  let poke = 0;
  body.addEventListener('click', () => {
    root.classList.remove('is-hop');
    void root.offsetWidth;
    root.classList.add('is-hop');
    say(POKES[poke++ % POKES.length], 2600);
    const n = YAMAN_AAROH[Math.floor(Math.random() * YAMAN_AAROH.length)];
    sound.note(n.ratio);
  });
}

/** Little burst of confetti from an element, for celebrations. */
export function confetti(from: HTMLElement): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = from.getBoundingClientRect();
  const colors = ['#ff5a1f', '#f2b84b', '#2ec27e', '#7c6cff', '#ff7aa8'];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.left = `${r.left + r.width / 2}px`;
    p.style.top = `${r.top + r.height / 3}px`;
    p.style.background = colors[i % colors.length];
    const ang = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 160;
    p.style.setProperty('--x', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--y', `${Math.sin(ang) * dist - 80}px`);
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    document.body.append(p);
    setTimeout(() => p.remove(), 1300);
  }
}
