// The hero name: every letter swells as the cursor comes near and sings its
// note of Raag Yaman when touched.

import { NAME_NOTES, sound } from './sound';

const SWAP_WORDS = ['play', 'hear', 'explore', 'solve', 'feel'];

export function initHero(reducedMotion: boolean): void {
  const name = document.querySelector<HTMLElement>('.hero-name')!;
  const letters: HTMLElement[] = [];

  let noteIndex = 0;
  name.querySelectorAll<HTMLElement>('.line').forEach((line) => {
    const word = line.dataset.word ?? line.textContent ?? '';
    line.textContent = '';
    for (const ch of word) {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch;
      span.setAttribute('aria-hidden', 'true');
      span.dataset.note = String(noteIndex++);
      line.append(span);
      letters.push(span);
    }
  });

  // Letters arrive one by one, from thin to bold.
  letters.forEach((l, i) => {
    l.style.opacity = '0';
    l.style.transform = 'translateY(0.35em)';
    setTimeout(() => {
      l.style.transition = 'opacity 0.8s var(--ease), transform 1s var(--ease), font-variation-settings 0.5s var(--ease)';
      l.style.opacity = '';
      l.style.transform = '';
    }, reducedMotion ? 0 : 150 + i * 70);
  });

  const ring = (letter: HTMLElement) => {
    const note = NAME_NOTES[Number(letter.dataset.note)];
    if (!note) return;
    sound.note(note.ratio);
    letter.classList.add('is-ringing');
    setTimeout(() => letter.classList.remove('is-ringing'), 380);
    const pop = document.createElement('span');
    pop.className = 'note-pop';
    pop.textContent = note.name;
    letter.append(pop);
    setTimeout(() => pop.remove(), 1100);
  };

  let last: HTMLElement | null = null;
  name.addEventListener('pointermove', (e) => {
    for (const l of letters) {
      const r = l.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const k = Math.max(0, 1 - d / 260);
      l.style.setProperty('--w', String(Math.round(320 + 580 * k)));
      l.style.setProperty('--soft', String(Math.round(100 * k)));
    }
    const hit = (e.target as HTMLElement).closest<HTMLElement>('.letter');
    if (hit && hit !== last) ring(hit);
    last = hit;
  });

  name.addEventListener('pointerleave', () => {
    last = null;
    for (const l of letters) {
      l.style.setProperty('--w', '380');
      l.style.setProperty('--soft', '0');
    }
  });

  // On touch screens, tapping a letter plays it.
  name.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const hit = (e.target as HTMLElement).closest<HTMLElement>('.letter');
    if (hit) ring(hit);
  });

  // "I design & build software you can ___"
  const word = document.querySelector<HTMLElement>('.swap-word')!;
  if (reducedMotion) return;
  let i = 0;
  setInterval(() => {
    word.classList.remove('is-in');
    word.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % SWAP_WORDS.length;
      word.textContent = SWAP_WORDS[i];
      word.classList.remove('is-out');
      word.classList.add('is-in');
    }, 330);
  }, 2400);
}
