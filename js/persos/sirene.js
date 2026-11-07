'use strict';

// ---------------- La Sirène ----------------
// Pas de jambes : une queue turquoise pleine d'écailles qui finit par une grande nageoire.
// Elle sautille dessus. Haut en coquillages, longs cheveux rouge corail, une étoile de mer dans les cheveux.
// Pouvoirs : elle lance une vague (pose 'wave') et s'envole dans une grosse bulle (pose 'bubble').
(() => {
  const H = Heroes;
  const C = {
    tail: '#2ccfc0', tailDark: '#16a8a4', tailLight: '#8ef0e0', tailLine: '#0a7276',
    fin: '#5ae0d0', finLine: '#0a7276',
    shell: '#c89af0', shellDark: '#a874d8', shellLight: '#f0d8ff', shellLine: '#7a4aa8',
    skin: '#ffe0cc', skinShade: '#f6c8ae', skinLine: '#c98868', cheek: '#ff8fa8',
    hair: '#ff6a52', hairDark: '#e04a3a', hairLight: '#ffa890', hairLine: '#a02a22',
    star: '#ffb43a', starLine: '#c8701a', iris: '#1fa898', eye: '#1a2a3a',
  };
  const HIP = -23;
  const HX = 2;
  const HY = -51;

  // Une gélule de bras, avec un petit bracelet de perles.
  function arm(ctx, x, y, a, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -2, -1.5, 4, 12, 2);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    circlePath(ctx, 0, 11, 2.8);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.shellLine;
    ctx.lineWidth = 0.5;
    for (const bx of [-1.4, 0, 1.4]) {
      circlePath(ctx, bx, 7.8, 0.9);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // La queue : deux morceaux qui se plient (a1 en haut, a2 en bas), puis la nageoire (finA).
  function tail(ctx, a1, a2, finA) {
    const p0 = { x: -0.5, y: HIP };
    const p1 = H.tip(p0.x, p0.y, a1, 12);
    const p2 = H.tip(p1.x, p1.y, a2, 8);
    const n = (a) => ({ x: Math.cos(a), y: Math.sin(a) });
    const n0 = n(a1);
    const n1 = n((a1 + a2) / 2);
    const n2 = n(a2);
    const side = (s) => {
      const A = { x: p0.x + n0.x * 7 * s, y: p0.y + n0.y * 7 * s };
      const M = { x: p1.x + n1.x * 4.8 * s, y: p1.y + n1.y * 4.8 * s };
      const B = { x: p2.x + n2.x * 2.4 * s, y: p2.y + n2.y * 2.4 * s };
      return { A, B, c: { x: 2 * M.x - (A.x + B.x) / 2, y: 2 * M.y - (A.y + B.y) / 2 } };
    };
    // la nageoire d'abord (la queue passe par-dessus)
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(finA);
    ctx.beginPath();
    ctx.moveTo(-2, -1.6);
    ctx.quadraticCurveTo(-7, -3, -11.6, 1.2);
    ctx.quadraticCurveTo(-8, 1.4, -6.6, 3.4);
    ctx.quadraticCurveTo(-3.4, 2.2, 0, 3.2);
    ctx.quadraticCurveTo(3.4, 2.2, 6.6, 3.4);
    ctx.quadraticCurveTo(8, 1.4, 11.6, 1.2);
    ctx.quadraticCurveTo(7, -3, 2, -1.6);
    ctx.closePath();
    const fg = ctx.createLinearGradient(0, -2, 0, 4);
    fg.addColorStop(0, C.fin);
    fg.addColorStop(1, C.tailLight);
    H.paint(ctx, fg, C.finLine, 1);
    ctx.strokeStyle = C.tailDark;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const fx of [-8, -4.4, 4.4, 8]) {
      ctx.moveTo(fx * 0.2, -0.6);
      ctx.lineTo(fx, 1.8);
    }
    ctx.stroke();
    ctx.restore();
    const L = side(1);
    const Rt = side(-1);
    ctx.beginPath();
    ctx.moveTo(L.A.x, L.A.y);
    ctx.quadraticCurveTo(L.c.x, L.c.y, L.B.x, L.B.y);
    ctx.lineTo(Rt.B.x, Rt.B.y);
    ctx.quadraticCurveTo(Rt.c.x, Rt.c.y, Rt.A.x, Rt.A.y);
    ctx.closePath();
    const g = ctx.createLinearGradient(-8, 0, 8, 0);
    g.addColorStop(0, C.tailDark);
    g.addColorStop(0.6, C.tail);
    g.addColorStop(1, C.tailLight);
    H.paint(ctx, g, C.tailLine, 1.05);
    // les écailles
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(10,114,118,0.45)';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const k = i / 6;
      const p = k < 0.6 ? lerpP(p0, p1, k / 0.6) : lerpP(p1, p2, (k - 0.6) / 0.4);
      const w = 7 - k * 4.6;
      const na = k < 0.6 ? n0 : n2;
      for (let j = -1; j <= 1; j++) {
        const cx = p.x + na.x * j * w * 0.55;
        const cy = p.y + na.y * j * w * 0.55;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.32, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipsePath(ctx, p0.x + 3.4, p0.y + 5, 1.6, 4, a1);
    ctx.fill();
    ctx.restore();
  }

  // La petite frange de nageoire à la taille.
  function waistFrill(ctx) {
    ctx.beginPath();
    ctx.moveTo(-7.6, HIP - 1);
    ctx.quadraticCurveTo(0, HIP + 1.6, 7.4, HIP - 1);
    ctx.quadraticCurveTo(5, HIP + 3.4, 2.4, HIP + 2.4);
    ctx.quadraticCurveTo(0, HIP + 4.4, -2.4, HIP + 2.4);
    ctx.quadraticCurveTo(-5, HIP + 3.4, -7.6, HIP - 1);
    ctx.closePath();
    H.paint(ctx, C.fin, C.finLine, 0.9);
  }

  function lerpP(a, b, k) {
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  }

  // Un coquillage en éventail.
  function shell(ctx, x, y, r, rot, back) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, r * 0.7);
    ctx.lineTo(-r, -r * 0.2);
    for (let i = 0; i < 5; i++) {
      const a0 = Math.PI + (i / 5) * Math.PI;
      const a1 = Math.PI + ((i + 1) / 5) * Math.PI;
      const am = (a0 + a1) / 2;
      ctx.quadraticCurveTo(Math.cos(am) * r * 1.25, Math.sin(am) * r * 1.1 - r * 0.2,
        Math.cos(a1) * r, Math.sin(a1) * r * 0.95 - r * 0.2);
    }
    ctx.closePath();
    H.paint(ctx, back ? C.shellDark : C.shell, C.shellLine, 0.9);
    ctx.strokeStyle = C.shellLine;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      ctx.moveTo(0, r * 0.6);
      ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.86 - r * 0.2);
    }
    ctx.stroke();
    if (!back) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ellipsePath(ctx, -r * 0.35, -r * 0.5, r * 0.25, r * 0.16, -0.5);
      ctx.fill();
    }
    ctx.restore();
  }

  function torso(ctx) {
    ctx.beginPath();
    ctx.moveTo(-5.4, -40);
    ctx.quadraticCurveTo(1, -42, 6.4, -40);
    ctx.quadraticCurveTo(8.6, -33, 6, -28);
    ctx.quadraticCurveTo(7.6, -25, 7.2, -22);
    ctx.lineTo(-7.2, -22);
    ctx.quadraticCurveTo(-7.4, -25, -5.4, -28);
    ctx.quadraticCurveTo(-7.8, -33, -5.4, -40);
    ctx.closePath();
    H.paint(ctx, C.skin, C.skinLine, 1.05);
    // la bretelle et les deux coquillages
    ctx.strokeStyle = C.shellLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6.6, -31.6);
    ctx.quadraticCurveTo(0, -30.4, 6.4, -32);
    ctx.stroke();
    shell(ctx, 1.6, -33, 3.6, 0.15, true);
    shell(ctx, 6.4, -33.4, 4, 0.35, false);
    // nombril
    ctx.strokeStyle = C.skinLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(4.4, -25.4, 0.7, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }

  // Les longs cheveux qui flottent dans le dos.
  function backHair(ctx, o, hx, hy, flow) {
    const t = o.t || 0;
    const w = Math.sin(t * 2.6) * 1.4;
    ctx.save();
    ctx.translate(hx - 4, hy - 4);
    ctx.rotate(0.15 + flow);
    ctx.translate(-(hx - 4), -(hy - 4));
    ctx.beginPath();
    ctx.moveTo(hx + 4, hy - 13);
    ctx.bezierCurveTo(hx - 12, hy - 15, hx - 18, hy - 2, hx - 16 + w, hy + 12);
    ctx.quadraticCurveTo(hx - 19 - w, hy + 20, hx - 14, hy + 28);
    ctx.quadraticCurveTo(hx - 12, hy + 23, hx - 10 + w, hy + 27);
    ctx.quadraticCurveTo(hx - 8.6 - w, hy + 22, hx - 5.6, hy + 24);
    ctx.quadraticCurveTo(hx - 7 + w, hy + 14, hx - 1, hy + 6);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    ctx.strokeStyle = C.hairDark;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 9, hy + 2);
    ctx.quadraticCurveTo(hx - 14 + w, hy + 12, hx - 12, hy + 22);
    ctx.moveTo(hx - 5, hy + 8);
    ctx.quadraticCurveTo(hx - 8 - w, hy + 14, hx - 7.4, hy + 21);
    ctx.stroke();
    ctx.restore();
  }

  function starfish(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * H.TAU;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    H.paint(ctx, C.star, C.starLine, 0.9);
    ctx.fillStyle = '#fff0c0';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * H.TAU;
      circlePath(ctx, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 0.5);
      ctx.fill();
    }
    ctx.restore();
  }

  function headShape(ctx, o, hx, hy) {
    const t = o.t || 0;
    const pose = o.pose;
    circlePath(ctx, hx, hy, 13.4);
    H.paint(ctx, C.skin, C.skinLine, 1.05);
    ctx.beginPath();
    ctx.moveTo(hx - 13.8, hy + 6);
    ctx.bezierCurveTo(hx - 16, hy - 14, hx + 8, hy - 21, hx + 14, hy - 4);
    ctx.quadraticCurveTo(hx + 12, hy - 7, hx + 9, hy - 5.4);
    ctx.quadraticCurveTo(hx + 7, hy - 8.6, hx + 4, hy - 5.6);
    ctx.quadraticCurveTo(hx + 1.4, hy - 8, hx - 1, hy - 4.6);
    ctx.quadraticCurveTo(hx - 3, hy + 3, hx - 1.4, hy + 12);
    ctx.quadraticCurveTo(hx - 5, hy + 11, hx - 6.6, hy + 6);
    ctx.quadraticCurveTo(hx - 9, hy + 10, hx - 13.8, hy + 6);
    ctx.closePath();
    H.paint(ctx, C.hair, C.hairLine, 1.05);
    ctx.strokeStyle = C.hairLight;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy - 9);
    ctx.quadraticCurveTo(hx - 2, hy - 14.6, hx + 5, hy - 12);
    ctx.stroke();
    starfish(ctx, hx - 5.6, hy - 9, 4.4, 0.3 + Math.sin(t * 2) * 0.05);
    const happy = pose === 'win' || pose === 'jump' || pose === 'wave' || pose === 'bubble';
    const eo = { iris: C.iris, line: C.eye, hurt: o.hurt, blink: H.blinking(t, 2.9), look: { x: 0.6, y: 0 } };
    H.eye(ctx, hx + 2.4, hy + 0.6, 3, 4.4, eo);
    H.eye(ctx, hx + 9.6, hy + 0.6, 3.3, 4.8, eo);
    if (!o.hurt && !eo.blink) {
      ctx.strokeStyle = C.eye;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (const [ex, rx, ry] of [[hx + 2.4, 3, 4.4], [hx + 9.6, 3.3, 4.8]]) {
        ctx.moveTo(ex + rx * 0.4, hy + 0.6 - ry * 0.9);
        ctx.lineTo(ex + rx * 1.1, hy + 0.6 - ry * 1.3);
        ctx.moveTo(ex + rx * 0.85, hy + 0.6 - ry * 0.55);
        ctx.lineTo(ex + rx * 1.6, hy + 0.6 - ry * 0.8);
      }
      ctx.stroke();
    }
    ctx.save();
    ctx.globalAlpha *= 0.55;
    ctx.fillStyle = C.cheek;
    ellipsePath(ctx, hx + 0.6, hy + 6.6, 2.6, 1.7);
    ctx.fill();
    ellipsePath(ctx, hx + 12.4, hy + 6.2, 1.6, 1.6);
    ctx.fill();
    ctx.restore();
    // petit nez et bouche
    ellipsePath(ctx, hx + 13.2, hy + 4, 1.6, 1.9);
    H.paint(ctx, C.skin, C.skinLine, 0.9);
    const mx = hx + 9.4;
    const my = hy + 9;
    if (o.hurt) {
      ellipsePath(ctx, mx, my, 1.8, 1.6);
      H.paint(ctx, '#a3263b', '#6e1424', 0.8);
    } else if (happy) {
      ctx.beginPath();
      ctx.moveTo(mx - 3, my - 1);
      ctx.quadraticCurveTo(mx, my, mx + 3, my - 1.4);
      ctx.quadraticCurveTo(mx + 2.4, my + 3.4, mx, my + 3.4);
      ctx.quadraticCurveTo(mx - 2.6, my + 3.2, mx - 3, my - 1);
      ctx.closePath();
      H.paint(ctx, '#a3263b', '#6e1424', 0.8);
      ctx.fillStyle = '#ff7f95';
      ellipsePath(ctx, mx, my + 2.2, 1.6, 0.8);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#c03050';
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mx - 2.6, my - 0.6);
      ctx.quadraticCurveTo(mx, my + 1.8, mx + 2.6, my - 1);
      ctx.stroke();
    }
  }

  // La grosse bulle transparente, par-dessus la sirène.
  function bubble(ctx, t) {
    const w = Math.sin(t * 4) * 1.6;
    ctx.save();
    ellipsePath(ctx, 0, -32, 36 + w, 36 - w);
    const g = ctx.createRadialGradient(-8, -42, 4, 0, -32, 37);
    g.addColorStop(0, 'rgba(200,245,255,0.08)');
    g.addColorStop(0.75, 'rgba(140,220,255,0.18)');
    g.addColorStop(1, 'rgba(120,200,255,0.4)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,230,0.45)';
    ctx.lineWidth = 1;
    ellipsePath(ctx, 0, -32, 34.4 + w, 34.4 - w);
    ctx.stroke();
    // reflets
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ellipsePath(ctx, -17, -53, 7, 3.4, -0.7);
    ctx.fill();
    circlePath(ctx, -26, -42, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -32, 30, 0.3, 0.9);
    ctx.stroke();
    ctx.restore();
  }

  H.add('sirene', {
    draw(ctx, o, R) {
      const pose = o.pose;
      const t = o.t || 0;
      let { legF, legB, armF, armB, bob, lean, crouch } = R;
      let a1 = 0.12 + (legF + legB) * 0.3;
      let a2 = a1 - 0.35 + (legB - legF) * 0.4;
      let finA = a2 * 0.5;
      let flow = 0;
      if (pose === 'idle' || pose === 'wave') {
        const s = Math.sin(t * 2.5);
        a1 = 0.12 + s * 0.03;
        a2 = -0.3 - s * 0.06;
        finA = a2 * 0.5;
      } else if (pose === 'walk' || pose === 'run') {
        // elle sautille sur sa queue : pliée quand elle touche le sol, tendue en l'air
        const hop = Math.abs(Math.sin(o.ph));
        bob = -hop * (pose === 'run' ? 9 : 6);
        a1 = 0.06 + 0.2 * (1 - hop);
        a2 = 0.15 - 0.7 * (1 - hop);
        finA = a2 * (0.5 + hop * 0.5);
        armF = -0.5 - hop * 0.6;
        armB = 0.5 + hop * 0.6;
        lean = pose === 'run' ? 0.14 : 0.06;
        flow = hop * 0.2;
      } else if (pose === 'jump') {
        a1 = 0.3;
        a2 = 0.8;
        finA = a2;
        flow = -0.1;
      } else if (pose === 'fall') {
        a1 = 0.25;
        a2 = 1.15;
        finA = a2;
        flow = 0.35;
      } else if (pose === 'pound') {
        a1 = -1.1;
        a2 = -2.2;
        finA = a2;
      } else if (pose === 'crouch') {
        crouch = 8;
        a1 = 0.75;
        a2 = -1.15;
        finA = -0.5;
      } else if (pose === 'hang') {
        a1 = 0.08 + Math.sin(t * 3) * 0.08;
        a2 = 0.3 + Math.sin(t * 3 - 0.6) * 0.15;
        finA = a2;
        armF = -1.95 + Math.sin(t * 3) * 0.1;
        armB = 1.95 + Math.sin(t * 3) * 0.1;
      }
      if (pose === 'wave') {
        // les deux bras poussent la vague devant elle
        const p = Math.sin(t * 6) * 0.1;
        armF = -1.55 + p;
        armB = -1.35 + p;
        lean = 0.08;
      }
      const inBubble = pose === 'bubble';
      if (inBubble) {
        // roulée en boule, elle nage dans sa bulle
        const s = Math.sin(t * 4);
        ctx.save();
        ctx.translate(0, -32 + Math.sin(t * 2) * 1.5);
        ctx.rotate(0.35 + Math.sin(t * 1.6) * 0.08);
        ctx.scale(0.8, 0.8);
        ctx.translate(0, 38);
        a1 = 0.9;
        a2 = 2.1 + s * 0.15;
        finA = a2;
        armF = -1.3 + s * 0.3;
        armB = 0.9 - s * 0.3;
        bob = 0;
        lean = 0;
        flow = 0.3;
      }
      ctx.translate(0, bob);
      ctx.rotate(lean);
      ctx.save();
      ctx.translate(0, crouch);
      backHair(ctx, o, HX, HY, flow);
      arm(ctx, -1.4, -37.4, armB, true);
      ctx.restore();
      ctx.save();
      ctx.translate(0, crouch);
      if (pose === 'crouch') {
        // la queue est repliée sous elle : on la remonte d'autant
        ctx.translate(0, -crouch * 0.4);
      }
      tail(ctx, a1, a2, finA);
      ctx.restore();
      ctx.save();
      ctx.translate(0, crouch);
      torso(ctx);
      waistFrill(ctx);
      headShape(ctx, o, HX, HY);
      if (o.holding) {
        ctx.save();
        ctx.translate(0, -5);
        o.holding(ctx);
        ctx.restore();
      }
      arm(ctx, 1.4, -37.2, armF, false);
      ctx.restore();
      if (inBubble) {
        ctx.restore();
        bubble(ctx, t);
      }
    },
    head(ctx) {
      ctx.save();
      circlePath(ctx, -2, 4, 18);
      ctx.clip();
      backHair(ctx, { t: 1, pose: 'idle' }, -2, 5, 0);
      ctx.restore();
      headShape(ctx, { t: 1, pose: 'idle' }, -2, 5);
    },
  });
})();
