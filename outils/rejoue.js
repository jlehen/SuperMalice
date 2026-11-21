#!/usr/bin/env node
// Rejoue dans le VRAI jeu le chemin trouvé par outils/franchissable.js : chaque saut, rebond, planche qui bouge,
// liane, glissade… est refait avec la vraie physique, et on compare l'endroit où Malice se pose à celui que
// l'outil avait prévu. C'est la preuve que franchissable.js ne se trompe pas (ou la liste de ses écarts).
//
// Il faut le jeu ouvert dans un Chrome sans écran, piloté par son port de débogage. Depuis le dossier du jeu :
//   python3 -m http.server 8777 --bind 127.0.0.1 &
//   chrome-headless-shell --remote-debugging-port=9377 --user-data-dir=/tmp/chrome-malice --no-sandbox about:blank &
//   node outils/franchissable.js 6 full path=/tmp/chemin.json
//   node outils/rejoue.js 9377 "http://127.0.0.1:8777/index.html?niveau=2-2&difficulte=gentil" /tmp/chemin.json
// (le niveau de l'adresse doit être celui du chemin : LEVELS[6] est le 2-2 ; ajouter « verbose » pour le détail)
//
// Pendant le rejeu, les ennemis, les éclairs, l'eau qui monte et les autres dangers qui bougent sont enlevés :
// on ne vérifie que la géométrie des sauts. Un écart de quelques pixels au bord d'un champignon ou d'une planche
// n'est pas grave ; un saut du chemin qui retombe ailleurs, ou dans la lave, mérite qu'on regarde.
// Node 22 ou plus (il utilise fetch et WebSocket), sans rien installer.
const fs = require('fs');
const [port, url, pathFile, verbose] = process.argv.slice(2);
const path = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
(async () => {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let n = 0; const wait = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const id = ++n; wait.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) console.log('EXC', JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result.result && r.result.result.value; };
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Runtime.enable'); await send('Page.enable');
  const load = async () => {
    await send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 1500));
    for (let i = 0; i < 40; i++) { const s = await ev('typeof Game !== "undefined" ? Game.state : "?"'); if (s === 'play') break; await ev('if (Game.state === "intro") { Game.beginPlay(); }'); await new Promise((r) => setTimeout(r, 300)); }
  };
  await load();
  const fn = function (path, i0, i1, TRACE) {
    const w = Game.world, p = w.player, T = 48, H = Input.held, P = Input.pressed, out = [];
    const DT = 1 / 120;
    const clear = () => { for (const k in H) H[k] = false; for (const k in P) P[k] = false; Input.run.left = Input.run.right = false; };
    const quiet = () => {
      w.enemies.length = 0; w.hazards.length = 0; w.eclairs.length = 0; if (w.bombs) w.bombs.length = 0; if (w.volcan) w.volcan.length = 0;
      w.rods = []; w.flood = null; w.arena = null; if (w.storms) w.storms.length = 0; w.goal = null;
      p.energy = Game.energyMax; p.hurtT = 0; p.invuln = 0; p.dead = false; p.soak = 0;
    };
    const plats = w.platforms.filter((q) => q instanceof MovingPlatform);
    const setPlat = (t) => { for (const q of plats) { q.t = t; q.update(0); q.dx = 0; q.dy = 0; } };
    const setMill = (t) => { w.t = t; for (const m of w.mills) for (const q of m.planks) { q.place(); q.dx = 0; q.dy = 0; } };
    const millT = (j) => ((j / 40) * Math.PI * 2 - Math.PI / 4) * w.diff.millTurn / (2 * Math.PI);
    const platPhases = (j) => { const k = j / 6; const a = Math.acos(1 - 2 * k) / (2 * Math.PI); return [a, 1 - a]; };
    const platOf = (m) => m.mover === 'x' ? null : plats.find((q) => q.x0 === m.src[0] * T && q.y0 === m.src[1] * T);
    const ups = w.updrafts;
    let sprung = false;
    if (!w.__orig) { w.__orig = w.springAt.bind(w); }
    w.springAt = (...a) => { sprung = true; return w.__orig(...a); };
    for (let i = i0; i < Math.min(i1, path.length); i++) {
      const e = path[i];
      if (['walk', 'pound', 'ride', 'slide'].includes(e.kind)) continue;
      quiet();
      if (p.puff) p.dropPuff();
      for (const d of w.puffs) { d.state = 'ready'; d.growT = 0; }
      p.grap = null; p.vineLast = null; p.vineWait = 0; p.slope = null; p.slideAir = false; p.skid = false; p.iceAir = false; p.boostT = 0; p.pound = 0;
      const legs = (e.legs || (e.plan ? [e.plan] : [])).slice();
      const fromM = !Array.isArray(e.from) && e.from.mover, fromS = !Array.isArray(e.from) && e.from.slide !== undefined;
      const toM = !Array.isArray(e.to) && e.to.mover, toS = !Array.isArray(e.to) && e.to.slide !== undefined;
      let fail = null, note = '';
      // --- le moment : les planches qui bougent
      if (fromM === "x") setMill(millT(e.from.j) - DT);
      else if (toM === 'x') setMill(millT(e.to.j) - (e.t || 0));
      if (fromM && fromM !== 'x') {
        setPlat(e.plan.clock * 4.6 - DT);
      } else if (toM && toM !== 'x') {
        // (à l'aller ou au retour : on essaiera les deux)
        setPlat(platPhases(e.to.j)[0] * 4.6 - (e.t || 0));
      }
      // --- le départ
      const x = e.kind === 'puff' ? e.from[0] * T + 10 : e.x;
      const y = e.kind === 'puff' ? (e.from[1] + 1) * T - p.h : e.y;
      p.x = x; p.y = y; p.vx = 0; p.vy = 0; p.platform = null; p.onGround = false;
      w.cam.x = Math.max(0, p.x - 400);
      let air = false;
      if (fromS) {
        const g = w.def.glissades[e.from.slide];
        const L = w.scree.lines[e.from.c].find((q) => q.x0 === g[0] * T && q.y0 === g[1] * T);
        p.lastSlope = L; p.slideAir = true;
        if (e.kind === 'slideEnd') { air = true; p.coyote = 0; } else { p.slope = L; p.onGround = true; p.coyote = 0.1; }
        p.vx = legs[0].vx0;
      } else if (fromM) {
        const pl = fromM === 'x' ? w.mills.find((m) => m.x === e.from.src[0] * T + 24).planks.slice().sort((a, b) => Math.hypot(a.x - e.from.x, a.y - e.from.y) - Math.hypot(b.x - e.from.x, b.y - e.from.y))[0] : platOf(e.from);
        if (Math.hypot(pl.x - e.from.x, pl.y - e.from.y) > 14) note += ' (planche de départ à ' + Math.round(Math.hypot(pl.x - e.from.x, pl.y - e.from.y)) + ' px)';
        if (e.kind === 'fall') { air = true; p.coyote = 0; p.y = pl.y - p.h; p.vx = legs[0].vx0; }
        else { p.x = x + (pl.x - e.from.x); p.y = pl.y - p.h; p.platform = pl; p.onGround = true; p.coyote = 0.1; p.vx = legs[0].vx0; }
      } else if (e.kind === 'fall') {
        air = true; p.coyote = 0; p.vx = legs[0].vx0;
      } else if (e.kind === 'walkM') {
        p.x = x - e.vx * DT; p.y = y; p.onGround = true; p.vx = e.vx; legs.unshift({ walk: Math.sign(e.vx) });
      } else if (e.kind === 'puff') {
        p.y = y; p.onGround = true;
      } else {
        p.y = y - 1;
        for (let k = 0; k < 40 && !p.onGround; k++) { clear(); Game.step(DT); }
        if (!p.onGround && !p.puff) { out.push({ i, e: e.kind, from: e.from, to: e.to, fail: 'pas posé au départ' }); continue; }
        p.x = x; p.vx = legs.length ? legs[0].vx0 : 0;
      }
      // --- les sauts, l'un après l'autre
      let li = 0, t = 0, swingN = 0, prevVy = 0, first = true, seq = e.kind;
      const tx = Array.isArray(e.to) ? e.to[0] * T + 24 : toS ? e.to.c * T + 24 : e.to.x + 60;
      const done = () => {
        if (li < legs.length - 1) return false;
        if (toM) return !!p.platform && p.onGround;
        if (toS) return !!p.slope;
        return p.onGround && !p.platform && !p.slope;
      };
      for (let k = 0; k < 6000; k++) {
        clear();
        const leg = legs[li] || {};
        const nextLeg = legs[li + 1];
        if (p.puff) {
          const feet = p.y + p.h, need = Array.isArray(e.to) ? (e.to[1] + 1) * T : feet;
          let goal = tx;
          const dist = Math.abs(tx - p.cx);
          const low = feet + dist * (80 / 250) * 1.25 > need - 6;
          if (low) {
            const cands = ups.filter((z) => feet > z.top + 30 && ((z.a * T - 60 <= Math.max(p.cx, tx) && (z.b + 1) * T + 60 >= Math.min(p.cx, tx))));
            if (cands.length) { const z = cands.sort((a, b) => Math.abs((a.a + a.b + 1) * T / 2 - p.cx) - Math.abs((b.a + b.b + 1) * T / 2 - p.cx))[0]; goal = (z.a + z.b + 1) * T / 2; }
          }
          if (p.cx < goal - 8) H.right = true; else if (p.cx > goal + 8) H.left = true;
          if (!seq.includes('vol')) seq += '+vol';
        } else if (p.grap && p.grap.vine) {
          // pendue à une liane : le prochain « swing » dit quoi tenir, et combien d'images
          if (leg.swing === undefined) {
            while (li < legs.length && legs[li].swing === undefined) li++;
            swingN = 0; if (!seq.endsWith('liane')) seq += '+liane';
            // (comme dans l'outil : on repart de la liane au repos, à la longueur tenue de l'outil)
            if (legs[li]) { if (Math.abs(p.grap.len - legs[li].len) > 7) note += ' (tenue ' + Math.round(p.grap.len) + ' au lieu de ' + legs[li].len + ')'; p.grap.len = legs[li].len; p.grap.ang = 0; p.grap.angV = 0; }
          }
          const sw = legs[li];
          if (!sw) { fail = 'liane imprévue'; break; }
          const launch = legs[li + 1];
          if (swingN >= sw.n) {
            if (launch.drop) P.down = true; else { P.jump = true; if (launch.jd > 0) H.right = true; else if (launch.jd < 0) H.left = true; }
            li++; t = 0; first = false;
          } else { if (sw.swing > 0) H.right = true; else if (sw.swing < 0) H.left = true; swingN++; }
        } else if (leg.swing !== undefined) {
          // (on attendait une liane : on continue le saut d'avant)
          const pl = legs[li - 1] || {};
          const dir = t + DT < pl.tau ? pl.d : pl.rev ? -pl.d : 0;
          H.left = dir < 0; H.right = dir > 0;
        } else if (leg.walk) {
          H.left = leg.walk < 0; H.right = leg.walk > 0;
          if (nextLeg && nextLeg.held) H.jump = true;
        } else if (leg.brake) {
          if (Math.abs(p.vx) <= 40 || !p.onGround) { legs.length = li + 1; if (p.onGround) break; }
          else if (p.vx > 0) H.left = true; else H.right = true;
        } else if (air && p.onGround && !p.platform && nextLeg && nextLeg.after === 'edge') {
          // elle dérape sur la glace : elle freine
          if (p.vx > 0) H.left = true; else if (p.vx < 0) H.right = true;
        } else {
          const dir = t + DT < leg.tau ? leg.d : leg.rev ? -leg.d : 0;
          H.left = dir < 0; H.right = dir > 0;
          if (leg.jump) { if (t === 0 && first) P.jump = true; H.jump = t + DT < leg.hold; }
          // (pour le rebond d'après : garder le saut appuyé en retombant)
          if (nextLeg && nextLeg.after === 'spring' && nextLeg.held && p.vy > 0) H.jump = true;
          if (leg.after === 'spring' && leg.held && p.vy > -1100 && t < 0.05) H.jump = true;
        }
        prevVy = p.vy; sprung = false;
        // (les lianes que personne ne tient pendent tout droit, comme dans l'outil)
        for (const v of w.vines) if (!v.holder() && v !== p.vineLast) { v.ang = 0; v.angV = 0; v.t = 0; v.v = 0; } else { v.t = 0; v.v = 0; }
        const wasGround = p.onGround;
        Game.step(DT); t += DT;
        if (i === TRACE && k % 6 === 0) note += `\n     ${k} x ${p.x.toFixed(1)} y ${p.y.toFixed(1)} vx ${p.vx.toFixed(0)} vy ${p.vy.toFixed(0)} sol ${p.onGround} planche ${p.platform ? p.platform.x.toFixed(0) + ',' + p.platform.y.toFixed(0) : '-'} pente ${!!p.slope} glace ${p.icy}/${p.iceAir}`;
        if (Game.state !== 'play') { fail = 'état ' + Game.state; break; }
        if (p.hurtT > 0 || p.dead) { fail = 'aïe'; break; }
        // un rebond sur un champignon ?
        if (sprung) {
          sprung = false;
          if (nextLeg && nextLeg.after === 'spring') { li++; t = 0; first = false; seq += '+boing'; air = true; continue; }
          fail = 'rebond imprévu'; break;
        }
        if (wasGround && !p.onGround && nextLeg && nextLeg.after === 'edge' && !leg.jump) { li++; t = 0; first = false; seq += '+bord'; air = true; continue; }
        if (wasGround && !p.onGround && nextLeg && nextLeg.after === 'edge' && leg.jump && air && k > 5) { li++; t = 0; first = false; seq += '+bord'; continue; }
        if (!p.onGround) air = true;
        if (p.onGround && air) {
          // (posée sur la glace avec de l'élan : elle freine jusqu'à s'arrêter, comme dans l'outil)
          if (done() && w.ice && !toM && !toS && Math.abs(p.vx) > 40 && w.iceUnder(p)) { legs.push({ after: 'edge', brake: true }); legs.push({ after: 'edge', never: true }); li++; continue; }
          if (done()) break;
          // (posée, mais pas au bout : elle dérape, ou un champignon va la relancer)
          if (nextLeg && nextLeg.after === 'edge' && Math.abs(p.vx) > 5) continue;
          if (nextLeg && nextLeg.after === 'spring') continue;
          if (legs[li] && legs[li].swing !== undefined) { fail = 'liane manquée'; break; }
          break;
        }
        if (k === 5999) fail = 'trop long';
      }
      const c = Math.floor((p.x + p.w / 2) / T), r = Math.round((p.y + p.h) / T) - 1;
      if (!fail) {
        if (toM) {
          if (!p.platform) fail = 'pas sur la planche : arrive en ' + c + ',' + r;
          else if (Math.hypot(p.platform.x - e.to.x, p.platform.y - e.to.y) > 60) note += ' (planche à ' + Math.round(Math.hypot(p.platform.x - e.to.x, p.platform.y - e.to.y)) + ' px du noeud)';
        } else if (toS) {
          if (!p.slope) fail = 'pas sur la pente : arrive en ' + c + ',' + r;
          else if (Math.abs(c - e.to.c) > 2) fail = 'sur la pente, colonne ' + c;
        } else if (p.platform) fail = 'sur une planche, en ' + c + ',' + r;
        else if (p.slope) fail = 'sur une pente, en ' + c + ',' + r;
        else if (Math.abs(c - e.to[0]) > 1 || Math.abs(r - e.to[1]) > 0) fail = 'arrive en ' + c + ',' + r;
      }
      out.push({ i, e: seq, from: e.from, to: e.to, fail, note, legs: fail ? legs : undefined });
      if (Game.state !== 'play') break;
    }
    return JSON.stringify(out);
  };
  await ev(`window.__rejoue = ${fn.toString()}`);
  const all = [];
  for (let i0 = 0; i0 < path.length;) {
    const res = JSON.parse(await ev(`window.__rejoue(${JSON.stringify(path.slice(0, i0 + 20).map((e, i) => (i < i0 ? 0 : e)))}, ${i0}, ${i0 + 20}, ${+process.env.TRACE || -1})`) || '[]');
    all.push(...res);
    const st = await ev('Game.state');
    // (elle est tombée : on recharge le niveau et on reprend à l'étape d'après)
    if (st !== 'play') { i0 = res.length ? res[res.length - 1].i + 1 : i0 + 20; await load(); await ev(`window.__rejoue = ${fn.toString()}`); } else i0 += 20;
  }
  const fails = all.filter((o) => o.fail);
  const kinds = {};
  for (const o of all) { const k = path[o.i].sort || o.e + (Array.isArray(o.to) ? '' : o.to.mover ? '>planche' : '>pente') + (Array.isArray(o.from) ? '' : o.from.mover ? '<planche' : '<pente'); kinds[k] = kinds[k] || [0, 0]; kinds[k][o.fail ? 1 : 0]++; }
  console.log(pathFile.split('/').pop(), ':', path.length, 'étapes,', all.length, 'rejouées,', fails.length, 'écarts');
  console.log('  ', Object.entries(kinds).map(([k, v]) => `${k}: ${v[0]} ok${v[1] ? ', ' + v[1] + ' ÉCARTS' : ''}`).join(' ; '));
  for (const f of fails) console.log('  ', JSON.stringify(verbose ? f : Object.assign({}, f, { legs: undefined })));
  for (const o of all) if (o.note && (verbose || o.i === +process.env.TRACE)) console.log('   note', o.i, o.e, o.note);
  ws.close();
})();
