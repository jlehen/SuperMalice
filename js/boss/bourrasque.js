'use strict';

// =====================================================================
//  BOURRASQUE : le boss de la Vallée des Orages (tout en haut du vieux phare, sur sa galerie, au bout du 3-4)
//  Bourrasque est un gros nuage d'orage tout enrhumé : un bonnet de laine, un nez tout rouge qui coule, et il éternue
//  des éclairs au chocolat (« Aaa… aaah… ATCHOUM ! »). Il fait aussi tomber des grêlons, qui rebondissent par terre
//  avant de fondre. Sa tornade, il l'appelle « mon toupie » : c'est un ascenseur, elle aspire Malice et la monte
//  jusqu'à lui. Il fait la sieste sur la lanterne du phare ; quand Malice arrive, il éternue, se mouche (POUÊÊÊT !)
//  et appelle son toupie. Il a trois vies (trois petits nuages en haut de l'écran), et chaque manche se gagne
//  d'une autre façon :
//   1. Sauter sur le nuage : la toupie aspire tout (on voit le vent qui arrive vers elle) ; elle emporte Malice
//      tout là-haut, et la lance au-dessus de Bourrasque : elle lui retombe sur la tête. Pouf ! Il en faut plusieurs
//      (diff.gustHops : 2 en Bébé… 4 en Difficile) ; en Bébé, il plane juste au-dessus de sa toupie (on lui retombe
//      dessus sans rien faire) ; sinon, juste à côté : en l'air, on se dirige un peu vers lui avec les flèches (un peu
//      plus quand c'est plus difficile).
//   2. Chatouiller la toupie : une grande plume tombe du ciel. Malice l'attrape et chatouille la toupie avec
//      (« Hi hi ! »), qui se sauve un peu plus loin… Au bout de quelques chatouilles (diff.gustTickles : 2… 5), elle
//      éclate de rire et s'arrête de tourner : Bourrasque dégringole tout près du sol, tout étourdi. On lui saute
//      dessus. (En Bébé, il reste par terre jusqu'à ce qu'on lui saute dessus ; sinon, il remonte au bout d'un moment,
//      et la toupie se relève : il faut la rechatouiller.)
//   3. L'arc-en-ciel : Bourrasque pleure toute une averse ; puis trois cloches apparaissent (sur un poteau à chaque bout
//      de la galerie, et sous le dôme de la lanterne). On les sonne en sautant dedans ; chacune sonne un moment
//      (diff.gustBells : jusqu'au bout en Bébé, 8 s en Difficile), et quand les trois sonnent ensemble, un arc-en-ciel
//      apparaît : Bourrasque l'admire (il ne fait plus rien), et c'est un pont pour monter jusqu'à lui et lui sauter
//      sur la tête.
//  Tout est annoncé : l'éternuement (« Aaa… aaah… », et l'endroit où l'éclair va tomber), les grêlons (le petit nuage
//  de grêle là-haut, et leur ombre qui grandit par terre), l'aspiration de la toupie (elle se gonfle, le vent arrive).
//  Les chips et le caramel passent à travers le nuage et sa toupie. À la fin, il est guéri de son rhume : le beau
//  soleil revient, et sa toupie devient une petite brise qui s'en va faire tourner les ailes d'un moulin, au loin.
// =====================================================================

// GUST : la boîte du nuage (w, h ; son milieu est en px, py), sky (la hauteur de son milieu pendant le combat, au-dessus
// de sa toupie), nap (sa sieste, posé sur le dôme de la lanterne), low (tombé par terre), admire (au-dessus du haut de
// l'arc-en-ciel) : depuis le sol de l'arène (la galerie), en pixels. ceil : pendant le combat, l'écran monte d'autant
// au-dessus du haut du niveau (du ciel en plus : tout là-haut, lancée par la toupie ou en rebondissant sur lui, la tête
// de Malice ne passe pas sous ses vies, en haut de l'écran). bounce : la vitesse du rebond sur sa tête (même en gardant
// le saut appuyé : sinon, elle monterait jusqu'en haut de l'écran). pour : la durée de l'averse (secondes).
const GUST = { w: 176, h: 86, sky: 245, nap: 268, low: 46, admire: 256, ceil: 72, bounce: 560, pour: 1.8 };
// TOUPIE : h (sa hauteur), lift (le temps qu'elle met à monter Malice tout en haut, secondes), pop (la vitesse à
// laquelle elle la lance au-dessus du nuage), reach (de combien de cases elle aspire), pull (à quelle vitesse, en
// pixels par seconde : moins vite que Malice qui marche, on peut toujours s'en écarter).
const TOUPIE = { h: 172, lift: 0.95, pop: 930, reach: 4.5, pull: 120 };
// La hauteur (y) des petits nuages de grêle, là-haut, avant que les grêlons tombent (sous les vies du haut de l'écran).
const GRELON_Y = 100;
// L'arc-en-ciel : sa hauteur (au milieu) et sa largeur (il part de 3 cases après le bord gauche de l'arène).
const ARC = { h: 132, w: 1080 };

class Bourrasque extends Boss {
  // x : le milieu de la case du &, y : le sol (la galerie)
  constructor(world, x, y) {
    super(world, x - GUST.w / 2, y - GUST.h, GUST.w, GUST.h, {
      name: 'Bourrasque', song: 'boss-orage', life: 3, intro: 4.6, introShort: 1.5,
    });
    this.groundY = y;
    this.skyY = y - GUST.sky;
    this.px = x;
    this.py = y - GUST.nap;
    this.tx = x;
    this.ty = this.py;
    this.vy = 0;
    // ce qu'il fait : idle (il attend : timer), aaa (il va éternuer), hail (il souffle de la grêle), toupie (sa toupie
    // aspire : il attend qu'elle ait fini), hop (on vient de lui sauter dessus), ouch (il vient de perdre une vie),
    // fall / dazed / rise (2e manche : il dégringole, reste étourdi par terre, puis remonte), cry (3e manche : il pleure
    // toute une averse), admire (il admire l'arc-en-ciel), beaten (la fin)
    this.act = 'idle';
    this.actT = 0;
    this.timer = 0;
    this.plan = 0;
    this.sneezeT = 1;
    // 1re manche : combien de fois on lui a sauté dessus, et de quel côté de sa toupie il plane
    this.hops = 0;
    this.hopCool = 0;
    this.side = 1;
    this.bonkT = 0;
    this.dazeT = 0;
    this.bounced = false;
    // (1re manche) sa toupie vient de lancer Malice tout là-haut (popped : elle n'est pas encore retombée ; popT,
    // popHops : quand, et combien de sauts sur sa tête il y avait), et après un saut sur sa tête, il faut retomber par
    // terre avant le suivant (landFirst) ; misses : les lancers manqués (steerTip : le conseil pour se diriger revient)
    this.popped = false;
    this.popT = null;
    this.popHops = 0;
    this.landFirst = false;
    this.misses = 0;
    this.steerTip = false;
    // (Malice passe à travers lui ; le dernier ATCHOUM ; le « aaah… » du milieu de l'éternuement)
    this.inside = false;
    this.atchT = -1;
    this.aaaSaid = false;
    // le dessin : yeux ouverts (0 : il dort), il se gonfle pour éternuer (aaa), écrasé, tout tremblant, son nez rouge
    // (1) ou rose (0, guéri), il coule du nez, son mouchoir, il pleure, tout blanc (guéri), content
    this.eyes = 0;
    this.aaa = 0;
    this.squash = 0;
    this.wobble = 0;
    this.nose = 1;
    this.drip = 1;
    this.hanky = 0;
    this.cry = 0;
    this.tint = 0;
    this.happy = 0;
    this.mouth = 0;
    // sa toupie, la plume (2e manche), les cloches et l'arc-en-ciel (3e), l'averse, le soleil et le moulin au loin
    this.toupie = null;
    this.feather = null;
    this.bells = null;
    this.arc = null;
    this.pour = 0;
    this.sun = 0;
    this.sunTo = 0;
    this.mill = null;
    this.lastEnergy = 0;
    this.capT = 0;
    this.zzzT = 0.4;
    this.chatT = 12;
    this.chats = 0;
    this.hintT = 0;
    this.falls = 0;
    this.noteT = 0;
    // (les chips et le caramel passent à travers le nuage : voir Throwable)
    this.passThrow = true;
  }

  setup() {
    super.setup();
    const w = this.world;
    const A = this.arena;
    // (il vole : le sol de l'arène, c'est la galerie, pas le dessous du nuage)
    A.y1 = this.groundY;
    // (du ciel en plus en haut de l'écran : voir GUST.ceil ; le plafond de l'arène, lui, reste le haut du niveau, sous
    // ses vies, et on ne le touche ni au sommet du lancer, ni en rebondissant sur lui)
    A.camY = -GUST.ceil;
    // il fait la sieste sur la lanterne du phare
    const L = w.lighthouse;
    this.lampX = L ? (L.x0 + L.x1) / 2 : (A.x0 + A.x1) / 2;
    this.px = this.lampX;
    this.tx = this.px;
    // sa toupie (elle n'apparaît qu'à son réveil), dessinée derrière lui
    this.toupie = new BourrasqueToupie(w, this, A.x1 - 5.5 * TILE);
    w.enemies.splice(w.enemies.indexOf(this), 0, this.toupie);
    // le moulin, tout au loin, sur un rocher au bord de la mer
    this.mill = { x: A.x0 + 2.5 * TILE, y: this.groundY - 50, a: 0.35, v: 0 };
    // les trois cloches de la dernière manche : un poteau à chaque bout de la galerie, et la lanterne au milieu
    this.bellSpots = [A.x0 + 4.8 * TILE, this.lampX, A.x1 - 3.1 * TILE];
  }

  get cx() { return this.px; }

  // le bout de son nez (d'où partent les éclairs au chocolat)
  nosePos() {
    return { x: this.px, y: this.py + 16 };
  }

  // ---------- Avant et pendant le réveil ----------
  asleep(dt) {
    this.eyes = 0;
    this.snore(dt);
  }

  // il ronfle, le nez bouché : des Z, et des « snif »
  snore(dt) {
    const w = this.world;
    this.mouth = 0.25 + Math.sin(this.t * 2) * 0.2;
    this.aaa = 0.1 + Math.sin(this.t * 2) * 0.08;
    this.zzzT -= dt;
    if (this.zzzT > 0) return;
    this.zzzT = 1.6;
    w.spawn({ type: 'text', x: this.px + 50, y: this.py - 30, vx: 24, vy: -40, life: 1.6, text: 'Z', color: '#eaf0ff', size: 18 });
    w.spawn({ type: 'text', x: this.px + 64, y: this.py - 44, vx: 30, vy: -46, life: 1.2, text: 'z', color: '#eaf0ff', size: 13 });
    if (Math.random() < 0.5) w.spawn({ type: 'text', x: this.px - 30, y: this.py + 30, vx: -20, vy: -30, life: 1, text: 'snif', color: '#cfe0ff', size: 12 });
    if (w.onScreen(this.visBox(), 40) && !w.player.dead) Sound.sfx.gustSnore();
  }

  // Le réveil : « Aaa… aaah… ATCHOUM ! » (rien ne tombe), il se mouche (POUÊÊÊT !), il se fâche, et il appelle son
  // toupie. Quand on revient après avoir perdu une vie, c'est bien plus court.
  wake(dt, k) {
    const w = this.world;
    const t = this.stateT;
    const T = this.toupie;
    if (this.short) {
      this.eyes = approach(this.eyes, 1, dt * 4);
      if (this.once('w-say')) {
        this.speak('Encore toi\u00a0? Atch… Mon toupie\u00a0!', 1.3);
        Sound.sfx.gustSniff();
      }
      if (t > 0.4 && this.once('w-toupie')) T.appear();
      if (t > 0.3) this.flyOver(dt, 260);
    } else {
      if (t < 0.4) this.snore(dt);
      else if (t < 1.4) {
        if (this.once('w-aaa')) {
          Sound.sfx.sneezeUp();
          this.shout('Aaa… aaah…', '#e8f0ff', 20);
        }
        if (t > 0.9 && this.once('w-aaa2')) Sound.sfx.sneezeUp();
        this.aaa = Math.min(1, (t - 0.4) / 0.9);
        this.eyes = 0.3;
      }
      if (t >= 1.4 && this.once('w-atch')) {
        this.aaa = 0;
        this.eyes = 1;
        this.atchoum(false);
      }
      // il sort son mouchoir… et se mouche
      this.hanky = approach(this.hanky, t > 1.9 && t < 3.0 ? 1 : 0, dt * 5);
      if (t > 2.1 && this.once('w-honk')) {
        Sound.sfx.gustHonk();
        this.shout('POUÊÊÊT\u00a0!', '#ffffff', 22);
        this.wobble = 0.7;
      }
      if (t > 2.6 && this.once('w-say')) this.speak('Pardon… Snif\u00a0! Qui ose grimper sur bon phare\u00a0? Euh… sur MON phare\u00a0!', 2.2);
      if (t > 3.7 && this.once('w-toupie')) {
        this.speak('Mon toupie, au travail\u00a0!', 1.1);
        T.appear();
      }
      if (t > 3.7) this.flyOver(dt, 220);
    }
    if (k >= 1) {
      this.eyes = 1;
      this.hanky = 0;
      this.rest(1.4 / this.k);
    }
  }

  // il vole au-dessus de sa toupie
  flyOver(dt, sp) {
    this.tx = clamp(this.toupie.tx, this.arena.x0 + 110, this.arena.x1 - 110);
    this.ty = this.skyY;
    this.moveCloud(dt, sp);
  }

  // ---------- Le combat ----------
  fight(dt) {
    this.actT += dt;
    if (this.hopCool > 0) this.hopCool -= dt;
    if (this.bonkT > 0) this.bonkT -= dt;
    this.hintT += dt;
    const p = this.world.player;
    if (p.onGround || p.dead) this.landFirst = false;
    if (this.phase === 0) this.round1(dt);
    else if (this.phase === 1) this.round2(dt);
    else this.round3(dt);
    this.animate(dt);
    this.advise(dt);
    this.chatter(dt);
  }

  rest(timer) {
    this.act = 'idle';
    this.actT = 0;
    this.timer = timer;
  }

