'use strict';

// =====================================================================
//  LES PERSONNAGES
//  Super Malice est toujours là. À chaque chargement du jeu, 3 autres
//  personnages sont tirés au hasard parmi tous ceux de la liste.
//  Chaque personnage a son dessin dans js/persos/ et son pouvoir dans js/pouvoirs.js.
//
//  name : son nom dans les phrases ("Le Lutin a sauvé le bébé oiseau !")
//  call : comment les fleurs l'appellent ("Bonjour Lutin !")
//  power / desc : le nom de son pouvoir et comment s'en servir (écran de choix et aide)
//  headY : la hauteur de sa tête (pour les étoiles quand il est sonné)
//  secret : jamais tiré au hasard ; il faut toucher 3 fois de suite la carte de Super Malice
//           sur l'écran de choix pour le faire apparaître (jusqu'au prochain chargement du jeu)
// =====================================================================
const HEROES = [
  { id: 'malice', name: 'Super Malice', call: 'Malice', power: 'L\'héroïne', desc: 'Elle seule gagne les badges\u00a0: roulade, super saut et moustache-grappin\u00a0!', headY: -46 },
  { id: 'lutin', name: 'Le Lutin', call: 'Lutin', power: 'Bloc magique', desc: '{POUVOIR}\u00a0: un bloc lutin apparaît sous tes pieds, monte dessus\u00a0!', headY: -44 },
  { id: 'biche', name: 'La Biche', call: 'Biche', power: 'Double saut', desc: 'Saute une deuxième fois en l\'air\u00a0!', headY: -50 },
  { id: 'bonbon', name: 'Gros Bonbon', call: 'Gros Bonbon', power: 'Boule rebondissante', desc: 'Reste appuyé sur {POUVOIR}\u00a0: tu roules en boule et tu rebondis très haut\u00a0!', headY: -36 },
  { id: 'ronaxel', name: 'Ronaxel', call: 'Ronaxel', power: 'Ballon et SIUUU', desc: '{POUVOIR}\u00a0: tire un ballon. En l\'air\u00a0: saut SIUUU, tout là-haut\u00a0!', headY: -52 },
  { id: 'poussin', name: 'Le Poussin', call: 'Poussin', power: 'Battements d\'ailes', desc: 'En l\'air, saute encore\u00a0: tu bats des ailes 3 fois pour remonter.', headY: -40 },
  { id: 'luisy', name: 'Luisy', call: 'Luisy', power: 'Grand saut plané', desc: 'Elle saute très haut. En tombant, garde le saut appuyé pour planer.', headY: -52 },
  { id: 'messi', name: 'Messi', call: 'Messi', power: 'Dribble', desc: 'Reste appuyé sur {POUVOIR} (ou cours)\u00a0: tu dribbles à travers les ennemis\u00a0!', headY: -50 },
  { id: 'licorne', name: 'La Licorne', call: 'Licorne', power: 'Charge arc-en-ciel', desc: '{POUVOIR}\u00a0: elle fonce avec sa corne, même en l\'air\u00a0!', headY: -48 },
  { id: 'dragon', name: 'Bébé Dragon', call: 'Bébé Dragon', power: 'Bulles de feu', desc: '{POUVOIR}\u00a0: crache une bulle de feu. La lave ne lui fait rien\u00a0!', headY: -42 },
  { id: 'pingouin', name: 'Le Pingouin', call: 'Pingouin', power: 'Glissade', desc: '{POUVOIR}\u00a0: glisse sur le ventre et renverse tout\u00a0!', headY: -44 },
  { id: 'chat', name: 'Le Chat Ninja', call: 'Chat Ninja', power: 'Saut de mur', desc: 'Il s\'accroche aux murs\u00a0: saute pour rebondir de mur en mur\u00a0!', headY: -46 },
  { id: 'sirene', name: 'La Sirène', call: 'Sirène', power: 'Bulle et vague', desc: '{POUVOIR}\u00a0: une vague pousse les ennemis. En l\'air\u00a0: une bulle t\'emporte\u00a0!', headY: -50 },
  { id: 'dino', name: 'Le Dinosaure', call: 'Dino', power: 'Tremblement de terre', desc: '{POUVOIR} ou écraser vers le bas\u00a0: BOUM ! Le sol tremble.', headY: -48 },
  { id: 'goku', name: 'San Goku', call: 'San Goku', secret: true, power: 'Kaméhaméha et nuage', desc: '{POUVOIR}\u00a0: Kaméhaméha\u00a0! En l\'air\u00a0: son nuage magique l\'emporte.', headY: -46 },
  { id: 'gizmo', name: 'Gizmo', call: 'Gizmo', secret: true, power: 'Petite voiture', desc: '{POUVOIR}\u00a0: vroum, sa petite voiture\u00a0! Dans l\'eau, il devient un Gremlin…', headY: -32 },
];
const HERO_BY_ID = {};
HEROES.forEach((h) => { HERO_BY_ID[h.id] = h; });

