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
  // le super saut sur un champignon qui fait rebondir (badge Super Saut) : accroupie sur son chapeau, elle
  // monte encore bien plus haut (presque 15 cases). Pour les enfants, un peu de tolérance : ↓ lâché moins de
  // squatGrace secondes avant d'arriver sur le chapeau compte encore, et après avoir lâché ↓, le chapeau la garde
  // squatKeep secondes (le temps d'appuyer sur le saut).
  superSpring: 1800,
  squatGrace: 0.2,
  squatKeep: 0.35,
  // roulade (badge Roulade) : en boule, Malice ne fait plus que rollH de haut (elle passe dans un trou
  // d'une case), elle file à rollSpeed pendant rollTime secondes, puis attend rollWait avant de recommencer
  rollH: 30,
  rollSpeed: 560,
  rollTime: 0.42,
  rollWait: 0.35,
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
// Les lianes du Vieux Chêne (J) : on s'y balance comme à la moustache-grappin (voir Player.updateHanging), avec
// tous les personnages. min : on ne l'attrape pas tout près du plafond (pixels) ; push : la force des flèches
// (en pixels par seconde par seconde, le long de l'arc : elles poussent seulement dans le sens où l'on va ; en
// gardant la flèche, on monte de plus en plus haut, et on ne freine jamais) ; damp : le frottement ; max : le plus
// grand angle (radians) ; jump : la force du saut pour se lancer ; wait : on ne reprend pas tout de suite la liane
// qu'on vient de lâcher (secondes) ; hold : juste après l'avoir attrapée, un saut attend ce petit moment (une
// enfant qui saute deux fois ne la lâche pas aussitôt). La distance où on l'attrape est dans DIFFS (vineReach),
// et le saut pour se lancer garde l'élan du balancement.
const VINE = { min: 40, push: 720, damp: 0.2, max: 1.15, jump: 900, wait: 0.5, hold: 0.14 };

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
  // le hérisson : couverte de piquants comme une pelote d'épingles, elle les enlève un par un
  // (« Aïe ! » à chaque piquant, voir Art.PIN_PULLS)
  // (textY : son texte part plus haut, sinon elle rebondit à travers et il lui cache la figure)
  pins: { dur: 2.25, pose: 0.4, lock: 0.25, vx: 230, vy: -560, hold: 0.35, text: 'Ça pique !', color: '#e8c090', textY: -84 },
  // le sanglier qui fonce : projetée en l'air par-dessus son dos, elle tourne comme une toupie et retombe
  // la tête en bas, les jambes en l'air (et une taupe sort de terre pour voir). Toute l'animation suit
  // le vrai vol : voir SPIN et Player.updateSpin (dur est fixé quand elle s'est remise sur ses pieds).
  spin: { dur: 9, pose: 9, lock: 0.3, vx: 150, vy: -880, hold: 0.2, text: 'Wouaaah !', color: '#ffb08a', textY: -70 },
  // la grenouille sauteuse : elle devient toute verte, et fait « Croa ! » deux fois (accroupie comme une grenouille,
  // la gorge qui se gonfle : voir Art.CROAKS), puis elle reprend sa couleur
  croak: { dur: 1.9, pose: 0.3, lock: 0.25, vx: 230, vy: -500, hold: 0.55, color: '#8ef06a' },
  // le petit nuage grognon : toute trempée par sa pluie (les mains sur la tête), elle s'ébroue comme un chien (les
  // gouttes volent partout : voir Art.SHAKE), puis, encore mouillée, elle avance moins vite un moment (Player.soak)
  shake: { dur: 1.6, pose: 0.4, lock: 0.25, vx: 120, vy: -260, hold: 0.3, text: 'Splash !', color: '#9fdcff' },
  // un grêlon de Bourrasque (le boss de la Vallée des Orages) : toc ! sonnée, des étoiles et des flocons de neige
  // tournent autour de sa tête, et elle grelotte, toute bleue de froid (voir Art.hailStars)
  hail: { dur: 1.7, pose: 0.5, lock: 0.25, vx: 200, vy: -340, hold: 0.45, text: 'Brrr, un grêlon !', color: '#bfe6ff' },
  // n'importe quoi d'autre
  hit: { dur: 0.45, pose: 0.45, lock: 0.25, vx: 260, vy: -430, hold: 0.3 },
};

