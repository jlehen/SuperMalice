'use strict';

// =====================================================================
//  L'ÉPOUVANTAIL : le boss de la Prairie (au bout de la Prairie la Nuit, le 1-4)
//  Il garde son champ de citrouilles, sous la lune, perché sur son piquet.
//  Quand Malice arrive, ses yeux s'allument et ses corbeaux s'envolent de son chapeau.
//   - Il arrache une citrouille du sol et la lève derrière lui (on la voit briller)… puis il la lance :
//     elle roule vers Malice. On saute par-dessus (ou dessus : crac !).
//   - Ses corbeaux tournent dans le ciel ; un corbeau s'arrête et croasse… puis il plonge là où est Malice.
//     On s'écarte, ou on lui saute dessus : il s'enfuit, puis revient.
//   - Le caramel colle ses bras : il ne peut plus rien lancer et s'affaisse. Vite, on lui saute sur le chapeau !
//     (avec les chips, il a trop soif : il s'affaisse aussi ; et les pouvoirs qui renversent le touchent aussi.)
//   - À chaque coup : bonk, la paille vole, son chapeau saute et s'abîme, il fait la grimace… puis il se fâche,
//     saute plus loin sur son piquet, et lance plus vite. Au bout de trois coups, il s'effondre en un tas de
//     paille rigolo, redevient gentil, fait coucou, et ses citrouilles sont pleines de bonbons.
//  Il y a toujours du caramel sur la souche au bord du champ : il repousse quand on n'en a presque plus.
// =====================================================================

// Sa boîte : la largeur de son corps, et sa hauteur (des pieds au haut de la tête, sans le chapeau).
const SCARE_W = 52;
const SCARE_H = 160;

class Epouvantail extends Boss {
  // x : le milieu de ses pieds, y : le sol
  constructor(world, x, y) {
    super(world, x - SCARE_W / 2, y - SCARE_H, SCARE_W, SCARE_H, {
      name: 'L\'Épouvantail', song: 'boss-prairie', life: 3, intro: 2.8, introShort: 1.2,
    });
    this.ouch = 'ko'; // un coup de piquet : bong ! (voir OUCH)
    this.groundY = y;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.dir = -1;
    this.home = x;
    // ce qu'il fait pendant le combat : idle, lift (il lève une citrouille), throw, glued, ouch, angry, hop
    this.act = 'idle';
    this.actT = 0;
    this.timer = 0;
    this.toThrow = 0;
    this.hopTo = x;
    this.landT = 0;
    this.glue = null;
    this.glueT = 0;
    this.slump = 0;
    this.eyes = 0;
    this.headK = 0;
    this.back = 0.15;
    this.front = 0.15;
    this.held = false;
    this.grimace = 0;
    this.squash = 0;
    this.wobble = 0;
    this.hatPop = 0;
    this.hat = null;
    this.pile = 0;
    this.crows = [];
    this.crowT = 0;
    this.cycles = 0;
    this.glues = 0;
    this.hinted = 0;
    this.bonkT = 0;
    this.patch = 3;
  }

