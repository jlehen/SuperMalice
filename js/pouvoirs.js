'use strict';

// =====================================================================
//  LES POUVOIRS DES PERSONNAGES
//  Touche Pouvoir : B (ou le bouton étoile sur tablette, ou Y sur la manette).
//  Le joueur (Player dans entities.js) appelle ces fonctions, si le personnage en a :
//   update(p, dt, I)    à chaque image, avant de bouger (I = Input)
//   move(p, dt, dir)    renvoie true s'il s'occupe lui-même de la vitesse (glissade, charge…)
//   top(p, top)         vitesse maximale
//   jump(p, v)          force du saut
//   airJump(p)          on appuie sur saut en l'air : renvoie true s'il s'en sert
//   fall(p, dt)         après la gravité (planer, glisser le long d'un mur…)
//   land(p, speed, pound) en touchant le sol
//   wall(p, side)       en l'air contre un mur (side : 1 à droite, -1 à gauche)
//   knocks(p)           true : les ennemis touchés sont renversés
//   lavaProof           la lave ne brûle pas
//   swims               il nage dans la rivière (au lieu de tomber dedans)
//   bounce              rebondit plus haut sur les ennemis
//   pose(p)             une pose spéciale pour le dessin (voir js/persos/)
//   stop(p)             le pouvoir s'arrête (grappin, ou quand on a mal)
//   splash(p)           les pieds dans une flaque d'eau
//   shield(p)           on va avoir mal : renvoie true s'il s'en protège (le Gremlin redevient Gizmo)
//   label(p)            le nom du pouvoir dans le HUD, s'il change (le Gremlin)
// =====================================================================

// Peut-on se servir de son pouvoir maintenant ? (pas en tenant un pissenlit géant : on a les mains prises)
const canPower = (p) => p.hurtT <= 0 && !p.pound && !p.grap && !p.crouch && !p.puff;

// La pose spéciale reste un petit moment (p.pw.poseT secondes).
function powerPose(p, name, time) {
  p.pw.pose = name;
  p.pw.poseT = time;
}

// Les ennemis touchés sont renversés (avec un petit mot).
function knockEnemy(p, e, word) {
  e.kill('bump');
  if (word) p.world.popText(e.cx, e.y - 20, word, '#ffffff', 22);
}

// BOUM : les ennemis posés par terre autour sont renversés.
function quake(p, radius) {
  const w = p.world;
  w.shake(12);
  Sound.sfx.quake();
  const feet = p.y + p.h;
  w.spawn({ type: 'ring', x: p.cx, y: feet, life: 0.45, size: radius, color: 'rgba(255,230,160,0.9)' });
  for (let i = 0; i < 18; i++) {
    const s = i % 2 ? 1 : -1;
    w.spawn({ type: 'dust', x: p.cx + s * rand(0, radius * 0.8), y: feet, vx: s * rand(60, 260), vy: rand(-220, -40), life: 0.6, size: rand(6, 11) });
  }
  for (const e of w.enemies) {
    if (e.dying || e.dead) continue;
    const near = Math.abs(e.cx - p.cx) < radius && Math.abs(e.y + e.h - feet) < 60;
    if (near && (e.onGround || Math.abs(e.y + e.h - feet) < 20)) knockEnemy(p, e, 'Boum !');
  }
}

