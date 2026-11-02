// A tiny plucked-string synth tuned to Raag Yaman. Sound stays off until the
// visitor turns it on (or presses a button that is clearly about sound).

const SA = 261.63;

export interface Note {
  name: string;
  ratio: number;
}

/** Raag Yaman uses tivra (sharp) Ma. Dots mark the lower and upper octave. */
export const YAMAN_AAROH: Note[] = [
  { name: 'Sa', ratio: 1 },
  { name: 'Re', ratio: 9 / 8 },
  { name: 'Ga', ratio: 5 / 4 },
  { name: 'Ma♯', ratio: 45 / 32 },
  { name: 'Pa', ratio: 3 / 2 },
  { name: 'Dha', ratio: 5 / 3 },
  { name: 'Ni', ratio: 15 / 8 },
  { name: 'Ṡa', ratio: 2 },
];

/** The ten letters of "Hanee Patel", climbing from lower Ni like Yaman's opening phrase. */
export const NAME_NOTES: Note[] = [
  { name: 'Ṇi', ratio: 15 / 16 },
  { name: 'Re', ratio: 9 / 8 },
  { name: 'Ga', ratio: 5 / 4 },
  { name: 'Ma♯', ratio: 45 / 32 },
  { name: 'Pa', ratio: 3 / 2 },
  { name: 'Dha', ratio: 5 / 3 },
  { name: 'Ni', ratio: 15 / 8 },
  { name: 'Ṡa', ratio: 2 },
  { name: 'Ṙe', ratio: 9 / 4 },
  { name: 'Ġa', ratio: 5 / 2 },
];

class Sound {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  enabled = false;
  private listeners: ((on: boolean) => void)[] = [];

  private ensure(): AudioContext {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const ctx = new AudioContext();
    const out = ctx.createGain();
    out.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(ctx, 2.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    out.connect(comp);
    out.connect(reverb).connect(wet).connect(comp);
    comp.connect(ctx.destination);
    this.ctx = ctx;
    this.out = out;
    return ctx;
  }

  /** Fading noise makes a soft room reverb. */
  private impulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  onChange(fn: (on: boolean) => void): void {
    this.listeners.push(fn);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (on) this.ensure();
    this.listeners.forEach((fn) => fn(on));
  }

  /** A plucked note with a small slide (meend) up into the pitch. */
  pluck(ratio: number, delay = 0, velocity = 1): void {
    const ctx = this.ensure();
    const t = ctx.currentTime + delay;
    const f = SA * ratio;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 1.2);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32 * velocity, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    for (const [mult, type, level] of [
      [1, 'triangle', 1],
      [2, 'sine', 0.35],
      [3, 'sine', 0.12],
    ] as const) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f * mult * 0.982, t);
      osc.frequency.exponentialRampToValueAtTime(f * mult, t + 0.07);
      g.gain.value = level;
      osc.connect(g).connect(filter);
      osc.start(t);
      osc.stop(t + 1.9);
    }
    filter.connect(gain).connect(this.out!);
  }

  /** Plays a note only when sound is switched on. */
  note(ratio: number): void {
    if (this.enabled) this.pluck(ratio);
  }

  aaroh(): number {
    YAMAN_AAROH.forEach((n, i) => this.pluck(n.ratio, i * 0.3, i === YAMAN_AAROH.length - 1 ? 1.2 : 0.9));
    return YAMAN_AAROH.length * 300;
  }

  chord(): void {
    if (!this.enabled) return;
    [1, 5 / 4, 3 / 2, 2].forEach((r, i) => this.pluck(r, i * 0.06, 0.7));
  }

  tap(): void {
    if (!this.enabled) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g).connect(this.out!);
    osc.start(t);
    osc.stop(t + 0.13);
  }
}

export const sound = new Sound();
