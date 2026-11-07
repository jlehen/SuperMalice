'use strict';

// La grande carte : tous les mondes à la suite, de la prairie au pays des bonbons.
// Un chemin, une case par niveau (1-1, 2-1…), une case étoile pour chaque stage d'entraînement
// (sur une petite branche à côté du chemin) et, au bout de chaque monde, la place du château du boss.
// Malice marche de case en case avec ← → (ou en touchant l'écran), et le saut lance le niveau.
// Tout est calculé à partir de WORLDS et LEVELS (levels.js) : un niveau de plus, une case de plus.
const Carte = (() => {
  const TAU = Math.PI * 2;
  const HORIZON = 236; // là où le ciel touche le sol
  const SLOT = 190; // l'écart entre deux cases d'un monde
  const SPEED = 280; // Malice sur le chemin (pixels par seconde), un peu plus vite sur les grands bouts de chemin
  const BLEND = 220; // un monde se fond dans le suivant sur cette largeur

  // Les couleurs de chaque monde : ciel (haut, bas), sol (au loin, tout près), chemin (dessus, bord), cases.
  const LOOK = {
    meadow: { sky: ['#45b4ff', '#c8eeff'], ground: ['#9fe56e', '#46b845'], path: '#f8e4a8', edge: '#c08a48', node: '#ff5fa8', nodeDark: '#b82a70' },
    forest: { sky: ['#5ec4b0', '#d4f4cc'], ground: ['#5fb867', '#2c7a44'], path: '#d8a96c', edge: '#7a5232', node: '#2fae55', nodeDark: '#16703a' },
    storm: { sky: ['#3d2a6b', '#c49ad0'], ground: ['#f4bfdc', '#b8729a'], path: '#fff2f8', edge: '#7a4428', node: '#8a62e0', nodeDark: '#45289a' },
    mountain: { sky: ['#ff7a6b', '#ffe2aa'], ground: ['#cdb874', '#8c6858'], path: '#ecd6b0', edge: '#7d5a4a', node: '#ff8a2a', nodeDark: '#a8480f' },
    volcano: { sky: ['#1a0608', '#8a2a10'], ground: ['#5d4652', '#2a1c24'], path: '#9a7c86', edge: '#ff7a2a', node: '#ff4a2a', nodeDark: '#801608' },
    cave: { sky: ['#140c26', '#33285a'], ground: ['#6f6394', '#352a55'], path: '#b3a6e0', edge: '#463c64', node: '#2fc8f0', nodeDark: '#1a6a98' },
    sky: { sky: ['#4aa6ff', '#fff3e0'], ground: ['#ffffff', '#b9c9f2'], path: '#ffffff', edge: '#9fb2e8', node: '#ffc21f', nodeDark: '#c07a0a', rainbow: true },
    candy: { sky: ['#ff9fd0', '#fff0d8'], ground: ['#ffcfe8', '#e8a868'], path: '#ffffff', edge: '#ff4f8a', node: '#ff4f8a', nodeDark: '#a8204e', cane: true },
  };
  const GREY = { path: '#ddd6e6', edge: '#8a8298', node: '#b4acc2', nodeDark: '#6e6680' };
  const RAINBOW = ['#ff4f6a', '#ff9a3a', '#ffe14d', '#5fd44a', '#4fb8ff', '#8a6bff'];

  // ---------- Le dessin de la carte (calculé une fois) ----------
  let built = false;
  let MAP_W = 0;
  let main = []; // le chemin : un point tous les 6 pixels environ { x, y }
  let worlds = []; // { k, def, look, x0, x1, bx0, bx1, sign, castle }
  const nodes = {}; // une case par niveau (numéro dans LEVELS) : { i, x, y, s, spur }
  let back = []; // décorations derrière le chemin, puis devant (triées de loin à près)
  let front = [];
  let marks = []; // petits détails à plat sur le sol (herbe, cailloux, vermicelles…)
  let home = null; // la maison de Malice, au tout début
  let cake = null; // le gâteau de la famille oiseau, tout au bout
  let seqX = Infinity; // là où commence le retour à la maison
  let fogX = Infinity; // là où commencent ses nuages : un peu après la dernière case d'avant, pour qu'on les voie

  // Catmull-Rom : une courbe toute douce qui passe par tous les points.
  function smooth(pts, step) {
    const out = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const p0 = pts[Math.max(0, k - 1)];
      const p1 = pts[k];
      const p2 = pts[k + 1];
      const p3 = pts[Math.min(pts.length - 1, k + 2)];
      p1.s = out.length;
      const n = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
      for (let j = 0; j < n; j++) {
        const t = j / n;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
        out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
      }
    }
    const last = pts[pts.length - 1];
    last.s = out.length;
    out.push({ x: last.x, y: last.y });
    return out;
  }

  function build() {
    built = true;
    const anchors = [];
    const add = (x, y, tag) => anchors.push(Object.assign({ x, y }, tag));
    add(140, 410, { home: true });
    let x = 290;
    WORLDS.forEach((def, k) => {
      const wl = WORLD_LEVELS[k];
      // seul le dernier niveau d'un monde peut avoir un boss (un "boss" ailleurs : une case normale)
      const last = wl.levels[wl.levels.length - 1];
      const boss = last !== undefined && LEVELS[last].boss ? last : -1;
      const plain = wl.levels.filter((i) => i !== boss);
      const width = Math.max(800, 170 + plain.length * SLOT + 430);
      const W = { k, def, look: LOOK[def.theme] || LOOK.meadow, x0: x, x1: x + width, bx0: x, bx1: x + width };
      worlds.push(W);
      if (def.sequel && seqX === Infinity) seqX = x;
      add(x + 60, 392 + (hash(k * 3.1) - 0.5) * 40, { sign: W });
      // les cases des niveaux, puis la place du château (la case du boss, quand il y en a un)
      const cx = W.x1 - 330;
      let px = x + 190;
      plain.forEach((i) => {
        add(px, 330 + hash(i * 7.31 + k * 1.7) * 100, { node: i });
        px += SLOT;
      });
      add(cx, 372, boss >= 0 ? { node: boss, castle: W } : { castle: W });
      if (wl.stage >= 0) add(cx + 150, 352 + hash(k * 5.7) * 60, { stage: wl.stage });
      x = W.x1;
    });
    add(x + 130, 400, { end: true });
    MAP_W = x + 520;
    worlds[0].bx0 = 0;
    worlds[worlds.length - 1].bx1 = MAP_W;

    // un point au milieu de chaque grand bout de chemin, pour qu'il fasse des virages
    const pts = [];
    anchors.forEach((a, n) => {
      const b = anchors[n + 1];
      pts.push(a);
      if (b && b.x - a.x > 140) {
        const side = hash(a.x * 0.013) < 0.5 ? -1 : 1;
        const y = clamp((a.y + b.y) / 2 + side * (24 + hash(a.x * 0.07) * 26), HORIZON + 90, 462);
        pts.push({ x: (a.x + b.x) / 2, y });
      }
    });
    main = smooth(pts, 6);

    anchors.forEach((a) => {
      const p = main[a.s];
      if (a.home) home = { x: p.x - 40, y: p.y - 6 };
      if (a.end) cake = { x: p.x + 150, y: p.y + 4 };
      if (a.sign) a.sign.sign = { x: p.x, y: p.y - 30 };
      if (a.castle) a.castle.castle = { x: p.x, y: p.y, s: a.s, node: a.node };
      if (a.node !== undefined) nodes[a.node] = { i: a.node, x: p.x, y: p.y, s: a.s, spur: null };
      if (a.stage !== undefined) {
        // la petite branche du stage : vers le bas s'il y a de la place, sinon vers le haut
        const dy = p.y < 392 ? 88 : -88;
        const S = { x: p.x + 74, y: p.y + dy };
        const spur = [];
        for (let j = 0; j <= 18; j++) {
          const t = j / 18;
          const cx = p.x + 64;
          const cy = p.y + dy * 0.1;
          spur.push({ x: lerp(lerp(p.x, cx, t), lerp(cx, S.x, t), t), y: lerp(lerp(p.y, cy, t), lerp(cy, S.y, t), t) });
        }
        nodes[a.stage] = { i: a.stage, x: S.x, y: S.y, s: a.s, spur };
      }
    });
    if (SEQUEL_START !== undefined) {
      const before = ORDER.slice(0, ORDER_POS[SEQUEL_START]).map((i) => nodes[i].x);
      fogX = Math.min(seqX - 150, Math.max(0, ...before) + 200);
    }
    placeDecor();
  }

  // ---------- Les décorations, posées au hasard (mais toujours au même endroit) ----------
  // h : la hauteur (pour ne pas cacher le chemin), et les décorations de chaque monde.
  const HEIGHT = {
    flowers: 24, tree: 92, bush: 28, bigtree: 120, mushroom: 24, fern: 26, bramble: 30,
    lollipop: 44, cream: 20, chocorock: 22, rock: 26, pine: 70, grass: 18,
    lavapool: 6, ember: 30, crystals: 38, shroom: 22, stalagmite: 56,
    puff: 22, starflower: 28, island: 70, cane: 44, gumball: 20, cone: 50, gummy: 34,
  };
  const KINDS = {
    meadow: ['flowers', 'flowers', 'tree', 'bush', 'flowers', 'tree'],
    forest: ['bigtree', 'mushroom', 'fern', 'bigtree', 'bramble', 'fern'],
    storm: ['lollipop', 'cream', 'chocorock', 'cream', 'lollipop'],
    mountain: ['rock', 'pine', 'grass', 'pine', 'rock'],
    volcano: ['rock', 'lavapool', 'ember', 'rock', 'lavapool'],
    cave: ['crystals', 'shroom', 'stalagmite', 'crystals', 'shroom'],
    sky: ['puff', 'starflower', 'puff', 'island', 'starflower'],
    candy: ['lollipop', 'cane', 'gumball', 'cone', 'gummy', 'gumball'],
  };

  // Le point du chemin (ou d'une branche) le plus proche.
  function nearest(x, y) {
    let best = Infinity;
    let py = 0;
    const test = (p) => {
      if (Math.abs(p.x - x) > 160) return;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < best) { best = d; py = p.y; }
    };
    main.forEach(test);
    Object.values(nodes).forEach((n) => { if (n.spur) n.spur.forEach(test); });
    return { d: best, py };
  }

  function nearSpot(x, y, r) {
    const spots = Object.values(nodes).concat(worlds.map((W) => W.castle), worlds.map((W) => W.sign), [home, cake]);
    return spots.some((p) => p && Math.abs(p.x - x) < r && Math.abs(p.y - y) < r * 0.8);
  }

  function placeDecor() {
    back = [];
    front = [];
    marks = [];
    worlds.forEach((W) => {
      const kinds = KINDS[W.def.theme] || KINDS.meadow;
      for (let gx = W.x0 + 24; gx < W.x1 - 24; gx += 26) {
        const r = hash(gx * 0.137 + W.k * 9.1);
        const x = gx + (hash(gx * 0.71) - 0.5) * 24;
        const y = HORIZON + 24 + hash(gx * 0.311 + W.k) * (VIEW_H - HORIZON - 30);
        // des petits détails partout sur le sol
        marks.push({ theme: W.def.theme, x: x + 12, y: HORIZON + 14 + hash(gx * 0.53) * (VIEW_H - HORIZON - 14), v: r });
        if (r < 0.2) continue;
        const s = 0.6 + 0.7 * (y - HORIZON) / (VIEW_H - HORIZON);
        const type = kinds[Math.floor(hash(gx * 0.917 + 3) * kinds.length)];
        const h = HEIGHT[type] * s;
        const near = nearest(x, y);
        if (near.d < 30 + 14 * s) continue;
        if (nearSpot(x, y, 70 + h * 0.4)) continue;
        // la place du château (même vide : un jour, il y aura un château)
        if (Math.abs(x - W.castle.x) < 100 && y > W.castle.y - 180 && y < W.castle.y + 40) continue;
        if (Math.abs(x - W.sign.x) < 54 && y > W.sign.y - 110 && y < W.sign.y + 30) continue;
        // devant le chemin, il ne faut pas le cacher
        const isFront = y > near.py;
        if (isFront && y - h < near.py + 22) continue;
        // pas sous les boutons du bas de l'écran
        if (y > VIEW_H - 50 && h > 30) continue;
        (isFront ? front : back).push({ theme: W.def.theme, type, x, y, s, v: hash(gx * 1.37 + 0.5) });
      }
    });
    back.sort((a, b) => a.y - b.y);
    front.sort((a, b) => a.y - b.y);
  }

  // ---------- Où en est Malice ----------
  let seq = []; // les cases qu'on peut voir dans l'ordre du chemin (sans les stages pour les autres personnages)
  let at = 0; // la case où est Malice
  let walk = null; // le trajet en cours { pts, len, total, d, to }
  let facing = 1;
  let mx = 0;
  let my = 0;
  let cam = 0;
  let limit = 0; // jusqu'où les cases sont ouvertes (position dans ORDER)
  let anim = null; // le retour d'un niveau réussi : la case s'ouvre, puis Malice y va
  let fog = 0; // les nuages qui cachent le retour à la maison
  let msg = null; // une petite phrase sous le bandeau { text, t }
  let bumpT = 0;
  let bumpNode = -1;
  let pops = []; // les étincelles quand une case s'ouvre
  let touchDir = 0;
  let touchNew = false;
  let enterKey = false;
  let readyT = 0;

  const pos = (i) => ORDER_POS[i];
  const isOpen = (i) => pos(i) <= limit;

  function open(o) {
    if (!built) build();
    seq = Game.visibleOrder();
    const reach = Game.reachPos();
    let frontier = seq[0];
    seq.forEach((i) => { if (pos(i) <= reach) frontier = i; });
    walk = null;
    anim = null;
    msg = null;
    pops = [];
    touchDir = 0;
    enterKey = false;
    readyT = 0.25;
    limit = reach;
    at = frontier;
    if (o.from !== undefined && seq.includes(o.to)) {
      if (seq.includes(o.from)) at = o.from;
      anim = { to: o.to, fresh: !!o.fresh, t: 0, r: 0, route: route(at, o.to), popped: !o.fresh };
      // le bébé oiseau vient d'être sauvé : les nuages du retour à la maison s'en vont d'abord
      anim.clouds = !!o.clouds;
      if (anim.fresh) limit = pos(o.to) - 1;
    } else if (o.at !== undefined && seq.includes(o.at) && pos(o.at) <= reach) {
      at = o.at;
    }
    fog = SEQUEL_START !== undefined && (!Game.save.rescued || anim && anim.clouds) ? 1 : 0;
    const n = nodes[at];
    mx = n.x;
    my = n.y;
    facing = 1;
    cam = camFor(mx);
  }

  function camFor(x) {
    return clamp(x - VIEW_W / 2, 0, MAP_W - VIEW_W);
  }

  // Le trajet d'une case à une autre : on quitte sa branche, on suit le chemin, on prend l'autre branche.
  function route(a, b) {
    const A = nodes[a];
    const B = nodes[b];
    const pts = [];
    if (A.spur) for (let k = A.spur.length - 1; k > 0; k--) pts.push(A.spur[k]);
    const d = B.s >= A.s ? 1 : -1;
    for (let s = A.s; s !== B.s + d; s += d) pts.push(main[s]);
    if (B.spur) for (let k = 1; k < B.spur.length; k++) pts.push(B.spur[k]);
    const len = [0];
    for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
    const total = len[len.length - 1];
    return { pts, len, total, to: b, d: 0, speed: clamp(total / 1.4, SPEED, SPEED * 1.9) };
  }

  function pointAt(r, d) {
    d = clamp(d, 0, r.total);
    let k = 1;
    while (k < r.len.length - 1 && r.len[k] < d) k++;
    const a = r.pts[k - 1];
    const b = r.pts[k] || a;
    const seg = r.len[k] - r.len[k - 1] || 1;
    const f = clamp((d - r.len[k - 1]) / seg, 0, 1);
    return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), k, dx: b.x - a.x };
  }

  function startWalk(to) {
    walk = route(at, to);
    Sound.sfx.select();
  }

  // Essayer d'aller sur la case d'à côté (dir : -1 à gauche, 1 à droite).
  function step(dir, isNew) {
    const k = seq.indexOf(at) + dir;
    if (k < 0 || k >= seq.length) return;
    const to = seq[k];
    if (isOpen(to)) startWalk(to);
    else if (isNew) bump(to);
  }

  // Une case pas encore ouverte : Malice sursaute, la case tremble.
  function bump(i) {
    bumpT = 0.45;
    bumpNode = i;
    Sound.sfx.bump();
    msg = { text: 'Pas encore ! Finis d\'abord les cases d\'avant.', t: 2.2 };
  }

  function launch() {
    if (walk || anim || readyT > 0) return;
    Game.playLevel(at);
  }

  function update(dt) {
    readyT = Math.max(0, readyT - dt);
    bumpT = Math.max(0, bumpT - dt);
    if (msg && (msg.t -= dt) <= 0) msg = null;
    pops = pops.filter((p) => (p.life -= dt) > 0);
    pops.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
    });
    if (anim) updateAnim(dt);
    else handleInput();
    // Malice marche
    if (walk) {
      walk.d += walk.speed * dt;
      const p = pointAt(walk, walk.d);
      if (Math.abs(p.dx) > 0.3) facing = p.dx > 0 ? 1 : -1;
      mx = p.x;
      my = p.y;
      if (walk.d >= walk.total) {
        at = walk.to;
        walk = null;
        if (anim && anim.popped) anim = null;
      }
    }
    // la caméra suit Malice (et, quand une case s'ouvre, le bout du chemin qui se dessine)
    let target = mx;
    if (anim && !anim.popped) target = (mx + pointAt(anim.route, anim.r).x) / 2;
    cam += (camFor(target) - cam) * Math.min(1, dt * 4);
    touchNew = false;
    enterKey = false;
  }

  function updateAnim(dt) {
    const a = anim;
    a.t += dt;
    if (a.clouds && fog > 0) {
      // les nuages du retour à la maison s'envolent
      if (a.t > 0.5) fog = Math.max(0, fog - dt / 1.4);
      return;
    }
    if (!a.popped) {
      // le chemin se dessine jusqu'à la nouvelle case, un peu devant Malice
      a.r = Math.min(a.route.total, a.r + a.route.speed * 1.7 * dt);
      if (a.r >= a.route.total) {
        a.popped = true;
        limit = Game.reachPos();
        Sound.sfx.checkpoint();
        const n = nodes[a.to];
        for (let k = 0; k < 18; k++) {
          const ang = (k / 18) * TAU;
          pops.push({ x: n.x, y: n.y - 6, vx: Math.cos(ang) * rand(90, 170), vy: Math.sin(ang) * rand(90, 170) - 80, life: rand(0.6, 1), c: RAINBOW[k % 6] });
        }
        a.popT = 0;
      }
    } else if (a.popT !== undefined) {
      a.popT += dt;
    }
    if (!walk && at !== a.to && a.t > (a.fresh ? 0.45 : 0.35)) walk = route(at, a.to);
    if (!walk && at === a.to && a.popped) anim = null;
  }

  function handleInput() {
    const P = Input.pressed;
    const H = Input.held;
    // le bouton Start de la manette (ou Échap) : retour à l'écran titre
    if (P.pause && readyT <= 0) {
      Game.toTitle();
      return;
    }
    if (walk) return;
    if (P.jump || enterKey) {
      launch();
      return;
    }
    const right = H.right || touchDir > 0;
    const left = H.left || touchDir < 0;
    const dir = right && !left ? 1 : left && !right ? -1 : 0;
    if (dir) step(dir, P.right || P.left || touchNew);
  }

  // ---------- Toucher (ou cliquer sur) la carte ----------
  const PILL = { w: 170, h: 44 };
  let pill = null; // le bouton « ▶ Jouer » dessiné sous le bandeau

  // Le bouton « ▶ Jouer », une case (pour y aller, ou la lancer si Malice y est déjà),
  // sinon la moitié gauche ou droite de l'écran : on marche de ce côté tant que le doigt reste posé.
  function handleTap(p) {
    if (anim || readyT > 0) return;
    if (pill && Math.abs(p.sx - pill.x) < pill.w / 2 + 8 && Math.abs(p.y - pill.y) < pill.h / 2 + 8) {
      launch();
      return;
    }
    const n = hitNode(p.x, p.y);
    if (n !== null) {
      if (walk) return;
      if (n === at) launch();
      else if (isOpen(n)) startWalk(n);
      else bump(n);
      return;
    }
    touchDir = p.sx < VIEW_W / 2 ? -1 : 1;
    touchNew = true;
  }

  function hitNode(x, y) {
    let best = null;
    let bd = Infinity;
    for (const i of seq) {
      const n = nodes[i];
      const dx = (x - n.x) / 46;
      const dy = (y - n.y) / 36;
      let d = dx * dx + dy * dy;
      // Malice elle-même compte aussi pour sa case
      if (i === at && Math.abs(x - n.x) < 30 && y > n.y - 86 && y < n.y) d = Math.min(d, 0.5);
      if (d < 1 && d < bd) { bd = d; best = i; }
    }
    return best;
  }

  function bind() {
    const cv = document.getElementById('game');
    const toMap = (e) => {
      const r = cv.getBoundingClientRect();
      const sx = ((e.clientX - r.left) / r.width) * VIEW_W;
      return { sx, x: sx + cam, y: ((e.clientY - r.top) / r.height) * VIEW_H };
    };
    cv.addEventListener('pointerdown', (e) => {
      if (Game.state !== 'map') return;
      e.preventDefault();
      Sound.unlock();
      handleTap(toMap(e));
    });
    const up = () => { touchDir = 0; };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', (e) => {
      // (sauf si un bouton a le focus : Entrée appuie alors sur ce bouton)
      if (Game.state === 'map' && e.key === 'Enter' && !(e.target.closest && e.target.closest('button'))) {
        e.preventDefault();
        enterKey = true;
      }
    });
  }
  window.addEventListener('load', bind);

  // ---------- Dessin ----------
  function render(ctx) {
    const t = Game.t;
    const L = cam - 60;
    const R = cam + VIEW_W + 60;
    ctx.save();
    ctx.translate(-cam, 0);
    drawSkyAndGround(ctx, L, R, t);
    for (const W of worlds) {
      if (W.x1 + 120 < L || W.x0 - 120 > R) continue;
      FAR[W.def.theme](ctx, W, t, L, R);
    }
    drawGroundTop(ctx, L, R, t);
    for (const m of marks) if (m.x > L && m.x < R) drawMark(ctx, m, t);
    if (home && home.x < R + 100) drawHome(ctx, home.x, home.y, t);
    for (const W of worlds) if (W.sign.x > L - 60 && W.sign.x < R + 60) drawSign(ctx, W, t);
    for (const d of back) if (d.x > L - 80 && d.x < R + 80) drawDecor(ctx, d, t);
    if (cake && cake.x - 200 < R) drawCake(ctx, cake.x, cake.y, t);
    drawPaths(ctx, L, R);
    for (const W of worlds) if (W.castle.x > L - 120 && W.castle.x < R + 120) drawCastleSpot(ctx, W, t);
    for (const d of front) if (d.x > L - 80 && d.x < R + 80) drawDecor(ctx, d, t);
    for (const i of seq) {
      const n = nodes[i];
      if (n.x > L - 60 && n.x < R + 60) drawNode(ctx, i, t);
    }
    drawMalice(ctx, t);
    for (const p of pops) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 6);
      Art.starShape(ctx, 6, 0.45);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    drawFog(ctx, L, R, t);
    ctx.restore();
    drawBanner(ctx, t);
    drawLives(ctx);
    drawHint(ctx);
  }

  // Le ciel et le sol de chaque monde, qui se fondent l'un dans l'autre entre deux mondes.
  function bandGradient(ctx, c, y0, y1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, c[0]);
    g.addColorStop(1, c[1]);
    return g;
  }

  function mix2(a, b, f) {
    return [Art.mixColor(a[0], b[0], f), Art.mixColor(a[1], b[1], f)];
  }

  function drawSkyAndGround(ctx, L, R) {
    worlds.forEach((W) => {
      const a = Math.max(W.bx0, L);
      const b = Math.min(W.bx1, R);
      if (a >= b) return;
      ctx.fillStyle = bandGradient(ctx, W.look.sky, 0, HORIZON + 30);
      ctx.fillRect(a, 0, b - a + 1, HORIZON + 40);
    });
    blendSlices(L, R, (W, N, sx, f) => {
      ctx.fillStyle = bandGradient(ctx, mix2(W.look.sky, N.look.sky, f), 0, HORIZON + 30);
      ctx.fillRect(sx, 0, 8.5, HORIZON + 40);
    });
  }

  // Entre deux mondes, de fines tranches où l'on passe tout doucement de l'un à l'autre (f : de 0 à 1).
  function blendSlices(L, R, fn) {
    worlds.forEach((W, k) => {
      const N = worlds[k + 1];
      if (!N || W.x1 - BLEND / 2 > R || W.x1 + BLEND / 2 < L) return;
      for (let sx = W.x1 - BLEND / 2; sx < W.x1 + BLEND / 2; sx += 8) {
        const f = (sx + 4 - (W.x1 - BLEND / 2)) / BLEND;
        fn(W, N, sx, f * f * (3 - 2 * f));
      }
    });
  }

  // Le haut du sol fait de petites vagues ; le sol va du clair (au loin) au foncé (tout près).
  const groundY = (x) => HORIZON + 5 * Math.sin(x * 0.011) + 3 * Math.sin(x * 0.031 + 1);

  function groundSlice(ctx, a, b, colors) {
    ctx.beginPath();
    ctx.moveTo(a, VIEW_H + 2);
    for (let x = a; x < b; x += 16) ctx.lineTo(x, groundY(x));
    ctx.lineTo(b, groundY(b));
    ctx.lineTo(b, VIEW_H + 2);
    ctx.closePath();
    ctx.fillStyle = bandGradient(ctx, colors, HORIZON - 6, VIEW_H);
    ctx.fill();
  }

  function drawGroundTop(ctx, L, R, t) {
    worlds.forEach((W) => {
      const a = Math.max(W.bx0, L);
      const b = Math.min(W.bx1, R);
      if (a < b) groundSlice(ctx, a, b + 1, W.look.ground);
    });
    blendSlices(L, R, (W, N, sx, f) => groundSlice(ctx, sx, sx + 8.5, mix2(W.look.ground, N.look.ground, f)));
    // le sol de nuages de la montagne : des gros nuages tout doux au bord
    worlds.forEach((W) => {
      if (W.def.theme !== 'sky') return;
      along(W, L, R, 60, 91, 40, (x, k, h) => {
        const r = (24 + h * 18) * edgeK(W, x, 120);
        ctx.fillStyle = '#dfe8ff';
        circlePath(ctx, x, HORIZON + 16, r);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        circlePath(ctx, x, HORIZON + 10, r);
        ctx.fill();
      });
    });
    // et les bords de la lave dans le volcan : une rivière tout au fond
    worlds.forEach((W) => {
      if (W.def.theme !== 'volcano') return;
      const a = Math.max(W.x0 + 60, L);
      const b = Math.min(W.x1 - 60, R);
      if (a >= b) return;
      ctx.beginPath();
      ctx.moveTo(a, HORIZON + 26);
      for (let x = a; x <= b; x += 12) ctx.lineTo(x, HORIZON + 14 + 4 * Math.sin(x * 0.03 + t * 2));
      ctx.lineTo(b, HORIZON + 30);
      ctx.lineTo(a, HORIZON + 30);
      ctx.closePath();
      const lg = ctx.createLinearGradient(0, HORIZON + 10, 0, HORIZON + 30);
      lg.addColorStop(0, '#ffe066');
      lg.addColorStop(0.5, '#ff7a1a');
      lg.addColorStop(1, 'rgba(160,30,10,0)');
      ctx.fillStyle = lg;
      ctx.fill();
    });
  }

  // ---------- Au loin, au-dessus de l'horizon ----------
  // Une rangée de collines qui s'aplatit aux deux bords du monde (pour passer tout doucement au suivant).
  function edgeK(W, x, m) {
    const k = clamp(Math.min(x - W.x0, W.x1 - x) / (m || 150), 0, 1);
    return k * k * (3 - 2 * k);
  }

  function hillY(W, x, base, amp, f, seed) {
    const w = 0.55 * Math.sin(x * f + seed) + 0.3 * Math.sin(x * f * 2.3 + seed * 1.7) + 0.15 * Math.sin(x * f * 5.1 + seed * 2.9);
    return base - amp * edgeK(W, x) * (0.65 + 0.35 * w);
  }

  function hills(ctx, W, L, R, base, amp, f, seed, color) {
    const a = Math.max(W.x0, L - 20);
    const b = Math.min(W.x1, R + 20);
    if (a >= b) return;
    ctx.beginPath();
    ctx.moveTo(a, HORIZON + 30);
    for (let x = a; x < b; x += 14) ctx.lineTo(x, hillY(W, x, base, amp, f, seed));
    ctx.lineTo(b, hillY(W, b, base, amp, f, seed));
    ctx.lineTo(b, HORIZON + 30);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Pour chaque élément qui se répète : x (dans le monde, loin des bords), son numéro et un hasard.
  function along(W, L, R, spacing, seed, margin, fn) {
    const m = margin === undefined ? 110 : margin;
    const k0 = Math.max(0, Math.floor((L - W.x0 - m - spacing) / spacing));
    for (let k = k0; ; k++) {
      const x = W.x0 + m + k * spacing + hash(k * 1.37 + seed) * spacing * 0.5;
      if (x > W.x1 - m || x > R + spacing) break;
      if (x > L - spacing) fn(x, k, hash(k * 2.71 + seed * 3.1));
    }
  }

  function sun(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.15);
    ctx.fillStyle = 'rgba(255,250,200,0.35)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-11, 92);
      ctx.lineTo(11, 92);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const g = ctx.createRadialGradient(x, y, 8, x, y, 44);
    g.addColorStop(0, '#fffde0');
    g.addColorStop(0.6, '#ffe45c');
    g.addColorStop(1, 'rgba(255,220,80,0)');
    ctx.fillStyle = g;
    circlePath(ctx, x, y, 44);
    ctx.fill();
  }

  function roundTree(ctx, x, y, h, leaf, leafDark) {
    ctx.fillStyle = '#8a5a32';
    roundRectPath(ctx, x - h * 0.06, y - h * 0.55, h * 0.12, h * 0.55, 3);
    ctx.fill();
    ctx.fillStyle = leafDark;
    circlePath(ctx, x, y - h * 0.68 + 4, h * 0.33);
    ctx.fill();
    ctx.fillStyle = leaf;
    circlePath(ctx, x, y - h * 0.7, h * 0.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    circlePath(ctx, x - h * 0.11, y - h * 0.8, h * 0.09);
    ctx.fill();
  }

  const FAR = {
    meadow(ctx, W, t, L, R) {
      sun(ctx, W.x0 + 640, 74, t);
      along(W, L, R, 300, 1, 60, (x, k, h) => {
        const dx = ((t * 7 + h * 200) % 300) - 150;
        Scenery.fluffyCloud(ctx, x + dx, 46 + h * 70, 0.7 + h * 0.4, '#ffffff', '#d6ecff');
      });
      hills(ctx, W, L, R, HORIZON + 6, 70, 0.008, 1.3, '#b4e89a');
      hills(ctx, W, L, R, HORIZON + 8, 40, 0.014, 4.1, '#8fd96a');
      along(W, L, R, 70, 3, 120, (x, k, h) => {
        if (h > 0.55) return;
        const y = hillY(W, x, HORIZON + 8, 40, 0.014, 4.1);
        roundTree(ctx, x, y + 6, 46 + h * 30, h < 0.25 ? '#ffb4d8' : '#4fcf5a', h < 0.25 ? '#e57fb0' : '#2fa34a');
      });
    },

    forest(ctx, W, t, L, R) {
      // rayons de lumière
      ctx.save();
      ctx.fillStyle = 'rgba(255,251,208,0.16)';
      along(W, L, R, 230, 5, 140, (x) => {
        ctx.beginPath();
        ctx.moveTo(x, -10);
        ctx.lineTo(x + 50, -10);
        ctx.lineTo(x + 180, HORIZON + 20);
        ctx.lineTo(x + 100, HORIZON + 20);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
      // deux rangées de grands arbres tout ronds
      const rows = [[0.62, '#7cbf8e', '#6aae7e', 40], [1, '#3f8f5a', '#2f7a4a', 4]];
      rows.forEach(([k, c1, c2, dy], r) => {
        along(W, L, R, 58 + r * 16, 11 + r, 80, (x, i, h) => {
          const e = edgeK(W, x, 200);
          const top = HORIZON + dy - (90 + h * 70) * k * e;
          ctx.fillStyle = c2;
          ctx.fillRect(x - 6, top, 12, HORIZON + 30 - top);
          ctx.fillStyle = c1;
          circlePath(ctx, x, top, (34 + h * 18) * (0.5 + 0.5 * e));
          ctx.fill();
          circlePath(ctx, x - 22, top + 18, (24 + h * 10) * (0.5 + 0.5 * e));
          ctx.fill();
        });
      });
      // lucioles
      along(W, L, R, 47, 13, 60, (x, k, h) => {
        const a = 0.35 + 0.4 * Math.sin(t * 3 + k);
        ctx.fillStyle = `rgba(255,255,170,${a})`;
        circlePath(ctx, x + Math.sin(t * 0.6 + k) * 16, 60 + h * 150 + Math.sin(t + k * 2) * 10, 2.4);
        ctx.fill();
      });
    },

    storm(ctx, W, t, L, R) {
      // collines en chocolat avec de la crème
      hills(ctx, W, L, R, HORIZON + 6, 64, 0.009, 2.1, '#7a4428');
      ctx.save();
      ctx.strokeStyle = '#fff2f8';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const a = Math.max(W.x0 + 40, L);
      const b = Math.min(W.x1 - 40, R);
      for (let x = a; x < b; x += 14) {
        const y = hillY(W, x, HORIZON + 6, 64, 0.009, 2.1) + 4 + Math.sin(x * 0.05) * 2;
        if (x === a) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      // gros nuages d'orage, et les éclairs au chocolat qui en tombent
      along(W, L, R, 210, 23, 90, (x, k, h) => {
        const y = 52 + h * 50;
        const flash = (t * 0.5 + h * 7) % 1 < 0.06;
        Scenery.fluffyCloud(ctx, x, y, 1.1 + h * 0.4, flash ? '#d8c8ff' : '#8a74b8', '#5a4a88');
        const ph = (t * 0.45 + h) % 1;
        Art.eclair(ctx, x + 10 + Math.sin(k) * 20, y + 30 + ph * (HORIZON - y - 20), 0.8 + ph * 3, 0.9);
      });
    },

    mountain(ctx, W, t, L, R) {
      hills(ctx, W, L, R, HORIZON + 6, 120, 0.006, 0.4, '#c98a86');
      // le grand volcan, tout près maintenant
      const vx = W.x1 - 260;
      const vy = HORIZON + 10;
      if (vx - 360 < R && vx + 360 > L) {
        for (let i = 0; i < 6; i++) {
          const ph = (t * 0.12 + i / 6) % 1;
          ctx.fillStyle = `rgba(110,80,90,${0.45 * (1 - ph)})`;
          circlePath(ctx, vx + Math.sin(i * 2 + t * 0.3) * 24 + ph * 70, vy - 205 - ph * 150, 24 + ph * 40);
          ctx.fill();
        }
        ctx.fillStyle = '#8a4a5a';
        ctx.beginPath();
        ctx.moveTo(vx - 330, vy);
        ctx.lineTo(vx - 60, vy - 200);
        ctx.quadraticCurveTo(vx, vy - 210, vx + 60, vy - 200);
        ctx.lineTo(vx + 330, vy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff6a2a';
        ctx.beginPath();
        ctx.moveTo(vx - 60, vy - 200);
        ctx.quadraticCurveTo(vx - 40, vy - 150, vx - 22, vy - 128);
        ctx.lineTo(vx - 10, vy - 196);
        ctx.closePath();
        ctx.fill();
        const cg = ctx.createRadialGradient(vx, vy - 205, 5, vx, vy - 205, 90);
        cg.addColorStop(0, 'rgba(255,170,60,0.8)');
        cg.addColorStop(1, 'rgba(255,120,60,0)');
        ctx.fillStyle = cg;
        circlePath(ctx, vx, vy - 205, 90);
        ctx.fill();
      }
      hills(ctx, W, L, R, HORIZON + 8, 42, 0.013, 2.4, '#a8706e');
    },

    volcano(ctx, W, t, L, R) {
      // les parois du volcan, avec des cascades de lave
      along(W, L, R, 150, 41, 70, (x, k, h) => {
        const e = edgeK(W, x, 160);
        const top = HORIZON - (90 + h * 110) * e;
        ctx.fillStyle = '#2e1214';
        ctx.beginPath();
        ctx.moveTo(x - 90, HORIZON + 20);
        ctx.lineTo(x - 50, top + 20);
        ctx.lineTo(x + 10, top);
        ctx.lineTo(x + 60, top + 30);
        ctx.lineTo(x + 100, HORIZON + 20);
        ctx.closePath();
        ctx.fill();
        if (h < 0.5) {
          const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
          g.addColorStop(0, 'rgba(255,120,30,0)');
          g.addColorStop(0.5, 'rgba(255,170,50,0.85)');
          g.addColorStop(1, 'rgba(255,120,30,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - 8, top + 10, 16, HORIZON - top);
          ctx.fillStyle = 'rgba(255,240,150,0.7)';
          const yy = top + 10 + ((t * 70 + h * 100) % (HORIZON - top));
          ctx.fillRect(x - 2, yy, 4, 14);
        }
      });
      // le bébé oiseau sur son rocher, tout au bout (tant qu'on ne l'a pas sauvé)
      const bx = Math.min(W.x1 - 270, fogX - 90);
      if (bx > L - 80 && bx < R + 80) {
        ctx.fillStyle = '#3a1a1e';
        ctx.beginPath();
        ctx.moveTo(bx - 40, HORIZON + 20);
        ctx.lineTo(bx - 22, HORIZON - 70);
        ctx.lineTo(bx + 24, HORIZON - 74);
        ctx.lineTo(bx + 42, HORIZON + 20);
        ctx.closePath();
        ctx.fill();
        if (!Game.save.rescued) Art.babyBird(ctx, bx, HORIZON - 72, t, { chirp: Math.floor(t * 3) % 2 === 0 });
        else Art.birdNest(ctx, bx, HORIZON - 70, 46);
      }
      // braises qui montent
      along(W, L, R, 23, 47, 40, (x, k, h) => {
        const y = HORIZON + 10 - ((t * (30 + h * 40) + h * 400) % (HORIZON + 10));
        ctx.fillStyle = `rgba(255,${150 + (k % 3) * 40},60,${0.4 + 0.4 * Math.sin(t * 5 + k)})`;
        circlePath(ctx, x + Math.sin(t + k) * 10, y, 1.5 + (k % 3));
        ctx.fill();
      });
    },

    cave(ctx, W, t, L, R) {
      // la paroi du fond, avec des grappes de cristaux qui brillent
      hills(ctx, W, L, R, HORIZON + 8, 110, 0.01, 0.8, '#2c2148');
      along(W, L, R, 170, 51, 120, (x, k, h) => {
        const cols = ['127,240,255', '255,159,216', '201,166,255', '255,230,128'];
        const col = cols[k & 3];
        const a = 0.45 + 0.25 * Math.sin(t * 1.5 + k * 2);
        const gy = HORIZON - 30 - h * 50;
        const gl = ctx.createRadialGradient(x, gy, 2, x, gy, 50);
        gl.addColorStop(0, `rgba(${col},${a * 0.5})`);
        gl.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gl;
        circlePath(ctx, x, gy, 50);
        ctx.fill();
        ctx.fillStyle = `rgba(${col},${a + 0.25})`;
        for (let j = -1; j <= 1; j++) {
          const ch = 24 - Math.abs(j) * 8;
          ctx.beginPath();
          ctx.moveTo(x + j * 9 - 5, gy + 10);
          ctx.lineTo(x + j * 11, gy + 10 - ch);
          ctx.lineTo(x + j * 9 + 5, gy + 10);
          ctx.closePath();
          ctx.fill();
        }
      });
      // le plafond de la grotte et ses stalactites (plus fin à l'entrée et à la sortie)
      const a = Math.max(W.x0 - 40, L);
      const b = Math.min(W.x1 + 40, R);
      if (a < b) {
        ctx.fillStyle = '#3a2d5a';
        ctx.beginPath();
        ctx.moveTo(a, -2);
        for (let x = a; x <= b; x += 12) {
          const e = clamp(Math.min(x - W.x0 + 40, W.x1 + 40 - x) / 220, 0, 1);
          ctx.lineTo(x, 8 + e * (34 + 10 * Math.sin(x * 0.03)));
        }
        ctx.lineTo(b, -2);
        ctx.closePath();
        ctx.fill();
      }
      along(W, L, R, 64, 53, 90, (x, k, h) => {
        const e = edgeK(W, x, 220);
        const len = (40 + h * 70) * e;
        ctx.fillStyle = '#3a2d5a';
        ctx.beginPath();
        ctx.moveTo(x - 16, 30);
        ctx.quadraticCurveTo(x - 4, 30 + len * 0.5, x, 30 + len);
        ctx.quadraticCurveTo(x + 4, 30 + len * 0.5, x + 16, 30);
        ctx.closePath();
        ctx.fill();
        if (h < 0.4) {
          const g = 0.5 + 0.4 * Math.sin(t * 2.3 + k);
          ctx.fillStyle = `rgba(150,240,255,${g})`;
          circlePath(ctx, x, 34 + len + 8 + Math.sin(t + k) * 2, 2.6);
          ctx.fill();
        }
      });
    },

    sky(ctx, W, t, L, R) {
      sun(ctx, W.x0 + 220, 70, t * 0.5);
      // grand arc-en-ciel très loin
      const rx = W.x0 + W.x1 - W.x0 - 420;
      if (rx - 360 < R && rx + 360 > L) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 11;
        RAINBOW.forEach((c, i) => {
          ctx.strokeStyle = c;
          ctx.beginPath();
          ctx.arc(rx, HORIZON + 20, 250 - i * 11, Math.PI, 0);
          ctx.stroke();
        });
        ctx.restore();
      }
      // sommets enneigés qui dépassent des nuages
      along(W, L, R, 250, 71, 150, (x, k, h) => {
        const mh = (120 + h * 80) * edgeK(W, x, 200);
        const by = HORIZON + 10;
        ctx.fillStyle = '#8ea2d8';
        ctx.beginPath();
        ctx.moveTo(x - mh * 0.85, by);
        ctx.lineTo(x - 10, by - mh);
        ctx.quadraticCurveTo(x, by - mh - 6, x + 10, by - mh);
        ctx.lineTo(x + mh * 0.85, by);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - mh * 0.27, by - mh * 0.68);
        ctx.lineTo(x - 10, by - mh);
        ctx.quadraticCurveTo(x, by - mh - 6, x + 10, by - mh);
        ctx.lineTo(x + mh * 0.27, by - mh * 0.68);
        ctx.quadraticCurveTo(x, by - mh * 0.6, x - mh * 0.27, by - mh * 0.68);
        ctx.fill();
      });
      along(W, L, R, 280, 75, 60, (x, k, h) => {
        const dx = ((t * 9 + h * 200) % 280) - 140;
        Scenery.fluffyCloud(ctx, x + dx, 50 + h * 90, 0.7 + h * 0.5, '#ffffff', '#d8e6ff');
      });
    },

    candy(ctx, W, t, L, R) {
      along(W, L, R, 260, 81, 60, (x, k, h) => {
        const dx = ((t * 6 + h * 200) % 260) - 130;
        Scenery.fluffyCloud(ctx, x + dx, 50 + h * 70, 0.8 + h * 0.4, h < 0.5 ? '#ffe0f2' : '#dcefff', h < 0.5 ? '#ffb8dd' : '#b8dcff');
      });
      // montagnes de boules de gomme
      const gum = ['#ff6fa8', '#7fd3ff', '#ffd84a', '#8ee07a', '#c49bff'];
      along(W, L, R, 110, 83, 100, (x, k, h) => {
        const r = (50 + h * 50) * edgeK(W, x, 180);
        const by = HORIZON + 12;
        ctx.fillStyle = gum[k % gum.length];
        ctx.beginPath();
        ctx.ellipse(x, by, r, r * 1.1, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ellipsePath(ctx, x - r * 0.35, by - r * 0.7, r * 0.18, r * 0.1, -0.5);
        ctx.fill();
      });
      // sucettes géantes
      along(W, L, R, 230, 85, 140, (x, k, h) => {
        const hh = 110 + h * 50;
        const by = HORIZON + 6;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 3, by - hh, 6, hh);
        const r = 26 + h * 10;
        ctx.fillStyle = gum[(k + 2) % gum.length];
        circlePath(ctx, x, by - hh, r);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let a = 0; a < TAU * 2.2; a += 0.25) {
          const rr = (a / (TAU * 2.2)) * r * 0.85;
          const px = x + Math.cos(a + t * 0.6) * rr;
          const py = by - hh + Math.sin(a + t * 0.6) * rr;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });
    },
  };

  // ---------- Sur le sol ----------
  function drawMark(ctx, m, t) {
    const { x, y, v } = m;
    switch (m.theme) {
      case 'meadow':
      case 'forest':
        ctx.strokeStyle = m.theme === 'meadow' ? 'rgba(40,130,40,0.35)' : 'rgba(10,60,30,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = -1; k <= 1; k++) {
          ctx.moveTo(x + k * 4, y);
          ctx.lineTo(x + k * 6, y - 7 + Math.abs(k) * 2);
        }
        ctx.stroke();
        break;
      case 'storm':
        ctx.fillStyle = v < 0.5 ? 'rgba(122,68,40,0.3)' : 'rgba(255,255,255,0.5)';
        ellipsePath(ctx, x, y, 7, 3);
        ctx.fill();
        break;
      case 'mountain':
      case 'cave':
        ctx.fillStyle = m.theme === 'cave' ? 'rgba(20,10,40,0.3)' : 'rgba(90,60,50,0.3)';
        ellipsePath(ctx, x, y, 4 + v * 4, 2.5 + v * 2);
        ctx.fill();
        break;
      case 'volcano': {
        const a = 0.3 + 0.3 * Math.sin(t * 2 + v * 20);
        ctx.strokeStyle = `rgba(255,110,30,${a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x - 2, y - 2);
        ctx.lineTo(x + 3, y + 1);
        ctx.lineTo(x + 9, y - 1);
        ctx.stroke();
        break;
      }
      case 'sky':
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        circlePath(ctx, x, y, 5 + v * 5);
        ctx.fill();
        break;
      case 'candy': {
        // des vermicelles de toutes les couleurs
        ctx.strokeStyle = ['#ff4f8a', '#4fb8ff', '#ffd21f', '#5fd44a', '#ffffff', '#b06bff'][Math.floor(v * 6)];
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        const a = v * 9;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * 4, y - Math.sin(a) * 2);
        ctx.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 2);
        ctx.stroke();
        ctx.lineCap = 'butt';
        break;
      }
      default: break;
    }
  }

  function shadow(ctx, x, y, rx) {
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ellipsePath(ctx, x, y, rx, rx * 0.3);
    ctx.fill();
  }

  function drawDecor(ctx, d, t) {
    const { x, y, s, v } = d;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const sway = Math.sin(t * 2 + v * 10) * 0.1;
    switch (d.type) {
      case 'flowers': {
        const cols = ['#ff5fa8', '#ffd21f', '#ffffff', '#b06bff', '#ff8a3a'];
        for (let k = -1; k <= 1; k++) {
          ctx.save();
          ctx.translate(k * 9, Math.abs(k) * 2);
          ctx.rotate(sway + k * 0.15);
          ctx.strokeStyle = '#2f9a3a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -15);
          ctx.stroke();
          ctx.fillStyle = cols[Math.floor(v * 5 + k + 1) % 5];
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU;
            circlePath(ctx, Math.cos(a) * 4.5, -17 + Math.sin(a) * 4.5, 3.6);
            ctx.fill();
          }
          ctx.fillStyle = '#ffb000';
          circlePath(ctx, 0, -17, 2.6);
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'tree':
        shadow(ctx, 0, 0, 26);
        roundTree(ctx, 0, 0, 92, v < 0.4 ? '#ffb4d8' : '#5fd45a', v < 0.4 ? '#e57fb0' : '#2fa34a');
        break;
      case 'bush':
        shadow(ctx, 0, 0, 22);
        ctx.fillStyle = '#2fa34a';
        circlePath(ctx, -10, -8, 12);
        ctx.fill();
        circlePath(ctx, 10, -8, 12);
        ctx.fill();
        ctx.fillStyle = '#4fcf5a';
        circlePath(ctx, 0, -14, 14);
        ctx.fill();
        ctx.fillStyle = v < 0.5 ? '#ff5f8a' : '#ffffff';
        for (let k = 0; k < 4; k++) {
          circlePath(ctx, -10 + k * 7, -12 - (k % 2) * 8, 2.2);
          ctx.fill();
        }
        break;
      case 'bigtree':
        shadow(ctx, 0, 0, 30);
        ctx.fillStyle = '#6a4424';
        roundRectPath(ctx, -8, -70, 16, 70, 5);
        ctx.fill();
        ctx.fillStyle = '#1f7a3e';
        circlePath(ctx, -22, -78, 28);
        ctx.fill();
        circlePath(ctx, 22, -80, 28);
        ctx.fill();
        ctx.fillStyle = '#3fa85a';
        circlePath(ctx, 0, -98, 30);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        circlePath(ctx, -10, -108, 10);
        ctx.fill();
        break;
      case 'mushroom':
        ctx.fillStyle = '#fff3e0';
        roundRectPath(ctx, -4, -14, 8, 14, 3);
        ctx.fill();
        ctx.fillStyle = '#e8402f';
        ctx.beginPath();
        ctx.ellipse(0, -14, 13, 10, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        circlePath(ctx, -5, -18, 2.4);
        ctx.fill();
        circlePath(ctx, 5, -19, 2);
        ctx.fill();
        break;
      case 'fern':
        ctx.fillStyle = '#2f9a4a';
        for (let k = -2; k <= 2; k++) {
          ctx.save();
          ctx.rotate(k * 0.38 + sway);
          ellipsePath(ctx, 0, -13, 3.5, 13);
          ctx.fill();
          ctx.restore();
        }
        break;
      case 'bramble':
        // un buisson de ronces (comme dans la forêt des épines)
        ctx.fillStyle = '#7a3a8a';
        circlePath(ctx, -8, -10, 11);
        ctx.fill();
        circlePath(ctx, 8, -12, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 7; k++) {
          const a = -Math.PI + (k / 6) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 16, -10 + Math.sin(a) * 14);
          ctx.lineTo(Math.cos(a) * 21, -10 + Math.sin(a) * 19);
          ctx.lineTo(Math.cos(a + 0.2) * 16, -10 + Math.sin(a + 0.2) * 14);
          ctx.fill();
        }
        break;
      case 'lollipop':
        shadow(ctx, 0, 0, 12);
        ctx.scale(1.7, 1.7);
        Art.lollipop(ctx, 0, -19, 1, t + v * 5);
        break;
      case 'cream':
        ctx.fillStyle = '#ffe0f1';
        circlePath(ctx, -7, -6, 7);
        ctx.fill();
        circlePath(ctx, 4, -9, 9);
        ctx.fill();
        circlePath(ctx, 12, -5, 6);
        ctx.fill();
        ctx.fillStyle = '#e8203a';
        circlePath(ctx, 4, -19, 3.5);
        ctx.fill();
        break;
      case 'chocorock':
        ctx.fillStyle = '#7a4428';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 18, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#9a6040';
        ellipsePath(ctx, -5, -10, 6, 3, -0.3);
        ctx.fill();
        break;
      case 'rock':
        shadow(ctx, 0, 0, 18);
        ctx.fillStyle = d.theme === 'volcano' ? '#3e2b34' : '#9a8b86';
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-12, -18);
        ctx.lineTo(4, -24);
        ctx.lineTo(17, -12);
        ctx.lineTo(19, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = d.theme === 'volcano' ? '#6a4c58' : '#c9bbb5';
        ctx.beginPath();
        ctx.moveTo(-12, -18);
        ctx.lineTo(4, -24);
        ctx.lineTo(0, -12);
        ctx.closePath();
        ctx.fill();
        break;
      case 'pine':
        shadow(ctx, 0, 0, 18);
        ctx.fillStyle = '#6a4424';
        ctx.fillRect(-4, -14, 8, 14);
        ctx.fillStyle = '#5a7a3a';
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(-22 + k * 4, -12 - k * 18);
          ctx.lineTo(0, -40 - k * 16);
          ctx.lineTo(22 - k * 4, -12 - k * 18);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'grass':
        ctx.fillStyle = '#9aa84a';
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(k * 4 - 2, 0);
          ctx.quadraticCurveTo(k * 5 + sway * 20, -10, k * 6 + sway * 30, -16 + Math.abs(k) * 2);
          ctx.lineTo(k * 4 + 2, 0);
          ctx.fill();
        }
        break;
      case 'lavapool': {
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
        g.addColorStop(0, '#ffe066');
        g.addColorStop(0.6, '#ff6a1a');
        g.addColorStop(1, '#a8200a');
        ctx.fillStyle = g;
        ellipsePath(ctx, 0, 0, 26, 9);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,240,170,0.8)';
        circlePath(ctx, -6 + Math.sin(t * 2 + v * 9) * 6, -1, 2.5);
        ctx.fill();
        break;
      }
      case 'ember': {
        // cristal de feu qui brille
        const a = 0.6 + 0.4 * Math.sin(t * 3 + v * 20);
        ctx.fillStyle = `rgba(255,${120 + Math.floor(v * 80)},60,${a})`;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(k * 8 - 5, 0);
          ctx.lineTo(k * 9, -26 + Math.abs(k) * 9);
          ctx.lineTo(k * 8 + 5, 0);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'crystals': {
        const kinds = ['rubis', 'emeraude', 'diamant', 'topaze'];
        ctx.scale(1.2, 1.2);
        Art.gem(ctx, -8, -10, 0.8, kinds[Math.floor(v * 4)], t + v * 3);
        Art.gem(ctx, 8, -14, 1, kinds[Math.floor(v * 4 + 1) % 4], t + v * 5);
        break;
      }
      case 'shroom': {
        const a = 0.7 + 0.3 * Math.sin(t * 2 + v * 30);
        for (const [dx, k] of [[-6, 1], [6, 0.7]]) {
          ctx.fillStyle = '#e8e0d0';
          ctx.fillRect(dx - 2 * k, -12 * k, 4 * k, 12 * k);
          ctx.fillStyle = `rgba(${v < 0.5 ? '120,250,255' : '255,160,230'},${a})`;
          ctx.beginPath();
          ctx.ellipse(dx, -12 * k, 9 * k, 7 * k, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'stalagmite':
        ctx.fillStyle = '#4b4062';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.quadraticCurveTo(-4, -30, 0, -56);
        ctx.quadraticCurveTo(4, -30, 16, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#66597f';
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.quadraticCurveTo(-2, -30, 0, -50);
        ctx.quadraticCurveTo(-1, -26, 2, -6);
        ctx.closePath();
        ctx.fill();
        break;
      case 'puff':
        Scenery.fluffyCloud(ctx, 0, -12, 0.45, '#ffffff', '#cfdcf8');
        break;
      case 'starflower':
        ctx.rotate(sway);
        ctx.strokeStyle = '#7ab8e8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -18);
        ctx.stroke();
        ctx.translate(0, -22);
        ctx.rotate(t * 0.8 + v * 9);
        ctx.fillStyle = v < 0.5 ? '#ffe14d' : '#ff9fd8';
        Art.starShape(ctx, 8, 0.45);
        ctx.fill();
        break;
      case 'island':
        // une petite île qui flotte au-dessus des nuages
        ctx.translate(0, -40 + Math.sin(t * 0.8 + v * 6) * 4);
        ctx.fillStyle = '#9a7a8a';
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.quadraticCurveTo(0, 36, 30, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#7fdc5a';
        roundRectPath(ctx, -32, -5, 64, 9, 4);
        ctx.fill();
        roundTree(ctx, 8, -2, 30, '#4fcf5a', '#2fa34a');
        break;
      case 'cane':
        ctx.lineCap = 'round';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -34);
        ctx.arc(-8, -34, 8, 0, Math.PI, true);
        ctx.stroke();
        ctx.strokeStyle = '#ff4f8a';
        ctx.setLineDash([5, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'butt';
        break;
      case 'gumball': {
        const cols = ['#ff6fa8', '#7fd3ff', '#ffd84a', '#8ee07a'];
        ctx.fillStyle = cols[Math.floor(v * 40) % 4];
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 17, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ellipsePath(ctx, -4, -9, 3.5, 2, -0.5);
        ctx.fill();
        break;
      }
      case 'cone':
        shadow(ctx, 0, 0, 12);
        ctx.fillStyle = '#e8a85a';
        ctx.beginPath();
        ctx.moveTo(-11, -26);
        ctx.lineTo(0, 0);
        ctx.lineTo(11, -26);
        ctx.closePath();
        ctx.fill();
        [v < 0.5 ? '#ffb3d1' : '#a8e6c0', '#fff1c4'].forEach((c, k) => {
          ctx.fillStyle = c;
          circlePath(ctx, 0, -32 - k * 12, 12 - k * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#e8203a';
        circlePath(ctx, 1, -54, 3.5);
        ctx.fill();
        break;
      case 'gummy':
        Art.gummyBear(ctx, 0, 0, { dir: v < 0.5 ? 1 : -1, hue: Math.floor(v * 360), t: t + v * 4 });
        break;
      default: break;
    }
    ctx.restore();
  }

  // La maison de Malice, là où tout commence.
  function drawHome(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    shadow(ctx, 0, 2, 50);
    ctx.fillStyle = '#fff3e0';
    roundRectPath(ctx, -38, -62, 76, 62, 6);
    ctx.fill();
    ctx.fillStyle = '#ff4f9a';
    ctx.beginPath();
    ctx.moveTo(-50, -58);
    ctx.lineTo(0, -102);
    ctx.lineTo(50, -58);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c92a74';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // la cheminée qui fume
    ctx.fillStyle = '#b2531f';
    ctx.fillRect(18, -100, 12, 26);
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.4 + i / 3) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`;
      circlePath(ctx, 24 + ph * 16, -108 - ph * 40, 6 + ph * 8);
      ctx.fill();
    }
    ctx.fillStyle = '#9a5a2a';
    roundRectPath(ctx, -10, -34, 20, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#7fd3ff';
    roundRectPath(ctx, -31, -48, 15, 15, 3);
    ctx.fill();
    Art.heart(ctx, 23, -40, 1.2, '#ff3d7f', '#ffffff');
    ctx.restore();
  }

  // Le panneau au début de chaque monde, avec son numéro.
  function drawSign(ctx, W, t) {
    const { x, y } = W.sign;
    ctx.save();
    ctx.translate(x, y);
    shadow(ctx, 0, 0, 12);
    ctx.fillStyle = '#8a5a32';
    roundRectPath(ctx, -3, -50, 6, 50, 2);
    ctx.fill();
    ctx.rotate(Math.sin(t * 1.5 + W.k) * 0.04);
    ctx.fillStyle = W.look.nodeDark;
    circlePath(ctx, 0, -58, 21);
    ctx.fill();
    ctx.fillStyle = W.look.node;
    circlePath(ctx, 0, -60, 19);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawOutlinedText(ctx, String(W.k + 1), 0, -59, 24, '#ffffff');
    ctx.restore();
  }

  // Tout au bout : le gâteau géant, et la famille du bébé oiseau dans son nid.
  function drawCake(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ellipsePath(ctx, 0, 0, 132, 14);
    ctx.fill();
    const layers = [['#e2a65e', '#ff8fc8', 120, 46], ['#7a4428', '#fff2f8', 92, 40], ['#ffd6ec', '#ff4f8a', 64, 34]];
    let top = 0;
    layers.forEach(([body, icing, w, h]) => {
      ctx.fillStyle = body;
      roundRectPath(ctx, -w, top - h, w * 2, h, 10);
      ctx.fill();
      ctx.fillStyle = icing;
      roundRectPath(ctx, -w - 2, top - h - 4, w * 2 + 4, 14, 7);
      ctx.fill();
      for (let k = -w + 12; k < w - 6; k += 22) {
        roundRectPath(ctx, k - 5, top - h + 4, 10, 10 + hash(k + w) * 10, 5);
        ctx.fill();
      }
      top -= h;
    });
    // des bougies
    for (const bx of [-44, 44]) {
      ctx.fillStyle = '#7fd3ff';
      ctx.fillRect(bx - 3, top - 24, 6, 22);
      ctx.fillStyle = '#ffd84a';
      ellipsePath(ctx, bx, top - 30 + Math.sin(t * 9 + bx) * 1.2, 4, 7);
      ctx.fill();
    }
    ctx.translate(0, top - 2);
    ctx.scale(0.75, 0.75);
    Art.birdNest(ctx, 0, 6, 150);
    const sing = (i) => Math.floor(t * 4 + i * 1.3) % 2 === 0;
    Art.bigBird(ctx, -52, -6, t, { kind: 'maman', sing: sing(0), dir: 1, happy: true });
    Art.bigBird(ctx, 52, -6, t + 1, { kind: 'papa', sing: sing(1), dir: -1, happy: true });
    [-20, 0, 20].forEach((bx, i) => {
      Art.babyBird(ctx, bx, -8, t + i, { noNest: true, colors: SIBLINGS[i % SIBLINGS.length], chirp: sing(i + 2) });
    });
    ctx.restore();
  }

  // ---------- Le chemin ----------
  // style : les couleurs d'un monde, ou GREY (pas encore ouvert).
  function strokeLine(ctx, pts, a, b, look, locked) {
    if (b - a < 1) return;
    ctx.beginPath();
    ctx.moveTo(pts[a].x, pts[a].y);
    for (let k = a + 1; k <= b; k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (locked) {
      ctx.strokeStyle = 'rgba(110,100,130,0.35)';
      ctx.lineWidth = 22;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(240,236,248,0.55)';
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,110,140,0.45)';
      ctx.lineWidth = 4;
      ctx.setLineDash([2, 14]);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    ctx.strokeStyle = look.edge;
    ctx.lineWidth = 28;
    ctx.stroke();
    if (look.rainbow) {
      // dans les nuages, le chemin est un arc-en-ciel
      RAINBOW.forEach((c, k) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 22 - k * 3.6;
        ctx.stroke();
      });
      return;
    }
    ctx.strokeStyle = look.path;
    ctx.lineWidth = 20;
    ctx.stroke();
    if (look.cane) {
      // au pays des bonbons, un sucre d'orge
      ctx.strokeStyle = 'rgba(255,79,138,0.75)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'butt';
      ctx.setLineDash([9, 11]);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    ctx.strokeStyle = look.edge;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 5;
    ctx.setLineDash([1, 17]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Jusqu'où le chemin est en couleurs : le point de la dernière case ouverte.
  function openS() {
    let s = 0;
    for (const i of seq) if (isOpen(i)) s = Math.max(s, nodes[i].s);
    return s;
  }

  function drawPaths(ctx, L, R) {
    let a = main.findIndex((p) => p.x > L - 30);
    let b = main.length - 1;
    while (b > 0 && main[b].x > R + 30) b--;
    a = Math.max(0, a - 1);
    b = Math.min(main.length - 1, b + 1);
    const F = clamp(openS(), a, b);
    for (const W of worlds) {
      if (W.bx1 < L || W.bx0 > R) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(W.bx0, -10, W.bx1 - W.bx0, VIEW_H + 20);
      ctx.clip();
      strokeLine(ctx, main, F, b, W.look, true);
      strokeLine(ctx, main, a, F, W.look, false);
      for (const i of seq) {
        const n = nodes[i];
        if (n.spur && n.x > L - 120 && n.x < R + 120) strokeLine(ctx, n.spur, 0, n.spur.length - 1, W.look, !isOpen(i));
      }
      // la case qui s'ouvre : le chemin se dessine jusqu'à elle
      if (anim && !anim.popped && anim.r > 0) {
        const p = pointAt(anim.route, anim.r);
        const pts = anim.route.pts.slice(0, p.k).concat([{ x: p.x, y: p.y }]);
        strokeLine(ctx, pts, 0, pts.length - 1, W.look, false);
      }
      ctx.restore();
    }
  }

  // ---------- Les cases ----------
  function drawLock(ctx, x, y) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x, y - 5, 6, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, x - 9, y - 5, 18, 14, 3);
    ctx.fill();
    ctx.fillStyle = GREY.nodeDark;
    circlePath(ctx, x, y + 1, 2.5);
    ctx.fill();
  }

  function drawNode(ctx, i, t) {
    const n = nodes[i];
    const lv = LEVELS[i];
    const look = worlds[lv.world - 1].look;
    const opened = isOpen(i);
    const c = opened ? look : GREY;
    let x = n.x;
    let y = n.y;
    let k = 1;
    if (bumpT > 0 && bumpNode === i) x += Math.sin(bumpT * 50) * 4 * (bumpT / 0.45);
    // la case qui vient de s'ouvrir saute
    if (anim && anim.to === i && anim.popT !== undefined && anim.popT < 0.6) k = 1 + Math.sin((anim.popT / 0.6) * Math.PI) * 0.35;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ellipsePath(ctx, 0, 10, 36, 13);
    ctx.fill();
    // la case de Malice brille
    if (i === at && !walk) {
      ctx.strokeStyle = `rgba(255,236,120,${0.6 + 0.3 * Math.sin(t * 5)})`;
      ctx.lineWidth = 5;
      ellipsePath(ctx, 0, 3, 40 + Math.sin(t * 5) * 2, 26 + Math.sin(t * 5) * 1.5);
      ctx.stroke();
    }
    const stage = !!lv.badge;
    ctx.fillStyle = stage && opened ? '#3e2a8a' : c.nodeDark;
    ellipsePath(ctx, 0, 6, 31, 19);
    ctx.fill();
    const g = ctx.createLinearGradient(0, -19, 0, 19);
    const top = stage && opened ? '#7a4ae0' : c.node;
    g.addColorStop(0, Art.mixColor(top, '#ffffff', 0.35));
    g.addColorStop(1, top);
    ctx.fillStyle = g;
    ellipsePath(ctx, 0, 0, 31, 19);
    ctx.fill();
    ctx.strokeStyle = stage && opened ? '#7ff0ff' : '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (stage) {
      // le stage d'entraînement : une étoile
      if (opened) Art.star(ctx, 0, -2, 17, t);
      else {
        ctx.fillStyle = '#ffffff';
        Art.starShape(ctx, 15, 0.48);
        ctx.fill();
      }
    } else if (opened) {
      drawOutlinedText(ctx, lv.key, 0, 7, 19, '#ffffff');
    } else {
      drawLock(ctx, 0, 0);
    }
    // la dernière case ouverte (pas encore finie) : des petites étoiles autour
    if (opened && pos(i) === limit && i !== at && !lv.badge) {
      for (let s = 0; s < 3; s++) {
        const a = t * 1.6 + (s * TAU) / 3;
        ctx.save();
        ctx.translate(Math.cos(a) * 38, -4 + Math.sin(a) * 20);
        ctx.rotate(t * 2);
        ctx.fillStyle = '#fff27a';
        Art.starShape(ctx, 5 + Math.sin(t * 6 + s) * 1.5, 0.45);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // La place du château du boss au bout du monde : vide tant que le monde n'a pas de boss.
  function drawCastleSpot(ctx, W, t) {
    const { x, y } = W.castle;
    const boss = nodes[W.castle.node];
    if (W.castle.node !== undefined && boss) {
      drawCastle(ctx, x, y - 14, W.look, t, isOpen(W.castle.node));
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ellipsePath(ctx, 0, 6, 52, 22);
    ctx.fill();
    ctx.fillStyle = '#d8d0c4';
    ellipsePath(ctx, 0, 2, 48, 20);
    ctx.fill();
    ctx.fillStyle = '#b9ae9e';
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU;
      ellipsePath(ctx, Math.cos(a) * 33, 2 + Math.sin(a) * 12, 7, 4);
      ctx.fill();
    }
    ellipsePath(ctx, 0, 2, 9, 5);
    ctx.fill();
    ctx.restore();
  }

  // Le château du boss (pour les mondes qui en ont un : "boss" dans levels.js).
  function drawCastle(ctx, x, y, look, t, opened) {
    const wall = opened ? '#c9bfd6' : '#a49cb0';
    const dark = opened ? '#8e83a0' : '#7a7288';
    const roof = opened ? look.node : GREY.node;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ellipsePath(ctx, 0, 4, 70, 16);
    ctx.fill();
    for (const tx of [-44, 44]) {
      ctx.fillStyle = wall;
      ctx.fillRect(tx - 15, -96, 30, 96);
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(tx - 20, -94);
      ctx.lineTo(tx, -134);
      ctx.lineTo(tx + 20, -94);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6a6070';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, -134);
      ctx.lineTo(tx, -150);
      ctx.stroke();
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(tx, -150);
      ctx.lineTo(tx + 16, -146 + Math.sin(t * 4 + tx) * 2);
      ctx.lineTo(tx, -141);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = wall;
    ctx.fillRect(-32, -70, 64, 70);
    ctx.fillStyle = dark;
    for (let k = -32; k < 32; k += 16) ctx.fillRect(k, -80, 10, 12);
    ctx.fillStyle = '#3a2a4a';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-14, -26);
    ctx.arc(0, -26, 14, Math.PI, 0);
    ctx.lineTo(14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------- Malice ----------
  function drawMalice(ctx, t) {
    let y = my - 12;
    if (bumpT > 0) y -= Math.sin((bumpT / 0.45) * Math.PI) * 14;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipsePath(ctx, mx, my - 10, 17, 5);
    ctx.fill();
    const moving = !!walk;
    // pendant le retour à la maison, le bébé oiseau est sur la casquette
    const bird = Game.save.rescued && fog <= 0 && mx >= seqX - 40;
    Heroes.draw(ctx, Game.hero, mx, y, {
      pose: moving ? 'walk' : 'idle',
      t,
      ph: moving ? walk.d * 0.075 : 0,
      facing,
      scale: 0.95,
      onHead: bird ? (c) => {
        c.save();
        c.translate(-2, -61);
        c.scale(0.5, 0.5);
        Art.babyBird(c, 0, 0, t, { noNest: true, happy: moving });
        c.restore();
      } : null,
    });
  }

  // Les nuages qui cachent le retour à la maison, tant que le bébé oiseau n'est pas sauvé.
  function drawFog(ctx, L, R, t) {
    if (fog <= 0 || seqX === Infinity) return;
    const x0 = fogX;
    if (R < x0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, fog * 1.2);
    const g = ctx.createLinearGradient(x0, 0, x0 + 140, 0);
    g.addColorStop(0, 'rgba(236,230,255,0)');
    g.addColorStop(1, 'rgba(236,230,255,0.96)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, -10, 140, VIEW_H + 20);
    ctx.fillStyle = 'rgba(236,230,255,0.96)';
    ctx.fillRect(x0 + 140, -10, Math.max(0, R - x0), VIEW_H + 20);
    const spread = (1 - fog) * 260;
    for (let x = x0 + 60; x < Math.min(R + 120, MAP_W + 100); x += 110) {
      for (let r = 0; r < 5; r++) {
        const h = hash(x * 0.37 + r * 3.3);
        const yy = 40 + r * 115 + Math.sin(t * 0.6 + x * 0.01 + r) * 8;
        const up = r < 2.5 ? -1 : 1;
        Scenery.fluffyCloud(ctx, x + h * 50, yy + up * spread, 1.3 + h * 0.6, '#ffffff', '#d9d0f2');
      }
    }
    ctx.globalAlpha = fog;
    // la phrase se lit depuis la dernière case d'avant les nuages
    drawOutlinedText(ctx, 'Sauve d\'abord', x0 + 175, 285, 23, '#ff7ab8');
    drawOutlinedText(ctx, 'le bébé oiseau !', x0 + 175, 315, 23, '#ff7ab8');
    ctx.restore();
  }

  // ---------- Par-dessus la carte ----------
  function drawBanner(ctx, t) {
    const i = walk ? walk.to : at;
    const lv = LEVELS[i];
    const W = worlds[lv.world - 1];
    const top = `Monde ${lv.world} · ${W.def.name}`;
    const name = lv.badge ? `Stage : ${lv.name}` : `${lv.key}   ${lv.name}`;
    ctx.save();
    ctx.font = '700 30px Fredoka, "Arial Rounded MT Bold", sans-serif';
    const w = Math.min(VIEW_W - 240, Math.max(ctx.measureText(name).width, 260) + 60);
    ctx.fillStyle = 'rgba(40,10,60,0.55)';
    roundRectPath(ctx, VIEW_W / 2 - w / 2, 12, w, 86, 24);
    ctx.fill();
    drawOutlinedText(ctx, top, VIEW_W / 2, 36, 19, '#ffd84a');
    drawOutlinedText(ctx, name, VIEW_W / 2, 70, 30, '#ffffff');
    pill = null;
    if (!walk && !anim) {
      // le bouton « ▶ Jouer » (on peut aussi toucher la case, ou sauter)
      const py = 98 + PILL.h / 2 + 6;
      const k = 1 + Math.sin(t * 4) * 0.03;
      ctx.translate(VIEW_W / 2, py);
      ctx.scale(k, k);
      const g = ctx.createLinearGradient(0, -PILL.h / 2, 0, PILL.h / 2);
      g.addColorStop(0, '#ff8cc4');
      g.addColorStop(0.5, '#ff4f9a');
      g.addColorStop(1, '#c92a74');
      ctx.fillStyle = '#7a1650';
      roundRectPath(ctx, -PILL.w / 2, -PILL.h / 2 + 4, PILL.w, PILL.h, PILL.h / 2);
      ctx.fill();
      ctx.fillStyle = g;
      roundRectPath(ctx, -PILL.w / 2, -PILL.h / 2, PILL.w, PILL.h, PILL.h / 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      drawOutlinedText(ctx, '▶ Jouer !', 0, 1, 24, '#ffffff');
      pill = { x: VIEW_W / 2, y: py, w: PILL.w, h: PILL.h };
    }
    ctx.restore();
    if (msg) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, msg.t * 3);
      drawOutlinedText(ctx, msg.text, VIEW_W / 2, pill ? 176 : 124, 20, '#ffe2f4');
      ctx.restore();
    }
  }

  function drawLives(ctx) {
    if (Game.lives === Infinity) return;
    ctx.save();
    ctx.fillStyle = 'rgba(40,10,60,0.32)';
    roundRectPath(ctx, 10, 12, 104, 48, 18);
    ctx.fill();
    Heroes.head(ctx, Game.hero, 38, 36, 0.75);
    drawOutlinedText(ctx, '×' + Game.lives, 58, 38, 22, '#ffffff', 'left');
    ctx.restore();
  }

  function drawHint(ctx) {
    const text = Game.isTouch ? 'Touche une case pour y aller' : '← → pour marcher   •   Espace pour jouer';
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawOutlinedText(ctx, text, VIEW_W / 2, VIEW_H - 26, 17, '#ffffff');
    ctx.restore();
  }

  return {
    open,
    update,
    render,
    get at() { return at; },
  };
})();
