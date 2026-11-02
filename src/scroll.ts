// Scroll-driven effects: fade-in reveals, the statement lighting up word by
// word, project cards stacking, and the timeline line drawing itself.

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function initReveals(): void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  document.querySelectorAll('.reveal').forEach((el, i) => {
    (el as HTMLElement).style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });
}

/** Wraps every word of an element in a span, keeping inline tags like <em>. */
function splitWords(root: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        // Each word keeps its trailing space, so highlights join up.
        const parts = (child.textContent ?? '').match(/\s*\S+\s*|\s+/g) ?? [];
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (!p.trim()) {
            frag.append(p);
            continue;
          }
          const lead = p.match(/^\s*/)![0];
          if (lead) frag.append(lead);
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = p.slice(lead.length);
          words.push(span);
          frag.append(span);
        }
        child.replaceWith(frag);
      } else {
        walk(child);
      }
    }
  };
  walk(root);
  return words;
}

export function initScroll(reducedMotion: boolean): void {
  initReveals();

  const statement = document.querySelector<HTMLElement>('.reveal-words')!;
  const words = splitWords(statement);
  const projects = [...document.querySelectorAll<HTMLElement>('.project')];
  projects.forEach((p, i) => p.style.setProperty('--i', String(i)));
  const timeline = document.querySelector<HTMLElement>('.timeline')!;

  if (reducedMotion) {
    words.forEach((w) => w.classList.add('is-lit'));
    timeline.style.setProperty('--progress', '100%');
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;

    // Statement: words light up as the paragraph moves through the screen.
    const s = statement.getBoundingClientRect();
    const progress = clamp((vh * 0.85 - s.top) / (s.height + vh * 0.35));
    const lit = Math.round(progress * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));

    // Project cards shrink slightly as the next card slides over them.
    projects.forEach((p, i) => {
      const next = projects[i + 1];
      if (!next) return;
      const cover = clamp(1 - (next.getBoundingClientRect().top - p.getBoundingClientRect().top) / vh);
      p.style.setProperty('--s', String(1 - cover * 0.07));
      p.style.filter = `brightness(${1 - cover * 0.35})`;
    });

    // Timeline line grows with the scroll.
    const t = timeline.getBoundingClientRect();
    timeline.style.setProperty('--progress', `${clamp((vh * 0.7 - t.top) / t.height) * 100}%`);
  };

  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  addEventListener('resize', update);
  update();
}
