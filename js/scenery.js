'use strict';

// Décors : cases du sol, blocs, plateformes, ronces, lave et arrière-plans des 5 mondes.
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
    volcano: {
      dirt: '#43303a', dirtDark: '#2a1c24', dirtLight: '#5d4652', stripe: 'rgba(255,90,20,0.10)',
      top: '#6a4c58', topDark: '#3e2b34', topLight: '#8c6b78', blades: false, crust: true,
      brick: '#4f3b44', brickDark: '#2a1d24', brickLight: '#76606b', glow: true,
      plat: '#5b4650', platDark: '#2f2329', platLight: '#86707b', ember: true,
      bramble: '#4a2030', brambleDark: '#12060a', thorn: '#ffd27a',
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
    // strates
    g.fillStyle = th.stripe;
    for (const sy of [12, 36]) {
      g.beginPath();
      g.moveTo(0, sy);
      for (let x = 0; x <= T; x += 8) g.lineTo(x, sy + Math.sin((x / T) * TAU) * 2.5);
      for (let x = T; x >= 0; x -= 8) g.lineTo(x, sy + 7 + Math.sin((x / T) * TAU + 1) * 2.5);
      g.closePath();
      g.fill();
    }
    // cailloux
    for (let i = 0; i < 3; i++) {
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

  // ---------- Plateformes traversables ----------
  function platformSprite(theme, l, r) {
    return sprite(`p:${theme}:${l | 0}${r | 0}`, TILE + PAD * 2, TILE + PAD * 2, (g) => {
      const th = THEMES[theme];
      const T = TILE;
      g.translate(PAD, PAD);
      const x0 = l ? 2 : -1;
      const x1 = r ? T - 2 : T + 1;
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

  const BG = {
    meadow(ctx, cx, cy, t) {
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
  };

  function drawBackground(ctx, theme, cx, cy, t, flash) {
    BG[theme](ctx, cx, cy, t, flash || 0);
  }

  // ---------- Petites décorations posées sur le sol ----------
  function decor(ctx, theme, x, y, v, t) {
    const sway = Math.sin(t * 2 + v * 10) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    if (theme === 'meadow' || theme === 'mountain') {
      if (v < 0.5) {
        // fleur
        ctx.rotate(sway);
        ctx.strokeStyle = '#2f9a3a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -16);
        ctx.stroke();
        const cols = theme === 'meadow' ? ['#ff5fa8', '#ffd21f', '#ffffff', '#b06bff'] : ['#ffd21f', '#ff8a3a', '#ffffff', '#ff5f5f'];
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
        ctx.fillStyle = theme === 'meadow' ? '#3fbf4a' : '#9aa84a';
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(k * 4 - 2, 0);
          ctx.quadraticCurveTo(k * 5 + sway * 20, -10, k * 6 + sway * 30, -13 + Math.abs(k) * 2);
          ctx.lineTo(k * 4 + 2, 0);
          ctx.fill();
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
    }
    ctx.restore();
  }

  return {
    THEMES, PAD, setScale, groundSprite, brickSprite, lutinSprite, platformSprite, thornSprite,
    drawLavaRun, drawBackground, decor, fluffyCloud, cornerRect,
  };
})();
