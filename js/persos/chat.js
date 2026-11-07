'use strict';

// ---------------- Le Chat Ninja ----------------
// Un chat roux tigré debout sur ses pattes, en tenue de ninja noire avec une ceinture grise,
// et un bandeau rouge noué derrière la tête. Pouvoir : il s'accroche aux murs (pose 'wall').
(() => {
  const H = Heroes;
  const C = {
    fur: '#ffa53a', furShade: '#ef8a24', furLight: '#ffd394', furLine: '#a2521a', stripe: '#d9701a',
    cream: '#fff4e2', creamLine: '#d2a876', ear: '#ffb0b8',
    suit: '#2c2c3a', suitShade: '#20202c', suitLight: '#4c4c62', suitLine: '#0e0e16',
    belt: '#b0b5c0', beltLine: '#5e636e',
    band: '#ff3c3c', bandDark: '#c81e2a', bandLine: '#7e1018',
    iris: '#3cbf4a', nose: '#ff8aa0', whisker: '#5a3a24', cheek: '#ff8fa8',
  };

  // Un ruban du bandeau qui flotte depuis (x, y) dans la direction (dx, dy).
  function ribbon(ctx, x, y, dx, dy, len, w, t, f, amp) {
    const n = 6;
    const top = [];
    const bot = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const wave = Math.sin(t * f - u * 4.5) * amp * u;
      const px = x + dx * len * u - dy * wave;
      const py = y + dy * len * u + dx * wave;
      const hw = w * (1 - u * 0.35) / 2;
      top.push([px - dy * hw, py + dx * hw]);
      bot.push([px + dy * hw, py - dx * hw]);
    }
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (let i = 1; i <= n; i++) ctx.lineTo(top[i][0], top[i][1]);
    // le bout coupé en V
    const e = top.length - 1;
    ctx.lineTo((top[e][0] + bot[e][0]) / 2 - dx * 1.6, (top[e][1] + bot[e][1]) / 2 - dy * 1.6);
    for (let i = n; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.closePath();
    H.paint(ctx, C.band, C.bandLine, 0.9);
  }

  // La longue queue tigrée : une courbe épaisse, avec des rayures.
  function tail(ctx, pts) {
    const [p0, c1, c2, p3] = pts;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p3[0], p3[1]);
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    path();
    ctx.strokeStyle = C.furLine;
    ctx.lineWidth = 6.6;
    ctx.stroke();
    ctx.strokeStyle = C.fur;
    ctx.lineWidth = 4.6;
    ctx.stroke();
    ctx.save();
    ctx.setLineDash([1.8, 4]);
    ctx.lineDashOffset = -3;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = C.stripe;
    ctx.stroke();
    ctx.restore();
    // le bout de la queue, plus clair
    circlePath(ctx, p3[0], p3[1], 2.3);
    ctx.fillStyle = C.furLight;
    ctx.fill();
  }

  // Un bras (manche noire) et la patte rousse au bout.
  function arm(ctx, x, y, a, back, len) {
    len = len || 8;
    H.limb(ctx, x, y, a, len, 5, back ? C.suitShade : C.suit, C.suitLine, 1);
    const p = H.tip(x, y, a, len + 1.5);
    circlePath(ctx, p.x, p.y, 3.1);
    H.paint(ctx, back ? C.furShade : C.fur, C.furLine, 1);
  }

  // Le bras tendu jusqu'au point (px, py).
  function armTo(ctx, x, y, px, py, back) {
    const a = Math.atan2(-(px - x), py - y);
    arm(ctx, x, y, a, back, Math.hypot(px - x, py - y) - 1.5);
  }

  // Une jambe (pantalon noir) et une patte rousse au bout, tournée de rot.
  function leg(ctx, x, y, a, len, back, rot) {
    H.limb(ctx, x, y, a, len, 6, back ? C.suitShade : C.suit, C.suitLine, 1);
    const p = H.tip(x, y, a, len);
    ellipsePath(ctx, p.x + Math.cos(rot || 0) * 1.6, p.y + Math.sin(rot || 0) * 1.6 + 0.2, 4.6, 2.7, rot || 0);
    H.paint(ctx, back ? C.furShade : C.fur, C.furLine, 1);
  }

  function ear(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-4.4, 2);
    ctx.quadraticCurveTo(-3, -5, -0.6, -8.4);
    ctx.quadraticCurveTo(0.2, -9, 0.9, -8.2);
    ctx.quadraticCurveTo(3.4, -4, 4.4, 2);
    ctx.closePath();
    H.paint(ctx, back ? C.furShade : C.fur, C.furLine, 1);
    ctx.beginPath();
    ctx.moveTo(-2.2, 1);
    ctx.quadraticCurveTo(-1.4, -3.5, 0.1, -5.6);
    ctx.quadraticCurveTo(1.6, -2.6, 2.2, 1);
    ctx.closePath();
    ctx.fillStyle = C.ear;
    ctx.fill();
    ctx.restore();
  }

  // La tête centrée en (0, 0), tournée vers la droite. Les rubans du bandeau sont dessinés à part.
  function headShape(ctx, o) {
    ear(ctx, -6, -8.5, -0.45, true);
    ear(ctx, 3, -10, 0.12, false);
    ellipsePath(ctx, 0, 0, 12.5, 11.5);
    H.paint(ctx, C.fur, C.furLine, 1.1);
    ctx.save();
    ellipsePath(ctx, 0, 0, 12.5, 11.5);
    ctx.clip();
    // rayures sur la joue et derrière la tête
    ctx.strokeStyle = C.stripe;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -1);
    ctx.quadraticCurveTo(-8, 0, -6.5, -2.5);
    ctx.moveTo(-12, 3);
    ctx.quadraticCurveTo(-8, 4, -6.5, 1.8);
    ctx.moveTo(-11, 7);
    ctx.quadraticCurveTo(-7.5, 7.5, -6, 5.5);
    ctx.stroke();
    // le bandeau rouge sur le front
    ctx.beginPath();
    ctx.moveTo(-14, -9.5);
    ctx.quadraticCurveTo(0, -12.5, 14, -9.5);
    ctx.lineTo(14, -5.6);
    ctx.quadraticCurveTo(0, -8.6, -14, -5.4);
    ctx.closePath();
    H.paint(ctx, C.band, C.bandLine, 1);
    ctx.fillStyle = C.furLight;
    ellipsePath(ctx, -4, -2.5, 3.6, 2, -0.3);
    ctx.globalAlpha *= 0.6;
    ctx.fill();
    ctx.restore();
    // le noeud derrière
    ellipsePath(ctx, -11.5, -7.5, 2.6, 2.6);
    H.paint(ctx, C.bandDark, C.bandLine, 1);
    // le museau
    ellipsePath(ctx, 7.5, 4.6, 5.6, 4);
    H.paint(ctx, C.cream, C.creamLine, 0.9);
    ctx.beginPath();
    ctx.moveTo(10.8, 1.4);
    ctx.lineTo(13.4, 1.4);
    ctx.quadraticCurveTo(13.2, 3.4, 12, 3.6);
    ctx.quadraticCurveTo(10.8, 3.2, 10.8, 1.4);
    ctx.closePath();
    H.paint(ctx, C.nose, C.furLine, 0.8);
    ctx.strokeStyle = C.furLine;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (o.pose === 'win' || o.hurt) {
      ctx.moveTo(9.4, 5);
      ctx.quadraticCurveTo(11.5, 9.4, 13.6, 5);
      ctx.closePath();
      ctx.fillStyle = '#a02838';
      ctx.fill();
    } else {
      ctx.moveTo(12, 3.6);
      ctx.lineTo(12, 5);
      ctx.moveTo(9.6, 5.4);
      ctx.quadraticCurveTo(10.8, 6.6, 12, 5);
      ctx.quadraticCurveTo(13.2, 6.6, 14.2, 5);
    }
    ctx.stroke();
    // les moustaches
    ctx.strokeStyle = C.whisker;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(13, 4.2);
    ctx.quadraticCurveTo(17, 2.6, 20.5, 2.4);
    ctx.moveTo(13, 5.4);
    ctx.quadraticCurveTo(17, 5.6, 20.5, 6.6);
    ctx.moveTo(4, 4.5);
    ctx.quadraticCurveTo(0, 3.6, -2.5, 4);
    ctx.stroke();
    H.eye(ctx, 5.6, -1.6, 3.9, 4.8, {
      iris: C.iris, hurt: o.hurt, blink: H.blinking(o.t, 2.9), line: '#3a1e0a', look: { x: 0.6, y: 0 },
    });
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.6;
    ellipsePath(ctx, 2, 5, 2.6, 1.6);
    ctx.fill();
    ctx.globalAlpha /= 0.6;
  }

  // Le corps en tenue de ninja, centré en x.
  function body(ctx, x) {
    ellipsePath(ctx, x, -23, 9.6, 11.6);
    H.paint(ctx, C.suit, C.suitLine, 1.1);
    ctx.save();
    ellipsePath(ctx, x, -23, 9.6, 11.6);
    ctx.clip();
    // le poil roux dans le col
    ctx.beginPath();
    ctx.moveTo(x + 2.5, -36);
    ctx.lineTo(x + 6.5, -28.5);
    ctx.lineTo(x + 11, -36);
    ctx.closePath();
    H.paint(ctx, C.cream, C.creamLine, 0.9);
    // la ceinture
    ctx.fillStyle = C.belt;
    ctx.strokeStyle = C.beltLine;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x - 11, -20);
    ctx.quadraticCurveTo(x, -18.4, x + 11, -20);
    ctx.lineTo(x + 11, -16.4);
    ctx.quadraticCurveTo(x, -14.8, x - 11, -16.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.suitLight;
    ellipsePath(ctx, x - 4, -28, 2.4, 4.6, 0.35);
    ctx.fill();
    ctx.restore();
    // le noeud de la ceinture et ses deux bouts
    ctx.fillStyle = C.belt;
    ctx.strokeStyle = C.beltLine;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x + 6.6, -17);
    ctx.lineTo(x + 6, -12.4);
    ctx.lineTo(x + 7.6, -12.8);
    ctx.closePath();
    ctx.moveTo(x + 7.4, -17);
    ctx.lineTo(x + 9.4, -13);
    ctx.lineTo(x + 10.4, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ellipsePath(ctx, x + 7.2, -17.8, 1.8, 1.6);
    H.paint(ctx, C.belt, C.beltLine, 0.9);
  }

  // Accroché au mur (le mur est devant lui, en x = +14) : il regarde par-dessus son épaule.
  function wall(ctx, o) {
    const t = o.t;
    tail(ctx, [[-2, -16], [-13, -13], [-13, 0], [-5 + Math.sin(t * 2) * 0.8, 2.5]]);
    arm(ctx, 1, -29, 0.8, true, 6);
    leg(ctx, 0, -13, -1.35, 5, true);
    body(ctx, 4);
    // le pied et la main contre le mur
    leg(ctx, 6, -13, -0.7, 6.4, false, -1.5);
    // les rubans du bandeau pendent le long du mur
    ribbon(ctx, 12, -50, 0.02, 1, 22, 3.4, t, 4, 0.8);
    ribbon(ctx, 11.5, -49.5, -0.2, 1, 18, 3.2, t + 0.5, 4.5, 0.8);
    ctx.save();
    ctx.translate(0, -46);
    ctx.rotate(0.25);
    ctx.scale(-1, 1);
    headShape(ctx, o);
    ctx.restore();
    armTo(ctx, 6.5, -31, 11, -38.5, false);
  }

  H.add('chat', {
    draw(ctx, o, R) {
      const t = o.t;
      if (o.pose === 'wall') {
        wall(ctx, o);
        return;
      }
      const { legF, legB, armF, armB, bob, lean } = R;
      const crouch = R.crouch * 0.7;
      const moving = o.pose === 'walk' || o.pose === 'run' || o.pose === 'jump' || o.pose === 'fall';
      ctx.translate(0, bob);
      ctx.rotate(lean);
      const hipY = -12 + crouch;
      const len = (a) => Math.min(9, Math.max(3, (-hipY - 3) / Math.max(0.2, Math.cos(a))));
      const w = Math.sin(t * 3) * 2;
      ctx.save();
      ctx.translate(0, crouch);
      tail(ctx, [[-6, -16], [-22, -14], [-27, -32 + w], [-17, -38 + w * 0.6]]);
      arm(ctx, -1.5, -30, armB, true);
      ctx.restore();
      leg(ctx, -2.5, hipY, legB, len(legB), true);
      ctx.save();
      ctx.translate(0, crouch);
      body(ctx, 0);
      ctx.restore();
      leg(ctx, 2.2, hipY, legF, len(legF), false);
      ctx.save();
      ctx.translate(0, crouch);
      // les rubans du bandeau flottent derrière
      const f = moving ? 16 : 4;
      const amp = moving ? 2 : 1;
      const dy = moving ? 0.15 : 0.55;
      ribbon(ctx, -9.5, -53.5, -0.98, dy, 16, 3.4, t, f, amp);
      ribbon(ctx, -9.5, -53, -0.85, dy + 0.3, 13, 3.2, t + 0.5, f * 1.2, amp);
      ctx.save();
      ctx.translate(2, -46);
      headShape(ctx, o);
      ctx.restore();
      if (o.holding) o.holding(ctx);
      arm(ctx, 1.5, -30, armF, false);
      ctx.restore();
    },
    head(ctx) {
      ctx.save();
      ctx.translate(-3, 2);
      ribbon(ctx, -11.5, -7.5, -0.9, 0.5, 9, 3, 1, 4, 0.6);
      headShape(ctx, { t: 1, pose: 'idle' });
      ctx.restore();
    },
  });
})();
