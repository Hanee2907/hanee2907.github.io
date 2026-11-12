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

// ---------- Prism UI: light splitting into a rainbow, landing on glass cards ----------

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const drawPrism: Draw = (g, w, h, t, c) => {
  const s = Math.min(w, h);
  // soft blobs of coloured light behind the glass
  for (const [x, y, r, col] of [
    [0.22, 0.3, 0.32, c.a],
    [0.8, 0.25, 0.3, c.b],
    [0.6, 0.85, 0.34, '#6a5cff'],
  ] as const) {
    const blob = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * s);
    blob.addColorStop(0, col + '55');
    blob.addColorStop(1, 'transparent');
    g.fillStyle = blob;
    g.fillRect(0, 0, w, h);
  }

  const cx = w * 0.46;
  const cy = h * 0.46 + Math.sin(t * 0.9) * s * 0.012;
  const size = s * 0.34;
  const top = { x: cx, y: cy - size * 0.62 };
  const left = { x: cx - size * 0.58, y: cy + size * 0.42 };
  const right = { x: cx + size * 0.58, y: cy + size * 0.42 };

  // the white beam coming in, then three coloured rays fanning out and sweeping a little
  const hit = { x: lerp(left.x, top.x, 0.5), y: lerp(left.y, top.y, 0.5) };
  const exit = { x: lerp(right.x, top.x, 0.45), y: lerp(right.y, top.y, 0.45) };
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, hit.y + s * 0.05);
  g.lineTo(hit.x, hit.y);
  g.stroke();
  const sweep = Math.sin(t * 0.8) * 0.05;
  [c.a, '#6a5cff', c.b].forEach((col, i) => {
    const ang = -0.28 + i * 0.22 + sweep;
    const len = w - exit.x;
    g.strokeStyle = col;
    g.lineWidth = 5;
    g.shadowColor = col;
    g.shadowBlur = 14;
    g.beginPath();
    g.moveTo(exit.x, exit.y + i * 3);
    g.lineTo(exit.x + Math.cos(ang) * len * 1.2, exit.y + Math.sin(ang) * len * 1.2);
    g.stroke();
  });
  g.shadowBlur = 0;

  // the prism itself: frosted glass with a bright edge
  const glass = g.createLinearGradient(left.x, top.y, right.x, right.y);
  glass.addColorStop(0, 'rgba(255,255,255,0.75)');
  glass.addColorStop(1, 'rgba(255,255,255,0.12)');
  g.fillStyle = glass;
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(top.x, top.y);
  g.lineTo(right.x, right.y);
  g.lineTo(left.x, left.y);
  g.closePath();
  g.fill();
  g.stroke();

  // two floating glass cards, like the components
  const card = (x: number, y: number, cw: number, ch: number, phase: number, ring: boolean) => {
    const yy = y + Math.sin(t * 1.1 + phase) * s * 0.015;
    g.fillStyle = 'rgba(255,255,255,0.14)';
    g.strokeStyle = 'rgba(255,255,255,0.4)';
    g.lineWidth = 1;
    roundRect(g, x, yy, cw, ch, s * 0.03);
    g.fill();
    g.stroke();
    if (ring) {
      const r = ch * 0.28;
      const rx = x + cw * 0.3;
      const ry = yy + ch * 0.5;
      g.lineWidth = r * 0.32;
      g.strokeStyle = 'rgba(255,255,255,0.15)';
      g.beginPath();
      g.arc(rx, ry, r, 0, TAU);
      g.stroke();
      const grad = g.createLinearGradient(rx - r, ry, rx + r, ry);
      grad.addColorStop(0, c.a);
      grad.addColorStop(1, c.b);
      g.strokeStyle = grad;
      g.beginPath();
      g.arc(rx, ry, r, -Math.PI / 2, -Math.PI / 2 + TAU * (0.55 + 0.25 * Math.sin(t * 0.7)));
      g.stroke();
    } else {
      const bar = g.createLinearGradient(x, 0, x + cw, 0);
      bar.addColorStop(0, c.a);
      bar.addColorStop(0.5, '#6a5cff');
      bar.addColorStop(1, c.b);
      g.fillStyle = bar;
      roundRect(g, x + cw * 0.12, yy + ch * 0.58, cw * 0.5, ch * 0.2, ch * 0.1);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      roundRect(g, x + cw * 0.12, yy + ch * 0.24, cw * 0.62, ch * 0.12, ch * 0.06);
      g.fill();
    }
  };
  card(w * 0.08, h * 0.66, s * 0.42, s * 0.22, 0, false);
  card(w * 0.66, h * 0.62, s * 0.32, s * 0.26, 1.7, true);
};

