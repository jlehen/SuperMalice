'use strict';

// ---------------- Bébé Dragon ----------------
// Un petit dragon vert tout rond, le ventre crème à rayures, des piquants orange,
// deux petites cornes et des ailes de chauve-souris. Pouvoir : il crache une bulle de feu (pose 'breathe').
(() => {
  const H = Heroes;
  const C = {
    body: '#6fd24a', bodyShade: '#58b83a', bodyLight: '#b4f08c', line: '#2f7a1e',
    belly: '#fff2b0', bellyLine: '#d2b25a', spike: '#ff9a3a', spikeLine: '#c4601a',
    wing: '#45c9c0', wingDark: '#33a59e', wingLine: '#1d6b67',
    horn: '#fff6d8', hornShade: '#eadcb2', hornLine: '#b8975a',
    cheek: '#ff9cb8', mouth: '#9c2a44', tongue: '#ff7f92', nostril: '#2a5a18',
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

  // Un piquant tout rond au bout, posé en (x, y) et pointé vers (nx, ny).
  function spike(ctx, x, y, nx, ny, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(nx, -ny));
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, s * 0.5);
    ctx.quadraticCurveTo(-s * 0.7, -s * 0.55, -s * 0.12, -s);
    ctx.quadraticCurveTo(0, -s * 1.1, s * 0.12, -s);
    ctx.quadraticCurveTo(s * 0.7, -s * 0.55, s * 0.75, s * 0.5);
    ctx.closePath();
    H.paint(ctx, C.spike, C.spikeLine, 0.9);
    ctx.restore();
  }

  // Une grosse queue qui remue un peu, avec des piquants dessus.
  function tail(ctx, wag) {
    const p0 = { x: -6, y: -27 };
    const p1 = { x: -22, y: -24 };
    const p2 = { x: -32, y: -12 + wag };
    [[0.38, 3.2], [0.64, 2.7], [0.88, 2.2]].forEach(([u, s]) => {
      const v = 1 - u;
      const x = v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x;
      const y = v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y;
      const tx = 2 * v * (p1.x - p0.x) + 2 * u * (p2.x - p1.x);
      const ty = 2 * v * (p1.y - p0.y) + 2 * u * (p2.y - p1.y);
      const d = Math.hypot(tx, ty) || 1;
      spike(ctx, x + 1, y + 1, -ty / d, tx / d, s);
    });
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y - 1);
    ctx.quadraticCurveTo(p2.x - 4, p2.y + 1.5, p2.x + 0.5, p2.y + 3);
    ctx.quadraticCurveTo(-18, -6, -3, -9);
    ctx.closePath();
    H.paint(ctx, C.body, C.line, 1.05);
    ctx.fillStyle = C.bodyLight;
    ellipsePath(ctx, -19, -19.5, 5, 1.6, 0.35);
    ctx.fill();
  }

  // Une petite aile de chauve-souris, accrochée dans le dos.
  function wing(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(1.5, 1);
    ctx.quadraticCurveTo(-2, -11, -12, -17);
    ctx.quadraticCurveTo(-12.5, -10.5, -18, -8);
    ctx.quadraticCurveTo(-13, -6, -13, -1.5);
    ctx.quadraticCurveTo(-8, -3, -4, 3);
    ctx.closePath();
    H.paint(ctx, back ? C.wingDark : C.wing, C.wingLine, 1);
    ctx.strokeStyle = C.wingLine;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, -1);
    ctx.quadraticCurveTo(-9, -6, -17, -8);
    ctx.moveTo(-1.5, 0);
    ctx.quadraticCurveTo(-8, -2, -12.5, -1.8);
    ctx.stroke();
    ctx.restore();
  }

  function arm(ctx, x, y, a, back) {
    const fill = back ? C.bodyShade : C.body;
    H.limb(ctx, x, y, a, 7, 5.6, fill, C.line, 1);
    const p = H.tip(x, y, a, 8);
    circlePath(ctx, p.x, p.y, 3.3);
    H.paint(ctx, fill, C.line, 1);
  }

  // Une jambe dodue et un pied rond avec trois griffes crème (le pied reste à plat).
  function leg(ctx, x, y, a, len, back) {
    const fill = back ? C.bodyShade : C.body;
    H.limb(ctx, x, y, a, len, 8.4, fill, C.line, 1);
    const p = H.tip(x, y, a, len);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.moveTo(-4.6, 2);
    ctx.quadraticCurveTo(-5.6, -3.6, 0, -3.6);
    ctx.quadraticCurveTo(7.6, -3.6, 7.6, 0.4);
    ctx.quadraticCurveTo(7.6, 2, 5.6, 2);
    ctx.closePath();
    H.paint(ctx, fill, C.line, 1);
    ctx.fillStyle = C.horn;
    ctx.strokeStyle = C.hornLine;
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) {
      ellipsePath(ctx, 6.6 - i * 2.3, 1, 1.25, 0.95);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Une petite corne recourbée vers l'arrière.
  function horn(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-2.6, 1.5);
    ctx.quadraticCurveTo(-2.6, -4, -4.6, -7.4);
    ctx.quadraticCurveTo(-3.6, -8.4, -2.6, -7.6);
    ctx.quadraticCurveTo(1.2, -5, 2.6, 1.5);
    ctx.closePath();
    H.paint(ctx, back ? C.hornShade : C.horn, C.hornLine, 0.9);
    ctx.restore();
  }

  // La tête centrée en (hx, hy). open : la bouche ouverte (0 fermée, 1 grande ouverte).
  function headShape(ctx, o, hx, hy, open) {
    horn(ctx, hx - 6.5, hy - 9, -0.55, true);
    horn(ctx, hx + 0.5, hy - 11.2, -0.2, false);
    for (const th of [2.55, 3.0, 3.45, 3.9]) {
      spike(ctx, hx + Math.cos(th) * 11.6, hy + Math.sin(th) * 11, Math.cos(th), Math.sin(th), 3.2);
    }
    if (open) {
      // mâchoire du bas, puis le dedans de la bouche
      union(ctx, [[hx + 8.5, hy + 7.5 + open * 3, 8.5, 3.6, 0.1 + open * 0.3]], C.body, C.line, 1);
      ellipsePath(ctx, hx + 12, hy + 5.5 + open * 1.5, 6.6, 2 + open * 3.2, 0.2);
      H.paint(ctx, C.mouth, C.line, 0.9);
      ctx.fillStyle = C.tongue;
      ellipsePath(ctx, hx + 10.5, hy + 7.5 + open * 3, 4, 1.2 + open, 0.3);
      ctx.fill();
    }
    const sy = open ? 1 - open * 0.25 : 1;
    union(ctx, [[hx, hy, 12.5, 12], [hx + 10, hy + 3 - open * 2.5, 9, 6.8 * sy]], C.body, C.line, 1.1);
    ctx.fillStyle = C.bodyLight;
    ellipsePath(ctx, hx - 4, hy - 7, 4.8, 2.8, -0.45);
    ctx.fill();
    ellipsePath(ctx, hx + 12, hy - 0.5 - open * 2.5, 3.2, 1.3, -0.1);
    ctx.fill();
    // narines
    ctx.fillStyle = C.nostril;
    ellipsePath(ctx, hx + 16.6, hy + 0.6 - open * 2.5, 0.9, 1.2, 0.4);
    ctx.fill();
    ellipsePath(ctx, hx + 13.8, hy - 0.2 - open * 2.5, 0.7, 1, 0.4);
    ctx.fill();
    if (!open) {
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx + 8.5, hy + 6);
      ctx.quadraticCurveTo(hx + 13, hy + 8.6, hx + 17.6, hy + 5.4);
      ctx.stroke();
    }
    H.eye(ctx, hx + 3.6, hy - 3.6, 4.4, 5.4, {
      iris: '#6a3a10', hurt: o.hurt, blink: H.blinking(o.t, 0.4), line: '#1e4a12', look: { x: 0.6, y: 0 },
    });
    ctx.fillStyle = C.cheek;
    ctx.globalAlpha *= 0.85;
    ellipsePath(ctx, hx + 1.5, hy + 4.5, 3.2, 2);
    ctx.fill();
    ctx.globalAlpha /= 0.85;
  }

  H.add('dragon', {
    draw(ctx, o, R) {
      const t = o.t;
      let { legF, legB, armF, armB, bob, lean } = R;
      const crouch = R.crouch * 0.7;
      const air = o.pose === 'jump' || o.pose === 'fall' || o.pose === 'pound';
      let open = o.pose === 'win' ? 0.45 : o.hurt ? 0.35 : 0;
      if (o.pose === 'breathe') {
        // penché en avant, la bouche grande ouverte
        lean = 0.06;
        armF = -0.9;
        armB = 0.7;
        legF = 0.3;
        legB = -0.35;
        open = 1;
      }
      // les ailes frétillent (très vite quand il saute)
      const flap = Math.sin(t * (air ? 24 : 5)) * (air ? 0.45 : 0.12);
      const wag = Math.sin(t * 3) * 1.5;
      ctx.translate(0, bob);
      ctx.rotate(lean);
      const hipY = -9 + crouch;
      const len = (a) => Math.min(7, Math.max(2.5, (-hipY - 2) / Math.max(0.2, Math.cos(a))));
      ctx.save();
      ctx.translate(0, crouch);
      wing(ctx, -4, -29, -0.1 + flap, true);
      tail(ctx, wag);
      arm(ctx, -2, -26, armB, true);
      ctx.restore();
      leg(ctx, -4, hipY, legB, len(legB), true);
      ctx.save();
      ctx.translate(0, crouch);
      for (const th of [3.3, 3.75, 4.2]) {
        spike(ctx, Math.cos(th) * 11.8, -19 + Math.sin(th) * 11.3, Math.cos(th), Math.sin(th), 3.6);
      }
      ellipsePath(ctx, 0, -19, 12.5, 12);
      H.paint(ctx, C.body, C.line, 1.1);
      ctx.save();
      ellipsePath(ctx, 0, -19, 12.5, 12);
      ctx.clip();
      ellipsePath(ctx, 5.5, -17, 8, 10.5);
      H.paint(ctx, C.belly, C.bellyLine, 1);
      ellipsePath(ctx, 5.5, -17, 8, 10.5);
      ctx.clip();
      ctx.strokeStyle = C.bellyLine;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (const y of [-23, -18, -13]) {
        ctx.moveTo(-3, y);
        ctx.quadraticCurveTo(6, y + 2.4, 14, y);
      }
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = C.bodyLight;
      ellipsePath(ctx, -5.5, -25, 3.8, 2.3, -0.6);
      ctx.fill();
      ctx.restore();
      leg(ctx, 3, hipY, legF, len(legF), false);
      ctx.save();
      ctx.translate(0, crouch);
      wing(ctx, -7, -27, 0.15 + flap * 1.1, false);
      if (o.holding) o.holding(ctx);
      if (o.pose === 'breathe') {
        // le cou tendu, la tête levée pour souffler
        ellipsePath(ctx, 1.5, -31, 7.5, 7);
        H.paint(ctx, C.body, C.line, 1.1);
        ctx.save();
        ctx.translate(1, -46);
        ctx.rotate(-0.3);
        headShape(ctx, o, 0, 0, open);
        ctx.restore();
      } else {
        headShape(ctx, o, 3, -42, open);
      }
      arm(ctx, 2, -26, armF, false);
      ctx.restore();
    },
    head(ctx) {
      headShape(ctx, { t: 1, pose: 'idle' }, -3, 3, 0);
    },
  });
})();
