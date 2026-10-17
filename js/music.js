'use strict';

// Les musiques : des variations sur le thème principal de Super Mario Bros. (« Overworld »),
// une pour chaque monde. Les morceaux sont fabriqués au chargement à partir de la partition.
const Music = (() => {
  // ---------- La partition ----------
  // Une mesure = [mélodie, basse (main gauche), accords].
  // Notes : c5, f#4, bb3… ; « r » = silence ; durée après « : » (4 = noire, 8 = croche, 2 = blanche,
  // 1 = ronde, t4 = noire de triolet, « . » = pointée) ; la durée reste valable pour les notes suivantes ;
  // « + » = notes jouées ensemble. Deux accords dans une mesure = un par demi-mesure.
  const BARS = {
    0: ['r:1', 'r:1', 'C'],
    1: ['e5:8 e5 r e5 r c5 e5:4', 'd3:8 d3 r d3 r d3 d3:4', 'G'],
    2: ['g5:4 r g4 r', 'g3:4 r g2 r', 'G'],
    3: ['c5:4 r:8 g4:4 r:8 e4:4', 'g3:4 r:8 e3:4 r:8 c3:4', 'C'],
    4: ['r:8 a4:4 b4 bb4:8 a4:4', 'r:8 f3:4 g3 gb3:8 f3:4', 'F'],
    5: ['g4:t4 e5 g5 a5:4 f5:8 g5', 'e3:t4 c4 e4 f4:4 d4:8 e4', 'C'],
    6: ['r:8 e5:4 c5:8 d5 b4:4 r:8', 'r:8 c4:4 a3:8 b3 g3:4 r:8', 'G'],
    7: ['r:4 g5:8 f#5 f5 d#5:4 e5:8', 'c3:4 r:8 g3 r:4 c4', 'C'],
    8: ['r:8 g#4 a4 c5 r a4 c5 d5', 'f3:4 r:8 c4 c4:4 f3', 'F'],
    9: ['r:4 g5:8 f#5 f5 d#5:4 e5:8', 'c3:4 r:8 g3 r:4 g3:8 c4', 'C'],
    10: ['r:8 c6+g4:4 c6+g4:8 c6+g4:4 r', 'r:2 r:4 g3', 'G'],
    13: ['r:4 eb5 r:8 d5:4 r:8', 'c3:4 ab3 r:8 bb3:4 r:8', 'Ab Bb'],
    14: ['c5:4 r r:2', 'c4:4 r:8 g3 g3:4 c3', 'C'],
    15: ['c5:8 c5 r c5 r c5 d5:4', 'ab2:4 r:8 eb3 r r ab3:4', 'Ab'],
    16: ['e5:8 c5 r a4 g4:2', 'g3:4 r:8 c3 r:4 g2', 'G'],
    17: ['c5:8 c5 r c5 r c5 d5 e5', 'ab2:4 r:8 eb3 r r ab3:4', 'Ab'],
    18: ['r:1', 'g3:4 r:8 c3 r:4 g2', 'G'],
    27: ['e5:8 c5:4 g4:8 r:4 g#4', 'c3:4 r:8 f#3 g3:4 c4', 'C'],
    28: ['a4:8 f5:4 f5:8 a4:4 r', 'f3:4 f3 c4:8 c4 f3:4', 'F'],
    29: ['b4:t4 a5 a5 a5 g5 f5', 'd3:4 r:8 f3 g3:4 b3', 'G7'],
    30: ['e5:8 c5:4 a4:8 g4:4 r', 'f3:4 f3 c4:8 c4 f3:4', 'F'],
    33: ['b4:8 f5:4 f5:8 f5:t4 e5 d5', 'g3:8 g3:4 g3:8 g3:t4 a3 b3', 'G'],
    34: ['g4:8 e4:4 e4:8 c4:4 r', 'c4:4 g3 c3 r', 'C'],
    38: ['r:4 e5:8 g5 e6 c6 d6 g6', 'g3:4 r:8 c3 r:4 g2', 'G'],
    52: ['a4:t4 b4 a4 ab4 bb4 ab4', 'f3:2 db3', 'F Db'],
    53: ['e4:8 d4 e4:2.', 'c3:1', 'C'],
  };
  // mesures qui se répètent à l'identique
  [[11, 7], [12, 8], [19, 15], [20, 16], [21, 1], [22, 2], [31, 27], [32, 28]].forEach(([a, b]) => { BARS[a] = BARS[b]; });

  // Les grandes parties du morceau
  const SECT = {
    I: [1, 2],
    A: [3, 4, 5, 6],
    B: [7, 8, 9, 10, 11, 12, 13, 14],
    C: [15, 16, 17, 18, 19, 20, 21, 22],
    C2: [15, 16, 17, 38, 19, 20, 21, 22],
    D: [27, 28, 29, 30, 31, 32, 33, 34],
    END: [3, 52, 53, 0],
  };

  const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function midiOf(s) {
    const m = /^([a-g])(#|b)?(\d)$/.exec(s);
    return 12 * (parseInt(m[3], 10) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }

  function durOf(s) {
    const dot = s.endsWith('.');
    const k = dot ? s.slice(0, -1) : s;
    const base = k[0] === 't' ? (4 / parseInt(k.slice(1), 10)) * (2 / 3) : 4 / parseInt(k, 10);
    return dot ? base * 1.5 : base;
  }

  function parseLine(str) {
    let t = 0;
    let d = 1;
    const out = [];
    str.split(/\s+/).filter(Boolean).forEach((tok) => {
      const [n, ds] = tok.split(':');
      if (ds) d = durOf(ds);
      if (n !== 'r') out.push({ t, d, p: n.split('+').map(midiOf) });
      t += d;
    });
    out.total = t;
    return out;
  }

  const PARSED = {};
  Object.keys(BARS).forEach((n) => {
    const [mel, bass, ch] = BARS[n];
    const syms = ch.split(' ');
    PARSED[n] = {
      mel: parseLine(mel),
      bass: parseLine(bass),
      ch: syms.map((sym, i) => ({ t: (i * 4) / syms.length, d: 4 / syms.length, sym })),
    };
  });

  // ---------- Accords ----------
  const QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
    6: [0, 4, 7, 9], 9: [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], '7#5': [0, 4, 8, 10], sus4: [0, 5, 7],
  };
  const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function chordOf(sym) {
    const m = /^([A-G])(b|#)?([^/]*)(?:\/([A-G])(b|#)?)?$/.exec(sym);
    const pc = (l, acc) => (LETTER[l] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + 12) % 12;
    const root = pc(m[1], m[2]);
    return { root, iv: (QUAL[m[3]] || QUAL['']).slice(), bass: m[4] ? pc(m[4], m[5]) : root };
  }

  // modes (à partir de do majeur) : quelles notes changent
  const MINOR = { 4: 3, 9: 8, 11: 10 }; // do mineur : mi → mi♭, la → la♭, si → si♭
  const LYD = { 5: 6 }; // lydien : fa → fa♯

  // ---------- Déformer le rythme ----------
  // swing(2/3) : les croches deviennent longue-courte (feeling ternaire, 12/8) ; swing(0.75) : rythme pointé
  const swing = (r) => (t) => {
    const b = Math.floor(t + 1e-9);
    const f = t - b;
    return b + (f < 0.5 ? (f / 0.5) * r : r + ((f - 0.5) / 0.5) * (1 - r));
  };
  // valse : chaque demi-mesure à 4/4 devient une mesure à 3/4 (le premier temps dure deux fois plus)
  const waltz = (t) => {
    const q = Math.floor((t + 1e-9) / 2);
    const f = t - q * 2;
    return q * 3 + (f < 1 ? f * 2 : 1 + f);
  };

  // ---------- Fabrication d'un morceau ----------
  class Song {
    constructor(o) {
      this.bpm = o.bpm;
      this.meter = o.meter || 4;
      this.warp = o.warp || ((t) => t);
      this.mode = o.mode || null;
      this.modeChords = o.modeChords !== false;
      this.chordMap = o.chordMap || {};
      this.key = o.key || 0;
      this.src = 0;
      this.voices = {};
      this.hits = [];
    }

    part(bars, fn) {
      fn(new Part(this, bars));
      this.src += bars.length * 4;
      return this;
    }

    out(extra) {
      const beats = this.warp(this.src);
      const ids = Object.keys(this.voices);
      return Object.assign({
        bpm: this.bpm, beats, voices: ids.map((id) => this.voices[id]), names: ids.map((id) => id.split('|')[0]), drums: this.hits,
      }, extra);
    }
  }

  class Part {
    constructor(S, bars) {
      this.S = S;
      this.f0 = S.warp(S.src);
      this.f1 = S.warp(S.src + bars.length * 4);
      this.mel = [];
      this.bass = [];
      this.ch = [];
      bars.forEach((n, i) => {
        const b = PARSED[n];
        const off = S.src + i * 4;
        b.mel.forEach((e) => this.mel.push({ t: e.t + off, d: e.d, p: e.p, bar: i }));
        b.bass.forEach((e) => this.bass.push({ t: e.t + off, d: e.d, p: e.p, bar: i }));
        b.ch.forEach((c) => {
          const ch = chordOf(S.chordMap[c.sym] || c.sym);
          const tones = ch.iv.map((x) => {
            const pcx = (ch.root + x) % 12;
            const mapped = S.mode && S.modeChords && S.mode[pcx] != null ? S.mode[pcx] : pcx;
            return x + (mapped - pcx);
          });
          const t = S.warp(c.t + off);
          this.ch.push({ t, d: S.warp(c.t + c.d + off) - t, root: ch.root, bass: ch.bass, tones });
        });
      });
    }

    // Change de mode une note de la mélodie. Une note chromatique qui mène d'un demi-ton vers une note
    // abaissée est abaissée elle aussi (ré♯→mi devient ré→mi♭), pour garder le dessin de la mélodie.
    pitch(m, next) {
      const M = this.S.mode;
      const pc = m % 12;
      let shift = 0;
      if (M && M[pc] != null) shift = M[pc] - pc;
      else if (M && next != null && Math.abs(next - m) === 1 && M[next % 12] != null && M[next % 12] < next % 12) shift = -1;
      return m + shift + this.S.key;
    }

    add(name, inst, v, t, d, m) {
      const id = name + '|' + inst + '|' + v;
      const vo = this.S.voices[id] || (this.S.voices[id] = { inst, v, notes: [] });
      vo.notes.push([t, d, m]);
    }

    // la mélodie de la partition (o.oct : octaves, o.gate : durée jouée, o.top : seulement la note du haut,
    // o.delay : décalage en temps pour un canon, o.from/o.to : mesures de la partie)
    melody(name, inst, v, o = {}) {
      const w = this.S.warp;
      this.mel.forEach((e, i) => {
        const next = this.mel[i + 1] ? Math.max(...this.mel[i + 1].p) : null;
        if (o.from != null && e.bar < o.from) return;
        if (o.to != null && e.bar > o.to) return;
        const s = w(e.t) + (o.delay || 0);
        if (s >= this.f1 - 1e-6) return;
        const d = (w(e.t + e.d) - w(e.t)) * (o.gate || 0.92);
        const ps = o.top ? [Math.max(...e.p)] : e.p;
        ps.forEach((m) => this.add(name, inst, v, s, d, this.pitch(m, next) + 12 * (o.oct || 0)));
      });
    }

    // la main gauche de la partition
    bassLine(name, inst, v, o = {}) {
      const w = this.S.warp;
      this.bass.forEach((e) => {
        const s = w(e.t);
        const d = (w(e.t + e.d) - s) * (o.gate || 0.9);
        e.p.forEach((m) => this.add(name, inst, v, s, d, this.pitch(m) + 12 * (o.oct || 0)));
      });
    }

    chordAt(t) {
      let c = this.ch[0];
      for (const x of this.ch) if (x.t <= t + 1e-6) c = x;
      return c;
    }

    // Accompagnement à partir des accords. Un motif = des mesures [position, durée, quoi, volume] :
    // R fondamentale (ou basse de l'accord), O octave, F quinte au-dessus, 5L quinte en dessous,
    // W1/W2 tierce/quinte (walking bass), A note d'approche vers l'accord suivant, P pédale (do),
    // C accord complet, G accord « jazz » (tierce, septième, neuvième), a0…a5 notes d'arpège.
    pattern(name, inst, v, pat, o = {}) {
      const bar = o.bar || this.S.meter;
      const key = this.S.key;
      const low = (o.low || 55) + key;
      const base = 12 * ((o.bassOct == null ? 2 : o.bassOct) + 1) + key;
      for (let b = this.f0, k = 0; b < this.f1 - 1e-6; b += bar, k++) {
        pat[k % pat.length].forEach(([pos, dur, what, vm]) => {
          const t = b + pos;
          if (t >= this.f1 - 1e-6) return;
          const c = this.chordAt(t);
          const bassNote = (pc) => base + pc;
          const rootLow = bassNote(c.root);
          let notes;
          if (what === 'R') notes = [bassNote(c.bass)];
          else if (what === 'r') notes = [rootLow];
          else if (what === 'O') notes = [bassNote(c.bass) + 12];
          else if (what === 'F') notes = [rootLow + c.tones[2]];
          else if (what === '5L') notes = [rootLow + c.tones[2] - 12];
          else if (what === 'W1') notes = [rootLow + c.tones[1]];
          else if (what === 'W2') notes = [rootLow + c.tones[2] - (c.tones[2] > 6 ? 12 : 0)];
          else if (what === 'P') notes = [base];
          else if (what === 'A') {
            const nx = this.chordAt(t + dur + 0.05);
            let target = bassNote(nx.bass);
            const cur = bassNote(c.bass);
            if (target - cur > 6) target -= 12;
            notes = [target + (target >= cur ? -1 : 1)];
          } else {
            const list = voicing(c, low, what === 'G', key);
            if (what[0] === 'a') {
              const i = parseInt(what.slice(1), 10);
              notes = [list[i % list.length] + 12 * Math.floor(i / list.length)];
            } else notes = list;
          }
          notes.forEach((m) => this.add(name, inst, v * (vm || 1), t, dur, m));
        });
      }
    }

    // percussions : motif répété ; o.fill = dernière mesure de la partie ; o.crash = cymbale au début
    drums(pat, o = {}) {
      const bar = this.S.meter;
      const nbars = Math.round((this.f1 - this.f0) / bar);
      for (let k = 0; k < nbars; k++) {
        const b = this.f0 + k * bar;
        const p = o.fill && k === nbars - 1 ? o.fill : pat[k % pat.length];
        p.forEach(([pos, kind, vel]) => this.S.hits.push([b + pos, kind, vel]));
      }
      if (o.crash) this.S.hits.push([this.f0, 'c', o.crash === true ? 1 : o.crash]);
    }

    hit(pos, kind, vel) {
      this.S.hits.push([this.f0 + pos, kind, vel]);
    }
  }

  // notes de l'accord rangées au-dessus de « low » (jazz : tierce, septième et neuvième)
  function voicing(c, low, jazz, key) {
    let iv = c.tones;
    if (jazz && iv.length >= 4) iv = [iv[1], iv[3], iv.length > 4 ? iv[4] : iv[2]];
    const out = iv.map((x) => {
      const pc = (c.root + x + key) % 12;
      return low + ((pc - (low % 12) + 12) % 12);
    });
    return [...new Set(out)].sort((a, b) => a - b);
  }

  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i));

  // ---------- Les variations ----------

  // Écran titre : la version d'origine, façon console 8 bits.
  function title() {
    const S = new Song({ bpm: 180 });
    const D = [[[0, 'h', 0.6], [0.5, 'h', 0.4], [1, 's', 0.45], [1.5, 'h', 0.4], [2, 'h', 0.6], [2.5, 'h', 0.4], [3, 's', 0.45], [3.5, 'h', 0.4]]];
    ['I', 'A', 'A', 'B', 'B', 'C'].forEach((k) => S.part(SECT[k], (p) => {
      p.melody('lead', 'pulse', 0.16, { gate: 0.85 });
      p.bassLine('bass', 'tri', 0.12);
      p.drums(D);
    }));
    return S.out({ drumV: 1.0 });
  }

  // 1. La Prairie Fleurie : calypso au steel drum, basse 3+3+2, guitare sur les contretemps.
  function meadow() {
    const S = new Song({ bpm: 150 });
    const BASS = [[[0, 1.2, 'R'], [1.5, 1.2, 'F'], [3, 0.8, 'O']]];
    const STRUM = [[[0.5, 0.3, 'C'], [1.5, 0.3, 'C'], [2.5, 0.3, 'C'], [3, 0.2, 'C', 0.6], [3.5, 0.3, 'C']]];
    const D = [[[0, 'k'], [1.5, 'r'], [2, 'k'], [3, 'r'], [3.5, 'r', 0.6], ...rep(8, (i) => [i * 0.5, 'x', i % 2 ? 0.5 : 0.8])]];
    const FILL = [[0, 'k'], [1, 't', 0.8], [1.5, 't', 0.8], [2, 't'], [2.5, 'p'], [3, 'p'], [3.5, 'p']];
    S.part(SECT.I, (p) => { p.melody('lead', 'steel', 0.11); p.pattern('bass', 'pizz', 0.22, BASS); p.drums(D); });
    S.part(SECT.A, (p) => { p.melody('lead', 'steel', 0.11); p.pattern('bass', 'pizz', 0.22, BASS); p.pattern('strum', 'guitar', 0.04, STRUM, { low: 57 }); p.drums(D); });
    S.part(SECT.A, (p) => {
      p.melody('lead', 'steel', 0.11);
      p.melody('lead2', 'marimba', 0.07, { oct: -1, top: true });
      p.pattern('bass', 'pizz', 0.22, BASS);
      p.pattern('strum', 'guitar', 0.04, STRUM, { low: 57 });
      p.drums(D, { fill: FILL });
    });
    S.part(SECT.B, (p) => { p.melody('lead', 'steel', 0.11); p.pattern('bass', 'pizz', 0.22, BASS); p.pattern('strum', 'guitar', 0.04, STRUM, { low: 57 }); p.drums(D, { crash: 0.6 }); });
    S.part(SECT.C2, (p) => { p.melody('lead', 'marimba', 0.14, { top: true }); p.pattern('bass', 'pizz', 0.22, BASS); p.pattern('strum', 'guitar', 0.04, STRUM, { low: 57 }); p.drums(D, { fill: FILL }); });
    S.part(SECT.D, (p) => { p.melody('lead', 'steel', 0.11); p.pattern('bass', 'pizz', 0.22, BASS); p.pattern('strum', 'guitar', 0.04, STRUM, { low: 57 }); p.drums(D, { crash: 0.6, fill: FILL }); });
    return S.out({ drumV: 0.8 });
  }

  // 2. La Forêt des Épines : do mineur, en 12/8, flûte et harpe, entrées en canon (fugato) à la clarinette.
  function forest() {
    const S = new Song({ bpm: 88, warp: swing(2 / 3), mode: MINOR });
    const T = 1 / 3;
    const HARP = [[0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 2].map((x, k) => [k * T, 0.6, 'a' + x])];
    const BASS = [[[0, 0.95, 'R'], [1, 0.95, '5L'], [2, 0.95, 'R'], [3, 0.6, '5L'], [3 + 2 * T, T, 'R', 0.8]]];
    const D = [[[0, 'k', 0.5], [1, 'r', 0.7], [2, 'k', 0.4], [3, 'r', 0.7], ...rep(12, (i) => [i * T, 'x', i % 3 ? 0.35 : 0.6])]];
    const base = (p) => {
      p.pattern('harp', 'harp', 0.037, HARP, { low: 55 });
      p.pattern('bass', 'upright', 0.15, BASS);
      p.drums(D);
    };
    S.part(SECT.A, (p) => { p.melody('lead', 'flute', 0.11); base(p); });
    S.part(SECT.A, (p) => { p.melody('lead', 'flute', 0.11); p.melody('canon', 'reed', 0.05, { delay: 2, oct: -1, top: true }); base(p); });
    S.part(SECT.B, (p) => { p.melody('lead', 'reed', 0.1, { top: true }); base(p); });
    S.part(SECT.C, (p) => { p.melody('lead', 'flute', 0.11); p.melody('canon', 'reed', 0.05, { delay: 4, oct: -1, top: true }); base(p); });
    return S.out({ drumV: 1.1 });
  }

  // Stage du Super Saut : bossa nova, accords de jazz (septièmes, neuvièmes), vibraphone et piano électrique.
  function bossa() {
    const S = new Song({
      bpm: 128,
      chordMap: { C: 'Cmaj7', F: 'Fmaj7', G: 'G9', G7: 'G9', Ab: 'Abmaj7', Bb: 'Bb7' },
    });
    const BASS = [[[0, 1.4, 'R'], [1.5, 0.45, '5L'], [2, 1.4, '5L'], [3.5, 0.45, 'R']]];
    const COMP = [[[0, 0.45, 'G'], [1.5, 0.45, 'G'], [3, 0.45, 'G']], [[1, 0.45, 'G'], [2.5, 0.9, 'G']]];
    const shaker = rep(8, (i) => [i * 0.5, 'x', i % 2 ? 0.45 : 0.75]);
    const D = [
      [[0, 'k', 0.6], [1.5, 'k', 0.4], [2, 'k', 0.5], [3.5, 'k', 0.4], [0, 'r'], [1.5, 'r'], [3, 'r'], ...shaker],
      [[0, 'k', 0.6], [1.5, 'k', 0.4], [2, 'k', 0.5], [3.5, 'k', 0.4], [1, 'r'], [2.5, 'r'], ...shaker],
    ];
    const base = (p) => {
      p.pattern('bass', 'upright', 0.14, BASS);
      p.pattern('comp', 'epiano', 0.036, COMP, { low: 52 });
      p.drums(D);
    };
    S.part(SECT.I, (p) => { p.melody('lead', 'vibes', 0.115); base(p); });
    S.part(SECT.A, (p) => { p.melody('lead', 'vibes', 0.115); base(p); });
    S.part(SECT.A, (p) => { p.melody('lead', 'flute', 0.11, { top: true }); base(p); });
    S.part(SECT.D, (p) => { p.melody('lead', 'vibes', 0.115); base(p); });
    S.part(SECT.D, (p) => { p.melody('lead', 'flute', 0.11, { top: true }); p.melody('lead2', 'vibes', 0.055, { oct: -1, top: true }); base(p); });
    return S.out({ drumV: 0.9 });
  }

  // 3. La Vallée des Orages : do mineur, rapide, arpèges électriques en doubles croches,
  // basse en pédale… et dans la 2e partie, la mélodie passe à la basse.
  function storm() {
    const S = new Song({ bpm: 188, mode: MINOR });
    const ARP = [rep(16, (k) => [k * 0.25, 0.22, 'a' + [0, 1, 2, 3, 2, 1, 2, 3][k % 8]])];
    const PEDAL = [rep(8, (k) => [k * 0.5, 0.45, k % 2 ? 'O' : 'R'])];
    const ROOTS = [[[0, 1.9, 'R'], [2, 1.9, 'R']]];
    const PAD = [[[0, 3.9, 'C']]];
    const hats = rep(8, (i) => [i * 0.5, 'h', i % 2 ? 0.5 : 0.8]);
    const D = [[[0, 'k'], [1, 's'], [1.75, 'k', 0.7], [2, 'k'], [2.5, 'k', 0.6], [3, 's'], ...hats]];
    const FILL = [[0, 'k'], [1, 's'], [2, 's', 0.7], [2.25, 's', 0.6], [2.5, 't'], [2.75, 't', 0.8], [3, 's'], [3.25, 's', 0.8], [3.5, 's', 0.9], [3.75, 's']];
    S.part(SECT.I, (p) => { p.melody('lead', 'saw', 0.22); p.pattern('bass', 'synbass', 0.13, PEDAL); p.drums(D, { fill: FILL, crash: true }); p.hit(0, 'n', 0.9); });
    S.part(SECT.A, (p) => { p.melody('lead', 'saw', 0.22); p.pattern('arp', 'pluck', 0.06, ARP, { low: 60 }); p.pattern('bass', 'synbass', 0.13, PEDAL); p.drums(D, { crash: true }); });
    S.part(SECT.A, (p) => { p.melody('lead', 'saw', 0.22); p.pattern('arp', 'pluck', 0.06, ARP, { low: 60 }); p.pattern('bass', 'synbass', 0.13, PEDAL); p.drums(D, { fill: FILL }); });
    S.part(SECT.B, (p) => { p.melody('lead', 'saw', 0.22); p.pattern('arp', 'pluck', 0.06, ARP, { low: 60 }); p.pattern('bass', 'synbass', 0.13, PEDAL); p.drums(D, { crash: true }); });
    S.part(SECT.B, (p) => {
      p.melody('bassmel', 'synbass', 0.17, { oct: -2, top: true });
      p.pattern('arp', 'pluck', 0.06, ARP, { low: 67 });
      p.pattern('pad', 'strings', 0.045, PAD, { low: 60 });
      p.drums(D, { fill: FILL, crash: true });
      p.hit(0, 'n', 0.7);
    });
    S.part(SECT.C, (p) => { p.melody('lead', 'saw', 0.22); p.pattern('arp', 'pluck', 0.06, ARP, { low: 60 }); p.pattern('bass', 'synbass', 0.13, ROOTS); p.drums(D, { fill: FILL, crash: true }); });
    return S.out({ drumV: 0.6 });
  }

  // 4. Les Pentes du Volcan : valse à 3/4 en mode lydien (fa♯), accordéon, tuba « oum-pa-pa » et glockenspiel.
  function mountain() {
    const S = new Song({ bpm: 172, meter: 3, warp: waltz, mode: LYD, modeChords: false, chordMap: { F: 'D', G7: 'Gmaj7', Bb: 'Bb', Db: 'Db' } });
    const OOM = [[[0, 0.9, 'R']], [[0, 0.9, '5L']]];
    const PAH = [[[1, 0.35, 'C'], [2, 0.35, 'C']]];
    const D = [[[0, 'k', 0.55], [1, 'h', 0.45], [2, 'h', 0.45]]];
    const base = (p) => {
      p.pattern('bass', 'tuba', 0.24, OOM);
      p.pattern('pah', 'accordion', 0.08, PAH, { low: 57 });
      p.drums(D);
    };
    S.part(SECT.I, (p) => { p.melody('lead', 'accordion', 0.23); base(p); });
    S.part(SECT.A, (p) => { p.melody('lead', 'accordion', 0.23); base(p); });
    S.part(SECT.A, (p) => { p.melody('lead', 'accordion', 0.23); p.melody('glock', 'glock', 0.067, { oct: 1, top: true }); base(p); });
    S.part(SECT.C, (p) => { p.melody('lead', 'glock', 0.11, { top: true }); p.melody('low', 'accordion', 0.12, { oct: -1, top: true }); base(p); });
    S.part(SECT.D, (p) => { p.melody('lead', 'accordion', 0.23); base(p); });
    return S.out({ drumV: 0.9 });
  }

  // Stage de la Moustache-Grappin : jazz swing (on se balance !), walking bass, ride, trompette bouchée,
  // accords de jazz avec substitution de triton (sol7 → ré♭7).
  function swingJazz() {
    const S = new Song({
      bpm: 168,
      warp: swing(2 / 3),
      chordMap: { C: 'C6', F: 'F7', G: 'G7', G7: 'Db7', Ab: 'Ab7', Bb: 'Bb7', Db: 'Db7' },
    });
    const T = 2 / 3;
    const WALK = [[[0, 0.9, 'R'], [1, 0.9, 'W1'], [2, 0.9, 'W2'], [3, 0.9, 'A']]];
    const COMP = [[[0, 0.45, 'G'], [1 + T, 0.3, 'G']], [[1, 0.3, 'G', 0.8], [2 + T, 0.6, 'G']]];
    const D = [[[0, 'y'], [1, 'y'], [1 + T, 'y', 0.55], [2, 'y'], [3, 'y'], [3 + T, 'y', 0.55], [1, 'h', 0.6], [3, 'h', 0.6], [0, 'k', 0.3], [2, 'k', 0.25], [3 + T, 'b', 0.5]]];
    const FILL = [[0, 'y'], [1, 's', 0.5], [1 + T, 's', 0.6], [2, 'y'], [2 + T, 's', 0.7], [3, 's'], [3 + T, 'k', 0.8]];
    const base = (p) => {
      p.pattern('bass', 'upright', 0.13, WALK);
      p.pattern('comp', 'epiano', 0.04, COMP, { low: 53 });
    };
    S.part(SECT.A, (p) => { p.melody('lead', 'brass', 0.23); base(p); p.drums(D); });
    S.part(SECT.A, (p) => { p.melody('lead', 'brass', 0.23); base(p); p.drums(D, { fill: FILL }); });
    S.part(SECT.B, (p) => { p.melody('lead', 'brass', 0.23); base(p); p.drums(D, { crash: 0.5 }); });
    S.part(SECT.B, (p) => { p.melody('lead', 'vibes', 0.09); base(p); p.drums(D, { fill: FILL }); });
    S.part(SECT.D, (p) => { p.melody('lead', 'brass', 0.23); base(p); p.drums(D, { crash: 0.5, fill: FILL }); });
    return S.out({ drumV: 1.2 });
  }

  // 5. Le Cœur du Volcan : marche épique en mineur, pédale d'orgue, timbales, cuivres et cordes.
  function volcano() {
    const S = new Song({ bpm: 128, mode: MINOR });
    const PEDAL = [[[0, 3.95, 'P']]];
    const ROOTS = [[[0, 1.9, 'R'], [2, 1.9, 'R']]];
    const PAD = [[[0, 3.95, 'C']]];
    const MARCH = [[[0, 'k'], [2, 'k'], [0, 'm', 0.8], [2, 'm', 0.6], [0.75, 's', 0.35], [1, 's', 0.8], [2.75, 's', 0.35], [3, 's', 0.9], [3.5, 's', 0.5], [3.75, 's', 0.4]]];
    const ROLL = rep(16, (i) => [i * 0.25, 'm', 0.35 + i * 0.04]);
    const base = (p, bass) => {
      p.pattern('bass', 'organ', 0.1, bass, { bassOct: 2 });
      p.pattern('pad', 'strings', 0.045, PAD, { low: 55 });
    };
    S.part(SECT.I, (p) => {
      p.melody('lead', 'brass', 0.24);
      p.melody('low', 'organ', 0.06, { oct: -1, top: true });
      p.pattern('bass', 'organ', 0.1, PEDAL, { bassOct: 2 });
      p.drums([ROLL], { crash: true });
    });
    S.part(SECT.A, (p) => { p.melody('lead', 'brass', 0.24); base(p, PEDAL); p.drums(MARCH, { crash: true }); });
    S.part(SECT.A, (p) => { p.melody('lead', 'brass', 0.24); p.melody('low', 'organ', 0.06, { oct: -1, top: true }); base(p, PEDAL); p.drums(MARCH, { fill: ROLL }); });
    S.part(SECT.B, (p) => { p.melody('lead', 'brass', 0.24); base(p, ROOTS); p.drums(MARCH, { crash: true, fill: ROLL }); });
    S.part(SECT.C2, (p) => { p.melody('lead', 'brass', 0.24); p.melody('low', 'organ', 0.06, { oct: -1, top: true }); base(p, ROOTS); p.drums(MARCH, { crash: true, fill: ROLL }); });
    return S.out({ drumV: 0.5 });
  }

  // Victoire : grande marche triomphale, un ton plus haut (ré majeur), avec la vraie fin du morceau.
  function victory() {
    const S = new Song({ bpm: 140, key: 2 });
    const OOM = [[[0, 0.9, 'R'], [2, 0.9, '5L']]];
    const PAH = [[[1, 0.4, 'C'], [3, 0.4, 'C']]];
    const D = [[[0, 'k'], [1, 's', 0.7], [2, 'k'], [3, 's', 0.7], [3.5, 's', 0.4], [3.75, 's', 0.5]]];
    const ROLL = [...rep(12, (i) => [i * 0.25, 's', 0.3 + i * 0.05]), [3, 'k'], [3, 'c']];
    const base = (p) => {
      p.pattern('bass', 'tuba', 0.2, OOM);
      p.pattern('pah', 'strings', 0.08, PAH, { low: 57 });
    };
    S.part(SECT.I, (p) => { p.melody('lead', 'brass', 0.24); base(p); p.drums(D, { crash: true }); });
    S.part(SECT.A, (p) => { p.melody('lead', 'brass', 0.24); p.melody('glock', 'glock', 0.055, { oct: 1, top: true }); base(p); p.drums(D); });
    S.part(SECT.A, (p) => { p.melody('lead', 'brass', 0.24); base(p); p.drums(D, { fill: ROLL }); });
    S.part(SECT.D, (p) => { p.melody('lead', 'brass', 0.24); p.melody('glock', 'glock', 0.055, { oct: 1, top: true }); base(p); p.drums(D, { crash: true }); });
    S.part(SECT.END, (p) => { p.melody('lead', 'brass', 0.24); p.melody('glock', 'glock', 0.055, { oct: 1, top: true }); p.bassLine('bass', 'tuba', 0.2, { oct: -1 }); p.pattern('pad', 'strings', 0.048, [[[0, 3.9, 'C']]], { low: 57 }); p.drums([[[0, 'k'], [0, 'c', 0.7]]]); });
    return S.out({ drumV: 0.8 });
  }

  const SONGS = {
    title: title(),
    meadow: meadow(),
    forest: forest(),
    'badge-saut': bossa(),
    storm: storm(),
    mountain: mountain(),
    'badge-grappin': swingJazz(),
    volcano: volcano(),
    victory: victory(),
  };
  Object.keys(SONGS).forEach((name) => Sound.defineSong(name, SONGS[name]));

  return { SONGS, BARS, PARSED };
})();
