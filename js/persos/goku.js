'use strict';

// ---------------- San Goku ----------------
// Un petit champion d'arts martiaux : cheveux noirs tout en pointes, kimono orange,
// tee-shirt, ceinture, poignets et bottes bleus, un grand sourire courageux.
// Pouvoirs : le Kaméhaméha (pose 'kame') et son nuage magique (pose 'cloud', ou dès que pw.cloud > 0).
(() => {
  const H = Heroes;
  const C = {
    gi: '#ff8a1e', giDark: '#e06a0a', giLight: '#ffb060', giLine: '#a8460a',
    blue: '#2f5fc8', blueDark: '#1f469e', blueLine: '#122a66',
    skin: '#ffd4ae', skinShade: '#f0bc94', skinLine: '#b97a52', cheek: '#ff8f9f',
    hair: '#1c1c26', hairLight: '#4a4a62', hairLine: '#08080e',
    iris: '#1c1c26', eye: '#1a1418',
    cloud: '#ffe066', cloudDark: '#f0b020', cloudLight: '#fff6c0', cloudLine: '#c08010',
    kame: '#7fd8ff', kameCore: '#ffffff', kameEdge: '#2a8cff',
  };
  const HIP = -16;
  const LEG = 10;
  const ARM = 11;
  const HX = 1.6;
  const HY = -46;

  // Le pantalon orange tout large, et la botte bleue.
  function leg(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-4.4, -2);
    ctx.quadraticCurveTo(-5.4, LEG * 0.5, -3.4, LEG * 0.75);
    ctx.lineTo(3.4, LEG * 0.75);
    ctx.quadraticCurveTo(5.4, LEG * 0.5, 4.4, -2);
    ctx.closePath();
    H.paint(ctx, back ? C.giDark : C.gi, C.giLine, 1);
    roundRectPath(ctx, -3, LEG * 0.62, 6, LEG * 0.42, 2);
    H.paint(ctx, back ? C.blueDark : C.blue, C.blueLine, 1);
    ctx.translate(0, LEG + 1);
    ctx.rotate(-a);
    // la botte bleue avec sa petite bande
    ctx.beginPath();
    ctx.moveTo(-3.6, -2);
    ctx.lineTo(-3.8, 2.4);
    ctx.lineTo(5.6, 2.4);
    ctx.quadraticCurveTo(7.2, 2.2, 6.4, -0.4);
    ctx.quadraticCurveTo(4.6, -1.8, 3, -2);
    ctx.closePath();
    H.paint(ctx, back ? C.blueDark : C.blue, C.blueLine, 1);
    ctx.strokeStyle = back ? '#a0201c' : '#d8342a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3.4, -0.6);
    ctx.lineTo(3.4, -0.6);
    ctx.stroke();
    ctx.restore();
  }

  // Petite manche bleue, avant-bras, poignet bleu et poing.
  function arm(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2.1, 2, 4.2, ARM - 2, 2);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    roundRectPath(ctx, -2.6, ARM - 4.6, 5.2, 3.2, 1.2);
    H.paint(ctx, back ? C.blueDark : C.blue, C.blueLine, 0.9);
    circlePath(ctx, 0, ARM, 3.1);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    ctx.beginPath();
    ctx.moveTo(-3.8, 0.2);
    ctx.quadraticCurveTo(0, -3.8, 3.8, 0.2);
    ctx.lineTo(3.4, 4.4);
    ctx.quadraticCurveTo(0, 5.4, -3.4, 4.4);
    ctx.closePath();
    H.paint(ctx, back ? C.blueDark : C.blue, C.blueLine, 0.95);
    ctx.restore();
  }

  function torsoPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-7.6, -34);
    ctx.quadraticCurveTo(0.4, -36.4, 7.8, -34);
    ctx.quadraticCurveTo(10.4, -28.5, 9.4, -18);
    ctx.lineTo(-8.6, -18);
    ctx.quadraticCurveTo(-10.4, -28.5, -7.6, -34);
    ctx.closePath();
  }

  // Le kimono orange croisé sur le tee-shirt bleu, la ceinture bleue nouée.
  function body(ctx) {
    torsoPath(ctx);
    H.paint(ctx, C.gi, C.giLine, 1.05);
    ctx.save();
    ctx.clip();
    // le tee-shirt bleu qu'on voit dans le col
    ctx.beginPath();
    ctx.moveTo(-1.4, -37);
    ctx.lineTo(9.8, -37);
    ctx.lineTo(4.6, -27);
    ctx.closePath();
    H.paint(ctx, C.blue, C.blueLine, 0.9);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ellipsePath(ctx, -4, -28, 2.4, 4.6, 0.1);
    ctx.fill();
    ctx.restore();
    // le pan du kimono qui croise
    ctx.strokeStyle = C.giLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1.4, -35.6);
    ctx.lineTo(4.6, -27);
    ctx.lineTo(9.6, -35);
    ctx.stroke();
    // le petit écusson blanc
    circlePath(ctx, -3.4, -29.4, 2.6);
    H.paint(ctx, '#ffffff', C.giLine, 0.8);
    ctx.fillStyle = C.giDark;
    circlePath(ctx, -3.4, -29.4, 1);
    ctx.fill();
    // la ceinture et son noeud qui pend
    ctx.beginPath();
    ctx.moveTo(-9.4, -21.4);
    ctx.lineTo(9.8, -21.4);
    ctx.lineTo(9.6, -17.6);
    ctx.lineTo(-9.2, -17.6);
    ctx.closePath();
    H.paint(ctx, C.blue, C.blueLine, 1);
    ctx.beginPath();
    ctx.moveTo(-4.6, -18);
    ctx.lineTo(-7, -11.6);
    ctx.lineTo(-4.6, -11.8);
    ctx.lineTo(-3.2, -17.6);
    ctx.moveTo(-3.4, -18);
    ctx.lineTo(-1.8, -12.4);
    ctx.lineTo(0.4, -13.4);
    ctx.lineTo(-1.6, -17.8);
    H.paint(ctx, C.blueDark, C.blueLine, 0.9);
    // le haut du pantalon, sous la ceinture
    ctx.beginPath();
    ctx.moveTo(-9, -17.6);
    ctx.lineTo(9.6, -17.6);
    ctx.quadraticCurveTo(10.8, -14, 8.6, -12.2);
    ctx.quadraticCurveTo(0, -11, -7.6, -12);
    ctx.quadraticCurveTo(-10.6, -14, -9, -17.6);
    ctx.closePath();
    H.paint(ctx, C.gi, C.giLine, 1);
  }

  // Une grosse mèche de cheveux en pointes, autour de (cx, cy) : tips = [[angle, longueur], …].
  function spikes(ctx, cx, cy, r, tips) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const step = tips.length > 1 ? (tips[1][0] - tips[0][0]) / 2 : 0.3;
    ctx.lineTo(cx + Math.cos(tips[0][0] - step) * r, cy + Math.sin(tips[0][0] - step) * r);
    for (const [a, L] of tips) {
      ctx.quadraticCurveTo(cx + Math.cos(a - step * 0.4) * (r + L * 0.55), cy + Math.sin(a - step * 0.4) * (r + L * 0.55),
        cx + Math.cos(a) * (r + L), cy + Math.sin(a) * (r + L));
      ctx.quadraticCurveTo(cx + Math.cos(a + step * 0.6) * (r + L * 0.4), cy + Math.sin(a + step * 0.6) * (r + L * 0.4),
        cx + Math.cos(a + step) * r, cy + Math.sin(a + step) * r);
    }
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
  }

  // Les grandes pointes derrière la tête (elles bougent un peu quand il court ou saute).
  function backHair(ctx, o, hx, hy) {
    const t = o.t || 0;
    const air = o.pose === 'jump' || o.pose === 'fall' || o.pose === 'cloud';
    const w = Math.sin(t * 3) * 0.05 + (air ? 0.08 : 0);
    const tips = [[-0.5, 7], [-1.0, 11], [-1.5, 13], [-2.0, 14], [-2.5, 14], [-2.95, 12], [-3.4, 10], [-3.85, 6]];
    spikes(ctx, hx - 1, hy - 1, 12.5, tips.map(([a, L]) => [a - w * (a + 0.5), L]));
  }

  // La tête de trois-quarts : frange en pointes, gros sourcils, grand sourire.
  function headShape(ctx, o, hx, hy) {
    const t = o.t || 0;
    const pose = o.pose;
    backHair(ctx, o, hx, hy);
    circlePath(ctx, hx, hy, 13.6);
    H.paint(ctx, C.skin, C.skinLine, 1.05);
    // oreille
    ellipsePath(ctx, hx - 5, hy + 1.6, 2.5, 3.3);
    H.paint(ctx, C.skin, C.skinLine, 0.9);
    ctx.strokeStyle = C.skinLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(hx - 4.8, hy + 1.6, 1.2, -1.2, 1.6);
    ctx.stroke();
    // les cheveux sur le crâne : la frange retombe en pointes sur le front
    ctx.save();
    circlePath(ctx, hx, hy, 14.2);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(hx - 16, hy + 8);
    ctx.lineTo(hx - 9, hy + 8);
    ctx.quadraticCurveTo(hx - 8.4, hy + 2, hx - 7.4, hy - 1);
    ctx.lineTo(hx - 3, hy - 3.6);
    ctx.lineTo(hx - 0.6, hy - 9);
    ctx.lineTo(hx + 1.6, hy - 2.4);
    ctx.lineTo(hx + 4.6, hy - 8.6);
    ctx.lineTo(hx + 6.4, hy - 3.6);
    ctx.lineTo(hx + 9.4, hy - 8.4);
    ctx.lineTo(hx + 10.6, hy - 4);
    ctx.lineTo(hx + 13.6, hy - 7.6);
    ctx.lineTo(hx + 16, hy - 8);
    ctx.lineTo(hx + 16, hy - 20);
    ctx.lineTo(hx - 16, hy - 20);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    ctx.restore();
    // deux mèches qui dépassent sur le front
    ctx.beginPath();
    ctx.moveTo(hx + 3, hy - 10);
    ctx.quadraticCurveTo(hx + 7.4, hy - 9, hx + 8.4, hy - 2.6);
    ctx.quadraticCurveTo(hx + 6.2, hy - 6, hx + 2.2, hy - 7.4);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 0.9);
    ctx.beginPath();
    ctx.moveTo(hx + 8, hy - 10.4);
    ctx.quadraticCurveTo(hx + 13.2, hy - 9.2, hx + 15.4, hy - 4.4);
    ctx.quadraticCurveTo(hx + 12, hy - 7, hx + 7.6, hy - 7.8);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 0.9);
    ctx.strokeStyle = C.hairLight;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 7, hy - 10);
    ctx.quadraticCurveTo(hx - 2, hy - 14, hx + 4, hy - 13);
    ctx.stroke();
    // les yeux, noirs et brillants
    const eo = { iris: C.iris, line: C.eye, hurt: o.hurt, blink: H.blinking(t, 1.4), look: { x: 0.7, y: 0 } };
    H.eye(ctx, hx + 2.2, hy + 0.4, 2.9, 4, eo);
    H.eye(ctx, hx + 9.4, hy + 0.4, 3.2, 4.4, eo);
    // les gros sourcils courageux (froncés pendant le Kaméhaméha)
    const fierce = pose === 'kame' ? 1.2 : 0;
    ctx.strokeStyle = C.hair;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hx - 0.8, hy - 5.4 - fierce * 0.4);
    ctx.lineTo(hx + 4.4, hy - 4.6 + fierce * 0.6);
    ctx.moveTo(hx + 7, hy - 4.8 + fierce * 0.6);
    ctx.lineTo(hx + 12.4, hy - 6 - fierce * 0.4);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha *= 0.45;
    ctx.fillStyle = C.cheek;
    ellipsePath(ctx, hx - 0.6, hy + 5, 2.4, 1.5);
    ctx.fill();
    ellipsePath(ctx, hx + 12.2, hy + 4.8, 1.6, 1.5);
    ctx.fill();
    ctx.restore();
    // nez
    ctx.strokeStyle = C.skinLine;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(hx + 13, hy + 1.6);
    ctx.quadraticCurveTo(hx + 14.6, hy + 3.4, hx + 12.8, hy + 4);
    ctx.stroke();
    // la bouche : grand sourire, ou « HAAA ! » pendant le Kaméhaméha
    const mx = hx + 7.6;
    const my = hy + 8;
    if (o.hurt) {
      ellipsePath(ctx, mx, my, 2.2, 1.8);
      H.paint(ctx, '#7a1830', '#4e0c1c', 0.8);
    } else if (pose === 'kame') {
      ellipsePath(ctx, mx + 0.4, my + 0.6, 3.4, 3);
      H.paint(ctx, '#7a1830', '#4e0c1c', 0.85);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 2.4, my - 2.2, 5.6, 1.4);
    } else {
      const open = pose === 'win' || pose === 'jump' || pose === 'cloud';
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mx - 4.4, my - 1.2);
      ctx.quadraticCurveTo(mx, my + 0.4, mx + 4.6, my - 2.2);
      ctx.quadraticCurveTo(mx + 3.6, my + (open ? 5.4 : 3.2), mx, my + (open ? 5.6 : 3.2));
      ctx.quadraticCurveTo(mx - 3.6, my + (open ? 5 : 2.8), mx - 4.4, my - 1.2);
      ctx.closePath();
      H.paint(ctx, '#7a1830', '#4e0c1c', 0.85);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 5, my - 3, 10, 3.4);
      ctx.fillStyle = '#ff7f95';
      ellipsePath(ctx, mx, my + (open ? 5.2 : 3.4), 3, 1.8);
      ctx.fill();
      ctx.restore();
    }
  }

  // La boule d'énergie bleue entre ses mains (k : sa taille, de 0 à 1).
  function kameBall(ctx, x, y, r, t) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(127,216,255,0.85)');
    g.addColorStop(1, 'rgba(42,140,255,0)');
    ctx.fillStyle = g;
    circlePath(ctx, x, y, r * 1.8);
    ctx.fill();
    ctx.fillStyle = C.kameCore;
    circlePath(ctx, x, y, r * (0.55 + Math.sin(t * 40) * 0.06));
    ctx.fill();
  }

  // Le nuage magique jaune, tout gonflé, qui flotte sous ses pieds.
  function cloud(ctx, t) {
    const b = Math.sin(t * 6) * 1;
    ctx.save();
    ctx.translate(0, 2 + b);
    // petite traînée derrière
    ctx.fillStyle = 'rgba(255,230,120,0.55)';
    ellipsePath(ctx, -22, 3, 7, 3.4);
    ctx.fill();
    ellipsePath(ctx, -31, 4, 4, 2.2);
    ctx.fill();
    ctx.beginPath();
    for (const [x, y, r] of [[-12, 2, 6], [-5, -2, 7.4], [4, -2.4, 7.6], [12, 1, 6.2], [5, 4.4, 6.4], [-6, 4.6, 6.4]]) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, H.TAU);
    }
    const g = ctx.createLinearGradient(0, -10, 0, 10);
    g.addColorStop(0, C.cloudLight);
    g.addColorStop(0.5, C.cloud);
    g.addColorStop(1, C.cloudDark);
    // le contour d'abord, en épais : le remplissage cache les traits entre les bulles
    ctx.strokeStyle = C.cloudLine;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipsePath(ctx, -3, -5.4, 4, 1.8);
    ctx.fill();
    ctx.restore();
  }

  H.add('goku', {
    draw(ctx, o, R) {
      const pose = o.pose;
      let { legF, legB, armF, armB, bob, lean, crouch } = R;
      const onCloud = pose === 'cloud' || (o.pw && o.pw.cloud > 0);
      const kame = pose === 'kame';
      if (kame) {
        // les deux mains en avant, jambes bien écartées
        armF = -1.5;
        armB = -1.62;
        legF = -0.45;
        legB = 0.5;
        lean = 0.06;
        bob = 1;
      } else if (onCloud) {
        // debout sur son nuage, un peu penché vers l'avant, les bras pour l'équilibre
        legF = -0.25;
        legB = 0.3;
        armF = -0.9 + Math.sin((o.t || 0) * 5) * 0.08;
        armB = 1.1;
        lean = 0.12;
        bob = 0;
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
      arm(ctx, -1.8, -31, armB, true);
      ctx.restore();
      leg(ctx, -2.4, HIP + crouch, legB, true);
      leg(ctx, 1.6, HIP + crouch, legF, false);
      ctx.save();
      ctx.translate(0, crouch);
      body(ctx);
      headShape(ctx, o, HX, HY);
      if (o.holding) o.holding(ctx);
      arm(ctx, 1.2, -30.8, armF, false);
      if (kame) {
        const h = H.tip(1.2, -30.8, armF, ARM + 2);
        kameBall(ctx, h.x + 3, h.y, 4.4, o.t || 0);
      }
      ctx.restore();
      ctx.restore();
      if (onCloud) cloud(ctx, o.t || 0);
    },
    head(ctx) {
      headShape(ctx, { t: 1, pose: 'idle' }, -1.6, 3);
    },
  });
})();
