// Small live illustrations for each project card. Each one only animates
// while it is on screen.

type Draw = (g: CanvasRenderingContext2D, w: number, h: number, t: number, c: Colors) => void;

interface Colors {
  bg: string;
  a: string;
  b: string;
}

const TAU = Math.PI * 2;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------- Grandmaster Lens: a tilted board with a best-move arrow ----------

const drawChess: Draw = (g, w, h, t, c) => {
  const sway = Math.sin(t * 0.6) * 0.03;
  const cx = w / 2;
  const top = h * 0.2;
  const bottom = h * 0.86;
  const topHalf = Math.min(w, h) * (0.26 + sway);
  const botHalf = Math.min(w, h) * (0.48 - sway);
  // Bilinear map from board (u, v in 0..8) to the trapezoid.
  const P = (u: number, v: number) => {
    const ty = v / 8;
    const y = lerp(top, bottom, Math.pow(ty, 1.12));
    const half = lerp(topHalf, botHalf, ty);
    return { x: cx - half + (2 * half * u) / 8, y };
  };
  const quad = (u: number, v: number, du = 1, dv = 1) => {
    const a = P(u, v), b = P(u + du, v), d = P(u + du, v + dv), e = P(u, v + dv);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.lineTo(d.x, d.y);
    g.lineTo(e.x, e.y);
    g.closePath();
  };

  g.fillStyle = 'rgba(0,0,0,0.35)';
  quad(-0.3, -0.3, 8.6, 8.6);
  g.fill();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      g.fillStyle = (r + f) % 2 === 0 ? '#efdcb8' : '#ad7c50';
      quad(f, r);
      g.fill();
    }
  }

  // A few pieces as little pawns standing on their squares.
  const pieces: [number, number, boolean][] = [
    [4, 7, true], [3, 7, true], [6, 7, true], [5, 6, true], [4, 4, true], [2, 5, true],
    [4, 0, false], [3, 0, false], [1, 0, false], [5, 1, false], [3, 3, false], [6, 2, false],
  ];
  for (const [f, r, white] of pieces) {
    const base = P(f + 0.5, r + 0.62);
    const s = lerp(0.6, 1, r / 8) * Math.min(w, h) * 0.034;
    g.fillStyle = white ? '#fbf6ee' : '#1d1814';
    g.strokeStyle = white ? '#1d1814' : '#fbf6ee';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(base.x, base.y, s * 1.1, s * 0.45, 0, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(base.x - s * 0.7, base.y);
    g.quadraticCurveTo(base.x - s * 0.2, base.y - s * 1.6, base.x - s * 0.4, base.y - s * 2.2);
    g.lineTo(base.x + s * 0.4, base.y - s * 2.2);
    g.quadraticCurveTo(base.x + s * 0.2, base.y - s * 1.6, base.x + s * 0.7, base.y);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.arc(base.x, base.y - s * 2.6, s * 0.6, 0, TAU);
    g.fill();
    g.stroke();
  }

  // The best-move arrow grows, holds, then fades and repeats.
  const cycle = (t % 3.2) / 3.2;
  const grow = Math.min(1, cycle / 0.4);
  const fade = cycle > 0.85 ? 1 - (cycle - 0.85) / 0.15 : 1;
  const from = { u: 6.5, v: 7.5 };
  const to = { u: 5.5, v: 5.5 };
  const end = { u: lerp(from.u, to.u, grow), v: lerp(from.v, to.v, grow) };
  g.globalAlpha = fade;
  quad(5, 5);
  g.fillStyle = c.b + '66';
  g.fill();
  const a = P(from.u, from.v);
  const b = P(end.u, end.v);
  g.strokeStyle = c.b;
  g.lineWidth = Math.min(w, h) * 0.03;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(a.x, a.y);
  g.lineTo(b.x, b.y);
  g.stroke();
  if (grow >= 1) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const s = Math.min(w, h) * 0.06;
    g.fillStyle = c.b;
    g.beginPath();
    g.moveTo(b.x + Math.cos(ang) * s * 0.6, b.y + Math.sin(ang) * s * 0.6);
    g.lineTo(b.x + Math.cos(ang + 2.4) * s, b.y + Math.sin(ang + 2.4) * s);
    g.lineTo(b.x + Math.cos(ang - 2.4) * s, b.y + Math.sin(ang - 2.4) * s);
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;

  // Corner handles, like the calibration step.
  g.strokeStyle = c.a;
  g.lineWidth = 2;
  for (const [u, v] of [[0, 0], [8, 0], [8, 8], [0, 8]]) {
    const p = P(u, v);
    g.beginPath();
    g.arc(p.x, p.y, 7 + Math.sin(t * 3) * 1.5, 0, TAU);
    g.stroke();
  }
};

// ---------- Wave Studio: a singing waveform and rings ----------

