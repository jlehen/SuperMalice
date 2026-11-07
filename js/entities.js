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
  // champignons et guimauves : rebond normal, en gardant le saut appuyé, après un écrasement
  spring: 1150,
  springHeld: 1380,
  bigBounce: 1550,
  // chocolat : on s'y enfonce doucement (pixels par seconde), et au bout de ce temps on perd une vie
  chocoSink: 36,
  chocoTime: 2.8,
  // pissenlit géant : on descend tout doucement, on avance moins vite, il soulève un peu
  // quand on l'attrape, et on remonte dans les courants d'air (pixels par seconde)
  puffFall: 80,
  puffRun: 250,
  puffLift: 300,
  puffRise: 140,
  // bave d'escargot : on n'accroche plus, on garde son élan (accélération et freinage tout petits)
  slimeAcc: 520,
  slimeDec: 280,
  // rivière : on reste un petit moment sous l'eau (on ne voit que des bulles), puis on ressort sur la berge ;
  // la Sirène et le Pingouin nagent, enfoncés de swimDepth dans l'eau
  diveTime: 0.6,
  swimDepth: 18,
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
  // l'eau de la rivière est froide : elle ressort toute mouillée sur la berge, grelotte, claque des dents,
  // et un petit poisson saute de sa casquette
  wet: { dur: 1.8, pose: 1.1, lock: 0.45, vx: 0, vy: -330, hold: 0.6, text: 'Brrr, c\'est froid !', color: '#8fd8ff' },
  // l'escargot : toute gluante de bave verte qui dégouline, elle tire la langue
  slime: { dur: 1.7, pose: 0.45, lock: 0.25, vx: 240, vy: -420, hold: 0.4, text: 'Beurk, de la bave !', color: '#c8f59a' },
  // la taupe qui jaillit du sol : projetée en l'air dans une gerbe de terre, elle retombe toute sale,
  // des mottes sur la tête et un petit ver de terre qui lui fait coucou
  dirt: { dur: 1.9, pose: 0.75, lock: 0.3, vx: 190, vy: -830, hold: 0.45, text: 'Pouah, de la terre !', color: '#e0a86a' },
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
    // dans la rivière de chocolat (monde des bonbons)
    this.inChoco = false;
    this.sinkT = 0;
    this.blubT = 0;
    // le bébé oiseau sur la casquette : il parle (birdTalk), il est rentré chez lui (birdGone)
    this.birdTalk = 0;
    this.birdGone = false;
    this.chirpT = rand(4, 9);
    this.beakT = 0;
    // le pissenlit géant qu'elle tient au-dessus de sa tête (les Grands Arbres)
    this.puff = null;
    // la Rivière aux Nénuphars : sous l'eau (dive : le temps qu'il reste), en train de nager (swim),
    // le dernier endroit bien solide où elle était (safe : on y ressort après être tombée à l'eau),
    // et sur la bave d'un escargot (slick)
    this.dive = 0;
    this.swim = false;
    this.safe = { x: x + this.w / 2, y: y + this.h, pad: null };
    this.slick = false;
    this.slipT = 0;
    // le personnage choisi et son pouvoir (voir heroes.js et pouvoirs.js)
    this.hero = world.game.hero || 'malice';
    this.pow = POWERS[this.hero] || {};
    this.pw = {};
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
      if (this.cause === 'choco' && Math.random() < dt * 12) {
        w.spawn({ type: 'dot', x: this.cx + rand(-12, 12), y: this.y + this.h - rand(0, 30), vy: 60, g: 600, life: 0.8, size: rand(2.5, 4), color: '#6a3418' });
      }
      return;
    }
    if (this.won) {
      this.dropPuff();
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
    // tombée dans la rivière : quelques bulles, puis elle ressort sur la berge
    if (this.dive > 0) {
      this.underwater(dt);
      return;
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
      this.checkPuddle();
      if (w.inLava(this) && !this.lavaProof() && !w.choco) this.die('lava');
      return;
    }
    if (I.pressed.grapple && badgeGrappin && !this.pound && this.hurtT <= 0) this.startGrapple();
    // la bave d'escargot sous les pieds : ça glisse ! (pas sur un nénuphar)
    this.slick = this.onGround && !this.platform && !this.swim && w.slimeUnder(this);
    const pow = this.pow;
    if (this.pw.poseT > 0) this.pw.poseT -= dt;
    if (pow.update) pow.update(this, dt, I);

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
    let top = this.inChoco ? 110 : this.running ? PHYS.sprint : PHYS.run;
    if (pow.top && !this.inChoco) top = pow.top(this, top);
    // avec le pissenlit, on plane sans se presser
    if (this.puff) top = PHYS.puffRun;

    if (this.pound) {
      this.vx = 0;
    } else if (pow.move && pow.move(this, dt, dir)) {
      // le pouvoir s'occupe de la vitesse (charge, glissade…)
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
      // sur la bave, on n'accroche plus : on démarre doucement, et on a du mal à s'arrêter
      if (this.slick) acc = dir ? PHYS.slimeAcc : PHYS.slimeDec;
      this.vx = approach(this.vx, target, acc * dt);
      if (dir) this.facing = dir;
    }
    this.slipping = this.slick && Math.abs(this.vx) > 60 && Math.sign(this.vx) !== dir;
    if (this.slipping) this.slipFx(dt);

    // saut (avec un peu de tolérance pour les enfants)
    if (I.pressed.jump) this.jumpBuf = PHYS.buffer;
    else this.jumpBuf -= dt;
    // dans le chocolat, on peut toujours sauter pour en sortir
    this.coyote = this.onGround || this.inChoco ? PHYS.coyote : this.coyote - dt;
    if (this.jumpBuf > 0 && this.coyote > 0 && !this.pound && !this.puff) {
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
        const v = Math.abs(this.vx) > PHYS.run + 40 ? PHYS.runJump : PHYS.jump;
        this.vy = -(pow.jump ? pow.jump(this, v) : v);
        this.jumping = true;
        Sound.sfx.jump();
      }
      for (let i = 0; i < 5; i++) {
        w.spawn({ type: 'dust', x: this.cx + rand(-10, 10), y: this.y + this.h, vx: rand(-60, 60), vy: rand(-40, -10), life: 0.4, size: rand(4, 7) });
      }
    } else if (I.pressed.jump && !this.onGround && !this.pound && !this.puff && pow.airJump && pow.airJump(this)) {
      // double saut, battement d'ailes, saut de mur…
      this.jumpBuf = 0;
    }
    if (this.jumping && !I.held.jump && this.vy < -PHYS.jumpCut) this.vy = -PHYS.jumpCut;
    if (this.vy >= 0) this.jumping = false;

    // écrasement (bas en l'air) ; avec le pissenlit, bas le lâche
    if (I.pressed.down && this.puff) {
      this.dropPuff();
    } else if (I.pressed.down && !this.onGround && !this.pound) {
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
      if (pow.fall && !this.pound) pow.fall(this, dt);
      if (this.puff) this.floatPuff(dt);
    }
    if (this.inChoco) {
      // on s'enfonce tout doucement ; tout au fond, on ne peut plus que sauter (pas glisser sous le sol)
      this.pound = 0;
      this.vy = Math.min(this.vy, PHYS.chocoSink);
      if (this.y > w.height - 40) this.vx = 0;
    }

    if (I.pressed.caramel) this.throwIt('caramel');
    if (I.pressed.chips) this.throwIt('chips');

    this.prevBottom = this.y + this.h;
    const wasGround = this.onGround;
    const fallSpeed = this.vy;
    // le vent pousse Malice (montagne des nuages), mais pas quand elle reste sagement immobile par terre
    const push = this.onGround && !dir ? 0 : w.windPush(this);
    this.vx += push;
    const pounded = this.pound === 2;
    const res = w.moveBody(this, dt, this.pound === 2 ? (tiles) => w.poundTiles(this, tiles) : null);
    if (!res.wall) this.vx -= push;
    if (res.landed) this.platform = null;
    if (res.ceil) {
      w.headBump(this, res.ceil);
      if (pow.ceil) pow.ceil(this);
    }
    if (!res.landed) this.checkPlatforms();
    // on lâche le pissenlit en atterrissant
    if (this.puff && this.onGround) this.dropPuff();
    if (res.landed) this.springTile();
    if (res.wall && !this.onGround && pow.wall && !this.puff) pow.wall(this, res.wall);

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
    if (this.onGround && !wasGround && pow.land) pow.land(this, fallSpeed, pounded);

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

    this.checkPuddle();

    if (w.inLava(this)) {
      this.dropPuff();
      if (this.lavaProof()) this.lavaBounce();
      else if (w.choco) this.sinkInChoco(dt);
      else this.die('lava');
    } else {
      this.inChoco = false;
      this.sinkT = 0;
      if (this.y > w.height + 60) this.die('fall');
    }
    this.checkWater();
    this.updateSafe();
    this.updateBird(dt);
  }

  // ---------- La rivière (la Rivière aux Nénuphars) ----------
  // Les pieds dans l'eau ? Avec l'étoile, Malice ricoche dessus ; la Sirène et le Pingouin nagent ;
  // les autres tombent dedans : plouf !
  checkWater() {
    const w = this.world;
    const surf = w.waterSurface(this, 0);
    // (debout sur un nénuphar, on n'est pas dans l'eau, même s'il s'enfonce un tout petit peu)
    if (surf === null || this.dead || this.platform) {
      this.swim = false;
      return;
    }
    const feet = this.y + this.h;
    if (this.star > 0) {
      if (feet > surf + 4 && this.vy >= 0) this.ricochet(surf);
    } else if (this.pow.swims) {
      if (this.swim || feet > surf + 4) this.swimIn(surf);
    } else if (feet > surf + 16) {
      this.diveIn(surf);
    }
  }

  // Ils flottent, à moitié dans l'eau, comme sur un sol tout doux : on nage avec les flèches,
  // et on saute pour sortir.
  swimIn(surf) {
    const w = this.world;
    const depth = surf + PHYS.swimDepth;
    if (!this.swim) {
      w.splash(this.cx, surf);
      w.spawn({ type: 'ring', x: this.cx, y: surf, life: 0.5, size: 50, color: 'rgba(200,240,255,0.9)' });
    }
    this.swim = true;
    if (this.y + this.h >= depth && this.vy >= 0) {
      this.y = depth - this.h;
      this.vy = 0;
      this.pound = 0;
      if (!this.onGround) this.land = 0.12;
      this.onGround = true;
      this.coyote = PHYS.coyote;
      this.platform = null;
      // des petites vagues quand on nage
      if (Math.abs(this.vx) > 40 && Math.random() < 0.12) {
        w.spawn({ type: 'ring', x: this.cx - this.facing * 14, y: surf, life: 0.45, size: 22, color: 'rgba(220,245,255,0.8)' });
      }
    }
  }

  // Plouf ! Elle disparaît sous l'eau (on ne voit plus que des bulles).
  diveIn(surf) {
    const w = this.world;
    this.dropPuff();
    this.stopPower();
    this.grap = null;
    this.pound = 0;
    this.platform = null;
    this.crouch = false;
    this.dive = PHYS.diveTime;
    this.diveAt = { x: this.cx, y: surf };
    this.vx = 0;
    this.vy = 0;
    Sound.sfx.plouf();
    w.splash(this.cx, surf);
    w.spawn({ type: 'ring', x: this.cx, y: surf, life: 0.6, size: 70, color: 'rgba(200,240,255,0.95)' });
    for (let i = 0; i < 10; i++) {
      w.spawn({ type: 'dot', x: this.cx + rand(-18, 18), y: surf - 2, vx: rand(-120, 120), vy: rand(-520, -260), g: 1400, life: 0.7, size: rand(3, 5), color: i % 2 ? '#bfeaff' : '#ffffff' });
    }
    // Gizmo devient un Gremlin
    if (this.pow.splash) this.pow.splash(this);
  }

  // Sous l'eau : des bulles remontent, puis elle ressort là où elle était bien au sec.
  underwater(dt) {
    const w = this.world;
    this.dive -= dt;
    if (Math.random() < dt * 14) {
      w.spawn({ type: 'ring', x: this.diveAt.x + rand(-12, 12), y: this.diveAt.y + rand(-2, 2), life: 0.35, size: rand(8, 16), color: 'rgba(230,250,255,0.9)' });
    }
    if (this.dive > 0) return;
    this.dive = 0;
    const s = this.safeSpot();
    this.x = s.x - this.w / 2;
    this.y = s.y - this.h;
    this.vx = 0;
    this.vy = 0;
    this.prevBottom = this.y + this.h;
    this.onGround = true;
    this.platform = s.pad || null;
    this.jumping = false;
    Sound.sfx.popOut();
    // pouf ! elle ressort en s'ébrouant
    for (let i = 0; i < 12; i++) {
      w.spawn({ type: 'dot', x: this.cx + rand(-14, 14), y: this.y + rand(10, 40), vx: rand(-200, 200), vy: rand(-300, -60), g: 1200, life: 0.6, size: rand(2.5, 4), color: i % 3 ? '#8fd8ff' : '#ffffff' });
    }
    // (si elle était encore invincible après avoir eu mal, elle grelotte quand même, mais ne perd rien)
    if (!this.hurt(null, 'wet')) {
      this.ouch = { kind: 'wet', t: 0, dur: OUCH.wet.dur, seed: Math.random() * 100 };
      this.vy = OUCH.wet.vy;
      this.onGround = false;
      this.platform = null;
    }
    // un petit poisson saute de la casquette et retourne dans la rivière
    w.spawn({ type: 'fish', x: this.cx, y: this.y + 2, vx: (this.diveAt.x > this.cx ? 1 : -1) * rand(110, 170), vy: -560, g: 1500, life: 1.1, vr: 9, size: 1, hue: choose([20, 35, 200]) });
  }

  // Le dernier endroit bien solide où elle se tenait (le sol, une planche, un nénuphar qui ne coule pas).
  updateSafe() {
    if (!this.onGround || this.dive > 0 || this.swim || this.dead || this.won) return;
    const pl = this.platform;
    if (pl) {
      if (pl.solid) this.safe = { pad: pl, x: 0, y: 0 };
      return;
    }
    const w = this.world;
    const c = Math.floor(this.cx / TILE);
    const r = Math.floor((this.y + this.h + 2) / TILE);
    const ch = w.tileAt(c, r);
    // (pas sur un bloc magique du Lutin ni sur un bloc lutin : ils disparaissent, ou sont perchés au-dessus de l'eau)
    if ((isSolidCh(ch) || isLedgeCh(ch)) && ch !== 'u' && !LUTIN_BLOCKS.includes(ch)) this.safe = { x: (c + 0.5) * TILE, y: r * TILE, pad: null };
  }

  safeSpot() {
    const w = this.world;
    const s = this.safe;
    if (s.pad) return { x: s.pad.x + s.pad.w / 2, y: s.pad.y, pad: s.pad };
    // (si la case a disparu entre-temps, on repart du début du niveau ou du drapeau)
    const ch = w.tileAt(Math.floor(s.x / TILE), Math.floor(s.y / TILE));
    if (!isSolidCh(ch) && !isLedgeCh(ch)) return w.startPos;
    // si la place est prise (un bloc magique du Lutin posé là), on ressort par-dessus
    let y = s.y;
    for (let k = 0; k < 4 && w.boxSolid(s.x - this.w / 2, y - this.h, this.w, this.h); k++) y -= TILE;
    if (w.boxSolid(s.x - this.w / 2, y - this.h, this.w, this.h)) return w.startPos;
    return { x: s.x, y, pad: null };
  }

  // Avec l'étoile, elle ricoche sur l'eau comme un caillou plat.
  ricochet(surf) {
    const w = this.world;
    this.vy = -PHYS.jump * 0.8;
    this.jumping = false;
    this.pound = 0;
    this.onGround = false;
    this.platform = null;
    Sound.sfx.ricochet();
    w.spawn({ type: 'ring', x: this.cx, y: surf, life: 0.45, size: 46, color: 'rgba(220,245,255,0.95)' });
    for (let i = 0; i < 8; i++) {
      w.spawn({ type: 'dot', x: this.cx + rand(-14, 14), y: surf - 2, vx: rand(-160, 160), vy: rand(-380, -160), g: 1300, life: 0.5, size: rand(2.5, 4), color: i % 2 ? '#8fd8ff' : '#ffffff' });
    }
  }

  // Elle glisse sur la bave : des petites gouttes brillantes, et un « fwiii » de temps en temps.
  slipFx(dt) {
    const w = this.world;
    this.slipT -= dt;
    if (this.slipT <= 0) {
      this.slipT = 0.45;
      Sound.sfx.slip();
    }
    if (Math.random() < dt * 22) {
      w.spawn({ type: 'dot', x: this.cx + rand(-8, 8), y: this.y + this.h - 2, vx: -Math.sign(this.vx) * rand(20, 90) + this.vx * 0.2, vy: rand(-140, -40), g: 900, life: 0.4, size: rand(1.8, 3), color: choose(['#d8ffc8', '#ffffff', '#b8f0a0']) });
    }
  }

  // Une flaque d'eau : plouf ! (et Gizmo devient un Gremlin)
  checkPuddle() {
    const wet = this.world.inPuddle(this);
    if (wet && !this.wet) {
      this.world.splash(this.cx, this.y + this.h);
      if (this.pow.splash) this.pow.splash(this);
    }
    this.wet = wet;
  }

  // Champignon (grotte) ou guimauve (bonbons) sous les pieds : ça rebondit !
  springTile() {
    const w = this.world;
    const r = Math.round((this.y + this.h) / TILE);
    const c0 = Math.floor((this.x + 2) / TILE);
    const c1 = Math.floor((this.x + this.w - 2) / TILE);
    let hit = -1;
    for (let c = c0; c <= c1; c++) {
      if (w.tileAt(c, r) === 'M') { hit = c; break; }
    }
    if (hit < 0) return;
    const big = this.pound === 2;
    this.vy = -(big ? PHYS.bigBounce : Input.held.jump ? PHYS.springHeld : PHYS.spring);
    this.onGround = false;
    this.platform = null;
    this.jumping = false;
    this.pound = 0;
    this.coyote = 0;
    w.springAt(hit, r, big);
  }

  // Dans la rivière de chocolat : on ne se brûle pas, mais on s'enfonce. Vite, il faut sauter !
  sinkInChoco(dt) {
    const w = this.world;
    if (!this.inChoco) {
      this.inChoco = true;
      this.sinkT = 0;
      this.blubT = 0.3;
      Sound.sfx.chocoPlop();
      for (let i = 0; i < 10; i++) {
        w.spawn({ type: 'dot', x: this.cx + rand(-16, 16), y: this.y + this.h - 8, vx: rand(-160, 160), vy: rand(-320, -120), g: 1200, life: 0.6, size: rand(3, 6), color: '#7a4224' });
      }
    }
    this.sinkT += dt;
    this.blubT -= dt;
    if (this.blubT <= 0) {
      this.blubT = 0.4;
      Sound.sfx.chocoBlub();
      w.spawn({ type: 'ring', x: this.cx + rand(-14, 14), y: this.y + this.h - 6, life: 0.4, size: 14, color: 'rgba(160,95,55,0.9)' });
    }
    if (this.sinkT > PHYS.chocoTime) this.die('choco');
  }

  // Le bébé oiseau pépie de temps en temps sur la casquette.
  updateBird(dt) {
    if (!this.world.def.sequel || this.birdGone) return;
    this.chirpT -= dt;
    this.beakT -= dt;
    if (this.chirpT <= 0) {
      this.chirpT = rand(6, 12);
      this.beakT = 0.3;
      Sound.sfx.chirp();
    }
  }

  // ---------- Pissenlit géant ----------
  // On l'attrape en le touchant : il soulève un peu Malice, puis elle plane tout doucement.
  // (on peut en attraper un autre en l'air : on lâche le premier)
  grabPuff(d) {
    this.dropPuff();
    this.puff = d;
    d.grab();
    // la charge, la bulle, le nuage… s'arrêtent : elle a les mains prises
    this.stopPower();
    this.pound = 0;
    // (et elle ne tourne plus sur elle-même, après un double saut ou un super saut)
    this.superSpin = 0;
    this.jumping = false;
    this.coyote = 0;
    this.crouch = false;
    this.onGround = false;
    this.platform = null;
    // toujours le même petit élan vers le haut (même en sautant très haut dedans)
    this.vy = -PHYS.puffLift;
    Sound.sfx.puffGrab();
  }

  // Elle le lâche (en atterrissant, avec bas, ou quand elle a mal) : il s'envole en graines.
  dropPuff() {
    if (!this.puff) return;
    this.puff.release(this);
    this.puff = null;
  }

  // Avec le pissenlit : on descend tout doucement, et un courant d'air fait remonter
  // jusqu'à sa hauteur (où l'on flotte sur place).
  floatPuff(dt) {
    const z = this.world.updraftAt(this);
    if (z) {
      const k = clamp((this.y + this.h - z.top) / 40, -0.7, 1);
      this.vy = approach(this.vy, -PHYS.puffRise * k, 3200 * dt);
    } else if (this.vy > PHYS.puffFall) {
      this.vy = Math.max(PHYS.puffFall, this.vy - 2800 * dt);
    }
  }

  // Où est la boule du pissenlit quand Malice le tient : au-dessus de sa tête, un peu devant.
  // Elle penche en arrière quand on avance, et se balance doucement.
  puffHead() {
    const [hx, hy] = HERO_HAT[this.hero] || HERO_HAT.malice;
    const hand = { x: this.cx + this.facing * (hx + 12), y: this.y + this.h + hy * 0.55 };
    const len = 40 - hy * 0.45;
    const tilt = clamp(-this.vx / PHYS.puffRun, -1, 1) * 0.18 + Math.sin(this.t * 2.6) * 0.06;
    return { x: hand.x + Math.sin(tilt) * len, y: hand.y - Math.cos(tilt) * len, hand, tilt };
  }

  // Mode Bébé : avec l'étoile, la lave ne brûle pas (et jamais pour Bébé Dragon).
  lavaProof() { return (this.star > 0 && this.world.diff.starLava) || !!this.pow.lavaProof; }

  // Pendant la charge de la licorne, la glissade du pingouin… les ennemis touchés sont renversés.
  knocks() { return !!(this.pow.knocks && this.pow.knocks(this)); }

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
    this.dropPuff();
    this.stopPower();
  }

  // La charge, la glissade, la bulle… s'arrêtent (grappin, ou quand on a mal).
  stopPower() {
    if (this.pow.stop) this.pow.stop(this);
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
      // (un nénuphar qui a coulé, on passe à travers : on tombe dans l'eau)
      if (p.sunk) continue;
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
    // (pas en tenant un pissenlit géant : elle a les mains prises)
    if (this.throwT > 0 || this.pound || this.hurtT > 0 || this.puff) return;
    if (g[kind] <= 0) return;
    g[kind]--;
    this.throwT = 0.28;
    this.throwAnim = 0.22;
    this.world.projectiles.push(new Throwable(this.world, kind, this.cx + this.facing * 14, this.y + 24, this.facing, this.vx));
    Sound.sfx.throwIt();
  }

  bounceOff() {
    // (San Goku sur son nuage : le nuage s'en va, sinon il l'empêcherait de rebondir)
    if (this.pw.cloud > 0) this.stopPower();
    this.pound = 0;
    this.vy = -(Input.held.jump ? PHYS.bounceHeld : PHYS.bounce) * (this.pow.bounce || 1);
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
    this.dropPuff();
    if (!OUCH[kind]) kind = 'hit';
    const O = OUCH[kind];
    this.stopPower();
    // le Gremlin redevient Gizmo au lieu d'avoir mal (mais pas dans l'eau : il y reste un Gremlin)
    if (kind !== 'wet' && this.pow.shield && this.pow.shield(this)) {
      this.invuln = 1.6;
      this.hurtT = 0.25;
      this.grap = null;
      const sx = src ? src.x + (src.w || 0) / 2 : this.cx - this.facing;
      this.vx = (Math.sign(this.cx - sx) || -this.facing) * 260;
      this.vy = -380;
      this.pound = 0;
      this.platform = null;
      this.onGround = false;
      w.shake(4);
      return true;
    }
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
      case 'wet':
        // elle s'égoutte, et claque des dents
        if (Math.random() < dt * 16) {
          const p = at(rand(-12, 12), rand(-62, -8));
          w.spawn({ type: 'dot', x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(20, 90), g: 900, life: 0.5, size: rand(1.8, 2.8), color: '#8fd8ff' });
        }
        if ([0.35, 0.95].some(passed)) Sound.sfx.chatter();
        break;
      case 'slime':
        // la bave dégouline
        if (Math.random() < dt * 9) {
          const p = at(rand(-10, 10), rand(-60, -20));
          w.spawn({ type: 'dot', x: p.x, y: p.y, vx: rand(-10, 10), vy: rand(10, 50), g: 500, life: 0.7, size: rand(2, 3.2), color: '#b8f08a' });
        }
        break;
      case 'dirt':
        // des miettes de terre tombent de partout
        if (Math.random() < dt * 14) {
          const p = at(rand(-12, 12), rand(-64, -10));
          w.spawn({ type: 'dot', x: p.x, y: p.y, vx: rand(-30, 30), vy: rand(0, 60), g: 1100, life: 0.6, size: rand(1.8, 3), color: choose(['#8a5a34', '#a8703e', '#6a4024']) });
        }
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
    this.dropPuff();
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
    this.inChoco = false;
    if (cause === 'lava') Sound.sfx.lava(); else Sound.sfx.die();
    this.world.shake(5);
    this.world.game.onPlayerDeath();
  }

  draw(ctx) {
    // sous l'eau : on ne la voit pas (seulement des bulles)
    if (this.dive > 0) return;
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
    else if (this.slipping) pose = 'slip';
    else if (Math.abs(this.vx) > 15) pose = Math.abs(this.vx) > PHYS.run + 20 ? 'run' : 'walk';
    if (this.throwAnim > 0 && !this.onGround && !this.pound) pose = 'throw';
    // les poses des pouvoirs
    if (!this.dead && !this.won && !hanging && !ouching) {
      const sp = (this.pow.pose && this.pow.pose(this)) || (this.pw.poseT > 0 ? this.pw.pose : null);
      if (sp) pose = sp;
      // le pissenlit tenu à bout de bras, au-dessus de la tête
      if (this.puff) pose = 'float';
    }

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
    const lava = this.dead && this.cause === 'lava';
    const choco = this.dead && this.cause === 'choco';
    if (this.puff) this.puff.drawHeld(ctx);
    Heroes.draw(ctx, this.hero, this.cx, this.y + this.h + 1, {
      facing: this.dead ? 1 : this.facing,
      pose,
      t: this.t,
      ph: this.ph,
      sx,
      sy,
      star: this.star > 0,
      lava,
      choco,
      palette: lava ? LAVA_PALETTE : choco ? CHOCO_PALETTE : null,
      holding: this.holding,
      face: pose === 'idle' ? this.mimic : null,
      ouch: k,
      onHead: this.world.def.sequel && !this.birdGone ? (c) => this.drawHatBird(c, pose) : null,
      pw: this.pw,
    });
    ctx.restore();
  }
}