// ---------- Yatra: a turning globe with flight arcs from home ----------

const PLACES: [number, number][] = [
  [24.6, 73.7],
  [35, 135.8],
  [36.4, 25.4],
  [51.2, -115.6],
  [31.6, -8],
];
const HOME: [number, number] = [43.65, -79.38];

const drawGlobe: Draw = (g, w, h, t, c) => {
  for (const [x, y, sz] of STARS) {
    g.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t * (0.4 + sz) + sz * 9));
    g.fillStyle = '#ffffff';
    g.fillRect(x * w, y * h, 1.3, 1.3);
  }
  g.globalAlpha = 1;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.36;
  const tilt = 0.35;
  const spin = t * 0.25;

  // project lat/lng on a sphere that turns around its axis and leans towards us
  const P = (lat: number, lng: number, alt = 1) => {
    const la = (lat * Math.PI) / 180;
    const lo = (lng * Math.PI) / 180 + spin;
    const x = Math.cos(la) * Math.sin(lo);
    const y = Math.sin(la);
    const z = Math.cos(la) * Math.cos(lo);
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return { x: cx + x * R * alt, y: cy - y2 * R * alt, z: z2 };
  };

  const halo = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
  halo.addColorStop(0, c.a + '55');
  halo.addColorStop(1, 'transparent');
  g.fillStyle = halo;
  g.beginPath();
  g.arc(cx, cy, R * 1.35, 0, TAU);
  g.fill();
  const sea = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
  sea.addColorStop(0, '#1d4f8f');
  sea.addColorStop(1, '#081a3a');
  g.fillStyle = sea;
  g.beginPath();
  g.arc(cx, cy, R, 0, TAU);
  g.fill();

  // graticule: only the near side
  g.strokeStyle = 'rgba(255,255,255,0.13)';
  g.lineWidth = 1;
  const line = (pts: { x: number; y: number; z: number }[]) => {
    g.beginPath();
    let pen = false;
    for (const p of pts) {
      if (p.z < 0) {
        pen = false;
        continue;
      }
      if (pen) g.lineTo(p.x, p.y);
      else g.moveTo(p.x, p.y);
      pen = true;
    }
    g.stroke();
  };
  for (let lng = -180; lng < 180; lng += 30) line(Array.from({ length: 37 }, (_, i) => P(-90 + i * 5, lng)));
  for (let lat = -60; lat <= 60; lat += 30) line(Array.from({ length: 73 }, (_, i) => P(lat, -180 + i * 5)));

  // arcs from home, a bright dash running along each
  PLACES.forEach(([lat, lng], k) => {
    const pts = Array.from({ length: 41 }, (_, i) => {
      const f = i / 40;
      return P(lerp(HOME[0], lat, f), lerp(HOME[1], lng, f), 1 + Math.sin(f * Math.PI) * 0.28);
    });
    g.strokeStyle = c.a + '40';
    g.lineWidth = 1.5;
    line(pts);
    const head = Math.floor(((t * 0.35 + k * 0.2) % 1) * 40);
    const seg = pts.slice(Math.max(0, head - 6), head + 1);
    g.strokeStyle = k % 2 ? c.b : c.a;
    g.lineWidth = 2.5;
    line(seg);
  });

  // pins with a pulsing ring
  [HOME, ...PLACES].forEach(([lat, lng], k) => {
    const p = P(lat, lng);
    if (p.z < 0.05) return;
    const pulse = (t * 0.8 + k * 0.3) % 1;
    g.strokeStyle = (k === 0 ? c.b : c.a) + Math.round((1 - pulse) * 200).toString(16).padStart(2, '0');
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(p.x, p.y, 4 + pulse * 12, 0, TAU);
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(p.x, p.y, k === 0 ? 3 : 4, 0, TAU);
    g.fill();
  });
};

const ARTS: Record<string, Draw> = {
  chess: drawChess,
  wave: drawWave,
  orbit: drawOrbit,
  raft: drawRaft,
  prism: drawPrism,
  globe: drawGlobe,
};

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