  setup() {
    super.setup();
    const w = this.world;
    const A = this.arena;
    // ses deux places : chez lui (au bout du champ) et au milieu du champ
    this.mid = Math.floor((A.x0 + A.x1) / 2 / TILE - 1) * TILE + TILE / 2;
    // ses corbeaux dorment sur son chapeau (deux en Bébé)
    const n = this.k < 0.9 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const c = new ScareCrow(w, this, i);
      this.crows.push(c);
      w.enemies.push(c);
    }
    // le caramel, sur la souche au bord du champ (il repousse quand on n'en a presque plus)
    this.addSource('caramel', A.x0 + 2.5 * TILE, this.groundY - 16);
  }

  // ---------- Avant et pendant le réveil ----------
  asleep() {
    this.eyes = 0;
    this.headK = 0;
  }

  wake(dt, k) {
    const w = this.world;
    const p = w.player;
    // il relève la tête, ses yeux s'allument (en clignotant un peu), et il se tourne vers Malice
    this.headK = approach(this.headK, k > 0.12 ? 1 : 0, dt * 2.5);
    this.eyes = k < 0.2 ? 0 : k < 0.32 ? (Math.floor(this.stateT * 18) % 2) * 0.8 : approach(this.eyes, 1, dt * 4);
    this.wobble = Math.sin(this.t * 22) * 0.025 * (k > 0.1 && k < 0.4 ? 1 : 0);
    if (k > 0.3) this.face(p);
    if (k > 0.12 && this.once('wake')) {
      Sound.sfx.scareWake();
      Sound.sfx.cornRustle();
    }
    // ses corbeaux s'envolent de son chapeau
    if (k > 0.35 && this.once('crows')) {
      Sound.sfx.caw();
      this.crows.forEach((c) => c.takeOff());
    }
    if (k > 0.42 && this.once('say')) this.speak(this.short ? 'Encore toi ?!' : 'Qui ose entrer dans MON champ ?', this.short ? 1.4 : 2.2);
    if (k >= 1) {
      this.act = 'idle';
      this.actT = 0;
      this.timer = 0.9 / this.k;
      this.crowT = 2.4 / this.k;
    }
  }

  // ---------- Le combat ----------
  fight(dt) {
    const w = this.world;
    const p = w.player;
    const K = this.k;
    this.actT += dt;
    this.updateCrows(dt);
    if (this.bonkT > 0) this.bonkT -= dt;
    if (this.landT > 0) this.landT -= dt;
    this.grimace = approach(this.grimace, 0, dt * 0.9);
    this.hatPop = approach(this.hatPop, 0, dt * 2.2);
    this.squash = approach(this.squash, 0, dt * 4);
    this.wobble *= Math.pow(0.02, dt);
    this.eyes = approach(this.eyes, this.act === 'glued' ? 0.45 : 1, dt * 3);
    this.slump = approach(this.slump, this.act === 'glued' ? 1 : 0, dt * (this.act === 'glued' ? 5 : 2.5));
    // (collé en plein saut, il retombe)
    if (this.act !== 'hop' && this.py < this.groundY) {
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      this.py = Math.min(this.groundY, this.py + this.vy * dt);
      if (this.py >= this.groundY) this.land();
    }
    switch (this.act) {
      case 'idle':
        this.face(p);
        this.armsRest(dt);
        this.timer -= dt;
        // (pas quand Malice est derrière lui contre le bord : elle est en train d'être poussée vers le milieu)
        if (this.timer <= 0 && this.grace <= 0 && !this.cornered(p)) this.startLift();
        break;
      case 'lift': {
        // il se penche, arrache une citrouille du sol derrière lui, et la lève bien haut : attention, elle arrive !
        const dur = this.liftTime();
        const k = this.actT / dur;
        if (k < 0.35) {
          this.back = lerp(0.15, 1.35, k / 0.35);
        } else {
          if (!this.held) {
            this.held = true;
            Sound.sfx.pumpkinPull();
            const h = this.handPos(-1, 1.35);
            for (let i = 0; i < 8; i++) {
              w.spawn({ type: 'debris', x: h.x + rand(-12, 12), y: this.groundY - 4, vx: rand(-120, 120), vy: rand(-380, -160), g: 1600, life: 0.6, size: rand(4, 7), color: choose(['#6a4024', '#8a5a34', '#4f8a2e']), vr: rand(-8, 8) });
            }
          }
          this.back = lerp(1.35, -1.25, Math.min(1, (k - 0.35) / 0.5));
        }
        this.front = approach(this.front, -0.25, dt * 3);
        this.wobble = Math.sin(this.t * 30) * 0.01 * k;
        if (this.actT >= dur) this.startThrow();
        break;
      }
      case 'throw':
        // le bras passe par-dessus sa tête, et la citrouille part
        this.back = lerp(-1.25, -2.7, Math.min(1, this.actT / 0.16));
        if (this.held && this.actT >= 0.12) this.release();
        if (this.actT > 0.4) {
          this.toThrow--;
          this.act = 'idle';
          this.actT = 0;
          if (this.toThrow > 0) {
            this.timer = 0.4 / K;
          } else {
            this.timer = (1.8 - 0.3 * this.phase) / K;
            this.cycles++;
          }
        }
        break;
      case 'glued': {
        // collé : les bras le long du corps, il gigote (de plus en plus quand ça va se décoller)
        const end = this.glueT < 1.6;
        this.back = approach(this.back, 1.45, dt * 6);
        this.front = approach(this.front, 1.45, dt * 6);
        this.wobble = Math.sin(this.t * (end ? 26 : 9)) * (end ? 0.05 : 0.025);
        this.glueT -= dt;
        if (this.glueT <= 0) this.unglue();
        // (un petit coup de pouce : Malice qui retombe juste à côté de son chapeau glisse dessus)
        if (this.slump > 0.5 && !p.onGround && p.vy > 0 && p.y + p.h < this.y + 20 && Math.abs(p.cx - this.px) < 100) {
          p.x += clamp(this.px - p.cx, -1, 1) * 190 * dt;
        }
        break;
      }
      case 'ouch':
        // bonk ! les bras qui battent l'air
        this.back = 0.3 + Math.sin(this.t * 24) * 0.9;
        this.front = 0.3 - Math.sin(this.t * 24) * 0.9;
        this.wobble = Math.sin(this.t * 16) * 0.12 * Math.max(0, 1 - this.actT / 1.2);
        if (this.recover <= 0) this.startAngry();
        break;
      case 'angry':
        // il se fâche : il tape du piquet, les poings en l'air
        this.face(p);
        this.back = -1.0 + Math.sin(this.t * 20) * 0.35;
        this.front = -1.0 - Math.sin(this.t * 20) * 0.35;
        this.squash = Math.abs(Math.sin(this.actT * 9)) * 0.6;
        if (this.actT > 0.9 / K) this.startHop();
        break;
      case 'hop': {
        // il se ramasse… puis saute sur son piquet jusqu'à son autre place
        const crouch = 0.35 / K;
        this.armsRest(dt);
        if (this.actT < crouch) {
          this.squash = Math.min(1, this.actT / crouch);
        } else {
          if (this.vy === 0 && this.py >= this.groundY) {
            const air = 0.72;
            this.vy = -PHYS.gravity * air / 2;
            this.vx = (this.hopTo - this.px) / air;
            Sound.sfx.boing(false);
          }
          this.vy += PHYS.gravity * dt;
          this.px += this.vx * dt;
          this.py += this.vy * dt;
          if (this.vy > 0 && this.py >= this.groundY) {
            this.py = this.groundY;
            this.px = this.hopTo;
            this.land();
            this.act = 'idle';
            this.actT = 0;
            this.timer = 0.8 / K;
            this.face(p);
          }
        }
        break;
      }
      default: break;
    }
    this.advise();
  }

  liftTime() {
    // (la deuxième citrouille d'une volée arrive un peu plus vite)
    const second = this.toThrow < this.volley();
    return ((0.95 - 0.1 * this.phase) / this.k) * (second ? 0.75 : 1);
  }

  volley() { return this.phase >= 1 ? 2 : 1; }

  startLift() {
    if (this.toThrow <= 0) this.toThrow = this.volley();
    this.act = 'lift';
    this.actT = 0;
  }

  startThrow() {
    this.act = 'throw';
    this.actT = 0;
    Sound.sfx.pumpkinThrow();
  }

  // la citrouille part de sa main, vers Malice, et roule
  release() {
    const w = this.world;
    this.held = false;
    const h = this.handPos(-1, -2.4);
    const roll = 205 * this.k * (1 + 0.12 * this.phase);
    w.enemies.push(new ScarePumpkin(w, this, h.x, h.y - 6, this.dir * 190 * this.k, -260, roll));
  }

  land() {
    const w = this.world;
    this.vy = 0;
    this.vx = 0;
    this.landT = 0.45;
    this.squash = 0.8;
    w.shake(5);
    Sound.sfx.pumpkinThud();
    for (let i = 0; i < 10; i++) {
      w.spawn({ type: 'dust', x: this.px + rand(-30, 30), y: this.groundY, vx: rand(-160, 160), vy: rand(-90, -20), life: 0.5, size: rand(5, 9) });
    }
    // (il ne retombe jamais sur Malice : il l'écarte doucement)
    this.box();
    this.shoo();
  }

  armsRest(dt) {
    this.back = approach(this.back, 0.15, dt * 5);
    this.front = approach(this.front, 0.15, dt * 5);
  }

  face(p) {
    if (Math.abs(p.cx - this.px) > 12) this.dir = Math.sign(p.cx - this.px);
  }

  // ---------- Le caramel et les chips ----------
  shot(kind) {
    const w = this.world;
    if (this.recover > 0 || this.act === 'glued' || this.act === 'ouch') return;
    // tout agité (il se fâche, il saute), ses bras battent l'air : ça ne colle pas
    if (this.act === 'angry' || this.act === 'hop') {
      if (this.bonkT <= 0) w.popText(this.px, this.groundY - 175, 'Raté !', '#ffe0a8', 20);
      this.bonkT = 0.6;
      return;
    }
    this.act = 'glued';
    this.actT = 0;
    this.glue = kind;
    this.glueT = w.diff.forever ? Infinity : 6 / this.k;
    this.cycles = 0;
    this.glues++;
    this.tip = null;
    // la citrouille qu'il tenait lui échappe : plof !
    if (this.held) {
      this.held = false;
      const h = this.handPos(-1, this.back);
      ScarePumpkin.burst(w, h.x, Math.min(h.y, this.groundY - 20), false);
    }
    // les corbeaux qui allaient plonger reviennent l'aider… mais ils ne savent pas décoller le caramel
    for (const c of this.crows) {
      if (c.state === 'caw') c.state = 'circle';
    }
    if (kind === 'caramel') {
      Sound.sfx.stick();
      w.popText(this.px, this.groundY - 175, 'Collé !', '#ffcf6a', 26);
      this.speak('Oh non ! Mes bras collent !', 1.6);
    } else {
      Sound.sfx.crunch();
      Sound.sfx.fat();
      w.popText(this.px, this.groundY - 175, 'Miam !', '#b6ff7a', 26);
      this.speak('Des chips ? Miam… Oh, j\'ai trop soif !', 1.8);
    }
  }

  unglue() {
    const w = this.world;
    Sound.sfx.unstuck();
    if (this.glue === 'caramel') {
      for (let i = 0; i < 10; i++) {
        w.spawn({ type: 'dot', x: this.px + rand(-30, 30), y: this.groundY - rand(60, 100), vx: rand(-220, 220), vy: rand(-300, -80), g: 1100, life: 0.6, size: rand(3, 5), color: '#d98a2e' });
      }
    }
    this.glue = null;
    this.startAngry();
  }

  takes() {
    return this.act === 'glued' && this.slump > 0.5;
  }

  // ---------- Les coups ----------
  onHit() {
    const w = this.world;
    this.act = 'ouch';
    this.actT = 0;
    this.glue = null;
    this.held = false;
    this.toThrow = 0;
    this.grimace = 1;
    this.hatPop = 1;
    this.cycles = 0;
    this.strawBurst(16);
    Sound.sfx.scareHit();
    w.popText(this.px, this.groundY - 190, 'Bonk !', '#ffe27a', 30);
    w.popText(this.px - this.dir * 70, this.groundY - 120, this.phase === 1 ? 'Aïe, mon chapeau !' : 'Ouille, ma paille !', '#ffe0a8', 20);
  }

  onBounce() {
    const w = this.world;
    Sound.sfx.boing(false);
    if (this.bonkT > 0) return;
    this.bonkT = 1.2;
    this.hatPop = Math.max(this.hatPop, 0.5);
    if (this.state === 'fight' && this.act !== 'ouch') w.popText(this.px, this.groundY - 190, 'Hé, mon chapeau !', '#ffe0a8', 20);
    else if (this.state === 'friend') w.popText(this.px, this.groundY - 90, 'Hi hi, ça chatouille !', '#ffe0a8', 20);
  }

  startAngry() {
    const w = this.world;
    this.act = 'angry';
    this.actT = 0;
    this.box();
    this.shoo();
    Sound.sfx.caw();
    for (const c of this.crows) {
      if (c.state === 'circle') w.popText(c.cx, c.y - 6, 'Croâ !', '#d6c8ff', 16);
    }
  }

  startHop() {
    // au milieu du champ après le premier coup, chez lui après le deuxième (s'il y est déjà, il ne bouge pas)
    this.act = 'hop';
    this.actT = 0;
    this.vy = 0;
    this.hopTo = [this.px, this.mid, this.home][this.phase] ?? this.px;
    if (Math.abs(this.hopTo - this.px) < 10) {
      this.act = 'idle';
      this.timer = 0.6 / this.k;
    } else {
      this.dir = Math.sign(this.hopTo - this.px);
    }
  }

  dangerous() {
    return this.act !== 'glued' && this.act !== 'hop' && this.landT <= 0;
  }

  strawBurst(n) {
    const w = this.world;
    for (let i = 0; i < n; i++) {
      w.spawn({
        type: 'straw', x: this.px + rand(-24, 24), y: this.groundY - rand(70, 140), vx: rand(-260, 260), vy: rand(-460, -120),
        g: 900, drag: 1.5, life: rand(0.8, 1.3), size: rand(7, 12), vr: rand(-10, 10), color: choose(['#f2c94c', '#e0b23a', '#ffe08a']),
      });
    }
  }

  // ---------- La fin ----------
  onBeaten() {
    const w = this.world;
    this.act = 'fall';
    this.glue = null;
    this.held = false;
    this.grimace = 1;
    this.say = null;
    // son chapeau s'envole
    const h = this.toWorld(0, -150);
    this.hat = { x: h.x, y: h.y, vx: -this.dir * 60, vy: -700, rot: 0, vr: -this.dir * 7, on: false };
    this.strawBurst(28);
    Sound.sfx.scareHit();
    Sound.sfx.scareFall();
    w.popText(this.px, this.groundY - 200, 'BONK !', '#ffe27a', 36);
  }

  outro(dt, t) {
    const w = this.world;
    // (touché en retombant d'un saut : il finit de retomber)
    if (this.py < this.groundY) {
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      this.py = Math.min(this.groundY, this.py + this.vy * dt);
    }
    // il tourne de l'œil en vacillant…
    if (t < 0.9) this.wobble = Math.sin(t * 14) * 0.2 * (1 - t / 0.9);
    else this.wobble = 0;
    this.slump = approach(this.slump, 0, dt * 3);
    this.eyes = approach(this.eyes, 0, dt * 2);
    // …puis il s'effondre en un gros tas de paille
    if (t > 0.9) this.pile = Math.min(1, (t - 0.9) / 0.5);
    if (t > 1.4 && this.once('pouf')) {
      this.strawBurst(22);
      w.puff(this.px, this.groundY - 20, '#ffe9a8');
      w.shake(5);
      this.grimace = 0;
    }
    // son chapeau retombe sur sa tête
    // (il monte tout haut en tournant, puis redescend tout droit sur sa tête, posée sur le tas)
    const H = this.hat;
    if (H && !H.on) {
      const top = { x: this.px + this.dir * 2, y: this.groundY - 62 };
      H.vy += 900 * dt;
      H.x += H.vx * dt;
      H.y += H.vy * dt;
      H.rot += H.vr * dt;
      if (H.vy > 0) {
        H.x = lerp(H.x, top.x, Math.min(1, dt * 4));
        H.rot = lerp(H.rot, -0.08 * this.dir, Math.min(1, dt * 5));
      }
      if (H.vy > 0 && H.y >= top.y) {
        H.on = true;
        H.x = top.x;
        H.y = top.y;
        H.rot = -0.08 * this.dir;
        Sound.sfx.boing(false);
        w.spawn({ type: 'ring', x: H.x, y: H.y, life: 0.3, size: 40, color: 'rgba(255,240,180,0.8)' });
      }
    }
    // il redevient gentil, et fait coucou
    if (t > 1.9 && this.once('friend')) {
      Sound.sfx.scareFriend();
      this.speak('Pardon ! Je voulais juste garder mes citrouilles…', 2.4);
    }
    // ses citrouilles sont pleines de bonbons !
    if (t > 2.5 && this.patch > 0 && t > 2.5 + (3 - this.patch) * 0.25) {
      const x = this.patchX(3 - this.patch);
      this.patch--;
      ScarePumpkin.burst(w, x, this.groundY - 16, false);
      for (let i = 0; i < 4; i++) {
        w.spawn({ type: 'candy', x, y: this.groundY - 20, vx: rand(-140, 140), vy: rand(-560, -380), g: 1400, life: 0.75, size: 1, v: i });
      }
      w.game.addCandies(5, x, this.groundY - 60);
    }
    return t > 3.6;
  }

  // (une fois battu) il reste là, tout content, et dit au revoir
  after(dt) {
    const p = this.world.player;
    if (Math.abs(p.cx - this.px) < 220 && this.once('bye')) this.speak('Merci, Malice ! Bonne nuit !', 2.4);
  }

  // Les petits conseils : s'il lance ses citrouilles depuis un moment sans être collé, on rappelle le caramel ;
  // s'il est collé depuis un moment (en Bébé, il le reste), on dit quoi faire.
  advise() {
    const g = this.world.game;
    if (this.tip && this.tip.t > 0) return;
    if (this.act === 'glued' && this.actT > 3 && this.once('glued' + this.glues + ':' + Math.floor((this.actT - 3) / 8))) {
      this.hint('Vite, saute sur son chapeau !', 3);
    } else if (this.cycles >= (this.hinted ? 4 : 2) && this.act === 'idle') {
      this.cycles = 0;
      this.hinted++;
      this.hint(g.caramel > 0
        ? 'Le caramel colle ses bras ! Approche-toi et lance-lui du caramel avec {CARAMEL} !'
        : 'Prends le caramel sur la souche, puis lance-le sur l\'Épouvantail !');
    }
  }

  // ---------- Ses corbeaux ----------
  // Un seul corbeau plonge à la fois, quand il ne lance pas de citrouille (plus souvent à chaque coup)
  // (au début, et toujours en Bébé, ils attendent aussi que les citrouilles aient fini de rouler)
  updateCrows(dt) {
    this.crowT -= dt;
    const busy = this.crows.some((c) => c.state === 'caw' || c.state === 'dive');
    const calm = this.act === 'idle' || (this.phase >= 2 && this.act === 'lift');
    const rolling = (this.phase === 0 || this.k < 0.9) && this.world.enemies.some((e) => e instanceof ScarePumpkin && !e.dead);
    if (this.crowT > 0 || busy || !calm || rolling) return;
    const free = this.crows.filter((c) => c.state === 'circle' && c.stuck <= 0 && !c.dead);
    if (!free.length) return;
    choose(free).caw();
    this.crowT = (3.8 - 0.7 * this.phase) / this.k;
  }

  // Où sont posés ses corbeaux sur son chapeau (au début) : deux sur le bord, un sur la pointe.
  perch(i) {
    const P = [[-30, -150], [30, -151], [-20, -201]];
    const [x, y] = P[i % 3];
    return this.toWorld(x, y);
  }

  // ---------- Positions ----------
  // un point de son dessin (x vers l'avant, y depuis les pieds) dans le monde (sans le vacillement) ;
  // les points de la tête et du chapeau penchent avec sa tête
  toWorld(lx, ly) {
    const a = this.headAngle();
    if (ly < -100 && a) {
      const dx = lx;
      const dy = ly + 100;
      lx = dx * Math.cos(a) - dy * Math.sin(a);
      ly = -100 + dx * Math.sin(a) + dy * Math.cos(a);
    }
    const sx = 1 + this.squash * 0.12;
    const sy = (1 - this.slump * 0.25) * (1 - this.squash * 0.18);
    return { x: this.px + this.dir * lx * sx, y: this.py + ly * sy };
  }

  headAngle() {
    return (1 - this.headK) * 0.5 + this.slump * 0.2;
  }

  // la main d'un bras (side : 1 devant, -1 derrière ; a : l'angle du bras)
  handPos(side, a) {
    return this.toWorld(side * 19 + side * Math.cos(a) * 58, -92 + Math.sin(a) * 58);
  }

  patchX(i) {
    return this.home + [40, 66, 92][i];
  }

  box() {
    if (this.state === 'beaten' || this.state === 'friend') {
      this.w = 70;
      this.h = 60;
    } else if (this.slump > 0.5) {
      // affaissé, le chapeau tout en bas : on lui saute dessus facilement
      this.w = 80;
      this.h = 150;
    } else {
      this.w = SCARE_W;
      this.h = SCARE_H * (1 - this.slump * 0.25) * (1 - this.squash * 0.18);
    }
    this.x = this.px - this.w / 2;
    this.y = this.py - this.h;
    this.onGround = this.py >= this.groundY;
    this.stompDepth = this.slump > 0.5 ? 54 : 18;
  }

  get cx() { return this.px; }

  // Ses yeux brillent dans la nuit (et un peu de lumière sur lui, pour bien le voir).
  light() {
    const h = this.toWorld(4, -128);
    return { x: h.x, y: h.y, r: 120 + 50 * this.eyes, a: 0.85 };
  }

  // ---------- Dessin ----------
  drawWall(ctx, x, k, side) {
    ScareArt.cornWall(ctx, x, this.groundY, k, this.t, side);
  }

  // la souche du caramel, et son carré de citrouilles
  drawDecor(ctx) {
    ScareArt.stump(ctx, this.source.x, this.groundY);
    for (let i = 3 - this.patch; i < 3; i++) {
      ScareArt.pumpkin(ctx, this.patchX(i), this.groundY - 15 + i % 2, 15 + (i % 2) * 2, { face: i !== 1, glow: 0.5 + 0.3 * this.eyes, t: this.t, stem: true, rot: (i - 1) * 0.12 });
    }
  }

  // (sa bulle : au-dessus de sa tête, et plus haut que Malice quand elle saute dessus)
  sayAt() {
    const down = this.state === 'beaten' || this.state === 'friend';
    return { x: this.px, y: down ? this.groundY - 100 : Math.min(this.toWorld(0, -205).y, this.groundY - 250) };
  }

  // ses vies : des chapeaux pointus (sur un petit rond orange, pour bien les voir)
  drawLife(ctx, x, y, full) {
    ctx.save();
    ctx.fillStyle = full ? 'rgba(255,170,60,0.55)' : 'rgba(255,255,255,0.12)';
    circlePath(ctx, x, y, 19);
    ctx.fill();
    ctx.translate(x + 3, y + 13);
    ctx.scale(0.5, 0.5);
    if (!full) ctx.globalAlpha *= 0.3;
    ScareArt.hat(ctx, 0, 0, 0, 0);
    ctx.restore();
  }

  drawBody(ctx) {
    const t = this.t;
    const o = {
      t, dir: this.dir, eyes: this.eyes, back: this.back, front: this.front, slump: this.slump, wear: this.phase,
      glue: this.glue, glueFade: this.glue && this.glueT < 1.6 ? (Math.floor(this.glueT * 8) % 2 ? 0.55 : 1) : 1,
      grimace: this.grimace, squash: this.squash, wobble: this.wobble, head: this.headK, hatPop: this.hatPop,
      held: this.held, angry: this.act === 'angry', hat: !this.hat,
    };
    if (this.state === 'beaten' || this.state === 'friend') {
      if (this.pile < 1) ScareArt.scarecrow(ctx, this.px, this.py, Object.assign(o, { pile: this.pile, hat: false }));
      ScareArt.strawPile(ctx, this.px, this.groundY, {
        t, dir: this.dir, k: this.pile, friendly: this.pile >= 1, wave: this.state === 'friend' || this.stateT > 1.9, grimace: this.grimace,
      });
      if (this.hat) {
        ctx.save();
        ctx.translate(this.hat.x, this.hat.y);
        ctx.rotate(this.hat.rot);
        ScareArt.hat(ctx, 0, 0, 2, t);
        ctx.restore();
      }
    } else {
      ScareArt.scarecrow(ctx, this.px, this.py, o);
    }
  }
}

