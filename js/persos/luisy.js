'use strict';

// ---------------- Luisy ----------------
// Une grande princesse toute fine : robe orange et jaune, ceinture et manches bouffantes vertes,
// longs cheveux auburn, petite couronne d'or avec une marguerite… et une jolie petite moustache !
// Pouvoir : elle plane en tombant, la robe ouverte comme un parapluie (pose 'glide').
(() => {
  const H = Heroes;
  const C = {
    dress: '#ffb52e', dressDark: '#f0902a', dressLight: '#ffe08a', dressLine: '#b8650a', lining: '#e8781e',
    green: '#46c454', greenDark: '#2f9e3e', greenLight: '#9ae89a', greenLine: '#1a6a24',
    skin: '#ffdcc4', skinShade: '#f6c3a6', skinLine: '#c98868', cheek: '#ff8fa8',
    hair: '#b4482c', hairDark: '#8a3220', hairLight: '#e07a54', hairLine: '#5a1e10',
    glove: '#ffffff', gloveShade: '#e2e6f2', gloveLine: '#a3aac4',
    gold: '#ffd23a', goldDark: '#e8a818', goldLine: '#a87808',
    mustache: '#6a3a1c', iris: '#3a8ae8', eye: '#1a1a3a',
  };
  const HIP = -21;
  const LEG = 15;
  const ARM = 12.5;
  const HX = 2;
  const HY = -54;

  function leg(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2.3, 0, 4.6, LEG, 2.3);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 1);
    // petite botte verte
    ctx.translate(0, LEG + 1);
    ctx.rotate(-a);
    roundRectPath(ctx, -3, -7, 6, 7, 2.4);
    H.paint(ctx, back ? C.greenDark : C.green, C.greenLine, 1);
    ctx.beginPath();
    ctx.moveTo(-3.4, 0.8);
    ctx.quadraticCurveTo(-3.4, -3.2, 0.6, -3.2);
    ctx.quadraticCurveTo(7, -2.8, 7.4, 1);
    ctx.quadraticCurveTo(7.4, 2.8, 4.4, 2.8);
    ctx.lineTo(-2, 2.8);
    ctx.quadraticCurveTo(-3.4, 2.8, -3.4, 0.8);
    ctx.closePath();
    H.paint(ctx, back ? C.greenDark : C.green, C.greenLine, 1);
    if (!back) {
      ctx.fillStyle = C.greenLight;
      ellipsePath(ctx, 3.4, -1.2, 2, 0.9, -0.15);
      ctx.fill();
    }
    ctx.restore();
  }

  // Un bras : manche bouffante verte, bras, gant blanc.
  function arm(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -1.8, 2, 3.6, ARM - 3, 1.8);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    roundRectPath(ctx, -2.4, ARM - 4.4, 4.8, 3.6, 1.4);
    H.paint(ctx, back ? C.gloveShade : C.glove, C.gloveLine, 0.9);
    circlePath(ctx, 0, ARM, 2.9);
    H.paint(ctx, back ? C.gloveShade : C.glove, C.gloveLine, 0.95);
    circlePath(ctx, 0, 1.6, 4.4);
    H.paint(ctx, back ? C.greenDark : C.green, C.greenLine, 0.95);
    ctx.strokeStyle = C.greenLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-1.4, -2.2);
    ctx.quadraticCurveTo(-2.6, 1.6, -1.2, 5.4);
    ctx.moveTo(1.6, -2.2);
    ctx.quadraticCurveTo(2.8, 1.6, 1.4, 5.4);
    ctx.stroke();
    if (!back) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ellipsePath(ctx, -1.6, -0.6, 1.4, 1.8, 0.3);
      ctx.fill();
    }
    ctx.restore();
  }

  // Le bas de la robe festonné, de (x0, y0) à (x1, y1).
  function scallops(ctx, x0, y0, x1, y1, n, deep) {
    for (let i = 1; i <= n; i++) {
      const k0 = (i - 1) / n;
      const k1 = i / n;
      const mx = x0 + (x1 - x0) * (k0 + k1) / 2;
      const my = y0 + (y1 - y0) * (k0 + k1) / 2;
      ctx.quadraticCurveTo(mx, my + deep, x0 + (x1 - x0) * k1, y0 + (y1 - y0) * k1);
    }
  }

  // Le corsage, la ceinture verte et la jupe (sw : la jupe qui se balance).
  function body(ctx, o, sw) {
    const glide = o.pose === 'glide';
    if (!glide) {
      ctx.beginPath();
      ctx.moveTo(-6.4, -28.4);
      ctx.lineTo(7.4, -28.4);
      ctx.quadraticCurveTo(12 + sw, -20, 14.6 + sw, -11);
      scallops(ctx, 14.6 + sw, -11, -13.4 + sw, -11.6, 5, 2.6);
      ctx.quadraticCurveTo(-11 + sw * 0.6, -20, -6.4, -28.4);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -29, 0, -10);
      g.addColorStop(0, C.dress);
      g.addColorStop(1, C.dressDark);
      H.paint(ctx, g, C.dressLine, 1.05);
      ctx.strokeStyle = C.dressLight;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(5, -25);
      ctx.quadraticCurveTo(9 + sw * 0.5, -19, 10.6 + sw, -13.6);
      ctx.moveTo(-1, -25);
      ctx.quadraticCurveTo(-1.6 + sw * 0.4, -19, -2 + sw * 0.8, -13);
      ctx.stroke();
    }
    // corsage
    ctx.beginPath();
    ctx.moveTo(-5.6, -40.6);
    ctx.quadraticCurveTo(1, -42.6, 7, -40.6);
    ctx.quadraticCurveTo(9.4, -34, 7.6, -27.6);
    ctx.lineTo(-6.6, -27.6);
    ctx.quadraticCurveTo(-7.8, -34, -5.6, -40.6);
    ctx.closePath();
    H.paint(ctx, C.dress, C.dressLine, 1.05);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ellipsePath(ctx, 4.4, -35.6, 1.8, 3.4, 0.1);
    ctx.fill();
    // col blanc arrondi et petite broche verte
    ctx.beginPath();
    ctx.moveTo(-4, -41.4);
    ctx.quadraticCurveTo(2, -36.4, 7.6, -40.4);
    ctx.quadraticCurveTo(2, -43.4, -4, -41.4);
    ctx.closePath();
    H.paint(ctx, '#ffffff', C.gloveLine, 0.8);
    circlePath(ctx, 5.4, -36.4, 1.5);
    H.paint(ctx, C.green, C.greenLine, 0.7);
    // ceinture
    roundRectPath(ctx, -7.2, -30.6, 15.6, 3.6, 1.6);
    H.paint(ctx, C.green, C.greenLine, 0.95);
    ctx.fillStyle = C.gold;
    roundRectPath(ctx, 5, -30.4, 2.8, 3.2, 0.8);
    H.paint(ctx, C.gold, C.goldLine, 0.7);
  }

  // Pose 'glide' : la jupe s'ouvre comme un parapluie (le dessus ; la doublure est derrière les jambes).
  function skirtUmbrella(ctx, o) {
    const w = Math.sin(o.t * 5) * 0.8;
    ctx.beginPath();
    ctx.moveTo(-6.2, -28.4);
    ctx.lineTo(7.2, -28.4);
    ctx.quadraticCurveTo(20, -29 + w, 25, -19.6 - w);
    scallops(ctx, 25, -19.6 - w, -24, -19.6 + w, 7, 3);
    ctx.quadraticCurveTo(-19, -29 - w, -6.2, -28.4);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -30, 0, -17);
    g.addColorStop(0, C.dressLight);
    g.addColorStop(0.5, C.dress);
    g.addColorStop(1, C.dressDark);
    H.paint(ctx, g, C.dressLine, 1.05);
    ctx.strokeStyle = C.dressDark;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const x of [-15, -6, 3, 12, 20]) {
      ctx.moveTo(x * 0.3, -28);
      ctx.quadraticCurveTo(x * 0.8, -26, x, -18.4);
    }
    ctx.stroke();
  }

  function skirtLining(ctx, o) {
    const w = Math.sin(o.t * 5) * 0.8;
    ellipsePath(ctx, 0.5, -19.4, 24.4, 4.4, -w * 0.02);
    H.paint(ctx, C.lining, C.dressLine, 1);
  }

  // Les longs cheveux dans le dos (lift : ils remontent quand elle tombe ou plane).
  function backHair(ctx, o, hx, hy, lift) {
    const t = o.t || 0;
    const sway = Math.sin(t * 2.2) * 0.04 + (o.pose === 'walk' || o.pose === 'run' ? Math.sin((o.ph || 0) * 2) * 0.05 : 0);
    ctx.save();
    ctx.translate(hx - 4, hy - 4);
    ctx.rotate(0.12 + sway + lift);
    ctx.translate(-(hx - 4), -(hy - 4));
    const L = 30;
    ctx.beginPath();
    ctx.moveTo(hx + 4, hy - 13);
    ctx.bezierCurveTo(hx - 12, hy - 14, hx - 17, hy, hx - 15, hy + L * 0.6);
    ctx.quadraticCurveTo(hx - 14, hy + L * 0.85, hx - 11, hy + L);
    ctx.quadraticCurveTo(hx - 9.6, hy + L - 3.4, hx - 7.4, hy + L - 0.6);
    ctx.quadraticCurveTo(hx - 5.6, hy + L - 4, hx - 3.4, hy + L - 2.4);
    ctx.quadraticCurveTo(hx - 3, hy + 14, hx - 1, hy + 6);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    ctx.strokeStyle = C.hairDark;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy + 4);
    ctx.quadraticCurveTo(hx - 12, hy + 16, hx - 9.6, hy + L - 4);
    ctx.moveTo(hx - 6, hy + 10);
    ctx.quadraticCurveTo(hx - 6.6, hy + 18, hx - 5.4, hy + L - 5);
    ctx.stroke();
    ctx.restore();
  }

  function daisy(ctx, x, y, r) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#b8b0a0';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * H.TAU;
      ellipsePath(ctx, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.26, a);
      ctx.fill();
      ctx.stroke();
    }
    circlePath(ctx, x, y, r * 0.38);
    H.paint(ctx, '#ffd21f', '#d08a00', 0.6);
  }

  function crown(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.12);
    ctx.beginPath();
    ctx.moveTo(-6.6, 0);
    ctx.lineTo(-7.2, -7);
    ctx.lineTo(-3.6, -3.4);
    ctx.lineTo(0, -9);
    ctx.lineTo(3.6, -3.4);
    ctx.lineTo(7.2, -7);
    ctx.lineTo(6.6, 0);
    ctx.quadraticCurveTo(0, 1.6, -6.6, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -9, 0, 1);
    g.addColorStop(0, '#fff3a0');
    g.addColorStop(1, C.goldDark);
    H.paint(ctx, g, C.goldLine, 0.95);
    for (const [gx, gy] of [[-7.2, -7], [0, -9], [7.2, -7]]) {
      circlePath(ctx, gx, gy, 1.1);
      H.paint(ctx, C.gold, C.goldLine, 0.6);
    }
    circlePath(ctx, -4.6, -1.2, 0.9);
    H.paint(ctx, '#46c4e4', '#1a6a8a', 0.5);
    circlePath(ctx, 4.6, -1.2, 0.9);
    H.paint(ctx, '#46c4e4', '#1a6a8a', 0.5);
    daisy(ctx, 0, -2.6, 3.6);
    ctx.restore();
  }

  // Les yeux bleus avec des cils.
  function lashes(ctx, x, y, rx, ry) {
    ctx.strokeStyle = C.eye;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + rx * 0.4, y - ry * 0.9);
    ctx.lineTo(x + rx * 1.1, y - ry * 1.3);
    ctx.moveTo(x + rx * 0.85, y - ry * 0.55);
    ctx.lineTo(x + rx * 1.6, y - ry * 0.8);
    ctx.stroke();
  }

  // La tête de trois-quarts.
  function headShape(ctx, o, hx, hy) {
    const t = o.t || 0;
    const pose = o.pose;
    circlePath(ctx, hx, hy, 13.4);
    H.paint(ctx, C.skin, C.skinLine, 1.05);
    // les cheveux : le dessus de la tête, la frange de côté, une mèche devant l'oreille
    ctx.beginPath();
    ctx.moveTo(hx - 13.8, hy + 6);
    ctx.bezierCurveTo(hx - 16, hy - 14, hx + 8, hy - 21, hx + 14, hy - 4.6);
    ctx.quadraticCurveTo(hx + 10, hy - 3.6, hx + 7.6, hy - 6.8);
    ctx.quadraticCurveTo(hx + 4, hy - 3, hx - 1, hy - 3.6);
    ctx.quadraticCurveTo(hx - 2.6, hy + 4, hx - 1.6, hy + 13);
    ctx.quadraticCurveTo(hx - 5, hy + 12, hx - 6.4, hy + 7);
    ctx.quadraticCurveTo(hx - 9, hy + 10, hx - 13.8, hy + 6);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    ctx.strokeStyle = C.hairLight;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy - 9);
    ctx.quadraticCurveTo(hx - 2, hy - 14.6, hx + 5, hy - 12);
    ctx.stroke();
    ctx.strokeStyle = C.hairDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx + 1, hy - 9);
    ctx.quadraticCurveTo(hx + 6, hy - 9, hx + 9.6, hy - 6);
    ctx.stroke();
    const happy = pose === 'win' || pose === 'jump' || pose === 'glide';
    const eo = { iris: C.iris, line: C.eye, hurt: o.hurt, blink: H.blinking(t, 1.7), look: { x: 0.6, y: 0 } };
    H.eye(ctx, hx + 2.4, hy + 0.6, 2.9, 4.2, eo);
    H.eye(ctx, hx + 9.6, hy + 0.6, 3.2, 4.6, eo);
    if (!o.hurt && !eo.blink) {
      lashes(ctx, hx + 2.4, hy + 0.6, 2.9, 4.2);
      lashes(ctx, hx + 9.6, hy + 0.6, 3.2, 4.6);
    }
    ctx.save();
    ctx.globalAlpha *= 0.55;
    ctx.fillStyle = C.cheek;
    ellipsePath(ctx, hx + 0.4, hy + 6.4, 2.6, 1.7);
    ctx.fill();
    ellipsePath(ctx, hx + 12.4, hy + 6, 1.6, 1.6);
    ctx.fill();
    ctx.restore();
    // la bouche
    const mx = hx + 9;
    const my = hy + 10.4;
    if (o.hurt) {
      ellipsePath(ctx, mx, my, 1.9, 1.7);
      H.paint(ctx, '#a3263b', '#6e1424', 0.8);
    } else if (happy) {
      ctx.beginPath();
      ctx.moveTo(mx - 3, my - 1);
      ctx.quadraticCurveTo(mx, my, mx + 3, my - 1.4);
      ctx.quadraticCurveTo(mx + 2.4, my + 3.4, mx, my + 3.4);
      ctx.quadraticCurveTo(mx - 2.6, my + 3.2, mx - 3, my - 1);
      ctx.closePath();
      H.paint(ctx, '#a3263b', '#6e1424', 0.8);
      ctx.fillStyle = '#ff7f95';
      ellipsePath(ctx, mx, my + 2.2, 1.6, 0.8);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#a3263b';
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mx - 2.6, my - 0.4);
      ctx.quadraticCurveTo(mx, my + 1.8, mx + 2.6, my - 0.8);
      ctx.stroke();
    }
    // la petite moustache bien taillée
    const sx = hx + 11;
    const sy = hy + 6.8;
    const wig = pose === 'walk' || pose === 'run' ? Math.sin((o.ph || 0) * 2) * 0.4 : 0;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 0.6);
    ctx.quadraticCurveTo(sx + 3.4, sy - 1.6, sx + 4.6, sy + 0.6 + wig);
    ctx.quadraticCurveTo(sx + 3.6, sy + 0.2, sx + 3, sy + 1.4);
    ctx.quadraticCurveTo(sx + 1, sy + 0.6, sx, sy + 1.2);
    ctx.quadraticCurveTo(sx - 2, sy + 0.6, sx - 4.2, sy + 1.6);
    ctx.quadraticCurveTo(sx - 4.8, sy + 0.4, sx - 6.4, sy + 0.8 - wig);
    ctx.quadraticCurveTo(sx - 4, sy - 1.8, sx, sy - 0.6);
    ctx.closePath();
    H.paint(ctx, C.mustache, '#3a1e0a', 0.7);
    // nez
    ellipsePath(ctx, hx + 13, hy + 3.8, 2, 2.4);
    H.paint(ctx, C.skin, C.skinLine, 0.95);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    circlePath(ctx, hx + 12.4, hy + 3, 0.7);
    ctx.fill();
    crown(ctx, hx + 0.6, hy - 12);
  }

  H.add('luisy', {
    draw(ctx, o, R) {
      const pose = o.pose;
      const t = o.t || 0;
      let { legF, legB, armF, armB, bob, lean, crouch } = R;
      const glide = pose === 'glide';
      let lift = 0;
      if (glide) {
        // elle descend tout doucement, les bras levés avec grâce
        bob = Math.sin(t * 3) * 1.4;
        armF = -1.75 + Math.sin(t * 3) * 0.12;
        armB = 1.8 - Math.sin(t * 3) * 0.12;
        legF = 0.12 + Math.sin(t * 2.4) * 0.12;
        legB = -0.1 - Math.sin(t * 2.4) * 0.1;
        lean = 0;
        lift = 0.5;
      } else if (pose === 'hang') {
        armF = -1.95 + Math.sin(t * 3) * 0.1;
        armB = 1.95 + Math.sin(t * 3) * 0.1;
        legF = 0.18 + Math.sin(t * 3) * 0.08;
        legB = -0.12 + Math.sin(t * 3) * 0.08;
      } else if (pose === 'crouch') {
        legF = -1.3;
        legB = -1.05;
        crouch = -HIP - Math.cos(legB) * (LEG + 1) - 3.4;
      }
      if (pose === 'fall' || pose === 'jump' || pose === 'pound') lift = pose === 'jump' ? -0.1 : 0.35;
      // la jupe suit le mouvement des jambes
      let sw = (legF + legB) * -1.6;
      if (pose === 'walk' || pose === 'run') sw = Math.sin((o.ph || 0) * 2) * 1.2;
      if (pose === 'fall' || pose === 'hurt') sw = -1.4;
      ctx.translate(0, bob);
      ctx.rotate(lean);
      ctx.save();
      ctx.translate(0, crouch);
      backHair(ctx, o, HX, HY, lift);
      arm(ctx, -1.2, -38.6, armB, true);
      if (glide) skirtLining(ctx, o);
      ctx.restore();
      leg(ctx, -2, HIP + crouch, legB, true);
      leg(ctx, 2, HIP + crouch, legF, false);
      ctx.save();
      ctx.translate(0, crouch);
      if (glide) skirtUmbrella(ctx, o);
      body(ctx, o, sw);
      // en planant, le bras passe sous la tête pour ne pas cacher son sourire
      if (glide) arm(ctx, 1.6, -38.4, armF, false);
      headShape(ctx, o, HX, HY);
      if (o.holding) {
        ctx.save();
        ctx.translate(0, -5);
        o.holding(ctx);
        ctx.restore();
      }
      if (!glide) arm(ctx, 1.6, -38.4, armF, false);
      ctx.restore();
    },
    head(ctx) {
      ctx.save();
      circlePath(ctx, -2, 5, 18);
      ctx.clip();
      backHair(ctx, { t: 1, pose: 'idle' }, -2, 6, 0);
      ctx.restore();
      headShape(ctx, { t: 1, pose: 'idle' }, -2, 6);
    },
  });
})();
