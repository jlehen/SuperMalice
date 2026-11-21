#!/usr/bin/env node
// Vérifie qu'un niveau est franchissable. À lancer depuis le dossier du jeu :
//   node outils/franchissable.js <numéro du niveau dans LEVELS> [easy|full] [première colonne, dernière colonne]
// Il simule les sauts de Malice (en marchant, sans courir) et les vols en pissenlit, depuis chaque case où elle
// peut se tenir, et dit : si l'arrivée est atteinte, quels objets sont hors d'atteinte, et s'il y a des culs-de-sac
// (des endroits d'où l'on ne peut plus rejoindre l'arrivée). "easy" (par défaut) : elle saute un peu moins bien
// qu'en vrai, pour garder de la marge ; "full" : comme en vrai. Avec deux colonnes, il affiche ce bout de carte
// (une virgule là où elle peut se tenir, un x pour un cul-de-sac). from=colonne,rangée : part d'ailleurs ;
// path=fichier : écrit le chemin trouvé (pour le rejouer dans le vrai jeu).
// Il ne connaît que le sol, les plateformes, la lave, les ronces, l'eau, les nénuphars, les pissenlits et les
// courants d'air : ni les ennemis, ni les plateformes qui bougent, ni les champignons.
const fs = require('fs');
const L = new Function(fs.readFileSync('js/levels.js', 'utf8') + ';return LEVELS')();
const li = +process.argv[2];
const mode = process.argv[3] || 'easy';
const lv = L[li];
const map = lv.map;
const rows = map.length, cols = map[0].length;
const T = 48, W = 28, H = 56;
const K = mode === 'easy' ? { jump: 0.95, run: 0.93, glide: 2.6 } : { jump: 1, run: 1, glide: 3.1 };
const G = 2300, JUMP = 950 * K.jump, RUN = 285 * K.run, CUT = 520, ACC = 1600, DEC = 900, MAXF = 1000;
const errs = [];
map.forEach((row, r) => { if (row.length !== cols) errs.push(`ligne ${r} : ${row.length} colonnes au lieu de ${cols}`); });
const at = (c, r) => (r < 0 ? '.' : r >= rows ? (lv.terrier ? '#' : ' ') : c < 0 || c >= cols ? '#' : map[r][c]);
const SOLID = '#BMLFKCSu+';
const solid = (c, r) => SOLID.includes(at(c, r));
const ledge = (c, r) => '-=nc'.includes(at(c, r));
const floor = (c, r) => solid(c, r) || ledge(c, r);
const ups = lv.updrafts || [];
// un danger touche-t-il la boîte ?
function hurt(x, y) {
  const c0 = Math.floor((x + 3) / T), c1 = Math.floor((x + W - 3) / T);
  const r0 = Math.floor(y / T), r1 = Math.floor((y + H - 0.01) / T);
  if (y > rows * T + 20) return true;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const ch = at(c, r);
    if (ch === '~' && y + H > r * T + (at(c, r - 1) === '~' ? 0 : 20)) return true;
    if (ch === '_' && y + H > r * T + 14) return true;
    if (ch === '^' && y + H > r * T + 16) return true;
    if (ch === 'v' && y < r * T + 34) return true;
  }
  return false;
}
// noeuds : la case des pieds (c, r) : sol en (c, r+1)
const id = (c, r) => r * cols + c;
const stand = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows && floor(c, r + 1) && !solid(c, r) && !solid(c, r - 1) && !hurt(c * T + 10, (r + 1) * T - H);
// pissenlits
const puffs = [];
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (map[r][c] === '*') {
  const planted = floor(c, r + 1);
  const cx = c * T + 24;
  puffs.push(planted ? { x: cx - 20, y: (r + 1) * T - 82 - 28 - 96, w: 40, h: 82 + 28 + 96, c, r } : { x: cx - 26, y: r * T + 24 - 6 - 26, w: 52, h: 62, c, r });
}
const puffHit = (x, y) => puffs.find((p) => x < p.x + p.w && x + W > p.x && y < p.y + p.h && y + H > p.y);

