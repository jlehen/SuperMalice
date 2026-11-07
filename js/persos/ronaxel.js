'use strict';

// ---------------- Ronaxel ----------------
// Le grand frère d'Alice, un ado tout en jambes, fan de Cristiano Ronaldo :
// maillot rouge avec le 7, short vert, cheveux en pics pleins de gel, et un grand sourire un peu débile.
// Pouvoirs : il tire dans le ballon (pose 'kick') et fait la célébration SIUUU (pose 'siu').
(() => {
  const H = Heroes;
  const C = {
    shirt: '#e8333a', shirtDark: '#c42430', shirtLight: '#ff8078', shirtLine: '#8a1420',
    trim: '#1fa04a', trimLine: '#0f6a2e',
    shorts: '#24a854', shortsDark: '#188a42', shortsLine: '#0e5e2a',
    skin: '#f7cfae', skinShade: '#eab894', skinLine: '#b97c58', cheek: '#ff8fa0',
    hair: '#7a4a24', hairDark: '#5a3216', hairLight: '#b88250', hairLine: '#3a1e0a',
    sock: '#ffffff', sockShade: '#dfe3ee', sockLine: '#9aa2b8',
    boot: '#2a2a34', bootDark: '#18181f', bootLine: '#000000', bootLight: '#6a6a7a',
    iris: '#6a3a1a', eye: '#2a1a14',
  };
  const HIP = -19;
  const LEG = 14;
  const ARM = 13.5;

  // Une jambe : short vert, genou, chaussette blanche, chaussure à crampons.
  // footA : l'angle du pied (par défaut il reste à plat).
  function leg(ctx, x, y, a, back, footA) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2.6, 0, 5.2, LEG, 2.6);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 1);
    roundRectPath(ctx, -2.9, LEG * 0.5, 5.8, LEG * 0.5 + 1, 2.2);
    H.paint(ctx, back ? C.sockShade : C.sock, C.sockLine, 1);
    ctx.fillStyle = C.trim;
    ctx.fillRect(-2.5, LEG * 0.5 + 1.4, 5, 1.3);
    roundRectPath(ctx, -4.4, -3, 8.8, 8.6, 2.6);
    H.paint(ctx, back ? C.shortsDark : C.shorts, C.shortsLine, 1);
    ctx.translate(0, LEG + 1);
    ctx.rotate(footA === undefined ? -a : footA);
    boot(ctx, back);
    ctx.restore();
  }

  function boot(ctx, back) {
    ctx.fillStyle = '#d8d8e0';
    for (const sx of [-1.6, 2.2, 5.6]) ctx.fillRect(sx, 2, 1.4, 1.6);
    ctx.beginPath();
    ctx.moveTo(-3.8, 0.6);
    ctx.quadraticCurveTo(-3.8, -3.2, 0.4, -3.2);
    ctx.quadraticCurveTo(7.6, -2.6, 8.4, 1);
    ctx.quadraticCurveTo(8.4, 2.6, 5, 2.6);
    ctx.lineTo(-2.4, 2.6);
    ctx.quadraticCurveTo(-3.8, 2.6, -3.8, 0.6);
    ctx.closePath();
    H.paint(ctx, back ? C.bootDark : C.boot, C.bootLine, 1);
    // la petite virgule blanche sur le côté
    ctx.strokeStyle = back ? '#b8b8c4' : '#ffffff';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1.6, 0.6);
    ctx.quadraticCurveTo(2.4, 1.6, 6, -1);
    ctx.stroke();
  }

  // Un bras : manche du maillot avec un liseré vert, bras, main.
  function arm(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2, 2, 4, ARM - 1.5, 2);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    circlePath(ctx, 0, ARM + 0.6, 2.9);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    ctx.beginPath();
    ctx.moveTo(-3.8, 0.2);
    ctx.quadraticCurveTo(0, -3.8, 3.8, 0.2);
    ctx.lineTo(3.5, 5.6);
    ctx.quadraticCurveTo(0, 6.8, -3.5, 5.6);
    ctx.closePath();
    H.paint(ctx, back ? C.shirtDark : C.shirt, C.shirtLine, 0.95);
    ctx.strokeStyle = C.trim;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-3.2, 4.8);
    ctx.quadraticCurveTo(0, 6, 3.2, 4.8);
    ctx.stroke();
    ctx.restore();
  }

  // Le 7 dessiné au trait (blanc bordé de rouge foncé).
  function seven(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.4, -5);
    ctx.lineTo(3.4, -5);
    ctx.lineTo(-0.8, 5.4);
    ctx.strokeStyle = C.shirtLine;
    ctx.lineWidth = 4.4;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }

  // Le corps vu de côté : maillot rouge (le 7 dans le dos), short vert.
  function body(ctx) {
    ctx.beginPath();
    ctx.moveTo(-7.4, -41);
    ctx.quadraticCurveTo(1, -43.6, 8, -41);
    ctx.quadraticCurveTo(11, -33, 9.4, -21);
    ctx.lineTo(-8.4, -21);
    ctx.quadraticCurveTo(-10, -32, -7.4, -41);
    ctx.closePath();
    H.paint(ctx, C.shirt, C.shirtLine, 1.05);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ellipsePath(ctx, 5, -34, 2.6, 5, 0.1);
    ctx.fill();
    // bande verte sur le côté
    ctx.strokeStyle = C.trim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0.4, -39);
    ctx.quadraticCurveTo(1.6, -30, 0.8, -22);
    ctx.stroke();
    seven(ctx, -4.2, -31, 1);
    // le short
    ctx.beginPath();
    ctx.moveTo(-8.8, -24);
    ctx.lineTo(9.6, -24);
    ctx.quadraticCurveTo(11, -18.5, 8.6, -14.6);
    ctx.quadraticCurveTo(0, -13, -7.4, -14);
    ctx.quadraticCurveTo(-11.6, -16.5, -10.4, -20.5);
    ctx.quadraticCurveTo(-10, -22.8, -8.8, -24);
    ctx.closePath();
    H.paint(ctx, C.shorts, C.shortsLine, 1.05);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8.6, -22.4);
    ctx.lineTo(9.8, -22.4);
    ctx.stroke();
  }

  // Les cheveux en pics : de la nuque, par-dessus le crâne, jusqu'à la houppette devant.
  function spikes(ctx, hx, hy, front) {
    const tips = front
      ? [[-1.95, 15], [-1.65, 18.5], [-1.35, 19.5], [-1.05, 18.5], [-0.75, 17], [-0.45, 15]]
      : [[-2.95, 16], [-2.5, 18.5], [-2.05, 19.5], [-1.62, 19.5], [-1.2, 18.5]];
    ctx.beginPath();
    if (front) ctx.moveTo(hx - 13.4, hy - 2);
    else ctx.moveTo(hx - 12.4, hy + 9);
    let prev = -Math.PI - 0.1;
    if (!front) ctx.lineTo(hx - 13.6, hy + 2);
    tips.forEach(([a, r]) => {
      const v = (prev + a) / 2;
      ctx.lineTo(hx + Math.cos(v) * 12.4, hy + Math.sin(v) * 12.4);
      // la pointe part un peu vers l'arrière (le gel !)
      const b = front ? 0 : 0.18;
      ctx.lineTo(hx + Math.cos(a - b) * r, hy + Math.sin(a - b) * r);
      prev = a;
    });
    if (front) {
      ctx.lineTo(hx + 13.4, hy - 2);
      ctx.quadraticCurveTo(hx + 7, hy - 9, hx, hy - 8.4);
      ctx.quadraticCurveTo(hx - 7, hy - 9, hx - 13.4, hy - 2);
    } else {
      // la houppette qui se relève devant
      ctx.lineTo(hx + 8, hy - 12);
      ctx.quadraticCurveTo(hx + 14, hy - 19, hx + 18.5, hy - 14.5);
      ctx.quadraticCurveTo(hx + 16, hy - 13.4, hx + 13.6, hy - 6.4);
      ctx.quadraticCurveTo(hx + 8, hy - 9, hx + 2.6, hy - 7.6);
      ctx.quadraticCurveTo(hx - 0.4, hy - 6.6, hx - 1.2, hy - 4);
      ctx.lineTo(hx - 1.6, hy + 3);
      ctx.quadraticCurveTo(hx - 4, hy + 6, hx - 6, hy + 4.6);
      ctx.quadraticCurveTo(hx - 9, hy + 8, hx - 12.4, hy + 9);
    }
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    ctx.strokeStyle = C.hairLight;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (front) {
      ctx.moveTo(hx - 6, hy - 11);
      ctx.lineTo(hx - 4, hy - 15);
      ctx.moveTo(hx + 1, hy - 12);
      ctx.lineTo(hx + 2, hy - 16);
    } else {
      ctx.moveTo(hx - 7, hy - 8);
      ctx.lineTo(hx - 9, hy - 13);
      ctx.moveTo(hx - 1, hy - 11);
      ctx.lineTo(hx - 2, hy - 15.5);
      ctx.moveTo(hx + 8, hy - 11);
      ctx.quadraticCurveTo(hx + 12, hy - 15.5, hx + 15.5, hy - 15);
    }
    ctx.stroke();
  }

  function brow(ctx, x, y, w, raise) {
    ctx.strokeStyle = C.hairDark;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w, y + 0.6);
    ctx.quadraticCurveTo(x, y - 1.2 - raise, x + w, y + 0.2 - raise * 0.3);
    ctx.stroke();
  }

  function cheeks(ctx, pts) {
    ctx.save();
    ctx.globalAlpha *= 0.5;
    ctx.fillStyle = C.cheek;
    pts.forEach(([x, y, rx]) => {
      ellipsePath(ctx, x, y, rx, 1.7);
      ctx.fill();
    });
    ctx.restore();
  }

  // Le grand sourire plein de dents (avec deux grandes dents de devant).
  function grin(ctx, x, y, tongue, t) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 1);
    ctx.quadraticCurveTo(x + 1, y + 0.6, x + 6.6, y - 3);
    ctx.quadraticCurveTo(x + 5.6, y + 6.2, x, y + 6);
    ctx.quadraticCurveTo(x - 4.6, y + 5.4, x - 6, y - 1);
    ctx.closePath();
    H.paint(ctx, '#7a1830', '#4e0c1c', 0.9);
    ctx.clip();
    ctx.fillStyle = '#ff7f95';
    ellipsePath(ctx, x + 0.4, y + 6, 4.4, 2.6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 2);
    ctx.lineTo(x + 7, y - 4);
    ctx.lineTo(x + 7, y + 0.8);
    ctx.lineTo(x - 7, y + 1.8);
    ctx.closePath();
    ctx.fill();
    // les deux grandes dents de devant
    roundRectPath(ctx, x - 0.6, y - 1, 2.6, 3.8, 0.8);
    H.paint(ctx, '#ffffff', '#c8c0d4', 0.6);
    roundRectPath(ctx, x + 2, y - 1.3, 2.6, 3.8, 0.8);
    H.paint(ctx, '#ffffff', '#c8c0d4', 0.6);
    ctx.restore();
    if (tongue) {
      // il tire la langue
      ctx.save();
      ctx.translate(x + 2.4, y + 4.6);
      ctx.rotate(-0.3 + Math.sin(t * 6) * 0.12);
      ctx.beginPath();
      ctx.moveTo(-2.6, -1);
      ctx.lineTo(2.6, -1);
      ctx.quadraticCurveTo(3.4, 5.6, 0, 6.2);
      ctx.quadraticCurveTo(-3.4, 5.6, -2.6, -1);
      ctx.closePath();
      H.paint(ctx, '#ff6f91', '#c23a5e', 0.8);
      ctx.strokeStyle = '#c23a5e';
      ctx.beginPath();
      ctx.moveTo(0, 0.6);
      ctx.lineTo(0, 3.6);
      ctx.stroke();
      ctx.restore();
    }
  }

  function openMouth(ctx, x, y, w, h) {
    ellipsePath(ctx, x, y, w, h);
    H.paint(ctx, '#7a1830', '#4e0c1c', 0.9);
    ctx.save();
    ellipsePath(ctx, x, y, w, h);
    ctx.clip();
    ctx.fillStyle = '#ff7f95';
    ellipsePath(ctx, x, y + h * 0.8, w * 0.7, h * 0.5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - w, y - h, w * 2, h * 0.38);
    ctx.restore();
  }

  // La tête de trois-quarts (tournée vers la droite).
  function headShape(ctx, o, hx, hy) {
    const t = o.t || 0;
    const pose = o.pose;
    ellipsePath(ctx, hx - 2.6, hy + 0.6, 13.2, 12.8);
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    circlePath(ctx, hx, hy, 13);
    H.paint(ctx, C.skin, C.skinLine, 1.05);
    ellipsePath(ctx, hx - 4.6, hy + 2.6, 2.4, 3.2);
    H.paint(ctx, C.skin, C.skinLine, 0.9);
    ctx.strokeStyle = C.skinLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(hx - 4.4, hy + 2.6, 1.2, -1.2, 1.6);
    ctx.stroke();
    spikes(ctx, hx, hy, false);
    const shout = pose === 'win' || pose === 'jump' || pose === 'kick';
    const tongue = pose === 'idle' && (t % 6.5) > 4.6;
    const eo = { iris: C.iris, line: C.eye, hurt: o.hurt, blink: H.blinking(t, 0.7), look: { x: 0.7, y: 0 } };
    H.eye(ctx, hx + 1.6, hy + 0.4, 2.8, 4, eo);
    H.eye(ctx, hx + 8.8, hy + 0.4, 3.2, 4.4, eo);
    // un sourcil normal, l'autre tout en haut (l'air un peu débile)
    brow(ctx, hx + 1.6, hy - 5.6, 2.8, o.hurt ? -1 : 0);
    brow(ctx, hx + 9.4, hy - 8.4, 3.2, o.hurt ? -1 : 2.8);
    cheeks(ctx, [[hx - 1.2, hy + 5.6, 2.4], [hx + 12, hy + 5, 1.6]]);
    ellipsePath(ctx, hx + 13.2, hy + 3.4, 2.2, 2.6);
    H.paint(ctx, C.skin, C.skinLine, 0.95);
    if (o.hurt) openMouth(ctx, hx + 7, hy + 9.4, 2.6, 2.2);
    else if (shout) openMouth(ctx, hx + 7, hy + 9.4, 4.4, 3.8);
    else grin(ctx, hx + 6.6, hy + 8.4, tongue, t);
  }

  // ---- SIUUU ! De face, jambes écartées, bras grands ouverts, il crie les yeux fermés ----
  function headFront(ctx, o, hx, hy) {
    for (const s of [-1, 1]) {
      ellipsePath(ctx, hx + s * 13, hy + 2, 2.4, 3.4);
      H.paint(ctx, C.skin, C.skinLine, 0.9);
    }
    circlePath(ctx, hx, hy, 13);
    H.paint(ctx, C.skin, C.skinLine, 1.05);
    spikes(ctx, hx, hy, true);
    // les yeux fermés de bonheur
    ctx.strokeStyle = C.eye;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(hx + s * 5 - 3, hy + 0.6);
      ctx.quadraticCurveTo(hx + s * 5, hy - 3.4, hx + s * 5 + 3, hy + 0.6);
      ctx.stroke();
      brow(ctx, hx + s * 5, hy - 5.8, 2.8, 2);
    }
    cheeks(ctx, [[hx - 8.4, hy + 4.4, 2.4], [hx + 8.4, hy + 4.4, 2.4]]);
    const k = 1 + Math.sin((o.t || 0) * 14) * 0.06;
    openMouth(ctx, hx, hy + 7.8, 4.2 * k, 4.8 * k);
  }

  function drawSiu(ctx, o) {
    const t = o.t || 0;
    const puff = Math.sin(t * 7) * 0.5;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s, 1);
      leg(ctx, 4.4, HIP, -0.32, s < 0);
      ctx.restore();
    }
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s, 1);
      arm(ctx, 8.6, -38.4, -1.0 - puff * 0.08, s < 0);
      ctx.restore();
    }
    // torse bombé, vu de face
    ctx.beginPath();
    ctx.moveTo(-9.6, -41.4);
    ctx.quadraticCurveTo(0, -44, 9.6, -41.4);
    ctx.quadraticCurveTo(12.4 + puff, -33, 9.8, -21);
    ctx.lineTo(-9.8, -21);
    ctx.quadraticCurveTo(-12.4 - puff, -33, -9.6, -41.4);
    ctx.closePath();
    H.paint(ctx, C.shirt, C.shirtLine, 1.05);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ellipsePath(ctx, -4, -34, 3, 4.6, 0.2);
    ctx.fill();
    // col en V vert, et un petit écusson
    ctx.strokeStyle = C.trim;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-4, -42.2);
    ctx.lineTo(0, -37.6);
    ctx.lineTo(4, -42.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3.6, -35);
    ctx.lineTo(7, -35);
    ctx.lineTo(7, -32);
    ctx.quadraticCurveTo(5.3, -30, 3.6, -32);
    ctx.closePath();
    H.paint(ctx, '#ffd84a', '#b08a10', 0.7);
    ctx.beginPath();
    ctx.moveTo(-10, -24);
    ctx.lineTo(10, -24);
    ctx.quadraticCurveTo(11.4, -18, 9.6, -14);
    ctx.lineTo(1.2, -14);
    ctx.lineTo(0, -16.4);
    ctx.lineTo(-1.2, -14);
    ctx.lineTo(-9.6, -14);
    ctx.quadraticCurveTo(-11.4, -18, -10, -24);
    ctx.closePath();
    H.paint(ctx, C.shorts, C.shortsLine, 1.05);
    headFront(ctx, o, 0, -54.6);
  }

  H.add('ronaxel', {
    draw(ctx, o, R) {
      const pose = o.pose;
      let { legF, legB, armF, armB, bob, lean, crouch } = R;
      let footF;
      ctx.translate(0, bob);
      if (pose === 'siu') {
        drawSiu(ctx, o);
        return;
      }
      if (pose === 'kick') {
        // la jambe de devant part très haut, les bras écartés pour l'équilibre
        legF = -1.95;
        legB = 0.12;
        armF = -1.3;
        armB = 1.75;
        lean = -0.16;
        footF = 1.45;
      } else if (pose === 'hang') {
        // les bras en l'air, les jambes qui se balancent
        armF = -1.95 + Math.sin(o.t * 3) * 0.1;
        armB = 1.95 + Math.sin(o.t * 3) * 0.1;
        legF = 0.18 + Math.sin(o.t * 3) * 0.08;
        legB = -0.12 + Math.sin(o.t * 3) * 0.08;
      } else if (pose === 'crouch') {
        legF = -1.3;
        legB = -1.05;
        crouch = -HIP - Math.cos(legB) * (LEG + 1) - 3.4;
      }
      ctx.rotate(lean);
      ctx.save();
      ctx.translate(0, crouch);
      arm(ctx, -1.6, -38.2, armB, true);
      ctx.restore();
      leg(ctx, -2.6, HIP + crouch, legB, true);
      leg(ctx, 2, HIP + crouch, legF, false, footF);
      ctx.save();
      ctx.translate(0, crouch);
      body(ctx);
      headShape(ctx, o, 2.4, -54);
      if (o.holding) {
        ctx.save();
        ctx.translate(0, -4);
        o.holding(ctx);
        ctx.restore();
      }
      arm(ctx, 1.4, -37.8, armF, false);
      ctx.restore();
    },
    head(ctx) {
      headShape(ctx, { t: 1, pose: 'idle' }, -1.6, 3.6);
    },
  });
})();
