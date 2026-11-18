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
    // la prairie la nuit : de l'herbe bleu-vert sous la lune, et des planches lilas
    night: {
      dirt: '#8a6058', dirtDark: '#5e3c3c', dirtLight: '#a87a6a', stripe: 'rgba(40,20,40,0.2)',
      top: '#3fae7a', topDark: '#22805e', topLight: '#8fe0b8', blades: true,
      brick: '#b0708a', brickDark: '#7a4060', brickLight: '#e0a0bc',
      plat: '#b88ae0', platDark: '#7c58b0', platLight: '#e6d0ff', platDots: '#ffffff',
      bramble: '#6a3a8a', brambleDark: '#2a1040', thorn: '#ffffff',
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
    // les champignons géants : la forêt, mais les plateformes (-) et les champignons qui font rebondir (M)
    // sont de grands chapeaux de champignons, avec leur pied (caps : voir capSprite et World.findCaps)
    mushrooms: {
      dirt: '#7a5236', dirtDark: '#52341f', dirtLight: '#9a6d48', stripe: 'rgba(40,20,5,0.2)',
      top: '#4fbf5a', topDark: '#23864a', topLight: '#a0e890', blades: true,
      brick: '#b07a45', brickDark: '#6f4521', brickLight: '#dcaa6e', crate: true,
      plat: '#f08a3a', platDark: '#b8521c', platLight: '#ffc890', caps: true,
      bramble: '#7a3a8a', brambleDark: '#2f1236', thorn: '#ffffff',
    },
    // le sous-bois du Défi du Super Saut : les champignons géants (- et M sont de grands chapeaux), de la mousse, et les
    // grands arbres de la forêt : = est une branche (sur un tronc |), et au-dessus du sol, les murs sont de grosses
    // souches (stumps : avec l'écorce et la mousse des Grands Arbres, voir World.tileTheme)
    sousbois: {
      dirt: '#7a5236', dirtDark: '#52341f', dirtLight: '#9a6d48', stripe: 'rgba(40,20,5,0.2)',
      top: '#5cb84a', topDark: '#2f8a3e', topLight: '#a8e07e', blades: true,
      brick: '#b07a45', brickDark: '#6f4521', brickLight: '#dcaa6e', crate: true,
      plat: '#f08a3a', platDark: '#b8521c', platLight: '#ffc890', caps: true, branches: true, stumps: true,
      bramble: '#7a3a8a', brambleDark: '#2f1236', thorn: '#ffffff',
    },
    // le marais aux cabanes : de la terre sombre et mouillée, de l'herbe vert olive, des caisses, et les planchers des
    // cabanes sur pilotis (cabins : voir World.findCabins) ; la lave (~) est de la boue où l'on s'enfonce
    marsh: {
      dirt: '#5e4a36', dirtDark: '#3e3022', dirtLight: '#7a6248', stripe: 'rgba(30,20,8,0.22)',
      top: '#6aa64a', topDark: '#3e7a3a', topLight: '#a8d07a', blades: true,
      brick: '#9a7448', brickDark: '#5e4224', brickLight: '#c49a66', crate: true,
      plat: '#a07448', platDark: '#62452a', platLight: '#caa070', cabins: true,
      bramble: '#6a3a7a', brambleDark: '#2a1232', thorn: '#ffffff',
    },
    // dans le Vieux Chêne : le bois du tronc creux (des rainures qui montent), de la mousse sur les étages, des
    // caisses, et les plateformes (-) sont des champignons-étagères accrochés au bois (fungus : voir platformSprite)
    oak: {
      dirt: '#8a5a34', dirtDark: '#5a3820', dirtLight: '#ad7a4c', stripe: 'rgba(50,25,8,0.3)',
      top: '#74b04c', topDark: '#3f7a34', topLight: '#b8e07e', blades: true, bark: true,
      brick: '#b07a45', brickDark: '#6f4521', brickLight: '#dcaa6e', crate: true,
      plat: '#f2b25a', platDark: '#b86a26', platLight: '#ffe3a8', fungus: true,
      bramble: '#7a3a8a', brambleDark: '#2f1236', thorn: '#ffffff',
    },
    storm: {
      dirt: '#b77a4a', dirtDark: '#7d4b28', dirtLight: '#d89a62', stripe: 'rgba(90,40,10,0.2)',
      top: '#ff9fd0', topDark: '#d466a6', topLight: '#ffe0f1', blades: false, cream: true,
      brick: '#9d93c6', brickDark: '#655b92', brickLight: '#cfc7f0',
      plat: '#f4ecff', platDark: '#b9a8e0', platLight: '#ffffff', cloud: true,
      bramble: '#5a2a7a', brambleDark: '#22102e', thorn: '#ffffff',
    },
    // autour du Phare sur la Falaise : les paliers et la galerie sont de grosses pierres taillées (masonry : voir
    // drawMasonry), et les plateformes (-) de vieilles planches de bois
    phare: {
      dirt: '#aaa3c6', dirtDark: '#77708f', dirtLight: '#cfc9e4', stripe: 'rgba(50,30,80,0.18)',
      top: '#ddd8ee', topDark: '#a59cc4', topLight: '#f6f3ff', blades: false, masonry: true,
      brick: '#9d93c6', brickDark: '#655b92', brickLight: '#cfc7f0',
      plat: '#b58552', platDark: '#6e4a2a', platLight: '#e0b27c',
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
    if (th.masonry) drawMasonry(g, th, m, v);
    // strates
    g.fillStyle = th.stripe;
    for (const sy of th.fluffy || th.bark || th.masonry ? [] : [12, 36]) {
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
    for (let i = 0; i < (th.fluffy || th.biscuit || th.bark || th.masonry ? 0 : 3); i++) {
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

  // De grosses pierres taillées (le Phare sur la Falaise) : deux rangées par case, décalées d'une demi-case (les joints
  // se raccordent d'une case à l'autre), chaque pierre un peu différente.
  function drawMasonry(g, th, m, v) {
    const T = TILE;
    for (let row = 0; row < 2; row++) {
      const y0 = row * 24;
      for (let k = -1; k <= 1; k++) {
        const x0 = (row ? T / 2 : 0) + k * T;
        const xa = Math.max(0, x0 + 1);
        const xb = Math.min(T, x0 + T - 1);
        if (xb - xa < 2) continue;
        const n = hash(v * 3.7 + row * 5.1 + k * 1.3);
        g.fillStyle = n < 0.33 ? th.dirtLight : n < 0.66 ? th.dirt : Art.mixColor(th.dirt, th.dirtDark, 0.35);
        g.fillRect(xa, y0 + 1, xb - xa, 22);
        g.fillStyle = 'rgba(255,255,255,0.28)';
        if (x0 + 1 >= 0) g.fillRect(xa, y0 + 1, 3, 22);
        g.fillRect(xa, y0 + 1, xb - xa, 3);
        g.fillStyle = 'rgba(40,20,70,0.22)';
        g.fillRect(xa, y0 + 20, xb - xa, 3);
      }
      g.fillStyle = th.dirtDark;
      g.fillRect(0, y0 + 23, T, 2);
      for (const jx of row ? [T / 2] : [0]) g.fillRect(jx - 1, y0, 2, 24);
    }
  }

  function drawTopCap(g, th, m, v) {
    const T = TILE;
    const lipL = m.l ? -3 : 0;
    const lipR = m.r ? T + 3 : T;
    if (th.masonry) {
      // une dalle de pierre bien plate, qui dépasse un peu
      g.fillStyle = th.topDark;
      cornerRect(g, lipL, -3, lipR - lipL, 13, m.l ? 4 : 0, m.r ? 4 : 0, m.r ? 3 : 0, m.l ? 3 : 0);
      g.fill();
      g.fillStyle = th.top;
      cornerRect(g, lipL, -3, lipR - lipL, 9, m.l ? 4 : 0, m.r ? 4 : 0, 0, 0);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(lipL + 3, -2, lipR - lipL - 6, 2);
      return;
    }
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

  // Le bouchon en chocolat (le Défi du Bocal à éclairs) : une grosse tablette de chocolat qui bouche le passage, avec un
  // petit éclair jaune dessus (c'est un éclair lancé qui le fait fondre). top / bot : le haut / le bas du bouchon
  // (des coins arrondis ; au milieu, les cases se touchent).
  function plugSprite(top, bot) {
    return sprite(`plug:${top | 0}${bot | 0}`, TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const T = TILE;
      g.translate(PAD, PAD);
      const rt = top ? 10 : 2;
      const rb = bot ? 6 : 2;
      g.fillStyle = '#3f1f0e';
      cornerRect(g, 0, 0, T, T, rt, rt, rb, rb);
      g.fill();
      // les 4 carrés de la tablette, en relief
      for (const [x, y] of [[4, 4], [T / 2 + 1, 4], [4, T / 2 + 1], [T / 2 + 1, T / 2 + 1]]) {
        const w = T / 2 - 5;
        const gr = g.createLinearGradient(x, y, x + w, y + w);
        gr.addColorStop(0, '#9a5a2e');
        gr.addColorStop(1, '#5e3017');
        g.fillStyle = gr;
        roundRectPath(g, x, y, w, w, 4);
        g.fill();
        g.fillStyle = 'rgba(255,220,180,0.35)';
        roundRectPath(g, x + 3, y + 2, w - 8, 3, 1.5);
        g.fill();
      }
      // le petit éclair jaune (comme ceux des orages)
      g.save();
      g.translate(T / 2, T / 2);
      g.beginPath();
      g.moveTo(3, -13);
      g.lineTo(-7, 2);
      g.lineTo(-1, 2);
      g.lineTo(-4, 13);
      g.lineTo(7, -3);
      g.lineTo(1, -3);
      g.closePath();
      g.fillStyle = '#ffe94a';
      g.strokeStyle = '#7a3a10';
      g.lineWidth = 2;
      g.lineJoin = 'round';
      g.stroke();
      g.fill();
      g.restore();
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
      if (th.fungus) {
        // un champignon-étagère accroché au bois du Vieux Chêne : un dessus bombé tout pâle, des bandes de couleur
        // qui suivent le bord, et dessous de tout petits trous (le bord est festonné) ; les bouts sont arrondis
        const yt = 0;
        const yb = 21;
        cornerRect(g, x0, yt, x1 - x0, yb - yt, l ? 9 : 0, r ? 9 : 0, r ? 16 : 0, l ? 16 : 0);
        const gr = g.createLinearGradient(0, yt, 0, yb);
        gr.addColorStop(0, th.platLight);
        gr.addColorStop(0.3, th.plat);
        gr.addColorStop(1, th.platDark);
        g.fillStyle = gr;
        g.fill();
        g.save();
        g.clip();
        // les bandes (des anneaux de croissance)
        g.lineWidth = 2.2;
        for (const [y, col] of [[8, 'rgba(255,240,200,0.45)'], [13, 'rgba(120,50,10,0.3)'], [17.5, 'rgba(255,220,160,0.35)']]) {
          g.strokeStyle = col;
          g.beginPath();
          g.moveTo(x0 - 2, y);
          for (let x = x0; x <= x1 + 2; x += 4) g.lineTo(x, y + Math.sin(x * 0.21 + y) * 0.8);
          g.stroke();
        }
        // dessous : des tout petits trous pâles
        g.fillStyle = '#fff1d0';
        g.fillRect(x0 - 2, yb - 3, x1 - x0 + 4, 4);
        g.fillStyle = 'rgba(150,80,30,0.45)';
        for (let x = x0 + 3; x < x1 - 2; x += 5) {
          circlePath(g, x, yb - 1.4, 0.9);
          g.fill();
        }
        g.restore();
        // le bord festonné, et le reflet du dessus
        g.fillStyle = '#fff1d0';
        for (let x = x0 + (l ? 8 : 2); x <= x1 - (r ? 8 : 2); x += 8) {
          circlePath(g, x, yb - 0.5, 2.2);
          g.fill();
        }
        g.fillStyle = 'rgba(255,255,255,0.55)';
        roundRectPath(g, x0 + (l ? 6 : 0), 1.5, x1 - x0 - (l ? 6 : 0) - (r ? 6 : 0), 2.2, 1.1);
        g.fill();
        g.strokeStyle = 'rgba(90,40,10,0.45)';
        g.lineWidth = 1.2;
        // (entre deux cases, pas de trait au milieu du champignon)
        g.save();
        g.beginPath();
        g.rect(l ? -PAD : 0, -PAD, (r ? T + PAD : T) - (l ? -PAD : 0), T + PAD * 2);
        g.clip();
        cornerRect(g, x0, yt, x1 - x0, yb - yt, l ? 9 : 0, r ? 9 : 0, r ? 16 : 0, l ? 16 : 0);
        g.stroke();
        g.restore();
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

  // ---------- Les grands chapeaux de champignons (les Champignons Géants) ----------
  // Une rangée de "-" (on monte dessus, on passe à travers par en dessous) ou de "M" (ça rebondit) fait un seul
  // grand chapeau de n cases, posé sur un grand pied (stalkSprite). Les chapeaux qui font rebondir sont bleus à
  // gros pois blancs, comme les champignons de la grotte ; les autres ont des couleurs chaudes (v : de 0 à 3),
  // avec juste de petites taches. Le dessus du chapeau est le haut de la case (là où Malice pose les pieds).
  const CAP_COLS = [['#f08a3a', '#b8521c', '#ffc890'], ['#d8563c', '#8a2a1e', '#ff9e84'], ['#b07ae0', '#6e44a8', '#e6d0ff'], ['#e8b83a', '#a87a14', '#fff0a0']];
  const CAP_BOUNCE = ['#36c9e8', '#1a6fa8', '#9ffcff'];
  const capRim = (bouncy) => (bouncy ? 30 : 22);

  function capSprite(n, bouncy, v) {
    const W = n * TILE;
    const rim = capRim(bouncy);
    return sprite(`cap:${n}:${bouncy | 0}:${v}`, W + 16, rim + 30, (g) => {
      g.translate(8, 8);
      const [col, dark, light] = bouncy ? CAP_BOUNCE : CAP_COLS[v % 4];
      const R = Math.min(18, W / 3);
      g.lineJoin = 'round';
      // les lamelles, sous le chapeau
      g.beginPath();
      g.moveTo(-1, rim - 3);
      g.quadraticCurveTo(W / 2, rim + 16, W + 1, rim - 3);
      g.closePath();
      g.fillStyle = '#f4e4c8';
      g.fill();
      g.strokeStyle = '#b8987a';
      g.lineWidth = 1.2;
      g.stroke();
      g.strokeStyle = 'rgba(150,110,80,0.5)';
      g.lineWidth = 1;
      g.beginPath();
      for (let x = 6; x < W - 2; x += 7) {
        const k = (x - W / 2) / (W / 2);
        g.moveTo(x, rim - 1);
        g.lineTo(W / 2 + (x - W / 2) * 0.82, rim + 5 + (1 - k * k) * 4);
      }
      g.stroke();
      // le chapeau
      g.beginPath();
      g.moveTo(-5, rim);
      g.bezierCurveTo(-6, 8, 2, 0, R, 0);
      g.quadraticCurveTo(W / 2, -6, W - R, 0);
      g.bezierCurveTo(W - 2, 0, W + 6, 8, W + 5, rim);
      g.quadraticCurveTo(W / 2, rim + 6, -5, rim);
      g.closePath();
      const gr = g.createLinearGradient(0, -3, 0, rim + 4);
      gr.addColorStop(0, light);
      gr.addColorStop(0.35, col);
      gr.addColorStop(1, dark);
      g.fillStyle = gr;
      g.fill();
      g.strokeStyle = shadeLine(dark);
      g.lineWidth = 1.8;
      g.stroke();
      // les pois (bleu : gros pois blancs) ou les petites taches
      g.save();
      g.clip();
      const count = Math.max(2, Math.round(W / (bouncy ? 26 : 20)));
      for (let i = 0; i < count; i++) {
        const h = hash(i * 3.7 + n * 1.3 + v);
        const x = ((i + 0.5) * W) / count + (h - 0.5) * 8;
        const y = (i % 2 ? 15 : 7) + h * 3 + (bouncy ? 2 : 1);
        g.fillStyle = bouncy ? '#ffffff' : 'rgba(255,250,230,0.55)';
        circlePath(g, x, y, bouncy ? 5.5 - (i % 2) * 1.5 : 2 + h * 1.2);
        g.fill();
      }
      g.restore();
      // ça brille
      g.fillStyle = 'rgba(255,255,255,0.55)';
      ellipsePath(g, Math.min(W * 0.28, 30), 4, Math.min(W * 0.18, 18), 2.4, -0.08);
      g.fill();
    });
  }

  // Un trait de contour un peu plus foncé que la couleur la plus foncée du chapeau.
  const shadeLine = (hex) => Art.mixColor(hex, '#1a0a10', 0.35);

  // Le pied d'un grand champignon : sw de large, h de haut (foot : il est planté dans l'herbe, avec un petit
  // renflement en bas ; sinon il descend tout au fond d'un trou).
  function stalkSprite(sw, h, foot) {
    return sprite(`stalk:${sw}:${h}:${foot | 0}`, sw + 24, h + 10, (g) => {
      g.translate(12, 0);
      const gr = g.createLinearGradient(-6, 0, sw + 6, 0);
      gr.addColorStop(0, '#cdb894');
      gr.addColorStop(0.35, '#fff8ea');
      gr.addColorStop(1, '#bca27c');
      g.fillStyle = gr;
      g.strokeStyle = '#a08866';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(sw * 0.08, 0);
      g.lineTo(sw * 0.92, 0);
      g.quadraticCurveTo(sw * 0.96, h * 0.6, sw + (foot ? 5 : 1), h);
      g.lineTo(-(foot ? 5 : 1), h);
      g.quadraticCurveTo(sw * 0.04, h * 0.6, sw * 0.08, 0);
      g.closePath();
      g.fill();
      g.stroke();
      if (foot) {
        ellipsePath(g, sw / 2, h - 3, sw / 2 + 8, 6);
        g.fill();
        g.stroke();
      }
      // des petites fibres tout du long
      g.strokeStyle = 'rgba(160,130,90,0.35)';
      g.lineWidth = 1;
      g.beginPath();
      for (let i = 1; i < 4; i++) {
        const x = (sw * i) / 4;
        g.moveTo(x, 12);
        g.lineTo(x + (i - 2) * 2, h - 10);
      }
      g.stroke();
      // la collerette (pour les grands)
      if (sw >= 26) {
        g.beginPath();
        g.moveTo(-3, 16);
        g.quadraticCurveTo(sw / 2, 26, sw + 3, 16);
        g.lineTo(sw + 1, 11);
        g.quadraticCurveTo(sw / 2, 18, -1, 11);
        g.closePath();
        g.fillStyle = '#fffaf0';
        g.fill();
        g.strokeStyle = '#a08866';
        g.stroke();
      }
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

  // ---------- Le Marais aux Cabanes ----------
  // La boue (comme la rivière de chocolat : on s'y enfonce) : vert-brun, toute lisse, avec de grosses bulles
  // qui font « blop » tout doucement et quelques feuilles qui flottent.
  function drawMudRun(ctx, x0, x1, y, surface, bottom, t) {
    const g = ctx.createLinearGradient(0, y, 0, bottom);
    g.addColorStop(0, '#8a7a4a');
    g.addColorStop(0.18, '#5e5232');
    g.addColorStop(1, '#342c18');
    ctx.fillStyle = g;
    const wave = (x) => y + 12 + Math.sin(x * 0.04 + t * 0.9) * 1.8 + Math.sin(x * 0.09 - t * 0.6) * 1.2;
    ctx.beginPath();
    if (surface) {
      ctx.moveTo(x0, bottom);
      for (let x = x0; x <= x1 + 0.1; x += 8) ctx.lineTo(x, wave(x));
      ctx.lineTo(x1, bottom);
    } else {
      ctx.rect(x0, y, x1 - x0, bottom - y);
    }
    ctx.fill();
    if (!surface) return;
    // le bord, un peu luisant
    ctx.strokeStyle = 'rgba(210,220,160,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = x0; x <= x1 + 0.1; x += 8) {
      if (x === x0) ctx.moveTo(x, wave(x) + 1); else ctx.lineTo(x, wave(x) + 1);
    }
    ctx.stroke();
    for (let c = Math.floor(x0 / TILE); c < Math.ceil(x1 / TILE); c++) {
      // une feuille qui flotte (une case sur deux)
      if (hash(c * 4.1) < 0.5) {
        const lx = c * TILE + 10 + hash(c * 2.9) * 26 + Math.sin(t * 0.5 + c) * 3;
        ctx.fillStyle = hash(c) < 0.5 ? '#6a8a3a' : '#8a7a34';
        ellipsePath(ctx, lx, wave(lx) + 3, 6, 2.2, hash(c * 7) - 0.5);
        ctx.fill();
      }
      // grosses bulles qui font « blop »
      const ph = (t * 0.32 + hash(c * 3.3)) % 1;
      if (ph < 0.4) {
        const bx = c * TILE + 10 + hash(c * 1.7) * 28;
        const k = ph / 0.4;
        ctx.fillStyle = `rgba(150,140,90,${1 - k})`;
        ellipsePath(ctx, bx, wave(bx) + 2 - k * 3, 2 + k * 9, 1.5 + k * 6);
        ctx.fill();
        ctx.strokeStyle = `rgba(230,230,190,${0.7 * (1 - k)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bx - 1, wave(bx) - k * 3, 1 + k * 4, Math.PI * 1.1, Math.PI * 1.6);
        ctx.stroke();
      }
    }
  }

  // Une bande de brume toute douce, qui se répète de gauche à droite (dessinée une fois).
  // (w de large, h de haut ; plus épaisse en bas, et rien du tout en haut)
  const FOG = new Map();
  function fogStrip(w, h, seed) {
    const key = w + ':' + h + ':' + seed;
    let c = FOG.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    for (let i = 0; i < 26; i++) {
      const r = h * (0.35 + hash(i * 1.3 + seed) * 0.4);
      const px = hash(i * 2.7 + seed) * w;
      const py = h - r * 0.55 - hash(i * 3.1 + seed) * h * 0.25;
      for (const ox of [-w, 0, w]) {
        const gr = g.createRadialGradient(px + ox, py, 0, px + ox, py, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.5)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(px + ox - r, py - r, r * 2, r * 2);
      }
    }
    // tout en bas, un voile égal
    const lg = g.createLinearGradient(0, h * 0.45, 0, h);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(1, 'rgba(255,255,255,0.55)');
    g.fillStyle = lg;
    g.fillRect(0, 0, w, h);
    FOG.set(key, c);
    return c;
  }

  // La brume sur toute la largeur de l'écran, posée en y (son bas), qui glisse doucement (off).
  function fogBand(ctx, y, h, off, a, seed) {
    const img = fogStrip(512, h, seed);
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * a;
    const sx = -(((off % 512) + 512) % 512);
    for (let x = sx; x < VIEW_W; x += 512) ctx.drawImage(img, x, y - h);
    ctx.globalAlpha = ga;
  }

  // Une bouffée de brume toute ronde et toute douce (dessinée une fois).
  let PUFF = null;
  function mistPuff() {
    if (!PUFF) {
      PUFF = document.createElement('canvas');
      PUFF.width = 64;
      PUFF.height = 64;
      const g = PUFF.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,0.75)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    }
    return PUFF;
  }

  // La brume au ras de la boue, de x0 à x1 (y : la surface) : des bouffées légères qui glissent tout doucement
  // au-dessus de la boue (jamais plus haut qu'une demi-case : elle ne cache ni la boue, ni ce qui s'y passe).
  function mudMist(ctx, x0, x1, y, t) {
    const img = mistPuff();
    const ga = ctx.globalAlpha;
    const n = Math.max(2, Math.round((x1 - x0) / 30));
    for (let i = 0; i <= n; i++) {
      const h = hash(i * 1.9 + x0 * 0.013);
      const k = ((t * (0.05 + h * 0.04) + h) % 1);
      // chaque bouffée glisse un peu, grossit, puis s'efface
      const x = x0 + ((i + k * 1.5) / n) * (x1 - x0) - 10;
      if (x < x0 - 12 || x > x1 + 12) continue;
      const a = Math.sin(k * Math.PI);
      const w = 50 + h * 30;
      ctx.globalAlpha = ga * 0.42 * a;
      ctx.drawImage(img, x - w / 2, y - 22 - h * 6, w, 30);
    }
    ctx.globalAlpha = ga;
  }

  // Un pilotis de cabane, de top jusqu'à bottom (dans le sol, ou dans la boue).
  function stilt(ctx, x, top, bottom) {
    const h = bottom - top;
    ctx.fillStyle = '#4e3824';
    ctx.fillRect(x - 5, top, 10, h);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(x - 3, top, 3, h);
    // des cordes enroulées
    ctx.fillStyle = '#c8b078';
    for (let yy = top + 26; yy < bottom - 10; yy += 54) {
      ctx.fillRect(x - 6, yy, 12, 3);
      ctx.fillRect(x - 6, yy + 5, 12, 2);
    }
  }

  // Une cabane posée sur son plancher (n cases de large ; le bas de l'image est le dessus du plancher) :
  // des murs en planches, une porte où brille une lumière, une fenêtre, un toit de paille plein de mousse
  // et une petite lanterne. Elle est dans le décor : on passe devant.
  const CABIN_H = 2 * TILE + 58;
  function cabinSprite(n, v) {
    const W = n * TILE + 24;
    return sprite(`cabin:${n}:${v}`, W, CABIN_H + 4, (g) => {
      const H = CABIN_H;
      const wx0 = 22;
      const wx1 = W - 22;
      const wy = H - 2 * TILE + 10;
      // les murs en planches
      g.fillStyle = '#7e5e3e';
      g.fillRect(wx0, wy, wx1 - wx0, H - wy);
      g.strokeStyle = '#5a4028';
      g.lineWidth = 2;
      g.beginPath();
      for (let x = wx0 + 12; x < wx1; x += 12) {
        g.moveTo(x, wy);
        g.lineTo(x, H);
      }
      g.stroke();
      g.fillStyle = 'rgba(255,230,180,0.12)';
      for (let x = wx0 + 2; x < wx1; x += 12) g.fillRect(x, wy, 3, H - wy);
      // l'ombre sous le toit
      const sh = g.createLinearGradient(0, wy, 0, wy + 22);
      sh.addColorStop(0, 'rgba(30,18,8,0.55)');
      sh.addColorStop(1, 'rgba(30,18,8,0)');
      g.fillStyle = sh;
      g.fillRect(wx0, wy, wx1 - wx0, 22);
      // la porte (une lumière dorée brille dedans)
      const dw = 24;
      const dx = wx0 + (wx1 - wx0) * (v === 1 ? 0.3 : 0.62) - dw / 2;
      const dy = H - 50;
      const lg = g.createLinearGradient(0, dy, 0, H);
      lg.addColorStop(0, '#ffcf6a');
      lg.addColorStop(1, '#e08a3a');
      g.fillStyle = lg;
      roundRectPath(g, dx, dy, dw, 52, 10);
      g.fill();
      g.strokeStyle = '#3e2a18';
      g.lineWidth = 3;
      g.stroke();
      // la fenêtre, avec ses croisillons
      const fx = v === 1 ? wx1 - 34 : wx0 + 12;
      if (n >= 3) {
        g.fillStyle = '#ffe08a';
        g.fillRect(fx, wy + 22, 20, 18);
        g.strokeStyle = '#3e2a18';
        g.lineWidth = 2.5;
        g.strokeRect(fx, wy + 22, 20, 18);
        g.beginPath();
        g.moveTo(fx + 10, wy + 22);
        g.lineTo(fx + 10, wy + 40);
        g.moveTo(fx, wy + 31);
        g.lineTo(fx + 20, wy + 31);
        g.stroke();
      }
      // le toit de paille
      g.beginPath();
      g.moveTo(6, wy + 6);
      g.lineTo(W * 0.5 - 10, 8);
      g.lineTo(W * 0.5 + 10, 8);
      g.lineTo(W - 6, wy + 6);
      g.quadraticCurveTo(W * 0.5, wy + 14, 6, wy + 6);
      g.closePath();
      g.fillStyle = '#b8995a';
      g.fill();
      g.strokeStyle = '#6e5630';
      g.lineWidth = 2;
      g.stroke();
      g.strokeStyle = 'rgba(110,86,48,0.6)';
      g.lineWidth = 1.4;
      g.beginPath();
      for (let i = 1; i < 12; i++) {
        const k = i / 12;
        g.moveTo(W * 0.5 + (k - 0.5) * 18, 10);
        g.lineTo(6 + k * (W - 12), wy + 8);
      }
      g.stroke();
      // de la mousse sur le toit
      g.fillStyle = '#6a9a48';
      for (let i = 0; i < 4; i++) {
        const mx = 18 + hash(n * 3 + v + i * 1.7) * (W - 36);
        const my = wy + 4 - (1 - Math.abs(mx / W - 0.5) * 2) * (wy - 12) * 0.9;
        ellipsePath(g, mx, my, 9, 4, 0);
        g.fill();
      }
      // une petite lanterne accrochée au bord du toit
      const lx = v === 1 ? W - 16 : 16;
      g.strokeStyle = '#3e2a18';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(lx, wy + 6);
      g.lineTo(lx, wy + 16);
      g.stroke();
      const lgl = g.createRadialGradient(lx, wy + 22, 0, lx, wy + 22, 16);
      lgl.addColorStop(0, 'rgba(255,220,120,0.7)');
      lgl.addColorStop(1, 'rgba(255,220,120,0)');
      g.fillStyle = lgl;
      g.fillRect(lx - 16, wy + 6, 32, 32);
      g.fillStyle = '#ffd86a';
      roundRectPath(g, lx - 4, wy + 16, 8, 11, 3);
      g.fill();
      g.strokeStyle = '#3e2a18';
      g.stroke();
    });
  }

  // Un pont de corde de x0 à x1, accroché en y (le dessus des planches). Les cordes pendent et se balancent un peu ;
  // les planches s'enfoncent sous les pieds de Malice (dip(x) : de combien, en pixels).
  function ropeBridge(ctx, x0, x1, y, t, dip) {
    const sway = Math.sin(t * 1.4) * 1.5;
    // les poteaux aux deux bouts
    for (const px of [x0 - 3, x1 + 3]) {
      ctx.fillStyle = '#4e3824';
      roundRectPath(ctx, px - 4, y - 36, 8, 52, 3);
      ctx.fill();
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(px - 2, y - 34, 2, 48);
    }
    const n = Math.max(2, Math.round((x1 - x0) / 13));
    const step = (x1 - x0) / n;
    // les deux cordes du bas (sous les planches)
    ctx.strokeStyle = '#a88a52';
    ctx.lineWidth = 2;
    for (const oy of [4, 8]) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * step;
        const yy = y + oy + dip(x) + Math.sin((i / n) * Math.PI) * sway * 0.4;
        if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // la rampe (qui pend entre les poteaux), et les petites cordes qui tiennent les planches
    const rail = (x) => {
      const k = (x - x0) / (x1 - x0);
      return y - 32 + Math.sin(k * Math.PI) * (12 + sway) + dip(x) * 0.7;
    };
    ctx.strokeStyle = '#8a6e40';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 1; i < n; i += 2) {
      const x = x0 + i * step;
      ctx.moveTo(x, rail(x));
      ctx.lineTo(x, y + 2 + dip(x));
    }
    ctx.stroke();
    ctx.strokeStyle = '#b89a5e';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const x = x0 - 3 + (i / 16) * (x1 - x0 + 6);
      if (i === 0) ctx.moveTo(x, rail(x)); else ctx.lineTo(x, rail(x));
    }
    ctx.stroke();
    // les planches (une sur deux un peu plus claire)
    for (let i = 0; i < n; i++) {
      const x = x0 + i * step + 1;
      const d = dip(x + step / 2) + Math.sin(((i + 0.5) / n) * Math.PI) * sway * 0.4;
      ctx.fillStyle = i % 2 ? '#a07448' : '#8a6038';
      roundRectPath(ctx, x, y + 1 + d, step - 2, 8, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,230,180,0.35)';
      ctx.fillRect(x + 1, y + 1.5 + d, step - 4, 1.5);
    }
  }

  // ---------- Dans le Vieux Chêne ----------
  // Une liane, le long des points pts (x, y, x, y… de là où elle est accrochée jusqu'au bout) : une tige verte et
  // souple, des feuilles qui frémissent de chaque côté, une petite fleur, une vrille enroulée au bout, et en haut
  // une touffe de feuilles. (held : Malice s'y tient : les feuilles s'agitent un peu plus.)
  function vine(ctx, pts, t, v, held) {
    const n = pts.length / 2;
    if (n < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = (dx) => {
      ctx.beginPath();
      ctx.moveTo(pts[0] + dx, pts[1]);
      for (let i = 1; i < n; i++) ctx.lineTo(pts[2 * i] + dx, pts[2 * i + 1]);
    };
    path(0);
    ctx.strokeStyle = '#2b5a24';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = '#4f9a3a';
    ctx.lineWidth = 4.4;
    ctx.stroke();
    path(-1.2);
    ctx.strokeStyle = 'rgba(200,245,150,0.5)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // les feuilles, une sur deux de chaque côté (elles frémissent)
    const cols = ['#4fb84a', '#6fd25a', '#3a9e3e'];
    const shiver = held ? 0.4 : 0.2;
    for (let i = 2; i < n; i += 2) {
      const x = pts[2 * i];
      const y = pts[2 * i + 1];
      const a = Math.atan2(y - pts[2 * i - 1], x - pts[2 * i - 2]);
      const side = (i / 2) % 2 ? 1 : -1;
      const fl = Math.sin(t * 3.1 + i * 1.3 + v * 7) * shiver;
      leaf(ctx, x, y, a - side * (2.1 + fl), 0.9 + hash(v * 9 + i) * 0.35, cols[(i / 2) % 3]);
    }
    // une petite fleur rose ou blanche
    const fi = Math.max(1, Math.floor(n * (0.45 + v * 0.3)));
    const fx = pts[2 * fi] + (v < 0.5 ? 4 : -4);
    const fy = pts[2 * fi + 1];
    ctx.fillStyle = v < 0.5 ? '#ffb0d8' : '#fff6e0';
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + t * 0.3;
      circlePath(ctx, fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.3);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd24a';
    circlePath(ctx, fx, fy, 1.6);
    ctx.fill();
    // la vrille au bout
    const tx = pts[2 * n - 2];
    const ty = pts[2 * n - 1];
    const s = v < 0.5 ? 1 : -1;
    ctx.strokeStyle = '#3f8a32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    for (let k = 1; k <= 10; k++) {
      const a = k * 0.62 + Math.sin(t * 2 + v * 4) * 0.1;
      const r = 6 - k * 0.45;
      ctx.lineTo(tx + s * (Math.sin(a) * r), ty + 4 + (1 - Math.cos(a)) * r * 0.8);
    }
    ctx.stroke();
    // la touffe de feuilles là où elle est accrochée
    const ax = pts[0];
    const ay = pts[1];
    leaf(ctx, ax, ay + 1, 0.5, 1.1, cols[1]);
    leaf(ctx, ax, ay + 1, Math.PI - 0.5, 1.1, cols[0]);
    leaf(ctx, ax + 1, ay + 2, 1.35, 0.9, cols[2]);
    ctx.fillStyle = '#2b5a24';
    ellipsePath(ctx, ax, ay + 2, 5, 3.5);
    ctx.fill();
    ctx.restore();
  }

  // Le motif de l'écorce du Vieux Chêne vu de dehors (dessiné une fois, puis recopié) : de grosses crêtes qui
  // montent, avec des crevasses sombres, un peu de lichen.
  const BARK_W = 96;
  const BARK_H = 192;
  function oakBarkSprite() {
    return sprite('oakBark', BARK_W, BARK_H, (g) => {
      g.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const bx = 12 + k * 24;
        const crack = (dx, lw, col) => {
          g.beginPath();
          for (let y = -4; y <= BARK_H + 4; y += 6) {
            const x = bx + dx + Math.sin((y / BARK_H) * TAU * 2 + k * 1.9) * 3.5 + Math.sin((y / BARK_H) * TAU * 5 + k) * 1.2;
            if (y === -4) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.strokeStyle = col;
          g.lineWidth = lw;
          g.stroke();
        };
        crack(0, 5.5, 'rgba(40,20,6,0.5)');
        crack(-1.5, 2, 'rgba(20,8,2,0.55)');
        crack(4, 1.6, 'rgba(255,220,170,0.22)');
      }
      // des petits ponts entre les crêtes, et du lichen
      for (let i = 0; i < 9; i++) {
        const x = 6 + hash(i * 3.3) * 84;
        const y = hash(i * 7.1) * BARK_H;
        g.strokeStyle = 'rgba(40,20,6,0.4)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 7 + hash(i) * 6, y + 2);
        g.stroke();
      }
      for (let i = 0; i < 4; i++) {
        g.fillStyle = i % 2 ? 'rgba(170,200,120,0.45)' : 'rgba(210,220,160,0.35)';
        ellipsePath(g, 10 + hash(i * 5.7) * 76, 20 + hash(i * 2.9) * 150, 4 + hash(i) * 4, 3 + hash(i + 1) * 3);
        g.fill();
      }
    });
  }

  // Le Vieux Chêne vu de dehors (dans le monde, entre x0 et x1 ; camY : le haut de l'écran) : un tronc immense
  // couvert d'écorce, avec du lierre, de la mousse en bas, de grosses racines qui s'enfoncent dans l'herbe, et la
  // porte : un grand trou en arche (door : où il est ; on voit l'intérieur à travers). alpha : il s'efface quand
  // Malice entre.
  function oakFacade(ctx, x0, x1, camY, door, alpha, t) {
    const y0 = camY - 10;
    const y1 = camY + VIEW_H + 10;
    const dw = 2 * TILE;
    const ground = door.y1;
    ctx.save();
    ctx.globalAlpha = alpha;
    // les racines, posées sur l'herbe devant le tronc
    if (ground > y0 && ground - 120 < y1) {
      // (de grosses racines rondes, qui s'amincissent en plongeant dans l'herbe)
      for (const [len, th, k] of [[120, 26, 0], [70, 18, 1]]) {
        const rx = x0 + 10;
        const top = ground - 30 - k * 4;
        ctx.fillStyle = k ? '#6e4426' : '#7c4e2c';
        ctx.beginPath();
        ctx.moveTo(rx + 20, top - th);
        ctx.bezierCurveTo(rx - len * 0.35, top - th * 0.8, rx - len * 0.75, ground - 8, rx - len, ground + 3);
        ctx.lineTo(rx - len + 10, ground + 4);
        ctx.bezierCurveTo(rx - len * 0.6, ground + 2, rx - len * 0.25, top + th * 0.5, rx + 20, top + th);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,170,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx + 14, top - th + 4);
        ctx.bezierCurveTo(rx - len * 0.35, top - th * 0.6, rx - len * 0.72, ground - 10, rx - len + 4, ground);
        ctx.stroke();
      }
    }
    // le tronc (sans la porte : on voit l'intérieur à travers)
    const arch = () => {
      ctx.moveTo(door.x, ground);
      ctx.lineTo(door.x, door.y0 + 44);
      ctx.quadraticCurveTo(door.x, door.y0 - 6, door.x + dw / 2, door.y0 - 8);
      ctx.quadraticCurveTo(door.x + dw, door.y0 - 6, door.x + dw, door.y0 + 44);
      ctx.lineTo(door.x + dw, ground);
      ctx.closePath();
    };
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    arch();
    ctx.save();
    ctx.clip('evenodd');
    const gr = ctx.createLinearGradient(x0, 0, x0 + 700, 0);
    gr.addColorStop(0, '#8e5c34');
    gr.addColorStop(0.4, '#74482a');
    gr.addColorStop(1, '#4e2f1a');
    ctx.fillStyle = gr;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    const img = oakBarkSprite();
    const by0 = Math.floor(y0 / BARK_H) * BARK_H;
    for (let x = x0; x < x1; x += BARK_W) {
      for (let y = by0; y < y1; y += BARK_H) ctx.drawImage(img, x, y, BARK_W, BARK_H);
    }
    // le bord gauche du tronc, éclairé
    const edge = ctx.createLinearGradient(x0, 0, x0 + 26, 0);
    edge.addColorStop(0, 'rgba(255,220,160,0.35)');
    edge.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.fillStyle = edge;
    ctx.fillRect(x0, y0, 26, y1 - y0);
    // de la mousse en bas du tronc
    if (ground > y0 && ground - 140 < y1) {
      for (let i = 0; i < 16; i++) {
        const mx = x0 + 100 + hash(i * 2.3) * Math.min(900, x1 - x0 - 100);
        const mh = 10 + hash(i * 4.1) * 22;
        ctx.fillStyle = i % 3 ? 'rgba(96,160,64,0.7)' : 'rgba(140,195,85,0.65)';
        ellipsePath(ctx, mx, ground - mh * 0.4, 10 + hash(i) * 16, mh * 0.5);
        ctx.fill();
      }
    }
    // du lierre qui grimpe
    for (let k = 0; k < 3; k++) {
      const ix = x0 + 170 + k * 260;
      if (ix > x1 - 20) break;
      ctx.strokeStyle = '#3a6a2a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let y = ground; y > ground - 900; y -= 12) {
        const x = ix + Math.sin(y * 0.02 + k * 2) * 14;
        if (y === ground) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let y = ground - 10; y > ground - 900; y -= 22) {
        if (y > y1 || y < y0) continue;
        const x = ix + Math.sin(y * 0.02 + k * 2) * 14;
        const s = (Math.floor(y / 22) % 2 ? 1 : -1);
        leaf(ctx, x, y, s > 0 ? -0.4 + Math.sin(t * 2 + y) * 0.08 : Math.PI + 0.4, 1.2, s > 0 ? '#4f9a3a' : '#3f8a32');
      }
    }
    ctx.restore();
    // l'intérieur sombre de la porte, et son bord
    ctx.beginPath();
    arch();
    const dg = ctx.createLinearGradient(door.x, 0, door.x + dw, 0);
    dg.addColorStop(0, 'rgba(20,8,2,0.55)');
    dg.addColorStop(1, 'rgba(20,8,2,0.15)');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = '#3a2210';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,215,150,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // un petit gland sculpté au-dessus de la porte
    const sx = door.x + dw / 2;
    const sy = door.y0 - 34;
    if (sy > y0 - 30 && sy < y1) {
      ctx.fillStyle = '#5a3418';
      ellipsePath(ctx, sx, sy + 4, 9, 11);
      ctx.fill();
      ctx.fillStyle = '#c88a4a';
      ellipsePath(ctx, sx, sy + 5, 6.5, 8);
      ctx.fill();
      ctx.fillStyle = '#6a4020';
      roundRectPath(ctx, sx - 9, sy - 6, 18, 8, 4);
      ctx.fill();
      ctx.fillRect(sx - 1, sy - 11, 2, 6);
    }
    ctx.restore();
  }

  // Le fond du tronc creux (dessiné une fois, puis recopié) : du bois sombre avec de longues veines qui montent,
  // des nœuds, un peu de mousse et de tout petits champignons.
  const OAKWALL = 384;
  function oakWallSprite() {
    return sprite('oakWall', OAKWALL, OAKWALL, (g) => {
      const S = OAKWALL;
      g.fillStyle = '#4b2e19';
      g.fillRect(0, 0, S, S);
      g.lineCap = 'round';
      // les veines du bois (elles se raccordent en haut et en bas : le motif se répète)
      for (let k = 0; k < 16; k++) {
        const bx = (k + 0.5) * (S / 16) + (hash(k * 1.7) - 0.5) * 8;
        const amp = 3 + hash(k * 3.1) * 5;
        g.beginPath();
        for (let y = 0; y <= S; y += 8) {
          const x = bx + Math.sin((y / S) * TAU * (1 + (k % 3)) + k) * amp;
          if (y === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.strokeStyle = k % 2 ? 'rgba(30,14,4,0.45)' : 'rgba(120,75,40,0.35)';
        g.lineWidth = k % 2 ? 3.5 : 6;
        g.stroke();
      }
      // des nœuds dans le bois, et les cernes autour
      for (let i = 0; i < 4; i++) {
        const x = 40 + hash(i * 9.1) * (S - 80);
        const y = 40 + hash(i * 4.3) * (S - 80);
        for (let r = 4; r >= 1; r--) {
          g.strokeStyle = r % 2 ? 'rgba(30,14,4,0.4)' : 'rgba(140,90,50,0.3)';
          g.lineWidth = 2;
          ellipsePath(g, x, y, 4 + r * 4, 7 + r * 6);
          g.stroke();
        }
        g.fillStyle = 'rgba(25,10,2,0.7)';
        ellipsePath(g, x, y, 4, 7);
        g.fill();
      }
      // de la mousse, et de tout petits champignons qui brillent un peu
      for (let i = 0; i < 6; i++) {
        const x = hash(i * 2.2 + 1) * S;
        const y = hash(i * 6.6 + 2) * S;
        g.fillStyle = 'rgba(90,140,60,0.28)';
        for (let k = 0; k < 3; k++) {
          ellipsePath(g, x - 10 + k * 10, y + (k % 2) * 3, 8 + hash(i + k) * 6, 4 + hash(i + k + 3) * 3);
          g.fill();
        }
        if (i !== 1) continue;
        // (une petite touffe de champignons qui sortent du bois, tout doucement lumineux)
        const gl = g.createRadialGradient(x, y - 6, 0, x, y - 6, 22);
        gl.addColorStop(0, 'rgba(190,255,215,0.28)');
        gl.addColorStop(1, 'rgba(190,255,215,0)');
        g.fillStyle = gl;
        circlePath(g, x, y - 6, 22);
        g.fill();
        for (const [dx, h, r] of [[-7, 8, 4.5], [1, 12, 6], [8, 6, 3.5]]) {
          g.fillStyle = 'rgba(225,250,235,0.8)';
          g.fillRect(x + dx - 1, y - h, 2, h);
          g.fillStyle = '#c8f6e0';
          g.beginPath();
          g.ellipse(x + dx, y - h, r, r * 0.7, 0, Math.PI, 0);
          g.closePath();
          g.fill();
          g.fillStyle = 'rgba(255,255,255,0.7)';
          ellipsePath(g, x + dx - r * 0.3, y - h - r * 0.35, r * 0.35, r * 0.18);
          g.fill();
        }
      }
    });
  }

  // Un rayon de soleil qui entre par un trou du tronc et descend en biais (dessiné une fois).
  function oakBeamSprite() {
    return sprite('oakBeam', 260, 520, (g) => {
      g.beginPath();
      g.moveTo(14, 8);
      g.lineTo(38, 4);
      g.lineTo(250, 510);
      g.lineTo(150, 516);
      g.closePath();
      const gr = g.createLinearGradient(20, 0, 200, 500);
      gr.addColorStop(0, 'rgba(255,240,180,0.5)');
      gr.addColorStop(0.5, 'rgba(255,230,160,0.18)');
      gr.addColorStop(1, 'rgba(255,230,160,0)');
      g.fillStyle = gr;
      g.fill();
    });
  }

  // Le haut du Vieux Chêne, au-dessus du bord du tronc (largeur w, dessiné une fois) : de grosses touffes de
  // feuilles, plus claires devant.
  function oakCanopySprite() {
    return sprite('oakCanopy', 480, 230, (g) => {
      const layers = [['#2f6a32', 150, 46], ['#3f8a3a', 105, 40], ['#58a844', 62, 32]];
      g.fillStyle = '#24562a';
      g.fillRect(0, 0, 480, 110);
      for (const [col, by, r] of layers) {
        g.fillStyle = col;
        for (let i = -1; i <= 9; i++) {
          const x = i * 54 + hash(i * 3.7 + by) * 20;
          const y = by - 30 + hash(i * 1.9 + by) * 26;
          circlePath(g, ((x % 480) + 480) % 480, y, r + hash(i + by) * 12);
          g.fill();
          circlePath(g, ((x % 480) + 480) % 480 - 480, y, r + hash(i + by) * 12);
          g.fill();
          circlePath(g, ((x % 480) + 480) % 480 + 480, y, r + hash(i + by) * 12);
          g.fill();
        }
      }
      // des reflets
      g.fillStyle = 'rgba(200,255,150,0.25)';
      for (let i = 0; i < 12; i++) {
        ellipsePath(g, hash(i * 5.1) * 480, 30 + hash(i * 2.3) * 70, 10, 5, -0.4);
        g.fill();
      }
    });
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

  // ---------- Le Phare sur la Falaise ----------
  // Un paratonnerre : sa plaque de métal (x, y : le haut de la plaque ; w : sa largeur), sa pointe au milieu, et
  // l'orage qui l'électrise. state : 'rest' (tranquille), 'warn' (ça s'annonce : le petit nuage grossit au-dessus,
  // la plaque jaunit en clignotant de plus en plus vite), 'zap' (la foudre tombe sur la pointe, et la plaque grésille) ;
  // u : de 0 à 1 dans cet état.
  // Le ciel au-dessus d'un paratonnerre (dessiné derrière les cases : sous un palier, le palier le cache) : le petit
  // nuage en chocolat qui se forme et gronde quand ça s'annonce, et la foudre qui tombe sur la pointe (cloud : false
  // pour ne pas dessiner le petit nuage, caché par ce qui est au-dessus).
  function lightningRodSky(ctx, x, y, w, state, u, t, seed, cloud) {
    if (state === 'rest') return;
    const mx = x + w / 2;
    const tipY = y - 66;
    const k = state === 'warn' ? u : 1;
    const cy = y - 142;
    ctx.save();
    ctx.globalAlpha = state === 'zap' ? Math.min(1, (1 - u) * 3) : Math.min(1, u * 5);
    const glow = ctx.createRadialGradient(mx, cy, 4, mx, cy, 44 + 44 * k);
    glow.addColorStop(0, `rgba(255,240,120,${0.3 + 0.45 * k})`);
    glow.addColorStop(1, 'rgba(255,240,120,0)');
    ctx.fillStyle = glow;
    circlePath(ctx, mx, cy, 44 + 44 * k);
    ctx.fill();
    const sh = state === 'warn' ? Math.sin(t * 40) * 2.5 * k : 0;
    if (cloud) fluffyCloud(ctx, mx + sh, cy, 0.36 + 0.34 * k, '#8a5638', '#4a2818');
    ctx.restore();
    if (state === 'zap' && u < 0.35) bolt(ctx, mx, cy + 16, tipY - 4, seed + Math.floor(t * 30), 1 - u / 0.35);
  }

  function lightningRod(ctx, x, y, w, state, u, t, seed) {
    const mx = x + w / 2;
    const tipY = y - 66;
    const hot = state === 'zap' ? 1 : state === 'warn' ? u * (0.6 + 0.4 * Math.sin(t * (7 + 24 * u))) : 0;
    // quand ça s'annonce, toute la plaque luit de plus en plus (en clignotant)
    if (hot > 0.05) {
      const pg = ctx.createLinearGradient(0, y - 26, 0, y + 30);
      pg.addColorStop(0, 'rgba(255,240,120,0)');
      pg.addColorStop(0.55, `rgba(255,240,120,${0.5 * hot})`);
      pg.addColorStop(1, 'rgba(255,240,120,0)');
      ctx.fillStyle = pg;
      ctx.fillRect(x - 10, y - 26, w + 20, 56);
    }
    // la pointe : une tige en cuivre, deux bagues en verre, une boule et une pointe
    const metal = Art.mixColor('#c98a3a', '#fff6a0', hot);
    if (hot > 0.05) {
      const gl = ctx.createRadialGradient(mx, tipY, 2, mx, tipY, 14 + 22 * hot);
      gl.addColorStop(0, `rgba(255,250,190,${0.8 * hot})`);
      gl.addColorStop(1, 'rgba(255,250,190,0)');
      ctx.fillStyle = gl;
      circlePath(ctx, mx, tipY, 14 + 22 * hot);
      ctx.fill();
    }
    ctx.strokeStyle = '#6a4220';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx, y);
    ctx.lineTo(mx, tipY + 10);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    for (const by of [y - 16, y - 30]) {
      ctx.fillStyle = '#5fb8a8';
      ellipsePath(ctx, mx, by, 7, 3.2);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,255,250,0.8)';
      ellipsePath(ctx, mx - 2, by - 1, 3, 1.2);
      ctx.fill();
    }
    ctx.fillStyle = metal;
    ctx.strokeStyle = '#6a4220';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx - 3, tipY + 6);
    ctx.lineTo(mx, tipY - 6);
    ctx.lineTo(mx + 3, tipY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    circlePath(ctx, mx, tipY + 9, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circlePath(ctx, mx - 1.5, tipY + 7.5, 1.6);
    ctx.fill();
    // la plaque : du métal riveté, avec deux petits boulons dessous
    const steel = Art.mixColor('#8d97b8', '#ffe45a', hot);
    const steelD = Art.mixColor('#4f5878', '#d08a1a', hot);
    const steelL = Art.mixColor('#d4dbf0', '#fffbd0', hot);
    ctx.fillStyle = steelD;
    for (const bx of [x + 14, x + w - 14]) {
      roundRectPath(ctx, bx - 5, y + 12, 10, 10, 3);
      ctx.fill();
    }
    const gr = ctx.createLinearGradient(0, y, 0, y + 16);
    gr.addColorStop(0, steelL);
    gr.addColorStop(0.35, steel);
    gr.addColorStop(1, steelD);
    ctx.fillStyle = gr;
    roundRectPath(ctx, x + 1, y, w - 2, 16, 5);
    ctx.fill();
    ctx.save();
    roundRectPath(ctx, x + 1, y, w - 2, 16, 5);
    ctx.clip();
    ctx.strokeStyle = `rgba(40,40,70,${0.25 - 0.1 * hot})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let sx = x - 10; sx < x + w + 10; sx += 10) {
      ctx.moveTo(sx, y + 16);
      ctx.lineTo(sx + 10, y + 4);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = steelD;
    for (let rx = x + 10; rx < x + w - 4; rx += 24) {
      circlePath(ctx, rx, y + 8, 2.2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    roundRectPath(ctx, x + 6, y + 1.5, w - 12, 2.5, 1.2);
    ctx.fill();
    if (state === 'warn' && u > 0.55) {
      // les premiers petits arcs qui courent sur la plaque
      rodArcs(ctx, x, w, y, seed + Math.floor(t * 16), (u - 0.55) / 0.45 * 0.6, 7);
    }
    if (state === 'zap') {
      // la plaque grésille (la foudre, elle, est dessinée avec le ciel : voir lightningRodSky)
      const a = Math.min(1, (1 - u) * 6);
      const gl = ctx.createLinearGradient(0, y - 30, 0, y + 16);
      gl.addColorStop(0, 'rgba(255,250,170,0)');
      gl.addColorStop(1, `rgba(255,250,170,${0.55 * a})`);
      ctx.fillStyle = gl;
      ctx.fillRect(x, y - 30, w, 46);
      rodArcs(ctx, x, w, y, seed + Math.floor(t * 24), a, 15);
      Art.sparks(ctx, mx, tipY + 4, 26, seed + Math.floor(t * 20), a);
    }
  }

  // De petits arcs électriques qui courent sur la plaque (k : leur force, h : jusqu'où ils sautent au-dessus).
  function rodArcs(ctx, x, w, y, seed, k, h) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const n = Math.max(2, Math.round(w / 40));
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? `rgba(120,210,255,${0.55 * k})` : `rgba(255,255,240,${k})`;
      ctx.lineWidth = pass === 0 ? 5 : 1.8;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const xa = x + 6 + hash(seed + i * 3.3) * (w - 30);
        const len = 18 + hash(seed * 1.7 + i) * 26;
        ctx.moveTo(xa, y + 1);
        for (let j = 1; j <= 5; j++) {
          ctx.lineTo(Math.min(x + w - 4, xa + len * j / 5), y + 1 - hash(seed * 2.3 + i * 5 + j) * h * (j < 5 ? 1 : 0.2));
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Un éclair en zigzag, de (x, y0) jusqu'à (x, y1) (k : sa force, de 0 à 1).
  function bolt(ctx, x, y0, y1, seed, k) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const pts = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const j = i === 0 || i === n ? 0 : (hash(seed + i * 4.1) - 0.5) * 26;
      pts.push([x + j, y0 + (y1 - y0) * i / n]);
    }
    for (const [col, lw] of [[`rgba(255,230,90,${0.5 * k})`, 12], [`rgba(255,250,200,${0.9 * k})`, 5], [`rgba(255,255,255,${k})`, 2]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
    }
    ctx.restore();
  }

  // La tour du phare (rayée blanc et rouge, en grosses pierres) : un morceau de LH_BAND de haut, dessiné une fois,
  // qu'on répète du haut en bas. Elle est ronde : les rayures et les joints s'arrondissent vers le bas sur les bords
  // (bow), les pierres rétrécissent sur les côtés, et la lumière vient de la gauche.
  const LH_BAND = 288;
  function lighthouseBand(w) {
    return sprite(`lh:${w}`, w, LH_BAND, (g) => {
      const H = LH_BAND / 2;
      const bow = (x) => 12 * Math.pow((x - w / 2) / (w / 2), 2);
      const curve = (y, back) => {
        for (let x = back ? w : 0; back ? x >= 0 : x <= w; x += back ? -12 : 12) g.lineTo(x, y + bow(x));
      };
      g.fillStyle = '#f4eef8';
      g.fillRect(0, 0, w, LH_BAND);
      // la rayure rouge (et le bas de celle d'au-dessus, qui déborde en haut)
      g.fillStyle = '#e0525e';
      g.beginPath();
      g.moveTo(0, H);
      curve(H, false);
      curve(LH_BAND, true);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, 0);
      curve(0, true);
      g.closePath();
      g.fill();
      // les pierres : des joints arrondis tous les 36 pixels, et des pierres plus étroites sur les côtés
      for (let ry = 0; ry < LH_BAND; ry += 36) {
        g.strokeStyle = ry >= H ? 'rgba(120,20,40,0.35)' : 'rgba(120,100,160,0.3)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(0, ry);
        curve(ry, false);
        const off = (ry / 36) % 2 ? 0.14 : 0;
        for (let a = -1.5 + off; a < 1.5; a += 0.28) {
          const x = w / 2 + Math.sin(a) * w / 2;
          g.moveTo(x, ry + bow(x));
          g.lineTo(x, ry + 36 + bow(x));
        }
        g.stroke();
      }
      // ronde : claire à gauche, dans l'ombre à droite, et un trait sombre sur les deux bords
      const gr = g.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, 'rgba(60,40,110,0.45)');
      gr.addColorStop(0.1, 'rgba(255,255,255,0.12)');
      gr.addColorStop(0.25, 'rgba(255,255,255,0.22)');
      gr.addColorStop(0.45, 'rgba(255,255,255,0)');
      gr.addColorStop(0.75, 'rgba(40,20,80,0.14)');
      gr.addColorStop(1, 'rgba(40,20,80,0.55)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, LH_BAND);
      g.fillStyle = '#4a3c6e';
      g.fillRect(0, 0, 3, LH_BAND);
      g.fillRect(w - 3, 0, 3, LH_BAND);
    });
  }

  // Le phare : sa tour (de x0 à x1, du haut de sa galerie, top, jusqu'à son pied, foot), ses petites fenêtres, et tout
  // en haut, au-dessus de la galerie, sa lanterne et sa grande lumière qui tourne (ang : voir World.beamAngle).
  function lighthouse(ctx, x0, x1, top, foot, camY, t, ang) {
    const w = x1 - x0;
    const cx = (x0 + x1) / 2;
    const ya = Math.max(top, camY - 20);
    const yb = Math.min(foot, camY + VIEW_H + 20);
    if (yb > ya) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, ya, w, yb - ya);
      ctx.clip();
      const band = lighthouseBand(w);
      for (let y = top + Math.floor((ya - top) / LH_BAND) * LH_BAND; y < yb; y += LH_BAND) ctx.drawImage(band, x0, y, w, LH_BAND);
      ctx.restore();
      // les petites fenêtres (une lumière chaude derrière)
      for (let k = 0, y = top + 230; y < foot - 160; k++, y += 430) {
        if (y + 60 < ya || y - 60 > yb) continue;
        const wx = cx + (k % 2 ? 150 : -170);
        roundRectPath(ctx, wx - 21, y - 34, 42, 66, 21);
        ctx.fillStyle = '#5a4a7a';
        ctx.fill();
        roundRectPath(ctx, wx - 15, y - 28, 30, 56, 15);
        const wl = ctx.createLinearGradient(0, y - 28, 0, y + 28);
        wl.addColorStop(0, '#ffe7a0');
        wl.addColorStop(1, '#f2a35a');
        ctx.fillStyle = wl;
        ctx.fill();
        ctx.fillStyle = '#5a4a7a';
        ctx.fillRect(wx - 1.5, y - 28, 3, 56);
        ctx.fillRect(wx - 15, y - 2, 30, 3);
      }
      // le socle de pierre, en bas
      if (foot + 10 > ya && foot - 90 < yb) {
        ctx.fillStyle = '#8a82a8';
        roundRectPath(ctx, x0 - 20, foot - 58, w + 40, 62, 8);
        ctx.fill();
        ctx.fillStyle = '#6a6290';
        for (let k = 0; k < 2; k++) {
          const y = foot - 46 + k * 24;
          ctx.fillRect(x0 - 20, y + 20, w + 40, 2);
          for (let jx = x0 - 20 + (k ? 30 : 60); jx < x1 + 16; jx += 60) ctx.fillRect(jx, y - 2, 2, 24);
        }
        ctx.fillStyle = '#c8c1e0';
        roundRectPath(ctx, x0 - 26, foot - 62, w + 52, 14, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(x0 - 22, foot - 60, w + 44, 3);
      }
    }
    // tout en haut : les consoles sous la galerie, la lanterne et la lumière (plus bas, on ne voit que les faisceaux)
    if (camY > top + 120 || camY + VIEW_H < top - 420) {
      if (camY + VIEW_H > top - 1400 && camY < top + 900) beams(ctx, cx, top - 104, ang, null);
      return;
    }
    // (des consoles de pierre toutes rondes, sous la galerie)
    for (let bx = x0 + 22; bx < x1 - 10; bx += 56) {
      ctx.fillStyle = '#8a82a8';
      ctx.beginPath();
      ctx.moveTo(bx - 14, top + 46);
      ctx.lineTo(bx + 14, top + 46);
      ctx.lineTo(bx + 14, top + 58);
      ctx.quadraticCurveTo(bx + 14, top + 78, bx, top + 78);
      ctx.quadraticCurveTo(bx - 14, top + 78, bx - 14, top + 58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(bx - 12, top + 48, 4, 18);
    }
    lantern(ctx, cx, top, t, ang);
  }

  // Les deux faisceaux de la grande lumière (back : seulement ceux qui partent derrière la lanterne, true, ou devant,
  // false ; null : tous).
  function beams(ctx, x, y, ang, back) {
    for (const a of [ang, ang + Math.PI]) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      if (back !== null && (s < 0) !== back) continue;
      const len = 120 + 1500 * Math.abs(c);
      const dir = Math.sign(c) || 1;
      const tx = x + dir * len;
      const ty = y + 60 * s;
      const half = 18 + 0.16 * len;
      const al = 0.16 + 0.22 * Math.max(0, s);
      const gr = ctx.createLinearGradient(x, y, tx, ty);
      gr.addColorStop(0, `rgba(255,248,200,${al})`);
      gr.addColorStop(1, 'rgba(255,248,200,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(tx, ty - half);
      ctx.lineTo(tx, ty + half);
      ctx.lineTo(x, y + 16);
      ctx.closePath();
      ctx.fill();
    }
  }

  // La lanterne, sur la galerie (y : le haut de la galerie) : la salle de veille (rouge), la cage de verre avec la grande
  // lampe, le dôme, et un paratonnerre tout en haut.
  function lantern(ctx, cx, y, t, ang) {
    const ly = y - 104;
    const face = Math.pow(Math.abs(Math.sin(ang)), 8);
    beams(ctx, cx, ly, ang, true);
    // la salle de veille
    ctx.fillStyle = '#b8344a';
    roundRectPath(ctx, cx - 118, y - 46, 236, 48, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(cx - 112, y - 44, 60, 44);
    ctx.fillStyle = '#ffd98a';
    for (const px of [-70, 0, 70]) {
      circlePath(ctx, cx + px, y - 22, 8);
      ctx.fill();
    }
    // la petite rambarde
    ctx.strokeStyle = '#3e3456';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 132, y - 62);
    ctx.lineTo(cx + 132, y - 62);
    for (let px = -132; px <= 132; px += 22) {
      ctx.moveTo(cx + px, y - 62);
      ctx.lineTo(cx + px, y - 46);
    }
    ctx.stroke();
    // la cage de verre, et la grande lampe
    ctx.fillStyle = '#2e2850';
    roundRectPath(ctx, cx - 82, y - 172, 164, 128, 6);
    ctx.fill();
    const glow = ctx.createRadialGradient(cx, ly, 6, cx, ly, 70 + 40 * face);
    glow.addColorStop(0, '#fffbe0');
    glow.addColorStop(0.35, 'rgba(255,236,140,0.85)');
    glow.addColorStop(1, 'rgba(255,200,90,0.15)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 76, y - 166, 152, 116);
    // la lentille qui tourne (une bande claire qui passe)
    const lx = cx + Math.cos(ang) * 50;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * Math.abs(Math.sin(ang))})`;
    ctx.fillRect(lx - 10, y - 160, 20, 104);
    ctx.fillStyle = '#fff9d8';
    circlePath(ctx, cx, ly, 20);
    ctx.fill();
    ctx.strokeStyle = '#3e3456';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const px of [-41, 0, 41]) {
      ctx.moveTo(cx + px, y - 170);
      ctx.lineTo(cx + px, y - 46);
    }
    ctx.moveTo(cx - 82, y - 108);
    ctx.lineTo(cx + 82, y - 108);
    ctx.stroke();
    ctx.lineWidth = 6;
    roundRectPath(ctx, cx - 82, y - 172, 164, 128, 6);
    ctx.stroke();
    // le dôme, la boule, et le paratonnerre tout en haut
    ctx.fillStyle = '#c23a50';
    ctx.beginPath();
    ctx.moveTo(cx - 100, y - 168);
    ctx.quadraticCurveTo(cx - 92, y - 240, cx, y - 246);
    ctx.quadraticCurveTo(cx + 92, y - 240, cx + 100, y - 168);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(cx - 80, y - 172);
    ctx.quadraticCurveTo(cx - 70, y - 226, cx - 20, y - 238);
    ctx.quadraticCurveTo(cx - 54, y - 214, cx - 58, y - 172);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3e3456';
    roundRectPath(ctx, cx - 108, y - 176, 216, 10, 5);
    ctx.fill();
    circlePath(ctx, cx, y - 252, 11);
    ctx.fill();
    ctx.strokeStyle = '#c98a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, y - 260);
    ctx.lineTo(cx, y - 300);
    ctx.stroke();
    // quand elle est tournée vers nous : un grand halo
    if (face > 0.02) {
      const h = ctx.createRadialGradient(cx, ly, 10, cx, ly, 260);
      h.addColorStop(0, `rgba(255,252,220,${0.75 * face})`);
      h.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = h;
      circlePath(ctx, cx, ly, 260);
      ctx.fill();
    }
    beams(ctx, cx, ly, ang, false);
  }

  // Le phare, tout petit, au loin (depuis la falaise : on voit où l'on va) : sur sa pointe de rocher au bord de la mer
  // (x : le milieu de la tour ; hy : l'horizon), sa tour rayée, sa lanterne et sa lumière qui tourne (ang : voir
  // World.beamAngle) ; a : de 1 (bien visible) à 0 (on ne le voit plus).
  function farLighthouse(ctx, x, hy, ang, a) {
    ctx.save();
    ctx.globalAlpha = a;
    // les deux faisceaux (derrière la tour quand ils partent vers le fond)
    const ly = hy - 132;
    const ray = (back) => {
      for (const b of [ang, ang + Math.PI]) {
        const c = Math.cos(b);
        const sn = Math.sin(b);
        if ((sn < 0) !== back) continue;
        const len = 20 + 230 * Math.abs(c);
        const tx = x + (Math.sign(c) || 1) * len;
        const half = 3 + 0.16 * len;
        const gr = ctx.createLinearGradient(x, ly, tx, ly);
        gr.addColorStop(0, `rgba(255,248,200,${0.35 + 0.3 * Math.max(0, sn)})`);
        gr.addColorStop(1, 'rgba(255,248,200,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(x, ly - 3);
        ctx.lineTo(tx, ly - half);
        ctx.lineTo(tx, ly + half);
        ctx.lineTo(x, ly + 3);
        ctx.closePath();
        ctx.fill();
      }
    };
    ray(true);
    // la pointe de rocher
    ctx.fillStyle = '#3a2f6e';
    ctx.beginPath();
    ctx.moveTo(x - 120, hy + 2);
    ctx.quadraticCurveTo(x - 70, hy - 14, x - 34, hy - 30);
    ctx.lineTo(x + 30, hy - 34);
    ctx.quadraticCurveTo(x + 52, hy - 18, x + 84, hy + 2);
    ctx.closePath();
    ctx.fill();
    // la tour : un peu plus étroite en haut, rayée blanc et rouge (pâlis par la distance)
    const yb = hy - 30;
    const yt = hy - 116;
    const half = (y) => 13 - 4 * (yb - y) / (yb - yt);
    const band = (y0, y1) => {
      ctx.beginPath();
      ctx.moveTo(x - half(y0), y0);
      ctx.lineTo(x + half(y0), y0);
      ctx.lineTo(x + half(y1), y1);
      ctx.lineTo(x - half(y1), y1);
      ctx.closePath();
      ctx.fill();
    };
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = k % 2 ? '#c46a8e' : '#e8dcf2';
      band(yb - (yb - yt) * k / 6, yb - (yb - yt) * (k + 1) / 6);
    }
    ctx.fillStyle = 'rgba(40,20,80,0.3)';
    ctx.beginPath();
    ctx.moveTo(x + 2, yb);
    ctx.lineTo(x + half(yb), yb);
    ctx.lineTo(x + half(yt), yt);
    ctx.lineTo(x + 1, yt);
    ctx.closePath();
    ctx.fill();
    // la galerie, la lanterne (sa lampe allumée) et le dôme
    ctx.fillStyle = '#4a3c6e';
    ctx.fillRect(x - 14, yt - 3, 28, 4);
    ctx.fillRect(x - 7, yt - 22, 14, 19);
    const glow = ctx.createRadialGradient(x, ly, 1, x, ly, 22);
    glow.addColorStop(0, 'rgba(255,250,215,0.95)');
    glow.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = glow;
    circlePath(ctx, x, ly, 22);
    ctx.fill();
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x - 4, yt - 19, 8, 12);
    ctx.fillStyle = '#b8344a';
    ctx.beginPath();
    ctx.moveTo(x - 9, yt - 21);
    ctx.quadraticCurveTo(x, yt - 34, x + 9, yt - 21);
    ctx.closePath();
    ctx.fill();
    ray(false);
    ctx.restore();
  }

  // La mer, au loin (autour du Phare sur la Falaise) : l'horizon, et des vagues qui roulent.
  function farSea(ctx, cx, hy, t) {
    const g = ctx.createLinearGradient(0, hy, 0, VIEW_H);
    g.addColorStop(0, '#6a5aa6');
    g.addColorStop(0.25, '#4b3f88');
    g.addColorStop(1, '#2c2560');
    ctx.fillStyle = g;
    ctx.fillRect(0, hy, VIEW_W, VIEW_H - hy);
    ctx.fillStyle = 'rgba(230,220,255,0.5)';
    ctx.fillRect(0, hy, VIEW_W, 2);
    for (let k = 0; k < 7; k++) {
      const y = hy + 10 + k * k * 7;
      if (y > VIEW_H) break;
      const sp = 70 + k * 30;
      const len = 10 + k * 5;
      const off = (cx * (0.05 + k * 0.02) + t * (12 + k * 5) + k * 37) % sp;
      ctx.strokeStyle = `rgba(235,230,255,${0.25 + k * 0.06})`;
      ctx.lineWidth = 1.5 + k * 0.4;
      ctx.beginPath();
      for (let x = -off; x < VIEW_W + sp; x += sp) {
        const xx = x + hash(k * 9.1 + Math.floor((x + off) / sp)) * sp * 0.4;
        ctx.moveTo(xx, y);
        ctx.quadraticCurveTo(xx + len / 2, y - 3 - k * 0.6, xx + len, y);
      }
      ctx.stroke();
    }
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

  // Un grand champignon dans le fond (les Champignons Géants) : le pied posé en (x, y), h de haut,
  // un chapeau de w de large.
  function bgMushroom(ctx, x, y, h, w, cap, stem) {
    ctx.fillStyle = stem;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.09, y - h + 10);
    ctx.lineTo(x + w * 0.09, y - h + 10);
    ctx.lineTo(x + w * 0.13, y + 10);
    ctx.lineTo(x - w * 0.13, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h + 14);
    ctx.bezierCurveTo(x - w / 2, y - h - w * 0.45, x + w / 2, y - h - w * 0.45, x + w / 2, y - h + 14);
    ctx.quadraticCurveTo(x, y - h + 2, x - w / 2, y - h + 14);
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

  // Le gros feuillage qui cache le coin secret, tout en haut d'un arbre (voir "cachette" dans levels.js) : des touffes
  // de feuilles serrées sur w × h pixels, avec des petites fleurs. Dessiné une fois. (Les touffes du bord débordent :
  // la marge HIDEOUT_M tout autour est assez grande pour qu'aucune ne soit coupée, sinon on verrait un bord droit.)
  // (Aussi les feuillages du décor, "feuillage" dans levels.js.)
  const HIDEOUT_M = 60;
  function hideoutSprite(w, h) {
    const M = HIDEOUT_M;
    return sprite(`hideout:${w}:${h}`, w + M * 2, h + M * 2, (g) => {
      g.translate(M, M);
      const puffs = [];
      const n = Math.max(3, Math.round(w / 44));
      const m = Math.max(2, Math.round(h / 44));
      for (let j = 0; j <= m; j++) {
        for (let i = 0; i <= n; i++) {
          const v = hash2(i * 3.1, j * 7.7);
          // (le bord est bosselé, et les coins arrondis : ça ressemble à un gros arbre, pas à une boîte)
          const u = (i / n) * 2 - 1;
          const e = (j / m) * 2 - 1;
          if (u * u + e * e > 1.55) continue;
          const edge = i === 0 || j === 0 || i === n || j === m;
          puffs.push([(i / n) * w + (v - 0.5) * 16, (j / m) * h + (hash(v * 13) - 0.5) * 14, (edge ? 26 : 34) + v * 12]);
        }
      }
      g.fillStyle = '#2a8a3c';
      puffs.forEach(([x, y, r]) => { circlePath(g, x, y + 7, r); g.fill(); });
      g.fillStyle = '#44b64d';
      puffs.forEach(([x, y, r]) => { circlePath(g, x, y, r); g.fill(); });
      g.fillStyle = '#6ccf58';
      puffs.forEach(([x, y, r]) => { circlePath(g, x - r * 0.2, y - r * 0.3, r * 0.5); g.fill(); });
      for (let i = 0; i < (w * h) / 900; i++) {
        const lx = hash(i * 1.9) * w;
        const ly = hash(i * 2.3 + 5) * h;
        leaf(g, lx, ly, hash(i * 3.7) * TAU, 1, i % 3 ? '#8fe26a' : '#2f9a46');
      }
      for (let i = 0; i < (w * h) / 5000; i++) {
        const fx = hash(i * 4.1 + 2) * w;
        const fy = hash(i * 5.3 + 1) * h;
        g.fillStyle = i % 2 ? '#ffd0e6' : '#ffffff';
        for (let k = 0; k < 5; k++) {
          circlePath(g, fx + Math.cos((k / 5) * TAU) * 3, fy + Math.sin((k / 5) * TAU) * 3, 2.6);
          g.fill();
        }
        g.fillStyle = '#ffc21f';
        circlePath(g, fx, fy, 1.8);
        g.fill();
      }
    });
  }

  // Le feuillage de la cachette, sur le rectangle (x0, y0) - (x1, y1) du monde (k : de 1, tout fermé, à 0, ouvert) :
  // il frémit un peu, et s'écarte quand Malice entre.
  function hideout(ctx, x0, y0, x1, y1, k, t) {
    if (k <= 0.01) return;
    const img = hideoutSprite(x1 - x0, y1 - y0);
    const M = HIDEOUT_M;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.drawImage(img, x0 - M + Math.sin(t * 1.3) * 1.5, y0 - M + Math.sin(t * 1.7 + 1) * 1, x1 - x0 + M * 2, y1 - y0 + M * 2);
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

  // La lune de la Prairie la Nuit, à l'écran : elle glisse tout doucement vers la gauche à mesure qu'on avance,
  // et elle arrive au-dessus du grand champ du bout du niveau.
  function moonPos(cx, cy) {
    return { x: 860 - cx * 0.035, y: 92 - cy * 0.05, r: 52 };
  }

  const BG = {
    // la prairie la nuit : un ciel plein d'étoiles, une grosse lune (des corbeaux passent devant de temps
    // en temps), des collines bleu nuit avec des arbres tout ronds, des lucioles au loin, et des buissons
    // avec des petites fleurs qui brillent
    night(ctx, cx, cy, t) {
      sky(ctx, [[0, '#0a0f2e'], [0.5, '#1b2a5c'], [0.85, '#33508a'], [1, '#456aa0']]);
      const SW = VIEW_W + 200;
      for (let i = 0; i < 90; i++) {
        const x = (((hash(i * 1.71) * SW - cx * 0.02) % SW) + SW) % SW - 100;
        const y = hash(i * 3.13) * 340 - cy * 0.03;
        const a = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + hash(i) * 1.5) + i));
        ctx.fillStyle = `rgba(255,250,220,${a})`;
        if (hash(i * 7.7) < 0.12) {
          // une grosse étoile qui scintille
          const s = 3 + a * 2.5;
          ctx.beginPath();
          ctx.moveTo(x, y - s);
          ctx.quadraticCurveTo(x, y, x + s, y);
          ctx.quadraticCurveTo(x, y, x, y + s);
          ctx.quadraticCurveTo(x, y, x - s, y);
          ctx.quadraticCurveTo(x, y, x, y - s);
          ctx.fill();
        } else {
          circlePath(ctx, x, y, 1.1);
          ctx.fill();
        }
      }
      // la lune
      const m = moonPos(cx, cy);
      const hg = ctx.createRadialGradient(m.x, m.y, m.r * 0.8, m.x, m.y, m.r * 3.2);
      hg.addColorStop(0, 'rgba(255,248,210,0.32)');
      hg.addColorStop(1, 'rgba(255,248,210,0)');
      ctx.fillStyle = hg;
      circlePath(ctx, m.x, m.y, m.r * 3.2);
      ctx.fill();
      const mg = ctx.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.3, m.r * 0.1, m.x, m.y, m.r);
      mg.addColorStop(0, '#fffef2');
      mg.addColorStop(1, '#ffe9a8');
      ctx.fillStyle = mg;
      circlePath(ctx, m.x, m.y, m.r);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,196,140,0.45)';
      for (const [dx, dy, r] of [[-0.35, -0.2, 0.18], [0.28, 0.18, 0.22], [0.05, -0.48, 0.1], [-0.12, 0.42, 0.13], [0.48, -0.22, 0.09]]) {
        circlePath(ctx, m.x + dx * m.r, m.y + dy * m.r, r * m.r);
        ctx.fill();
      }
      // trois corbeaux qui passent devant la lune, de temps en temps
      const k = (t / 16) % 1;
      if (k < 0.5) {
        ctx.strokeStyle = '#141428';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < 3; i++) {
          const bx = m.x + 260 - k * 2 * 520 + i * 26;
          const by = m.y - 10 + i * 9 + Math.sin(t * 2 + i) * 4;
          const f = Math.sin(t * 9 + i * 2) * 5;
          ctx.beginPath();
          ctx.moveTo(bx - 8, by - f);
          ctx.quadraticCurveTo(bx - 3, by - 2, bx, by + 1);
          ctx.quadraticCurveTo(bx + 3, by - 2, bx + 8, by - f);
          ctx.stroke();
        }
      }
      // les collines au loin
      const off1 = cx * 0.1;
      hillPath(ctx, off1, 385 - cy * 0.08, 70, 0.004, 0.7);
      ctx.fillStyle = '#22315f';
      ctx.fill();
      const off2 = cx * 0.3;
      const b2 = 430 - cy * 0.2;
      hillPath(ctx, off2, b2, 55, 0.006, 1.3);
      stripedFill(ctx, '#1f4660', 'rgba(255,255,255,0.05)', off2);
      forEachItem(off2, 160, 3, (x, i, h) => {
        if (h < 0.55) roundTree(ctx, x, hillY(off2, x, b2, 55, 0.006, 1.3) + 4, 60 + h * 40, '#2a2a46', '#25506a', '#1c3e56');
      });
      // des lucioles, au loin
      forEachItem(off2 - t * 6, 41, 9, (x, i, h) => {
        const a = Math.max(0, Math.sin(t * (1 + h) + i * 1.7));
        if (a < 0.05) return;
        ctx.fillStyle = `rgba(230,255,140,${a * 0.85})`;
        circlePath(ctx, x, b2 - 30 + h * 90 + Math.sin(t * 1.3 + i) * 6, 1.4 + a * 0.6);
        ctx.fill();
      });
      // les buissons tout près, avec des petites fleurs qui brillent
      const off3 = cx * 0.55;
      const b3 = 480 - cy * 0.45;
      hillPath(ctx, off3, b3, 30, 0.012, 4.2);
      ctx.fillStyle = '#1d5a52';
      ctx.fill();
      forEachItem(off3, 70, 5, (x, i, h) => {
        const a = 0.6 + 0.4 * Math.sin(t * 2 + i);
        ctx.fillStyle = i & 1 ? `rgba(150,240,255,${a})` : `rgba(255,170,230,${a})`;
        circlePath(ctx, x, hillY(off3, x, b3, 30, 0.012, 4.2) + 6 + h * 10, 3);
        ctx.fill();
      });
    },

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

    // les champignons géants : la lumière dorée de la forêt, des champignons immenses au loin (de plus en
    // plus colorés en s'approchant), des fougères, et des spores qui brillent en montant tout doucement
    mushrooms(ctx, cx, cy, t) {
      sky(ctx, [[0, '#86d4c4'], [0.5, '#d2efc2'], [1, '#f6f6d4']]);
      // rayons de lumière
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#fff4c0';
      for (let i = 0; i < 4; i++) {
        const x = ((i * 330 - cx * 0.08) % 1320 + 1320) % 1320 - 160;
        ctx.beginPath();
        ctx.moveTo(x, -10);
        ctx.lineTo(x + 80, -10);
        ctx.lineTo(x + 330, VIEW_H);
        ctx.lineTo(x + 200, VIEW_H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      // tout au loin : de grands champignons pâles, dans la brume
      forEachItem(cx * 0.1, 210, 41, (x, i, h) => {
        bgMushroom(ctx, x, 440 - cy * 0.1, 200 + h * 130, 120 + h * 70, '#c4dcd0', '#b4d0c4');
      });
      ctx.fillStyle = '#a8cdb8';
      ctx.fillRect(0, 430 - cy * 0.1, VIEW_W, 200);
      // plus près : des champignons de toutes les couleurs (un peu passées)
      // (jamais bleus à pois : ceux-là, ce sont les champignons qui font rebondir)
      const cols = ['#e8a27a', '#c49ae0', '#e6c870', '#e48c8c'];
      forEachItem(cx * 0.3, 240, 43, (x, i, h) => {
        const col = cols[Math.floor(h * 50) % cols.length];
        bgMushroom(ctx, x, 480 - cy * 0.25, 150 + h * 120, 90 + h * 60, col, '#e8dcc4');
      });
      ctx.fillStyle = '#5f9a6a';
      ctx.fillRect(0, 470 - cy * 0.25, VIEW_W, 200);
      // des fougères tout près
      forEachItem(cx * 0.55, 130, 47, (x, i, h) => {
        if (h < 0.35) return;
        const by = 530 - cy * 0.45;
        ctx.fillStyle = '#3f8a52';
        for (let k = -2; k <= 2; k++) {
          ctx.save();
          ctx.translate(x, by);
          ctx.rotate(k * 0.42 + Math.sin(t * 1.3 + i) * 0.04);
          ellipsePath(ctx, 0, -34 - h * 20, 9, 36 + h * 20);
          ctx.fill();
          ctx.restore();
        }
      });
      // les spores qui brillent
      for (let i = 0; i < 16; i++) {
        const x = ((hash(i * 1.7) * VIEW_W + Math.sin(t * 0.6 + i) * 30 - cx * 0.35) % VIEW_W + VIEW_W) % VIEW_W;
        const y = VIEW_H - ((t * (12 + hash(i + 3) * 14) + hash(i + 9) * VIEW_H) % (VIEW_H + 40));
        const a = 0.35 + 0.35 * Math.sin(t * 2.5 + i);
        ctx.fillStyle = i % 3 ? `rgba(255,250,190,${a})` : `rgba(190,240,255,${a})`;
        circlePath(ctx, x, y, 2.2);
        ctx.fill();
      }
    },

    // le sous-bois du Défi du Super Saut : la forêt (ses rayons de lumière, ses grands arbres, ses lianes) avec de grands
    // champignons pâles au loin. Le niveau est bien plus haut que l'écran (cy : 84 tout en bas, comme un niveau ordinaire,
    // et de moins en moins en montant) : tout en haut, on est au-dessus des arbres du fond.
    sousbois(ctx, cx, cy, t) {
      sky(ctx, [[0, '#7fd6c0'], [0.5, '#c8efc8'], [1, '#effbd8']]);
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
      // tout au loin : de grands champignons pâles, dans la brume
      forEachItem(cx * 0.1, 230, 61, (x, i, h) => {
        bgMushroom(ctx, x, 440 - cy * 0.1, 210 + h * 140, 120 + h * 70, '#c4dcd0', '#b4d0c4');
      });
      ctx.fillStyle = '#a8cdb8';
      ctx.fillRect(0, 430 - cy * 0.1, VIEW_W, 400);
      // plus près : les grands arbres de la forêt
      forEachItem(cx * 0.3, 170, 63, (x, i, h) => {
        const by = 480 - cy * 0.25;
        const th = 240 + h * 140;
        ctx.fillStyle = '#5a7a5a';
        roundRectPath(ctx, x - 13, by - th, 26, th + 100, 8);
        ctx.fill();
        ctx.fillStyle = '#3f8f5a';
        circlePath(ctx, x - 32, by - th + 10, 52);
        ctx.fill();
        circlePath(ctx, x + 32, by - th - 5, 56);
        ctx.fill();
        ctx.fillStyle = '#4fa86a';
        circlePath(ctx, x, by - th - 30, 52);
        ctx.fill();
      });
      ctx.fillStyle = '#4a8a5a';
      ctx.fillRect(0, 470 - cy * 0.25, VIEW_W, 400);
      // des fougères tout près
      forEachItem(cx * 0.55, 130, 67, (x, i, h) => {
        if (h < 0.35) return;
        const by = 530 - cy * 0.45;
        ctx.fillStyle = '#3f8a52';
        for (let k = -2; k <= 2; k++) {
          ctx.save();
          ctx.translate(x, by);
          ctx.rotate(k * 0.42 + Math.sin(t * 1.3 + i) * 0.04);
          ellipsePath(ctx, 0, -34 - h * 20, 9, 36 + h * 20);
          ctx.fill();
          ctx.restore();
        }
      });
      // des lianes qui pendent des arbres (tout en haut de l'écran)
      forEachItem(cx * 0.6, 150, 69, (x, i, h) => {
        if (h > 0.5) return;
        const len = 50 + h * 120;
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
      // les spores qui brillent en montant tout doucement
      for (let i = 0; i < 16; i++) {
        const x = ((hash(i * 1.7) * VIEW_W + Math.sin(t * 0.6 + i) * 30 - cx * 0.35) % VIEW_W + VIEW_W) % VIEW_W;
        const y = VIEW_H - ((t * (12 + hash(i + 3) * 14) + hash(i + 9) * VIEW_H) % (VIEW_H + 40));
        const a = 0.35 + 0.35 * Math.sin(t * 2.5 + i);
        ctx.fillStyle = i % 3 ? `rgba(255,250,190,${a})` : `rgba(190,240,255,${a})`;
        circlePath(ctx, x, y, 2.2);
        ctx.fill();
      }
    },

    // le marais aux cabanes : un ciel pâle tout brumeux, un soleil voilé, des cyprès et des saules qui pendent au loin,
    // des roseaux tout près, et des bandes de brume qui glissent tout doucement entre eux
    marsh(ctx, cx, cy, t) {
      sky(ctx, [[0, '#a4c2b6'], [0.55, '#cfdcc8'], [1, '#e4e8d4']]);
      ctx.fillStyle = 'rgba(255,250,220,0.45)';
      circlePath(ctx, 720 - cx * 0.02, 110 - cy * 0.05, 46);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,250,220,0.18)';
      circlePath(ctx, 720 - cx * 0.02, 110 - cy * 0.05, 80);
      ctx.fill();
      // tout au loin : des cyprès pâles, dans la brume (de la mousse pend de leurs branches)
      forEachItem(cx * 0.08, 130, 51, (x, i, h) => {
        const by = 430 - cy * 0.1;
        const th = 170 + h * 120;
        ctx.fillStyle = '#b2c6b8';
        ctx.beginPath();
        ctx.moveTo(x - 16, by);
        ctx.quadraticCurveTo(x - 4, by - th * 0.3, x - 5, by - th);
        ctx.lineTo(x + 5, by - th);
        ctx.quadraticCurveTo(x + 4, by - th * 0.3, x + 16, by);
        ctx.closePath();
        ctx.fill();
        ellipsePath(ctx, x, by - th, 34 + h * 16, 16);
        ctx.fill();
        ellipsePath(ctx, x + 6, by - th * 0.72, 26, 12);
        ctx.fill();
        ctx.strokeStyle = '#bccfc2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let k = -2; k <= 2; k++) {
          ctx.moveTo(x + k * 12, by - th + 8);
          ctx.lineTo(x + k * 12 + Math.sin(t + i + k) * 2, by - th + 34 + Math.abs(k) * 6);
        }
        ctx.stroke();
      });
      ctx.fillStyle = '#b6c8ba';
      ctx.fillRect(0, 425 - cy * 0.1, VIEW_W, 200);
      fogBand(ctx, 440 - cy * 0.1, 110, t * 6 + cx * 0.1, 0.8, 1);
      // plus près : des saules pleureurs, un peu plus foncés
      forEachItem(cx * 0.25, 220, 53, (x, i, h) => {
        const by = 470 - cy * 0.25;
        const th = 150 + h * 90;
        ctx.fillStyle = '#7f9a86';
        ctx.fillRect(x - 6, by - th * 0.75, 12, th * 0.75 + 10);
        ellipsePath(ctx, x, by - th * 0.8, 60 + h * 20, 30);
        ctx.fill();
        ctx.strokeStyle = '#7f9a86';
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let k = -4; k <= 4; k++) {
          const sx = x + k * 13;
          ctx.moveTo(sx, by - th * 0.8);
          ctx.quadraticCurveTo(sx + Math.sin(t * 0.9 + k) * 4, by - th * 0.5, sx + Math.sin(t * 0.7 + k + i) * 6, by - th * 0.8 + 50 + (4 - Math.abs(k)) * 10);
        }
        ctx.stroke();
      });
      ctx.fillStyle = '#7f9886';
      ctx.fillRect(0, 465 - cy * 0.25, VIEW_W, 200);
      fogBand(ctx, 490 - cy * 0.25, 90, t * 10 + cx * 0.25, 0.75, 2);
      // tout près : des roseaux et des massettes
      forEachItem(cx * 0.5, 70, 57, (x, i, h) => {
        if (h < 0.3) return;
        const by = 540 - cy * 0.45;
        const len = 60 + h * 50;
        const sw = Math.sin(t * 1.2 + i) * 3;
        ctx.strokeStyle = '#5e7a5a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.quadraticCurveTo(x + sw * 0.5, by - len * 0.5, x + sw, by - len);
        ctx.moveTo(x + 6, by);
        ctx.quadraticCurveTo(x + 9, by - len * 0.4, x + 14 + sw, by - len * 0.7);
        ctx.stroke();
        if (h > 0.6) {
          ctx.fillStyle = '#6a5a40';
          roundRectPath(ctx, x + sw - 3, by - len - 2, 6, 16, 3);
          ctx.fill();
        }
      });
    },

    // dans le Vieux Chêne : le fond du tronc creux, tout près (il bouge presque avec les étages) : du bois sombre
    // avec ses veines, ses nœuds, sa mousse et de petits champignons qui brillent ; des trous par où entrent des
    // rayons de soleil (avec des poussières qui dansent dedans) ; plus on monte, plus il y a de lumière ; et tout en
    // haut ("couronne" dans levels.js, o.crown), le bord du tronc s'ouvre sur les feuilles du chêne et un bout de ciel.
    oak(ctx, cx, cy, t, flash, o) {
      const k = 0.55;
      const px = cx * k;
      const py = cy * k;
      const img = oakWallSprite();
      const S = OAKWALL;
      const ox = -(((px % S) + S) % S);
      const oy = -(((py % S) + S) % S);
      for (let x = ox; x < VIEW_W; x += S) {
        for (let y = oy; y < VIEW_H; y += S) ctx.drawImage(img, x, y, S, S);
      }
      // plus on monte, plus il y a de lumière
      const up = o && o.height ? clamp(1 - (cy + VIEW_H) / o.height, 0, 1) : 0;
      ctx.fillStyle = `rgba(255,200,130,${0.04 + up * 0.16})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      // les trous dans le bois, et les rayons de soleil
      const CW = 340;
      const CH = 300;
      const beam = oakBeamSprite();
      for (let i = Math.floor((px - 260) / CW); i <= Math.floor((px + VIEW_W) / CW); i++) {
        for (let j = Math.floor((py - 520) / CH); j <= Math.floor((py + VIEW_H) / CH); j++) {
          const h = hash2(i * 3.7, j * 5.1);
          if (h > 0.38) continue;
          const hx = i * CW + 40 + hash2(i, j + 7) * 220 - px;
          const hy = j * CH + 30 + hash2(i + 3, j) * 150 - py;
          // (pas de trou au-dessus du bord du tronc, tout en haut)
          if (o && o.crown && hy + py < o.crown + 40) continue;
          const r = 9 + h * 26;
          ctx.save();
          ctx.globalAlpha = 0.75 + Math.sin(t * 0.7 + i + j) * 0.12;
          ctx.drawImage(beam, hx - 20, hy - 6, 260 * (r / 22), 520);
          ctx.restore();
          // les poussières qui dansent dans le rayon
          ctx.fillStyle = 'rgba(255,245,200,0.7)';
          for (let d = 0; d < 5; d++) {
            const f = ((t * 0.05 + hash(i * 7 + j * 3 + d)) % 1);
            const dx = hx + 10 + f * 150 * (r / 22) + Math.sin(t * 1.3 + d * 2) * 8;
            const dy = hy + f * 420 + Math.cos(t + d) * 6;
            circlePath(ctx, dx, dy, 1.3 + (d % 2));
            ctx.fill();
          }
          // le trou : on voit le ciel et des feuilles dehors
          ctx.fillStyle = '#2a1508';
          ellipsePath(ctx, hx, hy, r + 5, r * 1.25 + 6);
          ctx.fill();
          const sk = ctx.createRadialGradient(hx - r * 0.3, hy - r * 0.3, 1, hx, hy, r * 1.25);
          sk.addColorStop(0, '#fffbe0');
          sk.addColorStop(0.6, '#bfe8f0');
          sk.addColorStop(1, '#7cc28a');
          ctx.fillStyle = sk;
          ellipsePath(ctx, hx, hy, r, r * 1.25);
          ctx.fill();
          ctx.fillStyle = '#4f9a3a';
          leaf(ctx, hx + r * 0.6, hy + r * 0.7, -2.4, r / 14, '#4f9a3a');
          ctx.strokeStyle = 'rgba(255,210,150,0.35)';
          ctx.lineWidth = 2;
          ellipsePath(ctx, hx, hy, r + 3, r * 1.25 + 4);
          ctx.stroke();
        }
      }
      // tout en haut : le bord du tronc, et la couronne du chêne au-dessus
      if (o && o.crown) {
        const rim = o.crown - py;
        if (rim > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(-10, -10);
          ctx.lineTo(VIEW_W + 10, -10);
          // (le bord du tronc, tout cassé : une pointe toutes les 24 unités du fond)
          const w0 = Math.floor((px - 30) / 24) * 24;
          const w1 = Math.ceil((px + VIEW_W + 30) / 24) * 24;
          const edgeY = (wx) => rim + 6 + Math.sin(wx * 0.05) * 9 + hash(wx / 24) * 16;
          ctx.lineTo(VIEW_W + 10, edgeY(w1));
          for (let wx = w1; wx >= w0; wx -= 24) ctx.lineTo(wx - px, edgeY(wx));
          ctx.closePath();
          ctx.clip();
          sky(ctx, [[0, '#7fd0f0'], [0.35, '#c8efd8'], [1, '#fff4c8']]);
          // les rayons du soleil, entre les feuilles
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = '#fffbd0';
          for (let i = 0; i < 4; i++) {
            const x = ((i * 300 - px * 0.3) % 1200 + 1200) % 1200 - 120;
            ctx.beginPath();
            ctx.moveTo(x, -10);
            ctx.lineTo(x + 60, -10);
            ctx.lineTo(x + 200, rim + 40);
            ctx.lineTo(x + 110, rim + 40);
            ctx.closePath();
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          // les feuilles du chêne, qui bougent un peu dans le vent
          const can = oakCanopySprite();
          const cy0 = -30 - py * 0.4 + Math.sin(t * 0.8) * 3;
          const cox = -((((px * 0.7 + Math.sin(t * 0.5) * 6) % 480) + 480) % 480);
          for (let x = cox; x < VIEW_W; x += 480) ctx.drawImage(can, x, cy0, 480, 230);
          ctx.restore();
          // l'épaisseur du bord du tronc
          ctx.strokeStyle = '#2a1508';
          ctx.lineWidth = 5;
          ctx.beginPath();
          for (let wx = w1; wx >= w0; wx -= 24) {
            if (wx === w1) ctx.moveTo(wx - px, edgeY(wx)); else ctx.lineTo(wx - px, edgeY(wx));
          }
          ctx.stroke();
        }
      }
    },

    storm(ctx, cx, cy, t, flash, o) {
      sky(ctx, [[0, '#3d2a6b'], [0.55, '#8e6bb8'], [1, '#e6b3d6']]);
      const off1 = cx * 0.08;
      // (autour du Phare sur la Falaise : la mer au loin, au lieu des montagnes)
      if (o && o.sea) {
        farSea(ctx, cx, 330 - cy * 0.08, t);
        // (et tout au bout, le phare, tant qu'on ne voit pas le vrai : voir World.render)
        if (o.far > 0) farLighthouse(ctx, 800 - cx * 0.08, 330 - cy * 0.08, o.ang, o.far);
      } else forEachItem(off1, 300, 21, (x, i, h) => {
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
      // collines en chocolat avec de la crème (au bord de la mer, elles descendent bien plus vite quand on monte : on
      // ne les prend pas pour le sol, et en haut du phare, on ne voit plus que la mer)
      const hc = o && o.sea ? 84 + (cy - 84) * 5 : cy;
      const off2 = cx * 0.3;
      hillPath(ctx, off2, 420 - hc * 0.2, 55, 0.007, 2.1);
      stripedFill(ctx, '#7a4428', 'rgba(255,255,255,0.07)', off2, 30);
      ctx.save();
      hillPath(ctx, off2, 420 - hc * 0.2, 55, 0.007, 2.1);
      ctx.clip();
      ctx.strokeStyle = '#fff2f8';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let sx = -10; sx <= VIEW_W + 20; sx += 20) {
        const wx = sx + off2;
        const y = 420 - hc * 0.2 - 55 * (0.55 * Math.sin(wx * 0.007 + 2.1) + 0.3 * Math.sin(wx * 0.007 * 2.3 + 2.1 * 1.7) + 0.15 * Math.sin(wx * 0.007 * 5.1 + 2.1 * 2.9));
        if (sx === -10) ctx.moveTo(sx, y + 4); else ctx.lineTo(sx, y + 4 + Math.sin(wx * 0.05) * 3);
      }
      ctx.stroke();
      ctx.restore();
      forEachItem(cx * 0.1 - t * 15, 380, 23, (x, i, h) => fluffyCloud(ctx, x, 70 + h * 80 - cy * 0.05, 0.9 + h * 0.5, '#a58cc9', '#7c64a8'));
      const off3 = cx * 0.55;
      hillPath(ctx, off3, 480 - hc * 0.45, 25, 0.014, 0.7);
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

  // Une grande fleur-lanterne (la Prairie la Nuit), plantée en (x, y) : sa clochette brille et éclaire
  // tout autour (le cœur qui brille est dessiné par-dessus la nuit, voir glowFlowerShine).
  function glowHead(x, y, v, t) {
    return { x: x + 10 + Math.sin(t * 1.4 + v * 9) * 3, y: y - 60 };
  }

  function glowFlower(ctx, x, y, v, t) {
    const h = glowHead(x, y, v, t);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2f8a5a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 8, y - 52, h.x, h.y - 12);
    ctx.stroke();
    ctx.fillStyle = '#3fae7a';
    ellipsePath(ctx, x - 9, y - 14, 11, 4, 0.6);
    ctx.fill();
    ellipsePath(ctx, x + 7, y - 26, 11, 4, -0.6);
    ctx.fill();
    // la clochette, la tête en bas, festonnée
    const warm = v < 0.5;
    const g = ctx.createLinearGradient(0, h.y - 12, 0, h.y + 8);
    g.addColorStop(0, warm ? '#ffe680' : '#a8ecff');
    g.addColorStop(1, warm ? '#fffbe0' : '#f0fcff');
    ctx.beginPath();
    ctx.moveTo(h.x - 3, h.y - 12);
    ctx.quadraticCurveTo(h.x - 12, h.y - 8, h.x - 12, h.y + 6);
    for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(h.x - 12 + i * 6 + 3, h.y + 1, h.x - 6 + i * 6, h.y + 6);
    ctx.quadraticCurveTo(h.x + 12, h.y - 8, h.x + 3, h.y - 12);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = warm ? '#d8a020' : '#4aa8d8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function glowFlowerShine(ctx, x, y, v, t) {
    const h = glowHead(x, y, v, t);
    const a = 0.5 + 0.15 * Math.sin(t * 2.2 + v * 20);
    const col = v < 0.5 ? '255,236,140' : '150,230,255';
    Art.glow(ctx, h.x, h.y + 2, 40, col, a * 1.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // le pistil qui pend, et du pollen qui scintille en s'envolant
    ctx.fillStyle = `rgba(${col},1)`;
    circlePath(ctx, h.x, h.y + 10, 2.4);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.5 + i / 3 + v) % 1);
      ctx.globalAlpha = 1 - k;
      circlePath(ctx, h.x + Math.sin(t * 2 + i * 2) * 8, h.y + 8 - k * 40, 1.3);
      ctx.fill();
    }
    ctx.restore();
  }

  // (o : ce que le fond doit savoir du niveau, pour le Vieux Chêne : voir World.oakInfo)
  function drawBackground(ctx, theme, cx, cy, t, flash, o) {
    BG[theme](ctx, cx, cy, t, flash || 0, o);
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
    } else if (theme === 'night') {
      if (v < 0.4) {
        // une petite clochette qui brille dans la nuit (bleue ou rose)
        ctx.rotate(sway);
        ctx.strokeStyle = '#2f8a5a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -15);
        ctx.stroke();
        const a = 0.75 + 0.25 * Math.sin(t * 2 + v * 30);
        ctx.fillStyle = `rgba(${v < 0.2 ? '150,240,255' : '255,170,230'},${a})`;
        ctx.beginPath();
        ctx.moveTo(-5, -11);
        ctx.quadraticCurveTo(-5, -21, 0, -21);
        ctx.quadraticCurveTo(5, -21, 5, -11);
        ctx.lineTo(2.5, -13);
        ctx.lineTo(0, -11);
        ctx.lineTo(-2.5, -13);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fffbe0';
        circlePath(ctx, 0, -10.5, 1.3);
        ctx.fill();
      } else {
        // touffe d'herbe
        ctx.fillStyle = '#2f9a6e';
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
    } else if (theme === 'mushrooms' || theme === 'sousbois') {
      if (theme === 'sousbois' && v > 0.8) {
        // (le sous-bois) un coussin de mousse, avec ses toutes petites pousses
        ctx.fillStyle = '#3f9a45';
        ellipsePath(ctx, 0, -3, 16, 6);
        ctx.fill();
        ctx.fillStyle = '#6cc552';
        ellipsePath(ctx, -3, -5, 11, 4);
        ctx.fill();
        ctx.strokeStyle = '#8fdc6a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = -2; k <= 2; k++) {
          ctx.moveTo(k * 5, -7);
          ctx.lineTo(k * 5 + sway * 10, -12 - (k & 1) * 2);
        }
        ctx.stroke();
      } else if (v < 0.45) {
        // une petite famille de champignons
        // (jamais de bleu : les champignons bleus à pois sont ceux qui font rebondir)
        const cols = ['#f08a3a', '#b07ae0', '#e8b83a', '#d8563c'];
        for (const [dx, s, i] of [[-6, 0.8, 0], [4, 1.1, 1], [12, 0.6, 2]]) {
          if (i === 2 && v > 0.3) continue;
          ctx.fillStyle = '#fff3e0';
          roundRectPath(ctx, dx - 2.5 * s, -11 * s, 5 * s, 11 * s, 2);
          ctx.fill();
          ctx.fillStyle = cols[(Math.floor(v * 20) + i) % 4];
          ctx.beginPath();
          ctx.ellipse(dx, -11 * s, 8 * s, 7 * s, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          circlePath(ctx, dx - 3 * s, -14 * s, 1.5 * s);
          ctx.fill();
        }
      } else {
        // une petite fougère
        ctx.fillStyle = '#2f9a4a';
        for (let k = -2; k <= 2; k++) {
          ctx.save();
          ctx.rotate(k * 0.4 + sway);
          ellipsePath(ctx, 0, -11, 3, 11);
          ctx.fill();
          ctx.restore();
        }
      }
    } else if (theme === 'marsh') {
      if (v < 0.3) {
        // des massettes (leurs épis bruns tout doux) et leurs longues feuilles
        ctx.rotate(sway * 0.6);
        ctx.strokeStyle = '#4e7a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const [dx, h] of [[-4, 26], [3, 32]]) {
          ctx.moveTo(dx, 0);
          ctx.lineTo(dx, -h);
        }
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-8, -12, -13, -20);
        ctx.moveTo(1, 0);
        ctx.quadraticCurveTo(9, -10, 12, -24);
        ctx.stroke();
        ctx.fillStyle = '#6a4a2a';
        roundRectPath(ctx, -6.5, -24, 5, 12, 2.5);
        ctx.fill();
        roundRectPath(ctx, 0.5, -30, 5, 13, 2.5);
        ctx.fill();
      } else if (v < 0.55) {
        // une touffe de joncs
        ctx.strokeStyle = '#5a8a40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = -3; k <= 3; k++) {
          ctx.moveTo(k * 1.5, 0);
          ctx.quadraticCurveTo(k * 3, -8, k * 5 + sway * 10, -14 - (3 - Math.abs(k)) * 3);
        }
        ctx.stroke();
      } else if (v < 0.75) {
        // de petits champignons tout pâles
        for (const [dx, s] of [[-5, 0.8], [4, 1]]) {
          ctx.fillStyle = '#efe6d0';
          roundRectPath(ctx, dx - 2 * s, -9 * s, 4 * s, 9 * s, 2);
          ctx.fill();
          ctx.fillStyle = '#c8a878';
          ctx.beginPath();
          ctx.ellipse(dx, -9 * s, 7 * s, 5 * s, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // des cailloux couverts de mousse
        ctx.fillStyle = '#8a8a7a';
        ellipsePath(ctx, -4, -4, 8, 5);
        ctx.fill();
        ellipsePath(ctx, 6, -3, 5, 3.5);
        ctx.fill();
        ctx.fillStyle = '#6a9a48';
        ellipsePath(ctx, -5, -8, 6, 2.2);
        ctx.fill();
      }
    } else if (theme === 'oak') {
      if (v < 0.28) {
        // trois petits champignons (rouges à pois blancs, ou couleur noisette)
        const red = v < 0.14;
        for (const [dx, h, r] of [[-7, 9, 5], [2, 14, 6.5], [9, 7, 4]]) {
          ctx.fillStyle = '#f4ead2';
          roundRectPath(ctx, dx - 1.6, -h, 3.2, h, 1.4);
          ctx.fill();
          ctx.fillStyle = red ? '#e0443a' : '#c08a4a';
          ctx.beginPath();
          ctx.ellipse(dx, -h, r, r * 0.75, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          if (red) {
            ctx.fillStyle = '#ffffff';
            circlePath(ctx, dx - r * 0.35, -h - r * 0.35, 1.1);
            ctx.fill();
            circlePath(ctx, dx + r * 0.3, -h - r * 0.2, 0.9);
            ctx.fill();
          }
        }
      } else if (v < 0.5) {
        // un gland tombé par terre
        ctx.rotate(0.4 - v);
        ctx.fillStyle = '#b87a3a';
        ellipsePath(ctx, 0, -6, 5, 6.5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,230,180,0.45)';
        ellipsePath(ctx, -1.6, -7.5, 1.6, 2.4);
        ctx.fill();
        ctx.fillStyle = '#6a4424';
        roundRectPath(ctx, -5.6, -13, 11.2, 5.4, 2.6);
        ctx.fill();
        ctx.fillRect(-0.7, -16, 1.4, 3.5);
      } else if (v < 0.72) {
        // une petite fougère
        ctx.rotate(sway * 0.7);
        ctx.strokeStyle = '#3f8a32';
        ctx.lineWidth = 1.6;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(s * 6, -12, s * 13, -14);
          ctx.stroke();
          for (let k = 1; k <= 4; k++) leaf(ctx, s * k * 2.8, -k * 3.3, s > 0 ? -1.2 : Math.PI + 1.2, 0.45, '#5fb04a');
        }
      } else {
        // une touffe de mousse toute ronde
        ctx.fillStyle = '#4f8f3a';
        ellipsePath(ctx, 0, -3, 11, 5);
        ctx.fill();
        ctx.fillStyle = '#78b850';
        ellipsePath(ctx, -2, -5, 7, 3);
        ctx.fill();
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

  // ---------- Le Moulin à Vent ----------
  // La tour du moulin (dans le décor : on passe devant), de son toit jusqu'au sol, h pixels sous l'axe des ailes.
  // Dans le sprite, l'axe est en (MILL_SX, MILL_SY). Une tour de crème rose et blanche, un toit en chocolat
  // avec de la crème qui coule, une porte et une petite fenêtre éclairée. Au-dessus d'un trou sans fond, elle est
  // posée sur un grand rocher (rock pixels de haut) qui s'enfonce et disparaît dans le vide, et n'a pas de porte.
  const MILL_SX = 80;
  const MILL_SY = 64;
  function millTower(h, rock) {
    const W = 2 * MILL_SX;
    const H = MILL_SY + h + 4 + rock;
    return sprite('mill:' + Math.round(h) + ':' + Math.round(rock), W, H, (g) => {
      const cx = MILL_SX;
      const top = MILL_SY + 14;
      const bot = MILL_SY + h;
      const tw = 34;
      const bw = 62;
      if (rock) millRock(g, cx, bot - 8, bw + 6, rock + 8);
      // la tour, un peu plus large en bas
      g.beginPath();
      g.moveTo(cx - tw, top);
      g.lineTo(cx + tw, top);
      g.lineTo(cx + bw, bot);
      g.lineTo(cx - bw, bot);
      g.closePath();
      const gr = g.createLinearGradient(cx - bw, 0, cx + bw, 0);
      gr.addColorStop(0, '#f6e6f2');
      gr.addColorStop(0.45, '#fff8fc');
      gr.addColorStop(1, '#d9bcd8');
      g.fillStyle = gr;
      g.fill();
      g.strokeStyle = '#8a5a7a';
      g.lineWidth = 3;
      g.stroke();
      // des rayures roses, comme un sucre d'orge
      g.save();
      g.clip();
      g.strokeStyle = 'rgba(255,140,190,0.35)';
      g.lineWidth = 9;
      for (let y = top - 60; y < bot + 60; y += 34) {
        g.beginPath();
        g.moveTo(cx - bw - 10, y + 24);
        g.lineTo(cx + bw + 10, y - 10);
        g.stroke();
      }
      g.restore();
      // la petite fenêtre, éclairée
      const wy = top + Math.min(70, (bot - top) * 0.3);
      g.fillStyle = '#ffd77a';
      roundRectPath(g, cx - 9, wy, 18, 22, 9);
      g.fill();
      g.strokeStyle = '#6a3a28';
      g.lineWidth = 2.5;
      g.stroke();
      g.beginPath();
      g.moveTo(cx, wy);
      g.lineTo(cx, wy + 22);
      g.moveTo(cx - 9, wy + 11);
      g.lineTo(cx + 9, wy + 11);
      g.stroke();
      // la porte en chocolat, au pied de la tour
      if (h > 120 && !rock) {
        g.fillStyle = '#7a4428';
        roundRectPath(g, cx - 15, bot - 46, 30, 48, 15);
        g.fill();
        g.strokeStyle = '#4a2414';
        g.lineWidth = 2.5;
        g.stroke();
        g.fillStyle = '#ffcf6a';
        circlePath(g, cx + 8, bot - 22, 2.5);
        g.fill();
      }
      // le toit en chocolat, avec la crème qui coule
      g.beginPath();
      g.moveTo(cx - tw - 10, top + 2);
      g.quadraticCurveTo(cx - tw - 6, MILL_SY - 40, cx, MILL_SY - 50);
      g.quadraticCurveTo(cx + tw + 6, MILL_SY - 40, cx + tw + 10, top + 2);
      g.closePath();
      g.fillStyle = '#7a4428';
      g.fill();
      g.strokeStyle = '#4a2414';
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = '#fff2f8';
      g.beginPath();
      g.moveTo(cx - 26, MILL_SY - 32);
      g.quadraticCurveTo(cx, MILL_SY - 52, cx + 26, MILL_SY - 32);
      for (let i = 4; i >= 0; i--) {
        const x = cx - 26 + i * 13;
        g.quadraticCurveTo(x + 6, MILL_SY - 24 + (i % 2) * 8, x, MILL_SY - 30);
      }
      g.closePath();
      g.fill();
      // une cerise tout en haut
      g.fillStyle = '#ff3a5a';
      circlePath(g, cx, MILL_SY - 54, 6);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)';
      circlePath(g, cx - 2, MILL_SY - 56, 2);
      g.fill();
    });
  }

  // Le grand rocher sous la tour, au-dessus d'un trou sans fond : son haut (large de 2 hw) en y, et il descend de
  // hgt pixels en s'amincissant, de plus en plus sombre, puis s'efface dans le vide (rien où se poser).
  function millRock(g, cx, y, hw, hgt) {
    const pts = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      pts.push([cx - hw * (1 - 0.55 * k) + (i % 2 ? 7 : -3) * (1 - k), y + hgt * k]);
    }
    for (let i = n; i >= 0; i--) {
      const k = i / n;
      pts.push([cx + hw * (1 - 0.6 * k) + (i % 2 ? -6 : 4) * (1 - k), y + hgt * k]);
    }
    g.beginPath();
    pts.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy)));
    g.closePath();
    const gr = g.createLinearGradient(0, y, 0, y + hgt);
    gr.addColorStop(0, '#a08aae');
    gr.addColorStop(1, '#4a3a5e');
    g.fillStyle = gr;
    g.fill();
    g.strokeStyle = '#4a3a5e';
    g.lineWidth = 3;
    g.stroke();
    // des facettes plus claires, et des fentes
    g.save();
    g.clip();
    g.fillStyle = 'rgba(255,240,255,0.16)';
    for (let i = 0; i < 4; i++) {
      const fy = y + 14 + i * hgt * 0.22;
      const fx = cx - hw * 0.7 + (i % 2) * hw * 0.5;
      g.beginPath();
      g.moveTo(fx, fy);
      g.lineTo(fx + 30, fy + 6);
      g.lineTo(fx + 18, fy + 34);
      g.lineTo(fx - 6, fy + 26);
      g.closePath();
      g.fill();
    }
    g.strokeStyle = 'rgba(40,24,56,0.45)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx - 20, y + 10);
    g.lineTo(cx - 8, y + 40);
    g.lineTo(cx - 16, y + 70);
    g.moveTo(cx + 30, y + 24);
    g.lineTo(cx + 22, y + 58);
    g.stroke();
    g.restore();
    // il s'efface dans le vide, tout en bas
    g.save();
    g.globalCompositeOperation = 'destination-out';
    const fade = g.createLinearGradient(0, y + hgt * 0.3, 0, y + hgt - 10);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = fade;
    g.fillRect(cx - hw - 20, y + hgt * 0.3, 2 * hw + 40, hgt * 0.7 + 4);
    g.restore();
  }

  // Une aile (couchée, l'axe à gauche) : un long bras en bois et une toile à rayures roses tendue sur un cadre.
  // (la toile est du côté d'où vient l'aile : elle tourne dans le sens des aiguilles d'une montre)
  function millSail(r) {
    const L = r + 8;
    return sprite('mill:sail:' + r, L, 34, (g) => {
      const y = 26;
      const x0 = 34;
      const x1 = r - 4;
      // la toile
      g.fillStyle = '#fff4fa';
      g.fillRect(x0, 4, x1 - x0, y - 4);
      g.fillStyle = 'rgba(255,120,180,0.55)';
      for (let x = x0; x < x1; x += 24) g.fillRect(x, 4, 12, y - 4);
      // le cadre et ses barreaux
      g.strokeStyle = '#a0683c';
      g.lineWidth = 3;
      g.strokeRect(x0, 3, x1 - x0, y - 3);
      g.lineWidth = 1.5;
      g.beginPath();
      for (let x = x0 + 12; x < x1; x += 12) {
        g.moveTo(x, 3);
        g.lineTo(x, y);
      }
      g.moveTo(x0, 14);
      g.lineTo(x1, 14);
      g.stroke();
      // le grand bras
      g.fillStyle = '#c08048';
      roundRectPath(g, 0, y - 3, L, 7, 3);
      g.fill();
      g.strokeStyle = '#6a3e1e';
      g.lineWidth = 2;
      g.stroke();
    });
  }

  // Le moulin : la tour (en cache), les quatre ailes qui tournent (angle a), et l'axe par-dessus.
  function windmill(ctx, x, y, ground, a, r, rock = 0) {
    const tower = millTower(Math.max(20, ground - y), rock);
    ctx.drawImage(tower, x - MILL_SX, y - MILL_SY, tower.width / scale, tower.height / scale);
    const sail = millSail(r);
    const L = r + 8;
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(a + (i * Math.PI) / 2);
      ctx.drawImage(sail, 0, -26, L, 34);
      ctx.restore();
    }
    // l'axe : un gros bonbon tourbillon
    ctx.rotate(a);
    circlePath(ctx, 0, 0, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#6a3e1e';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#ff6aa8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let k = 0; k <= 24; k++) {
      const an = k * 0.55;
      const rr = 1 + k * 0.5;
      if (k === 0) ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
      else ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Une planche au bout d'une aile (une grosse gaufrette), toujours à plat : son dessus en (x, y), et le bout de
  // l'aile en (tx, ty). Elle y est accrochée comme la nacelle d'une grande roue : un gros anneau doré autour du bout
  // de l'aile, et un étrier du même bois que l'aile (un poteau et deux bras) qui tient la planche.
  function millPlank(ctx, x, y, w, h, tx, ty) {
    const hold = [[x + 14, y + 4], [tx, y + 4], [x + w - 14, y + 4]];
    ctx.lineCap = 'round';
    for (const [lw, col] of [[8, '#6a3e1e'], [4.5, '#c08048']]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (const [hx, hy] of hold) {
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
      }
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    const img = sprite('mill:plank:' + w, w, h + 4, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#ffd998');
      gr.addColorStop(0.5, '#e8a85a');
      gr.addColorStop(1, '#b8743a');
      g.fillStyle = gr;
      roundRectPath(g, 0, 0, w, h, 6);
      g.fill();
      // le quadrillage de la gaufrette
      g.save();
      roundRectPath(g, 0, 0, w, h, 6);
      g.clip();
      g.strokeStyle = 'rgba(140,80,30,0.45)';
      g.lineWidth = 1.5;
      g.beginPath();
      for (let i = 8; i < w; i += 8) {
        g.moveTo(i, 0);
        g.lineTo(i, h);
      }
      g.moveTo(0, h / 2);
      g.lineTo(w, h / 2);
      g.stroke();
      g.restore();
      g.strokeStyle = '#7a4420';
      g.lineWidth = 2;
      roundRectPath(g, 1, 1, w - 2, h - 2, 6);
      g.stroke();
      // un peu de crème rose sur le dessus
      g.fillStyle = '#ffd0e6';
      roundRectPath(g, 4, 1, w - 8, 4, 2);
      g.fill();
    });
    ctx.drawImage(img, x, y, w, h + 4);
    // le gros anneau doré autour du bout de l'aile (la planche tourne dedans pour rester à plat)
    circlePath(ctx, tx, ty, 8);
    ctx.fillStyle = '#ffcf6a';
    ctx.fill();
    ctx.strokeStyle = '#6a3e1e';
    ctx.lineWidth = 2;
    ctx.stroke();
    circlePath(ctx, tx, ty, 3.5);
    ctx.fillStyle = '#8a5a2e';
    ctx.fill();
  }

  // La pluie : des traits penchés, dessinés une fois dans un carré qu'on répète sur tout l'écran (front : tout près,
  // gros et rapides ; sinon au loin, fins, plus lents et plus pâles).
  let RAIN = null;
  function rainTile() {
    if (!RAIN) {
      RAIN = [0, 1].map((near) => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const g = c.getContext('2d');
        g.strokeStyle = near ? 'rgba(225,240,255,0.75)' : 'rgba(225,235,255,0.5)';
        g.lineWidth = near ? 2 : 1.2;
        g.lineCap = 'round';
        const n = near ? 22 : 40;
        const len = near ? 22 : 13;
        g.beginPath();
        for (let i = 0; i < n; i++) {
          const x = hash(i * 7.31 + near) * 256;
          const y = hash(i * 3.17 + 11 + near) * 256;
          // (chaque trait est aussi dessiné de l'autre côté du carré, pour qu'on ne voie pas les bords)
          for (const [ox, oy] of [[0, 0], [-256, 0], [0, -256], [-256, -256], [256, 0], [0, 256]]) {
            g.moveTo(x + ox, y + oy);
            g.lineTo(x + ox - len * 0.28, y + oy + len);
          }
        }
        g.stroke();
        return c;
      });
    }
    return RAIN;
  }

  function rain(ctx, t, camX, camY, front) {
    const img = rainTile()[front ? 1 : 0];
    const k = front ? 1 : 0.5;
    // (au pixel près : plus rapide à dessiner)
    const wrap = (v) => Math.round(((v % 256) + 256) % 256) - 256;
    const ox = wrap(-camX * k - t * (front ? 260 : 150));
    const oy = wrap(-camY * k + t * (front ? 900 : 520));
    ctx.save();
    ctx.globalAlpha = front ? 0.55 : 0.6;
    for (let y = oy; y < VIEW_H; y += 256) {
      for (let x = ox; x < VIEW_W; x += 256) ctx.drawImage(img, x, y);
    }
    ctx.restore();
  }

  // ---------- La Crue ----------
  // (on dessine dans les cases vides seulement : voir Flood.clip ; y : la surface de l'eau, bottom : le bas de l'écran)
  // L'eau du fond, derrière tout ce qui bouge : bien bleue, plus foncée en profondeur, avec des rayons de lumière.
  function floodBack(ctx, x0, x1, y, bottom, t) {
    const g = ctx.createLinearGradient(0, y, 0, y + 420);
    g.addColorStop(0, '#5aaee0');
    g.addColorStop(0.4, '#3a86c4');
    g.addColorStop(1, '#22578e');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y - 4, x1 - x0, bottom - y + 4);
    // des rayons de lumière qui ondulent sous la surface
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = Math.floor(x0 / 160); i * 160 < x1; i++) {
      const x = i * 160 + Math.sin(t * 0.8 + i * 1.7) * 18;
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x + 34, y + 6);
      ctx.lineTo(x + 10, y + 260);
      ctx.lineTo(x - 30, y + 260);
      ctx.closePath();
      ctx.fill();
    }
  }

  // L'eau de devant (un peu transparente, comme la rivière) ; boil : la rivière bouillonne (de grosses vagues).
  function floodFront(ctx, x0, x1, y, bottom, t, boil) {
    if (boil) {
      // de grosses vagues qui se soulèvent
      ctx.fillStyle = 'rgba(200,240,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(x0, y + 6);
      for (let x = x0; x <= x1 + 0.1; x += 8) ctx.lineTo(x, y + 4 - Math.abs(Math.sin(x * 0.03 + t * 9)) * 7);
      ctx.lineTo(x1, y + 6);
      ctx.closePath();
      ctx.fill();
    }
    drawWaterRun(ctx, x0, x1, y - 14, bottom, t);
  }

  // L'eau qui monte, encore sous l'écran : le bas de l'écran devient bleu (k : de 0, loin, à 1, tout près), avec des
  // vagues et des bulles qui montent. (x, y) : le bas de l'écran, à gauche.
  function floodEdge(ctx, x, y, k, t) {
    const h = 30 + 40 * k;
    const g = ctx.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, 'rgba(90,180,240,0)');
    g.addColorStop(1, `rgba(60,150,230,${0.35 + 0.4 * k})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y - h, VIEW_W, h);
    ctx.strokeStyle = `rgba(230,250,255,${0.35 + 0.5 * k})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let sx = 0; sx <= VIEW_W; sx += 12) {
      const yy = y - 8 - 10 * k + Math.sin((x + sx) * 0.04 + t * 5) * 3;
      if (sx === 0) ctx.moveTo(x + sx, yy); else ctx.lineTo(x + sx, yy);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(230,250,255,${0.5 * k + 0.2})`;
    for (let i = 0; i < 9; i++) {
      const ph = (t * 0.9 + hash(i * 4.3)) % 1;
      circlePath(ctx, x + hash(i * 7.1) * VIEW_W, y - ph * h * 1.2, 2 + 2 * hash(i * 2.9));
      ctx.fill();
    }
  }

  return {
    floodBack, floodFront, floodEdge,
    windmill, millPlank, rain,
    lightningRod, lightningRodSky, lighthouse,
    THEMES, PAD, setScale, groundSprite, brickSprite, lutinSprite, plugSprite, platformSprite, thornSprite,
    rainbowSprite, bounceSprite, capSprite, capRim, stalkSprite, puddle, drawLavaRun, drawChocoRun, drawBackground, decor, fluffyCloud, cornerRect,
    drawMudRun, mudMist, stilt, cabinSprite, CABIN_H, ropeBridge,
    trunkSprite, crown, riverBed, drawWaterRun, reeds, burrowCell, burrowSunbeam, burrowLantern,
    moonPos, glowFlower, glowFlowerShine, vine, oakFacade, hideout,
  };
})();
