'use strict';

// Décors : cases du sol, blocs, plateformes, ronces, lave et arrière-plans de tous les mondes.
const Scenery = (() => {
  const TAU = Math.PI * 2;
  const PAD = 8;

  const THEMES = {
    meadow: {
      dirt: '#c98545', dirtDark: '#9a5a2a', dirtLight: '#e3a565', stripe: 'rgba(120,60,20,0.16)',
      top: '#5fd44a', topDark: '#33a535', topLight: '#b4f57c', blades: true,
      brick: '#f08a3e', brickDark: '#b2531f', brickLight: '#ffc07a',
      plat: '#ff7fb6', platDark: '#d24f8c', platLight: '#ffd0e6', platDots: '#ffffff',
      bramble: '#8a3f8a', brambleDark: '#3d1640', thorn: '#ffffff',
    },
    // la rivière aux nénuphars : comme la prairie, mais les plateformes sont des rondins
    river: {
      dirt: '#c98545', dirtDark: '#9a5a2a', dirtLight: '#e3a565', stripe: 'rgba(120,60,20,0.16)',
      top: '#5fd44a', topDark: '#33a535', topLight: '#b4f57c', blades: true,
      brick: '#f08a3e', brickDark: '#b2531f', brickLight: '#ffc07a',
      plat: '#a8784a', platDark: '#6e4a26', platLight: '#d2a06a', log: true,
      bramble: '#8a3f8a', brambleDark: '#3d1640', thorn: '#ffffff',
    },
    // le terrier secret (sous la rivière) : de la terre tassée, sans herbe, et des racines pour grimper
    burrow: {
      dirt: '#a8703e', dirtDark: '#7a4a24', dirtLight: '#c48a52', stripe: 'rgba(80,40,10,0.2)',
      top: '#8a6236', topDark: '#634221', topLight: '#b08850', blades: false,
      brick: '#c08a50', brickDark: '#7a4a22', brickLight: '#e6b878',
      plat: '#b07a48', platDark: '#6a4424', platLight: '#d8a874', root: true,
      bramble: '#8a3f8a', brambleDark: '#3d1640', thorn: '#ffffff',
    },
    // les grands arbres : les gros troncs (#) ont de l'écorce et de la mousse dessus,
    // les plateformes (-) sont des branches avec des feuilles
    treetops: {
      dirt: '#9a6438', dirtDark: '#5e3a1e', dirtLight: '#bd8550', stripe: 'rgba(70,35,12,0.3)',
      top: '#62cf4c', topDark: '#2f9a3a', topLight: '#b4f57c', blades: true, bark: true,
      brick: '#c08a50', brickDark: '#7a4a22', brickLight: '#e6b878', crate: true,
      plat: '#9a6438', platDark: '#5e3a1e', platLight: '#c99460', branch: true,
      bramble: '#8a3f8a', brambleDark: '#3d1640', thorn: '#ffffff',
    },
    forest: {
      dirt: '#7a5236', dirtDark: '#52341f', dirtLight: '#9a6d48', stripe: 'rgba(40,20,5,0.2)',
      top: '#3fb45a', topDark: '#1f7f3e', topLight: '#8fe08a', blades: true,
      brick: '#b07a45', brickDark: '#6f4521', brickLight: '#dcaa6e', crate: true,
      plat: '#8a5a32', platDark: '#5a3818', platLight: '#b98654', log: true,
      bramble: '#7a3a8a', brambleDark: '#2f1236', thorn: '#ffffff',
    },
    storm: {
      dirt: '#b77a4a', dirtDark: '#7d4b28', dirtLight: '#d89a62', stripe: 'rgba(90,40,10,0.2)',
      top: '#ff9fd0', topDark: '#d466a6', topLight: '#ffe0f1', blades: false, cream: true,
      brick: '#9d93c6', brickDark: '#655b92', brickLight: '#cfc7f0',
      plat: '#f4ecff', platDark: '#b9a8e0', platLight: '#ffffff', cloud: true,
      bramble: '#5a2a7a', brambleDark: '#22102e', thorn: '#ffffff',
    },
    mountain: {
      dirt: '#8a7470', dirtDark: '#5f4c49', dirtLight: '#a8918c', stripe: 'rgba(50,30,30,0.2)',
      top: '#b8c255', topDark: '#83902f', topLight: '#e2ea8f', blades: true,
      brick: '#9a8b86', brickDark: '#625550', brickLight: '#c9bbb5',
      plat: '#a5764a', platDark: '#6a4a2a', platLight: '#d4a26c',
      bramble: '#6a3a6a', brambleDark: '#2a1028', thorn: '#ffffff',
    },
    badge: {
      dirt: '#5b4bb8', dirtDark: '#3e318a', dirtLight: '#7a6ad8', stripe: 'rgba(255,255,255,0.08)',
      top: '#7ff0ff', topDark: '#33b4d6', topLight: '#e8fdff', blades: false,
      brick: '#a07ce8', brickDark: '#5e43b0', brickLight: '#d6c2ff',
      plat: '#ff9fd8', platDark: '#d0609e', platLight: '#ffe0f4', platDots: '#ffffff',
      bramble: '#6a2a8a', brambleDark: '#2a0f3a', thorn: '#ffffff',
    },
    volcano: {
      dirt: '#43303a', dirtDark: '#2a1c24', dirtLight: '#5d4652', stripe: 'rgba(255,90,20,0.10)',
      top: '#6a4c58', topDark: '#3e2b34', topLight: '#8c6b78', blades: false, crust: true,
      brick: '#4f3b44', brickDark: '#2a1d24', brickLight: '#76606b', glow: true,
      plat: '#5b4650', platDark: '#2f2329', platLight: '#86707b', ember: true,
      bramble: '#4a2030', brambleDark: '#12060a', thorn: '#ffd27a',
    },
    // la grotte : roche violette, petits cristaux qui brillent sur le dessus
    cave: {
      dirt: '#4b4062', dirtDark: '#30283f', dirtLight: '#66597f', stripe: 'rgba(20,10,40,0.25)',
      top: '#6f6394', topDark: '#463c64', topLight: '#9a8cc4', blades: false, crystals: true,
      brick: '#6a6283', brickDark: '#3e3756', brickLight: '#9b93b8',
      plat: '#a5764a', platDark: '#6a4a2a', platLight: '#d4a26c',
      bramble: '#5a3a7a', brambleDark: '#22102e', thorn: '#bff6ff',
    },
    // la montagne des nuages : le sol est fait de nuages tout doux
    sky: {
      dirt: '#e9f0ff', dirtDark: '#bccbef', dirtLight: '#ffffff', stripe: 'rgba(150,170,220,0.16)',
      top: '#ffffff', topDark: '#d9e4ff', topLight: '#ffffff', blades: false, fluffy: true,
      brick: '#ffd56a', brickDark: '#d99a2a', brickLight: '#fff0b0',
      plat: '#ffffff', platDark: '#c9d6f5', platLight: '#ffffff', cloud: true,
      bramble: '#6a5ab0', brambleDark: '#2a2060', thorn: '#ffffff',
    },
    // le monde des bonbons : biscuit, nappage rose, tablettes de chocolat et sucres d'orge
    candy: {
      dirt: '#e2a65e', dirtDark: '#b8773a', dirtLight: '#f5c886', stripe: 'rgba(150,80,20,0.12)',
      top: '#ff8fc8', topDark: '#e0559e', topLight: '#ffd6ec', blades: false, cream: true, biscuit: true,
      brick: '#7a4428', brickDark: '#4a2410', brickLight: '#a0603c', choco: true,
      plat: '#ffffff', platDark: '#e0c8d8', platLight: '#ffffff', candyCane: true,
      bramble: '#3a2030', brambleDark: '#140810', thorn: '#ff6fb0',
    },
  };

  // ---------- Cache d'images (pour aller vite sur tablette) ----------
  const cache = new Map();
  let scale = 1;

  function setScale(s) {
    s = Math.round(s * 100) / 100;
    if (s !== scale) {
      scale = s;
      cache.clear();
    }
  }

  function sprite(key, w, h, draw) {
    let c = cache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w * scale));
      c.height = Math.max(1, Math.ceil(h * scale));
      const g = c.getContext('2d');
      g.scale(scale, scale);
      draw(g);
      cache.set(key, c);
    }
    return c;
  }

  function cornerRect(g, x, y, w, h, tl, tr, br, bl) {
    g.beginPath();
    g.moveTo(x + tl, y);
    g.lineTo(x + w - tr, y);
    if (tr) g.arcTo(x + w, y, x + w, y + tr, tr); else g.lineTo(x + w, y);
    g.lineTo(x + w, y + h - br);
    if (br) g.arcTo(x + w, y + h, x + w - br, y + h, br); else g.lineTo(x + w, y + h);
    g.lineTo(x + bl, y + h);
    if (bl) g.arcTo(x, y + h, x, y + h - bl, bl); else g.lineTo(x, y + h);
    g.lineTo(x, y + tl);
    if (tl) g.arcTo(x, y, x + tl, y, tl); else g.lineTo(x, y);
    g.closePath();
  }

  // ---------- Sol ----------
  function drawGround(g, th, m, v) {
    const T = TILE;
    g.save();
    g.translate(PAD, PAD);
    const R = 14;
    cornerRect(g, 0, 0, T, T, m.t && m.l ? R : 0, m.t && m.r ? R : 0, m.b && m.r ? R : 0, m.b && m.l ? R : 0);
    g.save();
    g.clip();
    const bg = g.createLinearGradient(0, 0, 0, T);
    bg.addColorStop(0, th.dirtLight);
    bg.addColorStop(0.35, th.dirt);
    bg.addColorStop(1, th.dirt);
    g.fillStyle = th.dirt;
    g.fillRect(0, 0, T, T);
    if (m.t) {
      g.fillStyle = bg;
      g.fillRect(0, 0, T, T);
    }
    if (th.bark) drawBark(g, false);
    // strates
    g.fillStyle = th.stripe;
    for (const sy of th.fluffy || th.bark ? [] : [12, 36]) {
      g.beginPath();
      g.moveTo(0, sy);
      for (let x = 0; x <= T; x += 8) g.lineTo(x, sy + Math.sin((x / T) * TAU) * 2.5);
      for (let x = T; x >= 0; x -= 8) g.lineTo(x, sy + 7 + Math.sin((x / T) * TAU + 1) * 2.5);
      g.closePath();
      g.fill();
    }
    if (th.fluffy) {
      // nuage : de grosses boules toutes douces
      for (let i = 0; i < 4; i++) {
        const px = 6 + hash(v * 5.3 + i) * 36;
        const py = (m.t ? 18 : 4) + hash(v * 9.7 + i * 2) * (m.t ? 24 : 38);
        const r = 7 + hash(v * 3.1 + i * 5) * 6;
        g.fillStyle = th.stripe;
        circlePath(g, px, py + 2, r);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        circlePath(g, px - 1, py, r * 0.8);
        g.fill();
      }
    } else if (th.biscuit) {
      // biscuit : des petits trous bien rangés
      for (let i = 0; i < 4; i++) {
        const px = 12 + (i % 2) * 24 + (Math.floor(i / 2) % 2) * 6 - 3;
        const py = (m.t ? 24 : 12) + Math.floor(i / 2) * 16;
        if (py > T - 4) continue;
        g.fillStyle = th.dirtDark;
        circlePath(g, px, py, 2.4);
        g.fill();
        g.fillStyle = th.dirtLight;
        circlePath(g, px - 0.6, py - 1.2, 1.1);
        g.fill();
      }
    }
    // cailloux
    for (let i = 0; i < (th.fluffy || th.biscuit || th.bark ? 0 : 3); i++) {
      const px = 7 + hash(v * 5.3 + i) * 34;
      const py = (m.t ? 20 : 6) + hash(v * 9.7 + i * 2) * (m.t ? 22 : 36);
      const r = 2.5 + hash(v * 3.1 + i * 5) * 3;
      g.fillStyle = th.dirtDark;
      ellipsePath(g, px, py + 1.2, r + 0.6, r * 0.75 + 0.6);
      g.fill();
      g.fillStyle = th.dirtLight;
      ellipsePath(g, px, py, r, r * 0.72);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      ellipsePath(g, px - r * 0.3, py - r * 0.3, r * 0.35, r * 0.2);
      g.fill();
    }
    // ombre intérieure sur les bords visibles
    const edge = (x0, y0, x1, y1) => {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(0,0,0,0.28)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, T, T);
    };
    if (m.l) edge(0, 0, 9, 0);
    if (m.r) edge(T, 0, T - 9, 0);
    if (m.b) edge(0, T, 0, T - 9);
    if (th.glow && m.b) {
      const gr = g.createLinearGradient(0, T, 0, T - 14);
      gr.addColorStop(0, 'rgba(255,110,30,0.45)');
      gr.addColorStop(1, 'rgba(255,110,30,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, T, T);
    }
    g.restore();
    if (m.t) drawTopCap(g, th, m, v);
    g.restore();
  }

  function drawTopCap(g, th, m, v) {
    const T = TILE;
    const lipL = m.l ? -3 : 0;
    const lipR = m.r ? T + 3 : T;
    if (th.crust) {
      g.fillStyle = th.topDark;
      cornerRect(g, lipL, -2, lipR - lipL, 13, m.l ? 7 : 0, m.r ? 7 : 0, m.r ? 5 : 0, m.l ? 5 : 0);
      g.fill();
      g.fillStyle = th.top;
      cornerRect(g, lipL, -2, lipR - lipL, 8, m.l ? 6 : 0, m.r ? 6 : 0, 0, 0);
      g.fill();
      g.strokeStyle = '#ff7a1f';
      g.lineWidth = 1.6;
      g.lineCap = 'round';
      g.beginPath();
      const cx = 8 + hash(v * 4.4) * 30;
      g.moveTo(cx, 1);
      g.lineTo(cx + 4, 6);
      g.lineTo(cx + 1, 11);
      g.moveTo(cx + 4, 6);
      g.lineTo(cx + 10, 8);
      g.stroke();
      g.strokeStyle = 'rgba(255,200,80,0.8)';
      g.lineWidth = 0.7;
      g.stroke();
      return;
    }
    if (th.fluffy) {
      // dessus de nuage tout bosselé
      g.fillStyle = th.topDark;
      for (let i = 0; i < 4; i++) {
        const bx = lipL + 6 + i * ((lipR - lipL - 12) / 3);
        circlePath(g, bx, 4, 9 + hash(v + i) * 2);
        g.fill();
      }
      g.fillStyle = th.top;
      for (let i = 0; i < 4; i++) {
        const bx = lipL + 6 + i * ((lipR - lipL - 12) / 3);
        circlePath(g, bx, 1.5, 8.5 + hash(v + i) * 2);
        g.fill();
      }
      g.fillRect(lipL + 2, 0, lipR - lipL - 4, 9);
      return;
    }
    const gr = g.createLinearGradient(0, -4, 0, 16);
    gr.addColorStop(0, th.topLight);
    gr.addColorStop(0.35, th.top);
    gr.addColorStop(1, th.topDark);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(lipL, 3);
    g.quadraticCurveTo(lipL, -3, lipL + 6, -3);
    g.lineTo(lipR - 6, -3);
    g.quadraticCurveTo(lipR, -3, lipR, 3);
    // bord festonné
    const sc = 8;
    let x = lipR;
    g.lineTo(lipR, 9);
    while (x > lipL) {
      const nx = Math.max(lipL, x - sc);
      g.quadraticCurveTo((x + nx) / 2, th.cream ? 19 + (Math.round(x) % 16 === 0 ? 5 : 0) : 17, nx, 10);
      x = nx;
    }
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)';
    roundRectPath(g, lipL + 4, -1.5, lipR - lipL - 8, 3, 1.5);
    g.fill();
    if (th.blades) {
      g.fillStyle = th.top;
      for (let i = 0; i < 3; i++) {
        const bx = 6 + hash(v * 7.7 + i * 3) * 36;
        const bh = 4 + hash(v * 2.9 + i) * 4;
        g.beginPath();
        g.moveTo(bx - 3, -1);
        g.quadraticCurveTo(bx - 1, -bh, bx + 1, -bh - 1);
        g.quadraticCurveTo(bx + 1, -bh * 0.4, bx + 3, -1);
        g.closePath();
        g.fill();
      }
    }
    if (th.cream) {
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 2; i++) {
        circlePath(g, 10 + i * 24 + hash(v + i) * 6, 2, 1.6);
        g.fill();
      }
    }
    if (th.biscuit) {
      // vermicelles de toutes les couleurs sur le nappage
      const cols = ['#ffffff', '#7fd3ff', '#ffe14d', '#7dff9a', '#b06bff'];
      g.lineCap = 'round';
      g.lineWidth = 2.2;
      for (let i = 0; i < 4; i++) {
        const sx = 6 + hash(v * 4.1 + i * 3) * 36;
        const sy = 2 + hash(v * 7.3 + i) * 6;
        const a = hash(v * 2.2 + i * 7) * Math.PI;
        g.strokeStyle = cols[(i + v) % cols.length];
        g.beginPath();
        g.moveTo(sx - Math.cos(a) * 2.5, sy - Math.sin(a) * 2.5);
        g.lineTo(sx + Math.cos(a) * 2.5, sy + Math.sin(a) * 2.5);
        g.stroke();
      }
    }
    if (th.crystals && hash(v * 3.7) < 0.6) {
      // petits cristaux qui poussent sur la roche
      const cx = 8 + hash(v * 6.1) * 30;
      const cols = ['#7ff0ff', '#ff9fd8', '#c9a6ff', '#ffe680'];
      g.fillStyle = cols[v % cols.length];
      for (let k = -1; k <= 1; k++) {
        const h = k === 0 ? 11 : 7;
        g.beginPath();
        g.moveTo(cx + k * 4 - 2.5, 1);
        g.lineTo(cx + k * 5, -h);
        g.lineTo(cx + k * 4 + 2.5, 1);
        g.closePath();
        g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(cx - 0.8, -8, 1.4, 6);
    }
  }

  // ---------- Écorce et troncs (les Grands Arbres) ----------
  // De longues rainures qui montent (elles se raccordent d'une case à l'autre), et parfois un nœud.
  function drawBark(g, knot, x0, x1) {
    const T = TILE;
    const xa = x0 || 0;
    const xb = x1 || T;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let k = 0; k < 4; k++) {
      const bx = 6 + k * 12;
      if (bx < xa + 4 || bx > xb - 4) continue;
      const groove = (dx) => {
        g.beginPath();
        for (let y = -2; y <= T + 2; y += 4) {
          const x = bx + dx + Math.sin((y / T) * TAU + k * 1.7) * 2;
          if (y === -2) g.moveTo(x, y); else g.lineTo(x, y);
        }
      };
      groove(0);
      g.strokeStyle = 'rgba(60,30,10,0.38)';
      g.lineWidth = 3;
      g.stroke();
      groove(2.6);
      g.strokeStyle = 'rgba(255,225,180,0.2)';
      g.lineWidth = 1.2;
      g.stroke();
    }
    if (knot) {
      // un nœud dans le bois
      const kx = (xa + xb) / 2 + 2;
      ellipsePath(g, kx, T * 0.55, 6.5, 9);
      g.fillStyle = 'rgba(60,30,10,0.45)';
      g.fill();
      ellipsePath(g, kx, T * 0.55, 3.5, 5.5);
      g.fillStyle = 'rgba(30,12,2,0.55)';
      g.fill();
      ellipsePath(g, kx - 1.5, T * 0.5, 2.5, 1.2);
      g.fillStyle = 'rgba(255,225,180,0.35)';
      g.fill();
    }
  }

  // Un morceau de tronc (|) : il est dans le décor, un peu plus sombre que les gros troncs (#).
  // l / r : c'est le bord gauche / droit du tronc.
  function trunkSprite(l, r, v) {
    return sprite(`tr:${l | 0}${r | 0}:${v}`, TILE, TILE, (g) => {
      const T = TILE;
      const x0 = l ? 4 : 0;
      const x1 = r ? T - 4 : T;
      // la lumière vient de la gauche : le tronc s'assombrit vers la droite (sur deux cases)
      const gr = g.createLinearGradient(l ? x0 : -T, 0, r ? x1 : 2 * T, 0);
      gr.addColorStop(0, '#a87442');
      gr.addColorStop(0.45, '#83522c');
      gr.addColorStop(1, '#5c381c');
      g.fillStyle = gr;
      g.fillRect(x0, 0, x1 - x0, T);
      drawBark(g, v === 0, x0, x1);
      g.fillStyle = 'rgba(50,25,8,0.75)';
      if (l) g.fillRect(x0, 0, 2, T);
      if (r) g.fillRect(x1 - 2, 0, 2, T);
    });
  }

  function groundSprite(theme, m, v) {
    const key = `g:${theme}:${m.t | 0}${m.l | 0}${m.r | 0}${m.b | 0}:${v}`;
    return sprite(key, TILE + PAD * 2, TILE + PAD * 2, (g) => drawGround(g, THEMES[theme], m, v));
  }

  // ---------- Briques ----------
  function brickSprite(theme) {
    return sprite(`b:${theme}`, TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const th = THEMES[theme];
      const T = TILE;
      g.translate(PAD, PAD);
      g.fillStyle = th.brickDark;
      roundRectPath(g, 0, 0, T, T, 6);
      g.fill();
      if (th.crate) {
        g.fillStyle = th.brick;
        roundRectPath(g, 3, 3, T - 6, T - 6, 4);
        g.fill();
        g.strokeStyle = th.brickDark;
        g.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
          g.beginPath();
          g.moveTo(5, 3 + i * 10.5);
          g.lineTo(T - 5, 3 + i * 10.5);
          g.stroke();
        }
        g.fillStyle = th.brickLight;
        g.save();
        g.translate(T / 2, T / 2);
        g.rotate(Math.PI / 4);
        roundRectPath(g, -30, -4, 60, 8, 3);
        g.fill();
        g.restore();
        g.strokeStyle = th.brickDark;
        g.lineWidth = 3;
        roundRectPath(g, 3, 3, T - 6, T - 6, 4);
        g.stroke();
        g.fillStyle = '#d9d9e0';
        for (const [cx, cy] of [[7, 7], [T - 7, 7], [7, T - 7], [T - 7, T - 7]]) {
          circlePath(g, cx, cy, 2);
          g.fill();
        }
        return;
      }
      if (th.choco) {
        // carreau de tablette de chocolat
        for (let i = 0; i < 4; i++) {
          const x0 = 3 + (i % 2) * 21;
          const y0 = 3 + Math.floor(i / 2) * 21;
          const gr = g.createLinearGradient(x0, y0, x0 + 20, y0 + 20);
          gr.addColorStop(0, th.brickLight);
          gr.addColorStop(0.5, th.brick);
          gr.addColorStop(1, th.brickDark);
          g.fillStyle = gr;
          roundRectPath(g, x0, y0, 19, 19, 3);
          g.fill();
          g.fillStyle = th.brick;
          roundRectPath(g, x0 + 4, y0 + 4, 11, 11, 2);
          g.fill();
        }
        g.fillStyle = 'rgba(255,255,255,0.25)';
        roundRectPath(g, 5, 4, T - 10, 2.5, 1.2);
        g.fill();
        return;
      }
      const rows = 3;
      const bh = (T - 4) / rows;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? -T / 4 : 0;
        for (let c = -1; c < 3; c++) {
          const x0 = 2 + off + c * ((T - 4) / 2);
          const w = (T - 4) / 2 - 2;
          const xa = Math.max(2, x0);
          const xb = Math.min(T - 2, x0 + w);
          if (xb - xa < 3) continue;
          const y0 = 2 + r * bh;
          const gr = g.createLinearGradient(0, y0, 0, y0 + bh);
          gr.addColorStop(0, th.brickLight);
          gr.addColorStop(0.3, th.brick);
          gr.addColorStop(1, th.brick);
          g.fillStyle = gr;
          roundRectPath(g, xa, y0, xb - xa, bh - 2, 3);
          g.fill();
        }
      }
      if (th.glow) {
        g.strokeStyle = 'rgba(255,120,40,0.75)';
        g.lineWidth = 1.5;
        for (let r = 1; r < rows; r++) {
          g.beginPath();
          g.moveTo(3, 2 + r * bh - 1);
          g.lineTo(T - 3, 2 + r * bh - 1);
          g.stroke();
        }
      }
      g.fillStyle = 'rgba(255,255,255,0.3)';
      roundRectPath(g, 4, 3, T - 8, 3, 1.5);
      g.fill();
    });
  }

  // ---------- Bloc lutin (contient un bonus) ----------
  function lutinSprite() {
    return sprite('lutin', TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const T = TILE;
      g.translate(PAD, PAD);
      g.fillStyle = '#b8620e';
      roundRectPath(g, 0, 1, T, T, 9);
      g.fill();
      const gr = g.createLinearGradient(0, 0, 0, T);
      gr.addColorStop(0, '#ffe680');
      gr.addColorStop(0.45, '#ffc21f');
      gr.addColorStop(1, '#f39a0e');
      g.fillStyle = gr;
      roundRectPath(g, 0, 0, T, T - 2, 9);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = 2;
      roundRectPath(g, 3, 3, T - 6, T - 8, 7);
      g.stroke();
      g.fillStyle = 'rgba(160,80,0,0.35)';
      for (const [cx, cy] of [[7, 7], [T - 7, 7], [7, T - 9], [T - 7, T - 9]]) {
        circlePath(g, cx, cy + 0.7, 2.2);
        g.fill();
      }
      g.fillStyle = '#fff7d0';
      for (const [cx, cy] of [[7, 7], [T - 7, 7], [7, T - 9], [T - 7, T - 9]]) {
        circlePath(g, cx, cy, 1.8);
        g.fill();
      }
      Art.lutinFace(g, T / 2 - 1, T / 2 + 3, 1.05);
    });
  }

  // Une feuille : de (x, y) vers l'angle a, longue de 12 * s.
  function leaf(g, x, y, a, s, color) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.scale(s, s);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(5, -5.5, 12, 0);
    g.quadraticCurveTo(5, 5.5, 0, 0);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    g.strokeStyle = 'rgba(30,90,30,0.55)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(1, 0);
    g.lineTo(10, 0);
    g.stroke();
    g.restore();
  }

  // ---------- Plateformes traversables ----------
  // v : petite variante du dessin (pour les branches des Grands Arbres)
  function platformSprite(theme, l, r, v) {
    const key = THEMES[theme].branch ? `p:${theme}:${l | 0}${r | 0}:${v | 0}` : `p:${theme}:${l | 0}${r | 0}`;
    return sprite(key, TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const th = THEMES[theme];
      const T = TILE;
      g.translate(PAD, PAD);
      const x0 = l ? 2 : -1;
      const x1 = r ? T - 2 : T + 1;
      if (th.branch) {
        // une branche : du bois, de la mousse dessus, des feuilles qui pendent dessous
        const gr = g.createLinearGradient(0, 1, 0, 16);
        gr.addColorStop(0, th.platLight);
        gr.addColorStop(0.45, th.plat);
        gr.addColorStop(1, th.platDark);
        g.fillStyle = gr;
        cornerRect(g, x0, 1, x1 - x0, 15, l ? 7 : 0, r ? 7 : 0, r ? 7 : 0, l ? 7 : 0);
        g.fill();
        g.strokeStyle = 'rgba(60,30,10,0.4)';
        g.lineWidth = 1.3;
        g.lineCap = 'round';
        for (const [y, ph] of [[7, v], [11, v + 2]]) {
          g.beginPath();
          g.moveTo(x0 + 4, y);
          for (let x = x0 + 4; x <= x1 - 4; x += 4) g.lineTo(x, y + Math.sin(x * 0.3 + ph) * 0.9);
          g.stroke();
        }
        // la mousse sur le dessus
        g.fillStyle = '#5fbf45';
        g.beginPath();
        g.moveTo(x0 + (l ? 3 : 0), 4);
        for (let x = x0 + (l ? 3 : 0); x <= x1 - (r ? 3 : 0); x += 4) g.lineTo(x, 0.5 + Math.sin(x * 0.45 + v) * 1.2);
        g.lineTo(x1 - (r ? 3 : 0), 4);
        g.closePath();
        g.fill();
        g.fillStyle = 'rgba(200,255,160,0.55)';
        roundRectPath(g, x0 + 5, 0.5, x1 - x0 - 10, 1.5, 0.8);
        g.fill();
        // des feuilles qui pendent (et une petite pousse dessus)
        const cols = ['#4fb84a', '#6fd25a', '#3a9e3e'];
        const spots = [[[9, 1.9], [33, 1.25]], [[18, 1.6], [41, 2.1]], [[6, 1.35], [27, 1.8]]][v % 3];
        spots.forEach(([lx, a], i) => leaf(g, lx, 14, a, 1, cols[(i + v) % 3]));
        leaf(g, 22 + v * 6, 1, -1.2 - v * 0.3, 0.8, cols[(v + 1) % 3]);
        // au bout de la branche, une touffe de feuilles
        for (const [on, ex, dir] of [[l, x0, -1], [r, x1, 1]]) {
          if (!on) continue;
          leaf(g, ex, 6, dir > 0 ? -0.5 : Math.PI + 0.5, 1.1, cols[0]);
          leaf(g, ex, 9, dir > 0 ? 0.3 : Math.PI - 0.3, 1.2, cols[1]);
          leaf(g, ex - dir * 3, 12, dir > 0 ? 1.0 : Math.PI - 1.0, 1, cols[2]);
        }
        return;
      }
      if (th.root) {
        // des racines emmêlées (le terrier) : on grimpe dessus, et on passe à travers par en dessous
        // (deux vagues par case, toujours les mêmes : les racines se raccordent d'une case à l'autre)
        const f = (TAU * 2) / T;
        g.lineCap = 'round';
        for (const [y0, amp, lw, col, ph] of [[8, 2.6, 7.5, th.platDark, 0], [6, 2.2, 5, th.plat, 1.6], [9.5, 1.6, 2.6, th.platLight, 3.4]]) {
          g.strokeStyle = col;
          g.lineWidth = lw;
          g.beginPath();
          for (let x = x0; x <= x1 + 0.1; x += 3) {
            const y = y0 + Math.sin(x * f + ph) * amp;
            if (x === x0) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.stroke();
        }
        // des radicelles qui pendent dessous
        g.strokeStyle = th.platDark;
        g.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          const rx = 6 + hash(v * 3.3 + i * 1.7) * 36;
          g.beginPath();
          g.moveTo(rx, 11);
          g.quadraticCurveTo(rx + 3, 16, rx - 1, 20 + hash(i + v * 5) * 7);
          g.stroke();
        }
        return;
      }
      if (th.cloud) {
        g.fillStyle = th.platDark;
        for (let i = 0; i < 4; i++) {
          const cx = x0 + 6 + i * ((x1 - x0 - 12) / 3);
          circlePath(g, cx, 11, 9);
          g.fill();
        }
        g.fillStyle = th.plat;
        for (let i = 0; i < 4; i++) {
          const cx = x0 + 6 + i * ((x1 - x0 - 12) / 3);
          circlePath(g, cx, 8, 9);
          g.fill();
        }
        g.fillRect(x0 + 4, 4, x1 - x0 - 8, 10);
        g.fillStyle = th.platLight;
        roundRectPath(g, x0 + 6, 1, x1 - x0 - 12, 4, 2);
        g.fill();
        return;
      }
      if (th.log) {
        const gr = g.createLinearGradient(0, 0, 0, 18);
        gr.addColorStop(0, th.platLight);
        gr.addColorStop(1, th.platDark);
        g.fillStyle = gr;
        cornerRect(g, x0, 0, x1 - x0, 18, l ? 9 : 0, r ? 9 : 0, r ? 9 : 0, l ? 9 : 0);
        g.fill();
        g.strokeStyle = 'rgba(60,30,10,0.5)';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(x0 + 4, 8);
        g.lineTo(x1 - 4, 9);
        g.stroke();
        g.fillStyle = '#4fbf5a';
        g.beginPath();
        g.ellipse(T / 2 + hash(theme.length) * 10 - 5, 1, 12, 4, 0, 0, TAU);
        g.fill();
        if (l || r) {
          g.fillStyle = '#d8a46c';
          ellipsePath(g, l ? x0 + 4 : x1 - 4, 9, 4, 8);
          g.fill();
          g.strokeStyle = '#8a5a32';
          g.beginPath();
          g.ellipse(l ? x0 + 4 : x1 - 4, 9, 2, 4, 0, 0, TAU);
          g.stroke();
        }
        return;
      }
      if (th.candyCane) {
        // sucre d'orge rayé rose et blanc
        g.save();
        cornerRect(g, x0, 1, x1 - x0, 15, l ? 7.5 : 0, r ? 7.5 : 0, r ? 7.5 : 0, l ? 7.5 : 0);
        g.clip();
        g.fillStyle = '#ffffff';
        g.fillRect(x0, 0, x1 - x0, 18);
        g.fillStyle = '#ff4f8a';
        for (let sx = -16; sx < T + 16; sx += 14) {
          g.beginPath();
          g.moveTo(sx, 16);
          g.lineTo(sx + 6, 16);
          g.lineTo(sx + 14, 0);
          g.lineTo(sx + 8, 0);
          g.closePath();
          g.fill();
        }
        const sh = g.createLinearGradient(0, 1, 0, 16);
        sh.addColorStop(0, 'rgba(255,255,255,0.5)');
        sh.addColorStop(0.4, 'rgba(255,255,255,0)');
        sh.addColorStop(1, 'rgba(120,20,60,0.3)');
        g.fillStyle = sh;
        g.fillRect(x0, 0, x1 - x0, 18);
        g.restore();
        return;
      }
      if (th.ember) {
        g.fillStyle = th.platDark;
        cornerRect(g, x0, 0, x1 - x0, 16, l ? 6 : 0, r ? 6 : 0, r ? 6 : 0, l ? 6 : 0);
        g.fill();
        g.fillStyle = th.plat;
        cornerRect(g, x0, 0, x1 - x0, 10, l ? 6 : 0, r ? 6 : 0, 0, 0);
        g.fill();
        const gr = g.createLinearGradient(0, 16, 0, 26);
        gr.addColorStop(0, 'rgba(255,120,30,0.6)');
        gr.addColorStop(1, 'rgba(255,120,30,0)');
        g.fillStyle = gr;
        g.fillRect(x0, 16, x1 - x0, 10);
        return;
      }
      // coussin rayé (prairie) ou planche (montagne)
      const gr = g.createLinearGradient(0, 0, 0, 18);
      gr.addColorStop(0, th.platLight);
      gr.addColorStop(0.4, th.plat);
      gr.addColorStop(1, th.platDark);
      g.fillStyle = gr;
      cornerRect(g, x0, 0, x1 - x0, 17, l ? 8 : 0, r ? 8 : 0, r ? 8 : 0, l ? 8 : 0);
      g.fill();
      if (th.platDots) {
        g.fillStyle = th.platDots;
        for (let i = 0; i < 3; i++) {
          circlePath(g, 8 + i * 16, 8 + (i % 2) * 2, 2.6);
          g.fill();
        }
      } else {
        g.strokeStyle = th.platDark;
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(T / 2, 1);
        g.lineTo(T / 2, 16);
        g.stroke();
        g.fillStyle = '#3a2a1a';
        circlePath(g, 6, 8, 1.4);
        g.fill();
        circlePath(g, T - 6, 8, 1.4);
        g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,0.4)';
      roundRectPath(g, x0 + 4, 2, x1 - x0 - 8, 2.5, 1.2);
      g.fill();
    });
  }

  // ---------- Pont arc-en-ciel (on marche dessus, on le traverse par dessous) ----------
  const RAINBOW = ['#ff4f6a', '#ff9a3a', '#ffe14d', '#5fd44a', '#4fb8ff', '#8a6bff'];

  function rainbowSprite(l, r) {
    return sprite(`rb:${l | 0}${r | 0}`, TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const T = TILE;
      g.translate(PAD, PAD);
      const x0 = l ? 4 : -1;
      const x1 = r ? T - 4 : T + 1;
      g.save();
      cornerRect(g, x0, 0, x1 - x0, 18, l ? 6 : 0, r ? 6 : 0, r ? 6 : 0, l ? 6 : 0);
      g.clip();
      RAINBOW.forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(x0, i * 3, x1 - x0, 3.2);
      });
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillRect(x0, 0, x1 - x0, 1.6);
      g.restore();
      // petits nuages au bout du pont
      for (const [on, cx] of [[l, x0 + 2], [r, x1 - 2]]) {
        if (!on) continue;
        g.fillStyle = '#d9e4ff';
        circlePath(g, cx, 14, 8);
        g.fill();
        g.fillStyle = '#ffffff';
        circlePath(g, cx - 3, 10, 7);
        g.fill();
        circlePath(g, cx + 4, 12, 6);
        g.fill();
      }
    });
  }

  // ---------- Bloc qui fait rebondir : champignon (grotte) ou guimauve (bonbons) ----------
  function bounceSprite(theme) {
    return sprite(`m:${theme}`, TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const T = TILE;
      g.translate(PAD, PAD);
      if (theme === 'candy') {
        // gros coussin de guimauve rose et blanc
        const gr = g.createLinearGradient(0, 0, 0, T);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(0.5, '#ffe0f0');
        gr.addColorStop(1, '#f2b3d3');
        g.fillStyle = gr;
        roundRectPath(g, 1, 2, T - 2, T - 3, 16);
        g.fill();
        g.strokeStyle = '#e48ab8';
        g.lineWidth = 2;
        g.stroke();
        g.save();
        roundRectPath(g, 1, 2, T - 2, T - 3, 16);
        g.clip();
        g.fillStyle = 'rgba(255,120,180,0.45)';
        for (let sx = -30; sx < T + 10; sx += 18) {
          g.beginPath();
          g.moveTo(sx, T);
          g.lineTo(sx + 8, T);
          g.lineTo(sx + 32, 0);
          g.lineTo(sx + 24, 0);
          g.closePath();
          g.fill();
        }
        g.restore();
        g.fillStyle = 'rgba(255,255,255,0.85)';
        ellipsePath(g, 15, 9, 9, 3.5, -0.2);
        g.fill();
        return;
      }
      // champignon lumineux : gros chapeau à pois, pied blanc
      g.fillStyle = '#efe6d6';
      roundRectPath(g, T / 2 - 8, T * 0.45, 16, T * 0.55, 6);
      g.fill();
      g.strokeStyle = '#b7a68a';
      g.lineWidth = 1.5;
      g.stroke();
      const cap = g.createRadialGradient(T / 2 - 6, 8, 3, T / 2, 14, 28);
      cap.addColorStop(0, '#9ffcff');
      cap.addColorStop(0.5, '#36c9e8');
      cap.addColorStop(1, '#1a6fa8');
      g.fillStyle = cap;
      g.beginPath();
      g.moveTo(-2, T * 0.55);
      g.bezierCurveTo(-4, -4, T + 4, -4, T + 2, T * 0.55);
      g.quadraticCurveTo(T / 2, T * 0.42, -2, T * 0.55);
      g.closePath();
      g.fill();
      g.strokeStyle = '#124a7a';
      g.lineWidth = 1.6;
      g.stroke();
      g.fillStyle = '#ffffff';
      for (const [px, py, pr] of [[12, 13, 4.5], [27, 8, 5], [38, 17, 3.5], [21, 20, 3]]) {
        circlePath(g, px, py, pr);
        g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,0.6)';
      ellipsePath(g, 12, 5, 6, 2.5, -0.4);
      g.fill();
    });
  }

  // ---------- Ronces / branches à épines ----------
  function thornSprite(theme, down, v) {
    return sprite(`t:${theme}:${down | 0}:${v}`, TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const th = THEMES[theme];
      const T = TILE;
      g.translate(PAD, PAD);
      if (down) {
        g.translate(0, T);
        g.scale(1, -1);
      }
      g.lineCap = 'round';
      g.lineJoin = 'round';
      // grosses épines blanches (dessinées avant les branches pour qu'elles en sortent)
      const spikes = [];
      for (let i = 0; i < 6; i++) {
        const x = 4 + i * 8 + hash(v * 3 + i) * 2;
        const up = i % 2 === 0;
        spikes.push({ x, up, len: up ? 15 + hash(v + i) * 5 : 10, lean: (hash(v * 2 + i) - 0.5) * 8 });
      }
      spikes.forEach((sp) => {
        const yb = sp.up ? 30 : 40;
        g.fillStyle = th.thorn;
        g.strokeStyle = th.brambleDark;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(sp.x - 4.5, yb);
        g.lineTo(sp.x + sp.lean, sp.up ? yb - sp.len : yb + sp.len * 0.5);
        g.lineTo(sp.x + 4.5, yb);
        g.closePath();
        g.fill();
        g.stroke();
      });
      const branch = (y0, amp, ph, w, light) => {
        g.beginPath();
        g.moveTo(-4, y0);
        for (let x = 0; x <= T + 4; x += 4) g.lineTo(x, y0 + Math.sin(x / 8 + ph) * amp);
        g.lineWidth = w + 4;
        g.strokeStyle = th.brambleDark;
        g.stroke();
        g.lineWidth = w;
        g.strokeStyle = th.bramble;
        g.stroke();
        g.lineWidth = w * 0.3;
        g.strokeStyle = light;
        g.beginPath();
        g.moveTo(-4, y0 - w * 0.25);
        for (let x = 0; x <= T + 4; x += 4) g.lineTo(x, y0 - w * 0.25 + Math.sin(x / 8 + ph) * amp);
        g.stroke();
      };
      branch(40, 2.5, v, 9, 'rgba(255,255,255,0.22)');
      branch(32, 4, v + 2.5, 7, 'rgba(255,255,255,0.25)');
      g.fillStyle = theme === 'volcano' ? '#ff7a2a' : '#5cc94f';
      ellipsePath(g, 12 + hash(v) * 22, 27, 6, 3, -0.5);
      g.fill();
    });
  }

  // ---------- Lave ----------
  // Une flaque d'eau posée sur le sol, de x0 à x1 (y : le dessus du sol). Elle scintille un peu.
  function puddle(ctx, x0, x1, y, t) {
    const cx = (x0 + x1) / 2;
    const rx = (x1 - x0) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.bezierCurveTo(x0 + 4, y - 7, x1 - 4, y - 7, x1, y);
    ctx.bezierCurveTo(x1 - 6, y + 6, x0 + 6, y + 6, x0, y);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y - 6, 0, y + 5);
    g.addColorStop(0, '#bfeaff');
    g.addColorStop(0.5, '#6cc4f0');
    g.addColorStop(1, '#3a8ad0');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#2a6aa8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip();
    // les reflets qui bougent doucement
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < Math.max(1, Math.round(rx / 22)); i++) {
      const x = x0 + 10 + ((i * 37 + t * 10) % Math.max(10, rx * 2 - 24));
      ctx.moveTo(x, y - 3);
      ctx.lineTo(x + 7, y - 3.6);
    }
    ctx.stroke();
    // une petite onde de temps en temps
    const k = (t * 0.7) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx + Math.sin(t) * rx * 0.3, y, 3 + k * 14, 1 + k * 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawLavaRun(ctx, x0, x1, y, surface, bottom, t) {
    const g = ctx.createLinearGradient(0, y, 0, bottom);
    g.addColorStop(0, '#ffe24a');
    g.addColorStop(0.12, '#ff9a1a');
    g.addColorStop(0.5, '#f04a12');
    g.addColorStop(1, '#a8180a');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (surface) {
      const top = y + 10;
      ctx.moveTo(x0, bottom);
      for (let x = x0; x <= x1 + 0.1; x += 6) {
        ctx.lineTo(x, top + Math.sin(x * 0.07 + t * 3) * 3 + Math.sin(x * 0.13 - t * 2) * 2);
      }
      ctx.lineTo(x1, bottom);
    } else {
      ctx.rect(x0, y, x1 - x0, bottom - y);
    }
    ctx.fill();
    if (surface) {
      ctx.strokeStyle = 'rgba(255,250,200,0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = x0; x <= x1 + 0.1; x += 6) {
        const yy = y + 10 + Math.sin(x * 0.07 + t * 3) * 3 + Math.sin(x * 0.13 - t * 2) * 2;
        if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      // bulles
      for (let c = Math.floor(x0 / TILE); c < Math.ceil(x1 / TILE); c++) {
        const ph = (t * 0.7 + hash(c * 3.3)) % 1;
        if (ph < 0.5) {
          const bx = c * TILE + 8 + hash(c * 1.7) * 32;
          const r = 2 + ph * 8;
          ctx.strokeStyle = `rgba(255,240,150,${0.9 - ph * 1.6})`;
          ctx.lineWidth = 2;
          circlePath(ctx, bx, y + 14 - ph * 6, r);
          ctx.stroke();
        }
      }
      // lueur au-dessus
      const gl = ctx.createLinearGradient(0, y - 40, 0, y + 12);
      gl.addColorStop(0, 'rgba(255,140,40,0)');
      gl.addColorStop(1, 'rgba(255,140,40,0.35)');
      ctx.fillStyle = gl;
      ctx.fillRect(x0, y - 40, x1 - x0, 52);
    }
  }

  // ---------- Rivière de chocolat ----------
  function drawChocoRun(ctx, x0, x1, y, surface, bottom, t) {
    const g = ctx.createLinearGradient(0, y, 0, bottom);
    g.addColorStop(0, '#a8643a');
    g.addColorStop(0.15, '#7a4224');
    g.addColorStop(1, '#4a2410');
    ctx.fillStyle = g;
    const wave = (x) => y + 12 + Math.sin(x * 0.05 + t * 1.6) * 2.5 + Math.sin(x * 0.11 - t) * 1.5;
    ctx.beginPath();
    if (surface) {
      ctx.moveTo(x0, bottom);
      for (let x = x0; x <= x1 + 0.1; x += 6) ctx.lineTo(x, wave(x));
      ctx.lineTo(x1, bottom);
    } else {
      ctx.rect(x0, y, x1 - x0, bottom - y);
    }
    ctx.fill();
    if (!surface) return;
    // reflet brillant
    ctx.strokeStyle = 'rgba(255,220,180,0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = x0; x <= x1 + 0.1; x += 6) {
      if (x === x0) ctx.moveTo(x, wave(x) + 1); else ctx.lineTo(x, wave(x) + 1);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,220,0.35)';
    ctx.lineWidth = 2;
    for (let c = Math.floor(x0 / TILE); c < Math.ceil(x1 / TILE); c++) {
      const sx = c * TILE + 8 + hash(c * 2.3) * 20;
      const k = (t * 0.4 + hash(c)) % 1;
      ctx.beginPath();
      ctx.moveTo(sx + k * 10, wave(sx) + 8);
      ctx.lineTo(sx + 14 + k * 10, wave(sx) + 8);
      ctx.stroke();
    }
    // grosses bulles qui font « blop »
    for (let c = Math.floor(x0 / TILE); c < Math.ceil(x1 / TILE); c++) {
      const ph = (t * 0.45 + hash(c * 3.3)) % 1;
      if (ph < 0.35) {
        const bx = c * TILE + 10 + hash(c * 1.7) * 28;
        ctx.fillStyle = `rgba(150,85,50,${1 - ph * 2.5})`;
        ellipsePath(ctx, bx, wave(bx) + 2, 3 + ph * 14, 2 + ph * 8);
        ctx.fill();
      }
    }
  }

  // ---------- La rivière aux nénuphars ----------
  // Le fond de la rivière (derrière tout) : de l'eau bien bleue, des herbes qui ondulent, des galets,
  // et l'ombre de petits poissons qui passent. y : le haut de la case de la surface.
  function riverBed(ctx, x0, x1, y, bottom, t) {
    const s = y + 14;
    const g = ctx.createLinearGradient(0, s, 0, bottom);
    g.addColorStop(0, '#47a8dc');
    g.addColorStop(0.5, '#2c7cb6');
    g.addColorStop(1, '#1d5684');
    ctx.fillStyle = g;
    ctx.fillRect(x0, s - 3, x1 - x0, bottom - s + 3);
    ctx.lineCap = 'round';
    for (let c = Math.floor(x0 / TILE); c < Math.ceil(x1 / TILE); c++) {
      const h = hash(c * 2.7);
      const bx = c * TILE + 6 + h * 34;
      if (h < 0.65) {
        ctx.strokeStyle = h < 0.3 ? '#2f9a6a' : '#3aaa5a';
        ctx.lineWidth = 3;
        for (let k = 0; k < 2; k++) {
          const hh = 24 + hash(c * 5.1 + k) * 24;
          ctx.beginPath();
          ctx.moveTo(bx + k * 6, bottom);
          ctx.quadraticCurveTo(bx + k * 6 + Math.sin(t * 1.6 + c + k) * 6, bottom - hh * 0.6, bx + k * 6 + Math.sin(t * 1.6 + c + k + 1) * 5, bottom - hh);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#3e6a8a';
      ellipsePath(ctx, c * TILE + 30 - h * 20, bottom - 3, 6 + h * 4, 3.5);
      ctx.fill();
    }
    // des petits poissons qui passent (seulement leur ombre)
    ctx.fillStyle = 'rgba(15,50,90,0.35)';
    const n = Math.max(1, Math.round((x1 - x0) / 340));
    for (let i = 0; i < n; i++) {
      const span = x1 - x0 + 80;
      const dir = i % 2 ? -1 : 1;
      const k = (t * (30 + i * 7) + hash(i * 7.7 + x0) * span) % span;
      const fx = dir > 0 ? x0 - 40 + k : x1 + 40 - k;
      if (fx < x0 + 10 || fx > x1 - 10) continue;
      const fy = s + 26 + hash(i * 3.1 + x0) * Math.max(4, bottom - s - 44);
      ctx.beginPath();
      ctx.ellipse(fx, fy, 9, 4, 0, 0, TAU);
      ctx.moveTo(fx - dir * 7, fy);
      ctx.lineTo(fx - dir * 15, fy - 5 + Math.sin(t * 12 + i) * 1.5);
      ctx.lineTo(fx - dir * 15, fy + 5 + Math.sin(t * 12 + i) * 1.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  // L'eau de la rivière, par-dessus (un peu transparente) : la surface qui brille, et le courant
  // qui file vers la droite (petits traits, reflets, et une feuille qui flotte au fil de l'eau).
  function drawWaterRun(ctx, x0, x1, y, bottom, t) {
    const wave = (x) => y + 14 + Math.sin(x * 0.045 + t * 2.2) * 1.6 + Math.sin(x * 0.12 - t * 1.4) * 1;
    const w = x1 - x0;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, bottom);
    for (let x = x0; x <= x1 + 0.1; x += 6) ctx.lineTo(Math.min(x, x1), wave(Math.min(x, x1)));
    ctx.lineTo(x1, bottom);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y + 10, 0, bottom);
    g.addColorStop(0, 'rgba(160,230,255,0.6)');
    g.addColorStop(0.25, 'rgba(80,175,230,0.42)');
    g.addColorStop(1, 'rgba(30,95,165,0.55)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip();
    // le courant
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const [dy, sp, gap, len] of [[7, 46, 64, 16], [20, 34, 90, 22], [38, 24, 120, 14]]) {
      for (let i = 0; i * gap < w + gap; i++) {
        const x = x0 + ((i * gap + hash(i * 3.7 + dy) * 30 + t * sp) % (w + gap)) - gap / 2;
        const yy = wave(x) + dy + hash(i + dy) * 4;
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * 2 + i);
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.quadraticCurveTo(x + len / 2, yy - 2, x + len, yy);
        ctx.stroke();
      }
    }
    ctx.restore();
    // la ligne brillante de la surface, et des reflets qui scintillent
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let x = x0; x <= x1 + 0.1; x += 6) {
      const xx = Math.min(x, x1);
      if (x === x0) ctx.moveTo(xx, wave(xx)); else ctx.lineTo(xx, wave(xx));
    }
    ctx.stroke();
    for (let c = Math.floor(x0 / TILE); c < Math.ceil(x1 / TILE); c++) {
      const ph = (t * 0.8 + hash(c * 4.1)) % 1;
      if (ph > 0.4) continue;
      const sx = c * TILE + 10 + hash(c * 1.9) * 28;
      ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - ph / 0.4)})`;
      glint(ctx, sx, wave(sx) + 3, 3.5);
      ctx.fill();
    }
    // une feuille (ou un pétale) qui flotte au fil de l'eau
    const n = Math.max(1, Math.round(w / 420));
    for (let i = 0; i < n; i++) {
      const lx = x0 + ((t * 22 + hash(i * 9.1 + x0) * w) % w);
      if (lx > x1 - 14) continue;
      ctx.save();
      ctx.translate(lx, wave(lx) - 1);
      ctx.rotate(Math.sin(t * 1.5 + i) * 0.2);
      ctx.fillStyle = i % 2 ? '#ffb4d8' : '#7fd05a';
      ellipsePath(ctx, 0, 0, 7, 2.6);
      ctx.fill();
      ctx.restore();
    }
  }

  // Un petit reflet à 4 branches (sur l'eau).
  function glint(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath();
  }

  // Les roseaux et les quenouilles au bord de l'eau. x : le bord de la berge, y : le haut de la case,
  // side : 1 si l'eau est à droite (berge de gauche), -1 si elle est à gauche.
  // front : seulement les petites herbes de devant (dessinées par-dessus l'eau et Malice).
  function reeds(ctx, x, y, side, v, t, front) {
    ctx.save();
    ctx.lineCap = 'round';
    const blade = (bx, by, h, lean, col, lw) => {
      const sw = Math.sin(t * 1.6 + bx * 0.05) * 3;
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + lean * 0.4, by - h * 0.6, bx + lean + sw, by - h);
      ctx.stroke();
    };
    if (front) {
      // quelques brins devant, au ras de l'eau
      for (let i = 0; i < 4; i++) {
        const bx = x + side * (4 + i * 6 + hash(v * 9 + i) * 4);
        blade(bx, y + 26, 22 + hash(v + i) * 12, side * (4 + i * 2), i % 2 ? '#3fae45' : '#58c24e', 2.4);
      }
      ctx.restore();
      return;
    }
    // des quenouilles sur la berge (de longues tiges, et leur gros épi brun)
    for (let i = 0; i < 3; i++) {
      const bx = x - side * (6 + i * 11 + hash(v * 5 + i) * 6);
      const h = 44 + hash(v * 3 + i * 2) * 26;
      const sw = Math.sin(t * 1.6 + bx * 0.05) * 3;
      blade(bx, y + 4, h, side * 5, '#3f9a3a', 2.4);
      ctx.save();
      ctx.translate(bx + side * 5 + sw, y + 4 - h);
      ctx.rotate(side * 0.08);
      ctx.fillStyle = '#7a4a24';
      roundRectPath(ctx, -3.5, 2, 7, 18, 3.5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,180,0.3)';
      roundRectPath(ctx, -2, 4, 2, 12, 1);
      ctx.fill();
      ctx.restore();
      // les longues feuilles
      blade(bx + 2, y + 4, h * 0.7, side * 14, '#4fb84a', 2.2);
      blade(bx - 2, y + 4, h * 0.55, -side * 9, '#5fca52', 2);
    }
    // des roseaux qui sortent de l'eau, tout près du bord
    for (let i = 0; i < 3; i++) {
      const bx = x + side * (5 + i * 7 + hash(v * 11 + i) * 4);
      blade(bx, y + 40, 46 + hash(v * 7 + i) * 20, side * (3 + i * 3), i % 2 ? '#2f9a3e' : '#48b84a', 2.6);
    }
    ctx.restore();
  }

  // ---------- Le terrier secret ----------
  // Une case de galerie : des taches de terre, des cailloux, des racines qui pendent du plafond,
  // et par terre, de l'herbe pâle ou une carotte cachée par les lapins.
  function burrowCell(ctx, x, y, v, t, o) {
    const T = TILE;
    if (v < 0.55) {
      ctx.fillStyle = 'rgba(25,12,4,0.2)';
      ellipsePath(ctx, x + 10 + v * 50, y + 12 + hash(v * 7) * 24, 9 + v * 8, 5 + v * 4);
      ctx.fill();
    }
    if (v > 0.72) {
      ctx.fillStyle = '#7a5434';
      ellipsePath(ctx, x + 8 + hash(v * 3) * 32, y + 16 + hash(v * 5) * 20, 3.5, 2.6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,170,0.25)';
      ellipsePath(ctx, x + 7 + hash(v * 3) * 32, y + 15 + hash(v * 5) * 20, 1.6, 1);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    if (o.ceil && v < 0.8) {
      // des racines qui pendent (elles bougent à peine)
      for (let i = 0; i < (v < 0.35 ? 2 : 1); i++) {
        const rx = x + 8 + hash(v * 13 + i) * 32;
        const len = 16 + hash(v * 17 + i) * 22;
        const sw = Math.sin(t * 0.9 + v * 20 + i) * 2;
        ctx.strokeStyle = '#b8844e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rx, y - 2);
        ctx.quadraticCurveTo(rx + 4, y + len * 0.5, rx + sw, y + len);
        ctx.stroke();
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(rx + 2, y + len * 0.45);
        ctx.quadraticCurveTo(rx + 8, y + len * 0.55, rx + 9 + sw, y + len * 0.8);
        ctx.stroke();
      }
    }
    if (o.floor) {
      const fy = y + T;
      if (v < 0.22) {
        // une carotte cachée par les lapins (on ne voit que le haut et les fanes)
        const cx = x + 14 + v * 60;
        ctx.fillStyle = '#ff8a2a';
        ctx.beginPath();
        ctx.moveTo(cx - 5, fy + 2);
        ctx.lineTo(cx + 5, fy + 2);
        ctx.lineTo(cx + 3, fy - 8);
        ctx.lineTo(cx - 3, fy - 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4fbf4a';
        ctx.lineWidth = 2;
        for (const a of [-0.5, 0, 0.5]) {
          ctx.beginPath();
          ctx.moveTo(cx, fy - 8);
          ctx.lineTo(cx + Math.sin(a + Math.sin(t * 2 + v) * 0.1) * 10, fy - 8 - Math.cos(a) * 10);
          ctx.stroke();
        }
      } else if (v > 0.6) {
        // de l'herbe toute pâle
        ctx.strokeStyle = '#a8b878';
        ctx.lineWidth = 1.6;
        const gx = x + 10 + hash(v * 9) * 28;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(gx + k * 3, fy);
          ctx.quadraticCurveTo(gx + k * 4, fy - 6, gx + k * 5 + Math.sin(t + k) * 1.5, fy - 9 + Math.abs(k));
          ctx.stroke();
        }
      }
    }
    if (o.surface) {
      // juste sous l'herbe : la terre est plus claire
      const g = ctx.createLinearGradient(0, y, 0, y + T);
      g.addColorStop(0, 'rgba(160,110,60,0.5)');
      g.addColorStop(1, 'rgba(160,110,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, T, T);
    }
  }

  // La lumière du jour qui tombe par un trou, avec des poussières qui flottent dedans.
  function burrowSunbeam(ctx, x, top, bottom, t) {
    const T = TILE;
    ctx.save();
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, 'rgba(255,245,200,0.38)');
    g.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 4, top);
    ctx.lineTo(x + T - 4, top);
    ctx.lineTo(x + T + 22, bottom);
    ctx.lineTo(x - 22, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,250,220,0.7)';
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.08 + hash(i * 3.3 + x)) % 1;
      const px = x + 8 + hash(i * 1.7 + x) * (T - 16) + Math.sin(t + i) * 6;
      circlePath(ctx, px, top + k * (bottom - top) * 0.7, 1.4);
      ctx.fill();
    }
    ctx.restore();
  }

  // Des champignons qui brillent tout doucement, posés par terre (x, y : le sol).
  // (le halo et les champignons sont dessinés une fois pour toutes, puis recopiés : c'est bien plus rapide)
  function burrowLantern(ctx, x, y, v, t) {
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.7 + v * 10);
    const glow = sprite('lanterne-halo', 160, 160, (g) => {
      const gl = g.createRadialGradient(80, 80, 2, 80, 80, 80);
      gl.addColorStop(0, 'rgba(255,210,120,0.3)');
      gl.addColorStop(1, 'rgba(255,210,120,0)');
      g.fillStyle = gl;
      g.fillRect(0, 0, 160, 160);
    });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= pulse;
    ctx.drawImage(glow, x - 80, y - 94, 160, 160);
    ctx.restore();
    const k = Math.floor(v * 3) % 3;
    const img = sprite('lanterne:' + k, 40, 20, (g) => {
      const cols = [['#ffe27a', '#ffb43a'], ['#ffb0d8', '#ff7ab8'], ['#a8f0ff', '#5ad0f0']][k];
      g.translate(16, 18);
      for (const [dx, sc] of [[-7, 0.8], [3, 1.1], [11, 0.65]]) {
        g.fillStyle = '#fff0dc';
        roundRectPath(g, dx - 1.8 * sc, -10 * sc, 3.6 * sc, 10 * sc, 1.5);
        g.fill();
        const cg = g.createRadialGradient(dx, -11 * sc, 1, dx, -10 * sc, 8 * sc);
        cg.addColorStop(0, '#ffffff');
        cg.addColorStop(0.4, cols[0]);
        cg.addColorStop(1, cols[1]);
        g.fillStyle = cg;
        g.beginPath();
        g.ellipse(dx, -10 * sc, 7.5 * sc, 5.5 * sc, 0, Math.PI, 0);
        g.closePath();
        g.fill();
      }
    });
    ctx.drawImage(img, x - 16, y - 18, 40, 20);
  }

  // ---------- Arrière-plans ----------
  function hillPath(ctx, off, baseY, amp, f, seed, step) {
    ctx.beginPath();
    ctx.moveTo(-10, VIEW_H + 10);
    for (let sx = -10; sx <= VIEW_W + 30; sx += step || 20) {
      const wx = sx + off;
      const y = baseY - amp * (0.55 * Math.sin(wx * f + seed) + 0.3 * Math.sin(wx * f * 2.3 + seed * 1.7) + 0.15 * Math.sin(wx * f * 5.1 + seed * 2.9));
      ctx.lineTo(sx, y);
    }
    ctx.lineTo(VIEW_W + 30, VIEW_H + 10);
    ctx.closePath();
  }

  // La hauteur d'une colline de hillPath à l'écran (en sx).
  function hillY(off, sx, baseY, amp, f, seed) {
    const wx = sx + off;
    return baseY - amp * (0.55 * Math.sin(wx * f + seed) + 0.3 * Math.sin(wx * f * 2.3 + seed * 1.7) + 0.15 * Math.sin(wx * f * 5.1 + seed * 2.9));
  }

  function forEachItem(off, spacing, seed, fn) {
    const i0 = Math.floor((off - spacing * 2) / spacing);
    const i1 = Math.ceil((off + VIEW_W + spacing * 2) / spacing);
    for (let i = i0; i <= i1; i++) {
      const x = i * spacing + hash(i * 1.37 + seed) * spacing * 0.6 - off;
      fn(x, i, hash(i * 2.71 + seed * 3.1));
    }
  }

  function fluffyCloud(ctx, x, y, s, light, shade) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = shade;
    const puffs = [[-30, 6, 18], [-12, -4, 24], [12, -8, 26], [34, 4, 18], [0, 8, 22]];
    puffs.forEach(([px, py, r]) => { circlePath(ctx, px, py + 5, r); ctx.fill(); });
    ctx.fillStyle = light;
    puffs.forEach(([px, py, r]) => { circlePath(ctx, px, py, r); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circlePath(ctx, -14, -12, 8);
    ctx.fill();
    ctx.restore();
  }

  function sky(ctx, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  function stripedFill(ctx, color, stripe, off, w) {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = stripe;
    const sw = w || 26;
    const start = -((off % (sw * 2)) + sw * 2);
    for (let x = start; x < VIEW_W + VIEW_H; x += sw * 2) {
      ctx.beginPath();
      ctx.moveTo(x, VIEW_H);
      ctx.lineTo(x + sw, VIEW_H);
      ctx.lineTo(x + sw + VIEW_H * 0.5, 0);
      ctx.lineTo(x + VIEW_H * 0.5, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function roundTree(ctx, x, y, h, trunk, leaf, leafDark) {
    ctx.fillStyle = trunk;
    roundRectPath(ctx, x - 4, y - h * 0.55, 8, h * 0.55, 3);
    ctx.fill();
    ctx.fillStyle = leafDark;
    circlePath(ctx, x, y - h * 0.7 + 4, h * 0.32);
    ctx.fill();
    ctx.fillStyle = leaf;
    circlePath(ctx, x, y - h * 0.7, h * 0.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    circlePath(ctx, x - h * 0.1, y - h * 0.8, h * 0.1);
    ctx.fill();
  }

  // Un saule pleureur au loin : un tronc, et de longues branches qui pendent et se balancent.
  function willow(ctx, x, y, h, v, t) {
    ctx.fillStyle = '#8a6a48';
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.quadraticCurveTo(x - 2, y - h * 0.4, x - 6, y - h * 0.7);
    ctx.lineTo(x + 4, y - h * 0.7);
    ctx.quadraticCurveTo(x + 2, y - h * 0.4, x + 6, y);
    ctx.closePath();
    ctx.fill();
    const top = y - h * 0.82;
    const r = h * 0.42;
    ctx.fillStyle = '#6fbf5a';
    ellipsePath(ctx, x, top, r, r * 0.55);
    ctx.fill();
    ctx.strokeStyle = '#7fcf62';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i <= 8; i++) {
      const bx = x - r * 0.95 + (i / 8) * r * 1.9;
      const len = h * (0.45 + hash(v * 7 + i) * 0.25) * (1 - Math.abs(i / 8 - 0.5) * 0.6);
      const sw = Math.sin(t * 1.2 + i + v * 5) * 4;
      ctx.beginPath();
      ctx.moveTo(bx, top - r * 0.2);
      ctx.quadraticCurveTo(bx + (bx - x) * 0.15, top + len * 0.5, bx + (bx - x) * 0.1 + sw, top + len);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ellipsePath(ctx, x - r * 0.3, top - r * 0.2, r * 0.4, r * 0.18);
    ctx.fill();
  }

  // ---------- Feuillage en haut d'un tronc (les Grands Arbres) ----------
  // Une grosse touffe de feuilles autour du haut du tronc (x, y), large de w (le tronc), qui bouge un peu.
  function crown(ctx, x, y, w, v, t) {
    const R = 46 + w * 0.32;
    const puffs = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + v * 3;
      const d = R * (0.55 + hash(v * 7 + i) * 0.25);
      puffs.push([Math.cos(a) * d * 1.3, Math.sin(a) * d * 0.7, R * (0.42 + hash(v * 3 + i * 2) * 0.18)]);
    }
    puffs.push([0, 0, R * 0.72]);
    ctx.save();
    ctx.translate(x + Math.sin(t * 0.9 + v * 10) * 2.5, y - R * 0.3);
    ctx.fillStyle = '#2a8a3c';
    puffs.forEach(([px, py, r]) => { circlePath(ctx, px, py + 8, r); ctx.fill(); });
    ctx.fillStyle = '#44b64d';
    puffs.forEach(([px, py, r]) => { circlePath(ctx, px, py, r); ctx.fill(); });
    ctx.fillStyle = '#6ccf58';
    puffs.forEach(([px, py, r]) => {
      if (py > R * 0.15) return;
      circlePath(ctx, px - r * 0.2, py - r * 0.28, r * 0.58);
      ctx.fill();
    });
    // des petites feuilles qui dépassent, et quelques fleurs
    for (let i = 0; i < 16; i++) {
      const a = hash(v * 5 + i * 1.3) * TAU;
      const d = R * (0.5 + hash(v * 9 + i) * 0.55);
      const lx = Math.cos(a) * d * 1.3;
      const ly = Math.sin(a) * d * 0.72;
      leaf(ctx, lx, ly, a + Math.sin(t * 1.7 + i) * 0.15, 0.9, i % 3 ? '#8fe26a' : '#2f9a46');
    }
    if (v < 0.65) {
      for (let i = 0; i < 6; i++) {
        const a = hash(v * 13 + i * 2.1) * TAU;
        const d = R * (0.2 + hash(v * 17 + i) * 0.6);
        const fx = Math.cos(a) * d * 1.2;
        const fy = Math.sin(a) * d * 0.6;
        ctx.fillStyle = v < 0.3 ? '#ffd0e6' : '#ffffff';
        for (let k = 0; k < 5; k++) {
          circlePath(ctx, fx + Math.cos((k / 5) * TAU) * 3, fy + Math.sin((k / 5) * TAU) * 3, 2.6);
          ctx.fill();
        }
        ctx.fillStyle = '#ffc21f';
        circlePath(ctx, fx, fy, 1.8);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Le ciel de la prairie : soleil, nuages et montagnes au loin (aussi derrière la rivière).
  function meadowSky(ctx, cx, cy, t) {
    sky(ctx, [[0, '#45b4ff'], [0.55, '#9fdcff'], [1, '#e6f8ff']]);
    // soleil
    ctx.save();
    ctx.translate(820, 90 - cy * 0.05);
    ctx.rotate(t * 0.15);
    ctx.fillStyle = 'rgba(255,250,200,0.35)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, 110);
      ctx.lineTo(12, 110);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const sg = ctx.createRadialGradient(820, 90 - cy * 0.05, 10, 820, 90 - cy * 0.05, 52);
    sg.addColorStop(0, '#fffde0');
    sg.addColorStop(0.6, '#ffe45c');
    sg.addColorStop(1, 'rgba(255,220,80,0)');
    ctx.fillStyle = sg;
    circlePath(ctx, 820, 90 - cy * 0.05, 52);
    ctx.fill();
    forEachItem(cx * 0.06 - t * 8, 340, 1, (x, i, h) => fluffyCloud(ctx, x, 60 + h * 110 - cy * 0.05, 0.8 + h * 0.6, '#ffffff', '#cfe6ff'));
    // montagnes lointaines
    const off1 = cx * 0.12;
    forEachItem(off1, 260, 7, (x, i, h) => {
      const mh = 150 + h * 110;
      const by = 400 - cy * 0.1;
      ctx.fillStyle = '#9fb7ff';
      ctx.beginPath();
      ctx.moveTo(x - mh * 0.9, by);
      ctx.quadraticCurveTo(x - 20, by - mh * 1.1, x, by - mh);
      ctx.quadraticCurveTo(x + 20, by - mh * 1.1, x + mh * 0.9, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - mh * 0.28, by - mh * 0.68);
      ctx.quadraticCurveTo(x, by - mh * 1.06, x + mh * 0.28, by - mh * 0.68);
      ctx.quadraticCurveTo(x + 10, by - mh * 0.6, x, by - mh * 0.66);
      ctx.quadraticCurveTo(x - 10, by - mh * 0.6, x - mh * 0.28, by - mh * 0.68);
      ctx.fill();
    });
  }

  const BG = {
    // tout là-haut dans les arbres : le ciel, des nuages sous nos pieds, d'autres grands arbres au loin,
    // les cimes juste en dessous, et la prairie tout en bas
    treetops(ctx, cx, cy, t) {
      sky(ctx, [[0, '#3fb0ff'], [0.55, '#a4e0ff'], [0.85, '#dcf4ff'], [1, '#effbff']]);
      const sy = 62 - cy * 0.05;
      const sg = ctx.createRadialGradient(760, sy, 8, 760, sy, 50);
      sg.addColorStop(0, '#fffde0');
      sg.addColorStop(0.6, '#ffe45c');
      sg.addColorStop(1, 'rgba(255,220,80,0)');
      ctx.fillStyle = sg;
      circlePath(ctx, 760, sy, 50);
      ctx.fill();
      forEachItem(cx * 0.05 - t * 6, 380, 2, (x, i, h) => fluffyCloud(ctx, x, 50 + h * 90 - cy * 0.05, 0.7 + h * 0.5, '#ffffff', '#d6ecff'));
      // la prairie, tout en bas, au loin
      const off0 = cx * 0.08;
      const py = 470 - cy * 0.1;
      hillPath(ctx, off0, py, 16, 0.005, 2.1);
      stripedFill(ctx, '#b4e6a0', 'rgba(255,255,255,0.18)', off0, 18);
      forEachItem(off0, 60, 31, (x, i, h) => {
        const cols = ['#ff9fd0', '#fff07a', '#ffffff', '#ffc08a'];
        ctx.fillStyle = cols[i & 3];
        circlePath(ctx, x, py + 18 + h * 50, 1.8);
        ctx.fill();
        if (h < 0.35) roundTree(ctx, x + 20, py + 26 + h * 40, 18 + h * 12, '#b9a07a', '#8fd08a', '#76b878');
      });
      // une petite brume : c'est loin
      const hz = ctx.createLinearGradient(0, py - 40, 0, py + 60);
      hz.addColorStop(0, 'rgba(235,250,255,0)');
      hz.addColorStop(1, 'rgba(235,250,255,0.45)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, py - 40, VIEW_W, VIEW_H - py + 40);
      // d'autres grands arbres, au loin
      const off1 = cx * 0.22;
      forEachItem(off1, 260, 21, (x, i, h) => {
        const top = 70 + h * 130 - cy * 0.22;
        const tw = 22 + h * 12;
        ctx.fillStyle = '#a7bfae';
        ctx.fillRect(x - tw / 2, top, tw, VIEW_H - top);
        ctx.fillStyle = '#9fceaa';
        for (const [dx, dy, r] of [[-40, 10, 42], [38, 4, 46], [0, -22, 52], [-14, 26, 40], [20, 28, 38]]) {
          circlePath(ctx, x + dx * (0.8 + h * 0.4), top + dy, r * (0.8 + h * 0.4));
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        circlePath(ctx, x - 14, top - 30, 24);
        ctx.fill();
      });
      // des nuages sous nos pieds
      forEachItem(cx * 0.3 - t * 10, 420, 9, (x, i, h) => {
        if (h < 0.5) fluffyCloud(ctx, x, 400 + h * 60 - cy * 0.3, 0.9 + h * 0.5, 'rgba(255,255,255,0.9)', 'rgba(214,236,255,0.9)');
      });
      // les cimes des arbres, juste en dessous (avec des trous : on voit la prairie)
      const off2 = cx * 0.5;
      forEachItem(off2, 170, 23, (x, i, h) => {
        if (h < 0.3) return;
        const by = 545 - cy * 0.45 + h * 20;
        const s = 0.8 + h * 0.5;
        for (const [col, dy] of [['#2f9a46', 8], ['#4fbf5a', 0]]) {
          ctx.fillStyle = col;
          for (const [dx, ey, r] of [[-50, 10, 40], [-15, -12, 50], [30, -4, 46], [62, 14, 36]]) {
            circlePath(ctx, x + dx * s, by + ey * s + dy, r * s);
            ctx.fill();
          }
        }
        ctx.fillStyle = 'rgba(160,240,130,0.6)';
        circlePath(ctx, x - 22 * s, by - 30 * s, 20 * s);
        ctx.fill();
      });
    },

    // la rivière aux nénuphars : le ciel de la prairie, des collines avec des saules pleureurs,
    // la rivière qui serpente au loin, et des roseaux tout près
    river(ctx, cx, cy, t) {
      meadowSky(ctx, cx, cy, t);
      const off2 = cx * 0.3;
      const base = 400 - cy * 0.2;
      hillPath(ctx, off2, base, 55, 0.006, 2.2);
      stripedFill(ctx, '#86de62', 'rgba(255,255,255,0.12)', off2);
      // la rivière au loin, qui serpente au pied des collines
      const ry = (sx) => base + 44 + Math.sin((sx + off2) * 0.004) * 16;
      ctx.fillStyle = '#86d4f6';
      ctx.beginPath();
      for (let sx = -10; sx <= VIEW_W + 30; sx += 20) ctx.lineTo(sx, ry(sx));
      for (let sx = VIEW_W + 30; sx >= -10; sx -= 20) ctx.lineTo(sx, ry(sx) + 12 + Math.sin((sx + off2) * 0.009) * 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      forEachItem(off2 - t * 12, 90, 17, (x, i, h) => {
        ctx.beginPath();
        ctx.moveTo(x, ry(x) + 4 + h * 5);
        ctx.lineTo(x + 14, ry(x + 14) + 4 + h * 5);
        ctx.stroke();
      });
      forEachItem(off2, 190, 11, (x, i, h) => {
        if (h < 0.55) willow(ctx, x, hillY(off2, x, base, 55, 0.006, 2.2) + 6, 70 + h * 40, h, t);
      });
      // tout près : des buissons, des roseaux et des quenouilles
      const off3 = cx * 0.55;
      const nb = 470 - cy * 0.45;
      hillPath(ctx, off3, nb, 26, 0.012, 1.7);
      ctx.fillStyle = '#3fb34a';
      ctx.fill();
      forEachItem(off3, 44, 13, (x, i, h) => {
        const by = hillY(off3, x, nb, 26, 0.012, 1.7) + 8;
        if (h < 0.45) {
          ctx.strokeStyle = '#2f9a3e';
          ctx.lineWidth = 2;
          for (const [dx, hh] of [[-4, 30], [0, 40], [5, 26]]) {
            ctx.beginPath();
            ctx.moveTo(x + dx, by);
            ctx.quadraticCurveTo(x + dx + 2, by - hh * 0.6, x + dx + Math.sin(t * 1.5 + i + dx) * 3, by - hh);
            ctx.stroke();
          }
          ctx.fillStyle = '#8a5a2e';
          roundRectPath(ctx, x - 2.5 + Math.sin(t * 1.5 + i) * 3, by - 44, 5, 13, 2.5);
          ctx.fill();
        } else {
          const cols = ['#7fc8ff', '#ffffff', '#ffd21f', '#ff8fc8'];
          ctx.fillStyle = cols[i & 3];
          circlePath(ctx, x, by - 2, 3.2);
          ctx.fill();
        }
      });
    },

    meadow(ctx, cx, cy, t) {
      meadowSky(ctx, cx, cy, t);
      // collines rayées
      const off2 = cx * 0.3;
      hillPath(ctx, off2, 400 - cy * 0.2, 60, 0.006, 1.3);
      stripedFill(ctx, '#7fdc5a', 'rgba(255,255,255,0.12)', off2);
      forEachItem(off2, 150, 3, (x, i, h) => {
        const wx = x + off2;
        const hy = 400 - cy * 0.2 - 60 * (0.55 * Math.sin(wx * 0.006 + 1.3) + 0.3 * Math.sin(wx * 0.006 * 2.3 + 1.3 * 1.7) + 0.15 * Math.sin(wx * 0.006 * 5.1 + 1.3 * 2.9));
        if (h < 0.6) roundTree(ctx, x, hy + 4, 60 + h * 40, '#9a6a3a', h < 0.3 ? '#ffb4d8' : '#4fcf5a', h < 0.3 ? '#e57fb0' : '#2fa34a');
      });
      // buissons proches
      const off3 = cx * 0.55;
      hillPath(ctx, off3, 470 - cy * 0.45, 30, 0.012, 4.2);
      ctx.fillStyle = '#3fb34a';
      ctx.fill();
      forEachItem(off3, 70, 5, (x, i, h) => {
        const wx = x + off3;
        const by = 470 - cy * 0.45 - 30 * (0.55 * Math.sin(wx * 0.012 + 4.2) + 0.3 * Math.sin(wx * 0.012 * 2.3 + 4.2 * 1.7) + 0.15 * Math.sin(wx * 0.012 * 5.1 + 4.2 * 2.9));
        const cols = ['#ff5fa8', '#ffd21f', '#ffffff', '#ff8a3a'];
        ctx.fillStyle = cols[i & 3];
        circlePath(ctx, x, by + 6, 3.5);
        ctx.fill();
      });
    },

    forest(ctx, cx, cy, t) {
      sky(ctx, [[0, '#7fd6c0'], [0.5, '#c8efc8'], [1, '#effbd8']]);
      // rayons de lumière
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#fffbd0';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 260 - cx * 0.1) % 1300 + 1300) % 1300 - 150;
        ctx.beginPath();
        ctx.moveTo(x, -10);
        ctx.lineTo(x + 70, -10);
        ctx.lineTo(x + 320, VIEW_H);
        ctx.lineTo(x + 200, VIEW_H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      const off1 = cx * 0.12;
      forEachItem(off1, 90, 11, (x, i, h) => {
        const by = 420 - cy * 0.1;
        const r = 50 + h * 40;
        ctx.fillStyle = '#8cc9a8';
        circlePath(ctx, x, by - r, r);
        ctx.fill();
        ctx.fillRect(x - 6, by - r, 12, r + 200);
      });
      ctx.fillStyle = '#8cc9a8';
      ctx.fillRect(0, 410 - cy * 0.1, VIEW_W, 200);
      const off2 = cx * 0.32;
      forEachItem(off2, 150, 13, (x, i, h) => {
        const by = 470 - cy * 0.25;
        const th = 220 + h * 120;
        ctx.fillStyle = '#5a7a5a';
        roundRectPath(ctx, x - 12, by - th, 24, th + 100, 8);
        ctx.fill();
        ctx.fillStyle = '#3f8f5a';
        circlePath(ctx, x - 30, by - th + 10, 50);
        ctx.fill();
        circlePath(ctx, x + 30, by - th - 5, 55);
        ctx.fill();
        ctx.fillStyle = '#4fa86a';
        circlePath(ctx, x, by - th - 30, 50);
        ctx.fill();
      });
      ctx.fillStyle = '#4a8a5a';
      ctx.fillRect(0, 460 - cy * 0.25, VIEW_W, 200);
      // lianes
      const off3 = cx * 0.6;
      forEachItem(off3, 120, 17, (x, i, h) => {
        if (h > 0.6) return;
        const len = 60 + h * 140;
        ctx.strokeStyle = '#2f7a3f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, -5);
        ctx.quadraticCurveTo(x + Math.sin(t + i) * 10, len / 2, x + Math.sin(t * 0.8 + i) * 6, len);
        ctx.stroke();
        ctx.fillStyle = '#45b35a';
        for (let k = 1; k < 5; k++) {
          ellipsePath(ctx, x + Math.sin(t * 0.8 + i) * 6 * (k / 5) + (k % 2 ? 6 : -6), (len * k) / 5, 7, 3.5, k % 2 ? 0.5 : -0.5);
          ctx.fill();
        }
      });
      // lucioles
      for (let i = 0; i < 18; i++) {
        const x = (hash(i) * VIEW_W + Math.sin(t * 0.5 + i) * 40 - cx * 0.4 % VIEW_W + VIEW_W * 2) % VIEW_W;
        const y = 120 + hash(i + 9) * 340 + Math.sin(t + i * 2) * 20;
        const a = 0.4 + 0.4 * Math.sin(t * 3 + i);
        ctx.fillStyle = `rgba(255,255,170,${a})`;
        circlePath(ctx, x, y, 2.5);
        ctx.fill();
      }
    },

    storm(ctx, cx, cy, t, flash) {
      sky(ctx, [[0, '#3d2a6b'], [0.55, '#8e6bb8'], [1, '#e6b3d6']]);
      const off1 = cx * 0.08;
      forEachItem(off1, 300, 21, (x, i, h) => {
        const by = 400 - cy * 0.08;
        const mh = 120 + h * 120;
        ctx.fillStyle = '#6a5596';
        ctx.beginPath();
        ctx.moveTo(x - 140, by);
        ctx.lineTo(x - 90, by - mh);
        ctx.quadraticCurveTo(x, by - mh - 20, x + 90, by - mh);
        ctx.lineTo(x + 140, by);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8a74b8';
        ctx.fillRect(x - 90, by - mh, 180, 10);
      });
      // collines en chocolat avec de la crème
      const off2 = cx * 0.3;
      hillPath(ctx, off2, 420 - cy * 0.2, 55, 0.007, 2.1);
      stripedFill(ctx, '#7a4428', 'rgba(255,255,255,0.07)', off2, 30);
      ctx.save();
      hillPath(ctx, off2, 420 - cy * 0.2, 55, 0.007, 2.1);
      ctx.clip();
      ctx.strokeStyle = '#fff2f8';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let sx = -10; sx <= VIEW_W + 20; sx += 20) {
        const wx = sx + off2;
        const y = 420 - cy * 0.2 - 55 * (0.55 * Math.sin(wx * 0.007 + 2.1) + 0.3 * Math.sin(wx * 0.007 * 2.3 + 2.1 * 1.7) + 0.15 * Math.sin(wx * 0.007 * 5.1 + 2.1 * 2.9));
        if (sx === -10) ctx.moveTo(sx, y + 4); else ctx.lineTo(sx, y + 4 + Math.sin(wx * 0.05) * 3);
      }
      ctx.stroke();
      ctx.restore();
      forEachItem(cx * 0.1 - t * 15, 380, 23, (x, i, h) => fluffyCloud(ctx, x, 70 + h * 80 - cy * 0.05, 0.9 + h * 0.5, '#a58cc9', '#7c64a8'));
      const off3 = cx * 0.55;
      hillPath(ctx, off3, 480 - cy * 0.45, 25, 0.014, 0.7);
      ctx.fillStyle = '#c785b0';
      ctx.fill();
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.5})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    },

    mountain(ctx, cx, cy, t) {
      sky(ctx, [[0, '#ff7a6b'], [0.45, '#ffb07a'], [1, '#ffe6b0']]);
      // grand volcan au loin
      const vx = 640 - (cx * 0.04) % 2000;
      const vy = 430 - cy * 0.05;
      ctx.fillStyle = '#8a4a5a';
      ctx.beginPath();
      ctx.moveTo(vx - 380, vy);
      ctx.lineTo(vx - 70, vy - 290);
      ctx.quadraticCurveTo(vx, vy - 300, vx + 70, vy - 290);
      ctx.lineTo(vx + 380, vy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff6a2a';
      ctx.beginPath();
      ctx.moveTo(vx - 70, vy - 290);
      ctx.quadraticCurveTo(vx - 50, vy - 240, vx - 30, vy - 220);
      ctx.lineTo(vx - 20, vy - 285);
      ctx.closePath();
      ctx.fill();
      const cg = ctx.createRadialGradient(vx, vy - 295, 5, vx, vy - 295, 120);
      cg.addColorStop(0, 'rgba(255,170,60,0.8)');
      cg.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = cg;
      circlePath(ctx, vx, vy - 295, 120);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.12 + i / 6) % 1;
        ctx.fillStyle = `rgba(110,80,90,${0.5 * (1 - ph)})`;
        circlePath(ctx, vx + Math.sin(i * 2 + t * 0.3) * 30 + ph * 80, vy - 310 - ph * 220, 30 + ph * 50);
        ctx.fill();
      }
      const off2 = cx * 0.25;
      hillPath(ctx, off2, 410 - cy * 0.2, 70, 0.005, 0.4, 30);
      stripedFill(ctx, '#b0707a', 'rgba(255,255,255,0.1)', off2, 34);
      const off3 = cx * 0.5;
      hillPath(ctx, off3, 470 - cy * 0.4, 40, 0.011, 2.4);
      ctx.fillStyle = '#8f5f63';
      ctx.fill();
      forEachItem(off3, 110, 31, (x, i, h) => {
        if (h > 0.5) return;
        const wx = x + off3;
        const by = 470 - cy * 0.4 - 40 * (0.55 * Math.sin(wx * 0.011 + 2.4) + 0.3 * Math.sin(wx * 0.011 * 2.3 + 2.4 * 1.7) + 0.15 * Math.sin(wx * 0.011 * 5.1 + 2.4 * 2.9));
        ctx.fillStyle = '#6a8a3a';
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(x + k * 6, by + 4);
          ctx.lineTo(x + k * 9, by - 14 - (k === 0 ? 6 : 0));
          ctx.lineTo(x + k * 6 + 4, by + 4);
          ctx.fill();
        }
      });
    },

    // Monde des badges : nuit violette, étoiles et grandes médailles qui flottent.
    badge(ctx, cx, cy, t) {
      sky(ctx, [[0, '#140c42'], [0.55, '#33197a'], [1, '#7a3aa8']]);
      for (let i = 0; i < 70; i++) {
        const x = ((hash(i) * 1600 - cx * 0.05) % 1000 + 1000) % 1000 - 20;
        const y = hash(i + 100) * 420;
        const a = 0.35 + 0.35 * Math.sin(t * (1 + hash(i + 7) * 2) + i);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        circlePath(ctx, x, y, 0.8 + hash(i + 3) * 1.6);
        ctx.fill();
      }
      forEachItem(cx * 0.12 + t * 4, 420, 61, (x, i, h) => {
        const y = 110 + h * 170 + Math.sin(t * 0.8 + i) * 10;
        const r = 50 + h * 40;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 0.3 + i) * 0.2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeStyle = h < 0.5 ? 'rgba(127,240,255,0.28)' : 'rgba(255,159,216,0.28)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let k = 0; k <= 24; k++) {
          const a = (k / 24) * TAU;
          const rr = r * (k % 2 ? 0.92 : 1);
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          const rr = k % 2 ? r * 0.25 : r * 0.55;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      const off2 = cx * 0.3;
      hillPath(ctx, off2, 430 - cy * 0.2, 50, 0.008, 3.3);
      ctx.fillStyle = '#3a2585';
      ctx.fill();
      ctx.strokeStyle = 'rgba(127,240,255,0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();
      const off3 = cx * 0.55;
      hillPath(ctx, off3, 490 - cy * 0.45, 26, 0.015, 1.1);
      ctx.fillStyle = '#4b3299';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,159,216,0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
    },

    volcano(ctx, cx, cy, t) {
      sky(ctx, [[0, '#1a0608'], [0.6, '#4a1210'], [1, '#8a2a10']]);
      // cascades de lave au fond
      const off1 = cx * 0.15;
      forEachItem(off1, 420, 41, (x, i, h) => {
        const w = 26 + h * 20;
        const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
        g.addColorStop(0, 'rgba(255,90,20,0)');
        g.addColorStop(0.5, 'rgba(255,150,40,0.55)');
        g.addColorStop(1, 'rgba(255,90,20,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - w, 0, w * 2, VIEW_H);
        ctx.strokeStyle = 'rgba(255,230,120,0.35)';
        ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          const yy = ((t * 120 + k * 180 + h * 300) % VIEW_H);
          ctx.beginPath();
          ctx.moveTo(x - w * 0.3 + k * 8, yy);
          ctx.lineTo(x - w * 0.3 + k * 8, yy + 40);
          ctx.stroke();
        }
      });
      // piliers de roche
      const off2 = cx * 0.3;
      forEachItem(off2, 220, 43, (x, i, h) => {
        const w = 50 + h * 50;
        ctx.fillStyle = '#2e1214';
        ctx.beginPath();
        ctx.moveTo(x - w, VIEW_H);
        ctx.lineTo(x - w * 0.6, 240 + h * 120 - cy * 0.2);
        ctx.lineTo(x + w * 0.5, 220 + h * 100 - cy * 0.2);
        ctx.lineTo(x + w, VIEW_H);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,100,30,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      // stalactites
      const off3 = cx * 0.5;
      forEachItem(off3, 60, 47, (x, i, h) => {
        const len = 30 + h * 90;
        ctx.fillStyle = '#220a0a';
        ctx.beginPath();
        ctx.moveTo(x - 22, -cy * 0.4 - 5);
        ctx.lineTo(x, len - cy * 0.4);
        ctx.lineTo(x + 22, -cy * 0.4 - 5);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = '#220a0a';
      ctx.fillRect(0, -10, VIEW_W, 14 - cy * 0.4);
      const gl = ctx.createLinearGradient(0, VIEW_H - 200, 0, VIEW_H);
      gl.addColorStop(0, 'rgba(255,100,20,0)');
      gl.addColorStop(1, 'rgba(255,100,20,0.45)');
      ctx.fillStyle = gl;
      ctx.fillRect(0, VIEW_H - 200, VIEW_W, 200);
      // braises qui montent
      for (let i = 0; i < 40; i++) {
        const sp = 30 + hash(i + 2) * 50;
        const x = ((hash(i) * 1400 - cx * 0.7 + Math.sin(t + i) * 20) % 1000 + 1000) % 1000 - 20;
        const y = VIEW_H - ((t * sp + hash(i + 5) * VIEW_H) % (VIEW_H + 40));
        const a = 0.5 + 0.5 * Math.sin(t * 5 + i);
        ctx.fillStyle = `rgba(255,${150 + (i % 3) * 40},60,${a})`;
        circlePath(ctx, x, y, 1.5 + (i % 3));
        ctx.fill();
      }
    },

    // La grotte : parois violettes, cristaux qui brillent au fond, stalactites et vers luisants.
    cave(ctx, cx, cy, t) {
      sky(ctx, [[0, '#140c26'], [0.5, '#24183e'], [1, '#1a1030']]);
      // paroi du fond avec des grappes de cristaux
      const off1 = cx * 0.1;
      forEachItem(off1, 230, 51, (x, i, h) => {
        const by = 470 - cy * 0.08;
        const w = 110 + h * 80;
        ctx.fillStyle = '#2c2148';
        ctx.beginPath();
        ctx.moveTo(x - w, by + 80);
        ctx.lineTo(x - w * 0.7, by - 120 - h * 90);
        ctx.lineTo(x - w * 0.1, by - 170 - h * 120);
        ctx.lineTo(x + w * 0.5, by - 130 - h * 60);
        ctx.lineTo(x + w, by + 80);
        ctx.closePath();
        ctx.fill();
        const cols = ['127,240,255', '255,159,216', '201,166,255', '255,230,128'];
        const col = cols[i & 3];
        const a = 0.45 + 0.25 * Math.sin(t * 1.5 + i * 2);
        const gx = x - w * 0.2 + h * 40;
        const gy = by - 60 - h * 50;
        const gl = ctx.createRadialGradient(gx, gy, 2, gx, gy, 60);
        gl.addColorStop(0, `rgba(${col},${a * 0.5})`);
        gl.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gl;
        circlePath(ctx, gx, gy, 60);
        ctx.fill();
        ctx.fillStyle = `rgba(${col},${a + 0.2})`;
        for (let k = -1; k <= 1; k++) {
          const ch = 26 - Math.abs(k) * 9;
          ctx.beginPath();
          ctx.moveTo(gx + k * 9 - 5, gy + 10);
          ctx.lineTo(gx + k * 11, gy + 10 - ch);
          ctx.lineTo(gx + k * 9 + 5, gy + 10);
          ctx.closePath();
          ctx.fill();
        }
      });
      // stalactites et stalagmites
      const off2 = cx * 0.3;
      forEachItem(off2, 110, 53, (x, i, h) => {
        const len = 60 + h * 120;
        ctx.fillStyle = '#3a2d5a';
        ctx.beginPath();
        ctx.moveTo(x - 26, -cy * 0.2 - 10);
        ctx.quadraticCurveTo(x - 6, len * 0.5 - cy * 0.2, x, len - cy * 0.2);
        ctx.quadraticCurveTo(x + 6, len * 0.5 - cy * 0.2, x + 26, -cy * 0.2 - 10);
        ctx.closePath();
        ctx.fill();
        if (h < 0.55) {
          const sh = 50 + h * 110;
          const by = 520 - cy * 0.25;
          ctx.beginPath();
          ctx.moveTo(x + 40, by + 40);
          ctx.quadraticCurveTo(x + 52, by - sh * 0.5, x + 58, by - sh);
          ctx.quadraticCurveTo(x + 64, by - sh * 0.5, x + 76, by + 40);
          ctx.closePath();
          ctx.fill();
        }
      });
      ctx.fillStyle = '#3a2d5a';
      ctx.fillRect(0, -10, VIEW_W, 12 - cy * 0.2);
      // vers luisants qui pendent au plafond
      const off3 = cx * 0.55;
      forEachItem(off3, 80, 57, (x, i, h) => {
        if (h > 0.55) return;
        const len = 40 + h * 150;
        ctx.strokeStyle = 'rgba(160,220,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, -cy * 0.4);
        ctx.lineTo(x + Math.sin(t + i) * 3, len - cy * 0.4);
        ctx.stroke();
        const a = 0.5 + 0.4 * Math.sin(t * 2.3 + i * 1.7);
        ctx.fillStyle = `rgba(150,240,255,${a})`;
        circlePath(ctx, x + Math.sin(t + i) * 3, len - cy * 0.4, 2.6);
        ctx.fill();
      });
    },

    // La montagne des nuages : grand ciel, sommets qui dépassent d'une mer de nuages, arc-en-ciel au loin.
    sky(ctx, cx, cy, t) {
      sky(ctx, [[0, '#4aa6ff'], [0.5, '#a8dcff'], [1, '#fff3e0']]);
      // soleil
      const sx = 150;
      const sy = 95 - cy * 0.04;
      const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 90);
      sg.addColorStop(0, '#fffde8');
      sg.addColorStop(0.4, 'rgba(255,240,150,0.9)');
      sg.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = sg;
      circlePath(ctx, sx, sy, 90);
      ctx.fill();
      // grand arc-en-ciel très loin
      const rx = 700 - ((cx * 0.03) % 1800);
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 12;
      RAINBOW.forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.arc(rx, 470 - cy * 0.05, 330 - i * 12, Math.PI, 0);
        ctx.stroke();
      });
      ctx.restore();
      // sommets enneigés
      const off1 = cx * 0.08;
      forEachItem(off1, 330, 71, (x, i, h) => {
        const mh = 170 + h * 120;
        const by = 430 - cy * 0.08;
        ctx.fillStyle = '#8ea2d8';
        ctx.beginPath();
        ctx.moveTo(x - mh * 0.8, by);
        ctx.lineTo(x - 12, by - mh);
        ctx.quadraticCurveTo(x, by - mh - 8, x + 12, by - mh);
        ctx.lineTo(x + mh * 0.8, by);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - mh * 0.26, by - mh * 0.68);
        ctx.lineTo(x - 12, by - mh);
        ctx.quadraticCurveTo(x, by - mh - 8, x + 12, by - mh);
        ctx.lineTo(x + mh * 0.26, by - mh * 0.68);
        ctx.quadraticCurveTo(x + 8, by - mh * 0.6, x, by - mh * 0.7);
        ctx.quadraticCurveTo(x - 8, by - mh * 0.62, x - mh * 0.26, by - mh * 0.68);
        ctx.fill();
      });
      // petites îles qui flottent
      forEachItem(cx * 0.16, 420, 73, (x, i, h) => {
        const y = 170 + h * 110 + Math.sin(t * 0.7 + i) * 6 - cy * 0.1;
        ctx.fillStyle = '#9a7a8a';
        ctx.beginPath();
        ctx.moveTo(x - 40, y);
        ctx.quadraticCurveTo(x, y + 50, x + 40, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#7fdc5a';
        roundRectPath(ctx, x - 42, y - 6, 84, 10, 5);
        ctx.fill();
        roundTree(ctx, x + 12 - h * 20, y - 2, 34, '#9a6a3a', '#4fcf5a', '#2fa34a');
      });
      // oiseaux au loin
      ctx.strokeStyle = 'rgba(60,80,140,0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const bx = ((hash(i + 40) * 1400 + t * (20 + i * 4) - cx * 0.05) % 1100 + 1100) % 1100 - 60;
        const by = 80 + hash(i + 44) * 120 + Math.sin(t + i) * 8;
        const f = Math.sin(t * 6 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(bx - 8, by - f);
        ctx.quadraticCurveTo(bx - 3, by - 4, bx, by);
        ctx.quadraticCurveTo(bx + 3, by - 4, bx + 8, by - f);
        ctx.stroke();
      }
      // nuages qui passent
      forEachItem(cx * 0.12 - t * 10, 300, 75, (x, i, h) => fluffyCloud(ctx, x, 60 + h * 140 - cy * 0.06, 0.7 + h * 0.6, '#ffffff', '#d8e6ff'));
      // mer de nuages, tout en bas : bleutée pour qu'on voie bien les trous entre les nuages du sol
      const off2 = cx * 0.3;
      hillPath(ctx, off2, 430 - cy * 0.2, 26, 0.02, 1.7, 12);
      ctx.fillStyle = '#d4e0fa';
      ctx.fill();
      const deep = ctx.createLinearGradient(0, 450 - cy * 0.45, 0, VIEW_H);
      deep.addColorStop(0, '#a9bdf0');
      deep.addColorStop(1, '#6f86d6');
      const off3 = cx * 0.55;
      hillPath(ctx, off3, 470 - cy * 0.45, 22, 0.025, 3.1, 12);
      ctx.fillStyle = deep;
      ctx.fill();
    },

    // Le monde des bonbons : montagnes de boules de gomme, sucettes géantes, cornets de glace, collines en chocolat.
    candy(ctx, cx, cy, t) {
      sky(ctx, [[0, '#ff9fd0'], [0.5, '#ffd3ea'], [1, '#fff0d8']]);
      // nuages en barbe à papa
      forEachItem(cx * 0.06 - t * 6, 320, 81, (x, i, h) => fluffyCloud(ctx, x, 60 + h * 100 - cy * 0.05, 0.8 + h * 0.5, h < 0.5 ? '#ffe0f2' : '#dcefff', h < 0.5 ? '#ffb8dd' : '#b8dcff'));
      // montagnes de boules de gomme
      const off1 = cx * 0.1;
      const gum = ['#ff6fa8', '#7fd3ff', '#ffd84a', '#8ee07a', '#c49bff'];
      forEachItem(off1, 150, 83, (x, i, h) => {
        const r = 70 + h * 60;
        const by = 430 - cy * 0.1;
        ctx.fillStyle = gum[i % gum.length];
        ctx.beginPath();
        ctx.ellipse(x, by, r, r * 1.1, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let k = 0; k < 6; k++) {
          circlePath(ctx, x - r * 0.6 + hash(i * 7 + k) * r * 1.2, by - r * 0.15 - hash(i * 3 + k) * r * 0.8, 2.2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ellipsePath(ctx, x - r * 0.35, by - r * 0.7, r * 0.18, r * 0.1, -0.5);
        ctx.fill();
      });
      // sucettes géantes, sucres d'orge et cornets de glace
      const off2 = cx * 0.3;
      forEachItem(off2, 160, 85, (x, i, h) => {
        const by = 470 - cy * 0.25;
        const kind = i % 3;
        if (kind === 0) {
          const hh = 150 + h * 80;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 4, by - hh, 8, hh + 60);
          const r = 40 + h * 14;
          ctx.fillStyle = gum[(i + 2) % gum.length];
          circlePath(ctx, x, by - hh, r);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          for (let a = 0; a < TAU * 2.2; a += 0.2) {
            const rr = (a / (TAU * 2.2)) * r * 0.85;
            const px = x + Math.cos(a + t * 0.6) * rr;
            const py = by - hh + Math.sin(a + t * 0.6) * rr;
            if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
        } else if (kind === 1) {
          const hh = 140 + h * 70;
          ctx.lineCap = 'round';
          ctx.lineWidth = 14;
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(x, by + 60);
          ctx.lineTo(x, by - hh);
          ctx.arc(x - 22, by - hh, 22, 0, Math.PI, true);
          ctx.stroke();
          ctx.lineCap = 'butt';
          ctx.lineWidth = 14;
          ctx.strokeStyle = '#ff4f8a';
          ctx.setLineDash([9, 9]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const hh = 90 + h * 50;
          ctx.fillStyle = '#e8a85a';
          ctx.beginPath();
          ctx.moveTo(x - 24, by - hh);
          ctx.lineTo(x, by + 40);
          ctx.lineTo(x + 24, by - hh);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(150,90,30,0.5)';
          ctx.lineWidth = 2;
          for (let k = 1; k < 5; k++) {
            ctx.beginPath();
            ctx.moveTo(x - 24 + k * 6, by - hh);
            ctx.lineTo(x + 6 - k * 3, by - hh + k * 26);
            ctx.stroke();
          }
          const boules = h < 0.5 ? ['#ffb3d1', '#fff1c4'] : ['#a8e6c0', '#8a5a3a'];
          boules.forEach((c, k) => {
            ctx.fillStyle = c;
            circlePath(ctx, x, by - hh - 14 - k * 26, 26 - k * 3);
            ctx.fill();
          });
          ctx.fillStyle = '#e8203a';
          circlePath(ctx, x + 2, by - hh - 66, 7);
          ctx.fill();
        }
      });
      // collines en chocolat avec du nappage qui coule
      const off3 = cx * 0.55;
      hillPath(ctx, off3, 480 - cy * 0.45, 26, 0.012, 0.9);
      ctx.fillStyle = '#7a4428';
      ctx.fill();
      ctx.save();
      hillPath(ctx, off3, 480 - cy * 0.45, 26, 0.012, 0.9);
      ctx.clip();
      ctx.fillStyle = '#ffd6ec';
      for (let sx = -10; sx <= VIEW_W + 20; sx += 16) {
        const wx = sx + off3;
        const y = 480 - cy * 0.45 - 26 * (0.55 * Math.sin(wx * 0.012 + 0.9) + 0.3 * Math.sin(wx * 0.012 * 2.3 + 0.9 * 1.7) + 0.15 * Math.sin(wx * 0.012 * 5.1 + 0.9 * 2.9));
        roundRectPath(ctx, sx, y - 4, 17, 10 + hash(Math.floor(wx / 16)) * 14, 7);
        ctx.fill();
      }
      ctx.restore();
    },
  };

  function drawBackground(ctx, theme, cx, cy, t, flash) {
    BG[theme](ctx, cx, cy, t, flash || 0);
  }

  // ---------- Petites décorations posées sur le sol ----------
  function decor(ctx, theme, x, y, v, t) {
    const sway = Math.sin(t * 2 + v * 10) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    if (theme === 'meadow' || theme === 'mountain' || theme === 'river') {
      if (v < 0.5) {
        // fleur
        ctx.rotate(sway);
        ctx.strokeStyle = '#2f9a3a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -16);
        ctx.stroke();
        const cols = theme === 'meadow' ? ['#ff5fa8', '#ffd21f', '#ffffff', '#b06bff']
          : theme === 'river' ? ['#7fc8ff', '#ffffff', '#ffd21f', '#ff8fc8'] : ['#ffd21f', '#ff8a3a', '#ffffff', '#ff5f5f'];
        ctx.fillStyle = cols[Math.floor(v * 8) % 4];
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU;
          circlePath(ctx, Math.cos(a) * 5, -18 + Math.sin(a) * 5, 4);
          ctx.fill();
        }
        ctx.fillStyle = '#ffb000';
        circlePath(ctx, 0, -18, 3);
        ctx.fill();
      } else {
        // touffe d'herbe
        ctx.fillStyle = theme === 'mountain' ? '#9aa84a' : '#3fbf4a';
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(k * 4 - 2, 0);
          ctx.quadraticCurveTo(k * 5 + sway * 20, -10, k * 6 + sway * 30, -13 + Math.abs(k) * 2);
          ctx.lineTo(k * 4 + 2, 0);
          ctx.fill();
        }
      }
    } else if (theme === 'treetops') {
      if (v < 0.45) {
        // un petit pissenlit jaune
        ctx.rotate(sway);
        ctx.strokeStyle = '#3f8a2c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -13);
        ctx.stroke();
        Art.dandelionFlower(ctx, 0, -15, 7, 1);
      } else {
        // trèfles
        ctx.fillStyle = '#3fae45';
        for (const [dx, h] of [[-5, 7], [3, 10], [9, 6]]) {
          ctx.fillRect(dx - 0.6, -h, 1.2, h);
          for (let k = 0; k < 3; k++) {
            const a = (k / 3) * TAU - Math.PI / 2 + sway;
            circlePath(ctx, dx + Math.cos(a) * 2.6, -h + Math.sin(a) * 2.6, 2.4);
            ctx.fill();
          }
        }
      }
    } else if (theme === 'forest') {
      if (v < 0.4) {
        // champignon
        ctx.fillStyle = '#fff3e0';
        roundRectPath(ctx, -3.5, -12, 7, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#e8402f';
        ctx.beginPath();
        ctx.ellipse(0, -12, 11, 8, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        circlePath(ctx, -4, -15, 2);
        ctx.fill();
        circlePath(ctx, 4, -16, 1.6);
        ctx.fill();
      } else {
        ctx.fillStyle = '#2f9a4a';
        for (let k = -2; k <= 2; k++) {
          ctx.save();
          ctx.rotate(k * 0.35 + sway);
          ellipsePath(ctx, 0, -12, 3, 12);
          ctx.fill();
          ctx.restore();
        }
      }
    } else if (theme === 'storm') {
      if (v < 0.5) {
        // petite sucette décorative
        ctx.fillStyle = '#fff';
        ctx.fillRect(-1, -18, 2, 18);
        ctx.fillStyle = v < 0.25 ? '#ff7fb6' : '#7fd3ff';
        circlePath(ctx, 0, -20, 6);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -20, 3, 0, 4.5);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffe0f1';
        circlePath(ctx, -5, -4, 5);
        ctx.fill();
        circlePath(ctx, 3, -6, 6);
        ctx.fill();
        circlePath(ctx, 9, -3, 4);
        ctx.fill();
      }
    } else if (theme === 'badge') {
      // petit cristal lumineux
      const a = 0.65 + 0.35 * Math.sin(t * 3 + v * 20);
      ctx.fillStyle = v < 0.5 ? `rgba(127,240,255,${a})` : `rgba(255,159,216,${a})`;
      ctx.beginPath();
      ctx.moveTo(0, -16 - v * 6);
      ctx.lineTo(5, -6);
      ctx.lineTo(0, 0);
      ctx.lineTo(-5, -6);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'volcano') {
      // cristal qui brille
      const a = 0.6 + 0.4 * Math.sin(t * 3 + v * 20);
      ctx.fillStyle = `rgba(255,${120 + Math.floor(v * 80)},60,${a})`;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-2, -14 - v * 8);
      ctx.lineTo(3, -10 - v * 6);
      ctx.lineTo(5, 0);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'cave') {
      if (v < 0.5) {
        // petits champignons qui brillent dans le noir
        const a = 0.7 + 0.3 * Math.sin(t * 2 + v * 30);
        for (const [dx, s] of [[-5, 1], [5, 0.7]]) {
          ctx.fillStyle = '#e8e0d0';
          ctx.fillRect(dx - 1.5 * s, -9 * s, 3 * s, 9 * s);
          ctx.fillStyle = `rgba(${v < 0.25 ? '120,250,255' : '255,160,230'},${a})`;
          ctx.beginPath();
          ctx.ellipse(dx, -9 * s, 7 * s, 5 * s, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // caillou
        ctx.fillStyle = '#5a4d78';
        ellipsePath(ctx, 0, -4, 9, 5);
        ctx.fill();
        ctx.fillStyle = '#7a6c9a';
        ellipsePath(ctx, -2, -6, 4, 2);
        ctx.fill();
      }
    } else if (theme === 'sky') {
      if (v < 0.5) {
        // fleur-étoile qui scintille
        ctx.rotate(sway);
        ctx.strokeStyle = '#7ab8e8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -14);
        ctx.stroke();
        ctx.translate(0, -17);
        ctx.rotate(t * 0.8 + v * 9);
        ctx.fillStyle = v < 0.25 ? '#ffe14d' : '#ff9fd8';
        Art.starShape(ctx, 6, 0.45);
        ctx.fill();
      } else {
        // petit nuage tout rond
        ctx.fillStyle = '#ffffff';
        circlePath(ctx, -5, -4, 5);
        ctx.fill();
        circlePath(ctx, 3, -6, 6);
        ctx.fill();
        circlePath(ctx, 9, -3, 4);
        ctx.fill();
      }
    } else if (theme === 'candy') {
      if (v < 0.35) {
        // petit sucre d'orge planté dans le nappage
        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -16);
        ctx.arc(-4, -16, 4, 0, Math.PI, true);
        ctx.stroke();
        ctx.strokeStyle = '#ff4f8a';
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (v < 0.7) {
        // boule de gomme
        const cols = ['#ff6fa8', '#7fd3ff', '#ffd84a', '#8ee07a'];
        ctx.fillStyle = cols[Math.floor(v * 40) % 4];
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 10, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ellipsePath(ctx, -3, -6, 2.5, 1.5, -0.5);
        ctx.fill();
      } else {
        // petite sucette
        ctx.fillStyle = '#fff';
        ctx.fillRect(-1, -16, 2, 16);
        ctx.fillStyle = '#ff7fb6';
        circlePath(ctx, 0, -18, 6);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -18, 3, 0, 4.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  return {
    THEMES, PAD, setScale, groundSprite, brickSprite, lutinSprite, platformSprite, thornSprite,
    rainbowSprite, bounceSprite, puddle, drawLavaRun, drawChocoRun, drawBackground, decor, fluffyCloud, cornerRect,
    trunkSprite, crown, riverBed, drawWaterRun, reeds, burrowCell, burrowSunbeam, burrowLantern,
  };
})();
