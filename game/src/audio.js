// Sound, all synthesized with WebAudio oscillators — no audio files.
// The context is created lazily on the first user gesture; in a headless
// screenshot run there is no gesture, so every call is guarded and the
// game simply stays silent.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Audio is decoration: never let it break the game.
  }
}

function noiseBurst(dur, vol, freq) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
  } catch {
    // Silent is fine.
  }
}

// A soft shoe scuff, alternate pitch each step so it does not drone.
export function playFootstep(alt) {
  noiseBurst(0.07, 0.05, alt ? 500 : 380);
}

// A guard grows suspicious: one questioning blip.
export function playSuspicious() {
  tone(520, 0.16, 'sine', 0.12, 0, 660);
}

// A guard spots the player: a sharp two-note sting.
export function playAlert() {
  tone(220, 0.18, 'sawtooth', 0.14, 0, 330);
  tone(330, 0.22, 'sawtooth', 0.12, 0.14, 440);
}

// A pebble skips across the floor.
export function playPebble() {
  tone(900, 0.06, 'triangle', 0.1, 0, 500);
  tone(700, 0.05, 'triangle', 0.07, 0.09, 420);
}

// Picking up the key or the sapphire: a small golden chime.
export function playPickup() {
  tone(660, 0.14, 'sine', 0.14);
  tone(880, 0.2, 'sine', 0.12, 0.1);
  tone(1320, 0.24, 'sine', 0.08, 0.2);
}

// Caught: a low thud.
export function playCaught() {
  tone(140, 0.3, 'sine', 0.2, 0, 60);
  noiseBurst(0.18, 0.12, 300);
}

// Level clear: a rising little arpeggio.
export function playLevelClear() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.12, i * 0.09));
}

// Escaping with the sapphire: the full win jingle.
export function playWin() {
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
    tone(f, 0.26, 'triangle', 0.12, i * 0.1),
  );
}