// Où se pose le bébé oiseau pendant le retour à la maison : [x, y] du haut de la tête
// (sur Malice, il est assis sur la casquette, en -62).
const HERO_HAT = {
  malice: [0, -62], lutin: [0, -56], biche: [14, -58], bonbon: [0, -50], ronaxel: [0, -70], poussin: [0, -58],
  luisy: [0, -72], messi: [2, -60], licorne: [9, -50], dragon: [2, -57], pingouin: [0, -56], chat: [0, -62],
  sirene: [0, -64], dino: [4, -60], goku: [0, -66], gizmo: [2, -43],
};

// La couleur de leurs mains (ou de leurs pattes, de leurs ailes…) et de leur contour : leurs deux poings serrés
// sur une liane du Vieux Chêne (voir Player.draw).
const HERO_HAND = {
  malice: ['#ffdcc4', '#c98868'], lutin: ['#ffd7b5', '#8a4a2a'], biche: ['#c98a4e', '#6e4020'], bonbon: ['#ff9cc8', '#b0346e'],
  ronaxel: ['#f7cfae', '#b97c58'], poussin: ['#ffd83a', '#b07a10'], luisy: ['#ffdcc4', '#c98868'], messi: ['#f5cba6', '#b67a52'],
  licorne: ['#fdfbff', '#9a88bc'], dragon: ['#6fd24a', '#2f7a1e'], pingouin: ['#2e3446', '#11141d'], chat: ['#ffa53a', '#a2521a'],
  sirene: ['#ffe0cc', '#c98868'], dino: ['#8fd35a', '#3a7a22'], goku: ['#ffd4ae', '#b97a52'], gizmo: ['#a8723e', '#4a2a12'],
};

