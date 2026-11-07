'use strict';

// ---------------- Gizmo (et le Gremlin) ----------------
// Gizmo : une toute petite boule de poils marron et crème, d'immenses oreilles,
// de grands yeux marron très doux. Pouvoir : sa petite voiture rose (pose 'car').
// S'il touche l'eau, il devient un Gremlin (o.pw.gremlin, ou pose 'gremlin' dans la galerie) :
// tout vert, de longues oreilles pointues, des yeux rouges, une crête blanche et un sourire farceur.
// Pouvoir du Gremlin : des petits Gremlins (pose 'summon').
(() => {
  const H = Heroes;
  const C = {
    fur: '#a8723e', furDark: '#7a4c24', furLight: '#c8925a', furLine: '#4a2a12',
    cream: '#f6e8cc', creamShade: '#e4d0ac',
    ear: '#f0b8a8', earLine: '#9a5a48',
    iris: '#4a2410', eye: '#24120a', nose: '#5a3020',
    car: '#ff7ab8', carDark: '#e0559a', carLight: '#ffc0dc', carLine: '#9a2e66',
  };
  const G = {
    skin: '#5fae3e', dark: '#3f7e28', light: '#8ad060', line: '#1e4a10',
    belly: '#cfdc8e', bellyShade: '#b0c070',
    ear: '#c88a7a', earLine: '#6a3a2a',
    iris: '#ff3a1e', white: '#fff8b0', eye: '#2a0a04',
    crest: '#ffffff', crestLine: '#8a9a8a',
  };

  // Une oreille de Gizmo ou du Gremlin : une grande feuille avec l'intérieur rose et des plis.
  // (x, y) : où elle s'attache, a : sa direction, len : sa longueur, wid : sa largeur.
  function ear(ctx, x, y, a, len, wid, col, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -wid * 0.45);
    ctx.quadraticCurveTo(len * 0.5, -wid * 0.75, len, -wid * 0.05);
    ctx.quadraticCurveTo(len * 0.55, wid * 0.85, 0, wid * 0.45);
    ctx.closePath();
    H.paint(ctx, back ? col.dark : col.skin, col.line, 1);
    ctx.beginPath();
    ctx.moveTo(len * 0.12, -wid * 0.22);
    ctx.quadraticCurveTo(len * 0.5, -wid * 0.45, len * 0.86, -wid * 0.04);
    ctx.quadraticCurveTo(len * 0.5, wid * 0.5, len * 0.12, wid * 0.22);
    ctx.closePath();
    H.paint(ctx, col.inner, col.innerLine, 0.7);
    // les plis
    ctx.strokeStyle = col.innerLine;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (const k of [0.32, 0.5, 0.68]) {
      ctx.moveTo(len * k, -wid * 0.32);
      ctx.quadraticCurveTo(len * (k + 0.06), 0, len * k, wid * 0.32);
    }
    ctx.stroke();
    ctx.restore();
  }

  const GIZ_EAR = { skin: C.fur, dark: C.furDark, line: C.furLine, inner: C.ear, innerLine: C.earLine };
  const GRE_EAR = { skin: G.skin, dark: G.dark, line: G.line, inner: G.ear, innerLine: G.earLine };

  // Une petite patte : une gélule et un pied à trois orteils.
  function leg(ctx, x, y, a, len, fill, foot, line) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2.6, -1, 5.2, len + 1, 2.6);
    H.paint(ctx, fill, line, 1);
    ctx.translate(0, len);
    ctx.rotate(-a);
    ctx.beginPath();
    ctx.ellipse(1.4, 0.2, 4, 2.2, 0, 0, H.TAU);
    H.paint(ctx, foot, line, 0.9);
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(2.6, -0.6);
    ctx.lineTo(3, 1.4);
    ctx.moveTo(4.2, -0.8);
    ctx.lineTo(4.6, 1);
    ctx.stroke();
    ctx.restore();
  }

  // Un petit bras, avec trois doigts (des griffes pour le Gremlin).
  function arm(ctx, x, y, a, len, fill, line, claws) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2, -1, 4, len + 1, 2);
    H.paint(ctx, fill, line, 0.95);
    circlePath(ctx, 0, len, 2.6);
    H.paint(ctx, fill, line, 0.9);
    if (claws) {
      ctx.fillStyle = '#f4f0d8';
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.5;
      for (const cx of [-1.6, 0, 1.6]) {
        ctx.beginPath();
        ctx.moveTo(cx - 0.7, len + 2);
        ctx.lineTo(cx, len + 4.4);
        ctx.lineTo(cx + 0.7, len + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- Gizmo ----------
  function gizmoHead(ctx, o, hx, hy) {
    const t = o.t || 0;
    const pose = o.pose;
    const flop = Math.sin(t * 3) * 0.05 + (pose === 'jump' || pose === 'car' ? -0.12 : pose === 'fall' ? 0.12 : 0);
    ear(ctx, hx - 7, hy - 3, Math.PI + 0.2 + flop, 15, 10, GIZ_EAR, true);
    // la tête toute ronde, et la touffe de poils sur le dessus
    circlePath(ctx, hx, hy, 11.5);
    H.paint(ctx, C.fur, C.furLine, 1.05);
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy - 10.4);
    ctx.lineTo(hx - 2.4, hy - 14.6);
    ctx.lineTo(hx - 0.4, hy - 11);
    ctx.lineTo(hx + 1.6, hy - 14);
    ctx.lineTo(hx + 3, hy - 10.6);
    ctx.closePath();
    H.paint(ctx, C.fur, C.furLine, 0.9);
    // le masque crème autour des yeux et du museau
    ctx.save();
    circlePath(ctx, hx, hy, 11.5);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(hx + 1, hy - 6);
    ctx.quadraticCurveTo(hx + 6, hy - 9.6, hx + 12, hy - 5);
    ctx.lineTo(hx + 13, hy + 12);
    ctx.lineTo(hx - 2, hy + 12);
    ctx.quadraticCurveTo(hx - 2.6, hy + 2, hx + 1, hy - 6);
    ctx.closePath();
    H.paint(ctx, C.cream, C.creamShade, 0.8);
    // la tache marron entre les yeux
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy - 10);
    ctx.quadraticCurveTo(hx + 7.4, hy - 4, hx + 6.4, hy + 0.4);
    ctx.quadraticCurveTo(hx + 5, hy - 4, hx + 3.6, hy - 10);
    ctx.closePath();
    ctx.fillStyle = C.fur;
    ctx.fill();
    ctx.restore();
    circlePath(ctx, hx, hy, 11.5);
    ctx.strokeStyle = C.furLine;
    ctx.lineWidth = 1.05;
    ctx.stroke();
    // les grands yeux doux
    const eo = { iris: C.iris, line: C.eye, hurt: o.hurt, blink: H.blinking(t, 0.7), look: { x: 0.5, y: 0.1 } };
    H.eye(ctx, hx + 2, hy - 1, 3.4, 4.2, eo);
    H.eye(ctx, hx + 9.2, hy - 1, 3.2, 4, eo);
    // museau, nez et petite bouche
    ellipsePath(ctx, hx + 8.4, hy + 5.4, 3.4, 2.4);
    H.paint(ctx, C.cream, C.creamShade, 0.7);
    ellipsePath(ctx, hx + 9.4, hy + 4, 1.6, 1.1);
    ctx.fillStyle = C.nose;
    ctx.fill();
    ctx.strokeStyle = C.furLine;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (o.hurt) {
      ctx.arc(hx + 8.6, hy + 8, 1.4, Math.PI + 0.3, -0.3);
    } else {
      const open = pose === 'win' || pose === 'jump' || pose === 'car';
      ctx.moveTo(hx + 6.2, hy + 6.4);
      ctx.quadraticCurveTo(hx + 8.4, hy + (open ? 9.4 : 8), hx + 10.6, hy + 6.2);
    }
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.fillStyle = '#ff8fa8';
    ellipsePath(ctx, hx + 1, hy + 4.4, 2, 1.3);
    ctx.fill();
    ctx.restore();
    // l'oreille de devant
    ear(ctx, hx + 9.6, hy - 6, -0.3 - flop, 14, 9.4, GIZ_EAR, false);
  }

  function gizmoBody(ctx) {
    ellipsePath(ctx, 0, -12, 9.6, 9.4);
    H.paint(ctx, C.fur, C.furLine, 1.05);
    ellipsePath(ctx, 3, -10.6, 5.6, 6.6);
    ctx.fillStyle = C.cream;
    ctx.fill();
    ctx.strokeStyle = C.furDark;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-6, -15);
    ctx.lineTo(-4.6, -13.6);
    ctx.moveTo(-6.6, -10);
    ctx.lineTo(-5, -9);
    ctx.stroke();
  }

  // La petite voiture rose décapotable (les roues tournent avec ph).
  function car(ctx, o) {
    const ph = (o.pw && o.pw.wheel) || o.ph || o.t * 12 || 0;
    // la carrosserie
    ctx.beginPath();
    ctx.moveTo(-21, -5);
    ctx.quadraticCurveTo(-22, -15, -15, -15);
    ctx.lineTo(-6, -15);
    ctx.quadraticCurveTo(-4, -11, 4, -11.4);
    ctx.lineTo(13, -12);
    ctx.quadraticCurveTo(22, -12, 23, -6);
    ctx.quadraticCurveTo(23.4, -2.6, 20, -2.6);
    ctx.lineTo(-18, -2.6);
    ctx.quadraticCurveTo(-21, -2.6, -21, -5);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -15, 0, -2);
    g.addColorStop(0, C.carLight);
    g.addColorStop(0.45, C.car);
    g.addColorStop(1, C.carDark);
    H.paint(ctx, g, C.carLine, 1.1);
    // le pare-brise
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.lineTo(7.6, -19);
    ctx.lineTo(9.4, -19.4);
    ctx.lineTo(12.6, -12);
    ctx.closePath();
    H.paint(ctx, 'rgba(200,240,255,0.75)', '#5a8aaa', 0.8);
    // phare, porte, petit coeur
    circlePath(ctx, 21, -7.4, 1.8);
    H.paint(ctx, '#fff6b0', C.carLine, 0.7);
    ctx.strokeStyle = C.carLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-3, -11);
    ctx.lineTo(-3, -4.6);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-11, -8);
    ctx.bezierCurveTo(-13.4, -10.6, -15.4, -7.4, -11, -5);
    ctx.bezierCurveTo(-6.6, -7.4, -8.6, -10.6, -11, -8);
    ctx.fill();
    // les roues
    for (const wx of [-12.6, 13.4]) {
      circlePath(ctx, wx, -4.8, 4.8);
      H.paint(ctx, '#3a3040', '#14101a', 1);
      circlePath(ctx, wx, -4.8, 2.2);
      H.paint(ctx, '#e8e8f0', '#6a6a7a', 0.7);
      ctx.strokeStyle = '#6a6a7a';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = ph + (i * H.TAU) / 3;
        ctx.moveTo(wx, -4.8);
        ctx.lineTo(wx + Math.cos(a) * 2.2, -4.8 + Math.sin(a) * 2.2);
      }
      ctx.stroke();
    }
  }

  function drawGizmo(ctx, o, R) {
    const pose = o.pose;
    let { legF, legB, armF, armB, bob } = R;
    const inCar = pose === 'car';
    if (pose === 'crouch') bob += 4;
    ctx.save();
    if (inCar) {
      // assis dans sa voiture, les mains sur le volant
      ctx.translate(-2, -9 + Math.sin((o.t || 0) * 30) * 0.4);
      armF = -1.2;
      armB = -1;
      gizmoBody(ctx);
      arm(ctx, -1, -15, armB, 6, C.furDark, C.furLine);
      gizmoHead(ctx, o, 2, -28);
      arm(ctx, 3, -15, armF, 6, C.fur, C.furLine);
      ctx.restore();
      car(ctx, o);
      return;
    }
    ctx.translate(0, bob);
    arm(ctx, -2, -16, armB * 0.8, 6.4, C.furDark, C.furLine);
    leg(ctx, -3, -6, legB * 0.7, 5, C.furDark, C.creamShade, C.furLine);
    leg(ctx, 2.4, -6, legF * 0.7, 5, C.fur, C.cream, C.furLine);
    gizmoBody(ctx);
    gizmoHead(ctx, o, 2, -30);
    if (o.holding) o.holding(ctx);
    arm(ctx, 2.4, -16, armF * 0.8, 6.4, C.fur, C.furLine);
    ctx.restore();
  }

  // ---------- Le Gremlin ----------
  function gremlinHead(ctx, o, hx, hy) {
    const t = o.t || 0;
    const pose = o.pose;
    const wig = Math.sin(t * 4) * 0.06;
    ear(ctx, hx - 6, hy - 4, Math.PI + 0.55 + wig, 19, 9, GRE_EAR, true);
    // la crête blanche en pointes
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy - 6);
    ctx.lineTo(hx - 11, hy - 12);
    ctx.lineTo(hx - 5.4, hy - 10.6);
    ctx.lineTo(hx - 6, hy - 16);
    ctx.lineTo(hx - 1, hy - 12);
    ctx.lineTo(hx + 0.4, hy - 17.4);
    ctx.lineTo(hx + 3.4, hy - 11);
    ctx.lineTo(hx + 6.6, hy - 14.6);
    ctx.lineTo(hx + 6.4, hy - 8);
    ctx.closePath();
    H.paint(ctx, G.crest, G.crestLine, 0.9);
    // la tête un peu en poire, vers l'avant
    ctx.beginPath();
    ctx.ellipse(hx + 1, hy, 11, 10.4, 0.1, 0, H.TAU);
    H.paint(ctx, G.skin, G.line, 1.05);
    // des petites taches plus foncées
    ctx.fillStyle = G.dark;
    for (const [sx, sy, r] of [[-5, -4, 1.4], [-7, 1, 1], [-3, -7, 0.9]]) {
      circlePath(ctx, hx + sx, hy + sy, r);
      ctx.fill();
    }
    // les yeux rouges de farceur, avec les sourcils froncés
    const eo = { iris: G.iris, line: G.eye, hurt: o.hurt, blink: H.blinking(t, 2.9), look: { x: 0.6, y: 0 } };
    ellipsePath(ctx, hx + 2.6, hy - 1.6, 3.4, 3.8);
    ctx.fillStyle = G.white;
    ctx.fill();
    ellipsePath(ctx, hx + 9.4, hy - 1.6, 3.2, 3.6);
    ctx.fill();
    H.eye(ctx, hx + 2.6, hy - 1.6, 3.1, 3.5, Object.assign({}, eo, { lw: 0.8 }));
    H.eye(ctx, hx + 9.4, hy - 1.6, 2.9, 3.3, Object.assign({}, eo, { lw: 0.8 }));
    ctx.strokeStyle = G.line;
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 1.2, hy - 7.4);
    ctx.lineTo(hx + 5, hy - 5.4);
    ctx.moveTo(hx + 7, hy - 5.4);
    ctx.lineTo(hx + 12.4, hy - 7.6);
    ctx.stroke();
    // le nez retroussé
    ctx.beginPath();
    ctx.ellipse(hx + 11.6, hy + 2.4, 2.4, 1.8, 0.3, 0, H.TAU);
    H.paint(ctx, G.light, G.line, 0.8);
    ctx.fillStyle = G.line;
    circlePath(ctx, hx + 12.4, hy + 2.8, 0.5);
    ctx.fill();
    // le grand sourire plein de petites dents pointues
    const mx = hx + 6.4;
    const my = hy + 6.4;
    if (o.hurt) {
      ellipsePath(ctx, mx, my, 2.4, 1.8);
      H.paint(ctx, '#5a0a10', G.line, 0.8);
    } else {
      const open = pose === 'summon' || pose === 'win' || pose === 'jump' ? 4.6 : 2.6;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mx - 6, my - 1.6);
      ctx.quadraticCurveTo(mx, my + 0.4, mx + 6, my - 2.4);
      ctx.quadraticCurveTo(mx + 3, my + open + 1, mx, my + open);
      ctx.quadraticCurveTo(mx - 3.4, my + open, mx - 6, my - 1.6);
      ctx.closePath();
      H.paint(ctx, '#5a0a10', G.line, 0.9);
      ctx.clip();
      ctx.fillStyle = '#fffbe8';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const x = mx - 5.4 + i * 2;
        const y = my - 1.4 - i * 0.12;
        ctx.moveTo(x, y - 1);
        ctx.lineTo(x + 1, y + 1.8);
        ctx.lineTo(x + 2, y - 1);
      }
      ctx.fill();
      ctx.restore();
    }
    ear(ctx, hx + 8, hy - 7, -0.65 - wig, 18, 8.6, GRE_EAR, false);
  }

  function gremlinBody(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, -17, 9, 11, 0.08, 0, H.TAU);
    H.paint(ctx, G.skin, G.line, 1.05);
    ctx.beginPath();
    ctx.ellipse(2.8, -15.4, 5.4, 7.6, 0.08, 0, H.TAU);
    ctx.fillStyle = G.belly;
    ctx.fill();
    ctx.strokeStyle = G.bellyShade;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const y of [-19, -15.6, -12.2]) {
      ctx.moveTo(-0.6, y);
      ctx.quadraticCurveTo(2.8, y + 1.2, 6.6, y);
    }
    ctx.stroke();
  }

  function drawGremlin(ctx, o, R) {
    const pose = o.pose;
    let { legF, legB, armF, armB, bob, lean } = R;
    if (pose === 'summon') {
      // les bras en l'air, il ricane
      armF = -2.5 + Math.sin((o.t || 0) * 18) * 0.2;
      armB = -2.3 - Math.sin((o.t || 0) * 18) * 0.2;
      legF = -0.25;
      legB = 0.25;
      lean = -0.06;
      bob = -Math.abs(Math.sin((o.t || 0) * 18)) * 1.5;
    }
    if (pose === 'crouch') bob += 4;
    ctx.save();
    ctx.translate(0, bob);
    ctx.rotate(lean * 0.8);
    arm(ctx, -2, -23, armB * 0.85, 8, G.dark, G.line, true);
    leg(ctx, -3, -8, legB * 0.75, 7, G.dark, G.dark, G.line);
    leg(ctx, 2.4, -8, legF * 0.75, 7, G.skin, G.skin, G.line);
    gremlinBody(ctx);
    gremlinHead(ctx, o, 2, -36);
    if (o.holding) o.holding(ctx);
    arm(ctx, 2.6, -23, armF * 0.85, 8, G.skin, G.line, true);
    ctx.restore();
  }

  const isGremlin = (o) => !!(o.gremlin || o.pose === 'gremlin' || o.pose === 'summon' || (o.pw && o.pw.gremlin));

  H.add('gizmo', {
    draw(ctx, o, R) {
      if (isGremlin(o)) {
        if (o.pose === 'gremlin') o = Object.assign({}, o, { pose: 'idle' });
        drawGremlin(ctx, o, R);
      } else {
        drawGizmo(ctx, o, R);
      }
    },
    head(ctx, o) {
      if (isGremlin(o)) gremlinHead(ctx, { t: 1, pose: 'idle' }, -2, 6);
      else gizmoHead(ctx, { t: 1, pose: 'idle' }, -3, 3);
    },
    hat(o) { return isGremlin(o) ? [2, -52] : [2, -43]; },
  });
})();
