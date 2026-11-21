#!/usr/bin/env node
// Vérifie qu'un niveau est franchissable :
//   node outils/franchissable.js <numéro du niveau dans LEVELS> [easy|full|kid] [première colonne, dernière colonne]
//                                [from=colonne,rangée] [goal=colonne,rangée] [mill=secondes] [path=fichier]
//
// Il simule les sauts de Malice (en marchant, sans courir) depuis chaque endroit où elle peut se tenir, et dit :
// si l'arrivée est atteinte, quels objets sont hors d'atteinte, et s'il y a des culs-de-sac (des endroits d'où l'on
// ne peut plus rejoindre l'arrivée). Il signale aussi ce qui devrait être posé par terre et ne l'est pas, et les
// fleurs T qui n'ont pas leur phrase.
//
//   easy (par défaut) : elle saute un peu moins bien qu'en vrai, pour garder de la marge ;
//   full : comme en vrai ;
//   kid : comme une enfant qui débute (un saut de 2,3 cases de haut, un trou de 3,4 cases) : pour voir si le chemin
//         obligé reste facile.
//   Deux nombres : affiche ce bout de carte (une virgule là où elle peut se tenir, un x pour un cul-de-sac) ; dans un
//         niveau où l'on grimpe ("grimpe"), ce sont deux rangées.
//   from=colonne,rangée : part d'ailleurs ; goal=colonne,rangée : vise une autre arrivée (pour vérifier un morceau) ;
//   mill=secondes : le temps d'un tour de moulin (7 par défaut, comme en Gentil : voir millTurn dans DIFFS) ;
//   path=fichier : écrit le chemin trouvé (pour le rejouer dans le vrai jeu).
//
// CE QU'IL CONNAÎT
//   le sol, les briques, les blocs lutins, les plateformes - = z, la lave, les ronces, l'eau, les nénuphars ;
//   les pissenlits * et les courants d'air ("updrafts") ;
//   les champignons M : on y rebondit (plus haut en gardant le saut), on ne s'y tient pas ;
//   les plateformes qui bougent H et I, et les planches des moulins x : chaque endroit où elles passent est un
//     endroit où se tenir, et l'on s'y laisse emporter. Depuis le sol, on suppose qu'on attend le bon moment pour
//     sauter dessus ; d'une planche à une autre du même rythme (deux plateformes, ou deux planches de moulin), on
//     suit leur mouvement pendant le saut ;
//   les lianes J : on les attrape en sautant, on s'y balance (aussi longtemps qu'on veut, en partant de la liane au
//     repos), on se lance ou on se laisse tomber, de liane en liane ;
//   la glace + : on y saute avec un peu plus d'élan, qu'on garde en l'air ; en s'y posant avec de l'élan, on dérape
//     en freinant (jusqu'au bord, parfois : on tombe alors avec ce qui reste d'élan) ;
//   les éboulis > ("glissades") : on glisse jusqu'en bas sans pouvoir s'arrêter (plus ou moins vite), on saute en
//     gardant son élan, un rocher arrête, un trou fait tomber.
//   Ces modèles ont été comparés au vrai moteur, saut par saut (mode full, difficulté Gentil) : ils tombent juste,
//   sauf quand ça se joue à un pixel près (le bord d'un champignon ou d'une plaque de glace).
//
// CE QU'IL NE CONNAÎT PAS (il le rappelle à chaque fois, sur la ligne « non modélisé dans ce niveau »)
//   les ennemis (ni pour se faire mal, ni pour rebondir dessus), les stalactites, les boss ;
//   tout ce qui dépend du moment : les éclairs ("storms"), le vent ("winds"), l'eau qui monte ("crue"), les pierres de
//     lave ("volcan"), les paratonnerres z qui grésillent, les nénuphars c qui coulent (comptés comme solides) ;
//   les badges et les pouvoirs (la course, le super saut, la roulade, la moustache-grappin @, les bouchons %) ;
//   la bave des escargots, la boue et le chocolat où l'on s'enfonce (comptés comme de la lave) ;
//   après un rebond ou une liane, le rythme des planches qui bougent (on suppose de nouveau qu'elles sont là où il
//     faut) ; les lianes qui se balancent un peu toutes seules (en easy, on compte qu'elles penchent du mauvais côté) ;
//   les objets : il les compte attrapés quand le milieu de Malice passe dans leur case (à quelques pixels près, il
//     peut se tromper dans les deux sens).
//   « ATTEINTE » veut donc dire : le décor laisse passer. « PAS ATTEINTE » : presque sûrement un vrai défaut… ou un
//   passage qui demande quelque chose de cette liste.
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------
//  Ce qu'on a demandé
// ---------------------------------------------------------------------
const args = process.argv.slice(2);
const option = (name) => { const a = args.find((s) => s.startsWith(name + '=')); return a ? a.slice(name.length + 1) : null; };
const pair = (name) => { const v = option(name); return v ? v.split(',').map(Number) : null; };
const plain = args.filter((s) => !s.includes('='));
const levelIndex = +plain[0];
const mode = ['easy', 'full', 'kid'].find((m) => plain.includes(m)) || 'easy';
const [show0, show1] = plain.slice(1).filter((s) => /^\d+$/.test(s)).map(Number);

const { LEVELS, WORLDS } = new Function(fs.readFileSync(path.join(__dirname, '..', 'js', 'levels.js'), 'utf8') + ';return { LEVELS, WORLDS }')();
const lv = LEVELS[levelIndex];
if (!lv) {
  console.log(`usage : node outils/franchissable.js <0..${LEVELS.length - 1}> [easy|full|kid] [c0 c1] [from=c,r] [goal=c,r] [mill=s] [path=f.json]`);
  process.exit(1);
}

// ---------------------------------------------------------------------
//  La physique (les mêmes nombres que PHYS, SLIDE, ICE_PHYS, VINE, MILL dans js/entities.js)
// ---------------------------------------------------------------------
const T = 48, W = 28, H = 56; // une case ; Malice
const DT = 1 / 120;
// jump, run : ce qu'elle garde de son saut et de sa vitesse ; spring : du rebond d'un champignon ; glide : de sa
// vitesse en pissenlit ; lift : de combien le pissenlit la soulève quand elle l'attrape (pixels) ; reach : à combien
// de pixels elle attrape une liane (vineReach : 40 en Gentil, 34 en Difficile) ; sway : 1 = la liane, qui se balance
// un peu toute seule, est du mauvais côté quand elle arrive (0 : elle pend tout droit) ; push : ce qu'elle garde de
// sa poussée sur la liane ; brake : de son freinage sur la glace
const MODES = {
  kid: { jump: 0.76, run: 0.93, spring: 0.95, glide: 0.85, lift: 6, reach: 34, sway: 1, push: 0.9, brake: 0.8 },
  easy: { jump: 0.95, run: 0.93, spring: 0.95, glide: 0.85, lift: 6, reach: 34, sway: 1, push: 0.9, brake: 0.8 },
  full: { jump: 1, run: 1, spring: 1, glide: 1, lift: 14, reach: 40, sway: 0, push: 1, brake: 1 },
};
const K = MODES[mode];
const G = 2300, MAXF = 1000, CUT = 520, ACC = 1600, DEC = 900;
const REAL_RUN = 285;
const RUN = REAL_RUN * K.run, JUMP = 950 * K.jump, RUN_JUMP = 1010 * K.jump;
const SPRINGS = [1150 * K.spring, 1380 * K.spring]; // le rebond d'un champignon, et en gardant le saut appuyé
const SLIDE = { speed: 370, grade: 0.7, fast: 1.4, slow: 0.62, acc: 900, air: 320, stick: 18 };
const GROUND = { acc: 2300, dec: 2700 };
const ICE = { acc: 650, dec: 300, turn: 760 * K.brake, top: 1.1, airAcc: 1100, airDec: 150 };
const VINE = { min: 40, push: 720 * K.push, damp: 0.2, max: 1.15, jump: 900 * K.jump, wait: 0.5, hold: 0.14 };
const MILL = { r: 160, hang: 10, plankW: 96, turn: +(option('mill') || 7), steps: 40 };
const PLATFORM = { w: 3 * T, range: 3 * T, period: 4.6, steps: 7 };

