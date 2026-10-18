'use strict';

// Réglages du saut et de la course (en pixels par seconde).
const PHYS = {
  gravity: 2300,
  maxFall: 1000,
  run: 285,
  sprint: 470,
  accGround: 2300,
  accAir: 1600,
  decGround: 2700,
  decAir: 900,
  jump: 950,
  runJump: 1010,
  jumpCut: 520,
  coyote: 0.1,
  buffer: 0.14,
  bounce: 620,
  bounceHeld: 880,
  poundHang: 0.17,
  pound: 1150,
  superJump: 1250,
  crouchCharge: 0.12,
};

// Moustache-grappin : portée, vitesse de la moustache, vitesse de traction, longueur de la corde.
const GRAPPLE = { range: 340, shoot: 2600, pull: 820, len: 58 };

const STUCK_TIME = 10;
const STAR_TIME = 15;

// Ce qui arrive à Malice quand elle perd de l'énergie, selon ce qui l'a touchée (dessins dans art.js) :
// dur = durée de l'animation, pose = temps où tout son corps réagit, lock = temps sans pouvoir bouger,
// freeze = temps où elle reste figée, vx / vy = comment elle est projetée,
// hold = moment de l'animation qu'on garde si elle n'a plus d'énergie et tombe.
const OUCH = {
  // les ronces au sol piquent les fesses : elle s'envole en se tenant les fesses
  butt: { dur: 0.75, pose: 0.7, lock: 0.3, vx: 220, vy: -780, hold: 0.3, text: 'Aïe, mes fesses !', color: '#ff8aa8' },
  // les ronces qui pendent : une grosse bosse soulève la casquette
  head: { dur: 1.3, pose: 0.45, lock: 0.25, vx: 220, vy: 150, hold: 0.4, text: 'Ouille, ma tête !', color: '#ffb36a' },
  // les éclairs électrocutent : figée, on voit son squelette, puis elle est un peu grillée
  zap: { dur: 1.4, pose: 0.8, lock: 0.25, freeze: 0.5, vx: 260, vy: -430, hold: 0.9, text: 'Bzzzzt !', color: '#fff27a' },
  // les boulets des coccinelles : K.O. (la langue qui pend, les yeux mi-clos, des étoiles)
  ko: { dur: 0.5, pose: 0.5, lock: 0.5, vx: 200, vy: -300, hold: 0.25, text: 'Bong !', color: '#ffffff' },
  // le gros oeil hypnotise : yeux en spirale, elle avance les bras tendus comme une somnambule
  hypno: { dur: 1.5, pose: 0.4, lock: 0.25, vx: 260, vy: -430, hold: 0.6, text: 'Tout tourne…', color: '#d6a6ff' },
  // le Rubik's cube mélange ses couleurs, qui reviennent une par une
  scramble: { dur: 1.3, pose: 0.45, lock: 0.25, vx: 260, vy: -430, hold: 0.3, text: 'Tout mélangé !', color: '#7ad0ff' },
  // les morceaux du cube qui explose : toute noire de suie, cheveux en pétard, elle tousse
  soot: { dur: 2, pose: 0.45, lock: 0.25, vx: 260, vy: -430, hold: 0.6, text: 'Kof kof !', color: '#d0d0d0' },
  // la coccinelle lui colle ses points noirs, qui sautent un par un
  spots: { dur: 2.4, pose: 0.45, lock: 0.25, vx: 260, vy: -430, hold: 0.5, text: 'Plein de pois !', color: '#ff6a6a' },
  // n'importe quoi d'autre
  hit: { dur: 0.45, pose: 0.45, lock: 0.25, vx: 260, vy: -430, hold: 0.3 },
};

// ======================= MALICE =======================
class Player {
  constructor(world, x, y) {
    this.world = world;
    this.w = 28;
    this.h = 56;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.running = false;
    this.onGround = false;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumping = false;
    this.pound = 0;
    this.poundT = 0;
    this.invuln = 0;
    this.star = 0;
    this.hurtT = 0;
    // ce qui vient de lui faire mal (voir OUCH), et le temps où elle reste figée (électrocutée)
    this.ouch = null;
    this.stunT = 0;
    this.throwT = 0;
    this.throwAnim = 0;
    this.land = 0;
    this.ph = 0;
    this.t = 0;
    this.platform = null;
    this.dead = false;
    this.deathT = 0;
    this.won = false;
    this.prevBottom = y + this.h;
    this.energy = world.game.energyMax;
    this.sparkT = 0;
    this.crouch = false;
    this.crouchT = 0;
    this.superT = 0;
    this.superSpin = 0;
    this.grap = null;
    this.target = null;
    this.boostT = 0;
    // immobile un moment : Malice se tourne vers le joueur et fait une mimique
    this.idleT = 0;
    this.nextMimic = rand(2, 8);
    this.mimic = null;
    this.lastMimic = '';
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(dt) {
    const w = this.world;
    this.t += dt;
    if (this.ouch) this.updateOuch(dt);
    if (this.dead) {
      this.grap = null;
      this.deathT += dt;
      if (this.deathT > 0.5) {
        this.vy = Math.min(this.vy + PHYS.gravity * 0.75 * dt, 1200);
        this.y += this.vy * dt;
      }
      if (this.cause === 'lava' && Math.random() < dt * 20) {
        w.spawn({ type: 'smoke', x: this.cx + rand(-10, 10), y: this.y + this.h, vy: -60, life: 0.9, size: 10, color: '#555' });
      }
      return;
    }
    if (this.won) {
      this.vx = approach(this.vx, 0, PHYS.decGround * dt);
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      w.moveBody(this, dt);
      if (!this.platform) this.checkPlatforms();
      return;
    }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.throwT > 0) this.throwT -= dt;
    if (this.throwAnim > 0) this.throwAnim -= dt;
    if (this.land > 0) this.land -= dt;
    if (this.star > 0) {
      this.star -= dt;
      this.sparkT -= dt;
      if (this.sparkT <= 0) {
        this.sparkT = 0.05;
        w.spawn({ type: 'spark', x: this.cx + rand(-18, 18), y: this.y + rand(0, this.h), vy: -30, life: 0.5, size: rand(3, 6), color: `hsl(${randInt(0, 360)},100%,70%)` });
      }
      if (this.star <= 0) w.game.onStarEnd();
    }
    if (this.stunT > 0) {
      // électrocutée : figée sur place, puis projetée
      this.stunT -= dt;
      if (this.stunT > 0) return;
      this.vx = this.stunVx;
      this.vy = this.stunVy;
    }

    if (this.superSpin > 0) this.superSpin -= dt;
    const I = Input;
    const game = w.game;
    const badgeSaut = game.hasBadge('saut');
    const badgeGrappin = game.hasBadge('grappin');

    // ---- Moustache-grappin : accrochée à un anneau ----
    this.target = badgeGrappin && (!this.grap || this.grap.phase === 'swing') ? this.findAnchor(this.grap && this.grap.anchor) : null;
    if (this.grap && (this.grap.phase === 'pull' || this.grap.phase === 'swing')) {
      this.updateHanging(dt);
      if (w.inLava(this) && !this.lavaProof()) this.die('lava');
      return;
    }
    if (I.pressed.grapple && badgeGrappin && !this.pound && this.hurtT <= 0) this.startGrapple();

    if (this.platform) {
      this.x += this.platform.dx;
      this.y = this.platform.y - this.h;
    }

    let dir = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0);
    if (this.hurtT > 0) dir = 0;

    // ---- S'accroupir (et préparer le super saut) ----
    const wantCrouch = this.onGround && I.held.down && !this.pound;
    if (wantCrouch) {
      this.crouchT += dt;
      if (badgeSaut && this.crouchT - dt < PHYS.crouchCharge && this.crouchT >= PHYS.crouchCharge) Sound.sfx.charge();
    } else {
      if (this.crouch && badgeSaut && this.crouchT >= PHYS.crouchCharge) this.superT = 0.3;
      this.crouchT = 0;
    }
    this.crouch = wantCrouch;
    if (this.superT > 0) this.superT -= dt;
    const charged = badgeSaut && ((this.crouch && this.crouchT >= PHYS.crouchCharge) || this.superT > 0);
    if (charged && Math.random() < dt * 25) {
      w.spawn({ type: 'spark', x: this.cx + rand(-16, 16), y: this.y + this.h - rand(0, 20), vy: rand(-120, -40), life: 0.4, size: rand(3, 5), color: '#7ff0ff' });
    }
    if (this.crouch) dir = 0;

    // ---- Courir (appui rapide sur la direction, puis rester appuyé) ----
    const wasRunning = this.running;
    this.running = dir !== 0 && I.run[dir > 0 ? 'right' : 'left'];
    if (this.running && !wasRunning && this.onGround && !this.pound) {
      Sound.sfx.dash();
      for (let i = 0; i < 5; i++) {
        w.spawn({ type: 'dust', x: this.cx - dir * 10, y: this.y + this.h, vx: -dir * rand(40, 140), vy: rand(-50, -10), life: 0.35, size: rand(4, 7) });
      }
    }
    const top = this.running ? PHYS.sprint : PHYS.run;

    if (this.pound) {
      this.vx = 0;
    } else if (this.boostT > 0 && Math.abs(this.vx) > top && (dir === 0 || dir === Math.sign(this.vx))) {
      // garde l'élan pris en se balançant au grappin
      this.boostT -= dt;
      this.vx = approach(this.vx, Math.sign(this.vx) * top, 260 * dt);
      if (dir) this.facing = dir;
    } else {
      const target = dir * top;
      let acc;
      if (this.onGround) acc = dir ? PHYS.accGround : PHYS.decGround;
      else acc = dir ? PHYS.accAir : PHYS.decAir;
      if (dir && Math.sign(this.vx) === -dir) acc *= 1.6;
      this.vx = approach(this.vx, target, acc * dt);
      if (dir) this.facing = dir;
    }