// Projetée par le sanglier (OUCH.spin) : en retombant, elle se retourne en flip secondes ; la tête en bas, elle
// attend au plus head secondes (au bout de headMin, on peut se relever en bougeant ou en sautant), puis elle
// se remet sur ses pieds d'une petite cabriole (back secondes). Elle ne peut rien faire avant.
const SPIN = { flip: 0.24, head: 1.0, headMin: 0.45, back: 0.24 };

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
    // (où étaient ses pieds la dernière fois qu'elle était par terre : voir fellDown)
    this.groundY = y + this.h;
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
    // accroupie sur un champignon qui fait rebondir (badge Super Saut) : sa case { c, r }, et si elle y est arrivée
    // en écrasant (big) ; downAgo : depuis combien de temps ↓ n'est plus appuyé (voir springTile)
    this.squatM = null;
    this.downAgo = 9;
    // la roulade : en boule (ball), le temps qu'il reste à rouler (roll), dans quel sens (rollDir),
    // l'attente avant la suivante (rollWait), et comment elle tourne sur elle-même (rollA)
    this.standH = this.h;
    this.ball = false;
    this.roll = 0;
    this.rollDir = 1;
    this.rollWait = 0;
    this.rollA = 0;
    // une roulade demandée juste avant d'atterrir (comme jumpBuf pour le saut)
    this.rollBuf = 0;
    this.rollBufDir = 1;
    this.grap = null;
    this.target = null;
    this.boostT = 0;
    // la liane qu'elle vient de lâcher (elle ne la reprend pas avant vineWait secondes : voir VINE)
    this.vineLast = null;
    this.vineWait = 0;
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
    // la Crue : trempée par la pluie d'un petit nuage grognon, elle avance moins vite (soak : le temps qu'il reste ;
    // dripT : le prochain « flic » de ses pas mouillés)
    this.soak = 0;
    this.dripT = 0;
    // emportée par quelque chose qui la déplace lui-même (la toupie de Bourrasque) : { move(p, dt) }, voir update
    this.carry = null;
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
        w.spawn({ type: 'dot', x: this.cx + rand(-12, 12), y: this.y + this.h - rand(0, 30), vy: 60, g: 600, life: 0.8, size: rand(2.5, 4), color: w.sink.drip });
      }
      return;
    }
    if (this.won) {
      this.dropPuff();
      if (this.ball && this.roomToStand()) this.standUp();
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
    if (this.soak > 0) this.updateSoak(dt);
    if (this.star > 0) {
      this.star -= dt;
      this.sparkT -= dt;
      if (this.sparkT <= 0) {
        this.sparkT = 0.05;
        w.spawn({ type: 'spark', x: this.cx + rand(-18, 18), y: this.y + rand(0, this.h), vy: -30, life: 0.5, size: rand(3, 6), color: `hsl(${randInt(0, 360)},100%,70%)` });
      }
      if (this.star <= 0) w.game.onStarEnd();
    }
    // emportée par quelque chose (la toupie de Bourrasque, voir js/boss/bourrasque.js) : c'est lui qui la déplace
    // (carry.move), et elle ne fait rien d'autre tant qu'il ne la lâche pas (carry = null) ; rien ne la touche
    // (voir World.interactions)
    if (this.carry) {
      this.carry.move(this, dt);
      return;
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
    // (depuis combien de temps ↓ n'est plus appuyé : voir springTile)
    this.downAgo = I.held.down ? 0 : this.downAgo + dt;
    const game = w.game;
    const badgeSaut = game.hasBadge('saut');
    const badgeGrappin = game.hasBadge('grappin');
    const badgeRoulade = game.hasBadge('roulade');

    // ---- Moustache-grappin : accrochée à un anneau (ou à une liane du Vieux Chêne) ----
    if (this.vineWait > 0) this.vineWait -= dt;
    this.target = badgeGrappin && (!this.grap || this.grap.phase === 'swing') ? this.findAnchor(this.grap && this.grap.anchor) : null;
    if (this.grap && (this.grap.phase === 'pull' || this.grap.phase === 'swing')) {
      this.updateHanging(dt);
      this.checkPuddle();
      if (w.inLava(this) && !this.lavaProof() && !w.choco) this.die('lava');
      return;
    }
    if (I.pressed.grapple && badgeGrappin && !this.pound && !this.ball && this.hurtT <= 0) this.startGrapple();
    // la bave d'escargot sous les pieds : ça glisse ! (pas sur un nénuphar)
    this.slick = this.onGround && !this.platform && !this.swim && w.slimeUnder(this);
    const pow = this.pow;
    if (this.pw.poseT > 0) this.pw.poseT -= dt;
    if (pow.update) pow.update(this, dt, I);

    if (this.platform) {
      // (la plateforme ne l'emporte jamais dans un mur : contre le mur, elle glisse sous ses pieds ; ni dans un
      // plafond : si elle monte trop haut, Malice la lâche et elle passe sous ses pieds, voir checkPlatforms)
      const ox = this.x;
      const oy = this.y;
      this.x += this.platform.dx;
      if (this.platform.dx && w.boxSolid(this.x, this.y, this.w, this.h)) this.x = ox;
      this.y = this.platform.y - this.h;
      if (this.y < oy && w.boxSolid(this.x, this.y, this.w, this.h)) {
        this.y = oy;
        this.platform = null;
        this.onGround = false;
      }
    }

    let dir = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0);
    // (projetée par un sanglier, elle ne fait rien tant qu'elle n'est pas sur ses pieds : voir updateSpin)
    const tumbling = this.tumbling();
    if (this.hurtT > 0 || tumbling) dir = 0;

    // ---- La roulade (badge Roulade) : ↓ en tenant ← ou → ----
    // (sur tablette : le pouce qui glisse de ▶ jusqu'à ▼ ; à la manette : bas et avant ; voir input.js)
    // À l'arrêt, ↓ accroupit toujours (le super saut) ; en l'air, ↓ écrase toujours. (Accroupie sur un champignon
    // qui fait rebondir, pas de roulade : elle prépare son super saut, voir springTile.)
    if (this.rollWait > 0) this.rollWait -= dt;
    if (I.pressed.roll) {
      this.rollBuf = PHYS.buffer;
      this.rollBufDir = I.rollDir;
    } else if (this.rollBuf > 0) {
      this.rollBuf -= dt;
    }
    if (this.rollBuf > 0 && badgeRoulade && this.onGround && !this.ball && this.rollWait <= 0 && this.hurtT <= 0 &&
      !this.pound && !this.puff && !this.grap && !this.inChoco && !this.swim && !this.squatM && this.startRoll(this.rollBufDir)) this.rollBuf = 0;
    if (this.ball) this.updateRoll(dt);

    // ---- S'accroupir (et préparer le super saut) ----
    const wantCrouch = this.onGround && I.held.down && !this.pound && !this.ball && !tumbling;
    if (wantCrouch) {
      this.crouchT += dt;
      if (badgeSaut && this.crouchT - dt < PHYS.crouchCharge && this.crouchT >= PHYS.crouchCharge) Sound.sfx.charge();
    } else {
      if (this.crouch && badgeSaut && this.crouchT >= PHYS.crouchCharge) this.superT = 0.3;
      // (accroupie sur un champignon, c'est chargé tout de suite : même ↓ lâché très vite, le chapeau la garde un
      // petit moment, le temps de sauter)
      if (this.crouch && this.squatM) this.superT = PHYS.squatKeep;
      this.crouchT = 0;
    }
    this.crouch = wantCrouch;
    if (this.superT > 0) this.superT -= dt;
    const charged = badgeSaut && ((this.crouch && this.crouchT >= PHYS.crouchCharge) || this.superT > 0 || !!this.squatM);
    if (charged && Math.random() < dt * (this.squatM ? 45 : 25)) {
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
    // toute trempée (la pluie d'un petit nuage grognon), elle avance moins vite
    if (this.soak > 0) top *= w.diff.soakSlow;

    if (this.pound) {
      this.vx = 0;
    } else if (this.ball && this.hurtT <= 0) {
      // en boule, elle file tout droit (voir updateRoll)
      this.vx = this.rollDir * PHYS.rollSpeed;
      this.facing = this.rollDir;
    } else if (tumbling && !this.onGround) {
      // projetée par le sanglier : elle garde son élan jusqu'à retomber
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
    // en boule, on saute en se relevant (s'il y a la place au-dessus)
    if (this.ball && this.jumpBuf > 0 && this.coyote > 0 && this.roomToStand()) this.standUp();
    if (this.jumpBuf > 0 && this.coyote > 0 && !this.pound && !this.puff && !this.ball && !tumbling) {
      this.jumpBuf = 0;
      this.coyote = 0;
      this.onGround = false;
      this.platform = null;
      // accroupie sur un champignon qui fait rebondir (voir springTile) : c'est chargé, son chapeau la lance
      const squat = this.squatM;
      this.squatM = null;
      if (charged) {
        // SUPER SAUT ! (sur un champignon : un super saut encore bien plus haut, mais jamais plus haut que le
        // haut du niveau)
        this.vy = squat ? -Math.min(PHYS.superSpring, Math.sqrt(2 * PHYS.gravity * Math.max(0, this.y - 10))) : -PHYS.superJump;
        if (squat) w.springAt(squat.c, squat.r, true);
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
    } else if (I.pressed.jump && !this.onGround && !this.pound && !this.puff && !tumbling && pow.airJump && pow.airJump(this)) {
      // double saut, battement d'ailes, saut de mur…
      this.jumpBuf = 0;
    }
    if (this.jumping && !I.held.jump && this.vy < -PHYS.jumpCut) this.vy = -PHYS.jumpCut;
    if (this.vy >= 0) this.jumping = false;

    // écrasement (bas en l'air) ; avec le pissenlit, bas le lâche
    if (I.pressed.down && this.puff) {
      this.dropPuff();
    } else if (I.pressed.down && !this.onGround && !this.pound && !tumbling && (!this.ball || this.roomToStand()) &&
      !(I.pressed.roll && badgeRoulade && this.nearGround())) {
      // (en boule, elle se relève pour écraser ; tout près du sol, ↓ en marchant, c'est la roulade
      // qu'on voulait : elle partira en atterrissant)
      this.standUp();
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
      if (pow.fall && !this.pound && !tumbling) pow.fall(this, dt);
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
    // le bocal à éclairs (badge) : relancer un éclair au chocolat attrapé (voir Eclair.catches)
    if (I.pressed.bocal && game.hasBadge('bocal')) this.throwIt('eclair');

    this.prevBottom = this.y + this.h;
    const wasGround = this.onGround;
    const fallSpeed = this.vy;
    // le vent pousse Malice (montagne des nuages), mais pas quand elle reste sagement immobile par terre
    const push = this.onGround && !dir ? 0 : w.windPush(this);
    this.vx += push;
    const pounded = this.pound === 2;
    const res = w.moveBody(this, dt, this.pound === 2 ? (tiles) => w.poundTiles(this, tiles) : null);
    if (!res.wall) this.vx -= push;
    if (res.wall && this.ball) this.rollBump(res.wall);
    if (res.landed) this.platform = null;
    if (res.ceil) {
      w.headBump(this, res.ceil);
      if (pow.ceil) pow.ceil(this);
    }
    if (!res.landed) this.checkPlatforms();
    // on lâche le pissenlit en atterrissant
    if (this.puff && this.onGround) this.dropPuff();
    if (res.landed) this.springTile();
    else this.squatM = null;
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
    if (this.onGround && !wasGround && w.def.grimpe && this.y + this.h > this.groundY + 4 * TILE) this.fellDown();
    if (this.onGround) this.groundY = this.y + this.h;

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
    if (w.vines.length) this.catchVine();
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
    // (l'eau qui monte, dans la Crue, ne la colle jamais à un plafond : sous une dalle, elle nage juste dessous)
    let ny = depth - this.h;
    while (ny < this.y && w.boxSolid(this.x, ny, this.w, this.h)) ny = Math.min(this.y, (Math.floor(ny / TILE) + 1) * TILE);
    if (this.y + this.h >= ny + this.h && this.vy >= 0) {
      this.y = ny;
      this.vy = 0;
      this.pound = 0;
      if (!this.onGround) this.land = 0.12;
      this.onGround = true;
      // (ses pieds, là où elle nage : c'est « son sol » tant qu'elle nage, pour la Crue, les fleurs, les nuages…)
      this.groundY = this.y + this.h;
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
    // la Crue : l'eau redescend sous l'endroit où elle va ressortir (et attend un peu avant de remonter)
    if (w.flood) w.flood.dived(this.safeSpot());
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
    // (l'eau de la Crue est déjà redescendue sous cet endroit : elle ne ressort jamais sous l'eau)
    if (w.flood) w.flood.poppedOut(s);
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
    // (pas sur un bloc magique du Lutin ni sur un bloc lutin : ils disparaissent, ou sont perchés au-dessus de l'eau ;
    // ni sur un paratonnerre, qui grésille de temps en temps, ni sur un bouchon en chocolat, qui fond)
    if ((isSolidCh(ch) || isLedgeCh(ch)) && ch !== 'u' && ch !== 'z' && ch !== PLUG && !LUTIN_BLOCKS.includes(ch)) this.safe = { x: (c + 0.5) * TILE, y: r * TILE, pad: null };
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

  // Toute trempée (la pluie d'un petit nuage grognon) : des gouttes tombent d'elle, et ses pas font « flic, floc ».
  // (elle avance moins vite : voir soakSlow dans DIFFS)
  updateSoak(dt) {
    const w = this.world;
    this.soak -= dt;
    if (this.soak <= 0) {
      this.soak = 0;
      return;
    }
    if (Math.random() < dt * 10) {
      w.spawn({ type: 'dot', x: this.cx + rand(-12, 12), y: this.y + rand(8, this.h - 10), vx: rand(-15, 15), vy: rand(30, 90), g: 900, life: 0.45, size: rand(1.8, 2.8), color: '#8fd8ff' });
    }
    this.dripT -= dt * (this.onGround ? Math.abs(this.vx) / 120 : 0);
    if (this.dripT <= 0) {
      this.dripT = 1;
      Sound.sfx.squish();
      for (let i = 0; i < 4; i++) {
        w.spawn({ type: 'dot', x: this.cx + rand(-10, 10), y: this.y + this.h - 2, vx: rand(-70, 70), vy: rand(-150, -60), g: 1000, life: 0.35, size: rand(1.6, 2.6), color: i % 2 ? '#bfeaff' : '#ffffff' });
      }
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
    if (hit < 0) {
      this.squatM = null;
      return;
    }
    // Avec le badge Super Saut, ↓ appuyé (même en arrivant d'un écrasement) : elle s'accroupit sur le chapeau,
    // qui s'enfonce sous ses pieds, sans rebondir : c'est chargé (des étincelles) ; un saut la lance (voir le saut,
    // dans update). Après avoir lâché ↓, le chapeau la garde encore un petit moment (superT) : le temps d'appuyer
    // sur le saut. (Et ↓ lâché juste avant d'arriver compte encore : PHYS.squatGrace.)
    const keep = Input.held.down || this.downAgo < PHYS.squatGrace || (this.squatM && this.superT > 0);
    if (w.game.hasBadge('saut') && !this.ball && this.hurtT <= 0 && !this.tumbling() && keep) {
      if (!this.squatM) this.squatFx(hit, r);
      if (!Input.held.down && this.superT <= 0) this.superT = PHYS.squatKeep;
      // (arrivée en écrasant : si elle ne saute pas, elle fera le grand rebond de l'écrasement)
      this.squatM = { c: hit, r, big: this.squatM ? this.squatM.big : this.pound === 2 };
      this.pound = 0;
      // (elle ne glisse pas : sur une guimauve au-dessus du chocolat, elle tomberait)
      this.vx = 0;
      w.springs.set(hit + ',' + r, 0.08);
      return;
    }
    const big = this.pound === 2 || !!(this.squatM && this.squatM.big);
    this.squatM = null;
    // (jamais plus haut que le haut du niveau : elle sortirait de l'écran. En pratique, seul le rebond
    // après un écrasement est assez fort pour être limité ; le rebond simple et le saut gardé ne changent pas.)
    const room = Math.max(0, this.y - 10);
    this.vy = -Math.min(big ? PHYS.bigBounce : Input.held.jump ? PHYS.springHeld : PHYS.spring, Math.sqrt(2 * PHYS.gravity * room));
    this.onGround = false;
    this.platform = null;
    this.jumping = false;
    this.pound = 0;
    this.coyote = 0;
    w.springAt(hit, r, big);
  }

  // Elle s'accroupit sur un champignon (badge Super Saut) : bwoump, le chapeau s'écrase, et une gerbe d'étincelles
  // montre que c'est chargé (il n'y a plus qu'à sauter).
  squatFx(c, r) {
    const w = this.world;
    Sound.sfx.squish();
    Sound.sfx.charge();
    const y = r * TILE;
    w.spawn({ type: 'ring', x: this.cx, y, life: 0.35, size: 54, color: 'rgba(127,240,255,0.9)' });
    for (let i = 0; i < 12; i++) {
      w.spawn({ type: 'spark', x: this.cx + rand(-22, 22), y: y - rand(0, 6), vx: rand(-90, 90), vy: rand(-220, -60), life: 0.55, size: rand(3, 6), color: i % 2 ? '#7ff0ff' : '#ffffff' });
    }
  }

  // Dans la rivière de chocolat (ou la boue du marais) : on ne se brûle pas, mais on s'enfonce. Vite, il faut sauter !
  sinkInChoco(dt) {
    const w = this.world;
    if (!this.inChoco) {
      this.inChoco = true;
      this.sinkT = 0;
      this.blubT = 0.3;
      Sound.sfx.chocoPlop();
      for (let i = 0; i < 10; i++) {
        w.spawn({ type: 'dot', x: this.cx + rand(-16, 16), y: this.y + this.h - 8, vx: rand(-160, 160), vy: rand(-320, -120), g: 1200, life: 0.6, size: rand(3, 6), color: w.sink.splash });
      }
    }
    this.sinkT += dt;
    this.blubT -= dt;
    if (this.blubT <= 0) {
      this.blubT = 0.4;
      Sound.sfx.chocoBlub();
      w.spawn({ type: 'ring', x: this.cx + rand(-14, 14), y: this.y + this.h - 6, life: 0.4, size: 14, color: w.sink.ring });
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
    // (en boule, sous un plafond bas, on ne l'attrape pas)
    if (this.ball && !this.roomToStand()) return;
    this.standUp();
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

  // ---------- La roulade (badge Roulade) ----------
  // Malice se met en boule : elle ne fait plus que PHYS.rollH de haut (elle passe dans un trou d'une case),
  // et elle file droit devant. En boule, les ennemis ne lui font rien (elle passe dessous ou à travers,
  // sans les renverser) ; la lave, les ronces, l'eau et le reste font mal comme d'habitude.
  // Renvoie false si elle ne peut pas rouler : le nez contre un mur, ou au bord d'un trou (alors ↓ accroupit,
  // comme avant : c'est là qu'on prépare le super saut).
  startRoll(dir) {
    const w = this.world;
    if (w.boxSolid(this.x + dir * 6, this.y + this.h - PHYS.rollH, this.w, PHYS.rollH)) return false;
    if (!this.floorAt(this.x + dir * 6)) return false;
    this.ball = true;
    this.roll = PHYS.rollTime;
    this.rollDir = dir;
    this.facing = dir;
    this.rollA = 0;
    this.y += this.h - PHYS.rollH;
    this.h = PHYS.rollH;
    this.prevBottom = this.y + this.h;
    this.crouch = false;
    this.crouchT = 0;
    this.superT = 0;
    this.jumping = false;
    Sound.sfx.roll();
    w.spawn({ type: 'ring', x: this.cx - dir * 8, y: this.y + this.h, life: 0.3, size: 40, color: 'rgba(255,255,255,0.8)' });
    for (let i = 0; i < 8; i++) {
      w.spawn({ type: 'dust', x: this.cx - dir * 10, y: this.y + this.h, vx: -dir * rand(60, 200), vy: rand(-90, -10), life: 0.4, size: rand(4, 8) });
    }
    return true;
  }

  // En boule : elle roule tant que la roulade dure, puis se relève dès qu'elle a la place.
  // Sous un plafond bas (ou au milieu d'un ennemi), elle continue de rouler jusqu'à pouvoir se relever.
  updateRoll(dt) {
    const w = this.world;
    // (dans le chocolat, on ne roule pas : on s'y enfonce, comme d'habitude)
    if (this.inChoco && this.roomToStand()) {
      this.standUp();
      return;
    }
    this.roll -= dt;
    this.rollA += this.rollDir * dt * 22;
    if (this.onGround && Math.random() < dt * 30) {
      w.spawn({ type: 'dust', x: this.cx - this.rollDir * 12, y: this.y + this.h, vx: -this.rollDir * rand(30, 120), vy: rand(-60, -10), life: 0.35, size: rand(3, 6) });
    }
    if (Math.random() < dt * 9) {
      w.spawn({ type: 'spark', x: this.cx + rand(-14, 14), y: this.y + rand(-4, this.h), vx: -this.rollDir * rand(20, 80), vy: rand(-80, -20), life: 0.45, size: rand(3, 5), color: choose(['#fff27a', '#ffffff', '#ff9fd8']) });
    }
    if (this.roll <= 0 && this.roomToStand() && !this.enemyOver()) {
      this.standUp();
      return;
    }
    // la boule ne quitte jamais le sol toute seule : au bord d'un trou (ou d'une marche), elle s'arrête
    // et se relève ; sous un plafond bas, elle repart dans l'autre sens
    if (this.onGround && this.hurtT <= 0 && !this.floorAt(this.x + this.rollDir * PHYS.rollSpeed * dt)) {
      if (this.roomToStand()) {
        this.standUp();
        this.vx = 0;
      } else {
        this.rollDir = -this.rollDir;
      }
    }
  }

  // Y a-t-il quelque chose sous ses pieds si elle était en x (le sol, une planche, ou sa plateforme) ?
  floorAt(x) {
    const w = this.world;
    const r = Math.floor((this.y + this.h + 2) / TILE);
    for (let c = Math.floor((x + 0.01) / TILE); c <= Math.floor((x + this.w - 0.01) / TILE); c++) {
      const ch = w.tileAt(c, r);
      if (isSolidCh(ch) || isLedgeCh(ch)) return true;
    }
    const pl = this.platform;
    return !!pl && x + this.w > pl.x + 3 && x < pl.x + pl.w - 3;
  }

  // Elle tombe, et le sol est tout près (ou elle est déjà dessus).
  nearGround() {
    const feet = this.y + this.h;
    return this.vy >= 0 && this.world.surfaceBelow(this.cx, feet - 1) - feet < 36;
  }

  // Contre un mur, en boule : bonk ! Elle se relève si elle peut, sinon elle repart dans l'autre sens
  // (on ne reste jamais coincée dans un passage bas).
  rollBump(side) {
    Sound.sfx.bump();
    this.world.spawn({ type: 'ring', x: side > 0 ? this.x + this.w : this.x, y: this.cy, life: 0.25, size: 26, color: 'rgba(255,255,255,0.8)' });
    if (this.roomToStand() && !this.enemyOver()) {
      this.standUp();
      this.vx = 0;
    } else {
      this.rollDir = -side;
      this.roll = Math.max(this.roll, 0.1);
    }
  }

  // Y a-t-il la place de se relever (rien de solide au-dessus de la boule) ?
  roomToStand() {
    return !this.world.boxSolid(this.x, this.y + this.h - this.standH, this.w, this.standH);
  }

  // Un ennemi qui ferait mal juste là (ou tout à côté), si elle se relevait ?
  enemyOver() {
    const b = { x: this.x - 24, y: this.y + this.h - this.standH + 4, w: this.w + 48, h: this.standH - 4 };
    return this.world.enemies.some((e) => !e.dying && !e.dead && e.harmful() && overlap(b, e));
  }

  // Elle n'est plus en boule (les pieds restent où ils sont).
  unball() {
    this.y -= this.standH - this.h;
    this.h = this.standH;
    this.prevBottom = this.y + this.h;
    this.ball = false;
    this.roll = 0;
  }

  // Elle se relève, et repart à sa vitesse de marche.
  standUp() {
    if (!this.ball) return;
    this.unball();
    this.rollWait = PHYS.rollWait;
    if (this.hurtT <= 0) this.vx = this.rollDir * Math.min(Math.abs(this.vx), PHYS.run);
    for (let i = 0; i < 4; i++) {
      this.world.spawn({ type: 'dust', x: this.cx + rand(-10, 10), y: this.y + this.h, vx: rand(-60, 60), vy: rand(-40, -10), life: 0.3, size: rand(3, 6) });
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
    this.grap = { phase: 'shoot', anchor: a, t: 0, tipX: m.x, tipY: m.y, ang: 0, angV: 0, len: GRAPPLE.len, hy: 14, stuckT: 0 };
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
    // balancement (à une liane : les flèches ne poussent que dans le sens où l'on va, voir VINE)
    const vine = g.vine;
    const dir = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0);
    if (dir) this.facing = dir;
    const push = !vine ? dir * 6 : dir && (Math.sign(g.angV) === dir || Math.abs(g.angV) < 0.6) ? (dir * VINE.push) / g.len : 0;
    g.angV += (-(PHYS.gravity / g.len) * 0.9 * Math.sin(g.ang) + push * Math.cos(g.ang) - g.angV * (vine ? VINE.damp : 0.35)) * dt;
    const prevAng = g.ang;
    const max = vine ? VINE.max : 1.35;
    g.ang = clamp(g.ang + g.angV * dt, -max, max);
    if (Math.abs(g.ang) >= max) g.angV *= -0.2;
    // (g.hy : où elle est accrochée, depuis le haut de Malice : la moustache, ou les mains levées)
    const nx = a.x + g.len * Math.sin(g.ang) - this.w / 2;
    const ny = a.y + g.len * Math.cos(g.ang) - g.hy;
    if (w.boxSolid(nx, ny, this.w, this.h)) {
      g.ang = prevAng;
      g.angV *= -0.3;
    } else {
      this.x = nx;
      this.y = ny;
    }
    this.vx = g.len * g.angV * Math.cos(g.ang);
    this.vy = -g.len * g.angV * Math.sin(g.ang);
    if (vine) {
      // la liane suit Malice ; vlouf ! quand elle passe tout en bas à toute vitesse
      if (Math.sign(prevAng) !== Math.sign(g.ang) && Math.abs(g.angV) > 2.2) Sound.sfx.vineSwoosh();
      if (I.pressed.jump) g.jumpAsked = true;
      if (g.jumpAsked && g.t >= VINE.hold) this.releaseGrapple(true);
      else if (I.pressed.down) this.releaseGrapple(false);
      // (avec la moustache-grappin, on peut aussi s'accrocher à un anneau, s'il y en a un)
      else if (I.pressed.grapple && w.game.hasBadge('grappin') && this.findAnchor(null)) this.startGrapple();
      return;
    }
    if (I.pressed.jump) this.releaseGrapple(true);
    else if (I.pressed.down) this.releaseGrapple(false);
    else if (I.pressed.grapple) this.startGrapple();
  }

  releaseGrapple(jump) {
    const vine = this.grap && this.grap.vine;
    this.grap = null;
    this.onGround = false;
    this.coyote = 0;
    this.jumping = false;
    if (jump) {
      const dir = (Input.held.right ? 1 : 0) - (Input.held.left ? 1 : 0);
      if (vine) {
        // de la liane, on saute presque comme du sol, en gardant l'élan du balancement
        this.vy = Math.min(this.vy, 0) * 0.5 - VINE.jump;
        this.vx = clamp(this.vx + dir * 90, -520, 520);
      } else {
        this.vy = Math.min(this.vy, 0) * 0.5 - 760;
        this.vx = clamp(this.vx + dir * 80, -470, 470);
      }
      Sound.sfx.jump();
    }
    this.vy = Math.max(this.vy, -1150);
    this.boostT = 0.8;
    if (vine) {
      this.vineLast = vine;
      this.vineWait = VINE.wait;
      vine.letGo(this, jump);
    }
  }

  // Dans un niveau où l'on grimpe, elle vient de retomber à l'étage du dessous : les sangliers de cet étage la
  // laissent se relever et repartir (2,5 secondes, comme à la reprise d'un drapeau), au lieu de foncer sur elle.
  fellDown() {
    const feet = this.y + this.h;
    for (const e of this.world.enemies) {
      if (e instanceof Boar && !e.dying && Math.abs(e.y + e.h - feet) < 2 * TILE) {
        e.calm = Math.max(e.calm, 2.5);
        if (e.state === 'scratch') e.state = 'walk';
      }
    }
  }

  // ---------- Les lianes (Dans le Vieux Chêne) ----------
  // Où elle tient la liane : ses deux poings, juste au-dessus de sa tête (HERO_HAT), depuis le haut de Malice.
  vineGrip() {
    const hy = (HERO_HAT[this.hero] || HERO_HAT.malice)[1];
    return this.h + hy + 6;
  }

  // En l'air, elle attrape une liane en la touchant (des mains, de la tête ou du corps, et même un peu à côté :
  // voir DIFFS.vineReach). Pas en boule, ni en écrasant, ni projetée, ni juste après avoir eu mal ; et pas la
  // liane qu'elle vient de lâcher (pendant VINE.wait secondes).
  catchVine() {
    const w = this.world;
    if (this.onGround || this.dead || this.won || this.ball || this.pound || this.hurtT > 0 || this.swim || this.tumbling()) return;
    if (this.grap && (this.grap.phase === 'pull' || this.grap.phase === 'swing')) return;
    const gy = this.vineGrip();
    for (const v of w.vines) {
      if (v === this.vineLast && this.vineWait > 0) continue;
      const len = v.catchAt(this, gy, w.diff.vineReach);
      if (len > 0) {
        this.grabVine(v, len, gy);
        return;
      }
    }
  }

  grabVine(v, len, gy) {
    this.dropPuff();
    // la charge, la bulle, le nuage, la voiture… s'arrêtent : elle a les mains prises
    this.stopPower();
    this.pound = 0;
    this.superSpin = 0;
    this.jumping = false;
    this.crouch = false;
    this.platform = null;
    this.onGround = false;
    // elle garde son élan : la vitesse le long de l'arc du balancement
    const ang = clamp(Math.atan2(this.cx - v.x, this.y + gy - v.y), -VINE.max, VINE.max);
    const angV = clamp((this.vx * Math.cos(ang) - this.vy * Math.sin(ang)) / len, -4, 4);
    this.grap = { phase: 'swing', vine: v, anchor: v, t: 0, len, hy: gy, ang, angV, tipX: v.x, tipY: v.y };
    v.grabbed(this);
  }

  checkPlatforms() {
    if (this.vy < 0) return;
    for (const p of this.world.platforms) {
      // (un nénuphar qui a coulé, on passe à travers : on tombe dans l'eau)
      if (p.sunk) continue;
      if (this.x + this.w > p.x + 3 && this.x < p.x + p.w - 3) {
        const bottom = this.y + this.h;
        // (pas si elle s'y retrouverait la tête dans un plafond)
        if (bottom >= p.y && this.prevBottom <= p.y + 8 && !(bottom > p.y && this.world.boxSolid(this.x, p.y - this.h, this.w, this.h))) {
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

  // kind : 'caramel', 'chips', ou 'eclair' (un éclair au chocolat du bocal : il se compte dans game.bocal)
  throwIt(kind) {
    const g = this.world.game;
    // (pas en tenant un pissenlit géant : elle a les mains prises)
    if (this.throwT > 0 || this.pound || this.hurtT > 0 || this.puff) return;
    const stock = kind === 'eclair' ? 'bocal' : kind;
    if (g[stock] <= 0) {
      if (kind === 'eclair') Sound.sfx.bocalEmpty();
      return;
    }
    g[stock]--;
    this.throwT = 0.28;
    this.throwAnim = 0.22;
    this.world.projectiles.push(new Throwable(this.world, kind, this.cx + this.facing * 14, this.y + 24, this.facing, this.vx));
    if (kind === 'eclair') {
      g.bocalPop = 1;
      Sound.sfx.bocalThrow();
    } else {
      Sound.sfx.throwIt();
    }
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
    if (O.text) w.popText(this.cx, this.y + (O.textY || -22), O.text, O.color, 20);
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
    // en boule : elle se relèvera dès qu'elle aura la place (sinon elle roule, loin de ce qui l'a touchée)
    if (this.ball) {
      this.roll = 0;
      this.rollDir = d;
    }
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

  // ---------- Projetée par un sanglier (OUCH.spin) ----------
  // Elle n'est pas encore retombée sur ses pieds : elle ne peut ni bouger, ni sauter, ni rien faire.
  tumbling() {
    const k = this.ouch;
    return !!k && k.kind === 'spin' && k.phase !== 'done' && !this.dead;
  }

  // Elle monte en tournant comme une toupie (phase 'up'), se retourne en retombant ('flip'), atterrit sur la
  // tête, les jambes en l'air ('head' : une taupe sort de terre pour voir), puis se remet sur ses pieds d'une
  // petite cabriole ('back'). Tout suit le vrai vol : si elle retombe dans la boue, elle s'y enfonce tout de suite
  // à l'endroit (on peut sauter pour en sortir) ; sur un pont ou une cabane, pas de taupe (il n'y a pas de terre).
  // (k.a : de combien elle est retournée, de 0 à 2π ; k.pt : depuis quand elle est dans cette phase)
  updateSpin(k, dt) {
    if (this.dead) return;
    const w = this.world;
    if (!k.phase) {
      k.phase = 'up';
      k.a = 0;
      k.pt = 0;
      // (même si elle sautait : en lâchant le saut, elle ne doit pas retomber plus tôt)
      this.jumping = false;
    }
    k.pt += dt;
    const go = (phase) => {
      k.phase = phase;
      k.pt = 0;
    };
    // dans la boue : finie la toupie, elle s'enfonce (et peut sauter tout de suite pour en sortir)
    if (this.inChoco || this.dive > 0 || this.swim) {
      this.ouch = null;
      this.hurtT = 0;
      if (this.inChoco) w.popText(this.cx, this.y - 10, 'Plof !', '#d8b080', 20);
      return;
    }
    if ((k.phase === 'up' || k.phase === 'flip') && this.onGround && k.t > 0.05) {
      this.landOnHead(k);
      go('head');
    }
    switch (k.phase) {
      case 'up':
        if (this.vy > 0) go('flip');
        break;
      case 'flip':
        k.a = Math.min(Math.PI, k.a + (dt * Math.PI) / SPIN.flip);
        break;
      case 'head': {
        // (si elle n'avait pas fini de se retourner, elle finit tout de suite)
        k.a = approach(k.a, Math.PI, (dt * Math.PI) / 0.08);
        const wants = Input.held.left || Input.held.right || Input.held.jump;
        if (k.pt >= SPIN.head || (k.pt >= SPIN.headMin && wants) || !this.onGround) {
          go('back');
          // hop ! une petite cabriole pour se remettre debout
          this.vy = -330;
          this.onGround = false;
          this.platform = null;
          Sound.sfx.spinBack();
        }
        break;
      }
      case 'back':
        k.a = Math.min(Math.PI * 2, k.a + (dt * Math.PI) / SPIN.back);
        if (k.pt >= SPIN.back) {
          k.phase = 'done';
          k.a = 0;
          k.dur = k.t;
        }
        break;
      default: break;
    }
    if (k.phase !== 'done') {
      this.hurtT = Math.max(this.hurtT, 0.05);
      // (elle ne peut plus avoir mal tant qu'elle n'est pas debout, et encore un petit moment après)
      this.invuln = Math.max(this.invuln, 0.6);
    }
  }

  // Boum, sur la tête ! Sur la terre (pas sur un pont, une cabane ou un bloc), une taupe sort voir ce qui se passe.
  landOnHead(k) {
    const w = this.world;
    this.vx = 0;
    w.shake(4);
    Sound.sfx.spinLand();
    for (let i = 0; i < 8; i++) {
      w.spawn({ type: 'dust', x: this.cx + rand(-14, 14), y: this.y + this.h, vx: rand(-120, 120), vy: rand(-90, -20), life: 0.45, size: rand(4, 8) });
    }
    if (this.platform) return;
    const r = Math.round((this.y + this.h) / TILE);
    // la taupe sort à côté de sa tête, du côté où il y a de la place (de la terre, avec rien dessus, sur toute la
    // largeur de la taupe et de son trou : elle ne dépasse jamais au-dessus de la boue ou d'un trou)
    const earth = (x) => {
      const c = Math.floor(x / TILE);
      return w.tileAt(c, r) === '#' && w.tileAt(c, r - 1) === '.' && w.tileAt(c, r + 1) !== '~';
    };
    if (!earth(this.cx)) return;
    for (const side of [-this.facing, this.facing]) {
      const x = this.cx + side * 52;
      if (earth(x - 30) && earth(x + 30)) {
        w.gags.push(new PeekMole(w, x, r * TILE, -side));
        return;
      }
    }
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
      case 'spin':
        this.updateSpin(k, dt);
        break;
      case 'pins':
        // elle enlève les piquants un par un : aïe ! (le piquant s'envole en tournoyant)
        Art.PIN_PULLS.forEach((time, i) => {
          if (!passed(time)) return;
          const [x, y] = Art.pinAt(i, Heroes.headTop(this.hero, { pw: this.pw }));
          const p = at(x, y);
          Sound.sfx.pluck(i);
          // (un « Aïe ! » pour deux piquants, une fois d'un côté, une fois de l'autre : sinon ils s'empilent)
          if (i % 2 === 0) w.popText(this.cx + (i % 4 ? 16 : -16), this.y - 14, 'Aïe !', '#ffd27a', 17);
          w.spawn({ type: 'straw', x: p.x, y: p.y, vx: f * rand(-40, 120), vy: rand(-260, -160), g: 900, life: 0.6, size: 10, color: '#6a4a2e', rot: rand(0, 6), vr: rand(-14, 14) });
        });
        break;
      case 'croak':
        // toute verte, elle coasse deux fois : « Croa ! » (sa gorge se gonfle comme celle d'une grenouille)
        Art.CROAKS.forEach((time, i) => {
          if (!passed(time)) return;
          Sound.sfx.croak(i);
          w.popText(this.cx + (i ? 14 : -10), this.y - 16, 'Croa !', '#8ef06a', 22);
        });
        break;
      case 'shake':
        // toute trempée, elle s'égoutte ; puis elle s'ébroue comme un chien : les gouttes volent tout autour d'elle
        if (passed(Art.SHAKE.t0)) Sound.sfx.shakeOff();
        if (Art.shaking(k)) {
          // (elles partent du bord de son corps, vers l'extérieur)
          if (Math.random() < dt * 50) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const a = side > 0 ? rand(-1.2, 0.2) : rand(Math.PI - 0.2, Math.PI + 1.2);
            w.spawn({ type: 'dot', x: this.cx + side * 14, y: this.y + rand(8, this.h - 16), vx: Math.cos(a) * rand(220, 380), vy: Math.sin(a) * rand(160, 320), g: 1100, life: 0.45, size: rand(2.2, 3.4), color: choose(['#8fd8ff', '#bfeaff', '#ffffff']) });
          }
        } else if (Math.random() < dt * 14) {
          const p = at(rand(-12, 12), rand(-62, -8));
          w.spawn({ type: 'dot', x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(20, 90), g: 900, life: 0.5, size: rand(1.8, 2.8), color: '#8fd8ff' });
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
    // (elle ne touche plus rien : elle peut se relever n'importe où)
    if (this.ball) this.unball();
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
    // (et quand elle coasse, par terre : accroupie comme une grenouille, voir Art.croaking)
    // (et quand elle s'ébroue comme un chien, par terre et à l'arrêt : les jambes écartées, voir Art.shaking ; si elle
    // marche, elle garde sa pose de marche, les gouttes et son corps qui se tortille suffisent)
    const ouching = k && (this.dead || k.t < OUCH[k.kind].pose || (k.kind === 'croak' && this.onGround && Art.croaking(k)) ||
      (k.kind === 'shake' && this.onGround && Math.abs(this.vx) < 40 && Art.shaking(k)));
    if (k) k.shock = k.kind === 'zap' && (this.dead ? this.deathT < 0.5 : this.stunT > 0);
    if (this.dead) pose = k ? 'ouch' : 'hurt';
    else if (this.won) pose = this.onGround ? 'win' : 'jump';
    // (à une liane : les deux bras tendus vers le haut)
    else if (hanging) pose = this.grap.vine ? 'vine' : 'hang';
    else if (this.ball) pose = 'roll';
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
    // sur un pont de corde, il s'enfonce un peu sous ses pieds (voir World.bridgeDip)
    // (et accroupie sur un champignon, elle s'enfonce avec son chapeau : voir springTile)
    const dip = this.onGround && !this.dead ? this.world.bridgeDip(this.cx, Math.round((this.y + this.h) / TILE)) + (this.squatM ? 5 : 0) : 0;
    if (this.squatM && !this.dead) {
      // accroupie sur un champignon : c'est chargé, elle brille (un halo bleu qui palpite)
      const k = 0.5 + 0.5 * Math.sin(this.world.t * 12);
      const gy = this.y + this.h - 10 + dip;
      const glow = ctx.createRadialGradient(this.cx, gy, 4, this.cx, gy, 44 + k * 6);
      glow.addColorStop(0, `rgba(200,255,255,${0.55 + 0.25 * k})`);
      glow.addColorStop(0.5, `rgba(127,240,255,${0.3 + 0.2 * k})`);
      glow.addColorStop(1, 'rgba(127,240,255,0)');
      ctx.fillStyle = glow;
      circlePath(ctx, this.cx, gy, 50 + k * 6);
      ctx.fill();
    }
    if (this.onGround && !this.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ellipsePath(ctx, this.cx, this.y + this.h + 1 + dip, 15, 4);
      ctx.fill();
    }
    let feetY = this.y + this.h + 1 + dip;
    if (this.ball) {
      // en boule : Malice toute pelotonnée (et plus petite) tourne sur elle-même, dans un tourbillon
      const r = this.h / 2;
      const bx = this.cx;
      const by = this.y + r;
      const glow = ctx.createRadialGradient(bx, by, 2, bx, by, r + 4);
      glow.addColorStop(0, 'rgba(255,255,255,0.5)');
      glow.addColorStop(0.7, 'rgba(255,170,215,0.35)');
      glow.addColorStop(1, 'rgba(255,120,190,0)');
      ctx.fillStyle = glow;
      circlePath(ctx, bx, by, r + 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = this.rollA * 0.7 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(bx, by, r + 2, a, a + 1.2);
        ctx.stroke();
      }
      ctx.translate(bx, by);
      ctx.rotate(this.rollA);
      ctx.scale(ROLL_SCALE, ROLL_SCALE);
      ctx.translate(-bx, -by);
      feetY = by + ROLL_CENTER;
    } else if (this.pound === 1) {
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
    // (à une liane, elle tourne autour de ses mains, et ses mains sont sur la liane : voir Vine.draw)
    let rot = 0;
    let gripY = this.y + 14;
    let shift = 0;
    if (hanging) {
      const g = this.grap;
      rot = g.phase === 'swing' ? -g.ang : -Math.atan2(this.cx - g.anchor.x, this.y + 14 - g.anchor.y);
      if (g.vine) {
        gripY = this.y + g.hy;
        shift = -this.facing * (HERO_HAT[this.hero] || HERO_HAT.malice)[0];
      }
    }
    if (this.grap && !this.grap.vine) {
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
      ctx.translate(this.cx, gripY);
      ctx.rotate(rot);
      ctx.translate(-this.cx, -gripY);
    }
    if (shift) ctx.translate(shift, 0);
    if (this.dead && this.cause === 'lava') {
      ctx.globalAlpha = 1;
    }
    const lava = this.dead && this.cause === 'lava';
    const choco = this.dead && this.cause === 'choco';
    if (this.puff) this.puff.drawHeld(ctx);
    Heroes.draw(ctx, this.hero, this.cx, feetY, {
      facing: this.dead ? 1 : this.facing,
      pose,
      t: this.t,
      ph: this.ph,
      sx,
      sy,
      star: this.star > 0,
      lava,
      choco,
      chocoTint: this.world.sink.tint,
      palette: lava ? LAVA_PALETTE : choco ? this.world.sink.palette : null,
      holding: this.holding,
      face: pose === 'idle' ? this.mimic : null,
      ouch: k,
      onHead: this.world.def.sequel && !this.birdGone ? (c) => this.drawHatBird(c, pose) : null,
      pw: this.pw,
    });
    // à une liane : ses deux poings serrés dessus, par-dessus la liane
    if (hanging && this.grap.vine) {
      const gx = this.cx - shift;
      const hand = (this.pw.gremlin ? ['#5fae3e', '#1e4a10'] : HERO_HAND[this.hero]) || HERO_HAND.malice;
      ctx.strokeStyle = '#4f9a3a';
      ctx.lineWidth = 4.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(gx, gripY - 22);
      ctx.lineTo(gx, gripY + 4);
      ctx.stroke();
      for (const dy of [-10, -1]) {
        ellipsePath(ctx, gx, gripY + dy, 5.2, 4.6);
        Art.paint(ctx, hand[0], hand[1], 1.2);
      }
    }
    ctx.restore();
  }
}

// Malice en boule (la roulade) : sa taille, et où est le milieu de la boule au-dessus de ses pieds.
const ROLL_SCALE = 0.56;
const ROLL_CENTER = 28;

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

// Malice toute couverte de boue (le Marais aux Cabanes)
const MUD_PALETTE = Object.assign({}, Art.MALICE, {
  skin: '#7a6a44', skinShade: '#5e5032', shirt: '#86784e', shirtShade: '#6a5e3a',
  overall: '#6a5a36', overallDark: '#4e4226', hair: '#94834e', hairDark: '#6e6038',
  hat: '#76643c', hatDark: '#56482a', hatLight: '#988452',
});

// La rivière de chocolat (le Monde des Bonbons) et la boue (le Marais aux Cabanes) : on s'y enfonce pareil, seules
// les couleurs changent (World.sink). drip : ce qui coule d'elle quand elle s'est enfoncée ; splash : les
// éclaboussures ; ring : les bulles ; tint : la teinte des personnages enfoncés (voir Heroes) ; palette : Malice.
const SINK = {
  choco: { drip: '#6a3418', splash: '#7a4224', ring: 'rgba(160,95,55,0.9)', tint: '#6a3a1c', palette: CHOCO_PALETTE },
  mud: { drip: '#4e4428', splash: '#5a5030', ring: 'rgba(120,110,70,0.9)', tint: '#4e4428', palette: MUD_PALETTE },
};

// ======================= PROJECTILES DE MALICE =======================
// Comment part chaque chose qu'elle lance : vitesse (vx, vy), pesanteur (g), taille (size). L'éclair au chocolat
// du bocal file un peu plus vite et plus loin que les chips, presque à plat (il ne passe pas au-dessus d'une
// grenouille), et retombe par terre à environ 7 cases quand on le lance debout.
const THROWS = {
  caramel: { vx: 440, vy: -280, g: 1300, size: 18 },
  chips: { vx: 520, vy: -160, g: 650, size: 18 },
  eclair: { vx: 560, vy: -120, g: 520, size: 26 },
};

class Throwable {
  constructor(world, kind, x, y, dir, pvx) {
    const o = THROWS[kind];
    this.world = world;
    this.kind = kind;
    this.w = o.size;
    this.h = o.size;
    this.x = x - o.size / 2;
    this.y = y - o.size / 2;
    this.dir = dir;
    this.vx = dir * o.vx + pvx * 0.3;
    this.vy = o.vy;
    this.g = o.g;
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
      // (un éclair au chocolat qui touche un bouchon en chocolat le fait fondre : voir World.meltPlug)
      const c = Math.floor(cx / TILE);
      const r = Math.floor(cy / TILE);
      if (this.kind === 'eclair' && w.tileAt(c, r) === PLUG) {
        this.dead = true;
        w.meltPlug(c, r);
        return;
      }
      this.splat();
      return;
    }
    if (this.kind === 'eclair') {
      this.zapEnemies();
      return;
    }
    for (const e of w.enemies) {
      // (passThrow : ce que les chips et le caramel traversent, comme les glands et les racines de Pépé Chêne)
      if (e.dying || e.dead || e.passThrow) continue;
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

  // L'éclair au chocolat lancé (le bocal à éclairs) : le premier ennemi qu'il touche est électrisé et renversé
  // (comme sous un éclair de l'orage : voir Eclair), un seul à la fois. Il passe à travers les boss et tout ce qui
  // est à eux (leurs glands, leurs citrouilles, la toupie de Bourrasque…), et ce que les chips traversent : les
  // combats restent comme ils ont été pensés. (On le touche d'un peu plus loin que les chips : un ennemi qu'on vise
  // à peu près est touché.)
  zapEnemies() {
    const w = this.world;
    const box = { x: this.x - 6, y: this.y - 6, w: this.w + 12, h: this.h + 12 };
    for (const e of w.enemies) {
      if (e.dying || e.dead || e.passThrow || e.boss || e instanceof Boss) continue;
      if (!overlap(box, e.shotBox ? e.shotBox() : e)) continue;
      this.dead = true;
      Sound.sfx.bocalZap();
      w.popText(e.cx, e.y - 10, 'Bzzz !', '#fff59a', 24);
      for (let i = 0; i < 10; i++) {
        w.spawn({ type: 'spark', x: e.cx, y: e.cy, vx: rand(-240, 240), vy: rand(-260, -40), g: 600, life: 0.5, size: rand(4, 7), color: i % 2 ? '#fff59a' : '#ffffff' });
      }
      e.kill('zap');
      return;
    }
  }

  splat() {
    const w = this.world;
    this.dead = true;
    if (this.kind === 'eclair') {
      // (il retombe sans rien toucher : quelques étincelles qui s'éteignent, il ne grésille pas par terre)
      Sound.sfx.bocalFizzle();
      for (let i = 0; i < 7; i++) {
        w.spawn({ type: 'spark', x: this.x + this.w / 2, y: this.y + this.h / 2, vx: rand(-160, 160), vy: rand(-200, -40), g: 700, life: 0.4, size: rand(3, 5), color: '#fff59a' });
      }
      return;
    }
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
    else if (this.kind === 'eclair') {
      // l'éclair au chocolat file en tournoyant, tout électrique
      Art.sparks(ctx, cx, cy + 6, 22, Math.floor(this.t * 20), 0.8);
      Art.eclair(ctx, cx, cy, this.dir * this.t * 9, 0.75);
    } else Art.chip(ctx, cx, cy, 1.2, this.t * 14);
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
    // au-dessus de la lave, Malice ne peut pas esquiver : la coccinelle attend qu'elle soit retombée sur le sol
    const lava = w.overLava(p);
    if (this.aimT > 0 && lava) this.aimT = 0;
    if (this.aimT > 0) {
      this.aimT -= dt;
      this.open = Math.min(1, this.open + dt * 5);
      if (Math.abs(dx) > 4) this.dir = Math.sign(dx);
      if (this.aimT <= 0) this.shoot();
    } else {
      this.open = Math.max(0, this.open - dt * 4);
      this.shootT -= dt;
      // dans un niveau où l'on grimpe, on voit les étages du dessus et du dessous : elle ne vise que le sien
      const sameFloor = !w.def.grimpe || Math.abs(p.y + p.h - (this.y + this.h)) < 4 * TILE;
      if (this.shootT <= 0 && w.onScreen(this, -20) && !p.dead && !p.won && Math.abs(dx) < 520 && sameFloor && !lava) {
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

// Hérisson (les Champignons Géants) : il trottine en reniflant. Quand Malice approche, « ! » : il se met
// en boule, tout plein de piquants. En boule, on ne peut plus lui sauter dessus (on se pique !), ni le toucher.
// Au bout d'un moment, il se déroule et renifle autour de lui, tout étonné : c'est le moment de lui sauter
// dessus (pouic !). Le caramel colle ses piquants : il ne peut plus se mettre en boule. Avec les chips, il
// devient trop gros pour s'enrouler. Les pouvoirs qui renversent les ennemis marchent toujours, même en boule,
// et en roulade on passe à travers lui sans se piquer (comme à travers les autres ennemis).
// (w.diff : hogSpeed, hogNear, hogCurl, hogOpen, voir DIFFS dans game.js)
const HOG_CURL = 0.2;

class Hedgehog extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 40, 30);
    this.ouch = 'pins'; // il plante plein de piquants dans Malice (voir OUCH)
    this.state = 'walk';
    // 0 : déroulé, 1 : en boule
    this.curl = 0;
    this.timer = 0;
    // au début (et à la reprise d'un drapeau), il ne se met pas tout de suite en boule
    this.calm = 1;
    this.fatSpeed = 16;
    this.look = { x: -1, y: 0 };
  }

  // En boule pour de vrai : sauter dessus pique.
  prickly() {
    return this.state === 'ball' && this.curl > 0.5 && !this.dying && this.stuck <= 0 && !this.fat;
  }

  // Il est petit : le caramel, les chips et les tirs des pouvoirs le touchent un peu plus haut.
  shotBox() {
    return { x: this.x, y: this.y - 18, w: this.w, h: this.h + 18 };
  }

  // Malice arrive tout près (devant ou derrière, en lui tombant dessus, ou juste en dessous de lui) ?
  near(p) {
    if (p.dead || p.won) return false;
    const feet = p.y + p.h;
    return Math.abs(p.cx - this.cx) < this.world.diff.hogNear * TILE && feet > this.y - 3 * TILE && feet < this.y + this.h + 1.5 * TILE;
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const D = w.diff;
    this.calm -= dt;
    this.timer -= dt;
    switch (this.state) {
      case 'walk':
        this.curl = Math.max(0, this.curl - dt / HOG_CURL);
        this.shyOfReader();
        this.vx = this.dir * D.hogSpeed;
        this.legPhase += dt * 11;
        this.walkPhysics(dt, true);
        if (this.calm <= 0 && this.near(p)) this.ballUp();
        break;
      case 'ball':
        // tout rond, il tremble un peu ; puis il se déroule
        this.curl = Math.min(1, this.curl + dt / HOG_CURL);
        this.vx = 0;
        this.walkPhysics(dt, false);
        if (this.timer <= 0) {
          this.state = 'peek';
          this.timer = D.hogOpen;
          if (w.onScreen(this)) Sound.sfx.hogOpen();
          w.popText(this.cx, this.y - 16, '?', '#ffffff', 24);
        }
        break;
      case 'peek':
        // déroulé, il renifle autour de lui (il ne se remet pas en boule tout de suite)
        this.curl = Math.max(0, this.curl - dt / HOG_CURL);
        this.vx = 0;
        this.walkPhysics(dt, false);
        if (this.timer <= 0) this.state = 'walk';
        break;
      default: break;
    }
    const dx = p.cx - this.cx;
    const dy = p.cy - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const sees = !p.dead && d < 360 && this.state === 'peek';
    this.look.x += ((sees ? dx / d : this.dir) - this.look.x) * Math.min(1, dt * 6);
    this.look.y += ((sees ? dy / d : 0) - this.look.y) * Math.min(1, dt * 6);
  }

  // Une fleur qui parle (Malice la lit) à moins de 6 cases, sur son étage ? Il fait demi-tour, et s'en va sans se
  // mettre en boule : on ne vient pas piquer Malice pendant qu'elle lit (ni juste quand elle repart).
  shyOfReader() {
    for (const f of this.world.flowers) {
      if (f.show < 0.5 || Math.abs(f.y - (this.y + this.h)) > 24) continue;
      const d = f.x - this.cx;
      if (Math.abs(d) > 6 * TILE) continue;
      if (Math.sign(d) === this.dir) this.dir = -this.dir;
      this.calm = Math.max(this.calm, 0.3);
      return;
    }
  }

  // « ! » : il se met en boule.
  ballUp() {
    const w = this.world;
    this.state = 'ball';
    this.timer = w.diff.hogCurl;
    this.vx = 0;
    w.popText(this.cx, this.y - 16, '!', '#ff4040', 28);
    if (w.onScreen(this)) Sound.sfx.hogCurl();
  }

  // Le caramel colle ses piquants, et les chips le rendent trop gros : il se déroule tout de suite.
  unroll() {
    this.curl = 0;
    this.state = 'peek';
    this.timer = Infinity;
  }

  onStuck() { this.unroll(); }
  onFat() { this.unroll(); }

  onUnstuck() {
    this.state = 'walk';
    this.calm = 0.6;
  }

  // déroulé, on lui saute dessus : pouic ! Il voit des étoiles, puis redevient tout gentil (des petits cœurs).
  stomp() {
    const w = this.world;
    this.kill('stomp');
    w.popText(this.cx, this.y - 24, 'Pouic !', '#ffe0b0', 20);
    for (let i = 0; i < 3; i++) {
      w.spawn({ type: 'heart', x: this.cx + rand(-12, 12), y: this.y, vx: rand(-40, 40), vy: rand(-140, -80), life: 0.9, size: 1 });
    }
  }

  drawBody(ctx, x, y) {
    Art.hedgehog(ctx, x, y, {
      dir: this.dir, t: this.t, phase: this.legPhase, curl: this.curl, look: this.look,
      moving: Math.abs(this.vx) > 1, sniff: this.state === 'peek' && !this.fat && this.stuck <= 0,
      fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: this.dir * (this.fat ? 21 : 19), y: -9 }; }
}

// Sanglier maléfique (le Marais aux Cabanes) : ses yeux rouges brillent, et de la fumée sort de ses naseaux.
// Il se promène en reniflant. Quand il voit Malice (devant ou derrière lui, à peu près à la même hauteur, sans
// mur entre eux), « ! » : il se tourne vers elle et gratte le sol, en soufflant de la fumée (c'est l'annonce).
// Puis il fonce tout droit, jusqu'à se cogner (contre un mur, une caisse ou un bloc : il reste étourdi, des étoiles
// autour de la tête) ou jusqu'au bord de la boue (il freine des quatre fers et s'arrête juste au bord, tout
// essoufflé). Ensuite il fait demi-tour et repart se promener.
// Seul le sanglier qui fonce fait mal (Malice est projetée en l'air, voir OUCH.spin) ; sinon, quand on le touche,
// il la repousse d'un coup de groin, sans lui faire mal (jamais dans la boue ni dans un trou : s'il n'y a pas de
// sol derrière elle, c'est lui qui recule d'un pas). Si elle est collée à lui quand il va foncer, il recule
// d'abord un peu en la regardant : elle a le temps de sauter. On lui saute dessus quand il gratte le sol, quand il est
// étourdi ou arrêté au bord : il redevient gentil (des petits cœurs). Sur un sanglier qui fonce, on rebondit sans
// rien lui faire. Le caramel le colle par terre, et avec les chips il est trop lourd pour foncer (il ne fait plus
// mal). Les pouvoirs qui renversent les ennemis marchent toujours, et en roulade on passe à travers lui.
// (w.diff : boarSee, boarWarn, boarRush, boarDizzy, boarWalk, voir DIFFS dans game.js)
// BOAR_BRAKE : comment il freine (pixels par seconde, par seconde) ; BOAR_REST : combien de temps il souffle au bord.
// Malice collée à lui quand il va foncer : il recule d'abord pendant BOAR_BACK + boarWarn / 5 secondes (plus
// longtemps en Bébé), à BOAR_BACK_SPEED pixels par seconde ; NUDGE_REACH : jusqu'où le coup de groin peut la renvoyer (il doit y avoir du sol jusque-là).
const BOAR_BRAKE = 1700;
const BOAR_REST = 0.9;
const BOAR_BACK = 0.3;
const BOAR_BACK_SPEED = 110;
const NUDGE_REACH = 90;

class Boar extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 56, 40);
    this.ouch = 'spin'; // projetée en l'air comme une toupie (voir OUCH)
    this.state = 'walk';
    this.timer = 0;
    // au début (et à la reprise d'un drapeau), il ne cherche pas tout de suite Malice
    this.calm = 1.2;
    this.fatSpeed = 14;
    this.snortT = rand(0.4, 1.4);
    this.scratchT = 0;
    this.nudgeT = 0;
    // (repoussé par son propre coup de groin, quand il n'y avait pas de sol derrière Malice : voir nudge)
    this.shoveT = 0;
    this.shoveDir = 1;
  }

  // Il fonce (ou freine encore très vite) : c'est là qu'il fait mal.
  rushing() {
    return this.state === 'charge' || (this.state === 'skid' && Math.abs(this.vx) > 120);
  }

  harmful() {
    return !this.dying && this.stuck <= 0 && !this.fat && this.rushing();
  }

  // On peut lui sauter dessus quand il ne fonce pas (sur un sanglier qui fonce, on rebondit sur son dos).
  stompable() {
    return !this.harmful();
  }

  // (voir World.interactions) Quand il ne fonce pas, on compte qu'on lui saute dessus même en arrivant un peu bas
  // sur son dos : en sautant par-dessus le fossé, on l'écrase au lieu de recevoir un coup de groin.
  get stompDepth() {
    return this.rushing() ? 18 : 28;
  }

  // Il voit Malice : pas trop loin, à peu près à sa hauteur (pas sur une cabane), et il peut aller jusqu'à elle
  // (pas de mur entre eux, ni de boue : de l'autre côté d'une mare, il ne s'occupe pas d'elle ; ni quand elle
  // saute au-dessus de la boue, juste devant lui).
  sees(p) {
    if (p.dead || p.won || p.tumbling()) return false;
    const w = this.world;
    if (Math.abs(p.cx - this.cx) > w.diff.boarSee * TILE) return false;
    const feet = p.y + p.h;
    const mine = this.y + this.h;
    if (feet < mine - 1.3 * TILE || feet > mine + 0.6 * TILE) return false;
    const r = Math.floor((mine - 10) / TILE);
    const rf = Math.round(mine / TILE);
    const c0 = Math.floor(Math.min(p.cx, this.cx) / TILE);
    const c1 = Math.floor(Math.max(p.cx, this.cx) / TILE);
    for (let c = c0; c <= c1; c++) {
      if (c > c0 && c < c1 && isSolidCh(w.tileAt(c, r))) return false;
      const below = w.tileAt(c, rf);
      if (!isSolidCh(below) && !isLedgeCh(below)) return false;
    }
    return true;
  }

  // Il souffle de la fumée par les naseaux (toutes les every secondes, en moyenne).
  snort(dt, every, big) {
    const w = this.world;
    this.snortT -= dt;
    if (this.snortT > 0) return;
    this.snortT = every * rand(0.7, 1.3);
    if (!w.onScreen(this)) return;
    const nx = this.cx + this.dir * (this.fat ? 34 : 31);
    const ny = this.y + this.h - 19;
    for (let i = 0; i < (big ? 4 : 2); i++) {
      w.spawn({ type: 'smoke', x: nx, y: ny + rand(-2, 2), vx: this.dir * rand(30, 80) + rand(-10, 10), vy: rand(-40, -10), life: rand(0.55, 0.85), size: big ? rand(4.5, 7) : rand(3, 5), color: big ? '#ffffff' : '#ecece6' });
    }
    if (big) Sound.sfx.boarSnort();
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const D = w.diff;
    this.calm -= dt;
    this.timer -= dt;
    this.nudgeT -= dt;
    this.shoveT -= dt;
    // il vient de donner un coup de groin, et il n'y avait pas de sol derrière Malice : c'est lui qui recule
    if (this.shoveT > 0 && this.state !== 'charge' && this.state !== 'skid') {
      this.stepBack(dt, this.shoveDir);
      return;
    }
    switch (this.state) {
      case 'walk':
        this.vx = this.dir * D.boarWalk;
        this.legPhase += dt * 7;
        this.walkPhysics(dt, true);
        this.snort(dt, 1.6, false);
        if (this.calm <= 0 && this.sees(p)) this.startScratch();
        break;
      case 'scratch': {
        // il regarde Malice et gratte le sol (s'il doit se retourner, il gratte encore un moment)
        this.vx = 0;
        this.walkPhysics(dt, false);
        const face = Math.sign(p.cx - this.cx);
        if (face && face !== this.dir && !p.dead) {
          this.dir = face;
          this.timer = Math.max(this.timer, D.boarWarn * 0.5);
        }
        this.scratchT -= dt;
        if (this.scratchT <= 0) {
          this.scratchT = 0.32;
          if (w.onScreen(this)) {
            Sound.sfx.boarScratch();
            for (let i = 0; i < 4; i++) {
              w.spawn({ type: 'dust', x: this.cx - this.dir * 22, y: this.y + this.h - 2, vx: -this.dir * rand(90, 220), vy: rand(-140, -40), life: 0.45, size: rand(4, 7) });
            }
          }
        }
        this.snort(dt, 0.45, true);
        if (this.timer <= 0) this.rush();
        break;
      }
      case 'back':
        // Malice était collée à lui : il recule un peu en la regardant (elle a le temps de sauter), puis il fonce
        this.stepBack(dt, -this.dir);
        if (this.timer <= 0) this.charge();
        break;
      case 'charge': {
        this.vx = this.dir * D.boarRush;
        this.legPhase += dt * 24;
        // au bord de la boue (ou d'un trou, ou des ronces), il freine des quatre fers
        if (this.onGround && !w.groundAhead(this, this.stopDist())) {
          this.state = 'skid';
          if (w.onScreen(this)) Sound.sfx.boarSkid();
        }
        this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
        const res = w.moveBody(this, dt);
        if (res.wall) this.bonk();
        else if (Math.random() < dt * 30) {
          w.spawn({ type: 'dust', x: this.cx - this.dir * 24, y: this.y + this.h, vx: -this.dir * rand(40, 120), vy: rand(-60, -10), life: 0.4, size: rand(5, 8) });
        }
        break;
      }
      case 'skid': {
        this.vx = approach(this.vx, 0, BOAR_BRAKE * dt);
        // (tout au bord : il s'arrête net, il ne s'avance jamais au-dessus de la boue)
        if (this.onGround && !w.groundAhead(this, 2)) this.vx = 0;
        this.legPhase += dt * 4;
        this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
        const res = w.moveBody(this, dt);
        if (res.wall) {
          this.bonk();
        } else if (this.vx === 0) {
          this.state = 'rest';
          this.timer = BOAR_REST;
          w.popText(this.cx, this.y - 16, 'Ouf !', '#ffffff', 20);
        } else if (Math.random() < dt * 40) {
          w.spawn({ type: 'dust', x: this.cx + this.dir * 20, y: this.y + this.h, vx: this.dir * rand(20, 90), vy: rand(-80, -20), life: 0.35, size: rand(4, 7) });
        }
        break;
      }
      case 'rest':
      case 'dizzy':
        // tout essoufflé au bord de la boue, ou étourdi : puis il fait demi-tour
        this.vx = 0;
        this.walkPhysics(dt, false);
        if (this.state === 'rest') this.snort(dt, 0.5, false);
        if (this.timer <= 0) {
          this.state = 'walk';
          this.dir *= -1;
          this.calm = 0.6;
        }
        break;
      default: break;
    }
  }

  // « ! » : il a vu Malice, il gratte le sol.
  startScratch() {
    const w = this.world;
    this.state = 'scratch';
    this.timer = w.diff.boarWarn;
    this.scratchT = 0;
    this.snortT = 0;
    this.dir = Math.sign(w.player.cx - this.cx) || this.dir;
    w.popText(this.cx, this.y - 16, '!', '#ff4040', 30);
    if (w.onScreen(this)) Sound.sfx.boarAngry();
  }

  // Il a fini de gratter. Si Malice est collée à lui (à moins d'une case), il recule d'abord un peu : sinon elle
  // serait touchée dans la même image, sans avoir le temps de réagir.
  rush() {
    const p = this.world.player;
    const gap = Math.abs(p.cx - this.cx) - (this.w + p.w) / 2;
    if (!p.dead && gap < TILE && p.y + p.h > this.y - TILE && p.y < this.y + this.h) {
      this.state = 'back';
      this.timer = BOAR_BACK + 0.2 * this.world.diff.boarWarn;
      return;
    }
    this.charge();
  }

  // Il fonce ! (Tout près du bord, il n'a pas la place de prendre son élan : juste quelques pas, en freinant
  // pour s'arrêter au bord.)
  charge() {
    const w = this.world;
    const stop = this.stopDist();
    let room = 4;
    while (room < stop && w.groundAhead(this, room + 4)) room += 4;
    if (room < stop) {
      this.state = 'skid';
      this.vx = this.dir * Math.sqrt(2 * BOAR_BRAKE * Math.max(0, room - 6));
    } else {
      this.state = 'charge';
    }
    if (w.onScreen(this)) Sound.sfx.boarRush();
  }

  // Combien de place il lui faut pour s'arrêter quand il fonce (en pixels, devant lui).
  stopDist() {
    const v = this.world.diff.boarRush;
    return (v * v) / (2 * BOAR_BRAKE) + 6;
  }

  // Il recule (vers dir), en regardant toujours devant lui ; il ne recule jamais dans la boue, un trou ou les ronces.
  stepBack(dt, dir) {
    const w = this.world;
    const face = this.dir;
    this.dir = dir;
    const room = !this.onGround || w.groundAhead(this, 6);
    this.dir = face;
    this.vx = room ? dir * BOAR_BACK_SPEED : 0;
    if (room) this.legPhase -= dt * 9;
    this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
    w.moveBody(this, dt);
  }

  // Bonk ! Il s'est cogné : il voit des étoiles.
  bonk() {
    const w = this.world;
    this.state = 'dizzy';
    this.timer = w.diff.boarDizzy;
    this.vx = 0;
    if (w.onScreen(this)) {
      w.shake(5);
      Sound.sfx.boarBonk();
    }
    w.popText(this.cx + this.dir * 20, this.y - 14, 'Bonk !', '#ffe27a', 24);
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'spark', x: this.cx + this.dir * 28, y: this.y + 14, vx: rand(-160, 160), vy: rand(-200, -40), life: 0.4, size: rand(4, 7), color: '#fff6a0' });
    }
  }

  // Il vient de projeter Malice en l'air : elle passe par-dessus son dos (et lui continue tout droit, loin d'elle).
  // (pas onHit : ce nom-là veut dire « il vient de perdre une vie » chez les boss, voir boss.js)
  tossed(p) {
    if (!p.tumbling()) return;
    p.vx = -this.dir * OUCH.spin.vx;
    this.calm = 2;
  }

  // Quand il ne fonce pas, il repousse Malice d'un coup de groin (sans lui faire mal). S'il n'y a pas de sol
  // derrière elle (la boue, un trou, les ronces), il ne la pousse pas : c'est lui qui recule d'un pas.
  nudge(p) {
    if (this.nudgeT > 0 || this.stuck > 0 || p.invuln > 0 || p.hurtT > 0 || p.tumbling()) return;
    const w = this.world;
    this.nudgeT = 0.6;
    const d = Math.sign(p.cx - this.cx) || -this.dir;
    if (this.floorBehind(p, d)) {
      p.stopPower();
      p.vx = d * 330;
      p.vy = Math.min(p.vy, -300);
      p.hurtT = 0.22;
      p.onGround = false;
      p.platform = null;
      p.pound = 0;
    } else {
      this.shoveT = 0.35;
      this.shoveDir = -d;
    }
    Sound.sfx.boarGrunt();
    w.popText(this.cx, this.y - 16, 'Groin !', '#ffd0c0', 20);
  }

  // Y a-t-il du sol sous tout le chemin du coup de groin (du milieu de Malice jusqu'à NUDGE_REACH pixels derrière
  // elle, du côté d) ? Un mur (une caisse) l'arrête : c'est bon aussi.
  floorBehind(p, d) {
    const w = this.world;
    const r = Math.round((this.y + this.h) / TILE);
    for (let k = 0; k <= p.w / 2 + NUDGE_REACH; k += TILE / 4) {
      const c = Math.floor((p.cx + d * k) / TILE);
      const at = w.tileAt(c, r - 1);
      if (isSolidCh(at)) return true;
      const below = w.tileAt(c, r);
      if (at === '^' || at === 'v' || (!isSolidCh(below) && !isLedgeCh(below))) return false;
    }
    return true;
  }

  onStuck() { this.state = 'walk'; }

  onFat() { this.state = 'walk'; }

  onUnstuck() { this.calm = 0.6; }

  // On lui saute dessus : groin ! Ses yeux redeviennent gentils, et il s'en va tout content (des petits cœurs).
  stomp() {
    const w = this.world;
    this.kill('stomp');
    w.popText(this.cx, this.y - 24, 'Groin !', '#ffe0d0', 22);
    for (let i = 0; i < 4; i++) {
      w.spawn({ type: 'heart', x: this.cx + rand(-16, 16), y: this.y, vx: rand(-40, 40), vy: rand(-150, -80), life: 0.9, size: 1 });
    }
  }

  drawBody(ctx, x, y) {
    Art.boar(ctx, x, y, {
      dir: this.dir, t: this.t, phase: this.legPhase, state: this.stuck > 0 ? 'stuck' : this.fat ? 'walk' : this.state,
      dizzy: this.state === 'dizzy' && this.stuck <= 0, scratch: this.state === 'scratch' && this.stuck <= 0 && !this.fat,
      rush: this.rushing() && this.stuck <= 0 && !this.fat, kind: this.dying,
      fat: this.fat, rest: this.fatRest && this.stuck <= 0, moving: Math.abs(this.vx) > 1,
    });
  }

  mouth() { return { x: this.dir * (this.fat ? 30 : 27), y: -14 }; }
}

// La taupe qui sort de terre, tout étonnée, quand Malice retombe sur la tête juste à côté de son trou (après le
// sanglier) : elle la regarde (« ? »), puis replonge aussitôt. Elle ne fait rien : on ne peut même pas la toucher.
// (PEEK : elle attend, sort, regarde, replonge ; puis le trou se referme)
const PEEK = { wait: 0.12, rise: 0.16, look: 0.8, dive: 0.16, close: 0.5 };

class PeekMole {
  constructor(world, x, ground, dir) {
    this.world = world;
    this.x = x;
    this.groundY = ground;
    this.dir = dir;
    this.t = 0;
    this.dead = false;
  }

  update(dt) {
    const w = this.world;
    const P = PEEK;
    const t0 = this.t;
    this.t += dt;
    const passed = (time) => t0 < time && this.t >= time;
    if (passed(P.wait)) {
      Sound.sfx.molePeek();
      for (let i = 0; i < 6; i++) {
        w.spawn({ type: 'dot', x: this.x + rand(-14, 14), y: this.groundY - 2, vx: rand(-120, 120), vy: rand(-260, -120), g: 1200, life: 0.5, size: rand(2, 3.5), color: choose(['#8a5a34', '#a8703e', '#6a4024']) });
      }
    }
    if (passed(P.wait + P.rise + 0.18)) {
      w.popText(this.x, this.groundY - 58, '?', '#ffffff', 28);
      Sound.sfx.moleHuh();
    }
    if (passed(P.wait + P.rise + P.look)) Sound.sfx.moleHide();
    if (this.t > P.wait + P.rise + P.look + P.dive + P.close) this.dead = true;
  }

  draw(ctx) {
    const P = PEEK;
    const t = this.t - P.wait;
    if (t < 0) return;
    const gy = this.groundY;
    const tDive = P.rise + P.look;
    // de 0 (sous terre) à 1 (sortie jusqu'à la taille)
    let out;
    if (t < P.rise) out = Math.sin((t / P.rise) * Math.PI * 0.5);
    else if (t < tDive) out = 1;
    else out = clamp(1 - (t - tDive) / P.dive, 0, 1);
    // le trou (il se referme une fois qu'elle est repartie)
    const close = clamp((t - tDive - P.dive) / P.close, 0, 1);
    Art.moleHole(ctx, this.x, gy, 0.8 * (1 - close));
    if (out <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x - 60, gy - 200, 120, 200);
    ctx.clip();
    // elle penche la tête, tout étonnée
    const tilt = t > P.rise ? Math.sin(Math.min(1, (t - P.rise) / 0.2) * Math.PI * 0.5) * 0.18 : 0;
    ctx.translate(this.x, gy + 5 + (1 - out) * 46);
    ctx.rotate(-tilt * this.dir);
    Art.mole(ctx, 0, 0, { dir: this.dir, t: this.t, look: { x: this.dir, y: -0.1 } });
    ctx.restore();
  }
}

// Grenouille sauteuse (le Moulin à Vent) : elle adore la pluie ! Assise, elle attrape les gouttes avec sa langue, et
// coasse de joie, la gorge toute gonflée. De temps en temps, elle saute, très haut : d'abord elle se ramasse (elle
// s'aplatit et tremble, et son ombre apparaît déjà là où elle va retomber), puis hop ! Quand Malice est tout près,
// sur son étage, « ! » : elle saute sur elle (là où Malice était quand elle s'est ramassée : il suffit de s'écarter
// de l'ombre). Sinon, elle fait de petits bonds sur son coin d'herbe (jamais sur Malice), qu'elle ne quitte jamais
// (pas de trou, de ronces, ni rien au-dessus d'elle, où elle se cognerait ou se poserait).
// On lui saute dessus (assise, ramassée, ou même en l'air, en lui tombant dessus) : « Croâ ! », elle redevient
// toute gentille (des petits cœurs). Si elle retombe sur Malice, ou si Malice la touche, Malice devient toute verte
// (voir OUCH.croak). Le caramel la colle par terre (elle ne saute plus) ; avec les chips, elle est trop lourde pour
// sauter (elle se dandine, toute essoufflée). Les pouvoirs qui renversent marchent, et en roulade on passe dessous.
// (w.diff : frogSee, frogWarn, frogAir, frogRest, voir DIFFS dans game.js)
// FROG : high (la hauteur du grand saut sur Malice, en cases), hop (celle d'un petit bond), hopAir (le temps en l'air
// d'un petit bond, en secondes), range (jusqu'où elle s'éloigne de sa place, en cases), land (le temps où elle reste
// tout écrasée en retombant), far (un petit bond fait au plus far cases), shy (un petit bond ne finit jamais à moins
// de shy cases de Malice).
const FROG = { high: 5, hop: 2, hopAir: 0.75, range: 4, land: 0.3, far: 2.2, shy: 1.8 };

class Frog extends Enemy {
  constructor(world, x, y) {
    super(world, x, y, 40, 30);
    this.ouch = 'croak'; // Malice devient toute verte, et coasse (voir OUCH)
    // 'sit' : assise ; 'crouch' : elle se ramasse ; 'air' : elle saute ; 'land' : elle retombe, tout écrasée
    this.state = 'sit';
    this.timer = rand(1, 2.2);
    // au début (et à la reprise d'un drapeau), elle ne saute pas tout de suite sur Malice
    this.calm = 1.5;
    this.fatSpeed = 18;
    this.home = this.cx;
    this.range = this.findRange();
    // là où elle va retomber (son ombre) : { x, y, big } ; big : le grand saut sur Malice
    this.target = null;
    this.warn = 1;
    this.air = 1;
    this.airT = 0;
    this.g = PHYS.gravity;
    // la gorge qui se gonfle quand elle coasse, et la langue qui attrape une goutte de pluie
    this.sacT = 0;
    this.croakT = rand(1.5, 4);
    this.tongue = 0;
    this.tongueT = rand(0.8, 2.5);
    this.look = { x: -1, y: 0 };
  }

  // Son coin d'herbe : les cases de sol de son étage autour de sa place, avec rien au-dessus (ni ronces, ni plafond,
  // ni planche où elle se poserait), assez haut pour son grand saut.
  findRange() {
    const w = this.world;
    const c0 = Math.floor(this.home / TILE);
    const r = Math.round((this.y + this.h) / TILE);
    const free = (ch) => !isSolidCh(ch) && !isLedgeCh(ch) && ch !== '^' && ch !== 'v' && ch !== '~';
    const ok = (c) => {
      if (!isSolidCh(w.tileAt(c, r))) return false;
      for (let k = 1; k <= FROG.high + 2; k++) if (!free(w.tileAt(c, r - k))) return false;
      return true;
    };
    let a = c0;
    let b = c0;
    while (a > c0 - FROG.range && ok(a - 1)) a--;
    while (b < c0 + FROG.range && ok(b + 1)) b++;
    return { x0: a * TILE + TILE / 2, x1: b * TILE + TILE / 2, y: r * TILE };
  }

  // Quand elle monte en sautant, elle ne fait pas mal : elle file vers le haut, et Malice qui lui saute dessus n'y est
  // pour rien (si Malice retombe sur elle, c'est un « Croâ ! » ; si c'est elle qui retombe sur Malice, ça fait mal).
  harmful() {
    return super.harmful() && !(this.state === 'air' && this.vy < 0);
  }

  // Elle est petite : le caramel, les chips et les tirs des pouvoirs la touchent un peu plus haut.
  shotBox() {
    return { x: this.x, y: this.y - 18, w: this.w, h: this.h + 18 };
  }

  // Elle saute sur Malice ? Seulement si Malice est tout près, sur son étage (là où elle avait les pieds la dernière
  // fois qu'elle était par terre : pas sur une planche du moulin), et pas pendant qu'elle lit une fleur qui parle.
  aims(p) {
    if (p.dead || p.won || this.calm > 0 || p.tumbling()) return false;
    const w = this.world;
    if (Math.abs(p.cx - this.cx) > w.diff.frogSee * TILE) return false;
    if (Math.abs(p.groundY - this.range.y) > 0.6 * TILE) return false;
    return !w.flowers.some((f) => f.show > 0.3 && Math.abs(f.x - this.cx) < 9 * TILE);
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const D = w.diff;
    this.calm -= dt;
    this.timer -= dt;
    if (this.sacT > 0) this.sacT -= dt;
    if (this.tongue > 0) {
      this.tongue += dt / 0.32;
      if (this.tongue >= 1) this.tongue = 0;
    }
    switch (this.state) {
      case 'sit':
        this.vx = 0;
        this.walkPhysics(dt, false);
        // elle adore la pluie : elle attrape les gouttes avec sa langue, et coasse de joie
        this.croakT -= dt;
        if (this.croakT <= 0) {
          this.croakT = rand(2.5, 5);
          this.croak();
        }
        this.tongueT -= dt;
        if (this.tongueT <= 0) {
          this.tongueT = rand(1.2, 3);
          this.tongue = 0.001;
        }
        if (this.timer <= 0 && this.onGround) this.plan();
        break;
      case 'crouch':
        this.vx = 0;
        this.walkPhysics(dt, false);
        if (this.timer <= 0) this.leap();
        break;
      case 'air': {
        this.airT += dt;
        this.vy = Math.min(this.vy + this.g * dt, PHYS.maxFall);
        const res = w.moveBody(this, dt);
        if (res.wall) this.vx = 0;
        if (res.landed) this.touchDown();
        break;
      }
      case 'land':
        this.vx = 0;
        this.walkPhysics(dt, false);
        if (this.timer <= 0) {
          this.state = 'sit';
          this.timer = rand(D.frogRest[0], D.frogRest[1]);
        }
        break;
      default: break;
    }
    // elle regarde Malice quand elle est tout près (et là où elle va sauter)
    const T = this.target;
    const lx = T && this.state === 'crouch' ? T.x : p.cx;
    const ly = T && this.state === 'crouch' ? T.y - 120 : p.cy;
    const dx = lx - this.cx;
    const dy = ly - this.cy;
    const d = Math.hypot(dx, dy) || 1;
    const sees = !p.dead && d < 6 * TILE;
    this.look.x += ((sees ? dx / d : this.dir) - this.look.x) * Math.min(1, dt * 6);
    this.look.y += ((sees ? dy / d : 0) - this.look.y) * Math.min(1, dt * 6);
    if (this.state === 'sit' && sees && Math.abs(dx) > 8) this.dir = Math.sign(dx);
  }

  // Où sauter : sur Malice, ou un petit bond sur son coin d'herbe.
  plan() {
    const w = this.world;
    const p = w.player;
    const R = this.range;
    let tx;
    const big = this.aims(p);
    if (big) {
      tx = clamp(p.cx, R.x0, R.x1);
    } else {
      let d = (Math.random() < 0.5 ? -1 : 1) * rand(1, FROG.far) * TILE;
      if (this.cx + d < R.x0 || this.cx + d > R.x1) d = -d;
      tx = clamp(this.cx + d, R.x0, R.x1);
      // (jamais tout près de Malice)
      const near = !p.dead && Math.abs(p.groundY - R.y) < 0.6 * TILE && Math.abs(tx - p.cx) < FROG.shy * TILE;
      if (Math.abs(tx - this.cx) < TILE / 2 || near) {
        // pas de place : elle reste assise, et coasse
        this.timer = rand(0.8, 1.4);
        this.croak();
        return;
      }
    }
    this.target = { x: tx, y: R.y, big };
    if (Math.abs(tx - this.cx) > 4) this.dir = Math.sign(tx - this.cx);
    this.state = 'crouch';
    this.warn = big ? w.diff.frogWarn : w.diff.frogWarn * 0.6;
    this.timer = this.warn;
    if (big) w.popText(this.cx, this.y - 16, '!', '#4ad04a', 28);
    if (w.onScreen(this)) Sound.sfx.frogCrouch();
  }

  // Hop ! (un saut en cloche, qui retombe juste sur son ombre)
  leap() {
    const w = this.world;
    const T = this.target;
    const H = (T.big ? FROG.high : FROG.hop) * TILE;
    const air = T.big ? w.diff.frogAir : FROG.hopAir;
    this.g = (8 * H) / (air * air);
    this.vy = -(4 * H) / air;
    this.vx = (T.x - this.cx) / air;
    this.air = air;
    this.airT = 0;
    this.onGround = false;
    this.state = 'air';
    if (w.onScreen(this)) Sound.sfx.frogJump(T.big);
    for (let i = 0; i < 5; i++) {
      w.spawn({ type: 'dot', x: this.cx + rand(-14, 14), y: this.y + this.h - 2, vx: rand(-80, 80), vy: rand(-160, -60), g: 900, life: 0.4, size: rand(1.8, 3), color: '#bfe6ff' });
    }
  }

  touchDown() {
    const w = this.world;
    this.state = 'land';
    this.timer = FROG.land;
    this.vx = 0;
    this.target = null;
    if (!w.onScreen(this)) return;
    // plouf dans une flaque, sinon des éclaboussures de pluie
    if (w.inPuddle(this)) {
      w.splash(this.cx, this.y + this.h - 6);
    } else {
      Sound.sfx.frogLand();
      for (let i = 0; i < 6; i++) {
        w.spawn({ type: 'dot', x: this.cx + rand(-18, 18), y: this.y + this.h - 2, vx: rand(-140, 140), vy: rand(-220, -80), g: 1100, life: 0.45, size: rand(1.8, 3.2), color: i % 2 ? '#bfe6ff' : '#ffffff' });
      }
    }
  }

  // Elle vient de retomber sur Malice : elle rebondit, et file un peu plus loin sur son coin d'herbe (sinon, Malice
  // projetée en l'air lui retomberait dessus tout de suite).
  tossed(p) {
    // (gavée de chips, elle est bien trop lourde pour sauter)
    if (this.fat) return;
    const R = this.range;
    const away = Math.sign(this.cx - p.cx) || this.dir;
    let tx = clamp(this.cx + away * 2.2 * TILE, R.x0, R.x1);
    if (Math.abs(tx - this.cx) < TILE) tx = clamp(this.cx - away * 2.2 * TILE, R.x0, R.x1);
    this.target = { x: tx, y: R.y, big: false };
    this.calm = Math.max(this.calm, 1.5);
    this.leap();
    this.target = null;
  }

  croak() {
    this.sacT = 0.55;
    if (this.world.onScreen(this, -40)) Sound.sfx.frogCroak();
  }

  onStuck() {
    this.state = 'sit';
    this.target = null;
  }

  onFat() { this.onStuck(); }

  onUnstuck() {
    this.state = 'sit';
    this.timer = 1;
    this.calm = 0.8;
  }

  // on lui saute dessus : « Croâ ! » Elle voit des étoiles, puis redevient toute gentille (des petits cœurs).
  stomp() {
    const w = this.world;
    this.kill('stomp');
    w.popText(this.cx, this.y - 24, 'Croâ !', '#b6ff9a', 20);
    for (let i = 0; i < 3; i++) {
      w.spawn({ type: 'heart', x: this.cx + rand(-12, 12), y: this.y, vx: rand(-40, 40), vy: rand(-140, -80), life: 0.9, size: 1 });
    }
  }

  // L'ombre là où elle va retomber, dessinée par-dessus Malice pour qu'on la voie bien (comme celle des éclairs) :
  // elle grandit et fonce pendant que la grenouille se ramasse, puis pendant qu'elle retombe.
  drawWarning(ctx) {
    const T = this.target;
    if (!T || this.dying || this.stuck > 0 || this.fat || (this.state !== 'crouch' && this.state !== 'air')) return;
    const k = this.state === 'crouch' ? 0.35 * clamp(1 - this.timer / this.warn, 0, 1) : 0.35 + 0.65 * clamp(this.airT / this.air, 0, 1);
    const big = T.big ? 1 : 0.7;
    ctx.fillStyle = `rgba(20,60,25,${(0.24 + 0.4 * k) * (T.big ? 1 : 0.75)})`;
    ellipsePath(ctx, T.x, T.y - 1, (18 + 16 * k) * big, (5 + 4 * k) * big);
    ctx.fill();
    if (T.big) {
      // un cercle vert qui se resserre : elle arrive !
      ctx.strokeStyle = `rgba(70,210,70,${0.45 + 0.5 * k})`;
      ctx.lineWidth = 3;
      ellipsePath(ctx, T.x, T.y - 1, 22 + 22 * (1 - k), 7 + 6 * (1 - k));
      ctx.stroke();
    }
  }

  drawBody(ctx, x, y) {
    const live = this.stuck <= 0 && !this.fat;
    let crouch = 0;
    if (live && this.state === 'crouch') crouch = clamp(1 - this.timer / this.warn, 0, 1) * 0.6 + 0.4;
    Art.frog(ctx, x, y, {
      dir: this.dir, t: this.t, look: this.look, crouch,
      air: live && this.state === 'air' ? (this.vy < 0 ? -1 : 1) : 0,
      land: live && this.state === 'land' ? this.timer / FROG.land : 0,
      sac: this.sacT > 0 ? Math.sin((1 - this.sacT / 0.55) * Math.PI) : 0,
      tongue: live && this.state === 'sit' ? this.tongue : 0,
      phase: this.legPhase, moving: Math.abs(this.vx) > 1,
      fat: this.fat, rest: this.fatRest && this.stuck <= 0,
    });
  }

  mouth() { return { x: this.dir * (this.fat ? 18 : 15), y: -12 }; }
}

// Le moulin à vent (le Moulin à Vent ; lettre x : l'axe de ses ailes). Ses quatre ailes tournent dans le sens des
// aiguilles d'une montre, et au bout de chaque aile pend une planche qui reste toujours à plat, comme les nacelles
// d'une grande roue : on monte dessus, et elle nous emporte (elle monte à gauche, passe tout en haut vers la droite, et
// redescend à droite). La tour est dans le décor : on passe devant.
// MILL : r (de l'axe au bout des ailes, en pixels), hang (la planche pend sous le bout de l'aile), plankW, plankH.
// Le temps d'un tour est dans DIFFS (millTurn). Pour que les planches ne poussent jamais Malice dans un mur ou sous
// un plafond, la carte ne met rien de solide sur leur chemin (et au-dessus, la place de Malice) ; et la plateforme
// ne l'emporte jamais dans un mur (voir Player.update).
const MILL = { r: 160, hang: 10, plankW: 96, plankH: 16, sails: 4 };

class Windmill {
  constructor(world, cx, cy) {
    this.world = world;
    this.x = cx;
    this.y = cy;
    // le pied de la tour : le sol sous l'axe. Au-dessus d'un trou sans fond, elle est posée au niveau de ses bords,
    // sur un grand rocher qui s'enfonce dans le vide (rock : sa hauteur ; sans porte, elle ne donne sur rien).
    this.ground = world.surfaceBelow(cx, cy + MILL.r + 30);
    this.rock = 0;
    if (this.ground > world.height) {
      let edge = cy + MILL.r;
      for (const s of [-1, 1]) {
        for (let x = cx; x > 0 && x < world.width; x += s * TILE) {
          const g = world.surfaceBelow(x, cy);
          if (g <= world.height) {
            edge = Math.max(edge, g);
            break;
          }
        }
      }
      this.ground = edge;
      this.rock = world.height - edge + 40;
    }
    this.planks = [];
    for (let i = 0; i < MILL.sails; i++) {
      const pl = new MillPlank(this, i);
      this.planks.push(pl);
      world.platforms.push(pl);
    }
  }

  // De combien les ailes ont tourné (radians, dans le sens des aiguilles d'une montre).
  angle() {
    return Math.PI / 4 + (this.world.t * Math.PI * 2) / this.world.diff.millTurn;
  }

  seen(camX) {
    return this.x + MILL.r + 160 > camX && this.x - MILL.r - 160 < camX + VIEW_W;
  }

  draw(ctx) {
    Scenery.windmill(ctx, this.x, this.y, this.ground, this.angle(), MILL.r, this.rock);
  }
}

class MillPlank {
  constructor(mill, i) {
    this.mill = mill;
    this.world = mill.world;
    this.i = i;
    this.w = MILL.plankW;
    this.h = MILL.plankH;
    this.dx = 0;
    this.dy = 0;
    this.place();
  }

  // le bout de son aile
  tip() {
    const a = this.mill.angle() + (this.i * Math.PI * 2) / MILL.sails;
    return { x: this.mill.x + Math.cos(a) * MILL.r, y: this.mill.y + Math.sin(a) * MILL.r };
  }

  place() {
    const p = this.tip();
    this.tx = p.x;
    this.ty = p.y;
    this.x = p.x - this.w / 2;
    this.y = p.y + MILL.hang;
  }

  // Là où le Lutin ne peut pas poser de bloc magique : toute la roue (et la place de celui qui est dessus).
  blockZone() {
    const m = this.mill;
    const R = MILL.r + MILL.hang;
    return { x: m.x - R - this.w / 2 - 30, y: m.y - R - 70, w: 2 * R + this.w + 60, h: 2 * R + 90 };
  }

  update() {
    const ox = this.x;
    const oy = this.y;
    this.place();
    this.dx = this.x - ox;
    this.dy = this.y - oy;
  }

  draw(ctx) {
    if (!this.mill.seen(this.world.cam.x)) return;
    Scenery.millPlank(ctx, this.x, this.y, this.w, this.h, this.tx, this.ty);
  }
}

// ======================= LA CRUE =======================
// La rivière déborde (la Crue, voir "crue" dans levels.js). L'eau remplit tout ce qui est vide sous sa surface (y) : on
// la dessine seulement dans les cases vides, jamais dans la terre. Quand Malice monte sur l'escalier d'une montée, la
// rivière bouillonne (floodWarn) et « L'eau monte ! » : elle déborde d'un coup jusqu'au pied de l'escalier, puis l'eau
// monte derrière Malice, jusqu'à l'arrêt de la montée (juste sous l'étage du dessus). Si Malice monte déjà l'escalier
// suivant, elle ne s'arrête pas en chemin. Pour que ce soit juste :
//  - tout près sous les pieds de Malice, l'eau ralentit (jusqu'à FLOOD.slow) ; quand Malice est loin au-dessus, elle
//    accélère (jusqu'à FLOOD.fast fois plus vite), et elle ne reste jamais plus de FLOOD.leash cases sous ses pieds (la
//    laisse) : on voit le bas de l'écran tout bleu, et dès qu'on hésite, l'eau entre dans l'écran ;
//  - quand Malice est trempée par un petit nuage (elle avance moins vite), l'eau monte deux fois moins vite ;
//  - elle ne monte pas pendant que Malice lit une fleur (debout à côté ; une fleur sous l'eau ne parle plus), ni
//    pendant qu'elle a mal ou est sous l'eau ;
//  - après un plouf, elle redescend d'au moins floodBack cases sous l'endroit où Malice ressort (jamais plus bas que là
//    où elle était au début de la montée), et attend floodPause secondes avant de remonter (ou de re-déborder, si la
//    rivière bouillonne encore) : on ne ressort jamais sous l'eau, et on ne replonge pas aussitôt ;
//  - à la reprise d'un drapeau, les montées d'en dessous sont finies : l'eau est arrêtée sous l'étage du drapeau.
// FLOOD : near (à moins de near cases sous ses pieds, l'eau ralentit, jusqu'à slow fois moins vite à une case), far (à
// plus de far cases, elle accélère, jusqu'à fast fois plus vite à far + 4 cases), leash (la laisse : jamais plus de
// leash cases sous ses pieds ; l'écran en montre 3,8, voir CLIMB_FEET_CRUE : elle est juste sous le bas de l'écran, qui
// est tout bleu), pull (quand elle grimpe, la laisse tire l'eau au plus à pull pixels par seconde : moins vite que
// l'écran ne monte, l'eau n'y saute jamais d'un coup), back (la vitesse de l'eau qui redescend, en pixels par seconde),
// edge (quand l'eau qui monte est sous l'écran à moins de edge cases, le bas de l'écran devient bleu), surge (quand la
// rivière déborde, elle monte d'un coup jusqu'à surge cases sous le haut du palier : le sol de l'étage est sous l'eau,
// et depuis la 1re marche, on la voit bouillonner en bas de l'écran).
const FLOOD = { near: 2.5, slow: 0.45, far: 3.5, fast: 3, leash: 4.5, pull: 150, back: 700, edge: 5, surge: 1 };

class Flood {
  constructor(world, def, start) {
    this.world = world;
    this.y = def.eau * TILE + 14;
    // chaque montée : bas (le haut du palier), top (là où l'eau s'arrête), x0-x1 (l'escalier), k (sa vitesse)
    this.ups = (def.montees || []).map(([bas, arret, c0, c1, k]) => ({
      bas: bas * TILE, top: arret * TILE + 12, x0: c0 * TILE, x1: (c1 + 1) * TILE, k: k || 1, done: false,
    }));
    for (const u of this.ups) {
      if (start.y < u.top) {
        u.done = true;
        this.y = u.top;
      }
    }
    // low : le plus bas où elle redescend après un plouf (là où elle était au début de la montée)
    this.low = this.y;
    this.surge = this.y;
    this.up = null;
    // 'calm' : elle ne bouge pas ; 'warn' : la rivière bouillonne ; 'rise' : elle monte
    this.state = 'calm';
    this.timer = 0;
    this.pause = 0;
    this.backTo = null;
    this.t = 0;
    this.glugT = 1;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    if (this.backTo !== null) {
      this.y = approach(this.y, this.backTo, FLOOD.back * dt);
      if (this.y === this.backTo) this.backTo = null;
    }
    // l'escalier suivant : quand Malice y monte, l'eau monte (si elle montait déjà, loin en dessous, elle continue
    // jusqu'en haut de ce nouvel escalier, sans s'arrêter en chemin)
    const u = this.ups.find((m) => !m.done);
    if (u && !p.dead && !p.won && p.onGround && p.dive <= 0) {
      const feet = p.y + p.h;
      const onStairs = feet < u.bas - 4 && p.cx >= u.x0 && p.cx < u.x1;
      // (passée plus haut sans monter l'escalier, avec un pouvoir qui vole : l'eau monte quand même derrière elle)
      if (onStairs || feet < u.top - 2 * TILE) this.start(u, onStairs && this.state === 'calm');
    }
    if (this.state === 'calm') return;
    if (this.state === 'warn') {
      // la rivière bouillonne, et déborde d'un coup jusqu'au pied de l'escalier
      this.timer -= dt;
      this.bubble(dt, 40);
      // (après un plouf, elle attend aussi avant de re-déborder)
      if (this.pause > 0) this.pause -= dt;
      else if (this.backTo === null) this.y = approach(this.y, this.surge, ((this.low - this.surge) / w.diff.floodWarn) * dt);
      if (this.timer <= 0) this.state = 'rise';
      return;
    }
    this.bubble(dt, 8);
    if (this.pause > 0) {
      this.pause -= dt;
      return;
    }
    if (this.backTo !== null || p.dead || p.won || p.dive > 0 || p.hurtT > 0) return;
    // (pendant qu'elle lit une fleur, là où elle est : pas depuis la marche au-dessus d'une fleur, d'où on la lit aussi ;
    // une fleur sous l'eau ne parle plus)
    if (w.flowers.some((f) => f.show > 0.3 && f.y <= this.y && Math.abs(p.groundY - f.y) < TILE / 2)) return;
    const up = this.up;
    const gap = (this.y - p.groundY) / TILE;
    let k = up.k;
    if (gap < FLOOD.near) k *= FLOOD.slow + (1 - FLOOD.slow) * clamp((gap - 1) / (FLOOD.near - 1), 0, 1);
    else if (gap > FLOOD.far) k *= 1 + (FLOOD.fast - 1) * clamp((gap - FLOOD.far) / 4, 0, 1);
    if (p.soak > 0) k *= 0.5;
    let y = this.y - w.diff.floodSpeed * k * dt;
    // (la laisse : quand Malice grimpe plus vite qu'elle, l'eau la suit, jamais plus de FLOOD.leash cases sous ses pieds)
    const leash = p.groundY + FLOOD.leash * TILE;
    if (y > leash) y = Math.min(y, Math.max(leash, this.y - FLOOD.pull * dt));
    this.y = Math.max(up.top, y);
    // gloup… (de temps en temps, quand on la voit)
    this.glugT -= dt;
    if (this.glugT <= 0) {
      this.glugT = rand(1.3, 2.2);
      if (this.y < w.cam.y + VIEW_H + 30) Sound.sfx.floodGlug();
    }
    if (this.y <= up.top) this.stop();
  }

  // Malice monte sur l'escalier : la rivière déborde !
  start(u, warn) {
    const w = this.world;
    const p = w.player;
    u.done = true;
    this.up = u;
    // (si elle montait déjà, elle redescendra au plus bas jusqu'où elle était au début de cette montée-là)
    if (this.state === 'calm') this.low = this.y;
    // la rivière déborde d'un coup jusqu'au pied de l'escalier (FLOOD.surge cases sous le palier), pendant qu'elle
    // bouillonne
    this.surge = Math.min(this.y, u.bas + FLOOD.surge * TILE);
    this.state = warn ? 'warn' : 'rise';
    this.timer = w.diff.floodWarn;
    Sound.sfx.floodRise();
    w.shake(5);
    // (un grand message, qui reste plus longtemps qu'un petit mot)
    w.spawn({ type: 'text', x: p.cx, y: p.y - 40, vy: -22, life: 2.4, hold: 0.7, text: 'L\'eau monte ! Grimpe vite !', color: '#ffffff', size: 28 });
  }

  // Elle est arrivée sous l'étage du dessus : elle s'arrête.
  stop() {
    const w = this.world;
    this.y = this.up.top;
    this.low = this.y;
    this.up = null;
    this.state = 'calm';
    if (this.y > w.cam.y - 20 && this.y < w.cam.y + VIEW_H + 20) Sound.sfx.floodStop();
  }

  // Plouf : Malice va ressortir en s (ses pieds) ; l'eau redescend sous elle, et attend avant de remonter.
  dived(s) {
    const D = this.world.diff;
    const goal = Math.min(this.low, Math.max(this.y, s.y + D.floodBack * TILE));
    if (goal > this.y + 0.5) this.backTo = goal;
    if (this.state !== 'calm') this.pause = Math.max(this.pause, PHYS.diveTime + D.floodPause);
  }

  // (si elle n'avait pas fini de redescendre quand Malice ressort, elle y est d'un coup)
  poppedOut() {
    if (this.backTo === null) return;
    this.y = this.backTo;
    this.backTo = null;
  }

  // Des bulles à la surface (beaucoup quand la rivière bouillonne).
  bubble(dt, rate) {
    const w = this.world;
    if (this.y > w.cam.y + VIEW_H + 10 || this.y < w.cam.y - 10 || Math.random() > dt * rate) return;
    const x = w.cam.x + rand(10, VIEW_W - 10);
    if (w.solidAt(x, this.y + 2)) return;
    w.spawn({ type: 'ring', x, y: this.y + rand(-1, 2), life: 0.5, size: rand(10, 24), color: 'rgba(230,250,255,0.85)', flat: true });
    if (this.state === 'warn') {
      w.spawn({ type: 'dot', x, y: this.y - 2, vx: rand(-40, 40), vy: rand(-220, -90), g: 1100, life: 0.45, size: rand(2, 3.5), color: '#dff4ff' });
    }
  }

  // front : l'eau devant Malice (un peu transparente) ; sinon l'eau du fond (derrière tout ce qui bouge).
  draw(ctx, front) {
    const w = this.world;
    const bottom = w.cam.y + VIEW_H + 20;
    if (this.y > bottom) {
      if (front) this.drawEdge(ctx);
      return;
    }
    const x0 = w.cam.x - 30;
    const x1 = w.cam.x + VIEW_W + 30;
    ctx.save();
    this.clip(ctx, bottom);
    if (front) Scenery.floodFront(ctx, x0, x1, this.y, bottom, this.t, this.state === 'warn');
    else Scenery.floodBack(ctx, x0, x1, this.y, bottom, this.t);
    ctx.restore();
  }

  // L'eau n'entre pas dans la terre : seulement dans les cases vides qu'on voit.
  clip(ctx, bottom) {
    const w = this.world;
    const c0 = Math.max(0, Math.floor(w.cam.x / TILE) - 1);
    const c1 = Math.min(w.cols - 1, Math.ceil((w.cam.x + VIEW_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor((this.y - 12) / TILE));
    const r1 = Math.min(w.rows - 1, Math.floor(bottom / TILE));
    ctx.beginPath();
    for (let r = r0; r <= r1; r++) {
      let c = c0;
      while (c <= c1) {
        if (isSolidCh(w.tiles[r][c])) {
          c++;
          continue;
        }
        let e = c;
        while (e + 1 <= c1 && !isSolidCh(w.tiles[r][e + 1])) e++;
        ctx.rect(c * TILE, r * TILE, (e - c + 1) * TILE, TILE + (r === w.rows - 1 ? 80 : 0));
        c = e + 1;
      }
    }
    ctx.clip();
  }

  // L'eau qui monte arrive par le bas de l'écran : il devient tout bleu, de plus en plus.
  drawEdge(ctx) {
    if (this.state === 'calm') return;
    const w = this.world;
    const k = clamp(1 - (this.y - (w.cam.y + VIEW_H)) / (FLOOD.edge * TILE), 0, 1);
    if (k > 0) Scenery.floodEdge(ctx, w.cam.x, w.cam.y + VIEW_H, k, this.t);
  }
}

// Petit nuage grognon (la Crue ; lettre a) : il flotte au-dessus du sol de son étage, et ne le quitte jamais (son coin :
// tant que ce sol continue, à la même hauteur, sans rien de solide à sa hauteur, et au plus à CLOUD.range cases de sa
// place). Quand Malice marche sur son étage, il la suit en grognant (moins vite qu'elle ne marche). Arrivé au-dessus
// d'elle, il s'arrête et se fâche : il devient tout noir, gronde, son ombre fonce par terre et ses premières gouttes
// tombent (cloudWarn) ; puis il pleut (CLOUD.rain secondes) : toute trempée, Malice s'ébroue comme un chien (OUCH.shake),
// puis elle avance moins vite un moment (soakTime). Ensuite il est tout vide, tout pâle, et se repose (cloudRest).
// On le touche (on saute dedans par en dessous, on lui saute dessus, on le frôle) : pouf ! il éclate de rire, devient tout
// blanc et gentil, et s'envole. Il ne fait jamais mal en le touchant : seule sa pluie mouille (et sous un bloc, on est à
// l'abri). Le caramel le colle sur place (il ne bouge plus, il ne pleut plus) ; avec les chips, il a le ventre trop plein
// pour pleuvoir (il se pose par terre, tout essoufflé). L'étoile et les pouvoirs qui renversent le font éclater aussi.
// Il ne pleut jamais pendant qu'une fleur parle, ni juste au début ou à la reprise d'un drapeau. Il ne quitte jamais son
// étage : il ne pleut jamais sur un escalier de la crue (Malice y avancerait moins vite devant l'eau qui monte).
// CLOUD : alt (de son sol au bas du nuage, en pixels : on l'atteint même avec un tout petit saut), range (en cases),
// rain (combien de temps il pleut), rainW (la largeur de la pluie), calm (au début, il attend avant de pouvoir pleuvoir).
const CLOUD = { alt: 116, range: 7, rain: 1.1, rainW: 50, calm: 2 };

class GrumpyCloud extends Enemy {
  constructor(world, x, y) {
    super(world, x - 32, y - 20, 64, 40);
    this.ouch = 'shake';
    this.home = x;
    // son sol (là où tombe sa pluie), et la hauteur où il flotte
    this.floor = world.surfaceBelow(x, y);
    this.hover = this.floor - CLOUD.alt - this.h;
    this.y = this.hover;
    this.range = this.findRange();
    // 'idle' : il flotte chez lui ; 'follow' : il suit Malice ; 'brew' : il se fâche ; 'rain' : il pleut ;
    // 'empty' : tout vide, il se repose
    this.state = 'idle';
    this.timer = 0;
    this.calm = CLOUD.calm;
    // mood : de 0 (grognon) à 1 (tout noir, il va pleuvoir) ; empty : de 0 à 1 (tout pâle, il n'a plus d'eau)
    this.mood = 0;
    this.empty = 0;
    this.look = { x: 0, y: 1 };
    this.grumbleT = rand(1.5, 3);
    this.dir = 1;
  }

  // Son coin : les cases de son sol autour de sa place (le sol continue à la même hauteur, rien de solide là où il flotte).
  findRange() {
    const w = this.world;
    const r = Math.round(this.floor / TILE);
    const c0 = Math.floor(this.home / TILE);
    const r0 = Math.floor(this.hover / TILE);
    const r1 = Math.floor((this.hover + this.h) / TILE);
    // (un paratonnerre là où il flotte l'arrête aussi : il ne passe pas à travers sa plaque)
    const ok = (c) => {
      if (!isSolidCh(w.tileAt(c, r)) || isSolidCh(w.tileAt(c, r - 1))) return false;
      for (let k = r0; k <= r1; k++) if (isSolidCh(w.tileAt(c, k)) || w.tileAt(c, k) === 'z') return false;
      return true;
    };
    let a = c0;
    let b = c0;
    while (a > c0 - CLOUD.range && ok(a - 1)) a--;
    while (b < c0 + CLOUD.range && ok(b + 1)) b++;
    return { x0: a * TILE + TILE / 2, x1: b * TILE + TILE / 2 };
  }

  // Le toucher ne fait jamais mal (seule sa pluie mouille) : on le fait éclater (voir nudge).
  harmful() { return false; }

  // Le caramel, les chips et les tirs le touchent aussi sous lui, dans sa pluie (sinon, lancés de par terre, ils
  // passeraient dessous).
  shotBox() {
    return { x: this.x, y: this.y, w: this.w, h: Math.max(this.h, this.floor - 20 - this.y) };
  }

  // Malice marche sur son étage, pas trop loin ?
  sees(p) {
    if (p.dead || p.won) return false;
    const R = this.range;
    return Math.abs(p.groundY - this.floor) < 0.6 * TILE && p.cx > R.x0 - 3 * TILE && p.cx < R.x1 + 3 * TILE;
  }

  // Il n'ose pas pleuvoir pendant qu'une fleur parle (ni au début, ni à la reprise d'un drapeau).
  hush() {
    return this.calm > 0 || this.world.flowers.some((f) => f.show > 0.3 && Math.abs(f.x - this.cx) < 9 * TILE);
  }

  // Là où tombe sa pluie : son sol (ou un bloc, ou l'eau de la crue, juste sous lui).
  rainBottom() {
    return Math.min(this.floor, this.world.surfaceBelow(this.cx, this.y + this.h));
  }

  rainBox() {
    const top = this.y + this.h - 6;
    return { x: this.cx - CLOUD.rainW / 2, y: top, w: CLOUD.rainW, h: Math.max(0, this.rainBottom() - top) };
  }

  update(dt) {
    const w = this.world;
    this.t += dt;
    if (this.dying) {
      this.dieT += dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.dieT > 1.6) this.dead = true;
      return;
    }
    // l'eau de la crue a recouvert son sol : il s'en va, tout content (il n'a plus personne à mouiller)
    if (w.flood && w.flood.y < this.floor - TILE) {
      this.dying = true;
      this.deathType = 'away';
      this.dieT = 0.6;
      this.vx = 0;
      this.vy = -90;
      return;
    }
    if (this.stuck > 0) {
      // collé par le caramel : il ne bouge plus, il ne pleut plus
      this.stuck -= dt;
      this.vx = 0;
      this.state = 'idle';
      this.mood = approach(this.mood, 0, dt * 2);
      if (this.stuck <= 0) {
        Sound.sfx.unstuck();
        for (let i = 0; i < 6; i++) {
          w.spawn({ type: 'dot', x: this.cx, y: this.y + this.h - 8, vx: rand(-150, 150), vy: rand(-200, -60), g: 900, life: 0.5, size: 4, color: '#d98a2e' });
        }
        this.onUnstuck();
      }
    } else if (this.fat) {
      // le ventre plein de chips : trop lourd pour voler, il se pose par terre, tout essoufflé (il ne pleut plus)
      this.vx = 0;
      this.state = 'idle';
      this.mood = approach(this.mood, 0, dt * 2);
      this.y = approach(this.y, this.floor - this.h + 4, 70 * dt);
      this.restT += dt;
      this.pantT -= dt;
      if (this.pantT <= 0) {
        this.pantT = 0.6;
        if (w.onScreen(this) && this.restT < 4) Sound.sfx.pant();
      }
    } else {
      this.ai(dt);
    }
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const D = w.diff;
    const R = this.range;
    this.calm -= dt;
    this.timer -= dt;
    const sees = this.sees(p);
    let tx = this.home;
    let speed = D.cloudSpeed * 0.5;
    switch (this.state) {
      case 'idle':
        // il flotte chez lui, en grognant tout bas
        tx = this.home + Math.sin(this.t * 0.6) * TILE;
        if (sees && !this.hush()) this.state = 'follow';
        break;
      case 'follow':
        tx = p.cx;
        speed = D.cloudSpeed;
        if (!sees || this.hush()) this.state = 'idle';
        else if (Math.abs(p.cx - this.cx) < 20 && p.onGround && !p.tumbling()) this.brew();
        break;
      case 'brew':
        // il s'arrête, et devient tout noir : on a le temps de s'écarter, ou de sauter dedans
        tx = this.cx;
        speed = 0;
        if (this.timer <= 0) this.pour();
        break;
      case 'rain':
        tx = this.cx;
        speed = 0;
        this.soak(p);
        this.splashes(dt);
        if (this.timer <= 0) {
          this.state = 'empty';
          this.timer = rand(D.cloudRest[0], D.cloudRest[1]);
        }
        break;
      case 'empty':
        tx = sees ? p.cx : this.home;
        speed = D.cloudSpeed * 0.4;
        if (this.timer <= 0) this.state = sees ? 'follow' : 'idle';
        break;
      default: break;
    }
    tx = clamp(tx, R.x0, R.x1);
    this.vx = approach(this.vx, clamp((tx - this.cx) * 4, -speed, speed), 500 * dt);
    this.x = clamp(this.x + this.vx * dt, R.x0 - this.w / 2, R.x1 - this.w / 2);
    if (Math.abs(this.vx) > 8) this.dir = Math.sign(this.vx);
    this.y = this.hover + Math.sin(this.t * 2.2) * 4;
    const dark = this.state === 'brew' || this.state === 'rain';
    this.mood = approach(this.mood, dark ? 1 : 0, dt * (this.state === 'brew' ? 1.3 / D.cloudWarn : 2));
    this.empty = approach(this.empty, this.state === 'empty' ? 1 : 0, dt * 2.5);
    // il regarde Malice quand il la voit (sinon, devant lui)
    const dx = p.cx - this.cx;
    const dy = p.cy - this.cy;
    const d = Math.hypot(dx, dy) || 1;
    const lx = sees ? dx / d : this.dir * 0.6;
    const ly = sees ? dy / d : 0.3;
    this.look.x += (lx - this.look.x) * Math.min(1, dt * 6);
    this.look.y += (ly - this.look.y) * Math.min(1, dt * 6);
    // grrr… (de temps en temps, quand il la suit)
    this.grumbleT -= dt;
    if (this.grumbleT <= 0) {
      this.grumbleT = rand(2.5, 4.5);
      if (this.state === 'follow' && w.onScreen(this)) Sound.sfx.cloudGrumble();
    }
  }

  brew() {
    const w = this.world;
    this.state = 'brew';
    this.timer = w.diff.cloudWarn;
    this.vx = 0;
    if (w.onScreen(this)) Sound.sfx.cloudThunder();
    w.popText(this.cx, this.y - 8, 'Grrr !', '#c8c0e8', 20);
  }

  pour() {
    this.state = 'rain';
    this.timer = CLOUD.rain;
    if (this.world.onScreen(this)) Sound.sfx.cloudRain();
  }

  // Sa pluie tombe sur Malice : toute trempée ! (Gizmo devient un Gremlin, comme dans l'eau)
  soak(p) {
    const b = this.rainBox();
    if (p.dead || p.dive > 0 || b.h <= 0) return;
    if (!boxOverlap({ x: p.x + 3, y: p.y + 4, w: p.w - 6, h: p.h - 4 }, b.x, b.y, b.w, b.h)) return;
    const gremlin = !!p.pw.gremlin;
    if (!p.hurt(this, this.ouch)) return;
    if (p.ouch && p.ouch.kind === 'shake' && p.ouch.t === 0) p.soak = this.world.diff.soakTime;
    if (!gremlin && !p.dead && p.pow.splash) p.pow.splash(p);
  }

  // des gouttes qui éclaboussent par terre, sous la pluie
  splashes(dt) {
    const w = this.world;
    if (!w.onScreen(this, 120) || Math.random() > dt * 30) return;
    const y = this.rainBottom();
    const x = this.cx + rand(-CLOUD.rainW / 2, CLOUD.rainW / 2);
    w.spawn({ type: 'ring', x, y: y - 1, life: 0.22, size: rand(8, 14), color: 'rgba(220,240,255,0.8)', flat: true });
    w.spawn({ type: 'dot', x, y: y - 2, vx: rand(-60, 60), vy: rand(-140, -60), g: 900, life: 0.25, size: rand(1.2, 2), color: '#e4f2ff' });
  }

  onUnstuck() {
    this.state = 'idle';
    this.calm = 1;
  }

  stomp() { this.kill('stomp'); }

  // On le frôle, ou on saute dedans par en dessous : pouf !
  nudge() { this.kill('bump'); }

  // Pouf ! Il éclate de rire, devient tout blanc et tout gentil, et s'envole.
  kill(type) {
    if (this.dying) return;
    const w = this.world;
    super.kill(type);
    this.deathType = 'pouf';
    this.vx = 0;
    this.vy = -70;
    Sound.sfx.cloudPouf();
    w.popText(this.cx, this.y - 26, 'Hi hi hi !', '#ffffff', 20);
    for (let i = 0; i < 12; i++) {
      w.spawn({ type: 'spark', x: this.cx + rand(-26, 26), y: this.cy + rand(-14, 14), vx: rand(-160, 160), vy: rand(-160, 60), life: 0.6, size: rand(3, 6), color: `hsl(${i * 30},95%,72%)` });
    }
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'smoke', x: this.cx + rand(-24, 24), y: this.cy + rand(-10, 10), vx: rand(-80, 80), vy: rand(-60, 20), life: 0.5, size: rand(8, 13), color: '#ffffff' });
    }
  }

  draw(ctx) {
    const fade = this.dying ? clamp(1 - (this.dieT - 0.9) / 0.7, 0, 1) : 1;
    if (fade <= 0) return;
    const by = this.y + this.h;
    ctx.save();
    ctx.globalAlpha *= fade;
    const shake = this.state === 'brew' && !this.dying ? Math.sin(this.t * 50) * 1.2 * this.mood : 0;
    Art.grumpyCloud(ctx, this.cx + shake, by, {
      t: this.t, mood: this.mood, empty: this.empty, look: this.look, dir: this.dir,
      happy: this.dying ? clamp(this.dieT / 0.2, 0, 1) : 0, fat: this.fat && !this.dying, stuck: this.stuck > 0 && !this.dying,
    });
    if (this.stuck > 0 && !this.dying) {
      const blink = this.stuck < 2 && Math.floor(this.stuck * 8) % 2 === 0 ? 0.5 : 1;
      Art.caramelGoo(ctx, this.cx, by + 1, this.w * 0.9, 20, this.t, Math.min(1, this.stuck / 1.5) * blink);
    }
    ctx.restore();
  }

  // Son ombre par terre (elle fonce quand il va pleuvoir), et sa pluie : dessinées par-dessus Malice, pour qu'on les
  // voie bien (comme l'ombre des éclairs).
  drawWarning(ctx) {
    if (this.dying || this.stuck > 0 || this.fat) return;
    const w = this.world;
    if (!w.onScreen(this, 200)) return;
    const bottom = this.rainBottom();
    const k = this.mood;
    ctx.fillStyle = `rgba(40,30,80,${0.1 + 0.32 * k})`;
    ellipsePath(ctx, this.cx, bottom - 1, 20 + 10 * k, 4.5 + 2.5 * k);
    ctx.fill();
    if (this.state === 'brew' || this.state === 'rain') {
      Art.cloudRain(ctx, this.cx, this.y + this.h - 8, bottom, this.t, CLOUD.rainW, this.state === 'rain' ? 1 : 0.2 * k);
    }
  }
}

// Paratonnerre (le Phare sur la Falaise) : une plaque de métal (z : une plateforme qu'on traverse par dessous, comme
// une planche), avec sa pointe au milieu. De temps en temps, l'orage l'électrise. D'abord, ça s'annonce (rodWarn
// secondes) : un petit nuage en chocolat se forme au-dessus de la pointe et grossit en grondant, des étincelles
// sautent sur la pointe, puis sur la plaque, qui devient de plus en plus jaune, et un bourdonnement monte, de plus en
// plus vite (bzz… bzz… bzzbzzbzz), avec un « ! » qui clignote. Puis la foudre tombe sur la pointe, et la plaque
// grésille (rodZap secondes) : tout ce qui est dessus est électrocuté (Malice : OUCH.zap, comme avec les éclairs au
// chocolat ; les ennemis s'envolent). Il faut en descendre avant ! Le reste du temps (rodRest), on y est tranquille.
// Le bloc magique du Lutin, posé dessus, ne laisse pas passer l'électricité : debout sur le bloc, on est à l'abri.
// Chacun suit toujours le même rythme (on peut le guetter) ; numérotés de bas en haut, un sur deux est à contretemps :
// deux paratonnerres qui se suivent dans un escalier ne grésillent jamais en même temps.
// (w.diff : rodRest, rodWarn, rodZap, voir DIFFS dans game.js)
// ROD : tip (la hauteur de la pointe au-dessus de la plaque), cloud (celle du petit nuage), top / deep (la zone qui
// grésille, au-dessus et en dessous du dessus de la plaque : il suffit de sauter pour ne plus la toucher), hear (à
// combien de cases de Malice on l'entend bourdonner), fly (électrocutée, elle est projetée vers le haut à cette
// vitesse, et de côté assez fort pour retomber à côté de la plaque : voir eject), rise (en montant plus vite que ça,
// on ne touche pas la plaque : voir touches).
const ROD = { tip: 66, cloud: 142, top: 14, deep: 9, hear: 6, fly: 520, rise: -60 };

class LightningRod {
  // la plaque : les colonnes c0 à c1 de la rangée r ; k : son numéro, de bas en haut
  constructor(world, c0, c1, r, k) {
    this.world = world;
    this.c0 = c0;
    this.c1 = c1;
    this.x = c0 * TILE;
    this.w = (c1 - c0 + 1) * TILE;
    this.y = r * TILE;
    this.h = 16;
    this.mx = this.x + this.w / 2;
    this.k = k;
    // électrocutée, Malice est projetée loin d'un mur collé à la plaque (sinon, elle retomberait dessus) ; sinon, du
    // côté où elle retombe le plus haut (sur une planche, plutôt que tout en bas : voir landing) ; sinon, vers le bord
    // le plus proche (exit = 0)
    const wallR = isSolidCh(world.tileAt(c1 + 1, r - 1));
    const wallL = isSolidCh(world.tileAt(c0 - 1, r - 1));
    if (wallR || wallL) this.exit = wallR ? -1 : 1;
    else {
      const dl = this.landing(-1);
      const dr = this.landing(1);
      this.exit = dl < dr ? -1 : dr < dl ? 1 : 0;
    }
    this.state = 'rest';
    this.u = 0;
    this.humT = 0;
    this.crackT = 0;
    this.seed = hash(c0 * 7.7 + r * 3.1) * 100;
    // sous un palier (ou une planche), le petit nuage et la foudre sont cachés au-dessus : on ne les dessine que
    // sous lui (ceil : le bas de ce qui est au-dessus, à 4 rangées au plus) ; et si le petit nuage est plus haut que
    // ce bas, on ne le dessine pas du tout (coupé, ce serait une tache brune collée dessous : on ne voit que la
    // lueur et la foudre qui sortent de dessous)
    this.ceil = null;
    for (let k = r - 1; k >= r - 4 && this.ceil === null; k--) {
      for (let c = c0; c <= c1; c++) {
        const ch = world.tileAt(c, k);
        if (isSolidCh(ch) || isLedgeCh(ch)) this.ceil = (k + 1) * TILE;
      }
    }
    this.cloud = this.ceil === null || this.y - this.ceil >= ROD.cloud;
    this.update(0);
  }

  // où il en est : 'rest' (tranquille), 'warn' (ça s'annonce), 'zap' (ça grésille) ; u : de 0 à 1 dans cet état
  phase() {
    const D = this.world.diff;
    const period = D.rodRest + D.rodWarn + D.rodZap;
    const ph = (this.world.t + (this.k % 2) * period / 2) % period;
    if (ph < D.rodRest) return ['rest', ph / D.rodRest];
    if (ph < D.rodRest + D.rodWarn) return ['warn', (ph - D.rodRest) / D.rodWarn];
    return ['zap', (ph - D.rodRest - D.rodWarn) / D.rodZap];
  }

  // la zone qui grésille (seulement quand ça grésille) : juste au-dessus de la plaque
  box() {
    if (this.state !== 'zap') return null;
    return { x: this.x + 4, y: this.y - ROD.top, w: this.w - 8, h: ROD.top + ROD.deep };
  }

  // Malice a les pieds dessus pendant que ça grésille ? (pas en sautant : en montant, elle traverse la plaque par
  // dessous sans la toucher, comme une planche, et un saut suffit pour en descendre ; seulement debout dessus, ou
  // en retombant dessus)
  touches(p, pb) {
    const b = this.box();
    if (!b || p.vy < ROD.rise) return false;
    const feet = p.y + p.h;
    return pb.x < b.x + b.w && pb.x + pb.w > b.x && feet >= b.y && feet <= b.y + b.h;
  }

  // électrocutée, de quel côté elle est projetée (-1 : à gauche ; 1 : à droite ; voir exit)
  side(p) {
    return this.exit || Math.sign(p.cx - this.mx) || 1;
  }

  // où elle retomberait, projetée du côté d (le haut de ce qui est sous la case juste à côté de la plaque)
  landing(d) {
    return this.world.surfaceBelow(d > 0 ? this.x + this.w + TILE / 2 : this.x - TILE / 2, this.y);
  }

  // électrocutée : d'où vient le coup (elle est projetée de l'autre côté, voir side)
  pushFrom(p) {
    return { x: p.cx - this.side(p) * 10, w: 0 };
  }

  // Électrocutée (après son petit moment figée) : elle est projetée assez fort pour retomber à côté de la plaque,
  // pas dessus (ROD.fly : la vitesse vers le haut ; la vitesse de côté dépend d'où elle est sur la plaque).
  eject(p) {
    const d = this.side(p);
    const edge = d > 0 ? this.x + this.w : this.x;
    const dist = Math.max(0, (edge - p.cx) * d + p.w / 2 + 12);
    const vx = d * Math.max(OUCH.zap.vx, (dist + 90) / 0.45);
    if (p.stunT > 0) {
      p.stunVx = vx;
      p.stunVy = -ROD.fly;
    } else {
      p.vx = vx;
      p.vy = -ROD.fly;
    }
  }

  // Malice l'entend (il est à l'écran, et pas trop loin d'elle) ?
  heard() {
    const w = this.world;
    const p = w.player;
    return w.onScreen(this, 0) && Math.abs(p.cx - this.mx) < ROD.hear * TILE && Math.abs(p.y + p.h - this.y) < ROD.hear * TILE;
  }

  update(dt) {
    const w = this.world;
    const prev = this.state;
    [this.state, this.u] = this.phase();
    if (!dt) return;
    const seen = w.onScreen({ x: this.x, y: this.y - ROD.cloud - 40, w: this.w, h: ROD.cloud + 60 }, 40);
    if (this.state === 'warn') {
      // bzz… bzz… bzzbzzbzz : de plus en plus vite, de plus en plus aigu
      this.humT -= dt;
      if (this.humT <= 0) {
        this.humT = lerp(0.45, 0.11, this.u);
        if (this.heard()) Sound.sfx.rodHum(this.u);
      }
      if (seen) {
        // des étincelles sur la pointe (de plus en plus), puis sur la plaque
        if (Math.random() < dt * (4 + 22 * this.u)) {
          w.spawn({ type: 'spark', x: this.mx + rand(-4, 4), y: this.y - ROD.tip, vx: rand(-110, 110), vy: rand(-120, 40), life: 0.3, size: rand(2.5, 4.5), color: choose(['#fff59a', '#bff0ff']) });
        }
        if (this.u > 0.45 && Math.random() < dt * 16 * this.u) {
          w.spawn({ type: 'spark', x: rand(this.x + 6, this.x + this.w - 6), y: this.y, vx: rand(-60, 60), vy: rand(-140, -40), life: 0.25, size: rand(2, 3.5), color: choose(['#fff59a', '#bff0ff']) });
        }
      }
    } else {
      this.humT = 0;
    }
    if (this.state === 'zap') {
      if (prev !== 'zap') this.strike(seen);
      // ça grésille : tout ce qui est posé dessus s'envole (les ennemis aussi)
      const b = this.box();
      for (const e of w.enemies) {
        if (!e.dying && !e.dead && !e.boss && !(e instanceof Boss) && e.onGround && boxOverlap(e, b.x, b.y, b.w, b.h)) e.kill('zap');
      }
      this.crackT -= dt;
      if (this.crackT <= 0) {
        this.crackT = 0.16;
        if (this.heard()) Sound.sfx.rodCrackle();
      }
      if (seen && Math.random() < dt * 30) {
        w.spawn({ type: 'spark', x: rand(this.x + 4, this.x + this.w - 4), y: this.y - 2, vx: rand(-120, 120), vy: rand(-220, -60), g: 500, life: 0.35, size: rand(3, 5), color: choose(['#fff59a', '#ffffff', '#9fe6ff']) });
      }
    }
  }

  // la foudre tombe sur la pointe
  strike(seen) {
    const w = this.world;
    this.crackT = 0.16;
    if (!seen) return;
    if (this.heard()) {
      Sound.sfx.rodStrike();
      w.shake(3);
    }
    for (let i = 0; i < 12; i++) {
      w.spawn({ type: 'spark', x: this.mx, y: this.y - ROD.tip, vx: rand(-240, 240), vy: rand(-240, 80), g: 500, life: 0.45, size: rand(3, 6), color: choose(['#fff59a', '#ffffff', '#9fe6ff']) });
    }
  }

  draw(ctx) {
    const w = this.world;
    if (!w.onScreen({ x: this.x, y: this.y - ROD.cloud - 40, w: this.w, h: ROD.cloud + 70 }, 40)) return;
    Scenery.lightningRod(ctx, this.x, this.y, this.w, this.state, this.u, w.t, this.seed, w.diff.rodZap);
  }

  // le petit nuage et la foudre (derrière les cases : sous un palier, on ne voit que le bas de la foudre)
  drawSky(ctx) {
    if (this.state === 'rest') return;
    const w = this.world;
    if (!w.onScreen({ x: this.x, y: this.y - ROD.cloud - 40, w: this.w, h: ROD.cloud + 70 }, 40)) return;
    if (this.ceil !== null) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x - 120, this.ceil, this.w + 240, this.y - this.ceil);
      ctx.clip();
    }
    Scenery.lightningRodSky(ctx, this.x, this.y, this.w, this.state, this.u, w.t, this.seed, this.cloud);
    if (this.ceil !== null) ctx.restore();
  }

  // le « ! » qui clignote pendant que ça s'annonce (par-dessus Malice, pour qu'on le voie bien ; juste au-dessus de la
  // pointe : sous un palier, il reste sous le palier)
  drawWarning(ctx) {
    if (this.state !== 'warn' || Math.floor(this.world.t * (4 + 6 * this.u)) % 2) return;
    const x = this.mx;
    const y = this.y - 82;
    ctx.fillStyle = '#ffe94a';
    ctx.strokeStyle = '#7a2a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x + 15, y + 11);
    ctx.lineTo(x - 15, y + 11);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = '#7a2a00';
    ctx.font = '700 17px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', x, y + 3);
  }
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
// Avec le badge Bocal à éclairs (et de la place dans le bocal), Malice l'attrape (voir catches) : en tombant, s'il
// passe tout près d'elle (au-dessus de sa tête ou juste à côté : il tombe dans son bocal au lieu de grésiller) ;
// ou par terre, quand il a fini de grésiller (il refroidit, il ne fait plus mal : on le ramasse en le touchant ; avec
// le badge, il reste là plus longtemps, et il brille).
const ECLAIR_REST = 1.2;
const ECLAIR_REST_BOCAL = 2.8;
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
        this.long = w.game.hasBadge('bocal');
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
        this.timer = this.long ? ECLAIR_REST_BOCAL : ECLAIR_REST;
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
      const a = this.phase === 'rest' ? Math.max(0, Math.min(1, this.timer / ECLAIR_REST)) : 1;
      ctx.save();
      ctx.globalAlpha = a;
      if (this.phase === 'rest' && this.long) {
        // (avec le bocal : il brille doucement, on peut le ramasser)
        const k = 0.5 + 0.5 * Math.sin(this.t * 7);
        ctx.fillStyle = `rgba(255,240,140,${0.25 + 0.25 * k})`;
        ellipsePath(ctx, this.x, this.groundY - 8, 34 + k * 4, 14 + k * 2);
        ctx.fill();
      }
      Art.eclair(ctx, this.x, this.groundY - 8, 0, 1);
      ctx.restore();
      if (this.phase === 'zap') {
        const seed = Math.floor(this.t * 20) + this.seed;
        Art.sparks(ctx, this.x, this.groundY - 6, 72, seed, Math.min(1, this.timer * 3));
      }
    }
  }

  // Le bocal à éclairs : Malice (sa boîte pb) l'attrape-t-elle ? En tombant, tout près d'elle : de 40 pixels de chaque
  // côté, et jusqu'à 80 pixels au-dessus de sa tête (on n'a pas à viser juste, et il n'a jamais le temps de la
  // toucher) ; par terre, quand il ne grésille plus, en le touchant.
  catches(pb) {
    if (this.phase === 'fall') return boxOverlap(pb, this.x - 22 - 40, this.y - 9, 44 + 80, 18 + 80);
    if (this.phase === 'rest') return boxOverlap(pb, this.x - 28, this.groundY - 26, 56, 28);
    return false;
  }

  // Attrapé : il file dans le bocal (avec des étincelles), et il n'y a ni éclair par terre ni grésillement.
  caught(p) {
    const w = this.world;
    const g = w.game;
    const x = this.x;
    const y = this.phase === 'fall' ? this.y : this.groundY - 8;
    this.dead = true;
    g.bocal = Math.min(BOCAL_MAX, g.bocal + 1);
    g.bocalPop = 1;
    Sound.sfx.bocalCatch(g.bocal >= BOCAL_MAX);
    for (let i = 0; i < 8; i++) {
      const k = i / 8;
      w.spawn({ type: 'spark', x: x + (p.cx - x) * k, y: y + (p.cy - y) * k, vx: rand(-60, 60), vy: rand(-80, 0), life: 0.35, size: rand(3, 6), color: '#fff59a' });
    }
    w.popText(p.cx, p.y - 14, g.bocal >= BOCAL_MAX ? 'Bocal plein !' : `Éclair ${g.bocal}/${BOCAL_MAX}`, '#ffe08a', 22);
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
    if (!this.active && !p.dead && this.reached(p)) this.activate(true);
  }

  // Malice est passée par là : plus à droite que lui, à peu près à sa hauteur ; dans un niveau où l'on grimpe
  // ("grimpe"), dès qu'elle est debout sur son étage (n'importe où : on arrive souvent par l'autre bout), en le
  // touchant, ou si elle est déjà plus haut que son étage (elle est passée à côté). Mais sur le sol du départ (la
  // falaise du Phare), on marche comme dans un niveau ordinaire : seulement quand elle est passée.
  reached(p) {
    const feet = p.y + p.h;
    const w = this.world;
    if (w.def.grimpe && Math.abs(this.y - w.startFloor) > TILE / 2) {
      return (p.onGround && Math.abs(feet - this.y) < 50) ||
        (Math.abs(p.cx - this.x) < 70 && Math.abs(feet - this.y) < 90) || feet < this.y - 300;
    }
    return p.cx > this.x - 16 && Math.abs(feet - this.y) < 220;
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
    // (touch : l'arrivée qui apparaît après un boss, il faut aller la toucher ; dans un niveau où l'on grimpe,
    // il faut être à son étage, même pour la toucher : pas d'un étage du dessous, juste sous elle)
    const floor = !w.def.grimpe || Math.abs(p.y + p.h - this.y) < 2 * TILE;
    const at = this.touch ? Math.abs(p.cx - this.x - 10) < 34 && p.y + p.h > this.y - TILE * 5 && floor : p.cx >= this.x - 10 && floor;
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
    // dans un niveau où l'on grimpe, seulement depuis son étage (pas du dessous, à travers le plancher)
    const dy = this.world.def.grimpe ? (p.y + p.h - this.y <= 24 && this.y - p.cy < 200) : Math.abs(p.cy - this.y) < 200;
    // (sous l'eau de la Crue, elle ne parle plus)
    const near = Math.abs(p.cx - this.x) < 170 && dy && !(this.world.flood && this.y > this.world.flood.y);
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

// Une liane du Vieux Chêne (J) : elle pend du plafond d'un étage (du haut de la première case J), aussi longue
// que les J les uns sous les autres. Toute seule, elle ondule doucement ; on l'attrape en l'air en la touchant
// (voir Player.catchVine), elle suit Malice qui s'y balance (même physique que la moustache-grappin, voir
// Player.updateHanging), et quand on la lâche, elle continue de se balancer un moment.
class Vine {
  constructor(world, x, y, len) {
    this.world = world;
    // le haut de la liane (là où elle est accrochée), et sa longueur
    this.x = x;
    this.y = y;
    this.len = len;
    this.ang = 0;
    this.angV = 0;
    // (quand Malice s'y tient : la longueur jusqu'à ses mains)
    this.grip = 0;
    this.t = Math.random() * 6;
    this.v = hash(x * 0.37 + y * 0.11);
    this.pts = [];
  }

  // Malice, si elle s'y tient.
  holder() {
    const p = this.world.player;
    return p.grap && p.grap.vine === this && p.grap.phase === 'swing' ? p : null;
  }

  update(dt) {
    this.t += dt;
    const p = this.holder();
    if (p) {
      this.ang = p.grap.ang;
      this.angV = p.grap.angV;
      this.grip = p.grap.len;
      return;
    }
    this.grip = 0;
    // toute seule : elle revient pendre tout droit, poussée par un petit souffle d'air qui monte dans le tronc
    const g = (PHYS.gravity * 0.9) / this.len;
    this.angV += (-g * Math.sin(this.ang) - this.angV * 1.1 + Math.sin(this.t * 0.9 + this.v * 6) * 0.3) * dt;
    this.ang = clamp(this.ang + this.angV * dt, -1.2, 1.2);
  }

  // Malice (le haut de son corps en p.y, ses mains en p.y + gy) peut-elle l'attraper ? Renvoie la longueur de
  // liane jusqu'à ses mains (0 : non). On l'attrape de tout le corps, jusqu'à reach pixels de son milieu, et
  // même un peu sous le bout de la liane (elle remonte alors un tout petit peu).
  catchAt(p, gy, reach) {
    const s = Math.sin(this.ang);
    const c = Math.cos(this.ang);
    const y0 = Math.max(p.y - 20, this.y + VINE.min * c);
    const y1 = Math.min(p.y + p.h, this.y + this.len * c + 26);
    if (y0 > y1) return 0;
    const yy = clamp(p.y + gy, y0, y1);
    const x = this.x + ((yy - this.y) * s) / c;
    if (Math.abs(x - p.cx) > reach) return 0;
    return clamp(Math.hypot(p.cx - this.x, p.y + gy - this.y), VINE.min, this.len);
  }

  grabbed(p) {
    const w = this.world;
    Sound.sfx.vineGrab();
    const hx = p.cx;
    const hy = p.y + p.grap.hy;
    for (let i = 0; i < 4; i++) {
      w.spawn({ type: 'leaf', x: hx + rand(-10, 10), y: hy + rand(-14, 6), vx: rand(-60, 60), vy: rand(-90, -20), g: 160, drag: 1.5, life: 1.1, size: rand(0.6, 0.9), vr: rand(-5, 5), wob: rand(0, 6), color: choose(['#4fb84a', '#6fd25a', '#3a9e3e']) });
    }
  }

  // Malice la lâche (en sautant, ou avec ↓) : elle continue de se balancer toute seule.
  letGo(p, jump) {
    if (jump) Sound.sfx.vineLaunch();
    const w = this.world;
    for (let i = 0; i < 3; i++) {
      w.spawn({ type: 'leaf', x: p.cx + rand(-10, 10), y: p.y + rand(0, 20), vx: rand(-50, 50), vy: rand(-60, 0), g: 160, drag: 1.5, life: 1, size: rand(0.6, 0.8), vr: rand(-5, 5), wob: rand(0, 6), color: choose(['#4fb84a', '#6fd25a']) });
    }
  }

  // Les points de la liane, du haut jusqu'au bout (pour la dessiner). Toute seule, elle se courbe un peu
  // (le bas traîne derrière quand elle se balance, et ondule) ; tenue, elle est bien tendue jusqu'aux mains,
  // et le bout pend en dessous.
  points() {
    const pts = this.pts;
    pts.length = 0;
    const n = Math.max(4, Math.round(this.len / 12));
    const s = Math.sin(this.ang);
    const c = Math.cos(this.ang);
    if (this.grip > 0) {
      const gl = this.grip;
      const k = Math.max(2, Math.round((gl / this.len) * n));
      for (let i = 0; i <= k; i++) {
        const d = (gl * i) / k;
        const sag = Math.sin((Math.PI * i) / k) * 3;
        pts.push(this.x + d * s + sag * c, this.y + d * c - sag * s);
      }
      // le bout qui pend sous les mains : il part dans le sens de la liane, puis retombe tout droit
      const rest = this.len - gl;
      const hx = this.x + gl * s;
      const hy = this.y + gl * c;
      const m = Math.max(1, Math.round(rest / 12));
      let x = hx;
      let y = hy;
      for (let i = 1; i <= m && rest > 4; i++) {
        const f = i / m;
        const a = this.ang * (1 - f) * 0.7 - this.angV * 0.12 * f + Math.sin(this.t * 3 + i) * 0.08;
        x += Math.sin(a) * (rest / m);
        y += Math.cos(a) * (rest / m);
        pts.push(x, y);
      }
      return pts;
    }
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const d = this.len * f;
      // (le bas traîne un peu derrière le balancement, et ondule tout doucement)
      const off = -this.angV * 9 * f * f + Math.sin(this.t * 1.7 + f * 3 + this.v * 5) * 2.2 * f;
      pts.push(this.x + d * s + off * c, this.y + d * c - off * s);
    }
    return pts;
  }

  draw(ctx) {
    Scenery.vine(ctx, this.points(), this.t, this.v, this.grip > 0);
  }
}

// Un écureuil du Vieux Chêne (q), dans le décor : il grignote un gland, assis devant son trou dans le bois.
// Quand Malice arrive tout près, il file dans son trou… puis il ressort la tête pour voir si elle est partie,
// et revient s'asseoir. Il ne touche à rien.
class Squirrel {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    // (il regarde vers le milieu du tronc)
    this.dir = 1;
    // de 0 (dans son trou) à 1 (assis devant)
    this.out = 1;
    this.calm = 0;
    this.scared = false;
    this.t = rand(0, 6);
    this.v = Math.random();
  }

  update(dt) {
    const p = this.world.player;
    this.t += dt;
    const near = !p.dead && Math.abs(p.cx - this.x) < 140 && Math.abs(p.y + p.h - this.y) < 110;
    if (near) {
      if (!this.scared && this.out > 0.5 && this.world.onScreen(this, 0)) Sound.sfx.squirrel();
      this.scared = true;
      this.calm = rand(1.6, 2.6);
    } else if (this.calm > 0) {
      this.calm -= dt;
      if (this.calm <= 0) this.scared = false;
    }
    // il file d'un coup, et ressort tout doucement (d'abord la tête)
    this.out = approach(this.out, this.scared ? 0 : 1, dt * (this.scared ? 6 : 0.9));
    if (!near && Math.abs(p.cx - this.x) < 400) this.dir = p.cx < this.x ? -1 : 1;
  }

  draw(ctx) {
    Art.squirrel(ctx, this.x, this.y, { t: this.t, out: this.out, dir: this.dir, v: this.v });
  }
}

// Un nid dans le Vieux Chêne (k), dans le décor : des oisillons qui dorment ; quand Malice passe tout près, ils
// sortent la tête et ouvrent grand le bec en piaillant (ils croient que c'est leur maman !).
class Nest {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.up = 0;
    this.t = rand(0, 6);
    this.chirpT = 0;
    this.v = Math.random();
  }

  update(dt) {
    const p = this.world.player;
    this.t += dt;
    const near = !p.dead && Math.abs(p.cx - this.x) < 170 && Math.abs(p.y + p.h - this.y) < 140;
    this.up = approach(this.up, near ? 1 : 0, dt * (near ? 4 : 1.2));
    this.chirpT -= dt;
    if (near && this.up > 0.6 && this.chirpT <= 0) {
      this.chirpT = rand(0.7, 1.3);
      Sound.sfx.chirp();
    }
  }

  draw(ctx) {
    Art.nest(ctx, this.x, this.y, { t: this.t, up: this.up, v: this.v });
  }
}

// Le nid secret (p), caché tout en haut d'un arbre (voir "cachette" dans levels.js) : un petit oisillon vert de la
// forêt (un cousin du bébé oiseau !) y fait la sieste. Quand Malice arrive tout près, il se réveille et sautille de
// joie ; quand elle le touche, il s'envole lui faire un câlin… et lui donne une vie en plus. Une seule fois par
// niveau, même si elle perd une vie et revient (comme l'œil bonbon : voir Game.caughtEyes). Et la vie, une seule fois
// en tout (gardé dans la sauvegarde, "nids") : quand on rejoue le stage, il fait encore un câlin (les cœurs à fond, des
// points), mais sans vie en plus.
const NEST_COLORS = { light: '#c8f5a0', mid: '#6fcf4a', dark: '#2f9a3a', wing: '#3fae4a', tuft: '#2f8a3a' };

class SecretNest {
  constructor(world, x, y, key) {
    this.world = world;
    this.x = x;
    this.y = y;
    this.key = 'nid:' + key;
    this.given = world.game.caughtEyes.has(this.key);
    this.saveKey = world.def.key + ':' + key;
    this.up = 0;
    this.t = rand(0, 6);
    this.chirpT = 0;
    // le câlin : le temps depuis qu'il s'est envolé (-1 : pas encore), et où il vole
    this.hug = -1;
    this.bx = x;
    this.by = y;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    const dx = p.cx - this.x;
    const dy = p.y + p.h - this.y;
    const near = !p.dead && Math.abs(dx) < 160 && Math.abs(dy) < 130;
    // (de plus loin, tant qu'il n'a pas eu de visite : sur les branches en dessous, on l'entend piailler de temps en
    // temps, pour donner envie de monter voir)
    const hear = !p.dead && !this.given && Math.abs(dx) < 330 && dy > -60 && dy < 430;
    this.up = approach(this.up, near ? 1 : 0, dt * (near ? 4 : 1.2));
    this.chirpT -= dt;
    if ((near || hear) && this.chirpT <= 0 && this.hug < 0 && (this.up > 0.6 || !near)) {
      this.chirpT = near ? rand(0.6, 1.1) : rand(1.6, 2.6);
      Sound.sfx.chirp();
    }
    // Malice le touche (même un peu à côté) : il s'envole vers elle
    if (!this.given && this.hug < 0 && !p.dead && Math.abs(dx) < 46 && Math.abs(dy) < 60) {
      this.hug = 0;
      this.given = true;
      w.game.caughtEyes.add(this.key);
    }
    if (this.hug < 0) return;
    this.hug += dt;
    // il vole jusqu'à la tête de Malice, tourne un peu autour d'elle en battant des ailes, puis rentre au nid
    const k = this.hug;
    let tx = this.x;
    let ty = this.y - 18;
    if (k < 2.6) {
      tx = p.cx + Math.sin(k * 5) * 26;
      ty = p.y - 22 + Math.cos(k * 5) * 8;
    }
    const f = Math.min(1, dt * (k < 2.6 ? 9 : 5));
    this.bx += (tx - this.bx) * f;
    this.by += (ty - this.by) * f;
    if (k - dt < 0.7 && k >= 0.7) this.gift();
    if (k > 0.7 && k < 3) w.bubble(this.bx, this.by - 40, w.game.textFor('Cui-cui\u00a0! Merci d\'être montée jusqu\'ici, Malice\u00a0!'), 1);
    if (k > 4) this.hug = 99;
  }

  // le câlin : une vie en plus (ou tous ses cœurs, quand les vies sont infinies), et plein de petits cœurs
  // (la vie, une seule fois par sauvegarde ; ensuite, seulement les cœurs à fond)
  gift() {
    const w = this.world;
    const p = w.player;
    const game = w.game;
    p.heal(game.energyMax);
    const nids = Array.isArray(game.save.nids) ? game.save.nids : (game.save.nids = []);
    if (!nids.includes(this.saveKey)) {
      nids.push(this.saveKey);
      Save.save(game.save);
      game.extraLife(p.cx, p.y - 30);
    } else {
      w.popText(p.cx, p.y - 30, 'Cœurs à fond !', '#ff7ab8', 24);
    }
    game.addScore(500);
    Sound.sfx.nestHug();
    for (let i = 0; i < 10; i++) {
      w.spawn({ type: 'heart', x: p.cx + rand(-18, 18), y: p.y + 10, vy: rand(-170, -60), vx: rand(-70, 70), life: 1.1, size: 1 });
    }
  }

  draw(ctx) {
    const flying = this.hug >= 0 && this.hug < 4;
    if (!flying) {
      Art.babyBird(ctx, this.x, this.y, this.t, { colors: NEST_COLORS, happy: this.up > 0.6, chirp: this.up > 0.6 && Math.sin(this.t * 9) > 0 });
      if (this.up < 0.2) {
        // zzz…
        const k = (this.t * 0.6) % 1;
        ctx.save();
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Fredoka, sans-serif';
        ctx.fillText('z', this.x + 14 + k * 8, this.y - 40 - k * 14);
        ctx.restore();
      }
      return;
    }
    // le nid tout vide, et l'oisillon qui vole autour de Malice
    Art.babyBird(ctx, this.x, this.y, this.t, { colors: NEST_COLORS, onlyNest: true });
    Art.babyBird(ctx, this.bx, this.by + 18, this.t, { colors: NEST_COLORS, noNest: true, happy: true, chirp: Math.sin(this.t * 12) > 0 });
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