const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------
//  La carte
// ---------------------------------------------------------------------
const rows = lv.map.length, cols = lv.map[0].length;
const errs = [];
lv.map.forEach((row, r) => { if (row.length !== cols) errs.push(`ligne ${r} : ${row.length} colonnes au lieu de ${cols}`); });
const grid = lv.map.map((row) => row.split(''));
// (hors de la carte : des murs sur les côtés, du ciel au-dessus, et en dessous le vide, ou la terre d'un terrier)
const at = (c, r) => (r < 0 ? '.' : r >= rows ? (lv.terrier ? '#' : ' ') : c < 0 || c >= cols ? '#' : grid[r][c] || '.');
const SOLID = '#BMLFKCSu+';
const LUTIN = 'LKFCS';
const solid = (c, r) => SOLID.includes(at(c, r));
const ledge = (c, r) => '-=ncz'.includes(at(c, r));
const floor = (c, r) => solid(c, r) || ledge(c, r);
const id = (c, r) => r * cols + c;
const boxSolid = (x, y) => {
  for (let r = Math.floor(y / T); r <= Math.floor((y + H - 0.01) / T); r++) {
    for (let c = Math.floor(x / T); c <= Math.floor((x + W - 0.01) / T); c++) if (solid(c, r)) return true;
  }
  return false;
};

// Un danger touche-t-il la boîte de Malice (son coin en haut à gauche en x, y) ?
function hurt(x, y) {
  if (y > rows * T + 20) return true;
  const c0 = Math.floor((x + 3) / T), c1 = Math.floor((x + W - 3) / T);
  const r0 = Math.floor(y / T), r1 = Math.floor((y + H - 0.01) / T);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = at(c, r);
      if (ch === '~' && y + H > r * T + (at(c, r - 1) === '~' ? 0 : 20)) return true;
      if (ch === '_' && y + H > r * T + 14) return true;
      if (ch === '^' && y + H > r * T + 16) return true;
      if (ch === 'v' && y < r * T + 34) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------
//  Les éboulis (comme World.findScree, screeY, underScree, screeWall dans js/world.js)
//  Chaque glissade est une pente toute droite ; lines[c] : les pentes qui passent dans la colonne c ; fill : la
//  terre sous les éboulis (on ne s'y pose pas, on ne s'y cogne pas : on est sur la pente, au-dessus).
// ---------------------------------------------------------------------
const scree = (() => {
  if (!lv.glissades || !lv.glissades.length) return null;
  const lines = Array.from({ length: cols }, () => []);
  const all = lv.glissades.map(([c0, r0, c1, r1], i) => ({ i, c0, c1, x0: c0 * T, y0: r0 * T, k: (r1 + 1 - r0) / (c1 + 1 - c0) }));
  for (const L of all) for (let c = Math.max(0, L.c0); c <= Math.min(cols - 1, L.c1); c++) lines[c].push(L);
  return { lines, all, fill: new Uint8Array(rows * cols) };
})();
const lineY = (L, x) => L.y0 + L.k * (x - L.x0);
if (scree) {
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows - 1; r++) {
      // (un hérisson de roche posé sur la pente : sa case est aussi une case d'éboulis)
      const passes = scree.lines[c].some((L) => lineY(L, (c + 1) * T) > r * T + 0.5 && lineY(L, c * T) < (r + 1) * T - 0.5);
      if (grid[r][c] === '0' && passes) grid[r][c] = '>';
      if (grid[r][c] !== '>') continue;
      for (let rr = r + 1; rr < rows && solid(c, rr); rr++) scree.fill[id(c, rr)] = 1;
    }
  }
}
// Les éboulis à x (la pente la plus proche de la hauteur near) : { y, L }, ou null (pas de pente, un rocher, un trou).
function screeAt(x, near, only) {
  const c = Math.floor(x / T);
  if (!scree || c < 0 || c >= cols) return null;
  let best = null;
  for (const L of scree.lines[c]) {
    if (only && L !== only) continue;
    const y = lineY(L, x);
    if (at(c, Math.floor((y - 1) / T)) !== '>' && at(c, Math.floor((y + 1) / T)) !== '>') continue;
    if (!best || Math.abs(y - near) < Math.abs(best.y - near)) best = { y, L };
  }
  return best;
}
const underScree = (x, y, c, r) => {
  if (!scree || !scree.fill[id(c, r)]) return false;
  const s = screeAt(x + W / 2, y + H);
  return !!s && r * T < s.y + T;
};
// (tombée dans une crevasse, sous la pente : le bord d'en face est un mur)
const screeWall = (y, c, r0, r1, edgeX) => {
  let found = false;
  for (let r = r0; r <= r1 && !found; r++) found = at(c, r) === '>';
  if (!found) return false;
  const s = screeAt(edgeX, y + H);
  return !!s && y + H > s.y + SLIDE.stick;
};
const slideSpeed = (k, dir) => SLIDE.speed * (SLIDE.grade + k) * (dir > 0 ? SLIDE.fast : dir < 0 ? SLIDE.slow : 1);

// ---------------------------------------------------------------------
//  Là où elle peut se tenir. Un noeud « case » (c, r) est la case de ses pieds : le sol est en (c, r + 1).
//  Pas sur un champignon (on y rebondit), ni dans une case d'éboulis (on y glisse).
// ---------------------------------------------------------------------
const stand = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows && floor(c, r + 1) && at(c, r + 1) !== 'M' && at(c, r) !== '>' &&
  !solid(c, r) && !solid(c, r - 1) && !hurt(c * T + 10, (r + 1) * T - H);
// Un champignon sous ses pieds (comme Player.springTile) ?
const springUnder = (x, r) => {
  for (let c = Math.floor((x + 2) / T); c <= Math.floor((x + W - 2) / T); c++) if (at(c, r) === 'M') return true;
  return false;
};
// De la glace sous ses pieds (comme World.iceUnder) ?
const iceUnder = (x, r) => {
  const mid = Math.floor((x + W / 2) / T);
  if (at(mid, r) === '+') return true;
  if (floor(mid, r)) return false;
  return at(Math.floor((x + 3) / T), r) === '+' || at(Math.floor((x + W - 3) / T), r) === '+';
};
// La case où elle se retrouve, posée en x sur le sol de la rangée r (son milieu, ou sinon le pied qui porte).
function restCell(x, r, t) {
  const c0 = Math.floor((x + 0.01) / T), c1 = Math.floor((x + W - 0.01) / T);
  let c = Math.floor((x + W / 2) / T);
  if (!floor(c, r)) c = floor(c0, r) ? c0 : c1;
  return stand(c, r - 1) ? { c, r: r - 1, t } : null;
}

// ---------------------------------------------------------------------
//  Les pissenlits (là où on les touche : comme Dandelion.box)
// ---------------------------------------------------------------------
const puffs = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (grid[r][c] !== '*') continue;
    const cx = c * T + T / 2;
    if (floor(c, r + 1)) puffs.push({ x: cx - 20, y: (r + 1) * T - 82 - 28 - 96, w: 40, h: 82 + 28 + 96 });
    else puffs.push({ x: cx - 26, y: r * T + 24 - 6 - 26, w: 52, h: 62 });
  }
}
const puffHit = (x, y) => puffs.find((p) => x < p.x + p.w && x + W > p.x && y < p.y + p.h && y + H > p.y);
const ups = lv.updrafts || [];

