'use strict';

// ---------------- Le Poussin ----------------
// Une boule jaune toute ronde, un bout de coquille d'oeuf sur la tête,
// des petites ailes et des pattes orange. Pouvoir : il bat des ailes en l'air (pose 'flap').
(() => {
  const H = Heroes;
  const C = {
    body: '#ffd83a', bodyShade: '#f2b81e', bodyLight: '#fff2a0', line: '#b07a10',
    beak: '#ff8a1f', beakDark: '#d8600a', leg: '#ff8a1f', legLine: '#b8540a',
    shell: '#fffaf0', shellLine: '#b8a888', cheek: '#ff9a7a',
  };

  // Une aile : une goutte qui part de l'épaule et pend vers le bas, tournée de a.
  function wing(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a * 0.7);
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(-7, 9, -1, 15);
    ctx.quadraticCurveTo(2, 13, 4, 15);
    ctx.quadraticCurveTo(7, 7, 3, 0);
    ctx.closePath();
    H.paint(ctx, back ? C.bodyShade : C.body, C.line, 1);
    ctx.restore();
  }

  // Une patte fine avec trois doigts.
  function leg(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a * 0.8);
    ctx.strokeStyle = back ? C.legLine : C.leg;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 8);
    ctx.moveTo(0, 8);
    ctx.lineTo(5, 9.5);
    ctx.moveTo(0, 8);
    ctx.lineTo(3, 10.5);
    ctx.moveTo(0, 8);
    ctx.lineTo(-3, 9.5);
    ctx.stroke();
    ctx.restore();
  }

  function face(ctx, o, x, y) {
    // bec
    const open = o.pose === 'win' || o.pose === 'jump' || o.pose === 'flap' || o.hurt;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 2.5);
    ctx.quadraticCurveTo(x + 17, y - 1, x + 18, y + 0.5);
    ctx.quadraticCurveTo(x + 13, y + 1.5, x + 8, y + 1.5);
    ctx.closePath();
    H.paint(ctx, C.beak, C.beakDark, 0.9);
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 1.5);
    ctx.quadraticCurveTo(x + 13, y + (open ? 6 : 2.5), x + 16, y + (open ? 3 : 1.2));
    ctx.quadraticCurveTo(x + 12, y + 1.5, x + 8, y + 1.5);
    ctx.closePath();
    H.paint(ctx, C.beakDark, C.beakDark, 0.8);
    H.eye(ctx, x + 4, y - 7, 3.6, 4.4, {
      iris: '#2a1a10', hurt: o.hurt, blink: H.blinking(o.t, 1.1), line: '#5a3a10', look: { x: 0.6, y: 0 },
    });
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.6;
    ellipsePath(ctx, x + 2, y + 2, 3.2, 2);
    ctx.fill();
    ctx.globalAlpha /= 0.6;
  }

  function headShape(ctx, o, x, y) {
    // houppette de plumes
    ctx.strokeStyle = C.line;
    ctx.fillStyle = C.body;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(x - 2 + i * 2.5, y - 12);
      ctx.rotate(-0.5 + i * 0.4 + Math.sin(o.t * 4 + i) * 0.08);
      ellipsePath(ctx, 0, -4, 1.8, 4.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    circlePath(ctx, x, y, 13);
    H.paint(ctx, C.body, C.line, 1.1);
    ctx.fillStyle = C.bodyLight;
    ellipsePath(ctx, x - 4, y - 6, 5, 3.4, -0.4);
    ctx.fill();
    // le bout de coquille, posé un peu de travers
    ctx.save();
    ctx.translate(x - 4, y - 9);
    ctx.rotate(-0.35);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-8, -9, 0, -9.5);
    ctx.quadraticCurveTo(8, -9, 8, 0);
    ctx.lineTo(5.5, -2.5);
    ctx.lineTo(3, 0.5);
    ctx.lineTo(0, -2.8);
    ctx.lineTo(-2.8, 0.5);
    ctx.lineTo(-5.5, -2.5);
    ctx.closePath();
    H.paint(ctx, C.shell, C.shellLine, 1);
    ctx.restore();
    face(ctx, o, x, y);
  }

  H.add('poussin', {
    draw(ctx, o, R) {
      const t = o.t;
      let { legF, legB, armF, armB, bob, lean } = R;
      const crouch = R.crouch * 0.6;
      if (o.pose === 'crouch') {
        // accroupi : les pattes repliées sous le ventre
        legF = 1.2;
        legB = 0.9;
      }
      if (o.pose === 'flap') {
        // les ailes battent très vite
        const f = Math.sin(t * 45);
        armF = -2.2 + f * 0.9;
        armB = -2.4 - f * 0.9;
        legF = 0.4;
        legB = -0.2;
      }
      ctx.translate(0, bob);
      ctx.rotate(lean);
      leg(ctx, -3, -9 + crouch, legB, true);
      wing(ctx, -2, -27 + crouch, armB - 0.3, true);
      leg(ctx, 2, -9 + crouch, legF, false);
      // le corps (une grosse poire jaune)
      ctx.save();
      ctx.translate(0, crouch);
      ellipsePath(ctx, 0, -20, 14, 13);
      H.paint(ctx, C.body, C.line, 1.1);
      ctx.fillStyle = C.bodyLight;
      ellipsePath(ctx, 4, -17, 7, 6);
      ctx.fill();
      // petite queue
      ctx.beginPath();
      ctx.moveTo(-12, -24);
      ctx.lineTo(-19, -27);
      ctx.lineTo(-13, -19);
      ctx.closePath();
      H.paint(ctx, C.bodyShade, C.line, 1);
      if (o.holding) o.holding(ctx);
      headShape(ctx, o, 2, -40);
      wing(ctx, 1, -27, armF + 0.2, false);
      ctx.restore();
    },
    head(ctx) {
      headShape(ctx, { t: 1, pose: 'idle' }, -2, 4);
    },
  });
})();