  // Ses attaques, l'une après l'autre (seq : la suite, selon la manche ; gap : le temps entre deux).
  runAct(dt, seq, gap) {
    const p = this.world.player;
    switch (this.act) {
      case 'idle':
        this.timer -= dt;
        if (this.timer <= 0 && this.canAct()) this.attack(seq);
        break;
      case 'aaa':
        if (this.actT > this.sneezeT + 0.45) this.rest(gap);
        break;
      case 'hail':
        if (this.actT > 0.7) this.rest(gap);
        break;
      case 'toupie':
        // (il attend que sa toupie ait fini d'aspirer, et que Malice soit retombée)
        if (this.toupie.idle() && !p.carry && (p.onGround || p.dead)) this.rest(gap);
        break;
      case 'hop':
        if (this.actT > 0.6) this.rest(gap * 0.8);
        break;
      default: break;
    }
  }

  // Une seule chose à la fois (on voit toujours venir ce qui arrive), et pas pendant que Malice est là-haut.
  canAct() {
    const p = this.world.player;
    if (p.dead || p.carry || this.grace > 0 || this.threats() > 0 || !this.toupie.idle()) return false;
    return p.onGround || p.y + p.h > this.groundY - 3 * TILE;
  }

  attack(seq) {
    const what = seq[this.plan++ % seq.length];
    if (what === 'toupie') {
      this.act = 'toupie';
      this.actT = 0;
      this.toupie.open();
    } else if (what === 'hail') {
      this.dropHail();
    } else {
      this.startSneeze();
    }
  }

  // les grêlons et les éclairs qui vont tomber (ou qui tombent)
  threats() {
    let n = 0;
    for (const e of this.world.enemies) {
      if (e.dead || e.boss !== this) continue;
      if (e instanceof BourrasqueEclair || (e instanceof BourrasqueGrelon && (e.state === 'form' || e.state === 'fall'))) n++;
    }
    return n;
  }

  // Un petit moment de calme : ce qui allait tomber s'en va.
  calm() {
    for (const e of this.world.enemies) {
      if (!e.dead && e.boss === this && (e instanceof BourrasqueEclair || e instanceof BourrasqueGrelon)) e.leave();
    }
  }

  // ---- 1re manche : sauter sur le nuage, depuis sa toupie ----
  round1(dt) {
    const T = this.toupie;
    const A = this.arena;
    const p = this.world.player;
    this.runAct(dt, ['toupie', 'hail', 'toupie', 'sneeze'], 1.1 / this.k);
    // il plane au-dessus de sa toupie, juste à côté (voir offset) ; il ne bouge pas pendant que Malice monte ou
    // retombe de là-haut (sauf quand elle vient de lui sauter dessus : il s'en va), ni pendant qu'il éternue ou
    // souffle sa grêle
    if (p.onGround || p.dead) this.popped = false;
    // (retombée par terre sans lui avoir sauté dessus : un lancer manqué ; le conseil pour se diriger revient au premier,
    // puis tous les deux)
    if (this.popT !== null && (p.onGround || p.dead)) {
      const missed = !p.dead && this.hops === this.popHops;
      if (missed) this.misses++;
      this.steerTip = missed && this.misses % 2 === 1;
      this.popT = null;
    }
    const busy = this.act === 'aaa' || this.act === 'hail' || T.state === 'lift' || T.state === 'rest' || (this.popped && this.act !== 'hop');
    if (!busy) {
      let x = T.tx + this.side * this.offset();
      if (x < A.x0 + 110 || x > A.x1 - 110) {
        this.side = -this.side;
        x = T.tx + this.side * this.offset();
      }
      this.tx = clamp(x, A.x0 + 110, A.x1 - 110);
      this.ty = this.skyY;
    }
    // (en Bébé, il glisse sous elle pendant qu'elle est en l'air : elle lui retombe dessus, même en appuyant sur une
    // flèche)
    if (this.popped && this.act !== 'hop' && this.k < 0.9) this.tx = clamp(p.cx, A.x0 + 110, A.x1 - 110);
    this.moveCloud(dt, this.act === 'hop' ? 360 : 220);
  }

  // À côté de sa toupie. Lancée tout droit, Malice retombe pile sur lui en Bébé, sans toucher aux flèches ; sinon,
  // elle doit se diriger un peu vers lui (avec 99 px, elle retombe juste sur le bord de sa boîte) : en Gentil, une
  // flèche avant 0,55 s de vol suffit ; en Classique, avant 0,5 s ; en Difficile (26 px), avant 0,45 s. (Les flèches
  // gardées appuyées pendant la montée comptent dès qu'elle est lancée.)
  offset() {
    const K = this.k;
    return K < 0.9 ? 0 : K < 1.1 ? 100 : K < 1.25 ? 112 : 125;
  }

  hopsNeeded() { return this.world.diff.gustHops || 2; }

  // (après un saut sur sa tête, il faut être retombée par terre avant le suivant : on ne rebondit pas de saut en saut)
  hoppable() {
    return this.state === 'fight' && this.phase === 0 && this.hopCool <= 0 && this.recover <= 0 && !this.landFirst;
  }

  // Pouf ! On lui a sauté sur la tête (mais pas encore la dernière fois de la manche).
  hop() {
    const w = this.world;
    this.hops++;
    this.hopCool = 1.2;
    this.landFirst = true;
    this.popped = false;
    this.act = 'hop';
    this.actT = 0;
    this.squash = 1;
    this.wobble = 1;
    Sound.sfx.cloudPouf();
    const left = this.hopsNeeded() - this.hops;
    this.shout(left > 1 ? `Pouf\u00a0! Encore ${left}\u00a0!` : 'Pouf\u00a0! Encore un\u00a0!', '#ffffff', 22);
    this.speak(choose(['Hé\u00a0! Pas sur ba tête\u00a0! Euh… ma tête\u00a0!', 'Atch… Ouille\u00a0!', 'Snif… Même pas mal\u00a0!', 'Mon bonnet\u00a0!']), 1.5);
    this.puffs(8);
    // il s'en va un peu plus loin, avec sa toupie (et il change de côté)
    this.side = -this.side;
    this.toupie.moveAway(w.player.cx);
  }

  // (sa toupie emporte Malice, puis la lance tout là-haut)
  onLift() {
    this.tip = null;
  }

  onPop() {
    this.popT = this.t;
    this.popHops = this.hops;
    this.popped = true;
  }

  // ---- 2e manche : chatouiller la toupie avec la plume ----
  round2(dt) {
    const T = this.toupie;
    const A = this.arena;
    const w = this.world;
    if (this.act === 'ouch') {
      this.flyOver(dt, 200);
      // une grande plume tombe du ciel
      if (this.recover <= 0 && this.actT > 1.2) {
        this.dropFeather();
        this.rest(1.6 / this.k);
      }
      return;
    }
    if (this.act === 'fall') {
      // il dégringole (et rebondit une fois, tout mou)
      this.vy += 1500 * dt;
      this.py += this.vy * dt;
      const low = this.groundY - GUST.low;
      if (this.py >= low) {
        this.py = low;
        if (!this.bounced) {
          this.bounced = true;
          this.vy = -260;
          this.squash = 1;
          Sound.sfx.cloudPouf();
          w.shake(5);
          this.puffs(10);
        } else {
          this.vy = 0;
          this.act = 'dazed';
          this.actT = 0;
          this.dazeT = w.diff.forever ? Infinity : 6.5 / this.k;
          this.speak('Ouille ouille… Tout tourne…', 1.8);
        }
      }
      this.ty = this.py;
      this.tx = this.px;
      return;
    }
    if (this.act === 'dazed') {
      this.dazeT -= dt;
      if (this.dazeT <= 0) {
        // il remonte, et sa toupie se relève (il faut la rechatouiller)
        this.act = 'rise';
        this.actT = 0;
        T.getUp();
        this.speak('Hop\u00a0! Mon toupie, debout\u00a0!', 1.6);
      }
      return;
    }
    if (this.act === 'rise') {
      this.ty = this.skyY;
      this.moveCloud(dt, 200);
      if (Math.abs(this.py - this.skyY) < 6) this.rest(1.2 / this.k);
      return;
    }
    // sa toupie éclate de rire : elle s'arrête de tourner, et il dégringole
    if (T.state === 'laugh') {
      this.tumble();
      return;
    }
    this.runAct(dt, ['hail', 'sneeze'], 1.6 / this.k);
    if (this.act !== 'aaa' && this.act !== 'hail') {
      this.tx = clamp(T.tx, A.x0 + 110, A.x1 - 110);
      this.ty = this.skyY;
    }
    this.moveCloud(dt, 140);
  }

  tumble() {
    this.calm();
    this.act = 'fall';
    this.actT = 0;
    this.vy = 0;
    this.bounced = false;
    this.falls++;
    this.tip = null;
    this.px = clamp(this.px, this.arena.x0 + 100, this.arena.x1 - 100);
    this.speak('Mon toupie\u00a0! Ne ris pas… Je tombe\u00a0!', 1.6);
    Sound.sfx.acornFall();
  }

  // La grande plume tombe doucement, loin de Malice (du haut de l'écran, sous ses vies).
  dropFeather() {
    const A = this.arena;
    const p = this.world.player;
    const x = p.cx < (A.x0 + A.x1) / 2 ? A.x1 - 4 * TILE : A.x0 + 4.5 * TILE;
    this.feather = { x, y: 30, state: 'fall', t: 0, rot: 0, cool: 0 };
    Sound.sfx.itemAppear();
  }

  // La plume : elle tombe en se balançant, on l'attrape en la touchant (même en l'air), et si Malice a mal, elle la
  // lâche (elle retombe doucement, on peut la reprendre).
  updateFeather(dt) {
    const F = this.feather;
    if (!F || F.state === 'gone') return;
    const w = this.world;
    const p = w.player;
    const A = this.arena;
    F.t += dt;
    if (F.cool > 0) F.cool -= dt;
    if (F.state === 'fall') {
      F.y += 110 * dt;
      F.x = clamp(F.x + Math.sin(F.t * 2.4) * 60 * dt, A.x0 + 30, A.x1 - 30);
      F.rot = Math.sin(F.t * 2.4) * 0.7;
      if (F.y >= this.groundY - 6) {
        F.y = this.groundY - 6;
        F.state = 'rest';
      }
    } else if (F.state === 'rest') {
      F.rot = approach(F.rot, 0, dt * 3);
    }
    if (F.state === 'held') {
      if (p.dead || p.energy < this.lastEnergy) {
        F.state = 'fall';
        F.x = p.cx;
        F.y = Math.min(p.y + 20, this.groundY - 8);
        F.cool = 1;
      } else {
        F.x = p.cx + p.facing * 18;
        F.y = p.y + 30;
      }
    } else if (F.cool <= 0 && !p.dead && !p.carry && boxOverlap(p, F.x - 32, F.y - 40, 64, 48)) {
      F.state = 'held';
      Sound.sfx.weapon();
      w.popText(p.cx, p.y - 24, 'Une plume\u00a0!', '#ffd6f0', 20);
    }
    this.lastEnergy = p.energy;
  }

  // ---- 3e manche : l'arc-en-ciel ----
  round3(dt) {
    const A = this.arena;
    const mid = (A.x0 + A.x1) / 2;
    if (this.act === 'ouch') {
      this.tx = mid;
      this.ty = this.skyY;
      this.moveCloud(dt, 160);
      if (this.recover <= 0 && this.actT > 1) {
        // il pleure toute une averse
        this.act = 'cry';
        this.actT = 0;
        this.pour = GUST.pour;
        Sound.sfx.downpour();
      }
      return;
    }
    if (this.act === 'cry') {
      this.tx = mid;
      this.moveCloud(dt, 100);
      if (this.actT > GUST.pour) {
        this.showBells();
        this.rest(1.6 / this.k);
      }
      return;
    }
    this.updateBells(dt);
    if (this.arc) {
      // il admire l'arc-en-ciel, juste au-dessus de son sommet
      this.act = 'admire';
      this.tx = this.arc.apexX;
      this.ty = this.groundY - GUST.admire;
      this.moveCloud(dt, 180);
      return;
    }
    this.runAct(dt, ['hail', 'sneeze'], 1.9 / this.k);
    if (this.act !== 'aaa' && this.act !== 'hail') {
      this.tx = mid + Math.sin(this.t * 0.35) * 250;
      this.ty = this.skyY;
    }
    this.moveCloud(dt, 110);
  }

  // Après l'averse, trois cloches apparaissent (et un petit rayon de soleil).
  showBells() {
    const g = this.groundY;
    this.bells = this.bellSpots.map((x, i) => ({ x, y: g - 106, i, ringT: 0, swing: 0, k: 0, at: i * 0.3, cool: 0, was: false, lantern: i === 1 }));
    this.sunTo = 0.18;
    Sound.sfx.itemAppear();
  }

  updateBells(dt) {
    const B = this.bells;
    if (!B) return;
    const w = this.world;
    const p = w.player;
    let ringing = 0;
    for (const b of B) {
      if (b.at > 0) {
        b.at -= dt;
        if (b.at <= 0) {
          Sound.sfx.bellDing(b.i);
          w.puff(b.x, b.y, '#fff6c0');
        }
        continue;
      }
      // (quand l'arc-en-ciel est là, les cloches s'effacent : leurs couleurs sont dedans)
      b.k = approach(b.k, this.arc ? 0 : 1, dt * (this.arc ? 1 : 3));
      b.swing *= Math.pow(0.5, dt);
      if (b.cool > 0) b.cool -= dt;
      if (b.ringT > 0) b.ringT -= dt;
      if (!this.arc && b.k >= 1 && !p.dead && b.cool <= 0 && boxOverlap(p, b.x - 26, b.y - 30, 52, 60)) this.ring(b);
      if (b.ringT > 0) {
        ringing++;
        b.swing = Math.max(b.swing, 0.35);
      } else if (b.was && !this.arc && this.once('h-fast')) {
        this.hint('Vite\u00a0! Les trois cloches doivent sonner en même temps\u00a0!', 3.5);
      }
      b.was = b.ringT > 0;
    }
    // des petites notes de musique s'envolent des cloches qui sonnent
    this.noteT -= dt;
    if (this.noteT <= 0 && !this.arc) {
      this.noteT = 0.45;
      for (const b of B) {
        if (b.ringT > 0) w.spawn({ type: 'text', x: b.x + rand(-14, 14), y: b.y - 30, vx: rand(-20, 20), vy: -50, life: 0.9, text: choose(['♪', '♫']), color: BourrasqueArt.BELL[b.i], size: 16 });
      }
    }
    if (ringing === 3 && !this.arc) this.rainbowUp();
  }