// ---------------------------------------------------------------------
//  Ce qui bouge : les plateformes H (3 cases vers la droite, et retour) et I (3 cases vers le haut, et retour), et
//  les planches des moulins x (4 par moulin, qui tournent). Toutes les H et les I bougent ensemble (même départ,
//  même durée), tous les moulins aussi : chacun de ces deux groupes a son horloge (clock), qui compte les
//  allers-retours des plateformes, ou les tours des moulins.
//  carriers : les planches { rhythm, w, at(clock) : où elle est à ce moment-là, { x, y } (son dessus), et i (le
//  numéro de l'endroit de son trajet le plus proche, dans movers) }.
//  movers : les endroits où passe chaque planche (steps par trajet). Ce sont les noeuds « mobiles » de
//  l'exploration : { i, x, y, w, j (le combientième du trajet), carrier, next (où la planche nous emporte ensuite),
//  clocks (les moments où elle y est) }.
// ---------------------------------------------------------------------
const carriers = [], movers = [];
function addCarrier(kind, src, rhythm, steps, w, place) {
  const base = movers.length;
  const loop = kind === 'x';
  // (un moulin : un endroit par pas de son tour ; une plateforme : de son départ, j = 0, jusqu'au bout, j = steps - 1)
  const nearest = (clock) => {
    if (loop) return ((Math.round(clock * steps) % steps) + steps) % steps;
    return Math.round(((1 - Math.cos(clock * 2 * Math.PI)) / 2) * (steps - 1));
  };
  const carrier = { kind, src, rhythm, w, at: (clock) => Object.assign(place(clock), { i: base + nearest(clock) }) };
  carriers.push(carrier);
  for (let j = 0; j < steps; j++) {
    // (une plateforme passe à chaque endroit deux fois par aller-retour : à l'aller et au retour)
    const go = loop ? j / steps : Math.acos(1 - (2 * j) / (steps - 1)) / (2 * Math.PI);
    const clocks = loop || j === 0 || j === steps - 1 ? [go] : [go, 1 - go];
    const next = loop ? [base + ((j + 1) % steps)] : [j - 1, j + 1].filter((q) => q >= 0 && q < steps).map((q) => base + q);
    movers.push(Object.assign(place(go), { i: base + j, j, kind, src, w, carrier, clocks, next }));
  }
}
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const ch = grid[r][c];
    if (ch === 'x') {
      // (ses 4 planches, à un quart de tour l'une de l'autre, passent toutes aux mêmes endroits)
      const cx = c * T + T / 2, cy = r * T + T / 2;
      const place = (clock) => ({ x: cx + Math.cos(clock * 2 * Math.PI) * MILL.r - MILL.plankW / 2, y: cy + Math.sin(clock * 2 * Math.PI) * MILL.r + MILL.hang });
      const first = carriers.length;
      addCarrier('x', [c, r], 'mill', MILL.steps, MILL.plankW, place);
      for (let q = 1; q < 4; q++) carriers.push(Object.assign({}, carriers[first], { at: (clock) => carriers[first].at(clock + q / 4) }));
    } else if (ch === 'H' || ch === 'I') {
      const place = (clock) => {
        const k = ((1 - Math.cos(clock * 2 * Math.PI)) / 2) * PLATFORM.range;
        return { x: c * T + (ch === 'H' ? k : 0), y: r * T - (ch === 'I' ? k : 0) };
      };
      addCarrier(ch, [c, r], 'platform', PLATFORM.steps, PLATFORM.w, place);
    }
  }
}
const PERIOD = { mill: MILL.turn, platform: PLATFORM.period };

// ---------------------------------------------------------------------
//  Les lianes : elles pendent du haut de la première case J (comme Vine.catchAt ; les mains de Malice sont tout
//  en haut de sa boîte)
// ---------------------------------------------------------------------
const vines = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (grid[r][c] !== 'J' || at(c, r - 1) === 'J') continue;
    let n = 1;
    while (at(c, r + n) === 'J') n++;
    // (sway : toute seule, elle se balance un peu, d'autant plus qu'elle est longue : l'angle, comme dans Vine.update)
    const w2 = (G * 0.9) / (n * T);
    vines.push({ i: vines.length, c, r, x: c * T + T / 2, y: r * T, len: n * T, sway: 0.3 / Math.hypot(w2 - 0.81, 0.99) });
  }
}
// La longueur de liane jusqu'à ses mains si elle l'attrape (0 : non). ang : l'angle de la liane (0 : elle pend
// tout droit ; en easy, on compte qu'elle penche un peu du mauvais côté).
function vineCatch(v, x, y, ang) {
  if (!ang && Math.abs(v.x - x - W / 2) > K.reach) return 0;
  const s = Math.sin(ang), c = Math.cos(ang);
  const y0 = Math.max(y - 20, v.y + VINE.min * c), y1 = Math.min(y + H, v.y + v.len * c + 26);
  if (y0 > y1) return 0;
  const cx = x + W / 2, down = clamp(y, y0, y1) - v.y;
  if (Math.abs(v.x + (down * s) / c - cx) > K.reach - K.sway * v.sway * down) return 0;
  return clamp(Math.hypot(cx - v.x, y - v.y), VINE.min, v.len);
}

// ---------------------------------------------------------------------
//  Un saut, image par image (comme Player.update et World.moveBody).
//  plan : { vx0 : l'élan au départ ; jump : 1 = on saute, 0 = on tombe ; hold : la durée du saut tenu ; vy0 : une
//  vitesse imposée (un rebond, un lancer de liane) ; d, tau, rev : on tient la direction d pendant tau secondes,
//  puis on la lâche (ou, avec rev, on tient l'autre) ; air : 'ice' (partie de la glace : elle garde son élan) ou
//  'slide' (partie des éboulis, de pente k) ; boost : lancée d'une liane ; skip, ang, angV : la liane qu'elle vient
//  de lâcher, son angle et son élan (elle se balance encore toute seule, comme dans Vine.update) ;
//  onMover, clock : l'endroit de la planche qu'elle quitte, et l'heure qu'il est à son horloge }
//  Renvoie là où elle arrive : une case { c, r }, une planche { mover }, des éboulis { slide, c }, ou ce qui lui
//  arrive en route : { spring } (un champignon), { puff } (un pissenlit), { vine } (une liane), { edge } (elle a
//  dérapé sur la glace jusqu'au bord). null : elle se fait mal, ou n'arrive nulle part. touched : les cases traversées.
// ---------------------------------------------------------------------
function steer(vx, dir, s) {
  const against = dir && Math.sign(vx) === -dir;
  // l'image où elle saute, elle a encore les pieds par terre : sur les éboulis, sur la glace, sur le sol
  if (s.ground) {
    s.ground = false;
    if (s.air === 'slide') return approach(vx, slideSpeed(s.k, dir), SLIDE.acc * DT);
    if (s.air === 'ice') return approach(vx, dir * RUN * ICE.top, (!dir ? ICE.dec : against ? ICE.turn : ICE.acc) * DT);
    return approach(vx, dir * RUN, (dir ? GROUND.acc : GROUND.dec) * (against ? 1.6 : 1) * DT);
  }
  if (s.air === 'slide' && Math.abs(vx) > REAL_RUN * 0.7) return dir ? approach(vx, slideSpeed(s.k, dir), SLIDE.air * DT) : vx;
  if (s.boost > 0 && Math.abs(vx) > RUN && (dir === 0 || dir === Math.sign(vx))) {
    s.boost -= DT;
    return approach(vx, Math.sign(vx) * RUN, 260 * DT);
  }
  if (s.air === 'ice') return approach(vx, dir * RUN * ICE.top, (dir ? ICE.airAcc * (against ? 1.6 : 1) : ICE.airDec) * DT);
  return approach(vx, dir * RUN, (dir ? ACC : DEC) * (against ? 1.6 : 1) * DT);
}