const drawWave: Draw = (g, w, h, t, c) => {
  const cx = w / 2;
  const cy = h / 2;
  for (let i = 0; i < 6; i++) {
    const k = ((t * 0.35 + i / 6) % 1);
    g.strokeStyle = i % 2 ? c.a : c.b;
    g.globalAlpha = (1 - k) * 0.6;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, 20 + k * Math.max(w, h) * 0.55, 0, TAU);
    g.stroke();
  }
  g.globalAlpha = 1;

  // Frequency bars in a ring.
  const bars = 48;
  for (let i = 0; i < bars; i++) {
    const ang = (i / bars) * TAU + t * 0.2;
    const amp = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.2 + i * 0.55) * Math.sin(t * 0.9 + i * 0.21));
    const r0 = Math.min(w, h) * 0.17;
    const r1 = r0 + amp * Math.min(w, h) * 0.14;
    g.strokeStyle = i % 3 === 0 ? c.a : c.b;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
    g.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    g.stroke();
  }

  // A sung melody line drifting across.
  g.strokeStyle = '#fbf6ee';
  g.lineWidth = 2.5;
  g.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const y = cy + Math.sin(x * 0.025 + t * 2.4) * h * 0.08 * Math.sin(x * 0.006 + t * 0.6);
    if (x === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();

  g.fillStyle = '#fbf6ee';
  g.font = `600 ${Math.round(Math.min(w, h) * 0.05)}px 'Space Grotesk', sans-serif`;
  g.textAlign = 'center';
  const notes = ['Sa', 'Re', 'Ga', 'Ma♯', 'Pa', 'Dha', 'Ni'];
  g.fillText(notes[Math.floor(t * 1.5) % notes.length], cx, cy + 6);
};

// ---------- ORBITAL: planets around a sun ----------

const STARS = Array.from({ length: 90 }, () => [Math.random(), Math.random(), Math.random()]);

const drawOrbit: Draw = (g, w, h, t, c) => {
  for (const [x, y, s] of STARS) {
    g.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + s) + s * 10));
    g.fillStyle = '#ffffff';
    g.fillRect(x * w, y * h, 1.4, 1.4);
  }
  g.globalAlpha = 1;
  const cx = w / 2;
  const cy = h / 2;
  const tilt = 0.42;
  const sun = Math.min(w, h) * 0.07;
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, sun * 3);
  glow.addColorStop(0, c.a);
  glow.addColorStop(0.35, c.a + '88');
  glow.addColorStop(1, 'transparent');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(cx, cy, sun * 3, 0, TAU);
  g.fill();

  const planets = [
    { r: 0.16, s: 1.6, size: 0.012, col: '#c9b9a6' },
    { r: 0.24, s: 1.1, size: 0.02, col: '#ffcf8a' },
    { r: 0.33, s: 0.8, size: 0.022, col: c.b },
    { r: 0.42, s: 0.6, size: 0.017, col: '#ff7b5c' },
    { r: 0.56, s: 0.3, size: 0.04, col: '#e8c08a', ring: true },
  ];
  const base = Math.min(w, h) * 0.9;
  const drawn: { x: number; y: number; z: number; p: (typeof planets)[number] }[] = [];
  for (const p of planets) {
    g.strokeStyle = 'rgba(255,255,255,0.14)';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(cx, cy, p.r * base, p.r * base * tilt, 0, 0, TAU);
    g.stroke();
    const a = t * p.s * 0.6 + p.r * 20;
    drawn.push({ x: cx + Math.cos(a) * p.r * base, y: cy + Math.sin(a) * p.r * base * tilt, z: Math.sin(a), p });
  }
  g.fillStyle = c.a;
  g.beginPath();
  g.arc(cx, cy, sun, 0, TAU);
  g.fill();
  drawn.sort((a, b) => a.z - b.z);
  for (const d of drawn) {
    const r = d.p.size * base * (0.85 + 0.15 * d.z);
    if (d.p.ring) {
      g.strokeStyle = 'rgba(232,192,138,0.7)';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(d.x, d.y, r * 2, r * 0.6, -0.3, 0, TAU);
      g.stroke();
    }
    g.fillStyle = d.p.col;
    g.beginPath();
    g.arc(d.x, d.y, r, 0, TAU);
    g.fill();
  }
};

// ---------- raft-kv: leader heartbeats and elections ----------

