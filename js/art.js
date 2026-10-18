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
    if (!back) {
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

  function drawPonytail(ctx, C, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
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
  function drawHeadProfile(ctx, C, o) {
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const hx = 1;
    const hy = -43;
    const R = 14;
    drawPonytail(ctx, C, hx - 11, hy - 4, 0.45 + headSway(o) + (isFlying(pose) ? -0.55 : 0));
    // cheveux à l'arrière du crâne
    ellipsePath(ctx, hx - 1.8, hy + 0.8, R + 0.4, R - 0.2);
    paint(ctx, C.hair, C.hairLine, 1.05);
    // visage
    circlePath(ctx, hx, hy, R);
    paint(ctx, C.skin, C.skinLine, 1.05);
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
    const ex = hx + 8.4;
    const ey = hy - 0.6;
    const blink = (t % 3.7) < 0.12 && pose !== 'hurt';
    ctx.strokeStyle = C.eye;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (pose === 'hurt') {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex + 2.4, ey - 3);
      ctx.lineTo(ex - 1.8, ey);
      ctx.lineTo(ex + 2.4, ey + 3);
      ctx.stroke();
    } else if (blink) {
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ex - 2.4, ey + 0.4);
      ctx.quadraticCurveTo(ex, ey + 2, ex + 2.4, ey + 0.4);
      ctx.stroke();
    } else {
      ellipsePath(ctx, ex, ey, 2.6, 4.5);
      paint(ctx, '#ffffff', C.eye, 0.9);
      ellipsePath(ctx, ex + 0.8, ey + 0.5, 1.9, 3.3);
      ctx.fillStyle = C.iris;
      ctx.fill();
      ellipsePath(ctx, ex + 1.1, ey + 0.7, 1.1, 1.9);
      ctx.fillStyle = C.eye;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, ex + 1.3, ey - 1.4, 0.85);
      ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(ex - 1.6, ey - 3.6);
      ctx.lineTo(ex - 3.6, ey - 5);
      ctx.moveTo(ex - 2.3, ey - 2);
      ctx.lineTo(ex - 4.4, ey - 2.8);
      ctx.stroke();
    }
    // joue rose
    ctx.save();
    ctx.globalAlpha *= 0.5;
    ctx.fillStyle = C.cheek;
    ellipsePath(ctx, hx + 6.6, hy + 5.8, 2.8, 1.8);
    ctx.fill();
    ctx.restore();
    // bouche ouverte (contente ou surprise)
    const mx = hx + 12.4;
    const my = hy + 8.4;
    if (pose === 'win' || pose === 'hurt' || pose === 'jump' || pose === 'hold') {
      ellipsePath(ctx, mx + 3.4, my + 5.6, pose === 'hurt' ? 2 : 2.8, pose === 'hurt' ? 2 : 2.6);
      paint(ctx, '#a3263b', '#6e1424', 0.8);
      if (pose !== 'hurt') {
        ctx.fillStyle = '#ff7f95';
        ellipsePath(ctx, mx + 3.4, my + 6.8, 1.6, 0.9);
        ctx.fill();
      }
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
    // nez rond qui dépasse
    circlePath(ctx, hx + 14.2, hy + 3.6, 4.3);
    paint(ctx, C.skin, C.skinLine, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    circlePath(ctx, hx + 13.4, hy + 2.2, 1.3);
    ctx.fill();
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
    // casquette vue de côté
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
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipsePath(ctx, hx - 5, hy - 17, 4.6, 2.1, -0.45);
    ctx.fill();
    drawCapEmblem(ctx, C, hx + 6.2, hy - 13.6, 0.72);
    // visière vers l'avant
    ctx.beginPath();
    ctx.moveTo(hx + 7, hy - 9.8);
    ctx.quadraticCurveTo(hx + 19, hy - 12.4, hx + 26.2, hy - 6.8);
    ctx.quadraticCurveTo(hx + 18, hy - 4.6, hx + 7, hy - 6.8);
    ctx.closePath();
    paint(ctx, C.hatDark, C.hatLine, 1.05);
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
  function drawHead(ctx, C, o) {
    const k = faceTurn(o.face);
    const view = o.view || (k > 0.7 ? 'front' : k > 0.3 ? '3q' : 'profile');
    if (view === 'front') drawHeadFront(ctx, C, o, o.face);
    else if (view === '3q') drawHead3q(ctx, C, o);
    else drawHeadProfile(ctx, C, o);
  }

  // Malice debout, les pieds au point (x, y).
  // o : facing (1 ou -1), pose, t (temps), ph (phase de marche), palette, sx/sy (écrasement)
  function malice(ctx, x, y, o) {
    o = o || {};
    const C = o.palette || MALICE;
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const ph = o.ph || 0;
    ctx.save();
    ctx.translate(x, y);
    const sc = o.scale || 1;
    ctx.scale((o.facing || 1) * sc * (o.sx || 1), sc * (o.sy || 1));
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
      case 'hold': armF = -1.0; armB = -0.8; break;
      case 'crouch': crouch = 7; legF = -1.25; legB = -0.85; legLen = 8; armF = -0.6; armB = 0.3; break;
      case 'hang': armF = 0.25; armB = -0.25; legF = 0.25; legB = -0.2; break;
      default:
        bob = Math.sin(t * 2.5) * 0.7;
        armF = -0.12 - Math.sin(t * 2.5) * 0.04;
    }
    ctx.translate(0, bob);
    ctx.rotate(lean);
    ctx.save();
    ctx.translate(0, crouch);
    drawArm(ctx, C, -2, -28.2, armB, true);
    ctx.restore();
    drawLeg(ctx, C, -2.2, -15.5 + crouch, legB, true, legLen);
    drawLeg(ctx, C, 1.4, -15.5 + crouch, legF, false, legLen);
    ctx.save();
    ctx.translate(0, crouch);
    drawBody(ctx, C);
    // le bras avant passe sous la tête (sauf quand Malice tient le bébé oiseau)
    if (!o.holding) drawArm(ctx, C, 1.2, -27.8, armF, false);
    drawHead(ctx, C, o);
    if (o.holding) {
      o.holding(ctx);
      drawArm(ctx, C, 1.2, -27.8, armF, false);
    }
    ctx.restore();
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
      const sw = moving ? Math.sin(p) : 0;
      const lift = moving ? Math.max(0, -Math.cos(p)) * 4 : 0;
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
    if (o.chasing) {
      ctx.strokeStyle = '#3b1a33';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12 * dir, cy - R - 2);
      ctx.lineTo(6 * dir, cy - R + 5);
      ctx.stroke();
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

  // Éclairs électriques (zigzags) autour d'un point.
  function sparks(ctx, x, y, radius, seed, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? `rgba(255,230,80,${0.45 * alpha})` : `rgba(255,255,240,${alpha})`;
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

  // ---------------- Bébé oiseau ----------------
  // Le bébé oiseau dans les bras de Malice (coordonnées de Malice, les pieds en 0,0).
  function heldBird(ctx, t, o) {
    ctx.save();
    ctx.translate(20, -7);
    ctx.scale(0.78, 0.78);
    babyBird(ctx, 0, 0, t, Object.assign({ noNest: true, happy: true }, o));
    ctx.restore();
  }

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
    ctx.translate(0, -hop);
    const bodyY = -18;
    // corps bleu-violet avec le ventre blanc
    const g = ctx.createRadialGradient(-5, bodyY - 6, 2, 0, bodyY, 15);
    g.addColorStop(0, '#a99cff');
    g.addColorStop(0.55, '#6c5cf0');
    g.addColorStop(1, '#4433b8');
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
    ctx.strokeStyle = '#5a49e0';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, bodyY - 12);
    ctx.quadraticCurveTo(-4, bodyY - 19, -1, bodyY - 21);
    ctx.moveTo(1, bodyY - 12);
    ctx.quadraticCurveTo(3, bodyY - 18, 7, bodyY - 18);
    ctx.stroke();
    // ailes
    const flap = Math.sin(t * (o.happy ? 25 : 10)) * (o.happy ? 0.8 : 0.35);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 11, bodyY + 2);
      ctx.rotate(side * (0.5 + flap));
      ctx.fillStyle = '#5443d6';
      ellipsePath(ctx, side * 3, 0, 7.5, 4.2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ellipsePath(ctx, side * 7, 0.5, 3, 2.4);
      ctx.fill();
      ctx.restore();
    }
    // yeux
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1a1a1a';
      ellipsePath(ctx, side * 5, bodyY - 3, 2.8, 3.6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      circlePath(ctx, side * 5 + 1, bodyY - 4.5, 1.1);
      ctx.fill();
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
    ctx.restore();
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

  const BADGE_COLORS = { saut: ['#7fd0ff', '#2a7de0'], grappin: ['#d6a6ff', '#7a3ad8'] };

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
    if (kind === 'grappin') {
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
    const fy = -h + 4 + (o.lower || 0);
    const fw = o.w || 34;
    const fh = o.fh || 22;
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

  return {
    MALICE, MIMIC_DUR, CUBE_COLORS, maliceRainbow, malice, maliceHead, heldBird,
    eyeMonster, rubik, ladybug, tiredFace, sweat, caramelGoo,
    passionFruit, caramel, caramelBlob, chip, chipsBag, star, starShape, candy, lollipop, ball, heart,
    eclair, sparks, babyBird, lutinFace, flag, mustacheRope, anchorRing, badge,
  };
})();
