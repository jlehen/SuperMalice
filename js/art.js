'use strict';

// Tous les personnages et objets sont dessinés avec des formes (pas d'images à charger).
const Art = (() => {
  const TAU = Math.PI * 2;

  // ---------------- Malice ----------------
  // Corps de profil (Malice regarde vers la droite), tête de trois-quarts comme Mario dans Wonder :
  // grosse tête ronde, deux grands yeux, nez rond, grosse moustache noire, casquette rose avec visière.
  const MALICE = {
    hat: '#ff4f9a', hatDark: '#d92f7a', hatLight: '#ff9fcd', hatLine: '#9a1a56',
    overall: '#ff74b4', overallDark: '#e2579c', overallLine: '#a52f6a',
    shirt: '#ffffff', shirtShade: '#e2e6f2', shirtLine: '#a3aac4',
    skin: '#ffdcc4', skinShade: '#f6c3a6', skinLine: '#c98868', cheek: '#ff8fa8',
    hair: '#ffd84a', hairDark: '#e5a91a', hairLight: '#fff2a6', hairLine: '#b67c0a',
    mustache: '#1c1717', shoe: '#7b3f23', shoeDark: '#5c2c15', shoeLight: '#ad6a40', shoeLine: '#36170a',
    button: '#ffe14d', iris: '#3b7de2', eye: '#14213d',
  };

  // Pendant l'étoile, la moustache de Malice clignote dans toutes les couleurs.
  function maliceRainbow(t) {
    return Object.assign({}, MALICE, { rainbow: t });
  }

  function paint(ctx, fill, line, lw) {
    ctx.fillStyle = fill;
    ctx.fill();
    if (line) {
      ctx.strokeStyle = line;
      ctx.lineWidth = lw || 1.1;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  function drawLeg(ctx, C, x, hipY, a, back, len) {
    ctx.save();
    ctx.translate(x, hipY);
    ctx.rotate(a);
    roundRectPath(ctx, -4.3, -2, 8.6, len + 2.5, 3.6);
    paint(ctx, back ? C.overallDark : C.overall, C.overallLine, 1.05);
    if (C.xray) bone(ctx, 0, 0.4, 0, len - 0.4, 2.3);
    ctx.translate(0, len + 1.5);
    ctx.rotate(-a);
    // chaussure au bout arrondi
    ctx.beginPath();
    ctx.moveTo(-4.6, 0.6);
    ctx.quadraticCurveTo(-4.6, -3.8, 0.4, -3.8);
    ctx.quadraticCurveTo(7.6, -3.6, 8.2, 1);
    ctx.quadraticCurveTo(8.2, 3.6, 4, 3.6);
    ctx.lineTo(-2.8, 3.6);
    ctx.quadraticCurveTo(-4.6, 3.6, -4.6, 0.6);
    ctx.closePath();
    paint(ctx, back ? C.shoeDark : C.shoe, C.shoeLine, 1.05);
    if (C.xray) {
      bone(ctx, -1.6, -0.2, 4.8, 0.4, 1.6);
    } else if (!back) {
      ctx.fillStyle = C.shoeLight;
      ellipsePath(ctx, 3.6, -1.6, 2.5, 1.1, -0.15);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawArm(ctx, C, sx, sy, a, back) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a);
    roundRectPath(ctx, -2.1, 2, 4.2, 8.8, 2.1);
    paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    circlePath(ctx, 0, 11, 3.1);
    paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    // manche courte bouffante
    ctx.beginPath();
    ctx.moveTo(-3.7, 0.2);
    ctx.quadraticCurveTo(0, -3.6, 3.7, 0.2);
    ctx.lineTo(3.4, 4.6);
    ctx.quadraticCurveTo(0, 6, -3.4, 4.6);
    ctx.closePath();
    paint(ctx, back ? C.shirtShade : C.shirt, C.shirtLine, 0.95);
    if (C.xray) {
      bone(ctx, 0, 0.6, 0, 8.6, 1.6);
      for (let i = -1; i <= 1; i++) {
        circlePath(ctx, i * 1.3, 12.2 - Math.abs(i) * 0.5, 0.75);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Le corps vu de côté : t-shirt, salopette avec la bavette devant et une bretelle sur l'épaule.
  function drawBody(ctx, C) {
    ctx.beginPath();
    ctx.moveTo(-7.2, -33.4);
    ctx.quadraticCurveTo(0.4, -35.6, 7.2, -33.4);
    ctx.quadraticCurveTo(9.6, -28.5, 8.8, -21);
    ctx.lineTo(-8, -21);
    ctx.quadraticCurveTo(-9.6, -28.5, -7.2, -33.4);
    ctx.closePath();
    paint(ctx, C.shirt, C.shirtLine, 1.05);
    // culotte de la salopette, arrondie derrière
    ctx.beginPath();
    ctx.moveTo(-8.4, -24.6);
    ctx.lineTo(8.9, -24.6);
    ctx.quadraticCurveTo(10.6, -19, 8.2, -13.2);
    ctx.quadraticCurveTo(0, -11.2, -7, -12.6);
    ctx.quadraticCurveTo(-11.8, -15, -10.2, -20.2);
    ctx.quadraticCurveTo(-9.8, -23.2, -8.4, -24.6);
    ctx.closePath();
    paint(ctx, C.overall, C.overallLine, 1.05);
    // bretelle : de la bavette, par-dessus l'épaule, jusque dans le dos
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(4.6, -29.6);
    ctx.quadraticCurveTo(-1, -35.8, -7, -31.2);
    ctx.lineTo(-7.8, -24.2);
    ctx.strokeStyle = C.overallLine;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = C.overall;
    ctx.lineWidth = 2.3;
    ctx.stroke();
    // bavette sur le ventre
    roundRectPath(ctx, 2, -30.9, 8.2, 8.6, 2.2);
    paint(ctx, C.overall, C.overallLine, 1);
    ctx.fillStyle = C.overall;
    ctx.fillRect(2.6, -25.3, 7, 2.6);
    ctx.fillStyle = C.button;
    circlePath(ctx, 5.4, -28.1, 1.5);
    ctx.fill();
    // poche sur le côté
    ctx.strokeStyle = C.overallLine;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-5.6, -21.6);
    ctx.quadraticCurveTo(-4.2, -17.2, 0, -17.8);
    ctx.stroke();
    if (C.xray) drawSkeleton(ctx);
  }

  // ---- Le squelette (quand Malice est électrocutée, on la voit comme à la radio) ----
  const BONE = '#ffffff';

  // Un os de dessin animé : un bâton avec deux boules à chaque bout.
  function bone(ctx, x1, y1, x2, y2, w) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const nx = -Math.sin(a) * w * 0.5;
    const ny = Math.cos(a) * w * 0.5;
    ctx.strokeStyle = BONE;
    ctx.fillStyle = BONE;
    ctx.lineWidth = w;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      for (const s of [-1, 1]) {
        circlePath(ctx, x + nx * s, y + ny * s, w * 0.62);
        ctx.fill();
      }
    }
  }

  function drawSkeleton(ctx) {
    ctx.fillStyle = BONE;
    // colonne vertébrale, dans le dos
    for (let i = 0; i < 6; i++) {
      roundRectPath(ctx, -6 - Math.sin(i * 0.6) * 0.8, -33.6 + i * 3.2, 3.2, 2.3, 0.9);
      ctx.fill();
    }
    // côtes
    ctx.strokeStyle = BONE;
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const y = -31.6 + i * 2.7;
      ctx.beginPath();
      ctx.moveTo(-4.4, y);
      ctx.quadraticCurveTo(1.5, y - 2.6, 6.8 - i * 0.5, y + 1.4);
      ctx.stroke();
    }
    // bassin
    ctx.beginPath();
    ctx.moveTo(-7.6, -19);
    ctx.quadraticCurveTo(-3, -21.4, 2.4, -18.6);
    ctx.quadraticCurveTo(1.6, -14.6, -1.6, -14.2);
    ctx.quadraticCurveTo(-5.6, -14, -7.6, -19);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2546b8';
    ellipsePath(ctx, -2.4, -17, 1.7, 1.2);
    ctx.fill();
  }

  // Le crâne vu de côté (la moustache reste dessus !).
  function drawSkullProfile(ctx, hx, hy) {
    ctx.beginPath();
    ctx.moveTo(hx - 9.6, hy + 4);
    ctx.bezierCurveTo(hx - 13.4, hy - 6, hx - 6, hy - 13.6, hx + 2, hy - 12.8);
    ctx.bezierCurveTo(hx + 9, hy - 12.4, hx + 13.2, hy - 7, hx + 12.8, hy - 2);
    ctx.quadraticCurveTo(hx + 15.4, hy + 1, hx + 14.6, hy + 5);
    ctx.lineTo(hx + 13.8, hy + 9);
    ctx.lineTo(hx + 13.4, hy + 13);
    ctx.quadraticCurveTo(hx + 12.8, hy + 16.6, hx + 8, hy + 16.2);
    ctx.quadraticCurveTo(hx + 3.6, hy + 15.8, hx + 2.6, hy + 11);
    ctx.quadraticCurveTo(hx + 1.8, hy + 7.6, hx - 1.6, hy + 7.4);
    ctx.quadraticCurveTo(hx - 6.6, hy + 7.6, hx - 9.6, hy + 4);
    ctx.closePath();
    paint(ctx, BONE, '#9fdcff', 1);
    // trou de l'oeil et du nez
    ctx.fillStyle = '#14205a';
    ellipsePath(ctx, hx + 7.4, hy - 1.2, 3.5, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 12.4, hy + 2.4);
    ctx.lineTo(hx + 13.8, hy + 6.4);
    ctx.lineTo(hx + 11.2, hy + 6);
    ctx.closePath();
    ctx.fill();
    // les dents dépassent sous la moustache
    ctx.strokeStyle = '#6fa6d8';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(hx + 4.6, hy + 13.2);
    ctx.lineTo(hx + 13.4, hy + 13.2);
    for (let x = hx + 5.6; x < hx + 13.4; x += 1.7) {
      ctx.moveTo(x, hy + 11.4);
      ctx.lineTo(x, hy + 15);
    }
    ctx.stroke();
  }

  function drawEyes(ctx, C, hx, hy, pose, t) {
    const ey = hy - 0.6;
    const eyes = [{ x: hx - 1, rx: 2.9, ry: 4.2, side: -1 }, { x: hx + 8.2, rx: 3.3, ry: 4.6, side: 1 }];
    const blink = (t % 3.7) < 0.12 && pose !== 'hurt';
    ctx.lineCap = 'round';
    eyes.forEach((e) => {
      ctx.strokeStyle = C.eye;
      if (pose === 'hurt') {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(e.x - e.rx * e.side, ey - 3);
        ctx.lineTo(e.x + e.rx * e.side * 0.8, ey);
        ctx.lineTo(e.x - e.rx * e.side, ey + 3);
        ctx.stroke();
        return;
      }
      if (blink) {
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(e.x - e.rx, ey);
        ctx.quadraticCurveTo(e.x, ey + 2, e.x + e.rx, ey);
        ctx.stroke();
        return;
      }
      ellipsePath(ctx, e.x, ey, e.rx, e.ry);
      paint(ctx, '#ffffff', C.eye, 0.9);
      ellipsePath(ctx, e.x + 0.7, ey + 0.5, e.rx * 0.74, e.ry * 0.74);
      ctx.fillStyle = C.iris;
      ctx.fill();
      ellipsePath(ctx, e.x + 0.9, ey + 0.7, e.rx * 0.42, e.ry * 0.46);
      ctx.fillStyle = C.eye;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, e.x + 1.7, ey - 1.5, e.rx * 0.33);
      ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(e.x + e.side * e.rx * 0.55, ey - e.ry * 0.82);
      ctx.lineTo(e.x + e.side * (e.rx + 1.7), ey - e.ry - 0.6);
      ctx.stroke();
    });
  }

  function drawMustache(ctx, C, mx, my, wig) {
    ctx.beginPath();
    ctx.moveTo(mx, my - 2.8);
    // côté proche (vers l'avant), un peu plus grand
    ctx.bezierCurveTo(mx + 4, my - 5, mx + 10, my - 4, mx + 12, my);
    ctx.bezierCurveTo(mx + 13, my + 2 + wig, mx + 15, my + 0.5 + wig, mx + 15, my - 2 + wig);
    ctx.bezierCurveTo(mx + 16.5, my + 3.6 + wig, mx + 12, my + 6, mx + 7, my + 4.6);
    ctx.bezierCurveTo(mx + 4, my + 3.8, mx + 1.5, my + 4.6, mx, my + 3.6);
    // côté éloigné
    ctx.bezierCurveTo(mx - 1.5, my + 4.6, mx - 4, my + 3.8, mx - 6.5, my + 4.4);
    ctx.bezierCurveTo(mx - 10.5, my + 5.6, mx - 14, my + 3, mx - 12.8, my - 1.6 - wig);
    ctx.bezierCurveTo(mx - 12.6, my + 0.6 - wig, mx - 11.4, my + 1.6, mx - 10.4, my);
    ctx.bezierCurveTo(mx - 8.6, my - 4, mx - 4, my - 5, mx, my - 2.8);
    ctx.closePath();
    fillMustache(ctx, C, mx - 13, mx + 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(mx - 8, my - 0.6);
    ctx.quadraticCurveTo(mx - 4, my - 2.4, mx - 1, my - 1.2);
    ctx.moveTo(mx + 2, my - 1.4);
    ctx.quadraticCurveTo(mx + 6, my - 2.6, mx + 10, my - 0.2);
    ctx.stroke();
  }

  // ---- Tête de trois-quarts (pendant que Malice se tourne, et dans le HUD) ----
  function drawHead3q(ctx, C, o) {
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const hx = 1;
    const hy = -43;
    const R = 14;
    drawPonytail(ctx, C, hx - 12, hy - 3, 0.35 + headSway(o) + (isFlying(pose) ? -0.55 : 0));
    // cheveux derrière la tête
    ellipsePath(ctx, hx - 2.4, hy + 1.2, R + 0.4, R - 0.4);
    paint(ctx, C.hair, C.hairLine, 1.05);
    // visage
    circlePath(ctx, hx, hy, R);
    paint(ctx, C.skin, C.skinLine, 1.05);
    // mèche devant l'oreille
    ctx.beginPath();
    ctx.moveTo(hx - 13.6, hy - 5);
    ctx.quadraticCurveTo(hx - 12.4, hy + 4, hx - 9.6, hy + 10);
    ctx.quadraticCurveTo(hx - 8, hy + 2, hx - 7.4, hy - 6);
    ctx.closePath();
    paint(ctx, C.hair, C.hairLine, 0.9);
    drawEyes(ctx, C, hx, hy, pose, t);
    // joues roses
    ctx.save();
    ctx.globalAlpha *= 0.5;
    ctx.fillStyle = C.cheek;
    ellipsePath(ctx, hx - 6, hy + 5.2, 2.6, 1.7);
    ctx.fill();
    ellipsePath(ctx, hx + 12.2, hy + 5.6, 2.2, 1.7);
    ctx.fill();
    ctx.restore();
    // bouche (on la voit sous la moustache quand Malice est contente ou surprise)
    if (pose === 'win' || pose === 'hurt' || pose === 'jump' || pose === 'hold') {
      ellipsePath(ctx, hx + 4.6, hy + 12.4, pose === 'hurt' ? 2.4 : 3.6, pose === 'hurt' ? 2.2 : 2.6);
      paint(ctx, '#a3263b', '#6e1424', 0.8);
      if (pose !== 'hurt') {
        ctx.fillStyle = '#ff7f95';
        ellipsePath(ctx, hx + 4.6, hy + 13.6, 2, 1);
        ctx.fill();
      }
    }
    const wig = pose === 'walk' || pose === 'run' ? Math.sin((o.ph || 0) * 2) * 0.7 : 0;
    drawMustache(ctx, C, hx + 4.6, hy + 8.4, wig);
    // nez rond
    circlePath(ctx, hx + 4.6, hy + 4.2, 4.2);
    paint(ctx, C.skin, C.skinLine, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    circlePath(ctx, hx + 3.4, hy + 2.8, 1.3);
    ctx.fill();
    // frange
    ctx.beginPath();
    ctx.moveTo(hx - 12.8, hy - 6);
    ctx.lineTo(hx + 13.2, hy - 6.8);
    ctx.quadraticCurveTo(hx + 13.8, hy - 3.4, hx + 12, hy - 2.8);
    const fr = [[10, -5], [7.6, -2.3], [4.6, -4.8], [1.6, -2], [-1.4, -4.8], [-4.4, -2.4], [-7.4, -4.8], [-10.4, -2.8]];
    let px = hx + 12;
    let py = hy - 2.8;
    fr.forEach(([dx, dy]) => {
      const nx = hx + dx;
      const ny = hy + dy;
      ctx.quadraticCurveTo((px + nx) / 2, Math.max(py, ny) + 0.8, nx, ny);
      px = nx;
      py = ny;
    });
    ctx.quadraticCurveTo(hx - 12.6, hy - 3, hx - 12.8, hy - 6);
    ctx.closePath();
    paint(ctx, C.hair, C.hairLine, 0.9);
    // casquette
    ctx.beginPath();
    ctx.moveTo(hx - 14.9, hy - 4.4);
    ctx.bezierCurveTo(hx - 15.4, hy - 22.5, hx + 13.2, hy - 24.5, hx + 15.3, hy - 7.2);
    ctx.quadraticCurveTo(hx + 1, hy - 9.8, hx - 14.9, hy - 4.4);
    ctx.closePath();
    const cg = ctx.createLinearGradient(0, hy - 24, 0, hy - 5);
    cg.addColorStop(0, C.hatLight);
    cg.addColorStop(0.45, C.hat);
    cg.addColorStop(1, C.hat);
    paint(ctx, cg, C.hatLine, 1.15);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipsePath(ctx, hx - 5.5, hy - 16.5, 4.6, 2.1, -0.5);
    ctx.fill();
    drawCapEmblem(ctx, C, hx + 3, hy - 14.2, 1);
    // visière
    ctx.beginPath();
    ctx.moveTo(hx + 1, hy - 8.6);
    ctx.quadraticCurveTo(hx + 16, hy - 12.2, hx + 24, hy - 6);
    ctx.quadraticCurveTo(hx + 17, hy - 3.2, hx + 2, hy - 5);
    ctx.closePath();
    paint(ctx, C.hatDark, C.hatLine, 1.05);
  }

  // Remplissage de la moustache (arc-en-ciel qui défile pendant l'étoile).
  function fillMustache(ctx, C, x0, x1) {
    if (C.rainbow != null) {
      const h = Math.floor(C.rainbow * 720) % 360;
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      for (let i = 0; i <= 4; i++) g.addColorStop(i / 4, `hsl(${(h + i * 70) % 360},95%,58%)`);
      ctx.save();
      ctx.shadowColor = `hsl(${(h + 140) % 360},100%,70%)`;
      ctx.shadowBlur = 10;
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    } else {
      ctx.fillStyle = C.mustache;
      ctx.fill();
    }
  }

  function drawPonytail(ctx, C, x, y, rot, frizz) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (frizz) {
      // cheveux tout ébouriffés (électrocutée, ou noircie par une explosion)
      ctx.beginPath();
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * TAU;
        const r = i % 2 ? 5.6 : 9 + (i % 4) * 0.7;
        ctx.lineTo(Math.sin(a) * r * 0.85, 10 - Math.cos(a) * r * 1.15);
      }
      ctx.closePath();
      paint(ctx, C.hair, C.hairLine, 1);
    } else {
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.bezierCurveTo(-10, 6, -7, 17, -2, 22);
      ctx.bezierCurveTo(0, 17, 6, 9, 4, 0);
      ctx.closePath();
      paint(ctx, C.hair, C.hairLine, 1);
      ctx.strokeStyle = C.hairDark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-0.5, 5);
      ctx.quadraticCurveTo(-3.5, 12, -1.8, 18);
      ctx.stroke();
    }
    circlePath(ctx, 0.5, 0, 3.2);
    paint(ctx, C.hat, C.hatLine, 0.9);
    ctx.restore();
  }

  function drawCapEmblem(ctx, C, x, y, sx) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, 1);
    circlePath(ctx, 0, 0, 5.3);
    paint(ctx, '#ffffff', C.hatLine, 0.9 / sx);
    ctx.strokeStyle = C.hatDark;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.6, 2.3);
    ctx.lineTo(-2.6, -2.2);
    ctx.lineTo(0, 0.6);
    ctx.lineTo(2.6, -2.2);
    ctx.lineTo(2.6, 2.3);
    ctx.stroke();
    ctx.restore();
  }

  function headSway(o) {
    const pose = o.pose || 'idle';
    return Math.sin((o.ph || 0) + (o.t || 0) * 2) * (pose === 'walk' || pose === 'run' ? 0.22 : 0.07);
  }

  function isFlying(pose) {
    return pose === 'jump' || pose === 'fall' || pose === 'hang' || pose === 'pound';
  }

  // ---- Tête de profil (Malice regarde vers la droite) ----
  // fx : ce qui change quand Malice a mal (yeux, bouche, bosse, cheveux), voir ouchFx.
  function drawHeadProfile(ctx, C, o, fx) {
    fx = fx || NO_FX;
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const hx = 1;
    const hy = -43;
    const R = 14;
    const xray = !!C.xray;
    let tail = 0.45 + headSway(o) + (isFlying(pose) ? -0.55 : 0);
    if (fx.hair === 'up') tail = 2.7 + rand(-0.2, 0.2);
    drawPonytail(ctx, C, hx - 11, hy - 4, tail, !!fx.hair);
    // cheveux à l'arrière du crâne
    ellipsePath(ctx, hx - 1.8, hy + 0.8, R + 0.4, R - 0.2);
    paint(ctx, C.hair, C.hairLine, 1.05);
    // visage
    circlePath(ctx, hx, hy, R);
    paint(ctx, C.skin, C.skinLine, 1.05);
    const mx = hx + 12.4;
    const my = hy + 8.4;
    if (xray) {
      drawSkullProfile(ctx, hx, hy);
    } else {
      // cheveux sur le côté de la tête (derrière l'oreille)
      ctx.save();
      circlePath(ctx, hx, hy, R);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(hx + 4, hy - 15);
      ctx.quadraticCurveTo(hx + 0.6, hy - 7, hx + 1.4, hy - 1.2);
      ctx.quadraticCurveTo(hx + 1.8, hy + 4, hx - 1, hy + 7.4);
      ctx.quadraticCurveTo(hx - 4.6, hy + 11, hx - 6.4, hy + 16);
      ctx.lineTo(hx - 20, hy + 16);
      ctx.lineTo(hx - 20, hy - 16);
      ctx.closePath();
      paint(ctx, C.hair, C.hairLine, 1);
      ctx.strokeStyle = C.hairDark;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(hx - 4, hy - 8);
      ctx.quadraticCurveTo(hx - 7.5, hy, hx - 8, hy + 8);
      ctx.moveTo(hx - 9, hy - 9);
      ctx.quadraticCurveTo(hx - 12, hy - 2, hx - 12.4, hy + 4);
      ctx.stroke();
      ctx.restore();
      circlePath(ctx, hx, hy, R);
      ctx.strokeStyle = C.hairLine;
      ctx.lineWidth = 1.05;
      ctx.stroke();
      // oreille
      ellipsePath(ctx, hx - 0.6, hy + 3, 2.6, 3.4);
      paint(ctx, C.skin, C.skinLine, 0.9);
      ctx.strokeStyle = C.skinLine;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(hx - 0.3, hy + 3, 1.3, -1.2, 1.6);
      ctx.stroke();
      // oeil (un seul, vu de côté)
      const hurt = pose === 'hurt' || pose === 'ouch';
      const eye = fx.eye || (hurt ? 'squeeze' : (t % 3.7) < 0.12 ? 'blink' : 'open');
      profileEye(ctx, C, hx + 8.4, hy - 0.6, eye, t);
      // joue rose
      ctx.save();
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = C.cheek;
      ellipsePath(ctx, hx + 6.6, hy + 5.8, 2.8, 1.8);
      ctx.fill();
      ctx.restore();
      // bouche ouverte (contente, surprise, ou qui a mal)
      const mouth = fx.mouth || (hurt ? 'small' : pose === 'win' || pose === 'jump' || pose === 'hold' ? 'open' : '');
      profileMouth(ctx, mx + 3.4, my + 5.6, mouth, t);
    }
    // moustache vue de côté : touffue devant, pointe relevée vers la joue
    const wig = pose === 'walk' || pose === 'run' ? Math.sin((o.ph || 0) * 2) * 0.7 : 0;
    ctx.beginPath();
    ctx.moveTo(mx + 5.4, my - 2.8);
    ctx.bezierCurveTo(mx + 9.8, my - 1.2, mx + 9.4, my + 4.4, mx + 5.2, my + 4.6);
    ctx.bezierCurveTo(mx + 2.2, my + 4.8, mx - 0.8, my + 3.6, mx - 3, my + 4.3);
    ctx.bezierCurveTo(mx - 6.6, my + 5.4, mx - 10.2, my + 3.8, mx - 11.4, my + 0.4 + wig);
    ctx.bezierCurveTo(mx - 12.8, my - 2.8 - wig, mx - 11, my - 5.8 - wig, mx - 8.4, my - 4.8 - wig);
    ctx.bezierCurveTo(mx - 9.8, my - 2.8, mx - 8.6, my - 0.8, mx - 6.6, my - 1.2);
    ctx.bezierCurveTo(mx - 3.6, my - 4, mx + 1, my - 4.4, mx + 5.4, my - 2.8);
    ctx.closePath();
    fillMustache(ctx, C, mx - 12, mx + 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(mx - 7, my + 0.4);
    ctx.quadraticCurveTo(mx - 2, my - 2, mx + 4, my - 0.8);
    ctx.stroke();
    const bumpK = fx.bump || 0;
    if (!xray) {
      // nez rond qui dépasse
      circlePath(ctx, hx + 14.2, hy + 3.6, 4.3);
      paint(ctx, C.skin, C.skinLine, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      circlePath(ctx, hx + 13.4, hy + 2.2, 1.3);
      ctx.fill();
      if (bumpK > 0) {
        // la casquette se soulève : on voit les cheveux… et une grosse bosse !
        ctx.save();
        circlePath(ctx, hx, hy, R);
        ctx.clip();
        ctx.fillStyle = C.hair;
        ctx.fillRect(hx - R, hy - R - 1, R * 2, R - 6.4);
        ctx.restore();
        ellipsePath(ctx, hx + 3, hy - 13.4 - 3 * bumpK, 6.4 * bumpK, 6 * bumpK);
        paint(ctx, '#ffb4a8', C.skinLine, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ellipsePath(ctx, hx + 1.2, hy - 15 - 4.4 * bumpK, 2 * bumpK, 1.3 * bumpK, -0.5);
        ctx.fill();
      }
      // frange sur le front
      ctx.beginPath();
      ctx.moveTo(hx + 1.6, hy - 8);
      ctx.lineTo(hx + 13.8, hy - 8.2);
      ctx.quadraticCurveTo(hx + 14.6, hy - 5, hx + 12.8, hy - 4.2);
      const fr = [[11.2, -6], [9.6, -3.8], [7.6, -6], [5.6, -4.2], [3.4, -6.4]];
      let px = hx + 12.8;
      let py = hy - 4.2;
      fr.forEach(([dx, dy]) => {
        ctx.quadraticCurveTo((px + hx + dx) / 2, Math.max(py, hy + dy) + 0.8, hx + dx, hy + dy);
        px = hx + dx;
        py = hy + dy;
      });
      ctx.closePath();
      paint(ctx, C.hair, C.hairLine, 0.9);
    }
    // casquette vue de côté
    ctx.save();
    if (bumpK > 0) {
      ctx.translate(hx - 13, hy - 4);
      ctx.rotate(-0.22 * bumpK);
      ctx.translate(-(hx - 13), -(hy - 4) - 9 * bumpK);
    }
    ctx.beginPath();
    ctx.moveTo(hx - 14.8, hy - 2.8);
    ctx.bezierCurveTo(hx - 16.4, hy - 21.5, hx + 10.6, hy - 25.6, hx + 14.8, hy - 8.4);
    ctx.quadraticCurveTo(hx + 0.4, hy - 9, hx - 14.8, hy - 2.8);
    ctx.closePath();
    const cg = ctx.createLinearGradient(0, hy - 24, 0, hy - 5);
    cg.addColorStop(0, C.hatLight);
    cg.addColorStop(0.45, C.hat);
    cg.addColorStop(1, C.hat);
    paint(ctx, cg, C.hatLine, 1.15);
    if (!xray) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ellipsePath(ctx, hx - 5, hy - 17, 4.6, 2.1, -0.45);
      ctx.fill();
      drawCapEmblem(ctx, C, hx + 6.2, hy - 13.6, 0.72);
    }
    // visière vers l'avant
    ctx.beginPath();
    ctx.moveTo(hx + 7, hy - 9.8);
    ctx.quadraticCurveTo(hx + 19, hy - 12.4, hx + 26.2, hy - 6.8);
    ctx.quadraticCurveTo(hx + 18, hy - 4.6, hx + 7, hy - 6.8);
    ctx.closePath();
    paint(ctx, C.hatDark, C.hatLine, 1.05);
    if (bumpK > 0) {
      // les épines sont restées plantées dans la casquette
      thorn(ctx, hx - 5, hy - 18.4, -1.95, 1);
      thorn(ctx, hx + 2.6, hy - 18.8, -1.35, 0.9);
    }
    ctx.restore();
  }

  // L'oeil de profil : ouvert, cligné, plissé de douleur, écarquillé, à moitié K.O. ou hypnotisé.
  function profileEye(ctx, C, ex, ey, style, t) {
    ctx.strokeStyle = C.eye;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (style === 'squeeze') {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex + 2.4, ey - 3);
      ctx.lineTo(ex - 1.8, ey);
      ctx.lineTo(ex + 2.4, ey + 3);
      ctx.stroke();
      return;
    }
    if (style === 'blink') {
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ex - 2.4, ey + 0.4);
      ctx.quadraticCurveTo(ex, ey + 2, ex + 2.4, ey + 0.4);
      ctx.stroke();
      return;
    }
    if (style === 'wide') {
      // grand oeil tout rond avec une toute petite pupille : elle a eu très peur
      ellipsePath(ctx, ex + 0.4, ey - 0.8, 3.5, 5.4);
      paint(ctx, '#ffffff', C.eye, 1);
      circlePath(ctx, ex + 1.5, ey - 0.6, 1.3);
      ctx.fillStyle = C.eye;
      ctx.fill();
      ctx.strokeStyle = '#6e4510';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ex - 2.6, ey - 8);
      ctx.quadraticCurveTo(ex + 0.4, ey - 10, ex + 3.2, ey - 8.4);
      ctx.stroke();
      return;
    }
    if (style === 'spiral') {
      // hypnotisée : une spirale qui tourne dans l'oeil
      circlePath(ctx, ex + 0.4, ey - 0.4, 4.4);
      paint(ctx, '#ffffff', C.eye, 1);
      ctx.save();
      ctx.translate(ex + 0.4, ey - 0.4);
      ctx.rotate(-t * 10);
      ctx.strokeStyle = '#8a2be2';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = i * 0.42;
        const r = 0.2 + i * 0.095;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }
    ellipsePath(ctx, ex, ey, 2.6, 4.5);
    paint(ctx, '#ffffff', C.eye, 0.9);
    const ko = style === 'ko';
    // K.O. : l'oeil regarde dans le vide, vers le bas
    const lx = ko ? 0.2 : 0.8;
    const ly = ko ? 1.6 : 0.5;
    ctx.save();
    ellipsePath(ctx, ex, ey, 2.6, 4.5);
    ctx.clip();
    ellipsePath(ctx, ex + lx, ey + ly, 1.9, 3.3);
    ctx.fillStyle = C.iris;
    ctx.fill();
    ellipsePath(ctx, ex + lx + 0.3, ey + ly + 0.2, 1.1, 1.9);
    ctx.fillStyle = C.eye;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circlePath(ctx, ex + lx + 0.5, ey + ly - 1.9, 0.85);
    ctx.fill();
    if (ko) {
      // paupière à moitié fermée
      ctx.fillStyle = C.skinShade;
      ctx.fillRect(ex - 4, ey - 6, 8, 5.4);
    }
    ctx.restore();
    ctx.lineWidth = 1.1;
    if (ko) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.8, ey - 0.9);
      ctx.quadraticCurveTo(ex, ey + 0.1, ex + 2.8, ey - 0.5);
      ctx.moveTo(ex - 2.3, ey - 0.6);
      ctx.lineTo(ex - 4.2, ey - 0.2);
      ctx.stroke();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(ex - 1.6, ey - 3.6);
    ctx.lineTo(ex - 3.6, ey - 5);
    ctx.moveTo(ex - 2.3, ey - 2);
    ctx.lineTo(ex - 4.4, ey - 2.8);
    ctx.stroke();
  }

  // La bouche de profil, juste sous la moustache (x, y : son centre).
  function profileMouth(ctx, x, y, style, t) {
    if (style === 'open') {
      ellipsePath(ctx, x, y, 2.8, 2.6);
      paint(ctx, '#a3263b', '#6e1424', 0.8);
      ctx.fillStyle = '#ff7f95';
      ellipsePath(ctx, x, y + 1.2, 1.6, 0.9);
      ctx.fill();
    } else if (style === 'small') {
      ellipsePath(ctx, x, y, 2, 2);
      paint(ctx, '#a3263b', '#6e1424', 0.8);
    } else if (style === 'o') {
      circlePath(ctx, x + 0.4, y + 0.6, 1.8);
      paint(ctx, '#7a1830', '#4e0c1c', 0.8);
    } else if (style === 'wide') {
      // grand cri : « Aïïïe ! »
      ellipsePath(ctx, x + 0.4, y + 1.6, 3.6, 4.8);
      paint(ctx, '#a3263b', '#6e1424', 0.9);
      ctx.fillStyle = '#ff7f95';
      ellipsePath(ctx, x + 0.4, y + 4.6, 2.4, 1.3);
      ctx.fill();
    } else if (style === 'tongue') {
      // K.O. : la langue pend sur le côté
      ellipsePath(ctx, x, y + 0.4, 2.4, 1.8);
      paint(ctx, '#a3263b', '#6e1424', 0.8);
      ctx.save();
      ctx.translate(x + 1.2, y + 1);
      ctx.rotate(-0.6 + Math.sin(t * 7) * 0.12);
      ctx.beginPath();
      ctx.moveTo(-2.2, 0);
      ctx.lineTo(2.2, 0);
      ctx.quadraticCurveTo(3.2, 6.4, 0, 7.2);
      ctx.quadraticCurveTo(-3.2, 6.4, -2.2, 0);
      ctx.closePath();
      paint(ctx, '#ff6f91', '#c23a5e', 0.8);
      ctx.beginPath();
      ctx.moveTo(0, 1.4);
      ctx.lineTo(0, 4.6);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---- Tête de face (quand Malice regarde le joueur) ----
  const bump = (x, a, d) => (x > a && x < a + d ? Math.sin((Math.PI * (x - a)) / d) : 0);

  function eyeFront(ctx, C, x, y, side, e) {
    const rx = 3.1;
    const ry = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = C.eye;
    if (e.wink) {
      // oeil plissé très fort, en pointe vers le nez
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x + side * 3.6, y - 3);
      ctx.quadraticCurveTo(x, y - 1.2, x - side * 2.8, y + 0.2);
      ctx.quadraticCurveTo(x, y + 0.8, x + side * 3.4, y + 2.8);
      ctx.stroke();
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x + side * 3.6, y - 3);
      ctx.lineTo(x + side * 5.4, y - 4.2);
      ctx.moveTo(x + side * 3.8, y - 1.4);
      ctx.lineTo(x + side * 5.8, y - 1.6);
      ctx.stroke();
      return;
    }
    if (e.blink) {
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - rx, y);
      ctx.quadraticCurveTo(x, y + 2, x + rx, y);
      ctx.stroke();
      return;
    }
    const s = e.big || 1;
    ellipsePath(ctx, x, y, rx * s, ry * s);
    paint(ctx, '#ffffff', C.eye, 0.9);
    ctx.save();
    ellipsePath(ctx, x, y, rx * s, ry * s);
    ctx.clip();
    const lx = x + (e.lookX || 0) * 1.2;
    const ly = y + 0.5 + (e.lookY || 0);
    ellipsePath(ctx, lx, ly, rx * 0.74, ry * 0.74);
    ctx.fillStyle = C.iris;
    ctx.fill();
    ellipsePath(ctx, lx, ly + 0.2, rx * 0.42, ry * 0.46);
    ctx.fillStyle = C.eye;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circlePath(ctx, lx + 0.9, ly - 1.8, rx * 0.33);
    ctx.fill();
    // paupière du haut (yeux mi-clos)
    if (e.lid) {
      const ly2 = y - ry * s + ry * s * 2 * e.lid;
      ctx.fillStyle = C.skinShade;
      ctx.fillRect(x - rx * 2, y - ry * 2, rx * 4, ly2 - (y - ry * 2));
      ctx.strokeStyle = C.eye;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - rx * s, ly2);
      ctx.quadraticCurveTo(x, ly2 + 0.8, x + rx * s, ly2);
      ctx.stroke();
    }
    // paupière du bas relevée par un grand sourire
    if (e.smile) {
      ctx.fillStyle = C.skin;
      ellipsePath(ctx, x, y + ry * s * 1.15, rx * 1.8, ry * 0.9 * e.smile);
      ctx.fill();
    }
    ctx.restore();
    ellipsePath(ctx, x, y, rx * s, ry * s);
    ctx.strokeStyle = C.eye;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    if (e.smile) {
      ctx.strokeStyle = C.skinLine;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(x, y + ry * s * 1.15, rx * 1.8, ry * 0.9 * e.smile, 0, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    // cils
    ctx.strokeStyle = C.eye;
    ctx.lineWidth = 1.1;
    const lt = e.lid ? y - ry * s + ry * s * 2 * e.lid : y - ry * s * 0.82;
    ctx.beginPath();
    ctx.moveTo(x + side * rx * s * 0.7, lt);
    ctx.lineTo(x + side * (rx * s + 1.9), lt - 1.3);
    if (e.lid) {
      ctx.moveTo(x + side * rx * s * 0.2, lt + 0.4);
      ctx.lineTo(x + side * (rx * s * 0.4 + 0.6), lt + 2.2);
      ctx.moveTo(x - side * rx * s * 0.3, lt + 0.5);
      ctx.lineTo(x - side * rx * s * 0.4, lt + 2.3);
    }
    ctx.stroke();
  }

  function browFront(ctx, C, x, y, side, raise, ang) {
    ctx.save();
    ctx.translate(x, y - raise);
    ctx.rotate(side * ang);
    ctx.strokeStyle = '#6e4510';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.3, 0.7);
    ctx.quadraticCurveTo(0, -1.5, 3.3, 0.7);
    ctx.stroke();
    ctx.restore();
  }

  function drawMustacheFront(ctx, C, mx, my, lift, tilt) {
    const L = lift || 0;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(tilt || 0);
    ctx.beginPath();
    ctx.moveTo(0, -2.8);
    ctx.bezierCurveTo(4, -5, 9.5, -4 - L * 0.4, 11.5, -L * 0.6);
    ctx.bezierCurveTo(12.5, 2 - L, 14.5, 0.5 - L, 14.5, -2 - L);
    ctx.bezierCurveTo(16, 3.6 - L, 11.5, 6 - L * 0.5, 6.5, 4.6 - L * 0.3);
    ctx.bezierCurveTo(3.5, 3.8, 1.5, 4.6, 0, 3.6);
    ctx.bezierCurveTo(-1.5, 4.6, -3.5, 3.8, -6.5, 4.6 - L * 0.3);
    ctx.bezierCurveTo(-11.5, 6 - L * 0.5, -16, 3.6 - L, -14.5, -2 - L);
    ctx.bezierCurveTo(-14.5, 0.5 - L, -12.5, 2 - L, -11.5, -L * 0.6);
    ctx.bezierCurveTo(-9.5, -4 - L * 0.4, -4, -5, 0, -2.8);
    ctx.closePath();
    fillMustache(ctx, C, -15, 15);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-9, -0.6);
    ctx.quadraticCurveTo(-5, -2.6, -1.2, -1.2);
    ctx.moveTo(1.2, -1.2);
    ctx.quadraticCurveTo(5, -2.6, 9, -0.6);
    ctx.stroke();
    ctx.restore();
  }

  function sparkle(ctx, x, y, r) {
    if (r <= 0.05) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255,240,140,0.55)';
    circlePath(ctx, 0, 0, r * 0.75);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.25, Math.sin(a + Math.PI / 4) * r * 0.25);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Durée de chaque mimique (secondes, demi-tours de tête compris).
  const MIMIC_DUR = { grin: 2.3, wink: 2.1, duck: 2.4 };
  const TURN = 0.2;

  function faceTurn(face) {
    if (!face) return 0;
    return clamp(Math.min(face.t, face.dur - face.t) / TURN, 0, 1);
  }

  function drawHeadFront(ctx, C, o, face) {
    const t = o.t || 0;
    const kind = face ? face.kind : '';
    const et = face ? face.t - TURN : 0;
    const on = face ? clamp(Math.min(et, face.dur - TURN * 2 - et) / 0.15, 0, 1) : 0;
    const hx = 1;
    const hy = -43;
    const R = 14;
    ctx.save();
    const tilt = (kind === 'wink' ? -0.12 : kind === 'duck' ? 0.09 + Math.sin(et * 3) * 0.02 : 0) * on;
    ctx.translate(hx, hy + 12);
    ctx.rotate(tilt);
    ctx.translate(-hx, -(hy + 12));
    drawPonytail(ctx, C, hx - 11.5, hy - 5, 0.5 + headSway(o));
    ellipsePath(ctx, hx, hy + 1.6, R + 1.6, R + 0.4);
    paint(ctx, C.hair, C.hairLine, 1.05);
    // visage
    circlePath(ctx, hx, hy, R);
    paint(ctx, C.skin, C.skinLine, 1.05);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(hx + side * 13.9, hy - 6);
      ctx.quadraticCurveTo(hx + side * 13.6, hy + 4, hx + side * 11.6, hy + 9.4);
      ctx.quadraticCurveTo(hx + side * 11, hy + 2, hx + side * 10.4, hy - 6);
      ctx.closePath();
      paint(ctx, C.hair, C.hairLine, 0.9);
    }
    // yeux
    const ey = hy - 0.2;
    const blink = !kind && (t % 3.7) < 0.12;
    const eyes = [{}, {}];
    let brows = [[0, 0], [0, 0]];
    if (kind === 'grin') {
      const r = (bump(et, 0.3, 0.32) + bump(et, 0.78, 0.32)) * 4.4;
      eyes[0] = eyes[1] = { smile: 0.45 * on, big: 1 + 0.08 * r / 4.4 };
      brows = [[r, -0.1], [r, -0.1]];
    } else if (kind === 'wink') {
      const w = on > 0.5 && et > 0.15;
      eyes[0] = { big: 1 + 0.12 * on, lookX: 0.3 };
      eyes[1] = w ? { wink: true } : {};
      brows = [[4.2 * on, -0.3 * on], [-1.2 * on, 0.35 * on]];
    } else if (kind === 'duck') {
      eyes[0] = eyes[1] = { lid: 0.56 * on, lookX: 0.6 * Math.sin(et * 1.6) };
      brows = [[1.4 * on, 0.2 * on], [1.4 * on, 0.2 * on]];
    }
    if (blink) eyes[0] = eyes[1] = { blink: true };
    eyeFront(ctx, C, hx - 5.4, ey, -1, eyes[0]);
    eyeFront(ctx, C, hx + 5.4, ey, 1, eyes[1]);
    // joues
    ctx.save();
    ctx.globalAlpha *= kind === 'grin' ? 0.5 + 0.25 * on : 0.5;
    ctx.fillStyle = C.cheek;
    for (const side of [-1, 1]) {
      ellipsePath(ctx, hx + side * 8.6, hy + 5.4 - (kind === 'grin' ? on : 0), 2.8, 1.8);
      ctx.fill();
    }
    ctx.restore();
    let my = hy + 8.4;
    let lift = 0;
    let mtilt = 0;
    if (kind === 'grin') {
      // grand sourire à pleines dents (la moustache remonte)
      my -= 2.6 * on;
      lift = 2.4 * on;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hx - 9, hy + 8.2);
      ctx.quadraticCurveTo(hx, hy + 9.6, hx + 9, hy + 8.2);
      ctx.quadraticCurveTo(hx + 8, hy + 8.2 + 7.2 * on, hx, hy + 8.2 + 7.6 * on);
      ctx.quadraticCurveTo(hx - 8, hy + 8.2 + 7.2 * on, hx - 9, hy + 8.2);
      ctx.closePath();
      paint(ctx, '#7a1830', '#4e0c1c', 0.9);
      ctx.clip();
      ctx.fillStyle = '#ff7f95';
      ellipsePath(ctx, hx, hy + 15.6, 5.4, 2.8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - 10, hy + 7, 20, 4.6);
      ctx.fillRect(hx - 10, hy + 14 * on + 0.2, 20, 3);
      ctx.strokeStyle = '#d9d2e4';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = -3; i <= 3; i++) {
        ctx.moveTo(hx + i * 2.6, hy + 9.6);
        ctx.lineTo(hx + i * 2.6, hy + 11.6);
      }
      ctx.stroke();
      ctx.restore();
    } else if (kind === 'wink') {
      // sourire en coin de faux beau gosse
      my -= 0.8 * on;
      mtilt = -0.2 * on;
      lift = 0.8 * on;
      ctx.beginPath();
      ctx.moveTo(hx - 1.4, hy + 12.4);
      ctx.quadraticCurveTo(hx + 4.6, hy + 15.6, hx + 10, hy + 9.8);
      ctx.quadraticCurveTo(hx + 4.6, hy + 12.8, hx - 1.4, hy + 12.4);
      ctx.closePath();
      paint(ctx, '#ffffff', '#4e0c1c', 0.9);
    } else if (kind === 'duck') {
      // bouche en cul de canard
      my -= 2.6 * on;
      lift = -0.6 * on;
      const p = 1 + Math.sin(et * 5) * 0.05;
      ctx.save();
      ctx.translate(hx, hy + 12);
      ctx.scale(1.15 * p * on, 1.15 * p * on);
      ellipsePath(ctx, 0, -1.4, 4.8, 2.6);
      paint(ctx, '#ff6f9a', '#a8285a', 0.9);
      ellipsePath(ctx, 0, 1.6, 4.2, 2.6);
      paint(ctx, '#ff6f9a', '#a8285a', 0.9);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ellipsePath(ctx, -1.6, 1.0, 1.4, 0.7);
      ctx.fill();
      ctx.strokeStyle = '#a8285a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-3.6, 0.2);
      ctx.quadraticCurveTo(0, 0.8, 3.6, 0.2);
      ctx.stroke();
      ctx.restore();
      // joues aspirées
      ctx.strokeStyle = C.skinLine;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        ctx.moveTo(hx + side * 9.8, hy + 4.4);
        ctx.quadraticCurveTo(hx + side * 7.8 * (2 - on), hy + 7.6, hx + side * 9.6, hy + 10.6);
      }
      ctx.stroke();
    }
    drawMustacheFront(ctx, C, hx, my, lift, mtilt);
    // nez
    circlePath(ctx, hx, hy + 4.2, 4.2);
    paint(ctx, C.skin, C.skinLine, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    circlePath(ctx, hx - 1.2, hy + 2.8, 1.3);
    ctx.fill();
    // frange
    ctx.beginPath();
    ctx.moveTo(hx - 13.4, hy - 8.2);
    ctx.lineTo(hx + 13.4, hy - 8.2);
    ctx.quadraticCurveTo(hx + 13.9, hy - 4.6, hx + 12, hy - 3.8);
    const fr = [[9.6, -5.8], [7.2, -3.6], [4.8, -5.8], [2.4, -3.4], [0, -5.8], [-2.4, -3.4], [-4.8, -5.8], [-7.2, -3.6], [-9.6, -5.8], [-12, -3.8]];
    let px = hx + 12;
    let py = hy - 3.8;
    fr.forEach(([dx, dy]) => {
      ctx.quadraticCurveTo((px + hx + dx) / 2, Math.max(py, hy + dy) + 0.8, hx + dx, hy + dy);
      px = hx + dx;
      py = hy + dy;
    });
    ctx.quadraticCurveTo(hx - 13.9, hy - 4.6, hx - 13.4, hy - 8.2);
    ctx.closePath();
    paint(ctx, C.hair, C.hairLine, 0.9);
    // casquette vue de face
    ctx.beginPath();
    ctx.moveTo(hx - 15, hy - 7.2);
    ctx.bezierCurveTo(hx - 16.5, hy - 28, hx + 16.5, hy - 28, hx + 15, hy - 7.2);
    ctx.quadraticCurveTo(hx, hy - 11.6, hx - 15, hy - 7.2);
    ctx.closePath();
    const cg = ctx.createLinearGradient(0, hy - 26.5, 0, hy - 7.5);
    cg.addColorStop(0, C.hatLight);
    cg.addColorStop(0.45, C.hat);
    cg.addColorStop(1, C.hat);
    paint(ctx, cg, C.hatLine, 1.15);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipsePath(ctx, hx - 7.5, hy - 19, 4.2, 2, -0.6);
    ctx.fill();
    drawCapEmblem(ctx, C, hx, hy - 17.2, 1);
    // visière (vue de face : une bande arrondie)
    ctx.beginPath();
    ctx.moveTo(hx - 16, hy - 7.8);
    ctx.quadraticCurveTo(hx, hy - 12.2, hx + 16, hy - 7.8);
    ctx.quadraticCurveTo(hx + 17.4, hy - 5.8, hx + 14.6, hy - 5.4);
    ctx.quadraticCurveTo(hx, hy - 8.6, hx - 14.6, hy - 5.4);
    ctx.quadraticCurveTo(hx - 17.4, hy - 5.8, hx - 16, hy - 7.8);
    ctx.closePath();
    paint(ctx, C.hatDark, C.hatLine, 1.05);
    // sourcils (par-dessus la frange, comme dans les dessins animés)
    if (kind) {
      browFront(ctx, C, hx - 5.4, hy - 5.6, -1, brows[0][0], brows[0][1]);
      browFront(ctx, C, hx + 5.4, hy - 5.6, 1, brows[1][0], brows[1][1]);
    }
    if (kind === 'wink') {
      const s = bump(et, 0.35, 0.5) * 4.2;
      sparkle(ctx, hx + 10.6, hy + 11.2, s);
      sparkle(ctx, hx + 9.6, hy - 1.6, bump(et, 0.25, 0.35) * 2.6);
    }
    ctx.restore();
  }

  // Tête : de profil, en train de se tourner (trois-quarts) ou de face pour une mimique.
  function drawHead(ctx, C, o, fx) {
    const k = faceTurn(o.face);
    const view = o.view || (k > 0.7 ? 'front' : k > 0.3 ? '3q' : 'profile');
    if (view === 'front') drawHeadFront(ctx, C, o, o.face);
    else if (view === '3q') drawHead3q(ctx, C, o);
    else drawHeadProfile(ctx, C, o, fx);
  }

  // ---------------- Quand Malice a mal ----------------
  // o.ouch = { kind, t, dur, seed, shock } : ce qui vient de toucher Malice (voir OUCH dans entities.js).
  //   butt : les ronces piquent les fesses          head : les ronces qui pendent font une bosse
  //   zap : électrocutée par un éclair               ko : sonnée par un boulet de coccinelle
  //   hypno : hypnotisée par un gros oeil            scramble : couleurs mélangées par un Rubik's cube
  //   soot : noircie par les morceaux de cube        spots : couverte des points de la coccinelle
  //   wet : tombée dans la rivière, elle grelotte     slime : couverte de bave d'escargot
  //   dirt : projetée en l'air par une taupe, toute pleine de terre (avec un ver de terre sur la tête)
  //   pins : piquée par un hérisson, couverte de piquants comme une pelote d'épingles
  //   croak : une grenouille sauteuse lui est tombée dessus : toute verte, elle coasse deux fois (« Croa ! »)
  const NO_FX = {};
  // Moments où Malice noircie tousse.
  const COUGHS = [0.35, 0.8, 1.25];
  // Rubik's cube : les couleurs tournent, puis chaque partie revient à sa place (clic !) :
  // casquette, salopette, t-shirt, cheveux, chaussures, peau.
  const SCRAMBLE_SPIN = 0.45;
  const SCRAMBLE_BACK = [0.6, 0.72, 0.84, 0.96, 1.08, 1.2];
  const PARTS = [
    ['hat', 'hatDark', 'hatLight', 'hatLine'], ['overall', 'overallDark', '', 'overallLine'],
    ['shirt', 'shirtShade', '', 'shirtLine'], ['hair', 'hairDark', 'hairLight', 'hairLine'],
    ['shoe', 'shoeDark', 'shoeLight', 'shoeLine'], ['skin', 'skinShade', 'cheek', 'skinLine'],
  ];
  // Les 7 points de la coccinelle collés sur Malice (x, y, rayon), dans l'ordre où ils sautent :
  // le dernier est sur le nez.
  const MALICE_SPOTS = [[-6.6, -17.6, 2.8], [-3, -58, 3], [6.6, -24.6, 2.5], [-8, -40, 2.8], [-6.5, -27, 2.3], [5.2, -40.4, 2.1], [16, -40.6, 1.9]];
  const spotPop = (i) => 1 + i * 0.18;
  // Les piquants du hérisson plantés dans Malice, dans l'ordre où elle les enlève (le dernier sur les fesses) :
  // [x, hauteur (une part du haut de la tête), sens de la pointe, sur la tête]. Pour les autres personnages,
  // la hauteur suit leur taille, et ceux de la tête suivent leur tête (voir Heroes.headTop).
  const PINS = [[7, 0.55, -0.15, 0], [-5, 1, -1.85, 1], [-13, 0.78, -2.7, 1], [10, 0.93, -1.05, 1],
    [-12, 0.6, 3.05, 0], [5, 0.34, 0.35, 0], [-10, 0.27, 2.6, 0]];
  // La grenouille : les deux moments où Malice coasse (« Croa ! »), et pendant chacun, un petit moment où elle est
  // accroupie comme une grenouille, la gorge qui se gonfle.
  const CROAKS = [0.45, 1.05];
  const croakAt = (k) => CROAKS.findIndex((c) => k.t > c - 0.1 && k.t < c + 0.32);
  const croaking = (k) => croakAt(k) >= 0;
  // la gorge : de 0 à 1, puis 0
  function croakSac(k) {
    const i = croakAt(k);
    return i < 0 ? 0 : Math.sin(clamp((k.t - CROAKS[i] + 0.1) / 0.42, 0, 1) * Math.PI);
  }
  // Le petit nuage grognon : trempée (les mains sur la tête), puis, de t0 à t1, elle s'ébroue comme un chien (tout son
  // corps se tortille de gauche à droite, n fois par seconde, et les gouttes volent : voir Player.updateOuch).
  const SHAKE = { t0: 0.45, t1: 1.2, n: 7, a: 0.2 };
  const shaking = (k) => k.t > SHAKE.t0 && k.t < SHAKE.t1;
  // de combien tout son corps est penché pendant qu'elle s'ébroue (radians)
  function shakeTilt(k) {
    if (!shaking(k)) return 0;
    const u = (k.t - SHAKE.t0) / (SHAKE.t1 - SHAKE.t0);
    return Math.sin(u * (SHAKE.t1 - SHAKE.t0) * SHAKE.n * TAU) * SHAKE.a * Math.sin(u * Math.PI);
  }
  // Le hérisson de roche : roulée dans une boule de cailloux (jusqu'à ball secondes : on la voit toute petite qui tourne
  // dedans), elle en ressort aplatie comme une crêpe (sx fois plus large, sy fois moins haute, jusqu'à flat), puis elle
  // se regonfle d'un coup : « Pop ! » (pendant pop secondes, elle dépasse un peu, puis reprend sa forme).
  const CREPE = { ball: 0.5, flat: 1.1, pop: 0.3, sx: 1.6, sy: 0.24 };
  // Comment la dessiner : ball (de 1, dans la boule, à 0), a (de combien la boule a tourné), sx / sy (aplatie)
  function crepeShape(k) {
    const t = k.t;
    const C = CREPE;
    if (t < C.ball) return { ball: 1, a: t * 15, sx: 1, sy: 1 };
    if (t < C.flat) {
      // aplatie : d'un coup, puis elle tremblote un peu
      const u = clamp((t - C.ball) / 0.08, 0, 1);
      const w = Math.sin((t - C.ball) * 30) * 0.06 * clamp(1 - (t - C.ball) / 0.4, 0, 1);
      return { ball: 0, a: 0, sx: lerp(1, C.sx, u) + w, sy: lerp(0.5, C.sy, u) - w * 0.3 };
    }
    if (t < C.flat + C.pop) {
      // pop ! elle se regonfle (un peu trop), puis reprend sa forme
      const u = (t - C.flat) / C.pop;
      const s = u < 0.35 ? lerp(C.sy, 1.18, u / 0.35) : 1 + 0.18 * Math.cos(((u - 0.35) / 0.65) * Math.PI * 1.5) * (1 - u);
      return { ball: 0, a: 0, sx: u < 0.35 ? lerp(C.sx, 0.88, u / 0.35) : 2 - s, sy: s };
    }
    return null;
  }
  // les moments où elle enlève chaque piquant (aïe !)
  const PIN_PULLS = PINS.map((_, i) => 0.55 + i * 0.24);
  // head : [x, y] du haut de la tête (Malice : [0, -62])
  function pinAt(i, head) {
    const [x, k, , onHead] = PINS[i];
    const [hx, top] = head || [0, -62];
    return [x + (onHead ? hx : 0), k * top];
  }
  // elle fait la grimace pendant qu'elle tire sur un piquant
  const pinsWince = (k) => PIN_PULLS.some((p) => k.t > p - 0.1 && k.t < p + 0.12);
  // Le bras qui va chercher le piquant (l'angle du bras avant, comme dans drawArm), ou null.
  // (épaule de Malice : (1.2, -27.8) ; pour les autres personnages, c'est à peu près au même endroit)
  function pinsReach(k, head) {
    const i = PIN_PULLS.findIndex((p) => k.t > p - 0.14 && k.t < p + 0.03);
    if (i < 0) return null;
    const [x, y] = pinAt(i, head);
    return Math.atan2(-(x - 1.2), y + 27.8);
  }

  function hexRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }

  function mixColor(a, b, k) {
    const A = hexRgb(a);
    const B = hexRgb(b);
    const c = A.map((v, i) => Math.round(lerp(v, B[i], k)));
    return '#' + ((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1);
  }

  // k < 0 : plus foncé, k > 0 : plus clair.
  const shade = (hex, k) => mixColor(hex, k < 0 ? '#000000' : '#ffffff', Math.abs(k));

  function mixPalette(A, B, k) {
    if (k <= 0) return A;
    const P = Object.assign({}, A);
    for (const key in B) {
      if (typeof A[key] === 'string' && A[key][0] === '#') P[key] = mixColor(A[key], B[key], k);
    }
    return P;
  }

  // À la radio : tout en bleu, sauf les os (et la moustache, qui reste noire).
  const XRAY = { xray: true };
  for (const key in MALICE) XRAY[key] = /Line$/.test(key) ? '#a8ecff' : /(Dark|Shade)$/.test(key) ? '#2b4fc4' : '#3a63da';
  XRAY.mustache = '#0e0e1c';

  // Toute mouillée : tout un peu bleu, les cheveux plus foncés.
  const WET = {};
  for (const key in MALICE) WET[key] = mixColor(MALICE[key], '#2a6ad0', /^hair/.test(key) ? 0.4 : 0.22);
  WET.mustache = MALICE.mustache;
  WET.eye = MALICE.eye;

  // Toute gluante de bave verte.
  const SLIMY = {};
  for (const key in MALICE) SLIMY[key] = mixColor(MALICE[key], '#8ee05a', 0.35);
  SLIMY.mustache = MALICE.mustache;
  SLIMY.eye = MALICE.eye;

  // Toute verte (la grenouille).
  const FROGGY = {};
  for (const key in MALICE) FROGGY[key] = mixColor(MALICE[key], '#4cd040', /^hair/.test(key) ? 0.55 : 0.62);
  FROGGY.mustache = MALICE.mustache;
  FROGGY.eye = MALICE.eye;

  // Toute pleine de terre.
  const DIRTY = {};
  for (const key in MALICE) DIRTY[key] = mixColor(MALICE[key], '#7a5232', 0.38);
  DIRTY.mustache = MALICE.mustache;
  DIRTY.eye = MALICE.eye;

  // Toute rouge d'avoir été piquée (par le hérisson).
  const PRICKED = {};
  for (const key in MALICE) PRICKED[key] = mixColor(MALICE[key], '#ff5a6a', 0.3);
  PRICKED.mustache = MALICE.mustache;
  PRICKED.eye = MALICE.eye;

  // Toute poussiéreuse (roulée dans les cailloux).
  const DUSTY = {};
  for (const key in MALICE) DUSTY[key] = mixColor(MALICE[key], '#9a8a84', 0.4);
  DUSTY.mustache = MALICE.mustache;
  DUSTY.eye = MALICE.eye;
  // pleine de neige (le toboggan du pingouin grincheux)
  const SNOWY = {};
  for (const key in MALICE) SNOWY[key] = mixColor(MALICE[key], '#eaf6ff', 0.45);
  SNOWY.mustache = MALICE.mustache;
  SNOWY.eye = MALICE.eye;

  // Toute noire de suie (seuls les yeux restent blancs).
  const SOOT = {};
  for (const key in MALICE) SOOT[key] = mixColor(MALICE[key], '#2a2422', 0.8);
  SOOT.mustache = MALICE.mustache;
  SOOT.eye = MALICE.eye;

  function scramblePalette(C, k) {
    const P = Object.assign({}, C);
    const turn = Math.floor(Math.min(k.t, SCRAMBLE_SPIN) / 0.08);
    PARTS.forEach(([main, dark, light, line], i) => {
      if (k.t >= SCRAMBLE_BACK[i]) return;
      const col = CUBE_COLORS[Math.floor(hash(k.seed + turn * 13.7 + i * 5.3) * CUBE_COLORS.length)];
      P[main] = col;
      P[dark] = shade(col, -0.15);
      if (light) P[light] = shade(col, 0.4);
      P[line] = shade(col, -0.5);
    });
    return P;
  }

  function ouchPalette(C, k) {
    // pas pendant l'étoile ni dans la lave : ces couleurs-là sont plus importantes
    if (!k || C !== MALICE) return C;
    const left = k.dur - k.t;
    switch (k.kind) {
      case 'soot': return mixPalette(C, SOOT, 0.85 * clamp(left / 0.6, 0, 1));
      // après l'électrocution, Malice est un peu grillée
      case 'zap': return k.shock ? C : mixPalette(C, SOOT, 0.45 * clamp(left / 0.5, 0, 1));
      case 'scramble': return scramblePalette(C, k);
      case 'wet': return mixPalette(C, WET, clamp(left / 0.5, 0, 1));
      // (trempée par la pluie d'un petit nuage : un peu moins, elle s'ébroue)
      case 'shake': return mixPalette(C, WET, 0.8 * clamp(left / 0.5, 0, 1));
      // (un grêlon : un peu bleue de froid)
      case 'hail': return mixPalette(C, WET, 0.4 * clamp(left / 0.5, 0, 1));
      case 'slime': return mixPalette(C, SLIMY, clamp(left / 0.5, 0, 1));
      case 'dirt': return mixPalette(C, DIRTY, clamp(left / 0.5, 0, 1));
      // toute verte d'un coup, puis elle reprend sa couleur après avoir coassé deux fois
      case 'croak': return mixPalette(C, FROGGY, clamp(k.t / 0.12, 0, 1) * clamp(left / 0.5, 0, 1));
      // (comme les autres personnages : rouge au début, voir Heroes)
      case 'pins': return mixPalette(C, PRICKED, clamp(1 - k.t / 0.6, 0, 1));
      // pleine de poussière de cailloux, qui s'en va quand elle se regonfle
      case 'crepe': return mixPalette(C, DUSTY, clamp((CREPE.flat + 0.2 - k.t) / 0.3, 0, 1));
      // pleine de neige en glissant sur le ventre, qui s'en va quand elle se relève
      case 'luge': return mixPalette(C, SNOWY, k.upT === undefined ? clamp(k.t / 0.15, 0, 1) : clamp(1 - (k.t - k.upT) / 0.5, 0, 1));
      default: return C;
    }
  }

  // ---- Projetée par le sanglier (OUCH.spin, voir Player.updateSpin) ----
  // La phase : 'up' (elle monte en tournant comme une toupie), 'flip' (elle se retourne en retombant),
  // 'head' (la tête en bas, les jambes en l'air), 'back' (elle se remet sur ses pieds).
  // (dans la galerie, sans phase : d'abord la toupie, puis la tête en bas)
  function spinPhase(k) {
    return k.phase || (k.t < 0.24 ? 'up' : 'head');
  }

  // Comment dessiner le personnage : retourné de a (autour du milieu de son corps), écrasé de sx (la toupie :
  // on le voit de face, puis de dos…), avec un tourbillon autour de lui (whirl, de 0 à 1).
  function spinTurn(k) {
    const ph = spinPhase(k);
    if (ph === 'up') return { a: 0, sx: Math.cos(k.t * 26), whirl: 1 };
    if (ph === 'flip') return { a: k.a || 0, sx: 1, whirl: clamp(1 - (k.pt || 0) / 0.15, 0, 1) };
    if (ph === 'head') return { a: k.a === undefined ? Math.PI : k.a, sx: 1, whirl: 0 };
    if (ph === 'back') return { a: k.a, sx: 1, whirl: 0 };
    return { a: 0, sx: 1, whirl: 0 };
  }

  // Le tourbillon autour de la toupie : des traits blancs qui tournent, en (x, y), r de haut.
  function spinWhirl(ctx, x, y, r, t, k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * k})`;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const yy = (i - 1) * r * 0.62;
      const rx = r * (0.78 - Math.abs(i - 1) * 0.16);
      const a = t * 22 + i * 2.1;
      ctx.lineWidth = 2.6 - Math.abs(i - 1) * 0.6;
      ctx.beginPath();
      ctx.ellipse(0, yy, rx, rx * 0.26, 0, a, a + 2.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bras et jambes pendant que Malice a mal : [jambe avant, jambe arrière, bras avant, bras arrière, penché].
  function ouchPose(k) {
    const ot = k.t;
    if (k.kind === 'butt') {
      // elle s'envole en se tenant les fesses, et pédale dans le vide
      const kick = Math.sin(ot * 26) * 0.3;
      return { legF: -0.6 + kick, legB: 0.8 - kick, armF: 0.85, armB: 0.65, lean: 0.22 };
    }
    if (k.kind === 'zap' && k.shock) {
      // bras et jambes écartés, tout raides, qui tremblent
      const j = () => rand(-0.12, 0.12);
      return { legF: -0.6 + j(), legB: 0.6 + j(), armF: -2.5 + j(), armB: 2.45 + j(), lean: 0 };
    }
    if (k.kind === 'ko') {
      // les bras ballants, elle tangue
      const w = Math.sin(ot * 9);
      return { legF: 0.3 + w * 0.15, legB: -0.3, armF: 0.25 + w * 0.25, armB: -0.15, lean: w * 0.09 };
    }
    if (k.kind === 'hail') {
      // un grêlon sur la tête : elle tangue, et elle se serre dans ses bras en grelottant (brrr !)
      const w = Math.sin(ot * 8);
      const s = Math.sin(ot * 44) * 0.05;
      return { legF: 0.28 + w * 0.12 + s, legB: -0.26 - s, armF: 0.95 + s, armB: 0.7 - s, lean: w * 0.08 };
    }
    if (k.kind === 'dirt') {
      // projetée en l'air : les bras qui moulinent, les jambes qui pédalent
      const s = Math.sin(ot * 22);
      return { legF: -0.5 + s * 0.35, legB: 0.6 - s * 0.35, armF: -2.4 + s * 0.4, armB: -2.0 - s * 0.4, lean: -0.1 };
    }
    if (k.kind === 'pins') {
      // aïe ! les bras et les jambes écartés, toute raide, qui tremble
      const j = Math.sin(ot * 60) * 0.07;
      return { legF: -0.45 + j, legB: 0.5 - j, armF: -2.1 + j, armB: 1.95 - j, lean: -0.08 };
    }
    if (k.kind === 'spin') {
      const ph = spinPhase(k);
      const s = Math.sin(ot * 16);
      // la tête en bas : les jambes tendues en l'air qui gigotent, les mains posées par terre près de la tête
      if (ph === 'head') return { legF: -0.22 + s * 0.28, legB: 0.26 - s * 0.28, armF: -2.75 + s * 0.08, armB: 2.7 - s * 0.08, lean: 0 };
      // elle se remet sur ses pieds : en boule, d'une petite cabriole
      if (ph === 'back') return { legF: -1.5, legB: -1.15, armF: -1.1, armB: -0.8, lean: 0.2 };
      // projetée en l'air comme une toupie : les bras en l'air, les jambes écartées
      return { legF: -0.55 + s * 0.2, legB: 0.6 - s * 0.2, armF: -2.6 + s * 0.3, armB: 2.5 - s * 0.3, lean: 0 };
    }
    if (k.kind === 'croak' && croaking(k)) {
      // « Croa ! » : accroupie comme une grenouille, les genoux écartés, les mains par terre devant elle
      const s = croakSac(k) * 0.08;
      return { legF: -1.25 - s, legB: 1.05 + s, armF: -0.42, armB: 0.3, lean: 0.14, crouch: 8 };
    }
    if (k.kind === 'shake') {
      if (shaking(k)) {
        // elle s'ébroue comme un chien : les jambes écartées bien plantées, les bras qui ballottent
        const s = Math.sin((k.t - SHAKE.t0) * SHAKE.n * TAU);
        return { legF: -0.32, legB: 0.34, armF: -0.6 + s * 0.7, armB: 0.6 + s * 0.7, lean: 0, crouch: 2 };
      }
      // splash ! les deux mains sur la tête, sous la pluie
      return { legF: 0.12, legB: -0.12, armF: -2.55, armB: 2.45, lean: 0.06 };
    }
    if (k.kind === 'crepe') {
      // dans la boule de cailloux : toute pelotonnée ; aplatie : les bras et les jambes écartés comme une étoile de mer
      // (qui gigotent un peu) ; pop ! les bras en l'air
      if (ot < CREPE.ball) return { legF: -1.9, legB: -1.6, armF: -1.05, armB: -0.8, lean: 0.3, crouch: 9 };
      if (ot < CREPE.flat) {
        const s = Math.sin(ot * 18) * 0.15;
        return { legF: -1.05 + s, legB: 1.05 - s, armF: -2.2 - s, armB: 2.15 + s, lean: 0 };
      }
      return { legF: -0.3, legB: 0.3, armF: -2.7, armB: 2.6, lean: 0 };
    }
    if (k.kind === 'luge') {
      // à plat ventre : les bras tendus devant elle comme une super-héroïne, les jambes derrière qui gigotent un peu
      // (voir lugeShape : tout son corps est basculé sur le ventre) ; en se relevant : accroupie ; puis (dans la galerie)
      // la main sous le nez qui chatouille
      const up = k.upT === undefined ? Infinity : k.upT;
      if (ot < up) {
        const s = Math.sin(ot * 20) * 0.12;
        return { legF: 0.18 + s, legB: -0.08 - s, armF: -2.95 + s * 0.4, armB: -2.7 - s * 0.4, lean: 0 };
      }
      if (ot < up + LUGE.up) return { legF: -0.9, legB: 0.6, armF: -0.8, armB: 0.7, lean: 0.2, crouch: 5 };
      return { legF: 0.12, legB: -0.12, armF: -2.0, armB: 0.4, lean: 0 };
    }
    if (k.kind === 'wet') {
      // elle se serre dans ses bras, les genoux qui s'entrechoquent
      const s = Math.sin(ot * 40) * 0.05;
      return { legF: 0.16 + s, legB: -0.16 - s, armF: 0.95 + s, armB: 0.7 - s, lean: 0.05 };
    }
    return { legF: 0.45, legB: -0.45, armF: -1.25, armB: 1.5, lean: -0.12 };
  }

  // Ce qui change sur la tête : yeux, bouche, bosse, cheveux.
  function ouchFx(k, pose) {
    if (!k) return NO_FX;
    const t = k.t;
    const fx = { eye: '', mouth: '', bump: 0, hair: '' };
    switch (k.kind) {
      case 'butt':
        fx.eye = 'wide';
        fx.mouth = 'wide';
        break;
      case 'head':
        if (t < 0.6) fx.eye = 'squeeze';
        fx.bump = Math.min(clamp(t / 0.12, 0, 1), clamp((k.dur - t) / 0.3, 0, 1));
        break;
      case 'zap':
        fx.hair = k.shock ? 'up' : 'frizz';
        if (k.shock) {
          fx.eye = 'wide';
          fx.mouth = 'wide';
        }
        break;
      case 'ko':
        fx.eye = 'ko';
        fx.mouth = 'tongue';
        break;
      case 'hail':
        // toc ! d'abord les yeux plissés, puis sonnée (les yeux en croix), la bouche ronde : brrr !
        fx.eye = t < 0.3 ? 'squeeze' : 'ko';
        fx.mouth = t < 0.3 ? 'wide' : Math.floor(t * 14) % 2 ? 'o' : 'small';
        break;
      case 'hypno':
        fx.eye = 'spiral';
        fx.mouth = 'o';
        break;
      case 'soot':
        fx.hair = 'frizz';
        if (COUGHS.some((c) => t > c && t < c + 0.2)) fx.mouth = 'o';
        if ((t > 0.55 && t < 0.65) || (t > 0.95 && t < 1.05)) fx.eye = 'blink';
        break;
      case 'wet':
        // les yeux fermés en ressortant, puis tout ronds ; elle claque des dents
        fx.eye = t < 0.3 ? 'blink' : 'wide';
        fx.mouth = t > 0.3 && t < k.dur - 0.3 ? (Math.floor(t * 16) % 2 ? 'wide' : 'small') : 'o';
        break;
      case 'shake':
        // splash ! les yeux plissés sous la pluie ; elle s'ébroue en grimaçant (brrr !) ; puis ouf
        if (t < SHAKE.t0) {
          fx.eye = 'squeeze';
          fx.mouth = 'o';
        } else if (shaking(k)) {
          fx.eye = 'squeeze';
          fx.mouth = 'wide';
        } else if (t < SHAKE.t1 + 0.15) {
          fx.eye = 'blink';
        }
        break;
      case 'slime':
        // beurk !
        fx.eye = 'squeeze';
        fx.mouth = 'tongue';
        break;
      case 'dirt':
        // d'abord tout surprise, puis pouah ! de la terre plein la bouche
        fx.eye = t < 0.45 ? 'wide' : 'squeeze';
        fx.mouth = t < 0.45 ? 'wide' : 'tongue';
        break;
      case 'spin': {
        // tout tourne ! Puis la tête en bas, toute étonnée (elle cligne des yeux), et une grimace en se relevant
        const ph = spinPhase(k);
        if (ph === 'up' || ph === 'flip') {
          fx.eye = 'spiral';
          fx.mouth = 'wide';
        } else if (ph === 'head') {
          const pt = k.pt === undefined ? t : k.pt;
          fx.eye = pt > 0.35 && pt % 0.7 < 0.1 ? 'blink' : 'wide';
          fx.mouth = 'o';
        } else if (ph === 'back') {
          fx.eye = 'squeeze';
          fx.mouth = 'wide';
        }
        break;
      }
      case 'pins':
        // d'abord tout surprise, puis elle grimace à chaque piquant qu'elle enlève
        if (t < 0.4) {
          fx.eye = 'wide';
          fx.mouth = 'wide';
        } else if (pinsWince(k)) {
          fx.eye = 'squeeze';
          fx.mouth = 'wide';
        } else {
          fx.mouth = 'o';
        }
        break;
      case 'crepe':
        // la tête qui tourne dans la boule ; aplatie, tout étonnée (elle cligne des yeux) ; pop ! la bouche grande
        // ouverte
        if (t < CREPE.ball) {
          fx.eye = 'spiral';
          fx.mouth = 'wide';
        } else if (t < CREPE.flat) {
          fx.eye = (t - CREPE.ball) % 0.45 > 0.38 ? 'blink' : 'wide';
          fx.mouth = 'o';
        } else if (t < CREPE.flat + CREPE.pop) {
          fx.eye = 'wide';
          fx.mouth = 'wide';
        }
        break;
      case 'luge': {
        // « Wiiii ! » : les yeux tout ronds, la bouche grande ouverte ; puis le nez tout rouge : « ah… ah… » (les yeux
        // qui se plissent), « Atchoum ! » (les yeux fermés très fort, la bouche grande ouverte)
        const L = lugeShape(k);
        if (k.upT === undefined || t < k.upT) {
          fx.eye = 'wide';
          fx.mouth = 'wide';
        } else if (L.sneeze === 1) {
          fx.eye = 'blink';
          fx.mouth = 'o';
        } else if (L.sneeze === 2) {
          fx.eye = 'squeeze';
          fx.mouth = 'wide';
        } else {
          fx.mouth = 'small';
        }
        break;
      }
      case 'croak':
        // les yeux tout ronds, comme une grenouille, et la bouche grande ouverte quand elle coasse
        fx.eye = 'wide';
        fx.mouth = croaking(k) ? 'wide' : t < 0.3 ? 'o' : '';
        break;
      case 'scramble':
      case 'spots':
        // elle regarde ce qui lui arrive avec de grands yeux
        if (pose !== 'ouch' && t < 1) {
          fx.eye = 'wide';
          fx.mouth = 'o';
        }
        break;
      default: break;
    }
    return fx;
  }

  // Une épine de ronce (blanche comme dans le décor) plantée en (x, y), la pointe dans la direction ang.
  function thorn(ctx, x, y, ang, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-0.6, -1.8);
    ctx.lineTo(5.2, 0);
    ctx.lineTo(-0.6, 1.8);
    ctx.closePath();
    paint(ctx, '#ffffff', '#3d1640', 0.9);
    ctx.restore();
  }

  // Les ronces ont piqué les fesses : elles sont toutes rouges, avec des épines plantées dedans.
  function soreButt(ctx, k, t) {
    const p = 1 + Math.sin(t * 30) * 0.12;
    ctx.save();
    ctx.globalAlpha *= clamp((k.dur - k.t) / 0.25, 0, 1);
    ellipsePath(ctx, -9.2, -15.8, 5 * p, 4.4 * p, 0.5);
    ctx.fillStyle = 'rgba(255,40,70,0.75)';
    ctx.fill();
    thorn(ctx, -10.6, -20, 3.55, 1);
    thorn(ctx, -11.4, -16.2, 3.0, 0.9);
    thorn(ctx, -8.6, -13.2, 2.25, 0.85);
    // petits traits : ça pique !
    ctx.strokeStyle = '#3d1640';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    const r = 10 + Math.sin(t * 30) * 0.8;
    ctx.beginPath();
    for (const a of [2.45, 3.05, 3.65]) {
      ctx.moveTo(-6 + Math.cos(a) * r, -17 + Math.sin(a) * r);
      ctx.lineTo(-6 + Math.cos(a) * (r + 4), -17 + Math.sin(a) * (r + 4));
    }
    ctx.stroke();
    ctx.restore();
  }

  // Sonnée : des étoiles tournent au-dessus de la tête.
  function koStars(ctx, k, t) {
    ctx.save();
    ctx.globalAlpha *= clamp((k.dur - k.t) / 0.12, 0, 1);
    for (let i = 0; i < 3; i++) {
      const a = t * 8 + (i * TAU) / 3;
      ctx.save();
      ctx.translate(2 + Math.cos(a) * 14, -71 + Math.sin(a) * 3.8);
      ctx.rotate(t * 5 + i);
      starShape(ctx, 3.8, 0.45);
      paint(ctx, '#ffe94a', '#b07800', 0.9);
      ctx.restore();
    }
    ctx.restore();
  }

  // Un grêlon sur la tête (Bourrasque) : des étoiles et des flocons de neige tournent autour de sa tête (y : le centre
  // du tour, au-dessus de la tête ; r : la largeur du tour), et un petit glaçon fond sur sa casquette.
  function hailStars(ctx, k, t, y, r) {
    ctx.save();
    ctx.globalAlpha *= clamp((k.dur - k.t) / 0.2, 0, 1);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = t * 6 + (i * TAU) / n;
      const s = Math.sin(a);
      // (ceux de derrière sont un peu plus petits et plus pâles)
      ctx.save();
      ctx.globalAlpha *= s < 0 ? 0.7 : 1;
      ctx.translate(Math.cos(a) * r, y + s * r * 0.26);
      ctx.rotate(t * (i % 2 ? -4 : 5) + i);
      const sc = s < 0 ? 0.85 : 1;
      ctx.scale(sc, sc);
      if (i % 2) {
        starShape(ctx, 3.8, 0.45);
        paint(ctx, '#ffe94a', '#b07800', 0.9);
      } else {
        snowflake(ctx, 4.2);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // un flocon de neige (6 branches, avec de petites pointes), centré en (0, 0)
  function snowflake(ctx, r) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? '#ffffff' : '#3a78b8';
      ctx.lineWidth = pass ? 1.3 : 2.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6;
        const cx = Math.cos(a);
        const sy = Math.sin(a);
        ctx.moveTo(0, 0);
        ctx.lineTo(cx * r, sy * r);
        const mx = cx * r * 0.6;
        const my = sy * r * 0.6;
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(a + 0.8) * r * 0.35, my + Math.sin(a + 0.8) * r * 0.35);
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(a - 0.8) * r * 0.35, my + Math.sin(a - 0.8) * r * 0.35);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function spotsOverlay(ctx, k) {
    MALICE_SPOTS.forEach(([x, y, r], i) => {
      // ils arrivent très vite, l'un après l'autre
      const s = clamp((k.t - i * 0.03) / 0.08, 0, 1);
      if (s <= 0 || k.t >= spotPop(i)) return;
      circlePath(ctx, x, y, r * s);
      ctx.fillStyle = '#151515';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      circlePath(ctx, x - r * 0.35, y - r * 0.35, r * 0.3 * s);
      ctx.fill();
    });
  }

  // Toute mouillée : des gouttes pendent (casquette, nez, salopette) et tombent, et elle tremble de froid.
  // top : le haut de la tête (pour les autres personnages, qui n'ont pas la même taille).
  function wetOverlay(ctx, k, top) {
    const t = k.t;
    ctx.save();
    ctx.globalAlpha *= clamp((k.dur - t) / 0.3, 0, 1);
    const drops = [[13, top + 12], [-11, top + 16], [19, top + 26], [-6, -20], [8, -14]];
    drops.forEach(([x, y], i) => {
      const ph = (t * 1.8 + i * 0.37) % 1;
      const s = ph < 0.7 ? ph / 0.7 : 1;
      const fall = ph < 0.7 ? 0 : (ph - 0.7) * 40;
      ctx.save();
      ctx.translate(x, y + fall);
      ctx.scale(0.55 + s * 0.45, 0.55 + s * 0.6);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.quadraticCurveTo(3, 1.5, 0, 3.5);
      ctx.quadraticCurveTo(-3, 1.5, 0, -3);
      paint(ctx, '#9fe0ff', '#2f8fd0', 0.8);
      ctx.restore();
    });
    // brrr : des petits traits qui tremblent de chaque côté (pas sous la pluie d'un petit nuage : elle s'ébroue)
    if (t > 0.25 && k.kind !== 'shake') {
      ctx.strokeStyle = 'rgba(120,200,255,0.9)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        for (let j = 0; j < 2; j++) {
          const x = side * (21 + j * 5);
          const y = -38 + j * 9;
          ctx.beginPath();
          ctx.moveTo(x, y - 5);
          ctx.lineTo(x + side * 2.5, y - 2);
          ctx.lineTo(x - side * 1, y + 1);
          ctx.lineTo(x + side * 2.5, y + 4);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // Couverte de bave : des paquets verts tout brillants qui dégoulinent.
  function slimeOverlay(ctx, k, top) {
    const t = k.t;
    ctx.save();
    ctx.globalAlpha *= clamp((k.dur - t) / 0.4, 0, 1);
    const blobs = [[2, top + 2, 7], [-7, -32, 5], [9, -20, 4.5]];
    blobs.forEach(([x, y, r], i) => {
      const drip = Math.min(1, t * 1.5) * (6 + i * 3);
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, 0, Math.PI, 0);
      ctx.quadraticCurveTo(x + r, y + 3, x + r * 0.35, y + 3);
      ctx.quadraticCurveTo(x + r * 0.2, y + drip, x, y + drip + 2);
      ctx.quadraticCurveTo(x - r * 0.25, y + drip, x - r * 0.35, y + 3);
      ctx.quadraticCurveTo(x - r, y + 3, x - r, y);
      paint(ctx, 'rgba(160,235,110,0.85)', 'rgba(70,150,40,0.8)', 0.9);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ellipsePath(ctx, x - r * 0.35, y - r * 0.3, r * 0.3, r * 0.15, -0.4);
      ctx.fill();
    });
    ctx.restore();
  }

  // « Croa ! » : la gorge qui se gonfle comme celle d'une grenouille, sous le menton.
  // headY : la hauteur de sa tête, hx : où est sa tête (pour les autres personnages, voir Heroes).
  function croakOverlay(ctx, k, headY, hx) {
    hx = hx || 0;
    const s = croakSac(k);
    if (s <= 0.02) return;
    ctx.save();
    circlePath(ctx, hx + 9, headY + 17, 2.5 + 6.5 * s);
    paint(ctx, 'rgba(230,255,170,0.95)', 'rgba(70,150,50,0.9)', 1.1);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ellipsePath(ctx, hx + 7, headY + 14 - 2 * s, 2.2 * s, 1.3 * s, -0.4);
    ctx.fill();
    ctx.restore();
  }

  // Pleine de terre : des mottes sur la tête et des taches partout, et un petit ver de terre rose
  // sort d'une motte pour lui faire coucou (puis il y rentre).
  // top : le haut de la tête (pour les autres personnages, qui n'ont pas la même taille).
  function dirtOverlay(ctx, k, top) {
    const t = k.t;
    ctx.save();
    ctx.globalAlpha *= clamp((k.dur - t) / 0.35, 0, 1);
    // des taches de terre
    ctx.fillStyle = 'rgba(110,70,36,0.75)';
    for (const [x, y, r] of [[-6, -22, 3], [7, -30, 2.4], [-9, -40, 2.2], [3, -12, 2.6]]) {
      ellipsePath(ctx, x, y, r * 1.3, r, 0.4);
      ctx.fill();
    }
    // le ver de terre, dans la motte du dessus
    const out = clamp(t / 0.3, 0, 1) * clamp((k.dur - 0.3 - t) / 0.3, 0, 1);
    if (out > 0) {
      const wave = Math.sin(t * 9);
      ctx.save();
      ctx.translate(3, top + 1);
      ctx.strokeStyle = '#c4567a';
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3 + wave * 2, -7 * out, wave * 4, -13 * out);
      ctx.stroke();
      ctx.strokeStyle = '#ff9ec0';
      ctx.lineWidth = 3;
      ctx.stroke();
      // ses petits yeux
      if (out > 0.6) {
        ctx.fillStyle = '#2a1420';
        circlePath(ctx, wave * 4 - 1, -13 * out - 0.5, 0.8);
        ctx.fill();
        circlePath(ctx, wave * 4 + 1.3, -13 * out - 0.5, 0.8);
        ctx.fill();
      }
      ctx.restore();
    }
    // les mottes sur la tête
    for (const [x, y, r] of [[-5, top + 3, 5.5], [5, top + 2, 6], [12, top + 7, 3.6]]) {
      ctx.beginPath();
      ctx.arc(x, y + r * 0.4, r, Math.PI, 0);
      ctx.closePath();
      paint(ctx, '#9a6438', '#4a2a12', 1);
      ctx.fillStyle = '#6a4024';
      circlePath(ctx, x - r * 0.3, y - r * 0.1, r * 0.25);
      ctx.fill();
    }
    ctx.restore();
  }

  // Couverte de piquants de hérisson, comme une pelote d'épingles : ils arrivent tous d'un coup, et
  // disparaissent un par un quand elle les enlève (head : le haut de la tête, voir pinAt).
  function pinsOverlay(ctx, k, head) {
    const t = k.t;
    const s = clamp(t / 0.08, 0, 1);
    ctx.save();
    ctx.lineCap = 'round';
    PINS.forEach((pin, i) => {
      if (t >= PIN_PULLS[i]) return;
      // (celui qu'elle tient est presque sorti)
      const out = clamp((t - (PIN_PULLS[i] - 0.1)) / 0.1, 0, 1) * 4;
      const [x, y] = pinAt(i, head);
      const a = pin[2];
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const bx = x + ca * out;
      const by = y + sa * out;
      const len = 13 * s;
      // la peau toute rouge autour
      ctx.fillStyle = 'rgba(255,70,90,0.45)';
      circlePath(ctx, x, y, 3.2);
      ctx.fill();
      ctx.strokeStyle = '#3a2416';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + ca * len, by + sa * len);
      ctx.stroke();
      ctx.strokeStyle = '#f2dcb4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + ca * len * 0.55, by + sa * len * 0.55);
      ctx.stroke();
      ctx.strokeStyle = '#6a4428';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx + ca * len * 0.6, by + sa * len * 0.6);
      ctx.lineTo(bx + ca * len * 0.97, by + sa * len * 0.97);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Électrocutée : des éclairs crépitent tout autour d'elle.
  function zapBolts(ctx, k) {
    const seed = Math.floor(k.t * 30) + k.seed;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? '#ffffff' : 'rgba(255,225,60,0.8)';
      ctx.lineWidth = pass ? 1.2 : 3.6;
      for (let b = 0; b < 6; b++) {
        const a0 = hash(seed + b * 5.1) * TAU;
        const r0 = 15 + hash(seed + b * 2.7) * 6;
        const len = 9 + hash(seed + b * 9.3) * 9;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
          const r = r0 + (len * i) / 4;
          const a = a0 + (hash(seed + b * 3.1 + i * 1.7) - 0.5) * 0.6;
          const px = Math.cos(a) * r * 0.8;
          const py = -32 + Math.sin(a) * r * 1.25;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function shockGlow(ctx, xray) {
    const c = xray ? '140,230,255' : '255,240,120';
    const g = ctx.createRadialGradient(0, -32, 4, 0, -32, 42);
    g.addColorStop(0, `rgba(${c},0.9)`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ellipsePath(ctx, 0, -32, 34, 42);
    ctx.fill();
  }

  // Les poses où l'on voit le bras aller chercher un piquant (pas en boule, accrochée, en train de pouvoir…).
  const PIN_REACH_POSES = ['idle', 'walk', 'run', 'jump', 'fall', 'slip'];

  // Malice debout, les pieds au point (x, y).
  // o : facing (1 ou -1), pose, t (temps), ph (phase de marche), palette, sx/sy (écrasement),
  //     ouch (ce qui lui fait mal, avec la pose 'ouch' tant que tout son corps réagit)
  function malice(ctx, x, y, o) {
    o = o || {};
    const k = o.ouch || null;
    const kind = k ? k.kind : '';
    const shock = kind === 'zap' && k.shock;
    // électrocutée : on voit son squelette une image sur deux
    const xray = shock && Math.floor(k.t / 0.07) % 2 === 1;
    const C = xray ? XRAY : ouchPalette(o.palette || MALICE, k);
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const ph = o.ph || 0;
    ctx.save();
    ctx.translate(x, y);
    const sc = o.scale || 1;
    ctx.scale((o.facing || 1) * sc * (o.sx || 1), sc * (o.sy || 1));
    if (shock) ctx.translate(rand(-1.2, 1.2), rand(-0.8, 0.8));
    // toute mouillée : elle grelotte
    if (kind === 'wet' && k.t < k.dur - 0.3) ctx.translate(Math.sin(k.t * 80) * 0.9, 0);
    let legF = 0.1;
    let legB = -0.1;
    let armF = -0.12;
    let armB = 0.12;
    let bob = 0;
    let lean = 0;
    let crouch = 0;
    let legLen = 10;
    switch (pose) {
      case 'walk': {
        const s = Math.sin(ph);
        legF = s * 0.62; legB = -s * 0.62;
        armF = -s * 0.8; armB = s * 0.8;
        bob = -Math.abs(Math.cos(ph)) * 2;
        lean = 0.05;
        break;
      }
      case 'run': {
        // grandes enjambées, penchée en avant
        const s = Math.sin(ph);
        legF = s * 0.95; legB = -s * 0.95;
        armF = -s * 1.15; armB = s * 1.15;
        bob = -Math.abs(Math.cos(ph)) * 3;
        lean = 0.16;
        break;
      }
      case 'jump': legF = -0.95; legB = 0.45; armF = -1.65; armB = 1.15; break;
      case 'fall': legF = 0.3; legB = -0.35; armF = -1.3; armB = 1.45; break;
      case 'pound': legF = -1.6; legB = -1.25; armF = -0.75; armB = 0.6; bob = 3; break;
      case 'throw': armF = -1.6; armB = 0.6; legF = 0.3; legB = -0.3; break;
      case 'win': armF = -1.85 + Math.sin(t * 10) * 0.22; armB = 1.3; legF = 0.2; legB = -0.2; break;
      case 'hurt': armF = -1.25; armB = 1.5; legF = 0.45; legB = -0.45; lean = -0.12; break;
      case 'ouch': ({ legF, legB, armF, armB, lean, crouch = 0 } = ouchPose(k)); break;
      case 'hold': armF = -1.0; armB = -0.8; break;
      case 'crouch': crouch = 7; legF = -1.25; legB = -0.85; legLen = 8; armF = -0.6; armB = 0.3; break;
      // en boule (la roulade) : les genoux contre le ventre, les bras autour, la tête rentrée
      case 'roll': crouch = 9; legF = -1.95; legB = -1.7; legLen = 7; armF = -1.05; armB = -0.8; lean = 0.32; break;
      case 'hang': armF = 0.25; armB = -0.25; legF = 0.25; legB = -0.2; break;
      // elle glisse sur les éboulis comme sur une planche de surf : un pied devant, un pied derrière, les genoux pliés,
      // les bras écartés qui tanguent
      case 'surf': {
        const s = Math.sin(t * 5) * 0.18;
        legF = -0.55; legB = 0.5; armF = -1.45 + s; armB = 1.5 + s; crouch = 4; lean = 0.04; bob = Math.sin(t * 23) * 0.6;
        break;
      }
      // elle glisse sur la bave : les bras qui moulinent, penchée en arrière
      case 'slip':
        armF = -2.3 + Math.sin(t * 18) * 0.6; armB = 1.9 + Math.cos(t * 18) * 0.6;
        legF = -0.6; legB = 0.5; lean = -0.2;
        break;
      // pendue à une liane du Vieux Chêne : les deux bras tendus vers le haut, les jambes qui gigotent
      case 'vine':
        armF = -2.8 + Math.sin(t * 3) * 0.04; armB = 2.8 - Math.sin(t * 3) * 0.04;
        legF = 0.35 + Math.sin(t * 3) * 0.2; legB = -0.2 - Math.sin(t * 3) * 0.2;
        break;
      // pendue à un pissenlit géant : les bras en l'air, les jambes qui se balancent
      case 'float':
        armF = -2.25 + Math.sin(t * 2.6) * 0.05; armB = -2.0;
        legF = 0.3 + Math.sin(t * 2.2) * 0.18; legB = -0.1 - Math.sin(t * 2.2) * 0.18;
        break;
      default:
        bob = Math.sin(t * 2.5) * 0.7;
        armF = -0.12 - Math.sin(t * 2.5) * 0.04;
    }
    if (kind === 'pins' && PIN_REACH_POSES.includes(pose)) {
      // elle enlève un piquant
      const a = pinsReach(k);
      if (a !== null) armF = a;
    }
    if (kind === 'hypno' && pose !== 'ouch' && pose !== 'hang' && pose !== 'crouch') {
      // hypnotisée : elle avance les bras tendus, comme une somnambule
      armF = -1.45 + Math.sin(t * 4) * 0.08;
      armB = -1.3 + Math.cos(t * 4) * 0.08;
    }
    ctx.translate(0, bob);
    ctx.rotate(lean);
    if (shock) shockGlow(ctx, xray);
    ctx.save();
    ctx.translate(0, crouch);
    drawArm(ctx, C, -2, -28.2, armB, true);
    ctx.restore();
    drawLeg(ctx, C, -2.2, -15.5 + crouch, legB, true, legLen);
    drawLeg(ctx, C, 1.4, -15.5 + crouch, legF, false, legLen);
    ctx.save();
    ctx.translate(0, crouch);
    drawBody(ctx, C);
    if (kind === 'butt') soreButt(ctx, k, t);
    // le bras avant passe sous la tête (sauf quand Malice tient le bébé oiseau)
    if (!o.holding) drawArm(ctx, C, 1.2, -27.8, armF, false);
    // sonnée, la tête tombe un peu en avant ; hypnotisée, elle dodeline
    // (un grêlon sur la tête : sonnée aussi, la tête qui dodeline)
    const tilt = kind === 'ko' ? 0.2 + Math.sin(t * 9) * 0.08 : kind === 'hail' ? 0.12 + Math.sin(t * 7) * 0.1 : kind === 'hypno' ? Math.sin(t * 3) * 0.12 : 0;
    if (tilt) {
      ctx.save();
      ctx.translate(0, -30);
      ctx.rotate(tilt);
      ctx.translate(0, 30);
    }
    drawHead(ctx, C, o, ouchFx(k, pose));
    if (kind === 'ko') koStars(ctx, k, t);
    if (kind === 'hail') hailStars(ctx, k, t, -72, 17);
    if (tilt) ctx.restore();
    if (kind === 'spots') spotsOverlay(ctx, k);
    if (kind === 'wet' || kind === 'shake') wetOverlay(ctx, k, -62);
    if (kind === 'slime') slimeOverlay(ctx, k, -62);
    if (kind === 'dirt') dirtOverlay(ctx, k, -62);
    if (kind === 'pins') pinsOverlay(ctx, k);
    if (kind === 'croak') croakOverlay(ctx, k, -46);
    if (o.holding) {
      o.holding(ctx);
      drawArm(ctx, C, 1.2, -27.8, armF, false);
    }
    // ce qui est posé sur la casquette (le bébé oiseau, pendant le retour à la maison)
    if (o.onHead) o.onHead(ctx);
    ctx.restore();
    if (shock) zapBolts(ctx, k);
    ctx.restore();
  }

  // Juste la tête (pour les vies dans le HUD).
  function maliceHead(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(-3, 45);
    drawHead(ctx, MALICE, { pose: 'idle', t: 1, view: '3q' });
    ctx.restore();
  }

  // ---------------- Ennemis tout gras (après les chips au vinaigre) ----------------
  function chubbyCheeks(ctx, x, y, rx, ry, color, line) {
    for (const side of [-1, 1]) {
      ellipsePath(ctx, side * x, y, rx, ry, side * 0.25);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = line;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function fatMouth(ctx, x, y, rest) {
    if (rest) {
      ellipsePath(ctx, x, y, 4.2, 3.4);
      ctx.fillStyle = '#5a1030';
      ctx.fill();
    } else {
      ctx.strokeStyle = '#5a1030';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      circlePath(ctx, x, y, 2.2);
      ctx.stroke();
    }
  }

  function eyeMonsterFat(ctx, o) {
    const dir = o.dir || 1;
    const lp = o.legPhase || 0;
    const moving = o.moving !== false;
    ctx.lineCap = 'round';
    // petites pattes boudinées
    for (const side of [-1, 1]) {
      const p = lp + (side > 0 ? 0 : Math.PI);
      const sw = moving ? Math.sin(p) * 3 : 0;
      ctx.strokeStyle = '#6a2e4e';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(side * 10, -11);
      ctx.lineTo(side * 11 + sw, -5);
      ctx.stroke();
      ctx.strokeStyle = '#8d4468';
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.fillStyle = '#5c2443';
      ellipsePath(ctx, side * 11 + sw + 3 * dir, -2.8, 9, 4.2);
      ctx.fill();
    }
    const cy = -28;
    const RX = 27;
    const RY = 23;
    const g = ctx.createRadialGradient(-9, cy - 9, 3, 0, cy, RX);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.65, '#f8ecf4');
    g.addColorStop(1, '#e6c3da');
    ellipsePath(ctx, 0, cy, RX, RY);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#a67fae';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,40,64,0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.27 + 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * RX * 0.95, cy + Math.sin(a) * RY * 0.95);
      ctx.quadraticCurveTo(Math.cos(a) * RX * 0.78 + 3, cy + Math.sin(a) * RY * 0.78 - 2, Math.cos(a) * RX * 0.6, cy + Math.sin(a) * RY * 0.6);
      ctx.stroke();
    }
    // bourrelets et double menton
    chubbyCheeks(ctx, 16, cy + 12, 10.5, 7.5, '#f9cfe0', '#c98aa8');
    ctx.strokeStyle = 'rgba(150,95,140,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-13, cy + 18);
    ctx.quadraticCurveTo(0, cy + 24, 13, cy + 18);
    ctx.stroke();
    // iris (paraît tout petit dans ce gros oeil)
    const lx = (o.look ? o.look.x : dir) * 8;
    const ly = (o.look ? o.look.y : 0) * 4;
    const hue = o.hue == null ? 140 : o.hue;
    const ig = ctx.createRadialGradient(lx, cy - 4 + ly, 1, lx, cy - 4 + ly, 8.5);
    ig.addColorStop(0, `hsl(${hue},80%,70%)`);
    ig.addColorStop(1, `hsl(${hue},70%,32%)`);
    ctx.fillStyle = ig;
    circlePath(ctx, lx, cy - 4 + ly, 8.5);
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, lx + dir * 0.5, cy - 4 + ly, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circlePath(ctx, lx - 2.5, cy - 7 + ly, 2);
    ctx.fill();
    // grosse paupière fatiguée
    const lid = Math.max(o.lid || 0, o.rest ? 0.36 : 0.2);
    ctx.save();
    ellipsePath(ctx, 0, cy, RX, RY);
    ctx.clip();
    ctx.fillStyle = '#d58fb0';
    ctx.fillRect(-RX, cy - RY, RX * 2, RY * 2 * lid);
    ctx.strokeStyle = '#7d3a5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-RX, cy - RY + RY * 2 * lid + Math.sin(-1) * 2);
    ctx.quadraticCurveTo(0, cy - RY + RY * 2 * lid + 3, RX, cy - RY + RY * 2 * lid);
    ctx.stroke();
    ctx.restore();
    fatMouth(ctx, dir * 7, cy + 11, o.rest);
  }

  function rubikFat(ctx, o) {
    const t = o.t || 0;
    // petits pieds
    ctx.fillStyle = '#1a1a1a';
    ellipsePath(ctx, -12, -3, 8, 4);
    ctx.fill();
    ellipsePath(ctx, 12, -3, 8, 4);
    ctx.fill();
    // dessus moelleux
    ctx.fillStyle = '#141414';
    ellipsePath(ctx, 5, -47, 23, 7.5);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = o.top[i];
      ellipsePath(ctx, -8 + i * 13, -47.5, 5.5, 2.6);
      ctx.fill();
    }
    // gros corps bombé
    ctx.beginPath();
    ctx.moveTo(-21, -47);
    ctx.quadraticCurveTo(0, -51, 21, -47);
    ctx.quadraticCurveTo(31, -26, 22, -6);
    ctx.quadraticCurveTo(0, 0, -22, -6);
    ctx.quadraticCurveTo(-31, -26, -21, -47);
    ctx.closePath();
    ctx.fillStyle = '#111';
    ctx.fill();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const bulge = r === 1 ? 1.1 : 1;
        const cx = (c - 1) * 14 * bulge;
        const cyy = -38 + r * 13 + (c === 1 ? 1 : 0) + (r === 2 ? 1 : 0);
        ctx.fillStyle = o.colors[r * 3 + c];
        roundRectPath(ctx, cx - 6.4, cyy - 5.8, 12.8, 11.6, 4.5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ellipsePath(ctx, cx - 2.5, cyy - 3, 3, 1.4);
        ctx.fill();
      }
    }
    // bourrelet du bas
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.quadraticCurveTo(0, -6, 20, -12);
    ctx.stroke();
    // visage fatigué
    for (const sx of [-8, 8]) {
      ellipsePath(ctx, sx, -31, 5.6, 6);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#111';
      circlePath(ctx, sx + (o.look ? o.look.x * 2 : 0), -29.5, 2.6);
      ctx.fill();
      ctx.save();
      ellipsePath(ctx, sx, -31, 5.6, 6);
      ctx.clip();
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(sx - 6, -38, 12, o.rest ? 7.5 : 5);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,120,150,0.75)';
    ellipsePath(ctx, -15, -22, 4, 2.6);
    ctx.fill();
    ellipsePath(ctx, 15, -22, 4, 2.6);
    ctx.fill();
    fatMouth(ctx, 0, -18 + Math.sin(t * 3) * 0.3, o.rest);
  }

  function ladybugFat(ctx, o) {
    const t = o.t || 0;
    const lp = o.legPhase || 0;
    // pattes boudinées
    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const sw = Math.sin(lp + i * 2.1) * 2.5;
      ctx.beginPath();
      ctx.moveTo(-14 + i * 13, -6);
      ctx.lineTo(-14 + i * 13 + sw, -1);
      ctx.stroke();
    }
    // tête
    ctx.fillStyle = '#1b1b22';
    circlePath(ctx, 26, -15, 12.5);
    ctx.fill();
    ctx.strokeStyle = '#1b1b22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, -26);
    ctx.quadraticCurveTo(31, -36, 37, -37);
    ctx.moveTo(23, -27);
    ctx.quadraticCurveTo(23, -38, 28, -41);
    ctx.stroke();
    circlePath(ctx, 37, -37, 2.5);
    ctx.fill();
    circlePath(ctx, 28, -41, 2.5);
    ctx.fill();
    ellipsePath(ctx, 31, -18, 4.2, 4.6);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, 32.4, -17, 2.2);
    ctx.fill();
    ctx.fillStyle = '#1b1b22';
    ctx.fillRect(26.5, -23.5, 9, o.rest ? 5.5 : 3.5);
    ctx.fillStyle = 'rgba(255,110,150,0.8)';
    ellipsePath(ctx, 21.5, -10, 3.4, 2.2);
    ctx.fill();
    // gros ventre qui dépasse
    const bg = ctx.createLinearGradient(0, -16, 0, 2);
    bg.addColorStop(0, '#3a3a40');
    bg.addColorStop(1, '#1a1a1e');
    ctx.fillStyle = bg;
    ellipsePath(ctx, -2, -8, 29, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-20, -5);
    ctx.quadraticCurveTo(-2, 1, 16, -5);
    ctx.stroke();
    // grosse carapace ronde
    const sg = ctx.createRadialGradient(-10, -32, 3, -3, -20, 34);
    sg.addColorStop(0, '#ff7a6a');
    sg.addColorStop(0.6, '#e3201b');
    sg.addColorStop(1, '#a40f10');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-33, -10);
    ctx.bezierCurveTo(-35, -38, -12, -50, 3, -47);
    ctx.bezierCurveTo(21, -45, 27, -27, 22, -10);
    ctx.quadraticCurveTo(-5, -5, -33, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a0c0c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#151515';
    const n = o.spots == null ? 7 : o.spots;
    for (let i = 0; i < n; i++) {
      circlePath(ctx, SPOTS[i][0] * 1.15 - 2, SPOTS[i][1] * 1.12 - 3, i === 1 ? 5.2 : 4.4);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipsePath(ctx, -10, -37, 7, 2.8, -0.4);
    ctx.fill();
    fatMouth(ctx, 31, -8 + Math.sin(t * 3) * 0.2, o.rest);
  }

  // ---------------- Gros oeil à pattes ----------------
  function eyeMonster(ctx, x, y, o) {
    ctx.save();
    ctx.translate(x, y);
    if (o.fat) {
      eyeMonsterFat(ctx, o);
      ctx.restore();
      return;
    }
    const dir = o.dir || 1;
    const lp = o.legPhase || 0;
    const moving = o.moving !== false;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const side of [-1, 1]) {
      const p = lp + (side > 0 ? 0 : Math.PI);
      // le pied se lève quand il part vers l'avant (dans le sens de dir), et glisse vers l'arrière posé au sol
      const sw = moving ? Math.sin(p) * dir : 0;
      const lift = moving ? Math.max(0, Math.cos(p)) * 4 : 0;
      const fx = side * 7 + sw * 7;
      ctx.strokeStyle = '#7d3a5c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(side * 6, -17);
      ctx.quadraticCurveTo(side * 11 + sw * 2, -9, fx, -3 - lift);
      ctx.stroke();
      ctx.fillStyle = '#5c2443';
      ellipsePath(ctx, fx + 3 * dir, -2.5 - lift, 6.5, 3.3);
      ctx.fill();
    }
    const cy = -33;
    const R = 19;
    const g = ctx.createRadialGradient(-6, cy - 7, 2, 0, cy, R);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.7, '#f3edf7');
    g.addColorStop(1, '#d6c4e3');
    ctx.fillStyle = g;
    circlePath(ctx, 0, cy, R);
    ctx.fill();
    ctx.strokeStyle = '#9b7fb3';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // petites veines rouges
    ctx.strokeStyle = 'rgba(214,40,64,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.27 + 0.5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(ca * R * 0.95, cy + sa * R * 0.95);
      ctx.quadraticCurveTo(ca * R * 0.75 + sa * 3, cy + sa * R * 0.75 - ca * 3, ca * R * 0.58, cy + sa * R * 0.58);
      ctx.stroke();
    }
    const lx = (o.look ? o.look.x : dir) * 7;
    const ly = (o.look ? o.look.y : 0) * 6;
    const hue = o.hue == null ? 140 : o.hue;
    const ig = ctx.createRadialGradient(lx, cy + ly, 1, lx, cy + ly, 9);
    ig.addColorStop(0, `hsl(${hue},80%,70%)`);
    ig.addColorStop(1, `hsl(${hue},70%,32%)`);
    ctx.fillStyle = ig;
    circlePath(ctx, lx, cy + ly, 8.5);
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, lx + dir * 0.5, cy + ly, o.chasing ? 2.8 : 4.6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circlePath(ctx, lx - 2.5, cy + ly - 3, 2.2);
    ctx.fill();
    // fâché : une paupière en biais, plus basse vers l'avant, qui cache le haut de l'iris
    if (o.chasing) {
      const back = cy - R * 0.55;
      const front = cy - R * 0.12;
      ctx.save();
      circlePath(ctx, 0, cy, R);
      ctx.clip();
      ctx.fillStyle = '#d58fb0';
      ctx.beginPath();
      ctx.moveTo(-R * dir, cy - R);
      ctx.lineTo(R * dir, cy - R);
      ctx.lineTo(R * dir, front);
      ctx.lineTo(-R * dir, back);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b1a33';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-R * dir, back);
      ctx.lineTo(R * dir, front);
      ctx.stroke();
      ctx.restore();
    }
    // paupière
    const lid = o.lid || 0;
    if (lid > 0) {
      ctx.save();
      circlePath(ctx, 0, cy, R);
      ctx.clip();
      ctx.fillStyle = '#d58fb0';
      ctx.fillRect(-R, cy - R, R * 2, R * 2 * lid);
      ctx.strokeStyle = '#7d3a5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-R, cy - R + R * 2 * lid);
      ctx.lineTo(R, cy - R + R * 2 * lid);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------- Rubik's cube ----------------
  const CUBE_COLORS = ['#f6f6f6', '#ffd500', '#e8202a', '#ff8a00', '#1f5fe0', '#16a34a'];

  function rubik(ctx, x, y, o) {
    ctx.save();
    ctx.translate(x + (o.shake || 0), y);
    if (o.fat) {
      rubikFat(ctx, o);
      ctx.restore();
      return;
    }
    const S = 40;
    const D = 7;
    const st = (S - 8) / 3;
    // dessus
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.moveTo(-S / 2, -S + 1);
    ctx.lineTo(-S / 2 + D, -S - D);
    ctx.lineTo(S / 2 + D, -S - D);
    ctx.lineTo(S / 2 + D, -D);
    ctx.lineTo(S / 2, 0);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = o.top[i];
      const x0 = -S / 2 + 3 + i * (st + 1);
      ctx.beginPath();
      ctx.moveTo(x0 + 1.5, -S - 1.5);
      ctx.lineTo(x0 + D - 1, -S - D + 1.5);
      ctx.lineTo(x0 + D - 1 + st - 1, -S - D + 1.5);
      ctx.lineTo(x0 + st, -S - 1.5);
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = o.side[i];
      const y0 = -S + 3 + i * (st + 1);
      ctx.beginPath();
      ctx.moveTo(S / 2 + 1.5, y0 + 1);
      ctx.lineTo(S / 2 + D - 1.5, y0 - D + 3);
      ctx.lineTo(S / 2 + D - 1.5, y0 - D + 3 + st - 1);
      ctx.lineTo(S / 2 + 1.5, y0 + st);
      ctx.closePath();
      ctx.fill();
    }
    // face avant
    ctx.fillStyle = '#111';
    roundRectPath(ctx, -S / 2, -S, S, S, 4);
    ctx.fill();
    ctx.save();
    roundRectPath(ctx, -S / 2, -S, S, S, 4);
    ctx.clip();
    for (let r = 0; r < 3; r++) {
      const shift = r === o.turnRow ? (o.turn || 0) * (st + 2) : 0;
      for (let c = -1; c < 4; c++) {
        const idx = r * 3 + ((c % 3) + 3) % 3;
        if ((c < 0 || c > 2) && !shift) continue;
        ctx.fillStyle = o.colors[idx];
        roundRectPath(ctx, -S / 2 + 3 + c * (st + 1) + shift, -S + 3 + r * (st + 1), st - 1, st - 1, 2);
        ctx.fill();
      }
    }
    ctx.restore();
    // visage
    const lx = o.look ? o.look.x * 2.5 : 0;
    const ly = o.look ? o.look.y * 2 : 0;
    for (const sx of [-8, 8]) {
      ctx.fillStyle = '#fff';
      ellipsePath(ctx, sx, -24, 5.2, 6);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#111';
      circlePath(ctx, sx + lx, -23.5 + ly, 2.6);
      ctx.fill();
    }
    const angry = o.angry || 0;
    if (angry > 0) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, -34);
      ctx.lineTo(-3, -29);
      ctx.moveTo(14, -34);
      ctx.lineTo(3, -29);
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      for (let i = 0; i <= 8; i++) ctx.lineTo(-8 + i * 2, i % 2 ? -12 : -8);
      ctx.lineTo(8, -6);
      ctx.lineTo(-8, -6);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = angry * (0.25 + 0.2 * Math.sin((o.t || 0) * 30));
      ctx.fillStyle = '#ff2a00';
      roundRectPath(ctx, -S / 2, -S, S, S, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (!o.noMouth) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -15, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------- Coccinelle ----------------
  const SPOTS = [[-12, -26], [2, -31], [12, -22], [-18, -14], [-3, -18], [8, -11], [-9, -8]];

  function ladybug(ctx, x, y, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.dir || 1, 1);
    if (o.fat) {
      ladybugFat(ctx, o);
      ctx.restore();
      return;
    }
    const t = o.t || 0;
    const lp = o.legPhase || 0;
    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (!o.fly) {
      for (let i = 0; i < 3; i++) {
        const sw = Math.sin(lp + i * 2.1) * 4;
        ctx.beginPath();
        ctx.moveTo(-12 + i * 12, -8);
        ctx.lineTo(-14 + i * 12 + sw, -3);
        ctx.lineTo(-12 + i * 12 + sw, 0);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-12 + i * 12, -8);
        ctx.lineTo(-10 + i * 12, -1 + Math.sin(t * 6 + i) * 1.5);
        ctx.stroke();
      }
    }
    // tête
    ctx.fillStyle = '#1b1b22';
    circlePath(ctx, 22, -15, 12);
    ctx.fill();
    ctx.strokeStyle = '#1b1b22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, -25);
    ctx.quadraticCurveTo(27, -36, 33, -37);
    ctx.moveTo(19, -26);
    ctx.quadraticCurveTo(19, -38, 24, -41);
    ctx.stroke();
    ctx.fillStyle = '#1b1b22';
    circlePath(ctx, 33, -37, 2.5);
    ctx.fill();
    circlePath(ctx, 24, -41, 2.5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ellipsePath(ctx, 27, -18, 4.2, 5);
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, 28.5, -17.5, 2.2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ellipsePath(ctx, 18, -19, 2.8, 3.6);
    ctx.fill();
    ctx.fillStyle = '#111';
    circlePath(ctx, 19, -18.5, 1.5);
    ctx.fill();
    if (o.angry) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(22, -26);
      ctx.lineTo(31, -22);
      ctx.stroke();
    }
    // ailes transparentes
    const open = o.open || 0;
    if (open > 0 || o.fly) {
      const flap = o.fly ? Math.sin(t * 40) * 0.5 : 0;
      ctx.save();
      ctx.translate(-6, -26);
      ctx.rotate(-0.9 - open * 0.3 + flap);
      ctx.fillStyle = 'rgba(210,230,255,0.65)';
      ctx.strokeStyle = 'rgba(120,140,180,0.8)';
      ctx.lineWidth = 1;
      ellipsePath(ctx, -14, 0, 18, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // dessous noir
    ctx.fillStyle = '#151515';
    ellipsePath(ctx, -1, -9, 25, 7);
    ctx.fill();
    // carapace rouge
    ctx.save();
    ctx.translate(-26, -8);
    ctx.rotate(-open * 0.35);
    ctx.translate(26, 8);
    const sg = ctx.createRadialGradient(-8, -28, 3, -2, -16, 30);
    sg.addColorStop(0, '#ff6a5a');
    sg.addColorStop(0.6, '#e3201b');
    sg.addColorStop(1, '#a40f10');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-27, -8);
    ctx.bezierCurveTo(-28, -30, -10, -40, 2, -38);
    ctx.bezierCurveTo(16, -36, 21, -22, 19, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a0c0c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#151515';
    const n = o.spots == null ? 7 : o.spots;
    for (let i = 0; i < n; i++) {
      circlePath(ctx, SPOTS[i][0], SPOTS[i][1], i === 1 ? 4.5 : 3.8);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipsePath(ctx, -8, -31, 6, 2.5, -0.4);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // Langue + gouttes de sueur pour les ennemis devenus gros avec les chips.
  function tiredFace(ctx, x, y, t, resting) {
    ctx.save();
    ctx.translate(x, y);
    const pant = resting ? Math.sin(t * 14) : 0;
    ctx.fillStyle = '#ff6f91';
    ctx.strokeStyle = '#c23a5e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.quadraticCurveTo(7, 10 + pant * 2, 0, 12 + pant * 2);
    ctx.quadraticCurveTo(-7, 10 + pant * 2, -5, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, 8 + pant);
    ctx.stroke();
    ctx.restore();
  }

  function sweat(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#7fd3ff';
    ctx.strokeStyle = '#2f8fd0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(4, 1, 0, 3);
    ctx.quadraticCurveTo(-4, 1, 0, -5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Caramel collant qui recouvre le bas d'un ennemi.
  function caramelGoo(ctx, x, y, w, h, t, fade) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= fade;
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, '#f2b45a');
    g.addColorStop(1, '#a8571a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 6, 0);
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const px = -w / 2 - 4 + (w + 8) * (i / n);
      const py = -h + Math.sin(i * 2.3 + t * 2) * 3 + (i % 2) * 5;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(w / 2 + 6, 0);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const dx = -w / 3 + i * (w / 3);
      const dl = 5 + ((t * 3 + i) % 2) * 3;
      ctx.beginPath();
      ctx.ellipse(dx, -h + 8 + dl, 2.5, dl / 2 + 2, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,240,200,0.6)';
    ellipsePath(ctx, -w / 4, -h + 7, w / 5, 2.2, -0.2);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Bonus ----------------
  function passionFruit(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    const g = ctx.createRadialGradient(-7, -5, 2, -3, 0, 13);
    g.addColorStop(0, '#b05bd8');
    g.addColorStop(1, '#4b1470');
    ctx.fillStyle = g;
    circlePath(ctx, -3, -1, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,255,0.35)';
    for (let i = 0; i < 9; i++) {
      circlePath(ctx, -3 + Math.cos(i * 2.4) * 8 * hash(i), -1 + Math.sin(i * 2.4) * 8 * hash(i + 3), 0.9);
      ctx.fill();
    }
    ctx.strokeStyle = '#3f7d1f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -12);
    ctx.quadraticCurveTo(-2, -17, 2, -18);
    ctx.stroke();
    ctx.fillStyle = '#5cbf3a';
    ellipsePath(ctx, -7, -15, 5, 2.5, 0.5);
    ctx.fill();
    // moitié coupée avec les graines
    ctx.fillStyle = '#5a1a7a';
    ellipsePath(ctx, 7, 5, 9.5, 8.5);
    ctx.fill();
    ctx.fillStyle = '#f6f0d8';
    ellipsePath(ctx, 7, 5, 8, 7);
    ctx.fill();
    const pg = ctx.createRadialGradient(7, 5, 1, 7, 5, 7);
    pg.addColorStop(0, '#ffe066');
    pg.addColorStop(1, '#ffb10a');
    ctx.fillStyle = pg;
    ellipsePath(ctx, 7, 5, 6.5, 5.6);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    const seeds = [[4, 3], [8, 2], [10, 6], [6, 7], [3, 6], [8, 9], [11, 3]];
    seeds.forEach(([sx, sy]) => { circlePath(ctx, sx, sy, 1.1); ctx.fill(); });
    ctx.restore();
  }

  function caramel(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    ctx.rotate(-0.12);
    const g = ctx.createLinearGradient(-10, -12, 10, 12);
    g.addColorStop(0, '#f7c46c');
    g.addColorStop(0.5, '#d98a2e');
    g.addColorStop(1, '#9c5212');
    ctx.fillStyle = g;
    roundRectPath(ctx, -12, -12, 24, 21, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.quadraticCurveTo(-7, 15, -4, 14);
    ctx.quadraticCurveTo(-3, 9, -2, 7);
    ctx.moveTo(3, 7);
    ctx.quadraticCurveTo(4, 12, 6, 11);
    ctx.quadraticCurveTo(7, 9, 8, 7);
    ctx.fillStyle = '#b8661c';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,220,0.75)';
    ellipsePath(ctx, -4, -7, 6, 2.2, -0.2);
    ctx.fill();
    circlePath(ctx, 6, -8, 1.5);
    ctx.fill();
    ctx.restore();
  }

  function caramelBlob(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 8);
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, r);
    g.addColorStop(0, '#f7c46c');
    g.addColorStop(1, '#b0601c');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * TAU;
      const rr = r * (0.85 + 0.2 * Math.sin(i * 3 + t * 20));
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,220,0.7)';
    circlePath(ctx, -r * 0.3, -r * 0.3, r * 0.25);
    ctx.fill();
    ctx.restore();
  }

  function chip(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#f7d36b';
    ctx.strokeStyle = '#c99a2e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * TAU;
      const r = 1 + 0.08 * Math.sin(i * 2.7);
      ctx.lineTo(Math.cos(a) * 9 * r, Math.sin(a) * 7 * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,150,50,0.6)';
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.quadraticCurveTo(0, -4, 6, 0);
    ctx.stroke();
    ctx.fillStyle = '#c98a2e';
    circlePath(ctx, -3, 2, 1);
    ctx.fill();
    circlePath(ctx, 3, 3, 0.8);
    ctx.fill();
    circlePath(ctx, 2, -3, 0.8);
    ctx.fill();
    ctx.restore();
  }

  function chipsBag(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    chip(ctx, -5, -12, 0.8, -0.5);
    chip(ctx, 5, -13, 0.8, 0.4);
    const g = ctx.createLinearGradient(-12, 0, 12, 0);
    g.addColorStop(0, '#1f9a4a');
    g.addColorStop(0.5, '#3fd06e');
    g.addColorStop(1, '#16803b');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-12, -9);
    for (let i = 0; i <= 8; i++) ctx.lineTo(-12 + i * 3, i % 2 ? -11 : -9);
    ctx.lineTo(11, 12);
    ctx.quadraticCurveTo(0, 15, -11, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff4c2';
    ellipsePath(ctx, 0, 2, 8, 6);
    ctx.fill();
    chip(ctx, 0, 2, 0.65, 0.2);
    ctx.fillStyle = '#1b5e2d';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VINAIGRE', 0, -3.5);
    ctx.restore();
  }

  function starShape(ctx, r, inner) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * inner : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function star(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin((t || 0) * 3) * 0.15);
    ctx.lineJoin = 'round';
    starShape(ctx, r, 0.48);
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 1, 0, 0, r);
    g.addColorStop(0, '#fffbd0');
    g.addColorStop(0.5, '#ffe02a');
    g.addColorStop(1, '#ffb300');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#e07b00';
    ctx.lineWidth = r * 0.12;
    ctx.stroke();
    ctx.fillStyle = '#3a2400';
    ellipsePath(ctx, -r * 0.18, -r * 0.08, r * 0.08, r * 0.15);
    ctx.fill();
    ellipsePath(ctx, r * 0.18, -r * 0.08, r * 0.08, r * 0.15);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Friandises à ramasser ----------------
  const CANDY_COLORS = [
    ['#ff5fa8', '#ffc2de'], ['#4fb6ff', '#c4e8ff'], ['#7ee04f', '#d6ffbf'],
    ['#ffa12e', '#ffe0b0'], ['#b06bff', '#e6ceff'], ['#ffd21f', '#fff3b0'],
  ];

  // Bonbon emballé
  function candy(ctx, x, y, s, t, v) {
    const [c1, c2] = CANDY_COLORS[(v || 0) % CANDY_COLORS.length];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin((t || 0) * 2.2 + (v || 0)) * 0.25 - 0.3);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = c2;
    ctx.strokeStyle = c1;
    ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 7, 0);
      ctx.lineTo(side * 15, -7);
      ctx.quadraticCurveTo(side * 13, 0, side * 15, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
    g.addColorStop(0, c2);
    g.addColorStop(0.45, c1);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ellipsePath(ctx, 0, 0, 9.5, 7.5);
    ctx.fill();
    ctx.save();
    ellipsePath(ctx, 0, 0, 9.5, 7.5);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 4, 9);
      ctx.lineTo(i * 5 + 4, -9);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ellipsePath(ctx, -3.5, -3.5, 3, 1.6, -0.5);
    ctx.fill();
    ctx.restore();
  }

  // Sucette en spirale
  function lollipop(ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin((t || 0) * 2) * 0.15);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#d9d9e6';
    ctx.lineWidth = 1;
    roundRectPath(ctx, -1.8, 2, 3.6, 17, 1.8);
    ctx.fill();
    ctx.stroke();
    const R = 11;
    const cols = ['#ff4f9a', '#ffd21f', '#4fb6ff', '#7ee04f', '#b06bff', '#ffa12e'];
    ctx.save();
    circlePath(ctx, 0, -6, R);
    ctx.clip();
    ctx.translate(0, -6);
    ctx.rotate((t || 0) * 1.5);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R + 1, (i / 6) * TAU, ((i + 1) / 6) * TAU);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let a = 0; a < TAU * 2.2; a += 0.2) {
      const r = 1 + a * 0.8;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    circlePath(ctx, 0, -6, R);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipsePath(ctx, -4, -11, 3.5, 2, -0.6);
    ctx.fill();
    ctx.restore();
  }

  // Balle multicolore
  function ball(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    const cols = ['#ff4f6a', '#ffd21f', '#3fc1ff', '#7ee04f', '#b06bff', '#ff9a2e'];
    ctx.save();
    circlePath(ctx, 0, 0, r);
    ctx.clip();
    ctx.rotate((t || 0) * 2);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r + 1, (i / 6) * TAU, ((i + 1) / 6) * TAU);
      ctx.closePath();
      ctx.fill();
    }
    ctx.rotate(-(t || 0) * 2);
    const sh = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
    sh.addColorStop(0, 'rgba(255,255,255,0.7)');
    sh.addColorStop(0.35, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = sh;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = '#fff';
    circlePath(ctx, 0, 0, r * 0.22);
    ctx.fill();
    ctx.restore();
  }

  function heart(ctx, x, y, s, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-9, -1, -7, -10, 0, -5);
    ctx.bezierCurveTo(7, -10, 9, -1, 0, 6);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.restore();
  }

  // Éclair au chocolat (la pâtisserie !)
  function eclair(ctx, x, y, a, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a || 0);
    ctx.scale(s || 1, s || 1);
    const g = ctx.createLinearGradient(0, -6, 0, 9);
    g.addColorStop(0, '#f0bd73');
    g.addColorStop(1, '#b8732e');
    ctx.fillStyle = g;
    roundRectPath(ctx, -24, -5, 48, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    roundRectPath(ctx, -21, -3, 42, 4, 2);
    ctx.fill();
    ctx.fillStyle = '#4a2412';
    ctx.beginPath();
    ctx.moveTo(-22, -2);
    ctx.quadraticCurveTo(-24, -9, -16, -9);
    ctx.lineTo(16, -9);
    ctx.quadraticCurveTo(24, -9, 22, -2);
    for (let i = 0; i <= 8; i++) ctx.lineTo(22 - i * 5.5, -1 + (i % 2) * 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,100,70,0.9)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.lineTo(10, -7);
    ctx.stroke();
    ctx.restore();
  }

  // Éclairs électriques (zigzags) autour d'un point. rgb : la couleur du halo, puis du trait ('r,g,b' ; jaune sinon).
  function sparks(ctx, x, y, radius, seed, alpha, rgb) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? `rgba(${rgb ? rgb[0] : '255,230,80'},${0.45 * alpha})` : `rgba(${rgb ? rgb[1] : '255,255,240'},${alpha})`;
      ctx.lineWidth = pass === 0 ? 6 : 2;
      for (let b = 0; b < 6; b++) {
        const side = b % 2 ? 1 : -1;
        let px = 0;
        let py = 0;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const len = radius * (0.5 + hash(seed + b * 7.1) * 0.5);
        const steps = 5;
        for (let i = 1; i <= steps; i++) {
          px = side * len * (i / steps);
          py = -hash(seed * 3 + b * 11 + i) * 26 * (1 - i / steps * 0.6) - (b > 3 ? 14 : 0) * (i / steps);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Le bocal à éclairs (badge de Malice) : un bocal de confiture en verre, son couvercle en tissu à carreaux rouges
  // noué d'une ficelle, et dedans n éclairs au chocolat empilés (au plus 3), qui grésillent un peu (t : le temps).
  // (x, y) : le milieu du bocal ; à la taille 1, il fait 46 de large et 62 de haut. calm : sans les étincelles (sur le badge).
  function bocal(ctx, x, y, s, n, t, calm) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // le verre, derrière (un peu bleuté)
    ctx.fillStyle = 'rgba(200,235,255,0.35)';
    roundRectPath(ctx, -21, -20, 42, 48, 11);
    ctx.fill();
    // les éclairs, du fond vers le haut
    for (let i = 0; i < Math.min(n, 3); i++) {
      const wob = Math.sin((t || 0) * 9 + i * 2.1) * 0.8;
      eclair(ctx, wob, 18 - i * 13, (i % 2 ? 0.08 : -0.08), 0.66);
    }
    if (n > 0 && !calm) {
      // ça grésille dans le bocal
      const k = Math.floor((t || 0) * 10);
      ctx.save();
      roundRectPath(ctx, -20, -19, 40, 46, 10);
      ctx.clip();
      sparks(ctx, 0, 26 - Math.min(n, 3) * 13, 16, k, 0.55);
      ctx.restore();
    }
    // le verre, devant : son bord et un reflet
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, -21, -20, 42, 48, 11);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80,120,160,0.55)';
    ctx.lineWidth = 1.2;
    roundRectPath(ctx, -22.5, -21.5, 45, 51, 12);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    roundRectPath(ctx, -16, -14, 5, 30, 2.5);
    ctx.fill();
    // le goulot, le couvercle en tissu à carreaux, la ficelle
    ctx.fillStyle = 'rgba(220,240,255,0.8)';
    roundRectPath(ctx, -17, -25, 34, 7, 3);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-22, -26);
    ctx.quadraticCurveTo(-24, -36, -12, -37);
    ctx.lineTo(12, -37);
    ctx.quadraticCurveTo(24, -36, 22, -26);
    ctx.quadraticCurveTo(16, -22, 11, -25);
    ctx.quadraticCurveTo(5, -21, 0, -25);
    ctx.quadraticCurveTo(-5, -21, -11, -25);
    ctx.quadraticCurveTo(-16, -22, -22, -26);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = 'rgba(230,40,60,0.85)';
    for (let i = -4; i <= 4; i++) ctx.fillRect(i * 6 - 1.5, -40, 3.5, 20);
    for (let j = 0; j < 3; j++) ctx.fillRect(-26, -37 + j * 6, 52, 3.5);
    ctx.restore();
    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-17, -27);
    ctx.lineTo(17, -27);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------- Bébé oiseau ----------------
  // Le bébé oiseau dans les bras de Malice (coordonnées de Malice, les pieds en 0,0).
  function heldBird(ctx, t, o) {
    ctx.save();
    ctx.translate(20, -7);
    ctx.scale(0.78, 0.78);
    babyBird(ctx, 0, 0, t, Object.assign({ noNest: true, happy: true }, o));
    ctx.restore();
  }

  const BIRD_COLORS = { light: '#a99cff', mid: '#6c5cf0', dark: '#4433b8', wing: '#5443d6', tuft: '#5a49e0' };

  function babyBird(ctx, x, y, t, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    const hop = o.happy ? Math.abs(Math.sin(t * 8)) * 8 : 0;
    // nid
    if (!o.noNest) {
      ctx.fillStyle = '#7a4a22';
      ellipsePath(ctx, 0, -6, 22, 9);
      ctx.fill();
      ctx.strokeStyle = '#a8703a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(-20 + i * 6, -10 + (i % 2) * 4);
        ctx.quadraticCurveTo(-14 + i * 6, -2, -8 + i * 6, -9 + (i % 3) * 2);
        ctx.stroke();
      }
    }
    // (le nid tout seul, quand l'oisillon s'est envolé)
    if (o.onlyNest) {
      ctx.restore();
      return;
    }
    ctx.translate(0, -hop);
    birdCore(ctx, -18, t, {
      colors: o.colors,
      flap: Math.sin(t * (o.happy ? 25 : 10)) * (o.happy ? 0.8 : 0.35),
      chirp: o.chirp,
    });
    ctx.restore();
  }

  // Le corps d'un oiseau de la famille (le bébé, ses frères et sœurs, et ses parents en plus grand).
  // o : colors, flap (battement), wing (angle des ailes, 0 = repliées), chirp (bec ouvert),
  // lashes (cils), flower (fleur sur la houppette), bushy (grosse houppette), bow (nœud papillon), joy (yeux qui sourient)
  function birdCore(ctx, bodyY, t, o) {
    const C = Object.assign({}, BIRD_COLORS, o.colors || {});
    if (o.colors && !o.colors.tuft) C.tuft = C.wing;
    // corps avec le ventre blanc
    const g = ctx.createRadialGradient(-5, bodyY - 6, 2, 0, bodyY, 15);
    g.addColorStop(0, C.light);
    g.addColorStop(0.55, C.mid);
    g.addColorStop(1, C.dark);
    ctx.fillStyle = g;
    circlePath(ctx, 0, bodyY, 13);
    ctx.fill();
    const wb = ctx.createRadialGradient(0, bodyY + 3, 1, 0, bodyY + 5, 10);
    wb.addColorStop(0, '#ffffff');
    wb.addColorStop(1, '#e4e2ff');
    ctx.fillStyle = wb;
    ellipsePath(ctx, 0, bodyY + 4, 8.5, 8);
    ctx.fill();
    ellipsePath(ctx, 0, bodyY - 3, 9.5, 6);
    ctx.fill();
    // houppette
    ctx.strokeStyle = C.tuft;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, bodyY - 12);
    ctx.quadraticCurveTo(-4, bodyY - 19, -1, bodyY - 21);
    ctx.moveTo(1, bodyY - 12);
    ctx.quadraticCurveTo(3, bodyY - 18, 7, bodyY - 18);
    if (o.bushy) {
      ctx.moveTo(-2, bodyY - 12);
      ctx.quadraticCurveTo(-8, bodyY - 16, -9, bodyY - 20);
      ctx.moveTo(0, bodyY - 12);
      ctx.quadraticCurveTo(1, bodyY - 20, 4, bodyY - 23);
    }
    ctx.stroke();
    if (o.flower) {
      // petite fleur rose sur la houppette
      ctx.fillStyle = '#ff7ab8';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3;
        circlePath(ctx, 6 + Math.cos(a) * 2.6, bodyY - 18 + Math.sin(a) * 2.6, 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe14d';
      circlePath(ctx, 6, bodyY - 18, 1.5);
      ctx.fill();
    }
    // ailes
    const wa = (o.wing || 0) + (o.flap || 0);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 11, bodyY + 2);
      ctx.rotate(side * (0.5 + wa));
      ctx.fillStyle = C.wing;
      ellipsePath(ctx, side * 3, 0, 7.5, 4.2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ellipsePath(ctx, side * 7, 0.5, 3, 2.4);
      ctx.fill();
      ctx.restore();
    }
    // yeux
    for (const side of [-1, 1]) {
      if (o.joy) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(side * 5, bodyY - 2, 2.8, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#1a1a1a';
        ellipsePath(ctx, side * 5, bodyY - 3, 2.8, 3.6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        circlePath(ctx, side * 5 + 1, bodyY - 4.5, 1.1);
        ctx.fill();
      }
      if (o.lashes) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = -0.4 - k * 0.45;
          const ax = side * (5 + Math.cos(a) * 3);
          const ay = bodyY - 3 + Math.sin(a) * 3.8;
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + side * Math.cos(a) * 2.2, ay + Math.sin(a) * 2.2);
        }
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#ffa0c8';
    ellipsePath(ctx, -8, bodyY + 3, 2.5, 1.6);
    ctx.fill();
    ellipsePath(ctx, 8, bodyY + 3, 2.5, 1.6);
    ctx.fill();
    // bec (s'ouvre pour piailler)
    const open = o.chirp ? 3 : 0.6;
    ctx.fillStyle = '#ffb21a';
    ctx.beginPath();
    ctx.moveTo(-4, bodyY + 1);
    ctx.lineTo(4, bodyY + 1);
    ctx.lineTo(0, bodyY + 1 - 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3.5, bodyY + 1 + open * 0.3);
    ctx.lineTo(3.5, bodyY + 1 + open * 0.3);
    ctx.lineTo(0, bodyY + 4 + open);
    ctx.closePath();
    ctx.fill();
    if (o.bow) {
      // nœud papillon rouge
      const by = bodyY + 9;
      ctx.fillStyle = '#e8283c';
      ctx.strokeStyle = '#8a0f1e';
      ctx.lineWidth = 0.8;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, by);
        ctx.lineTo(side * 5, by - 2.6);
        ctx.lineTo(side * 5, by + 2.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      circlePath(ctx, 0, by, 1.4);
      ctx.fill();
    }
  }

  // ---------------- Tête de lutin (sur les blocs bonus) ----------------
  function lutinFace(ctx, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    // oreilles pointues
    ctx.fillStyle = '#ffcfa8';
    ctx.strokeStyle = '#8a4a2a';
    ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 8, 0);
      ctx.lineTo(side * 17, -6);
      ctx.lineTo(side * 9, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd7b5';
    circlePath(ctx, 0, 2, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a1a10';
    circlePath(ctx, -3.6, 1, 1.6);
    ctx.fill();
    circlePath(ctx, 3.6, 1, 1.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,110,110,0.55)';
    circlePath(ctx, -6, 5, 2.2);
    ctx.fill();
    circlePath(ctx, 6, 5, 2.2);
    ctx.fill();
    ctx.strokeStyle = '#7a2a1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 5, 3.5, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.fillStyle = '#ffbe94';
    circlePath(ctx, 0, 3.5, 1.8);
    ctx.fill();
    // chapeau pointu
    ctx.fillStyle = '#2fae4f';
    ctx.strokeStyle = '#17652a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -5);
    ctx.quadraticCurveTo(-4, -14, 3, -24);
    ctx.quadraticCurveTo(12, -22, 14, -17);
    ctx.quadraticCurveTo(7, -14, 11, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8312f';
    roundRectPath(ctx, -12, -7, 24, 4.5, 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circlePath(ctx, 15, -17, 3.4);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Badges ----------------
  // La moustache de Malice qui s'allonge comme une corde jusqu'à l'anneau.
  function mustacheRope(ctx, x0, y0, x1, y1, t, attached) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const n = Math.max(6, Math.floor(d / 8));
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#1c1717';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const wob = Math.sin(k * d / 8 + t * 10 * side) * 2.4 * side * Math.sin(k * Math.PI) + side * 1.2;
        const px = x0 + dx * k + nx * wob;
        const py = y0 + dy * k + ny * wob;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + nx * 1.5, y0 + ny * 1.5);
    ctx.lineTo(x1 + nx * 1.5, y1 + ny * 1.5);
    ctx.stroke();
    // bouclettes au bout
    ctx.strokeStyle = '#1c1717';
    ctx.lineWidth = 3.2;
    const a0 = Math.atan2(dy, dx);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      if (attached) ctx.arc(x1, y1, 11, a0 + Math.PI + side * 0.3, a0 + Math.PI + side * 2.6, side < 0);
      else ctx.arc(x1 + nx * side * 4, y1 + ny * side * 4, 4, a0 - 1, a0 + 2.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Anneau doré où la moustache peut s'accrocher.
  function anchorRing(ctx, x, y, t, o) {
    ctx.save();
    ctx.translate(x, y);
    if (o.glow) {
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
      g.addColorStop(0, `rgba(255,240,150,${0.35 + 0.15 * Math.sin(t * 4)})`);
      g.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = g;
      circlePath(ctx, 0, 0, 34);
      ctx.fill();
    }
    if (o.targeted) {
      ctx.save();
      ctx.rotate(t * 2);
      ctx.strokeStyle = '#7ff0ff';
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 6]);
      circlePath(ctx, 0, 0, 22 + Math.sin(t * 8) * 2);
      ctx.stroke();
      ctx.restore();
    }
    // petite attache
    ctx.fillStyle = '#9a6a1a';
    roundRectPath(ctx, -5, -21, 10, 7, 2);
    ctx.fill();
    // l'anneau
    const rg = ctx.createLinearGradient(-14, -14, 14, 14);
    rg.addColorStop(0, '#fff3a0');
    rg.addColorStop(0.5, '#ffc21f');
    rg.addColorStop(1, '#c07a00');
    ctx.strokeStyle = '#8a5200';
    ctx.lineWidth = 9;
    circlePath(ctx, 0, 0, 12);
    ctx.stroke();
    ctx.strokeStyle = rg;
    ctx.lineWidth = 6.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, -2.6, -1.4);
    ctx.stroke();
    if (o.flash > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${o.flash * 2.5})`;
      ctx.lineWidth = 3;
      circlePath(ctx, 0, 0, 12 + (0.35 - o.flash) * 60);
      ctx.stroke();
    }
    ctx.restore();
  }

  const BADGE_COLORS = { saut: ['#7fd0ff', '#2a7de0'], grappin: ['#d6a6ff', '#7a3ad8'], roulade: ['#b8f07a', '#3fa84a'], bocal: ['#ffd88a', '#e07a1e'] };

  // Médaille de badge avec ses rubans.
  function badge(ctx, x, y, r, kind, t) {
    const [c1, c2] = BADGE_COLORS[kind] || BADGE_COLORS.saut;
    ctx.save();
    ctx.translate(x, y);
    // rubans
    for (const side of [-1, 1]) {
      ctx.fillStyle = side < 0 ? '#ff4f9a' : '#7ff0ff';
      ctx.beginPath();
      ctx.moveTo(side * r * 0.2, r * 0.3);
      ctx.lineTo(side * r * 0.75, r * 1.45);
      ctx.lineTo(side * r * 0.45, r * 1.25);
      ctx.lineTo(side * r * 0.25, r * 1.5);
      ctx.lineTo(side * r * -0.1, r * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    // bord doré festonné
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * TAU;
      const rr = r * (i % 2 ? 0.92 : 1);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    const gg = ctx.createLinearGradient(-r, -r, r, r);
    gg.addColorStop(0, '#fff3a0');
    gg.addColorStop(0.5, '#ffc21f');
    gg.addColorStop(1, '#c47a00');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.strokeStyle = '#8a5200';
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.stroke();
    const ig = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 1, 0, 0, r * 0.75);
    ig.addColorStop(0, c1);
    ig.addColorStop(1, c2);
    ctx.fillStyle = ig;
    circlePath(ctx, 0, 0, r * 0.74);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.stroke();
    ctx.save();
    ctx.scale(r / 30, r / 30);
    if (kind === 'roulade') {
      // une boule rose qui roule (une flèche tourne autour), et des traits de vitesse derrière
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      for (const yy of [-6, 1, 8]) {
        ctx.beginPath();
        ctx.moveTo(-19, yy);
        ctx.lineTo(-12 + Math.abs(yy) * 0.3, yy);
        ctx.stroke();
      }
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(3, 1, 13, -2.6, 1.9);
      ctx.stroke();
      const ax = 3 + Math.cos(1.9) * 13;
      const ay = 1 + Math.sin(1.9) * 13;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(ax - 7, ay - 1);
      ctx.lineTo(ax + 4, ay - 6);
      ctx.lineTo(ax + 3, ay + 6);
      ctx.closePath();
      ctx.fill();
      const bg = ctx.createRadialGradient(0, -2, 1, 3, 1, 8);
      bg.addColorStop(0, '#ffd0e6');
      bg.addColorStop(1, '#ff3d8f');
      ctx.fillStyle = bg;
      circlePath(ctx, 3, 1, 7.5);
      ctx.fill();
      ctx.strokeStyle = '#a0145a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, 0.5, -2, 2);
      ctx.fill();
    } else if (kind === 'bocal') {
      // le bocal, avec un éclair au chocolat dedans, et un éclair électrique qui en sort
      ctx.strokeStyle = '#fff59a';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(10, -20);
      ctx.lineTo(16, -13);
      ctx.lineTo(12, -11);
      ctx.lineTo(19, -3);
      ctx.stroke();
      bocal(ctx, -2, 4, 0.5, 1, 0, true);
    } else if (kind === 'grappin') {
      // une moustache accrochée à un anneau
      ctx.strokeStyle = '#ffc21f';
      ctx.lineWidth = 4;
      circlePath(ctx, 0, -10, 6);
      ctx.stroke();
      ctx.strokeStyle = '#1c1717';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.quadraticCurveTo(-3, 0, 0, 3);
      ctx.stroke();
      ctx.fillStyle = '#1c1717';
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.bezierCurveTo(5, 0, 13, 1, 15, 6);
      ctx.bezierCurveTo(16, 9, 18, 7, 18, 4);
      ctx.bezierCurveTo(20, 11, 12, 13, 7, 11);
      ctx.bezierCurveTo(4, 10, 2, 11, 0, 10);
      ctx.bezierCurveTo(-2, 11, -4, 10, -7, 11);
      ctx.bezierCurveTo(-12, 13, -20, 11, -18, 4);
      ctx.bezierCurveTo(-18, 7, -16, 9, -15, 6);
      ctx.bezierCurveTo(-13, 1, -5, 0, 0, 3);
      ctx.fill();
    } else {
      // flèches vers le haut + ressort
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const yy of [-12, -2]) {
        ctx.beginPath();
        ctx.moveTo(-9, yy + 7);
        ctx.lineTo(0, yy - 2);
        ctx.lineTo(9, yy + 7);
        ctx.stroke();
      }
      ctx.strokeStyle = '#ffe14d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, 18);
      for (let i = 0; i < 5; i++) ctx.lineTo(i % 2 ? -8 : 8, 15 - i * 2.2);
      ctx.stroke();
    }
    ctx.restore();
    // reflet qui passe
    const sh = ((t || 0) * 0.8) % 2.5;
    if (sh < 1) {
      ctx.save();
      circlePath(ctx, 0, 0, r * 0.95);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      const sx = -r * 1.6 + sh * r * 3.2;
      ctx.beginPath();
      ctx.moveTo(sx, -r);
      ctx.lineTo(sx + r * 0.35, -r);
      ctx.lineTo(sx - r * 0.25, r);
      ctx.lineTo(sx - r * 0.6, r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------- Drapeaux ----------------
  function flag(ctx, x, y, h, t, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6b6b78';
    roundRectPath(ctx, -2.5, -h, 5, h, 2);
    ctx.fill();
    ctx.fillStyle = o.ball || '#ffd23a';
    circlePath(ctx, 0, -h - 4, 5);
    ctx.fill();
    // cloth < 1 : le tissu rapetisse en tournoyant (il est en train de devenir un papillon)
    const cloth = o.cloth == null ? 1 : o.cloth;
    if (cloth <= 0) {
      ctx.restore();
      return;
    }
    const fy = -h + 4 + (o.lower || 0);
    const fw = o.w || 34;
    const fh = o.fh || 22;
    if (cloth < 1) {
      ctx.translate(2 + fw / 2, fy + fh / 2);
      ctx.rotate((1 - cloth) * 4);
      ctx.scale(cloth, cloth);
      ctx.translate(-2 - fw / 2, -fy - fh / 2);
    }
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.moveTo(2, fy);
    for (let i = 0; i <= 8; i++) {
      const px = 2 + (fw * i) / 8;
      ctx.lineTo(px, fy + Math.sin(t * 6 - i * 0.7) * 2.5 * (i / 8));
    }
    for (let i = 8; i >= 0; i--) {
      const px = 2 + (fw * i) / 8;
      ctx.lineTo(px, fy + fh + Math.sin(t * 6 - i * 0.7) * 2.5 * (i / 8) - (i / 8) * fh * 0.15);
    }
    ctx.closePath();
    ctx.fill();
    if (o.emblem) o.emblem(ctx, 2 + fw * 0.45, fy + fh * 0.5);
    ctx.restore();
  }

  // ---------------- Papillon ----------------
  // Le papillon qui sort d'un drapeau, vu de face (il a une petite moustache, comme Malice).
  // open : 1 = ailes grandes ouvertes, 0 = repliées ; look : -1..1, où il regarde ; star : étoiles sur les ailes.
  function butterfly(ctx, x, y, s, t, o) {
    o = o || {};
    const open = o.open == null ? 1 : o.open;
    const line = o.line || '#9a1a56';
    const spot = o.spot || '#ffe14d';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * (0.1 + 0.9 * open), 1);
      // aile du bas
      ctx.beginPath();
      ctx.moveTo(1, 2);
      ctx.bezierCurveTo(9, 1, 19, 6, 17, 14);
      ctx.bezierCurveTo(15, 21, 5, 21, 1, 9);
      ctx.closePath();
      paint(ctx, o.color2 || '#ff9fcd', line, 1.5);
      ctx.fillStyle = spot;
      circlePath(ctx, 10, 12, 2.8);
      ctx.fill();
      // aile du haut
      ctx.beginPath();
      ctx.moveTo(1, 3);
      ctx.bezierCurveTo(1, -9, 13, -22, 22, -18);
      ctx.bezierCurveTo(30, -14, 26, -1, 1, 5);
      ctx.closePath();
      paint(ctx, o.color || '#ff4f9a', line, 1.5);
      if (o.star) {
        ctx.save();
        ctx.translate(15, -9);
        starShape(ctx, 6.5, 0.45);
        paint(ctx, spot, '#c98a00', 1);
        ctx.restore();
      } else {
        ctx.fillStyle = spot;
        circlePath(ctx, 15, -9, 4.6);
        ctx.fill();
        circlePath(ctx, 22, -14, 1.9);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      circlePath(ctx, 13.5, -10.5, 1.5);
      ctx.fill();
      ctx.restore();
    }
    // corps
    ellipsePath(ctx, 0, 6, 3.3, 10);
    paint(ctx, '#7a4a8c', '#3e1f4a', 1.2);
    // antennes
    ctx.strokeStyle = '#3e1f4a';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 2, -12);
      ctx.quadraticCurveTo(side * 3.5, -19, side * 8, -21);
      ctx.stroke();
      ctx.fillStyle = spot;
      circlePath(ctx, side * 8, -21, 1.9);
      ctx.fill();
    }
    // tête
    circlePath(ctx, 0, -8, 6);
    paint(ctx, '#b48ad0', '#5e3a78', 1.2);
    ctx.fillStyle = 'rgba(255,143,168,0.7)';
    circlePath(ctx, -4, -5.8, 1.4);
    ctx.fill();
    circlePath(ctx, 4, -5.8, 1.4);
    ctx.fill();
    // yeux (ils clignent de temps en temps)
    const look = clamp(o.look || 0, -1, 1) * 0.6;
    if ((t % 3.7) < 0.12) {
      ctx.strokeStyle = '#14213d';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-3.8, -9); ctx.lineTo(-0.9, -9);
      ctx.moveTo(0.9, -9); ctx.lineTo(3.8, -9);
      ctx.stroke();
    } else {
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#fff';
        ellipsePath(ctx, side * 2.3, -9.2, 1.9, 2.4);
        ctx.fill();
        ctx.fillStyle = '#14213d';
        circlePath(ctx, side * 2.3 + look, -8.9, 1.2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        circlePath(ctx, side * 2.3 + look + 0.4, -9.4, 0.4);
        ctx.fill();
      }
    }
    // petite moustache noire aux pointes relevées
    ctx.fillStyle = MALICE.mustache;
    ctx.beginPath();
    ctx.moveTo(0, -6.2);
    ctx.bezierCurveTo(-1.8, -7.2, -4.4, -6.8, -5.6, -5.6);
    ctx.bezierCurveTo(-4.4, -4.4, -1.8, -3.8, 0, -4.8);
    ctx.bezierCurveTo(1.8, -3.8, 4.4, -4.4, 5.6, -5.6);
    ctx.bezierCurveTo(4.4, -6.8, 1.8, -7.2, 0, -6.2);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- Chauve-souris (la grotte) ----------------
  // Boîte 40 × 30. Endormie : suspendue la tête en bas au plafond, enroulée dans ses ailes.
  function bat(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.dir || 1, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (o.fat) batFat(ctx, o);
    else if (o.sleep) batAsleep(ctx, t, o.dir || 1);
    else batAwake(ctx, o, t);
    ctx.restore();
  }

  function batEar(ctx, side, x, y, len, down) {
    const s = down ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x - side * 4.5, y);
    ctx.quadraticCurveTo(x + side * 1, y + s * len * 0.9, x + side * 3, y + s * len);
    ctx.quadraticCurveTo(x + side * 6.5, y + s * len * 0.4, x + side * 5, y);
    ctx.closePath();
    paint(ctx, '#6a3fb0', '#2e1352', 1.3);
    ctx.beginPath();
    ctx.moveTo(x - side * 1.5, y + s * 1);
    ctx.quadraticCurveTo(x + side * 1.5, y + s * len * 0.75, x + side * 2.8, y + s * len * 0.8);
    ctx.quadraticCurveTo(x + side * 4.2, y + s * len * 0.4, x + side * 3, y + s * 1);
    ctx.closePath();
    ctx.fillStyle = '#ff9fcf';
    ctx.fill();
  }

  function batBodyGrad(ctx, cx, cy, r) {
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, 1, cx, cy, r * 1.1);
    g.addColorStop(0, '#b48cff');
    g.addColorStop(0.6, '#7a4ad0');
    g.addColorStop(1, '#4a248a');
    return g;
  }

  function batWing(ctx, side, flap, span) {
    // aile en forme de parapluie, avec des « doigts » et un bord festonné
    ctx.save();
    ctx.translate(side * 7, -17);
    ctx.rotate(side * flap);
    const W = span;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.quadraticCurveTo(side * W * 0.5, -12, side * W, -6);
    ctx.quadraticCurveTo(side * W * 0.9, 1, side * W * 0.78, 4);
    ctx.quadraticCurveTo(side * W * 0.66, -1, side * W * 0.52, 5);
    ctx.quadraticCurveTo(side * W * 0.4, 0, side * W * 0.26, 6);
    ctx.quadraticCurveTo(side * W * 0.13, 1, 0, 6);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -10, 0, 6);
    g.addColorStop(0, '#6a3cb8');
    g.addColorStop(1, '#3d1a73');
    paint(ctx, g, '#22093f', 1.3);
    ctx.strokeStyle = 'rgba(200,160,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const k of [0.26, 0.52, 0.78]) {
      ctx.moveTo(side * 2, -2);
      ctx.lineTo(side * W * k, k === 0.78 ? 3 : 4);
    }
    ctx.stroke();
    ctx.restore();
  }

  function batEyes(ctx, cx, cy, angry, closed) {
    for (const side of [-1, 1]) {
      const ex = cx + side * 5;
      if (closed) {
        ctx.strokeStyle = '#1c0a33';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ex, cy, 2.6, 0.2, Math.PI - 0.2);
        ctx.stroke();
        continue;
      }
      ellipsePath(ctx, ex, cy, 4.4, 5);
      paint(ctx, '#ffffff', '#2e1352', 1);
      ctx.fillStyle = '#1c0a33';
      ellipsePath(ctx, ex + 1.3, cy + 0.6, 2.6, 3.2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, ex + 0.3, cy - 1.2, 1.1);
      ctx.fill();
      if (angry) {
        ctx.strokeStyle = '#1c0a33';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ex - side * 4.5 + 1, cy - 7);
        ctx.lineTo(ex + side * 3 + 1, cy - 4.5);
        ctx.stroke();
      }
    }
  }

  function batFangs(ctx, cx, cy, open) {
    ctx.strokeStyle = '#2e1352';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - 3.5, cy);
    ctx.quadraticCurveTo(cx, cy + 2 + open, cx + 3.5, cy);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (const fx of [cx - 2, cx + 2]) {
      ctx.beginPath();
      ctx.moveTo(fx - 1.2, cy + 0.6);
      ctx.lineTo(fx, cy + 3.4);
      ctx.lineTo(fx + 1.2, cy + 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  function batAwake(ctx, o, t) {
    const flap = Math.sin(o.flap || 0);
    batWing(ctx, -1, -0.25 + flap * 0.55, 21);
    batWing(ctx, 1, -0.25 + flap * 0.55, 21);
    // petites pattes
    ctx.strokeStyle = '#2e1352';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-3, -6);
    ctx.lineTo(-4, -2);
    ctx.moveTo(3, -6);
    ctx.lineTo(4, -2);
    ctx.stroke();
    batEar(ctx, -1, -6, -24, 9, false);
    batEar(ctx, 1, 6, -24, 9, false);
    circlePath(ctx, 0, -15, 11);
    paint(ctx, batBodyGrad(ctx, 0, -15, 11), '#2e1352', 1.4);
    ellipsePath(ctx, 0, -10.5, 6.5, 5);
    ctx.fillStyle = '#e8d8ff';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipsePath(ctx, -5, -22, 3.5, 1.8, -0.5);
    ctx.fill();
    batEyes(ctx, 2, -17, o.angry, false);
    batFangs(ctx, 3, -10.5, o.angry ? 1.5 : 0);
    ctx.fillStyle = 'rgba(255,120,190,0.6)';
    ellipsePath(ctx, -5, -12, 2.2, 1.3);
    ctx.fill();
    ellipsePath(ctx, 10, -12, 2, 1.3);
    ctx.fill();
  }

  function batAsleep(ctx, t, dir) {
    const sway = Math.sin(t * 1.6) * 0.06;
    ctx.save();
    ctx.translate(0, -30);
    ctx.rotate(sway);
    // griffes accrochées au plafond
    ctx.strokeStyle = '#2e1352';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(3, 4);
    ctx.lineTo(3, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
    // oreilles vers le bas (la tête est en bas)
    batEar(ctx, -1, -5, 22, 7, true);
    batEar(ctx, 1, 5, 22, 7, true);
    // ailes enroulées comme un petit cocon
    ellipsePath(ctx, 0, 13, 10.5, 12);
    paint(ctx, batBodyGrad(ctx, 0, 13, 12), '#2e1352', 1.4);
    ctx.beginPath();
    ctx.moveTo(-10, 6);
    ctx.quadraticCurveTo(-12, 16, -4, 23);
    ctx.quadraticCurveTo(-2, 14, -10, 6);
    ctx.moveTo(10, 6);
    ctx.quadraticCurveTo(12, 16, 4, 23);
    ctx.quadraticCurveTo(2, 14, 10, 6);
    paint(ctx, '#4a2088', '#22093f', 1.1);
    // visage tête en bas : yeux fermés
    ellipsePath(ctx, 0, 17.5, 7, 5);
    ctx.fillStyle = '#c9a8ff';
    ctx.fill();
    ctx.save();
    ctx.translate(0, 17);
    ctx.scale(1, -1);
    batEyes(ctx, 0, 0, false, true);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ellipsePath(ctx, -4, 6, 3, 1.6, 0.4);
    ctx.fill();
    ctx.restore();
    // un petit « z »
    const k = (t * 0.6) % 1;
    ctx.save();
    ctx.scale(dir, 1);
    ctx.globalAlpha *= 1 - k;
    ctx.fillStyle = '#d8c4ff';
    ctx.font = `700 ${8 + k * 6}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('z', 13 + k * 6, -10 - k * 12);
    ctx.restore();
  }

  function batFat(ctx, o) {
    const t = o.t || 0;
    const flap = Math.sin(t * 6) * 0.25;
    batWing(ctx, -1, 0.6 + flap, 12);
    batWing(ctx, 1, 0.6 + flap, 12);
    ctx.fillStyle = '#2e1352';
    for (const s of [-1, 1]) {
      ellipsePath(ctx, s * 6, -1.8, 4.5, 2.4);
      ctx.fill();
    }
    batEar(ctx, -1, -8, -25, 8, false);
    batEar(ctx, 1, 8, -25, 8, false);
    ellipsePath(ctx, 0, -14, 17, 14);
    paint(ctx, batBodyGrad(ctx, 0, -14, 15), '#2e1352', 1.5);
    ellipsePath(ctx, 0, -8, 11, 6.5);
    ctx.fillStyle = '#e8d8ff';
    ctx.fill();
    chubbyCheeks(ctx, 11, -11, 5.5, 4.5, '#c79cff', '#5a2aa0');
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipsePath(ctx, -7, -23, 4, 2, -0.5);
    ctx.fill();
    for (const side of [-1, 1]) {
      ellipsePath(ctx, 2 + side * 5, -18, 3.4, o.rest ? 2.2 : 3.4);
      paint(ctx, '#ffffff', '#2e1352', 1);
      ctx.fillStyle = '#1c0a33';
      circlePath(ctx, 3 + side * 5, -17.6, 1.6);
      ctx.fill();
    }
    fatMouth(ctx, 3, -10, o.rest);
  }

  // ---------------- Oiseau grincheux (la montagne des nuages) ----------------
  // Boîte 44 × 34 : un gros oiseau orange tout rond, avec de gros sourcils fâchés.
  function grumpyBird(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.dir || 1, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const fat = !!o.fat;
    const R = fat ? 18 : 14.5;
    const cy = fat ? -18 : -17;
    const flap = fat ? Math.sin(t * 5) * 0.2 : Math.sin(o.flap || 0);
    const wing = (front) => {
      ctx.save();
      ctx.translate(front ? -2 : 2, cy - 2);
      ctx.rotate(front ? -0.3 + flap * 0.9 : -0.6 + flap * 0.9);
      ellipsePath(ctx, -10, 0, 12, 6.5, 0.2);
      paint(ctx, front ? '#e8641e' : '#c44e14', '#7a2a08', 1.3);
      ctx.strokeStyle = 'rgba(122,42,8,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-18, 1);
      ctx.lineTo(-10, 0);
      ctx.moveTo(-17, 4);
      ctx.lineTo(-9, 2.5);
      ctx.stroke();
      ctx.restore();
    };
    wing(false);
    // plumes de la queue
    ctx.fillStyle = '#c44e14';
    ctx.strokeStyle = '#7a2a08';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-R - 2, cy + 2 + (i - 1) * 4, 7, 2.6, (i - 1) * 0.35, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    // pattes repliées
    ctx.strokeStyle = '#ffb21a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, cy + R - 1);
    ctx.lineTo(-5, cy + R + 3);
    ctx.moveTo(3, cy + R - 1);
    ctx.lineTo(1, cy + R + 3);
    ctx.stroke();
    // corps rond
    const g = ctx.createRadialGradient(-5, cy - 7, 2, 0, cy, R * 1.1);
    g.addColorStop(0, '#ffc08a');
    g.addColorStop(0.55, '#ff8a3a');
    g.addColorStop(1, '#d4581a');
    ellipsePath(ctx, 0, cy, fat ? R * 1.12 : R, R);
    paint(ctx, g, '#7a2a08', 1.4);
    ellipsePath(ctx, 2, cy + 5, R * 0.62, R * 0.55);
    ctx.fillStyle = '#fff1d6';
    ctx.fill();
    // petite houppette en pétard
    ctx.strokeStyle = '#d4581a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(1, cy - R + 1);
    ctx.lineTo(-2, cy - R - 6);
    ctx.moveTo(3, cy - R + 1);
    ctx.lineTo(4, cy - R - 6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ellipsePath(ctx, -6, cy - R * 0.6, 4, 2, -0.5);
    ctx.fill();
    if (fat) chubbyCheeks(ctx, 12, cy + 6, 5, 4, '#ffb08a', '#b04a18');
    // yeux plissés et gros sourcils fâchés
    for (const side of [-1, 1]) {
      const ex = 6 + side * 4.6;
      const ey = cy - 3;
      ellipsePath(ctx, ex, ey, 3.6, fat && o.rest ? 2.2 : 3.8);
      paint(ctx, '#ffffff', '#5a1f04', 1);
      ctx.fillStyle = '#1a0a02';
      circlePath(ctx, ex + 1.2, ey + 0.6, 1.8);
      ctx.fill();
      ctx.strokeStyle = '#3a1404';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(ex - side * 4 - 0.5, ey - 6.5 + (side > 0 ? 0 : 0));
      ctx.lineTo(ex + side * 3.5 - 0.5, ey - 3.6);
      ctx.stroke();
    }
    // bec boudeur
    const bx = 6 + R * 0.6;
    const by = cy + 3;
    const open = fat && o.rest ? 3 : 0;
    ctx.beginPath();
    ctx.moveTo(bx - 3, by - 3.5);
    ctx.quadraticCurveTo(bx + 4, by - 3.5, bx + 7, by - 0.5);
    ctx.lineTo(bx - 2, by);
    ctx.closePath();
    paint(ctx, '#ffc21a', '#9a5a00', 1.1);
    ctx.beginPath();
    ctx.moveTo(bx - 2, by + 0.5 + open);
    ctx.quadraticCurveTo(bx + 4, by + 0.5 + open, bx + 5, by + 2.5 + open * 0.5);
    ctx.quadraticCurveTo(bx, by + 4 + open, bx - 2.5, by + 2 + open);
    ctx.closePath();
    paint(ctx, '#ffb000', '#9a5a00', 1.1);
    wing(true);
    ctx.restore();
  }

  // ---------------- Ourson en gélatine (le monde des bonbons) ----------------
  // Boîte 34 × 40. squash > 0 : tout aplati en retombant ; < 0 : tout étiré en l'air.
  function gummyBear(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const hue = o.hue == null ? 0 : o.hue;
    const sq = clamp(o.squash || 0, -0.4, 0.4);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.dir || 1) * (1 + sq), 1 - sq);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const fat = !!o.fat;
    const bw = fat ? 16 : 11.5;
    const line = `hsla(${hue},75%,30%,0.9)`;
    const jelly = (cx, cy, rx, ry) => {
      const g = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, 1, cx, cy, Math.max(rx, ry) * 1.15);
      g.addColorStop(0, `hsla(${hue},100%,82%,0.92)`);
      g.addColorStop(0.55, `hsla(${hue},90%,58%,0.85)`);
      g.addColorStop(1, `hsla(${hue},85%,40%,0.9)`);
      ellipsePath(ctx, cx, cy, rx, ry);
      paint(ctx, g, line, 1.3);
    };
    // pieds, corps, bras
    jelly(-6, -4, 5.5, 4);
    jelly(6, -4, 5.5, 4);
    jelly(0, -13, bw, fat ? 11 : 10);
    // ventre plus clair (on voit à travers la gélatine)
    ctx.fillStyle = `hsla(${hue},100%,88%,0.45)`;
    ellipsePath(ctx, 0, -12, bw * 0.55, 6);
    ctx.fill();
    const wave = Math.sin(t * 6) * 0.25;
    jelly(-bw - 1, -16, 3.6, 5.5 + wave);
    jelly(bw + 1, -16, 3.6, 5.5 - wave);
    // tête et oreilles
    jelly(-8, -36, 4.2, 4.2);
    jelly(8, -36, 4.2, 4.2);
    jelly(0, -29, fat ? 13 : 11, 9.5);
    // reflets brillants
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipsePath(ctx, -5, -34, 3.2, 1.6, -0.5);
    ctx.fill();
    ellipsePath(ctx, -bw * 0.5, -19, 2.4, 1.3, -0.5);
    ctx.fill();
    // museau et visage
    ctx.fillStyle = `hsla(${hue},100%,85%,0.7)`;
    ellipsePath(ctx, 2, -26, 5, 3.6);
    ctx.fill();
    if (fat) chubbyCheeks(ctx, 10, -25, 4, 3.4, `hsla(${hue},100%,75%,0.9)`, line);
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#2a0a14';
      ellipsePath(ctx, 2 + side * 4.5, -31, 1.7, fat && o.rest ? 1 : 2.3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      circlePath(ctx, 2.6 + side * 4.5, -31.8, 0.7);
      ctx.fill();
    }
    ctx.fillStyle = '#2a0a14';
    ellipsePath(ctx, 2.5, -27.5, 1.8, 1.2);
    ctx.fill();
    if (fat) {
      fatMouth(ctx, 2.5, -23.5, o.rest);
    } else {
      ctx.strokeStyle = '#2a0a14';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(1, -25, 1.8, 0.2, Math.PI - 0.4);
      ctx.arc(4, -25, 1.8, 0.4, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------- Œil bonbon (gentil : il donne une vie) ----------------
  // Boîte 32 × 34 : une boule de bonbon rayée avec un grand œil tout doux et des petites jambes.
  function candyEye(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const hue = o.hue == null ? 320 : o.hue;
    const dir = o.dir || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // petites jambes et chaussures
    const lp = o.legPhase || 0;
    for (const side of [-1, 1]) {
      const p = lp + (side > 0 ? 0 : Math.PI);
      const sw = o.moving ? Math.sin(p) * 4 : 0;
      const lift = o.moving ? Math.max(0, -Math.cos(p)) * 3 : 0;
      ctx.strokeStyle = `hsl(${hue},45%,35%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(side * 5, -7);
      ctx.lineTo(side * 5 + sw, -2.5 - lift);
      ctx.stroke();
      ellipsePath(ctx, side * 5 + sw + dir * 1.8, -2 - lift, 4.5, 2.6);
      paint(ctx, '#ffffff', `hsl(${hue},45%,35%)`, 1);
    }
    const cy = -19;
    const R = 14;
    // la boule de bonbon, avec des tourbillons de couleurs
    ctx.save();
    circlePath(ctx, 0, cy, R);
    ctx.clip();
    ctx.fillStyle = `hsl(${hue},90%,72%)`;
    ctx.fillRect(-R, cy - R, R * 2, R * 2);
    const cols = [`hsl(${(hue + 60) % 360},95%,70%)`, '#ffffff', `hsl(${(hue + 180) % 360},85%,68%)`, '#ffffff'];
    const rot = t * 0.6 * dir;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = cols[i % 4];
      ctx.beginPath();
      const a0 = rot + (i / 8) * TAU;
      ctx.moveTo(0, cy);
      for (let k = 0; k <= 6; k++) {
        const rr = (k / 6) * R * 1.1;
        ctx.lineTo(Math.cos(a0 + k * 0.28) * rr, cy + Math.sin(a0 + k * 0.28) * rr);
      }
      for (let k = 6; k >= 0; k--) {
        const rr = (k / 6) * R * 1.1;
        ctx.lineTo(Math.cos(a0 + 0.32 + k * 0.28) * rr, cy + Math.sin(a0 + 0.32 + k * 0.28) * rr);
      }
      ctx.closePath();
      ctx.globalAlpha = i % 2 ? 0.85 : 0.6;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const sh = ctx.createRadialGradient(-5, cy - 6, 1, 0, cy, R);
    sh.addColorStop(0, 'rgba(255,255,255,0.5)');
    sh.addColorStop(0.6, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(80,0,60,0.25)');
    ctx.fillStyle = sh;
    ctx.fillRect(-R, cy - R, R * 2, R * 2);
    ctx.restore();
    circlePath(ctx, 0, cy, R);
    ctx.strokeStyle = `hsl(${hue},50%,40%)`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // petit cœur brillant
    ctx.save();
    ctx.translate(-8, cy - 7);
    ctx.scale(0.42, 0.42);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-8, -2, -4, -9, 0, -4);
    ctx.bezierCurveTo(4, -9, 8, -2, 0, 4);
    ctx.fill();
    ctx.restore();
    // le grand œil tout doux
    const ex = dir * 2;
    const ey = cy - 1;
    const ER = o.scared ? 8.8 : 7.8;
    circlePath(ctx, ex, ey, ER);
    paint(ctx, '#ffffff', `hsl(${hue},45%,35%)`, 1.2);
    const lx = (o.look ? o.look.x : dir) * 2.6;
    const ly = (o.look ? o.look.y : 0) * 2.2;
    const ig = ctx.createRadialGradient(ex + lx, ey + ly, 0.5, ex + lx, ey + ly, 5.5);
    ig.addColorStop(0, '#9fe0ff');
    ig.addColorStop(1, '#2a7de0');
    ctx.fillStyle = ig;
    circlePath(ctx, ex + lx, ey + ly, o.scared ? 3.6 : 5.2);
    ctx.fill();
    ctx.fillStyle = '#14213d';
    circlePath(ctx, ex + lx, ey + ly, o.scared ? 1.5 : 2.6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circlePath(ctx, ex + lx - 1.8, ey + ly - 1.8, o.scared ? 1 : 1.8);
    ctx.fill();
    circlePath(ctx, ex + lx + 1.5, ey + ly + 1.6, 0.8);
    ctx.fill();
    if (o.tired) {
      // paupière à moitié fermée
      ctx.save();
      circlePath(ctx, ex, ey, ER);
      ctx.clip();
      ctx.fillStyle = `hsl(${hue},80%,70%)`;
      ctx.fillRect(ex - ER, ey - ER, ER * 2, ER * 0.95);
      ctx.restore();
      ctx.strokeStyle = `hsl(${hue},45%,35%)`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ex - ER + 0.5, ey - ER * 0.05);
      ctx.quadraticCurveTo(ex, ey + 1.5, ex + ER - 0.5, ey - ER * 0.05);
      ctx.stroke();
    } else {
      // de longs cils tout mignons
      ctx.strokeStyle = '#3a1a3a';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let k = -1; k <= 1; k++) {
        const a = -Math.PI / 2 + k * 0.5;
        ctx.moveTo(ex + Math.cos(a) * ER, ey + Math.sin(a) * ER);
        ctx.lineTo(ex + Math.cos(a) * (ER + 3), ey + Math.sin(a) * (ER + 3));
      }
      ctx.stroke();
    }
    // joues roses et sourire (ou bouche qui halète)
    ctx.fillStyle = 'rgba(255,90,150,0.55)';
    ellipsePath(ctx, ex - 9, cy + 6, 2.6, 1.6);
    ctx.fill();
    ellipsePath(ctx, ex + 9, cy + 6, 2.6, 1.6);
    ctx.fill();
    if (o.tired) {
      ellipsePath(ctx, ex, cy + 9, 2.6, 2.2);
      ctx.fillStyle = '#7a1040';
      ctx.fill();
      ctx.fillStyle = '#ff6f91';
      ellipsePath(ctx, ex, cy + 11 + Math.sin(t * 14), 1.8, 2.2);
      ctx.fill();
    } else if (o.scared) {
      circlePath(ctx, ex, cy + 9.5, 1.8);
      ctx.fillStyle = '#7a1040';
      ctx.fill();
    } else {
      ctx.strokeStyle = '#7a1040';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ex, cy + 7.5, 3, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }
    if (o.scared) sweat(ctx, -dir * 13, cy - 9 + Math.sin(t * 8) * 1.5, 1);
    ctx.restore();
  }

  // ---------------- Minerais de la grotte ----------------
  const GEMS = [
    { kind: 'or', color: '#ffd23a', name: 'Or' },
    { kind: 'rubis', color: '#ff3b5c', name: 'Rubis' },
    { kind: 'emeraude', color: '#33e07a', name: 'Émeraude' },
    { kind: 'topaze', color: '#ffaa2a', name: 'Topaze' },
    { kind: 'diamant', color: '#bff6ff', name: 'Diamant' },
  ];
  // [clair, moyen, foncé, contour]
  const GEM_SHADES = {
    or: ['#fff6b8', '#ffc21f', '#c87a06', '#6a3a00'],
    rubis: ['#ffb0c0', '#ff3b5c', '#b0102e', '#5a0414'],
    emeraude: ['#b8ffd2', '#33e07a', '#0f9a48', '#04461e'],
    topaze: ['#ffe0a0', '#ffaa2a', '#d06a08', '#6a3000'],
    diamant: ['#ffffff', '#bff6ff', '#6ac8e8', '#2a6a8a'],
  };

  function facetGem(ctx, outer, inner, sh) {
    const poly = (pts) => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
    };
    // facettes : chaque triangle entre le bord et la table, une teinte sur deux
    const n = outer.length;
    for (let i = 0; i < n; i++) {
      const a = outer[i];
      const b = outer[(i + 1) % n];
      const c = inner[(i + 1) % n];
      const d = inner[i];
      poly([a, b, c, d]);
      const up = (a[1] + b[1]) / 2 < 0;
      const left = (a[0] + b[0]) / 2 < 0;
      ctx.fillStyle = up ? (left ? sh[0] : sh[1]) : (left ? sh[1] : sh[2]);
      ctx.fill();
    }
    poly(inner);
    const g = ctx.createLinearGradient(-6, -6, 6, 6);
    g.addColorStop(0, sh[0]);
    g.addColorStop(1, sh[1]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(outer[i][0], outer[i][1]);
      ctx.lineTo(inner[i][0], inner[i][1]);
      ctx.stroke();
    }
    poly(outer);
    ctx.strokeStyle = sh[3];
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function gem(ctx, cx, cy, s, kind, t) {
    const sh = GEM_SHADES[kind] || GEM_SHADES.diamant;
    t = t || 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s || 1, s || 1);
    ctx.lineJoin = 'round';
    const ring = (n, rx, ry, a0) => Array.from({ length: n }, (_, i) => {
      const a = a0 + (i / n) * TAU;
      return [Math.cos(a) * rx, Math.sin(a) * ry];
    });
    if (kind === 'or') {
      // pépite toute bosselée
      const pts = [[-12, 2], [-9, -7], [-2, -11], [6, -9], [12, -3], [11, 6], [4, 10], [-6, 9]];
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        const [nx, ny] = pts[(i + 1) % pts.length];
        if (!i) ctx.moveTo((px + nx) / 2, (py + ny) / 2);
      });
      for (let i = 1; i <= pts.length; i++) {
        const [px, py] = pts[i % pts.length];
        const [nx, ny] = pts[(i + 1) % pts.length];
        ctx.quadraticCurveTo(px * 1.08, py * 1.08, (px + nx) / 2, (py + ny) / 2);
      }
      ctx.closePath();
      const g = ctx.createRadialGradient(-4, -5, 1, 0, 0, 14);
      g.addColorStop(0, sh[0]);
      g.addColorStop(0.5, sh[1]);
      g.addColorStop(1, sh[2]);
      paint(ctx, g, sh[3], 1.4);
      // petites bosses qui brillent
      for (const [bx, by, r] of [[4, 3, 3], [-5, 4, 2.4], [6, -4, 2]]) {
        ctx.fillStyle = 'rgba(160,90,0,0.45)';
        ellipsePath(ctx, bx + 0.6, by + 1, r, r * 0.8);
        ctx.fill();
        ctx.fillStyle = sh[0];
        ellipsePath(ctx, bx - 0.4, by - 0.4, r * 0.7, r * 0.55);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ellipsePath(ctx, -5, -5, 3.5, 2, -0.6);
      ctx.fill();
    } else if (kind === 'emeraude') {
      // taille émeraude : rectangle aux coins coupés, avec des gradins
      const W = 10;
      const H = 12;
      const c = 3.5;
      const oct = (w, h, k) => [[-w + k, -h], [w - k, -h], [w, -h + k], [w, h - k], [w - k, h], [-w + k, h], [-w, h - k], [-w, -h + k]];
      facetGem(ctx, oct(W, H, c), oct(W * 0.55, H * 0.6, c * 0.55), sh);
    } else if (kind === 'topaze') {
      // goutte ovale
      facetGem(ctx, ring(10, 10, 13, -Math.PI / 2), ring(10, 5, 7, -Math.PI / 2 + 0.3), sh);
    } else if (kind === 'diamant') {
      // brillant : couronne plate en haut, pointe en bas
      const outer = [[-13, -3], [-8, -10], [8, -10], [13, -3], [0, 13]];
      ctx.beginPath();
      outer.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -10, 0, 13);
      g.addColorStop(0, sh[0]);
      g.addColorStop(0.4, sh[1]);
      g.addColorStop(1, sh[2]);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(42,106,138,0.55)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-13, -3);
      ctx.lineTo(13, -3);
      for (const x0 of [-8, -3, 3, 8]) {
        ctx.moveTo(x0 * 0.7, -10);
        ctx.lineTo(x0, -3);
        ctx.lineTo(0, 13);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(-2, -10);
      ctx.lineTo(-5, -3);
      ctx.lineTo(-11, -3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      outer.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      ctx.strokeStyle = sh[3];
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      // rubis : taille ronde à facettes
      facetGem(ctx, ring(8, 12, 11.5, -Math.PI / 8), ring(8, 6, 5.8, 0), sh);
    }
    // éclat qui scintille
    const tw = Math.max(0, Math.sin(t * 3.2 + (kind || '').length * 1.7));
    if (tw > 0.05) {
      ctx.save();
      ctx.translate(-5, -6);
      ctx.rotate(t * 1.5);
      ctx.fillStyle = `rgba(255,255,255,${0.95 * tw})`;
      starShape(ctx, 3 + tw * 4, 0.22);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------- La famille du bébé oiseau ----------------
  // Papa ou maman oiseau, les pieds en (x, y). Même espèce que le bébé, en plus grand.
  // o : kind ('maman' ou 'papa'), sing (bec ouvert), hug (0 à 1 : ailes grandes ouvertes), dir (tête penchée), happy
  const PAPA_COLORS = { light: '#8f86ff', mid: '#4f45d8', dark: '#2c2392', wing: '#3f34b8', tuft: '#3a30b0' };

  function bigBird(ctx, x, y, t, o) {
    o = o || {};
    const papa = o.kind === 'papa';
    const S = 1.7;
    ctx.save();
    ctx.translate(x, y);
    // pattes orange
    ctx.strokeStyle = '#ff9a1a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 6, -9);
      ctx.lineTo(side * 7, -1);
      ctx.moveTo(side * 7, -1);
      ctx.lineTo(side * 7 + 5, 0);
      ctx.moveTo(side * 7, -1);
      ctx.lineTo(side * 7 - 4, 0);
      ctx.stroke();
    }
    ctx.scale(S, S);
    ctx.translate(0, -4);
    ctx.rotate((o.dir || 0) * 0.12);
    const hug = clamp(o.hug || 0, 0, 1);
    birdCore(ctx, -13, t, {
      colors: papa ? PAPA_COLORS : null,
      wing: -hug * 1.5,
      flap: hug > 0 ? Math.sin(t * 9) * 0.15 * hug : Math.sin(t * 2) * 0.05,
      chirp: o.sing,
      lashes: !papa,
      flower: !papa,
      bushy: papa,
      bow: papa,
      joy: o.happy && !o.sing,
    });
    ctx.restore();
  }

  // Grand nid pour toute la famille (centré en x, posé en y).
  function birdNest(ctx, x, y, w) {
    const h = w * 0.3;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#5a3416';
    ellipsePath(ctx, 0, -h * 0.55, w / 2, h * 0.55);
    ctx.fill();
    ctx.fillStyle = '#7a4a22';
    ellipsePath(ctx, 0, -h * 0.62, w / 2 - 2, h * 0.45);
    ctx.fill();
    ctx.fillStyle = '#3e220c';
    ellipsePath(ctx, 0, -h * 0.85, w * 0.4, h * 0.18);
    ctx.fill();
    ctx.lineCap = 'round';
    const n = Math.round(w / 6);
    for (let row = 0; row < 3; row++) {
      ctx.strokeStyle = row === 1 ? '#c08a4a' : '#a8703a';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < n; i++) {
        const x0 = -w / 2 + 4 + (i / n) * (w - 8);
        const yy = -h * (0.85 - row * 0.28);
        ctx.beginPath();
        ctx.moveTo(x0, yy + (i % 2) * 3);
        ctx.quadraticCurveTo(x0 + 6, yy + 6, x0 + 12, yy - 1 + (i % 3) * 2);
        ctx.stroke();
      }
    }
    // brindilles qui dépassent
    ctx.strokeStyle = '#8a5a2a';
    ctx.lineWidth = 2;
    for (const [sx, sy, ex, ey] of [[-w / 2 + 2, -h * 0.7, -w / 2 - 8, -h * 1.0], [w / 2 - 2, -h * 0.6, w / 2 + 9, -h * 0.85], [w * 0.2, -h * 0.15, w * 0.32, h * 0.12]]) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------- Pissenlit géant (les Grands Arbres) ----------------
  // La boule de graines, centrée en (x, y), de rayon r. Chaque graine part du cœur avec sa petite
  // aigrette (son parachute) au bout. o : tilt (penché), glow (un halo : on peut l'attraper),
  // missing (0..1 : les graines déjà parties).
  function dandelion(ctx, x, y, r, t, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.tilt || 0);
    if (o.glow) {
      const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.7);
      g.addColorStop(0, `rgba(255,252,210,${0.4 + 0.12 * Math.sin(t * 3)})`);
      g.addColorStop(1, 'rgba(255,252,210,0)');
      ctx.fillStyle = g;
      circlePath(ctx, 0, 0, r * 1.7);
      ctx.fill();
    }
    // le duvet tout doux (un peu bleuté en bas, pour qu'on le voie bien sur le ciel)
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.65, 'rgba(244,248,255,0.8)');
    g.addColorStop(1, 'rgba(196,212,238,0.55)');
    ctx.fillStyle = g;
    circlePath(ctx, 0, 0, r * 0.9);
    ctx.fill();
    // les graines : un trait fin jusqu'à l'aigrette, qui tremble un peu dans le vent
    const N = 26;
    const rays = new Path2D();
    const fluff = new Path2D();
    const tips = [];
    for (let i = 0; i < N; i++) {
      if (o.missing && hash(i * 3.3 + 0.7) < o.missing) continue;
      const a = (i / N) * TAU + Math.sin(t * 1.4 + i * 1.7) * 0.035;
      const rr = r * (0.92 + hash(i * 1.9) * 0.1);
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      rays.moveTo(ca * 3.5, sa * 3.5);
      rays.lineTo(ca * rr * 0.8, sa * rr * 0.8);
      for (let k = -2; k <= 2; k++) {
        const b = a + k * 0.3;
        fluff.moveTo(ca * rr * 0.8, sa * rr * 0.8);
        fluff.lineTo(ca * rr * 0.8 + Math.cos(b) * r * 0.24, sa * rr * 0.8 + Math.sin(b) * r * 0.24);
      }
      tips.push([ca * rr * 0.8, sa * rr * 0.8]);
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(165,145,112,0.55)';
    ctx.lineWidth = 0.9;
    ctx.stroke(rays);
    ctx.strokeStyle = 'rgba(96,120,168,0.6)';
    ctx.lineWidth = 2.4;
    ctx.stroke(fluff);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke(fluff);
    ctx.fillStyle = '#ffffff';
    for (const [tx, ty] of tips) {
      circlePath(ctx, tx, ty, 1.3);
      ctx.fill();
    }
    // le petit cœur, où sont accrochées les graines
    ctx.fillStyle = '#b58a52';
    circlePath(ctx, 0, 0, 4);
    ctx.fill();
    ctx.fillStyle = '#e2c48a';
    circlePath(ctx, -1, -1.2, 1.8);
    ctx.fill();
    ctx.restore();
  }

  // La tige, du point (x0, y0) jusque sous la boule (x1, y1), un peu courbée (bend).
  function dandelionStem(ctx, x0, y0, x1, y1, bend) {
    const mx = (x0 + x1) / 2 + (bend || 0);
    const my = (y0 + y1) / 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3f8a2c';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx, my, x1, y1);
    ctx.stroke();
    ctx.strokeStyle = '#7ccf4f';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 - 1, y0);
    ctx.quadraticCurveTo(mx - 1, my, x1 - 1, y1);
    ctx.stroke();
  }

  // Les feuilles dentelées au pied (« dent-de-lion »), posées sur la branche.
  function dandelionLeaves(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    for (const [a, len] of [[-2.75, 24], [-0.4, 22], [-2.25, 17], [-0.9, 18]]) {
      ctx.save();
      ctx.rotate(a + Math.sin(t * 1.8 + a) * 0.04);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // un bord tout en dents de scie, de chaque côté
      for (let k = 1; k <= 4; k++) {
        const px = (len * k) / 4;
        const w = 5.5 * (1 - k / 5) + 1;
        ctx.lineTo(px - len / 8, -w * 0.4);
        ctx.lineTo(px, -w);
      }
      for (let k = 4; k >= 1; k--) {
        const px = (len * k) / 4;
        const w = 5.5 * (1 - k / 5) + 1;
        ctx.lineTo(px, w * 0.7);
        ctx.lineTo(px - len / 8, w * 0.3);
      }
      ctx.closePath();
      paint(ctx, '#58b53c', '#2f7a24', 1);
      ctx.strokeStyle = 'rgba(220,255,190,0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(len - 3, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // La fleur jaune, avant de devenir une boule de graines (quand le pissenlit repousse).
  // k : de 0 (bouton vert tout fermé) à 1 (fleur bien ouverte).
  function dandelionFlower(ctx, x, y, r, k) {
    ctx.save();
    ctx.translate(x, y);
    if (k < 0.35) {
      ellipsePath(ctx, 0, 0, r * 0.45, r * 0.7);
      paint(ctx, '#6cc04a', '#2f7a24', 1);
      ctx.fillStyle = '#ffd21f';
      ellipsePath(ctx, 0, -r * 0.55, r * 0.22 * (k / 0.35), r * 0.25 * (k / 0.35));
      ctx.fill();
    } else {
      const o = Math.min(1, (k - 0.35) / 0.5);
      for (let ring = 0; ring < 2; ring++) {
        const n = ring ? 10 : 14;
        const rr = r * (ring ? 0.55 : 0.95) * (0.5 + 0.5 * o);
        ctx.fillStyle = ring ? '#ffd21f' : '#ffb800';
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + ring * 0.3;
          ellipsePath(ctx, Math.cos(a) * rr * 0.55, Math.sin(a) * rr * 0.55, rr * 0.5, rr * 0.16, a);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#ffe680';
      circlePath(ctx, 0, 0, r * 0.22);
      ctx.fill();
    }
    ctx.restore();
  }

  // Une graine qui s'envole : la graine, sa tige, et son parachute.
  function dandelionSeed(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s, s);
    const fluff = new Path2D();
    for (let k = -3; k <= 3; k++) {
      const a = -Math.PI / 2 + k * 0.32;
      fluff.moveTo(0, -8);
      fluff.lineTo(Math.cos(a) * 6.5, -8 + Math.sin(a) * 6.5);
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(110,132,172,0.5)';
    ctx.lineWidth = 2.2;
    ctx.stroke(fluff);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.1;
    ctx.stroke(fluff);
    ctx.strokeStyle = 'rgba(150,128,96,0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = '#9a6a3a';
    ellipsePath(ctx, 0, 1.5, 1.1, 2.4);
    ctx.fill();
    ctx.restore();
  }

  // ---------------- La Rivière aux Nénuphars ----------------
  // Escargot : un gros corps tout doux couleur pêche, des yeux tout ronds au bout de ses cornes
  // (un peu endormis), et une coquille de bonbon en spirale avec une petite pâquerette plantée dessus.
  // Les pieds en (x, y), tourné vers la droite. o : dir, t, hue (la coquille), look ({x, y}),
  // phase (le pied qui ondule), moving, fat, rest, hide (de 0 à 1 : il rentre dans sa coquille), wobble.
  function snail(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const dir = o.dir || 1;
    const hue = o.hue == null ? 330 : o.hue;
    const fat = !!o.fat;
    const hide = clamp(o.hide || 0, 0, 1);
    const ph = o.phase || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const body = '#ffd9b0';
    const bodyDark = '#f0b47e';
    const line = '#b8703e';
    // le corps : il s'étire et se ramasse un peu en avançant ; il rentre dans la coquille
    const stretch = (o.moving ? Math.sin(ph * 2) * 1.6 : 0) * (1 - hide);
    const len = (1 - hide) * (fat ? 1.08 : 1);
    if (len > 0.05) {
      const thick = fat ? 9 : 7;
      const hx = 17 * len + stretch;
      const hy = -13 - (fat ? 1 : 0);
      const hr = (fat ? 9 : 7.5) * (0.4 + 0.6 * len);
      ctx.beginPath();
      ctx.moveTo(-23 * len - stretch * 0.5, 0);
      ctx.quadraticCurveTo(-26 * len, -3, -20 * len, -thick + 1);
      ctx.lineTo(hx - 6, -thick);
      ctx.quadraticCurveTo(hx - 8, hy - 2, hx, hy - hr);
      ctx.quadraticCurveTo(hx + hr * 1.2, hy - hr, hx + hr, hy + 2);
      ctx.quadraticCurveTo(hx + hr * 0.9, -2, hx + 6, 0);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, hy - hr, 0, 0);
      g.addColorStop(0, '#fff0dc');
      g.addColorStop(0.6, body);
      g.addColorStop(1, bodyDark);
      paint(ctx, g, line, 1.3);
      // le dessous du pied qui ondule
      if (o.moving) {
        ctx.strokeStyle = 'rgba(184,112,62,0.45)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) {
          const wx = -18 * len + ((i * 10 + ph * 6) % 38) * len;
          ctx.beginPath();
          ctx.moveTo(wx - 2.5, -1.5);
          ctx.quadraticCurveTo(wx, -3.5, wx + 2.5, -1.5);
          ctx.stroke();
        }
      }
      // les cornes, avec les yeux au bout (ils suivent Malice)
      if (hide < 0.5) {
        const look = o.look || { x: 1, y: 0 };
        const lx = clamp(look.x * dir, -1, 1);
        const ly = clamp(look.y, -1, 1);
        const sway = Math.sin(t * 2.2) * 1.5;
        const grow = 1 - hide * 2;
        const eyes = [[hx - 3, -1, 0.85], [hx + 3, 1, 1]];
        eyes.forEach(([sx, side, s]) => {
          const ex = sx + side * 3.5 + sway * side * 0.5 + lx * 1.5;
          const ey = hy - hr - (13 + (side > 0 ? 1.5 : 0)) * grow + Math.sin(t * 2.2 + side) * 1;
          ctx.strokeStyle = bodyDark;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sx, hy - hr + 3);
          ctx.quadraticCurveTo(sx + side * 1.5, (ey + hy - hr) / 2, ex, ey + 3);
          ctx.stroke();
          ctx.strokeStyle = body;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          const er = 4.2 * s;
          circlePath(ctx, ex, ey, er);
          paint(ctx, '#ffffff', line, 1);
          ctx.fillStyle = '#3a2a4a';
          circlePath(ctx, ex + lx * er * 0.4, ey + ly * er * 0.35 + 0.4, er * 0.5);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          circlePath(ctx, ex + lx * er * 0.4 - 0.9, ey + ly * er * 0.35 - 0.6, er * 0.18);
          ctx.fill();
          // des paupières un peu tombantes : il n'est jamais pressé (fermées pour cligner, ou fatigué)
          const blink = (t + side * 0.07) % 4.1 < 0.14;
          const lid = blink || (fat && o.rest) ? 1 : 0.38;
          ctx.save();
          circlePath(ctx, ex, ey, er);
          ctx.clip();
          ctx.fillStyle = body;
          ctx.fillRect(ex - er - 1, ey - er - 1, er * 2 + 2, er * 2 * lid + 1);
          ctx.restore();
          ctx.strokeStyle = line;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ex - er * 0.9, ey - er + er * 2 * lid);
          ctx.lineTo(ex + er * 0.9, ey - er + er * 2 * lid);
          ctx.stroke();
        });
        // une joue rose et un petit sourire
        ctx.fillStyle = 'rgba(255,130,150,0.55)';
        ellipsePath(ctx, hx + 2, hy + 2.5, 3, 2);
        ctx.fill();
        if (fat) chubbyCheeks(ctx, hx + 3, hy + 3, 3.4, 2.8, '#ffe4c4', line);
        else {
          ctx.strokeStyle = '#7a3a2a';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(hx + 4.5, hy + 1, 2.4, 0.3, Math.PI - 0.6);
          ctx.stroke();
        }
      }
    }
    // la coquille : une spirale de bonbon, avec une pâquerette plantée dessus
    const wob = o.wobble ? Math.sin(o.wobble * 30) * 0.22 * Math.max(0, 1 - o.wobble / 0.75) : 0;
    const R = fat ? 15 : 14;
    const sx = -4 + hide * 4;
    const sy = -15 + hide * 1.5;
    ctx.save();
    ctx.translate(sx, sy + R);
    ctx.rotate(wob);
    ctx.translate(0, -R);
    const sg = ctx.createRadialGradient(-4, -5, 2, 0, 0, R * 1.1);
    sg.addColorStop(0, `hsl(${hue},90%,86%)`);
    sg.addColorStop(0.6, `hsl(${hue},75%,70%)`);
    sg.addColorStop(1, `hsl(${hue},60%,52%)`);
    circlePath(ctx, 0, 0, R);
    paint(ctx, sg, `hsl(${hue},55%,32%)`, 1.4);
    // la spirale
    ctx.beginPath();
    for (let a = 0; a <= TAU * 2.6; a += 0.15) {
      const r = 1.5 + (a / (TAU * 2.6)) * (R - 3);
      const px = Math.cos(a + 2.4) * r;
      const py = Math.sin(a + 2.4) * r;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `hsl(${hue},80%,94%)`;
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.strokeStyle = `hsla(${hue},55%,38%,0.55)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    // reflet
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ellipsePath(ctx, -6, -8, 4, 2.2, -0.6);
    ctx.fill();
    // la petite pâquerette
    ctx.translate(3, -R + 1);
    ctx.rotate(Math.sin(t * 2 + hue) * 0.15);
    ctx.strokeStyle = '#3f9a3a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -6);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ellipsePath(ctx, Math.cos(a) * 3, -8 + Math.sin(a) * 3, 2, 1.2, a);
      ctx.fill();
    }
    ctx.fillStyle = '#ffc21f';
    circlePath(ctx, 0, -8, 1.6);
    ctx.fill();
    ctx.restore();
    // caché dans sa coquille : deux petits yeux inquiets à l'entrée
    if (hide >= 0.5) {
      ctx.fillStyle = '#3a1a10';
      ellipsePath(ctx, sx + 7, sy + 7, 4.5, 3.6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, sx + 5.8, sy + 6.6, 1.3);
      ctx.fill();
      circlePath(ctx, sx + 8.6, sy + 6.6, 1.3);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------- La Prairie la Nuit ----------------
  // Un halo de lumière qui s'ajoute (lampes, lucioles, fleurs qui brillent) : dessiné une fois par couleur,
  // puis agrandi (bien plus rapide qu'un dégradé à chaque image). rgb : '255,240,150' ; a : sa force.
  const GLOWS = new Map();
  function glow(ctx, x, y, r, rgb, a) {
    let c = GLOWS.get(rgb);
    if (!c) {
      c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${rgb},1)`);
      gr.addColorStop(0.35, `rgba(${rgb},0.45)`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
      GLOWS.set(rgb, c);
    }
    const op = ctx.globalCompositeOperation;
    const ga = ctx.globalAlpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = ga * clamp(a, 0, 1);
    ctx.drawImage(c, x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = op;
    ctx.globalAlpha = ga;
  }

  // Taupe, les pieds en (x, y) : une boule de velours, un casque de mineur avec sa lampe, de grosses lunettes
  // rondes (elle ne voit pas bien), un gros nez rose et de grandes mains roses pour creuser.
  // o : dir, t, look, fat, rest (essoufflée), popping (elle jaillit : les bras en l'air),
  //     dizzy (assommée : des étoiles), squash (aplatie)
  function mole(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const dir = o.dir || 1;
    const fat = !!o.fat;
    const rx = fat ? 22 : 17;
    const ry = fat ? 19 : 18.5;
    const fur = '#8a6e86';
    const furDark = '#5a4256';
    const line = '#3a2436';
    const pink = '#ffa8c0';
    const pinkLine = '#c4567a';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    if (o.squash) ctx.scale(1 + o.squash, 1 - o.squash);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // les petits pieds
    for (const fx of [-8, 7]) {
      ellipsePath(ctx, fx, -2, 6, 3.2);
      paint(ctx, pink, pinkLine, 1);
    }
    // le corps tout rond, en velours
    ellipsePath(ctx, 0, -19, rx, ry);
    const g = ctx.createLinearGradient(0, -38, 0, 0);
    g.addColorStop(0, '#a88ca4');
    g.addColorStop(0.5, fur);
    g.addColorStop(1, furDark);
    paint(ctx, g, line, 1.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.2;
    for (const [hx, hy] of [[-10, -26], [-13, -18], [-8, -10]]) {
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - 3, hy + 2);
      ctx.stroke();
    }
    // le ventre
    ellipsePath(ctx, 4, -12, fat ? 13 : 10, 8.5);
    ctx.fillStyle = '#e6d0d6';
    ctx.fill();
    // le museau et le gros nez rose
    ellipsePath(ctx, 13, -17, 8.5, 5.5, -0.1);
    paint(ctx, '#f6c6d2', pinkLine, 1);
    circlePath(ctx, 21, -18.5, 4.6);
    paint(ctx, '#ff6f9e', '#b8406a', 1.1);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    circlePath(ctx, 19.6, -20, 1.5);
    ctx.fill();
    // les moustaches
    ctx.strokeStyle = 'rgba(255,240,245,0.85)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const [ex, ey] of [[28, -21], [29, -17], [27, -13]]) {
      ctx.moveTo(16, -17);
      ctx.lineTo(ex, ey + Math.sin(t * 4 + ex) * 0.6);
    }
    ctx.stroke();
    // la bouche (essoufflée, c'est la langue qui pend : voir tiredFace)
    if (!(fat && o.rest)) {
      ctx.strokeStyle = '#7a2a3a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(12, -13.5, 2.6, 0.2, Math.PI - 0.4);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,120,150,0.5)';
    ellipsePath(ctx, 3, -18, 3.4, 2.2);
    ctx.fill();
    if (fat) chubbyCheeks(ctx, 6, -17, 4, 3.2, '#a88ca4', line);
    // les grosses lunettes rondes (les petits yeux derrière suivent Malice)
    const look = o.look || { x: 1, y: 0 };
    const lx = clamp(look.x * dir, -1, 1);
    const ly = clamp(look.y, -1, 1);
    for (const [ex, ey, er] of [[5.5, -25, 5.6], [14.5, -24.5, 4.8]]) {
      circlePath(ctx, ex, ey, er);
      ctx.fillStyle = 'rgba(210,235,255,0.55)';
      ctx.fill();
      if (o.dizzy) {
        // assommée : les yeux en croix
        ctx.strokeStyle = '#2a1a24';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ex - 1.8, ey - 1.8);
        ctx.lineTo(ex + 1.8, ey + 1.8);
        ctx.moveTo(ex + 1.8, ey - 1.8);
        ctx.lineTo(ex - 1.8, ey + 1.8);
        ctx.stroke();
      } else {
        const blink = (t + ex * 0.01) % 3.7 < 0.12;
        ctx.fillStyle = '#1e1420';
        if (blink || (fat && o.rest)) ctx.fillRect(ex - 2, ey - 0.4 + ly, 4, 1.2);
        else {
          circlePath(ctx, ex + lx * 1.6, ey + ly * 1.3, 1.7);
          ctx.fill();
        }
      }
      ctx.strokeStyle = '#3a2418';
      ctx.lineWidth = 1.8;
      circlePath(ctx, ex, ey, er);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(ex, ey, er - 1.6, 3.6, 4.5);
      ctx.stroke();
    }
    ctx.strokeStyle = '#3a2418';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(10.2, -25.5);
    ctx.lineTo(10.6, -25.2);
    ctx.stroke();
    // le casque de mineur, et sa lampe
    ctx.beginPath();
    ctx.arc(1, -31, 14, Math.PI, 0);
    ctx.closePath();
    const hg = ctx.createLinearGradient(0, -45, 0, -31);
    hg.addColorStop(0, '#fff07a');
    hg.addColorStop(1, '#ffc21f');
    paint(ctx, hg, '#a86a00', 1.3);
    ctx.strokeStyle = 'rgba(168,106,0,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(1, -45);
    ctx.lineTo(1, -32);
    ctx.stroke();
    roundRectPath(ctx, -15, -33, 33, 4, 2);
    paint(ctx, '#ffb000', '#a86a00', 1.1);
    glow(ctx, 14, -39, 17, '255,248,180', 0.6 + 0.2 * Math.sin(t * 5));
    circlePath(ctx, 14, -39, 4.2);
    paint(ctx, '#fffbe0', '#a86a00', 1.1);
    // les grandes mains pour creuser (en l'air quand elle jaillit, sinon devant elle)
    const up = o.popping;
    const hands = up ? [[-17, -40, -0.9], [21, -42, 0.9]] : [[-15, -14, -0.4 + Math.sin(t * 3) * 0.1], [16, -6, 0.5]];
    for (const [hx, hy, a] of hands) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(a);
      ellipsePath(ctx, 0, 0, 6.5, 5.2);
      paint(ctx, pink, pinkLine, 1.1);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#b89aa6';
      ctx.lineWidth = 0.7;
      for (let i = -1.5; i <= 1.5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 2.6 - 1.1, -4.6);
        ctx.lineTo(i * 3.2, -9);
        ctx.lineTo(i * 2.6 + 1.1, -4.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    // assommée : des étoiles tournent autour du casque
    if (o.dizzy) {
      for (let i = 0; i < 3; i++) {
        const a = t * 8 + (i * TAU) / 3;
        ctx.save();
        ctx.translate(1 + Math.cos(a) * 15, -50 + Math.sin(a) * 4);
        ctx.rotate(t * 5 + i);
        starShape(ctx, 3.8, 0.45);
        paint(ctx, '#ffe94a', '#b07800', 0.9);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // Hérisson (les Champignons Géants), les pieds en (x, y), tourné vers dir.
  // o : t, phase (les pattes qui trottinent), moving, curl (0 : déroulé, 1 : roulé en boule), look,
  //     sniff (déroulé, il renifle autour de lui), fat / rest (après les chips)
  // Grenouille sauteuse (le Moulin à Vent), les pieds en (x, y). o : dir, t, look, crouch (elle se ramasse, de 0 à 1),
  // air (-1 : elle monte, les pattes tendues ; 1 : elle retombe, les pattes écartées), land (elle retombe, tout
  // écrasée, de 1 à 0), sac (la gorge qui se gonfle quand elle coasse), tongue (la langue qui attrape une goutte de
  // pluie, de 0 à 1), phase / moving (elle se dandine, avec les chips), fat.
  function frog(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const dir = o.dir || 1;
    const fat = !!o.fat;
    const line = '#1f5a24';
    const skin = '#6fd44e';
    const dark = '#3f9a34';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // elle se ramasse (et tremble), ou retombe tout écrasée, ou s'étire en sautant
    const squash = Math.max(o.crouch || 0, o.land || 0);
    let sx = 1 + 0.16 * squash;
    let sy = 1 - 0.28 * squash;
    if (o.air < 0) { sx = 0.9; sy = 1.14; }
    if (o.crouch > 0) ctx.translate(Math.sin(t * 46) * 0.9 * o.crouch, 0);
    if (fat && o.moving) ctx.rotate(Math.sin((o.phase || 0) * 1.3) * 0.06);
    ctx.scale(sx, sy);
    const rx = fat ? 22 : 17;
    const ry = fat ? 15 : 12;
    // les grandes pattes arrière : repliées (assise), tendues vers le bas (elle monte), écartées (elle retombe)
    ctx.fillStyle = skin;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.6;
    if (o.air < 0) {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.quadraticCurveTo(-16 + s * 2, 2, -20 + s * 3, 10);
        ctx.lineWidth = 6;
        ctx.strokeStyle = line;
        ctx.stroke();
        ctx.lineWidth = 3.6;
        ctx.strokeStyle = skin;
        ctx.stroke();
        ellipsePath(ctx, -21 + s * 3, 11, 5, 2.4, -0.4);
        paint(ctx, skin, line, 1.2);
      }
    } else if (o.air > 0) {
      for (const s of [-1, 1]) {
        ellipsePath(ctx, s * 18, -4, 8, 3.6, s * 0.5);
        paint(ctx, skin, line, 1.3);
        ellipsePath(ctx, s * 25, -1, 4.6, 2.4, s * 0.3);
        paint(ctx, skin, line, 1.2);
      }
    } else {
      // assise : la cuisse repliée sur le côté, et le grand pied posé devant
      ellipsePath(ctx, -9, -7, 9, 6.5, -0.3);
      paint(ctx, skin, line, 1.4);
      ellipsePath(ctx, -3, -1.6, 9, 2.6);
      paint(ctx, dark, line, 1.2);
    }
    // le corps
    ellipsePath(ctx, 0, -12, rx, ry);
    const g = ctx.createLinearGradient(0, -12 - ry, 0, 0);
    g.addColorStop(0, '#8ff06a');
    g.addColorStop(1, '#4cb43c');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // le ventre tout clair
    ellipsePath(ctx, 6, -7, rx * 0.62, ry * 0.5, -0.15);
    ctx.fillStyle = '#e9ffb0';
    ctx.fill();
    // des taches sur le dos
    ctx.fillStyle = 'rgba(40,120,40,0.55)';
    for (const [px, py, r] of [[-8, -17, 3], [-2, -20, 2.2], [-12, -11, 2]]) {
      ellipsePath(ctx, px * (fat ? 1.2 : 1), py, r, r * 0.8);
      ctx.fill();
    }
    // la petite patte avant
    if (!o.air) {
      ellipsePath(ctx, 12, -1.8, 5, 2.4);
      paint(ctx, skin, line, 1.2);
    }
    // la gorge qui se gonfle (croâ !)
    const sac = clamp(o.sac || 0, 0, 1);
    if (sac > 0.02) {
      circlePath(ctx, 13, -6, 3 + 6.5 * sac);
      paint(ctx, '#fff6b0', '#b8a040', 1.1);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ellipsePath(ctx, 11, -8 - 2 * sac, 2 * sac, 1.2 * sac, -0.4);
      ctx.fill();
    }
    // les gros yeux sur le dessus de la tête
    const look = o.look || { x: 1, y: 0 };
    const lx = clamp(look.x * dir, -1, 1);
    const ly = clamp(look.y, -1, 1);
    const blink = (t % 3.3) < 0.12 && !o.crouch;
    for (const [ex, ey, r] of [[3, -23, 5.6], [13, -21, 5.2]]) {
      circlePath(ctx, ex, ey, r);
      paint(ctx, skin, line, 1.4);
      if (blink) {
        ctx.strokeStyle = line;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.6, ey);
        ctx.lineTo(ex + r * 0.6, ey);
        ctx.stroke();
        continue;
      }
      circlePath(ctx, ex, ey - 0.5, r - 1.6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      // (en se ramassant, elle regarde là où elle va sauter, les yeux tout ronds)
      const pr = o.crouch ? 2.6 : 2.2;
      circlePath(ctx, ex + lx * 1.6, ey - 0.5 + ly * 1.4, pr);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      circlePath(ctx, ex + lx * 1.6 - 0.8, ey - 1.5 + ly * 1.4, 0.8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    // les joues roses, et le grand sourire (elle adore la pluie !)
    ctx.fillStyle = 'rgba(255,130,170,0.5)';
    ellipsePath(ctx, 15, -12, 3, 1.8);
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (o.air || o.crouch) {
      // la bouche en O : hop !
      ellipsePath(ctx, 17, -13, 2, 2.4);
      ctx.fillStyle = '#7a1e2e';
      ctx.fill();
    } else {
      ctx.moveTo(6, -14);
      ctx.quadraticCurveTo(13, -9, 19, -14.5);
      ctx.stroke();
    }
    // la langue qui file attraper une goutte de pluie
    const tg = o.tongue > 0 ? Math.sin(clamp(o.tongue, 0, 1) * Math.PI) : 0;
    if (tg > 0.02) {
      const tx = 18 + 10 * tg;
      const ty = -14 - 22 * tg;
      ctx.strokeStyle = '#ff6a9a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(18, -14);
      ctx.quadraticCurveTo(24, -16, tx, ty);
      ctx.stroke();
      if (o.tongue < 0.5) {
        // la goutte, juste au bout
        ctx.fillStyle = '#bfe6ff';
        ctx.beginPath();
        ctx.moveTo(tx, ty - 6);
        ctx.quadraticCurveTo(tx + 3, ty - 1, tx, ty + 1);
        ctx.quadraticCurveTo(tx - 3, ty - 1, tx, ty - 6);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function hedgehog(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const dir = o.dir || 1;
    const k = clamp(o.curl || 0, 0, 1);
    const fat = !!o.fat;
    const line = '#2e1c10';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    // en boule, il tremble un tout petit peu
    if (k > 0.9) ctx.translate(Math.sin(t * 34) * 0.6, 0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // les petites pattes (elles rentrent quand il se met en boule)
    if (k < 0.75) {
      const ph = o.moving ? o.phase || 0 : 0;
      ctx.fillStyle = '#4a3020';
      for (const [fx, s] of [[-11, 0], [-4, Math.PI], [6, Math.PI * 0.5], [13, Math.PI * 1.5]]) {
        const lift = o.moving ? Math.max(0, Math.sin(ph + s)) * 2.5 : 0;
        ellipsePath(ctx, fx + Math.cos(ph + s) * 1.6, -2.2 - lift - k * 4, 3.6, 2.4);
        ctx.fill();
      }
    }
    // le manteau de piquants : sur le dos quand il trottine, tout autour quand il est en boule
    const cx = lerp(-3, 0, k);
    const cy = lerp(-13, -16.5, k);
    const rx = lerp(fat ? 23 : 19, 16.5, k);
    const ry = lerp(fat ? 15 : 12.5, 16.5, k);
    const a0 = lerp(-Math.PI - 0.25, -Math.PI * 1.5, k);
    const a1 = lerp(-0.3, Math.PI * 0.5, k);
    const n = Math.max(8, Math.round((a1 - a0) / 0.3));
    const spike = lerp(7, 8.5, k);
    const P = (a, r) => [cx + Math.cos(a) * (rx + r), cy + Math.sin(a) * (ry + r)];
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const [ox, oy] = P(a, spike + (i % 2) * 1.5);
      const [ix, iy] = P(a + (a1 - a0) / n / 2, -1);
      if (i === 0) ctx.moveTo(...P(a, -2));
      ctx.lineTo(ox, oy);
      if (i < n) ctx.lineTo(ix, iy);
    }
    if (k < 0.98) ctx.lineTo(cx + 4, cy + ry * 0.4);
    ctx.closePath();
    paint(ctx, '#5a3c26', line, 1.3);
    // les bouts clairs des piquants
    ctx.strokeStyle = '#ead6ae';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 1; i < n; i += 2) {
      const a = a0 + ((a1 - a0) * i) / n;
      ctx.moveTo(...P(a, 1));
      ctx.lineTo(...P(a, spike * 0.55));
    }
    ctx.stroke();
    // le corps
    ellipsePath(ctx, cx, cy, rx - 2, ry - 2);
    const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
    g.addColorStop(0, '#a27a54');
    g.addColorStop(1, '#6e4c30');
    ctx.fillStyle = g;
    ctx.fill();
    // des petites rayures de piquants sur le dos
    ctx.strokeStyle = 'rgba(46,28,16,0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = lerp(a0, a1, (i + 0.5) / 5);
      ctx.moveTo(cx + Math.cos(a) * (rx - 9), cy + Math.sin(a) * (ry - 8));
      ctx.lineTo(cx + Math.cos(a) * (rx - 3), cy + Math.sin(a) * (ry - 3));
    }
    ctx.stroke();
    const face = clamp(1 - k * 1.6, 0, 1);
    if (face > 0) {
      ctx.save();
      ctx.globalAlpha *= face;
      // le museau tout pointu, couleur crème, et le gros nez noir (qui remue quand il renifle)
      const sn = o.sniff ? Math.sin(t * 22) * 0.9 : 0;
      const fx = fat ? 3 : 0;
      ctx.beginPath();
      ctx.moveTo(3 + fx, -21);
      ctx.quadraticCurveTo(13 + fx, -19, 22 + fx, -10.5 + sn);
      ctx.quadraticCurveTo(14 + fx, -3, 3 + fx, -3);
      ctx.quadraticCurveTo(-2, -12, 3 + fx, -21);
      paint(ctx, '#f2dcb8', line, 1.2);
      ctx.fillStyle = 'rgba(255,120,140,0.45)';
      ellipsePath(ctx, 10 + fx, -8, 3, 2);
      ctx.fill();
      circlePath(ctx, 22 + fx, -10.5 + sn, 2.8);
      paint(ctx, '#1a1010', line, 0.8);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      circlePath(ctx, 21.3 + fx, -11.6 + sn, 0.9);
      ctx.fill();
      // l'oreille
      circlePath(ctx, 4 + fx, -21, 2.6);
      paint(ctx, '#d8b48a', line, 1);
      // l'œil (il suit Malice quand il renifle) ; essoufflé, il le ferme
      const look = o.look || { x: 1, y: 0 };
      const lx = clamp(look.x * dir, -1, 1);
      const ly = clamp(look.y, -1, 1);
      const blink = (t * 0.9) % 3.1 < 0.1;
      ctx.fillStyle = '#1a1010';
      if (blink || (fat && o.rest)) {
        ctx.strokeStyle = '#1a1010';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(10.2 + fx, -15);
        ctx.lineTo(14 + fx, -15);
        ctx.stroke();
      } else {
        circlePath(ctx, 12 + fx + lx * 0.8, -15 + ly * 0.6, 2.1);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        circlePath(ctx, 11.4 + fx + lx * 0.8, -15.8 + ly * 0.6, 0.8);
        ctx.fill();
      }
      // la petite bouche
      if (!(fat && o.rest)) {
        ctx.strokeStyle = '#5a2a20';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(16 + fx, -8, 2.2, 0.3, Math.PI - 0.6);
        ctx.stroke();
      }
      if (fat) chubbyCheeks(ctx, 9 + fx, -9, 3.6, 2.8, '#f2dcb8', line);
      // il renifle : de petits traits devant le nez
      if (o.sniff && Math.sin(t * 7) > 0.2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(27 + fx, -14);
        ctx.lineTo(30 + fx, -15.5);
        ctx.moveTo(27.5 + fx, -10.5);
        ctx.lineTo(31 + fx, -10.5);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (k > 0.6) {
      // tout roulé en boule : on ne voit plus que le bout de son nez
      ctx.save();
      ctx.globalAlpha *= clamp((k - 0.6) / 0.3, 0, 1);
      circlePath(ctx, 10, -7, 2.3);
      paint(ctx, '#1a1010', line, 0.8);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- Le Glacier Fumant ----------
  // Une stalactite de glace (centrée en x, accrochée au plafond en y, w de large et h de long) : de la glace bleutée et
  // transparente, un reflet tout du long, et une goutte qui grossit au bout. shaking : elle tremble (une fissure
  // apparaît en haut).
  function icicle(ctx, x, y, w, h, t, shaking) {
    const hw = w / 2;
    ctx.save();
    ctx.lineJoin = 'round';
    const g = ctx.createLinearGradient(x - hw, 0, x + hw, 0);
    g.addColorStop(0, '#f4fcff');
    g.addColorStop(0.45, '#bfe6ff');
    g.addColorStop(1, '#78b0e0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - hw, y - 2);
    ctx.quadraticCurveTo(x - hw * 0.55, y + h * 0.42, x - 1.5, y + h - 2);
    ctx.quadraticCurveTo(x, y + h + 1, x + 1.5, y + h - 2);
    ctx.quadraticCurveTo(x + hw * 0.55, y + h * 0.42, x + hw, y - 2);
    ctx.closePath();
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#3a78b8';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // le reflet, tout du long
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - hw * 0.55, y + 3);
    ctx.quadraticCurveTo(x - hw * 0.35, y + h * 0.4, x - 2.5, y + h * 0.72);
    ctx.stroke();
    // de petits anneaux plus clairs
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.4;
    for (const k of [0.25, 0.5]) {
      const yy = y + h * k;
      const ww = hw * (1 - k) * 0.95;
      ctx.beginPath();
      ctx.moveTo(x - ww, yy);
      ctx.quadraticCurveTo(x, yy + 2.5, x + ww, yy);
      ctx.stroke();
    }
    if (shaking) {
      // crac ! une fissure en haut
      ctx.strokeStyle = '#2a5a90';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - hw * 0.7, y + 3);
      ctx.lineTo(x - 2, y + 7);
      ctx.lineTo(x + 3, y + 5);
      ctx.lineTo(x + hw * 0.7, y + 9);
      ctx.stroke();
    }
    // la goutte qui grossit au bout
    const u = (t * 0.5) % 1;
    ctx.fillStyle = 'rgba(200,236,255,0.9)';
    ctx.strokeStyle = '#3a78b8';
    ctx.lineWidth = 0.9;
    circlePath(ctx, x, y + h + 1 + u * 2, 1 + u * 1.6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Les fumerolles (World.findVents) : de la vapeur sort de la fente en (x, y), en petits nuages qui montent, grossissent
  // et s'effacent, en se balançant ; de temps en temps, un plus gros « pschhh ». v : pour que chacune fume à son rythme.
  function steamPuffs(ctx, x, y, t, v) {
    ctx.save();
    const burst = ((t * 0.23 + v * 7) % 1) < 0.18 ? 1.6 : 1;
    for (let i = 0; i < 6; i++) {
      const u = (t * (0.42 + v * 0.1) + i / 6 + v) % 1;
      const sway = Math.sin(t * 1.3 + i * 1.7 + v * 9) * (6 + u * 18);
      const r = (5 + u * 20) * (i % 2 ? 1 : 0.85) * (burst > 1 ? 1.2 : 1);
      ctx.globalAlpha = (1 - u) * (u < 0.12 ? u / 0.12 : 1) * 0.55;
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, x + sway, y - 4 - u * 110 * burst, r);
      ctx.fill();
    }
    // la fente, un peu orange de chaleur
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#ff9a4a';
    ellipsePath(ctx, x, y + 1, 5, 2);
    ctx.fill();
    ctx.restore();
  }

  // En toboggan sur le ventre (OUCH.luge, voir Player.updateLuge) : elle bascule sur le ventre en fly secondes, elle glisse
  // (dans la galerie : slide secondes), se relève en up secondes, puis elle a le nez tout rouge pendant nose secondes,
  // et elle éternue à ces moments-là (après s'être relevée) : « Ah… ah… » (la tête en arrière, pendant ah secondes),
  // « Atchoum ! » (la tête part en avant d'un coup, et revient en jerk secondes).
  const LUGE = { fly: 0.12, slide: 1.0, up: 0.25, nose: 1.6, sneezes: [0.45, 1.05], ah: 0.3, jerk: 0.25 };
  // Comment la dessiner : belly (de 0, debout, à 1, à plat ventre), jerk (de combien elle se penche en éternuant), nose
  // (le nez tout rouge, de 0 à 1) ; sneeze : elle éternue (ou va éternuer : « ah… ah… »).
  function lugeShape(k) {
    const L = LUGE;
    const t = k.t;
    const up = k.upT === undefined ? Infinity : k.upT;
    const belly = t < L.fly ? t / L.fly : t < up ? 1 : clamp(1 - (t - up) / L.up, 0, 1);
    let jerk = 0;
    let nose = 0;
    let sneeze = 0;
    if (t >= up) {
      nose = clamp((t - up) / 0.2, 0, 1) * clamp((k.dur - t) / 0.3, 0, 1);
      for (const s of L.sneezes) {
        const u = t - (up + L.up + s);
        if (u > -L.ah && u <= 0) {
          jerk = -0.09 * (1 + u / L.ah);
          sneeze = 1;
        } else if (u > 0 && u < L.jerk) {
          jerk = 0.2 * (1 - u / L.jerk);
          sneeze = 2;
        }
      }
    }
    return { belly, jerk, nose, sneeze };
  }

  // Le nez tout rouge (après le toboggan dans la neige), centré en (x, y), de rayon r, a : de 0 à 1. Il brille un peu,
  // comme celui d'un renne.
  function redNose(ctx, x, y, r, a, t) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    const p = 1 + Math.sin(t * 9) * 0.06;
    const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.4);
    glow.addColorStop(0, 'rgba(255,80,80,0.45)');
    glow.addColorStop(1, 'rgba(255,80,80,0)');
    ctx.fillStyle = glow;
    circlePath(ctx, x, y, r * 2.4);
    ctx.fill();
    circlePath(ctx, x, y, r * p);
    paint(ctx, '#ff3434', '#9a1020', 1);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipsePath(ctx, x - r * 0.3, y - r * 0.38, r * 0.34, r * 0.22, -0.5);
    ctx.fill();
    ctx.restore();
  }

  // Le pingouin grincheux (le Glacier Fumant), les pieds en (x, y). Bleu ardoise, avec un bonnet jaune à pompon et de
  // gros sourcils blancs tout froncés (le Pingouin qu'on joue est noir, avec une écharpe rouge et blanche).
  // o : dir, t, phase (ses pas), state ('walk', 'warn' : il se prépare à plonger, 'slide' : à plat ventre, 'up', 'rest',
  // 'dizzy', 'stuck'), flap (ses nageoires qui battent, en se préparant), nice (il est redevenu gentil), fat, rest.
  const PENG = {
    back: '#3f5a8e', backShade: '#2c4372', backLight: '#7690c4', line: '#152038',
    belly: '#f2f7ff', bellyShade: '#d3e0f2', bellyLine: '#8ea2c2',
    beak: '#ffb52e', beakDark: '#de870e', foot: '#ffa233', footLine: '#a8580a',
    hat: '#ffd23a', hatDark: '#d99a0a', hatLine: '#8a5a08', pompon: '#ffffff', brow: '#ffffff', cheek: '#ff9ab0',
  };
  function grumpyPenguin(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const st = o.state || 'walk';
    const C = PENG;
    const nice = !!o.nice;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.dir || 1, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (st === 'slide' && !nice) {
      penguinSlide(ctx, o, t);
      ctx.restore();
      return;
    }
    const fat = o.fat ? 1 : 0;
    // il se dandine en marchant ; il se penche en avant en se préparant à plonger
    const rock = st === 'walk' && o.moving ? Math.sin(o.phase || 0) * 0.13 : st === 'rest' ? Math.sin(t * 2) * 0.03 : 0;
    const lean = st === 'warn' ? 0.32 + Math.sin(t * 40) * 0.025 : 0;
    // les pieds
    const ph = o.moving ? o.phase || 0 : 0;
    for (const [fx, s] of [[-6, 0], [6, Math.PI]]) {
      const lift = o.moving ? Math.max(0, Math.sin(ph + s)) * 2.4 : 0;
      ctx.beginPath();
      ctx.ellipse(fx + 3, -2 - lift, 6.5, 2.6, 0, 0, Math.PI * 2);
      paint(ctx, C.foot, C.footLine, 1);
    }
    ctx.rotate(rock + lean);
    const bx = 0;
    const by = -18;
    const rx = 14 + fat * 5;
    const ry = 18 + fat * 1;
    // la nageoire de derrière
    const fl = st === 'warn' ? Math.sin(o.flap || 0) * 0.6 : nice ? 0 : Math.sin(ph) * 0.2;
    flipperP(ctx, -8, -28, 0.35 - fl, true);
    // le corps
    ellipsePath(ctx, bx, by, rx, ry);
    paint(ctx, C.back, C.line, 1.2);
    ctx.save();
    ellipsePath(ctx, bx, by, rx, ry);
    ctx.clip();
    ellipsePath(ctx, bx + 5, by + 3, rx - 4, ry - 3);
    paint(ctx, C.belly, C.bellyLine, 1);
    ctx.fillStyle = C.bellyShade;
    ellipsePath(ctx, bx + 7, by + 11, rx - 8, 5);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = C.backLight;
    ellipsePath(ctx, -9, -24, 2.4, 5, 0.3);
    ctx.fill();
    // la tête
    const hx = 3;
    const hy = -39;
    circlePath(ctx, hx, hy, 11.5);
    paint(ctx, C.back, C.line, 1.2);
    // le visage blanc
    ctx.save();
    circlePath(ctx, hx, hy, 11.5);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(hx + 13, hy - 7);
    ctx.quadraticCurveTo(hx + 3, hy - 9, hx + 1.5, hy - 3);
    ctx.quadraticCurveTo(hx, hy + 4, hx + 2, hy + 13);
    ctx.lineTo(hx + 13, hy + 13);
    ctx.closePath();
    paint(ctx, C.belly, C.bellyLine, 1);
    ctx.restore();
    penguinFace(ctx, hx, hy, o, t, st, nice);
    penguinHat(ctx, hx, hy, t, st, nice);
    penguinBrows(ctx, hx, hy, t, st, nice);
    // la nageoire de devant (qui bat en se préparant ; qui fait coucou quand il est gentil)
    const wave = nice ? -2.2 + Math.sin(t * 14) * 0.4 : st === 'rest' ? 0.9 : 0.25 + fl;
    flipperP(ctx, 3, -27, wave, false);
    ctx.restore();
  }

  // Une nageoire du pingouin grincheux, depuis l'épaule (x, y), tournée de a.
  function flipperP(ctx, x, y, a, back) {
    const C = PENG;
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
    paint(ctx, back ? C.backShade : C.back, C.line, 1);
    ctx.restore();
  }

  // Son visage : le bec, l'œil, et ses gros sourcils blancs tout froncés (gentil : ils remontent, il ferme les yeux
  // en souriant, les joues toutes roses).
  function penguinFace(ctx, hx, hy, o, t, st, nice) {
    const C = PENG;
    // le bec (grincheux : la pointe tournée vers le bas ; gentil : il sourit, le bec ouvert)
    ctx.beginPath();
    ctx.moveTo(hx + 9, hy - 1);
    ctx.quadraticCurveTo(hx + 15, hy - 0.5, hx + 18, hy + (nice ? 1 : 3));
    ctx.quadraticCurveTo(hx + 14, hy + 3, hx + 9, hy + 2.5);
    ctx.closePath();
    paint(ctx, C.beak, C.beakDark, 0.9);
    if (nice || st === 'warn') {
      ctx.beginPath();
      ctx.moveTo(hx + 9, hy + 2.5);
      ctx.quadraticCurveTo(hx + 13, hy + (nice ? 7 : 6), hx + 16, hy + 4);
      ctx.closePath();
      paint(ctx, C.beakDark, C.beakDark, 0.8);
    }
    const ex = hx + 6.5;
    const ey = hy;
    if (nice) {
      // les yeux fermés, tout contents : ^ ^
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(ex, ey + 1.2, 2.6, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.fillStyle = C.cheek;
      ctx.globalAlpha = 0.8;
      ellipsePath(ctx, ex - 0.5, ey + 5.5, 3, 1.8);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (st === 'dizzy') {
      // la tête qui tourne : une spirale
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let a = 0; a < 9; a += 0.4) {
        const r = a * 0.36;
        const px = ex + Math.cos(a + t * 9) * r;
        const py = ey + Math.sin(a + t * 9) * r;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + (i * Math.PI * 2) / 3;
        ctx.save();
        ctx.translate(hx + Math.cos(a) * 13, hy - 17 + Math.sin(a) * 3);
        starShape(ctx, 3.2, 0.45);
        paint(ctx, '#ffe94a', '#b07800', 0.8);
        ctx.restore();
      }
    } else {
      // un petit œil plissé, en colère (tout rond une seconde, quand il voit Malice)
      const big = st === 'warn' ? 1.2 : st === 'stuck' ? 1.25 : 1;
      ellipsePath(ctx, ex, ey + 0.5, 3.1 * big, 2.8 * big);
      paint(ctx, '#ffffff', C.line, 0.9);
      ctx.fillStyle = '#15101c';
      circlePath(ctx, ex + 1, ey + 0.9, 1.6 * big);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, ex + 0.5, ey + 0.2, 0.5);
      ctx.fill();
      // la paupière du dessus, toute penchée vers le bec (l'air fâché)
      if (st !== 'stuck') {
        ctx.fillStyle = C.back;
        ctx.beginPath();
        ctx.moveTo(ex - 3.6, ey - 3);
        ctx.lineTo(ex + 3.6, ey + 0.2);
        ctx.lineTo(ex + 3.6, ey - 3.4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Ses gros sourcils blancs, bien touffus (ils dépassent sous le bonnet) : tout froncés vers le bec ; quand il se
  // prépare à plonger, ils sautillent de colère ; gentil, ils remontent tout ronds.
  function penguinBrows(ctx, hx, hy, t, st, nice) {
    const C = PENG;
    ctx.save();
    ctx.translate(hx + 5.5, hy - 4.6 - (nice ? 2.6 : 0) - (st === 'warn' ? Math.abs(Math.sin(t * 20)) * 1 : 0));
    ctx.rotate(nice ? -0.25 : 0.5 + (st === 'warn' ? 0.12 : 0));
    ctx.beginPath();
    if (nice) {
      ctx.moveTo(-6, 1.2);
      ctx.quadraticCurveTo(0, -5, 6.5, 1.2);
      ctx.quadraticCurveTo(0, -1.2, -6, 1.2);
    } else {
      ctx.moveTo(-6.5, 1.2);
      ctx.quadraticCurveTo(-6.5, -3.4, -2.5, -3);
      ctx.quadraticCurveTo(0, -4.8, 2.6, -3);
      ctx.quadraticCurveTo(6.4, -3.4, 7.6, 0.4);
      ctx.quadraticCurveTo(7.2, 2.6, 4.5, 2.2);
      ctx.quadraticCurveTo(-1, 2.8, -6.5, 1.2);
    }
    ctx.closePath();
    paint(ctx, C.brow, C.line, 1.15);
    ctx.restore();
  }

  // Son bonnet jaune à pompon (qui sautille), sur la tête (hx, hy).
  function penguinHat(ctx, hx, hy, t, st, nice) {
    const C = PENG;
    const bob = st === 'walk' || nice ? Math.sin(t * 9) * 1.2 : 0;
    ctx.beginPath();
    ctx.moveTo(hx - 11, hy - 7);
    ctx.quadraticCurveTo(hx - 12, hy - 20, hx - 2, hy - 21);
    ctx.quadraticCurveTo(hx + 9, hy - 21, hx + 10, hy - 9);
    ctx.closePath();
    paint(ctx, C.hat, C.hatLine, 1.1);
    // des côtes de tricot
    ctx.strokeStyle = C.hatDark;
    ctx.lineWidth = 1.1;
    for (const dx of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(hx + dx - 0.5, hy - 19);
      ctx.lineTo(hx + dx, hy - 10);
      ctx.stroke();
    }
    // le revers
    roundRectPath(ctx, hx - 12.5, hy - 11, 24, 5.5, 2.6);
    paint(ctx, C.hatDark, C.hatLine, 1);
    // le pompon
    circlePath(ctx, hx - 4, hy - 23 + bob, 4.2);
    paint(ctx, C.pompon, '#9aa6ba', 1);
  }

  // À plat ventre, il file vers l'avant (le bonnet en arrière, les pieds en l'air, l'air bien décidé).
  function penguinSlide(ctx, o, t) {
    const C = PENG;
    // les pieds en l'air derrière
    for (const [fx, fy, a] of [[-20, -12, -0.5], [-22, -8, -0.2]]) {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(a);
      ellipsePath(ctx, -3, 0, 5.5, 2.4);
      paint(ctx, C.foot, C.footLine, 1);
      ctx.restore();
    }
    flipperP(ctx, 2, -15, 1.75, true);
    const wob = Math.sin(t * 30) * 0.6;
    ellipsePath(ctx, -4, -10.5 + wob * 0.3, 20, 10.5);
    paint(ctx, C.back, C.line, 1.2);
    ctx.save();
    ellipsePath(ctx, -4, -10.5 + wob * 0.3, 20, 10.5);
    ctx.clip();
    ellipsePath(ctx, -1, -1.5, 22, 7.5);
    paint(ctx, C.belly, C.bellyLine, 1);
    ctx.restore();
    // la tête, tournée vers l'avant
    const hx = 13;
    const hy = -13;
    circlePath(ctx, hx, hy, 9.5);
    paint(ctx, C.back, C.line, 1.2);
    ctx.save();
    circlePath(ctx, hx, hy, 9.5);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(hx + 11, hy - 6);
    ctx.quadraticCurveTo(hx + 2, hy - 8, hx + 1, hy - 2);
    ctx.quadraticCurveTo(hx, hy + 4, hx + 2, hy + 11);
    ctx.lineTo(hx + 11, hy + 11);
    ctx.closePath();
    paint(ctx, C.belly, C.bellyLine, 1);
    ctx.restore();
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(0.85, 0.85);
    penguinFace(ctx, 0, 0, o, t, 'slide', false);
    penguinBrows(ctx, 0, 0, t, 'slide', false);
    // le bonnet, emporté vers l'arrière par le vent
    ctx.rotate(-0.9);
    penguinHat(ctx, 0, 0, t, 'slide', false);
    ctx.restore();
    flipperP(ctx, 3, -11, 1.6, false);
  }

  // Hérisson de roche (la Grande Glissade), les pieds en (x, y) : un hérisson tout en pierre, ses piquants sont des
  // éclats de roche, avec des petits cailloux collés dessus. En boule, c'est une grosse boule de cailloux qui roule.
  // o : t, dir, curl (0 : déroulé, 1 : en boule), spin (de combien la boule a tourné, en radians), eyes ('sleep' : il
  // dort en boule, le bout du nez et les yeux fermés qui dépassent ; 'open' : « ! », ses yeux tout ronds ; 'dizzy' :
  // les yeux qui tournent et des étoiles ; 'nap' : il fait la sieste, tout gentil ; '' : rien), look, moving, phase,
  // fat, rest (essoufflé)
  function rockHog(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const dir = o.dir || 1;
    const k = clamp(o.curl || 0, 0, 1);
    const fat = !!o.fat;
    const eyes = o.eyes || '';
    const line = '#2e2422';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // les petites pattes (elles rentrent quand il se met en boule)
    if (k < 0.75) {
      const ph = o.moving ? o.phase || 0 : 0;
      ctx.fillStyle = '#4e4240';
      for (const [fx, s] of [[-12, 0], [-5, Math.PI], [6, Math.PI * 0.5], [13, Math.PI * 1.5]]) {
        const lift = o.moving ? Math.max(0, Math.sin(ph + s)) * 2.5 : 0;
        ellipsePath(ctx, fx + Math.cos(ph + s) * 1.6, -2.4 - lift - k * 4, 4, 2.6);
        ctx.fill();
      }
    }
    // le manteau d'éclats de roche : sur le dos quand il est déroulé, tout autour quand il est en boule (et il tourne
    // avec la boule qui roule)
    const cx = lerp(-3, 0, k);
    const cy = lerp(-14, -18, k);
    const rx = lerp(fat ? 24 : 20, 17.5, k);
    const ry = lerp(fat ? 16 : 13.5, 17.5, k);
    const spin = (o.spin || 0) * k;
    const a0 = lerp(-Math.PI - 0.25, -Math.PI * 1.5, k) + spin;
    const a1 = lerp(-0.3, Math.PI * 0.5, k) + spin;
    const n = Math.max(8, Math.round((a1 - a0) / 0.42));
    const spike = lerp(7.5, 8, k);
    const P = (a, r) => [cx + Math.cos(a) * (rx + r), cy + Math.sin(a) * (ry + r)];
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      // (des éclats de roche : pointus, de travers, pas tous pareils)
      const [ox, oy] = P(a + 0.06, spike + hash(i * 3.3) * 2.5);
      const [ix, iy] = P(a + (a1 - a0) / n / 2, -1);
      if (i === 0) ctx.moveTo(...P(a, -2));
      ctx.lineTo(ox, oy);
      if (i < n) ctx.lineTo(ix, iy);
    }
    if (k < 0.98) ctx.lineTo(cx + 4, cy + ry * 0.4);
    ctx.closePath();
    paint(ctx, '#6e605c', line, 1.4);
    // la lumière sur un côté de chaque éclat
    ctx.fillStyle = 'rgba(232,222,214,0.55)';
    for (let i = 0; i < n; i += 1) {
      const a = a0 + ((a1 - a0) * i) / n;
      const [ox, oy] = P(a + 0.06, spike * 0.8 + hash(i * 3.3) * 2);
      const [bx, by] = P(a - 0.05, 0);
      const [b2x, b2y] = P(a + 0.12, 0);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ox, oy);
      ctx.lineTo((bx + b2x) / 2, (by + b2y) / 2);
      ctx.closePath();
      ctx.fill();
    }
    // le corps de pierre
    ellipsePath(ctx, cx, cy, rx - 2, ry - 2);
    const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
    g.addColorStop(0, '#b5a7a0');
    g.addColorStop(1, '#7a6a66');
    ctx.fillStyle = g;
    ctx.fill();
    // des petits cailloux collés dessus (ils tournent avec la boule)
    for (let i = 0; i < 5; i++) {
      const a = lerp(a0, a1, (i + 0.5) / 5) + 0.2;
      const d = 0.45 + hash(i * 5.7) * 0.35;
      const px = cx + Math.cos(a) * (rx - 2) * d;
      const py = cy + Math.sin(a) * (ry - 2) * d;
      const r = 2 + hash(i * 2.9) * 1.6;
      ellipsePath(ctx, px, py + 0.6, r + 0.5, r * 0.75 + 0.5);
      ctx.fillStyle = '#5a4c48';
      ctx.fill();
      ellipsePath(ctx, px, py, r, r * 0.72);
      ctx.fillStyle = i % 2 ? '#d8ccc4' : '#9d8f88';
      ctx.fill();
    }
    const face = clamp(1 - k * 1.6, 0, 1);
    if (face > 0) {
      ctx.save();
      ctx.globalAlpha *= face;
      // le museau, couleur sable, et le gros nez rose
      const fx = fat ? 3 : 0;
      ctx.beginPath();
      ctx.moveTo(3 + fx, -22);
      ctx.quadraticCurveTo(13 + fx, -20, 22 + fx, -11);
      ctx.quadraticCurveTo(14 + fx, -3, 3 + fx, -3);
      ctx.quadraticCurveTo(-2, -12, 3 + fx, -22);
      paint(ctx, '#ead8c2', line, 1.2);
      ctx.fillStyle = 'rgba(255,120,140,0.45)';
      ellipsePath(ctx, 10 + fx, -8, 3, 2);
      ctx.fill();
      circlePath(ctx, 22 + fx, -11, 2.9);
      paint(ctx, '#e0687c', line, 0.8);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      circlePath(ctx, 21.3 + fx, -12.1, 0.9);
      ctx.fill();
      circlePath(ctx, 4 + fx, -22, 2.6);
      paint(ctx, '#c9b49c', line, 1);
      // l'œil
      const ex = 12 + fx;
      const ey = -15;
      if (eyes === 'dizzy') {
        circlePath(ctx, ex, ey, 3.2);
        paint(ctx, '#ffffff', line, 0.9);
        ctx.strokeStyle = '#3a2a28';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 14; i++) {
          const a = t * 9 + i * 0.7;
          const r = i * 0.19;
          if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
        }
        ctx.stroke();
      } else if (eyes === 'nap' || (fat && o.rest)) {
        // les yeux fermés, tout content (un petit arc)
        ctx.strokeStyle = '#1a1010';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(ex, ey - 1, 2.2, 0.3, Math.PI - 0.3);
        ctx.stroke();
      } else {
        const look = o.look || { x: 1, y: 0 };
        const lx = clamp(look.x * dir, -1, 1);
        circlePath(ctx, ex + lx * 0.8, ey, 2.2);
        ctx.fillStyle = '#1a1010';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        circlePath(ctx, ex - 0.6 + lx * 0.8, ey - 0.8, 0.8);
        ctx.fill();
      }
      // la bouche : un sourire (il est gentil, au fond)
      ctx.strokeStyle = '#5a2a20';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(16 + fx, -8, 2.2, 0.3, Math.PI - 0.6);
      ctx.stroke();
      if (fat) chubbyCheeks(ctx, 9 + fx, -9, 3.6, 2.8, '#ead8c2', line);
      ctx.restore();
    }
    if (k > 0.6 && (eyes === 'sleep' || eyes === 'open')) {
      // en boule, sur le devant : le bout de son nez, et ses yeux (fermés quand il dort, tout ronds quand il a vu Malice)
      ctx.save();
      ctx.globalAlpha *= clamp((k - 0.6) / 0.3, 0, 1);
      ellipsePath(ctx, 10.5, -9, 6.5, 5);
      ctx.fillStyle = '#ead8c2';
      ctx.fill();
      circlePath(ctx, 14.5, -8.5, 2.4);
      paint(ctx, '#e0687c', line, 0.8);
      if (eyes === 'open') {
        for (const ex of [6.5, 11.5]) {
          circlePath(ctx, ex, -14.5, 2.6);
          paint(ctx, '#ffffff', line, 0.8);
          circlePath(ctx, ex + 0.7, -14.3, 1.3);
          ctx.fillStyle = '#1a1010';
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = '#1a1010';
        ctx.lineWidth = 1.2;
        for (const ex of [6.5, 11.5]) {
          ctx.beginPath();
          ctx.arc(ex, -15, 1.8, 0.2, Math.PI - 0.2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    // étourdi : des étoiles tournent au-dessus de sa tête
    if (eyes === 'dizzy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + (i * TAU) / 3;
        ctx.save();
        ctx.translate(8 + Math.cos(a) * 13, -34 + Math.sin(a) * 3.5);
        ctx.rotate(t * 4 + i);
        starShape(ctx, 3.6, 0.45);
        paint(ctx, '#ffe94a', '#b07800', 0.9);
        ctx.restore();
      }
    }
    ctx.restore();
    // il dort (ou fait la sieste) : des petits « z » qui montent
    if (eyes === 'sleep' || eyes === 'nap') {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = 'rgba(60,40,40,0.6)';
      ctx.lineWidth = 2;
      ctx.font = 'bold 13px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 2; i++) {
        const ph = (t * 0.5 + i * 0.5) % 1;
        const zx = x + dir * (8 + ph * 12);
        const zy = y - 38 - ph * 22;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        ctx.strokeText('z', zx, zy);
        ctx.fillText('z', zx, zy);
      }
      ctx.restore();
    }
  }

  // La boule de cailloux où Malice est roulée par un hérisson de roche (OUCH.crepe) : centrée en (x, y), de rayon r,
  // tournée de a (elle roule). k : de 1 (toute la boule) à 0 (les cailloux sont tous partis).
  function pebbleBall(ctx, x, y, r, a, k) {
    if (k <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    for (let i = 0; i < 18; i++) {
      // (sur deux tours : tout autour, et quelques-uns par-dessus elle ; on la voit encore, toute petite, au milieu)
      const ring = i < 13 ? 1 : 0.62;
      const ang = hash(i * 7.31) * TAU + i * 0.9;
      const d = r * ring * (0.9 + hash(i * 3.7) * 0.18) * (1 + (1 - k) * 0.6);
      const px = Math.cos(ang) * d;
      const py = Math.sin(ang) * d;
      const s = (4.2 + hash(i * 1.9) * 3.6) * (0.6 + 0.4 * k);
      ctx.globalAlpha = clamp(k * 1.6 - hash(i * 2.3) * 0.6, 0, 1);
      ellipsePath(ctx, px, py + 0.8, s + 0.8, s * 0.78 + 0.8, ang);
      ctx.fillStyle = '#4e4240';
      ctx.fill();
      ellipsePath(ctx, px, py, s, s * 0.78, ang);
      ctx.fillStyle = ['#a8918c', '#c9bbb5', '#8a7470', '#d8ccc4'][i % 4];
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ellipsePath(ctx, px - s * 0.3, py - s * 0.3, s * 0.35, s * 0.2, ang);
      ctx.fill();
    }
    ctx.restore();
  }

  // Sanglier maléfique, les pieds en (x, y) : tout hirsute, une crête de poils noirs sur le dos, de petites
  // défenses blanches, un groin rose, et des yeux rouges qui brillent (sous un gros sourcil tout froncé).
  // o : dir, t, phase (les pattes), moving, scratch (il gratte le sol de la patte avant, la tête baissée),
  //     rush (il fonce, la tête en avant), dizzy (étourdi : les yeux qui tournent et des étoiles),
  //     kind (il redevient gentil : de doux yeux noirs), fat, rest (essoufflé)
  function boar(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const dir = o.dir || 1;
    const fat = !!o.fat;
    const line = '#24160e';
    const fur = '#6e4c36';
    const furDark = '#4a3224';
    const furLight = '#94704e';
    const ph = o.phase || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // la tête baissée quand il gratte le sol ou qu'il fonce
    const low = o.rush ? 1 : o.scratch ? 0.7 : 0;
    const bob = o.rush ? -Math.abs(Math.sin(ph)) * 2.5 : o.moving ? -Math.abs(Math.sin(ph)) : 0;
    // étourdi, il tangue
    if (o.dizzy) ctx.rotate(Math.sin(t * 6) * 0.05);
    // les pattes : derrière, celles de l'autre côté (plus sombres)
    const legs = [[-17, 0, true], [12, Math.PI * 0.5, true], [-9, Math.PI, false], [19, Math.PI * 1.5, false]];
    for (const [lx, s, back] of legs) {
      let a = o.moving || o.rush ? Math.sin(ph + s) * (o.rush ? 0.75 : 0.35) : 0;
      // il gratte le sol : la patte avant racle vers l'arrière, encore et encore
      if (o.scratch && lx === 19) a = 0.15 + Math.max(0, Math.sin(t * 17)) * 0.95;
      ctx.save();
      ctx.translate(lx, -13 + bob);
      ctx.rotate(a);
      roundRectPath(ctx, -3.6, -2, 7.2, 13, 3);
      paint(ctx, back ? furDark : fur, line, 1.1);
      // le sabot
      ctx.beginPath();
      ctx.moveTo(-3.8, 9.5);
      ctx.lineTo(3.8, 9.5);
      ctx.lineTo(4.2, 13.2);
      ctx.lineTo(-4.2, 13.2);
      ctx.closePath();
      paint(ctx, '#2a1a12', line, 0.9);
      ctx.restore();
    }
    // la petite queue en tire-bouchon, avec sa touffe
    ctx.strokeStyle = furDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-27, -27 + bob);
    ctx.quadraticCurveTo(-34, -31 + bob + Math.sin(t * 9) * 1.5, -31, -35 + bob);
    ctx.quadraticCurveTo(-28, -37 + bob, -30, -32 + bob);
    ctx.stroke();
    // le corps tout rond (et tout gros avec les chips)
    const bx = fat ? -1 : -3;
    const by = -25 + bob;
    const rx = fat ? 31 : 26;
    const ry = fat ? 18 : 15;
    // la crête de poils sur le dos (elle se hérisse quand il est en colère)
    const crest = o.kind ? 3 : o.rush || o.scratch ? 8 : 5.5;
    ctx.beginPath();
    for (let i = 0; i <= 9; i++) {
      const a = Math.PI * (1.12 + i * 0.075);
      const r = i % 2 ? 0 : crest;
      const px = bx + Math.cos(a) * (rx + r * 0.4);
      const py = by + Math.sin(a) * (ry + r);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(bx + rx * 0.4, by);
    ctx.lineTo(bx - rx * 0.6, by);
    ctx.closePath();
    paint(ctx, '#2e1e16', line, 1.1);
    ellipsePath(ctx, bx, by, rx, ry);
    const g = ctx.createLinearGradient(0, by - ry, 0, by + ry);
    g.addColorStop(0, furLight);
    g.addColorStop(0.55, fur);
    g.addColorStop(1, furDark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // des mèches de poils hirsutes
    ctx.strokeStyle = 'rgba(36,22,14,0.5)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const px = bx - rx * 0.7 + i * rx * 0.28;
      const py = by - ry * 0.25 + (i % 2) * 5;
      ctx.moveTo(px, py);
      ctx.lineTo(px - 3, py + 5);
    }
    ctx.stroke();
    // la tête, au bout du corps (plus bas quand il gratte ou qu'il fonce)
    const hx = (fat ? 22 : 19) + low * 3;
    const hy = -25 + low * 6 + bob;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(0.12 + low * 0.22);
    // l'oreille pointue
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-9 - (o.kind ? 2 : 0), -19 + (o.kind ? 4 : 0));
    ctx.lineTo(0, -10);
    ctx.closePath();
    paint(ctx, furDark, line, 1.1);
    ctx.fillStyle = '#c88a80';
    ctx.beginPath();
    ctx.moveTo(-5.5, -9.5);
    ctx.lineTo(-7.8, -16 + (o.kind ? 3 : 0));
    ctx.lineTo(-2, -10.5);
    ctx.closePath();
    ctx.fill();
    // la tête et le museau, jusqu'au groin
    ctx.beginPath();
    ctx.moveTo(-8, -11);
    ctx.quadraticCurveTo(4, -14, 13, -6);
    ctx.lineTo(16, -5);
    ctx.lineTo(16, 5);
    ctx.quadraticCurveTo(5, 10, -6, 8);
    ctx.quadraticCurveTo(-13, 0, -8, -11);
    paint(ctx, fur, line, 1.2);
    if (fat) chubbyCheeks(ctx, 2, 3, 5, 4, furLight, line);
    // le groin rose, avec ses deux narines
    ellipsePath(ctx, 17, 0, 3.6, 5.6);
    paint(ctx, '#e8a8a0', line, 1.1);
    ctx.fillStyle = '#5a2a2a';
    ellipsePath(ctx, 17.6, -2, 1, 1.5);
    ctx.fill();
    ellipsePath(ctx, 17.6, 2.2, 1, 1.5);
    ctx.fill();
    // les petites défenses blanches
    ctx.beginPath();
    ctx.moveTo(9.5, 6);
    ctx.quadraticCurveTo(13.5, 5, 13, -0.5);
    ctx.quadraticCurveTo(11.5, 3.5, 8.5, 3.5);
    ctx.closePath();
    paint(ctx, '#fff8e8', line, 0.9);
    // la bouche (étourdi : la langue qui pend)
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (o.kind) ctx.arc(7, 3.5, 3, 0.2, Math.PI - 0.4);
    else {
      ctx.moveTo(3, 6);
      ctx.lineTo(9, 5.5);
    }
    ctx.stroke();
    if (o.dizzy) {
      ellipsePath(ctx, 6.5, 8.5, 2.2, 3.2, 0.2);
      paint(ctx, '#ff7a8a', '#a83a4a', 0.8);
    }
    // l'œil : rouge et qui brille (sous un gros sourcil froncé) ; étourdi, il tourne ; gentil, il est tout doux
    const ex = 1.5;
    const ey = -5.5;
    if (o.kind) {
      circlePath(ctx, ex, ey, 2.4);
      paint(ctx, '#1a1010', null);
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, ex - 0.8, ey - 0.9, 0.9);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,0.5)';
      ellipsePath(ctx, 3, 2.5, 3, 1.8);
      ctx.fill();
    } else if (o.dizzy) {
      circlePath(ctx, ex, ey, 3.4);
      paint(ctx, '#ffffff', line, 1);
      ctx.strokeStyle = '#c02020';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const a = t * 9 + i * 0.7;
        const r = i * 0.2;
        if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
      }
      ctx.stroke();
    } else if (fat && o.rest) {
      ctx.strokeStyle = line;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ex - 2.5, ey);
      ctx.lineTo(ex + 2.5, ey);
      ctx.stroke();
    } else {
      // (la lueur rouge, par-dessus)
      glow(ctx, ex, ey, o.rush || o.scratch ? 13 : 10, '255,50,30', 0.75 + Math.sin(t * 5) * 0.15);
      circlePath(ctx, ex, ey, 2.7);
      paint(ctx, '#ff2a1a', '#7a0a0a', 0.9);
      ctx.fillStyle = '#ffe8a0';
      circlePath(ctx, ex + 0.5, ey - 0.4, 1);
      ctx.fill();
      // le sourcil tout froncé
      ctx.strokeStyle = '#1a0e08';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(ex - 4, ey - 5.5);
      ctx.lineTo(ex + 4.5, ey - 2.2);
      ctx.stroke();
    }
    ctx.restore();
    // il fonce : des traits de vitesse derrière lui
    if (o.rush) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const len = 10 + ((t * 40 + i * 7) % 12);
        ctx.beginPath();
        ctx.moveTo(-34 - i * 3, -32 + i * 8 + bob);
        ctx.lineTo(-34 - i * 3 - len, -32 + i * 8 + bob);
        ctx.stroke();
      }
    }
    // étourdi : des étoiles tournent au-dessus de sa tête
    if (o.dizzy) {
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + (i * TAU) / 3;
        ctx.save();
        ctx.translate(hx - 2 + Math.cos(a) * 15, hy - 22 + Math.sin(a) * 4);
        ctx.rotate(t * 4 + i);
        starShape(ctx, 4, 0.45);
        paint(ctx, '#ffe94a', '#b07800', 0.9);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // Le petit tas de terre au-dessus d'une taupe qui creuse, posé sur l'herbe en (x, y).
  // La lumière de sa lampe passe entre les mottes. o : t, moving, dir, shake (de 0 à 1 : la terre tremble).
  function moleHill(ctx, x, y, o) {
    const t = o.t || 0;
    const k = o.shake || 0;
    ctx.save();
    ctx.translate(x, y);
    if (k > 0) ctx.translate(rand(-1, 1) * (1 + k * 3), rand(-0.5, 0.5) * (1 + k * 2));
    const bob = o.moving ? Math.abs(Math.sin(t * 9)) * 2 : 0;
    const s = 1 + k * 0.3;
    ctx.scale((o.dir || 1) * s, s);
    // la lumière qui passe à travers
    glow(ctx, 4, -12, 22, '255,240,170', 0.4 + 0.2 * Math.sin(t * 5) + k * 0.3);
    ctx.beginPath();
    ctx.moveTo(-24, 1);
    ctx.quadraticCurveTo(-20, -8 - bob, -9, -13 - bob);
    ctx.quadraticCurveTo(2, -19 - bob, 12, -12 - bob);
    ctx.quadraticCurveTo(22, -6, 24, 1);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -18, 0, 0);
    g.addColorStop(0, '#c48a52');
    g.addColorStop(1, '#7a4a24');
    paint(ctx, g, '#4a2a12', 1.3);
    // des mottes, des cailloux et un brin d'herbe arraché
    for (const [px, py, r, c] of [[-12, -6, 3.4, '#9a6438'], [-2, -12, 3, '#a8703e'], [9, -7, 3.6, '#8a5a30'], [16, -2, 2.4, '#6a4024'], [-5, -3, 2, '#b8b0c0']]) {
      circlePath(ctx, px, py - bob * 0.6, r);
      ctx.fillStyle = c;
      ctx.fill();
    }
    ctx.strokeStyle = '#4fae6a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -15 - bob);
    ctx.quadraticCurveTo(6, -22 - bob, 3 + Math.sin(t * 3) * 2, -26 - bob);
    ctx.stroke();
    // un rayon de lumière entre deux mottes
    ctx.fillStyle = `rgba(255,248,200,${0.7 + 0.3 * Math.sin(t * 5)})`;
    ellipsePath(ctx, 2, -13 - bob, 2.6, 1.3, -0.3);
    ctx.fill();
    // ça tremble : des petites fissures
    if (k > 0.2) {
      ctx.strokeStyle = 'rgba(40,20,8,0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-16, -3);
      ctx.lineTo(-11, -8);
      ctx.lineTo(-13, -11);
      ctx.moveTo(14, -4);
      ctx.lineTo(10, -9);
      ctx.lineTo(13, -12);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Le trou d'une taupe dans l'herbe, en (x, y) ; k : sa taille.
  function moleHole(ctx, x, y, k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, 1);
    ellipsePath(ctx, 0, 0, 20, 5.5);
    paint(ctx, '#2a160c', '#6a4024', 1.4);
    for (const [px, r] of [[-22, 5], [21, 5.5], [-15, 3.4], [15, 3.2]]) {
      ctx.beginPath();
      ctx.arc(px, 2, r, Math.PI, 0);
      ctx.closePath();
      paint(ctx, '#9a6438', '#4a2a12', 1);
    }
    ctx.restore();
  }

  // Une luciole en (x, y) : un petit corps, des ailes qui frétillent, et le derrière qui brille
  // (son halo : voir glow). k : de 0 à 1 (elle clignote), dir : vers où elle vole.
  // (Dessinée par-dessus la nuit.)
  function firefly(ctx, x, y, k, dir, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(230,240,255,0.55)';
    const f = Math.sin(t * 40) * 0.6;
    ellipsePath(ctx, -1, -3, 2.8, 1.4 + f, -0.6);
    ctx.fill();
    ellipsePath(ctx, 1, -3, 2.6, 1.3 - f * 0.5, 0.5);
    ctx.fill();
    ctx.fillStyle = '#3a2a40';
    ellipsePath(ctx, 1.5, 0, 2.2, 1.6);
    ctx.fill();
    ctx.fillStyle = `rgb(${200 + k * 55},255,${110 + k * 60})`;
    circlePath(ctx, -1.8, 0.4, 1.6 + k * 0.8);
    ctx.fill();
    ctx.restore();
  }

  // La bave d'un escargot (une goutte : elles se touchent et font une traînée qui brille).
  // age : depuis combien de temps elle est là ; elle sèche de wet à total (elle devient terne et s'efface).
  function slimeDrop(ctx, x, y, age, v, wet, total) {
    const dry = clamp((age - wet) / (total - wet), 0, 1);
    const a = (1 - dry) * Math.min(1, age * 4);
    if (a <= 0.01) return;
    // (argentée et un peu bleutée : on la voit bien sur l'herbe)
    if (dry <= 0) {
      ctx.fillStyle = `rgba(70,120,150,${0.35 * a})`;
      ellipsePath(ctx, x, y - 0.5, 8, 3.2);
      ctx.fill();
    }
    ctx.fillStyle = dry > 0 ? `rgba(235,240,230,${0.45 * a})` : `rgba(215,240,255,${0.85 * a})`;
    ellipsePath(ctx, x, y - 2, 7.5, 2.8);
    ctx.fill();
    if (dry > 0) return;
    // ça brille
    const tw = 0.5 + 0.5 * Math.sin(age * 4 + v * 20);
    ctx.fillStyle = `rgba(255,255,255,${0.9 * tw * a})`;
    ellipsePath(ctx, x - 2 + v * 4, y - 3, 2.6, 0.9);
    ctx.fill();
  }

  // Nénuphar : une grande feuille ronde (vue un peu de côté) avec son encoche. Les solides ont une fleur
  // rose ; ceux qui coulent sont plus jaunes, et un peu grignotés. (cx, y) : le milieu du dessus.
  function lilyPad(ctx, cx, y, w, o) {
    o = o || {};
    const t = o.t || 0;
    const rx = w / 2;
    const ry = 7;
    const cy = y + ry;
    // une vaguelette autour, à la surface de l'eau
    if (o.surface != null) {
      const k = (t * 0.6) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.45 * (1 - k)})`;
      ctx.lineWidth = 1.5;
      ellipsePath(ctx, cx, o.surface + 2, rx + 4 + k * 12, 4 + k * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(o.tilt || 0);
    // grignoté : des petits bouts en moins sur le bord
    if (o.sinks) {
      ctx.beginPath();
      ctx.rect(-rx - 10, -ry - 30, w + 20, ry * 2 + 40);
      for (const [bx, by, br] of [[-rx * 0.62, ry * 0.75, 5], [rx * 0.8, -ry * 0.55, 4.5], [rx * 0.35, ry * 0.95, 3.5]]) {
        ctx.moveTo(bx + br, by);
        ctx.arc(bx, by, br, 0, TAU);
      }
      ctx.clip('evenodd');
    }
    // l'épaisseur de la feuille, puis le dessus avec l'encoche
    const top = o.sinks ? ['#c8ec7a', '#9fd45a', '#6fa040'] : ['#8ee070', '#4fbf4a', '#2f8a35'];
    ellipsePath(ctx, 0, 3, rx, ry);
    ctx.fillStyle = top[2];
    ctx.fill();
    const notch = 0.32;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI * 0.5 + notch, Math.PI * 2.5 - notch);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -ry, 0, ry);
    g.addColorStop(0, top[0]);
    g.addColorStop(1, top[1]);
    paint(ctx, g, top[2], 1.4);
    // les nervures
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const a = Math.PI * 0.5 + notch + (i / 8) * (TAU - notch * 2);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * rx * 0.85, Math.sin(a) * ry * 0.85);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ellipsePath(ctx, -rx * 0.35, -ry * 0.35, rx * 0.25, ry * 0.25);
    ctx.fill();
    ctx.restore();
    // la fleur (seulement sur les nénuphars solides)
    if (!o.sinks) {
      const fx = cx - rx * 0.45;
      const fy = cy - 2;
      ctx.save();
      ctx.translate(fx, fy);
      const petal = (a, len, wid, col) => {
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(wid, -len * 0.5, 0, -len);
        ctx.quadraticCurveTo(-wid, -len * 0.5, 0, 0);
        paint(ctx, col, '#d0508a', 0.7);
        ctx.restore();
      };
      for (const a of [-1.25, 1.25, -0.8, 0.8]) petal(a, 9, 3.6, '#ffc0dc');
      for (const a of [-0.4, 0.4, 0]) petal(a, 10.5, 3.4, '#ffe4f0');
      ctx.fillStyle = '#ffd23a';
      ellipsePath(ctx, 0, -2, 2.6, 1.6);
      ctx.fill();
      ctx.restore();
    }
  }

  // Lapin assis (le terrier secret), les pieds en (x, y). o : t, dir, hop (un bond, de 0 à 1, ou -1),
  // peek (de 0 à 1 : il sort la tête de son trou, dans l'herbe ; -1 : pas de trou), v (sa couleur).
  function bunny(ctx, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const v = o.v || 0;
    const cols = [['#ffffff', '#e6dde8', '#9a8aa0'], ['#e8c8a0', '#c89a6a', '#8a5a3a'], ['#c8c4cc', '#a09aa8', '#5e5866']][Math.floor(v * 3) % 3];
    const [fur, furDark, line] = cols;
    const peek = o.peek == null ? -1 : o.peek;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (peek >= 0) {
      // le trou dans l'herbe
      ellipsePath(ctx, 0, -1, 17, 6);
      ctx.fillStyle = '#3a2412';
      ctx.fill();
      ellipsePath(ctx, 0, 0, 17, 5);
      ctx.strokeStyle = '#7a5230';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (peek <= 0.02) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.rect(-40, -90, 80, 89);
      ctx.clip();
      ctx.translate(-8 * (o.dir || 1), 30 - 30 * peek);
    }
    ctx.scale(o.dir || 1, 1);
    const hop = o.hop >= 0 ? Math.sin(o.hop * Math.PI) : 0;
    const twitch = (t % 2.6) < 0.25 ? Math.sin(t * 40) * 0.12 : 0;
    // les oreilles (une un peu pliée), qui bougent de temps en temps
    const ear = (bx, a, len, fold) => {
      ctx.save();
      ctx.translate(bx, -33);
      ctx.rotate(a - hop * 0.5);
      ellipsePath(ctx, 0, -len / 2, 4.2, len / 2);
      paint(ctx, fur, line, 1.1);
      ellipsePath(ctx, 0, -len / 2 + 1, 2, len / 2 - 3);
      ctx.fillStyle = '#ffb4c8';
      ctx.fill();
      if (fold) {
        ellipsePath(ctx, -2, -len + 2, 3.5, 3);
        paint(ctx, furDark, line, 1);
      }
      ctx.restore();
    };
    ear(5, -0.25 + twitch, 20, false);
    ear(10, 0.2 - twitch * 0.5, 18, v > 0.5);
    if (peek < 0) {
      // le corps rond, la queue en pompon, les pattes
      ellipsePath(ctx, -2, -12 - hop * 2, 13 + hop * 3, 11 - hop * 2);
      paint(ctx, fur, line, 1.2);
      ellipsePath(ctx, -7, -6, 8, 6);
      paint(ctx, furDark, line, 1);
      circlePath(ctx, -15, -14, 4.5);
      paint(ctx, '#ffffff', line, 1);
      ellipsePath(ctx, 7, -2, 4.5, 2.6);
      paint(ctx, fur, line, 1);
    }
    // la tête
    circlePath(ctx, 8, -26, 9.5);
    paint(ctx, fur, line, 1.2);
    // l'œil, la joue, le nez qui remue, les moustaches
    const blink = (t + v * 3) % 3.3 < 0.13;
    if (blink) {
      ctx.strokeStyle = '#2a1a2a';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(10, -28);
      ctx.lineTo(14, -28);
      ctx.stroke();
    } else {
      ellipsePath(ctx, 12, -28, 2.3, 2.8);
      ctx.fillStyle = '#2a1a2a';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, 12.7, -29, 0.9);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,140,170,0.55)';
    ellipsePath(ctx, 12, -22.5, 3, 2);
    ctx.fill();
    const sniff = Math.sin(t * 14) * 0.6;
    ellipsePath(ctx, 17.2, -25 + sniff * 0.4, 1.8, 1.4);
    ctx.fillStyle = '#ff7ea0';
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,90,0.6)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const dy of [-1.5, 1]) {
      ctx.moveTo(15, -24 + dy);
      ctx.lineTo(21.5, -24.5 + dy * 2 + sniff);
    }
    ctx.stroke();
    ctx.restore();
    // devant le trou, le bord de terre et des brins d'herbe
    if (peek >= 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#9a6a3a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 4, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#4fc04a';
      for (const gx of [-15, -9, 10, 15]) {
        ctx.beginPath();
        ctx.moveTo(gx - 2, 2);
        ctx.quadraticCurveTo(gx, -6, gx + 1, -9);
        ctx.quadraticCurveTo(gx + 1, -4, gx + 2, 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Un petit poisson (il saute de la casquette de Malice quand elle sort de l'eau), tourné vers la droite.
  function fish(ctx, x, y, s, hue, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const h = hue == null ? 25 : hue;
    const wag = Math.sin((t || 0) * 40) * 0.35;
    ctx.save();
    ctx.translate(-7, 0);
    ctx.rotate(wag);
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(-7, -5);
    ctx.lineTo(-5.5, 0);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    paint(ctx, `hsl(${h},95%,58%)`, `hsl(${h},70%,32%)`, 1);
    ctx.restore();
    ellipsePath(ctx, 0, 0, 8.5, 4.8);
    paint(ctx, `hsl(${h},95%,62%)`, `hsl(${h},70%,32%)`, 1);
    ctx.fillStyle = `hsla(${h},100%,88%,0.8)`;
    ellipsePath(ctx, 0.5, 1.8, 5, 1.6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circlePath(ctx, 4.5, -1.2, 1.9);
    ctx.fill();
    ctx.fillStyle = '#1a1a2a';
    circlePath(ctx, 5, -1.2, 1);
    ctx.fill();
    ctx.restore();
  }

  // Un écureuil du Vieux Chêne, les pattes en (x, y), devant son trou dans le bois (le trou est juste au-dessus) :
  // tout roux, le ventre clair, une grosse queue en panache, des pinceaux au bout des oreilles ; il grignote un
  // gland. o.out : 1, assis devant son trou ; en dessous de 0.4, il est dans son trou et on ne voit que sa tête
  // (0 : caché) ; entre les deux, il saute du trou jusqu'au sol. o.dir : de quel côté il regarde.
  function squirrel(ctx, x, y, o) {
    const t = o.t || 0;
    const out = o.out;
    const dir = o.dir || 1;
    const fur = o.v < 0.5 ? '#d2692a' : '#b8582a';
    const furDark = o.v < 0.5 ? '#9a4418' : '#7e3816';
    const line = '#5a2a0e';
    const hy = -40;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // le trou dans le bois
    ellipsePath(ctx, 0, hy, 13, 16);
    ctx.fillStyle = '#5a3820';
    ctx.fill();
    ellipsePath(ctx, 0, hy + 1, 10, 13);
    ctx.fillStyle = '#1e0e04';
    ctx.fill();
    const head = (hx, hy2, s, chew) => {
      ctx.save();
      ctx.translate(hx, hy2);
      ctx.scale(dir * s, s);
      // les oreilles, avec leurs pinceaux
      for (const [ex, a] of [[-4, -0.35], [3, 0.2]]) {
        ctx.save();
        ctx.translate(ex, -7);
        ctx.rotate(a);
        ellipsePath(ctx, 0, -4, 2.6, 4.5);
        paint(ctx, fur, line, 1);
        ctx.strokeStyle = furDark;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-1, -12);
        ctx.moveTo(0, -8);
        ctx.lineTo(1.5, -11.5);
        ctx.stroke();
        ctx.restore();
      }
      ellipsePath(ctx, 0, 0, 7.5, 7);
      paint(ctx, fur, line, 1.1);
      // le museau et les joues pleines
      ellipsePath(ctx, 5, 2 + chew, 4.2, 3.4);
      paint(ctx, '#f6e2c0', line, 1);
      ctx.fillStyle = '#3a1a08';
      circlePath(ctx, 8.6, 1.2, 1.3);
      ctx.fill();
      // l'œil (il cligne de temps en temps)
      const blink = (t % 3.3) < 0.12;
      ctx.fillStyle = '#1a0a02';
      if (blink) ctx.fillRect(1.2, -2.6, 3.4, 1.1);
      else {
        circlePath(ctx, 2.8, -2.2, 1.9);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        circlePath(ctx, 3.4, -2.8, 0.7);
        ctx.fill();
      }
      ctx.restore();
    };
    if (out < 0.4) {
      // dans son trou : il sort juste la tête pour voir
      const k = out / 0.4;
      if (k > 0.05) {
        ctx.save();
        ellipsePath(ctx, 0, hy + 1, 10, 13);
        ctx.clip();
        head(0, hy + 14 - k * 12, 0.9, 0);
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    // il saute du trou jusqu'au sol (ou il y remonte d'un bond)
    const f = (out - 0.4) / 0.6;
    const by = hy * (1 - f) - Math.sin(f * Math.PI) * 14;
    ctx.translate(0, by);
    const nib = out >= 1 ? Math.max(0, Math.sin(t * 16)) * (Math.sin(t * 1.3) > -0.3 ? 1 : 0) : 0;
    // la grosse queue en panache, qui ondule derrière lui
    const wag = Math.sin(t * 2.2) * 0.08;
    ctx.save();
    ctx.scale(dir, 1);
    ctx.translate(-7, -6);
    ctx.rotate(wag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-16, -4, -18, -30, -6, -36);
    ctx.bezierCurveTo(4, -40, 6, -30, 0, -28);
    ctx.bezierCurveTo(-8, -26, -6, -12, 4, -6);
    ctx.closePath();
    paint(ctx, fur, line, 1.2);
    ctx.strokeStyle = 'rgba(255,220,170,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.bezierCurveTo(-13, -12, -12, -28, -4, -32);
    ctx.stroke();
    ctx.restore();
    // le corps assis, le ventre clair
    ctx.save();
    ctx.scale(dir, 1);
    ellipsePath(ctx, 0, -10, 8, 10.5);
    paint(ctx, fur, line, 1.1);
    ellipsePath(ctx, 3, -9, 4.5, 7.5);
    ctx.fillStyle = '#f6e2c0';
    ctx.fill();
    // les pattes arrière, et les petites mains qui tiennent le gland
    ellipsePath(ctx, -2, -1.5, 6, 3);
    paint(ctx, furDark, line, 1);
    ctx.save();
    ctx.translate(8.5, -16 - nib * 1.2);
    ctx.fillStyle = '#b87a3a';
    ellipsePath(ctx, 0, 0, 3.2, 4);
    ctx.fill();
    ctx.fillStyle = '#6a4424';
    roundRectPath(ctx, -3.6, -5.6, 7.2, 3.4, 1.6);
    ctx.fill();
    ctx.restore();
    ellipsePath(ctx, 6.5, -14 - nib, 2.4, 2);
    paint(ctx, fur, line, 0.9);
    ctx.restore();
    head(3 * dir, -22 - nib * 0.6, 1, nib * 0.8);
    ctx.restore();
  }

  // Un nid de brindilles posé en (x, y) (son bas), avec trois oisillons : ils dorment, la tête rentrée ;
  // o.up de 0 à 1 : ils sortent la tête et ouvrent grand le bec en piaillant.
  function nest(ctx, x, y, o) {
    const t = o.t || 0;
    const up = o.up || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    // le fond du nid
    ellipsePath(ctx, 0, -10, 22, 9);
    ctx.fillStyle = '#5a3818';
    ctx.fill();
    // les oisillons
    const cols = ['#f2d36a', '#e8c25a', '#f6dc80'];
    for (let i = 0; i < 3; i++) {
      const bx = -11 + i * 11;
      const ph = t * 9 + i * 2.1;
      const rise = up * (8 + Math.max(0, Math.sin(ph * 0.5)) * 4);
      const hy = -12 - rise;
      ctx.save();
      ctx.translate(bx, hy);
      circlePath(ctx, 0, 0, 6.5);
      paint(ctx, cols[i], '#8a6a20', 1);
      // une petite houppette
      ctx.strokeStyle = '#c8a040';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.quadraticCurveTo(1, -10, 3, -9);
      ctx.stroke();
      if (up > 0.3) {
        // le bec grand ouvert
        const open = up * (2 + Math.max(0, Math.sin(ph)) * 3);
        ctx.fillStyle = '#ff8a2a';
        ctx.beginPath();
        ctx.moveTo(-4, 1);
        ctx.lineTo(0, -1 - open);
        ctx.lineTo(4, 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e05a3a';
        ctx.beginPath();
        ctx.moveTo(-3.5, 1.5);
        ctx.lineTo(0, 2 + open);
        ctx.lineTo(3.5, 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a1206';
        circlePath(ctx, -3, -2.5, 1.1);
        ctx.fill();
        circlePath(ctx, 3, -2.5, 1.1);
        ctx.fill();
      } else {
        // ils dorment : les yeux fermés, le bec tout petit
        ctx.strokeStyle = '#4a3410';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-4.2, -1.5);
        ctx.lineTo(-1.6, -1.5);
        ctx.moveTo(1.6, -1.5);
        ctx.lineTo(4.2, -1.5);
        ctx.stroke();
        ctx.fillStyle = '#ff9a3a';
        ctx.beginPath();
        ctx.moveTo(-2, 1);
        ctx.lineTo(0, 3);
        ctx.lineTo(2, 1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // les brindilles du bord du nid, par-dessus
    ctx.strokeStyle = '#8a5a2a';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 9; i++) {
      const a0 = Math.PI * (0.05 + i * 0.1);
      ctx.beginPath();
      ctx.moveTo(-24 + i * 5.5, -8 + Math.sin(a0 * 3) * 2);
      ctx.quadraticCurveTo(-16 + i * 5, -2, -8 + i * 4, -9 + Math.cos(a0 * 2) * 2);
      ctx.stroke();
    }
    ellipsePath(ctx, 0, -6, 23, 7);
    ctx.fillStyle = '#7a4a22';
    ctx.fill();
    ctx.strokeStyle = '#a8743a';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-20 + i * 7, -10 + (i % 2) * 3);
      ctx.lineTo(-12 + i * 7, -3 - (i % 2) * 2);
      ctx.stroke();
    }
    if (up < 0.2) {
      // zzz…
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - up * 5)})`;
      ctx.font = 'bold 9px Fredoka, sans-serif';
      const k = (t * 0.6) % 1;
      ctx.globalAlpha = Math.sin(k * Math.PI);
      ctx.fillText('z', 12 + k * 6, -24 - k * 12);
    }
    ctx.restore();
  }

  // Petit nuage grognon (la Crue), le bas du nuage en (x, y). o : t, mood (de 0, grognon, à 1 : tout noir, il va
  // pleuvoir), empty (de 0 à 1 : tout vide et tout pâle, après avoir plu), look, dir, happy (de 0 à 1 : pouf ! tout
  // blanc, il rit), fat (le ventre plein de chips, posé par terre, tout essoufflé), stuck (collé par le caramel).
  const CLOUD_PUFFS = [[-20, -15, 13], [-7, -24, 15], [10, -25, 14], [22, -15, 12], [0, -11, 17], [-14, -8, 10], [15, -8, 10]];
  function grumpyCloud(ctx, x, y, o) {
    const t = o.t || 0;
    const mood = o.mood || 0;
    const happy = o.happy || 0;
    const empty = o.empty || 0;
    const fat = !!o.fat;
    // sa couleur : lilas (grognon), presque noir (fâché), tout pâle (vide), tout blanc (gentil)
    // (gris-bleu, pas violet comme les nuages du fond : on voit bien que c'est lui)
    let fill = mixColor('#bcc4de', '#484c66', mood);
    let line = mixColor('#3e4470', '#1a1c2e', mood);
    fill = mixColor(fill, '#eef0ff', empty * 0.8);
    fill = mixColor(fill, '#ffffff', happy);
    line = mixColor(line, '#8f8fb8', happy);
    ctx.save();
    ctx.translate(x, y);
    const breathe = fat ? Math.sin(t * 9) * 0.04 : Math.sin(t * 2.6) * 0.02;
    const sx = (fat ? 1.25 : 1 - 0.1 * empty) + breathe;
    const sy = (fat ? 0.88 : 1 - 0.12 * empty) - breathe;
    ctx.scale(sx, sy);
    // le contour (un gros trait sous chaque boule), puis les boules par-dessus : on ne voit que le bord du nuage
    ctx.fillStyle = line;
    for (const [px, py, r] of CLOUD_PUFFS) {
      circlePath(ctx, px, py, r + 2.2);
      ctx.fill();
    }
    ctx.fillStyle = fill;
    for (const [px, py, r] of CLOUD_PUFFS) {
      circlePath(ctx, px, py, r);
      ctx.fill();
    }
    // un peu de lumière en haut
    ctx.fillStyle = `rgba(255,255,255,${0.35 - 0.25 * mood})`;
    ellipsePath(ctx, -6, -31, 9, 4, -0.2);
    ctx.fill();
    // la figure
    const lx = (o.look ? o.look.x : 0) * 2.5;
    const ly = (o.look ? o.look.y : 0) * 1.5;
    const ex = 8;
    const ey = -17;
    ctx.lineCap = 'round';
    if (happy > 0 || fat) {
      // pouf : les yeux tout plissés de rire (^ ^) ; avec les chips : les yeux fermés, tout repu
      ctx.strokeStyle = '#3a2f55';
      ctx.lineWidth = 2.2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        if (fat) {
          ctx.moveTo(s * ex - 4, ey);
          ctx.lineTo(s * ex + 4, ey);
        } else {
          ctx.moveTo(s * ex - 4, ey + 1.5);
          ctx.quadraticCurveTo(s * ex, ey - 4, s * ex + 4, ey + 1.5);
        }
        ctx.stroke();
      }
      // les joues roses
      ctx.fillStyle = 'rgba(255,140,180,0.55)';
      for (const s of [-1, 1]) {
        ellipsePath(ctx, s * 15, ey + 7, 4.5, 3);
        ctx.fill();
      }
      ctx.fillStyle = '#7a2f4a';
      if (fat) {
        // il halète, la bouche ouverte
        ellipsePath(ctx, 0, ey + 9, 3.2, 2.2 + Math.abs(Math.sin(t * 9)) * 1.6);
        ctx.fill();
      } else {
        // un grand sourire
        ctx.beginPath();
        ctx.moveTo(-7, ey + 6);
        ctx.quadraticCurveTo(0, ey + 15, 7, ey + 6);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // les yeux (à moitié fermés quand il est tout vide)
      for (const s of [-1, 1]) {
        ellipsePath(ctx, s * ex, ey, 4.2, 4.6);
        paint(ctx, '#ffffff', '#2a2240', 1);
        ctx.fillStyle = '#1c1630';
        circlePath(ctx, s * ex + lx, ey + ly + 0.5, 2.1);
        ctx.fill();
        if (empty > 0.3) {
          ctx.fillStyle = fill;
          ctx.fillRect(s * ex - 5, ey - 5.5, 10, 5 * empty);
        }
      }
      // les sourcils froncés (encore plus quand il est fâché)
      ctx.strokeStyle = '#2a2240';
      ctx.lineWidth = 2.4;
      const frown = 2 + 3 * mood - 2 * empty;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * (ex + 5), ey - 7 - frown * 0.3);
        ctx.lineTo(s * (ex - 4), ey - 5 + frown * 0.5);
        ctx.stroke();
      }
      // la bouche boudeuse (toute ronde quand il est vide)
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (empty > 0.5) {
        circlePath(ctx, 0, ey + 9, 2);
        ctx.stroke();
      } else {
        ctx.moveTo(-5, ey + 11);
        ctx.quadraticCurveTo(0, ey + 6 - 2 * mood, 5, ey + 11);
        ctx.stroke();
      }
      // fâché : des joues gonflées toutes grises, et une petite colère (une croix rouge) sur le côté
      if (mood > 0.4) {
        ctx.save();
        ctx.globalAlpha *= clamp((mood - 0.4) / 0.4, 0, 1);
        ctx.translate(20, -32);
        ctx.rotate(Math.sin(t * 14) * 0.15);
        ctx.strokeStyle = '#ff5a6a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (const a of [0.6, 2.2, 3.8, 5.4]) {
          ctx.moveTo(Math.cos(a) * 2, Math.sin(a) * 2);
          ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // La pluie d'un petit nuage : des traits qui tombent de top à bottom, sur w de large (k : de 0, quelques gouttes, à 1).
  function cloudRain(ctx, x, top, bottom, t, w, k) {
    if (bottom <= top) return;
    const h = bottom - top;
    ctx.save();
    if (k > 0.5) {
      ctx.fillStyle = `rgba(150,195,245,${0.16 * k})`;
      ctx.fillRect(x - w / 2, top, w, h);
    }
    ctx.strokeStyle = 'rgba(175,220,255,0.9)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const n = Math.max(2, Math.round(14 * k));
    for (let i = 0; i < n; i++) {
      const xx = x - w / 2 + 3 + hash(i * 3.1) * (w - 6);
      const ph = (t * 2.6 + hash(i * 7.7)) % 1;
      const yy = top + ph * h;
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx - 1.5, Math.min(bottom, yy + 13));
    }
    ctx.stroke();
    ctx.restore();
  }

  return {
    grumpyCloud, cloudRain, SHAKE, shaking, shakeTilt, rockHog, pebbleBall, CREPE, crepeShape,
    icicle, steamPuffs, LUGE, lugeShape, redNose, grumpyPenguin,
    MALICE, MIMIC_DUR, CUBE_COLORS, COUGHS, SCRAMBLE_BACK, MALICE_SPOTS, spotPop, maliceRainbow, malice, maliceHead, heldBird,
    eyeMonster, rubik, ladybug, tiredFace, sweat, caramelGoo,
    passionFruit, caramel, caramelBlob, chip, chipsBag, star, starShape, candy, lollipop, ball, heart,
    eclair, sparks, bocal, babyBird, lutinFace, flag, butterfly, mustacheRope, anchorRing, badge,
    bat, grumpyBird, gummyBear, candyEye, gem, GEMS, bigBird, birdNest,
    dandelion, dandelionStem, dandelionLeaves, dandelionFlower, dandelionSeed,
    snail, lilyPad, bunny, fish, slimeDrop, mole, moleHill, moleHole, firefly, glow, hedgehog, boar, squirrel, nest,
    // pour les autres personnages (heroes.js)
    paint, mixColor, ouchPose, koStars, hailStars, snowflake, spotsOverlay, wetOverlay, slimeOverlay, dirtOverlay, frog, CROAKS, croaking, croakOverlay,
    PIN_PULLS, PIN_REACH_POSES, pinAt, pinsWince, pinsReach, pinsOverlay, spinTurn, spinWhirl,
  };
})();
