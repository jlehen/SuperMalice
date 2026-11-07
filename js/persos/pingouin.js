'use strict';

// ---------------- Le Pingouin ----------------
// Un pingouin tout rond qui se dandine : le dos noir, le ventre blanc, le bec et les pattes orange,
// et une écharpe rayée rouge et blanc qui flotte derrière lui. Pouvoir : il glisse sur le ventre (pose 'slide').
(() => {
  const H = Heroes;
  const C = {
    back: '#2e3446', backShade: '#232838', backLight: '#5c6780', line: '#11141d',
    white: '#ffffff', whiteShade: '#e4eaf4', whiteLine: '#9aa6ba',
    beak: '#ffa02a', beakDark: '#e0760e', foot: '#ff9a24', footDark: '#e57e12', footLine: '#a8520a',
    scarf: '#ff3d4c', scarfDark: '#c8202f', scarfLine: '#8e1220', stripe: '#fff6f2', cheek: '#ff8fa8',
  };

  // Plusieurs ellipses peintes comme une seule forme, avec un seul contour autour.
  function unionPath(ctx, list) {
    ctx.beginPath();
    for (const [x, y, rx, ry, rot] of list) {
      const r = rot || 0;
      ctx.moveTo(x + rx * Math.cos(r), y + rx * Math.sin(r));
      ctx.ellipse(x, y, rx, ry, r, 0, H.TAU);
    }
  }

  function union(ctx, list, fill, line, lw) {
    unionPath(ctx, list);
    ctx.strokeStyle = line;
    ctx.lineWidth = lw * 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // Un bout d'écharpe qui flotte depuis (x, y) dans la direction (dx, dy) : une bande rayée qui ondule.
  function scarfEnd(ctx, x, y, dx, dy, len, w, t, f, amp) {
    const n = 5;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const wave = Math.sin(t * f - u * 4) * amp * u;
      pts.push({ x: x + dx * len * u - dy * wave, y: y + dy * len * u + dx * wave });
    }
    const nor = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n, i + 1)];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: -(b.y - a.y) / d, y: (b.x - a.x) / d };
    });
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const wa = w * (1 - i / n * 0.15);
      const wb = w * (1 - (i + 1) / n * 0.15);
      ctx.beginPath();
      ctx.moveTo(a.x + nor[i].x * wa / 2, a.y + nor[i].y * wa / 2);
      ctx.lineTo(b.x + nor[i + 1].x * wb / 2, b.y + nor[i + 1].y * wb / 2);
      ctx.lineTo(b.x - nor[i + 1].x * wb / 2, b.y - nor[i + 1].y * wb / 2);
      ctx.lineTo(a.x - nor[i].x * wa / 2, a.y - nor[i].y * wa / 2);
      ctx.closePath();
      H.paint(ctx, i % 2 ? C.stripe : C.scarf, C.scarfLine, 0.8);
    }
    // les franges au bout
    const e = pts[n];
    const d = { x: e.x - pts[n - 1].x, y: e.y - pts[n - 1].y };
    const dl = Math.hypot(d.x, d.y) || 1;
    ctx.strokeStyle = C.scarfDark;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const k of [-0.3, 0, 0.3]) {
      const sx = e.x + nor[n].x * w * k;
      const sy = e.y + nor[n].y * w * k;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + d.x / dl * 2.2, sy + d.y / dl * 2.2);
    }
    ctx.stroke();
  }

  // Une nageoire : une goutte noire qui part de l'épaule, tournée de a.
  function flipper(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(-5, 9, -0.5, 16);
    ctx.quadraticCurveTo(1.5, 17, 2.6, 14);
    ctx.quadraticCurveTo(5, 6, 3, -0.5);
    ctx.quadraticCurveTo(0, -2.5, -3, 0);
    ctx.closePath();
    H.paint(ctx, back ? C.backShade : C.back, C.line, 1);
    if (!back) {
      ctx.fillStyle = C.backLight;
      ellipsePath(ctx, -0.6, 5, 1.1, 3.4, 0.1);
      ctx.fill();
    }
    ctx.restore();
  }

  // Un pied palmé orange (trois doigts arrondis), posé à plat, la cheville en (0, 0).
  function foot(ctx, x, y, rot, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.moveTo(-3.6, 1.6);
    ctx.quadraticCurveTo(-4, -1.6, -0.5, -1.8);
    ctx.quadraticCurveTo(5, -1.6, 9, 0.2);
    ctx.quadraticCurveTo(9.8, 1.2, 8.6, 1.8);
    ctx.quadraticCurveTo(7.6, 1.2, 6.8, 1.9);
    ctx.quadraticCurveTo(5.8, 1.3, 4.8, 2);
    ctx.quadraticCurveTo(3.6, 1.4, 2.6, 2);
    ctx.lineTo(-2.6, 2);
    ctx.quadraticCurveTo(-3.6, 2, -3.6, 1.6);
    ctx.closePath();
    H.paint(ctx, back ? C.footDark : C.foot, C.footLine, 0.95);
    ctx.restore();
  }

  function beak(ctx, x, y, open) {
    ctx.beginPath();
    ctx.moveTo(x, y - 2.6);
    ctx.quadraticCurveTo(x + 6, y - 2.4, x + 8.5, y + 0.4);
    ctx.quadraticCurveTo(x + 5, y + 1.2, x, y + 1);
    ctx.closePath();
    H.paint(ctx, C.beak, C.beakDark, 0.9);
    ctx.beginPath();
    ctx.moveTo(x, y + 1);
    ctx.quadraticCurveTo(x + 4, y + (open ? 5.5 : 2.4), x + 6.6, y + (open ? 3 : 1));
    ctx.quadraticCurveTo(x + 4, y + 1.2, x, y + 1);
    ctx.closePath();
    H.paint(ctx, C.beakDark, C.beakDark, 0.8);
  }

  // Le visage blanc, l'oeil, le bec et la joue (la tête est centrée en (x, y)).
  function face(ctx, o, x, y) {
    ctx.save();
    circlePath(ctx, x, y, 12);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(x + 13, y - 9);
    ctx.quadraticCurveTo(x + 4, y - 11, x + 1.5, y - 5);
    ctx.quadraticCurveTo(x - 0.5, y + 2, x + 1, y + 13);
    ctx.lineTo(x + 13, y + 13);
    ctx.closePath();
    H.paint(ctx, C.white, C.whiteLine, 1);
    ctx.restore();
    ctx.fillStyle = C.backLight;
    ellipsePath(ctx, x - 5, y - 6.5, 4, 2.4, -0.6);
    ctx.fill();
    beak(ctx, x + 10.5, y + 1, o.pose === 'win' || o.hurt);
    H.eye(ctx, x + 6, y - 3, 3.6, 4.4, {
      iris: '#1a1a2a', hurt: o.hurt, blink: H.blinking(o.t, 2.2), line: C.line, look: { x: 0.6, y: 0 },
    });
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.65;
    ellipsePath(ctx, x + 5, y + 4.5, 2.8, 1.7);
    ctx.fill();
    ctx.globalAlpha /= 0.65;
  }

  // Le tour de l'écharpe autour du cou, avec le noeud derrière.
  function scarfBand(ctx) {
    ctx.beginPath();
    ctx.moveTo(-12, -36);
    ctx.quadraticCurveTo(1, -30, 13.5, -35.5);
    ctx.lineTo(13, -30.5);
    ctx.quadraticCurveTo(1, -24.5, -11.5, -31);
    ctx.closePath();
    ctx.save();
    ctx.fillStyle = C.scarf;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = C.stripe;
    for (let i = -2; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-9 + i * 7, -38);
      ctx.lineTo(-6 + i * 7, -38);
      ctx.lineTo(-5 + i * 7, -22);
      ctx.lineTo(-8 + i * 7, -22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-12, -36);
    ctx.quadraticCurveTo(1, -30, 13.5, -35.5);
    ctx.lineTo(13, -30.5);
    ctx.quadraticCurveTo(1, -24.5, -11.5, -31);
    ctx.closePath();
    ctx.strokeStyle = C.scarfLine;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ellipsePath(ctx, -11, -33, 3, 2.8);
    H.paint(ctx, C.scarfDark, C.scarfLine, 1);
  }

  // Couché sur le ventre, il file vers l'avant.
  function slide(ctx, o) {
    const t = o.t;
    // les pattes en l'air derrière
    foot(ctx, -20, -13, -2.6, true);
    foot(ctx, -22, -9, -2.35, false);
    flipper(ctx, 1, -15, 1.75, true);
    union(ctx, [[-5, -10.5, 20, 10.5], [13, -12.5, 9.5, 9.5]], C.back, C.line, 1.1);
    // le ventre blanc par-dessous
    ctx.save();
    unionPath(ctx, [[-5, -10.5, 20, 10.5], [13, -12.5, 9.5, 9.5]]);
    ctx.clip();
    ellipsePath(ctx, -2, -1.5, 22, 7.5);
    H.paint(ctx, C.white, C.whiteLine, 1);
    ctx.restore();
    ctx.fillStyle = C.backLight;
    ellipsePath(ctx, -8, -17, 8, 1.8, -0.05);
    ctx.fill();
    // le visage, tourné vers l'avant
    face(ctx, o, 13, -12.5);
    // l'écharpe autour du cou
    ctx.save();
    ctx.translate(7, -12);
    ctx.rotate(-1.45);
    roundRectPath(ctx, -10, -2.6, 20, 5.2, 2.4);
    H.paint(ctx, C.scarf, C.scarfLine, 1);
    ctx.fillStyle = C.stripe;
    for (const x of [-6, 0, 6]) ctx.fillRect(x - 1.2, -2.1, 2.4, 4.2);
    ctx.restore();
    scarfEnd(ctx, 5, -20, -1, -0.32, 22, 4.4, t, 26, 2.4);
    scarfEnd(ctx, 5, -19.5, -1, -0.12, 18, 4, t + 0.3, 30, 2);
    ellipsePath(ctx, 6, -19.5, 2.8, 2.5);
    H.paint(ctx, C.scarfDark, C.scarfLine, 1);
    flipper(ctx, 2, -11, 1.6, false);
  }

  H.add('pingouin', {
    draw(ctx, o, R) {
      const t = o.t;
      if (o.pose === 'slide') {
        slide(ctx, o);
        return;
      }
      let { legF, legB, armF, armB, bob, lean } = R;
      const crouch = R.crouch * 0.6;
      // il se dandine en marchant
      let rock = 0;
      if (o.pose === 'walk') rock = Math.sin(o.ph) * 0.1;
      else if (o.pose === 'run') rock = Math.sin(o.ph) * 0.07;
      else if (o.pose === 'idle') rock = Math.sin(t * 2.5) * 0.02;
      if (o.pose === 'crouch') {
        legF = 0.2;
        legB = -0.2;
      }
      if (o.pose === 'win') {
        // les deux nageoires en l'air
        armF = -2.6 + Math.sin(t * 10) * 0.25;
        armB = 2.5 - Math.sin(t * 10) * 0.25;
      }
      const moving = o.pose === 'walk' || o.pose === 'run' || o.pose === 'jump' || o.pose === 'fall';
      ctx.translate(0, bob);
      ctx.rotate(lean + rock);
      // l'écharpe flotte derrière (plus fort quand il bouge)
      const amp = moving ? 2.4 : 1.2;
      const fl = moving ? 18 : 5;
      const dy = moving ? 0.2 : 0.7;
      ctx.save();
      ctx.translate(0, crouch);
      scarfEnd(ctx, -11, -33, -0.95, dy, 15, 4.2, t, fl, amp);
      scarfEnd(ctx, -11, -32, -0.75, dy + 0.35, 12, 4, t + 0.4, fl * 1.15, amp);
      flipper(ctx, -2, -30, armB - 0.15, true);
      ctx.restore();
      const pb = H.tip(-3.5, -4, legB, 2);
      foot(ctx, pb.x, pb.y, 0, true);
      ctx.save();
      ctx.translate(0, crouch);
      // la petite queue
      ctx.beginPath();
      ctx.moveTo(-11, -12);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-9, -6);
      ctx.closePath();
      H.paint(ctx, C.backShade, C.line, 1);
      union(ctx, [[0, -20, 14, 15.5], [1.5, -43, 12, 12]], C.back, C.line, 1.1);
      ctx.save();
      ellipsePath(ctx, 0, -20, 14, 15.5);
      ctx.clip();
      ellipsePath(ctx, 5.5, -17.5, 10, 14);
      H.paint(ctx, C.white, C.whiteLine, 1);
      ctx.fillStyle = C.whiteShade;
      ellipsePath(ctx, 8, -9, 6, 4);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = C.backLight;
      ellipsePath(ctx, -8, -25, 2.6, 5, 0.3);
      ctx.fill();
      ctx.restore();
      const pf = H.tip(2.5, -4, legF, 2);
      foot(ctx, pf.x, pf.y, 0, false);
      ctx.save();
      ctx.translate(0, crouch);
      scarfBand(ctx);
      face(ctx, o, 1.5, -43);
      if (o.holding) o.holding(ctx);
      flipper(ctx, 1, -29, armF + 0.15, false);
      ctx.restore();
    },
    head(ctx) {
      union(ctx, [[-2, 1, 12, 12]], C.back, C.line, 1.1);
      face(ctx, { t: 1, pose: 'idle' }, -2, 1);
    },
  });
})();
