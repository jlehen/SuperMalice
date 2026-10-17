'use strict';

// Sons et musiques fabriqués directement par le navigateur (Web Audio), sans fichier à télécharger.
const Sound = (() => {
  let ac = null;
  let master = null;
  let musicBus = null;
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
    const soften = ac.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 3200;
    soften.connect(comp);
    musicBus = ac.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(soften);
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
    select() { tone({ type: 'triangle', f: 660, d: 0.07, v: 0.2 }); },
    confirm() { tone({ type: 'triangle', f: 660, d: 0.07, v: 0.2 }); tone({ type: 'triangle', f: 990, d: 0.12, v: 0.2, delay: 0.07 }); },
  };

  // ---------- Musique ----------
  // Chaque morceau : des pistes écrites note par note (une "case" = une croche).
  // "-" prolonge la note précédente, "." est un silence, "|" sépare les mesures (ignoré).
  const SONGS = {
    title: {
      bpm: 132,
      tracks: [
        { w: 'square', v: 0.05, n: 'C5 - E5 G5 C6 - G5 - | A5 - G5 E5 F5 - E5 D5 | C5 - E5 G5 C6 - D6 - | E6 - D6 C6 G5 - - . | A5 - A5 G5 F5 - F5 E5 | D5 - E5 F5 G5 - E5 - | F5 - E5 D5 G4 - B4 D5 | C5 - - - . . . .' },
        { w: 'triangle', v: 0.17, n: 'C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | C3 . G3 . C3 . G3 . | C3 . G3 . E3 . G3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | F2 . C3 . G2 . G2 . | C3 . G3 . C3 . . .' },
        { d: 'k . h . s . h . | k . h k s . h .', v: 0.6 },
      ],
    },
    meadow: {
      bpm: 140,
      tracks: [
        { w: 'square', v: 0.045, n: 'G4 B4 D5 - B4 - G4 - | A4 C5 E5 - D5 - B4 - | G4 B4 D5 G5 F#5 - E5 - | D5 - C5 B4 A4 - - . | E5 - D5 C5 B4 - A4 G4 | A4 - B4 C5 D5 - - . | E5 D5 C5 B4 A4 - D5 - | G4 - - - . . . .' },
        { w: 'triangle', v: 0.17, n: 'G2 . D3 . G2 . B2 . | A2 . E3 . D3 . A2 . | G2 . D3 . G2 . B2 . | D3 . A2 . D3 . F#3 . | C3 . G2 . C3 . E3 . | D3 . A2 . D3 . F#3 . | A2 . E3 . D3 . A2 . | G2 . D3 . G2 . . .' },
        { d: 'k . h . s . h . | k . h . s . h h', v: 0.55 },
      ],
    },
    forest: {
      bpm: 118,
      tracks: [
        { w: 'square', v: 0.045, n: 'A4 - C5 - E5 - D5 C5 | B4 - G4 - E4 - . . | F4 - A4 - C5 - B4 A4 | G#4 - - - E4 - . . | A4 - C5 - E5 - A5 - | G5 - F5 E5 D5 - C5 - | B4 - C5 D5 E5 - G#4 - | A4 - - - . . . .' },
        { w: 'triangle', v: 0.17, n: 'A2 . E3 . A2 . E3 . | G2 . D3 . E2 . B2 . | F2 . C3 . F2 . C3 . | E2 . B2 . E2 . G#2 . | A2 . E3 . A2 . E3 . | D3 . A2 . G2 . D3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . . .' },
        { d: 'k . . h s . . h | k . h . s . h .', v: 0.5 },
      ],
    },
    storm: {
      bpm: 150,
      tracks: [
        { w: 'square', v: 0.045, n: 'D5 - F5 - A5 - G5 F5 | E5 - C5 - A4 - . . | Bb4 - D5 - F5 - E5 D5 | C#5 - E5 - A5 - - . | D5 F5 A5 D6 C6 - A5 - | Bb5 - A5 G5 F5 - E5 - | F5 E5 D5 C#5 E5 - A4 - | D5 - - - . . . .' },
        { w: 'triangle', v: 0.15, n: 'D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 | Bb2 Bb3 Bb2 Bb3 Bb2 Bb3 Bb2 Bb3 | A2 A3 A2 A3 A2 A3 A2 A3 | D2 D3 D2 D3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | A2 A3 A2 A3 A2 A3 A2 A3 | D2 D3 D2 D3 D2 . . .' },
        { d: 'k . h k s . h . | k . h k s . s s', v: 0.55 },
      ],
    },
    mountain: {
      bpm: 136,
      tracks: [
        { w: 'square', v: 0.045, n: 'E5 - B4 - E5 F#5 G5 - | F#5 - E5 - D5 - B4 - | C5 - E5 - G5 - F#5 E5 | D#5 - F#5 - B5 - - . | E5 - G5 - B5 - A5 G5 | F#5 - A5 - D5 - - . | C5 D5 E5 F#5 G5 - D#5 - | E5 - - - . . . .' },
        { w: 'triangle', v: 0.17, n: 'E2 . B2 . E2 . B2 . | D2 . A2 . B2 . F#2 . | C3 . G2 . C3 . G2 . | B2 . F#2 . B2 . D#3 . | E2 . B2 . E2 . B2 . | D2 . A2 . D2 . A2 . | C3 . G2 . B2 . F#2 . | E2 . B2 . E2 . . .' },
        { d: 'k . h . s . h k | k . h . s h s h', v: 0.55 },
      ],
    },
    volcano: {
      bpm: 156,
      tracks: [
        { w: 'square', v: 0.045, n: 'C5 - Eb5 - G5 - Ab5 G5 | F5 - Eb5 - D5 - B4 - | C5 - Eb5 - G5 - C6 - | B5 - G5 - D5 - - . | Ab5 - G5 - F5 - Eb5 - | F5 - Eb5 - D5 - C5 - | B4 - D5 - G5 - F5 D5 | C5 - - - . . . .' },
        { w: 'triangle', v: 0.15, n: 'C2 C3 C2 C3 C2 C3 C2 C3 | G2 G3 G2 G3 G2 G3 G2 G3 | C2 C3 C2 C3 C2 C3 C2 C3 | G2 G3 G2 G3 G2 G3 G2 G3 | Ab2 Ab3 Ab2 Ab3 Ab2 Ab3 Ab2 Ab3 | F2 F3 F2 F3 F2 F3 F2 F3 | G2 G3 G2 G3 G2 G3 G2 G3 | C2 C3 C2 C3 C2 . . .' },
        { d: 'k h s h k k s h | k h s h k s s s', v: 0.6 },
      ],
    },
    star: {
      bpm: 184,
      tracks: [
        { w: 'square', v: 0.045, n: 'C5 E5 G5 C6 G5 E5 C5 E5 | D5 F5 A5 D6 A5 F5 D5 F5 | E5 G5 B5 E6 B5 G5 E5 G5 | F5 A5 C6 F6 G6 - - .' },
        { w: 'triangle', v: 0.16, n: 'C3 . C3 . G2 . G2 . | D3 . D3 . A2 . A2 . | E3 . E3 . B2 . B2 . | F3 . F3 . G3 . G3 .' },
        { d: 'k h s h k h s h', v: 0.6 },
      ],
    },
    clear: {
      bpm: 160, once: true,
      tracks: [
        { w: 'square', v: 0.06, n: 'G4 C5 E5 G5 C6 E6 G6 - E6 - . . | Ab4 C5 Eb5 Ab5 C6 Eb6 Ab6 - Eb6 - . . | Bb4 D5 F5 Bb5 D6 F6 Bb6 - - - C7 - - - - -' },
        { w: 'triangle', v: 0.17, n: 'C3 - - - - - - - - - . . | Ab2 - - - - - - - - - . . | Bb2 - - - - - - - - - C3 - - - - -' },
      ],
    },
    gameover: {
      bpm: 110, once: true,
      tracks: [
        { w: 'square', v: 0.06, n: 'C5 . G4 . E4 - A4 - B4 - A4 - G#4 - Bb4 - G#4 - G4 F4 G4 - - - - -' },
        { w: 'triangle', v: 0.17, n: 'C3 - - - . . A2 - - - . . G#2 - - - . . G2 - - - - -' },
      ],
    },
    victory: {
      bpm: 128,
      tracks: [
        { w: 'square', v: 0.05, n: 'C5 - E5 - G5 - E5 - | F5 - A5 - C6 - A5 - | G5 - B5 - D6 - B5 - | C6 - G5 - E5 - G5 - | A5 - G5 - F5 - E5 - | D5 - F5 - A5 - G5 - | E5 - C5 - D5 - B4 - | C5 - - - - - . .' },
        { w: 'triangle', v: 0.16, n: 'C3 . G3 . E3 . G3 . | F2 . C3 . A2 . C3 . | G2 . D3 . B2 . D3 . | C3 . G3 . E3 . G3 . | F2 . C3 . A2 . C3 . | D3 . A2 . F2 . A2 . | G2 . D3 . G2 . B2 . | C3 . G2 . C3 . . .' },
        { d: 'k . h . s . h . | k . h . s . h h', v: 0.5 },
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

  function parse(song) {
    if (song.parsed) return;
    song.length = 0;
    song.tracks.forEach((tr) => {
      const toks = (tr.n || tr.d).split(/\s+/).filter((t) => t && t !== '|');
      tr.len = toks.length;
      if (tr.d) {
        tr.drums = toks;
      } else {
        tr.events = new Array(toks.length).fill(null);
        let cur = null;
        toks.forEach((tok, i) => {
          if (tok === '-') { if (cur) cur.len++; }
          else if (tok === '.') cur = null;
          else { cur = { f: noteFreq(tok), len: 1 }; tr.events[i] = cur; }
        });
      }
      song.length = Math.max(song.length, tr.len);
    });
    song.parsed = true;
  }

  let wanted = null;
  let music = null;
  let timer = null;
  let rate = 1;

  function playNote(f, t, dur, wave, v) {
    const osc = ac.createOscillator();
    osc.type = wave;
    osc.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.setValueAtTime(v, t + Math.max(0.02, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function playDrum(k, t, v) {
    if (k === 'k') {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.5 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(g); g.connect(musicBus);
      osc.start(t); osc.stop(t + 0.16);
    } else if (k === 's' || k === 'h') {
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      const filt = ac.createBiquadFilter();
      filt.type = k === 's' ? 'bandpass' : 'highpass';
      filt.frequency.value = k === 's' ? 1800 : 7000;
      const g = ac.createGain();
      const d = k === 's' ? 0.11 : 0.035;
      g.gain.setValueAtTime((k === 's' ? 0.32 : 0.12) * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(filt); filt.connect(g); g.connect(musicBus);
      src.start(t, Math.random() * 0.5); src.stop(t + d + 0.02);
    }
  }

  function scheduler() {
    if (!music || !ac) return;
    const now = ac.currentTime;
    if (music.next < now - 0.2) music.next = now + 0.05; // l'onglet était en pause
    while (music.next < now + 0.15) {
      const song = music.song;
      const stepDur = 60 / (song.bpm * rate) / 2;
      if (song.once && music.step >= song.length) {
        stopSong();
        return;
      }
      if (!muted) {
        song.tracks.forEach((tr) => {
          const s = music.step % tr.len;
          if (song.once && music.step >= tr.len) return;
          if (tr.drums) {
            if (tr.drums[s] !== '.') playDrum(tr.drums[s], music.next, tr.v);
          } else {
            const ev = tr.events[s];
            if (ev && ev.f) playNote(ev.f, music.next, ev.len * stepDur * 0.92, tr.w, tr.v);
          }
        });
      }
      music.step++;
      music.next += stepDur;
    }
  }

  function startSong(name) {
    const song = SONGS[name];
    if (!song || !ac) return;
    parse(song);
    music = { name, song, step: 0, next: ac.currentTime + 0.06 };
    if (!timer) timer = setInterval(scheduler, 25);
    scheduler();
  }

  function stopSong() {
    music = null;
  }

  function playMusic(name) {
    if (wanted === name && music && music.name === name) return;
    wanted = SONGS[name] && SONGS[name].once ? null : name;
    rate = 1;
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
    setMusicVolume,
    setMuted,
    isMuted: () => muted,
    currentSong: () => (music ? music.name : null),
  };
})();