    // saut (avec un peu de tolérance pour les enfants)
    if (I.pressed.jump) this.jumpBuf = PHYS.buffer;
    else this.jumpBuf -= dt;
    this.coyote = this.onGround ? PHYS.coyote : this.coyote - dt;
    if (this.jumpBuf > 0 && this.coyote > 0 && !this.pound) {
      this.jumpBuf = 0;
      this.coyote = 0;
      this.onGround = false;
      this.platform = null;
      if (charged) {
        // SUPER SAUT !
        this.vy = -PHYS.superJump;
        this.jumping = false;
        this.superT = 0;
        this.crouch = false;
        this.crouchT = 0;
        this.superSpin = 0.55;
        Sound.sfx.superJump();
        w.spawn({ type: 'ring', x: this.cx, y: this.y + this.h, life: 0.4, size: 60, color: 'rgba(127,240,255,0.9)' });
        for (let i = 0; i < 12; i++) {
          w.spawn({ type: 'spark', x: this.cx + rand(-14, 14), y: this.y + this.h, vx: rand(-150, 150), vy: rand(-260, -60), life: 0.6, size: rand(4, 7), color: i % 2 ? '#7ff0ff' : '#ffffff' });
        }
      } else {
        // avec de l'élan, on saute un peu plus haut (mais jamais 5 cases)
        this.vy = -(Math.abs(this.vx) > PHYS.run + 40 ? PHYS.runJump : PHYS.jump);
        this.jumping = true;
        Sound.sfx.jump();
      }
      for (let i = 0; i < 5; i++) {
        w.spawn({ type: 'dust', x: this.cx + rand(-10, 10), y: this.y + this.h, vx: rand(-60, 60), vy: rand(-40, -10), life: 0.4, size: rand(4, 7) });
      }
    }
    if (this.jumping && !I.held.jump && this.vy < -PHYS.jumpCut) this.vy = -PHYS.jumpCut;
    if (this.vy >= 0) this.jumping = false;

    // écrasement (bas en l'air)
    if (I.pressed.down && !this.onGround && !this.pound) {
      this.pound = 1;
      this.poundT = PHYS.poundHang;
      this.vx = 0;
      this.vy = 0;
      this.jumping = false;
      Sound.sfx.spin();
    }
    if (this.pound === 1) {
      this.vy = 0;
      this.poundT -= dt;
      if (this.poundT <= 0) {
        this.pound = 2;
        this.vy = PHYS.pound;
      }
    } else {
      this.vy = Math.min(this.vy + PHYS.gravity * dt, this.pound === 2 ? PHYS.pound : PHYS.maxFall);
    }

    if (I.pressed.caramel) this.throwIt('caramel');
    if (I.pressed.chips) this.throwIt('chips');

    this.prevBottom = this.y + this.h;
    const wasGround = this.onGround;
    const fallSpeed = this.vy;
    const res = w.moveBody(this, dt, this.pound === 2 ? (tiles) => w.poundTiles(this, tiles) : null);
    if (res.landed) this.platform = null;
    if (res.ceil) w.headBump(this, res.ceil);
    if (!res.landed) this.checkPlatforms();

    if (this.onGround && !wasGround) {
      this.land = 0.12;
      if (this.pound === 2) {
        this.pound = 0;
        w.shake(7);
        Sound.sfx.pound();
        for (let i = 0; i < 12; i++) {
          w.spawn({ type: 'dust', x: this.cx + rand(-6, 6), y: this.y + this.h, vx: rand(-220, 220), vy: rand(-120, -20), life: 0.5, size: rand(5, 9) });
        }
        w.spawn({ type: 'ring', x: this.cx, y: this.y + this.h, life: 0.35, size: 50, color: 'rgba(255,255,255,0.8)' });
      } else if (fallSpeed > 500) {
        for (let i = 0; i < 4; i++) {
          w.spawn({ type: 'dust', x: this.cx + rand(-10, 10), y: this.y + this.h, vx: rand(-80, 80), vy: rand(-30, -5), life: 0.35, size: rand(4, 6) });
        }
      }
    }
    if (this.onGround && this.pound) this.pound = 0;