// ======================= LES CITROUILLES QUI ROULENT =======================
class ScarePumpkin extends Enemy {
  constructor(world, boss, x, y, vx, vy, roll) {
    super(world, x - 20, y - 19, 40, 38);
    this.boss = boss;
    this.ouch = 'ko'; // bong ! (voir OUCH)
    this.vx = vx;
    this.vy = vy;
    this.dir = Math.sign(vx) || -1;
    this.roll = roll;
    this.rot = 0;
    this.state = 'fly';
    this.bumpT = 0;
  }

  ai(dt) {
    const w = this.world;
    const A = this.boss.arena;
    this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
    if (this.state === 'roll') this.vx = this.dir * this.roll;
    const res = w.moveBody(this, dt);
    this.rot += (this.vx * dt) / 19;
    if (res.landed && this.state === 'fly') {
      // boum ! un petit rebond, puis elle roule
      this.state = 'roll';
      this.vy = -170;
      if (w.onScreen(this)) Sound.sfx.pumpkinThud();
      for (let i = 0; i < 5; i++) {
        w.spawn({ type: 'dust', x: this.cx + rand(-14, 14), y: this.y + this.h, vx: rand(-80, 80), vy: rand(-60, -10), life: 0.4, size: rand(4, 7) });
      }
    }
    if (this.state === 'roll' && this.onGround) {
      this.bumpT -= dt;
      if (this.bumpT <= 0) {
        this.bumpT = 0.12;
        w.spawn({ type: 'dust', x: this.cx - this.dir * 14, y: this.y + this.h, vx: -this.dir * rand(20, 60), vy: rand(-40, -10), life: 0.3, size: rand(3, 5) });
      }
    }
    // au bord du champ (ou contre un mur), elle se casse
    if (res.wall || this.x < A.x0 + 2 || this.x + this.w > A.x1 - 2) this.smash(true);
  }

