'use strict';

const LUTIN_BLOCKS = 'LFKCS';
const isSolidCh = (ch) => ch === '#' || ch === 'B' || LUTIN_BLOCKS.includes(ch);

// Un niveau en cours de jeu : le décor, les personnages et tout ce qui bouge.
class World {
  constructor(game, def, checkpointIdx) {
    this.game = game;
    this.def = def;
    this.theme = def.theme;
    this.diff = game.diff;
    this.t = 0;
    this.tiles = def.map.map((row) => row.split(''));
    this.rows = this.tiles.length;
    this.cols = this.tiles[0].length;
    this.width = this.cols * TILE;
    this.height = this.rows * TILE;
    this.enemies = [];
    this.items = [];
    this.projectiles = [];
    this.hazards = [];
    this.platforms = [];
    this.checkpoints = [];
    this.flowers = [];
    this.anchors = [];
    this.eclairs = [];
    this.particles = [];
    this.bubbles = [];
    this.goal = null;
    this.storms = def.storms || [];
    this.stormT = 1.5;
    this.flash = 0;
    this.flashT = 3;
    this.shakeMag = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.cam = { x: 0, y: 0 };
    this.look = 60;

    let start = { x: 3 * TILE, y: 11 * TILE };
    const flowerSpots = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const ch = this.tiles[r][c];
        const x = c * TILE;
        const y = r * TILE;
        const mx = x + TILE / 2;
        const by = y + TILE;
        let keep = false;
        switch (ch) {
          case 'P': start = { x: mx, y: by }; break;
          case 'E': this.enemies.push(new EyeMonster(this, mx - 19, by - 50)); break;
          case 'R': this.enemies.push(new Rubik(this, mx - 20, by - 40)); break;
          case 'D': this.enemies.push(new Ladybug(this, mx - 27, by - 40, false)); break;
          case 'W': this.enemies.push(new Ladybug(this, mx - 27, y + 4, true)); break;
          case 'o': this.items.push(new Item(this, 'candy', mx, y + TILE / 2)); break;
          case 'y': this.items.push(new Item(this, 'lollipop', mx, y + TILE / 2)); break;
          case 'b': this.items.push(new Item(this, 'ball', mx, y + TILE / 2)); break;
          case '!': this.checkpoints.push(new Checkpoint(this, mx, by, this.checkpoints.length)); break;
          case 'G': this.goal = new Goal(this, mx, by); break;
          case 'N': this.goal = new BirdGoal(this, mx, by); break;
          case 'H': this.platforms.push(new MovingPlatform(this, x, y, 'h')); break;
          case 'I': this.platforms.push(new MovingPlatform(this, x, y, 'v')); break;
          case 'T': flowerSpots.push({ x: mx, y: by }); break;
          case '@': this.anchors.push(new Anchor(this, mx, y + TILE / 2)); break;
          case 'Z': this.goal = new BadgeGoal(this, mx, by, def.badge); break;
          default: keep = true;
        }
        if (!keep) this.tiles[r][c] = '.';
      }
    }
    // les fleurs parlent dans l'ordre, de gauche à droite
    flowerSpots.sort((a, b) => a.x - b.x);
    flowerSpots.forEach((f, i) => {
      this.flowers.push(new TalkFlower(this, f.x, f.y, game.textFor((def.talk || [])[i] || '')));
    });
    if (checkpointIdx >= 0 && this.checkpoints[checkpointIdx]) {
      const cp = this.checkpoints[checkpointIdx];
      start = { x: cp.x + 20, y: cp.y };
      for (let i = 0; i <= checkpointIdx; i++) this.checkpoints[i].activate(false);
    }
    this.player = new Player(this, start.x - 14, start.y - 56);
    this.player.y = start.y - this.player.h;
    this.updateCamera(0, true);
  }

  // ---------- Cases ----------
  tileAt(c, r) {
    if (c < 0 || c >= this.cols) return '#';
    if (r < 0 || r >= this.rows) return '.';
    return this.tiles[r][c];
  }

  solidAt(px, py) {
    return isSolidCh(this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)));
  }

  // Déplace un objet en tenant compte des murs, du sol et des plateformes traversables.
  moveBody(b, dt, onFloorHit) {
    const T = TILE;
    const res = { wall: 0, landed: false, ceil: null };
    if (b.vx !== 0) {
      b.x += b.vx * dt;
      const r0 = Math.floor(b.y / T);
      const r1 = Math.floor((b.y + b.h - 0.01) / T);
      if (b.vx > 0) {
        const c = Math.floor((b.x + b.w - 0.01) / T);
        for (let r = r0; r <= r1; r++) {
          if (isSolidCh(this.tileAt(c, r))) {
            b.x = c * T - b.w;
            res.wall = 1;
            break;
          }
        }
      } else {
        const c = Math.floor(b.x / T);
        for (let r = r0; r <= r1; r++) {
          if (isSolidCh(this.tileAt(c, r))) {
            b.x = (c + 1) * T;
            res.wall = -1;
            break;
          }
        }
      }
      if (res.wall) b.vx = 0;
    }
    const prevBottom = b.y + b.h;
    b.y += b.vy * dt;
    b.onGround = false;
    const c0 = Math.floor((b.x + 0.01) / T);
    const c1 = Math.floor((b.x + b.w - 0.01) / T);
    if (b.vy > 0) {
      const r = Math.floor((b.y + b.h) / T);
      let tiles = [];
      for (let c = c0; c <= c1; c++) {
        const ch = this.tileAt(c, r);
        if (isSolidCh(ch) || (ch === '-' && prevBottom <= r * T + 0.5)) tiles.push({ c, r, ch });
      }
      if (tiles.length && onFloorHit && onFloorHit(tiles)) {
        tiles = tiles.filter((t) => this.tileAt(t.c, t.r) !== '.');
      }
      if (tiles.length) {
        b.y = r * T - b.h;
        b.vy = 0;
        b.onGround = true;
        res.landed = true;
      }
    } else if (b.vy < 0) {
      const r = Math.floor(b.y / T);
      const tiles = [];
      for (let c = c0; c <= c1; c++) {
        const ch = this.tileAt(c, r);
        if (isSolidCh(ch)) tiles.push({ c, r, ch });
      }
      if (tiles.length) {
        b.y = (r + 1) * T;
        b.vy = 0;
        res.ceil = tiles;
      }
    }
    return res;
  }

  // Y a-t-il du sol devant (pour que les ennemis ne tombent pas) ?
  groundAhead(e, extra) {
    const ex = extra || 4;
    const fx = e.dir > 0 ? e.x + e.w + ex : e.x - ex;
    const c = Math.floor(fx / TILE);
    const below = this.tileAt(c, Math.floor((e.y + e.h + 4) / TILE));
    const at = this.tileAt(c, Math.floor((e.y + e.h - 4) / TILE));
    if (at === '^' || at === 'v') return false;
    return isSolidCh(below) || below === '-';
  }

  surfaceBelow(x, fromY) {
    const c = Math.floor(x / TILE);
    for (let r = Math.max(0, Math.floor(fromY / TILE)); r < this.rows; r++) {
      const ch = this.tileAt(c, r);
      if (isSolidCh(ch) || ch === '-') return r * TILE;
      if (ch === '~') return r * TILE + 12;
    }
    return this.height + 200;
  }

  inLava(b) {
    const y = b.y + b.h - 4;
    const r = Math.floor(y / TILE);
    const c0 = Math.floor((b.x + 4) / TILE);
    const c1 = Math.floor((b.x + b.w - 4) / TILE);
    for (let c = c0; c <= c1; c++) {
      if (this.tileAt(c, r) === '~') {
        const surface = this.tileAt(c, r - 1) === '~' ? r * TILE : r * TILE + 14;
        if (y > surface) return true;
      }
    }
    return false;
  }

  boxSolid(x, y, w, h) {
    const c0 = Math.floor(x / TILE);
    const c1 = Math.floor((x + w - 0.01) / TILE);
    const r0 = Math.floor(y / TILE);
    const r1 = Math.floor((y + h - 0.01) / TILE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) if (isSolidCh(this.tileAt(c, r))) return true;
    }
    return false;
  }

  thornHit(b) {
    const c0 = Math.floor(b.x / TILE);
    const c1 = Math.floor((b.x + b.w) / TILE);
    const r0 = Math.floor(b.y / TILE);
    const r1 = Math.floor((b.y + b.h) / TILE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = this.tileAt(c, r);
        if (ch === '^') {
          const box = { x: c * TILE + 5, y: r * TILE + 20, w: TILE - 10, h: TILE - 20 };
          if (overlap(b, box)) return box;
        } else if (ch === 'v') {
          const box = { x: c * TILE + 5, y: r * TILE, w: TILE - 10, h: TILE - 20 };
          if (overlap(b, box)) return box;
        }
      }
    }
    return null;
  }

  onScreen(o, margin) {
    const m = margin == null ? 40 : margin;
    return o.x + (o.w || 0) > this.cam.x - m && o.x < this.cam.x + VIEW_W + m &&
      o.y + (o.h || 0) > this.cam.y - m && o.y < this.cam.y + VIEW_H + m;
  }

  // ---------- Blocs lutin ----------
  headBump(p, tiles) {
    let best = tiles[0];
    let bestD = Infinity;
    for (const t of tiles) {
      const d = Math.abs(t.c * TILE + TILE / 2 - p.cx);
      if (d < bestD) { bestD = d; best = t; }
    }
    // les ennemis posés sur le bloc tapé sont éjectés
    for (const e of this.enemies) {
      if (!e.dying && Math.abs(e.y + e.h - best.r * TILE) < 6 &&
        e.x + e.w > best.c * TILE && e.x < (best.c + 1) * TILE) {
        e.kill('bump');
      }
    }
    if (LUTIN_BLOCKS.includes(best.ch)) this.breakBlock(best.c, best.r);
    else Sound.sfx.bump();
  }

  poundTiles(p, tiles) {
    let broke = false;
    for (const t of tiles) {
      if (LUTIN_BLOCKS.includes(t.ch)) {
        this.breakBlock(t.c, t.r);
        broke = true;
      }
    }
    return broke;
  }

  breakBlock(c, r) {
    const ch = this.tiles[r][c];
    this.tiles[r][c] = '.';
    Sound.sfx.breakBlock();
    this.shake(4);
    const cx = c * TILE + TILE / 2;
    const cy = r * TILE + TILE / 2;
    const cols = ['#ffc21f', '#ffe680', '#f39a0e', '#2fae4f'];
    for (let i = 0; i < 8; i++) {
      this.spawn({
        type: 'debris', x: cx + rand(-14, 14), y: cy + rand(-14, 14),
        vx: rand(-260, 260), vy: rand(-520, -180), g: 1800, life: 0.9, size: rand(7, 12),
        color: cols[i % cols.length], vr: rand(-12, 12),
      });
    }
    this.game.addScore(50);
    switch (ch) {
      case 'L':
        for (let i = 0; i < 5; i++) {
          this.spawn({ type: 'candy', x: cx, y: cy, vx: (i - 2) * 70, vy: rand(-560, -420), g: 1400, life: 0.75, size: 1, v: i });
        }
        this.game.addCandies(5, cx, cy - 30);
        break;
      case 'F': this.items.push(new Item(this, 'fruit', cx, cy, true)); Sound.sfx.itemAppear(); break;
      case 'K': this.items.push(new Item(this, 'caramel', cx, cy, true)); Sound.sfx.itemAppear(); break;
      case 'C': this.items.push(new Item(this, 'chips', cx, cy, true)); Sound.sfx.itemAppear(); break;
      case 'S': this.items.push(new Item(this, 'star', cx, cy, true)); Sound.sfx.itemAppear(); break;
      default: break;
    }
  }

  collect(it) {
    const p = this.player;
    const g = this.game;
    const cx = it.x + it.w / 2;
    const cy = it.y;
    it.dead = true;
    switch (it.kind) {
      case 'candy':
      case 'ball':
        g.addCandies(1, cx, cy);
        break;
      case 'lollipop':
        g.addCandies(5, cx, cy);
        break;
      case 'fruit':
        p.heal(2);
        Sound.sfx.fruit();
        this.popText(cx, cy, '+2 énergie !', '#ff7ab8', 22);
        for (let i = 0; i < 6; i++) {
          this.spawn({ type: 'heart', x: p.cx + rand(-16, 16), y: p.y + 10, vy: rand(-140, -60), life: 0.9, size: 1 });
        }
        break;
      case 'caramel':
        g.caramel += 3;
        Sound.sfx.weapon();
        this.popText(cx, cy, 'Caramel x3 !', '#ffcf6a', 22);
        break;
      case 'chips':
        g.chips += 3;
        Sound.sfx.weapon();
        this.popText(cx, cy, 'Chips x3 !', '#b6ff7a', 22);
        break;
      case 'star':
        p.star = this.diff.starTime;
        Sound.sfx.star();
        Sound.playMusic('star');
        this.popText(cx, cy, 'Invincible !', '#fff27a', 24);
        break;
      default: break;
    }
    if (it.kind !== 'candy' && it.kind !== 'ball' && it.kind !== 'lollipop') g.addScore(200);
    for (let i = 0; i < 8; i++) {
      this.spawn({ type: 'spark', x: cx, y: cy + it.h / 2, vx: rand(-150, 150), vy: rand(-150, 150), life: 0.4, size: rand(3, 6), color: '#fff8c0' });
    }
  }

  // ---------- Effets ----------
  spawn(p) {
    if (this.particles.length > 500) return;
    p.max = p.life;
    p.vx = p.vx || 0;
    p.vy = p.vy || 0;
    p.rot = p.rot || Math.random() * 6;
    this.particles.push(p);
  }

  popText(x, y, text, color, size) {
    this.spawn({ type: 'text', x, y, vy: -60, life: 1, text, color: color || '#fff', size: size || 18 });
  }

  puff(x, y, color) {
    for (let i = 0; i < 7; i++) {
      this.spawn({ type: 'smoke', x: x + rand(-10, 10), y: y + rand(-8, 4), vx: rand(-70, 70), vy: rand(-90, -10), life: 0.5, size: rand(7, 12), color: color || '#ffffff' });
    }
  }

  shake(m) {
    this.shakeMag = Math.max(this.shakeMag, m);
  }

  bubble(x, y, text, alpha) {
    if (x < this.cam.x - 60 || x > this.cam.x + VIEW_W + 60) return;
    this.bubbles.push({ x, y, text, alpha });
  }

  // ---------- Mise à jour ----------
  update(dt) {
    this.t += dt;
    const p = this.player;
    for (const pl of this.platforms) pl.update(dt);
    p.update(dt);
    const left = this.cam.x - 300;
    const right = this.cam.x + VIEW_W + 260;
    for (const e of this.enemies) {
      if (e.dying || (e.x + e.w > left && e.x < right)) e.update(dt);
    }
    for (const h of this.hazards) h.update(dt);
    for (const pr of this.projectiles) pr.update(dt);
    for (const it of this.items) it.update(dt);
    for (const ec of this.eclairs) ec.update(dt);
    for (const cp of this.checkpoints) cp.update(dt);
    for (const f of this.flowers) f.update(dt);
    for (const a of this.anchors) a.update(dt);
    if (this.goal) this.goal.update(dt);
    this.updateStorms(dt);
    if (!p.dead && !p.won) this.interactions();
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.hazards = this.hazards.filter((h) => !h.dead);
    this.projectiles = this.projectiles.filter((h) => !h.dead);
    this.items = this.items.filter((h) => !h.dead);
    this.eclairs = this.eclairs.filter((h) => !h.dead);
    this.updateParticles(dt);
    this.updateCamera(dt, false);
  }

  // Quand Malice est tombée : seuls Malice et les effets bougent.
  updateFrozen(dt) {
    this.t += dt;
    this.player.update(dt);
    this.updateParticles(dt);
    this.shakeMag *= Math.pow(0.001, dt);
  }

  interactions() {
    const p = this.player;
    const pb = { x: p.x + 3, y: p.y + 4, w: p.w - 6, h: p.h - 4 };
    // Mesuré avant le premier rebond : en tombant sur une coccinelle et sur son point noir
    // en même temps, on écrase les deux.
    const falling = p.vy > 0;
    const feet = p.prevBottom;
    const pounding = p.pound === 2;
    const stomps = (top) => (falling && feet <= top) || pounding;
    for (const e of this.enemies) {
      if (e.dying || e.dead || !overlap(pb, e)) continue;
      if (p.star > 0) {
        e.kill('star');
        continue;
      }
      if (stomps(e.y + 18)) {
        e.stomp();
        p.bounceOff();
        continue;
      }
      if (e.harmful()) p.hurt(e);
    }
    for (const h of this.hazards) {
      if (h.dead || (h.harmful && !h.harmful()) || !overlap(pb, h)) continue;
      if (p.star > 0) {
        h.dead = true;
        this.puff(h.x + h.w / 2, h.y + h.h / 2, '#ddd');
      } else if (h instanceof BlackDot && stomps(h.y + 12)) {
        h.squash();
        p.bounceOff();
      } else if (p.hurt(h) && h instanceof BlackDot) {
        h.dead = true;
      }
    }
    for (const ec of this.eclairs) {
      const b = ec.box();
      if (b && boxOverlap(pb, b.x, b.y, b.w, b.h)) p.hurt(b);
    }
    const th = this.thornHit(pb);
    if (th) p.hurt(th);
    for (const it of this.items) {
      if (!it.dead && it.appear <= 0 && overlap(pb, it)) this.collect(it);
    }
  }

  updateStorms(dt) {
    const p = this.player;
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.theme === 'storm') {
      this.flashT -= dt;
      if (this.flashT <= 0) {
        this.flashT = rand(3, 7);
        this.flash = 1;
      }
    }
    if (p.dead || p.won) return;
    const col = p.cx / TILE;
    const z = this.storms.find(([a, b]) => col >= a - 3 && col <= b + 2);
    if (!z) {
      this.stormT = Math.max(this.stormT, 0.8);
      return;
    }
    this.stormT -= dt;
    if (this.stormT <= 0) {
      this.stormT = rand(this.diff.eclairMin, this.diff.eclairMax);
      let x = p.cx + p.facing * rand(-120, 380);
      x = clamp(x, z[0] * TILE + 24, (z[1] + 1) * TILE - 24);
      this.eclairs.push(new Eclair(this, x));
    }
  }

  updateParticles(dt) {
    for (const q of this.particles) {
      q.life -= dt;
      q.vy += (q.g || 0) * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.vr) q.rot += q.vr * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  updateCamera(dt, snap) {
    const p = this.player;
    if (p.dead) return;
    this.look = snap ? p.facing * 60 : approach(this.look, p.facing * 60, dt * 140);
    let tx = p.cx - VIEW_W * 0.45 + this.look;
    let ty = p.y + p.h / 2 - VIEW_H * 0.56;
    tx = clamp(tx, 0, Math.max(0, this.width - VIEW_W));
    ty = clamp(ty, 0, Math.max(0, this.height - VIEW_H));
    if (snap) {
      this.cam.x = tx;
      this.cam.y = ty;
    } else {
      this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 7);
      this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 5);
    }
    this.shakeMag *= Math.pow(0.001, dt);
    if (this.shakeMag < 0.3) this.shakeMag = 0;
    this.shakeX = (Math.random() * 2 - 1) * this.shakeMag;
    this.shakeY = (Math.random() * 2 - 1) * this.shakeMag;
  }

  // ---------- Dessin ----------
  render(ctx, s) {
    const camX = this.cam.x + this.shakeX;
    const camY = this.cam.y + this.shakeY;
    Scenery.drawBackground(ctx, this.theme, this.cam.x, this.cam.y, this.t, this.flash);
    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawStormClouds(ctx);
    this.drawDecor(ctx, camX);
    for (const f of this.flowers) f.draw(ctx);
    ctx.restore();

    this.drawTiles(ctx, s, camX, camY);

    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawLutinShine(ctx, camX, camY);
    for (const cp of this.checkpoints) cp.draw(ctx);
    if (this.goal) this.goal.draw(ctx);
    for (const pl of this.platforms) pl.draw(ctx);
    for (const a of this.anchors) a.draw(ctx);
    for (const it of this.items) it.draw(ctx);
    for (const e of this.enemies) {
      if (e.x + e.w > camX - 80 && e.x < camX + VIEW_W + 80) e.draw(ctx);
    }
    for (const ec of this.eclairs) ec.draw(ctx);
    for (const h of this.hazards) h.draw(ctx);
    for (const pr of this.projectiles) pr.draw(ctx);
    this.player.draw(ctx);
    for (const ec of this.eclairs) ec.drawWarning(ctx);
    this.drawLava(ctx, camX, camY);
    this.drawParticles(ctx);
    this.drawBubbles(ctx);
    ctx.restore();
  }

  drawTiles(ctx, s, camX, camY) {
    const T = TILE;
    const c0 = Math.max(0, Math.floor(camX / T) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / T) + 1);
    const r0 = Math.max(0, Math.floor(camY / T) - 1);
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / T) + 1);
    const pad = Scenery.PAD;
    const th = this.theme;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const isG = (c, r) => (r >= this.rows ? true : this.tileAt(c, r) === '#');
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = this.tiles[r][c];
        if (ch === '.' || ch === '~') continue;
        let img = null;
        if (ch === '#') {
          const m = { t: !isG(c, r - 1) && r > 0, l: !isG(c - 1, r), r: !isG(c + 1, r), b: !isG(c, r + 1) };
          img = Scenery.groundSprite(th, m, Math.floor(hash2(c, r) * 4));
        } else if (ch === 'B') {
          img = Scenery.brickSprite(th);
        } else if (LUTIN_BLOCKS.includes(ch)) {
          img = Scenery.lutinSprite();
        } else if (ch === '-') {
          img = Scenery.platformSprite(th, this.tileAt(c - 1, r) !== '-', this.tileAt(c + 1, r) !== '-');
        } else if (ch === '^' || ch === 'v') {
          img = Scenery.thornSprite(th, ch === 'v', Math.floor(hash2(c, r) * 3));
        }
        if (!img) continue;
        const dx = Math.round((c * T - pad - camX) * s);
        const dy = Math.round((r * T - pad - camY) * s);
        const dx2 = Math.round(((c + 1) * T + pad - camX) * s);
        const dy2 = Math.round(((r + 1) * T + pad - camY) * s);
        ctx.drawImage(img, dx, dy, dx2 - dx, dy2 - dy);
      }
    }
    ctx.restore();
  }

  drawLutinShine(ctx, camX, camY) {
    const c0 = Math.max(0, Math.floor(camX / TILE));
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / TILE));
    for (let r = 0; r < this.rows; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!LUTIN_BLOCKS.includes(this.tiles[r][c])) continue;
        const ph = (this.t * 0.6 + hash(c * 7.3 + r)) % 2.2;
        if (ph > 0.5) continue;
        const x = c * TILE;
        const y = r * TILE;
        ctx.save();
        roundRectPath(ctx, x, y, TILE, TILE - 2, 9);
        ctx.clip();
        const sx = x - 20 + ph * 2 * (TILE + 40);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + 12, y);
        ctx.lineTo(sx - 8, y + TILE);
        ctx.lineTo(sx - 20, y + TILE);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawDecor(ctx, camX) {
    const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
    for (let c = c0; c <= c1; c++) {
      for (let r = 1; r < this.rows; r++) {
        if (this.tiles[r][c] !== '#') continue;
        if (this.tiles[r - 1][c] !== '.') break;
        const h = hash2(c * 3.1, r * 1.7);
        if (h < 0.42) {
          const v = hash2(c, r + 9);
          Scenery.decor(ctx, this.theme, c * TILE + 10 + h * 50, r * TILE + 2, v, this.t);
        }
        break;
      }
    }
  }

  drawStormClouds(ctx) {
    for (const [a, b] of this.storms) {
      const x0 = a * TILE;
      const x1 = (b + 1) * TILE;
      if (x1 < this.cam.x - 200 || x0 > this.cam.x + VIEW_W + 200) continue;
      const y = this.cam.y + 18;
      for (let x = x0; x < x1; x += 90) {
        const h = hash(x * 0.37);
        Scenery.fluffyCloud(ctx, x + h * 30, y + h * 22 + Math.sin(this.t + h * 6) * 4, 0.95 + h * 0.4, '#6b3d28', '#3f2015');
      }
    }
  }

  drawLava(ctx, camX, camY) {
    const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor(camY / TILE));
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / TILE));
    for (let r = r0; r <= r1; r++) {
      let c = c0;
      while (c <= c1) {
        if (this.tiles[r][c] !== '~') { c++; continue; }
        const surface = this.tileAt(c, r - 1) !== '~';
        let e = c;
        while (e + 1 <= c1 && this.tiles[r][e + 1] === '~' && (this.tileAt(e + 1, r - 1) !== '~') === surface) e++;
        let bottom = (r + 1) * TILE;
        if (r === this.rows - 1) bottom += 40;
        Scenery.drawLavaRun(ctx, c * TILE, (e + 1) * TILE, r * TILE, surface, bottom, this.t);
        c = e + 1;
      }
    }
  }

  drawParticles(ctx) {
    for (const q of this.particles) {
      const a = Math.max(0, Math.min(1, q.life / q.max));
      ctx.save();
      ctx.globalAlpha = a;
      switch (q.type) {
        case 'dust': {
          const s = q.size * (1.6 - a * 0.6);
          ctx.fillStyle = q.color || 'rgba(255,255,255,0.9)';
          circlePath(ctx, q.x, q.y - s * 0.5, s);
          ctx.fill();
          break;
        }
        case 'smoke': {
          const s = q.size * (1.8 - a);
          ctx.fillStyle = q.color || '#ccc';
          ctx.globalAlpha = a * 0.6;
          circlePath(ctx, q.x, q.y, s);
          ctx.fill();
          break;
        }
        case 'dot':
          ctx.fillStyle = q.color;
          circlePath(ctx, q.x, q.y, q.size);
          ctx.fill();
          break;
        case 'debris':
          ctx.translate(q.x, q.y);
          ctx.rotate(q.rot);
          ctx.fillStyle = q.color;
          roundRectPath(ctx, -q.size / 2, -q.size / 2, q.size, q.size, 2);
          ctx.fill();
          break;
        case 'spark':
          ctx.translate(q.x, q.y);
          ctx.rotate(q.rot);
          ctx.fillStyle = q.color;
          Art.starShape(ctx, q.size, 0.35);
          ctx.fill();
          break;
        case 'confetti':
          ctx.translate(q.x, q.y);
          ctx.rotate(q.rot + q.life * 5);
          ctx.scale(Math.cos(q.life * 9), 1);
          ctx.fillStyle = q.color;
          ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
          break;
        case 'ring':
          ctx.strokeStyle = q.color;
          ctx.lineWidth = 4 * a;
          circlePath(ctx, q.x, q.y, q.size * (1 - a) + 4);
          ctx.stroke();
          break;
        case 'heart':
          Art.heart(ctx, q.x, q.y, 1.3, '#ff4f8a');
          break;
        case 'drop':
          Art.sweat(ctx, q.x, q.y, 1);
          break;
        case 'candy':
          Art.candy(ctx, q.x, q.y, 0.9, q.life * 6, q.v || 0);
          break;
        case 'text':
          drawOutlinedText(ctx, q.text, q.x, q.y, q.size, q.color);
          break;
        default: break;
      }
      ctx.restore();
    }
  }

  drawBubbles(ctx) {
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.font = '600 17px Fredoka, "Arial Rounded MT Bold", sans-serif';
      const lines = wrapText(ctx, b.text, 230);
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 26;
      const h = lines.length * 21 + 16;
      const x = clamp(b.x - w / 2, this.cam.x + 6, this.cam.x + VIEW_W - w - 6);
      const y = Math.max(this.cam.y + 6, b.y - h);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRectPath(ctx, x + 2, y + 4, w, h, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, x, y, w, h, 14);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(clamp(b.x, x + 16, x + w - 16) - 8, y + h - 1);
      ctx.lineTo(clamp(b.x, x + 16, x + w - 16) + 8, y + h - 1);
      ctx.lineTo(clamp(b.x, x + 16, x + w - 16), y + h + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a2a4a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 9 + i * 21));
      ctx.restore();
    }
    this.bubbles.length = 0;
  }
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawOutlinedText(ctx, text, x, y, size, color, align) {
  ctx.font = `700 ${size}px Fredoka, "Arial Rounded MT Bold", sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.22);
  ctx.strokeStyle = 'rgba(40,10,50,0.85)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