    if (this.onGround && Math.abs(this.vx) > 10) {
      this.ph += dt * Math.abs(this.vx) * 0.052;
      if (Math.random() < dt * (this.running ? 14 : 6) && Math.abs(this.vx) > 200) {
        w.spawn({ type: 'dust', x: this.cx - this.facing * 8, y: this.y + this.h, vx: -this.facing * 30, vy: -20, life: 0.3, size: 4 });
      }
    } else if (this.onGround) {
      this.ph = 0;
    }

    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > w.width) { this.x = w.width - this.w; this.vx = 0; }
    if (this.grap) this.updateMustacheTip(dt);
    this.updateMimic(dt, dir);

    if (w.inLava(this)) {
      if (this.lavaProof()) this.lavaBounce();
      else this.die('lava');
    } else if (this.y > w.height + 60) this.die('fall');
  }

  // Mode Bébé : avec l'étoile, la lave ne brûle pas.
  lavaProof() { return this.star > 0 && this.world.diff.starLava; }

  // ... et Malice rebondit dessus comme sur un trampoline.
  lavaBounce() {
    if (this.vy < 0) return;
    const w = this.world;
    this.vy = -PHYS.jump;
    this.jumping = false;
    this.pound = 0;
    this.onGround = false;
    this.platform = null;
    Sound.sfx.lavaBounce();
    for (let i = 0; i < 10; i++) {
      w.spawn({ type: 'spark', x: this.cx + rand(-16, 16), y: this.y + this.h, vx: rand(-140, 140), vy: rand(-320, -80), life: 0.5, size: rand(4, 7), color: i % 2 ? '#ffb02e' : '#ff5a1f' });
    }
    for (let i = 0; i < 3; i++) {
      w.spawn({ type: 'smoke', x: this.cx + rand(-12, 12), y: this.y + this.h, vy: -60, life: 0.8, size: 10, color: '#888' });
    }
  }

  updateMimic(dt, dir) {
    const I = Input.held;
    const still = this.onGround && !dir && !this.crouch && !this.pound && !this.grap && this.hurtT <= 0 && !this.ouch
      && this.throwAnim <= 0 && Math.abs(this.vx) < 10 && !I.jump && !I.down;
    if (!still) {
      this.idleT = 0;
      this.mimic = null;
    } else if (this.mimic) {
      this.mimic.t += dt;
      if (this.mimic.t >= this.mimic.dur) {
        this.mimic = null;
        this.idleT = 0;
        this.nextMimic = rand(2, 8);
      }
    } else {
      this.idleT += dt;
      if (this.idleT >= this.nextMimic) {
        // jamais deux fois la même à la suite
        const kinds = ['grin', 'wink', 'duck'].filter((k) => k !== this.lastMimic);
        const kind = kinds[randInt(0, kinds.length - 1)];
        this.lastMimic = kind;
        this.mimic = { kind, t: 0, dur: Art.MIMIC_DUR[kind] };
      }
    }
  }

  // ---------- Moustache-grappin ----------
  mustachePoint() {
    return { x: this.cx + this.facing * 13, y: this.y + 22 };
  }

  findAnchor(exclude) {
    const hx = this.cx;
    const hy = this.y + 14;
    let best = null;
    let bestS = Infinity;
    for (const a of this.world.anchors) {
      if (a === exclude) continue;
      const dx = a.x - hx;
      const dy = a.y - hy;
      const d = Math.hypot(dx, dy);
      if (d > GRAPPLE.range || d < 24 || dy > 30) continue;
      let sc = d;
      if (Math.sign(dx) !== this.facing && Math.abs(dx) > 40) sc += 200;
      if (sc < bestS) {
        bestS = sc;
        best = a;
      }
    }
    return best;
  }

  startGrapple() {
    const prev = this.grap && this.grap.anchor;
    const a = this.findAnchor(prev);
    const m = this.mustachePoint();
    Sound.sfx.grapple();
    if (!a) {
      this.grap = { phase: 'miss', t: 0, tipX: m.x, tipY: m.y };
      return;
    }
    this.grap = { phase: 'shoot', anchor: a, t: 0, tipX: m.x, tipY: m.y, ang: 0, angV: 0, len: GRAPPLE.len, stuckT: 0 };
    this.pound = 0;
  }

  // La moustache part vers l'anneau (ou dans le vide) pendant que Malice bouge normalement.
  updateMustacheTip(dt) {
    const g = this.grap;
    const m = this.mustachePoint();
    g.t += dt;
    if (g.phase === 'miss') {
      const k = g.t < 0.16 ? g.t / 0.16 : Math.max(0, 1 - (g.t - 0.16) / 0.16);
      g.tipX = m.x + this.facing * 150 * k;
      g.tipY = m.y - 110 * k;
      if (g.t > 0.32) this.grap = null;
      return;
    }
    if (g.phase === 'shoot') {
      const a = g.anchor;
      const dx = a.x - g.tipX;
      const dy = a.y - g.tipY;
      const d = Math.hypot(dx, dy);
      const step = GRAPPLE.shoot * dt;
      if (d <= step) {
        g.tipX = a.x;
        g.tipY = a.y;
        g.phase = 'pull';
        g.t = 0;
        a.flash = 0.35;
        this.platform = null;
        Sound.sfx.grab();
      } else {
        g.tipX += (dx / d) * step;
        g.tipY += (dy / d) * step;
      }
      if (g.t > 0.5) this.grap = null;
    }
  }

  // Tirée vers l'anneau, puis balancement comme un pendule.
  updateHanging(dt) {
    const w = this.world;
    const g = this.grap;
    const a = g.anchor;
    const I = Input;
    g.t += dt;
    this.prevBottom = this.y + this.h;
    this.onGround = false;
    this.platform = null;
    this.crouch = false;
    const hx = this.cx;
    const hy = this.y + 14;
    if (g.phase === 'pull') {
      const dx = a.x - hx;
      const dy = a.y - hy;
      const d = Math.hypot(dx, dy);
      if (d <= g.len + 4) {
        g.phase = 'swing';
        g.ang = Math.atan2(hx - a.x, hy - a.y);
        const tvx = Math.cos(g.ang);
        const tvy = -Math.sin(g.ang);
        g.angV = clamp((this.vx * tvx + this.vy * tvy) / g.len, -5, 5);
      } else {
        this.vx = (dx / d) * GRAPPLE.pull;
        this.vy = (dy / d) * GRAPPLE.pull;
        if (Math.abs(dx) > 4) this.facing = Math.sign(dx);
        const px = this.x;
        const py = this.y;
        w.moveBody(this, dt);
        if (Math.hypot(this.x - px, this.y - py) < GRAPPLE.pull * dt * 0.3) {
          g.stuckT += dt;
          if (g.stuckT > 0.25) this.releaseGrapple(false);
        }
        if (I.pressed.jump) this.releaseGrapple(true);
        return;
      }
    }
    // balancement
    const dir = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0);
    if (dir) this.facing = dir;
    g.angV += (-(PHYS.gravity / g.len) * 0.9 * Math.sin(g.ang) + dir * 6 * Math.cos(g.ang) - g.angV * 0.35) * dt;
    const prevAng = g.ang;
    g.ang = clamp(g.ang + g.angV * dt, -1.35, 1.35);
    if (Math.abs(g.ang) >= 1.35) g.angV *= -0.2;
    const nx = a.x + g.len * Math.sin(g.ang) - this.w / 2;
    const ny = a.y + g.len * Math.cos(g.ang) - 14;
    if (w.boxSolid(nx, ny, this.w, this.h)) {
      g.ang = prevAng;
      g.angV *= -0.3;
    } else {
      this.x = nx;
      this.y = ny;
    }
    this.vx = g.len * g.angV * Math.cos(g.ang);
    this.vy = -g.len * g.angV * Math.sin(g.ang);
    if (I.pressed.jump) this.releaseGrapple(true);
    else if (I.pressed.down) this.releaseGrapple(false);
    else if (I.pressed.grapple) this.startGrapple();
  }

  releaseGrapple(jump) {
    this.grap = null;
    this.onGround = false;
    this.coyote = 0;
    this.jumping = false;
    if (jump) {
      const dir = (Input.held.right ? 1 : 0) - (Input.held.left ? 1 : 0);
      this.vy = Math.min(this.vy, 0) * 0.5 - 760;
      this.vx = clamp(this.vx + dir * 80, -470, 470);
      Sound.sfx.jump();
    }
    this.vy = Math.max(this.vy, -1150);
    this.boostT = 0.8;
  }

  checkPlatforms() {
    if (this.vy < 0) return;
    for (const p of this.world.platforms) {
      if (this.x + this.w > p.x + 3 && this.x < p.x + p.w - 3) {
        const bottom = this.y + this.h;
        if (bottom >= p.y && this.prevBottom <= p.y + 8) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
          this.platform = p;
          return;
        }
      }
    }
    this.platform = null;
  }

  throwIt(kind) {
    const g = this.world.game;
    if (this.throwT > 0 || this.pound || this.hurtT > 0) return;
    if (g[kind] <= 0) return;
    g[kind]--;
    this.throwT = 0.28;
    this.throwAnim = 0.22;
    this.world.projectiles.push(new Throwable(this.world, kind, this.cx + this.facing * 14, this.y + 24, this.facing, this.vx));
    Sound.sfx.throwIt();
  }

  bounceOff() {
    this.pound = 0;
    this.vy = -(Input.held.jump ? PHYS.bounceHeld : PHYS.bounce);
    this.jumping = Input.held.jump;
    this.onGround = false;
    this.platform = null;
  }

  heal(n) {
    this.energy = Math.min(this.world.game.energyMax, this.energy + n);
  }

  // kind : ce qui l'a touchée (voir OUCH)
  hurt(src, kind) {
    if (this.dead || this.won || this.invuln > 0 || this.star > 0) return false;
    const w = this.world;
    if (!OUCH[kind]) kind = 'hit';
    const O = OUCH[kind];
    this.energy -= 1;
    Sound.sfx.hurt();
    Sound.sfx.ouch(kind);
    w.shake(6);
    this.ouch = { kind, t: 0, dur: O.dur, seed: Math.random() * 100 };
    if (O.text) w.popText(this.cx, this.y - 22, O.text, O.color, 20);
    if (this.energy <= 0) {
      this.die('hurt');
      return true;
    }
    this.invuln = 1.6;
    this.hurtT = O.lock;
    this.grap = null;
    const sx = src ? src.x + (src.w || 0) / 2 : this.cx - this.facing;
    const d = Math.sign(this.cx - sx) || -this.facing;
    this.vx = d * O.vx;
    this.vy = O.vy;
    if (O.freeze) {
      this.stunT = O.freeze;
      this.stunVx = this.vx;
      this.stunVy = this.vy;
      this.vx = 0;
      this.vy = 0;
    }
    this.pound = 0;
    this.platform = null;
    this.onGround = false;
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'spark', x: this.cx, y: this.y + 10, vx: rand(-160, 160), vy: rand(-200, -40), life: 0.5, size: 6, color: '#fff27a' });
    }
    return true;
  }

  // Les petits effets pendant que Malice a mal : fumée, toux, anneaux, pois qui sautent…
  updateOuch(dt) {
    const w = this.world;
    const k = this.ouch;
    const t0 = k.t;
    k.t += dt;
    // si elle tombe, on garde l'animation au moment où ça se voit le mieux
    if (this.dead) k.t = Math.min(k.t, OUCH[k.kind].hold);
    const t = k.t;
    const passed = (time) => t0 < time && t >= time;
    // point du dessin de Malice (x vers l'avant, y depuis les pieds) dans le monde
    const f = this.dead ? 1 : this.facing;
    const at = (x, y) => ({ x: this.cx + f * x, y: this.y + this.h + 1 + y });
    switch (k.kind) {
      case 'zap': {
        const p = at(rand(-8, 8), -58);
        if (this.stunT > 0 || (this.dead && this.deathT < 0.5)) {
          if (Math.random() < dt * 20) {
            w.spawn({ type: 'spark', x: this.cx + rand(-22, 22), y: this.y + rand(0, this.h), vx: rand(-90, 90), vy: rand(-90, 20), life: 0.3, size: rand(3, 5), color: '#fff59a' });
          }
        } else if (Math.random() < dt * 12) {
          // un peu grillée : de la fumée sort de la tête
          w.spawn({ type: 'smoke', x: p.x, y: p.y, vx: rand(-15, 15), vy: -55, life: 0.7, size: 4, color: '#777' });
        }
        break;
      }
      case 'soot': {
        if (Math.random() < dt * 10) {
          const p = at(rand(-10, 6), -62);
          w.spawn({ type: 'smoke', x: p.x, y: p.y, vx: rand(-15, 15), vy: -50, life: 0.8, size: 4, color: '#666' });
        }
        // kof ! un petit nuage sort de la bouche
        if (Art.COUGHS.some(passed)) {
          Sound.sfx.cough();
          const p = at(17, -30);
          for (let i = 0; i < 3; i++) {
            w.spawn({ type: 'smoke', x: p.x, y: p.y, vx: f * rand(50, 110), vy: rand(-30, 10), life: 0.5, size: rand(3, 5), color: '#555' });
          }
        }
        break;
      }
      case 'hypno':
        if (Math.random() < dt * 4) {
          const p = at(9, -44);
          w.spawn({ type: 'ring', x: p.x, y: p.y, life: 0.6, size: 26, color: 'rgba(160,80,255,0.8)' });
        }
        break;
      case 'scramble':
        if (Art.SCRAMBLE_BACK.some(passed)) Sound.sfx.click();
        break;
      case 'spots':
        Art.MALICE_SPOTS.forEach(([x, y], i) => {
          if (!passed(Art.spotPop(i))) return;
          const p = at(x, y);
          Sound.sfx.pop();
          w.spawn({ type: 'dot', x: p.x, y: p.y, vx: rand(-100, 100), vy: rand(-240, -140), g: 900, life: 0.6, size: 2.2, color: '#151515' });
        });
        break;
      default: break;
    }
    if (t >= k.dur && !this.dead) this.ouch = null;
  }

  die(cause) {
    if (this.dead || this.won) return;
    this.dead = true;
    this.cause = cause;
    if (cause !== 'hurt') this.ouch = null;
    this.stunT = 0;
    this.deathT = 0;
    this.energy = 0;
    this.star = 0;
    this.vx = 0;
    this.vy = -780;
    this.platform = null;
    if (cause === 'lava') Sound.sfx.lava(); else Sound.sfx.die();
    this.world.shake(5);
    this.world.game.onPlayerDeath();
  }

  draw(ctx) {
    let pose = 'idle';
    const hanging = this.grap && (this.grap.phase === 'pull' || this.grap.phase === 'swing');
    const k = this.ouch;
    // tout son corps réagit à ce qui lui a fait mal
    const ouching = k && (this.dead || k.t < OUCH[k.kind].pose);
    if (k) k.shock = k.kind === 'zap' && (this.dead ? this.deathT < 0.5 : this.stunT > 0);
    if (this.dead) pose = k ? 'ouch' : 'hurt';
    else if (this.won) pose = this.onGround ? 'win' : 'jump';
    else if (hanging) pose = 'hang';
    else if (this.pound) pose = 'pound';
    else if (this.crouch) pose = 'crouch';
    else if (ouching) pose = 'ouch';
    else if (!this.onGround) pose = this.vy < 0 ? 'jump' : 'fall';
    else if (this.throwAnim > 0) pose = 'throw';
    else if (Math.abs(this.vx) > 15) pose = Math.abs(this.vx) > PHYS.run + 20 ? 'run' : 'walk';
    if (this.throwAnim > 0 && !this.onGround && !this.pound) pose = 'throw';

    let sx = 1;
    let sy = 1;
    if (this.land > 0 && !this.dead) {
      const k = this.land / 0.12;
      sx = 1 + 0.16 * k;
      sy = 1 - 0.14 * k;
    } else if (!this.onGround && this.vy < -500) {
      sx = 0.92;
      sy = 1.08;
    }
    // elle clignote (invincible un moment), mais pas pendant qu'on voit bien ce qui lui arrive
    const blink = this.invuln > 0 && !this.dead && !ouching && Math.floor(this.invuln * 14) % 2 === 0;
    ctx.save();
    if (blink) ctx.globalAlpha = 0.35;
    if (this.onGround && !this.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ellipsePath(ctx, this.cx, this.y + this.h + 1, 15, 4);
      ctx.fill();
    }
    if (this.pound === 1) {
      const a = (1 - this.poundT / PHYS.poundHang) * Math.PI * 2 * this.facing;
      ctx.translate(this.cx, this.y + this.h / 2);
      ctx.rotate(a);
      ctx.translate(-this.cx, -(this.y + this.h / 2));
    } else if (this.superSpin > 0) {
      const a = (1 - this.superSpin / 0.55) * Math.PI * 2 * this.facing;
      ctx.translate(this.cx, this.y + this.h / 2);
      ctx.rotate(a);
      ctx.translate(-this.cx, -(this.y + this.h / 2));
    }
    // moustache-grappin : la corde part de la moustache jusqu'à l'anneau
    let rot = 0;
    if (hanging) {
      const g = this.grap;
      rot = g.phase === 'swing' ? -g.ang : -Math.atan2(this.cx - g.anchor.x, this.y + 14 - g.anchor.y);
    }
    if (this.grap) {
      const m = this.mustachePoint();
      const ox = this.cx;
      const oy = this.y + 14;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const mx = ox + (m.x - ox) * c - (m.y - oy) * s;
      const my = oy + (m.x - ox) * s + (m.y - oy) * c;
      Art.mustacheRope(ctx, mx, my, this.grap.tipX, this.grap.tipY, this.t, this.grap.phase !== 'miss' && this.grap.phase !== 'shoot');
    }
    if (rot) {
      ctx.translate(this.cx, this.y + 14);
      ctx.rotate(rot);
      ctx.translate(-this.cx, -(this.y + 14));
    }
    if (this.dead && this.cause === 'lava') {
      ctx.globalAlpha = 1;
    }
    Art.malice(ctx, this.cx, this.y + this.h + 1, {
      facing: this.dead ? 1 : this.facing,
      pose,
      t: this.t,
      ph: this.ph,
      sx,
      sy,
      palette: this.star > 0 ? Art.maliceRainbow(this.t) : (this.dead && this.cause === 'lava' ? LAVA_PALETTE : null),
      holding: this.holding,
      face: pose === 'idle' ? this.mimic : null,
      ouch: k,
    });
    ctx.restore();
  }
}