function sim(x, y, plan, touched) {
  let vx = plan.vx0;
  let vy = plan.vy0 !== undefined ? plan.vy0 : plan.jump ? -(Math.abs(vx) > REAL_RUN + 40 ? RUN_JUMP : JUMP) : 0;
  let t = 0;
  // (seul un saut se raccourcit quand on lâche le bouton : pas un rebond)
  let cut = !plan.jump || plan.vy0 !== undefined;
  const s = { air: plan.air || null, k: plan.k || 0, boost: plan.boost ? 0.8 : 0, ground: !!plan.jump && plan.vy0 === undefined };
  // Les planches qui bougent. Partie de l'une d'elles, on sait où sont, à chaque instant, toutes celles qui vont au
  // même rythme (moving). Les autres, et toutes quand on part du sol, peuvent être n'importe où sur leur trajet
  // (still) : on suppose qu'on a attendu le bon moment.
  const rhythm = plan.onMover ? plan.onMover.carrier.rhythm : null;
  const close = (m) => Math.abs(m.x - x) < 16 * T && Math.abs(m.y - y) < 24 * T;
  const still = movers.length ? movers.filter((m) => m.carrier.rhythm !== rhythm && close(m)) : movers;
  const moving = rhythm ? carriers.filter((cr) => cr.rhythm === rhythm && close(cr.at(plan.clock))) : [];
  // (les lianes qu'elle peut croiser : pas plus de 10 cases au-dessus d'elle, mais aussi loin en dessous qu'elle peut tomber)
  const nearVines = vines.length ? vines.filter((v) => Math.abs(v.x - x) < 16 * T && y < v.y + v.len + 10 * T) : vines;
  let ang = plan.ang || 0, angV = plan.angV || 0;
  for (let n = 0; n < 600; n++) {
    t += DT;
    if (!cut && t >= plan.hold) { cut = true; if (vy < -CUT) vy = -CUT; }
    vx = steer(vx, t < plan.tau ? plan.d : plan.rev ? -plan.d : 0, s);
    vy = Math.min(vy + G * DT, MAXF);
    // de côté : les murs
    if (vx !== 0) {
      x += vx * DT;
      const r0 = Math.floor(y / T), r1 = Math.floor((y + H - 0.01) / T);
      const c = vx > 0 ? Math.floor((x + W - 0.01) / T) : Math.floor(x / T);
      let wall = false;
      for (let r = r0; r <= r1 && !wall; r++) wall = solid(c, r);
      if (!wall && scree) wall = screeWall(y, c, r0, r1, vx > 0 ? c * T + 1 : (c + 1) * T - 1);
      if (wall) { x = vx > 0 ? c * T - W : (c + 1) * T; vx = 0; }
    }
    // de haut en bas : le sol, les planches qui bougent, les éboulis ; ou le plafond
    const prevBottom = y + H;
    y += vy * DT;
    const c0 = Math.floor((x + 0.01) / T), c1 = Math.floor((x + W - 0.01) / T);
    if (vy > 0) {
      const r = Math.floor((y + H) / T);
      let land = false;
      for (let c = c0; c <= c1; c++) if ((solid(c, r) && !underScree(x, y, c, r)) || (ledge(c, r) && prevBottom <= r * T + 0.5)) land = true;
      if (land) return landOn(x, r, vx, t, s);
      for (const m of still) {
        if (prevBottom > m.y + 0.5 || y + H < m.y || x + W <= m.x + 6 || x >= m.x + m.w - 6) continue;
        return hurt(x, m.y - H) || boxSolid(x, m.y - H) ? null : { mover: m.i, x, t };
      }
      // (comme Player.checkPlatforms, avec un peu de marge : pas tout au bord de la planche)
      for (const cr of moving) {
        const m = cr.at(plan.clock + t / PERIOD[rhythm]);
        if (prevBottom > m.y + 8 || y + H < m.y || x + W <= m.x + 8 || x >= m.x + cr.w - 8 || boxSolid(x, m.y - H)) continue;
        return hurt(x, m.y - H) ? null : { mover: m.i, x, t };
      }
      const sc = scree && screeAt(x + W / 2, y + H);
      if (sc && y + H >= sc.y && prevBottom <= sc.y + 2) return hurt(x, sc.y - H) ? null : { slide: sc.L, c: Math.floor((x + W / 2) / T), t };
    } else if (vy < 0) {
      const r = Math.floor(y / T);
      for (let c = c0; c <= c1; c++) if (solid(c, r)) { y = (r + 1) * T; vy = 0; break; }
    }
    if (hurt(x, y)) return null;
    const p = puffHit(x, y);
    if (p) return { puff: p, x: x + W / 2, y: y + H, t };
    // les lianes (celle qu'elle vient de lâcher : pas tout de suite, et là où son balancement l'a emmenée)
    if (plan.skip) {
      angV += (-((G * 0.9) / plan.skip.len) * Math.sin(ang) - angV * 1.1) * DT;
      ang = clamp(ang + angV * DT, -1.2, 1.2);
    }
    for (const v of nearVines) {
      if (v === plan.skip && t < VINE.wait) continue;
      const len = vineCatch(v, x, y, v === plan.skip ? ang : 0);
      if (len) return { vine: v, len, x, y, vx, vy, t };
    }
    if (touched) {
      const cc = Math.floor((x + W / 2) / T);
      touched.push(id(cc, Math.floor((y + 10) / T)), id(cc, Math.floor((y + H - 10) / T)));
    }
  }
  return null;
}

// Elle se pose en x sur le sol de la rangée r, avec l'élan vx.
function landOn(x, r, vx, t, s) {
  const y = r * T - H;
  if (hurt(x, y)) return null;
  // un champignon : boing ! (partie de la glace, elle garde son élan de glace ; des éboulis, non)
  if (springUnder(x, r)) return { spring: true, x, y, vx, t, air: s.air === 'ice' ? 'ice' : null };
  // sur la glace, avec de l'élan : elle dérape en freinant (la flèche de l'autre côté), jusqu'à s'arrêter (elle
  // accroche mieux en arrivant sur un sol ordinaire), ou jusqu'au bord : elle tombe alors avec ce qui lui reste d'élan
  if (!iceUnder(x, r)) return restCell(x, r, t);
  while (Math.abs(vx) > 40) {
    vx = approach(vx, 0, (iceUnder(x, r) ? ICE.turn : GROUND.acc * 1.6) * DT);
    x += vx * DT;
    const c = vx > 0 ? Math.floor((x + W - 0.01) / T) : Math.floor(x / T);
    if (solid(c, r - 1) || solid(c, r - 2)) { x = vx > 0 ? c * T - W : (c + 1) * T; break; }
    if (hurt(x, y)) return null;
    if (springUnder(x, r)) return { spring: true, x, y, vx, t, air: iceUnder(x, r) ? 'ice' : null };
    if (!floor(Math.floor((x + 0.01) / T), r) && !floor(Math.floor((x + W - 0.01) / T), r)) return { edge: true, x, y, vx, t };
  }
  return restCell(x, r, t);
}