  // Ding ! (elle sonne gustBells secondes : Infinity en Bébé)
  ring(b) {
    const w = this.world;
    b.ringT = w.diff.gustBells || 10;
    b.swing = 1;
    b.cool = 0.45;
    Sound.sfx.bellDing(b.i);
    w.popText(b.x, b.y - 46, 'Ding\u00a0!', BourrasqueArt.BELL[b.i], 20);
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'spark', x: b.x + rand(-16, 16), y: b.y + rand(-10, 10), vx: rand(-120, 120), vy: rand(-160, -40), life: 0.5, size: rand(3, 5), color: BourrasqueArt.BELL[b.i] });
    }
  }

  // Les trois cloches sonnent : un arc-en-ciel apparaît (c'est une plateforme : voir BourrasqueArc).
  rainbowUp() {
    const w = this.world;
    this.calm();
    for (const b of this.bells) b.ringT = Infinity;
    const xa = this.arena.x0 + 3 * TILE;
    this.arc = new BourrasqueArc(w, xa, this.groundY);
    w.platforms.push(this.arc);
    Sound.sfx.rainbow();
    this.sunTo = 0.45;
    this.act = 'admire';
    this.tip = null;
    this.speak('Oooh… Un arc-en-ciel\u00a0! Comme il est beau…', 2.6);
  }

  // ---------- Les attaques ----------
  // De petits nuages de grêle là-haut (au-dessus de Malice, et à côté d'elle quand il y en a plusieurs) : leur ombre
  // grandit par terre… puis les grêlons tombent. Jamais l'un sur l'autre : on peut toujours passer entre deux.
  dropHail() {
    const w = this.world;
    const p = w.player;
    const K = this.k;
    const A = this.arena;
    const n = K < 0.9 ? 1 : K > 1.2 ? 3 : 2;
    const lo = A.x0 + 30;
    const hi = A.x1 - 30;
    const xs = [];
    for (let i = 0; i < n; i++) {
      let x = i === 0 ? p.cx + rand(-10, 10) : p.cx + (i % 2 ? 1 : -1) * rand(110, 150) * Math.ceil(i / 2);
      x = clamp(x, lo, hi);
      let tries = 0;
      while (tries++ < 12 && xs.some((o) => Math.abs(o - x) < 95)) x = rand(lo, hi);
      xs.push(x);
    }
    xs.forEach((x, i) => w.enemies.push(new BourrasqueGrelon(w, this, x, 1.25 / K + i * 0.15)));
    this.act = 'hail';
    this.actT = 0;
    this.wobble = 0.5;
    Sound.sfx.hailForm();
    this.shout('Brrr\u00a0!', '#e8f4ff', 18);
  }

  // « Aaa… aaah… » : il se gonfle, et l'endroit où l'éclair va tomber est marqué par terre (là où est Malice ; en
  // Difficile, à partir de la 2e manche, un deuxième un peu plus loin)… puis ATCHOUM ! (voir BourrasqueEclair)
  startSneeze() {
    const w = this.world;
    const p = w.player;
    const A = this.arena;
    const K = this.k;
    this.sneezeT = 1.35 / K;
    const lo = A.x0 + 40;
    const hi = A.x1 - 40;
    const x = clamp(p.cx, lo, hi);
    w.enemies.push(new BourrasqueEclair(w, this, x, this.sneezeT));
    if (K > 1.2 && this.phase >= 1) {
      const x2 = clamp(x + (x - lo > hi - x ? -1 : 1) * 170, lo, hi);
      w.enemies.push(new BourrasqueEclair(w, this, x2, this.sneezeT + 0.35));
    }
    this.act = 'aaa';
    this.actT = 0;
    this.aaaSaid = false;
    Sound.sfx.sneezeUp();
    this.shout('Aaa…', '#e8f0ff', 20);
  }

  // ATCHOUM ! (hurt : un vrai éternuement, avec un éclair ; sinon, au réveil et à la fin, rien ne tombe)
  atchoum(hurt) {
    const w = this.world;
    const n = this.nosePos();
    if (this.atchT === this.t) return;
    this.atchT = this.t;
    Sound.sfx.sneeze();
    w.shake(hurt ? 4 : 6);
    this.shout('ATCHOUM\u00a0!', '#ffffff', 30);
    this.squash = 0.8;
    this.wobble = 0.6;
    for (let i = 0; i < 10; i++) {
      w.spawn({ type: 'smoke', x: n.x + rand(-8, 8), y: n.y + rand(-4, 8), vx: rand(-160, 160), vy: rand(20, 200), life: 0.5, size: rand(5, 10), color: '#e8f0ff' });
    }
  }

  // ---------- Ce qui le touche ----------
  // 1re manche : le dernier saut sur sa tête ; 2e : tombé par terre ; 3e : quand l'arc-en-ciel est là.
  takes(how) {
    if (how !== 'stomp' && how !== 'bump' && how !== 'star') return false;
    if (this.phase === 0) return this.hoppable() && this.hops + 1 >= this.hopsNeeded();
    if (this.phase === 1) return this.act === 'fall' || this.act === 'dazed';
    return !!this.arc;
  }

  // (renversé par un pouvoir, ou l'étoile : comme un saut sur sa tête, dans la 1re manche)
  kill(type) {
    if (super.kill(type)) return true;
    if (this.hoppable()) {
      this.hop();
      return true;
    }
    return false;
  }

  // les tirs des pouvoirs ne l'atteignent que quand il est tombé par terre (2e manche) ; les chips et le caramel
  // passent à travers lui (passThrow)
  shotBox() {
    if (this.state === 'fight' && this.phase === 1 && (this.act === 'fall' || this.act === 'dazed')) return this;
    return { x: this.x, y: -9999, w: 0, h: 0 };
  }

  shot() {}

  // (on lui saute dessus : le rebond est plafonné juste après, voir update et GUST.bounce)
  stomp() {
    super.stomp();
    this.capT = 0.1;
  }

  onBounce() {
    const w = this.world;
    if (this.hoppable()) {
      this.hop();
      return;
    }
    Sound.sfx.boing(false);
    // Elle glisse sur le côté du nuage : sans ça, elle rebondirait dessus sans fin (comme sur un trampoline).
    const p = w.player;
    p.vx = (Math.sign(p.cx - this.px) || 1) * Math.max(Math.abs(p.vx), 380);
    p.boostT = 0.3;
    if (this.bonkT > 0 || this.state !== 'fight') return;
    this.bonkT = 1;
    this.squash = 0.5;
    this.shout('Pouf\u00a0!', '#e8f0ff', 18);
  }

  onHit() {
    const w = this.world;
    this.calm();
    this.tip = null;
    this.act = 'ouch';
    this.actT = 0;
    this.plan = 0;
    this.squash = 1;
    this.wobble = 1;
    Sound.sfx.cloudPouf();
    this.shout('POUF\u00a0!', '#ffffff', 30);
    this.puffs(12);
    if (this.phase === 1) {
      this.speak('Aïe, bon nez\u00a0! Euh… mon nez\u00a0! Mon toupie, protège-moi\u00a0!', 2.6);
      this.toupie.guard();
    } else {
      this.speak('Bouhouhou\u00a0! Tu as fait rire mon toupie\u00a0!', 2.4);
      this.toupie.tire();
      if (this.feather && this.feather.state !== 'gone') {
        w.puff(this.feather.x, this.feather.y, '#ffd6f0');
        this.feather.state = 'gone';
      }
    }
  }

  // ce qu'il crie (« ATCHOUM ! », « Pouf ! ») : à côté de lui, du côté du milieu de l'arène (pas sous ses vies, en haut
  // de l'écran)
  shout(text, color, size) {
    const A = this.arena;
    const s = this.px > (A.x0 + A.x1) / 2 ? -1 : 1;
    this.world.popText(this.px + s * 125, this.py + 4, text, color, size);
  }

  // des petits bouts de nuage s'envolent
  puffs(n) {
    const w = this.world;
    for (let i = 0; i < n; i++) {
      w.spawn({ type: 'smoke', x: this.px + rand(-70, 70), y: this.py + rand(-30, 30), vx: rand(-150, 150), vy: rand(-120, 60), life: 0.6, size: rand(8, 14), color: this.tint > 0.5 ? '#ffffff' : '#d4d0ec' });
    }
  }

  dangerous() { return false; }

  // (on ne se coince pas sous un nuage : il ne la repousse jamais, voir Boss.keepOut)
  cornered() { return false; }

  // ---------- Les petits conseils ----------
  advise() {
    const w = this.world;
    const p = w.player;
    const T = this.toupie;
    const F = this.feather;
    if (this.tip && this.tip.t > 0) return;
    // (elle passe à travers lui, là-haut, alors qu'on ne peut pas le toucher)
    if (this.phase >= 1 && !this.takes('stomp') && overlap(p, this.visBox())) {
      if (this.phase === 1 && F && this.once('h-head1')) {
        this.hint('Il est trop fort, là-haut… Chatouille sa toupie avec la grande plume !', 4);
        return;
      }
      if (this.phase === 2 && this.bells && !this.arc && this.once('h-head2')) {
        this.hint('Il se protège… Sonne les trois cloches !', 3.5);
        return;
      }
    }
    if (this.phase === 0) {
      if ((T.state === 'inhale' || T.state === 'suck') && (this.once('h-suck') || (this.hintT > 14 && this.hops === 0))) {
        this.hintT = 0;
        this.hint('La toupie aspire tout\u00a0! Va dedans\u00a0: elle t\'emporte jusqu\'à Bourrasque\u00a0!', 4);
      } else if (this.steerTip && p.onGround) {
        this.steerTip = false;
        this.hint('Dans la toupie, appuie déjà sur {FLECHES} vers Bourrasque\u00a0: tu lui retomberas sur la tête\u00a0!', 4);
      }
    } else if (this.phase === 1) {
      if (this.act === 'dazed' && this.actT > 0.4 && this.once('h-dazed' + this.falls)) {
        this.hint('Bourrasque est tombé\u00a0: saute-lui dessus\u00a0!', 3);
      } else if (F && (F.state === 'rest' || F.state === 'fall') && F.t > 0.6 && (this.once('h-feather') || this.hintT > 16)) {
        this.hintT = 0;
        this.hint('Une grande plume tombe du ciel\u00a0! Attrape-la…', 3);
      } else if (F && F.state === 'held' && T.tickles === 0 && T.state === 'guard' && (this.once('h-tickle') || this.hintT > 16)) {
        this.hintT = 0;
        this.hint('Chatouille la toupie avec la plume\u00a0: va tout contre elle\u00a0!', 3.5);
      }
    } else if (this.bells && !this.arc && this.once('h-bells')) {
      this.hint('Trois cloches\u00a0! Saute pour les sonner\u00a0!', 3.5);
    } else if (this.arc && this.arc.k >= 1 && p.platform !== this.arc && this.once('h-rainbow')) {
      this.hint('Monte sur l\'arc-en-ciel, et saute sur Bourrasque\u00a0!', 4);
    }
  }

  // la toupie l'a repoussée : elle n'a pas la plume
  onPushed() {
    if (this.tip && this.tip.t > 0) return;
    const F = this.feather;
    if (F && F.state !== 'held' && F.state !== 'gone' && this.once('h-nofeather')) this.hint('Prends d\'abord la grande plume\u00a0!', 3);
  }

  // Il parle tout seul, le nez bouché (quand on n'a rien d'autre à dire).
  chatter(dt) {
    this.chatT -= dt;
    if (this.chatT > 0 || (this.say && this.say.t > 0) || (this.tip && this.tip.t > 0) || this.act !== 'idle') return;
    this.chatT = 12;
    const L = [
      'Snif… J\'ai attrapé un rhube. Un RHUBE\u00a0!',
      'Atch… Non, rien. Fausse alerte.',
      'Où est bon bouchoir\u00a0? Euh… mon mouchoir\u00a0!',
      'Mon toupie tourne plus vite que le vent\u00a0!',
    ];
    this.speak(L[this.chats++ % L.length], 2.4);
  }

  // ---------- La fin ----------
  onBeaten() {
    const w = this.world;
    this.act = 'beaten';
    this.squash = 1;
    this.wobble = 1;
    this.say = null;
    Sound.sfx.cloudPouf();
    this.shout('POUF\u00a0!', '#ffffff', 34);
    this.puffs(14);
    if (this.feather) this.feather.state = 'gone';
  }

  // Il va éternuer… mais rien ne vient : il est guéri ! Le beau soleil revient (la pluie s'arrête), il devient tout
  // blanc, son nez tout rose ; puis sa toupie devient une petite brise qui s'en va faire tourner le moulin, au loin.
  outro(dt, t) {
    const w = this.world;
    this.squash = approach(this.squash, 0, dt * 2);
    this.wobble *= Math.pow(0.1, dt);
    this.tx = this.arc ? this.arc.apexX : this.px;
    this.ty = this.skyY;
    this.moveCloud(dt, 100);
    if (t > 0.6 && this.once('o-aaa')) {
      this.speak('Aaa… aaah…', 1.1);
      Sound.sfx.sneezeUp();
    }
    this.aaa = t > 0.6 && t < 1.7 ? Math.min(1, (t - 0.6) / 0.9) : approach(this.aaa, 0, dt * 4);
    if (t > 1.8 && this.once('o-cured')) {
      this.speak('…Tiens\u00a0? Plus d\'atchoum\u00a0! Mon nez ne coule plus\u00a0: je suis guéri\u00a0!', 2.4);
      this.sunTo = 1;
      w.rain = false;
      Sound.sfx.scareFriend();
      if (this.arc) this.arc.vanish();
    }
    if (t > 1.8) {
      this.tint = approach(this.tint, 1, dt * 0.8);
      this.nose = approach(this.nose, 0, dt * 0.7);
      this.drip = approach(this.drip, 0, dt * 1.5);
      this.happy = approach(this.happy, 1, dt * 2);
    }
    if (t > 4.4 && this.once('o-merci')) this.speak('Merci, Malice\u00a0! Va, mon toupie\u00a0: va faire tourner le moulin\u00a0!', 2.5);
    if (t > 4.8 && this.once('o-breeze')) this.toupie.breeze();
    this.mouth = approach(this.mouth, this.say && this.say.t > 0.2 ? 0.4 + Math.sin(this.t * 14) * 0.3 : 0, dt * 6);
    return t > 7.4;
  }

  // (une fois battu) il se repose, tout content, sur la lanterne ; il dit merci quand Malice passe tout près
  after(dt) {
    const p = this.world.player;
    this.tint = 1;
    this.nose = 0;
    this.drip = 0;
    this.happy = 1;
    this.eyes = 1;
    this.sunTo = 1;
    this.tx = this.lampX;
    this.ty = this.groundY - GUST.nap;
    this.moveCloud(dt, 60);
    if (Math.abs(p.cx - this.px) < 220 && this.once('bye')) this.speak('Merci\u00a0! Plus jamais de rhume\u00a0!', 2.4);
    this.mouth = approach(this.mouth, this.say && this.say.t > 0.2 ? 0.4 + Math.sin(this.t * 14) * 0.3 : 0, dt * 6);
  }

  // ---------- Ce qui bouge tout le temps ----------
  update(dt) {
    super.update(dt);
    const w = this.world;
    // (le rebond sur sa tête, même avec le saut gardé appuyé, et pour Gros Bonbon : pas plus haut que GUST.bounce)
    if (this.capT > 0) {
      this.capT -= dt;
      if (w.player.vy < -GUST.bounce) w.player.vy = -GUST.bounce;
    }
    // le soleil, l'averse, la plume et le moulin au loin (même pendant la fin)
    this.sun = approach(this.sun, this.sunTo, dt * 0.45);
    if (this.pour > 0) {
      this.pour -= dt;
      const A = this.arena;
      if (Math.random() < dt * 30) w.spawn({ type: 'drop', x: rand(A.x0 + 20, A.x1 - 20), y: this.groundY - 4, vx: rand(-60, 60), vy: rand(-160, -60), g: 700, life: 0.4, size: 1 });
    }
    if (this.state === 'fight' && this.phase === 1) this.updateFeather(dt);
    const M = this.mill;
    M.a += M.v * dt;
    if (this.state !== 'fight') this.drip = approach(this.drip, this.tint > 0.5 ? 0 : 1, dt);
    // (on passe à travers le nuage quand on ne peut pas le toucher : des petits bouts de nuage s'envolent)
    const p = w.player;
    const inside = !p.dead && this.state !== 'sleep' && this.y < -9000 && overlap(p, this.visBox());
    if (inside && !this.inside) this.puffs(5);
    this.inside = inside;
  }

  // Ce qui change son dessin : il se gonfle avant d'éternuer, il s'aplatit quand on lui saute dessus, il pleure…
  animate(dt) {
    const a = this.act;
    this.eyes = approach(this.eyes, 1, dt * 3);
    this.aaa = approach(this.aaa, a === 'aaa' && this.actT < this.sneezeT ? Math.min(1, this.actT / this.sneezeT) : 0, dt * (a === 'aaa' ? 4 : 6));
    if (a === 'aaa' && this.actT > this.sneezeT * 0.55 && !this.aaaSaid) {
      this.aaaSaid = true;
      Sound.sfx.sneezeUp();
      this.shout('aaah…', '#e8f0ff', 22);
    }
    this.squash = approach(this.squash, 0, dt * 3);
    this.wobble *= Math.pow(0.05, dt);
    this.mouth = approach(this.mouth, this.say && this.say.t > 0.2 ? 0.4 + Math.sin(this.t * 14) * 0.3 : 0, dt * 6);
    this.cry = approach(this.cry, a === 'cry' || (this.phase === 2 && a === 'ouch') ? 1 : 0, dt * 2);
  }

  moveCloud(dt, sp) {
    const dx = this.tx - this.px;
    // (il ralentit en arrivant)
    this.px = approach(this.px, this.tx, sp * dt * clamp(Math.abs(dx) / 80, 0.3, 1));
    this.py = approach(this.py, this.ty, sp * 0.7 * dt);
  }

  // Sa boîte : seulement quand on peut le toucher (lui sauter sur la tête…). Le reste du temps, c'est un nuage : on
  // passe à travers (sans ça, on rebondirait dessus sans fin, comme sur un trampoline). (visBox : là où on le voit)
  box() {
    const v = this.visBox();
    this.x = v.x;
    this.w = v.w;
    this.h = v.h;
    this.y = this.state === 'fight' && (this.hoppable() || this.takes('stomp')) ? v.y : -9999;
    this.stompDepth = 34;
  }

  visBox() {
    return { x: this.px - GUST.w / 2, y: this.py - 40, w: GUST.w, h: GUST.h };
  }

  // Sa bulle : au-dessus de lui (il y a la place sous ses vies, voir GUST.ceil), sauf tout en haut de l'écran pendant
  // le réveil, la 1re manche (Malice vient le voir là-haut : elle ne la cache pas) et la fin, où elle est sous lui.
  // (sous lui, dans la 2e manche, elle cacherait les « Hi hi ! Encore 2 ! » de sa toupie)
  sayAt() {
    if (this.py < this.groundY - 160 && !(this.state === 'fight' && this.phase >= 1)) return { x: this.px, y: this.py + 48, below: true };
    return { x: this.px, y: this.py - 54 };
  }

  // Le petit conseil : au-dessus de Malice, mais jamais sur les cloches (au-dessus d'elles) ; sur l'arc-en-ciel, sous
  // ses pieds (au-dessus d'elle, il cacherait Bourrasque, juste au-dessus du sommet).
  tipAt() {
    const p = this.world.player;
    if (this.arc && p.y + p.h < this.groundY - 20) return { x: p.cx, y: p.y + p.h, below: true };
    if (this.bells && !this.arc) return { x: p.cx, y: Math.min(p.y - 30, this.groundY - 106 - 42) };
    return super.tipAt();
  }

  // ---------- Dessin ----------
  // le beau soleil qui revient (et le moulin, tout au loin)
  drawSky(ctx) {
    const w = this.world;
    BourrasqueArt.sky(ctx, w.cam.x, w.cam.y, this.arena, this.sun, this.t);
    const M = this.mill;
    BourrasqueArt.farMill(ctx, M.x, M.y, M.a, this.sun);
  }

  // à gauche : un mur de vent (on ne redescend pas par où l'on est arrivé)
  drawWall(ctx, x, k, side) {
    if (side < 0) BourrasqueArt.windWall(ctx, x, this.groundY, k, this.t);
  }

  // les cloches, et la plume posée par terre
  drawDecor(ctx) {
    if (this.bells) {
      for (const b of this.bells) {
        if (b.at > 0 || b.k <= 0.01) continue;
        BourrasqueArt.bell(ctx, b, this.groundY, this.t);
      }
    }
    const F = this.feather;
    if (F && (F.state === 'rest' || F.state === 'fall')) BourrasqueArt.feather(ctx, F.x, F.y, F.rot, 1, this.t, F.cool > 0 && Math.floor(F.t * 10) % 2 === 0);
  }

  drawLife(ctx, x, y, full) {
    BourrasqueArt.lifeCloud(ctx, x, y, full);
  }

  drawBody(ctx) {
    const p = this.world.player;
    const dizzy = this.act === 'dazed' || this.act === 'fall' || (this.state === 'beaten' && this.stateT < 0.6);
    const sleep = this.state === 'sleep' || (this.state === 'wake' && !this.short && this.stateT < 0.4);
    BourrasqueArt.cloud(ctx, this.px, this.py, {
      t: this.t, squash: this.squash, wobble: this.wobble, aaa: this.aaa, tint: this.tint, nose: this.nose, drip: this.drip,
      hanky: this.hanky, cry: this.cry, happy: this.happy, mouth: this.mouth,
      eyes: sleep ? 'sleep' : dizzy ? 'dizzy' : this.act === 'admire' ? 'heart' : this.happy > 0.5 ? 'happy' : this.aaa > 0.3 ? 'squint' : this.eyes < 0.5 ? 'sleep' : 'open',
      look: clamp((p.cx - this.px) / 300, -1, 1), lookY: clamp((p.cy - this.py) / 200, -1, 1),
    });
    if (dizzy) BourrasqueArt.dizzyStars(ctx, this.px, this.py - 46, this.t);
  }

  // par-dessus Malice : la plume qu'elle tient, et l'averse
  drawWarning(ctx) {
    const F = this.feather;
    const p = this.world.player;
    if (F && F.state === 'held' && !p.dead) {
      const tickling = this.toupie.state === 'giggle' || this.toupie.cool > 0.3;
      BourrasqueArt.feather(ctx, F.x, F.y, -0.9 * p.facing + (tickling ? Math.sin(this.t * 40) * 0.25 : Math.sin(this.t * 3) * 0.08), p.facing, this.t);
    }
    if (this.pour > 0) BourrasqueArt.downpour(ctx, this.arena, this.px, this.py + 30, this.groundY, Math.min(1, this.pour * 2, (GUST.pour - this.pour) * 3), this.t);
  }
}