// Le bébé oiseau assis sur la casquette (pendant le retour à la maison).
// Il bat des ailes en l'air, sursaute quand Malice a mal, et ouvre le bec quand il donne un conseil.
Player.prototype.drawHatBird = function drawHatBird(ctx, pose) {
  const air = pose === 'jump' || pose === 'fall' || pose === 'pound';
  const jolt = this.hurtT > 0 ? this.hurtT * 30 : 0;
  ctx.save();
  ctx.translate(-2, -61 - jolt);
  ctx.scale(0.5, 0.5);
  Art.babyBird(ctx, 0, 0, this.t, {
    noNest: true,
    happy: air || this.hurtT > 0,
    chirp: (this.birdTalk > 0.5 && Math.floor(this.t * 9) % 2 === 0) || this.beakT > 0,
  });
  ctx.restore();
};

const LAVA_PALETTE = Object.assign({}, Art.MALICE, {
  skin: '#5a3a30', skinShade: '#3a2420', shirt: '#6a5a5a', shirtShade: '#4a3a3a',
  overall: '#7a3a4a', overallDark: '#5a2a3a', hair: '#7a6a3a', hairDark: '#5a4a2a',
  hat: '#7a3a4a', hatDark: '#5a2a3a', hatLight: '#8a4a5a',
});