const drawRaft: Draw = (g, w, h, t, c) => {
  const n = 5;
  const cx = w / 2;
  const cy = h / 2 + h * 0.02;
  const R = Math.min(w, h) * 0.32;
  const term = Math.floor(t / 7);
  const phase = t % 7;
  const leader = (term * 2) % n;
  const crashed = phase > 5.2 ? leader : -1;
  const nextLeader = (leader + 2) % n;
  const nodes = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * TAU;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });

  g.strokeStyle = 'rgba(255,255,255,0.12)';
  g.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      g.beginPath();
      g.moveTo(nodes[i].x, nodes[i].y);
      g.lineTo(nodes[j].x, nodes[j].y);
      g.stroke();
    }
  }

  // Heartbeats from the leader while it is alive; votes during an election.
  if (crashed < 0) {
    const k = (phase % 1.1) / 1.1;
    for (let i = 0; i < n; i++) {
      if (i === leader) continue;
      const p = nodes[leader];
      const q = nodes[i];
      g.fillStyle = c.a;
      g.beginPath();
      g.arc(lerp(p.x, q.x, k), lerp(p.y, q.y, k), 4, 0, TAU);
      g.fill();
    }
  } else {
    const k = Math.min(1, (phase - 5.6) / 0.9);
    if (k > 0) {
      for (let i = 0; i < n; i++) {
        if (i === crashed || i === nextLeader) continue;
        const p = nodes[i];
        const q = nodes[nextLeader];
        g.fillStyle = c.b;
        g.beginPath();
        g.arc(lerp(p.x, q.x, k), lerp(p.y, q.y, k), 4, 0, TAU);
        g.fill();
      }
    }
  }

  const r = Math.min(w, h) * 0.075;
  g.textAlign = 'center';
  g.font = `600 ${Math.round(r * 0.42)}px 'Space Grotesk', sans-serif`;
  nodes.forEach((p, i) => {
    const isLeader = i === leader && crashed < 0;
    const isDown = i === crashed;
    const isCandidate = crashed >= 0 && i === nextLeader;
    g.fillStyle = isDown ? '#3a2a22' : isLeader ? c.a : '#fbf6ee';
    g.beginPath();
    g.arc(p.x, p.y, r, 0, TAU);
    g.fill();
    if (isCandidate) {
      g.strokeStyle = c.b;
      g.setLineDash([5, 5]);
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(p.x, p.y, r + 7 + Math.sin(t * 6) * 2, 0, TAU);
      g.stroke();
      g.setLineDash([]);
    }
    if (isLeader) {
      g.strokeStyle = c.a;
      g.globalAlpha = 0.4;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(p.x, p.y, r + 6 + (phase % 1.1) * 14, 0, TAU);
      g.stroke();
      g.globalAlpha = 1;
    }
    g.fillStyle = isDown ? '#8a6f62' : '#1d1410';
    g.fillText(isDown ? '✕' : isLeader ? 'L' : `S${i + 1}`, p.x, p.y + r * 0.15);
  });

  g.fillStyle = 'rgba(251,246,238,0.75)';
  g.font = `500 ${Math.round(Math.min(w, h) * 0.04)}px 'Space Grotesk', sans-serif`;
  g.fillText(
    crashed >= 0 ? `leader down · election for term ${term + 2}` : `term ${term + 1} · leader sending heartbeats`,
    cx,
    h - Math.min(w, h) * 0.06,
  );
};

const ARTS: Record<string, Draw> = { chess: drawChess, wave: drawWave, orbit: drawOrbit, raft: drawRaft };

export function initArts(reducedMotion: boolean): void {
  const canvases = [...document.querySelectorAll<HTMLCanvasElement>('canvas[data-art]')];
  const visible = new Set<HTMLCanvasElement>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const c = e.target as HTMLCanvasElement;
      if (e.isIntersecting) visible.add(c);
      else visible.delete(c);
    }
  });

  const items = canvases.map((canvas) => {
    io.observe(canvas);
    const card = canvas.closest<HTMLElement>('.project')!;
    const css = getComputedStyle(card);
    const colors: Colors = {
      bg: css.getPropertyValue('--c1').trim(),
      a: css.getPropertyValue('--c2').trim(),
      b: css.getPropertyValue('--c3').trim(),
    };
    return { canvas, g: canvas.getContext('2d')!, draw: ARTS[canvas.dataset.art ?? ''], colors };
  });

  const frame = (now: number) => {
    const t = now / 1000;
    for (const it of items) {
      if (!it.draw || (!visible.has(it.canvas) && it.canvas.width > 0)) continue;
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = it.canvas.clientWidth;
      const h = it.canvas.clientHeight;
      if (it.canvas.width !== Math.round(w * dpr) || it.canvas.height !== Math.round(h * dpr)) {
        it.canvas.width = Math.round(w * dpr);
        it.canvas.height = Math.round(h * dpr);
      }
      it.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      it.g.clearRect(0, 0, w, h);
      it.draw(it.g, w, h, reducedMotion ? 2 : t, it.colors);
    }
    if (!reducedMotion) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  if (reducedMotion) addEventListener('resize', () => requestAnimationFrame(frame));
}