// ---------------------------------------------------------------------
//  Un vol en pissenlit depuis (cx, les pieds en fy) : les cases où l'on peut se poser, et les cases traversées.
//  On balaie vers le bas par tranches de 12 px : l'intervalle des x possibles s'élargit, les murs le rognent.
//  Dans un courant d'air, on remonte jusqu'en haut du courant (et on y a le temps d'aller d'un bord à l'autre).
// ---------------------------------------------------------------------
const STEP = 12;
// (enlève [a, b] d'une liste d'intervalles)
const carve = (ivs, a, b) => {
  const out = [];
  for (const [x0, x1] of ivs) {
    if (x1 < a || x0 > b) { out.push([x0, x1]); continue; }
    if (x0 < a) out.push([x0, a]);
    if (x1 > b) out.push([b, x1]);
  }
  return out;
};
function glide(cx0, fy0) {
  const lands = new Map(), cells = [];
  const DX = (STEP / 80) * 250 * K.glide; // elle descend de 80 px par seconde, et avance de 250
  const starts = [{ iv: [[cx0, cx0]], y: Math.ceil((fy0 - K.lift) / STEP) * STEP }];
  const usedUp = new Set();
  while (starts.length) {
    let { iv, y } = starts.pop();
    for (let n = 0; n < 400 && iv.length && y <= rows * T; n++, y += STEP) {
      const r1 = Math.floor((y - 1) / T), r0 = Math.floor((y - H) / T);
      // les murs et les dangers rognent l'intervalle
      const lo = Math.min(...iv.map((i) => i[0])), hi = Math.max(...iv.map((i) => i[1]));
      for (let c = Math.floor((lo - 14) / T); c <= Math.floor((hi + 14) / T); c++) {
        let block = c < 0 || c >= cols;
        for (let r = r0; r <= r1 && !block; r++) {
          const ch = at(c, r);
          block = solid(c, r) || ((ch === '~' || ch === '_') && y > r * T + 14) || (ch === '^' && y > r * T + 16) || ch === 'v';
        }
        if (block) iv = carve(iv, c * T - 13, (c + 1) * T + 13);
      }
      // se poser
      if (y % T === 0) {
        const r = y / T;
        const next = [];
        for (const [x0, x1] of iv) {
          let cur = [[x0, x1]];
          for (let c = Math.floor((x0 - 13) / T); c <= Math.floor((x1 + 13) / T); c++) {
            if (!floor(c, r)) continue;
            if (stand(c, r - 1)) lands.set(id(c, r - 1), { c, r: r - 1 });
            cur = carve(cur, c * T - 13, (c + 1) * T + 13);
          }
          next.push(...cur);
        }
        iv = next;
      }
      for (const [x0, x1] of iv) for (let c = Math.floor(x0 / T); c <= Math.floor(x1 / T); c++) cells.push(id(c, r1), id(c, Math.floor((y - H + 8) / T)));
      // les courants d'air
      ups.forEach((z, k) => {
        const top = z[2] * T - 12;
        if (usedUp.has(k) || y <= top + 12) return;
        const za = z[0] * T, zb = (z[1] + 1) * T;
        if (!iv.some(([x0, x1]) => x1 >= za && x0 <= zb)) return;
        usedUp.add(k);
        starts.push({ iv: [[za, zb]], y: Math.ceil(top / STEP) * STEP });
      });
      // (l'intervalle s'élargit, et on recolle les morceaux qui se touchent)
      iv = iv.map(([x0, x1]) => [x0 - DX, x1 + DX]).sort((p, q) => p[0] - q[0]);
      const merged = [];
      for (const i of iv) {
        const last = merged[merged.length - 1];
        if (last && i[0] <= last[1]) last[1] = Math.max(last[1], i[1]);
        else merged.push(i);
      }
      iv = merged;
    }
  }
  return { lands: [...lands.values()], cells };
}

// ---------------------------------------------------------------------
//  Les noeuds, et ce qui arrive après un saut. Trois sortes de noeuds, chacun avec son numéro (sa clé) :
//  une case { c, r }, un endroit d'une planche qui bouge { mover }, une colonne d'une pente d'éboulis { slide, c }.
// ---------------------------------------------------------------------
const MBASE = rows * cols;
const SBASE = MBASE + movers.length;
const keyOf = (n) => (n.mover !== undefined ? MBASE + n.mover : n.slide ? SBASE + n.slide.i * cols + n.c : id(n.c, n.r));
const isCell = (k) => k < MBASE;
const isMover = (k) => k >= MBASE && k < SBASE;

// settle : de ce que renvoie sim jusqu'aux noeuds où elle finit par se tenir (après les rebonds, le vol, la liane…).
// Une liste de { node, parts (les cases traversées, un tableau par morceau du trajet), t (le temps passé en l'air),
// et pour le chemin : legs (les sauts l'un après l'autre : un plan de sim, ou { swing, n, len } : pendue à une liane
// tenue à len pixels de son attache, tenir ← ou → pendant n images), glide (là où commence un vol en pissenlit) }.
function settle(res, depth) {
  if (!res) return [];
  if (res.spring) return depth < 3 ? springOut(res, depth).map((o) => Object.assign({}, o, { t: o.t + res.t })) : [];
  if (res.vine) {
    const memo = vineOut(res);
    return memo.lands.map((l) => ({ node: l.node, parts: [memo.touched], t: 0, legs: l.legs, glide: l.glide }));
  }
  if (res.puff) {
    const g = glide(res.x, res.y);
    return g.lands.map((node) => ({ node, parts: [g.cells], t: 0, glide: [res.x, res.y] }));
  }
  if (res.edge) return depth < 3 ? edgeOut(res, depth) : [];
  return [{ node: res, parts: [], t: res.t }];
}
// (on ne garde qu'une arrivée par noeud)
function byNode(list) {
  const seen = new Map();
  for (const o of list) {
    const k = keyOf(o.node);
    if (!seen.has(k)) seen.set(k, Object.assign({}, o, { parts: o.parts.slice() }));
    else seen.get(k).parts.push(...o.parts);
  }
  return [...seen.values()];
}
// Tous les sauts de la liste plans depuis (x, y), jusqu'au bout.
function tryAll(x, y, list, extra, depth) {
  const out = [];
  for (const base of list) {
    const plan = extra ? Object.assign({}, base, extra) : base;
    const touched = [];
    for (const o of settle(sim(x, y, plan, touched), depth)) out.push(Object.assign({}, o, { parts: [touched, ...o.parts], legs: [plan, ...(o.legs || [])] }));
  }
  return out;
}

// Un rebond sur un champignon, arrivée en (x, y) avec l'élan vx : jamais plus haut que le haut du niveau (comme
// Player.springTile). Gardé en mémoire : on retombe souvent au même endroit.
const springPlans = [];
for (const d of [-1, 1]) {
  for (const tau of [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1.0, 9]) springPlans.push({ jump: 0, d, tau, rev: false });
  for (const tau of [0.2, 0.5]) springPlans.push({ jump: 0, d, tau, rev: true });
}
const springMemo = new Map();
function springOut(res, depth) {
  const key = [Math.round(res.x / 4), res.y, Math.round(res.vx / 20), res.air || '', depth].join(',');
  if (springMemo.has(key)) return springMemo.get(key);
  springMemo.set(key, []);
  const top = Math.sqrt(2 * G * Math.max(0, res.y - 10));
  const out = [];
  for (const v of SPRINGS) {
    const extra = { vx0: res.vx, vy0: -Math.min(v, top), air: res.air, after: 'spring', held: v === SPRINGS[1] };
    out.push(...tryAll(res.x, res.y, springPlans, extra, depth + 1));
  }
  const fin = byNode(out);
  springMemo.set(key, fin);
  return fin;
}

// Au bord de la glace, encore en train de déraper : elle tombe (en freinant, ou en se laissant aller), comme d'un
// sol ordinaire.
function edgeOut(res, depth) {
  const d = Math.sign(res.vx) || 1;
  const list = [{ d: -d, tau: 9 }, { d: -d, tau: 0.15 }, { d, tau: 9 }].map((p) => Object.assign({ vx0: res.vx, jump: 0, rev: false, after: 'edge' }, p));
  return byNode(tryAll(res.x, res.y, list, null, depth + 1)).map((o) => Object.assign(o, { t: o.t + res.t }));
}