const LAVA_PALETTE = Object.assign({}, Art.MALICE, {
  skin: '#5a3a30', skinShade: '#3a2420', shirt: '#6a5a5a', shirtShade: '#4a3a3a',
  overall: '#7a3a4a', overallDark: '#5a2a3a', hair: '#7a6a3a', hairDark: '#5a4a2a',
  hat: '#7a3a4a', hatDark: '#5a2a3a', hatLight: '#8a4a5a',
});

// ======================= PROJECTILES DE MALICE =======================
class Throwable {
  constructor(world, kind, x, y, dir, pvx) {
    this.world = world;
    this.kind = kind;
    this.w = 18;
    this.h = 18;
    this.x = x - 9;
    this.y = y - 9;
    this.vx = dir * (kind === 'caramel' ? 440 : 520) + pvx * 0.3;
    this.vy = kind === 'caramel' ? -280 : -160;
    this.g = kind === 'caramel' ? 1300 : 650;
    this.t = 0;
    this.dead = false;
  }

  update(dt) {
    const w = this.world;
    this.t += dt;
    this.vy += this.g * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    if (w.solidAt(cx, cy) || this.t > 2.5 || this.y > w.height) {
      this.splat();
      return;
    }
    for (const e of w.enemies) {
      if (e.dying || e.dead) continue;
      if (overlap(this, e)) {
        e.hitBy(this.kind);
        this.dead = true;
        for (let i = 0; i < 8; i++) {
          w.spawn({
            type: this.kind === 'caramel' ? 'dot' : 'debris', x: cx, y: cy,
            vx: rand(-200, 200), vy: rand(-250, -50), g: 900, life: 0.5, size: rand(3, 6),
            color: this.kind === 'caramel' ? '#d98a2e' : '#f7d36b',
          });
        }
        return;
      }
    }
  }

  splat() {
    const w = this.world;
    this.dead = true;
    Sound.sfx.splat();
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    for (let i = 0; i < 6; i++) {
      w.spawn({
        type: this.kind === 'caramel' ? 'dot' : 'debris', x: cx, y: cy,
        vx: rand(-150, 150), vy: rand(-200, -50), g: 900, life: 0.45, size: rand(2, 5),
        color: this.kind === 'caramel' ? '#d98a2e' : '#f7d36b',
      });
    }
  }

  draw(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    if (this.kind === 'caramel') Art.caramelBlob(ctx, cx, cy, 10, this.t);
    else Art.chip(ctx, cx, cy, 1.2, this.t * 14);
  }
}

// ======================= ENNEMIS =======================
class Enemy {
  constructor(world, x, y, w, h) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.dir = -1;
    this.onGround = false;
    this.stuck = 0;
    this.fat = false;
    this.fatRest = false;
    this.fatT = 0;
    this.dying = false;
    this.dead = false;
    this.dieT = 0;
    this.t = Math.random() * 5;
    this.legPhase = 0;
    this.pantT = 0;
    this.restT = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  harmful() {
    return !this.dying && this.stuck <= 0 && !(this.fat && this.fatRest);
  }

  update(dt) {
    const w = this.world;
    this.t += dt;
    if (this.dying) {
      this.dieT += dt;
      if (this.deathType === 'stomp') {
        if (this.dieT > 0.45) {
          this.dead = true;
          w.puff(this.cx, this.y + this.h - 10);
        }
      } else {
        this.vy += PHYS.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y > w.height + 80) this.dead = true;
      }
      return;
    }
    if (this.stuck > 0) {
      this.stuck -= dt;
      this.vx = 0;
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      w.moveBody(this, dt);
      if (this.stuck <= 0) {
        Sound.sfx.unstuck();
        for (let i = 0; i < 6; i++) {
          w.spawn({ type: 'dot', x: this.cx, y: this.y + this.h - 8, vx: rand(-150, 150), vy: rand(-200, -60), g: 900, life: 0.5, size: 4, color: '#d98a2e' });
        }
        this.onUnstuck();
      }
    } else if (this.fat) {
      this.updateFat(dt);
    } else {
      this.ai(dt);
    }
    if (w.inLava(this) || this.y > w.height + 40) {
      this.dead = true;
      w.puff(this.cx, this.y + this.h, '#555');
    }
  }

  updateFat(dt) {
    const w = this.world;
    this.fatT -= dt;
    if (this.fatRest) {
      this.vx = 0;
      if (this.fatT <= 0) {
        this.fatRest = false;
        this.fatT = rand(1.3, 1.9);
      }
      this.restT += dt;
      this.pantT -= dt;
      if (this.pantT <= 0) {
        this.pantT = 0.45;
        // essoufflé pour toujours (mode Bébé) : on n'entend plus haleter au bout de quelques secondes
        if (w.onScreen(this) && this.restT < 4) Sound.sfx.pant();
        w.spawn({ type: 'drop', x: this.cx + rand(-18, 18), y: this.y - 4, vx: rand(-60, 60), vy: rand(-140, -60), g: 600, life: 0.6, size: 1 });
      }
    } else {
      this.vx = this.dir * 32;
      this.legPhase += dt * 4;
      if (this.fatT <= 0) {
        this.fatRest = true;
        this.fatT = rand(2.2, 3);
        this.pantT = 0;
        this.restT = 0;
      }
    }
    this.walkPhysics(dt, true);
  }

  walkPhysics(dt, turnAtEdges) {
    const w = this.world;
    this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
    if (turnAtEdges && this.onGround && this.vx !== 0 && !w.groundAhead(this)) {
      this.dir *= -1;
      this.vx = -this.vx;
    }
    const res = w.moveBody(this, dt);
    if (res.wall) this.dir *= -1;
    return res;
  }

  hitBy(kind) {
    const w = this.world;
    w.game.addScore(50);
    if (kind === 'caramel') {
      this.stuck = w.diff.forever ? Infinity : STUCK_TIME;
      this.vx = 0;
      Sound.sfx.stick();
      w.popText(this.cx, this.y - 6, 'Collé !', '#ffcf6a');
      this.onStuck();
    } else if (!this.fat) {
      this.fat = true;
      if (w.diff.forever) {
        // tout de suite essoufflé, et pour toujours
        this.fatRest = true;
        this.fatT = Infinity;
        this.pantT = 0;
        this.restT = 0;
      } else {
        this.fatRest = false;
        this.fatT = 1.2;
      }
      Sound.sfx.crunch();
      Sound.sfx.fat();
      w.popText(this.cx, this.y - 6, 'Miam !', '#b6ff7a');
      this.onFat();
    } else {
      Sound.sfx.crunch();
    }
  }

  onStuck() {}
  onFat() {}
  onUnstuck() {}

  stomp() {
    this.kill('stomp');
  }

  kill(type) {
    if (this.dying) return;
    const w = this.world;
    this.dying = true;
    this.deathType = type;
    this.dieT = 0;
    this.stuck = 0;
    if (type === 'stomp') {
      Sound.sfx.stomp();
    } else {
      Sound.sfx.kill();
      this.vy = -520;
      this.vx = (Math.sign(this.cx - w.player.cx) || 1) * 90;
    }
    w.game.addScore(100);
    w.popText(this.cx, this.y - 4, '+100', '#ffffff');
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'spark', x: this.cx, y: this.y + 6, vx: rand(-180, 180), vy: rand(-220, -60), life: 0.45, size: rand(4, 7), color: '#fff6a0' });
    }
  }

  draw(ctx) {
    const bx = this.cx;
    const by = this.y + this.h;
    ctx.save();
    if (this.onGround && !this.dying) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ellipsePath(ctx, bx, by + 1, this.w * (this.fat ? 0.7 : 0.5), 4);
      ctx.fill();
    }
    ctx.translate(bx, by);
    if (this.dying && this.deathType === 'stomp') {
      const k = Math.min(1, this.dieT / 0.12);
      ctx.scale(1 + 0.45 * k, 1 - 0.7 * k);
    } else if (this.dying) {
      ctx.translate(0, -this.h / 2);
      ctx.rotate(Math.PI);
      ctx.translate(0, -this.h / 2);
    }
    if (this.fat) {
      const pant = this.fatRest ? Math.sin(this.t * 14) * 0.035 : Math.sin(this.t * 7) * 0.015;
      ctx.scale(1 + pant, 1 - pant);
    }
    if (this.stuck > 0 && !this.dying) ctx.translate(Math.sin(this.t * 40) * 1.2, 0);
    this.drawBody(ctx, 0, 0);
    ctx.restore();
    if (this.dying) return;
    if (this.fat && this.fatRest && this.stuck <= 0) {
      // tout essoufflé : il tire la langue et transpire
      const m = this.mouth();
      Art.tiredFace(ctx, bx + m.x, by + m.y, this.t, true);
      Art.sweat(ctx, bx - this.w * 0.75, by - this.h * 1.0 + Math.sin(this.t * 6) * 2, 1.3);
      Art.sweat(ctx, bx + this.w * 0.75, by - this.h * 0.85 + Math.cos(this.t * 5) * 2, 1.1);
    }
    if (this.stuck > 0) {
      const fade = Math.min(1, this.stuck / 1.5);
      const blink = this.stuck < 2 && Math.floor(this.stuck * 8) % 2 === 0 ? 0.5 : 1;
      Art.caramelGoo(ctx, bx, by + 1, this.w * (this.fat ? 1.4 : 1), 20, this.t, fade * blink);
    }
  }

  mouth() { return { x: 0, y: -16 }; }
}

