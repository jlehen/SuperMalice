'use strict';

// ---------------- Le Lutin ----------------
// Le petit lutin des blocs bonus : bonnet vert pointu avec un pompon blanc, oreilles pointues,
// tunique verte, ceinture dorée et chaussures pointues.
// Pouvoir : il lève le bras et fait apparaître un bloc magique sous ses pieds (pose 'magic').
(() => {
  const H = Heroes;
  const C = {
    skin: '#ffd7b5', skinShade: '#f2bf98', skinLine: '#8a4a2a', ear: '#ffcfa8', nose: '#ffbe94',
    hat: '#2fae4f', hatLight: '#6fd88a', hatLine: '#17652a', band: '#e8312f', bandLine: '#9a1a18',
    tunic: '#3cbc5c', tunicDark: '#27984a', tunicLight: '#7fe09a', tunicLine: '#17652a',
    belt: '#7a4a22', beltLine: '#4a2a10', buckle: '#ffd23a', buckleLine: '#a87a10',
    pants: '#a8482a', pantsDark: '#84361e', pantsLine: '#5a2410',
    shoe: '#8a5a2a', shoeDark: '#6a4220', shoeLine: '#3a2210', shoeLight: '#c08a58',
  };

  // Une petite étoile à 4 branches (les étincelles de la magie).
  function sparkle(ctx, x, y, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * H.TAU;
      const d = i % 2 ? r * 0.32 : r;
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Une jambe (pantalon) avec sa chaussure pointue au bout recourbé.
  function leg(ctx, x, y, a, back, len) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -3.1, -2, 6.2, len + 2.5, 3);
    H.paint(ctx, back ? C.pantsDark : C.pants, C.pantsLine, 1);
    ctx.translate(0, len + 1.2);
    ctx.rotate(-a);
    ctx.beginPath();
    ctx.moveTo(-3.6, 1);
    ctx.quadraticCurveTo(-3.8, -3, 0, -3.2);
    ctx.quadraticCurveTo(4.5, -3, 6.5, -1.2);
    ctx.quadraticCurveTo(8.6, 0.2, 9.6, -3);
    ctx.quadraticCurveTo(11.2, 2.8, 5, 2.8);
    ctx.lineTo(-2, 2.8);
    ctx.quadraticCurveTo(-3.6, 2.8, -3.6, 1);
    ctx.closePath();
    H.paint(ctx, back ? C.shoeDark : C.shoe, C.shoeLine, 1);
    if (!back) {
      ctx.fillStyle = C.shoeLight;
      ellipsePath(ctx, 1.5, -1.6, 2.4, 1, -0.1);
      ctx.fill();
    }
    circlePath(ctx, 9.7, -3.4, 1.1);
    H.paint(ctx, C.buckle, C.buckleLine, 0.7);
    ctx.restore();
  }

  // Un bras : manche verte et petite main.
  function arm(ctx, x, y, a, back, k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    if (k) ctx.scale(1, k);
    circlePath(ctx, 0, 8.6, 2.5);
    H.paint(ctx, back ? C.skinShade : C.skin, C.skinLine, 0.95);
    ctx.beginPath();
    ctx.moveTo(-2.6, -1);
    ctx.quadraticCurveTo(0, -3.4, 2.6, -1);
    ctx.lineTo(3.4, 6.6);
    ctx.quadraticCurveTo(0, 7.8, -3.4, 6.6);
    ctx.closePath();
    H.paint(ctx, back ? C.tunicDark : C.tunic, C.tunicLine, 0.95);
    ctx.restore();
  }

  // La tunique un peu évasée, le bas en pointes, avec la ceinture.
  function body(ctx) {
    ctx.beginPath();
    ctx.moveTo(-6, -27);
    ctx.quadraticCurveTo(0.5, -29, 6.5, -27);
    ctx.quadraticCurveTo(9.2, -20, 10, -11);
    const pts = [[6.8, -8.4], [3.6, -11], [0.4, -8.4], [-2.8, -11], [-6, -8.4], [-9.6, -11]];
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.quadraticCurveTo(-9, -20, -6, -27);
    ctx.closePath();
    H.paint(ctx, C.tunic, C.tunicLine, 1.05);
    ctx.fillStyle = C.tunicLight;
    ctx.globalAlpha *= 0.55;
    ellipsePath(ctx, 3.5, -23, 3, 2.2, -0.3);
    ctx.fill();
    ctx.globalAlpha /= 0.55;
    // ceinture et boucle dorée
    roundRectPath(ctx, -9.4, -18.2, 19.2, 3.6, 1.4);
    H.paint(ctx, C.belt, C.beltLine, 0.9);
    roundRectPath(ctx, 4.2, -19.1, 4.8, 5.4, 1.1);
    H.paint(ctx, C.buckle, C.buckleLine, 0.9);
    ctx.fillStyle = C.belt;
    ctx.fillRect(5.6, -17.6, 2, 2.4);
  }

  function headShape(ctx, o, x, y) {
    const t = o.t || 0;
    const happy = o.pose === 'win' || o.pose === 'magic' || o.pose === 'jump';
    // oreilles pointues (celle de devant dépasse à peine derrière la joue)
    for (const side of [1, -1]) {
      ctx.beginPath();
      if (side > 0) {
        ctx.moveTo(x + 6, y - 3);
        ctx.lineTo(x + 12.5, y - 8);
        ctx.lineTo(x + 8.4, y + 2);
      } else {
        ctx.moveTo(x - 6.5, y - 1.5);
        ctx.lineTo(x - 17, y - 8);
        ctx.lineTo(x - 7.5, y + 4.5);
      }
      ctx.closePath();
      H.paint(ctx, C.ear, C.skinLine, 1.05);
      if (side < 0) {
        ctx.fillStyle = '#ffb090';
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 0.5);
        ctx.lineTo(x - 14.5, y - 6.2);
        ctx.lineTo(x - 8.6, y + 2.6);
        ctx.closePath();
        ctx.fill();
      }
    }
    circlePath(ctx, x, y, 9.6);
    H.paint(ctx, C.skin, C.skinLine, 1.1);
    // yeux, joues, nez, sourire
    const blink = H.blinking(t, 0.4);
    H.eye(ctx, x + 0.6, y + 0.4, 1.9, 2.6, { iris: '#3a2412', hurt: o.hurt, blink, line: '#3a2010', lw: 0.8, look: { x: 0.8, y: o.pose === 'magic' ? -0.9 : 0 } });
    H.eye(ctx, x + 5.8, y + 0.4, 1.8, 2.5, { iris: '#3a2412', hurt: o.hurt, blink, line: '#3a2010', lw: 0.8, look: { x: 0.8, y: o.pose === 'magic' ? -0.9 : 0 } });
    ctx.fillStyle = 'rgba(255,110,110,0.55)';
    circlePath(ctx, x - 2.6, y + 4.6, 2);
    ctx.fill();
    circlePath(ctx, x + 8, y + 4.6, 1.6);
    ctx.fill();
    ctx.strokeStyle = '#7a2a1a';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    if (o.hurt) {
      ctx.beginPath();
      ctx.moveTo(x + 1.2, y + 7);
      ctx.quadraticCurveTo(x + 3.4, y + 5.4, x + 5.6, y + 7);
      ctx.stroke();
    } else if (happy) {
      ctx.beginPath();
      ctx.moveTo(x + 0.8, y + 5.4);
      ctx.quadraticCurveTo(x + 3.6, y + 10, x + 6.4, y + 5.4);
      ctx.closePath();
      H.paint(ctx, '#c8384a', '#7a2a1a', 1);
    } else {
      ctx.beginPath();
      ctx.arc(x + 3.4, y + 4.6, 2.8, 0.35, Math.PI - 0.35);
      ctx.stroke();
    }
    circlePath(ctx, x + 3.6, y + 3.4, 1.6);
    H.paint(ctx, C.nose, '#d8946a', 0.6);
    // bonnet pointu qui retombe vers l'arrière, avec son pompon
    const sway = Math.sin(t * 3) * 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 10.5, y - 6);
    ctx.quadraticCurveTo(x + 4, y - 15, x - 3, y - 24.5);
    ctx.quadraticCurveTo(x - 11 + sway, y - 23.5, x - 14 + sway, y - 18);
    ctx.quadraticCurveTo(x - 7, y - 15, x - 10.5, y - 6);
    ctx.closePath();
    H.paint(ctx, C.hat, C.hatLine, 1.1);
    ctx.strokeStyle = C.hatLight;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 9);
    ctx.quadraticCurveTo(x + 0.5, y - 16, x - 3, y - 21.5);
    ctx.stroke();
    roundRectPath(ctx, x - 11.5, y - 8.4, 23, 4.6, 2.1);
    H.paint(ctx, C.band, C.bandLine, 1);
    circlePath(ctx, x - 15 + sway, y - 17.5, 3.4);
    H.paint(ctx, '#ffffff', '#b8b8c8', 0.9);
  }

  H.add('lutin', {
    draw(ctx, o, R) {
      const t = o.t;
      let { legF, legB, armF, armB, bob, lean } = R;
      const crouch = R.crouch * 0.6;
      let legLen = 7;
      if (o.pose === 'crouch') legLen = 5.5;
      if (o.pose === 'hang') {
        // accroché à l'anneau : les deux bras en l'air
        armF = -2.15;
        armB = 2.5;
      }
      if (o.pose === 'magic') {
        // un bras levé bien haut : la magie sort de ses doigts
        armF = -2.05 + Math.sin(t * 9) * 0.06;
        armB = 0.9;
        legF = 0.15;
        legB = -0.15;
        lean = -0.06;
      }
      ctx.translate(0, bob);
      ctx.rotate(lean);
      ctx.save();
      ctx.translate(0, crouch);
      const up = o.pose === 'magic' || o.pose === 'hang';
      arm(ctx, -2.2, -23.5, armB, true, o.pose === 'hang' ? 1.5 : 0);
      ctx.restore();
      leg(ctx, -2.6, -11 + crouch, legB, true, legLen);
      leg(ctx, 1.8, -11 + crouch, legF, false, legLen);
      ctx.save();
      ctx.translate(0, crouch);
      body(ctx);
      const magic = o.pose === 'magic';
      ctx.save();
      // pendant la magie, il lève la tête vers ses doigts
      ctx.translate(magic ? 0.5 : 2, -26);
      if (magic) ctx.rotate(-0.15);
      headShape(ctx, o, 0, -8.5);
      ctx.restore();
      if (o.holding) o.holding(ctx);
      const sx = up ? 5 : 2.6;
      arm(ctx, sx, -23.5, armF, false, up ? 1.5 : 0);
      if (magic) {
        const h = H.tip(sx, -23.5, armF, 15);
        const cols = ['#fff7a0', '#ffffff', '#ff9ad8', '#9ae8ff', '#ffd23a'];
        for (let i = 0; i < 5; i++) {
          const a = t * 5 + (i / 5) * H.TAU;
          const d = 5.5 + Math.sin(t * 7 + i * 2) * 1.8;
          const r = 2.2 + (Math.sin(t * 11 + i) + 1) * 0.9;
          sparkle(ctx, h.x + Math.cos(a) * d, h.y + Math.sin(a) * d * 0.8, r, cols[i]);
        }
        // et quelques poussières d'étoile qui retombent
        const a0 = ctx.globalAlpha;
        for (let i = 0; i < 4; i++) {
          const k = (t * 1.6 + i / 4) % 1;
          ctx.globalAlpha = a0 * (1 - k);
          sparkle(ctx, h.x - 2 + i * 2.5 + Math.sin(k * 6 + i) * 1.5, h.y + 4 + k * 18, 1.8, cols[i]);
        }
        ctx.globalAlpha = a0;
      }
      ctx.restore();
    },
    head(ctx) {
      ctx.scale(1.15, 1.15);
      headShape(ctx, { t: 1, pose: 'idle' }, 1, 6);
    },
  });
})();
