// Bipes curtos via Web Audio. Sem arquivo, sem rede.
// O contexto só abre depois de um gesto (botão Jogar / toque).

let ctx = null;
let failed = false;

function ac() {
  if (failed) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        failed = true;
        return null;
      }
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (err) {
    failed = true;
    return null;
  }
}

function tone(opts) {
  const c = ac();
  if (!c) return;
  const t = opts.at == null ? c.currentTime : opts.at;
  const dur = opts.dur;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type || 'sine';
  o.frequency.setValueAtTime(opts.freq, t);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(40, opts.to), t + dur);
  g.gain.setValueAtTime(opts.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function ensure() {
  ac();
}

export function tick() {
  tone({ freq: 680, dur: 0.06, type: 'square', gain: 0.035 });
}

export function go() {
  tone({ freq: 520, to: 920, dur: 0.13, type: 'square', gain: 0.05 });
}

export function lane() {
  tone({ freq: 360, dur: 0.035, type: 'sine', gain: 0.028 });
}

export function jump() {
  tone({ freq: 430, to: 780, dur: 0.09, type: 'sine', gain: 0.035 });
}

export function milestone() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone({ freq: 880, dur: 0.07, type: 'square', gain: 0.045, at: t });
  tone({ freq: 1320, dur: 0.1, type: 'square', gain: 0.04, at: t + 0.07 });
}

export function near() {
  tone({ freq: 980, to: 1480, dur: 0.08, type: 'triangle', gain: 0.04 });
}

export function crash() {
  const c = ac();
  if (!c) return;
  tone({ freq: 210, to: 42, dur: 0.4, type: 'sawtooth', gain: 0.1 });
  const length = Math.floor(c.sampleRate * 0.28);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  const g = c.createGain();
  g.gain.setValueAtTime(0.16, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.28);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start();
}