class EyeMonster extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 38, 50);
    this.ouch = 'hypno'; // ce qu'il fait à Malice quand il la touche (voir OUCH)
    this.hue = choose([140, 200, 30, 280, 320]);
    this.chasing = false;
    this.alertT = 0;
    this.blinkT = rand(1, 4);
    this.lid = 0;
    this.look = { x: -1, y: 0 };
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - (this.y + 17);
    const sees = !p.dead && !p.won && Math.abs(dx) < 330 && Math.abs(dy) < 130;
    if (sees && !this.chasing) {
      this.alertT = 0.4;
      if (this.onGround) this.vy = -260;
      w.popText(this.cx, this.y - 10, '!', '#ff4040', 30);
    }
    this.chasing = sees;
    this.alertT -= dt;
    if (sees && Math.abs(dx) > 8) this.dir = Math.sign(dx);
    const speed = this.alertT > 0 ? 0 : sees ? w.diff.eyeChase : 55;
    let want = this.dir * speed;
    if (this.onGround && want !== 0 && !w.groundAhead(this)) {
      if (sees) want = 0;
      else {
        this.dir *= -1;
        want = this.dir * speed;
      }
    }
    this.vx = want;
    this.legPhase += dt * (Math.abs(this.vx) * 0.11 + 1);
    this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
    const res = w.moveBody(this, dt);
    if (res.wall && !sees) this.dir *= -1;
    const d = Math.hypot(dx, dy) || 1;
    const tx = sees ? dx / d : this.dir;
    const ty = sees ? dy / d : 0;
    this.look.x += (tx - this.look.x) * Math.min(1, dt * 8);
    this.look.y += (ty - this.look.y) * Math.min(1, dt * 8);
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.lid = Math.min(1, this.lid + dt * 12);
      if (this.blinkT < -0.16) {
        this.blinkT = rand(2, 5);
      }
    } else {
      this.lid = Math.max(0, this.lid - dt * 12);
    }
  }

  drawBody(ctx, x, y) {
    let lid = this.lid;
    if (this.fat) lid = 0;
    if (this.stuck > 0) lid = 0;
    Art.eyeMonster(ctx, x, y, {
      dir: this.dir, legPhase: this.legPhase, look: this.look,
      chasing: this.chasing && !this.fat && this.stuck <= 0, hue: this.hue, lid,
      moving: Math.abs(this.vx) > 1, fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: this.dir * 7, y: -16 }; }
}

class Rubik extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 40, 40);
    this.ouch = 'scramble';
    this.state = 'calm';
    this.hopT = rand(0.4, 1.4);
    this.colors = Array.from({ length: 9 }, () => choose(Art.CUBE_COLORS));
    this.top = Array.from({ length: 3 }, () => choose(Art.CUBE_COLORS));
    this.side = Array.from({ length: 3 }, () => choose(Art.CUBE_COLORS));
    this.shuffleT = 0;
    this.turn = 0;
    this.turnRow = -1;
    this.look = { x: 0, y: 0 };
    this.clickT = 0;
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - this.cy;
    const d = Math.hypot(dx, dy) || 1;
    this.look.x = dx / d;
    this.look.y = dy / d;
    if (this.state === 'calm') {
      if (this.onGround) this.vx = approach(this.vx, 0, 900 * dt);
      this.hopT -= dt;
      if (this.onGround && this.hopT <= 0) {
        if (!w.groundAhead(this, 40)) this.dir *= -1;
        this.vy = -360;
        this.vx = this.dir * 95;
        this.hopT = rand(1.0, 1.6);
        this.onGround = false;
      }
      if (!p.dead && !p.won && Math.abs(dx) < 200 && Math.abs(dy) < 110 && this.onGround) {
        this.state = 'angry';
        this.angryT = w.diff.cubeFuse;
        w.popText(this.cx, this.y - 16, 'Grrr !', '#ff5a3a', 22);
      }
    } else {
      this.vx = 0;
      this.angryT -= dt;
      this.shuffleT -= dt;
      this.turn = (this.turn + dt * 7) % 1;
      if (this.shuffleT <= 0) {
        this.shuffleT = 0.08;
        this.colors[randInt(0, 8)] = choose(Art.CUBE_COLORS);
        this.colors[randInt(0, 8)] = choose(Art.CUBE_COLORS);
        this.top[randInt(0, 2)] = choose(Art.CUBE_COLORS);
        this.side[randInt(0, 2)] = choose(Art.CUBE_COLORS);
        if (this.turn < 0.15) this.turnRow = randInt(0, 2);
      }
      this.clickT -= dt;
      if (this.clickT <= 0 && w.onScreen(this)) {
        this.clickT = Math.max(0.05, this.angryT * 0.1);
        Sound.sfx.click();
      }
      if (this.angryT < 0.6 && Math.random() < dt * 20) {
        w.spawn({ type: 'smoke', x: this.cx + rand(-14, 14), y: this.y, vy: -80, life: 0.5, size: 6, color: '#ddd' });
      }
      if (this.angryT <= 0) {
        this.explode();
        return;
      }
    }
    this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
    const res = this.world.moveBody(this, dt);
    if (res.wall) this.dir *= -1;
  }

  explode() {
    const w = this.world;
    this.dead = true;
    Sound.sfx.explode();
    w.shake(10);
    const cols = this.colors.concat(this.top);
    for (let i = 0; i < 10; i++) {
      w.hazards.push(new CubeBit(w, this.cx, this.cy, rand(-340, 340), rand(-720, -300), cols[i % cols.length]));
    }
    w.spawn({ type: 'ring', x: this.cx, y: this.cy, life: 0.4, size: 90, color: 'rgba(255,240,180,0.9)' });
    for (let i = 0; i < 10; i++) {
      w.spawn({ type: 'smoke', x: this.cx + rand(-20, 20), y: this.cy + rand(-20, 20), vx: rand(-80, 80), vy: rand(-80, 0), life: 0.7, size: rand(10, 18), color: '#e8e0f0' });
    }
  }

  onStuck() { this.state = 'calm'; this.hopT = 1; }
  onFat() { this.state = 'calm'; }

  drawBody(ctx, x, y) {
    const angry = this.state === 'angry' && !this.fat && this.stuck <= 0;
    Art.rubik(ctx, x, y, {
      colors: this.colors, top: this.top, side: this.side,
      angry: angry ? 1 : 0, shake: angry ? rand(-2, 2) * (1.6 - Math.min(1.5, this.angryT)) : 0,
      look: this.look, turn: angry ? this.turn : 0, turnRow: angry ? this.turnRow : -1, t: this.t,
      fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: 0, y: -17 }; }
}

