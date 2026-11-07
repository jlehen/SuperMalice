'use strict';

// ---------------- Gros Bonbon ----------------
// Un gros bonbon rose tout rond avec des rayures blanches en spirale, emballé dans de la cellophane
// qui dépasse des deux côtés comme un noeud papillon. Deux petites jambes en baskets.
// Pouvoir : il se roule en boule et rebondit (pose 'ball', tourné de o.pw.roll).
(() => {
  const H = Heroes;
  const C = {
    candy: '#ff7ab8', candyDark: '#e2559a', candyLine: '#b0346e', stripe: '#fff4fa',
    wrap: 'rgba(225,245,255,0.85)', wrapLine: '#7ab6d8', wrapShine: 'rgba(255,255,255,0.9)',
    leg: '#ff9cc8', legLine: '#b0346e',
    shoe: '#7ad0ff', shoeDark: '#4aa8e0', shoeLine: '#2a6a9a', sole: '#ffffff',
    cheek: '#ff4f8a', mouth: '#7a1840', tongue: '#ff5a7a',
  };
  const BODY_Y = -30;
  const RAD = 20;

  // Une petite jambe avec sa basket.
  function leg(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2.4, -3, 4.8, 8, 2.4);
    H.paint(ctx, back ? C.candyDark : C.leg, C.legLine, 1);
    ctx.translate(0, 5);
    ctx.rotate(-a);
    ctx.beginPath();
    ctx.moveTo(-4, 1.6);
    ctx.quadraticCurveTo(-4.2, -2.6, 0, -2.6);
    ctx.quadraticCurveTo(6.5, -2.4, 7.2, 1.6);
    ctx.lineTo(7.2, 2.8);
    ctx.lineTo(-4, 2.8);
    ctx.closePath();
    H.paint(ctx, back ? C.shoeDark : C.shoe, C.shoeLine, 1);
    roundRectPath(ctx, -4.4, 2.2, 12, 2.4, 1.2);
    H.paint(ctx, C.sole, C.shoeLine, 0.9);
    if (!back) {
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, 2.6, -0.6, 0.9);
      ctx.fill();
    }
    ctx.restore();
  }

  // Le bout d'emballage tortillé, qui part du bord du bonbon (côté side = 1 ou -1), tourné de a.
  function twist(ctx, side, r, a, fold) {
    ctx.save();
    ctx.translate(side * (r - 1), 0);
    ctx.rotate(a);
    ctx.scale(side, 1);
    const L = fold ? 6 : 13;
    const W = fold ? 5 : 9;
    ctx.beginPath();
    ctx.moveTo(0, -2.2);
    ctx.quadraticCurveTo(L * 0.4, -2, L, -W);
    ctx.quadraticCurveTo(L + 2.4, -W * 0.5, L - 0.6, -W * 0.2);
    ctx.quadraticCurveTo(L + 2.2, 0, L - 0.6, W * 0.25);
    ctx.quadraticCurveTo(L + 2.4, W * 0.55, L, W);
    ctx.quadraticCurveTo(L * 0.4, 2, 0, 2.2);
    ctx.closePath();
    H.paint(ctx, C.wrap, C.wrapLine, 1);
    // plis de la cellophane
    ctx.strokeStyle = C.wrapLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(2.5, -0.8);
    ctx.lineTo(L - 1.5, -W * 0.55);
    ctx.moveTo(2.5, 0.8);
    ctx.lineTo(L - 1.5, W * 0.6);
    ctx.stroke();
    ctx.fillStyle = C.wrapShine;
    ellipsePath(ctx, L * 0.6, -W * 0.45, 1.6, 0.7, -0.5);
    ctx.fill();
    // le noeud serré
    roundRectPath(ctx, -1.2, -3, 3.6, 6, 1.4);
    H.paint(ctx, '#ffe0f0', C.candyLine, 0.9);
    ctx.restore();
  }

  // La boule de bonbon (centrée en 0, 0) : rose, spirales blanches, reflet et le visage.
  function ball(ctx, o, r, spin) {
    circlePath(ctx, 0, 0, r);
    H.paint(ctx, C.candy, C.candyLine, 1.1);
    ctx.save();
    circlePath(ctx, 0, 0, r - 0.5);
    ctx.clip();
    ctx.rotate(spin);
    ctx.fillStyle = C.stripe;
    for (let i = 0; i < 5; i++) {
      // une rayure en spirale qui s'élargit vers le bord
      const a0 = (i / 5) * H.TAU;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let k = 0; k <= 12; k++) {
        const d = (k / 12) * r * 1.1;
        const a = a0 + (k / 12) * 2.2;
        ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d);
      }
      for (let k = 12; k >= 0; k--) {
        const d = (k / 12) * r * 1.1;
        const a = a0 + (k / 12) * 2.2 + 0.1 + (k / 12) * 0.32;
        ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.rotate(-spin);
    // ombre en bas et reflet en haut
    ctx.fillStyle = 'rgba(176,52,110,0.18)';
    ellipsePath(ctx, 2, r * 0.75, r * 1.1, r * 0.45);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ellipsePath(ctx, -r * 0.45, -r * 0.55, r * 0.26, r * 0.13, -0.6);
    ctx.fill();
    circlePath(ctx, -r * 0.18, -r * 0.74, r * 0.06);
    ctx.fill();
    face(ctx, o, r * 0.38, -r * 0.05, r / 20);
  }

  function face(ctx, o, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // une petite tache claire derrière le visage pour bien le voir
    ctx.fillStyle = 'rgba(255,230,242,0.75)';
    ellipsePath(ctx, 0.5, 1.5, 10.5, 9.5);
    ctx.fill();
    const blink = H.blinking(o.t || 0, 1.7);
    const look = { x: 0.6, y: 0 };
    H.eye(ctx, -3.5, -2.5, 2.8, 3.7, { iris: '#6a2a8a', hurt: o.hurt, blink, line: '#5a1030', look });
    H.eye(ctx, 4, -2.5, 2.6, 3.6, { iris: '#6a2a8a', hurt: o.hurt, blink, line: '#5a1030', look });
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.45;
    ellipsePath(ctx, -6.5, 3, 2.4, 1.5);
    ctx.fill();
    ellipsePath(ctx, 7.5, 3, 2.2, 1.5);
    ctx.fill();
    ctx.globalAlpha /= 0.45;
    const open = o.pose === 'win' || o.pose === 'jump' || o.pose === 'ball';
    ctx.lineCap = 'round';
    if (o.hurt) {
      ctx.strokeStyle = C.mouth;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-2, 5.4);
      ctx.quadraticCurveTo(0.5, 3.6, 3, 5.4);
      ctx.stroke();
    } else if (open) {
      ctx.beginPath();
      ctx.moveTo(-2.6, 3.2);
      ctx.quadraticCurveTo(0.5, 9.5, 3.6, 3.2);
      ctx.closePath();
      H.paint(ctx, C.mouth, C.mouth, 0.9);
      ctx.fillStyle = C.tongue;
      ellipsePath(ctx, 0.5, 5.6, 1.6, 0.9);
      ctx.fill();
    } else {
      ctx.strokeStyle = C.mouth;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-2.2, 3.6);
      ctx.quadraticCurveTo(0.5, 6.4, 3.2, 3.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  H.add('bonbon', {
    draw(ctx, o, R) {
      const t = o.t;
      if (o.pose === 'ball') {
        // roulé en boule : plus de jambes, l'emballage replié, tout tourne
        const r = 24;
        ctx.translate(0, -r);
        ctx.rotate(o.pw ? o.pw.roll || 0 : 0);
        twist(ctx, -1, r, 0.5, true);
        twist(ctx, 1, r, -0.5, true);
        ball(ctx, o, r, 0);
        return;
      }
      let { legF, legB, armF, armB, bob, lean } = R;
      const crouch = R.crouch * 0.7;
      if (o.pose === 'crouch') {
        legF = 1.3;
        legB = 1.0;
      }
      // les bouts d'emballage battent comme des petits bras
      let wF = (armF + 0.12) * 0.4;
      let wB = (armB - 0.12) * 0.4;
      if (o.pose === 'hang') { wF = -1.1; wB = 1.1; }
      if (o.pose === 'idle') { wF += Math.sin(t * 2.5) * 0.06; wB -= Math.sin(t * 2.5) * 0.06; }
      ctx.translate(0, bob);
      ctx.rotate(lean);
      leg(ctx, -6, -9 + crouch, legB, true);
      leg(ctx, 5, -9 + crouch, legF, false);
      ctx.save();
      ctx.translate(0, BODY_Y + crouch);
      // un peu écrasé quand il est accroupi ou qu'il écrase
      if (o.pose === 'crouch' || o.pose === 'pound') ctx.scale(1.06, 0.94);
      twist(ctx, -1, RAD, wB, false);
      twist(ctx, 1, RAD, wF, false);
      ball(ctx, o, RAD, Math.sin(t * 1.5) * 0.05);
      ctx.restore();
      if (o.holding) {
        ctx.save();
        // le bébé oiseau s'assoit sur sa tête
        ctx.translate(-17, -29 + R.crouch * 0.7);
        o.holding(ctx);
        ctx.restore();
      }
    },
    head(ctx) {
      ctx.scale(0.72, 0.72);
      twist(ctx, -1, RAD, 0, true);
      twist(ctx, 1, RAD, 0, true);
      ball(ctx, { t: 1, pose: 'idle' }, RAD, 0);
    },
  });
})();