// ======================= SA TOUPIE (la tornade) =======================
// Une petite tornade avec une frimousse, qui tourne sur la galerie. Elle s'occupe elle-même de Malice (sa boîte, pour
// le jeu, est hors de l'écran) :
//  - 1re manche : elle se promène (roam) ; quand Bourrasque le veut, elle se gonfle et le vent arrive vers elle
//    (inhale), puis elle aspire (suck : Malice glisse vers elle, moins vite qu'elle ne marche) ; si Malice entre dedans,
//    elle l'emporte en tournant jusqu'en haut (lift : voir Player.carry), et la lance au-dessus du nuage (pop) ;
//  - 2e manche : elle garde Bourrasque (guard) : sans la plume, elle repousse Malice (sans lui faire mal) ; avec la
//    plume, des chatouilles (giggle), et elle se sauve plus loin (flee) ; au bout de diff.gustTickles chatouilles, elle
//    éclate de rire (laugh), couchée par terre ;
//  - 3e manche : toute fatiguée, elle se repose dans un coin (tired) ; à la fin, elle devient une petite brise (breeze).
class BourrasqueToupie extends Enemy {
  constructor(world, boss, x) {
    super(world, x, -9999, 1, 1);
    this.boss = boss;
    this.tx = x;
    this.goX = x;
    this.state = 'none';
    this.stT = 0;
    this.size = 0;
    this.tickles = 0;
    this.cool = 0;
    this.lie = 0;
    this.lieDir = 1;
    this.from = null;
    this.bx = 0;
    this.by = 0;
    this.arrived = false;
    this.laughT = 0;
    this.passThrow = true;
  }

  get groundY() { return this.boss.groundY; }
  get cx() { return this.tx; }

  setSt(s) {
    this.state = s;
    this.stT = 0;
  }

  // (pour le jeu, sa boîte est hors de l'écran : elle s'occupe elle-même de Malice)
  box() {
    this.x = this.tx - 0.5;
    this.y = -9999;
    this.w = 1;
    this.h = 1;
  }

  // son vrai corps (pour aspirer, chatouiller, repousser)
  body() {
    const h = TOUPIE.h * this.size;
    return { x: this.tx - 30, y: this.groundY - h, w: 60, h };
  }

  // elle ne s'occupe pas de Malice (Bourrasque peut attaquer)
  idle() {
    return this.state === 'roam' || this.state === 'guard' || this.state === 'giggle' || this.state === 'flee' || this.state === 'tired';
  }

  appear() {
    this.setSt('grow');
    Sound.sfx.toupieWhirl();
  }

  open() {
    this.setSt('inhale');
    Sound.sfx.toupieSuck();
  }

  guard() {
    this.release();
    this.size = Math.max(this.size, 0.5);
    this.tickles = 0;
    this.setSt('guard');
  }

  tire() {
    this.release();
    this.setSt('tired');
    this.goX = this.boss.arena.x1 - 70;
  }

  getUp() {
    this.tickles = 0;
    this.setSt('guard');
    this.world.popText(this.tx, this.groundY - 60, 'Hop\u00a0!', '#ffffff', 20);
  }

  breeze() {
    this.release();
    this.setSt('breeze');
    this.bx = this.tx;
    this.by = this.groundY - 60;
    this.arrived = false;
    Sound.sfx.breeze();
  }

  release() {
    const p = this.world.player;
    if (p.carry === this) p.carry = null;
  }

  // (quand Bourrasque est battu, elle reste : elle deviendra une petite brise, voir Bourrasque.outro)
  leave() {
    this.release();
  }

  stomp() {}
  kill() { return false; }
  hitBy() {}
  harmful() { return false; }

  // elle va un peu plus loin (après un saut sur la tête de Bourrasque) : à au moins 5 cases
  moveAway(px) {
    const A = this.boss.arena;
    const lo = A.x0 + 110;
    const hi = A.x1 - 110;
    let x = this.tx;
    for (let i = 0; i < 12 && Math.abs(x - this.tx) < 5 * TILE; i++) x = rand(lo, hi);
    // (pas juste sur Malice)
    if (Math.abs(x - px) < 60) x = clamp(x + (x < (lo + hi) / 2 ? 120 : -120), lo, hi);
    this.goX = x;
    if (this.state === 'rest') this.setSt('roam');
  }

  walkTo(x, sp, dt) {
    this.tx = approach(this.tx, x, sp * dt);
    return Math.abs(this.tx - x) < 1;
  }

  // (2e manche) elle ne vient jamais repousser Malice d'elle-même (sinon, elle pourrait la pousser sous un grêlon) :
  // quand elle arrive sur elle, elle fait demi-tour ; c'est Malice qui vient la chatouiller
  shy(p) {
    const d = p.cx - this.tx;
    if (p.dead || Math.abs(d) > 2.2 * TILE || Math.sign(this.goX - this.tx) !== Math.sign(d)) return;
    const A = this.boss.arena;
    const away = this.tx - Math.sign(d) * 4 * TILE;
    this.goX = clamp(away, A.x0 + 110, A.x1 - 110);
    // (dans un coin : elle reste là, c'est tout)
    if (Math.sign(this.goX - this.tx) === Math.sign(d)) this.goX = this.tx;
  }