class Ladybug extends Enemy {
  constructor(world, x, y, flying) {
    super(world, x, y, 54, 40);
    this.ouch = 'spots';
    this.flying = flying;
    this.shootT = rand(1.2, 2.5);
    this.aimT = 0;
    this.open = 0;
    this.spots = 7;
    this.spotT = 0;
    this.homeX = x;
    this.homeY = y;
    this.ft = Math.random() * 6;
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const dx = p.cx - this.cx;
    if (this.aimT > 0) {
      this.aimT -= dt;
      this.open = Math.min(1, this.open + dt * 5);
      if (Math.abs(dx) > 4) this.dir = Math.sign(dx);
      if (this.aimT <= 0) this.shoot();
    } else {
      this.open = Math.max(0, this.open - dt * 4);
      this.shootT -= dt;
      if (this.shootT <= 0 && w.onScreen(this, -20) && !p.dead && !p.won && Math.abs(dx) < 520) {
        this.aimT = 0.6;
      }
    }
    this.spotT += dt;
    if (this.spots < 7 && this.spotT > 1.2) {
      this.spots++;
      this.spotT = 0;
    }
    if (this.flying) {
      if (this.aimT <= 0) this.ft += dt;
      const nx = this.homeX + Math.sin(this.ft * 0.7) * TILE * 2.5;
      const ny = this.homeY + Math.sin(this.ft * 2.1) * 14;
      if (this.aimT <= 0 && Math.abs(nx - this.x) > 0.05) this.dir = Math.sign(nx - this.x);
      this.x = nx;
      this.y = ny;
      this.legPhase += dt * 6;
    } else {
      this.vx = this.aimT > 0 ? 0 : this.dir * 42;
      this.legPhase += dt * (this.vx ? 9 : 0);
      this.walkPhysics(dt, true);
    }
  }

  shoot() {
    const w = this.world;
    const p = w.player;
    const sx = this.cx + this.dir * 6;
    const sy = this.y + 4;
    const dx = p.cx - sx;
    const dy = p.cy - sy;
    const d = Math.hypot(dx, dy) || 1;
    const sp = w.diff.dotSpeed;
    w.hazards.push(new BlackDot(w, sx, sy, (dx / d) * sp, (dy / d) * sp));
    this.spots = Math.max(0, this.spots - 1);
    this.spotT = 0;
    this.shootT = rand(w.diff.shootMin, w.diff.shootMax);
    if (w.onScreen(this)) Sound.sfx.shoot();
  }

  onStuck() { this.flying = false; this.aimT = 0; this.open = 0; }
  onFat() { this.flying = false; this.aimT = 0; this.open = 0; }

  drawBody(ctx, x, y) {
    Art.ladybug(ctx, x, y, {
      dir: this.dir, t: this.t, open: this.open, spots: this.spots,
      fly: this.flying && !this.dying, legPhase: this.legPhase, angry: this.aimT > 0,
      fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: this.dir * 31, y: -7 }; }
}

// ======================= DANGERS =======================
class BlackDot {
  constructor(world, x, y, vx, vy) {
    this.world = world;
    this.ouch = 'ko';
    this.w = 14;
    this.h = 14;
    this.x = x - 7;
    this.y = y - 7;
    this.vx = vx;
    this.vy = vy;
    this.life = 4;
    this.dead = false;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0 || this.world.solidAt(this.x + 7, this.y + 7)) {
      this.dead = true;
      this.world.puff(this.x + 7, this.y + 7, '#333');
    }
  }

  // Malice lui saute dessus : le point noir éclate en petites miettes.
  squash() {
    const w = this.world;
    const cx = this.x + 7;
    const cy = this.y + 7;
    this.dead = true;
    Sound.sfx.stomp();
    w.puff(cx, cy, '#333');
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'dot', x: cx, y: cy, vx: rand(-170, 170), vy: rand(-260, -60), g: 900, life: 0.5, size: rand(2.5, 4), color: '#151515' });
    }
    w.game.addScore(50);
    w.popText(cx, this.y - 4, '+50', '#ffffff');
  }

  draw(ctx) {
    const cx = this.x + 7;
    const cy = this.y + 7;
    ctx.fillStyle = 'rgba(255,80,80,0.25)';
    circlePath(ctx, cx - this.vx * 0.05, cy - this.vy * 0.05, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    circlePath(ctx, cx, cy, 10);
    ctx.fill();
    ctx.fillStyle = '#151515';
    circlePath(ctx, cx, cy, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    circlePath(ctx, cx - 2.5, cy - 2.5, 2.2);
    ctx.fill();
  }
}

class CubeBit {
  constructor(world, x, y, vx, vy, color) {
    this.world = world;
    this.ouch = 'soot';
    this.w = 13;
    this.h = 13;
    this.x = x - 6;
    this.y = y - 6;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = 2.6;
    this.rot = 0;
    this.dead = false;
    this.onGround = false;
  }

  update(dt) {
    this.life -= dt;
    this.rot += this.vx * dt * 0.05;
    const vy0 = this.vy + PHYS.gravity * 0.65 * dt;
    this.vy = vy0;
    const res = this.world.moveBody(this, dt);
    if (res.landed && vy0 > 150) {
      this.vy = -vy0 * 0.45;
      this.vx *= 0.7;
    } else if (res.landed) {
      this.vx = approach(this.vx, 0, 600 * dt);
    }
    if (res.wall) this.vx = -this.vx * 0.6;
    if (this.life <= 0 || this.y > this.world.height) this.dead = true;
  }

  harmful() { return this.life > 0.35; }

  draw(ctx) {
    if (this.life < 0.6 && Math.floor(this.life * 12) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x + 6.5, this.y + 6.5);
    ctx.rotate(this.rot);
    ctx.fillStyle = '#111';
    roundRectPath(ctx, -7, -7, 14, 14, 3);
    ctx.fill();
    ctx.fillStyle = this.color;
    roundRectPath(ctx, -5, -5, 10, 10, 2);
    ctx.fill();
    ctx.restore();
  }
}

// Éclair au chocolat qui tombe du ciel puis fait des éclairs électriques par terre.
class Eclair {
  constructor(world, x) {
    this.world = world;
    this.x = x;
    this.groundY = world.surfaceBelow(x, world.cam.y);
    this.phase = 'warn';
    this.timer = 0.85;
    this.y = world.cam.y - 40;
    this.vy = 0;
    this.angle = rand(-0.4, 0.4);
    this.dead = false;
    this.t = 0;
    this.seed = Math.random() * 100;
    Sound.sfx.whistle();
  }

  box() {
    if (this.phase === 'fall') return { x: this.x - 22, y: this.y - 9, w: 44, h: 18 };
    if (this.phase === 'zap') return { x: this.x - 72, y: this.groundY - 34, w: 144, h: 34 };
    return null;
  }

  update(dt) {
    const w = this.world;
    this.t += dt;
    if (this.phase === 'warn') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.phase = 'fall';
        this.y = w.cam.y - 30;
      }
    } else if (this.phase === 'fall') {
      this.vy = Math.min(this.vy + 2000 * dt, 950);
      this.y += this.vy * dt;
      this.angle *= 0.99;
      if (this.y + 8 >= this.groundY) {
        this.y = this.groundY - 8;
        if (this.groundY > w.height) {
          this.dead = true;
          return;
        }
        this.phase = 'zap';
        this.timer = 0.85;
        if (w.onScreen({ x: this.x - 40, y: this.y - 40, w: 80, h: 80 })) {
          Sound.sfx.zap();
          w.shake(4);
        }
        for (let i = 0; i < 10; i++) {
          w.spawn({ type: 'spark', x: this.x, y: this.groundY - 6, vx: rand(-260, 260), vy: rand(-260, -40), g: 600, life: 0.5, size: rand(4, 7), color: '#fff59a' });
        }
        // la décharge électrique touche aussi les ennemis !
        const b = this.box();
        for (const e of w.enemies) {
          if (!e.dying && !e.dead && boxOverlap(e, b.x, b.y, b.w, b.h)) e.kill('zap');
        }
      }
    } else if (this.phase === 'zap') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.phase = 'rest';
        this.timer = 1.2;
      }
    } else {
      this.timer -= dt;
      if (this.timer <= 0) this.dead = true;
    }
  }

  draw(ctx) {
    const w = this.world;
    if (this.phase === 'warn' || this.phase === 'fall') {
      const k = this.phase === 'warn' ? 1 - this.timer / 0.85 : 1;
      // nuage en chocolat qui gronde, avec l'éclair qui dépasse
      const cy = w.cam.y + 42;
      const a = this.phase === 'warn' ? Math.min(1, k * 4) : Math.max(0, 1 - (this.y - cy) / 260);
      ctx.save();
      ctx.globalAlpha = a;
      const shake = this.phase === 'warn' ? Math.sin(this.t * 50) * 2.5 : 0;
      const glow = ctx.createRadialGradient(this.x, cy, 5, this.x, cy, 70);
      glow.addColorStop(0, 'rgba(255,240,120,0.75)');
      glow.addColorStop(1, 'rgba(255,240,120,0)');
      ctx.fillStyle = glow;
      circlePath(ctx, this.x, cy, 70);
      ctx.fill();
      if (this.phase === 'warn') Art.eclair(ctx, this.x + shake, cy + 18 + k * 10, Math.PI / 2 * 0.9, 0.9);
      Scenery.fluffyCloud(ctx, this.x + shake, cy, 0.62, '#8a5638', '#4a2818');
      ctx.restore();
    }
    if (this.phase === 'fall') {
      Art.eclair(ctx, this.x, this.y, this.angle + Math.PI / 2 * 0.15, 1);
    } else if (this.phase === 'zap' || this.phase === 'rest') {
      const a = this.phase === 'rest' ? Math.max(0, this.timer / 1.2) : 1;
      ctx.save();
      ctx.globalAlpha = a;
      Art.eclair(ctx, this.x, this.groundY - 8, 0, 1);
      ctx.restore();
      if (this.phase === 'zap') {
        const seed = Math.floor(this.t * 20) + this.seed;
        Art.sparks(ctx, this.x, this.groundY - 6, 72, seed, Math.min(1, this.timer * 3));
      }
    }
  }

  // Ombre au sol et "!" dessinés par-dessus Malice pour qu'on les voie bien.
  drawWarning(ctx) {
    if (this.phase !== 'warn' && this.phase !== 'fall') return;
    if (this.groundY >= this.world.height) return;
    const k = this.phase === 'warn' ? 1 - this.timer / 0.85 : 1;
    ctx.fillStyle = `rgba(60,0,60,${0.2 + 0.25 * k})`;
    ellipsePath(ctx, this.x, this.groundY - 2, 12 + 18 * k, 4 + 3 * k);
    ctx.fill();
    if (Math.floor(this.t * 8) % 2 === 0) {
      const y = this.groundY - 92;
      ctx.fillStyle = '#ffe94a';
      ctx.strokeStyle = '#7a2a00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x, y - 16);
      ctx.lineTo(this.x + 15, y + 11);
      ctx.lineTo(this.x - 15, y + 11);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.fillStyle = '#7a2a00';
      ctx.font = '700 17px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', this.x, y + 3);
    }
  }
}