const items = new Map(); // case -> lettre
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ('oyb!GZTLKFCSQ'.includes(map[r][c])) items.set(id(c, r), map[r][c]);

// simulation d'un saut. plan : { vx0, jump (0 = on tombe), hold (durée du saut tenu), d, tau (on lâche la direction), rev }
function sim(x, y, plan, touched) {
  let vx = plan.vx0, vy = plan.jump ? -JUMP : 0, t = 0, cut = false;
  const dt = 1 / 120;
  for (let n = 0; n < 400; n++) {
    t += dt;
    if (plan.jump && !cut && t >= plan.hold) { cut = true; if (vy < -CUT) vy = -CUT; }
    let dir = t < plan.tau ? plan.d : plan.rev ? -plan.d : 0;
    const target = dir * RUN;
    let acc = dir ? ACC : DEC;
    if (dir && Math.sign(vx) === -dir) acc *= 1.6;
    if (vx < target) vx = Math.min(target, vx + acc * dt); else if (vx > target) vx = Math.max(target, vx - acc * dt);
    vy = Math.min(vy + G * dt, MAXF);
    // horizontal
    if (vx !== 0) {
      x += vx * dt;
      const r0 = Math.floor(y / T), r1 = Math.floor((y + H - 0.01) / T);
      const c = vx > 0 ? Math.floor((x + W - 0.01) / T) : Math.floor(x / T);
      for (let r = r0; r <= r1; r++) if (solid(c, r)) { x = vx > 0 ? c * T - W : (c + 1) * T; vx = 0; break; }
    }
    const prevBottom = y + H;
    y += vy * dt;
    const c0 = Math.floor((x + 0.01) / T), c1 = Math.floor((x + W - 0.01) / T);
    if (vy > 0) {
      const r = Math.floor((y + H) / T);
      let land = false;
      for (let c = c0; c <= c1; c++) if (solid(c, r) || (ledge(c, r) && prevBottom <= r * T + 0.5)) land = true;
      if (land) {
        y = r * T - H;
        if (hurt(x, y)) return null;
        // (il faut que le milieu soit bien posé : sinon on compte la case la plus proche qui porte)
        let c = Math.floor((x + W / 2) / T);
        if (!floor(c, r)) c = floor(c0, r) ? c0 : c1;
        return stand(c, r - 1) ? { c, r: r - 1 } : null;
      }
    } else if (vy < 0) {
      const r = Math.floor(y / T);
      for (let c = c0; c <= c1; c++) if (solid(c, r)) { y = (r + 1) * T; vy = 0; break; }
    }
    if (hurt(x, y)) return null;
    const p = puffHit(x, y);
    if (p) return { puff: p, x: x + W / 2, y: y + H };
    if (touched) {
      const cc = Math.floor((x + W / 2) / T);
      touched.push(id(cc, Math.floor((y + 10) / T)), id(cc, Math.floor((y + H - 10) / T)));
    }
  }
  return null;
}

