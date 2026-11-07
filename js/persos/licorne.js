'use strict';

// ---------------- La Licorne ----------------
// Une licorne blanc nacré, toute ronde, avec une crinière et une queue arc-en-ciel,
// une corne dorée en spirale et une petite étoile sur la croupe.
// Pouvoir : elle fonce tête baissée, la corne en avant (pose 'charge').
(() => {
  const H = Heroes;
  const C = {
    coat: '#fdfbff', coatShade: '#e6e0f4', coatLight: '#ffffff', line: '#9a88bc',
    muzzle: '#ffe4ee', nose: '#ff9ab8', hoof: '#c9b4ff', hoofLine: '#7a62b8',
    horn: '#ffd54a', hornDark: '#e8a820', hornLine: '#a8780a', ear: '#ffc4dc',
    iris: '#7a4ad8', star: '#ffd23a', cheek: '#ff9ab8',
  };
  const RAINBOW = ['#ff8fc0', '#ffb37a', '#ffe27a', '#9ee89a', '#8cc8ff', '#c7a0ff'];
  const LEG_Y = -18;
  const UP = 8;
  const LOW = 7.5;

  // Une patte bien dodue : la cuisse tournée de a, puis le bas tourné de bend, et le sabot pastel.
  function leg(ctx, x, a, bend, back) {
    ctx.save();
    ctx.translate(x, LEG_Y);
    ctx.rotate(a);
    const fill = back ? C.coatShade : C.coat;
    roundRectPath(ctx, -2.8, -3, 5.6, UP + 4, 2.8);
    H.paint(ctx, fill, C.line, 1);
    ctx.translate(0, UP);
    ctx.rotate(bend);
    roundRectPath(ctx, -2.2, -1.8, 4.4, LOW + 1.8, 2.2);
    H.paint(ctx, fill, C.line, 1);
    roundRectPath(ctx, -2.6, LOW - 0.8, 5.2, 3.3, 1.2);
    H.paint(ctx, back ? '#b39ef0' : C.hoof, C.hoofLine, 0.9);
    ctx.restore();
  }

  function legs(o, R) {
    const t = o.t;
    const L = { fN: 0.05, fF: -0.05, hN: -0.05, hF: 0.05, bfN: 0, bfF: 0, bhN: 0, bhF: 0, tilt: 0, low: 0 };
    switch (o.pose) {
      case 'walk':
      case 'run': {
        const k = o.pose === 'run' ? 0.85 : 0.7;
        L.fN = R.legF * k; L.fF = R.legB * k;
        L.hN = R.legB * k; L.hF = R.legF * k;
        L.bfN = Math.max(0, -L.fN) * 1.6; L.bfF = Math.max(0, -L.fF) * 1.6;
        L.bhN = Math.max(0, -L.hN) * 1.4; L.bhF = Math.max(0, -L.hF) * 1.4;
        L.tilt = o.pose === 'run' ? 0.04 : 0;
        break;
      }
      case 'charge': {
        // grand galop : les pattes tendues devant et derrière
        const g = Math.sin(t * 22) * 0.18;
        Object.assign(L, { fN: -1.25 + g, fF: -1.0 + g, bfN: 0.25, bfF: 0.4, hN: 1.2 - g, hF: 1.0 - g, bhN: 0.15, bhF: 0.2, tilt: 0.05 });
        break;
      }
      case 'jump':
        Object.assign(L, { fN: -1.2, fF: -0.95, bfN: 1.9, bfF: 1.8, hN: 0.95, hF: 0.75, bhN: 0.35, bhF: 0.3, tilt: -0.12 });
        break;
      case 'fall':
        Object.assign(L, { fN: -0.45, fF: -0.25, bfN: 0.35, bfF: 0.25, hN: 0.35, hF: 0.15, bhN: 0.2, bhF: 0.15, tilt: 0.06 });
        break;
      case 'pound':
        Object.assign(L, { fN: -0.9, fF: -0.7, bfN: 2.2, bfF: 2.1, hN: 1.1, hF: 0.9, bhN: -2.1, bhF: -2.0, low: 3 });
        break;
      case 'crouch':
        Object.assign(L, { fN: -1.45, fF: -1.35, bfN: 2.7, bfF: 2.6, hN: 1.35, hF: 1.25, bhN: -2.6, bhF: -2.5, low: 9 });
        break;
      case 'throw':
        Object.assign(L, { fN: -1.2, bfN: 0.3, fF: 0.1 });
        break;
      case 'hang':
        Object.assign(L, { fN: -2.5, fF: -2.7, bfN: 0.4, bfF: 0.3, hN: 0.2, hF: 0.3, bhN: 0.1, bhF: 0.1 });
        break;
      case 'win': {
        const p = Math.sin(t * 10) * 0.35;
        Object.assign(L, { fN: -1.0 + p, fF: -0.8 - p, bfN: 1.7, bfF: 1.6, tilt: -0.3 });
        break;
      }
      case 'idle':
      case 'hold':
        break;
      default:
        L.fN = R.legF * 0.7; L.fF = R.legB * 0.7;
        L.hN = R.legB * 0.7; L.hF = R.legF * 0.7;
    }
    return L;
  }

  // Une mèche de crinière : une goutte qui part de (x, y) dans la direction (dx, dy).
  function lock(ctx, x, y, dx, dy, len, w, color) {
    const nx = -dy;
    const ny = dx;
    ctx.beginPath();
    ctx.moveTo(x + nx * w, y + ny * w);
    ctx.quadraticCurveTo(x + dx * len * 0.55 + nx * w * 1.3, y + dy * len * 0.55 + ny * w * 1.3, x + dx * len, y + dy * len);
    ctx.quadraticCurveTo(x + dx * len * 0.55 - nx * w * 1.1, y + dy * len * 0.55 - ny * w * 1.1, x - nx * w, y - ny * w);
    ctx.closePath();
    H.paint(ctx, color, H.tone(color, -0.3), 0.9);
  }

  // Le corps, la croupe et le cou (jusqu'à la tête en hx, hy) en un seul chemin.
  function bodyPath(ctx, hx, hy) {
    ctx.beginPath();
    ctx.ellipse(-1, -26, 14, 8.6, 0, 0, H.TAU);
    ctx.moveTo(-2, -26.5);
    ctx.arc(-10, -26.5, 8, 0, H.TAU);
    ctx.moveTo(8 + 7.4 * Math.cos(0.2), -26 + 7.4 * Math.sin(0.2));
    ctx.ellipse(8, -26, 7.4, 7.8, 0.2, 0, H.TAU);
    ctx.moveTo(2, -30);
    ctx.quadraticCurveTo(hx - 6, (hy - 30) / 2, hx - 6, hy + 1);
    ctx.lineTo(hx + 3, hy + 3);
    ctx.quadraticCurveTo(hx + 1, (hy - 24) / 2 + 2, 14.5, -23);
    ctx.closePath();
  }

  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * H.TAU;
      const d = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
  }

  function body(ctx, hx, hy) {
    bodyPath(ctx, hx, hy);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = C.coat;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = C.coatShade;
    ellipsePath(ctx, 0, -17.5, 16, 3.8);
    ctx.fill();
    // reflet nacré
    const g = ctx.createLinearGradient(-12, -34, 6, -22);
    g.addColorStop(0, 'rgba(255,200,235,0.45)');
    g.addColorStop(0.5, 'rgba(200,235,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ellipsePath(ctx, -4, -30, 10, 3, -0.05);
    ctx.fill();
    ctx.restore();
    // petite étoile sur la croupe
    star(ctx, -11, -25, 3.2);
    H.paint(ctx, C.star, '#d8a010', 0.8);
  }

  function tail(ctx, t, charge) {
    for (let i = 0; i < 6; i++) {
      const w = Math.sin(t * 5 + i * 0.9) * 0.12;
      let dx;
      let dy;
      if (charge) {
        dx = -1;
        dy = -0.25 + i * 0.1 + w;
      } else {
        const a = 2.65 - i * 0.2 + w;
        dx = Math.cos(a);
        dy = Math.sin(a);
      }
      lock(ctx, -16.5, -32 + i * 0.9, dx, dy, (charge ? 16 : 14) - Math.abs(i - 2.5) * 0.8, 2.5, RAINBOW[i]);
    }
  }

  // La crinière, du haut de la tête jusqu'au garrot.
  function mane(ctx, t, hx, hy, charge) {
    for (let i = 5; i >= 0; i--) {
      const k = i / 5;
      const x = hx - 5 + (1 - hx + 5) * k;
      const y = hy - 4 + (-31 - hy + 4) * k;
      const w = Math.sin(t * 4 + i) * 0.15;
      const dx = charge ? -1 : -0.72 + w;
      const dy = charge ? 0.12 + w : 0.7;
      lock(ctx, x, y, dx, dy, charge ? 10 : 8, 2.6, RAINBOW[i]);
    }
  }

  // La corne dorée en spirale, posée sur le front en (x, y).
  function horn(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.moveTo(-2.4, 0);
    ctx.lineTo(0, -12);
    ctx.lineTo(2.4, 0);
    ctx.quadraticCurveTo(0, 1.2, -2.4, 0);
    ctx.closePath();
    H.paint(ctx, C.horn, C.hornLine, 0.9);
    ctx.strokeStyle = C.hornDark;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      const yy = -i * 3;
      const ww = 2.4 * (1 + yy / 12);
      ctx.moveTo(-ww, yy + 1);
      ctx.lineTo(ww, yy - 0.6);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff6c0';
    ellipsePath(ctx, -0.7, -5, 0.5, 3);
    ctx.fill();
    ctx.restore();
  }

  // La tête : (x, y) est le centre du crâne.
  function headShape(ctx, o, x, y) {
    const t = o.t || 0;
    // oreille
    ctx.save();
    ctx.translate(x - 3.5, y - 5);
    ctx.rotate(-0.35 + (H.blinking(t, 2) ? -0.2 : 0));
    ctx.beginPath();
    ctx.moveTo(-2.6, 0);
    ctx.quadraticCurveTo(-2.8, -6, 0, -8.5);
    ctx.quadraticCurveTo(2.8, -6, 2.6, 0);
    ctx.closePath();
    H.paint(ctx, C.coat, C.line, 1);
    ctx.fillStyle = C.ear;
    ellipsePath(ctx, 0, -3.5, 1.2, 3.2);
    ctx.fill();
    ctx.restore();
    const shapes = [() => circlePath(ctx, x, y, 7.6), () => ellipsePath(ctx, x + 7, y + 2.8, 5.6, 4.8, 0.2)];
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2.2;
    for (const s of shapes) { s(); ctx.stroke(); }
    ctx.fillStyle = C.coat;
    for (const s of shapes) { s(); ctx.fill(); }
    ctx.fillStyle = C.muzzle;
    ellipsePath(ctx, x + 8.2, y + 3.4, 4.2, 3.6, 0.2);
    ctx.fill();
    ctx.fillStyle = C.nose;
    ellipsePath(ctx, x + 10.4, y + 1.8, 1, 0.8, 0.3);
    ctx.fill();
    ctx.strokeStyle = '#c86a8a';
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (o.hurt) {
      ctx.moveTo(x + 7, y + 6.6);
      ctx.quadraticCurveTo(x + 8.6, y + 5.6, x + 10.2, y + 6.4);
    } else {
      ctx.moveTo(x + 7, y + 5.8);
      ctx.quadraticCurveTo(x + 8.8, y + 7.4, x + 10.6, y + 5.6);
    }
    ctx.stroke();
    // grand oeil violet avec des cils
    const blink = H.blinking(t, 0.3);
    const ex = x + 2.6;
    const ey = y - 0.2;
    H.eye(ctx, ex, ey, 2.9, 3.6, { iris: C.iris, hurt: o.hurt, blink, line: '#3a2050', look: { x: 0.7, y: 0.1 } });
    if (!o.hurt && !blink) {
      ctx.strokeStyle = '#3a2050';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -2.0 - i * 0.42;
        ctx.moveTo(ex + Math.cos(a) * 2.8, ey + Math.sin(a) * 3.5);
        ctx.lineTo(ex + Math.cos(a) * 4.9, ey + Math.sin(a) * 5.2);
      }
      ctx.stroke();
    }
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.5;
    ellipsePath(ctx, x + 3.4, y + 4.6, 2.2, 1.4);
    ctx.fill();
    ctx.globalAlpha /= 0.5;
    // mèche sur le front, puis la corne
    lock(ctx, x - 1, y - 6.5, 0.55, 0.85, 6, 1.8, RAINBOW[0]);
    lock(ctx, x - 2.4, y - 6, 0.1, 1, 5.5, 1.6, RAINBOW[5]);
    horn(ctx, x + 2.2, y - 6.6);
  }

  H.add('licorne', {
    draw(ctx, o, R) {
      const t = o.t;
      const L = legs(o, R);
      const charge = o.pose === 'charge';
      let bob = R.bob;
      if (charge) bob = -Math.abs(Math.sin(t * 22)) * 2;
      ctx.translate(0, bob + L.low);
      if (L.tilt < -0.2) {
        ctx.translate(-10, -L.low);
        ctx.rotate(L.tilt);
        ctx.translate(10, L.low);
      } else {
        ctx.translate(0, -22);
        ctx.rotate(L.tilt + R.lean * 0.5);
        ctx.translate(0, 22);
      }
      // la tête : haute d'habitude, baissée la corne en avant pendant la charge
      let hx = 14;
      let hy = -45;
      let ha = 0;
      if (charge) { hx = 17; hy = -35; ha = 0.55; }
      else if (o.pose === 'crouch') hy = -42;
      if (charge) {
        // des traits de vitesse arc-en-ciel derrière elle
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.6;
        const a0 = ctx.globalAlpha;
        for (let i = 0; i < 3; i++) {
          const k = (t * 3 + i / 3) % 1;
          ctx.strokeStyle = RAINBOW[i * 2];
          ctx.globalAlpha = a0 * (1 - k);
          ctx.beginPath();
          ctx.moveTo(-28 - k * 10, -38 + i * 7);
          ctx.lineTo(-38 - k * 6, -38 + i * 7);
          ctx.stroke();
        }
        ctx.globalAlpha = a0;
      }
      leg(ctx, 6, L.fF, L.bfF, true);
      leg(ctx, -12, L.hF, L.bhF, true);
      tail(ctx, t, charge);
      leg(ctx, -9, L.hN, L.bhN, false);
      leg(ctx, 9, L.fN, L.bfN, false);
      body(ctx, hx, hy);
      mane(ctx, t, hx, hy, charge);
      if (o.holding) {
        ctx.save();
        ctx.translate(-27, -22);
        o.holding(ctx);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(ha);
      headShape(ctx, o, 0, 0);
      ctx.restore();
    },
    head(ctx) {
      ctx.scale(1.45, 1.45);
      headShape(ctx, { t: 1, pose: 'idle' }, -3, 4);
    },
  });
})();