  smash(sound) {
    if (this.dead) return;
    this.dead = true;
    ScarePumpkin.burst(this.world, this.cx, this.cy, sound);
  }

  // Une citrouille qui se casse : des morceaux orange et des pépins.
  static burst(w, x, y, sound) {
    if (sound !== false) Sound.sfx.pumpkinCrack();
    else Sound.sfx.splat();
    for (let i = 0; i < 9; i++) {
      w.spawn({ type: 'debris', x: x + rand(-12, 12), y: y + rand(-12, 12), vx: rand(-240, 240), vy: rand(-460, -140), g: 1500, life: 0.7, size: rand(6, 11), color: choose(['#f07a1c', '#d85f10', '#ff9a3a']), vr: rand(-12, 12) });
    }
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'dot', x, y, vx: rand(-180, 180), vy: rand(-320, -80), g: 1200, life: 0.6, size: rand(2, 3), color: '#fff2c8' });
    }
  }

  stomp() {
    this.world.popText(this.cx, this.y - 10, 'Crac !', '#ffb36a', 22);
    this.world.game.addScore(100);
    this.smash(true);
  }

  kill() {
    this.world.game.addScore(100);
    this.smash(true);
  }

  // le caramel ou les chips : elle s'arrête net… et se casse
  hitBy() {
    this.world.game.addScore(50);
    this.smash(true);
  }

  leave() { this.smash(false); }

  light() { return { x: this.cx, y: this.cy, r: 84, a: 0.85 }; }

  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ellipsePath(ctx, this.cx, this.boss.groundY + 1, 18, 4);
    ctx.fill();
    ScareArt.pumpkin(ctx, this.cx, this.cy, 19, { rot: this.rot, face: true, glow: 1, t: this.t, stem: true });
  }
}

// ======================= SES CORBEAUX =======================
class ScareCrow extends Enemy {
  constructor(world, boss, i) {
    super(world, 0, 0, 40, 30);
    this.boss = boss;
    this.i = i;
    this.ouch = 'head'; // un coup de bec sur la tête (voir OUCH)
    this.state = 'perch';
    this.flap = rand(0, 6);
    this.timer = 0;
    this.ang = i * 2.2;
    this.target = null;
    this.fleeDir = 1;
    this.dir = i % 2 ? -1 : 1;
    const p = boss.perch(i);
    this.x = p.x - this.w / 2;
    this.y = p.y - this.h;
  }

  get k() { return this.world.diff.bossK; }

  // l'endroit où il tourne dans le ciel, au-dessus du champ
  spot() {
    const A = this.boss.arena;
    const mid = (A.x0 + A.x1) / 2;
    const t = this.world.t * 0.5 + this.ang;
    return {
      x: clamp(mid + Math.sin(t) * 330 + (this.i - 1) * 60, A.x0 + 60, A.x1 - 60),
      y: 222 + Math.sin(t * 2.1 + this.i) * 26 + this.i * 12,
    };
  }

  // il vole vers (tx, ty) à la vitesse sp (en douceur)
  steer(tx, ty, sp, dt, soft) {
    const dx = tx - this.cx;
    const dy = ty - this.cy;
    const d = Math.hypot(dx, dy) || 1;
    const kk = Math.min(1, dt * soft);
    this.vx += ((dx / d) * sp - this.vx) * kk;
    this.vy += ((dy / d) * sp - this.vy) * kk;
    return d;
  }

  ai(dt) {
    const w = this.world;
    const p = w.player;
    const K = this.k;
    const ground = this.boss.groundY;
    this.timer -= dt;
    this.flap += dt * (this.state === 'dive' ? 6 : this.state === 'caw' ? 26 : 15);
    switch (this.state) {
      case 'perch': {
        const s = this.boss.perch(this.i);
        this.x = s.x - this.w / 2;
        this.y = s.y - this.h;
        this.vx = 0;
        this.vy = 0;
        return;
      }
      case 'fly': {
        const s = this.spot();
        if (this.steer(s.x, s.y, 300, dt, 4) < 30) this.state = 'circle';
        break;
      }
      case 'circle': {
        const s = this.spot();
        this.steer(s.x, s.y, 220, dt, 2.5);
        break;
      }
      case 'caw':
        // il s'arrête, bat des ailes et croasse : attention, il va plonger !
        this.vx *= Math.pow(0.02, dt);
        this.vy = Math.sin(this.timer * 30) * 30;
        if (Math.abs(p.cx - this.cx) > 6) this.dir = Math.sign(p.cx - this.cx);
        if (this.timer <= 0) this.dive();
        break;
      case 'dive':
        // tout droit là où était Malice, puis il remonte (jamais dans le sol)
        if (this.y + this.h > ground - 8) {
          this.y = ground - 8 - this.h;
          this.vy = 0;
        }
        if (this.timer <= 0 || this.cy > this.target.y + 30 || (this.vy === 0 && Math.abs(this.cx - this.target.x) > 60)) {
          this.state = 'climb';
          this.timer = 1.6;
        }
        break;
      case 'climb': {
        const s = this.spot();
        this.vx += (Math.sign(this.vx || this.dir) * 260 * K - this.vx) * Math.min(1, dt * 2);
        this.vy += (-300 * K - this.vy) * Math.min(1, dt * 3);
        if (this.cy < s.y + 20 || this.timer <= 0) this.state = 'fly';
        break;
      }
      case 'flee':
        // il s'enfuit tout là-haut… et reviendra plus tard
        this.vx += (this.fleeDir * 160 - this.vx) * Math.min(1, dt * 3);
        this.vy += (-380 - this.vy) * Math.min(1, dt * 3);
        if (this.y + this.h < w.cam.y - 40) {
          this.state = 'away';
          this.timer = 3.5 / K;
        }
        break;
      case 'away':
        // (hors de l'écran, tout en haut)
        this.vx = 0;
        this.vy = 0;
        this.y = -400;
        if (this.timer <= 0 && this.boss.state === 'fight') {
          const s = this.spot();
          this.x = s.x - this.w / 2;
          this.y = w.cam.y - 60;
          this.state = 'fly';
        }
        return;
      case 'leave':
        this.vx += (this.fleeDir * 240 - this.vx) * Math.min(1, dt * 2);
        this.vy += (-300 - this.vy) * Math.min(1, dt * 2);
        if (this.y + this.h < w.cam.y - 60) this.dead = true;
        break;
      default: break;
    }
    if (Math.abs(this.vx) > 8 && this.state !== 'caw') this.dir = Math.sign(this.vx);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // il reste au-dessus du champ
    const A = this.boss.arena;
    if (this.state !== 'leave') this.x = clamp(this.x, A.x0 + 4, A.x1 - this.w - 4);
    if (this.y + this.h > ground - 4) this.y = ground - 4 - this.h;
  }

