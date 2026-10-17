'use strict';

// Tous les personnages et objets sont dessinés avec des formes (pas d'images à charger).
const Art = (() => {
  const TAU = Math.PI * 2;

  // ---------------- Malice ----------------
  const MALICE = {
    hat: '#ff4f9a', hatDark: '#cf2c74', hatLight: '#ff9ccb',
    overall: '#ff74b4', overallDark: '#d84d8f',
    shirt: '#ffffff', shirtShade: '#dde2ee',
    skin: '#ffd9bd', skinShade: '#efb592', cheek: '#ff8fa8',
    hair: '#ffd84a', hairDark: '#e0a91c', hairLight: '#fff2a6',
    mustache: '#1c1717', shoe: '#7b3f23', shoeDark: '#5a2b16', shoeLight: '#a8613a',
    button: '#ffe14d', eye: '#1f2a4a',
  };

  // Pendant l'étoile, Malice change de couleur très vite.
  function maliceRainbow(t) {
    const h = Math.floor(t * 540) % 360;
    const c = (dh, s, l) => `hsl(${(h + dh) % 360},${s}%,${l}%)`;
    return Object.assign({}, MALICE, {
      hat: c(0, 95, 58), hatDark: c(0, 90, 42), hatLight: c(0, 95, 76),
      overall: c(130, 95, 60), overallDark: c(130, 90, 44),
      shirt: c(250, 100, 86), shirtShade: c(250, 70, 72),
      shoe: c(60, 85, 45), shoeDark: c(60, 85, 32), shoeLight: c(60, 85, 62),
      hair: c(200, 100, 70), hairDark: c(200, 90, 52),
    });
  }

  function drawLeg(ctx, C, hx, hy, a, back) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(a);
    ctx.fillStyle = back ? C.overallDark : C.overall;
    roundRectPath(ctx, -4.6, -2, 9.2, 17.5, 4);
    ctx.fill();
    ctx.translate(0, 15.5);
    ctx.rotate(-a);
    ctx.fillStyle = back ? C.shoeDark : C.shoe;
    ellipsePath(ctx, 3, 1.5, 7.6, 4.3);
    ctx.fill();
    if (!back) {
      ctx.fillStyle = C.shoeLight;
      ellipsePath(ctx, 5, 0, 3, 1.4);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawArm(ctx, C, sx, sy, a, back) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a);
    ctx.fillStyle = back ? C.skinShade : C.skin;
    roundRectPath(ctx, -2.7, 3, 5.4, 10.5, 2.7);
    ctx.fill();
    circlePath(ctx, 0, 13.6, 3.5);
    ctx.fill();
    ctx.fillStyle = back ? C.shirtShade : C.shirt;
    roundRectPath(ctx, -4.2, -3.5, 8.4, 9, 3.5);
    ctx.fill();
    ctx.restore();
  }

  function drawBody(ctx, C) {
    ctx.fillStyle = C.shirt;
    roundRectPath(ctx, -10, -43, 20, 19, 7);
    ctx.fill();
    ctx.fillStyle = C.shirtShade;
    roundRectPath(ctx, -10, -30, 20, 4, 2);
    ctx.fill();
    // salopette
    ctx.fillStyle = C.overall;
    roundRectPath(ctx, -11, -31, 22, 14.5, 5);
    ctx.fill();
    roundRectPath(ctx, -6, -39, 14, 10, 2.5);
    ctx.fill();
    ctx.strokeStyle = C.overall;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -38);
    ctx.lineTo(-8, -43);
    ctx.moveTo(7, -38);
    ctx.lineTo(7, -43);
    ctx.stroke();
    ctx.fillStyle = C.overallDark;
    roundRectPath(ctx, -1.5, -35, 6, 4.5, 1.2);
    ctx.fill();
    ctx.fillStyle = C.button;
    circlePath(ctx, -3.6, -36.5, 1.9);
    ctx.fill();
    circlePath(ctx, 6, -36.5, 1.9);
    ctx.fill();
  }

  function drawHead(ctx, C, o) {
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const hx = 3;
    const hy = -52;
    const sway = Math.sin((o.ph || 0) * 1 + t * 2) * (pose === 'walk' ? 0.22 : 0.07);
    // cheveux de derrière
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy - 12);
    ctx.bezierCurveTo(hx - 16, hy - 11, hx - 18, hy + 3, hx - 14, hy + 13);
    ctx.quadraticCurveTo(hx - 9, hy + 17, hx - 4, hy + 11);
    ctx.lineTo(hx + 2, hy - 2);
    ctx.closePath();
    ctx.fill();
    // queue de cheval
    ctx.save();
    ctx.translate(hx - 13, hy - 5);
    ctx.rotate(0.55 + sway + (pose === 'jump' || pose === 'fall' ? -0.5 : 0));
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.bezierCurveTo(-9, 6, -6, 16, -2, 21);
    ctx.bezierCurveTo(1, 16, 6, 8, 3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.hairDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, 4);
    ctx.quadraticCurveTo(-4, 11, -2, 17);
    ctx.stroke();
    ctx.fillStyle = C.hat;
    circlePath(ctx, 0, 0, 3.2);
    ctx.fill();
    ctx.restore();
    // visage
    ctx.fillStyle = C.skin;
    circlePath(ctx, hx, hy, 12.2);
    ctx.fill();
    ctx.fillStyle = C.skinShade;
    ellipsePath(ctx, hx - 4.5, hy + 2, 2.4, 3.2);
    ctx.fill();
    // mèche sur le côté
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.moveTo(hx - 12, hy - 5);
    ctx.quadraticCurveTo(hx - 9, hy + 2, hx - 9, hy + 9);
    ctx.quadraticCurveTo(hx - 6, hy + 2, hx - 6, hy - 6);
    ctx.closePath();
    ctx.fill();
    // frange
    ctx.beginPath();
    ctx.moveTo(hx - 9, hy - 8);
    ctx.lineTo(hx + 11, hy - 8);
    ctx.lineTo(hx + 10, hy - 4);
    ctx.lineTo(hx + 7, hy - 6);
    ctx.lineTo(hx + 4, hy - 3);
    ctx.lineTo(hx + 1, hy - 6);
    ctx.lineTo(hx - 3, hy - 3);
    ctx.lineTo(hx - 5, hy - 6);
    ctx.closePath();
    ctx.fill();
    // oeil
    const blink = (t % 3.7) < 0.12 && pose !== 'hurt';
    if (blink) {
      ctx.strokeStyle = C.eye;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(hx + 3.5, hy - 0.5);
      ctx.quadraticCurveTo(hx + 6.5, hy + 1.2, hx + 9.5, hy - 0.5);
      ctx.stroke();
    } else if (pose === 'hurt') {
      ctx.strokeStyle = C.eye;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(hx + 4, hy - 3);
      ctx.lineTo(hx + 8.5, hy - 0.5);
      ctx.lineTo(hx + 4, hy + 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ellipsePath(ctx, hx + 6.5, hy - 0.5, 3.3, 4.3);
      ctx.fill();
      ctx.fillStyle = C.eye;
      ellipsePath(ctx, hx + 7.4, hy - 0.2, 2.2, 3.1);
      ctx.fill();
      ctx.fillStyle = '#fff';
      circlePath(ctx, hx + 8.1, hy - 1.7, 0.9);
      ctx.fill();
      ctx.strokeStyle = C.eye;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(hx + 8.6, hy - 4.2);
      ctx.lineTo(hx + 10.4, hy - 5.6);
      ctx.moveTo(hx + 9.6, hy - 3.2);
      ctx.lineTo(hx + 11.4, hy - 4.1);
      ctx.stroke();
    }
    // joue
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.55;
    ellipsePath(ctx, hx + 3, hy + 5, 3.2, 2.1);
    ctx.fill();
    ctx.globalAlpha /= 0.55;
    // bouche (sous la moustache) quand elle est contente ou surprise
    if (pose === 'win' || pose === 'hurt' || pose === 'jump') {
      ctx.fillStyle = '#9b2335';
      ellipsePath(ctx, hx + 9, hy + 11.5, pose === 'win' ? 3.5 : 2.4, pose === 'win' ? 2.6 : 2.4);
      ctx.fill();
    }
    // nez
    ctx.fillStyle = C.skin;
    circlePath(ctx, hx + 12.5, hy + 3, 3.9);
    ctx.fill();
    ctx.strokeStyle = C.skinShade;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    circlePath(ctx, hx + 13, hy + 1.6, 1.1);
    ctx.fill();
    // GROSSE moustache noire
    const mx = hx + 11;
    const my = hy + 7.5;
    const wig = pose === 'walk' ? Math.sin((o.ph || 0) * 2) * 0.6 : 0;
    ctx.fillStyle = C.mustache;
    ctx.beginPath();
    ctx.moveTo(mx, my - 2.5);
    ctx.bezierCurveTo(mx + 4, my - 4.5, mx + 9, my - 3.5, mx + 10.5, my + 0.5);
    ctx.bezierCurveTo(mx + 11.5, my + 2.5 + wig, mx + 13.5, my + 1 + wig, mx + 13.5, my - 1.5 + wig);
    ctx.bezierCurveTo(mx + 15.5, my + 4 + wig, mx + 10, my + 6.5, mx + 5.5, my + 4.5);
    ctx.bezierCurveTo(mx + 3, my + 3.5, mx + 1, my + 4.5, mx, my + 3.5);
    ctx.bezierCurveTo(mx - 2, my + 5.5, mx - 8.5, my + 6.5, mx - 10.5, my + 2);
    ctx.bezierCurveTo(mx - 11.5, my - 0.5 - wig, mx - 9.5, my - 1.5 - wig, mx - 8.5, my - 0.5);
    ctx.bezierCurveTo(mx - 6.5, my - 3.5, mx - 3, my - 3.5, mx, my - 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(mx - 6, my - 0.5);
    ctx.quadraticCurveTo(mx - 2, my - 1.8, mx + 1, my - 1);
    ctx.moveTo(mx + 3, my - 1.2);
    ctx.quadraticCurveTo(mx + 6, my - 2, mx + 8.5, my);
    ctx.stroke();
    // casquette rose
    ctx.fillStyle = C.hat;
    ctx.beginPath();
    ctx.moveTo(hx - 12.5, hy - 5);
    ctx.bezierCurveTo(hx - 13, hy - 20, hx + 12, hy - 22, hx + 13, hy - 7);
    ctx.lineTo(hx + 12, hy - 5);
    ctx.lineTo(hx - 12.5, hy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.hatLight;
    ellipsePath(ctx, hx - 4, hy - 15, 4, 2, -0.4);
    ctx.fill();
    // visière
    ctx.fillStyle = C.hatDark;
    ctx.beginPath();
    ctx.moveTo(hx + 3, hy - 8);
    ctx.quadraticCurveTo(hx + 18, hy - 10.5, hx + 23, hy - 5);
    ctx.quadraticCurveTo(hx + 14, hy - 3.6, hx + 3, hy - 4.5);
    ctx.closePath();
    ctx.fill();
    // écusson "M"
    ctx.fillStyle = '#fff';
    circlePath(ctx, hx + 1.5, hy - 12.5, 4.8);
    ctx.fill();
    ctx.strokeStyle = C.hatDark;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 1.3, hy - 10.4);
    ctx.lineTo(hx - 1.3, hy - 14.6);
    ctx.lineTo(hx + 1.5, hy - 11.8);
    ctx.lineTo(hx + 4.3, hy - 14.6);
    ctx.lineTo(hx + 4.3, hy - 10.4);
    ctx.stroke();
  }

  // Malice debout, les pieds au point (x, y).
  // o : facing (1 ou -1), pose, t (temps), ph (phase de marche), palette, sx/sy (écrasement)
  function malice(ctx, x, y, o) {
    o = o || {};
    const C = o.palette || MALICE;
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const ph = o.ph || 0;
    ctx.save();
    ctx.translate(x, y);
    const sc = o.scale || 1;
    ctx.scale((o.facing || 1) * sc * (o.sx || 1), sc * (o.sy || 1));
    let legF = 0;
    let legB = 0;
    let armF = 0.12;
    let armB = -0.12;
    let bob = 0;
    let lean = 0;
    switch (pose) {
      case 'walk': {
        const s = Math.sin(ph);
        legF = s * 0.62; legB = -s * 0.62;
        armF = -s * 0.8; armB = s * 0.8;
        bob = -Math.abs(Math.cos(ph)) * 2.2;
        lean = 0.05;
        break;
      }
      case 'jump': legF = -1.0; legB = 0.35; armF = -2.75; armB = 0.8; break;
      case 'fall': legF = 0.4; legB = -0.3; armF = -2.0; armB = -1.5; break;
      case 'pound': legF = -1.7; legB = -1.4; armF = -2.6; armB = -2.4; bob = 4; break;
      case 'throw': armF = -1.55; armB = 0.5; legF = 0.25; legB = -0.25; break;
      case 'win': armF = -2.8 + Math.sin(t * 10) * 0.2; armB = -2.6; legF = 0.15; legB = -0.15; break;
      case 'hurt': armF = -2.3; armB = -2.5; legF = 0.5; legB = -0.5; lean = -0.12; break;
      case 'hold': armF = -1.3; armB = -1.1; break;
      default:
        bob = Math.sin(t * 2.5) * 0.7;
        armF = 0.12 + Math.sin(t * 2.5) * 0.05;
    }
    ctx.translate(0, bob);
    ctx.rotate(lean);
    drawArm(ctx, C, -4, -38, armB, true);
    drawLeg(ctx, C, -4, -19.5, legB, true);
    drawLeg(ctx, C, 4, -19.5, legF, false);
    drawBody(ctx, C);
    drawHead(ctx, C, o);
    if (o.holding) o.holding(ctx);
    drawArm(ctx, C, 5, -38, armF, false);
    ctx.restore();
  }

  function maliceHead(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(-5, 52);
    drawHead(ctx, MALICE, { pose: 'idle', t: 1 });
    ctx.restore();
  }

  // ---------------- Gros oeil à pattes ----------------
  function eyeMonster(ctx, x, y, o) {
    ctx.save();
    ctx.translate(x, y);
    const dir = o.dir || 1;
    const lp = o.legPhase || 0;
    const moving = o.moving !== false;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const side of [-1, 1]) {
      const p = lp + (side > 0 ? 0 : Math.PI);
      const sw = moving ? Math.sin(p) : 0;
      const lift = moving ? Math.max(0, -Math.cos(p)) * 4 : 0;
      const fx = side * 7 + sw * 7;
      ctx.strokeStyle = '#7d3a5c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(side * 6, -17);
      ctx.quadraticCurveTo(side * 11 + sw * 2, -9, fx, -3 - lift);
      ctx.stroke();
      ctx.fillStyle = '#5c2443';
      ellipsePath(ctx, fx + 3 * dir, -2.5 - lift, 6.5, 3.3);
      ctx.fill();
    }
    const cy = -33;
    const R = 19;
    const g = ctx.createRadialGradient(-6, cy - 7, 2, 0, cy, R);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.7, '#f3edf7');
    g.addColorStop(1, '#d6c4e3');
    ctx.fillStyle = g;
    circlePath(ctx, 0, cy, R);
    ctx.fill();
    ctx.strokeStyle = '#9b7fb3';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // petites veines rouges
    ctx.strokeStyle = 'rgba(214,40,64,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.27 + 0.5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(ca * R * 0.95, cy + sa * R * 0.95);
      ctx.quadraticCurveTo(ca * R * 0.75 + sa * 3, cy + sa * R * 0.75 - ca * 3, ca * R * 0.58, cy + sa * R * 0.58);
      ctx.stroke();
    }
    const lx = (o.look ? o.look.x : dir) * 7;
    const ly = (o.look ? o.look.y : 0) * 6;
    const hue = o.hue == null ? 140 : o.hue;
    const ig = ctx.createRadialGradient(lx, cy + ly, 1, lx, cy + ly, 9);
    ig.addColorStop(0, `hsl(${hue},80%,70%)`);
    ig.addColorStop(1, `hsl(${hue},70%,32%)`);
    ctx.fillStyle = ig;
    circlePath(ctx, lx, cy + ly, 8.5);
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, lx + dir * 0.5, cy + ly, o.chasing ? 2.8 : 4.6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circlePath(ctx, lx - 2.5, cy + ly - 3, 2.2);
    ctx.fill();
    // paupière
    const lid = o.lid || 0;
    if (lid > 0) {
      ctx.save();
      circlePath(ctx, 0, cy, R);
      ctx.clip();
      ctx.fillStyle = '#d58fb0';
      ctx.fillRect(-R, cy - R, R * 2, R * 2 * lid);
      ctx.strokeStyle = '#7d3a5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-R, cy - R + R * 2 * lid);
      ctx.lineTo(R, cy - R + R * 2 * lid);
      ctx.stroke();
      ctx.restore();
    }
    if (o.chasing) {
      ctx.strokeStyle = '#3b1a33';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12 * dir, cy - R - 2);
      ctx.lineTo(6 * dir, cy - R + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------- Rubik's cube ----------------
  const CUBE_COLORS = ['#f6f6f6', '#ffd500', '#e8202a', '#ff8a00', '#1f5fe0', '#16a34a'];

  function rubik(ctx, x, y, o) {
    ctx.save();
    ctx.translate(x + (o.shake || 0), y);
    const S = 40;
    const D = 7;
    const st = (S - 8) / 3;
    // dessus
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.moveTo(-S / 2, -S + 1);
    ctx.lineTo(-S / 2 + D, -S - D);
    ctx.lineTo(S / 2 + D, -S - D);
    ctx.lineTo(S / 2 + D, -D);
    ctx.lineTo(S / 2, 0);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = o.top[i];
      const x0 = -S / 2 + 3 + i * (st + 1);
      ctx.beginPath();
      ctx.moveTo(x0 + 1.5, -S - 1.5);
      ctx.lineTo(x0 + D - 1, -S - D + 1.5);
      ctx.lineTo(x0 + D - 1 + st - 1, -S - D + 1.5);
      ctx.lineTo(x0 + st, -S - 1.5);
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = o.side[i];
      const y0 = -S + 3 + i * (st + 1);
      ctx.beginPath();
      ctx.moveTo(S / 2 + 1.5, y0 + 1);
      ctx.lineTo(S / 2 + D - 1.5, y0 - D + 3);
      ctx.lineTo(S / 2 + D - 1.5, y0 - D + 3 + st - 1);
      ctx.lineTo(S / 2 + 1.5, y0 + st);
      ctx.closePath();
      ctx.fill();
    }
    // face avant
    ctx.fillStyle = '#111';
    roundRectPath(ctx, -S / 2, -S, S, S, 4);
    ctx.fill();
    ctx.save();
    roundRectPath(ctx, -S / 2, -S, S, S, 4);
    ctx.clip();
    for (let r = 0; r < 3; r++) {
      const shift = r === o.turnRow ? (o.turn || 0) * (st + 2) : 0;
      for (let c = -1; c < 4; c++) {
        const idx = r * 3 + ((c % 3) + 3) % 3;
        if ((c < 0 || c > 2) && !shift) continue;
        ctx.fillStyle = o.colors[idx];
        roundRectPath(ctx, -S / 2 + 3 + c * (st + 1) + shift, -S + 3 + r * (st + 1), st - 1, st - 1, 2);
        ctx.fill();
      }
    }
    ctx.restore();
    // visage
    const lx = o.look ? o.look.x * 2.5 : 0;
    const ly = o.look ? o.look.y * 2 : 0;
    for (const sx of [-8, 8]) {
      ctx.fillStyle = '#fff';
      ellipsePath(ctx, sx, -24, 5.2, 6);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#111';
      circlePath(ctx, sx + lx, -23.5 + ly, 2.6);
      ctx.fill();
    }
    const angry = o.angry || 0;
    if (angry > 0) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, -34);
      ctx.lineTo(-3, -29);
      ctx.moveTo(14, -34);
      ctx.lineTo(3, -29);
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      for (let i = 0; i <= 8; i++) ctx.lineTo(-8 + i * 2, i % 2 ? -12 : -8);
      ctx.lineTo(8, -6);
      ctx.lineTo(-8, -6);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = angry * (0.25 + 0.2 * Math.sin((o.t || 0) * 30));
      ctx.fillStyle = '#ff2a00';
      roundRectPath(ctx, -S / 2, -S, S, S, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (!o.noMouth) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -15, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------- Coccinelle ----------------
  const SPOTS = [[-12, -26], [2, -31], [12, -22], [-18, -14], [-3, -18], [8, -11], [-9, -8]];

  function ladybug(ctx, x, y, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.dir || 1, 1);
    const t = o.t || 0;
    const lp = o.legPhase || 0;
    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (!o.fly) {
      for (let i = 0; i < 3; i++) {
        const sw = Math.sin(lp + i * 2.1) * 4;
        ctx.beginPath();
        ctx.moveTo(-12 + i * 12, -8);
        ctx.lineTo(-14 + i * 12 + sw, -3);
        ctx.lineTo(-12 + i * 12 + sw, 0);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-12 + i * 12, -8);
        ctx.lineTo(-10 + i * 12, -1 + Math.sin(t * 6 + i) * 1.5);
        ctx.stroke();
      }
    }
    // tête
    ctx.fillStyle = '#1b1b22';
    circlePath(ctx, 22, -15, 12);
    ctx.fill();
    ctx.strokeStyle = '#1b1b22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, -25);
    ctx.quadraticCurveTo(27, -36, 33, -37);
    ctx.moveTo(19, -26);
    ctx.quadraticCurveTo(19, -38, 24, -41);
    ctx.stroke();
    ctx.fillStyle = '#1b1b22';
    circlePath(ctx, 33, -37, 2.5);
    ctx.fill();
    circlePath(ctx, 24, -41, 2.5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ellipsePath(ctx, 27, -18, 4.2, 5);
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, 28.5, -17.5, 2.2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ellipsePath(ctx, 18, -19, 2.8, 3.6);
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, 19, -18.5, 1.5);
    ctx.fill();
    if (o.angry) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(22, -26);
      ctx.lineTo(31, -22);
      ctx.stroke();
    }
    // ailes transparentes
    const open = o.open || 0;
    if (open > 0 || o.fly) {
      const flap = o.fly ? Math.sin(t * 40) * 0.5 : 0;
      ctx.save();
      ctx.translate(-6, -26);
      ctx.rotate(-0.9 - open * 0.3 + flap);
      ctx.fillStyle = 'rgba(210,230,255,0.65)';
      ctx.strokeStyle = 'rgba(120,140,180,0.8)';
      ctx.lineWidth = 1;
      ellipsePath(ctx, -14, 0, 18, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // dessous noir
    ctx.fillStyle = '#151515';
    ellipsePath(ctx, -1, -9, 25, 7);
    ctx.fill();
    // carapace rouge
    ctx.save();
    ctx.translate(-26, -8);
    ctx.rotate(-open * 0.35);
    ctx.translate(26, 8);
    const sg = ctx.createRadialGradient(-8, -28, 3, -2, -16, 30);
    sg.addColorStop(0, '#ff6a5a');
    sg.addColorStop(0.6, '#e3201b');
    sg.addColorStop(1, '#a40f10');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-27, -8);
    ctx.bezierCurveTo(-28, -30, -10, -40, 2, -38);
    ctx.bezierCurveTo(16, -36, 21, -22, 19, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a0c0c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#151515';
    const n = o.spots == null ? 7 : o.spots;
    for (let i = 0; i < n; i++) {
      circlePath(ctx, SPOTS[i][0], SPOTS[i][1], i === 1 ? 4.5 : 3.8);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipsePath(ctx, -8, -31, 6, 2.5, -0.4);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // Langue + gouttes de sueur pour les ennemis devenus gros avec les chips.
  function tiredFace(ctx, x, y, t, resting) {
    ctx.save();
    ctx.translate(x, y);
    const pant = resting ? Math.sin(t * 14) : 0;
    ctx.fillStyle = '#ff6f91';
    ctx.strokeStyle = '#c23a5e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.quadraticCurveTo(7, 10 + pant * 2, 0, 12 + pant * 2);
    ctx.quadraticCurveTo(-7, 10 + pant * 2, -5, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, 8 + pant);
    ctx.stroke();
    ctx.restore();
  }

  function sweat(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#7fd3ff';
    ctx.strokeStyle = '#2f8fd0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(4, 1, 0, 3);
    ctx.quadraticCurveTo(-4, 1, 0, -5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Caramel collant qui recouvre le bas d'un ennemi.
  function caramelGoo(ctx, x, y, w, h, t, fade) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= fade;
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, '#f2b45a');
    g.addColorStop(1, '#a8571a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 6, 0);
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const px = -w / 2 - 4 + (w + 8) * (i / n);
      const py = -h + Math.sin(i * 2.3 + t * 2) * 3 + (i % 2) * 5;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(w / 2 + 6, 0);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const dx = -w / 3 + i * (w / 3);
      const dl = 5 + ((t * 3 + i) % 2) * 3;
      ctx.beginPath();
      ctx.ellipse(dx, -h + 8 + dl, 2.5, dl / 2 + 2, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,240,200,0.6)';
    ellipsePath(ctx, -w / 4, -h + 7, w / 5, 2.2, -0.2);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Bonus ----------------
  function passionFruit(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    const g = ctx.createRadialGradient(-7, -5, 2, -3, 0, 13);
    g.addColorStop(0, '#b05bd8');
    g.addColorStop(1, '#4b1470');
    ctx.fillStyle = g;
    circlePath(ctx, -3, -1, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,255,0.35)';
    for (let i = 0; i < 9; i++) {
      circlePath(ctx, -3 + Math.cos(i * 2.4) * 8 * hash(i), -1 + Math.sin(i * 2.4) * 8 * hash(i + 3), 0.9);
      ctx.fill();
    }
    ctx.strokeStyle = '#3f7d1f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -12);
    ctx.quadraticCurveTo(-2, -17, 2, -18);
    ctx.stroke();
    ctx.fillStyle = '#5cbf3a';
    ellipsePath(ctx, -7, -15, 5, 2.5, 0.5);
    ctx.fill();
    // moitié coupée avec les graines
    ctx.fillStyle = '#5a1a7a';
    ellipsePath(ctx, 7, 5, 9.5, 8.5);
    ctx.fill();
    ctx.fillStyle = '#f6f0d8';
    ellipsePath(ctx, 7, 5, 8, 7);
    ctx.fill();
    const pg = ctx.createRadialGradient(7, 5, 1, 7, 5, 7);
    pg.addColorStop(0, '#ffe066');
    pg.addColorStop(1, '#ffb10a');
    ctx.fillStyle = pg;
    ellipsePath(ctx, 7, 5, 6.5, 5.6);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    const seeds = [[4, 3], [8, 2], [10, 6], [6, 7], [3, 6], [8, 9], [11, 3]];
    seeds.forEach(([sx, sy]) => { circlePath(ctx, sx, sy, 1.1); ctx.fill(); });
    ctx.restore();
  }

  function caramel(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    ctx.rotate(-0.12);
    const g = ctx.createLinearGradient(-10, -12, 10, 12);
    g.addColorStop(0, '#f7c46c');
    g.addColorStop(0.5, '#d98a2e');
    g.addColorStop(1, '#9c5212');
    ctx.fillStyle = g;
    roundRectPath(ctx, -12, -12, 24, 21, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.quadraticCurveTo(-7, 15, -4, 14);
    ctx.quadraticCurveTo(-3, 9, -2, 7);
    ctx.moveTo(3, 7);
    ctx.quadraticCurveTo(4, 12, 6, 11);
    ctx.quadraticCurveTo(7, 9, 8, 7);
    ctx.fillStyle = '#b8661c';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,220,0.75)';
    ellipsePath(ctx, -4, -7, 6, 2.2, -0.2);
    ctx.fill();
    circlePath(ctx, 6, -8, 1.5);
    ctx.fill();
    ctx.restore();
  }

  function caramelBlob(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 8);
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, r);
    g.addColorStop(0, '#f7c46c');
    g.addColorStop(1, '#b0601c');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * TAU;
      const rr = r * (0.85 + 0.2 * Math.sin(i * 3 + t * 20));
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,220,0.7)';
    circlePath(ctx, -r * 0.3, -r * 0.3, r * 0.25);
    ctx.fill();
    ctx.restore();
  }

  function chip(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#f7d36b';
    ctx.strokeStyle = '#c99a2e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * TAU;
      const r = 1 + 0.08 * Math.sin(i * 2.7);
      ctx.lineTo(Math.cos(a) * 9 * r, Math.sin(a) * 7 * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,150,50,0.6)';
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.quadraticCurveTo(0, -4, 6, 0);
    ctx.stroke();
    ctx.fillStyle = '#c98a2e';
    circlePath(ctx, -3, 2, 1);
    ctx.fill();
    circlePath(ctx, 3, 3, 0.8);
    ctx.fill();
    circlePath(ctx, 2, -3, 0.8);
    ctx.fill();
    ctx.restore();
  }

  function chipsBag(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    chip(ctx, -5, -12, 0.8, -0.5);
    chip(ctx, 5, -13, 0.8, 0.4);
    const g = ctx.createLinearGradient(-12, 0, 12, 0);
    g.addColorStop(0, '#1f9a4a');
    g.addColorStop(0.5, '#3fd06e');
    g.addColorStop(1, '#16803b');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-12, -9);
    for (let i = 0; i <= 8; i++) ctx.lineTo(-12 + i * 3, i % 2 ? -11 : -9);
    ctx.lineTo(11, 12);
    ctx.quadraticCurveTo(0, 15, -11, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff4c2';
    ellipsePath(ctx, 0, 2, 8, 6);
    ctx.fill();
    chip(ctx, 0, 2, 0.65, 0.2);
    ctx.fillStyle = '#1b5e2d';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VINAIGRE', 0, -3.5);
    ctx.restore();
  }

  function starShape(ctx, r, inner) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * inner : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function star(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin((t || 0) * 3) * 0.15);
    ctx.lineJoin = 'round';
    starShape(ctx, r, 0.48);
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 1, 0, 0, r);
    g.addColorStop(0, '#fffbd0');
    g.addColorStop(0.5, '#ffe02a');
    g.addColorStop(1, '#ffb300');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#e07b00';
    ctx.lineWidth = r * 0.12;
    ctx.stroke();
    ctx.fillStyle = '#3a2400';
    ellipsePath(ctx, -r * 0.18, -r * 0.08, r * 0.08, r * 0.15);
    ctx.fill();
    ellipsePath(ctx, r * 0.18, -r * 0.08, r * 0.08, r * 0.15);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Friandises à ramasser ----------------
  const CANDY_COLORS = [
    ['#ff5fa8', '#ffc2de'], ['#4fb6ff', '#c4e8ff'], ['#7ee04f', '#d6ffbf'],
    ['#ffa12e', '#ffe0b0'], ['#b06bff', '#e6ceff'], ['#ffd21f', '#fff3b0'],
  ];

  // Bonbon emballé
  function candy(ctx, x, y, s, t, v) {
    const [c1, c2] = CANDY_COLORS[(v || 0) % CANDY_COLORS.length];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin((t || 0) * 2.2 + (v || 0)) * 0.25 - 0.3);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = c2;
    ctx.strokeStyle = c1;
    ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 7, 0);
      ctx.lineTo(side * 15, -7);
      ctx.quadraticCurveTo(side * 13, 0, side * 15, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
    g.addColorStop(0, c2);
    g.addColorStop(0.45, c1);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ellipsePath(ctx, 0, 0, 9.5, 7.5);
    ctx.fill();
    ctx.save();
    ellipsePath(ctx, 0, 0, 9.5, 7.5);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 4, 9);
      ctx.lineTo(i * 5 + 4, -9);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ellipsePath(ctx, -3.5, -3.5, 3, 1.6, -0.5);
    ctx.fill();
    ctx.restore();
  }

  // Sucette en spirale
  function lollipop(ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin((t || 0) * 2) * 0.15);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#d9d9e6';
    ctx.lineWidth = 1;
    roundRectPath(ctx, -1.8, 2, 3.6, 17, 1.8);
    ctx.fill();
    ctx.stroke();
    const R = 11;
    const cols = ['#ff4f9a', '#ffd21f', '#4fb6ff', '#7ee04f', '#b06bff', '#ffa12e'];
    ctx.save();
    circlePath(ctx, 0, -6, R);
    ctx.clip();
    ctx.translate(0, -6);
    ctx.rotate((t || 0) * 1.5);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R + 1, (i / 6) * TAU, ((i + 1) / 6) * TAU);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let a = 0; a < TAU * 2.2; a += 0.2) {
      const r = 1 + a * 0.8;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    circlePath(ctx, 0, -6, R);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipsePath(ctx, -4, -11, 3.5, 2, -0.6);
    ctx.fill();
    ctx.restore();
  }

  // Balle multicolore
  function ball(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    const cols = ['#ff4f6a', '#ffd21f', '#3fc1ff', '#7ee04f', '#b06bff', '#ff9a2e'];
    ctx.save();
    circlePath(ctx, 0, 0, r);
    ctx.clip();
    ctx.rotate((t || 0) * 2);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r + 1, (i / 6) * TAU, ((i + 1) / 6) * TAU);
      ctx.closePath();
      ctx.fill();
    }
    ctx.rotate(-(t || 0) * 2);
    const sh = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
    sh.addColorStop(0, 'rgba(255,255,255,0.7)');
    sh.addColorStop(0.35, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = sh;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = '#fff';
    circlePath(ctx, 0, 0, r * 0.22);
    ctx.fill();
    ctx.restore();
  }

  function heart(ctx, x, y, s, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-9, -1, -7, -10, 0, -5);
    ctx.bezierCurveTo(7, -10, 9, -1, 0, 6);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.restore();
  }

  // Éclair au chocolat (la pâtisserie !)
  function eclair(ctx, x, y, a, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a || 0);
    ctx.scale(s || 1, s || 1);
    const g = ctx.createLinearGradient(0, -6, 0, 9);
    g.addColorStop(0, '#f0bd73');
    g.addColorStop(1, '#b8732e');
    ctx.fillStyle = g;
    roundRectPath(ctx, -24, -5, 48, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    roundRectPath(ctx, -21, -3, 42, 4, 2);
    ctx.fill();
    ctx.fillStyle = '#4a2412';
    ctx.beginPath();
    ctx.moveTo(-22, -2);
    ctx.quadraticCurveTo(-24, -9, -16, -9);
    ctx.lineTo(16, -9);
    ctx.quadraticCurveTo(24, -9, 22, -2);
    for (let i = 0; i <= 8; i++) ctx.lineTo(22 - i * 5.5, -1 + (i % 2) * 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,100,70,0.9)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.lineTo(10, -7);
    ctx.stroke();
    ctx.restore();
  }

  // Éclairs électriques (zigzags) autour d'un point.
  function sparks(ctx, x, y, radius, seed, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? `rgba(255,230,80,${0.45 * alpha})` : `rgba(255,255,240,${alpha})`;
      ctx.lineWidth = pass === 0 ? 6 : 2;
      for (let b = 0; b < 6; b++) {
        const side = b % 2 ? 1 : -1;
        let px = 0;
        let py = 0;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const len = radius * (0.5 + hash(seed + b * 7.1) * 0.5);
        const steps = 5;
        for (let i = 1; i <= steps; i++) {
          px = side * len * (i / steps);
          py = -hash(seed * 3 + b * 11 + i) * 26 * (1 - i / steps * 0.6) - (b > 3 ? 14 : 0) * (i / steps);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------------- Bébé oiseau ----------------
  function babyBird(ctx, x, y, t, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    const hop = o.happy ? Math.abs(Math.sin(t * 8)) * 8 : 0;
    // nid
    if (!o.noNest) {
      ctx.fillStyle = '#7a4a22';
      ellipsePath(ctx, 0, -6, 22, 9);
      ctx.fill();
      ctx.strokeStyle = '#a8703a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(-20 + i * 6, -10 + (i % 2) * 4);
        ctx.quadraticCurveTo(-14 + i * 6, -2, -8 + i * 6, -9 + (i % 3) * 2);
        ctx.stroke();
      }
    }
    ctx.translate(0, -hop);
    const bodyY = -18;
    // corps bleu-violet avec le ventre blanc
    const g = ctx.createRadialGradient(-5, bodyY - 6, 2, 0, bodyY, 15);
    g.addColorStop(0, '#a99cff');
    g.addColorStop(0.55, '#6c5cf0');
    g.addColorStop(1, '#4433b8');
    ctx.fillStyle = g;
    circlePath(ctx, 0, bodyY, 13);
    ctx.fill();
    const wb = ctx.createRadialGradient(0, bodyY + 3, 1, 0, bodyY + 5, 10);
    wb.addColorStop(0, '#ffffff');
    wb.addColorStop(1, '#e4e2ff');
    ctx.fillStyle = wb;
    ellipsePath(ctx, 0, bodyY + 4, 8.5, 8);
    ctx.fill();
    ellipsePath(ctx, 0, bodyY - 3, 9.5, 6);
    ctx.fill();
    // houppette
    ctx.strokeStyle = '#5a49e0';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, bodyY - 12);
    ctx.quadraticCurveTo(-4, bodyY - 19, -1, bodyY - 21);
    ctx.moveTo(1, bodyY - 12);
    ctx.quadraticCurveTo(3, bodyY - 18, 7, bodyY - 18);
    ctx.stroke();
    // ailes
    const flap = Math.sin(t * (o.happy ? 25 : 10)) * (o.happy ? 0.8 : 0.35);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 11, bodyY + 2);
      ctx.rotate(side * (0.5 + flap));
      ctx.fillStyle = '#5443d6';
      ellipsePath(ctx, side * 3, 0, 7.5, 4.2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ellipsePath(ctx, side * 7, 0.5, 3, 2.4);
      ctx.fill();
      ctx.restore();
    }
    // yeux
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1a1a1a';
      ellipsePath(ctx, side * 5, bodyY - 3, 2.8, 3.6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      circlePath(ctx, side * 5 + 1, bodyY - 4.5, 1.1);
      ctx.fill();
    }
    ctx.fillStyle = '#ffa0c8';
    ellipsePath(ctx, -8, bodyY + 3, 2.5, 1.6);
    ctx.fill();
    ellipsePath(ctx, 8, bodyY + 3, 2.5, 1.6);
    ctx.fill();
    // bec (s'ouvre pour piailler)
    const open = o.chirp ? 3 : 0.6;
    ctx.fillStyle = '#ffb21a';
    ctx.beginPath();
    ctx.moveTo(-4, bodyY + 1);
    ctx.lineTo(4, bodyY + 1);
    ctx.lineTo(0, bodyY + 1 - 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3.5, bodyY + 1 + open * 0.3);
    ctx.lineTo(3.5, bodyY + 1 + open * 0.3);
    ctx.lineTo(0, bodyY + 4 + open);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Tête de lutin (sur les blocs bonus) ----------------
  function lutinFace(ctx, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    // oreilles pointues
    ctx.fillStyle = '#ffcfa8';
    ctx.strokeStyle = '#8a4a2a';
    ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 8, 0);
      ctx.lineTo(side * 17, -6);
      ctx.lineTo(side * 9, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd7b5';
    circlePath(ctx, 0, 2, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a1a10';
    circlePath(ctx, -3.6, 1, 1.6);
    ctx.fill();
    circlePath(ctx, 3.6, 1, 1.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,110,110,0.55)';
    circlePath(ctx, -6, 5, 2.2);
    ctx.fill();
    circlePath(ctx, 6, 5, 2.2);
    ctx.fill();
    ctx.strokeStyle = '#7a2a1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 5, 3.5, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.fillStyle = '#ffbe94';
    circlePath(ctx, 0, 3.5, 1.8);
    ctx.fill();
    // chapeau pointu
    ctx.fillStyle = '#2fae4f';
    ctx.strokeStyle = '#17652a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -5);
    ctx.quadraticCurveTo(-4, -14, 3, -24);
    ctx.quadraticCurveTo(12, -22, 14, -17);
    ctx.quadraticCurveTo(7, -14, 11, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8312f';
    roundRectPath(ctx, -12, -7, 24, 4.5, 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circlePath(ctx, 15, -17, 3.4);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Drapeaux ----------------
  function flag(ctx, x, y, h, t, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6b6b78';
    roundRectPath(ctx, -2.5, -h, 5, h, 2);
    ctx.fill();
    ctx.fillStyle = o.ball || '#ffd23a';
    circlePath(ctx, 0, -h - 4, 5);
    ctx.fill();
    const fy = -h + 4 + (o.lower || 0);
    const fw = o.w || 34;
    const fh = o.fh || 22;
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.moveTo(2, fy);
    for (let i = 0; i <= 8; i++) {
      const px = 2 + (fw * i) / 8;
      ctx.lineTo(px, fy + Math.sin(t * 6 - i * 0.7) * 2.5 * (i / 8));
    }
    for (let i = 8; i >= 0; i--) {
      const px = 2 + (fw * i) / 8;
      ctx.lineTo(px, fy + fh + Math.sin(t * 6 - i * 0.7) * 2.5 * (i / 8) - (i / 8) * fh * 0.15);
    }
    ctx.closePath();
    ctx.fill();
    if (o.emblem) o.emblem(ctx, 2 + fw * 0.45, fy + fh * 0.5);
    ctx.restore();
  }

  return {
    MALICE, CUBE_COLORS, maliceRainbow, malice, maliceHead,
    eyeMonster, rubik, ladybug, tiredFace, sweat, caramelGoo,
    passionFruit, caramel, caramelBlob, chip, chipsBag, star, starShape, candy, lollipop, ball, heart,
    eclair, sparks, babyBird, lutinFace, flag,
  };
})();