// ======================= BONUS =======================
const ITEM_SIZE = { candy: 26, lollipop: 28, ball: 24, fruit: 34, caramel: 34, chips: 34, star: 36 };

class Item {
  constructor(world, kind, cx, cy, fromBlock) {
    this.world = world;
    this.kind = kind;
    const s = ITEM_SIZE[kind];
    this.w = s;
    this.h = s;
    this.x = cx - s / 2;
    this.baseY = fromBlock ? cy - TILE * 0.95 - s / 2 : cy - s / 2;
    this.startY = cy - s / 2;
    this.y = fromBlock ? this.startY : this.baseY;
    this.appear = fromBlock ? 0.45 : 0;
    this.t = Math.random() * 6;
    this.v = randInt(0, 5);
    this.dead = false;
  }

  update(dt) {
    this.t += dt;
    if (this.appear > 0) {
      this.appear -= dt;
      const k = 1 - Math.max(0, this.appear) / 0.45;
      this.y = lerp(this.startY, this.baseY, 1 - (1 - k) * (1 - k));
    } else {
      this.y = this.baseY + Math.sin(this.t * 3) * 3;
    }
    if (this.kind === 'star' && Math.random() < dt * 8) {
      this.world.spawn({ type: 'spark', x: this.x + rand(0, this.w), y: this.y + rand(0, this.h), vy: -20, life: 0.5, size: rand(3, 5), color: '#fff59a' });
    }
  }

  draw(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    if (this.kind !== 'candy' && this.kind !== 'ball' && this.kind !== 'lollipop') {
      const gl = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
      gl.addColorStop(0, 'rgba(255,255,220,0.55)');
      gl.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = gl;
      circlePath(ctx, cx, cy, 30);
      ctx.fill();
    }
    switch (this.kind) {
      case 'candy': Art.candy(ctx, cx, cy, 1, this.t, this.v); break;
      case 'lollipop': Art.lollipop(ctx, cx, cy + 2, 1, this.t); break;
      case 'ball': Art.ball(ctx, cx, cy, 11, this.t); break;
      case 'fruit': Art.passionFruit(ctx, cx, cy + 2, 1.15); break;
      case 'caramel': Art.caramel(ctx, cx, cy, 1.2); break;
      case 'chips': Art.chipsBag(ctx, cx, cy + 2, 1.15); break;
      case 'star': Art.star(ctx, cx, cy, 18, this.t); break;
      default: break;
    }
  }
}

// ======================= DÉCOR VIVANT =======================
class MovingPlatform {
  constructor(world, x, y, kind) {
    this.world = world;
    this.kind = kind;
    this.w = TILE * 3;
    this.h = 18;
    this.x0 = x;
    this.y0 = y;
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.range = TILE * 3;
    this.period = 4.6;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    const k = (1 - Math.cos((this.t * Math.PI * 2) / this.period)) / 2;
    const nx = this.kind === 'h' ? this.x0 + k * this.range : this.x0;
    const ny = this.kind === 'v' ? this.y0 - k * this.range : this.y0;
    this.dx = nx - this.x;
    this.dy = ny - this.y;
    this.x = nx;
    this.y = ny;
  }

  draw(ctx) {
    const th = Scenery.THEMES[this.world.theme];
    const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, th.platLight);
    g.addColorStop(0.4, th.plat);
    g.addColorStop(1, th.platDark);
    if (this.world.theme === 'volcano') {
      const gl = ctx.createLinearGradient(0, this.y + this.h, 0, this.y + this.h + 26);
      gl.addColorStop(0, 'rgba(255,130,40,0.5)');
      gl.addColorStop(1, 'rgba(255,130,40,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(this.x + 6, this.y + this.h, this.w - 12, 26);
    }
    ctx.fillStyle = g;
    roundRectPath(ctx, this.x, this.y, this.w, this.h, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    roundRectPath(ctx, this.x + 6, this.y + 2, this.w - 12, 3, 1.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 3; i++) {
      circlePath(ctx, this.x + 24 + i * 48, this.y + 10, 3);
      ctx.fill();
    }
    // petites flèches qui montrent le sens
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const mx = this.x + this.w / 2;
    const my = this.y + 10;
    ctx.beginPath();
    if (this.kind === 'h') {
      ctx.moveTo(mx - 14, my); ctx.lineTo(mx - 8, my - 4); ctx.lineTo(mx - 8, my + 4);
      ctx.moveTo(mx + 14, my); ctx.lineTo(mx + 8, my - 4); ctx.lineTo(mx + 8, my + 4);
    } else {
      ctx.moveTo(mx - 4, my - 3); ctx.lineTo(mx, my - 7); ctx.lineTo(mx + 4, my - 3);
      ctx.moveTo(mx - 4, my + 3); ctx.lineTo(mx, my + 7); ctx.lineTo(mx + 4, my + 3);
    }
    ctx.fill();
  }
}

// « Pouf ! » : étincelles et cercle de lumière quand un drapeau se change en papillon.
function butterflyPouf(w, x, y) {
  w.spawn({ type: 'ring', x, y, life: 0.35, size: 46, color: '#fff3a0' });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    w.spawn({ type: 'spark', x, y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 0.45, size: rand(4, 7), color: choose(['#fff59a', '#ff9fd8', '#ffffff']) });
  }
  w.puff(x, y, '#ffd0e8');
}

// Le papillon qui sort d'un drapeau quand Malice le touche.
// Avec perch : il voltige autour du haut du mât et s'y pose de temps en temps (il s'envole si Malice s'approche).
// Avec orbit : il vient tourner autour de Malice, tantôt devant elle, tantôt derrière.
class Butterfly {
  constructor(world, x, y, o) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = o.size || 1;
    this.perch = o.perch || null;
    this.orbit = !!o.orbit;
    this.star = !!o.star;
    this.t = rand(0, 10);
    this.phase = 0;
    this.age = o.born ? 0 : 99;
    this.mode = o.born ? 'born' : this.perch ? 'perch' : 'fly';
    this.modeT = rand(2, 4);
    this.front = false;
    this.center = null;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    this.age += dt;
    this.modeT -= dt;
    if ((this.age < 1.8 || this.orbit) && this.mode !== 'perch' && Math.random() < dt * 9 && w.onScreen(this)) {
      w.spawn({ type: 'spark', x: this.x + rand(-12, 12), y: this.y + rand(-6, 12), vy: 30, life: 0.5, size: rand(2, 4), color: choose(['#fff59a', '#ff9fd8', '#ffffff']) });
    }
    if (this.mode === 'born') {
      // il sort du drapeau et bat des ailes sur place, puis s'envole
      this.phase += dt * 18;
      if (this.age > 0.6) {
        this.mode = 'fly';
        this.modeT = rand(2.5, 4);
        this.vy = -220;
      }
      return;
    }
    const scared = this.perch && !p.dead && Math.hypot(p.cx - this.perch.x, p.y - this.perch.y) < 50;
    if (this.mode === 'perch') {
      this.phase += dt * 2.2;
      if (scared || this.modeT <= 0) {
        this.mode = 'fly';
        this.modeT = rand(3, 6);
        this.vx = rand(-90, 90);
        this.vy = -200;
      }
      return;
    }
    this.phase += dt * 17;
    if (this.orbit) {
      if (!this.center) this.center = { x: p.cx, y: p.y + 18 };
      const c = this.center;
      const k = Math.min(1, dt * 3);
      c.x += (p.cx - c.x) * k;
      c.y += (p.y + 18 - c.y) * k;
      const a = this.t * 2.2;
      // il rejoint son cercle de plus en plus vite, puis y reste accroché :
      // devant Malice sur la moitié basse, derrière sur la moitié haute
      const k2 = Math.min(1, dt * Math.min(10, 2 + (this.age - 0.6) * 8));
      const ox = this.x;
      const oy = this.y;
      this.x += (c.x + Math.cos(a) * 68 - this.x) * k2;
      this.y += (c.y + Math.sin(a) * 18 - this.y) * k2;
      this.vx = (this.x - ox) / dt;
      this.vy = (this.y - oy) / dt;
      this.front = Math.sin(a) > 0;
      return;
    }
    let tx;
    let ty;
    if (this.mode === 'land') {
      tx = this.perch.x;
      ty = this.perch.y;
      if (scared) {
        this.mode = 'fly';
        this.modeT = rand(2, 3);
      } else if (Math.hypot(tx - this.x, ty - this.y) < 3) {
        this.mode = 'perch';
        this.modeT = rand(2, 4);
        this.x = tx;
        this.y = ty;
        this.vx = 0;
        this.vy = 0;
        return;
      }
    } else {
      tx = this.perch.x + Math.sin(this.t * 1.3) * 48;
      ty = this.perch.y - 20 + Math.sin(this.t * 2.3) * 24;
      if (this.modeT <= 0 && !scared) this.mode = 'land';
    }
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const sp = Math.min(this.mode === 'land' ? 160 : 320, d * 3);
    const k = Math.min(1, dt * 4);
    this.vx += ((dx / d) * sp - this.vx) * k;
    this.vy += ((dy / d) * sp - this.vy) * k;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    // en sortant du drapeau, il grossit avec un petit rebond
    const k = clamp((this.age - 0.15) / 0.45, 0, 1);
    if (k <= 0) return;
    const grow = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
    const perched = this.mode === 'perch';
    let s = this.size * grow;
    if (this.orbit && this.mode !== 'born') s *= 1 + 0.12 * Math.sin(this.t * 2.2);
    const bob = perched ? 0 : -Math.sin(this.phase) * 2 * this.size;
    const p = this.world.player;
    Art.butterfly(ctx, this.x, this.y + bob, s, this.t, {
      open: perched ? 0.6 + 0.4 * Math.cos(this.phase) : 0.5 + 0.5 * Math.cos(this.phase),
      rot: perched ? 0 : clamp(this.vx / 600, -0.35, 0.35),
      look: p ? (p.cx - this.x) / 80 : 0,
      star: this.star,
    });
  }
}