  takeOff() {
    this.state = 'fly';
    this.vy = -260;
    this.vx = (this.i - 1) * 120;
  }

  caw() {
    const w = this.world;
    this.state = 'caw';
    this.timer = 0.85 / this.k;
    if (w.onScreen(this, 100)) Sound.sfx.caw();
    w.popText(this.cx, this.y - 10, 'Croâ !', '#ff9a8a', 20);
  }

  dive() {
    const p = this.world.player;
    this.state = 'dive';
    this.timer = 1.8;
    this.target = { x: p.cx, y: p.cy };
    const dx = this.target.x - this.cx;
    const dy = Math.max(60, this.target.y - this.cy);
    const d = Math.hypot(dx, dy) || 1;
    const sp = 360 * this.k * (1 + 0.08 * this.boss.phase);
    this.vx = (dx / d) * sp;
    this.vy = (dy / d) * sp;
    Sound.sfx.swoosh();
  }

  flee(word) {
    const w = this.world;
    if (this.state === 'flee' || this.state === 'away' || this.state === 'leave') return false;
    this.state = 'flee';
    this.stuck = 0;
    this.fleeDir = Math.sign(this.cx - w.player.cx) || 1;
    Sound.sfx.caw();
    if (word) w.popText(this.cx, this.y - 8, word, '#d6c8ff', 20);
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'feather', x: this.cx + rand(-10, 10), y: this.cy + rand(-8, 8), vx: rand(-90, 90), vy: rand(-140, -20), g: 120, drag: 2, life: rand(0.9, 1.4), size: rand(0.8, 1.1), vr: rand(-4, 4) });
    }
    return true;
  }

  harmful() {
    return (this.state === 'dive' || this.state === 'climb') && super.harmful();
  }

  stomp() {
    if (this.flee('Croâ !')) this.world.game.addScore(100);
  }

  kill() {
    if (this.flee('Croâ !')) this.world.game.addScore(100);
  }

  // le caramel colle ses ailes : il tombe par terre (les chips : le ventre plein, il s'en va)
  // (même en Bébé, il se décolle vite : un corbeau collé par terre ne doit pas rester là pour toujours)
  hitBy(kind) {
    if (kind === 'caramel') {
      super.hitBy(kind);
      this.stuck = Math.min(this.stuck, 2.5);
      this.state = 'glued';
    } else {
      this.world.popText(this.cx, this.y - 6, 'Miam !', '#b6ff7a', 20);
      Sound.sfx.crunch();
      this.flee(null);
    }
  }

  onUnstuck() {
    this.flee(null);
  }

  // collé par terre, il n'arrête plus le caramel ni les tirs (ils passent par-dessus, jusqu'à l'Épouvantail)
  shotBox() {
    if (this.stuck > 0) return { x: this.x, y: -9999, w: 0, h: 0 };
    return this;
  }

  leave() {
    this.stuck = 0;
    if (this.state === 'away') {
      this.dead = true;
      return;
    }
    this.state = 'leave';
    this.fleeDir = 1;
  }

  light() {
    if (this.state === 'away') return { x: this.cx, y: -400, r: 1, a: 0 };
    return { x: this.cx, y: this.cy, r: this.state === 'caw' ? 100 : 66, a: 0.8 };
  }

  draw(ctx) {
    if (this.state === 'away') return;
    super.draw(ctx);
  }

  drawBody(ctx, x, y) {
    const pose = this.stuck > 0 ? 'stuck' : this.state === 'perch' ? 'perch' : this.state === 'dive' ? 'dive' : 'fly';
    ScareArt.crow(ctx, x, y, {
      dir: this.dir, flap: this.flap, t: this.t, pose, caw: this.state === 'caw',
      sleep: this.state === 'perch' && this.boss.state === 'sleep', vx: this.vx, vy: this.vy,
    });
  }
}

