import './style.css';
import { sound } from './sound';
import { initHero } from './hero';
import { initCursor } from './cursor';
import { initScroll } from './scroll';
import { initArts } from './arts';
import { initPuzzle } from './puzzle';
import { initMascot } from './mascot';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Sound toggle in the nav.
const toggle = document.getElementById('sound')!;
const toggleText = toggle.querySelector('.sound-text')!;
toggle.addEventListener('click', () => sound.setEnabled(!sound.enabled));
sound.onChange((on) => {
  toggle.setAttribute('aria-pressed', String(on));
  toggleText.textContent = on ? 'Sound on' : 'Sound off';
  if (on) sound.pluck(1, 0, 0.7);
});

// Singing tile: pressing it is a clear request for sound, so it always plays.
const singTile = document.querySelector<HTMLElement>('.tile-sing')!;
document.getElementById('sing')!.addEventListener('click', () => {
  const ms = sound.aaroh();
  singTile.classList.add('is-singing');
  setTimeout(() => singTile.classList.remove('is-singing'), ms + 1200);
});

// Carrom tile.
const carrom = document.getElementById('carrom')!;
carrom.addEventListener('click', () => {
  if (carrom.classList.contains('is-shot')) return;
  carrom.classList.add('is-shot');
  sound.tap();
  setTimeout(() => carrom.classList.remove('is-shot'), 2200);
});

// Copy email.
const email = document.getElementById('email')!;
const hint = document.getElementById('email-hint')!;
email.addEventListener('click', async () => {
  const address = 'patelhanee2907@gmail.com';
  try {
    await navigator.clipboard.writeText(address);
    hint.textContent = 'Copied. Talk soon!';
  } catch {
    location.href = `mailto:${address}`;
  }
  setTimeout(() => (hint.textContent = 'Click to copy'), 2600);
});

initHero(reducedMotion);
initCursor();
initScroll(reducedMotion);
initArts(reducedMotion);
initPuzzle();
initMascot(reducedMotion);