// vol en pissenlit depuis (cx, pieds en fy) : renvoie les cases où l'on peut se poser + les cases traversées.
// On balaie vers le bas par tranches de 12 px : l'intervalle des x possibles s'élargit, les murs le rognent.
function glide(cx0, fy0) {
  const lands = new Map(), cells = [];
  const DX = 12 / 80 * 250 * (mode === 'easy' ? 0.85 : 1);
  const starts = [{ iv: [[cx0, cx0]], y: Math.ceil((fy0 - (mode === 'easy' ? 6 : 14)) / 12) * 12 }];
  const usedUp = new Set();
  const cut = (ivs, a, b) => { const out = []; for (const [x0, x1] of ivs) { if (x1 < a || x0 > b) { out.push([x0, x1]); continue; } if (x0 < a) out.push([x0, a]); if (x1 > b) out.push([b, x1]); } return out; };
  while (starts.length) {
    let { iv, y } = starts.pop();
    for (let n = 0; n < 400 && iv.length; n++, y += 12) {
      if (y > rows * T) break;
      const r1 = Math.floor((y - 1) / T), r0 = Math.floor((y - H) / T);
      // les murs et les dangers rognent l'intervalle
      const lo = Math.min(...iv.map((i) => i[0])), hi = Math.max(...iv.map((i) => i[1]));
      for (let c = Math.floor((lo - 14) / T); c <= Math.floor((hi + 14) / T); c++) {
        let block = c < 0 || c >= cols;
        for (let r = r0; r <= r1 && !block; r++) {
          const ch = at(c, r);
          if (solid(c, r)) block = true;
          else if ((ch === '~' || ch === '_') && y > r * T + 14) block = true;
          else if (ch === '^' && y > r * T + 16) block = true;
          else if (ch === 'v') block = true;
        }
        if (block) iv = cut(iv, c * T - 13, (c + 1) * T + 13);
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
            cur = cut(cur, c * T - 13, (c + 1) * T + 13);
          }
          next.push(...cur);
        }
        iv = next;
      }
      for (const [x0, x1] of iv) for (let c = Math.floor(x0 / T); c <= Math.floor(x1 / T); c++) { cells.push(id(c, r1), id(c, Math.floor((y - H + 8) / T))); }
      // les courants d'air
      for (let k = 0; k < ups.length; k++) {
        const z = ups[k];
        const top = z[2] * T - 12;
        if (usedUp.has(k) || y <= top + 12) continue;
        const za = z[0] * T, zb = (z[1] + 1) * T;
        const sub = iv.filter(([x0, x1]) => x1 >= za && x0 <= zb).map(([x0, x1]) => [Math.max(x0, za), Math.min(x1, zb)]);
        if (sub.length) { usedUp.add(k); starts.push({ iv: sub, y: Math.ceil(top / 12) * 12 }); }
      }
      iv = iv.map(([x0, x1]) => [x0 - DX, x1 + DX]);
      // (on recolle les morceaux qui se touchent)
      iv.sort((p, q) => p[0] - q[0]);
      const merged = [];
      for (const i of iv) { const l = merged[merged.length - 1]; if (l && i[0] <= l[1]) l[1] = Math.max(l[1], i[1]); else merged.push(i); }
      iv = merged;
    }
  }
  return { lands: [...lands.values()], cells };
}