// Pendue à une liane (comme Player.updateHanging et releaseGrapple) : elle se balance en tenant ← ou →, et à chaque
// instant elle peut se lancer (en sautant, avec ou sans flèche) ou se laisser tomber. Renvoie les noeuds où elle
// peut arriver (et comment), et les cases traversées.
// Gardé en mémoire par liane et par longueur tenue (à 12 px près) : on part toujours de la liane au repos, pendue
// tout droit. D'où qu'elle soit arrivée, elle peut attendre que ça se calme, puis se balancer de plus en plus fort :
// elle passe par tous les élans, des plus petits aux plus grands.
const vineMemo = new Map();
const VINE_GRIP = 12;
function vineOut(res) {
  const v = res.vine, len = clamp(Math.round(res.len / VINE_GRIP) * VINE_GRIP, VINE.min, v.len);
  const key = v.i + ':' + len;
  if (vineMemo.has(key)) return vineMemo.get(key);
  // (une liane qu'on est déjà en train d'essayer, en revenant d'une autre : rien de nouveau)
  vineMemo.set(key, { lands: [], touched: [] });
  const lands = new Map(), touched = [];
  const launch = (x, y, ang, angV, held, n) => {
    const vx = len * angV * Math.cos(ang), vy = -len * angV * Math.sin(ang);
    const launches = [{ vx0: vx, vy0: Math.max(vy, -1150), d: 1, tau: 0, drop: true }]; // ↓ : elle se laisse tomber
    for (const jd of held ? [held, 0] : [-1, 0, 1]) {
      const vx0 = clamp(vx + jd * 90, -520, 520), vy0 = Math.max(-1150, Math.min(vy, 0) * 0.5 - VINE.jump);
      for (const [d, tau] of jd ? [[jd, 9], [jd, 0.25], [jd, 0], [-jd, 9]] : [[1, 0], [1, 9], [-1, 9]]) launches.push({ vx0, vy0, d, tau, jd });
    }
    for (const o of tryAll(x, y, launches, { jump: 0, rev: false, boost: true, skip: v, ang, angV }, 1)) {
      if (!lands.has(keyOf(o.node))) lands.set(keyOf(o.node), { node: o.node, legs: [{ swing: held, n, len }, ...o.legs], glide: o.glide });
      for (const part of o.parts) touched.push(...part);
    }
  };
  const rest = [v.x - W / 2, v.y + len];
  if (boxSolid(...rest) || hurt(...rest)) return vineMemo.get(key);
  // (elle ne lâche pas tout de suite : VINE.hold)
  const first = Math.ceil(VINE.hold / DT);
  launch(...rest, 0, 0, 0, first);
  for (const held of [-1, 1]) {
    let ang = 0, angV = 0, [x, y] = rest;
    // (peaks : jusqu'où elle est montée à chaque balancement ; quand ça ne monte plus, on a tout vu)
    const peaks = [];
    for (let n = 0; n < 1200 && !(peaks.length > 4 && Math.abs(peaks[peaks.length - 1] - peaks[peaks.length - 3]) < 0.005); n++) {
      const before = angV;
      // (les flèches ne poussent que dans le sens où l'on va)
      const push = Math.sign(angV) === held || Math.abs(angV) < 0.6 ? (held * VINE.push) / len : 0;
      angV += (-(G / len) * 0.9 * Math.sin(ang) + push * Math.cos(ang) - angV * VINE.damp) * DT;
      const prev = ang;
      ang = clamp(ang + angV * DT, -VINE.max, VINE.max);
      if (Math.abs(ang) >= VINE.max) angV *= -0.2;
      const nx = v.x + len * Math.sin(ang) - W / 2, ny = v.y + len * Math.cos(ang);
      if (boxSolid(nx, ny)) { ang = prev; angV *= -0.3; } else { x = nx; y = ny; }
      if (before * angV < 0) peaks.push(ang);
      if (hurt(x, y)) break;
      const cc = Math.floor((x + W / 2) / T);
      touched.push(id(cc, Math.floor((y + 10) / T)), id(cc, Math.floor((y + H - 10) / T)));
      // (on essaie de se lancer 20 fois par seconde)
      if (n >= first && n % 6 === 0) launch(x, y, ang, angV, held, n);
    }
  }
  const memo = { lands: [...lands.values()], touched: [...new Set(touched)] };
  vineMemo.set(key, memo);
  return memo;
}

// ---------------------------------------------------------------------
//  Les sauts qu'on essaie
// ---------------------------------------------------------------------
// depuis le sol : à l'arrêt ou en marchant, saut plus ou moins tenu, direction plus ou moins gardée
const plans = [];
for (const d of [-1, 1]) {
  for (const vx0 of [0, d * RUN]) {
    for (const hold of [0.06, 0.16, 0.28, 9]) {
      for (const tau of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 9]) plans.push({ vx0, jump: 1, hold, d, tau, rev: false });
      for (const tau of [0.2, 0.4, 0.6]) plans.push({ vx0, jump: 1, hold, d, tau, rev: true });
    }
  }
}
// en tombant d'un bord
const fallPlans = [];
for (const d of [-1, 1]) {
  for (const vx0 of [d * 40, d * RUN]) {
    for (const tau of [0, 0.15, 0.3, 9]) fallPlans.push({ vx0, jump: 0, d, tau, rev: false });
    fallPlans.push({ vx0, jump: 0, d, tau: 0.05, rev: true });
  }
}
// depuis la glace : on y va un peu plus vite, et on garde son élan en l'air. (Seulement en sautant : au bord de la
// plaque, les pieds accrochent une dernière fois le coin, et l'on tombe comme d'un sol ordinaire.)
const icePlans = plans.map((p) => Object.assign({}, p, { air: 'ice', vx0: p.vx0 * ICE.top }));
// depuis les éboulis (l'élan vient de la pente : vx0 est donné au moment de sauter) : → va plus vite, ← freine
const slidePlans = [];
for (const hold of [0.06, 0.16, 0.28, 9]) {
  slidePlans.push({ jump: 1, hold, d: 1, tau: 0, rev: false });
  for (const d of [-1, 1]) for (const tau of [0.25, 0.5, 9]) slidePlans.push({ jump: 1, hold, d, tau, rev: false });
}
const slideFallPlans = [{ d: 1, tau: 0 }, { d: 1, tau: 9 }, { d: -1, tau: 9 }, { d: -1, tau: 0.3 }].map((p) => Object.assign({ jump: 0, rev: false }, p));
// contre un rocher de la pente : à l'arrêt
const rockPlans = plans.filter((p) => p.vx0 === 0);

// ---------------------------------------------------------------------
//  L'exploration : depuis le départ, tout ce qu'on peut atteindre
// ---------------------------------------------------------------------
const items = new Map(); // case -> lettre
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ('oyb!GZTLKFCSQ'.includes(grid[r][c])) items.set(id(c, r), grid[r][c]);
const got = new Set(); // les objets ramassés
const collect = (cells) => { for (const k of cells) if (items.has(k)) got.add(k); };
// (un même morceau de trajet sert à plusieurs arrivées : on ne le regarde qu'une fois)
const seenParts = new WeakSet();
const collectParts = (parts) => { for (const p of parts) if (!seenParts.has(p)) { seenParts.add(p); collect(p); } };