const POWERS = {
  // ---- Le Lutin : un bloc lutin magique apparaît sous ses pieds ----
  lutin: {
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (!I.pressed.power || pw.cd > 0 || !canPower(p)) return;
      const w = p.world;
      const c = Math.floor(p.cx / TILE);
      if (p.onGround) {
        // le bloc prend la place de ses pieds et le soulève
        const r = Math.floor((p.y + p.h - 1) / TILE);
        if (w.boxSolid(p.x + 2, p.y - TILE, p.w - 4, TILE) || !w.addMagicBlock(c, r)) {
          Sound.sfx.bump();
          return;
        }
        p.y = r * TILE - p.h;
        p.vy = 0;
        p.platform = null;
      } else {
        // en l'air : le bloc apparaît juste sous ses pieds (s'il les touche presque, il monte dessus)
        const feet = p.y + p.h;
        const r = Math.ceil((feet - 12) / TILE);
        const lift = Math.max(0, feet - r * TILE);
        if ((lift && w.boxSolid(p.x + 2, p.y - lift, p.w - 4, lift)) || !w.addMagicBlock(c, r)) {
          Sound.sfx.bump();
          return;
        }
        if (lift) {
          p.y -= lift;
          p.vy = 0;
        }
      }
      pw.cd = 0.3;
      powerPose(p, 'magic', 0.35);
    },
  },

  // ---- La Biche : un deuxième saut en l'air ----
  biche: {
    update(p, dt, I) {
      if (p.onGround) p.pw.used = false;
      if (I.pressed.power && !p.onGround) this.airJump(p);
    },
    airJump(p) {
      if (p.pw.used || !canPower(p)) return false;
      p.pw.used = true;
      p.vy = -PHYS.jump * 0.92;
      // lancé avec la touche pouvoir : le saut n'est pas coupé parce que saut n'est pas appuyé
      p.jumping = !!Input.held.jump;
      p.superSpin = 0.55;
      Sound.sfx.jump();
      for (let i = 0; i < 8; i++) {
        p.world.spawn({ type: 'spark', x: p.cx + rand(-12, 12), y: p.y + p.h, vx: rand(-120, 120), vy: rand(20, 120), life: 0.45, size: rand(3, 6), color: i % 2 ? '#fff6d0' : '#ffd0e0' });
      }
      return true;
    },
  },

  // ---- Gros Bonbon : roulé en boule, il rebondit très haut ----
  bonbon: {
    bounce: 1.35,
    update(p, dt, I) {
      const pw = p.pw;
      pw.ball = I.held.power && !p.grap && !p.puff && p.hurtT <= 0;
      pw.roll = (pw.roll || 0) + (p.vx * dt) / 24;
      if (pw.ball && Math.random() < dt * 12) {
        p.world.spawn({ type: 'spark', x: p.cx + rand(-14, 14), y: p.y + p.h - rand(0, 40), vy: -30, life: 0.4, size: rand(3, 5), color: i2c(Math.random()) });
      }
    },
    top(p, top) { return p.pw.ball ? Math.max(top, 380) : top; },
    land(p, speed) {
      if (!p.pw.ball) return;
      // boing ! plus il tombe de haut, plus il rebondit (sans jamais monter plus haut qu'un super saut)
      p.vy = -clamp(speed * 0.9, PHYS.jump * 0.95, PHYS.superJump);
      p.onGround = false;
      p.platform = null;
      p.jumping = false;
      Sound.sfx.jump();
      p.world.spawn({ type: 'ring', x: p.cx, y: p.y + p.h, life: 0.3, size: 40, color: 'rgba(255,160,210,0.9)' });
    },
    pose(p) { return p.pw.ball ? 'ball' : null; },
  },

  // ---- Ronaxel : tire un ballon ; en l'air, saut SIUUU ----
  ronaxel: {
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (p.onGround) pw.siu = false;
      if (pw.siuing && p.vy >= 0) pw.siuing = false;
      if (!I.pressed.power || !canPower(p)) return;
      if (!p.onGround && !pw.siu) {
        // SIUUUU !
        pw.siu = true;
        pw.siuing = true;
        p.vy = -PHYS.superJump;
        p.jumping = false;
        p.superSpin = 0.55;
        Sound.sfx.siu();
        p.world.popText(p.cx, p.y - 20, 'SIUUU !', '#ffe14d', 30);
        p.world.spawn({ type: 'ring', x: p.cx, y: p.y + p.h, life: 0.4, size: 60, color: 'rgba(255,225,77,0.9)' });
        return;
      }
      if (pw.cd > 0) return;
      pw.cd = 0.45;
      powerPose(p, 'kick', 0.25);
      Sound.sfx.kick();
      p.world.projectiles.push(new PowerShot(p.world, 'ballon', p.cx + p.facing * 16, p.y + p.h - 12, p.facing, p.vx));
    },
    pose(p) { return p.pw.siuing ? 'siu' : null; },
  },

  // ---- Le Poussin : il bat des ailes 3 fois en l'air ----
  poussin: {
    update(p, dt, I) {
      if (p.onGround) p.pw.flaps = 0;
      if (I.pressed.power && !p.onGround) this.airJump(p);
    },
    airJump(p) {
      if ((p.pw.flaps || 0) >= 3 || !canPower(p)) return false;
      p.pw.flaps = (p.pw.flaps || 0) + 1;
      p.vy = -480;
      p.jumping = false;
      powerPose(p, 'flap', 0.3);
      Sound.sfx.flap();
      for (let i = 0; i < 4; i++) {
        p.world.spawn({ type: 'spark', x: p.cx + rand(-14, 14), y: p.y + 30, vx: rand(-80, 80), vy: rand(40, 140), life: 0.5, size: rand(3, 5), color: '#ffe680' });
      }
      return true;
    },
  },

  // ---- Luisy : saute très haut, et plane en tombant ----
  luisy: {
    jump(p, v) { return v * 1.12; },
    fall(p) {
      const I = Input.held;
      p.pw.gliding = p.vy > 0 && !p.onGround && (I.jump || I.power) && p.hurtT <= 0 && !p.puff;
      if (p.pw.gliding) {
        p.vy = Math.min(p.vy, 120);
        if (Math.random() < 0.15) {
          p.world.spawn({ type: 'spark', x: p.cx + rand(-18, 18), y: p.y + 20, vy: 40, life: 0.6, size: rand(3, 5), color: '#ffffff' });
        }
      }
    },
    pose(p) { return p.pw.gliding ? 'glide' : null; },
  },

  // ---- Messi : il dribble à travers les ennemis ----
  messi: {
    update(p) {
      const dribble = (Input.held.power || p.running) && p.onGround && Math.abs(p.vx) > 120 && p.hurtT <= 0;
      p.pw.dribble = dribble;
      if (dribble && Math.random() < 0.08) Sound.sfx.click();
    },
    top(p, top) { return Input.held.power ? PHYS.sprint : top; },
    knocks(p) { return p.pw.dribble && Math.abs(p.vx) > 200; },
    knockWord: 'Olé !',
    pose(p) { return p.pw.dribble ? 'dribble' : null; },
  },

  // ---- La Licorne : elle fonce avec sa corne ----
  licorne: {
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (p.onGround) pw.airUsed = false;
      if (pw.charge > 0) {
        pw.charge -= dt;
        if (Math.random() < dt * 40) {
          p.world.spawn({ type: 'spark', x: p.cx - p.facing * 16, y: p.y + rand(14, 44), vx: -p.facing * rand(20, 80), vy: rand(-20, 20), life: 0.5, size: rand(4, 7), color: `hsl(${Math.floor(p.t * 600) % 360},100%,70%)` });
        }
      }
      if (!I.pressed.power || pw.cd > 0 || pw.charge > 0 || !canPower(p)) return;
      if (!p.onGround && pw.airUsed) return;
      if (!p.onGround) pw.airUsed = true;
      pw.charge = 0.42;
      pw.cd = 0.75;
      Sound.sfx.horn();
    },
    stop(p) { p.pw.charge = 0; },
    move(p) {
      if (!(p.pw.charge > 0)) return false;
      // dans le chocolat, on s'enfonce : pas de charge
      if (p.inChoco) {
        p.pw.charge = 0;
        return false;
      }
      p.vx = p.facing * 720;
      if (!p.onGround) p.vy = Math.min(p.vy, 0) * 0.5;
      return true;
    },
    wall(p) { p.pw.charge = 0; },
    knocks(p) { return p.pw.charge > 0; },
    knockWord: 'Pouf !',
    pose(p) { return p.pw.charge > 0 ? 'charge' : null; },
  },

  // ---- Bébé Dragon : des bulles de feu, et la lave ne lui fait rien ----
  dragon: {
    lavaProof: true,
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (!I.pressed.power || pw.cd > 0 || !canPower(p)) return;
      pw.cd = 0.4;
      powerPose(p, 'breathe', 0.25);
      Sound.sfx.fire();
      p.world.projectiles.push(new PowerShot(p.world, 'feu', p.cx + p.facing * 22, p.y + p.h - 42, p.facing, p.vx));
    },
  },

  // ---- Le Pingouin : il glisse sur le ventre (encore plus loin sur la bave), et il nage ----
  pingouin: {
    swims: true,
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (pw.slide > 0) {
        pw.slide -= dt * (p.slick ? 0.35 : 1);
        if (I.pressed.jump || p.hurtT > 0) pw.slide = 0;
        if (Math.random() < dt * 30) {
          p.world.spawn({ type: 'spark', x: p.cx - p.facing * 20, y: p.y + p.h - 2, vx: -p.facing * rand(60, 160), vy: rand(-80, -20), life: 0.35, size: rand(2, 4), color: '#e8f8ff' });
        }
      }
      if (I.pressed.power && p.onGround && pw.cd <= 0 && !(pw.slide > 0) && canPower(p)) {
        pw.slide = 0.9;
        pw.cd = 0.3;
        Sound.sfx.slide();
      }
    },
    stop(p) { p.pw.slide = 0; },
    move(p) {
      const pw = p.pw;
      if (!(pw.slide > 0)) return false;
      if (p.inChoco) {
        pw.slide = 0;
        return false;
      }
      // ça glisse vite, puis un peu moins
      p.vx = p.facing * (420 + 260 * Math.min(1, pw.slide / 0.5));
      return true;
    },
    wall(p) { p.pw.slide = 0; },
    knocks(p) { return p.pw.slide > 0; },
    knockWord: 'Strike !',
    pose(p) { return p.pw.slide > 0 ? 'slide' : null; },
  },

  // ---- Le Chat Ninja : il s'accroche aux murs et saute de mur en mur ----
  chat: {
    update(p, dt, I) {
      const pw = p.pw;
      pw.wallT = Math.max(0, (pw.wallT || 0) - dt);
      if (p.onGround) pw.wallT = 0;
      if (pw.wall) {
        const dir = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0);
        const side = pw.wall;
        const x = side > 0 ? p.x + p.w : p.x - 2;
        if (p.onGround || p.hurtT > 0 || dir !== side || !p.world.boxSolid(x, p.y + 10, 2, p.h - 20)) {
          // on peut encore sauter un tout petit moment après avoir lâché le mur
          pw.wall = 0;
          pw.lastWall = side;
          pw.wallT = p.onGround ? 0 : 0.18;
        } else {
          p.facing = side;
        }
      }
      if ((pw.wall || pw.wallT > 0) && I.pressed.power && !p.puff) this.airJump(p);
    },
    wall(p, side) {
      if (p.vy > -150 && p.hurtT <= 0) p.pw.wall = side;
    },
    fall(p) {
      if (p.pw.wall) p.vy = Math.min(p.vy, 110);
    },
    airJump(p) {
      const side = p.pw.wall || (p.pw.wallT > 0 ? p.pw.lastWall : 0);
      if (!side) return false;
      p.pw.wall = 0;
      p.pw.wallT = 0;
      p.vy = -PHYS.jump * 0.95;
      p.vx = -side * 430;
      p.facing = -side;
      p.boostT = 0.3;
      p.jumping = !!Input.held.jump;
      Sound.sfx.wallJump();
      for (let i = 0; i < 5; i++) {
        p.world.spawn({ type: 'dust', x: side > 0 ? p.x + p.w : p.x, y: p.y + rand(10, 50), vx: -side * rand(20, 80), vy: rand(-40, 40), life: 0.35, size: rand(4, 6) });
      }
      return true;
    },
    pose(p) { return p.pw.wall ? 'wall' : null; },
  },

  // ---- La Sirène : une vague par terre, une bulle en l'air, et elle nage dans la rivière ----
  sirene: {
    swims: true,
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (p.onGround) pw.airUsed = false;
      if (pw.bubble > 0) {
        pw.bubble -= dt;
        if (I.pressed.jump || I.pressed.power || p.hurtT > 0 || p.onGround) pw.bubble = 0;
        if (pw.bubble <= 0) this.pop(p);
        return;
      }
      if (!I.pressed.power || pw.cd > 0 || !canPower(p)) return;
      if (p.onGround) {
        pw.cd = 0.6;
        powerPose(p, 'wave', 0.3);
        Sound.sfx.wave();
        p.world.projectiles.push(new PowerShot(p.world, 'vague', p.cx + p.facing * 20, p.y + p.h, p.facing, p.vx));
      } else if (!pw.airUsed) {
        pw.airUsed = true;
        pw.bubble = 1.4;
        Sound.sfx.bubble();
      }
    },
    stop(p) { if (p.pw.bubble > 0) this.pop(p); },
    ceil(p) { if (p.pw.bubble > 0) this.pop(p); },
    pop(p) {
      p.pw.bubble = 0;
      Sound.sfx.bubblePop();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        p.world.spawn({ type: 'spark', x: p.cx + Math.cos(a) * 34, y: p.y + 24 + Math.sin(a) * 34, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.35, size: 4, color: '#c8f4ff' });
      }
    },
    fall(p) {
      if (p.pw.bubble > 0) {
        p.vy = -230;
        p.vx = clamp(p.vx, -200, 200);
      }
    },
    pose(p) { return p.pw.bubble > 0 ? 'bubble' : null; },
  },

  // ---- Le Dinosaure : BOUM, le sol tremble ----
  dino: {
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (pw.stompT > 0) {
        pw.stompT -= dt;
        if (pw.stompT <= 0 && p.onGround) quake(p, 200);
      }
      if (I.pressed.power && p.onGround && pw.cd <= 0 && canPower(p)) {
        pw.cd = 0.9;
        pw.stompT = 0.22;
        powerPose(p, 'stomp', 0.3);
      }
    },
    move(p) {
      if (!(p.pw.stompT > 0)) return false;
      p.vx = 0;
      return true;
    },
    land(p, speed, pound) {
      if (pound) quake(p, 240);
    },
  },

  // ---- San Goku : le Kaméhaméha ; en l'air, son nuage magique ----
  goku: {
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      if (p.onGround) pw.cloudUsed = false;
      if (pw.cloud > 0) {
        pw.cloud -= dt;
        // en sautant, il saute de son nuage
        if (p.onGround || p.hurtT > 0 || p.pound || I.pressed.jump) pw.cloud = 0;
        if (pw.cloud <= 0) this.cloudOff(p);
        else if (Math.random() < dt * 25) {
          p.world.spawn({ type: 'spark', x: p.cx - p.facing * rand(14, 30), y: p.y + p.h + rand(-2, 6), vx: -p.facing * rand(20, 80), vy: rand(-10, 20), life: 0.45, size: rand(3, 5), color: '#ffe680' });
        }
      }
      if (!I.pressed.power || pw.cd > 0 || !canPower(p)) return;
      if (!p.onGround && !pw.cloudUsed && !(pw.cloud > 0)) {
        // le nuage magique arrive sous ses pieds
        pw.cloudUsed = true;
        pw.cloud = 2.5;
        p.vy = 0;
        p.jumping = false;
        Sound.sfx.cloud();
        for (let i = 0; i < 8; i++) {
          p.world.spawn({ type: 'smoke', x: p.cx + rand(-20, 20), y: p.y + p.h + rand(-4, 6), vx: rand(-60, 60), vy: rand(-30, 10), life: 0.45, size: rand(5, 8), color: '#ffe680' });
        }
        return;
      }
      // KAMÉHAMÉHA ! (aussi debout sur le nuage)
      pw.cd = 0.55;
      powerPose(p, 'kame', 0.35);
      Sound.sfx.kame();
      p.world.popText(p.cx, p.y - 20, 'Kaméhaméha !', '#bfeaff', 22);
      p.world.projectiles.push(new PowerShot(p.world, 'kame', p.cx + p.facing * 26, p.y + p.h - 31, p.facing, p.vx));
    },
    cloudOff(p) {
      p.pw.cloud = 0;
      for (let i = 0; i < 6; i++) {
        p.world.spawn({ type: 'smoke', x: p.cx + rand(-18, 18), y: p.y + p.h + rand(0, 6), vx: rand(-50, 50), vy: rand(-40, 0), life: 0.4, size: rand(4, 7), color: '#ffe680' });
      }
    },
    stop(p) { if (p.pw.cloud > 0) this.cloudOff(p); },
    fall(p) {
      if (!(p.pw.cloud > 0)) return;
      // il flotte, et peut toujours sauter comme s'il était par terre
      p.vy = Math.sin(p.t * 4) * 15;
      p.coyote = PHYS.coyote;
    },
    top(p, top) { return p.pw.cloud > 0 ? Math.max(top, 400) : top; },
    pose(p) {
      if (p.pw.poseT > 0 && p.pw.pose === 'kame') return 'kame';
      return p.pw.cloud > 0 ? 'cloud' : null;
    },
  },

  // ---- Gizmo : sa petite voiture. Dans l'eau, il devient un Gremlin (et fait des petits Gremlins) ----
  gizmo: {
    update(p, dt, I) {
      const pw = p.pw;
      pw.cd = Math.max(0, (pw.cd || 0) - dt);
      pw.wheel = (pw.wheel || 0) + (p.vx * dt) / 5;
      if (pw.car > 0) {
        pw.car -= dt;
        if (p.hurtT > 0 || pw.gremlin) pw.car = 0;
        if (pw.car <= 0) this.carOff(p);
        else if (Math.random() < dt * 14) {
          p.world.spawn({ type: 'smoke', x: p.cx - p.facing * 24, y: p.y + p.h - 8, vx: -p.facing * rand(30, 80), vy: rand(-40, -10), life: 0.4, size: rand(3, 5), color: '#ffd0e4' });
        }
      }
      if (!I.pressed.power || pw.cd > 0 || !canPower(p)) return;
      if (pw.gremlin) {
        // hi hi hi ! des petits Gremlins partent en courant
        pw.cd = 0.9;
        powerPose(p, 'summon', 0.5);
        Sound.sfx.gremlins();
        for (let i = 0; i < 3; i++) {
          const g = new PowerShot(p.world, 'gremlin', p.cx + p.facing * (6 + i * 6), p.y + p.h, p.facing, p.vx);
          g.vx = p.facing * (260 + i * 70);
          g.vy = -(180 + i * 110);
          p.world.projectiles.push(g);
        }
        return;
      }
      if (pw.car > 0) {
        // il descend de sa voiture
        this.carOff(p);
        pw.cd = 0.3;
        return;
      }
      pw.car = 2.5;
      pw.cd = 0.3;
      Sound.sfx.car();
    },
    carOff(p) {
      p.pw.car = 0;
      p.world.puff(p.cx, p.y + p.h - 10, '#ffc0dc');
    },
    stop(p) { if (p.pw.car > 0) this.carOff(p); },
    move(p, dt, dir) {
      if (!(p.pw.car > 0)) return false;
      if (p.inChoco) {
        this.carOff(p);
        return false;
      }
      // vroum ! on peut tourner avec les flèches
      if (dir) p.facing = dir;
      p.vx = approach(p.vx, p.facing * 560, 2400 * dt);
      return true;
    },
    knocks(p) { return p.pw.car > 0 && Math.abs(p.vx) > 200; },
    knockWord: 'Tut tut !',
    jump(p, v) { return p.pw.gremlin ? v * 1.06 : v; },
    top(p, top) { return p.pw.gremlin ? top * 1.1 : top; },
    pose(p) { return p.pw.car > 0 ? 'car' : null; },
    // les pieds dans l'eau : Gizmo devient un Gremlin !
    splash(p) {
      const pw = p.pw;
      if (pw.gremlin) return;
      this.stop(p);
      pw.gremlin = true;
      Sound.sfx.gremlin();
      p.world.shake(4);
      p.world.popText(p.cx, p.y - 26, 'Gremlin !', '#9aff6a', 26);
      for (let i = 0; i < 12; i++) {
        p.world.spawn({ type: 'smoke', x: p.cx + rand(-18, 18), y: p.y + rand(0, p.h), vx: rand(-90, 90), vy: rand(-120, -20), life: 0.6, size: rand(5, 9), color: i % 2 ? '#8ad060' : '#d8f0c0' });
      }
    },
    // touché en Gremlin : il redevient Gizmo, et ne perd pas de coeur
    shield(p) {
      const pw = p.pw;
      if (!pw.gremlin) return false;
      pw.gremlin = false;
      Sound.sfx.gizmoBack();
      p.world.popText(p.cx, p.y - 26, 'Gizmo !', '#ffd8a0', 24);
      for (let i = 0; i < 10; i++) {
        p.world.spawn({ type: 'smoke', x: p.cx + rand(-16, 16), y: p.y + rand(10, p.h), vx: rand(-80, 80), vy: rand(-100, -20), life: 0.5, size: rand(5, 8), color: i % 2 ? '#c8925a' : '#f6e8cc' });
      }
      return true;
    },
    label(p) { return p.pw.gremlin ? 'Petits Gremlins' : null; },
  },
};