  // elle se promène d'un bout à l'autre de la galerie
  wander(dt, sp) {
    if (!this.walkTo(this.goX, sp, dt)) return;
    const A = this.boss.arena;
    let x = this.tx;
    for (let i = 0; i < 12 && Math.abs(x - this.tx) < 4 * TILE; i++) x = rand(A.x0 + 110, A.x1 - 110);
    this.goX = x;
  }

  ai(dt) {
    const w = this.world;
    const K = w.diff.bossK;
    const p = w.player;
    this.stT += dt;
    if (this.cool > 0) this.cool -= dt;
    if (this.state !== 'laugh') this.lie = approach(this.lie, 0, dt * 3);
    switch (this.state) {
      case 'none':
        this.size = 0;
        break;
      case 'grow':
        this.size = Math.min(1, this.stT / 0.8);
        if (this.size >= 1) this.setSt('roam');
        break;
      case 'roam':
        this.wander(dt, 70 * K);
        break;
      case 'inhale':
        // elle se gonfle, et le vent arrive vers elle (voir drawWarning)
        if (this.stT >= 0.9 / K) this.setSt('suck');
        break;
      case 'suck':
        this.suck(dt);
        if (this.state === 'suck' && this.stT >= 3.2 / K) this.setSt('roam');
        break;
      case 'lift':
        if (this.stT >= TOUPIE.lift) this.pop();
        break;
      case 'rest':
        if (this.stT > 0.9) this.setSt('roam');
        break;
      case 'guard':
        this.size = approach(this.size, 1, dt * 2);
        this.shy(p);
        this.wander(dt, 90 * K);
        this.touchy();
        break;
      case 'giggle':
        if (this.stT > 0.45) this.flee(p.cx);
        break;
      case 'flee':
        if (this.walkTo(this.goX, 190 * K, dt)) this.setSt('guard');
        this.touchy();
        break;
      case 'laugh':
        // couchée par terre, elle rit, elle rit…
        this.lie = approach(this.lie, 1, dt * 4);
        this.laughT -= dt;
        if (this.laughT <= 0) {
          this.laughT = 0.7;
          w.spawn({ type: 'text', x: this.tx + rand(-30, 30), y: this.groundY - 50, vx: rand(-30, 30), vy: -60, life: 0.8, text: choose(['Ha\u00a0!', 'Hi hi\u00a0!', 'Ho ho\u00a0!']), color: '#fff6a0', size: 16 });
        }
        break;
      case 'tired':
        this.size = approach(this.size, 0.55, dt);
        this.walkTo(this.goX, 60, dt);
        break;
      case 'breeze': {
        // une petite brise qui s'envole jusqu'au moulin, au loin
        const M = this.boss.mill;
        const u = Math.min(1, this.stT / 2.2);
        this.bx = lerp(this.tx, M.x, u);
        this.by = lerp(this.groundY - 60, M.y - 34, u) - Math.sin(u * Math.PI) * 110;
        if (u >= 1 && !this.arrived) {
          this.arrived = true;
          M.v = 2.4;
          w.popText(M.x, M.y - 80, 'Fffiou\u00a0!', '#ffffff', 18);
        }
        break;
      }
      default: break;
    }
    this.box();
  }

  // Elle aspire : Malice glisse vers elle (moins vite qu'elle ne marche) ; dedans, elle l'emporte.
  suck(dt) {
    const w = this.world;
    const p = w.player;
    if (p.dead || p.carry) return;
    const d = this.tx - p.cx;
    const range = TOUPIE.reach * TILE;
    if (p.y + p.h > this.groundY - 3 * TILE && Math.abs(d) < range) {
      const sp = TOUPIE.pull * (1 - (Math.abs(d) / range) * 0.5);
      const nx = p.x + Math.sign(d) * Math.min(Math.abs(d), sp * dt);
      if (!w.boxSolid(nx, p.y, p.w, p.h)) p.x = nx;
    }
    if (overlap(p, this.body())) this.grab(p);
  }

  grab(p) {
    const w = this.world;
    // (le pissenlit, la charge, la bulle, le nuage… s'arrêtent)
    p.dropPuff();
    p.stopPower();
    p.grap = null;
    p.pound = 0;
    p.stunT = 0;
    if (p.ball && p.roomToStand()) p.standUp();
    p.platform = null;
    p.onGround = false;
    p.vx = 0;
    p.vy = 0;
    p.carry = this;
    this.from = { x: p.cx, y: p.y + p.h };
    this.setSt('lift');
    Sound.sfx.toupieLift();
    w.popText(p.cx, p.y - 20, 'Wiiiii\u00a0!', '#ffffff', 22);
    this.boss.onLift();
  }

  // Player.carry : elle monte Malice en tournant jusqu'en haut de la toupie
  move(p) {
    const u = clamp(this.stT / TOUPIE.lift, 0, 1);
    const e = u * u * (3 - 2 * u);
    const feet = lerp(this.from.y, this.groundY - TOUPIE.h + 4, e);
    const x = lerp(this.from.x, this.tx, Math.min(1, u * 2.5)) + Math.sin(u * 14) * 48 * u * (1 - u);
    p.x = x - p.w / 2;
    p.y = feet - p.h;
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
    p.prevBottom = p.y + p.h;
    // (elle tourne sur elle-même)
    p.facing = Math.floor(u * 16) % 2 ? 1 : -1;
  }

  // et la lance tout là-haut, au-dessus de Bourrasque
  pop() {
    const w = this.world;
    const p = w.player;
    if (p.carry === this) {
      p.carry = null;
      p.vy = -TOUPIE.pop;
      p.vx = 0;
      p.jumping = false;
      p.coyote = 0;
      p.onGround = false;
      p.prevBottom = p.y + p.h;
      w.puff(p.cx, p.y + p.h, '#eef4ff');
    }
    this.setSt('rest');
    this.boss.onPop();
  }

  // 2e manche : la plume la chatouille ; sans plume, elle repousse Malice
  touchy() {
    const w = this.world;
    const p = w.player;
    if (p.dead || this.cool > 0) return;
    const body = this.body();
    const F = this.boss.feather;
    if (F && F.state === 'held') {
      // (la plume dépasse devant elle)
      const reach = { x: p.x + (p.facing > 0 ? 0 : -28), y: p.y + 4, w: p.w + 28, h: p.h - 4 };
      if (overlap(reach, body)) this.tickle();
    } else if (overlap(p, body)) {
      this.push(p);
    }
  }

  tickle() {
    const w = this.world;
    const need = w.diff.gustTickles || 3;
    this.tickles++;
    // (le conseil s'en va : il cacherait les « Hi hi ! Encore 2 ! »)
    this.boss.tip = null;
    this.cool = 0.6;
    const top = this.groundY - TOUPIE.h * this.size;
    if (this.tickles >= need) {
      // elle éclate de rire, et s'arrête de tourner
      this.setSt('laugh');
      this.lieDir = Math.sign(this.tx - w.player.cx) || 1;
      this.laughT = 0.3;
      Sound.sfx.laugh();
      w.popText(this.tx, top - 20, 'HA HA HA HA\u00a0!', '#fff6a0', 28);
      w.shake(4);
      return;
    }
    this.setSt('giggle');
    Sound.sfx.giggle();
    const left = need - this.tickles;
    w.popText(this.tx, top - 10, left > 1 ? `Hi hi\u00a0! Encore ${left}\u00a0!` : 'Hi hi hi\u00a0! Encore une\u00a0!', '#fff6a0', 20);
  }

  // elle se sauve loin de Malice (et si elle est dans un coin, elle passe par-dessus elle, sans la chatouiller)
  flee(px) {
    const A = this.boss.arena;
    const lo = A.x0 + 90;
    const hi = A.x1 - 90;
    const d = Math.sign(this.tx - px) || 1;
    let x = this.tx + d * rand(240, 320);
    if (x < lo || x > hi) {
      x = clamp(px - d * rand(220, 300), lo, hi);
      this.cool = 1.6;
    }
    this.goX = clamp(x, lo, hi);
    this.setSt('flee');
  }

  // sans la plume : fffou ! elle la repousse doucement (sans lui faire mal ; jamais contre le bord de l'arène)
  push(p) {
    const w = this.world;
    const A = this.boss.arena;
    let d = Math.sign(p.cx - this.tx) || 1;
    if ((d < 0 && p.x - A.x0 < 70) || (d > 0 && A.x1 - (p.x + p.w) < 70)) d = -d;
    p.vx = d * 330;
    p.vy = Math.min(p.vy, -330);
    p.onGround = false;
    p.platform = null;
    p.boostT = 0.3;
    this.cool = 0.5;
    w.popText(this.tx, this.groundY - 120, 'Fffou\u00a0!', '#ffffff', 18);
    Sound.sfx.boing(false);
    this.boss.onPushed();
  }

  draw(ctx) {
    if (this.state === 'none') return;
    if (this.state === 'breeze') {
      const u = Math.min(1, this.stT / 2.2);
      const a = this.arrived ? clamp(1 - (this.stT - 2.2) / 0.8, 0, 1) : 1;
      if (a > 0) BourrasqueArt.breeze(ctx, this.bx, this.by, 1 - u * 0.6, this.t, a);
      return;
    }
    BourrasqueArt.toupie(ctx, this.tx, this.groundY, {
      t: this.t, size: this.size, lie: this.lie * this.lieDir, state: this.state,
      inhale: this.state === 'inhale' ? Math.min(1, this.stT * 2) : this.state === 'suck' ? 1 : 0,
    });
  }

  // par-dessus Malice : le vent qui arrive vers elle quand elle aspire, et le tourbillon autour de Malice qu'elle emporte
  drawWarning(ctx) {
    const s = this.state;
    if (s === 'inhale' || s === 'suck') {
      const k = s === 'inhale' ? Math.min(1, this.stT * 1.5) : 1;
      BourrasqueArt.suckWind(ctx, this.tx, this.groundY, TOUPIE.reach * TILE, k, this.t);
    }
    if (s === 'lift') {
      const p = this.world.player;
      BourrasqueArt.liftSwirl(ctx, p.cx, p.y + p.h / 2, this.t);
    }
  }
}

// ======================= LES GRÊLONS =======================
// Un petit nuage de grêle part de Bourrasque et s'arrête là-haut, au-dessus de l'endroit visé : le grêlon grossit
// dedans, et son ombre grandit par terre (form)… puis il tombe (fall : c'est là seulement qu'il fait mal), rebondit deux
// fois par terre (bounce), et fond (melt). Sur un grêlon qui rebondit, on peut sauter : il se casse.
class BourrasqueGrelon extends Enemy {
  constructor(world, boss, x, warn) {
    super(world, x - 12, -9999, 24, 24);
    this.boss = boss;
    this.ouch = 'hail';
    this.gx = x;
    this.gy = GRELON_Y;
    this.r = 12;
    this.state = 'form';
    this.stT = 0;
    this.warn = warn;
    this.from = { x: boss.px, y: boss.py };
    this.bounces = 0;
    this.rot = rand(0, 6);
    this.passThrow = true;
  }

  get groundY() { return this.boss.groundY; }
  get cx() { return this.gx; }

  ai(dt) {
    const w = this.world;
    const A = this.boss.arena;
    this.stT += dt;
    switch (this.state) {
      case 'form':
        if (this.stT >= this.warn) {
          this.state = 'fall';
          this.stT = 0;
          this.vy = 80;
        }
        break;
      case 'fall':
        this.vy += 1500 * dt;
        this.gy += this.vy * dt;
        this.rot += dt * 4;
        if (this.gy + this.r >= this.groundY) {
          this.gy = this.groundY - this.r;
          this.state = 'bounce';
          this.vy = -330;
          this.vx = rand(-70, 70);
          if (w.onScreen(this, 60)) Sound.sfx.hailLand();
          for (let i = 0; i < 4; i++) {
            w.spawn({ type: 'spark', x: this.gx + rand(-8, 8), y: this.groundY - 4, vx: rand(-140, 140), vy: rand(-180, -40), life: 0.35, size: rand(2, 4), color: '#e8f6ff' });
          }
        }
        break;
      case 'bounce':
        this.vy += 1500 * dt;
        this.gy += this.vy * dt;
        this.gx = clamp(this.gx + this.vx * dt, A.x0 + this.r, A.x1 - this.r);
        this.rot += this.vx * dt * 0.08;
        if (this.gy + this.r >= this.groundY) {
          this.gy = this.groundY - this.r;
          this.bounces++;
          if (this.bounces >= 2) {
            this.state = 'melt';
            this.stT = 0;
          } else {
            this.vy = -160;
            this.vx *= 0.6;
            if (w.onScreen(this, 60)) Sound.sfx.hailLand();
          }
        }
        break;
      case 'melt':
        // il fond : une petite flaque, qui sèche
        if (this.stT > 1.3) this.dead = true;
        break;
      default: break;
    }
    this.box();
  }

  box() {
    if (this.state === 'fall' || this.state === 'bounce') {
      this.x = this.gx - this.r;
      this.y = this.gy - this.r;
      this.w = this.r * 2;
      this.h = this.r * 2;
    } else {
      this.x = this.gx - this.r;
      this.y = -9999;
      this.w = this.r * 2;
      this.h = 1;
    }
    this.stompDepth = 16;
  }

  // il ne fait mal qu'en tombant (même si Malice lui tombe dessus) ; par terre, il rebondit sans rien faire
  harmful() { return this.state === 'fall'; }
  prickly() { return this.state === 'fall'; }