// Malice toute couverte de chocolat
const CHOCO_PALETTE = Object.assign({}, Art.MALICE, {
  skin: '#8a5030', skinShade: '#6a3820', shirt: '#9a5a34', shirtShade: '#7a4224',
  overall: '#7a4224', overallDark: '#5a2c14', hair: '#a0643a', hairDark: '#7a4224',
  hat: '#8a4a2a', hatDark: '#6a3418', hatLight: '#b06a40',
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
      if (overlap(this, e.shotBox ? e.shotBox() : e)) {
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
      if (this.deathType === 'stomp' || this.deathType === 'shell') {
        // écrasé ; ou (l'escargot) rentré dans sa coquille, qui tremble un peu plus longtemps
        if (this.dieT > (this.deathType === 'shell' ? 0.75 : 0.45)) {
          this.dead = true;
          w.puff(this.cx, this.y + this.h - 10, this.deathType === 'shell' ? '#ffe0f4' : null);
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
    // tombé dans la rivière : plouf, il s'en va avec le courant
    const surf = w.waterSurface(this, 8);
    if (surf !== null) {
      this.dead = true;
      if (w.onScreen(this)) w.splash(this.cx, surf);
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
      this.vx = this.dir * (this.fatSpeed || 32);
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

// Chauve-souris : elle dort la tête en bas au plafond de la grotte. Quand Malice approche,
// elle se réveille et fonce sur elle, puis remonte et recommence.
class Bat extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 40, 30);
    this.state = 'sleep';
    this.homeX = x;
    this.homeY = y;
    this.timer = 0;
    this.flap = Math.random() * 6;
    this.target = null;
    this.ouch = 'head'; // elle fonce sur la tête de Malice (voir OUCH)
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - this.cy;
    const free = !p.dead && !p.won;
    if (this.state === 'sleep') {
      this.vx = 0;
      this.vy = 0;
      if (free && Math.abs(dx) < 230 && dy > -40 && dy < 460) {
        this.state = 'wake';
        this.timer = 0.45;
        if (w.onScreen(this)) Sound.sfx.batWake();
        w.popText(this.cx, this.y + this.h + 12, '!', '#ff4040', 30);
      }
      return;
    }
    this.flap += dt * (this.state === 'swoop' ? 22 : 16);
    this.timer -= dt;
    const sp = w.diff.batSpeed;
    let tx;
    let ty;
    if (this.state === 'wake') {
      // elle se décroche et descend un peu en battant des ailes
      this.vx = 0;
      this.vy = 60;
      if (this.timer <= 0) this.swoop();
    } else if (this.state === 'swoop') {
      // elle fonce là où était Malice
      tx = this.target.x;
      ty = this.target.y;
      if (this.timer <= 0 || Math.hypot(tx - this.cx, ty - this.cy) < 20) {
        this.state = 'rise';
        this.timer = rand(1.4, 2.4);
      }
    } else {
      // elle remonte vers le plafond en tournant autour de chez elle, puis refonce
      tx = this.homeX + 20 + Math.sin(this.t * 1.3) * 120;
      ty = this.homeY + 20 + Math.sin(this.t * 2.6) * 18;
      if (this.timer <= 0 && free && Math.abs(dx) < 380 && dy > -60) this.swoop();
    }
    if (tx != null) {
      const ddx = tx - this.cx;
      const ddy = ty - this.cy;
      const d = Math.hypot(ddx, ddy) || 1;
      const speed = this.state === 'swoop' ? sp : sp * 0.6;
      const k = Math.min(1, dt * (this.state === 'swoop' ? 4 : 2.5));
      this.vx += ((ddx / d) * speed - this.vx) * k;
      this.vy += ((ddy / d) * speed - this.vy) * k;
    }
    if (Math.abs(this.vx) > 8) this.dir = Math.sign(this.vx);
    const res = w.moveBody(this, dt);
    if (res.wall) this.vx = -this.vx * 0.5;
    if (res.landed) this.vy = -120;
    if (res.ceil) this.vy = 40;
  }

  swoop() {
    const p = this.world.player;
    this.state = 'swoop';
    this.timer = 1.5;
    this.target = { x: p.cx, y: p.cy + 10 };
  }

  onStuck() { this.state = 'rise'; }
  onFat() { this.state = 'rise'; }
  onUnstuck() { this.timer = 2; }

  drawBody(ctx, x, y) {
    Art.bat(ctx, x, y, {
      t: this.t, dir: this.dir, sleep: this.state === 'sleep' && !this.stuck, flap: this.flap,
      angry: this.state === 'swoop' || this.state === 'wake', fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: this.dir * 3, y: this.fat ? -10 : -10.5 }; }
}

// Oiseau grincheux : il vole en faisant des vagues dans la montagne des nuages.
class GrumpyBird extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 44, 34);
    this.homeX = x;
    this.homeY = y;
    this.range = TILE * 4;
    this.ft = Math.random() * 6;
    this.flap = 0;
    this.squawkT = rand(2, 5);
    this.ouch = 'ko'; // un grand coup de bec : bong !
  }

  ai(dt) {
    const w = this.world;
    this.ft += dt;
    this.flap += dt * 14;
    const nx = this.x + this.dir * w.diff.birdSpeed * dt;
    const ny = this.homeY + Math.sin(this.ft * 2.4) * 38;
    if (nx < this.homeX - this.range || nx > this.homeX + this.range || w.boxSolid(nx, ny, this.w, this.h)) {
      this.dir *= -1;
    } else {
      this.x = nx;
    }
    if (!w.boxSolid(this.x, ny, this.w, this.h)) this.y = ny;
    this.squawkT -= dt;
    if (this.squawkT <= 0) {
      this.squawkT = rand(3, 6);
      if (w.onScreen(this, -40)) Sound.sfx.squawk();
    }
  }

  // collé ou essoufflé, il tombe ; décollé, il repart d'où il est
  onUnstuck() {
    this.homeX = this.x;
    this.homeY = this.y - TILE * 2;
  }

  drawBody(ctx, x, y) {
    Art.grumpyBird(ctx, x, y, { t: this.t, dir: this.dir, flap: this.flap, fat: this.fat, rest: this.fatRest && this.stuck <= 0 });
  }

  mouth() { return { x: this.dir * (this.fat ? 17 : 15), y: -12 }; }
}

// Ourson en gélatine : il rebondit partout, et vers Malice quand il la voit.
class GummyBear extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 34, 40);
    this.hue = choose([0, 30, 50, 120, 280]);
    this.hopT = rand(0.1, 0.6);
    this.squash = 0;
    this.ouch = 'ko'; // il lui rebondit dessus : bong !
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const wasAir = !this.onGround;
    if (this.onGround) {
      this.vx = 0;
      this.squash = approach(this.squash, 0, dt * 2);
      this.hopT -= dt;
      if (this.hopT <= 0) {
        const dx = p.cx - this.cx;
        if (!p.dead && Math.abs(dx) < 300 && Math.abs(dx) > 10) this.dir = Math.sign(dx);
        // pas de saut dans le vide ni dans le chocolat
        if (!w.groundAhead(this, 20) || !w.groundAhead(this, 70)) this.dir *= -1;
        if (w.groundAhead(this, 20) && w.groundAhead(this, 70)) this.vx = this.dir * w.diff.gummySpeed;
        this.vy = -rand(520, 760);
        this.onGround = false;
        this.hopT = rand(0.05, 0.3);
      }
    } else {
      this.squash = -Math.min(0.3, Math.abs(this.vy) / 2500);
    }
    this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
    const res = w.moveBody(this, dt);
    if (res.wall) {
      this.dir *= -1;
      this.vx = -this.vx;
    }
    if (res.landed && wasAir) {
      this.squash = 0.35;
      if (w.onScreen(this)) Sound.sfx.gummyHop();
    }
  }

  drawBody(ctx, x, y) {
    Art.gummyBear(ctx, x, y, {
      t: this.t, dir: this.dir, hue: this.hue, squash: this.fat ? 0 : this.squash,
      fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: this.dir * 2.5, y: this.fat ? -23.5 : -24.5 }; }
}

