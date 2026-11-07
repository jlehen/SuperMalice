'use strict';

// ---------------- Le Dinosaure ----------------
// Un gentil T-rex tout dodu : vert avec des taches, le ventre jaune pâle, une grosse tête
// avec un grand sourire, de tout petits bras et une grosse queue. Pouvoir : il écrase le sol (pose 'stomp').
(() => {
  const H = Heroes;
  const C = {
    body: '#8fd35a', bodyShade: '#76bb44', bodyLight: '#c6f19c', line: '#3a7a22', spot: '#62ad3c',
    belly: '#fff6c0', bellyLine: '#d0bc66', claw: '#fffbea', clawLine: '#b8a878',
    mouth: '#9c2a40', tongue: '#ff7f92', tooth: '#ffffff', toothLine: '#b8b0a0', cheek: '#ff9cb8',
  };

  // Plusieurs ellipses peintes comme une seule forme, avec un seul contour autour.
  function union(ctx, list, fill, line, lw) {
    ctx.beginPath();
    for (const [x, y, rx, ry, rot] of list) {
      const r = rot || 0;
      ctx.moveTo(x + rx * Math.cos(r), y + rx * Math.sin(r));
      ctx.ellipse(x, y, rx, ry, r, 0, H.TAU);
    }
    ctx.strokeStyle = line;
    ctx.lineWidth = lw * 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function spots(ctx, list) {
    ctx.fillStyle = C.spot;
    for (const [x, y, r] of list) {
      ellipsePath(ctx, x, y, r, r * 0.8, 0.3);
      ctx.fill();
    }
  }

  // Une jambe bien épaisse et un pied à trois doigts (qui reste à plat).
  function leg(ctx, x, y, a, len, back, noThigh) {
    const fill = back ? C.bodyShade : C.body;
    H.limb(ctx, x, y, a, len, 8, fill, C.line, 1);
    const p = H.tip(x, y, a, len);
    ctx.save();
    ctx.translate(p.x, p.y);
    union(ctx, [[1, -0.4, 5, 2.9], [5, 0.6, 2.2, 1.9], [2, 1, 2.2, 1.6]], fill, C.line, 1);
    ctx.fillStyle = C.claw;
    ctx.strokeStyle = C.clawLine;
    ctx.lineWidth = 0.7;
    for (const [cx, cy] of [[7, 1.2], [4.2, 2], [1.4, 2.1]]) {
      ellipsePath(ctx, cx, cy, 1.15, 0.85);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    if (noThigh) return;
    // la grosse cuisse
    ellipsePath(ctx, x + 0.5, y + 1, 6.5, 7.5, a * 0.6);
    H.paint(ctx, fill, C.line, 1);
    if (!back) {
      spots(ctx, [[x - 1.5, y - 1, 1.6], [x + 2, y + 3.5, 1.2]]);
    }
  }

  // Un tout petit bras avec deux doigts.
  function arm(ctx, x, y, a, back) {
    const fill = back ? C.bodyShade : C.body;
    H.limb(ctx, x, y, a, 4.2, 3.6, fill, C.line, 0.95);
    const p = H.tip(x, y, a, 5);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    union(ctx, [[-0.9, 0.4, 1.3, 1.9], [1, 0.3, 1.3, 1.9]], fill, C.line, 0.9);
    ctx.restore();
  }

  function tail(ctx, wag) {
    ctx.beginPath();
    ctx.moveTo(-6, -32);
    ctx.quadraticCurveTo(-22, -26, -34, -15 + wag);
    ctx.quadraticCurveTo(-35.5, -12.5 + wag, -32.5, -12 + wag);
    ctx.quadraticCurveTo(-20, -9, -6, -11);
    ctx.closePath();
    H.paint(ctx, C.body, C.line, 1.1);
    spots(ctx, [[-17, -22, 2.2], [-24, -18, 1.7], [-29.5, -14.5 + wag * 0.8, 1.2], [-13, -16, 1.4]]);
    ctx.fillStyle = C.bodyLight;
    ellipsePath(ctx, -17, -25.5, 5, 1.4, 0.4);
    ctx.fill();
  }

  // Les dents : de petites bosses blanches arrondies.
  function teeth(ctx, list, down) {
    ctx.fillStyle = C.tooth;
    ctx.strokeStyle = C.toothLine;
    ctx.lineWidth = 0.6;
    for (const [x, y] of list) {
      ctx.beginPath();
      ctx.moveTo(x - 1.1, y);
      ctx.quadraticCurveTo(x - 1.1, y + 2 * down, x, y + 2 * down);
      ctx.quadraticCurveTo(x + 1.1, y + 2 * down, x + 1.1, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // La grosse tête, centrée en (0, 0). open : la bouche ouverte (0 fermée, 1 grande ouverte).
  function headShape(ctx, o, open) {
    if (open) {
      union(ctx, [[5.5, 8.5 + open * 2, 10, 3.6, open * 0.18]], C.body, C.line, 1);
      ellipsePath(ctx, 9, 5 + open * 1.5, 9, 1.5 + open * 3.4, 0.1);
      H.paint(ctx, C.mouth, C.line, 0.9);
      ctx.fillStyle = C.tongue;
      ellipsePath(ctx, 7, 7 + open * 2.6, 4.6, 1 + open, 0.15);
      ctx.fill();
      teeth(ctx, [[10, 8.4 + open * 2.4], [14, 8 + open * 2.2]], -1);
    }
    const lift = open * 2.5;
    union(ctx, [[-2, -2, 12, 10.5], [6, 2 - lift, 12.5, 7.6 - open * 1.5]], C.body, C.line, 1.1);
    spots(ctx, [[-8.5, -4, 2.2], [-5, -9.5, 1.8], [-10, 2.5, 1.5], [-2.5, -11, 1.2]]);
    ctx.fillStyle = C.bodyLight;
    ellipsePath(ctx, 1, -9, 5, 2.4, -0.25);
    ctx.fill();
    // narine
    ctx.fillStyle = C.line;
    ellipsePath(ctx, 15.5, -2.5 - lift, 1.1, 0.8, 0.3);
    ctx.fill();
    if (open) {
      teeth(ctx, [[6, 6.6 - lift], [10, 7 - lift], [14, 6.6 - lift]], 1);
    } else {
      // un grand sourire avec des petites dents
      teeth(ctx, [[8.5, 5.6], [12.2, 5.8], [15.6, 4.9]], 1);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(3, 3.6);
      ctx.quadraticCurveTo(10, 7.6, 17.6, 3);
      ctx.stroke();
    }
    H.eye(ctx, 3.5, -4, 4.4, 5.4, {
      iris: '#5a3412', hurt: o.hurt, blink: H.blinking(o.t, 1.7), line: '#204a14', look: { x: 0.6, y: 0 },
    });
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.85;
    ellipsePath(ctx, 1.5, 5, 3, 1.9);
    ctx.fill();
    ctx.globalAlpha /= 0.85;
  }

  H.add('dino', {
    draw(ctx, o, R) {
      const t = o.t;
      let { legF, legB, armF, armB, bob, lean } = R;
      const crouch = R.crouch * 0.7;
      let open = o.pose === 'win' ? 0.5 : o.hurt ? 0.35 : 0;
      if (o.pose === 'stomp') {
        // le genou levé bien haut, prêt à écraser le sol : ROAR !
        legB = 0.05;
        armF = -2.6 + Math.sin(t * 14) * 0.2;
        armB = -2.3 - Math.sin(t * 14) * 0.2;
        lean = -0.1;
        open = 1;
      }
      const wag = Math.sin(t * 2.6) * 1.4;
      ctx.translate(0, bob);
      ctx.rotate(lean);
      const hipY = -12 + crouch;
      const len = (a) => Math.min(9.5, Math.max(3, (-hipY - 2.5) / Math.max(0.2, Math.cos(a))));
      ctx.save();
      ctx.translate(0, crouch);
      tail(ctx, wag);
      arm(ctx, 6.5, -30, armB, true);
      ctx.restore();
      leg(ctx, -4, hipY, legB, len(legB), true);
      ctx.save();
      ctx.translate(0, crouch);
      union(ctx, [[-0.5, -24, 13, 13.5, -0.2], [3.5, -35, 8, 6.5]], C.body, C.line, 1.1);
      ctx.save();
      ellipsePath(ctx, -0.5, -24, 13, 13.5, -0.2);
      ctx.clip();
      ellipsePath(ctx, 7, -21, 8, 12, -0.15);
      H.paint(ctx, C.belly, C.bellyLine, 1);
      ctx.restore();
      spots(ctx, [[-7, -31, 2.2], [-10, -24, 1.6], [-3, -35, 1.4]]);
      ctx.fillStyle = C.bodyLight;
      ellipsePath(ctx, -5, -31.5, 4, 2, -0.6);
      ctx.fill();
      ctx.restore();
      if (o.pose === 'stomp') {
        // la cuisse en avant vers le haut, et la patte qui pend sous le genou
        const k = H.tip(1.5, hipY, -2.1, 7);
        leg(ctx, k.x, k.y, 0.15, 5.5, false, true);
        ellipsePath(ctx, (1.5 + k.x) / 2, (hipY + k.y) / 2 + 0.5, 8, 6, Math.atan2(k.y - hipY, k.x - 1.5));
        H.paint(ctx, C.body, C.line, 1);
        spots(ctx, [[k.x - 4, k.y + 0.5, 1.5], [k.x - 0.5, k.y + 2.5, 1.1]]);
      } else {
        leg(ctx, 1.5, hipY, legF, len(legF), false);
      }
      ctx.save();
      ctx.translate(0, crouch);
      if (o.holding) o.holding(ctx);
      ctx.save();
      ctx.translate(4, -48);
      if (o.pose === 'stomp') ctx.rotate(-0.12);
      headShape(ctx, o, open);
      ctx.restore();
      arm(ctx, 8.5, -30, armF, false);
      ctx.restore();
    },
    head(ctx) {
      ctx.save();
      ctx.translate(-3, 2);
      headShape(ctx, { t: 1, pose: 'idle' }, 0);
      ctx.restore();
    },
  });
})();