const edges = new Map(); // noeud -> Set(noeuds)
const how = new Map(); // « a>b » -> comment on y va (pour le chemin)
const reach = new Set();
const todo = [];
function addEdge(a, b, info) {
  const ek = a + '>' + b;
  if (!how.has(ek) || (how.get(ek).kind !== 'walk' && info.kind === 'walk')) how.set(ek, info);
  if (!edges.has(a)) edges.set(a, new Set());
  edges.get(a).add(b);
}
// On arrive (ou pas) : outs vient de tryAll.
function arrive(from, outs, info) {
  for (const o of outs) {
    collectParts(o.parts);
    addEdge(from, keyOf(o.node), Object.assign({ plan: o.legs && o.legs[0], legs: o.legs, glide: o.glide, t: o.t }, info));
    todo.push(o.node);
  }
}
const jumpFrom = (from, x, y, list, extra, kind) => arrive(from, tryAll(x, y, list, extra, 0), { kind, x, y });

// Depuis une case.
function exploreCell(n, k) {
  for (const rr of [n.r, n.r - 1]) collect([id(n.c, rr)]);
  const y = (n.r + 1) * T - H;
  // un pissenlit planté ici ?
  const here = puffHit(n.c * T + 10, y);
  if (here) arrive(k, settle({ puff: here, x: n.c * T + 24, y: (n.r + 1) * T }, 0), { kind: 'puff' });
  // marcher
  for (const d of [-1, 1]) {
    const free = !solid(n.c + d, n.r) && !solid(n.c + d, n.r - 1);
    if (stand(n.c + d, n.r)) {
      addEdge(k, id(n.c + d, n.r), { kind: 'walk' });
      todo.push({ c: n.c + d, r: n.r });
    } else if (free && at(n.c + d, n.r + 1) === 'M') {
      // on marche sur un champignon : dès qu'on y pose le pied, on rebondit
      const x = d > 0 ? (n.c + 1) * T - W + 2 : n.c * T - 3;
      for (const vx of [d * RUN, d * 60]) arrive(k, settle({ spring: true, x, y, vx, t: 0 }, 0), { kind: 'walkM', x, y, vx });
    } else if (free && !floor(n.c + d, n.r + 1)) {
      // on tombe du bord
      const x = d > 0 ? (n.c + 1) * T + 1 : n.c * T - W - 1;
      jumpFrom(k, x, y, fallPlans.filter((p) => p.d === d), null, 'fall');
    }
  }
  // un bloc lutin posé sur un trou : on l'écrase et on tombe
  if (LUTIN.includes(at(n.c, n.r + 1)) && !floor(n.c, n.r + 2)) {
    jumpFrom(k, n.c * T + 10, (n.r + 2) * T - H + 2, [{ vx0: 0, jump: 0, d: 1, tau: 0, rev: false }], null, 'pound');
  }
  // sauter (de trois endroits de la case ; pas d'un endroit où l'on serait dans un mur, ou avec déjà un pied sur
  // un champignon)
  for (const off of [-8, 10, 28]) {
    const x = n.c * T + off;
    if (hurt(x, y) || boxSolid(x, y) || springUnder(x, n.r + 1)) continue;
    jumpFrom(k, x, y, iceUnder(x, n.r + 1) ? icePlans : plans, null, 'jump');
  }
}

// Depuis un endroit d'une planche qui bouge : on se laisse emporter, on saute, on tombe du bord.
function exploreMover(m, k) {
  const y = m.y - H;
  const xs = [m.x + 2, m.x + m.w / 2 - W / 2, m.x + m.w - W - 2];
  // (là où la planche passe dans un mur ou sous un plafond, elle ne nous emporte pas)
  if (hurt(xs[1], y) || boxSolid(xs[1], y)) return;
  for (const x of xs) collect([id(Math.floor((x + W / 2) / T), Math.floor((y + 10) / T)), id(Math.floor((x + W / 2) / T), Math.floor((y + H - 10) / T))]);
  for (const j of m.next) {
    addEdge(k, MBASE + j, { kind: 'ride' });
    todo.push({ mover: j });
  }
  // (à chaque moment où la planche passe ici : une plateforme, à l'aller et au retour)
  for (const clock of m.clocks) {
    const extra = { onMover: m, clock };
    for (const x of xs) if (!boxSolid(x, y)) jumpFrom(k, x, y, plans, extra, 'jump');
    for (const d of [-1, 1]) jumpFrom(k, d > 0 ? m.x + m.w + 1 : m.x - W - 1, y, fallPlans.filter((p) => p.d === d), extra, 'fall');
  }
}

// Depuis une colonne d'une pente d'éboulis : on glisse vers la colonne d'après, ou bien on saute (plus ou moins
// vite), on s'arrête contre un rocher (et on saute de là), on tombe dans un trou ou au bout de la pente.
function exploreSlide(n, k) {
  const L = n.slide;
  const air = { air: 'slide', k: L.k };
  const feet = (x) => lineY(L, x + W / 2);
  const onLine = (x) => !!screeAt(x + W / 2, feet(x), L);
  const xc = n.c * T + T / 2 - W / 2;
  if (!onLine(xc) || hurt(xc, feet(xc) - H)) return;
  collect([id(n.c, Math.floor((feet(xc) - H + 10) / T)), id(n.c, Math.floor((feet(xc) - 10) / T))]);
  const speeds = [-1, 0, 1].map((dir) => slideSpeed(L.k, dir));
  // sauter en glissant
  for (const off of [-16, 0, 16]) {
    const x = xc + off;
    if (!onLine(x)) continue;
    for (const vx0 of speeds) jumpFrom(k, x, feet(x) - H, slidePlans, Object.assign({ vx0 }, air), 'slideJump');
  }
  // la suite de la pente : un rocher ? (la terre juste sous les pieds n'est pas un mur)
  const nx = xc + T, ny = feet(nx) - H;
  const wallCol = Math.floor((nx + W - 0.01) / T);
  let rock = false;
  for (let r = Math.floor(ny / T); r <= Math.floor((ny + H - 0.01) / T) && !rock; r++) {
    rock = solid(wallCol, r) && !(scree.fill[id(wallCol, r)] && r * T > ny + H - SLIDE.stick);
  }
  if (rock) {
    const x = wallCol * T - W;
    if (onLine(x)) jumpFrom(k, x, feet(x) - H, rockPlans, air, 'jump');
  } else if (onLine(nx)) {
    const next = { slide: L, c: n.c + 1 };
    addEdge(k, keyOf(next), { kind: 'slide' });
    todo.push(next);
  } else {
    // un trou, ou le bas de la pente : elle continue sur son élan
    const x = (n.c + 1) * T - W / 2 + 1;
    for (const vx0 of speeds) jumpFrom(k, x, feet(x) - H, slideFallPlans, Object.assign({ vx0 }, air), 'slideEnd');
  }
}

const start = (() => {
  const from = pair('from');
  if (from) return { c: from[0], r: from[1] };
  for (let r = 0; r < rows; r++) {
    const c = grid[r].indexOf('P');
    if (c < 0) continue;
    let sr = r;
    while (!floor(c, sr + 1) && sr < rows) sr++;
    return { c, r: sr };
  }
  return null;
})();
if (!start) { console.log('pas de départ P'); process.exit(1); }
todo.push(start);
while (todo.length) {
  const n = todo.pop();
  const k = keyOf(n);
  if (reach.has(k)) continue;
  reach.add(k);
  if (n.mover !== undefined) exploreMover(movers[n.mover], k);
  else if (n.slide) exploreSlide(n, k);
  else exploreCell(n, k);
}

// ---------------------------------------------------------------------
//  L'arrivée, et d'où l'on peut encore la rejoindre
// ---------------------------------------------------------------------
let goal = null;
const asked = pair('goal');
if (asked) goal = { c: asked[0], r: asked[1] };
for (let r = 0; r < rows && !goal; r++) for (let c = 0; c < cols && !goal; c++) if ('GZ&'.includes(grid[r][c])) goal = { c, r };
// (devant un boss : deux cases avant lui)
if (lv.boss && !asked) for (let r = 0; r < rows; r++) { const c = grid[r].indexOf('&'); if (c >= 0) goal = { c: c - 2, r }; }
if (!goal) {
  for (let c = cols - 1; c >= 0 && !goal; c--) for (let r = 0; r < rows && !goal; r++) if (stand(c, r) && !(lv.terrier && r >= lv.terrier - 1)) goal = { c, r };
  console.log('(pas d\'arrivée : on vise le bout, ' + goal.c + ',' + goal.r + ')');
}
let goalR = goal.r;
while (!floor(goal.c, goalR + 1) && goalR < rows) goalR++;
const goalKey = id(goal.c, goalR);