// ======================= LES DESSINS =======================
// L'Épouvantail : chapeau pointu tout cabossé, tête en sac de toile cousue, chemise à carreaux rapiécée
// avec un gros bouton, de la paille qui dépasse de partout, et son piquet de bois. Ses corbeaux, ses
// citrouilles qui brillent, la souche du caramel, et les grandes tiges de maïs qui ferment le champ.
const ScareArt = (() => {
  const TAU = Math.PI * 2;
  const paint = (ctx, fill, line, lw) => Art.paint(ctx, fill, line, lw);
  const STRAW = '#f2c94c';
  const STRAW_DARK = '#c9962a';
  const SACK = '#dcc293';
  const SACK_SHADE = '#bf9f6c';
  const SACK_LINE = '#6e5232';
  const SHIRT = '#b5452f';
  const SHIRT_DARK = '#8c3020';
  const SHIRT_LINE = '#4e1a10';
  const HAT = '#4b3b63';
  const HAT_DARK = '#33284a';
  const HAT_LINE = '#1a1328';
  const BAND = '#e8822e';
  const WOOD = '#8a5e36';
  const WOOD_LINE = '#45301a';
  const THREAD = '#2a1a10';

  // Une touffe de paille : n brins qui partent de (x, y) dans la direction a, longueur len.
  // (les brins clairs, puis les foncés : deux traits seulement, c'est plus rapide)
  function straw(ctx, x, y, a, len, n, spread, t, seed) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.3;
    for (let odd = 0; odd < 2; odd++) {
      ctx.strokeStyle = odd ? STRAW_DARK : STRAW;
      ctx.beginPath();
      for (let i = odd; i < n; i += 2) {
        const k = n > 1 ? i / (n - 1) - 0.5 : 0;
        const aa = a + k * spread + Math.sin(t * 3 + i * 1.7 + seed) * 0.07;
        const l = len * (0.7 + 0.3 * hash(seed * 3.7 + i * 1.3));
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(aa) * l, y + Math.sin(aa) * l);
      }
      ctx.stroke();
    }
  }

  // Un bras : une manche de chemise et une main en paille (side : 1 devant, -1 derrière ; a : l'angle,
  // 0 = écarté, + vers le bas, − vers le haut).
  function arm(ctx, side, a, t, back, glue) {
    ctx.save();
    ctx.translate(side * 19, -92);
    ctx.rotate(side > 0 ? a : Math.PI - a);
    straw(ctx, 44, 0, 0, 17, 5, 1.3, t, side * 5);
    roundRectPath(ctx, -4, -7.5, 50, 15, 6);
    paint(ctx, back ? SHIRT_DARK : SHIRT, SHIRT_LINE, 1.5);
    // les carreaux de la manche
    ctx.strokeStyle = 'rgba(60,15,8,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 8; k < 44; k += 11) {
      ctx.moveTo(k, -7);
      ctx.lineTo(k, 7);
    }
    ctx.moveTo(0, 0);
    ctx.lineTo(46, 0);
    ctx.stroke();
    // la manche effilochée, attachée par une ficelle
    ctx.strokeStyle = '#d9b26a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(40, -7.5);
    ctx.lineTo(40, 7.5);
    ctx.stroke();
    if (glue === 'caramel') {
      ctx.fillStyle = '#d98a2e';
      roundRectPath(ctx, 6, -9, 30, 18, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,200,0.6)';
      ellipsePath(ctx, 18, -4, 9, 2, 0);
      ctx.fill();
    }
    ctx.restore();
  }

  // Le chapeau pointu (le milieu du bord en (x, y)) : wear = coups reçus (la pointe tombe, il se cabosse).
  function hat(ctx, x, y, wear, t) {
    ctx.save();
    ctx.translate(x, y);
    const H = 60 - wear * 6;
    const bend = 10 + wear * 9;
    const tx = -10 - bend;
    const ty = -H;
    // le bord
    ellipsePath(ctx, 0, 0, 38, 8, 0);
    paint(ctx, HAT_DARK, HAT_LINE, 1.6);
    // le cône, et sa pointe qui retombe
    ctx.beginPath();
    ctx.moveTo(-20, -2);
    ctx.quadraticCurveTo(-14, -H * 0.55, tx, ty);
    ctx.quadraticCurveTo(tx - 12, ty + 6 + wear * 4, tx - 15 - wear * 3, ty + 16 + wear * 6);
    ctx.quadraticCurveTo(tx - 6, ty + 10, tx + 6, ty + 8);
    ctx.quadraticCurveTo(10, -H * 0.45, 21, -2);
    ctx.closePath();
    paint(ctx, HAT, HAT_LINE, 1.6);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.quadraticCurveTo(-8, -H * 0.5, tx + 4, ty + 6);
    ctx.quadraticCurveTo(-3, -H * 0.45, -5, -6);
    ctx.closePath();
    ctx.fill();
    // le ruban orange
    ctx.beginPath();
    ctx.moveTo(-19, -4);
    ctx.quadraticCurveTo(0, 0, 20, -4);
    ctx.lineTo(18, -12);
    ctx.quadraticCurveTo(0, -9, -17, -12);
    ctx.closePath();
    paint(ctx, BAND, '#8a3e08', 1.2);
    // une pièce cousue (et un trou d'où sort de la paille, quand il est cabossé)
    ctx.save();
    ctx.translate(6, -26);
    ctx.rotate(0.2);
    roundRectPath(ctx, -6, -6, 12, 11, 2);
    paint(ctx, '#6a8a3a', HAT_LINE, 1);
    ctx.strokeStyle = '#e8d8b0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    roundRectPath(ctx, -4.5, -4.5, 9, 8, 1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    if (wear >= 1) {
      ellipsePath(ctx, -9, -16, 4, 3, 0.3);
      ctx.fillStyle = '#1a1020';
      ctx.fill();
      straw(ctx, -9, -16, -2.4, 10, 3, 0.9, t, 9);
    }
    if (wear >= 2) {
      // une grosse bosse dans le chapeau
      ctx.strokeStyle = HAT_LINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-15, -34);
      ctx.lineTo(-8, -30);
      ctx.lineTo(-11, -24);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Une citrouille (le milieu en (x, y), rayon r) ; o : rot, face (un visage creusé), glow (il brille dedans), stem
  function pumpkin(ctx, x, y, r, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    // la lumière à l'intérieur
    if (o.face && o.glow) Art.glow(ctx, 0, 2, r * 2.4, '255,170,50', 0.35 * o.glow);
    ellipsePath(ctx, 0, 0, r * 1.12, r, 0);
    paint(ctx, '#f07a1c', '#7a3208', 1.6);
    // les côtes
    ctx.fillStyle = '#d85f10';
    ellipsePath(ctx, -r * 0.5, 0, r * 0.45, r * 0.96, 0);
    ctx.fill();
    ellipsePath(ctx, r * 0.5, 0, r * 0.45, r * 0.96, 0);
    ctx.fill();
    ctx.fillStyle = '#ff9638';
    ellipsePath(ctx, 0, 0, r * 0.42, r * 0.98, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(122,50,8,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.98, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.4)';
    ellipsePath(ctx, -r * 0.55, -r * 0.45, r * 0.18, r * 0.32, 0.4);
    ctx.fill();
    if (o.stem) {
      ctx.beginPath();
      ctx.moveTo(-3, -r + 2);
      ctx.quadraticCurveTo(-4, -r - 9, 3, -r - 11);
      ctx.lineTo(5, -r - 7);
      ctx.quadraticCurveTo(2, -r - 5, 3, -r + 2);
      ctx.closePath();
      paint(ctx, '#5a7a2a', '#2a3a10', 1.2);
      ctx.strokeStyle = '#4f8a2e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3, -r - 8);
      ctx.bezierCurveTo(12, -r - 14, 14, -r - 2, 8, -r - 4);
      ctx.stroke();
    }
    if (o.face) {
      const g = o.glow || 0;
      const fill = `rgb(${Math.round(90 + 165 * g)},${Math.round(40 + 180 * g)},${Math.round(10 + 80 * g)})`;
      ctx.fillStyle = fill;
      ctx.strokeStyle = '#5a2004';
      ctx.lineWidth = 1;
      // les yeux en triangle, le nez, et le grand sourire avec des dents
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * r * 0.18, -r * 0.12);
        ctx.lineTo(s * r * 0.62, -r * 0.12);
        ctx.lineTo(s * r * 0.4, -r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, r * 0.08);
      ctx.lineTo(r * 0.1, r * 0.08);
      ctx.lineTo(0, -r * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.66, r * 0.2);
      ctx.quadraticCurveTo(0, r * 0.95, r * 0.66, r * 0.2);
      ctx.lineTo(r * 0.36, r * 0.34);
      ctx.lineTo(r * 0.24, r * 0.24);
      ctx.lineTo(r * 0.08, r * 0.4);
      ctx.lineTo(-r * 0.12, r * 0.28);
      ctx.lineTo(-r * 0.28, r * 0.42);
      ctx.lineTo(-r * 0.4, r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Le visage en toile : des yeux triangle qui brillent, un nez cousu, une grande bouche cousue en zigzag.
  function face(ctx, o, t) {
    const g = o.eyes || 0;
    const happy = o.friendly;
    const x0 = 4;
    for (const [ex, ey, s] of [[x0 - 8, -129, 0.85], [x0 + 9, -129, 1]]) {
      if (o.grimace > 0.4) {
        // bonk : les yeux en croix
        ctx.strokeStyle = THREAD;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(ex - 5 * s, ey - 5 * s);
        ctx.lineTo(ex + 5 * s, ey + 5 * s);
        ctx.moveTo(ex + 5 * s, ey - 5 * s);
        ctx.lineTo(ex - 5 * s, ey + 5 * s);
        ctx.stroke();
        continue;
      }
      if (happy) {
        // tout content : les yeux plissés
        ctx.strokeStyle = THREAD;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(ex, ey + 2, 5 * s, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        continue;
      }
      const worried = o.glue ? 1 : 0;
      ctx.beginPath();
      if (worried) {
        // collé : de grands yeux ronds tout inquiets
        ctx.ellipse(ex, ey, 5 * s, 6 * s, 0, 0, TAU);
      } else {
        // les yeux en triangle, méchants (la pointe en bas, un peu penchés)
        const tilt = o.angry ? 2 : 0;
        ctx.moveTo(ex - 7 * s, ey - 5 * s - (ex < x0 ? -tilt : tilt));
        ctx.lineTo(ex + 7 * s, ey - 5 * s - (ex < x0 ? tilt : -tilt));
        ctx.lineTo(ex, ey + 6 * s);
        ctx.closePath();
      }
      ctx.fillStyle = '#2a1608';
      ctx.fill();
      if (g > 0) {
        ctx.save();
        ctx.globalAlpha *= g;
        ctx.fillStyle = o.angry ? '#ff7a2e' : '#ffa52e';
        ctx.fill();
        ctx.fillStyle = '#fff2a0';
        ellipsePath(ctx, ex, ey - (worried ? 0 : 1.5), 2.6 * s, 2.4 * s, 0);
        ctx.fill();
        ctx.restore();
        Art.glow(ctx, ex, ey, 16 * s, o.angry ? '255,110,40' : '255,170,50', 0.55 * g);
      }
    }
    // le nez : une petite pièce triangle cousue
    ctx.beginPath();
    ctx.moveTo(x0 + 1, -122);
    ctx.lineTo(x0 + 6, -115);
    ctx.lineTo(x0 - 3, -115);
    ctx.closePath();
    paint(ctx, '#c9a06a', SACK_LINE, 1);
    // la bouche
    ctx.strokeStyle = THREAD;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (happy) {
      ctx.moveTo(x0 - 11, -110);
      ctx.quadraticCurveTo(x0 + 1, -98, x0 + 13, -110);
      ctx.stroke();
      // une petite langue rose
      ctx.fillStyle = '#ff8fa8';
      ellipsePath(ctx, x0 + 2, -103, 4, 2.6, 0);
      ctx.fill();
    } else if (o.grimace > 0.4) {
      ellipsePath(ctx, x0 + 1, -106, 6, 5, 0);
      ctx.fillStyle = '#2a1608';
      ctx.fill();
    } else if (o.glue === 'chips') {
      // trop soif : la langue qui pend
      ctx.moveTo(x0 - 10, -108);
      ctx.lineTo(x0 + 12, -108);
      ctx.stroke();
      Art.tiredFace(ctx, x0 + 2, -108, t, true);
    } else if (o.glue) {
      // une bouche toute tordue
      ctx.moveTo(x0 - 11, -106);
      for (let i = 1; i <= 6; i++) ctx.lineTo(x0 - 11 + i * 4, -106 + (i % 2 ? -3 : 2));
      ctx.stroke();
    } else {
      // le grand sourire cousu, en zigzag
      ctx.moveTo(x0 - 13, -113);
      for (let i = 1; i <= 8; i++) ctx.lineTo(x0 - 13 + i * 3.4, -113 + (i % 2 ? 4 : 0) + Math.sin((i / 8) * Math.PI) * 4);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) {
        const mx = x0 - 11 + i * 6;
        const my = -111 + Math.sin(((i + 0.5) / 5) * Math.PI) * 4;
        ctx.moveTo(mx, my - 4);
        ctx.lineTo(mx, my + 4);
      }
      ctx.stroke();
    }
  }

  // L'Épouvantail, les pieds (le bout du piquet) en (x, y).
  // o : dir, t, eyes (ses yeux brillent, de 0 à 1), back et front (l'angle de ses bras), slump (affaissé),
  //     wear (coups reçus), glue ('caramel' ou 'chips'), glueFade, grimace, squash, wobble, head (0 : la tête
  //     penchée, il dort), hatPop (son chapeau saute), held (une citrouille dans la main de derrière),
  //     angry, hat (avec son chapeau), pile (il s'effondre)
  function scarecrow(ctx, x, y, o) {
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    // (son ombre)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ellipsePath(ctx, 0, 1, 26, 5, 0);
    ctx.fill();
    ctx.rotate(o.wobble || 0);
    const sl = o.slump || 0;
    const sq = o.squash || 0;
    ctx.scale((o.dir || 1) * (1 + sq * 0.12), (1 - sl * 0.25) * (1 - sq * 0.18) * (1 - 0.85 * (o.pile || 0)));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // le piquet
    roundRectPath(ctx, -4.5, -70, 9, 70, 3);
    paint(ctx, WOOD, WOOD_LINE, 1.5);
    ctx.strokeStyle = 'rgba(69,48,26,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, -60);
    ctx.lineTo(-1, -30);
    ctx.moveTo(2, -24);
    ctx.lineTo(2, -6);
    ctx.stroke();
    // la paille qui dépasse sous la chemise
    for (let k = -22; k <= 22; k += 7.3) straw(ctx, k, -50, Math.PI / 2 + k * 0.02, 17, 2, 0.5, t, k);
    // la citrouille qu'il lève derrière lui
    const hand = (a) => ({ x: -19 - Math.cos(a) * 58, y: -92 + Math.sin(a) * 58 });
    if (o.held) {
      const h = hand(o.back);
      pumpkin(ctx, h.x - 4, h.y - 14, 18, { face: true, glow: 0.6 + 0.4 * Math.abs(Math.sin(t * 9)), t, stem: true, rot: -0.3 });
    }
    // le bras de derrière, puis la chemise
    arm(ctx, -1, o.back, t, true, o.glue);
    ctx.beginPath();
    ctx.moveTo(-19, -100);
    ctx.quadraticCurveTo(0, -105, 19, -100);
    ctx.lineTo(25, -52);
    for (let i = 1; i <= 6; i++) ctx.lineTo(25 - i * (50 / 6), -52 + (i % 2 ? 6 : 0));
    ctx.closePath();
    paint(ctx, SHIRT, SHIRT_LINE, 1.6);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(60,15,8,0.32)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = -24; k <= 24; k += 10) {
      ctx.moveTo(k, -106);
      ctx.lineTo(k, -44);
    }
    for (let k = -96; k <= -50; k += 11) {
      ctx.moveTo(-30, k);
      ctx.lineTo(30, k);
    }
    ctx.stroke();
    ctx.restore();
    // une pièce bleue cousue, et la ceinture en ficelle
    roundRectPath(ctx, -17, -77, 11, 11, 2);
    paint(ctx, '#4a7ab8', '#1e3a68', 1.1);
    ctx.strokeStyle = '#e8e0c8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    roundRectPath(ctx, -15.5, -75.5, 8, 8, 1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#d9b26a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-23, -58);
    ctx.quadraticCurveTo(0, -55, 23, -58);
    ctx.stroke();
    straw(ctx, 6, -57, Math.PI * 0.6, 9, 2, 0.6, t, 3);
    // le gros bouton
    circlePath(ctx, 6, -82, 6);
    paint(ctx, '#ffd23a', '#8a6400', 1.3);
    ctx.fillStyle = '#8a6400';
    for (const [bx, by] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]]) {
      circlePath(ctx, 6 + bx, -82 + by, 0.9);
      ctx.fill();
    }
    // collé : du caramel tout autour de lui (les chips : il transpire)
    if (o.glue === 'caramel') {
      ctx.save();
      ctx.globalAlpha *= o.glueFade == null ? 1 : o.glueFade;
      Art.caramelGoo(ctx, 0, -60, 58, 26, t, 1);
      ctx.restore();
    }
    // le bras de devant
    arm(ctx, 1, o.front, t, false, o.glue);
    // la tête (qui penche quand il dort ou qu'il est affaissé)
    ctx.save();
    ctx.translate(0, -100);
    ctx.rotate((1 - (o.head == null ? 1 : o.head)) * 0.5 + sl * 0.2);
    ctx.translate(0, 100);
    // la paille du cou
    straw(ctx, -8, -101, Math.PI * 0.62, 12, 3, 0.8, t, 1);
    straw(ctx, 8, -101, Math.PI * 0.38, 12, 3, 0.8, t, 2);
    ellipsePath(ctx, 2, -124, 23, 25, 0);
    paint(ctx, SACK, SACK_LINE, 1.6);
    ctx.fillStyle = SACK_SHADE;
    ctx.beginPath();
    ctx.ellipse(2, -124, 23, 25, 0, Math.PI * 0.55, Math.PI * 1.35);
    ctx.quadraticCurveTo(-10, -124, -12, -106);
    ctx.fill();
    // la toile (quelques fils), et la couture sur le côté
    ctx.strokeStyle = 'rgba(110,82,50,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = -138; k <= -108; k += 7) {
      ctx.moveTo(-18, k);
      ctx.lineTo(22, k + 1);
    }
    ctx.stroke();
    ctx.strokeStyle = SACK_LINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const yy = -138 + k * 7;
      ctx.moveTo(-17, yy);
      ctx.lineTo(-13, yy + 3);
    }
    ctx.stroke();
    // la ficelle qui ferme le sac, au cou
    ctx.strokeStyle = '#d9b26a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -101);
    ctx.quadraticCurveTo(2, -98, 14, -101);
    ctx.stroke();
    face(ctx, o, t);
    if (o.glue === 'chips') {
      Art.sweat(ctx, -18, -134 + Math.sin(t * 6) * 2, 1.3);
      Art.sweat(ctx, 25, -128 + Math.cos(t * 5) * 2, 1.1);
    }
    if (o.hat !== false) {
      const pop = o.hatPop || 0;
      ctx.save();
      ctx.translate(2, -144 - Math.sin(pop * Math.PI) * 34);
      ctx.rotate(-0.08 - pop * 0.5);
      hat(ctx, 0, 0, o.wear || 0, t);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  // Le tas de paille (à la fin) : k de 0 à 1 (il grossit) ; une fois tout tassé, sa tête est posée dessus,
  // toute contente, et il fait coucou avec une main en paille.
  function strawPile(ctx, x, y, o) {
    const t = o.t || 0;
    const k = o.k || 0;
    if (k <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.dir || 1, 1);
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ellipsePath(ctx, 0, 1, 56 * k, 7, 0);
    ctx.fill();
    // la chemise toute chiffonnée sous le tas
    if (k >= 1) {
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.quadraticCurveTo(-34, -24, -12, -22);
      ctx.quadraticCurveTo(10, -30, 30, -16);
      ctx.quadraticCurveTo(44, -8, 42, 0);
      ctx.closePath();
      paint(ctx, SHIRT, SHIRT_LINE, 1.5);
      circlePath(ctx, 26, -9, 5);
      paint(ctx, '#ffd23a', '#8a6400', 1.2);
    }
    // le tas
    ctx.beginPath();
    ctx.moveTo(-50 * k, 0);
    ctx.quadraticCurveTo(-44 * k, -30 * k, -10 * k, -36 * k);
    ctx.quadraticCurveTo(26 * k, -40 * k, 46 * k, 0);
    ctx.closePath();
    paint(ctx, STRAW, '#a87a1a', 1.5);
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI * (0.1 + 0.8 * hash(i * 1.9));
      const r = (30 + 14 * hash(i * 2.7)) * k;
      straw(ctx, Math.cos(a) * r * 0.5, -6 * k + Math.sin(a) * r * 0.4, a, 14 * k, 2, 0.4, t, i);
    }
    if (k >= 1) {
      // sa main en paille qui fait coucou
      if (o.wave) {
        ctx.save();
        ctx.translate(-30, -20);
        ctx.rotate(-1.9 + Math.sin(t * 9) * 0.35);
        roundRectPath(ctx, 0, -6, 28, 12, 5);
        paint(ctx, SHIRT, SHIRT_LINE, 1.3);
        straw(ctx, 27, 0, 0, 14, 5, 1.4, t, 7);
        ctx.restore();
      }
      // sa tête posée sur le tas, toute contente (le chapeau est dessiné à part, il retombe dessus)
      ctx.save();
      ctx.translate(0, 82);
      ellipsePath(ctx, 2, -124, 23, 25, 0);
      paint(ctx, SACK, SACK_LINE, 1.6);
      face(ctx, { friendly: !o.grimace || o.grimace < 0.4, grimace: o.grimace }, t);
      ctx.restore();
    }
    ctx.restore();
  }

  // Un corbeau (les pieds en (x, y)) ; o : dir, flap, t, pose ('perch', 'fly', 'dive', 'stuck'), caw (il croasse),
  // sleep (endormi), vx, vy
  function crow(ctx, x, y, o) {
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y - 15);
    if (o.pose === 'dive') ctx.rotate(Math.atan2(o.vy, Math.abs(o.vx) + 1) * Math.sign(o.vx || 1) * 0.7);
    ctx.scale(o.dir || 1, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const BODY = '#26223c';
    const LINE = '#0c0a16';
    const flying = o.pose === 'fly' || o.pose === 'dive';
    const fl = o.pose === 'dive' ? 0.25 : flying ? Math.sin(o.flap || 0) : o.caw ? Math.sin(t * 30) : 0;
    const wing = (front) => {
      ctx.save();
      ctx.translate(-2, -4);
      const a = o.pose === 'dive' ? 2.6 : flying || o.caw ? -0.9 + fl * 1.1 : 2.9;
      ctx.rotate(front ? a : a - 0.25);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.quadraticCurveTo(14, -10, 26, -6);
      ctx.lineTo(23, -2);
      ctx.lineTo(27, 1);
      ctx.lineTo(22, 3);
      ctx.lineTo(25, 6);
      ctx.quadraticCurveTo(12, 8, 0, 4);
      ctx.closePath();
      paint(ctx, front ? '#3a3458' : '#1a1730', LINE, 1.2);
      ctx.restore();
    };
    wing(false);
    // la queue en éventail
    ctx.fillStyle = BODY;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-15, 2 + (i - 1) * 3, 9, 3, 0.3 + (i - 1) * 0.3, 0, TAU);
      paint(ctx, BODY, LINE, 1);
    }
    // les pattes
    if (!flying) {
      ctx.strokeStyle = '#ff9a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 9);
      ctx.lineTo(-3, 15);
      ctx.moveTo(3, 9);
      ctx.lineTo(3, 15);
      ctx.stroke();
    }
    // le corps, et la tête
    ellipsePath(ctx, 0, 0, 14, 11, 0);
    paint(ctx, BODY, LINE, 1.4);
    ctx.fillStyle = 'rgba(140,120,220,0.35)';
    ellipsePath(ctx, -3, -5, 7, 3, -0.3);
    ctx.fill();
    circlePath(ctx, 11, -8, 9);
    paint(ctx, BODY, LINE, 1.4);
    // le bec (ouvert quand il croasse)
    const open = o.caw ? 3 + Math.abs(Math.sin(t * 22)) * 3 : 0;
    ctx.beginPath();
    ctx.moveTo(17, -11);
    ctx.lineTo(29, -8 - open * 0.4);
    ctx.lineTo(18, -6);
    ctx.closePath();
    paint(ctx, '#ffc21a', '#8a5a00', 1);
    ctx.beginPath();
    ctx.moveTo(18, -6 + open * 0.3);
    ctx.lineTo(27, -4 + open);
    ctx.lineTo(17, -3 + open * 0.3);
    ctx.closePath();
    paint(ctx, '#f0a000', '#8a5a00', 1);
    // l'œil (fermé quand il dort), et un sourcil coquin
    if (o.sleep) {
      ctx.strokeStyle = '#d8d0f0';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(13, -10, 3, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      circlePath(ctx, 13, -10, 4.2);
      paint(ctx, '#ffffff', LINE, 1);
      ctx.fillStyle = o.caw ? '#d01818' : '#120a10';
      circlePath(ctx, 14.3, -9.6, 2.2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(8.5, -16);
      ctx.lineTo(17, -13.5 - (o.caw ? 1.5 : 0));
      ctx.stroke();
    }
    // la petite houppe sur la tête
    ctx.strokeStyle = BODY;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8, -16);
    ctx.quadraticCurveTo(5, -22, 2, -21);
    ctx.stroke();
    wing(true);
    ctx.restore();
    // il croasse : un point d'exclamation rouge au-dessus de lui
    if (o.caw) {
      const b = Math.abs(Math.sin(t * 10)) * 3;
      drawOutlinedText(ctx, '!', x, y - 46 - b, 26, '#ff5a4a');
    }
  }

  // La souche où repousse le caramel.
  function stump(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(-14, -15);
    ctx.lineTo(14, -15);
    ctx.lineTo(18, 0);
    ctx.quadraticCurveTo(22, 2, 24, 1);
    ctx.lineTo(-24, 1);
    ctx.quadraticCurveTo(-21, 2, -17, 0);
    ctx.closePath();
    paint(ctx, '#7a5232', '#3e2814', 1.4);
    ellipsePath(ctx, 0, -15, 14, 4.5, 0);
    paint(ctx, '#d8b07a', '#3e2814', 1.2);
    ctx.strokeStyle = 'rgba(122,82,50,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -15, 8, 2.6, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // Les grandes tiges de maïs qui ferment le champ (k : de 0, cachées sous terre, à 1, tout en haut).
  // (side : -1 le mur de gauche, 1 celui de droite, dessiné en miroir)
  function cornWall(ctx, x, ground, k, t, side) {
    ctx.save();
    if (side > 0) {
      ctx.translate(2 * x, 0);
      ctx.scale(-1, 1);
    }
    ctx.beginPath();
    ctx.rect(x - 60, ground - 700, 140, 700);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const stalks = [[-14, 470, 0], [20, 400, 1], [2, 440, 2], [-30, 380, 3], [34, 330, 4]];
    for (const [dx, h, i] of stalks) {
      const sway = Math.sin(t * 1.6 + i * 1.3) * 6;
      const base = ground + (1 - k) * (h + 30);
      const sx = x + dx;
      // la tige
      ctx.strokeStyle = '#2f5a1c';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(sx, base);
      ctx.quadraticCurveTo(sx + sway * 0.3, base - h * 0.5, sx + sway, base - h);
      ctx.stroke();
      ctx.strokeStyle = '#5f9a34';
      ctx.lineWidth = 5;
      ctx.stroke();
      // les feuilles, de chaque côté
      for (let j = 1; j < 7; j++) {
        const f = j / 7;
        const lx = sx + sway * f * f;
        const ly = base - h * f;
        const s = (j + i) % 2 ? 1 : -1;
        const len = 46 - j * 3;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(lx + s * len * 0.6, ly - 22, lx + s * len, ly + 10 + Math.sin(t * 2 + j + i) * 3);
        ctx.quadraticCurveTo(lx + s * len * 0.5, ly - 10, lx, ly + 6);
        ctx.closePath();
        paint(ctx, j % 2 ? '#6aa83a' : '#4f8a2e', '#2a4a14', 1);
      }
      // un épi de maïs, et le plumet tout en haut
      const ex = sx + sway * 0.4 + 5;
      const ey = base - h * 0.55;
      ellipsePath(ctx, ex, ey, 6, 15, 0.25);
      paint(ctx, '#ffd84a', '#a87a00', 1.2);
      ctx.beginPath();
      ctx.moveTo(ex - 6, ey + 14);
      ctx.quadraticCurveTo(ex - 10, ey - 4, ex - 3, ey - 14);
      ctx.quadraticCurveTo(ex - 2, ey, ex + 2, ey + 14);
      ctx.closePath();
      paint(ctx, '#8ac04a', '#3a6a1c', 1);
      ctx.strokeStyle = '#e8c860';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let j = -2; j <= 2; j++) {
        ctx.moveTo(sx + sway, base - h);
        ctx.lineTo(sx + sway + j * 6, base - h - 16 + Math.abs(j) * 4);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  return { scarecrow, strawPile, hat, pumpkin, crow, stump, cornWall };
})();

BOSSES.epouvantail = Epouvantail;