  shatter() {
    const w = this.world;
    this.dead = true;
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'debris', x: this.gx + rand(-5, 5), y: this.gy, vx: rand(-180, 180), vy: rand(-300, -100), g: 1300, life: 0.5, size: rand(3, 5), color: choose(['#ffffff', '#d4ecff', '#a8d4f4']), vr: rand(-12, 12) });
    }
    if (w.onScreen(this, 60)) Sound.sfx.hailLand();
  }

  stomp() {
    if (this.state === 'bounce') {
      this.world.popText(this.gx, this.gy - 20, 'Crac\u00a0!', '#e8f6ff', 18);
      this.shatter();
    }
  }

  kill() {
    if (this.state !== 'fall' && this.state !== 'bounce') return false;
    this.shatter();
    return true;
  }

  hitBy() {}

  leave() {
    this.dead = true;
    if (this.state !== 'melt') this.world.puff(this.state === 'form' ? this.gx : this.gx, this.gy, '#e8f0ff');
  }

  shotBox() {
    return this.state === 'fall' || this.state === 'bounce' ? this : { x: this.x, y: -9999, w: 0, h: 0 };
  }

  draw(ctx) {
    const G = this.groundY;
    if (this.state === 'form' || this.state === 'fall') {
      // son ombre par terre, qui grandit
      const k = this.state === 'form' ? Math.min(1, this.stT / this.warn) * 0.6 : 0.6 + Math.min(0.4, (this.gy - GRELON_Y) / 500);
      ctx.fillStyle = `rgba(30,40,90,${0.18 + 0.3 * k})`;
      ellipsePath(ctx, this.gx, G + 1, this.r * (0.8 + 1.3 * k), 3 + 3 * k);
      ctx.fill();
    }
    if (this.state === 'form') {
      // le petit nuage de grêle part de Bourrasque, puis tremble là-haut ; le grêlon grossit dedans
      const u = Math.min(1, this.stT / 0.35);
      const x = lerp(this.from.x, this.gx, u);
      const y = lerp(this.from.y, GRELON_Y - 14, u);
      const g = Math.min(1, this.stT / this.warn);
      if (u >= 1) BourrasqueArt.hailstone(ctx, this.gx + Math.sin(this.t * 40) * 1.5 * g, GRELON_Y + 4 * g, this.r * (0.4 + 0.6 * g), this.rot);
      BourrasqueArt.hailPuff(ctx, x + (u >= 1 ? Math.sin(this.t * 30) * 2 * g : 0), y, 0.5 + 0.2 * u, this.t);
    } else if (this.state === 'fall' || this.state === 'bounce') {
      if (this.state === 'bounce') {
        ctx.fillStyle = 'rgba(30,40,90,0.2)';
        ellipsePath(ctx, this.gx, G + 1, this.r, 3);
        ctx.fill();
      }
      BourrasqueArt.hailstone(ctx, this.gx, this.gy, this.r, this.rot);
    } else {
      BourrasqueArt.puddle(ctx, this.gx, G, this.r, Math.min(1, this.stT / 0.5), Math.max(0, 1 - (this.stT - 0.5) / 0.8));
    }
  }
}

// ======================= LES ÉCLAIRS ÉTERNUÉS =======================
// « Aaa… aaah… » : l'endroit où il va tomber est marqué par terre (une ombre et un « ! » qui clignote : aim)… puis
// ATCHOUM ! Un éclair au chocolat part de son nez tout droit jusque-là (fly), et grésille par terre (zap), comme
// les éclairs de la Vallée des Orages (OUCH.zap).
class BourrasqueEclair extends Enemy {
  constructor(world, boss, x, warn) {
    super(world, x - 15, -9999, 30, 30);
    this.boss = boss;
    this.ouch = 'zap';
    this.ex = x;
    this.state = 'aim';
    this.stT = 0;
    this.warn = warn;
    this.from = null;
    this.fx = x;
    this.fy = 0;
    this.ang = 0;
    this.seed = rand(0, 100);
    this.passThrow = true;
  }

  get groundY() { return this.boss.groundY; }
  get cx() { return this.ex; }

  ai(dt) {
    const w = this.world;
    const B = this.boss;
    this.stT += dt;
    switch (this.state) {
      case 'aim':
        if (this.stT >= this.warn) {
          this.state = 'fly';
          this.stT = 0;
          this.from = B.nosePos();
          this.fx = this.from.x;
          this.fy = this.from.y;
          this.ang = Math.atan2(this.groundY - 8 - this.from.y, this.ex - this.from.x);
          B.atchoum(true);
        }
        break;
      case 'fly': {
        // (il file d'abord au-dessus de l'endroit marqué, puis tombe presque tout droit dessus : il ne touche
        // jamais Malice qui s'est écartée de la marque)
        const u = Math.min(1, this.stT / 0.36);
        const ox = this.fx;
        const oy = this.fy;
        this.fx = lerp(this.from.x, this.ex, 1 - (1 - u) * (1 - u));
        this.fy = lerp(this.from.y, this.groundY - 8, u * u);
        if (this.stT > 0.02) this.ang = Math.atan2(this.fy - oy, this.fx - ox);
        if (u >= 1) {
          this.state = 'zap';
          this.stT = 0;
          if (w.onScreen(this, 100)) Sound.sfx.zap();
          w.shake(4);
          for (let i = 0; i < 10; i++) {
            w.spawn({ type: 'spark', x: this.ex, y: this.groundY - 6, vx: rand(-260, 260), vy: rand(-260, -40), g: 600, life: 0.5, size: rand(4, 7), color: '#fff59a' });
          }
        }
        break;
      }
      case 'zap':
        if (this.stT > 0.55) {
          this.state = 'fade';
          this.stT = 0;
        }
        break;
      default:
        if (this.stT > 0.4) this.dead = true;
        break;
    }
    this.box();
  }

  box() {
    if (this.state === 'fly') {
      this.x = this.fx - 15;
      this.y = this.fy - 15;
      this.w = 30;
      this.h = 30;
    } else if (this.state === 'zap') {
      this.x = this.ex - 40;
      this.y = this.groundY - 34;
      this.w = 80;
      this.h = 34;
    } else {
      this.x = this.ex - 15;
      this.y = -9999;
      this.w = 30;
      this.h = 1;
    }
  }

  harmful() { return this.state === 'fly' || this.state === 'zap'; }
  prickly() { return this.harmful(); }
  stomp() {}
  kill() { return false; }
  hitBy() {}

  leave() {
    this.dead = true;
    if (this.state === 'fly' || this.state === 'zap') this.world.puff(this.state === 'fly' ? this.fx : this.ex, this.state === 'fly' ? this.fy : this.groundY - 10, '#fff2c0');
  }

  draw(ctx) {
    if (this.state === 'fly') {
      const glow = ctx.createRadialGradient(this.fx, this.fy, 4, this.fx, this.fy, 40);
      glow.addColorStop(0, 'rgba(255,240,120,0.7)');
      glow.addColorStop(1, 'rgba(255,240,120,0)');
      ctx.fillStyle = glow;
      circlePath(ctx, this.fx, this.fy, 40);
      ctx.fill();
      Art.eclair(ctx, this.fx, this.fy, this.ang, 1);
    } else if (this.state === 'zap' || this.state === 'fade') {
      const a = this.state === 'fade' ? Math.max(0, 1 - this.stT / 0.4) : 1;
      ctx.save();
      ctx.globalAlpha = a;
      Art.eclair(ctx, this.ex, this.groundY - 8, 0, 1);
      ctx.restore();
      if (this.state === 'zap') Art.sparks(ctx, this.ex, this.groundY - 6, 50, Math.floor(this.t * 20) + this.seed, Math.min(1, (0.55 - this.stT) * 3));
    }
  }

  // l'ombre et le « ! » par terre, par-dessus Malice pour qu'on les voie bien
  drawWarning(ctx) {
    if (this.state !== 'aim' && this.state !== 'fly') return;
    const k = this.state === 'aim' ? Math.min(1, this.stT / this.warn) : 1;
    const G = this.groundY;
    ctx.fillStyle = `rgba(90,40,0,${0.18 + 0.3 * k})`;
    ellipsePath(ctx, this.ex, G - 2, 14 + 26 * k, 4 + 3 * k);
    ctx.fill();
    if (Math.floor(this.stT * (6 + 8 * k)) % 2 === 0) {
      const y = G - 92;
      ctx.fillStyle = '#ffe94a';
      ctx.strokeStyle = '#7a2a00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.ex, y - 16);
      ctx.lineTo(this.ex + 15, y + 11);
      ctx.lineTo(this.ex - 15, y + 11);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.fillStyle = '#7a2a00';
      ctx.font = '700 17px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', this.ex, y + 3);
    }
  }
}

// ======================= L'ARC-EN-CIEL =======================
// Un pont tout en couleurs, d'un côté de la galerie à l'autre (il sort de l'arène à droite) : on marche dessus (c'est
// une plateforme, qu'on traverse par en dessous) jusqu'en haut, juste sous Bourrasque. Il pousse de gauche à droite.
// (Une seule petite plateforme, qui suit Malice sous ses pieds, à la hauteur de l'arc à cet endroit.)
class BourrasqueArc {
  constructor(world, xa, ground) {
    this.world = world;
    this.xa = xa;
    this.xb = xa + ARC.w;
    this.ground = ground;
    this.top = ground - ARC.h;
    this.apexX = xa + ARC.w / 2;
    this.k = 0;
    this.t = 0;
    this.x = -9999;
    this.y = ground;
    this.w = 40;
    this.h = 14;
    this.dx = 0;
    this.dy = 0;
  }

  // la hauteur de l'arc en x
  surface(x) {
    return this.ground - ARC.h * Math.sin((Math.PI * (x - this.xa)) / ARC.w);
  }

  // (à la fin, il s'efface doucement dans le soleil : on ne marche plus dessus, on retombe sur la galerie)
  vanish() {
    this.fading = true;
  }

  update(dt) {
    this.t += dt;
    this.k = Math.min(1, this.k + dt / 1.3);
    const p = this.world.player;
    if (this.fading) {
      this.alpha = (this.alpha === undefined ? 1 : this.alpha) - dt / 3;
      this.x = -9999;
      if (p.platform === this) {
        p.platform = null;
        p.onGround = false;
      }
      if (this.alpha <= 0) this.world.platforms = this.world.platforms.filter((pl) => pl !== this);
      return;
    }
    const lim = this.xa + ARC.w * this.k;
    const oy = this.y;
    // (en marchant par terre jusqu'à son pied, on monte dessus, sans sauter)
    if (p.onGround && !p.platform && !p.carry && !p.dead && p.cx > this.xa + 4 && p.cx < this.xa + 70 && Math.abs(p.y + p.h - this.ground) < 3) {
      this.y = this.surface(p.cx);
      this.x = p.cx - this.w / 2;
      p.y = this.y - p.h;
      p.vy = 0;
      p.platform = this;
    }
    if (p.cx > this.xa + 4 && p.cx < lim) {
      this.x = p.cx - this.w / 2;
      this.y = this.surface(p.cx);
    } else {
      this.x = -9999;
    }
    this.dy = this.y - oy;
  }

  // (le Lutin ne pose pas de bloc magique sur l'arc-en-ciel)
  blockZone() {
    return { x: this.xa, y: this.top - 70, w: ARC.w, h: ARC.h + 50 };
  }

  draw(ctx) {
    if (this.alpha !== undefined && this.alpha <= 0) return;
    ctx.save();
    if (this.alpha !== undefined) ctx.globalAlpha = this.alpha;
    BourrasqueArt.rainbow(ctx, this.xa, this.ground, this.k, this.t);
    ctx.restore();
  }
}