// Escargot (la Rivière aux Nénuphars) : il avance tout doucement et laisse derrière lui une traînée
// de bave qui brille, où Malice glisse (elle sèche au bout d'un moment). Quand on lui saute dessus,
// il rentre dans sa coquille… et pouf ! Le caramel le colle, les chips le font gonfler.
const SLIME_STEP = 6;

class Snail extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 44, 30);
    this.ouch = 'slime'; // il laisse plein de bave sur Malice (voir OUCH)
    this.hue = choose([330, 280, 200, 30]);
    this.fatSpeed = 12;
    this.slimeD = 0;
    this.look = { x: -1, y: 0 };
  }

  ai(dt) {
    this.vx = this.dir * this.world.diff.snailSpeed;
    this.legPhase += dt * 3.2;
    this.walkPhysics(dt, true);
    this.lookAt(dt);
    this.drool(dt);
  }

  // Il est tout petit : les chips, le caramel et les tirs des pouvoirs le touchent un peu plus haut
  // (sinon, ils passeraient par-dessus sa coquille).
  shotBox() {
    return { x: this.x, y: this.y - 18, w: this.w, h: this.h + 18 };
  }

  // tout gros (chips), il bave encore
  updateFat(dt) {
    super.updateFat(dt);
    this.drool(dt);
  }

  // ses yeux, tout au bout de ses cornes, suivent Malice
  lookAt(dt) {
    const p = this.world.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const sees = !p.dead && d < 360;
    this.look.x += ((sees ? dx / d : this.dir) - this.look.x) * Math.min(1, dt * 5);
    this.look.y += ((sees ? dy / d : 0) - this.look.y) * Math.min(1, dt * 5);
  }

  // une goutte de bave tous les quelques pixels, sous sa queue
  drool(dt) {
    if (!this.onGround || Math.abs(this.vx) < 1) return;
    this.slimeD += Math.abs(this.vx) * dt;
    if (this.slimeD < SLIME_STEP) return;
    this.slimeD = 0;
    this.world.addSlime(this.cx - this.dir * 12, this.y + this.h);
  }

  // on lui saute dessus : il rentre dans sa coquille, la coquille tremble… et pouf !
  stomp() {
    const w = this.world;
    this.kill('stomp');
    this.deathType = 'shell';
    Sound.sfx.shellHide();
    w.popText(this.cx, this.y - 24, 'Pouic !', '#ffd0f0', 20);
    for (let i = 0; i < 8; i++) {
      w.spawn({ type: 'spark', x: this.cx, y: this.y + 14, vx: rand(-160, 160), vy: rand(-220, -40), life: 0.45, size: rand(3, 6), color: choose(['#fff6a0', '#ffc8ec', '#ffffff']) });
    }
  }

  draw(ctx) {
    if (this.dying && this.deathType === 'shell') {
      Art.snail(ctx, this.cx, this.y + this.h, { dir: this.dir, t: this.t, hue: this.hue, look: this.look, hide: Math.min(1, this.dieT / 0.15), wobble: this.dieT });
      return;
    }
    super.draw(ctx);
  }

  drawBody(ctx, x, y) {
    Art.snail(ctx, x, y, {
      dir: this.dir, t: this.t, hue: this.hue, look: this.look, phase: this.legPhase,
      moving: Math.abs(this.vx) > 1, fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: this.dir * (this.fat ? 19 : 17), y: -13 }; }
}

// Taupe (la Prairie la Nuit) : elle creuse sous la prairie. On ne voit qu'un petit tas de terre qui avance
// (et la lumière de sa lampe de mineur, qui passe à travers). Quand Malice arrive tout près, le tas file
// sous ses pieds, la terre tremble… et la taupe jaillit d'un coup dans une gerbe de terre : si Malice est
// juste dessus, elle est projetée en l'air ! La taupe regarde autour d'elle un moment, puis replonge.
// Quand elle est dehors : on lui saute sur le casque (bonk !), le caramel la colle (elle ne peut plus
// replonger), et avec les chips elle devient trop grosse pour rentrer dans son trou. Sous terre, rien ne
// la touche… sauf le BOUM du Dinosaure, qui la fait sortir d'un coup (voir quake dans pouvoirs.js).
const MOLE_RANGE = 6;
// cachée, elle est assez loin sous l'herbe pour que rien ne la touche (ni Malice, ni le caramel, ni les tirs)
const MOLE_DEEP = 14;
const MOLE_DIVE = 0.35;

class Mole extends Enemy {
  // cx : le milieu de sa case, ground : le haut de l'herbe
  constructor(world, cx, ground) {
    super(world, cx - 18, ground + MOLE_DEEP, 36, 40);
    this.ouch = 'dirt'; // elle projette Malice en l'air dans une gerbe de terre (voir OUCH)
    this.groundY = ground;
    this.state = 'under';
    this.timer = 0;
    // au début (et à la reprise d'un drapeau), elle attend un peu avant de chercher Malice
    this.rest = 1.2;
    this.dir = choose([-1, 1]);
    this.look = { x: -1, y: 0 };
    this.fatSpeed = 26;
    this.holeX = cx;
    this.range = null;
  }

  get under() { return this.state === 'under' || this.state === 'warn'; }

  // Le bout de prairie où elle peut creuser (jusqu'à MOLE_RANGE cases de chez elle) : de l'herbe,
  // sans rien de posé dessus (ni plateforme, ni ronces, ni flaque). Calculé une fois la carte lue.
  findRange() {
    const w = this.world;
    const r = Math.round(this.groundY / TILE);
    const c0 = Math.floor(this.cx / TILE);
    const ok = (c) => w.tileAt(c, r) === '#' && w.tileAt(c, r - 1) === '.';
    let a = c0;
    let b = c0;
    while (a > c0 - MOLE_RANGE && ok(a - 1)) a--;
    while (b < c0 + MOLE_RANGE && ok(b + 1)) b++;
    // (jamais à moins de 3 cases d'un trou ou de l'eau : en jaillissant, elle y jetterait Malice)
    const hole = (c) => !isSolidCh(w.tileAt(c, r));
    for (let k = 1; k <= 3; k++) {
      if (hole(a - k)) {
        a = Math.min(c0, a - k + 4);
        break;
      }
    }
    for (let k = 1; k <= 3; k++) {
      if (hole(b + k)) {
        b = Math.max(c0, b + k - 4);
        break;
      }
    }
    return [a * TILE + 20, (b + 1) * TILE - 20];
  }

  // Rien de solide juste au-dessus d'elle (un bloc magique du Lutin, par exemple), sur toute sa largeur ?
  roomAbove() {
    const w = this.world;
    const r = Math.round(this.groundY / TILE) - 1;
    for (let c = Math.floor(this.x / TILE); c <= Math.floor((this.x + this.w - 0.01) / TILE); c++) {
      if (isSolidCh(w.tileAt(c, r))) return false;
    }
    return true;
  }