const Heroes = (() => {
  const TAU = Math.PI * 2;
  const DRAW = {};

  // Chaque fichier de js/persos/ ajoute son personnage : Heroes.add('lutin', { draw, head }).
  //   draw(ctx, o, R) : dessine le personnage les pieds en (0, 0), tourné vers la droite.
  //                     o = { pose, t, ph, hurt, ouch, holding, pw, ... } (voir Heroes.draw)
  //                     R = { legF, legB, armF, armB, bob, lean, crouch } : angles des bras et des jambes
  //   head(ctx, o)    : juste la tête, centrée en (0, 0), pour le HUD (environ 34 de large).
  //   hat(o)          : (s'il change de forme) où se pose le bébé oiseau, à la place de HERO_HAT.
  function add(id, def) { DRAW[id] = def; }

  // ---------- Petits outils de dessin ----------
  const paint = (ctx, fill, line, lw) => Art.paint(ctx, fill, line, lw);

  // Éclaircit (k > 0) ou assombrit (k < 0) une couleur '#rrggbb'.
  function tone(c, k) {
    return k >= 0 ? Art.mixColor(c, '#ffffff', k) : Art.mixColor(c, '#000000', -k);
  }

  // Un bras ou une jambe : une gélule qui part de (x, y) et pend vers le bas, tournée de a.
  function limb(ctx, x, y, a, len, w, fill, line, lw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    roundRectPath(ctx, -w / 2, -w / 2, w, len + w / 2, w / 2);
    paint(ctx, fill, line, lw || 1);
    ctx.restore();
  }

  // Le bout d'un membre (main, pied) : où arrive une gélule partie de (x, y) avec l'angle a.
  function tip(x, y, a, len) {
    return { x: x - Math.sin(a) * len, y: y + Math.cos(a) * len };
  }

  function blob(ctx, x, y, rx, ry, fill, line, lw, rot) {
    ellipsePath(ctx, x, y, rx, ry, rot);
    paint(ctx, fill, line, lw || 1);
  }

  // Cligne des yeux de temps en temps (chaque personnage à son rythme grâce à seed).
  function blinking(t, seed) {
    const p = (t + (seed || 0)) % 3.7;
    return p > 3.55;
  }

  // Un grand oeil de dessin animé : blanc, iris, pupille, reflet.
  // o : iris (couleur), look ({x, y} de -1 à 1), blink, hurt (plissé de douleur), lid (paupière 0..1)
  function eye(ctx, x, y, rx, ry, o) {
    o = o || {};
    if (o.hurt) {
      // plissé : un petit chevron >
      ctx.strokeStyle = o.line || '#2a1a2a';
      ctx.lineWidth = Math.max(1.2, rx * 0.45);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.8, y - ry * 0.6);
      ctx.lineTo(x + rx * 0.5, y);
      ctx.lineTo(x - rx * 0.8, y + ry * 0.6);
      ctx.stroke();
      return;
    }
    if (o.blink) {
      ctx.strokeStyle = o.line || '#2a1a2a';
      ctx.lineWidth = Math.max(1.1, rx * 0.35);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - rx, y + ry * 0.1);
      ctx.quadraticCurveTo(x, y + ry * 0.55, x + rx, y + ry * 0.1);
      ctx.stroke();
      return;
    }
    ellipsePath(ctx, x, y, rx, ry);
    paint(ctx, '#ffffff', o.line || '#2a1a2a', o.lw || 0.9);
    const lx = (o.look ? o.look.x : 0.35) * rx * 0.35;
    const ly = (o.look ? o.look.y : 0) * ry * 0.3;
    ctx.save();
    ellipsePath(ctx, x, y, rx, ry);
    ctx.clip();
    ctx.fillStyle = o.iris || '#4a2a1a';
    ellipsePath(ctx, x + lx, y + ly, rx * 0.68, ry * 0.72);
    ctx.fill();
    ctx.fillStyle = '#14101c';
    ellipsePath(ctx, x + lx, y + ly, rx * 0.38, ry * 0.42);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circlePath(ctx, x + lx - rx * 0.22, y + ly - ry * 0.3, Math.max(0.6, rx * 0.22));
    ctx.fill();
    if (o.lid) {
      ctx.fillStyle = o.lidColor || '#e0b090';
      ctx.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, (ry * 2 + 1) * o.lid);
    }
    ctx.restore();
  }

  // ---------- Animation des bras et des jambes (la même que Malice) ----------
  // head : le haut de sa tête (pour aller chercher les piquants du hérisson, voir headTop)
  function rig(pose, t, ph, k, head) {
    const R = { legF: 0.1, legB: -0.1, armF: -0.12, armB: 0.12, bob: 0, lean: 0, crouch: 0 };
    switch (pose) {
      case 'walk': {
        const s = Math.sin(ph);
        R.legF = s * 0.62; R.legB = -s * 0.62;
        R.armF = -s * 0.8; R.armB = s * 0.8;
        R.bob = -Math.abs(Math.cos(ph)) * 2;
        R.lean = 0.05;
        break;
      }
      case 'run': {
        const s = Math.sin(ph);
        R.legF = s * 0.95; R.legB = -s * 0.95;
        R.armF = -s * 1.15; R.armB = s * 1.15;
        R.bob = -Math.abs(Math.cos(ph)) * 3;
        R.lean = 0.16;
        break;
      }
      case 'jump': Object.assign(R, { legF: -0.95, legB: 0.45, armF: -1.65, armB: 1.15 }); break;
      case 'fall': Object.assign(R, { legF: 0.3, legB: -0.35, armF: -1.3, armB: 1.45 }); break;
      case 'pound': Object.assign(R, { legF: -1.6, legB: -1.25, armF: -0.75, armB: 0.6, bob: 3 }); break;
      case 'throw': Object.assign(R, { armF: -1.6, armB: 0.6, legF: 0.3, legB: -0.3 }); break;
      case 'win': Object.assign(R, { armF: -1.85 + Math.sin(t * 10) * 0.22, armB: 1.3, legF: 0.2, legB: -0.2 }); break;
      case 'hurt': Object.assign(R, { armF: -1.25, armB: 1.5, legF: 0.45, legB: -0.45, lean: -0.12 }); break;
      case 'ouch': Object.assign(R, k ? Art.ouchPose(k) : {}); break;
      case 'hold': Object.assign(R, { armF: -1.0, armB: -0.8 }); break;
      case 'crouch': Object.assign(R, { crouch: 7, legF: -1.25, legB: -0.85, armF: -0.6, armB: 0.3 }); break;
      case 'hang': Object.assign(R, { armF: 0.25, armB: -0.25, legF: 0.25, legB: -0.2 }); break;
      // il glisse sur la bave : les bras qui moulinent, penché en arrière
      case 'slip': Object.assign(R, { armF: -2.3 + Math.sin(t * 18) * 0.6, armB: 1.9 + Math.cos(t * 18) * 0.6, legF: -0.6, legB: 0.5, lean: -0.2 }); break;
      case 'vine': {
        // pendu à une liane du Vieux Chêne : les deux bras tendus vers le haut, les jambes qui gigotent
        const s = Math.sin(t * 3) * 0.2;
        Object.assign(R, { armF: -2.8 + Math.sin(t * 3) * 0.04, armB: 2.8 - Math.sin(t * 3) * 0.04, legF: 0.35 + s, legB: -0.2 - s });
        break;
      }
      case 'float': {
        // pendu à un pissenlit géant : les bras en l'air, les jambes qui se balancent
        const s = Math.sin(t * 2.2) * 0.18;
        Object.assign(R, { armF: -2.25 + Math.sin(t * 2.6) * 0.05, armB: -2.0, legF: 0.3 + s, legB: -0.1 - s });
        break;
      }
      default:
        R.bob = Math.sin(t * 2.5) * 0.7;
        R.armF = -0.12 - Math.sin(t * 2.5) * 0.04;
    }
    // il enlève un piquant du hérisson
    if (k && k.kind === 'pins' && Art.PIN_REACH_POSES.includes(pose)) {
      const a = Art.pinsReach(k, head);
      if (a !== null) R.armF = a;
    }
    return R;
  }

  // Le haut de sa tête : [x, y] (là où se pose le bébé oiseau). o : comme pour draw (Gizmo en Gremlin…).
  function headTop(id, o) {
    const def = DRAW[id];
    return (def && def.hat && def.hat(o || {})) || HERO_HAT[id] || HERO_HAT.malice;
  }

  // ---------- Couleurs qui recouvrent tout le personnage ----------
  // (étoile arc-en-ciel, suie, électrocution, lave…) : on le dessine à part, puis on le colorie.
  const BOX = { x: -52, y: -104, w: 104, h: 116 };
  let off = null;
  let offCtx = null;

  function tinted(ctx, paintFn, tintFn) {
    const m = ctx.getTransform();
    const k = Math.min(4, Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)) || 1);
    const W = Math.ceil(BOX.w * k);
    const H = Math.ceil(BOX.h * k);
    if (!off) {
      off = document.createElement('canvas');
      offCtx = off.getContext('2d');
    }
    if (off.width < W || off.height < H) {
      off.width = Math.max(off.width, W);
      off.height = Math.max(off.height, H);
    }
    const g = offCtx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, W + 1, H + 1);
    g.setTransform(k, 0, 0, k, -BOX.x * k, -BOX.y * k);
    paintFn(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    tintFn(g, W, H, k);
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, 0, 0, W, H, BOX.x, BOX.y, BOX.w, BOX.h);
  }

  // Quelle couleur mettre par-dessus, et avec quelle force (ou null).
  function tintFor(o) {
    const k = o.ouch;
    if (o.lava) return { color: '#3a2420', a: 0.75 };
    if (o.choco) return { color: o.chocoTint || '#6a3a1c', a: 0.8 };
    if (o.star) return { rainbow: o.t, a: 0.5 };
    if (!k) return null;
    const left = k.dur - k.t;
    switch (k.kind) {
      case 'soot': return { color: '#1a1a1a', a: 0.85 * clamp(left / 0.6, 0, 1) };
      case 'zap':
        if (k.shock) return Math.floor(k.t / 0.07) % 2 ? { color: '#2a6aff', a: 0.7 } : { color: '#bfeaff', a: 0.5 };
        return { color: '#2a2020', a: 0.45 * clamp(left / 0.5, 0, 1) };
      case 'scramble': return { color: `hsl(${Math.floor(k.t * 900) % 360},90%,55%)`, a: 0.55 * clamp(left / 0.5, 0, 1) };
      case 'hypno': return { color: '#b070ff', a: 0.25 * clamp(left / 0.5, 0, 1) };
      case 'wet': return { color: '#3a8ae8', a: 0.3 * clamp(left / 0.5, 0, 1) };
      case 'slime': return { color: '#8ee05a', a: 0.38 * clamp(left / 0.5, 0, 1) };
      case 'dirt': return { color: '#7a4a24', a: 0.38 * clamp(left / 0.5, 0, 1) };
      // tout vert (la grenouille), puis il reprend sa couleur après avoir coassé deux fois
      case 'croak': return { color: '#3ed03a', a: 0.6 * clamp(k.t / 0.12, 0, 1) * clamp(left / 0.5, 0, 1) };
      // tout rouge d'avoir été piqué, au début
      // (ensuite plus rien : inutile de redessiner le personnage à part)
      case 'pins': return k.t < 0.6 ? { color: '#ff5a6a', a: 0.22 * (1 - k.t / 0.6) } : null;
      default: return null;
    }
  }

  function applyTint(g, W, H, T) {
    g.globalAlpha = T.a;
    if (T.rainbow !== undefined) {
      const gr = g.createLinearGradient(0, 0, W * 0.6, H);
      for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, `hsl(${(T.rainbow * 400 + i * 60) % 360},100%,60%)`);
      g.fillStyle = gr;
    } else {
      g.fillStyle = T.color;
    }
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
  }

  // ---------- Dessiner un personnage ----------
  // Les pieds au point (x, y). o : facing, pose, t, ph, sx/sy (écrasement), scale, ouch,
  //   star (pendant l'étoile), lava (brûlé par la lave), choco (enfoncé dans le chocolat ou la boue : chocoTint,
  //   voir SINK), holding (le bébé oiseau), pw (état du pouvoir).
  function draw(ctx, id, x, y, o) {
    o = o || {};
    // projeté par un sanglier : il tourne comme une toupie, puis se retrouve la tête en bas (autour du milieu
    // de son corps : sa tête touche le sol là où étaient ses pieds), voir Art.spinTurn
    if (o.ouch && o.ouch.kind === 'spin' && !o.spun) {
      const top = id === 'malice' || !HERO_BY_ID[id] ? -62 : HERO_BY_ID[id].headY - 16;
      const turn = Art.spinTurn(o.ouch);
      const f = o.facing || 1;
      const sc = o.scale || 1;
      const cy = y + (top / 2) * sc;
      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(turn.a * f);
      ctx.scale(turn.sx, 1);
      ctx.translate(-x, -cy);
      draw(ctx, id, x, y, Object.assign({}, o, { spun: true }));
      ctx.restore();
      if (turn.whirl > 0) Art.spinWhirl(ctx, x, cy, (-top / 2 + 10) * sc, o.ouch.t, turn.whirl);
      return;
    }
    if (id === 'malice' || !DRAW[id]) {
      Art.malice(ctx, x, y, Object.assign({}, o, {
        palette: o.star ? Art.maliceRainbow(o.t || 0) : o.palette,
      }));
      return;
    }
    const def = DRAW[id];
    const k = o.ouch || null;
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const head = headTop(id, o);
    const R = rig(pose, t, o.ph || 0, k, head);
    const shock = k && k.kind === 'zap' && k.shock;
    const opts = Object.assign({}, o, {
      pose, t, ph: o.ph || 0,
      // tout son corps réagit, ou il vient d'avoir mal (ou il enlève un piquant) : les yeux plissés
      hurt: pose === 'ouch' || pose === 'hurt' || (k && k.t < 0.35) || (k && k.kind === 'pins' && Art.pinsWince(k)),
    });
    ctx.save();
    ctx.translate(x, y);
    const sc = o.scale || 1;
    ctx.scale((o.facing || 1) * sc * (o.sx || 1), sc * (o.sy || 1));
    if (shock) ctx.translate(rand(-1.2, 1.2), rand(-0.8, 0.8));
    // tout mouillé : il grelotte
    if (k && k.kind === 'wet' && k.t < k.dur - 0.3) ctx.translate(Math.sin(k.t * 80) * 0.9, 0);
    const paintIt = (c) => {
      c.save();
      def.draw(c, opts, R);
      c.restore();
    };
    const T = tintFor(o);
    if (T) tinted(ctx, paintIt, (g, W, H) => applyTint(g, W, H, T));
    else paintIt(ctx);
    const info = HERO_BY_ID[id];
    if (k && k.kind === 'ko') {
      ctx.save();
      // les étoiles de Malice tournent 21 au-dessus du centre de sa tête (-50)
      ctx.translate(0, info.headY + 50);
      Art.koStars(ctx, k, t);
      ctx.restore();
    }
    if (k && k.kind === 'spots') Art.spotsOverlay(ctx, k);
    if (k && k.kind === 'wet') Art.wetOverlay(ctx, k, info.headY - 12);
    if (k && k.kind === 'slime') Art.slimeOverlay(ctx, k, info.headY - 12);
    if (k && k.kind === 'dirt') Art.dirtOverlay(ctx, k, info.headY - 12);
    if (k && k.kind === 'pins') Art.pinsOverlay(ctx, k, head);
    if (k && k.kind === 'croak') Art.croakOverlay(ctx, k, info.headY, head[0]);
    // le bébé oiseau assis sur la tête
    if (o.onHead) {
      const [hx, hy] = head;
      ctx.save();
      ctx.translate(hx, hy - HERO_HAT.malice[1] + R.bob + R.crouch);
      o.onHead(ctx);
      ctx.restore();
    }
    ctx.restore();
  }

  // Juste la tête (HUD, écran du niveau), centrée en (x, y), s : la taille.
  // o : l'état du pouvoir (pw), pour un personnage qui change de forme (Gizmo en Gremlin).
  function head(ctx, id, x, y, s, o) {
    if (id === 'malice' || !DRAW[id] || !DRAW[id].head) {
      Art.maliceHead(ctx, x, y, s);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    DRAW[id].head(ctx, o || {});
    ctx.restore();
  }

  return { TAU, add, draw, head, headTop, rig, paint, tone, limb, tip, blob, eye, blinking };
})();
