'use strict';

// ---------------- La Biche ----------------
// Un faon couleur caramel avec des taches blanches sur le dos, le ventre crème,
// un long cou, de grandes oreilles et de grands yeux avec des cils.
// Quatre pattes fines : celles de devant suivent legF/legB, celles de derrière l'inverse (elle trotte).
// Pouvoir : double saut (le jeu la fait tourner sur elle-même).
(() => {
  const H = Heroes;
  const C = {
    fur: '#c98a4e', furDark: '#a86c36', furLight: '#e6b27a', line: '#6e4020',
    cream: '#fff0d8', spot: '#fffaf0', hoof: '#3a2418', hoofLine: '#1e120a',
    ear: '#ffb8b0', nose: '#2a1a14', cheek: '#ff9a8a', iris: '#2a1608',
  };
  const LEG_Y = -20.6;
  const UP = 9;
  const LOW = 9;

  // Une patte en deux morceaux : la cuisse tournée de a, puis le bas tourné de bend, et le sabot.
  function leg(ctx, x, a, bend, back, hind) {
    ctx.save();
    ctx.translate(x, LEG_Y);
    ctx.rotate(a);
    const fill = back ? C.furDark : C.fur;
    roundRectPath(ctx, -2.1, -3, hind ? 4.6 : 4.2, UP + 4, 2);
    H.paint(ctx, fill, C.line, 1);
    ctx.translate(0, UP);
    ctx.rotate(bend);
    roundRectPath(ctx, -1.4, -1.6, 2.8, LOW + 1.6, 1.4);
    H.paint(ctx, fill, C.line, 0.95);
    ctx.beginPath();
    ctx.moveTo(-1.7, LOW - 0.6);
    ctx.lineTo(1.7, LOW - 0.6);
    ctx.lineTo(2, LOW + 2.6);
    ctx.lineTo(-1.9, LOW + 2.6);
    ctx.closePath();
    H.paint(ctx, C.hoof, C.hoofLine, 0.8);
    ctx.restore();
  }

  // Les angles des quatre pattes pour chaque pose.
  function legs(o, R) {
    const t = o.t;
    const L = { fN: 0.05, fF: -0.05, hN: -0.05, hF: 0.05, bfN: 0, bfF: 0, bhN: 0, bhF: 0, tilt: 0, low: 0 };
    switch (o.pose) {
      case 'walk':
      case 'run': {
        const k = o.pose === 'run' ? 0.85 : 0.75;
        L.fN = R.legF * k; L.fF = R.legB * k;
        L.hN = R.legB * k; L.hF = R.legF * k;
        // la patte qui avance plie le genou
        L.bfN = Math.max(0, -L.fN) * 1.6; L.bfF = Math.max(0, -L.fF) * 1.6;
        L.bhN = Math.max(0, -L.hN) * 1.4; L.bhF = Math.max(0, -L.hF) * 1.4;
        L.tilt = o.pose === 'run' ? 0.04 : 0;
        break;
      }
      case 'jump':
        // un saut gracieux : devant repliées, derrière tendues
        Object.assign(L, { fN: -1.25, fF: -1.0, bfN: 1.9, bfF: 1.8, hN: 1.0, hF: 0.8, bhN: 0.35, bhF: 0.3, tilt: -0.14 });
        break;
      case 'fall':
        Object.assign(L, { fN: -0.45, fF: -0.25, bfN: 0.35, bfF: 0.25, hN: 0.35, hF: 0.15, bhN: 0.2, bhF: 0.15, tilt: 0.06 });
        break;
      case 'pound':
        Object.assign(L, { fN: -0.9, fF: -0.7, bfN: 2.2, bfF: 2.1, hN: 1.1, hF: 0.9, bhN: -2.1, bhF: -2.0, low: 4 });
        break;
      case 'crouch':
        // couchée : les pattes repliées sous le ventre
        Object.assign(L, { fN: -1.45, fF: -1.35, bfN: 2.7, bfF: 2.6, hN: 1.35, hF: 1.25, bhN: -2.6, bhF: -2.5, low: 11 });
        break;
      case 'throw':
        // un coup de sabot vers l'avant
        Object.assign(L, { fN: -1.2, bfN: 0.3, fF: 0.1 });
        break;
      case 'hang':
        Object.assign(L, { fN: -2.5, fF: -2.7, bfN: 0.4, bfF: 0.3, hN: 0.2, hF: 0.3, bhN: 0.1, bhF: 0.1 });
        break;
      case 'win': {
        // elle se cabre de joie en pédalant des pattes avant
        const p = Math.sin(t * 10) * 0.35;
        Object.assign(L, { fN: -1.0 + p, fF: -0.8 - p, bfN: 1.7, bfF: 1.6, tilt: -0.32 });
        break;
      }
      case 'idle':
      case 'hold':
      case 'magic':
        break;
      default:
        L.fN = R.legF * 0.7; L.fF = R.legB * 0.7;
        L.hN = R.legB * 0.7; L.hF = R.legF * 0.7;
    }
    return L;
  }

  // Le corps, le cou et la croupe en un seul chemin (remplis ensemble, un seul contour autour).
  function bodyPath(ctx) {
    ctx.beginPath();
    ctx.ellipse(-1, -25, 13, 7.2, 0, 0, H.TAU);
    ctx.moveTo(-2.8, -25.5);
    ctx.arc(-10, -25.5, 7.2, 0, H.TAU);
    ctx.moveTo(8 + 6.6 * Math.cos(0.2), -25 + 6.6 * Math.sin(0.2));
    ctx.ellipse(8, -25, 6.6, 7, 0.2, 0, H.TAU);
    ctx.moveTo(3, -28);
    ctx.quadraticCurveTo(7, -38, 9, -46);
    ctx.lineTo(16, -45);
    ctx.quadraticCurveTo(13.5, -34, 13.5, -23);
    ctx.closePath();
  }

  function body(ctx) {
    bodyPath(ctx);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = C.fur;
    ctx.fill();
    // ventre et poitrail crème
    ctx.save();
    ctx.clip();
    ctx.fillStyle = C.cream;
    ellipsePath(ctx, 1, -17.5, 13, 4.2);
    ctx.fill();
    ellipsePath(ctx, 14, -30, 3.2, 10, -0.25);
    ctx.fill();
    ctx.fillStyle = C.furLight;
    ctx.globalAlpha *= 0.6;
    ellipsePath(ctx, -3, -29.5, 8, 2.4, -0.05);
    ctx.fill();
    ctx.restore();
    // taches blanches sur le dos
    ctx.fillStyle = C.spot;
    const S = [[-12, -28, 1.5], [-7, -30, 1.7], [-1.5, -30.5, 1.6], [4, -29.5, 1.4], [-9, -25.5, 1.2], [-3.5, -26.5, 1.3], [1.5, -27, 1.1]];
    for (const s of S) {
      ellipsePath(ctx, s[0], s[1], s[2] * 1.25, s[2]);
      ctx.fill();
    }
  }

  function tail(ctx, t) {
    ctx.save();
    ctx.translate(-16, -29);
    ctx.rotate(-0.7 + Math.sin(t * 5) * 0.15);
    ellipsePath(ctx, 0, -3, 2.6, 4.2);
    H.paint(ctx, C.spot, C.line, 0.95);
    ctx.fillStyle = C.fur;
    ellipsePath(ctx, 0.9, -4, 1.4, 3.2);
    ctx.fill();
    ctx.restore();
  }

  function ear(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ellipsePath(ctx, 0, -5.5, 3.1, 6.4);
    H.paint(ctx, back ? C.furDark : C.fur, C.line, 1);
    if (!back) {
      ctx.fillStyle = C.ear;
      ellipsePath(ctx, 0.3, -5.2, 1.7, 4.6);
      ctx.fill();
    }
    ctx.restore();
  }

  // La tête : (x, y) est le centre du crâne. earA tourne un peu les oreilles.
  function headShape(ctx, o, x, y, earA) {
    const t = o.t || 0;
    const tw = H.blinking(t, 2.2) ? 0.25 : 0;
    ear(ctx, x - 3.5, y - 4, -1.15 + earA, true);
    // crâne et museau, un seul contour
    const shapes = [() => circlePath(ctx, x, y, 6.6), () => ellipsePath(ctx, x + 6.2, y + 2.2, 5.4, 3.8, 0.25)];
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2.2;
    for (const s of shapes) { s(); ctx.stroke(); }
    ctx.fillStyle = C.fur;
    for (const s of shapes) { s(); ctx.fill(); }
    ctx.fillStyle = C.cream;
    ellipsePath(ctx, x + 7, y + 3.6, 4, 2.2, 0.25);
    ctx.fill();
    ctx.fillStyle = C.furLight;
    ellipsePath(ctx, x - 2, y - 3.6, 3, 1.8, -0.4);
    ctx.fill();
    ear(ctx, x - 1.5, y - 4.5, -0.55 + earA - tw, false);
    // nez et bouche
    ellipsePath(ctx, x + 11, y + 1.3, 1.7, 1.3, 0.3);
    H.paint(ctx, C.nose, null);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (o.hurt) {
      ctx.moveTo(x + 6.5, y + 5.4);
      ctx.quadraticCurveTo(x + 8, y + 4.4, x + 9.6, y + 5);
    } else {
      ctx.moveTo(x + 6.5, y + 4.6);
      ctx.quadraticCurveTo(x + 8.2, y + 6, x + 10, y + 4.2);
    }
    ctx.stroke();
    // grand oeil avec des cils
    const blink = H.blinking(t, 0.9);
    const ex = x + 2.6;
    const ey = y - 0.4;
    H.eye(ctx, ex, ey, 2.7, 3.3, { iris: C.iris, hurt: o.hurt, blink, line: '#2a1408', look: { x: 0.7, y: 0.1 } });
    if (!o.hurt && !blink) {
      ctx.strokeStyle = '#2a1408';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -2.0 - i * 0.42;
        ctx.moveTo(ex + Math.cos(a) * 2.6, ey + Math.sin(a) * 3.2);
        ctx.lineTo(ex + Math.cos(a) * 4.6, ey + Math.sin(a) * 4.8);
      }
      ctx.stroke();
    }
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.55;
    ellipsePath(ctx, x + 3.5, y + 4, 2, 1.3);
    ctx.fill();
    ctx.globalAlpha /= 0.55;
  }

  H.add('biche', {
    draw(ctx, o, R) {
      const t = o.t;
      const L = legs(o, R);
      ctx.translate(0, R.bob + L.low);
      if (L.tilt < -0.2) {
        // cabrée : elle tourne autour de ses sabots de derrière
        ctx.translate(-10, -L.low);
        ctx.rotate(L.tilt);
        ctx.translate(10, L.low);
      } else {
        ctx.translate(0, -22);
        ctx.rotate(L.tilt + R.lean * 0.5);
        ctx.translate(0, 22);
      }
      const earA = (R.armF + 0.12) * 0.12 + (o.pose === 'jump' ? 0.35 : 0) + Math.sin(t * 2.5) * 0.04;
      // la tête se baisse un peu quand elle est couchée
      const headDrop = o.pose === 'crouch' ? 3 : o.pose === 'pound' ? 2 : 0;
      leg(ctx, 6, L.fF, L.bfF, true, false);
      leg(ctx, -12, L.hF, L.bhF, true, true);
      leg(ctx, -9.5, L.hN, L.bhN, false, true);
      leg(ctx, 8.5, L.fN, L.bfN, false, false);
      tail(ctx, t);
      body(ctx);
      if (o.holding) {
        // le bébé oiseau voyage sur son dos
        ctx.save();
        ctx.translate(-30, -21);
        o.holding(ctx);
        ctx.restore();
      }
      ctx.translate(14, -49 + headDrop);
      ctx.scale(1.1, 1.1);
      headShape(ctx, o, 0, 0, earA);
    },
    head(ctx) {
      ctx.scale(1.45, 1.45);
      headShape(ctx, { t: 1, pose: 'idle' }, -3, 4, 0);
    },
  });
})();