const edges = new Map(); // noeud -> Set(noeuds)
const reach = new Set();
const got = new Set(); // objets ramassés
const P = (() => { for (let r = 0; r < rows; r++) { const c = map[r].indexOf('P'); if (c >= 0) return { c, r }; } })();
if (!P) { console.log('pas de départ P'); process.exit(1); }
let startR = P.r; while (!floor(P.c, startR + 1) && startR < rows) startR++;
const todo = [{ c: P.c, r: startR }];
const extra = process.argv.find((a) => a.startsWith('from='));
if (extra) { const [c, r] = extra.slice(5).split(',').map(Number); todo.length = 0; todo.push({ c, r }); }
const plans = [];
for (const d of [-1, 1]) {
  for (const vx0 of [0, d * RUN]) for (const hold of [0.06, 0.16, 0.28, 9]) {
    for (const tau of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 9]) plans.push({ vx0, jump: 1, hold, d, tau, rev: false });
    for (const tau of [0.2, 0.4, 0.6]) plans.push({ vx0, jump: 1, hold, d, tau, rev: true });
  }
}
const fallPlans = [];
for (const d of [-1, 1]) for (const vx0 of [d * 40, d * RUN]) {
  for (const tau of [0, 0.15, 0.3, 9]) fallPlans.push({ vx0, jump: 0, d, tau, rev: false });
  fallPlans.push({ vx0, jump: 0, d, tau: 0.05, rev: true });
}
const par = new Map();
function addEdge(a, b, info) { const ek = a + '>' + b; if (!par.has(ek) || (par.get(ek).kind !== 'walk' && info.kind === 'walk')) par.set(ek, info); let s = edges.get(a); if (!s) edges.set(a, (s = new Set())); s.add(b); }
function arrive(from, res, touched, info) {
  if (!res) return;
  if (res.puff) {
    const g = glide(res.x, res.y);
    if (!g.lands.length) return;
    for (const t of touched) if (items.has(t)) got.add(t);
    for (const t of g.cells) if (items.has(t)) got.add(t);
    for (const n of g.lands) { addEdge(from, id(n.c, n.r), Object.assign({ glide: [res.x, res.y] }, info)); todo.push(n); }
    return;
  }
  for (const t of touched) if (items.has(t)) got.add(t);
  addEdge(from, id(res.c, res.r), info);
  todo.push(res);
}
while (todo.length) {
  const n = todo.pop();
  const k = id(n.c, n.r);
  if (reach.has(k)) continue;
  reach.add(k);
  for (const rr of [n.r, n.r - 1]) if (items.has(id(n.c, rr))) got.add(id(n.c, rr));
  const y = (n.r + 1) * T - H;
  // un pissenlit planté ici ?
  const here = puffHit(n.c * T + 10, y);
  if (here) arrive(k, { puff: here, x: n.c * T + 24, y: (n.r + 1) * T }, [], { kind: 'puff' });
  // marcher
  for (const d of [-1, 1]) {
    if (stand(n.c + d, n.r)) { addEdge(k, id(n.c + d, n.r), { kind: 'walk' }); todo.push({ c: n.c + d, r: n.r }); }
    else if (!solid(n.c + d, n.r) && !solid(n.c + d, n.r - 1) && !floor(n.c + d, n.r + 1)) {
      // on tombe du bord
      const x = d > 0 ? (n.c + 1) * T + 1 : n.c * T - W - 1;
      for (const p of fallPlans) if (p.d === d) { const touched = []; arrive(k, sim(x, y, p, touched), touched, { kind: 'fall', x, y, plan: p }); }
    }
  }
  // un bloc lutin posé sur un trou : on l'écrase et on tombe
  if ('LKFCS'.includes(at(n.c, n.r + 1)) && !floor(n.c, n.r + 2)) {
    const touched = []; arrive(k, sim(n.c * T + 10, (n.r + 2) * T - H + 2, { vx0: 0, jump: 0, d: 1, tau: 0, rev: false }, touched), touched, { kind: 'pound' });
  }
  // sauter
  for (const off of [-8, 10, 28]) {
    const x = n.c * T + off;
    if (hurt(x, y)) continue;
    for (const p of plans) { const touched = []; arrive(k, sim(x, y, p, touched), touched, { kind: 'jump', x, y, plan: p }); }
  }
}
// l'arrivée
let goal = null;
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ('GZ&'.includes(map[r][c]) && !goal) goal = { c, r };
if (lv.boss) { for (let r = 0; r < rows; r++) { const c = map[r].indexOf('&'); if (c >= 0) goal = { c: c - 2, r }; } }
if (!goal) { for (let c = cols - 1; c >= 0 && !goal; c--) for (let r = 0; r < rows; r++) if (stand(c, r) && !(lv.terrier && r >= lv.terrier - 1)) { goal = { c, r }; break; } console.log('(pas d\'arrivée : on vise le bout, ' + goal.c + ',' + goal.r + ')'); }
let goalR = goal.r; while (!floor(goal.c, goalR + 1) && goalR < rows) goalR++;
const gk = id(goal.c, goalR);
// d'où peut-on rejoindre l'arrivée ?
const back = new Map();
for (const [a, s] of edges) for (const b of s) { let l = back.get(b); if (!l) back.set(b, (l = [])); l.push(a); }
const canWin = new Set();
const st = [gk];
while (st.length) { const k = st.pop(); if (canWin.has(k)) continue; canWin.add(k); for (const a of back.get(k) || []) st.push(a); }
const stuck = [...reach].filter((k) => !canWin.has(k));
const cr = (k) => `${k % cols},${Math.floor(k / cols)}`;
console.log(`${lv.name} [${mode}] ${cols}x${rows} : arrivée ${reach.has(gk) ? 'ATTEINTE' : 'PAS ATTEINTE (plus loin : colonne ' + Math.max(...[...reach].map((k) => k % cols)) + ')'}`);
errs.forEach((e) => console.log('ERREUR', e));
const miss = [...items].filter(([k, ch]) => !got.has(k) && !'LKFCS'.includes(ch));
console.log('objets pas attrapés :', miss.map(([k, ch]) => ch + '@' + cr(k)).join(' ') || 'aucun');
if (stuck.length) {
  const byRow = {};
  stuck.sort((a, b) => a - b).forEach((k) => { const r = Math.floor(k / cols); (byRow[r] = byRow[r] || []).push(k % cols); });
  console.log('CULS-DE-SAC (on ne peut plus rejoindre l\'arrivée) :', Object.entries(byRow).map(([r, cs]) => `rangée ${r}: ${cs[0]}..${cs[cs.length - 1]} (${cs.length})`).join(' ; '));
}
// lint : ce qui doit être posé par terre
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
  const ch = map[r][c];
  if ('EOmlT!GPDRhs'.includes(ch) && !floor(c, r + 1) && !(ch === 'l' && lv.terrier)) console.log(`pas posé par terre : ${ch}@${c},${r}`);
  if ('LKFCS'.includes(ch) && !floor(c, r + 1) && !stand(c, r + 3) && !stand(c, r + 2) && !stand(c, r - 1)) console.log(`bloc lutin hors d'atteinte ? ${ch}@${c},${r}`);
}
const nT = map.join('').split('T').length - 1;
if (nT !== lv.talk.length) console.log(`FLEURS : ${nT} T pour ${lv.talk.length} phrases`);
const c0 = +process.argv[4], c1 = +process.argv[5];
if (c1 > c0) {
  let ruler = ''; for (let c = c0; c < c1; c++) ruler += c % 10 === 0 ? String((c / 10) % 10 | 0) : ' ';
  console.log(ruler);
  for (let r = 0; r < rows; r++) {
    let s = '';
    for (let c = c0; c < c1; c++) { const k = id(c, r); s += map[r][c] === '.' ? (reach.has(k) ? (canWin.has(k) ? ',' : 'x') : '.') : map[r][c]; }
    console.log(s);
  }
}

// le chemin jusqu'à l'arrivée, pour le rejouer dans le vrai jeu (path=fichier)
const pf = process.argv.find((a) => a.startsWith('path='));
if (pf && reach.has(gk)) {
  // (le plus court, en nombre de sauts)
  const startK = [...reach][0];
  const prev = new Map([[startK, null]]);
  const q = [startK];
  for (let i = 0; i < q.length; i++) { const k = q[i]; if (k === gk) break; for (const b2 of edges.get(k) || []) if (!prev.has(b2)) { prev.set(b2, k); q.push(b2); } }
  const out = [];
  for (let k = gk; prev.get(k) != null; k = prev.get(k)) { const f = prev.get(k); out.push(Object.assign({}, par.get(f + '>' + k), { to: [k % cols, Math.floor(k / cols)], from: [f % cols, Math.floor(f / cols)] })); }
  out.reverse();
  fs.writeFileSync(pf.slice(5), JSON.stringify(out));
  const n = {}; out.forEach((e) => (n[e.kind] = (n[e.kind] || 0) + 1));
  console.log('chemin :', out.length, 'étapes', JSON.stringify(n));
}