const back = new Map();
for (const [a, set] of edges) for (const b of set) { if (!back.has(b)) back.set(b, []); back.get(b).push(a); }
const canWin = new Set();
const stack = [goalKey];
while (stack.length) {
  const k = stack.pop();
  if (canWin.has(k)) continue;
  canWin.add(k);
  for (const a of back.get(k) || []) stack.push(a);
}
const cells = [...reach].filter(isCell);
const stuck = cells.filter((k) => !canWin.has(k));
const colOf = (k) => k % cols, rowOf = (k) => Math.floor(k / cols);
const cr = (k) => `${colOf(k)},${rowOf(k)}`;

// ---------------------------------------------------------------------
//  Le compte rendu
// ---------------------------------------------------------------------
const far = lv.grimpe ? 'plus haut : rangée ' + Math.min(...cells.map(rowOf)) : 'plus loin : colonne ' + Math.max(...cells.map(colOf));
console.log(`${lv.name} [${mode}] ${cols}x${rows} : arrivée ${reach.has(goalKey) ? 'ATTEINTE' : `PAS ATTEINTE (${far})`}`);
errs.forEach((e) => console.log('ERREUR', e));
const miss = [...items].filter(([k, ch]) => !got.has(k) && !LUTIN.includes(ch));
console.log('objets pas attrapés :', miss.map(([k, ch]) => ch + '@' + cr(k)).join(' ') || 'aucun');
if (stuck.length) {
  const byRow = {};
  stuck.sort((a, b) => a - b).forEach((k) => { (byRow[rowOf(k)] = byRow[rowOf(k)] || []).push(colOf(k)); });
  console.log('CULS-DE-SAC (on ne peut plus rejoindre l\'arrivée) :', Object.entries(byRow).map(([r, cs]) => `rangée ${r}: ${cs[0]}..${cs[cs.length - 1]} (${cs.length})`).join(' ; '));
}

// ce qui doit être posé par terre
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const ch = grid[r][c];
    if ('EOmlT!GPDRhs'.includes(ch) && !floor(c, r + 1) && !(ch === 'l' && lv.terrier)) console.log(`pas posé par terre : ${ch}@${c},${r}`);
    if (LUTIN.includes(ch) && !floor(c, r + 1) && !stand(c, r + 3) && !stand(c, r + 2) && !stand(c, r - 1)) console.log(`bloc lutin hors d'atteinte ? ${ch}@${c},${r}`);
  }
}
const flowers = lv.map.join('').split('T').length - 1;
if (flowers !== lv.talk.length) console.log(`FLEURS : ${flowers} T pour ${lv.talk.length} phrases`);

// ce que ce niveau contient et que l'outil ne sait pas jouer : le verdict n'en tient pas compte
const all = lv.map.join('');
const letters = (set) => [...set].filter((ch) => all.includes(ch)).join(' ');
const unknown = [];
if (letters('EORDWVYUmhsfa01')) unknown.push(`les ennemis (${letters('EORDWVYUmhsfa01')})`);
if (all.includes('A')) unknown.push('les stalactites (A)');
if (lv.boss) unknown.push('le boss');
if (lv.storms && lv.storms.length) unknown.push('les éclairs');
if (lv.winds && lv.winds.length) unknown.push('le vent');
if (lv.crue) unknown.push('l\'eau qui monte');
if (lv.volcan) unknown.push('les pierres de lave');
if (all.includes('z')) unknown.push('les paratonnerres qui grésillent (z)');
if (all.includes('c')) unknown.push('les nénuphars qui coulent (c)');
const theme = lv.theme || (WORLDS[lv.world - 1] || {}).theme;
if (all.includes('~') && (theme === 'candy' || theme === 'marsh')) unknown.push(`${theme === 'marsh' ? 'la boue' : 'le chocolat'} où l'on s'enfonce (~ : compté comme de la lave)`);
if (all.includes('@')) unknown.push('la moustache-grappin (@)');
if (all.includes('%')) unknown.push('les bouchons en chocolat (%)');
if (scree && scree.all.some((L) => L.k <= 0)) unknown.push('une glissade qui ne descend pas vers la droite');
if (unknown.length) console.log('non modélisé dans ce niveau :', unknown.join(', '));

// un bout de carte : une virgule là où elle peut se tenir, un x pour un cul-de-sac
if (show1 > show0) {
  const mark = (c, r) => { const k = id(c, r); return grid[r][c] !== '.' ? grid[r][c] : !reach.has(k) ? '.' : canWin.has(k) ? ',' : 'x'; };
  // (dans un niveau où l'on grimpe : des rangées, sur toute la largeur ; sinon des colonnes, sur toute la hauteur)
  const [r0, r1, c0, c1] = lv.grimpe ? [show0, Math.min(show1, rows - 1), 0, cols] : [0, rows - 1, show0, Math.min(show1, cols)];
  let ruler = '';
  for (let c = c0; c < c1; c++) ruler += c % 10 === 0 ? String((c / 10) % 10 | 0) : ' ';
  const numbered = rows > 30;
  console.log((numbered ? '    ' : '') + ruler);
  for (let r = r0; r <= r1; r++) {
    let line = '';
    for (let c = c0; c < c1; c++) line += mark(c, r);
    // (dans un niveau très haut, on saute les rangées de ciel)
    if (numbered && !lv.grimpe && !/[^.]/.test(line)) continue;
    console.log((numbered ? String(r).padStart(3) + ' ' : '') + line);
  }
}

// le chemin jusqu'à l'arrivée, pour le rejouer dans le vrai jeu (path=fichier) : le plus court, en nombre d'étapes
const pathFile = option('path');
if (pathFile && reach.has(goalKey)) {
  const startKey = keyOf(start);
  const prev = new Map([[startKey, null]]);
  const queue = [startKey];
  for (let i = 0; i < queue.length && queue[i] !== goalKey; i++) {
    for (const b of edges.get(queue[i]) || []) if (!prev.has(b)) { prev.set(b, queue[i]); queue.push(b); }
  }
  // (une case : [colonne, rangée] ; une planche qui bouge ou des éboulis : de quoi les retrouver)
  const name = (k) => {
    if (isCell(k)) return [colOf(k), rowOf(k)];
    if (isMover(k)) { const m = movers[k - MBASE]; return { mover: m.kind, src: m.src, j: m.j, x: m.x, y: m.y }; }
    return { slide: Math.floor((k - SBASE) / cols), c: (k - SBASE) % cols };
  };
  const out = [];
  for (let k = goalKey; prev.get(k) != null; k = prev.get(k)) {
    const f = prev.get(k);
    const info = Object.assign({}, how.get(f + '>' + k), { from: name(f), to: name(k) });
    // (dans le fichier, pas besoin de la planche ou de la liane entières)
    const light = (plan) => plan && Object.assign({}, plan, { onMover: undefined, skip: undefined });
    info.plan = light(info.plan);
    info.legs = info.legs && info.legs.map(light);
    out.push(info);
  }
  out.reverse();
  fs.writeFileSync(pathFile, JSON.stringify(out));
  const count = {};
  out.forEach((e) => { count[e.kind] = (count[e.kind] || 0) + 1; });
  console.log('chemin :', out.length, 'étapes', JSON.stringify(count));
}
