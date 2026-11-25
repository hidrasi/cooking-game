// Dapur Kilat — all sound is synthesized with WebAudio, no audio files.
// Every effect is a small function so the game can call it by name; the
// context is created lazily on the first user gesture (browser autoplay rule).

let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol, filterFreq, when = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.07, 'sine', 0.12); },
  drop() { tone(300, 0.08, 'triangle', 0.12, 0, 180); },
  chop() { noise(0.09, 0.22, 900); tone(140, 0.08, 'square', 0.08); },
  chopped() { tone(660, 0.08, 'sine', 0.12); tone(880, 0.12, 'sine', 0.12, 0.07); },
  sizzle() { noise(0.35, 0.10, 3200); },
  cooked() { tone(740, 0.1, 'sine', 0.12); tone(988, 0.14, 'sine', 0.12, 0.09); },
  burnt() { tone(220, 0.25, 'sawtooth', 0.10, 0, 110); },
  plate() { tone(880, 0.06, 'sine', 0.10); tone(1174, 0.1, 'sine', 0.10, 0.05); },
  serve() {
    tone(784, 0.12, 'sine', 0.14);
    tone(988, 0.12, 'sine', 0.14, 0.1);
    tone(1319, 0.2, 'sine', 0.14, 0.2);
  },
  error() { tone(160, 0.18, 'sawtooth', 0.12, 0, 120); },
  orderIn() { tone(587, 0.09, 'triangle', 0.10); tone(740, 0.09, 'triangle', 0.10, 0.08); },
  orderLost() { tone(392, 0.2, 'triangle', 0.12, 0, 262); },
  tick() { tone(1050, 0.05, 'square', 0.06); },
  jingle() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, i * 0.11));
  },
};