  // Elle vise les talons de Malice (juste derrière elle : on voit bien la taupe sortir, et Malice est
  // projetée vers l'avant). Tout au bout de sa zone, elle vise devant elle : Malice est alors projetée
  // vers le milieu du champ, jamais vers le trou d'à côté.
  heels(p) {
    const [a, b] = this.range;
    const f = p.facing;
    const end = f > 0 ? p.cx > b - 1.5 * TILE : p.cx < a + 1.5 * TILE;
    return clamp(p.cx + (end ? f : -f) * 22, a, b);
  }

  harmful() {
    return (this.state === 'pop' || this.state === 'out') && super.harmful();
  }

  // Elle est petite : dehors, le caramel, les chips et les tirs des pouvoirs la touchent un peu plus haut
  // (sinon, ils passeraient par-dessus son casque). Cachée, rien ne la touche.
  shotBox() {
    if (this.under) return { x: this.x, y: this.groundY + 400, w: this.w, h: 1 };
    return { x: this.x, y: this.y - 16, w: this.w, h: this.h + 16 };
  }

  update(dt) {
    if (this.dying && this.deathType === 'bonk') {
      // assommée, elle redescend dans son trou en voyant des étoiles… et pouf !
      this.t += dt;
      this.dieT += dt;
      if (this.dieT > 0.9) {
        this.dead = true;
        this.world.puff(this.holeX, this.groundY - 6, '#d8b08a');
      }
      return;
    }
    super.update(dt);
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    if (!this.range) this.range = this.findRange();
    const [a, b] = this.range;
    this.timer -= dt;
    this.rest -= dt;
    const dx = p.cx - this.cx;
    const feet = p.y + p.h;
    // Malice marche (ou saute) au-dessus de son bout de prairie ?
    const above = !p.dead && !p.won && this.rest <= 0 && feet > this.groundY - 2.5 * TILE && feet < this.groundY + 6 &&
      p.cx > a - TILE && p.cx < b + TILE;
    switch (this.state) {
      case 'under': {
        let want;
        let speed;
        const chase = above && Math.abs(dx) < 5 * TILE;
        if (chase) {
          // elle file sous ses talons
          want = this.heels(p);
          speed = w.diff.moleDig;
        } else {
          // elle se promène tout doucement
          if (this.cx <= a + 1) this.dir = 1;
          else if (this.cx >= b - 1) this.dir = -1;
          want = this.cx + this.dir * 40;
          speed = 26;
        }
        const move = clamp(want - this.cx, -speed * dt, speed * dt);
        this.x = clamp(this.x + move, a - this.w / 2, b - this.w / 2);
        this.vx = move / dt;
        if (Math.abs(move) > 0.05) this.dir = Math.sign(move);
        if (Math.abs(this.vx) > 20 && Math.random() < dt * 8) this.crumbs(1);
        // juste sous ses talons : la terre tremble… (pas si Malice est posée sur quelque chose au-dessus
        // de l'herbe, comme le bloc du Lutin)
        const perched = p.onGround && feet < this.groundY - 4;
        if (chase && Math.abs(want - this.cx) < 6 && Math.abs(dx) < 34 && p.cx > a + 12 && p.cx < b - 12 &&
          feet > this.groundY - 2 * TILE && !perched && this.roomAbove()) {
          this.state = 'warn';
          this.timer = w.diff.moleWarn;
          this.jumped = false;
          this.x = want - this.w / 2;
          this.vx = 0;
          if (w.onScreen(this, 100)) Sound.sfx.moleRumble();
        }
        break;
      }
      case 'warn':
        if (Math.random() < dt * 14) this.crumbs(1);
        // Malice a sauté au-dessus du tas : la taupe jaillit juste sous elle dès qu'elle commence à redescendre
        // (sauter, c'est toujours la bonne réponse : elle retombe sur son casque)
        if (Math.abs(dx) < 40 && !p.onGround) {
          if (p.vy < 0) this.jumped = true;
          else if (this.jumped) {
            this.x = clamp(p.cx, a, b) - this.w / 2;
            this.timer = 0;
          }
        }
        if (this.timer <= 0) {
          if (this.roomAbove()) this.pop();
          else {
            this.state = 'under';
            this.rest = 0.8;
          }
        }
        break;
      case 'pop':
        // elle monte, puis retombe au bord de son trou
        this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
        this.y += this.vy * dt;
        if (this.vy > 0 && this.y + this.h >= this.groundY) {
          this.y = this.groundY - this.h;
          this.vy = 0;
          this.onGround = true;
          this.state = 'out';
          this.timer = w.diff.moleOut;
        }
        break;
      case 'out':
        // elle cherche Malice à travers ses grosses lunettes
        if (Math.abs(dx) > 8) this.dir = Math.sign(dx);
        if (this.timer <= 0) this.dive();
        break;
      case 'dive':
        this.y = this.groundY - this.h + clamp(1 - this.timer / MOLE_DIVE, 0, 1) * (this.h + MOLE_DEEP);
        if (this.timer <= 0) this.hide();
        break;
      default: break;
    }
    const d = Math.hypot(dx, p.cy - this.y) || 1;
    const sees = !this.under && !p.dead && d < 400;
    this.look.x += ((sees ? dx / d : this.dir) - this.look.x) * Math.min(1, dt * 6);
    this.look.y += ((sees ? (p.cy - this.y) / d : 0) - this.look.y) * Math.min(1, dt * 6);
  }

  // des miettes de terre qui sautent du tas
  crumbs(n) {
    const w = this.world;
    for (let i = 0; i < n; i++) {
      w.spawn({ type: 'dot', x: this.cx + rand(-14, 14), y: this.groundY - rand(4, 12), vx: rand(-70, 70), vy: rand(-200, -80), g: 1200, life: 0.45, size: rand(1.8, 3.2), color: choose(['#8a5a34', '#a8703e', '#c48a52']) });
    }
  }

  // Elle jaillit d'un coup, dans une gerbe de terre.
  pop() {
    const w = this.world;
    this.state = 'pop';
    this.holeX = this.cx;
    this.y = this.groundY - this.h + 12;
    this.vy = -560;
    this.onGround = false;
    if (w.onScreen(this, 100)) {
      Sound.sfx.molePop();
      w.shake(3);
    }
    for (let i = 0; i < 14; i++) {
      w.spawn({
        type: 'debris', x: this.cx + rand(-16, 16), y: this.groundY - 4, vx: rand(-220, 220), vy: rand(-620, -260), g: 1700,
        life: 0.8, size: rand(5, 10), color: choose(['#8a5a34', '#a8703e', '#6a4024', '#4fae6a']), vr: rand(-10, 10),
      });
    }
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'dust', x: this.cx + rand(-20, 20), y: this.groundY, vx: rand(-90, 90), vy: rand(-120, -30), life: 0.55, size: rand(6, 10), color: 'rgba(196,150,100,0.85)' });
    }
  }

  // Elle replonge dans son trou.
  dive() {
    this.state = 'dive';
    this.timer = MOLE_DIVE;
    this.vx = 0;
    this.vy = 0;
    if (this.world.onScreen(this, 60)) Sound.sfx.moleHide();
    this.crumbs(5);
  }

  hide() {
    this.state = 'under';
    this.y = this.groundY + MOLE_DEEP;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.rest = 1.8;
  }

  // Collée par le caramel, ou toute grosse avec les chips (elle ne rentre plus dans son trou, elle se promène
  // en soufflant) : elle reste dehors, même si elle était en train de jaillir ou de replonger.
  stayOut() {
    if (this.state === 'dive') this.y = this.groundY - this.h;
    this.state = 'out';
  }

  onStuck() { this.stayOut(); }
  onFat() { this.stayOut(); }

  onUnstuck() {
    if (!this.fat) this.dive();
  }

  kill(type) {
    // le BOUM du Dinosaure la fait sortir de sous terre
    if (this.under) {
      this.state = 'out';
      this.holeX = this.cx;
      this.y = this.groundY - this.h;
    }
    super.kill(type);
  }

  stomp() {
    const w = this.world;
    this.kill('stomp');
    // bonk ! sur le casque : elle redescend dans son trou, assommée (sauf si elle s'en est éloignée,
    // ou si elle est trop grosse pour y rentrer : elle est écrasée, comme les autres)
    if (!this.fat && Math.abs(this.cx - this.holeX) < 24) this.deathType = 'bonk';
    Sound.sfx.moleBonk();
    w.popText(this.cx, this.y - 24, 'Bonk !', '#ffe27a', 22);
  }

  // Sa lampe de mineur brille dans la nuit : on la voit toujours, même sous terre.
  light() {
    if (this.under) return { x: this.cx, y: this.groundY - 6, r: this.state === 'warn' ? 70 : 54, a: 0.7 };
    return { x: this.cx + this.dir * 6, y: this.y + 8, r: 90, a: 0.8 };
  }

  draw(ctx) {
    const gy = this.groundY;
    if (this.under) {
      const shake = this.state === 'warn' ? clamp(1 - this.timer / this.world.diff.moleWarn, 0, 1) : 0;
      Art.moleHill(ctx, this.cx, gy, { t: this.t, shake, moving: Math.abs(this.vx) > 5, dir: this.dir });
      return;
    }
    // le trou, derrière elle
    if (!this.dying || this.deathType === 'bonk') Art.moleHole(ctx, this.holeX, gy, this.state === 'pop' ? 1 : 0.8);
    const sinking = this.state === 'dive' || (this.dying && this.deathType === 'bonk');
    if (sinking) {
      // elle disparaît sous l'herbe
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.cx - 120, gy - 400, 240, 400);
      ctx.clip();
    }
    if (this.dying && this.deathType === 'bonk') {
      const k = this.dieT;
      const squash = k < 0.15 ? Math.sin((k / 0.15) * Math.PI) * 0.35 : 0;
      const sink = clamp((k - 0.3) / 0.6, 0, 1) * (this.h + 10);
      Art.mole(ctx, this.holeX, gy + sink, { dir: this.dir, t: this.t, look: this.look, dizzy: true, squash });
    } else {
      super.draw(ctx);
    }
    if (sinking) ctx.restore();
  }

  drawBody(ctx, x, y) {
    Art.mole(ctx, x, y, {
      dir: this.dir, t: this.t, look: this.look, fat: this.fat, rest: this.fatRest && this.stuck <= 0,
      popping: this.state === 'pop', moving: Math.abs(this.vx) > 1,
    });
  }

  mouth() { return { x: this.dir * (this.fat ? 12 : 10), y: -17 }; }
}

// Gros œil bonbon : il est gentil mais timide. Il s'enfuit quand Malice approche ;
// si on l'attrape, on gagne une vie (et tous ses cœurs).
class CandyEye {
  constructor(world, x, y) {
    this.world = world;
    this.w = 32;
    this.h = 34;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dir = choose([-1, 1]);
    this.onGround = false;
    this.state = 'walk';
    this.timer = 0;
    this.hopT = 0;
    this.t = Math.random() * 5;
    this.legPhase = 0;
    this.look = { x: this.dir, y: 0 };
    this.hue = choose([320, 190, 50, 120, 270]);
    this.dead = false;
  }

