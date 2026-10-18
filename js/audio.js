'use strict';

// Sons et musiques fabriqués directement par le navigateur (Web Audio), sans fichier à télécharger.
const Sound = (() => {
  let ac = null;
  let master = null;
  let musicBus = null;
  let instBus = null;
  let sfxBus = null;
  let noiseBuf = null;
  let muted = false;

  function ensure() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.8;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.connect(master);
    master.connect(ac.destination);
    // musique : les instruments passent par un filtre qui adoucit, les percussions non
    musicBus = ac.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(comp);
    const soften = ac.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 5200;
    soften.connect(musicBus);
    instBus = ac.createGain();
    instBus.connect(soften);
    sfxBus = ac.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  // Les navigateurs n'autorisent le son qu'après un clic ou une touche.
  function unlock() {
    if (!ensure()) return;
    if (ac.state !== 'running') ac.resume().catch(() => {});
    if (wanted && !music) startSong(wanted);
  }

  function tone(o) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + (o.delay || 0);
    const d = o.d || 0.15;
    const osc = ac.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + (o.slide || d));
    if (o.vib) {
      const lfo = ac.createOscillator();
      const lg = ac.createGain();
      lfo.frequency.value = o.vib;
      lg.gain.value = o.vibDepth || 30;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + d + 0.05);
    }
    const g = ac.createGain();
    const v = o.v == null ? 0.15 : o.v;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.a || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    osc.connect(g);
    g.connect(o.bus || sfxBus);
    osc.start(t0);
    osc.stop(t0 + d + 0.05);
  }

  function noise(o) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + (o.delay || 0);
    const d = o.d || 0.2;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const filt = ac.createBiquadFilter();
    filt.type = o.filter || 'lowpass';
    filt.frequency.setValueAtTime(o.f || 1200, t0);
    if (o.f2) filt.frequency.exponentialRampToValueAtTime(o.f2, t0 + d);
    filt.Q.value = o.q || 1;
    const g = ac.createGain();
    const v = o.v == null ? 0.2 : o.v;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    src.connect(filt);
    filt.connect(g);
    g.connect(o.bus || sfxBus);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + d + 0.05);
  }

  function arp(notes, opts) {
    notes.forEach((f, i) => tone(Object.assign({ f, delay: i * (opts.gap || 0.06) }, opts)));
  }

  const sfx = {
    jump() { tone({ type: 'square', f: 280, f2: 620, d: 0.16, v: 0.09 }); },
    stomp() { tone({ type: 'square', f: 520, f2: 140, d: 0.14, v: 0.12 }); noise({ f: 900, d: 0.08, v: 0.12 }); },
    bump() { tone({ type: 'triangle', f: 150, f2: 90, d: 0.1, v: 0.3 }); },
    breakBlock() {
      noise({ f: 1800, f2: 300, d: 0.3, v: 0.35 });
      tone({ type: 'square', f: 220, f2: 70, d: 0.18, v: 0.1 });
    },
    itemAppear() { arp([392, 523, 659, 784], { type: 'square', d: 0.09, v: 0.06, gap: 0.05 }); },
    fruit() { arp([523, 659, 784, 1047, 1319], { type: 'triangle', d: 0.14, v: 0.22, gap: 0.06 }); },
    weapon() { arp([330, 440, 554, 659, 880], { type: 'square', d: 0.1, v: 0.07, gap: 0.05 }); },
    candy() { tone({ type: 'square', f: 1318, d: 0.06, v: 0.06 }); tone({ type: 'square', f: 1760, d: 0.18, v: 0.06, delay: 0.06 }); },
    hurt() { tone({ type: 'square', f: 440, f2: 140, d: 0.35, v: 0.12, vib: 18, vibDepth: 40 }); },
    die() {
      arp([523, 494, 466, 440, 415, 392, 370, 349], { type: 'square', d: 0.12, v: 0.08, gap: 0.09 });
    },
    lava() { noise({ f: 600, f2: 100, d: 0.8, v: 0.4 }); tone({ type: 'sine', f: 200, f2: 60, d: 0.6, v: 0.25 }); },
    throwIt() { noise({ filter: 'bandpass', f: 700, f2: 2400, d: 0.14, v: 0.25, q: 2 }); },
    splat() { noise({ f: 700, f2: 150, d: 0.16, v: 0.25 }); tone({ type: 'sine', f: 260, f2: 90, d: 0.14, v: 0.2 }); },
    stick() { tone({ type: 'sine', f: 180, f2: 90, d: 0.25, v: 0.3 }); noise({ f: 500, d: 0.2, v: 0.2 }); },
    crunch() { noise({ filter: 'highpass', f: 2500, d: 0.05, v: 0.3 }); noise({ filter: 'highpass', f: 2000, d: 0.06, v: 0.25, delay: 0.06 }); },
    fat() { tone({ type: 'sine', f: 180, f2: 420, d: 0.18, v: 0.3 }); tone({ type: 'sine', f: 420, f2: 120, d: 0.35, v: 0.3, delay: 0.18 }); },
    pant() { noise({ filter: 'bandpass', f: 900, d: 0.12, v: 0.06, q: 3 }); },
    unstuck() { tone({ type: 'sine', f: 300, f2: 600, d: 0.12, v: 0.15 }); },
    click() { noise({ filter: 'highpass', f: 3000, d: 0.025, v: 0.12 }); },
    explode() {
      noise({ f: 3000, f2: 120, d: 0.7, v: 0.6 });
      tone({ type: 'sine', f: 140, f2: 35, d: 0.6, v: 0.45 });
    },
    whistle() { tone({ type: 'sine', f: 1600, f2: 500, d: 0.55, v: 0.04 }); },
    zap() {
      tone({ type: 'sawtooth', f: 1400, f2: 180, d: 0.35, v: 0.07, vib: 45, vibDepth: 300 });
      noise({ filter: 'highpass', f: 4000, d: 0.35, v: 0.18 });
    },
    shoot() { tone({ type: 'square', f: 900, f2: 300, d: 0.1, v: 0.07 }); },
    checkpoint() { arp([784, 988, 1175, 1568], { type: 'triangle', d: 0.16, v: 0.22, gap: 0.07 }); },
    pound() { noise({ f: 500, f2: 80, d: 0.3, v: 0.45 }); tone({ type: 'sine', f: 160, f2: 45, d: 0.25, v: 0.4 }); },
    spin() { tone({ type: 'square', f: 600, f2: 900, d: 0.12, v: 0.05 }); },
    star() { arp([523, 659, 784, 1047, 784, 1047, 1319, 1568], { type: 'square', d: 0.08, v: 0.07, gap: 0.045 }); },
    kill() { tone({ type: 'square', f: 300, f2: 900, d: 0.15, v: 0.08 }); },
    chirp() { tone({ type: 'sine', f: 2100, f2: 2900, d: 0.08, v: 0.08 }); tone({ type: 'sine', f: 2300, f2: 3100, d: 0.08, v: 0.08, delay: 0.12 }); },
    oneUp() { arp([659, 784, 1319, 1047, 1175, 1568], { type: 'square', d: 0.1, v: 0.07, gap: 0.08 }); },
    charge() { tone({ type: 'triangle', f: 880, d: 0.08, v: 0.15 }); tone({ type: 'triangle', f: 1320, d: 0.12, v: 0.15, delay: 0.07 }); },
    superJump() {
      tone({ type: 'square', f: 220, f2: 1400, d: 0.38, v: 0.09 });
      arp([784, 1047, 1319, 1568], { type: 'triangle', d: 0.1, v: 0.12, gap: 0.05 });
    },
    grapple() { noise({ filter: 'bandpass', f: 1200, f2: 3500, d: 0.12, v: 0.25, q: 3 }); tone({ type: 'square', f: 300, f2: 900, d: 0.1, v: 0.05 }); },
    grab() { tone({ type: 'triangle', f: 1500, d: 0.08, v: 0.2 }); tone({ type: 'triangle', f: 2250, d: 0.15, v: 0.15, delay: 0.05 }); },
    select() { tone({ type: 'triangle', f: 660, d: 0.07, v: 0.2 }); },
    confirm() { tone({ type: 'triangle', f: 660, d: 0.07, v: 0.2 }); tone({ type: 'triangle', f: 990, d: 0.12, v: 0.2, delay: 0.07 }); },
  };

  // ---------- Instruments ----------
  // Chaque instrument : forme d'onde, enveloppe (a = attaque, d = déclin, s = niveau tenu, r = relâche),
  // p = harmoniques en plus [rapport, niveau, déclin], f = filtre, det = désaccord, vib = vibrato, trem = trémolo.
  const INST = {
    square: { w: 'square', a: 0.012, s: 1, r: 0.03 },
    triangle: { w: 'triangle', a: 0.012, s: 1, r: 0.03 },
    pulse: { w: 'pulse25', a: 0.004, d: 0.3, s: 0.7, r: 0.03 },
    tri: { w: 'triangle', a: 0.004, s: 1, r: 0.02 },
    steel: { w: 'sine', a: 0.003, d: 0.45, s: 0, ring: true, r: 0.08, p: [[2, 0.5, 0.3], [3.01, 0.32, 0.1], [4.16, 0.18, 0.05]] },
    marimba: { w: 'sine', a: 0.002, d: 0.3, s: 0, ring: true, p: [[4, 0.3, 0.04], [9.9, 0.08, 0.02]] },
    guitar: { w: 'triangle', a: 0.003, d: 0.35, s: 0, ring: true, f: 2200, p: [[2, 0.3, 0.12]] },
    pizz: { w: 'triangle', a: 0.003, d: 0.22, s: 0, ring: true, r: 0.05 },
    flute: { w: 'sine', a: 0.05, s: 0.9, r: 0.08, vib: [5.2, 12, 0.15], p: [[2, 0.18, 0], [3, 0.07, 0]] },
    harp: { w: 'triangle', a: 0.003, d: 0.6, s: 0, ring: true, f: 3000, p: [[2, 0.25, 0.3]] },
    reed: { w: 'reed', a: 0.035, s: 0.85, r: 0.06, f: 1600, vib: [5, 8, 0.2] },
    upright: { w: 'triangle', a: 0.004, d: 0.5, s: 0.25, r: 0.06, f: 900, p: [[2, 0.25, 0.08]] },
    vibes: { w: 'sine', a: 0.003, d: 0.9, s: 0, ring: true, trem: [5.5, 0.35], p: [[4, 0.2, 0.08]] },
    epiano: { w: 'sine', a: 0.004, d: 0.8, s: 0.25, r: 0.15, p: [[2, 0.2, 0.3], [7, 0.12, 0.05]] },
    saw: { w: 'sawtooth', a: 0.008, d: 0.2, s: 0.85, r: 0.05, det: 12, f: 2600 },
    pluck: { w: 'sawtooth', a: 0.002, d: 0.12, s: 0, ring: true, f: { f0: 3500, f1: 600, t: 0.12 } },
    synbass: { w: 'sawtooth', a: 0.004, d: 0.15, s: 0.6, r: 0.04, q: 4, f: { f0: 1400, f1: 400, t: 0.1 } },
    accordion: { w: 'sawtooth', a: 0.03, s: 0.9, r: 0.06, det: 14, f: 2200, vib: [6, 6, 0.1] },
    glock: { w: 'sine', a: 0.002, d: 0.5, s: 0, ring: true, p: [[2.76, 0.35, 0.08], [5.4, 0.15, 0.04]] },
    tuba: { w: 'sawtooth', a: 0.02, d: 0.2, s: 0.7, r: 0.06, f: 500 },
    brass: { w: 'sawtooth', a: 0.025, d: 0.25, s: 0.8, r: 0.06, det: 8, f: { f0: 500, f1: 2400, t: 0.06, sus: 1600 } },
    organ: { w: 'organ', a: 0.01, s: 1, r: 0.06 },
    strings: { w: 'sawtooth', a: 0.25, s: 0.9, r: 0.35, det: 16, f: 1700, vib: [5, 5, 0.3] },
  };

  const WAVES = {};
  function setWave(osc, name) {
    if (name === 'sine' || name === 'square' || name === 'sawtooth' || name === 'triangle') {
      osc.type = name;
      return;
    }
    if (!WAVES[name]) {
      const N = 40;
      const re = new Float32Array(N);
      const im = new Float32Array(N);
      if (name === 'pulse25') {
        for (let n = 1; n < N; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
      } else if (name === 'organ') {
        [[1, 1], [2, 0.7], [3, 0.35], [4, 0.45], [6, 0.2], [8, 0.25]].forEach(([n, x]) => { im[n] = x; });
      } else {
        // anche (clarinette) : surtout les harmoniques impaires
        for (let n = 1; n < N; n += 2) im[n] = 1 / n;
        im[2] = 0.08;
      }
      WAVES[name] = ac.createPeriodicWave(re, im);
    }
    osc.setPeriodicWave(WAVES[name]);
  }

  function playInst(name, f, t, dur, v) {
    const P = INST[name] || INST.square;
    const a = P.a || 0.01;
    const r = P.r || 0.04;
    const s = P.s == null ? 1 : P.s;
    const end = t + Math.max(P.ring ? Math.max(dur, (P.d || 0.3) * 2.5) : dur, a + 0.01);
    const stop = end + r * 6;
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(v, t + a);
    if (s < 1) env.gain.setTargetAtTime(Math.max(v * s, 0.0001), t + a, P.d || 0.2);
    env.gain.setTargetAtTime(0.0001, end, r);
    let out = env;
    if (P.trem) {
      const tg = ac.createGain();
      tg.gain.value = 1 - P.trem[1] / 2;
      const lfo = ac.createOscillator();
      const lg = ac.createGain();
      lfo.frequency.value = P.trem[0];
      lg.gain.value = P.trem[1] / 2;
      lfo.connect(lg);
      lg.connect(tg.gain);
      lfo.start(t);
      lfo.stop(stop);
      env.connect(tg);
      out = tg;
    }
    out.connect(instBus);
    let input = env;
    if (P.f) {
      const fl = ac.createBiquadFilter();
      fl.type = 'lowpass';
      fl.Q.value = P.q || 0.7;
      if (typeof P.f === 'number') {
        fl.frequency.value = P.f;
      } else {
        fl.frequency.setValueAtTime(P.f.f0, t);
        fl.frequency.exponentialRampToValueAtTime(P.f.f1, t + P.f.t);
        if (P.f.sus) fl.frequency.setTargetAtTime(P.f.sus, t + P.f.t, 0.15);
      }
      fl.connect(env);
      input = fl;
    }
    const oscs = [];
    const dets = P.det ? [-P.det / 2, P.det / 2] : [0];
    dets.forEach((dt) => {
      const o = ac.createOscillator();
      setWave(o, P.w);
      o.frequency.value = f;
      o.detune.value = dt;
      const g = ac.createGain();
      g.gain.value = 1 / dets.length;
      o.connect(g);
      g.connect(input);
      oscs.push(o);
    });
    (P.p || []).forEach(([ratio, level, decay]) => {
      const o = ac.createOscillator();
      o.frequency.value = f * ratio;
      const g = ac.createGain();
      g.gain.setValueAtTime(level, t);
      if (decay) g.gain.setTargetAtTime(0.0001, t, decay);
      o.connect(g);
      g.connect(input);
      oscs.push(o);
    });
    if (P.vib) {
      const lfo = ac.createOscillator();
      const lg = ac.createGain();
      lfo.frequency.value = P.vib[0];
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * (Math.pow(2, P.vib[1] / 1200) - 1), t + P.vib[2] + 0.1);
      lfo.connect(lg);
      oscs.forEach((o) => lg.connect(o.frequency));
      lfo.start(t);
      lfo.stop(stop);
    }
    oscs.forEach((o) => {
      o.start(t);
      o.stop(stop);
    });
  }

  function noiseHit(t, type, freq, q, v, d, attack) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const filt = ac.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (attack || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(filt);
    filt.connect(g);
    g.connect(musicBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + d + 0.02);
    return filt;
  }

  function thump(t, f0, f1, d, v, type) {
    const osc = ac.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + d * 0.8);
    const g = ac.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g);
    g.connect(musicBus);
    osc.start(t);
    osc.stop(t + d + 0.02);
  }

  // k grosse caisse, s caisse claire, h charleston, o charleston ouvert, r clave, x shaker, c cymbale,
  // y ride, m timbale, t tom, b balai, p claquement de mains, n tonnerre
  function playDrum(k, t, v) {
    switch (k) {
      case 'k': thump(t, 150, 45, 0.14, 0.5 * v); break;
      case 's': noiseHit(t, 'bandpass', 1800, 1, 0.32 * v, 0.11); thump(t, 220, 160, 0.06, 0.12 * v, 'triangle'); break;
      case 'h': noiseHit(t, 'highpass', 7000, 1, 0.12 * v, 0.035); break;
      case 'o': noiseHit(t, 'highpass', 6500, 1, 0.1 * v, 0.25); break;
      case 'r': thump(t, 2500, 2400, 0.035, 0.12 * v); noiseHit(t, 'highpass', 4000, 1, 0.05 * v, 0.015); break;
      case 'x': noiseHit(t, 'highpass', 5500, 1, 0.07 * v, 0.06, 0.012); break;
      case 'c': noiseHit(t, 'highpass', 4500, 0.7, 0.12 * v, 1.2); break;
      case 'y': noiseHit(t, 'bandpass', 6500, 3, 0.1 * v, 0.3); thump(t, 4200, 4100, 0.12, 0.012 * v, 'square'); break;
      case 'm': thump(t, 95, 72, 0.7, 0.42 * v); noiseHit(t, 'lowpass', 300, 1, 0.08 * v, 0.25); break;
      case 't': thump(t, 170, 105, 0.22, 0.38 * v); break;
      case 'b': noiseHit(t, 'bandpass', 3000, 0.7, 0.14 * v, 0.18, 0.02); break;
      case 'p': [0, 0.012, 0.024].forEach((dt) => noiseHit(t + dt, 'bandpass', 1300, 1.5, 0.22 * v, 0.07)); break;
      case 'n': noiseHit(t, 'lowpass', 260, 0.8, 0.5 * v, 2.6, 0.06); thump(t, 70, 38, 1.8, 0.3 * v); break;
      default: break;
    }
  }

  // ---------- Musique ----------
  // Les morceaux des niveaux et de l'étoile sont fabriqués dans music.js (variations sur Super Mario Bros.).
  // Les petits morceaux ci-dessous sont écrits case par case (une case = une croche) :
  // "-" prolonge la note précédente, "." est un silence, "|" sépare les mesures (ignoré).
  const SONGS = {
    clear: {
      bpm: 160, once: true,
      tracks: [
        { w: 'square', v: 0.06, n: 'G4 C5 E5 G5 C6 E6 G6 - E6 - . . | Ab4 C5 Eb5 Ab5 C6 Eb6 Ab6 - Eb6 - . . | Bb4 D5 F5 Bb5 D6 F6 Bb6 - - - C7 - - - - -' },
        { w: 'triangle', v: 0.17, n: 'C3 - - - - - - - - - . . | Ab2 - - - - - - - - - . . | Bb2 - - - - - - - - - C3 - - - - -' },
      ],
    },
    badge: {
      bpm: 150, once: true,
      tracks: [
        { w: 'square', v: 0.06, n: 'C5 E5 G5 C6 - - E5 G5 C6 E6 - - G5 C6 E6 G6 - - - - - - . .' },
        { w: 'triangle', v: 0.17, n: 'C3 - - - - - A2 - - - - - F2 - - G2 - - C3 - - - - -' },
      ],
    },
    gameover: {
      bpm: 110, once: true,
      tracks: [
        { w: 'square', v: 0.06, n: 'C5 . G4 . E4 - A4 - B4 - A4 - G#4 - Bb4 - G#4 - G4 F4 G4 - - - - -' },
        { w: 'triangle', v: 0.17, n: 'C3 - - - . . A2 - - - . . G#2 - - - . . G2 - - - - -' },
      ],
    },
  };

  const NOTE_BASE = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function noteFreq(n) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    if (!m) return 0;
    const semis = NOTE_BASE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) - 4) * 12;
    return 440 * Math.pow(2, semis / 12);
  }

  // Tout morceau devient une liste d'événements triés ; t et d sont en temps (noires).
  function compile(song) {
    if (song.events) return;
    const ev = [];
    if (song.tracks) {
      const tracks = song.tracks.map((tr) => ({ tr, toks: (tr.n || tr.d).split(/\s+/).filter((x) => x && x !== '|') }));
      const len = Math.max(...tracks.map((x) => x.toks.length));
      tracks.forEach(({ tr, toks }) => {
        // une piste plus courte que le morceau recommence (sauf pour les jingles)
        const reps = song.once ? 1 : Math.ceil(len / toks.length);
        for (let k = 0; k < reps; k++) {
          const off = k * toks.length;
          let cur = null;
          toks.forEach((tok, i) => {
            if (off + i >= len) return;
            const t = (off + i) / 2;
            if (tr.d) {
              if (tok !== '.') ev.push({ t, k: tok, v: tr.v });
            } else if (tok === '-') {
              if (cur) cur.d += 0.5 * 0.92;
            } else if (tok === '.') {
              cur = null;
            } else {
              cur = { t, d: 0.5 * 0.92, f: noteFreq(tok), inst: tr.w, v: tr.v };
              ev.push(cur);
            }
          });
        }
      });
      song.beats = len / 2;
    } else {
      song.voices.forEach((vo) => vo.notes.forEach(([t, d, m]) => {
        ev.push({ t, d, f: 440 * Math.pow(2, (m - 69) / 12), inst: vo.inst, v: vo.v });
      }));
      song.drums.forEach(([t, k, vel]) => ev.push({ t, k, v: (song.drumV || 0.55) * (vel == null ? 1 : vel) }));
    }
    ev.sort((x, y) => x.t - y.t);
    song.events = ev;
  }

  let wanted = null;
  let music = null;
  let timer = null;

  function scheduler() {
    if (!music || !ac) return;
    const now = ac.currentTime;
    const song = music.song;
    const beat = 60 / song.bpm;
    for (;;) {
      if (music.pos >= song.events.length) {
        if (song.once) {
          stopSong();
          return;
        }
        music.start += song.beats * beat;
        music.pos = 0;
      }
      const ev = song.events[music.pos];
      let t = music.start + ev.t * beat;
      if (t < now - 0.2) {
        // l'onglet était en pause : on repart d'ici
        music.start += now + 0.05 - t;
        t = now + 0.05;
      }
      if (t > now + 0.15) break;
      if (!muted) {
        if (ev.k) playDrum(ev.k, t, ev.v);
        else if (ev.f) playInst(ev.inst, ev.f, t, ev.d * beat, ev.v);
      }
      music.pos++;
    }
  }

  function startSong(name) {
    const song = SONGS[name];
    if (!song || !ac) return;
    compile(song);
    music = { name, song, pos: 0, start: ac.currentTime + 0.06 };
    if (!timer) timer = setInterval(scheduler, 25);
    scheduler();
  }

  function stopSong() {
    music = null;
  }

  function defineSong(name, song) {
    SONGS[name] = song;
  }

  function playMusic(name) {
    if (wanted === name && music && music.name === name) return;
    wanted = SONGS[name] && SONGS[name].once ? null : name;
    stopSong();
    if (ac) startSong(name);
  }

  function stopMusic() {
    wanted = null;
    stopSong();
  }

  function setMusicVolume(v) {
    if (musicBus) musicBus.gain.setTargetAtTime(0.55 * v, ac.currentTime, 0.05);
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, ac.currentTime, 0.02);
  }

  return {
    unlock,
    sfx,
    playMusic,
    stopMusic,
    defineSong,
    setMusicVolume,
    setMuted,
    isMuted: () => muted,
    currentSong: () => (music ? music.name : null),
  };
})();