// Une couleur de bonbon (rose, blanc, jaune…), pour les étincelles du Gros Bonbon.
function i2c(k) {
  return ['#ff7ab8', '#ffffff', '#ffd84a', '#9fe8ff'][Math.floor(k * 4) % 4];
}

// ======================= CE QUE LANCENT LES PERSONNAGES =======================
// ballon : Ronaxel (il rebondit)     feu : Bébé Dragon (tout droit)     vague : la Sirène (au ras du sol)
// kame : San Goku (tout droit, il traverse tous les ennemis)     gremlin : un petit Gremlin qui court et saute
class PowerShot {
  constructor(world, kind, x, y, dir, pvx) {
    this.world = world;
    this.kind = kind;
    this.dir = dir;
    this.t = 0;
    this.dead = false;
    this.bounces = 0;
    this.hit = new Set();
    if (kind === 'ballon') {
      this.w = 18; this.h = 18;
      this.vx = dir * 560 + pvx * 0.3;
      this.vy = -180;
    } else if (kind === 'feu') {
      this.w = 22; this.h = 22;
      this.vx = dir * 500 + pvx * 0.2;
      this.vy = 0;
    } else if (kind === 'kame') {
      this.w = 30; this.h = 26;
      this.vx = dir * 620 + pvx * 0.2;
      this.vy = 0;
    } else if (kind === 'gremlin') {
      this.w = 18; this.h = 26;
      this.vx = dir * 300;
      this.vy = -200;
    } else {
      this.w = 44; this.h = 36;
      this.vx = dir * 400;
      this.vy = 0;
    }
    this.x = x - this.w / 2;
    this.y = kind === 'vague' || kind === 'gremlin' ? y - this.h : y - this.h / 2;
    this.x0 = x;
    this.baseY = this.y;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(dt) {
    const w = this.world;
    this.t += dt;
    if (this.kind === 'ballon') {
      this.vy = Math.min(this.vy + 1500 * dt, PHYS.maxFall);
      const res = w.moveBody(this, dt);
      if (res.landed) {
        this.vy = -380;
        this.bounces++;
        Sound.sfx.bump();
      }
      if (res.wall) {
        this.vx = -res.wall * 360;
        this.dir = -res.wall;
        this.bounces++;
      }
      if (this.bounces > 4 || this.t > 2.6) this.poof();
    } else if (this.kind === 'feu') {
      this.x += this.vx * dt;
      this.y = this.baseY + Math.sin(this.t * 14) * 4;
      if (w.solidAt(this.cx + this.dir * 8, this.cy) || this.t > 1.2) this.poof();
      if (Math.random() < dt * 30) {
        w.spawn({ type: 'spark', x: this.cx - this.dir * 8, y: this.cy + rand(-6, 6), vx: -this.dir * rand(20, 80), vy: rand(-60, 0), life: 0.3, size: rand(3, 6), color: Math.random() < 0.5 ? '#ffb02e' : '#ff5a1f' });
      }
    } else if (this.kind === 'kame') {
      this.x += this.vx * dt;
      if (w.solidAt(this.cx + this.dir * 12, this.cy) || this.t > 1) this.poof();
      if (Math.random() < dt * 40) {
        w.spawn({ type: 'spark', x: this.cx - this.dir * rand(0, 20), y: this.cy + rand(-10, 10), vx: -this.dir * rand(20, 100), vy: rand(-40, 40), life: 0.35, size: rand(3, 5), color: Math.random() < 0.5 ? '#ffffff' : '#7fd8ff' });
      }
    } else if (this.kind === 'gremlin') {
      // il court, saute par-dessus les murs, et fait des petits bonds en ricanant
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      const res = w.moveBody(this, dt);
      if (res.landed && Math.random() < 0.3) this.vy = -rand(200, 320);
      if (res.wall) {
        this.vx = this.dir * 300;
        if (this.bounces++ > 2) this.poof();
        else this.vy = -480;
      }
      if (this.t > 2.4) this.poof();
    } else {
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      const res = w.moveBody(this, dt);
      if (res.wall || this.t > 1.1) this.poof();
      if (Math.random() < dt * 25) {
        w.spawn({ type: 'spark', x: this.cx + rand(-16, 16), y: this.y + rand(0, 10), vx: this.dir * rand(0, 60), vy: rand(-140, -60), g: 500, life: 0.4, size: rand(3, 5), color: '#d8f6ff' });
      }
    }
    if (this.y > w.height || w.inLava(this)) this.dead = true;
    if (this.dead) return;
    for (const e of w.enemies) {
      if (e.dying || e.dead || this.hit.has(e) || !overlap(this, e.shotBox ? e.shotBox() : e)) continue;
      this.hit.add(e);
      knockEnemy(w.player, e, this.kind === 'ballon' ? 'Goal !' : this.kind === 'gremlin' ? 'Hi hi !' : null);
      if (this.kind === 'feu') {
        this.poof();
        return;
      }
      if (this.kind === 'ballon') {
        this.vx = -this.vx * 0.5;
        this.vy = -420;
      }
    }
    // les points noirs et les morceaux de cube sont balayés aussi
    for (const h of w.hazards) {
      if (h.dead || !overlap(this, h)) continue;
      h.dead = true;
      w.puff(h.x + h.w / 2, h.y + h.h / 2, '#ddd');
    }
  }

  poof() {
    const w = this.world;
    this.dead = true;
    const col = { feu: '#ff8a2e', vague: '#bfefff', kame: '#bfe8ff', gremlin: '#a8e080' }[this.kind] || '#ffffff';
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'smoke', x: this.cx + rand(-8, 8), y: this.cy + rand(-8, 8), vx: rand(-60, 60), vy: rand(-80, -10), life: 0.4, size: rand(5, 9), color: col });
    }
  }

  draw(ctx) {
    const x = this.cx;
    const y = this.cy;
    ctx.save();
    ctx.translate(x, y);
    if (this.kind === 'ballon') {
      ctx.rotate(this.t * 12 * Math.sign(this.vx || 1));
      PowerShot.football(ctx, 9);
    } else if (this.kind === 'kame') {
      // le rayon qui part des mains de San Goku, et la grosse boule d'énergie au bout
      const len = Math.abs(this.cx - this.x0);
      const fade = Math.max(0, 1 - this.t / 0.6);
      if (fade > 0) {
        const g = ctx.createLinearGradient(-this.dir * len, 0, 0, 0);
        g.addColorStop(0, 'rgba(127,216,255,0)');
        g.addColorStop(1, `rgba(127,216,255,${0.8 * fade})`);
        ctx.fillStyle = g;
        ctx.fillRect(this.dir > 0 ? -len : 0, -7, len, 14);
        ctx.fillStyle = `rgba(255,255,255,${0.8 * fade})`;
        ctx.fillRect(this.dir > 0 ? -len * 0.7 : 0, -2.5, len * 0.7, 5);
      }
      const r = 13 + Math.sin(this.t * 30) * 1.2;
      const g2 = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.5);
      g2.addColorStop(0, 'rgba(255,255,255,1)');
      g2.addColorStop(0.35, 'rgba(190,240,255,0.95)');
      g2.addColorStop(0.7, 'rgba(60,160,255,0.7)');
      g2.addColorStop(1, 'rgba(42,120,255,0)');
      ctx.fillStyle = g2;
      circlePath(ctx, 0, 0, r * 1.5);
      ctx.fill();
    } else if (this.kind === 'gremlin') {
      // un tout petit Gremlin (le même dessin que celui de Gizmo, en petit)
      ctx.restore();
      Heroes.draw(ctx, 'gizmo', x, this.y + this.h, {
        pose: this.vy < -50 ? 'jump' : 'run', t: this.t + this.dir, ph: this.t * 16, facing: Math.sign(this.vx) || this.dir, scale: 0.55, pw: { gremlin: true },
      });
      return;
    } else if (this.kind === 'feu') {
      // une bulle orange avec une petite flamme dedans
      const r = 11 + Math.sin(this.t * 20) * 0.8;
      const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, r);
      g.addColorStop(0, 'rgba(255,250,200,0.95)');
      g.addColorStop(0.5, 'rgba(255,170,50,0.85)');
      g.addColorStop(1, 'rgba(255,80,30,0.55)');
      ctx.fillStyle = g;
      circlePath(ctx, 0, 0, r);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff6c0';
      ctx.beginPath();
      ctx.moveTo(-3, 4);
      ctx.quadraticCurveTo(-4, -2, 0, -7);
      ctx.quadraticCurveTo(4, -2, 3, 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // la vague : une crête d'eau avec de l'écume, qui roule vers l'avant
      ctx.scale(this.dir, 1);
      const k = Math.min(1, this.t / 0.15) * (this.t > 0.9 ? Math.max(0, 1 - (this.t - 0.9) / 0.2) : 1);
      ctx.scale(1, k);
      ctx.translate(0, this.h / 2);
      const g = ctx.createLinearGradient(0, -this.h, 0, 0);
      g.addColorStop(0, '#7ad8ff');
      g.addColorStop(1, '#2a8ad8');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.quadraticCurveTo(-20, -18, 0, -32);
      ctx.quadraticCurveTo(18, -40, 24, -26);
      ctx.quadraticCurveTo(14, -30, 10, -20);
      ctx.quadraticCurveTo(14, -8, 24, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1a5a9a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        circlePath(ctx, 4 + i * 4, -33 + Math.sin(this.t * 20 + i) * 1.5 + i * 1.5, 3.2 - i * 0.3);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Un ballon de foot blanc avec des pentagones noirs (aussi pour l'écran de choix).
  static football(ctx, r) {
    circlePath(ctx, 0, 0, r);
    Art.paint(ctx, '#ffffff', '#333', 1.2);
    ctx.save();
    circlePath(ctx, 0, 0, r);
    ctx.clip();
    ctx.fillStyle = '#222';
    const pent = (px, py, s) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.lineTo(px + Math.cos(a) * s, py + Math.sin(a) * s);
      }
      ctx.closePath();
      ctx.fill();
    };
    pent(0, 0, r * 0.38);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      pent(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, r * 0.3);
    }
    ctx.restore();
  }
}
