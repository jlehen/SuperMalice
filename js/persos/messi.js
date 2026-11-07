'use strict';

// ---------------- Messi ----------------
// Un gentil footballeur : maillot rayé bleu ciel et blanc avec le 10 dans le dos, short noir,
// cheveux courts et petite barbe marron, un grand sourire tout doux.
// Pouvoir : il dribble avec le ballon collé au pied (pose 'dribble').
(() => {
  const H = Heroes;
  const C = {
    sky: '#7cc8f2', skyDark: '#5aaee0', white: '#ffffff', whiteShade: '#e4ecf6', shirtLine: '#3a7aa8',
    num: '#1d2f6a',
    shorts: '#2a2a33', shortsDark: '#1c1c24', shortsLine: '#0a0a10',
    skin: '#f5cba6', skinShade: '#e6b48c', skinLine: '#b67a52', cheek: '#ff8f9f',
    hair: '#6a4022', hairDark: '#4e2c14', hairLight: '#9c6a3e', hairLine: '#30180a',
    beard: '#a0703f', beardLine: '#5a3416',
    sock: '#ffffff', sockShade: '#dfe3ee', sockLine: '#9aa2b8',
    boot: '#f2f2f6', bootDark: '#c8cad6', bootLine: '#5a5e70', bootStripe: '#7cc8f2',
    iris: '#5a3a1e', eye: '#2a1a14',
  };
  const HIP = -15.5;
  const LEG = 10;
  const ARM = 11;

  function leg(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2.7, 0, 5.4, LEG, 2.6);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 1);
    roundRectPath(ctx, -3, LEG * 0.45, 6, LEG * 0.55 + 1, 2.2);
    H.paint(ctx, back ? C.sockShade : C.sock, C.sockLine, 1);
    ctx.fillStyle = C.sky;
    ctx.fillRect(-2.6, LEG * 0.45 + 1.2, 5.2, 1.2);
    roundRectPath(ctx, -4.4, -3, 8.8, 7.4, 2.6);
    H.paint(ctx, back ? C.shortsDark : C.shorts, C.shortsLine, 1);
    ctx.translate(0, LEG + 1);
    ctx.rotate(-a);
    ctx.fillStyle = '#9a9cae';
    for (const sx of [-1.6, 2.2, 5.6]) ctx.fillRect(sx, 2, 1.4, 1.6);
    ctx.beginPath();
    ctx.moveTo(-4, 0.6);
    ctx.quadraticCurveTo(-4, -3.4, 0.4, -3.4);
    ctx.quadraticCurveTo(7.8, -2.8, 8.6, 1);
    ctx.quadraticCurveTo(8.6, 2.6, 5, 2.6);
    ctx.lineTo(-2.4, 2.6);
    ctx.quadraticCurveTo(-4, 2.6, -4, 0.6);
    ctx.closePath();
    H.paint(ctx, back ? C.bootDark : C.boot, C.bootLine, 1);
    ctx.strokeStyle = C.bootStripe;
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1.6, 0.4);
    ctx.quadraticCurveTo(2.4, 1.4, 6.2, -1);
    ctx.stroke();
    ctx.restore();
  }

  function arm(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2, 2, 4, ARM - 2, 2);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    circlePath(ctx, 0, ARM, 3);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    ctx.beginPath();
    ctx.moveTo(-3.8, 0.2);
    ctx.quadraticCurveTo(0, -3.8, 3.8, 0.2);
    ctx.lineTo(3.5, 5);
    ctx.quadraticCurveTo(0, 6.2, -3.5, 5);
    ctx.closePath();
    H.paint(ctx, back ? C.whiteShade : C.white, C.shirtLine, 0.95);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = back ? C.skyDark : C.sky;
    ctx.fillRect(-1.3, -4, 2.6, 11);
    ctx.restore();
    ctx.restore();
  }

  // Le 10, en bleu marine bordé de blanc.
  function ten(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.8, 0.8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [col, w] of [['#ffffff', 3.6], [C.num, 1.7]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(-4.6, -2.6);
      ctx.lineTo(-3.2, -4);
      ctx.lineTo(-3.2, 4);
      ctx.moveTo(3.6, 0);
      ctx.ellipse(1.4, 0, 2.2, 3.9, 0, 0, H.TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function torsoPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-7.2, -33.6);
    ctx.quadraticCurveTo(0.4, -35.8, 7.4, -33.6);
    ctx.quadraticCurveTo(9.8, -28.5, 9, -18);
    ctx.lineTo(-8.2, -18);
    ctx.quadraticCurveTo(-9.8, -28.5, -7.2, -33.6);
    ctx.closePath();
  }

  // Le maillot à rayures verticales, et le short noir.
  function body(ctx) {
    torsoPath(ctx);
    H.paint(ctx, C.white, C.shirtLine, 1.05);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = C.sky;
    for (const sx of [-7.4, -1.6, 4.2]) ctx.fillRect(sx, -37, 3.2, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ellipsePath(ctx, 5, -28, 2.4, 4.4, 0.1);
    ctx.fill();
    ctx.restore();
    torsoPath(ctx);
    ctx.strokeStyle = C.shirtLine;
    ctx.lineWidth = 1.05;
    ctx.stroke();
    ten(ctx, -3, -26);
    ctx.beginPath();
    ctx.moveTo(-8.6, -20.6);
    ctx.lineTo(9.2, -20.6);
    ctx.quadraticCurveTo(10.6, -15.6, 8.4, -12);
    ctx.quadraticCurveTo(0, -10.6, -7.2, -11.6);
    ctx.quadraticCurveTo(-11.2, -13.8, -10.2, -17.4);
    ctx.quadraticCurveTo(-9.8, -19.6, -8.6, -20.6);
    ctx.closePath();
    H.paint(ctx, C.shorts, C.shortsLine, 1.05);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ellipsePath(ctx, 3, -17.6, 4, 1.6);
    ctx.fill();
  }

  // Le ballon de foot : blanc avec des pentagones noirs, il tourne avec rot.
  function football(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    circlePath(ctx, 0, 0, r);
    H.paint(ctx, '#ffffff', '#30303a', 1);
    ctx.save();
    circlePath(ctx, 0, 0, r);
    ctx.clip();
    ctx.rotate(rot);
    ctx.fillStyle = '#26262e';
    const pent = (cx, cy, s, a0) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = a0 + (i / 5) * H.TAU;
        ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
      }
      ctx.closePath();
      ctx.fill();
    };
    pent(0, 0, r * 0.36, -Math.PI / 2);
    ctx.strokeStyle = '#26262e';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * H.TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36);
      ctx.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
      ctx.stroke();
      const b = a + H.TAU / 10;
      pent(Math.cos(b) * r * 1.02, Math.sin(b) * r * 1.02, r * 0.34, b);
    }
    ctx.restore();
    const sh = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.1, 0, 0, r * 1.1);
    sh.addColorStop(0, 'rgba(255,255,255,0.6)');
    sh.addColorStop(0.4, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(0,0,40,0.25)');
    ctx.fillStyle = sh;
    circlePath(ctx, 0, 0, r);
    ctx.fill();
    ctx.restore();
  }

  // La tête de trois-quarts : cheveux courts, petite barbe, grand sourire gentil.
  function headShape(ctx, o, hx, hy) {
    const t = o.t || 0;
    const pose = o.pose;
    circlePath(ctx, hx, hy, 14);
    H.paint(ctx, C.skin, C.skinLine, 1.05);
    // la barbe, tout le long de la mâchoire
    ctx.save();
    circlePath(ctx, hx, hy, 14);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(hx - 4.4, hy + 3.4);
    ctx.quadraticCurveTo(hx - 2.6, hy + 9, hx + 1.4, hy + 10.4);
    ctx.quadraticCurveTo(hx + 5, hy + 11.6, hx + 7, hy + 10);
    ctx.quadraticCurveTo(hx + 11, hy + 7.4, hx + 15, hy + 7.6);
    ctx.lineTo(hx + 15, hy + 16);
    ctx.lineTo(hx - 7, hy + 16);
    ctx.quadraticCurveTo(hx - 7.4, hy + 4, hx - 4.4, hy - 1);
    ctx.closePath();
    H.paint(ctx, C.beard, C.beardLine, 1);
    ctx.restore();
    circlePath(ctx, hx, hy, 14);
    ctx.strokeStyle = C.beardLine;
    ctx.lineWidth = 1.05;
    ctx.stroke();
    // oreille
    ellipsePath(ctx, hx - 5.2, hy + 1.4, 2.5, 3.3);
    H.paint(ctx, C.skin, C.skinLine, 0.9);
    ctx.strokeStyle = C.skinLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(hx - 5, hy + 1.4, 1.2, -1.2, 1.6);
    ctx.stroke();
    // cheveux courts, raie sur le côté
    ctx.beginPath();
    ctx.moveTo(hx - 14.4, hy + 3);
    ctx.bezierCurveTo(hx - 16, hy - 14, hx + 4, hy - 20, hx + 14.2, hy - 7);
    ctx.quadraticCurveTo(hx + 13.6, hy - 4.4, hx + 11.4, hy - 4.6);
    ctx.quadraticCurveTo(hx + 10.6, hy - 7.6, hx + 8.6, hy - 6.6);
    ctx.quadraticCurveTo(hx + 7.4, hy - 4.6, hx + 5.2, hy - 5);
    ctx.quadraticCurveTo(hx + 3, hy - 8, hx + 0.4, hy - 6.6);
    ctx.quadraticCurveTo(hx - 2.2, hy - 5.6, hx - 2.6, hy - 2);
    ctx.lineTo(hx - 3.6, hy - 2);
    ctx.quadraticCurveTo(hx - 7.4, hy - 1, hx - 8, hy + 4);
    ctx.quadraticCurveTo(hx - 8.4, hy + 8.4, hx - 10, hy + 9.6);
    ctx.quadraticCurveTo(hx - 13.6, hy + 7, hx - 14.4, hy + 3);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    ctx.strokeStyle = C.hairLight;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy - 11);
    ctx.quadraticCurveTo(hx, hy - 15, hx + 6, hy - 13);
    ctx.stroke();
    const eo = { iris: C.iris, line: C.eye, hurt: o.hurt, blink: H.blinking(t, 2.3), look: { x: 0.6, y: 0 } };
    H.eye(ctx, hx + 2, hy - 0.4, 3, 4.2, eo);
    H.eye(ctx, hx + 9.4, hy - 0.4, 3.3, 4.6, eo);
    ctx.strokeStyle = C.hairDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx - 0.6, hy - 6);
    ctx.quadraticCurveTo(hx + 2, hy - 7.6, hx + 4.4, hy - 6.4);
    ctx.moveTo(hx + 7.2, hy - 6.8);
    ctx.quadraticCurveTo(hx + 9.6, hy - 8.2, hx + 12.2, hy - 6.6);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha *= 0.45;
    ctx.fillStyle = C.cheek;
    ellipsePath(ctx, hx - 0.8, hy + 4.2, 2.4, 1.5);
    ctx.fill();
    ellipsePath(ctx, hx + 12.2, hy + 4, 1.6, 1.5);
    ctx.fill();
    ctx.restore();
    // nez
    ellipsePath(ctx, hx + 13.6, hy + 2.6, 2.2, 2.6);
    H.paint(ctx, C.skin, C.skinLine, 0.95);
    // la bouche dans la barbe
    const open = pose === 'win' || pose === 'jump' || pose === 'dribble';
    const mx = hx + 7.8;
    const my = hy + 8.4;
    if (o.hurt) {
      ellipsePath(ctx, mx, my, 2.2, 1.8);
      H.paint(ctx, '#7a1830', '#4e0c1c', 0.8);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mx - 4.6, my - 1.2);
      ctx.quadraticCurveTo(mx, my + 0.2, mx + 4.4, my - 2);
      ctx.quadraticCurveTo(mx + 3.6, my + (open ? 5.6 : 3.4), mx, my + (open ? 5.8 : 3.4));
      ctx.quadraticCurveTo(mx - 3.6, my + (open ? 5.2 : 3), mx - 4.6, my - 1.2);
      ctx.closePath();
      H.paint(ctx, '#7a1830', '#4e0c1c', 0.85);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 5, my - 3, 10, 3.6);
      ctx.fillStyle = '#ff7f95';
      ellipsePath(ctx, mx, my + (open ? 5.4 : 3.6), 3, 1.8);
      ctx.fill();
      ctx.restore();
    }
    // petite moustache au-dessus
    ctx.strokeStyle = C.beard;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mx - 4.4, my - 2.4);
    ctx.quadraticCurveTo(mx, my - 4, mx + 4.4, my - 3.2);
    ctx.stroke();
  }

  H.add('messi', {
    draw(ctx, o, R) {
      const pose = o.pose;
      let { legF, legB, armF, armB, bob, lean, crouch } = R;
      const dribble = pose === 'dribble';
      if (dribble) {
        // il court, le ballon collé au pied
        const s = Math.sin(o.ph);
        legF = s * 0.95;
        legB = -s * 0.95;
        armF = -s * 1.15;
        armB = s * 1.15;
        bob = -Math.abs(Math.cos(o.ph)) * 3;
        lean = 0.16;
      } else if (pose === 'hang') {
        armF = -1.95 + Math.sin(o.t * 3) * 0.1;
        armB = 1.95 + Math.sin(o.t * 3) * 0.1;
        legF = 0.18 + Math.sin(o.t * 3) * 0.08;
        legB = -0.12 + Math.sin(o.t * 3) * 0.08;
      } else if (pose === 'crouch') {
        legF = -1.3;
        legB = -1.05;
        crouch = -HIP - Math.cos(legB) * (LEG + 1) - 3.4;
      }
      ctx.save();
      ctx.translate(0, bob);
      ctx.rotate(lean);
      ctx.save();
      ctx.translate(0, crouch);
      arm(ctx, -1.8, -30.6, armB, true);
      ctx.restore();
      leg(ctx, -2.4, HIP + crouch, legB, true);
      leg(ctx, 1.6, HIP + crouch, legF, false);
      ctx.save();
      ctx.translate(0, crouch);
      body(ctx);
      headShape(ctx, o, 1.6, -45.6);
      if (o.holding) o.holding(ctx);
      arm(ctx, 1.2, -30.4, armF, false);
      ctx.restore();
      ctx.restore();
      if (dribble) {
        const ph = o.ph || 0;
        football(ctx, 17 + Math.sin(ph) * 1.5, -7 - Math.abs(Math.sin(ph)) * 2.4, 7, ph * 0.9);
      }
    },
    head(ctx) {
      headShape(ctx, { t: 1, pose: 'idle' }, -1.6, 2);
    },
  });
})();