// Drapeau de passage : quand Malice le touche, il se change en papillon (et on y repartira).
class Checkpoint {
  constructor(world, x, y, idx) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.idx = idx;
    this.active = false;
    this.morph = 1;
    this.butterfly = null;
    this.t = 0;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    if (this.morph < 1) this.morph = Math.min(1, this.morph + dt / 0.35);
    if (this.butterfly) this.butterfly.update(dt);
    if (!this.active && !p.dead && p.cx > this.x - 16 && Math.abs(p.y + p.h - this.y) < 220) {
      this.activate(true);
    }
  }

  activate(fx) {
    this.active = true;
    // il se pose sur la boule dorée en haut du mât
    const perch = { x: this.x, y: this.y - 107 };
    if (!fx) {
      this.butterfly = new Butterfly(this.world, perch.x, perch.y, { perch });
      return;
    }
    const w = this.world;
    const cx = this.x + 19;
    const cy = this.y - 23;
    this.morph = 0;
    this.butterfly = new Butterfly(w, cx, cy, { perch, born: true });
    w.game.setCheckpoint(this.idx);
    Sound.sfx.checkpoint();
    Sound.sfx.butterfly();
    w.popText(this.x, this.y - 110, 'Drapeau !', '#ffffff', 22);
    butterflyPouf(w, cx, cy);
  }

  draw(ctx) {
    // gris à mi-mât tant que Malice n'est pas passée ; ensuite il ne reste que le mât et le papillon
    Art.flag(ctx, this.x, this.y, 84, this.t, {
      color: this.active ? '#ff4f9a' : '#c4c4d4',
      lower: 46,
      cloth: this.active ? 1 - this.morph : 1,
    });
    if (this.butterfly) this.butterfly.draw(ctx);
  }
}

// Le grand drapeau de l'arrivée : il descend le long du mât, puis devient un grand papillon étoilé
// qui tourne autour de Malice.
class Goal {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.reached = false;
    this.flagY = 0;
    this.morph = 0;
    this.butterfly = null;
  }

  update(dt) {
    this.t += dt;
    const w = this.world;
    const p = w.player;
    if (!this.reached && !p.dead && p.cx >= this.x - 10) {
      this.reached = true;
      w.game.levelComplete();
    }
    if (this.reached) {
      this.flagY = Math.min(1, this.flagY + dt * 2);
      if (this.flagY >= 1 && !this.butterfly) {
        // le centre du drapeau une fois en bas du mât
        const cx = this.x + 30;
        const cy = this.y - 49;
        this.butterfly = new Butterfly(w, cx, cy, { born: true, orbit: true, star: true, size: 1.6 });
        butterflyPouf(w, cx, cy);
        Sound.sfx.butterfly();
      }
      if (this.butterfly) this.morph = Math.min(1, this.morph + dt / 0.35);
    }
    if (this.butterfly) this.butterfly.update(dt);
  }

  draw(ctx) {
    const h = TILE * 4.5;
    ctx.fillStyle = '#7a5a3a';
    roundRectPath(ctx, this.x - 20, this.y - 14, 40, 14, 4);
    ctx.fill();
    Art.flag(ctx, this.x, this.y - 12, h, this.t, {
      color: '#ff4f9a', w: 56, fh: 38, lower: this.flagY * (h - 60), cloth: 1 - this.morph, ball: '#ffd23a',
      emblem: (g, ex, ey) => Art.star(g, ex, ey, 11, this.t),
    });
    if (this.butterfly && !this.butterfly.front) this.butterfly.draw(ctx);
  }

  // dessiné après Malice, quand le papillon passe devant elle
  drawFront(ctx) {
    if (this.butterfly && this.butterfly.front) this.butterfly.draw(ctx);
  }
}

// Le rocher dans le volcan avec le bébé oiseau.
class BirdGoal {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.reached = false;
    this.chirpT = 1;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    this.chirpT -= dt;
    const near = Math.abs(p.cx - this.x) < 500;
    if (this.chirpT <= 0) {
      this.chirpT = rand(1.2, 2.2);
      if (near && !this.reached) Sound.sfx.chirp();
    }
    if (!this.reached && !p.dead && Math.abs(p.cx - this.x) < 34 && Math.abs(p.y + p.h - this.y) < 60) {
      this.reached = true;
      w.game.victory();
    }
  }

  draw(ctx) {
    if (this.reached) return;
    const p = this.world.player;
    const near = Math.abs(p.cx - this.x) < 420;
    Art.babyBird(ctx, this.x, this.y, this.t, { chirp: this.chirpT > 1.0 });
    if (near) {
      this.world.bubble(this.x, this.y - 48, 'Piou ! Au secours !', 1);
    }
  }
}

// Fleur qui parle (comme dans Mario Wonder) : elle donne des conseils.
class TalkFlower {
  constructor(world, x, y, msg) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.msg = msg;
    this.t = Math.random() * 5;
    this.show = 0;
    this.look = 1;
    this.hue = choose([330, 50, 280, 190]);
  }

  update(dt) {
    const p = this.world.player;
    this.t += dt;
    const near = Math.abs(p.cx - this.x) < 170 && Math.abs(p.cy - this.y) < 200;
    this.show = approach(this.show, near ? 1 : 0, dt * 5);
    this.look = approach(this.look, Math.sign(p.cx - this.x) || 1, dt * 4);
  }

  draw(ctx) {
    const sway = Math.sin(this.t * 2) * 0.08;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#2f9a3a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(3, -14, Math.sin(sway) * 20, -30);
    ctx.stroke();
    ctx.fillStyle = '#45c14f';
    ellipsePath(ctx, -8, -10, 8, 3.5, 0.5);
    ctx.fill();
    ellipsePath(ctx, 8, -14, 8, 3.5, -0.5);
    ctx.fill();
    ctx.translate(Math.sin(sway) * 20, -36);
    ctx.rotate(sway);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + this.t * 0.3;
      ctx.fillStyle = `hsl(${this.hue},90%,${i % 2 ? 62 : 70}%)`;
      ellipsePath(ctx, Math.cos(a) * 13, Math.sin(a) * 13, 9, 7, a);
      ctx.fill();
    }
    ctx.fillStyle = '#fff3b0';
    circlePath(ctx, 0, 0, 11);
    ctx.fill();
    const lx = this.look * 2.5;
    ctx.fillStyle = '#2a1a10';
    ellipsePath(ctx, -4 + lx, -2, 1.8, 2.8);
    ctx.fill();
    ellipsePath(ctx, 4 + lx, -2, 1.8, 2.8);
    ctx.fill();
    const talk = this.show > 0.5 ? Math.abs(Math.sin(this.t * 12)) * 3 : 0;
    ctx.fillStyle = '#c0394a';
    ellipsePath(ctx, lx, 4.5, 3, 1 + talk);
    ctx.fill();
    ctx.restore();
    if (this.show > 0.05 && this.msg) {
      this.world.bubble(this.x, this.y - 64, this.msg, this.show);
    }
  }
}

// ======================= BADGES =======================
// Anneau doré pour la moustache-grappin.
class Anchor {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.t = Math.random() * 6;
    this.flash = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
  }

  draw(ctx) {
    const w = this.world;
    Art.anchorRing(ctx, this.x, this.y, this.t, {
      glow: w.game.hasBadge('grappin'),
      targeted: w.player.target === this && !w.player.dead,
      flash: Math.max(0, this.flash),
    });
  }
}

// Le trophée au bout d'un stage d'entraînement : on y gagne le badge.
class BadgeGoal {
  constructor(world, x, y, kind) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.kind = kind || 'saut';
    this.t = 0;
    this.reached = false;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    if (Math.random() < dt * 10) {
      w.spawn({ type: 'spark', x: this.x + rand(-34, 34), y: this.y - 70 + rand(-34, 34), vy: -20, life: 0.6, size: rand(3, 6), color: choose(['#fff59a', '#7ff0ff', '#ff9fd8']) });
    }
    if (!this.reached && !p.dead && Math.abs(p.cx - this.x) < 36 && p.y < this.y && p.y + p.h > this.y - 120) {
      this.reached = true;
      w.game.levelComplete();
    }
  }

  draw(ctx) {
    // socle
    const g = ctx.createLinearGradient(0, this.y - 30, 0, this.y);
    g.addColorStop(0, '#ffe680');
    g.addColorStop(1, '#d08a10');
    ctx.fillStyle = g;
    roundRectPath(ctx, this.x - 26, this.y - 22, 52, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#fff3c0';
    roundRectPath(ctx, this.x - 30, this.y - 28, 60, 9, 4);
    ctx.fill();
    if (this.reached) return;
    const bob = Math.sin(this.t * 2.5) * 6;
    const gl = ctx.createRadialGradient(this.x, this.y - 75 + bob, 5, this.x, this.y - 75 + bob, 70);
    gl.addColorStop(0, 'rgba(255,250,200,0.7)');
    gl.addColorStop(1, 'rgba(255,250,200,0)');
    ctx.fillStyle = gl;
    circlePath(ctx, this.x, this.y - 75 + bob, 70);
    ctx.fill();
    Art.badge(ctx, this.x, this.y - 80 + bob, 30, this.kind, this.t);
  }
}