// ======================= LES DESSINS =======================
// Bourrasque : un gros nuage tout rond (en cache : gris d'orage, puis tout blanc quand il est guéri), un bonnet de
// laine, un gros nez rouge qui coule, des yeux fatigués ; sa toupie (une petite tornade avec une frimousse), les
// grêlons, la plume, les cloches, l'arc-en-ciel, le mur de vent, le beau soleil et le moulin au loin.
const BourrasqueArt = (() => {
  const TAU = Math.PI * 2;
  const paint = (ctx, fill, line, lw) => Art.paint(ctx, fill, line, lw);
  // les couleurs des trois cloches (et des deux bandes de l'arc-en-ciel que chacune fait apparaître)
  const BELL = ['#ff7a5a', '#8ee04a', '#6aa8ff'];
  const BANDS = ['#ff5a5a', '#ffa040', '#ffe24a', '#6ad86a', '#4aa8ff', '#a070ff'];
  // les bouts de nuage qui font son corps : [x, y, rayon]
  const PUFFS = [[0, 2, 40], [-44, 8, 32], [44, 8, 32], [-22, -16, 32], [22, -20, 34], [-70, 20, 20], [70, 20, 20], [0, 24, 34], [-40, 26, 24], [40, 26, 24]];
  const LOOK = {
    grey: { line: '#4e4870', shade: '#8f88b8', light: '#c4bfe0' },
    white: { line: '#7c88b8', shade: '#d4def4', light: '#ffffff' },
  };

  // ---------- Bourrasque ----------
  // Son corps ne change jamais : dessiné une fois (gris, et blanc).
  const bodies = {};
  function bodySprite(kind) {
    if (bodies[kind]) return bodies[kind];
    const c = document.createElement('canvas');
    c.width = 240;
    c.height = 150;
    const g = c.getContext('2d');
    g.translate(120, 76);
    const L = LOOK[kind];
    // (le contour : tous les bouts de nuage en gros traits, puis on les remplit par-dessus)
    g.strokeStyle = L.line;
    g.lineWidth = 7;
    for (const [x, y, r] of PUFFS) {
      circlePath(g, x, y, r);
      g.stroke();
    }
    g.fillStyle = L.shade;
    for (const [x, y, r] of PUFFS) {
      circlePath(g, x, y, r);
      g.fill();
    }
    g.fillStyle = L.light;
    for (const [x, y, r] of PUFFS) {
      circlePath(g, x, y - 5, r - 4);
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (const [x, y, r] of [[-28, -26, 12], [16, -32, 11], [-52, -2, 8]]) {
      circlePath(g, x, y, r);
      g.fill();
    }
    bodies[kind] = c;
    return c;
  }

  // o : t, squash, wobble, aaa (il se gonfle), tint (0 gris, 1 blanc), nose (1 rouge, 0 rose), drip (le nez qui coule),
  //     hanky (son mouchoir), cry, happy, mouth (il parle), eyes ('sleep', 'open', 'squint', 'dizzy', 'heart',
  //     'happy'), look / lookY (où il regarde)
  function cloud(ctx, x, y, o) {
    const t = o.t;
    ctx.save();
    ctx.translate(x, y);
    const sq = o.squash || 0;
    const aa = o.aaa || 0;
    const wb = (o.wobble || 0) * Math.sin(t * 22) * 0.05;
    ctx.scale(1 + sq * 0.25 + aa * 0.08 + wb, 1 - sq * 0.3 + aa * 0.1 - wb);
    // ses petits bras (des bouts de nuage)
    const L = o.tint > 0.5 ? LOOK.white : LOOK.grey;
    const hk = o.hanky || 0;
    const armL = [-92, 18 + Math.sin(t * 2) * 3];
    const armR = [lerp(92, 30, hk), lerp(18 + Math.cos(t * 2) * 3, 22, hk)];
    for (const [ax, ay] of [armL, armR]) {
      circlePath(ctx, ax, ay, 13);
      paint(ctx, L.light, L.line, 3);
    }
    if (o.tint < 1) ctx.drawImage(bodySprite('grey'), -120, -76);
    if (o.tint > 0) {
      ctx.globalAlpha = o.tint;
      ctx.drawImage(bodySprite('white'), -120, -76);
      ctx.globalAlpha = 1;
    }
    bonnet(ctx, -30, -50, t);
    face(ctx, o);
    // son mouchoir (à carreaux), devant le nez
    if (hk > 0.05) {
      ctx.save();
      ctx.translate(14, 22);
      ctx.scale(hk, hk);
      ctx.rotate(-0.2);
      roundRectPath(ctx, -16, -14, 32, 26, 5);
      paint(ctx, '#ffffff', '#6a7ab0', 1.6);
      ctx.strokeStyle = 'rgba(80,120,220,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const v of [-6, 4]) {
        ctx.moveTo(v, -13);
        ctx.lineTo(v, 11);
        ctx.moveTo(-15, v);
        ctx.lineTo(15, v);
      }
      ctx.stroke();
      circlePath(ctx, 16, 6, 12);
      paint(ctx, L.light, L.line, 3);
      ctx.restore();
    }
    ctx.restore();
  }

  // un bonnet de laine rayé, avec un pompon (penché sur sa tête)
  function bonnet(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.3 + Math.sin(t * 1.5) * 0.04);
    ctx.beginPath();
    ctx.moveTo(-26, 6);
    ctx.quadraticCurveTo(-24, -26, 2, -30);
    ctx.quadraticCurveTo(26, -28, 26, 6);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#e8424e';
    ctx.fillRect(-30, -34, 60, 42);
    ctx.fillStyle = '#ffffff';
    for (const yy of [-22, -10]) ctx.fillRect(-30, yy, 60, 5);
    ctx.restore();
    ctx.strokeStyle = '#7a1a26';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    roundRectPath(ctx, -29, 0, 58, 12, 6);
    paint(ctx, '#f4f0ff', '#7a1a26', 2.2);
    ctx.strokeStyle = 'rgba(122,26,38,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = -24; i <= 24; i += 6) {
      ctx.moveTo(i, 2);
      ctx.lineTo(i, 10);
    }
    ctx.stroke();
    circlePath(ctx, 4 + Math.sin(t * 3) * 1.5, -32, 8);
    paint(ctx, '#ffffff', '#7a1a26', 2);
    ctx.restore();
  }

  function face(ctx, o) {
    const t = o.t;
    const lx = (o.look || 0) * 4;
    const ly = (o.lookY || 0) * 3;
    const eyes = o.eyes;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // les joues roses
    ctx.fillStyle = `rgba(255,120,150,${0.25 + 0.3 * (o.happy || 0)})`;
    for (const s of [-1, 1]) {
      ellipsePath(ctx, s * 40, 16, 11, 7);
      ctx.fill();
    }
    for (const s of [-1, 1]) {
      const ex = s * 22;
      const ey = -4;
      ctx.save();
      ctx.translate(ex, ey);
      if (eyes === 'sleep') {
        ctx.strokeStyle = '#2e2846';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -2, 9, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else if (eyes === 'squint') {
        // > < : ça chatouille dans son nez
        ctx.strokeStyle = '#2e2846';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-s * 9, -7);
        ctx.lineTo(s * 4, 0);
        ctx.lineTo(-s * 9, 7);
        ctx.stroke();
      } else if (eyes === 'happy') {
        ctx.strokeStyle = '#2e2846';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(0, 3, 9, Math.PI + 0.3, -0.3);
        ctx.stroke();
      } else if (eyes === 'heart') {
        ctx.scale(1 + Math.sin(t * 8) * 0.08, 1 + Math.sin(t * 8) * 0.08);
        Art.heart(ctx, 0, 0, 0.9, '#ff6aa8', '#a01a5a');
      } else if (eyes === 'dizzy') {
        ellipsePath(ctx, 0, 0, 11, 13);
        paint(ctx, '#ffffff', '#2e2846', 2.2);
        ctx.strokeStyle = '#2e2846';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < 12; a += 0.4) {
          const r = a * 0.75;
          ctx.lineTo(Math.cos(a + t * 8 * s) * r, Math.sin(a + t * 8 * s) * r);
        }
        ctx.stroke();
      } else {
        ellipsePath(ctx, 0, 0, 11, 13);
        paint(ctx, '#ffffff', '#2e2846', 2.2);
        circlePath(ctx, lx, ly + 1, 5.5);
        ctx.fillStyle = '#2e2846';
        ctx.fill();
        circlePath(ctx, lx - 2, ly - 1.5, 1.8);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        // les paupières lourdes (il est malade)
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 14, 0, Math.PI + 0.05, -0.05);
        ctx.closePath();
        ctx.fillStyle = o.tint > 0.5 ? '#e4ecfa' : '#a39cc8';
        ctx.globalAlpha = 1 - (o.happy || 0);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#2e2846';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, -1);
        ctx.lineTo(11, -1);
        if (!(o.happy > 0.5)) ctx.stroke();
      }
      ctx.restore();
    }
    // il pleure : des larmes qui coulent
    if (o.cry > 0.05) {
      ctx.fillStyle = `rgba(110,180,255,${0.85 * o.cry})`;
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const k = (t * 1.6 + i / 3 + (s > 0 ? 0.5 : 0)) % 1;
          ellipsePath(ctx, s * (30 + k * 10), 6 + k * 40, 3.5, 5);
          ctx.fill();
        }
      }
    }
    // le nez rouge (rose quand il est guéri), qui coule
    const nose = o.nose === undefined ? 1 : o.nose;
    const ng = ctx.createRadialGradient(-3, 10, 2, 0, 14, 14);
    ng.addColorStop(0, nose > 0.5 ? '#ff9a9a' : '#ffd8e4');
    ng.addColorStop(1, Art.mixColor('#f4a0b8', '#d02a3e', nose));
    ctx.fillStyle = ng;
    circlePath(ctx, 0, 14, 12 + (o.aaa || 0) * 2);
    ctx.fill();
    ctx.strokeStyle = Art.mixColor('#b0607a', '#7a1020', nose);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circlePath(ctx, -4, 9, 3);
    ctx.fill();
    const drip = o.drip || 0;
    if (drip > 0.05) {
      const len = (5 + 7 * (0.5 + 0.5 * Math.sin(t * 1.8))) * drip;
      ctx.fillStyle = 'rgba(170,220,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(4, 24);
      ctx.quadraticCurveTo(10, 24 + len, 6, 26 + len + 3);
      ctx.quadraticCurveTo(0, 26 + len, 4, 24);
      ctx.fill();
      circlePath(ctx, 6, 26 + len, 3.2 * drip);
      ctx.fill();
    }
    // la bouche
    const my = 34;
    ctx.strokeStyle = '#2e2846';
    ctx.fillStyle = '#5a1e3a';
    ctx.lineWidth = 2.6;
    const aa = o.aaa || 0;
    if (aa > 0.15) {
      ellipsePath(ctx, 0, my + 2, 5 + aa * 5, 4 + aa * 6);
      paint(ctx, '#5a1e3a', '#2e2846', 2.2);
    } else if (o.mouth > 0.1) {
      ellipsePath(ctx, 0, my, 7, 2 + o.mouth * 6);
      paint(ctx, '#5a1e3a', '#2e2846', 2.2);
    } else if (o.happy > 0.5) {
      ctx.beginPath();
      ctx.arc(0, my - 6, 11, 0.25, Math.PI - 0.25);
      ctx.stroke();
    } else if (o.cry > 0.3) {
      ctx.beginPath();
      ctx.moveTo(-10, my + 3);
      for (let i = 1; i <= 4; i++) ctx.lineTo(-10 + i * 5, my + (i % 2 ? -1 : 3) + Math.sin(t * 20) * 1.2);
      ctx.stroke();
    } else if (o.eyes !== 'sleep') {
      // un petit air grognon et enrhumé
      ctx.beginPath();
      ctx.moveTo(-9, my + 2);
      ctx.quadraticCurveTo(0, my - 4, 9, my + 2);
      ctx.stroke();
    }
  }

  // tout étourdi : des étoiles qui tournent au-dessus de lui
  function dizzyStars(ctx, x, y, t) {
    for (let i = 0; i < 4; i++) {
      const a = t * 5 + (i * TAU) / 4;
      ctx.save();
      ctx.translate(x + Math.cos(a) * 46, y + Math.sin(a) * 9);
      ctx.rotate(t * 4 + i);
      Art.starShape(ctx, 7, 0.45);
      paint(ctx, '#ffe94a', '#b07800', 1.4);
      ctx.restore();
    }
  }

  // une vie dans le haut de l'écran : un petit nuage avec son nez rouge ; perdue, il n'en reste qu'une ombre
  function lifeCloud(ctx, x, y, full) {
    ctx.save();
    ctx.fillStyle = full ? 'rgba(160,150,230,0.45)' : 'rgba(255,255,255,0.12)';
    circlePath(ctx, x, y, 19);
    ctx.fill();
    if (!full) ctx.globalAlpha *= 0.35;
    Scenery.fluffyCloud(ctx, x, y + 1, 0.42, full ? '#d6d2f0' : '#ffffff', full ? '#8f88b8' : '#cccccc');
    if (full) {
      circlePath(ctx, x, y + 4, 4);
      ctx.fillStyle = '#e03a4a';
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Sa toupie ----------
  // o : t, size (elle pousse : de 0 à 1), lie (couchée par terre, de -1 à 1), state, inhale (elle se gonfle)
  function toupie(ctx, x, g, o) {
    const k = o.size;
    if (k <= 0.01) return;
    const t = o.t;
    const H = TOUPIE.h * k;
    const inh = o.inhale || 0;
    const laugh = o.state === 'laugh';
    const spin = laugh ? 0.4 : o.state === 'suck' || o.state === 'lift' ? 2.2 : 1;
    ctx.save();
    ctx.translate(x, g);
    if (o.lie) {
      ctx.translate(Math.sin(t * 30) * 2 * Math.abs(o.lie), -14 * Math.abs(o.lie));
      ctx.rotate(-o.lie * 1.3);
    }
    const N = 12;
    const ring = (i) => {
      const u = i / N;
      return { y: -u * H, r: (9 + 46 * Math.pow(u, 1.3)) * k * (1 + inh * 0.25 * u), sx: Math.sin(t * 3 + u * 5) * 10 * u * k * (laugh ? 0.3 : 1) };
    };
    // le corps du tourbillon
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const R = ring(i);
      ctx.lineTo(R.sx - R.r, R.y);
    }
    for (let i = N; i >= 0; i--) {
      const R = ring(i);
      ctx.lineTo(R.sx + R.r, R.y);
    }
    ctx.closePath();
    const gr = ctx.createLinearGradient(0, 0, 0, -H);
    gr.addColorStop(0, 'rgba(170,175,215,0.75)');
    gr.addColorStop(1, 'rgba(225,230,250,0.6)');
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,90,150,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // les anneaux de vent qui tournent
    for (let i = 1; i <= N; i++) {
      const R = ring(i);
      const a = t * 7 * spin + i * 1.3;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(R.sx, R.y, R.r, R.r * 0.24, 0, a % TAU, (a % TAU) + 1.6);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(100,100,160,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(R.sx, R.y, R.r * 0.8, R.r * 0.2, 0, (a + 3) % TAU, ((a + 3) % TAU) + 1.1);
      ctx.stroke();
    }
    // la poussière qui tourne en bas
    ctx.fillStyle = 'rgba(200,200,230,0.7)';
    for (let i = 0; i < 5; i++) {
      const a = t * 9 * spin + i * 1.26;
      circlePath(ctx, Math.cos(a) * 22 * k, -4 + Math.sin(a) * 4, 3.5 * k);
      ctx.fill();
    }
    // sa frimousse
    const F = ring(Math.round(N * 0.55));
    ctx.translate(F.sx, F.y);
    ctx.scale(k, k);
    ctx.strokeStyle = '#2e2846';
    ctx.fillStyle = '#2e2846';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    if (o.state === 'tired') {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * 10, -2, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    } else if (laugh || o.state === 'giggle') {
      // ^ ^ des chatouilles !
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * 10, 0, 5, Math.PI + 0.3, -0.3);
        ctx.stroke();
      }
    } else {
      for (const s of [-1, 1]) {
        ellipsePath(ctx, s * 10, -2, 3.2, 4.5);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      for (const s of [-1, 1]) {
        circlePath(ctx, s * 10 - 1, -4, 1.2);
        ctx.fill();
      }
    }
    if (inh > 0.1) {
      // elle aspire : la bouche en O, les joues gonflées
      ellipsePath(ctx, 0, 10, 4 + inh * 2, 5 + inh * 3);
      paint(ctx, '#5a1e3a', '#2e2846', 2);
    } else if (laugh || o.state === 'giggle') {
      ctx.beginPath();
      ctx.arc(0, 6, 8, 0, Math.PI);
      ctx.closePath();
      paint(ctx, '#5a1e3a', '#2e2846', 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 4, 7, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
    if (laugh) {
      // des larmes de rire
      ctx.fillStyle = 'rgba(120,190,255,0.9)';
      for (const s of [-1, 1]) {
        ellipsePath(ctx, s * (17 + ((t * 30) % 6)), 2 + ((t * 40) % 10), 2.2, 3);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Le vent qui arrive vers la toupie quand elle aspire (des traits qui filent vers elle, des deux côtés).
  function suckWind(ctx, x, g, range, k, t) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const s = i % 2 ? 1 : -1;
      const u = 1 - ((t * 1.4 + i * 0.27) % 1);
      const d = 30 + u * range;
      const y = g - 14 - (i % 4) * 26 - Math.sin(u * 3 + i) * 6;
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * k * Math.min(1, (1 - u) * 3, u * 4)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * d, y);
      ctx.quadraticCurveTo(x + s * (d - 20), y - 6, x + s * (d - 46), y + 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Le tourbillon autour de Malice qu'elle emporte.
  function liftSwirl(ctx, x, y, t) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = t * 12 + (i * TAU) / 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y + (i - 1) * 16, 30, 9, 0, a % TAU, (a % TAU) + 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // La petite brise (la toupie, à la fin) : des petits traits de vent qui tournent, et deux feuilles.
  function breeze(ctx, x, y, s, t, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const r = 14 + i * 9;
      const a0 = t * (6 - i) + i * 2;
      ctx.beginPath();
      ctx.arc(0, i * 4, r, a0, a0 + 2.2);
      ctx.stroke();
    }
    for (let i = 0; i < 2; i++) {
      const a0 = t * 5 + i * Math.PI;
      ctx.save();
      ctx.translate(Math.cos(a0) * 30, Math.sin(a0) * 12);
      ctx.rotate(t * 4 + i);
      ellipsePath(ctx, 0, 0, 6, 3);
      paint(ctx, i ? '#8cc04a' : '#ffc23a', '#4a5a1a', 1);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- Les grêlons ----------
  function hailstone(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 1, 0, 0, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#d8eeff');
    g.addColorStop(1, '#9ccaf0');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const rr = r * (0.88 + 0.12 * Math.sin(i * 2.7));
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a7ab0';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.1);
    ctx.lineTo(-r * 0.15, -r * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  // le petit nuage de grêle (gris foncé, avec des paillettes de glace)
  function hailPuff(ctx, x, y, s, t) {
    Scenery.fluffyCloud(ctx, x, y, s, '#8a86a8', '#4e4a6e');
    ctx.fillStyle = '#e8f6ff';
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + i * 2.1;
      circlePath(ctx, x + Math.cos(a) * 14 * s, y + 6 + Math.sin(a * 1.3) * 4, 1.6);
      ctx.fill();
    }
  }

  // il fond : une petite flaque (k : elle s'étale ; a : elle sèche)
  function puddle(ctx, x, g, r, k, a) {
    if (a <= 0) return;
    ctx.fillStyle = `rgba(150,200,255,${0.6 * a})`;
    ellipsePath(ctx, x, g - 1, r * (0.6 + k), 3);
    ctx.fill();
    if (k < 1) {
      ctx.globalAlpha = 1 - k;
      hailstone(ctx, x, g - r * (1 - k) * 0.8, r * (1 - k * 0.8), 0);
      ctx.globalAlpha = 1;
    }
  }

  // ---------- La grande plume ----------
  // (x, y) : le bout du tuyau ; a : l'angle (0 : vers le haut) ; dir : vers où elle se courbe ; dim : elle clignote
  function feather(ctx, x, y, a, dir, t, dim) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(dir || 1, 1);
    if (dim) ctx.globalAlpha = 0.5;
    const L = 58;
    // les barbes, de chaque côté du tuyau (rose au bout)
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(s * 15, -L * 0.45, s * 4, -L);
      ctx.quadraticCurveTo(s * 1, -L * 0.6, 0, -8);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, -L);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, '#ffd6f0');
      g.addColorStop(1, '#ff8ac8');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#b05a8a';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    // de petites encoches dans les barbes (elle frémit un peu)
    ctx.strokeStyle = 'rgba(176,90,138,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 6; i++) {
      const yy = -10 - i * 8;
      ctx.moveTo(0, yy);
      ctx.lineTo(10 + Math.sin(t * 6 + i) * 1.5, yy - 5);
      ctx.moveTo(0, yy);
      ctx.lineTo(-10 - Math.sin(t * 6 + i) * 1.5, yy - 5);
    }
    ctx.stroke();
    ctx.strokeStyle = '#8a3a6a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(2, -L * 0.5, 3, -L + 2);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Les cloches ----------
  // b : x, y (le milieu de la cloche), i (laquelle), k (elle apparaît), swing (elle se balance), ringT (elle sonne),
  // lantern (accrochée sous le dôme de la lanterne, sinon à un poteau de bois)
  function bell(ctx, b, g, t) {
    const k = b.k;
    const hy = b.y - 34;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.5);
    if (b.lantern) {
      // une petite chaîne, sous le rebord du dôme
      ctx.strokeStyle = '#3e3456';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(b.x, g - 166);
      ctx.lineTo(b.x, hy);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // un poteau de bois, avec un petit bras
      roundRectPath(ctx, b.x + 22, hy - 6, 9, g - hy + 6, 3);
      paint(ctx, '#9a6a3e', '#4a2e18', 2);
      roundRectPath(ctx, b.x - 4, hy - 6, 34, 8, 3);
      paint(ctx, '#9a6a3e', '#4a2e18', 2);
    }
    ctx.translate(b.x, hy);
    const sc = k < 1 ? 0.3 + 0.7 * Math.sin(k * Math.PI * 0.6) / Math.sin(Math.PI * 0.6) : 1;
    ctx.scale(sc, sc);
    ctx.rotate(Math.sin(t * 11) * 0.45 * b.swing);
    // quand elle sonne : un halo de sa couleur
    if (b.ringT > 0) {
      const gl = ctx.createRadialGradient(0, 34, 4, 0, 34, 48);
      gl.addColorStop(0, 'rgba(255,250,200,0.6)');
      gl.addColorStop(1, 'rgba(255,250,200,0)');
      ctx.fillStyle = gl;
      circlePath(ctx, 0, 34, 48);
      ctx.fill();
    }
    // le battant
    circlePath(ctx, Math.sin(t * 11 + 1) * 6 * b.swing, 50, 5);
    paint(ctx, '#8a5a1a', '#4a2e08', 1.5);
    // la cloche
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.quadraticCurveTo(-14, 8, -15, 26);
    ctx.quadraticCurveTo(-17, 40, -26, 48);
    ctx.lineTo(26, 48);
    ctx.quadraticCurveTo(17, 40, 15, 26);
    ctx.quadraticCurveTo(14, 8, 8, 4);
    ctx.closePath();
    const gr = ctx.createLinearGradient(-26, 0, 26, 0);
    gr.addColorStop(0, '#c88a1a');
    gr.addColorStop(0.35, '#ffe27a');
    gr.addColorStop(1, '#b8780e');
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = '#6a3e08';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    roundRectPath(ctx, -27, 44, 54, 7, 3);
    paint(ctx, '#e8b03a', '#6a3e08', 2);
    // son ruban (de sa couleur), et l'anneau du haut
    ctx.fillStyle = BELL[b.i];
    ctx.fillRect(-14, 18, 28, 6);
    circlePath(ctx, 0, 1, 5);
    paint(ctx, '#e8b03a', '#6a3e08', 2);
    ctx.restore();
  }

  // ---------- L'arc-en-ciel ----------
  // dessiné une fois, puis découvert de gauche à droite (k)
  let arcImg = null;
  function rainbow(ctx, xa, g, k, t) {
    const band = 7.5;
    if (!arcImg) {
      arcImg = document.createElement('canvas');
      arcImg.width = ARC.w + 20;
      arcImg.height = ARC.h + 70;
      const c = arcImg.getContext('2d');
      c.lineCap = 'round';
      const path = (off) => {
        c.beginPath();
        for (let x = 0; x <= ARC.w; x += 6) c.lineTo(10 + x, 10 + ARC.h - ARC.h * Math.sin((Math.PI * x) / ARC.w) + off);
      };
      // une lueur blanche, puis les six bandes
      path(band * 3);
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = band * 6 + 10;
      c.stroke();
      BANDS.forEach((col, i) => {
        path(band * (i + 0.5));
        c.strokeStyle = col;
        c.lineWidth = band + 0.6;
        c.stroke();
      });
      // le dessus (là où l'on marche) bien net
      path(0);
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 2;
      c.stroke();
    }
    const w = (ARC.w + 20) * k;
    if (w < 1) return;
    ctx.save();
    ctx.globalAlpha *= 0.92;
    ctx.drawImage(arcImg, 0, 0, w, arcImg.height, xa - 10, g - ARC.h - 10, w, arcImg.height);
    ctx.restore();
    // des paillettes qui brillent dessus
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 9; i++) {
      const u = (i / 9 + t * 0.05) % 1;
      if (u > k) continue;
      const x = xa + u * ARC.w;
      const y = g - ARC.h * Math.sin(Math.PI * u) + 14 + Math.sin(i * 3.1) * 12;
      const s = 1.5 + 1.5 * Math.abs(Math.sin(t * 4 + i));
      circlePath(ctx, x, y, s);
      ctx.fill();
    }
  }

  // ---------- L'arène ----------
  // à gauche, un mur de vent : des courants d'air qui montent (k : de 0, caché, à 1)
  function windWall(ctx, x, g, k, t) {
    if (k <= 0.01) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const ox = x + 6 + i * 7;
      ctx.strokeStyle = `rgba(255,255,255,${(0.3 + 0.1 * (i % 2)) * k})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let y = g; y >= g - g * k; y -= 12) ctx.lineTo(ox + Math.sin(y * 0.03 + t * 4 + i * 1.7) * 6, y);
      ctx.stroke();
    }
    // des feuilles emportées par le vent
    for (let i = 0; i < 5; i++) {
      const y = g - ((t * 140 + i * 97) % (g * k));
      ctx.save();
      ctx.translate(x + 16 + Math.sin(t * 3 + i) * 10, y);
      ctx.rotate(t * 5 + i);
      ellipsePath(ctx, 0, 0, 5, 2.5);
      paint(ctx, i % 2 ? '#8cc04a' : '#d8a04a', '#4a4a1a', 1);
      ctx.restore();
    }
    ctx.restore();
  }

  // L'averse de ses larmes, sur toute l'arène (a : de 0 à 1, elle arrive et s'en va).
  function downpour(ctx, A, x, y, g, a, t) {
    ctx.save();
    ctx.strokeStyle = `rgba(170,210,255,${0.55 * a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 70; i++) {
      const rx = A.x0 + ((i * 137.3 + Math.floor(t * 2) * 31) % (A.x1 - A.x0));
      const ry = y + ((t * 900 + i * 53) % (g - y));
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 18);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Le ciel : le beau soleil qui revient (k : de 0, l'orage, à 1), devant le fond et derrière tout le reste.
  function sky(ctx, camX, camY, A, k, t) {
    if (k <= 0.01) return;
    ctx.save();
    const gr = ctx.createLinearGradient(0, camY, 0, camY + VIEW_H);
    gr.addColorStop(0, '#6ec4ff');
    gr.addColorStop(0.7, '#bfe6ff');
    gr.addColorStop(1, '#e8f6ff');
    ctx.globalAlpha = 0.85 * k;
    ctx.fillStyle = gr;
    ctx.fillRect(camX, camY, VIEW_W, VIEW_H);
    // le soleil, et ses rayons qui tournent doucement
    const sx = A.x0 + 330;
    const sy = 92;
    ctx.globalAlpha = k;
    const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 160);
    halo.addColorStop(0, 'rgba(255,250,200,0.9)');
    halo.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = halo;
    circlePath(ctx, sx, sy, 160);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,150,0.35)';
    for (let i = 0; i < 12; i++) {
      const a = t * 0.15 + (i * TAU) / 12;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a - 0.06) * 50, sy + Math.sin(a - 0.06) * 50);
      ctx.lineTo(sx + Math.cos(a) * 230, sy + Math.sin(a) * 230);
      ctx.lineTo(sx + Math.cos(a + 0.06) * 50, sy + Math.sin(a + 0.06) * 50);
      ctx.closePath();
      ctx.fill();
    }
    circlePath(ctx, sx, sy, 40);
    paint(ctx, '#ffe95a', '#f0a020', 3);
    ctx.restore();
  }

  // Le moulin, tout au loin sur son rocher au bord de la mer (a : l'angle de ses ailes ; sun : au soleil, il est plus
  // net et plus coloré).
  function farMill(ctx, x, y, a, sun) {
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.4 * sun;
    // le rocher
    ctx.fillStyle = Art.mixColor('#5e5a86', '#7a8a5a', sun);
    ctx.beginPath();
    ctx.moveTo(x - 46, y + 12);
    ctx.quadraticCurveTo(x - 30, y - 4, x - 6, y - 2);
    ctx.quadraticCurveTo(x + 22, y - 6, x + 44, y + 12);
    ctx.closePath();
    ctx.fill();
    // la tour, et son toit
    ctx.fillStyle = Art.mixColor('#8a86aa', '#f0e6d0', sun);
    ctx.beginPath();
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x - 6, y - 32);
    ctx.lineTo(x + 6, y - 32);
    ctx.lineTo(x + 9, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = Art.mixColor('#6a5a86', '#c0603a', sun);
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 31);
    ctx.lineTo(x, y - 42);
    ctx.lineTo(x + 9, y - 31);
    ctx.closePath();
    ctx.fill();
    // les quatre ailes
    ctx.translate(x, y - 33);
    ctx.fillStyle = Art.mixColor('#b0acc8', '#ffffff', sun);
    ctx.strokeStyle = Art.mixColor('#5e5a86', '#7a5a3a', sun);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(a + (i * TAU) / 4);
      ctx.beginPath();
      ctx.rect(1, -1, 24, 2);
      ctx.rect(8, 1, 16, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  return {
    BELL, cloud, dizzyStars, lifeCloud, toupie, suckWind, liftSwirl, breeze, hailstone, hailPuff, puddle, feather, bell,
    rainbow, windWall, downpour, sky, farMill,
  };
})();

BOSSES.bourrasque = Bourrasque;