  get cx() { return this.x + this.w / 2; }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    this.timer -= dt;
    const dx = p.cx - this.cx;
    const near = !p.dead && !p.won && Math.abs(dx) < 210 && Math.abs(p.cy - this.y) < 160;
    let speed = 0;
    if (this.state === 'walk') {
      speed = 40;
      if (near && this.timer <= 0) {
        this.state = 'flee';
        this.timer = rand(1.8, 2.6);
        this.vy = this.onGround ? -300 : this.vy;
        if (w.onScreen(this)) Sound.sfx.eyeFlee();
      }
    } else if (this.state === 'flee') {
      this.dir = dx > 0 ? -1 : 1;
      speed = w.diff.eyeFlee;
      this.hopT -= dt;
      if (this.onGround && this.hopT <= 0) {
        this.hopT = 0.45;
        this.vy = -240;
      }
      if (this.timer <= 0) {
        // tout essoufflé : c'est le moment de l'attraper !
        this.state = 'tired';
        this.timer = 2.4;
      }
    } else if (this.timer <= 0) {
      this.state = 'walk';
      this.timer = 0.8;
    }
    // il ne saute jamais dans le vide ni dans le chocolat (même en plein saut) :
    // coincé au bord, il s'arrête tout essoufflé… c'est le moment de l'attraper !
    let vx = this.dir * speed;
    if (vx && !this.safeAhead()) {
      vx = 0;
      if (this.state === 'walk') this.dir *= -1;
      else if (this.state === 'flee') {
        this.state = 'tired';
        this.timer = 2.4;
      }
    }
    this.vx = vx;
    if (Math.abs(vx) > 1) this.legPhase += dt * Math.abs(vx) * 0.12;
    this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
    const res = w.moveBody(this, dt);
    if (res.wall && this.state === 'walk') this.dir *= -1;
    const tx = this.state === 'flee' ? -this.dir : this.dir;
    this.look.x += (tx - this.look.x) * Math.min(1, dt * 8);
    if (this.y > w.height + 40 || w.inLava(this)) this.dead = true;
  }

  // Y a-t-il du sol (et pas du chocolat) juste devant, sous ses pieds ?
  safeAhead() {
    const w = this.world;
    const fx = this.dir > 0 ? this.x + this.w + 6 : this.x - 6;
    const c = Math.floor(fx / TILE);
    const r0 = Math.floor((this.y + this.h - 2) / TILE);
    for (let r = r0; r <= r0 + 2; r++) {
      const ch = w.tileAt(c, r);
      if (ch === '~') return false;
      if (isSolidCh(ch) || isLedgeCh(ch)) return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    if (this.onGround) {
      ellipsePath(ctx, this.cx, this.y + this.h + 1, 13, 3.5);
      ctx.fill();
    }
    const shiver = this.state === 'flee' && this.vx === 0 ? Math.sin(this.t * 50) * 1.2 : 0;
    Art.candyEye(ctx, this.cx + shiver, this.y + this.h, {
      t: this.t, dir: this.dir, look: this.look, legPhase: this.legPhase, moving: Math.abs(this.vx) > 1,
      scared: this.state === 'flee', tired: this.state === 'tired', hue: this.hue,
    });
  }
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

// Stalactite : une pointe de pierre au plafond de la grotte. Quand Malice approche, elle tremble… puis tombe !
class Stalactite {
  constructor(world, x, y) {
    this.world = world;
    this.w = 30;
    this.h = 44;
    this.x = x + (TILE - this.w) / 2;
    this.y = y;
    this.vy = 0;
    this.state = 'hang';
    this.timer = 0;
    this.t = 0;
    this.dead = false;
    this.v = Math.floor(Math.random() * 3);
    this.ouch = 'head'; // elle tombe sur la tête de Malice (voir OUCH)
  }

  harmful() { return this.state === 'fall'; }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    const cx = this.x + this.w / 2;
    if (this.state === 'hang') {
      if (!p.dead && Math.abs(p.cx - cx) < 120 && p.y > this.y && p.y - this.y < 560) {
        this.state = 'shake';
        this.timer = 0.4;
        if (w.onScreen(this)) Sound.sfx.stalactiteShake();
      }
    } else if (this.state === 'shake') {
      this.timer -= dt;
      if (Math.random() < dt * 25) {
        w.spawn({ type: 'dot', x: cx + rand(-14, 14), y: this.y + rand(0, 6), vy: rand(20, 80), g: 900, life: 0.6, size: rand(1.5, 3), color: '#9a8cb8' });
      }
      if (this.timer <= 0) {
        this.state = 'fall';
        this.vy = 200;
      }
    } else {
      this.vy = Math.min(this.vy + 3200 * dt, 1200);
      this.y += this.vy * dt;
      for (const e of w.enemies) {
        if (!e.dying && !e.dead && overlap(this, e)) e.kill('bump');
      }
      if (w.solidAt(cx, this.y + this.h) || this.y > w.height) this.crash();
    }
  }

  crash() {
    const w = this.world;
    const cx = this.x + this.w / 2;
    this.dead = true;
    if (w.onScreen(this)) {
      Sound.sfx.stalactiteCrash();
      w.shake(3);
    }
    for (let i = 0; i < 10; i++) {
      w.spawn({
        type: 'debris', x: cx + rand(-10, 10), y: this.y + this.h - rand(0, 20),
        vx: rand(-220, 220), vy: rand(-380, -120), g: 1800, life: 0.7, size: rand(5, 9),
        color: i % 3 ? '#6f6394' : '#bff6ff', vr: rand(-12, 12),
      });
    }
    w.puff(cx, this.y + this.h, '#b8aed0');
  }

  draw(ctx) {
    const shake = this.state === 'shake' ? Math.sin(this.t * 60) * 2 : 0;
    const x = this.x + this.w / 2 + shake;
    const y = this.y;
    ctx.save();
    ctx.lineJoin = 'round';
    // pointe de pierre avec des anneaux plus clairs et un bout en cristal
    const g = ctx.createLinearGradient(x - 15, 0, x + 15, 0);
    g.addColorStop(0, '#8a7cb0');
    g.addColorStop(0.5, '#6f6394');
    g.addColorStop(1, '#463c64');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 2);
    ctx.quadraticCurveTo(x - 9, y + 20, x - 1.5, y + this.h - 2);
    ctx.quadraticCurveTo(x, y + this.h + 1, x + 1.5, y + this.h - 2);
    ctx.quadraticCurveTo(x + 9, y + 20, x + 15, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2f2742';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    for (const k of [10, 21]) {
      const hw = 15 * (1 - k / this.h) - 1;
      ctx.beginPath();
      ctx.moveTo(x - hw, y + k);
      ctx.quadraticCurveTo(x, y + k + 3, x + hw, y + k);
      ctx.stroke();
    }
    ctx.fillStyle = '#bff6ff';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + this.h - 12);
    ctx.lineTo(x, y + this.h);
    ctx.lineTo(x + 4, y + this.h - 12);
    ctx.closePath();
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
const ITEM_SIZE = { candy: 26, lollipop: 28, ball: 24, fruit: 34, caramel: 34, chips: 34, star: 36, gem: 28 };

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
    // minerai de la grotte : 0 or, 1 rubis, 2 émeraude, 3 topaze, 4 diamant (voir Art.GEMS)
    this.gem = 0;
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
    if (this.kind === 'gem') {
      const gl = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
      gl.addColorStop(0, Art.GEMS[this.gem].color);
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.15 * Math.sin(this.t * 4);
      ctx.fillStyle = gl;
      circlePath(ctx, cx, cy, 34);
      ctx.fill();
      ctx.restore();
    } else if (this.kind !== 'candy' && this.kind !== 'ball' && this.kind !== 'lollipop') {
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
      case 'gem': Art.gem(ctx, cx, cy, 1.05, Art.GEMS[this.gem].kind, this.t); break;
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

  // Là où le Lutin ne peut pas poser de bloc magique : tout le trajet de la plateforme
  // (et la place de celui qui est dessus).
  blockZone() {
    const h = this.kind === 'h';
    return {
      x: this.x0, y: this.y0 - (h ? 0 : this.range) - 60,
      w: this.w + (h ? this.range : 0), h: this.h + 60 + (h ? 0 : this.range),
    };
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
    // (touch : l'arrivée qui apparaît après un boss, il faut aller la toucher)
    const at = this.touch ? Math.abs(p.cx - this.x - 10) < 34 && p.y + p.h > this.y - TILE * 5 : p.cx >= this.x - 10;
    if (!this.reached && !p.dead && at) {
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

// Pendant le retour à la maison, c'est le bébé oiseau (sur la casquette de Malice) qui donne les conseils,
// quand elle passe à certains endroits. On ne voit rien par terre : la bulle sort de son bec.
class BirdTip {
  constructor(world, x, y, msg) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.msg = msg;
    this.show = 0;
    this.said = false;
  }

  // Malice est assez près pour entendre ce conseil
  isNear() {
    const p = this.world.player;
    return !p.dead && !p.birdGone && Math.abs(p.cx - this.x) < 190 && Math.abs(p.cy - this.y) < 260;
  }

  // active : le monde choisit le conseil le plus proche, pour ne jamais avoir deux bulles en même temps
  update(dt) {
    const near = this.active;
    this.show = approach(this.show, near ? 1 : 0, dt * 5);
    if (near && !this.said) {
      this.said = true;
      Sound.sfx.chirp();
    } else if (!near && this.show <= 0) {
      this.said = false;
    }
  }

  draw() {
    const p = this.world.player;
    if (this.show > 0.05 && this.msg) this.world.bubble(p.cx, p.y - 44, this.msg, this.show);
  }
}

// La grande fin : la famille du bébé oiseau attend dans son nid, sur un gâteau géant.
// Quand Malice arrive, le bébé s'envole de sa casquette jusqu'au nid, et tout le monde chante.
const CAKE_TIERS = [[150, 50], [118, 44], [86, 38]];
const CAKE_H = CAKE_TIERS.reduce((a, [, h]) => a + h, 0);
const SIBLINGS = [
  { light: '#ffc0e0', mid: '#ff7ab8', dark: '#d0408a', wing: '#e0559e' },
  { light: '#b8ffd8', mid: '#4fd08a', dark: '#239a5a', wing: '#2fae6a' },
  { light: '#fff0a0', mid: '#ffcf3a', dark: '#d89a10', wing: '#e8a820' },
];

class FamilyGoal {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.reached = false;
    this.flyT = -1;
    this.from = null;
    this.chirpT = 1;
    this.noteT = 0;
    this.nestY = y - CAKE_H;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    this.chirpT -= dt;
    const near = Math.abs(p.cx - this.x) < 560;
    if (this.chirpT <= 0) {
      this.chirpT = rand(1, 2);
      if (near && !this.reached) Sound.sfx.chirp();
    }
    if (!this.reached && !p.dead && p.cx >= this.x - 120) {
      this.reached = true;
      this.flyT = 0;
      this.from = { x: p.cx, y: p.y - 10 };
      p.birdGone = true;
      w.game.victory('family');
    }
    if (this.flyT >= 0) {
      const was = this.flyT;
      this.flyT += dt;
      if (was < 1.2 && this.flyT >= 1.2) {
        Sound.sfx.familyCheer();
        butterflyPouf(w, this.x, this.nestY - 30);
      }
      if (this.flyT > 1.2) {
        this.noteT -= dt;
        if (this.noteT <= 0) {
          this.noteT = 0.22;
          const cols = ['#ff4f9a', '#7fd3ff', '#ffd84a', '#7dff9a', '#c49bff'];
          w.spawn({ type: 'note', text: choose(['♪', '♫']), x: this.x + rand(-70, 70), y: this.nestY - 60, vx: rand(-30, 30), vy: rand(-90, -50), life: 1.6, size: 28, color: choose(cols) });
        }
      }
    }
  }

  // le bébé : sur le chemin entre la casquette de Malice et le nid
  babyPos() {
    const k = clamp(this.flyT / 1.2, 0, 1);
    const e = k * k * (3 - 2 * k);
    const tx = this.x;
    const ty = this.nestY - 12;
    const mx = (this.from.x + tx) / 2;
    const my = Math.min(this.from.y, ty) - 120;
    const u = 1 - e;
    return { x: u * u * this.from.x + 2 * u * e * mx + e * e * tx, y: u * u * this.from.y + 2 * u * e * my + e * e * ty, k };
  }

  draw(ctx) {
    const t = this.t;
    const home = this.flyT >= 1.2;
    this.drawCake(ctx);
    Art.birdNest(ctx, this.x, this.nestY + 8, 132);
    const sing = (i) => home && Math.floor(t * 4 + i * 1.3) % 2 === 0;
    const hug = home ? Math.min(1, (this.flyT - 1.2) * 3) : 0;
    Art.bigBird(ctx, this.x - 46, this.nestY - 4, t, { kind: 'maman', sing: sing(0) || (!this.reached && this.chirpT > 1.6), hug, dir: 1, happy: home });
    Art.bigBird(ctx, this.x + 46, this.nestY - 4, t + 1, { kind: 'papa', sing: sing(1), hug, dir: -1, happy: home });
    const sibs = home ? [-26, -13, 13] : [-16, 0, 16];
    SIBLINGS.forEach((colors, i) => {
      Art.babyBird(ctx, this.x + sibs[i], this.nestY - 6, t + i, { noNest: true, colors, chirp: sing(i + 2), happy: home });
    });
    if (this.flyT >= 0) {
      const b = this.babyPos();
      Art.babyBird(ctx, b.x, b.k >= 1 ? this.nestY - 6 : b.y, t, { noNest: true, happy: true, chirp: Math.floor(t * 6) % 2 === 0 });
    }
    const p = this.world.player;
    if (!this.reached && Math.abs(p.cx - this.x) < 520) {
      this.world.bubble(this.x - 46, this.nestY - 74, 'Piou ! Notre bébé !', 1);
    }
  }

  // un gâteau à trois étages, nappage rose qui coule, crème et fraises
  drawCake(ctx) {
    let y = this.y;
    CAKE_TIERS.forEach(([w, h], i) => {
      const x0 = this.x - w / 2;
      const g = ctx.createLinearGradient(0, y - h, 0, y);
      g.addColorStop(0, i === 1 ? '#8a5030' : '#f8dcb0');
      g.addColorStop(1, i === 1 ? '#6a3820' : '#e6b880');
      ctx.fillStyle = g;
      roundRectPath(ctx, x0, y - h, w, h, 8);
      ctx.fill();
      // nappage qui coule
      ctx.fillStyle = i === 1 ? '#ffffff' : '#ff8fc8';
      ctx.beginPath();
      ctx.moveTo(x0, y - h + 6);
      for (let k = 0; k <= 8; k++) {
        const xx = x0 + (w * k) / 8;
        const drip = 8 + (hash(i * 9 + k) * 14);
        ctx.quadraticCurveTo(xx - w / 16, y - h + drip, xx, y - h + 8);
      }
      ctx.lineTo(x0 + w, y - h + 6);
      ctx.quadraticCurveTo(x0 + w, y - h, x0 + w - 8, y - h);
      ctx.lineTo(x0 + 8, y - h);
      ctx.quadraticCurveTo(x0, y - h, x0, y - h + 6);
      ctx.fill();
      // fraises et boules de crème le long du bord
      for (let k = 0; k < 4; k++) {
        const fx = x0 + w * (0.15 + k * 0.233);
        ctx.fillStyle = k % 2 ? '#ffffff' : '#e8203a';
        circlePath(ctx, fx, y - h + 2, k % 2 ? 5 : 6);
        ctx.fill();
        if (!(k % 2)) {
          ctx.fillStyle = '#4fc04f';
          ellipsePath(ctx, fx, y - h - 4, 4, 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      roundRectPath(ctx, x0 + 6, y - h + 14, 6, h - 22, 3);
      ctx.fill();
      y -= h;
    });
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

// Pissenlit géant (les Grands Arbres) : planté sur une branche, ou qui flotte en l'air.
// On l'attrape en le touchant : Malice le tient au-dessus de sa tête et descend tout doucement
// (voir grabPuff dans Player). Quand elle le lâche, il s'envole en graines et repousse à sa place.
const PUFF_REGROW = 4;
const PUFF_R = 28;

class Dandelion {
  constructor(world, x, y, planted) {
    this.world = world;
    // planté : (x, y) est le pied de la tige ; en l'air : le milieu de sa case
    this.x = x;
    this.y = y;
    this.planted = planted;
    // 'ready' : on peut l'attraper, 'held' : Malice le tient, 'grow' : il repousse
    this.state = 'ready';
    this.growT = 0;
    this.touched = false;
    this.t = Math.random() * 6;
    this.seedT = rand(0.5, 2);
  }

  ready() { return this.state === 'ready'; }

  // La boule de graines : en haut de la tige, ou qui monte et descend doucement en l'air.
  head() {
    if (this.planted) return { x: this.x + Math.sin(this.t * 1.6) * 3, y: this.y - 82, tilt: Math.sin(this.t * 1.6) * 0.05 };
    return { x: this.x + Math.sin(this.t * 1.1) * 3, y: this.y - 6 + Math.sin(this.t * 2) * 5, tilt: Math.sin(this.t * 1.3) * 0.08 };
  }

  // Là où on le touche : toute la tige (planté), ou la boule et le bout de tige (en l'air).
  // Planté, on l'attrape aussi en sautant par-dessus (un saut monte plus haut que la boule).
  box() {
    const h = this.head();
    if (this.planted) return { x: this.x - 20, y: h.y - PUFF_R - 2 * TILE, w: 40, h: this.y - h.y + PUFF_R + 2 * TILE };
    return { x: h.x - 26, y: h.y - 26, w: 52, h: 62 };
  }

  grab() {
    this.state = 'held';
  }

  // Malice le lâche : pfff ! il s'envole en graines, et repoussera à sa place.
  release(p) {
    const w = this.world;
    const h = p.puffHead();
    this.state = 'grow';
    this.growT = 0;
    Sound.sfx.puffRelease();
    for (let i = 0; i < 20; i++) {
      const a = rand(0, Math.PI * 2);
      const d = rand(4, PUFF_R);
      w.seed(h.x + Math.cos(a) * d, h.y + Math.sin(a) * d, Math.cos(a) * rand(30, 110) + p.vx * 0.3, Math.sin(a) * rand(20, 80) - rand(40, 110));
    }
  }

  update(dt) {
    const w = this.world;
    this.t += dt;
    if (this.state === 'grow') {
      this.growT += dt;
      if (this.growT >= PUFF_REGROW) {
        this.state = 'ready';
        const h = this.head();
        if (w.onScreen(this.box())) Sound.sfx.puffGrow();
        for (let i = 0; i < 8; i++) {
          w.spawn({ type: 'spark', x: h.x + rand(-20, 20), y: h.y + rand(-20, 20), vx: rand(-60, 60), vy: rand(-80, 10), life: 0.5, size: rand(3, 5), color: i % 2 ? '#ffffff' : '#fff6a0' });
        }
      }
      return;
    }
    // de temps en temps, une graine se détache et s'envole (bien plus souvent quand on vole avec)
    this.seedT -= dt * (this.state === 'held' ? 5 : 1);
    if (this.seedT <= 0) {
      this.seedT = rand(0.8, 2.2);
      const h = this.state === 'held' ? w.player.puffHead() : this.head();
      if (w.onScreen({ x: h.x, y: h.y, w: 0, h: 0 }, 80)) {
        const a = rand(-2.6, -0.5);
        w.seed(h.x + Math.cos(a) * PUFF_R, h.y + Math.sin(a) * PUFF_R, rand(10, 50), rand(-50, -15));
      }
    }
  }

  draw(ctx) {
    const t = this.t;
    if (this.planted) Art.dandelionLeaves(ctx, this.x, this.y, t);
    if (this.state === 'held') return;
    const h = this.head();
    if (this.state === 'ready') {
      if (this.planted) Art.dandelionStem(ctx, this.x, this.y - 2, h.x, h.y + 6, -6);
      else Art.dandelionStem(ctx, h.x, h.y + 6, h.x - 5 + Math.sin(t * 2.4) * 3, h.y + 34, 4);
      Art.dandelion(ctx, h.x, h.y, PUFF_R, t, { tilt: h.tilt, glow: true });
      return;
    }
    // il repousse : la tige pousse, un bouton s'ouvre en fleur jaune, puis devient une boule de graines
    const k = this.growT / PUFF_REGROW;
    if (this.planted) {
      const up = 1 - Math.pow(1 - Math.min(1, k / 0.55), 2);
      const top = { x: this.x + (h.x - this.x) * up, y: this.y - 10 - 72 * up };
      Art.dandelionStem(ctx, this.x, this.y - 2, top.x, top.y + 6, -6 * up);
      if (k < 0.7) {
        Art.dandelionFlower(ctx, top.x, top.y, 13, Math.min(1, k / 0.5));
        return;
      }
    } else if (k < 0.85) {
      return;
    }
    // la boule de graines gonfle (avec un petit rebond)
    const g = (k - (this.planted ? 0.7 : 0.85)) / (this.planted ? 0.3 : 0.15);
    const s = g < 0.8 ? g / 0.8 * 1.1 : 1.1 - (g - 0.8) / 0.2 * 0.1;
    if (this.planted && g < 0.5) Art.dandelionFlower(ctx, h.x, h.y, 13 * (1 - g * 2), 1);
    Art.dandelion(ctx, h.x, h.y, PUFF_R * Math.max(0.05, s), t, { tilt: h.tilt, missing: Math.max(0, 0.6 - g) });
  }

  // Dans les mains de Malice (dessiné juste avant elle : sa main passe devant la tige).
  drawHeld(ctx) {
    const h = this.world.player.puffHead();
    Art.dandelionStem(ctx, h.hand.x, h.hand.y + 4, h.x, h.y + 8, Math.sin(this.t * 2.6) * 4);
    Art.dandelion(ctx, h.x, h.y, PUFF_R, this.t, { tilt: h.tilt });
  }
}

// Nénuphar (la Rivière aux Nénuphars) : il flotte sur la rivière et se balance doucement.
// Ceux qui ont une fleur sont solides. Les autres (grignotés par les escargots) tremblent quand
// Malice reste dessus, puis s'enfoncent dans l'eau, et remontent un peu plus tard.
const PAD_W = 72;
const PAD_SINK = 34;
const PAD_DEEP = 40;

class LilyPad {
  constructor(world, cx, surface, sinks) {
    this.world = world;
    this.sinks = sinks;
    // un nénuphar solide : on y ressort si on tombe à l'eau
    this.solid = !sinks;
    this.w = PAD_W;
    this.h = 12;
    this.home = cx - PAD_W / 2;
    this.surface = surface;
    this.x = this.home;
    this.y = surface - 5;
    this.dx = 0;
    this.dy = 0;
    this.t = rand(0, 6);
    // 'float' : il flotte, 'shake' : il tremble, 'sink' : il coule, 'under' : il est sous l'eau, 'rise' : il remonte
    this.state = 'float';
    this.timer = 0;
    this.depth = 0;
    this.dip = 0;
    this.load = false;
  }

  // assez enfoncé pour qu'on passe à travers (on tombe dans l'eau)
  get sunk() { return this.depth > 18; }

  // il flotte (dessiné par-dessus l'eau) ; plus bas, on le voit sous l'eau
  get onWater() { return this.depth < 6; }

  // Là où le Lutin ne peut pas poser de bloc magique : juste au-dessus du nénuphar (et là où il se balance).
  blockZone() {
    return { x: this.home - 6, y: this.surface - 70, w: this.w + 12, h: 80 };
  }

  update(dt) {
    const p = this.world.player;
    const on = p.platform === this && !p.dead;
    // il s'enfonce un tout petit peu quand on atterrit dessus
    if (on && !this.load) this.dip = 1;
    this.load = on;
    this.t += dt;
    this.dip = Math.max(0, this.dip - dt * 2.5);
    if (this.sinks) this.updateSink(dt);
    const nx = this.home + Math.sin(this.t * 0.55) * 5;
    const ny = this.surface - 5 + this.depth + Math.sin(this.t * 1.7) * 1.2 + Math.sin(this.dip * Math.PI) * 4;
    this.dx = nx - this.x;
    this.dy = ny - this.y;
    this.x = nx;
    this.y = ny;
  }

  updateSink(dt) {
    const w = this.world;
    const cx = this.x + this.w / 2;
    const seen = w.onScreen(this, 60);
    switch (this.state) {
      case 'float':
        if (this.load) {
          this.state = 'shake';
          this.timer = 0;
          if (seen) Sound.sfx.padShake();
        }
        break;
      case 'shake':
        // il tremble de plus en plus ; si on s'en va, il se calme
        if (this.load) this.timer += dt;
        else if ((this.timer -= dt * 1.5) <= 0) this.state = 'float';
        if (seen && Math.random() < dt * 8) {
          w.spawn({ type: 'ring', x: cx + rand(-30, 30), y: this.surface, life: 0.4, size: rand(8, 14), color: 'rgba(230,250,255,0.8)' });
        }
        if (this.timer >= w.diff.padShake) {
          this.state = 'sink';
          if (seen) Sound.sfx.padSink();
        }
        break;
      case 'sink':
        this.depth = Math.min(PAD_DEEP, this.depth + PAD_SINK * dt);
        if (seen && Math.random() < dt * 12) {
          w.spawn({ type: 'ring', x: cx + rand(-26, 26), y: this.surface, life: 0.35, size: rand(6, 12), color: 'rgba(230,250,255,0.9)' });
        }
        if (this.depth >= PAD_DEEP) {
          this.state = 'under';
          this.timer = 0;
        }
        break;
      case 'under':
        this.timer += dt;
        if (this.timer > 1.6) this.state = 'rise';
        break;
      case 'rise':
        this.depth = Math.max(0, this.depth - 26 * dt);
        if (this.depth <= 0) {
          this.state = this.load ? 'shake' : 'float';
          this.timer = 0;
          if (seen) Sound.sfx.padUp();
        }
        break;
      default: break;
    }
  }

  draw(ctx) {
    const shake = this.state === 'shake' ? Math.sin(this.t * 55) * (0.8 + this.timer * 1.6) : 0;
    Art.lilyPad(ctx, this.x + this.w / 2 + shake, this.y, this.w, {
      t: this.t, sinks: this.sinks, surface: this.surface, tilt: shake * 0.015,
    });
  }
}

// Lapin (le terrier secret) : il est gentil, il fait partie du décor. Il remue le nez et les oreilles,
// et fait des petits bonds autour de chez lui. Sur l'herbe, il sort la tête de son trou de temps en temps
// (et s'y cache quand Malice arrive). Il peut aussi dire quelque chose (msg : voir "lapins" dans levels.js).
class Bunny {
  constructor(world, x, y, peek, msg) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.peek = peek;
    this.msg = msg || '';
    this.t = rand(0, 6);
    this.dir = choose([-1, 1]);
    // un bond (de 0 à 1), ou -1 quand il est assis
    this.hop = -1;
    this.hopT = rand(0.5, 2.5);
    // dans son trou : combien il sort la tête (de 0 à 1)
    this.out = 0;
    this.up = false;
    this.outT = rand(0.5, 2);
    this.show = 0;
    this.v = Math.random();
  }

  update(dt) {
    const p = this.world.player;
    this.t += dt;
    const near = !p.dead && Math.abs(p.cx - this.x) < 160 && Math.abs(p.cy - this.y) < 150;
    if (this.peek) {
      // il sort la tête, regarde à droite et à gauche, puis redescend (tout de suite, si Malice arrive)
      const scared = !p.dead && Math.abs(p.cx - this.x) < 100 && Math.abs(p.y + p.h - this.y) < 120;
      this.outT -= dt;
      if (this.outT <= 0) {
        this.up = !this.up;
        this.outT = this.up ? rand(2, 3) : rand(1.2, 2);
      }
      const want = this.up && !scared ? 1 : 0;
      this.out = approach(this.out, want, dt * (want ? 2.2 : 7));
      if (Math.random() < dt * 0.6) this.dir = -this.dir;
    } else if (this.hop >= 0) {
      this.hop += dt / 0.42;
      this.x += this.dir * 70 * dt;
      if (this.hop >= 1) {
        this.hop = -1;
        this.hopT = rand(0.6, 2.2);
      }
    } else {
      this.hopT -= dt;
      if (near) this.dir = Math.sign(p.cx - this.x) || this.dir;
      if (this.hopT <= 0) {
        // jamais trop loin de chez lui
        if (Math.abs(this.x - this.homeX) > 40) this.dir = Math.sign(this.homeX - this.x);
        else if (Math.random() < 0.5) this.dir = -this.dir;
        this.hop = 0;
      }
    }
    this.show = approach(this.show, near && this.msg ? 1 : 0, dt * 5);
  }

  draw(ctx) {
    const lift = this.hop >= 0 ? Math.sin(this.hop * Math.PI) * 18 : 0;
    Art.bunny(ctx, this.x, this.y - lift, {
      t: this.t, dir: this.dir, hop: this.hop, peek: this.peek ? this.out : -1, v: this.v,
    });
    if (this.show > 0.05) this.world.bubble(this.x, this.y - 58, this.msg, this.show);
  }
}

// Lucioles (la Prairie la Nuit) : un petit groupe qui danse au-dessus de l'herbe et éclaire tout autour.
// Quand Malice passe tout près, elles la suivent un moment pour éclairer son chemin, puis rentrent chez elles.
const FIREFLY_FOLLOW = 10;

class Fireflies {
  constructor(world, x, y) {
    this.world = world;
    this.homeX = x;
    this.homeY = y;
    this.x = x;
    this.y = y;
    this.t = rand(0, 6);
    // le temps qu'elles suivent encore Malice, et le temps avant de pouvoir la suivre à nouveau
    this.follow = 0;
    this.rest = 0;
    this.flies = Array.from({ length: 6 }, () => ({ ph: rand(0, 6), r: rand(10, 28), sp: rand(1.1, 2.1), blink: rand(0, 6) }));
  }

  update(dt) {
    const p = this.world.player;
    this.t += dt;
    this.rest -= dt;
    if (this.follow > 0) {
      this.follow -= dt;
      if (p.dead || p.dive > 0 || this.follow <= 0) {
        this.follow = 0;
        this.rest = 4;
      }
    } else if (this.rest <= 0 && !p.dead && Math.hypot(p.cx - this.x, p.cy - this.y) < 130) {
      this.follow = FIREFLY_FOLLOW;
      if (this.world.onScreen(this)) Sound.sfx.fireflies();
    }
    let tx;
    let ty;
    let k;
    if (this.follow > 0) {
      // juste derrière sa tête, en se balançant
      tx = p.cx - p.facing * 30 + Math.sin(this.t * 1.7) * 14;
      ty = p.y - 6 + Math.sin(this.t * 2.3) * 8;
      k = dt * 3.5;
    } else {
      tx = this.homeX + Math.sin(this.t * 0.5) * 22;
      ty = this.homeY + Math.sin(this.t * 0.8) * 10;
      k = dt * 0.9;
    }
    this.x += (tx - this.x) * Math.min(1, k);
    this.y += (ty - this.y) * Math.min(1, k);
  }

  light() {
    return { x: this.x, y: this.y, r: this.follow > 0 ? 170 : 110, a: 0.85 };
  }

  // (dessinées par-dessus la nuit : elles brillent ; d'abord tous les halos, puis les lucioles)
  draw(ctx) {
    for (const f of this.flies) {
      const a = this.t * f.sp + f.ph;
      f.x = this.x + Math.cos(a) * f.r + Math.sin(a * 2.3) * 4;
      f.y = this.y + Math.sin(a * 1.3) * f.r * 0.6;
      f.k = 0.55 + 0.45 * Math.sin(this.t * 3 + f.blink);
      f.dir = -Math.sin(a) >= 0 ? 1 : -1;
      Art.glow(ctx, f.x, f.y, 16 + f.k * 4, '220,255,120', 0.35 + 0.6 * f.k);
    }
    for (const f of this.flies) Art.firefly(ctx, f.x, f.y, f.k, f.dir, this.t + f.ph);
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
