let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
}

export function isMuted() {
  return muted;
}

type Note = { freq: number; dur: number; type?: OscillatorType; gain?: number };

function playSequence(notes: Note[]) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  let t = c.currentTime;
  for (const n of notes) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.freq, t);
    const peak = n.gain ?? 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + n.dur);
    t += n.dur;
  }
}

export const sfx = {
  click: () => playSequence([{ freq: 600, dur: 0.06, type: "square", gain: 0.08 }]),
  correct: () =>
    playSequence([
      { freq: 660, dur: 0.12, type: "triangle" },
      { freq: 880, dur: 0.12, type: "triangle" },
      { freq: 1175, dur: 0.18, type: "triangle" },
    ]),
  wrong: () =>
    playSequence([
      { freq: 320, dur: 0.15, type: "sawtooth", gain: 0.14 },
      { freq: 220, dur: 0.22, type: "sawtooth", gain: 0.14 },
    ]),
  complete: () =>
    playSequence([
      { freq: 523, dur: 0.14, type: "triangle" },
      { freq: 659, dur: 0.14, type: "triangle" },
      { freq: 784, dur: 0.14, type: "triangle" },
      { freq: 1047, dur: 0.28, type: "triangle" },
    ]),
  start: () =>
    playSequence([
      { freq: 523, dur: 0.1, type: "sine" },
      { freq: 784, dur: 0.16, type: "sine" },
    ]),
};
