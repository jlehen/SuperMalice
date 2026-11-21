'use strict';

// =====================================================================
//  MAMAN AIGLE : le boss des Pentes du Volcan (au bord du cratère, au bout du 4-4)
//  Une grande maman aigle, toute brune avec la tête blanche, un foulard rose à pois autour du cou. Elle couve ses trois
//  œufs dans son grand nid, en haut d'un pic de roche. Quand Malice arrive, le volcan gronde, et des œufs roulent hors
//  du nid… Maman Aigle se réveille, et elle croit que Malice veut voler ses œufs (l'idée d'Alice). Rien de violent :
//  elle ne fait que piquer sur Malice pour la chasser (toujours annoncé), et à la fin, elle comprend, et devient son amie.
//  Elle a cinq « vies » (cinq petites icônes en haut de l'écran, une par manche : de gauche à droite, un dessin, une note
//  de musique, une brindille, une plume et un œuf ; la vie perdue est la plus à droite : c'est l'icône de la manche
//  qu'on vient de gagner qui s'envole), et chaque manche se gagne d'une autre façon, dans cet ordre :
//   1. Les œufs : ils ont roulé hors du nid (diff.aigleEggs : 2 en Bébé et en Gentil, 3 sinon). Malice les rapporte un
//      par un dans le nid (en haut du pic : on y monte, ou on saute tout contre), pendant que Maman Aigle pique sur elle.
//      Si elle a mal, elle lâche l'œuf (il ne se casse jamais : on le reprend).
//   2. Son dos : essoufflée, elle se pose pour reprendre son souffle (« Pff… pff… ») ; Malice lui saute sur le dos, et
//      elle est toute surprise (« Hiii ! »). Il le faut plusieurs fois (diff.aigleHops : 1 en Bébé… 3 en Difficile).
//   3. Les brindilles : le vent abîme le nid, et emporte des brindilles (diff.aigleTwigs : 3 en Bébé… 6 en Difficile),
//      par terre ou qui flottent dans le vent. Malice les ramasse (elle en porte autant qu'elle veut) et les rapporte au
//      nid, pendant que Maman Aigle tourne au-dessus d'elle et passe en rase-mottes.
//   4. La berceuse : trois notes de musique (do, ré, mi) flottent dans le vent ; Malice les attrape, chante « Au clair
//      de la lune », et Maman Aigle s'endort un moment sur son nid.
//   5. Le dessin : le vent arrache de la poche de Malice son dessin du bébé oiseau, en morceaux (diff.aigleBits : 2 en
//      Bébé… 6 en Difficile) ; elle les rassemble, puis montre le dessin à Maman Aigle (elle se pose : on va tout près
//      d'elle). Maman Aigle reconnaît le petit oiseau : il est coincé au cœur du volcan !
//  Ses attaques : le piqué (elle crie « Kiiii ! », une ombre avec un « ! » marque l'endroit, puis elle pique tout droit
//  dessus ; manches 1, 2, 4 et 5) et le rase-mottes (elle se met d'un côté, crie, des flèches montrent par où elle va
//  passer, puis elle passe tout près du sol : on saute par-dessus ; manches 3 et 5). Une seule chose à la fois.
//  Ses renforts, selon la difficulté (voir DIFFS dans game.js ; jamais en Bébé) : elle pique dès qu'on ramasse un œuf
//  (« Kiiii ! Mon œuf ! ») ; en Classique et en Difficile, elle repique aussitôt après un piqué (« Kiii-kiii ! », une
//  nouvelle ombre), son rase-mottes fait l'aller-retour, et un coup fait lâcher les brindilles ou le dernier morceau du
//  dessin (le conseil de la manche le dit). 2e manche : une seule attaque entre deux pauses.
//  La fin : Malice recule d'un bond pour qu'on voie tout (on ne la dirige plus jusqu'à la fin) ; les œufs éclosent, trois
//  aiglons font un bisou à Malice, Maman Aigle lui donne sa plume dorée (gardée dans la sauvegarde : save.cadeaux, et
//  dessinée sur la grande carte), puis elle l'emporte sur son dos : un petit vol au-dessus de la mer de nuages, jusqu'à
//  l'entrée du Cœur du Volcan, une grande porte dans la roche pleine de lumière de lave (dessinée par-dessus l'écran,
//  voir drawScreen). Elle y entre, et le niveau se termine (il n'y a pas d'arrivée à toucher).
// =====================================================================

// AIGLE (en pixels, depuis le sol de l'arène) : cruise : la hauteur de son milieu quand elle vole ; perch : son milieu
// au-dessus du haut du pic, sur son nid ; rest : son milieu, assise par terre (essoufflée) ; stand : debout sur ses
// pattes ; camY : là où l'écran reste pendant le combat (le sol à 36 px du bas de l'écran : tout le ciel au-dessus) ;
// dive : le piqué (warn : combien de temps il est annoncé, divisé par diff.bossK ; fall : la descente ; thud : le temps
// où elle reste en bas) ; swoop : le rase-mottes (warn ; speed : sa vitesse, la même pour tous : plus lente, elle
// resterait plus longtemps sous Malice, et ce serait plus dur de sauter par-dessus ; low : la hauteur de son milieu) ;
// gap : le temps entre deux attaques (sans diff.aigleGap ; divisé par diff.bossK) ; tire : combien de temps elle reste
// essoufflée par terre (sans diff.aigleTire). again : l'annonce du 2e piqué (diff.aigleDouble) et du retour du
// rase-mottes (diff.aigleReturn), un peu plus courte (divisée par diff.bossK aussi) : on vient de voir la première ;
// fallAgain : la descente du 2e piqué (elle rebondit : plus vite).
const AIGLE = {
  cruise: 330, perch: 70, rest: 42, stand: 52, camY: 264,
  dive: { warn: 1.45, fall: 0.42, thud: 0.32, again: 0.9, fallAgain: 0.32 },
  swoop: { warn: 1.5, speed: 640, low: 24, again: 1.0 },
  gap: 1.5, tire: 4.5,
};

class MamanAigle extends Boss {
  // x : le milieu de la case du &, y : le sol de l'arène
  constructor(world, x, y) {
    super(world, x - 55, y - 72, 110, 72, {
      name: 'Maman Aigle', song: 'boss-aigle', life: 5, intro: 5.4, introShort: 1.9,
    });
    this.groundY = y;
    this.px = x;
    this.py = y - AIGLE.rest;
    this.tx = x;
    this.ty = this.py;
    this.mvx = 0;
    this.facing = -1;
    // ce qu'elle fait : fly (elle plane au-dessus de Malice), circle (elle tourne au-dessus de l'arène), aim (elle va
    // piquer : l'ombre est marquée), dive (elle pique), thud (en bas), climb (elle remonte), swoopGo / swoopWarn /
    // swoop (le rase-mottes), land (elle se pose), rest (essoufflée, par terre), hopped (on vient de lui sauter sur le
    // dos), wait (5e manche : posée, elle attend de voir le dessin), lull (la berceuse), ouch (entre deux manches : cut)
    this.act = 'perch';
    this.actT = 0;
    this.timer = 0;
    this.plan = 0;
    this.cut = null;
    this.side = 1;
    this.orbit = 0;
    this.mark = null;
    this.swoop = null;
    this.landAt = null;
    this.restT = 0;
    this.hops = 0;
    this.pantT = 0;
    // le dessin : ses ailes (wing : 0 repliées, 1 grandes ouvertes ; flap : le battement), penchée (tilt), son humeur
    // (mood : sleep, angry, open, surprised, tired, worried, wide, heart, happy), son bec ouvert, ses joues roses, ses
    // plumes ébouriffées (puff), ses larmes ; sitting : sur son nid (dessinée dans le nid, voir drawDecor)
    this.pose = 'perch';
    this.wing = 0;
    this.flapT = 0;
    this.flapV = 0;
    this.droop = 0;
    this.tilt = 0;
    this.mood = 'sleep';
    this.beak = 0;
    this.blush = 0;
    this.puff = 0;
    this.tears = 0;
    this.sitting = true;
    this.nestShake = 0;
    // les choses de chaque manche (œufs, brindilles, notes, morceaux du dessin), voir updateThings
    this.things = [];
    this.held = null;
    this.bundle = 0;
    this.repaired = 0;
    this.sung = 0;
    this.bitsGot = 0;
    this.drawingDone = false;
    this.lastEnergy = null;
    // la fin : les aiglons, la plume dorée, le voyage sur son dos
    this.chicks = null;
    this.gift = null;
    this.ride = null;
    // (Malice qui recule d'un bond au début de la fin : stand ; Maman Aigle qui recule, s'il n'y a pas de place
    // derrière Malice : back ; leur envol : lift ; le vol jusqu'au Cœur du Volcan, dessiné par-dessus l'écran : flight,
    // voir drawScreen)
    this.stand = null;
    this.back = null;
    this.lift = null;
    this.flight = null;
    // ce qu'elle crie (« Kiiii ! » : un petit texte qui la suit), les petits textes qui viennent de sortir (pour ne pas
    // en écrire deux l'un sur l'autre, voir pop), ce qui arrive un peu plus tard (later), et le piqué qu'elle fait dès
    // qu'on ramasse un de ses œufs (diff.aigleEggDive)
    this.cry = null;
    this.pops = [];
    this.later = [];
    this.eggAlarm = false;
    this.zzzT = 0.5;
    this.chatT = 12;
    this.chats = 0;
    this.hintT = 0;
    this.noteT = 0;
    // (le caramel et les chips passent à travers elle : on ne colle pas les ailes d'une maman, voir le plan d'Alice)
    this.passThrow = true;
    // si elle touche Malice en piqué : projetée en l'air comme par un sanglier (voir OUCH.spin)
    this.ouch = 'spin';
  }

  setup() {
    super.setup();
    const w = this.world;
    const A = this.arena;
    // (le sol de l'arène, même si elle vole ; l'écran reste sur le ciel de l'arène, et Malice ne monte jamais plus haut
    // que le haut de l'écran)
    A.y1 = this.groundY;
    A.camY = AIGLE.camY;
    A.y0 = AIGLE.camY + 6;
    // le sol de chaque colonne de l'arène (au bout, le pic du nid est plus haut)
    this.c0 = Math.floor(A.x0 / TILE);
    this.floor = [];
    for (let c = this.c0; c * TILE < A.x1; c++) {
      let y = this.groundY;
      for (let r = Math.floor(AIGLE.camY / TILE); r < w.rows; r++) {
        if (isSolidCh(w.tileAt(c, r))) {
          y = r * TILE;
          break;
        }
      }
      this.floor.push(y);
    }
    this.picX = A.x1;
    for (let c = this.c0; c * TILE < A.x1; c++) {
      if (this.floor[c - this.c0] < this.groundY - 10) {
        this.picX = c * TILE;
        break;
      }
    }
    // son grand nid (c'est elle qui le dessine, avec ses œufs : voir drawDecor)
    const N = w.nest || { x: A.x1 - 2.5 * TILE, y: this.groundY - 3 * TILE };
    this.nest = { x: N.x, y: N.y };
    w.nest = null;
    this.px = this.nest.x;
    this.py = this.nest.y - AIGLE.perch;
    this.tx = this.px;
    this.ty = this.py;
    // ses trois œufs, dans le nid
    for (let i = 0; i < 3; i++) this.things.push(this.newThing('egg', i, this.slotX(i), this.slotY(), 'home'));
  }

  get cx() { return this.px; }

  // le sol sous x (le haut du pic, au bout de l'arène)
  groundAt(x) {
    const c = clamp(Math.floor(x / TILE) - this.c0, 0, this.floor.length - 1);
    return this.floor[c];
  }

  cruiseY() { return this.groundY - AIGLE.cruise; }

  // le haut du pic du nid
  picTop() { return this.groundAt(this.picX + 1); }

  // les places des œufs dans le nid
  slotX(i) { return this.nest.x + (i - 1) * 38; }
  slotY() { return this.nest.y - 70; }

  // Là où l'on rapporte les œufs et les brindilles : le nid, en haut du pic (on y monte, ou on saute tout contre).
  nestZone() {
    return { x: this.picX - 40, y: this.nest.y - 104, w: this.arena.x1 - this.picX + 40, h: 160 };
  }

  newThing(kind, i, x, y, st) {
    return { kind, i, x, y, st, t: 0, vx: 0, vy: 0, rot: 0, cool: 0, hx: x, hy: y, k: 1, fly: null, landed: false, tx: null };
  }

  // ---------- Avant et pendant le réveil ----------
  asleep(dt) {
    const w = this.world;
    this.sitting = true;
    this.mood = 'sleep';
    this.zzzT -= dt;
    if (this.zzzT > 0) return;
    this.zzzT = 1.8;
    w.spawn({ type: 'text', x: this.px + 40, y: this.py - 50, vx: 24, vy: -40, life: 1.6, text: 'Z', color: '#fff6e0', size: 18 });
    w.spawn({ type: 'text', x: this.px + 54, y: this.py - 64, vx: 30, vy: -46, life: 1.2, text: 'z', color: '#fff6e0', size: 13 });
    if (w.onScreen({ x: this.px - 60, y: this.py - 60, w: 120, h: 120 }, 40) && !w.player.dead) Sound.sfx.snore();
  }

  // Le réveil : le volcan gronde, des œufs roulent hors du nid… elle se réveille, et elle croit que Malice veut les
  // voler. Quand on revient après avoir perdu une vie, c'est bien plus court.
  wake(dt, k) {
    const w = this.world;
    const t = this.stateT;
    if (this.short) {
      if (this.once('w-rumble')) {
        Sound.sfx.volcanoRumble();
        w.shake(6);
        this.nestShake = 0.8;
        this.rollEggs();
        this.mood = 'angry';
        this.sitting = false;
        this.speak('Encore toi ? Ne touche pas à mes œufs !', 1.7);
        Sound.sfx.eagleCry();
      }
      if (t > 0.5) this.takeoff(dt);
    } else {
      if (t < 1.4) this.asleep(dt);
      if (this.once('w-rumble')) {
        Sound.sfx.volcanoRumble();
        w.shake(10);
        this.nestShake = 1;
        w.popText((this.arena.x0 + this.arena.x1) / 2 - 120, AIGLE.camY + 120, 'GRRROOOOM…', '#ffb070', 26);
      }
      if (t > 0.7 && this.once('w-eggs')) this.rollEggs();
      if (t > 1.5 && this.once('w-eyes')) {
        this.mood = 'surprised';
        this.puff = 1;
        Sound.sfx.eagleSurprise();
        w.popText(this.px, this.py - 80, '!', '#ffffff', 34);
      }
      if (t > 2.0 && this.once('w-say')) {
        this.mood = 'angry';
        this.speak('Hein ? Mes œufs ! Une voleuse d\'œufs !', 2.2);
      }
      if (t > 3.6 && this.once('w-go')) {
        this.sitting = false;
        this.speak('Ne touche pas à mes petits !', 1.6);
        Sound.sfx.eagleCry();
      }
      if (t > 3.6) this.takeoff(dt);
    }
    if (k >= 1) {
      this.sitting = false;
      this.rest(1.2 / this.k);
    }
  }

  // elle s'envole de son nid, jusqu'en haut
  takeoff(dt) {
    this.sitting = false;
    this.pose = 'fly';
    this.goTo(this.nest.x - 120, this.cruiseY(), 320, dt);
  }

  // Les œufs roulent hors du nid (ceux du bord d'abord), jusqu'à leur place sur le sol de l'arène.
  rollEggs() {
    const n = clamp(this.world.diff.aigleEggs || 3, 1, 3);
    const A = this.arena;
    const lo = A.x0 + 110;
    const hi = this.picX - 120;
    const spots = n === 1 ? [0.5] : n === 2 ? [0.15, 0.7] : [0.04, 0.42, 0.82];
    const order = n === 3 ? [0, 1, 2] : n === 2 ? [0, 2] : [0];
    order.forEach((slot, j) => {
      const o = this.things.find((e) => e.kind === 'egg' && e.i === slot);
      o.st = 'roll';
      o.landed = false;
      o.tx = lerp(lo, hi, spots[j]);
      o.vx = -(170 + j * 50);
      o.vy = -160 - j * 40;
      o.cool = 0;
    });
    Sound.sfx.eggRoll();
  }

  // ---------- Le combat ----------
  fight(dt) {
    const w = this.world;
    const p = w.player;
    this.actT += dt;
    this.hintT += dt;
    if (this.act === 'ouch') this.between(dt);
    else if (this.act === 'lull') this.lullaby(dt);
    else this.attacks(dt);
    // la fin de chaque manche (quand ce qu'on a rapporté est bien arrivé)
    const flying = this.things.some((o) => o.st === 'fly');
    if (this.phase === 0 && !flying && this.things.every((o) => o.kind !== 'egg' || o.st === 'home')) this.hitWith('egg');
    if (this.phase === 2 && !flying && this.repaired >= this.twigsNeeded()) this.hitWith('twig');
    // (5e manche : Malice vient tout près d'elle avec le dessin)
    if (this.phase === 4 && this.act === 'wait' && !p.dead && overlap(p, this.body())) this.hitWith('show');
    this.advise();
    this.chatter(dt);
  }

  twigsNeeded() { return this.world.diff.aigleTwigs || 4; }
  bitsNeeded() { return this.world.diff.aigleBits || 4; }
  hopsNeeded() { return this.world.diff.aigleHops || 2; }

  // après une attaque : elle remonte planer (au-dessus de Malice ; 3e manche : elle tourne au-dessus de l'arène)
  rest(timer) {
    this.act = this.phase === 2 ? 'circle' : 'fly';
    this.actT = 0;
    this.timer = timer;
    this.pose = 'fly';
  }

  // Une seule chose à la fois, et seulement quand Malice est par terre (ou presque) et peut voir venir.
  canAct() {
    const p = this.world.player;
    if (p.dead || p.carry || p.hurtT > 0 || p.tumbling() || this.grace > 0 || this.recover > 0) return false;
    return p.onGround || p.y + p.h > this.groundY - 3 * TILE;
  }

  // ce qu'elle fait, manche par manche (2e manche : une seule attaque entre deux pauses, diff.aigleRest ; elle commence
  // par se poser, voir onHit)
  plans() {
    const K = this.k;
    switch (this.phase) {
      case 1: return [this.world.diff.aigleRest || 'dive', 'land'];
      case 2: return K > 1.35 ? ['swoop', 'swoop', 'dive'] : this.world.diff.aigleReturn ? ['swoop', 'dive'] : ['swoop'];
      case 4: return K < 0.9 ? ['dive'] : ['dive', 'swoop'];
      default: return ['dive'];
    }
  }

  attack() {
    // (on vient de ramasser un de ses œufs : elle pique tout de suite, voir pick)
    if (this.eggAlarm) {
      this.eggAlarm = false;
      if (this.phase === 0) {
        this.startDive(false, 'Kiiii ! Mon œuf !');
        return;
      }
    }
    const seq = this.plans();
    const what = seq[this.plan++ % seq.length];
    if (what === 'swoop') this.startSwoop();
    else if (what === 'land') this.startLand();
    else this.startDive();
  }

  attacks(dt) {
    const w = this.world;
    const p = w.player;
    const A = this.arena;
    const K = this.k;
    const cy = this.cruiseY();
    switch (this.act) {
      case 'fly': {
        // elle plane au-dessus de Malice, un peu à côté
        let x = p.cx + this.side * 150;
        if (x < A.x0 + 100 || x > A.x1 - 100) {
          this.side = -this.side;
          x = p.cx + this.side * 150;
        }
        this.goTo(clamp(x, A.x0 + 100, A.x1 - 100), cy + Math.sin(this.t * 1.7) * 14, 240, dt);
        this.pose = 'fly';
        this.timer -= dt;
        if (this.timer <= 0 && this.canAct()) this.attack();
        break;
      }
      case 'circle': {
        // elle tourne au-dessus de l'arène, en grand rond
        const mid = (A.x0 + A.x1) / 2;
        this.orbit += dt * 0.75;
        this.goTo(mid + Math.cos(this.orbit) * 320, cy + 10 + Math.sin(this.orbit * 2) * 28, 330, dt);
        this.pose = 'fly';
        this.timer -= dt;
        if (this.timer <= 0 && this.canAct()) this.attack();
        break;
      }
      case 'aim': {
        // elle se place au-dessus de l'ombre, les ailes levées
        const m = this.mark;
        this.goTo(m.x, cy, 560, dt);
        this.pose = 'aim';
        if (this.actT >= m.warn) {
          this.act = 'dive';
          this.actT = 0;
          this.from = { x: this.px, y: this.py };
          Sound.sfx.eagleDive();
        }
        break;
      }
      case 'dive': {
        // elle pique tout droit sur l'ombre
        const m = this.mark;
        const u = Math.min(1, this.actT / (m.again ? AIGLE.dive.fallAgain : AIGLE.dive.fall));
        this.px = lerp(this.from.x, m.x, Math.min(1, u * 2.5));
        this.py = lerp(this.from.y, m.y, u * u);
        this.mvx = 0;
        this.pose = 'dive';
        if (u >= 1) {
          this.act = 'thud';
          this.actT = 0;
          Sound.sfx.eagleThud();
          w.shake(4);
          for (let i = 0; i < 10; i++) {
            w.spawn({ type: 'dust', x: m.x + rand(-40, 40), y: m.g, vx: rand(-200, 200), vy: rand(-140, -20), life: 0.5, size: rand(6, 11) });
          }
          this.pop(m.x, m.g - 90, p.hurtT > 0 ? 'Pouf !' : choose(['Pouf !', 'Raté !', 'Zut !']), '#fff0d0', 20);
        }
        break;
      }
      case 'thud':
        this.pose = 'land';
        if (this.actT > AIGLE.dive.thud) {
          // (diff.aigleDouble : en touchant le sol, elle rebondit en un 2e piqué, une seule fois, avec une nouvelle ombre
          // là où est Malice ; manches 1, 4 et 5 ; pas si elle vient de toucher Malice, voir canAct)
          const again = this.mark && this.mark.again;
          this.mark = null;
          if (w.diff.aigleDouble && !again && (this.phase === 0 || this.phase === 3 || this.phase === 4) && this.canAct()) {
            this.startDive(true, 'Kiii-kiii !');
            break;
          }
          this.act = 'climb';
          this.actT = 0;
          Sound.sfx.eagleFlap();
        }
        break;
      case 'climb':
        this.pose = 'fly';
        this.goTo(this.px + (this.px < (A.x0 + A.x1) / 2 ? 60 : -60), cy, 380, dt);
        if (this.py < cy + 40) this.rest((w.diff.aigleGap || AIGLE.gap) / K);
        break;
      case 'swoopGo': {
        // elle va se mettre d'un côté (elle ne descend qu'en arrivant là-bas)
        // (au retour d'un rase-mottes, diff.aigleReturn : elle fait demi-tour tout près du sol)
        const S = this.swoop;
        const far = !S.back && Math.abs(this.px - S.x0) > 110;
        this.goTo(S.x0, far ? cy : S.y0, 560, dt);
        this.pose = 'fly';
        if (!far && Math.abs(this.py - S.y0) < 6 && Math.abs(this.px - S.x0) < 6) {
          this.act = 'swoopWarn';
          this.actT = 0;
          Sound.sfx.eagleCry();
          this.shout(S.back ? 'Kiiii ! Et retour !' : 'Kiiii !');
        }
        break;
      }
      case 'swoopWarn':
        this.pose = 'aim';
        this.facing = this.swoop.dir;
        this.mvx = 0;
        if (this.actT >= this.swoop.warn) {
          this.act = 'swoop';
          this.actT = 0;
          Sound.sfx.eagleSwoop();
        }
        break;
      case 'swoop': {
        // elle passe tout près du sol (au-dessus du pic, elle remonte un peu avant)
        const S = this.swoop;
        this.px += S.dir * AIGLE.swoop.speed * dt;
        this.mvx = S.dir * AIGLE.swoop.speed;
        const g = this.groundAt(this.px + S.dir * 90);
        this.py = approach(this.py, g - AIGLE.swoop.low, 1100 * dt);
        this.pose = 'swoop';
        if (Math.random() < dt * 30) w.spawn({ type: 'dust', x: this.px - S.dir * 40, y: this.groundAt(this.px), vx: -S.dir * rand(60, 160), vy: rand(-80, -10), life: 0.4, size: rand(5, 9) });
        if ((S.dir > 0 && this.px >= S.x1) || (S.dir < 0 && this.px <= S.x1)) {
          // (diff.aigleReturn : au bout, elle fait demi-tour et repasse dans l'autre sens, annoncée de nouveau par les
          // flèches ; manches 3 et 5 ; pas si elle vient de toucher Malice)
          if (w.diff.aigleReturn && !S.back && (this.phase === 2 || this.phase === 4) && !p.dead && !p.carry && p.hurtT <= 0 && !p.tumbling()) {
            this.startSwoop(true);
            break;
          }
          this.act = 'climb';
          this.actT = 0;
          this.swoop = null;
        }
        break;
      }
      case 'land': {
        // elle se pose doucement (son ombre grandit là où elle va se poser)
        const L = this.landAt;
        const u = Math.min(1, this.actT / L.dur);
        const e = u * u * (3 - 2 * u);
        this.px = lerp(L.fx, L.x, e);
        this.py = lerp(L.fy, L.y, e);
        this.mvx = (L.x - L.fx) / L.dur;
        this.pose = 'fly';
        if (u >= 1) {
          for (let i = 0; i < 8; i++) {
            w.spawn({ type: 'dust', x: L.x + rand(-50, 50), y: L.g, vx: rand(-150, 150), vy: rand(-90, -10), life: 0.45, size: rand(5, 9) });
          }
          this.mvx = 0;
          if (this.phase === 1) {
            this.act = 'rest';
            this.actT = 0;
            this.restT = w.diff.forever ? Infinity : (w.diff.aigleTire || AIGLE.tire) / K;
            // (sa bulle de bavardage s'efface : on lit « Pff… pff… »)
            if (this.say && this.say.t > 0.25) this.say.t = 0.25;
            this.pop(this.px, this.py - 70, choose(['Pff… pff…', 'Ouf… une pause…']), '#ffffff', 18);
          } else {
            this.act = 'wait';
            this.actT = 0;
            this.speak('Qu\'est-ce que tu tiens là ? Montre-moi…', 2.4);
          }
          Sound.sfx.eagleThud();
        }
        break;
      }
      case 'rest':
        // assise par terre, elle reprend son souffle (on peut lui sauter sur le dos)
        this.pose = 'rest';
        this.restT -= dt;
        this.pantT -= dt;
        if (this.pantT <= 0) {
          this.pantT = 0.65;
          if (w.onScreen(this.body(), 40)) Sound.sfx.pant();
          w.spawn({ type: 'text', x: this.px + this.facing * 84, y: this.py - 30, vx: this.facing * 40, vy: -30, life: 0.7, text: 'pff', color: '#ffffff', size: 14 });
          if (Math.random() < 0.6) w.spawn({ type: 'drop', x: this.px + this.facing * 30, y: this.py - 40, vx: rand(-60, 60), vy: rand(-160, -60), g: 700, life: 0.5, size: 1 });
        }
        if (this.restT <= 0) {
          this.act = 'climb';
          this.actT = 0;
          this.speak('Ça va mieux ! À l\'attaque !', 1.6);
          Sound.sfx.eagleFlap();
        }
        break;
      case 'hopped':
        // on vient de lui sauter sur le dos : surprise ! elle bondit, et repart
        this.pose = 'hop';
        if (this.actT < 0.35) this.py = approach(this.py, this.landAt.y - 40, 300 * dt);
        if (this.actT > 0.9) {
          this.act = 'climb';
          this.actT = 0;
        }
        break;
      case 'wait':
        // (5e manche) posée, elle attend que Malice lui montre le dessin
        this.pose = 'stand';
        this.facing = Math.sign(p.cx - this.px) || this.facing;
        break;
      default:
        this.rest(0.5);
        break;
    }
  }

  // ---- Le piqué ----
  // Elle crie « Kiiii ! », l'ombre (avec un « ! ») marque l'endroit, là où est Malice… puis elle pique tout droit dessus.
  // (again : le 2e piqué, juste après le premier, diff.aigleDouble : annoncé un peu moins longtemps ; text : son cri)
  startDive(again, text) {
    const p = this.world.player;
    const A = this.arena;
    const x = clamp(p.cx, A.x0 + 44, A.x1 - 44);
    const g = this.groundAt(x);
    this.mark = { x, g, y: g - 30, warn: (again ? AIGLE.dive.again : AIGLE.dive.warn) / this.k, t: 0, again: !!again };
    this.act = 'aim';
    this.actT = 0;
    Sound.sfx.eagleCry();
    this.shout(text || 'Kiiii !');
  }

  // ---- Le rase-mottes ----
  // Elle part du côté le plus loin de Malice, crie, et des flèches montrent par où elle va passer.
  // (back : le retour, diff.aigleReturn : elle repart du bout où elle est arrivée, dans l'autre sens)
  startSwoop(back) {
    const p = this.world.player;
    const A = this.arena;
    const dir = back ? -this.swoop.dir : p.cx < (A.x0 + A.x1) / 2 ? -1 : 1;
    const x0 = dir < 0 ? A.x1 - 80 : A.x0 + 80;
    const x1 = dir < 0 ? A.x0 - 60 : A.x1 + 60;
    this.swoop = { dir, x0, x1, y0: this.groundAt(x0) - AIGLE.swoop.low, warn: (back ? AIGLE.swoop.again : AIGLE.swoop.warn) / this.k, back: !!back };
    this.act = 'swoopGo';
    this.actT = 0;
  }

  // ---- Elle se pose (2e manche : essoufflée ; 5e : pour voir le dessin) ----
  // Loin de Malice (au moins diff.aigleLand cases ; 5e manche, near : 2,6 cases), sur le sol (pas sur le pic).
  startLand(near) {
    const p = this.world.player;
    const A = this.arena;
    const lo = A.x0 + 90;
    const hi = this.picX - 90;
    const away = (near ? 2.6 : this.world.diff.aigleLand || 3.6) * TILE;
    let x = clamp(p.cx + (p.cx < (lo + hi) / 2 ? 1 : -1) * (away + 60), lo, hi);
    if (Math.abs(x - p.cx) < away) x = clamp(p.cx - Math.sign(x - p.cx || 1) * (away + 60), lo, hi);
    const y = this.groundY - (this.phase === 1 ? AIGLE.rest : AIGLE.stand);
    this.landAt = { x, y, g: this.groundY, fx: this.px, fy: this.py, dur: 1.2 };
    this.act = 'land';
    this.actT = 0;
    Sound.sfx.eagleFlap();
  }

  // ---- 2e manche : sur son dos ----
  // Pas encore la dernière fois : surprise ! elle bondit et repart (« Hiii ! Encore 1 ! »).
  backHop() {
    const w = this.world;
    this.hops++;
    this.act = 'hopped';
    this.actT = 0;
    this.landAt = { x: this.px, y: this.py };
    this.puff = 1;
    Sound.sfx.eagleSurprise();
    const left = this.hopsNeeded() - this.hops;
    this.pop(this.px, this.py - 90, left > 1 ? `Hiii ! Encore ${left} !` : 'Hiii ! Encore une fois !', '#fff6c0', 22);
    this.speak(choose(['Hé ! Pas sur mon dos !', 'Ouh là ! Ça chatouille !', 'Qui est là-haut ?']), 1.6);
    this.feathers(8);
  }

  // ---- 4e manche : la berceuse ----
  // Les trois notes attrapées : Malice chante « Au clair de la lune », tout s'arrête ; Maman Aigle retourne doucement
  // sur son nid, bâille… et s'endort.
  startLullaby() {
    const w = this.world;
    this.act = 'lull';
    this.actT = 0;
    this.mark = null;
    this.swoop = null;
    this.tip = null;
    this.pop(w.player.cx, w.player.y - 40, '♪ Au clair de la lune… ♪', '#fff6a0', 22);
    // (la musique du combat s'arrête : c'est la berceuse, jusqu'à ce qu'elle se réveille, voir between)
    this.song = 'berceuse';
    if (!(w.player.star > 0)) Sound.playMusic(this.song);
  }

  lullaby(dt) {
    const w = this.world;
    const p = w.player;
    const t = this.actT;
    // des notes s'envolent de Malice jusqu'à elle
    this.noteT -= dt;
    if (this.noteT <= 0 && t < 4.6) {
      this.noteT = 0.35;
      w.spawn({ type: 'text', x: p.cx + rand(-10, 10), y: p.y - 10, vx: (this.px - p.cx) * 0.45, vy: (this.py - p.y) * 0.45 - 20, life: 1.6, text: choose(['♪', '♫']), color: choose(['#ff8a8a', '#ffd84a', '#7ad8ff']), size: 20 });
    }
    // elle retourne doucement sur son nid
    this.goTo(this.nest.x, this.nest.y - AIGLE.perch, 170, dt);
    this.pose = Math.hypot(this.px - this.nest.x, this.py - (this.nest.y - AIGLE.perch)) < 8 ? 'perch' : 'fly';
    this.sitting = this.pose === 'perch';
    this.mood = t > 3.4 ? 'sleep' : t > 1.4 ? 'tired' : 'open';
    if (t > 2.4 && this.once('l-yawn')) {
      this.speak('Ooouaaah… Quelle jolie chanson…', 1.8);
      Sound.sfx.eagleYawn();
    }
    if (t > 5 && this.sitting) this.hitWith('song');
  }

  // ---- Entre deux manches ----
  between(dt) {
    const w = this.world;
    const p = w.player;
    const t = this.actT;
    const cy = this.cruiseY();
    switch (this.cut) {
      case 'r2':
        // tous les œufs sont rentrés… elle n'y croit pas
        this.pose = 'fly';
        this.mood = 'worried';
        this.goTo(clamp(p.cx + 160 * this.side, this.arena.x0 + 100, this.arena.x1 - 100), cy, 200, dt);
        if (this.once('c2-say')) this.speak('Mes œufs… tous rentrés ? Hmm… C\'est sûrement une ruse !', 2.6);
        if (t > 2.4) this.rest(1 / this.k);
        break;
      case 'r3':
        // surprise sur son dos ! puis un grand coup de vent abîme le nid
        if (t < 0.9) {
          this.pose = 'hop';
          this.mood = 'surprised';
          if (this.once('c3-hiii')) {
            this.puff = 1;
            this.feathers(12);
            Sound.sfx.eagleSurprise();
            this.speak('Hiii ! Une voleuse sur mon dos ?!', 1.6);
          }
          this.py = approach(this.py, this.groundY - 150, 260 * dt);
        } else {
          this.pose = 'fly';
          this.goTo(this.px, cy, 300, dt);
        }
        if (t > 1.5 && this.once('c3-gust')) {
          this.gust(1);
          this.blowNest();
          this.mood = 'worried';
          this.speak('Oh non ! Le vent abîme mon nid !', 2.2);
        }
        if (t > 3.2) this.rest(1.2 / this.k);
        break;
      case 'r4':
        // le nid est réparé… et des notes de musique arrivent avec le vent
        this.pose = 'fly';
        this.mood = 'worried';
        this.goTo(this.nest.x - 160, cy, 220, dt);
        if (this.once('c4-say')) this.speak('Mon nid, tout réparé ? Mais… pourquoi tu m\'aides, toi ?', 2.6);
        if (t > 1.6 && this.once('c4-notes')) this.notesArrive();
        if (t > 2.8) this.rest(1.2 / this.k);
        break;
      case 'r5':
        // elle dort un moment sur son nid ; puis le vent emporte le dessin de Malice
        if (t < 2.8) {
          this.pose = 'perch';
          this.sitting = true;
          this.mood = 'sleep';
          this.zzzT -= dt;
          if (this.zzzT <= 0) {
            this.zzzT = 1.1;
            w.spawn({ type: 'text', x: this.px + 40, y: this.py - 50, vx: 24, vy: -40, life: 1.4, text: 'Z', color: '#fff6e0', size: 20 });
          }
        } else if (t < 5.6) {
          this.pose = 'perch';
          if (this.once('c5-wake')) {
            this.mood = 'surprised';
            Sound.sfx.eagleSurprise();
            this.speak('Hein ? Oh… J\'ai dormi ? Quelle jolie chanson…', 2.4);
          }
          if (t > 4.4 && this.once('c5-gust')) {
            this.gust(-1);
            this.blowDrawing();
            this.pop(p.cx, p.y - 50, 'Oh non, mon dessin !', '#ffe0a0', 22);
            this.song = 'boss-aigle';
            if (!(p.star > 0)) Sound.playMusic(this.song);
          }
        } else {
          this.sitting = false;
          this.pose = 'fly';
          this.mood = 'angry';
          if (this.once('c5-go')) {
            this.speak('Kiii ! Tu es encore là, toi ?', 1.6);
            Sound.sfx.eagleCry();
          }
          this.takeoff(dt);
          if (t > 6.4) this.rest(1 / this.k);
        }
        break;
      default:
        this.rest(1);
        break;
    }
  }

  // un grand coup de vent (dir : vers où il souffle)
  gust(dir) {
    const w = this.world;
    const A = this.arena;
    Sound.sfx.gust();
    for (let i = 0; i < 26; i++) {
      w.spawn({ type: 'spark', x: dir > 0 ? A.x0 + rand(0, 200) : A.x1 - rand(0, 200), y: rand(AIGLE.camY + 80, this.groundY - 10), vx: dir * rand(500, 900), vy: rand(-40, 40), life: 1, size: rand(2, 4), color: '#ffffff' });
    }
  }

  // 3e manche : le vent emporte des brindilles du nid (par terre, ou qui flottent dans le vent, partout dans l'arène)
  blowNest() {
    const n = this.twigsNeeded();
    const A = this.arena;
    const lo = A.x0 + 60;
    const hi = this.picX - 60;
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(lerp(lo, hi, (i + 0.5) / n) + rand(-20, 20));
    // (dans le désordre : elles ne partent pas du nid dans l'ordre)
    xs.sort(() => Math.random() - 0.5);
    const low = this.k < 0.9;
    xs.forEach((x, i) => {
      const o = this.newThing('twig', i, this.nest.x + rand(-40, 40), this.nest.y - 70, 'fly');
      const float = i % 2 === 1;
      const y = float ? this.groundY - (low ? 86 : 100 + (i % 4 === 1 ? 0 : 24)) : this.groundAt(x) - 8;
      this.flyTo(o, x, y, 1.1 + i * 0.12, 120, float ? 'float' : 'rest');
      o.rot = rand(-1, 1);
      o.spin = rand(-8, 8);
      this.things.push(o);
    });
    this.nestShake = 1;
  }

  // 4e manche : trois notes de musique (do, ré, mi) arrivent avec le vent, de la gauche
  notesArrive() {
    const A = this.arena;
    for (let i = 0; i < 3; i++) {
      const o = this.newThing('note', i, A.x0 + 20, this.noteY(i, 0), 'float');
      o.hx = A.x0 + 120 + i * 300;
      o.x = A.x0 - 60 - i * 40;
      o.k = 0;
      this.things.push(o);
    }
    Sound.sfx.gust();
  }

  // la hauteur d'une note (elle monte et descend doucement : il faut sauter pour l'attraper)
  noteY(i, t) {
    const base = this.k < 0.9 ? 92 : 100 + i * 18;
    return this.groundY - base + Math.sin(t * 1.6 + i * 2.1) * 12;
  }

  // 5e manche : le dessin s'envole de la poche de Malice, en morceaux (par terre, sur le pic, ou dans le vent)
  blowDrawing() {
    const n = this.bitsNeeded();
    const p = this.world.player;
    const A = this.arena;
    const lo = A.x0 + 60;
    const hi = this.picX - 60;
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(lerp(lo, hi, (i + 0.5) / n) + rand(-24, 24));
    // (en Classique et en Difficile, un morceau s'envole jusque sur le pic, à côté du nid)
    if (this.k > 1.2) xs[n - 1] = this.picX + 50;
    xs.sort(() => Math.random() - 0.5);
    const low = this.k < 0.9;
    xs.forEach((x, i) => {
      const o = this.newThing('bit', i, p.cx, p.y + 20, 'fly');
      const float = i % 2 === 0 && x < this.picX;
      const y = float ? this.groundY - (low ? 86 : 104) : this.groundAt(x) - 10;
      this.flyTo(o, x, y, 1.2 + i * 0.1, 150, float ? 'float' : 'rest');
      o.spin = rand(-6, 6);
      this.things.push(o);
    });
  }

  // une chose s'envole jusqu'à (x, y) en dur secondes (arc : la hauteur de la courbe), puis devient then
  flyTo(o, x, y, dur, arc, then, target) {
    o.st = 'fly';
    o.fly = { fx: o.x, fy: o.y, x, y, dur, arc, then, target: target || null, t: 0 };
    o.hx = x;
    o.hy = y;
  }

  // ---------- Ce qu'on ramasse, ce qu'on rapporte ----------
  updateThings(dt) {
    const w = this.world;
    const p = w.player;
    const A = this.arena;
    const hurt = !p.dead && this.lastEnergy !== null && p.energy < this.lastEnergy;
    const can = this.state === 'fight' && !p.dead && !p.carry;
    for (const o of this.things) {
      o.t += dt;
      if (o.cool > 0) o.cool -= dt;
      switch (o.st) {
        case 'roll':
          this.rollEgg(o, dt);
          break;
        case 'fly': {
          const F = o.fly;
          F.t += dt;
          const u = Math.min(1, F.t / F.dur);
          const e = 1 - (1 - u) * (1 - u);
          const tx = F.target ? F.target().x : F.x;
          const ty = F.target ? F.target().y : F.y;
          o.x = lerp(F.fx, tx, e);
          o.y = lerp(F.fy, ty, e) - Math.sin(u * Math.PI) * F.arc;
          o.rot += (o.spin || 0) * dt * (1 - u);
          if (u >= 1) {
            o.st = F.then;
            o.fly = null;
            o.t = rand(0, 6);
            if (o.st === 'rest' || o.st === 'float') o.rot *= 0.3;
            if (o.kind === 'egg' && o.st === 'home') this.eggHome(o);
          }
          break;
        }
        case 'float':
          if (o.kind === 'note') {
            // les notes s'en vont avec le vent, de gauche à droite (et reviennent par la gauche)
            o.k = Math.min(1, o.k + dt * 2);
            o.hx += (this.k < 0.9 ? 36 : 44 + 14 * this.k) * dt;
            if (o.hx > A.x1 - 26) {
              o.hx = A.x0 + 26;
              o.k = 0;
            }
            o.x = o.x < A.x0 ? approach(o.x, o.hx, 300 * dt) : o.hx;
            o.y = this.noteY(o.i, o.t);
          } else {
            // une brindille ou un morceau de dessin qui flotte dans le vent, sur place
            o.x = o.hx + Math.sin(o.t * 0.9 + o.i) * 22;
            o.y = o.hy + Math.sin(o.t * 1.8 + o.i * 2) * 7;
            o.rot = Math.sin(o.t * 1.3 + o.i) * 0.5;
          }
          break;
        case 'held':
          if (o.kind === 'egg') {
            o.x = p.cx + p.facing * 16;
            o.y = p.y + 30;
          }
          break;
        default: break;
      }
      // on le ramasse (en le touchant, même en l'air ; une note qui revient par la gauche, seulement quand on la voit)
      if (can && o.cool <= 0 && (o.st === 'rest' || o.st === 'float' || (o.st === 'roll' && o.landed)) && (o.kind !== 'note' || o.k > 0.6) &&
        boxOverlap(p, ...this.thingBox(o))) this.pick(o);
    }
    // Malice a mal : elle lâche l'œuf qu'elle porte (il ne se casse jamais : il roule un peu, et on le reprend)
    if (this.held && (hurt || p.dead || this.state !== 'fight')) this.dropEgg();
    // (diff.aigleDrop : un coup fait aussi lâcher la botte de brindilles, ou s'envoler le dernier morceau du dessin
    // ramassé ; sinon, on les garde)
    if (hurt && this.state === 'fight' && this.world.diff.aigleDrop) {
      if (this.bundle > 0) this.dropTwigs();
      else if (this.phase === 4 && !this.drawingDone && this.bitsGot > 0) this.dropBit();
    }
    // on rapporte au nid l'œuf, ou les brindilles
    if (can && (this.held || this.bundle > 0) && overlap(p, this.nestZone())) this.deliver();
    this.lastEnergy = p.energy;
  }

  // la boîte où l'on attrape une chose (un peu plus grande qu'elle : une enfant qui saute vers elle l'attrape)
  thingBox(o) {
    switch (o.kind) {
      case 'egg': return [o.x - 24, o.y - 26, 48, 48];
      case 'twig': return [o.x - 32, o.y - 22, 64, 44];
      case 'note': return [o.x - 26, o.y - 28, 52, 56];
      default: return [o.x - 28, o.y - 26, 56, 52];
    }
  }

  // Un œuf qui roule : il tombe, rebondit un peu, et roule jusqu'à sa place (tx) en ralentissant.
  rollEgg(o, dt) {
    const A = this.arena;
    const R = 15;
    o.vy += 1800 * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.x < A.x0 + R || o.x > A.x1 - R) {
      o.x = clamp(o.x, A.x0 + R, A.x1 - R);
      o.vx = -o.vx * 0.4;
    }
    // (contre le pic : il ne rentre pas dans la roche)
    if (o.x + R > this.picX && o.y > this.groundAt(this.picX) + 4 && o.x < this.picX + 30) {
      o.x = this.picX - R;
      o.vx = -Math.abs(o.vx) * 0.4;
    }
    const fl = this.groundAt(o.x) - R;
    if (o.y >= fl) {
      o.y = fl;
      if (o.vy > 160) {
        o.vy = -o.vy * 0.4;
        if (this.world.onScreen({ x: o.x, y: o.y, w: 1, h: 1 }, 40)) Sound.sfx.hailLand();
      } else {
        o.vy = 0;
        o.landed = true;
        const onGround = fl + R >= this.groundY - 1;
        if (o.tx !== null && onGround) {
          // (il ralentit juste ce qu'il faut pour s'arrêter à sa place)
          const d = o.x - o.tx;
          if (Math.abs(d) < 3 || Math.sign(d) === Math.sign(o.vx)) o.vx = 0;
          else o.vx = approach(o.vx, 0, ((o.vx * o.vx) / (2 * Math.abs(d))) * dt);
        } else if (o.tx === null) {
          o.vx = approach(o.vx, 0, 360 * dt);
        }
        if (Math.abs(o.vx) < 6 && (onGround || o.tx === null)) {
          o.vx = 0;
          o.st = 'rest';
          o.tx = null;
        }
      }
    }
    o.rot += (o.vx * dt) / R;
  }

  pick(o) {
    const w = this.world;
    const p = w.player;
    if (o.kind === 'egg') {
      if (this.held) return;
      this.held = o;
      o.st = 'held';
      o.rot = 0;
      p.holding = (ctx) => AigleArt.heldEgg(ctx);
      this.pop(p.cx, p.y - 24, 'Un œuf !', '#fff6d8', 20);
      Sound.sfx.eggPick();
      this.tip = null;
      // (diff.aigleEggDive : elle l'a vu ! elle pique aussitôt, annoncée comme toujours ; si elle est déjà en train
      // d'attaquer, elle finit d'abord)
      if (w.diff.aigleEggDive && (this.act === 'fly' || this.act === 'climb')) {
        this.eggAlarm = true;
        this.rest(0);
      }
    } else if (o.kind === 'twig') {
      o.st = 'held';
      this.bundle++;
      const n = this.bundle;
      p.holding = (ctx) => AigleArt.heldTwigs(ctx, n);
      this.pop(p.cx, p.y - 24, `Une brindille ! ${this.repaired + this.bundle}/${this.twigsNeeded()}`, '#ffe0b0', 19);
      Sound.sfx.twig();
      this.tip = null;
    } else if (o.kind === 'note') {
      // la note se pose au-dessus de la tête de Malice
      o.st = 'got';
      this.sung++;
      Sound.sfx.noteGet(o.i);
      this.pop(p.cx, p.y - 30, ['Do !', 'Ré !', 'Mi !'][o.i], AigleArt.NOTE[o.i], 24);
      this.tip = null;
      if (this.sung >= 3) this.startLullaby();
    } else {
      // un morceau du dessin : le dessin se reconstruit dans les mains de Malice
      o.st = 'got';
      o.gotAt = this.t;
      this.bitsGot++;
      const got = this.things.filter((b) => b.kind === 'bit' && b.st === 'got').map((b) => b.i);
      const n = this.bitsNeeded();
      p.holding = (ctx) => AigleArt.heldDrawing(ctx, n, got, w.t, false);
      Sound.sfx.eggPick();
      this.tip = null;
      if (this.bitsGot >= n) {
        this.drawingDone = true;
        this.pop(p.cx, p.y - 30, 'Le dessin est entier !', '#fff6a0', 22);
        Sound.sfx.goldFeather();
        this.mark = null;
        this.swoop = null;
        this.startLand(true);
      } else {
        this.pop(p.cx, p.y - 24, `Un morceau ! ${this.bitsGot}/${n}`, '#fff6d8', 19);
      }
    }
  }

  dropEgg() {
    const w = this.world;
    const p = w.player;
    const o = this.held;
    this.held = null;
    p.holding = null;
    o.st = 'roll';
    o.x = clamp(p.cx, this.arena.x0 + 20, this.arena.x1 - 20);
    o.y = p.y + 24;
    // (diff.aigleDrop : il roule plus loin)
    o.vx = -p.facing * (w.diff.aigleDrop ? 220 : 50);
    o.vy = -120;
    o.tx = null;
    o.landed = false;
    o.cool = 1;
    // (un peu plus tard : pas sur « Wouaaah ! »)
    if (!p.dead) this.later.push({ t: 0.6, run: () => this.pop(o.x, o.y - 40, 'Ouf, il n\'est pas cassé !', '#fff6d8', 18) });
  }

  // diff.aigleDrop : Malice a mal, la botte de brindilles s'éparpille (elles retombent tout près, ou flottent dans le vent)
  dropTwigs() {
    const w = this.world;
    const p = w.player;
    const lo = this.arena.x0 + 60;
    const hi = this.picX - 60;
    const x0 = clamp(p.cx, lo + 60, hi - 60);
    let i = 0;
    for (const o of this.things) {
      if (o.kind !== 'twig' || o.st !== 'held') continue;
      o.x = p.cx;
      o.y = p.y + 26;
      const side = i % 2 ? 1 : -1;
      const x = clamp(x0 + side * (80 + Math.floor(i / 2) * 64), lo, hi);
      const float = i % 2 === 1;
      this.flyTo(o, x, float ? this.groundY - 100 : this.groundAt(x) - 8, 0.8 + i * 0.08, 90, float ? 'float' : 'rest');
      o.spin = rand(-8, 8);
      o.cool = 0.5;
      i++;
    }
    this.bundle = 0;
    p.holding = null;
    this.pop(x0, p.y - 40, 'Oh non, les brindilles !', '#ffe0b0', 19);
  }

  // diff.aigleDrop : Malice a mal, le dernier morceau du dessin qu'elle a ramassé s'envole (pas très loin)
  dropBit() {
    const w = this.world;
    const p = w.player;
    const got = this.things.filter((b) => b.kind === 'bit' && b.st === 'got');
    const o = got.reduce((a, b) => ((b.gotAt || 0) > (a.gotAt || 0) ? b : a));
    this.bitsGot--;
    const lo = this.arena.x0 + 60;
    const hi = this.picX - 60;
    let side = Math.sign(p.cx - this.px) || 1;
    if (p.cx + side * 150 > hi || p.cx + side * 150 < lo) side = -side;
    const x = clamp(p.cx + side * 150, lo, hi);
    const float = o.i % 2 === 0;
    o.x = p.cx;
    o.y = p.y + 20;
    this.flyTo(o, x, float ? this.groundY - 104 : this.groundAt(x) - 10, 1, 130, float ? 'float' : 'rest');
    o.spin = rand(-6, 6);
    o.cool = 0.5;
    const n = this.bitsNeeded();
    const left = got.filter((b) => b !== o).map((b) => b.i);
    p.holding = left.length ? (ctx) => AigleArt.heldDrawing(ctx, n, left, w.t, false) : null;
    this.pop(p.cx, p.y - 40, 'Oh non, un morceau s\'envole !', '#fff6d8', 19);
  }

  deliver() {
    const w = this.world;
    const p = w.player;
    this.tip = null;
    if (this.held) {
      const o = this.held;
      this.held = null;
      p.holding = null;
      o.x = p.cx + p.facing * 16;
      o.y = p.y + 30;
      this.flyTo(o, this.slotX(o.i), this.slotY(), 0.45, 40, 'home');
      const home = this.things.filter((e) => e.kind === 'egg' && (e.st === 'home' || e.st === 'fly')).length;
      const left = 3 - home;
      this.pop(p.cx, p.y - 30, left > 0 ? `Dans le nid ! Encore ${left} !` : 'Tous les œufs sont rentrés !', '#fff6a0', 21);
      Sound.sfx.eggNest();
      if (this.once('r1-first')) this.speak('Hé ? Tu… tu as rapporté mon œuf ?', 2);
    } else {
      // les brindilles retournent dans le nid
      for (const o of this.things) {
        if (o.kind !== 'twig' || o.st !== 'held') continue;
        o.x = p.cx;
        o.y = p.y + 26;
        this.flyTo(o, this.nest.x + rand(-60, 60), this.nest.y - 64, 0.5, 50, 'gone');
      }
      this.repaired += this.bundle;
      this.bundle = 0;
      p.holding = null;
      const n = this.twigsNeeded();
      this.pop(p.cx, p.y - 30, this.repaired >= n ? 'Le nid est réparé !' : `Le nid : ${this.repaired}/${n}`, '#fff6a0', 21);
      Sound.sfx.eggNest();
      this.nestShake = 0.4;
    }
  }

  eggHome(o) {
    this.world.spawn({ type: 'heart', x: o.x, y: o.y - 20, vy: -60, life: 0.9, size: 0.8 });
  }

  // ---------- Ce qui la touche ----------
  // 1re manche : le dernier œuf rentré ; 2e : le dernier saut sur son dos (ou un pouvoir qui renverse) ; 3e : la
  // dernière brindille ; 4e : elle s'endort ; 5e : Malice lui montre le dessin.
  takes(how) {
    switch (this.phase) {
      case 0: return how === 'egg';
      case 1: return (how === 'stomp' || how === 'bump' || how === 'star') && this.act === 'rest' && this.hops + 1 >= this.hopsNeeded();
      case 2: return how === 'twig';
      case 3: return how === 'song';
      // (en la touchant, en lui sautant dessus, avec l'étoile : pas avec un tir de loin, voir fight)
      default: return this.drawingDone && this.act === 'wait' && (how === 'show' || how === 'stomp' || how === 'star');
    }
  }

  // sauté dessus quand ça ne compte pas encore (2e manche : un saut sur son dos qui n'est pas le dernier)
  onBounce() {
    if (this.state === 'fight' && this.phase === 1 && this.act === 'rest') {
      this.backHop();
      return;
    }
    Sound.sfx.boing(false);
  }

  // (un pouvoir qui renverse, ou l'étoile : comme un saut sur son dos, quand elle est essoufflée par terre)
  kill(type) {
    if (super.kill(type)) return true;
    if (this.state === 'fight' && this.phase === 1 && this.act === 'rest' && this.recover <= 0) {
      this.backHop();
      return true;
    }
    return false;
  }

  // (les tirs des pouvoirs ne l'atteignent que quand elle est par terre)
  shotBox() {
    if (this.state === 'fight' && (this.act === 'rest' || this.act === 'wait')) return this.body();
    return { x: this.px, y: -9999, w: 0, h: 0 };
  }

  shot() {}

  // projetée par un piqué : elle part loin de Maman Aigle (voir OUCH.spin)
  tossed(p) {
    if (!p.tumbling()) return;
    p.vx = (Math.sign(p.cx - this.px) || -this.facing) * OUCH.spin.vx;
  }

  onHit() {
    const w = this.world;
    this.tip = null;
    this.mark = null;
    this.swoop = null;
    this.act = 'ouch';
    this.actT = 0;
    // (2e manche : essoufflée d'avoir cherché ses œufs, elle se pose tout de suite après la coupure, voir plans)
    this.plan = this.phase === 1 ? 1 : 0;
    this.eggAlarm = false;
    this.cut =['', 'r2', 'r3', 'r4', 'r5'][this.phase];
    w.shake(4);
    if (this.phase === 4) {
      // (la berceuse est finie : les notes s'en vont)
      for (const o of this.things) if (o.kind === 'note') o.st = 'gone';
    }
  }

  // Elle ne fait mal qu'en piquant (et juste en touchant le sol), ou en rase-mottes.
  dangerous() {
    return this.act === 'dive' || (this.act === 'thud' && this.actT < 0.12) || this.act === 'swoop';
  }

  // (elle vole : on ne se coince pas entre elle et un bord, voir Boss.keepOut)
  cornered() { return false; }

  // ---------- Les petits conseils ----------
  advise() {
    const w = this.world;
    const p = w.player;
    const D = w.diff;
    // (d'abord les dangers : même par-dessus un autre conseil)
    if (this.act === 'aim' && this.mark && this.mark.again && this.once('h-double')) {
      this.hint('Elle repique ! Regarde la nouvelle ombre, et écarte-toi encore !', 3);
      return;
    }
    if (this.act === 'aim' && this.once('h-dive')) {
      this.hint('Quand elle crie « Kiiii ! », elle va piquer sur l\'ombre : écarte-toi !', 3.5);
      return;
    }
    if (this.act === 'swoopWarn' && this.swoop && this.swoop.back && this.once('h-swoop2')) {
      this.hint('Elle revient dans l\'autre sens : saute encore !', 2.6);
      return;
    }
    if (this.act === 'swoopWarn' && this.once('h-swoop')) {
      this.hint('Elle arrive en rase-mottes : saute par-dessus !', 3);
      return;
    }
    if (this.tip && this.tip.t > 0) return;
    // (pas pendant qu'elle parle : les deux bulles se cacheraient)
    if (this.say && this.say.t > 0.2) return;
    const again = this.hintT > 15;
    const say = (key, text, dur) => {
      if (!this.once(key) && !again) return false;
      this.hintT = 0;
      this.hint(text, dur || 4);
      return true;
    };
    if (this.act === 'ouch' || this.act === 'lull' || this.act === 'aim' || this.act === 'dive' || this.act === 'swoopWarn' || this.act === 'swoop') return;
    switch (this.phase) {
      case 0:
        if (this.held) say('h-nest', D.aigleDrop ? 'Rapporte l\'œuf dans le nid, en haut du pic ! Si elle te touche, tu le lâches…' : 'Rapporte l\'œuf dans le nid, en haut du pic !', 3.5);
        else say('h-eggs', D.aigleEggDive ? 'Ses œufs ont roulé hors du nid ! Ramasse-les un par un… mais elle les surveille !' : 'Ses œufs ont roulé hors du nid ! Ramasse-les un par un…', 3.5);
        break;
      case 1:
        if (this.act === 'rest') say('h-back', 'Maman Aigle est essoufflée… Saute-lui sur le dos !', 3.5);
        break;
      case 2:
        if (this.bundle > 0) say('h-twig2', D.aigleDrop ? 'Rapporte les brindilles au nid ! Si elle te touche, tu lâches tout !' : 'Rapporte les brindilles au nid !', 3);
        else say('h-twigs', 'Ramasse les brindilles (saute pour celles qui flottent dans le vent) !', 4);
        break;
      case 3:
        say('h-notes', 'Des notes de musique dans le vent ! Saute pour les attraper toutes les trois…', 4);
        break;
      default:
        if (this.act === 'wait') say('h-show', 'Montre le dessin à Maman Aigle : va tout près d\'elle !', 4);
        else if (!this.drawingDone && D.aigleDrop && this.bitsGot > 0 && this.once('h-bits2')) this.hint('Si elle te touche, un morceau s\'envole : fais bien attention !', 3.5);
        else if (!this.drawingDone && this.things.some((o) => o.kind === 'bit' && (o.st === 'rest' || o.st === 'float'))) say('h-bits', 'Ramasse tous les morceaux de ton dessin !', 3.5);
        break;
    }
  }

  // Elle parle toute seule (quand on n'a rien d'autre à dire).
  chatter(dt) {
    this.chatT -= dt;
    if (this.chatT > 0 || (this.say && this.say.t > 0) || (this.tip && this.tip.t > 0) || (this.act !== 'fly' && this.act !== 'circle')) return;
    this.chatT = 12;
    const L = [
      'Personne ne touche à mes petits !',
      'Kiii ! Je vole plus vite que le vent !',
      'Mes œufs vont bientôt éclore… je dois les protéger !',
      'Ce volcan fait un de ces bruits… mes pauvres petits !',
    ];
    this.speak(L[this.chats++ % L.length], 2.4);
  }

  // Ce qu'elle crie (« Kiiii ! ») : un petit texte qui la suit (sous elle quand elle vole tout en haut, sinon au-dessus
  // de ses ailes levées ; voir drawWarning).
  shout(text) {
    this.cry = { text, t: 0.9, dur: 0.9 };
  }

  // Un petit texte qui s'envole (comme World.popText), mais jamais écrit sur un autre tout proche sorti il y a moins
  // d'une demi-seconde : il se met juste au-dessus.
  pop(x, y, text, color, size) {
    const now = this.t;
    this.pops = this.pops.filter((q) => now - q.t < 0.5);
    let yy = y;
    for (let k = 0; k < 4; k++) {
      const hit = this.pops.find((q) => Math.abs(q.x - x) < 110 && Math.abs(q.y - 60 * (now - q.t) - yy) < 24);
      if (!hit) break;
      yy = hit.y - 60 * (now - hit.t) - 26;
    }
    this.pops.push({ x, y: yy, t: now });
    this.world.popText(x, yy, text, color, size);
  }

  // des plumes qui s'envolent
  feathers(n) {
    const w = this.world;
    for (let i = 0; i < n; i++) {
      w.spawn({ type: 'debris', x: this.px + rand(-40, 40), y: this.py + rand(-30, 20), vx: rand(-160, 160), vy: rand(-260, -60), g: 300, life: 1, size: rand(4, 7), color: choose(['#8a5a2e', '#b07a3e', '#f4ead8']), vr: rand(-6, 6) });
    }
  }

  // ---------- La fin ----------
  // Elle regarde le dessin… et reconnaît le bébé oiseau : il est coincé au cœur du volcan ! Elle comprend que Malice
  // n'est pas une voleuse. Les œufs éclosent, trois aiglons font un bisou à Malice, Maman Aigle lui donne sa plume
  // dorée, puis l'emporte sur son dos jusqu'au Cœur du Volcan.
  onBeaten() {
    const w = this.world;
    const p = w.player;
    this.act = 'beaten';
    this.mark = null;
    this.swoop = null;
    this.say = null;
    this.cry = null;
    this.later = [];
    this.pose = 'stand';
    this.mood = 'wide';
    const n = this.bitsNeeded();
    const all = Array.from({ length: n }, (_, i) => i);
    p.holding = (ctx) => AigleArt.heldDrawing(ctx, n, all, w.t, true);
    for (const o of this.things) if (o.kind === 'twig' || o.kind === 'note') o.st = 'gone';
    Sound.sfx.goldFeather();
    // Malice recule d'un petit bond, pour qu'on voie tout (le dessin, l'éclosion, les bisous, la plume) ; et jusqu'à la
    // fin, on ne la dirige plus (Player.carry : elle reste là où elle est, puis elle monte sur le dos de Maman Aigle).
    // Elle reste vers le milieu de l'écran (sur une tablette, les boutons sont dans les coins du bas) : s'il n'y a pas
    // assez de place derrière elle, c'est Maman Aigle qui recule.
    const A = this.arena;
    const D = 150;
    const s = Math.sign(p.cx - this.px) || -this.facing;
    const cam = w.cam.x;
    const x = clamp(clamp(this.px + s * D, cam + 320, cam + 600), A.x0 + 40, this.picX - 30);
    this.stand = { fx: p.cx, fy: p.y + p.h, x, y: this.groundAt(x), t: 0, dur: 0.5 };
    this.back = Math.abs(x - this.px) < D - 20 ? { fx: this.px, x: clamp(x - s * D, A.x0 + 70, this.picX - 70) } : null;
    this.calm(p);
    p.carry = { move: (pl, dt2) => this.standMove(pl, dt2) };
    this.facing = s;
  }

  // ce que Malice était en train de faire s'arrête (son pouvoir, sa boule, le grappin…)
  calm(p) {
    p.dropPuff();
    p.stopPower();
    p.grap = null;
    p.pound = 0;
    p.crouch = false;
    if (p.ball && p.roomToStand()) p.standUp();
  }

  // Player.carry pendant la fin : son petit bond en arrière, puis elle reste là, tournée vers Maman Aigle
  standMove(p, dt) {
    const S = this.stand;
    S.t += dt;
    const u = Math.min(1, S.t / S.dur);
    const feet = lerp(S.fy, S.y, u) - Math.sin(u * Math.PI) * 46;
    p.x = lerp(S.fx, S.x, u) - p.w / 2;
    p.y = feet - p.h;
    p.vx = 0;
    p.vy = u >= 1 ? 0 : u < 0.5 ? -200 : 200;
    p.onGround = u >= 1;
    p.prevBottom = p.y + p.h;
    p.facing = Math.sign(this.px - p.cx) || p.facing;
  }

  // La fin (les temps sont dans MamanAigle.END).
  outro(dt, t) {
    const w = this.world;
    const p = w.player;
    const T = MamanAigle.END;
    const A = this.arena;
    // (s'il n'y avait pas de place derrière Malice, Maman Aigle recule d'un pas)
    if (this.back && t < 0.6) {
      const u = Math.min(1, t / 0.5);
      this.px = lerp(this.back.fx, this.back.x, u * u * (3 - 2 * u));
    }
    if (t < T.ride) {
      this.facing = Math.sign(p.cx - this.px) || this.facing;
      this.pose = 'stand';
    }
    if (this.once('o-see')) this.speak('Mais… c\'est le petit oiseau ! Il est coincé tout au fond du volcan… Tu vas le sauver ?', 3.2);
    if (t > T.sorry && this.once('o-sorry')) {
      this.mood = 'heart';
      this.blush = 1;
      this.speak('Alors tu n\'es pas une voleuse d\'œufs… Pardon, Malice !', 2.6);
      Sound.sfx.scareFriend();
      p.holding = null;
    }
    this.tears = t > T.sorry - 0.6 && t < T.hatch ? 1 : approach(this.tears, 0, dt);
    if (t > T.hatch && this.once('o-hatch')) {
      this.mood = 'happy';
      this.hatch();
      if (!(p.star > 0)) Sound.playMusic(levelSong(w.def));
    }
    if (t > T.gift && this.once('o-gift')) {
      // (la bulle est finie avant que la plume arrive : on lit « Une plume dorée ! »)
      this.speak('Tiens, ma plume dorée : elle porte bonheur !', 1.5);
      this.gift = { x: this.px + this.facing * 40, y: this.py - 30, t: 0, dur: 1.6, got: false };
    }
    if (t > T.climb && this.once('o-climb')) {
      this.speak('Monte sur mon dos : je t\'emmène au Cœur du Volcan !', 2.2);
      // elle vient se poser tout à côté de Malice (du côté du milieu de l'écran)
      let side = p.cx - w.cam.x < VIEW_W / 2 - 25 ? 1 : -1;
      if (p.cx + side * 80 > this.picX - 30 || p.cx + side * 80 < A.x0 + 70) side = -side;
      this.landAt = { fx: this.px, fy: this.py, x: clamp(p.cx + side * 80, A.x0 + 70, A.x1 - 70), dur: 0.8 };
      this.landAt.y = this.groundAt(this.landAt.x) - AIGLE.stand;
    }
    if (t > T.climb && t < T.ride && this.landAt) {
      const L = this.landAt;
      const u = Math.min(1, (t - T.climb) / L.dur);
      this.px = lerp(L.fx, L.x, u * u * (3 - 2 * u));
      this.py = lerp(L.fy, L.y, u * u * (3 - 2 * u)) - Math.sin(u * Math.PI) * 40;
      this.pose = u < 1 ? 'fly' : 'stand';
    }
    if (t > T.board && this.once('o-board')) {
      // Malice saute sur son dos
      this.ride = { st: 'board', t: 0, fx: p.cx, fy: p.y + p.h };
      this.calm(p);
      p.holding = null;
      p.carry = { move: (pl, dt2) => this.rideMove(pl, dt2) };
      Sound.sfx.jump();
    }
    if (t > T.ride && this.once('o-ride')) {
      // et c'est parti ! elle s'envole avec Malice, vers le haut de l'écran, à gauche des boutons d'une tablette (en
      // bas à droite) et sous ce qui est écrit en haut ; l'arène s'ouvre en haut : rien ne retient Malice
      A.y0 = -4000;
      this.lift = { fx: this.px, fy: this.py, x: w.cam.x + clamp(this.px - w.cam.x, 220, 430), y: w.cam.y + 200 };
      this.pop(p.cx, p.y - 30, 'Wouhouuu !', '#fff6a0', 26);
      Sound.sfx.eagleCry();
    }
    if (t > T.ride && t < T.fade + 0.7) {
      const L = this.lift;
      const u = Math.min(1, (t - T.ride) / (T.fade - T.ride));
      // (de côté d'abord, puis vers le haut)
      this.px = lerp(L.fx, L.x, 1 - (1 - u) * (1 - u));
      this.py = lerp(L.fy, L.y, u * u * (3 - 2 * u));
      this.pose = 'fly';
      this.facing = 1;
      this.mvx = 0;
      if (Math.random() < dt * 20 && t < T.fade) w.spawn({ type: 'spark', x: this.px - 60, y: this.py + rand(-10, 20), vx: -rand(40, 120), vy: rand(-20, 30), life: 0.6, size: rand(3, 5), color: '#fff3a0' });
    }
    // le petit vol, au-dessus de la mer de nuages, jusqu'à l'entrée du Cœur du Volcan (voir drawScreen)
    if (t > T.fade) {
      if (!this.flight) {
        this.flight = { t: 0, trail: [] };
        Sound.sfx.gust();
      }
      const F = this.flight;
      F.t = t - T.fade;
      this.pose = 'fly';
      this.facing = 1;
      if (t > T.door && this.once('o-door')) {
        Sound.sfx.goldFeather();
        w.shake(3);
      }
    }
    if (t > T.end && w.game.state === 'play') w.game.levelComplete();
    this.updateChicks(dt);
    this.updateGift(dt);
    return false;
  }

  // Player.carry : Malice sur son dos (elle y saute d'abord, en petit bond)
  rideMove(p, dt) {
    const R = this.ride;
    R.t += dt;
    const backX = this.px - this.facing * 6;
    const backY = this.py - 32;
    if (R.st === 'board') {
      const u = Math.min(1, R.t / 0.45);
      p.x = lerp(R.fx, backX, u) - p.w / 2;
      p.y = lerp(R.fy, backY, u) - Math.sin(u * Math.PI) * 70 - p.h;
      if (u >= 1) R.st = 'ride';
    } else {
      p.x = backX - p.w / 2;
      p.y = backY - p.h;
    }
    p.vx = 0;
    p.vy = 0;
    p.onGround = R.st === 'ride';
    p.prevBottom = p.y + p.h;
    p.facing = this.facing;
  }

  // les œufs éclosent : trois aiglons
  hatch() {
    const w = this.world;
    Sound.sfx.eggCrack();
    this.chicks = [0, 1, 2].map((i) => ({ i, x: this.slotX(i), y: this.slotY() - 4, st: 'pop', t: -i * 0.3, kissed: false }));
    for (const o of this.things) if (o.kind === 'egg') o.st = 'shell';
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 5; k++) {
        w.spawn({ type: 'debris', x: this.slotX(i), y: this.slotY(), vx: rand(-120, 120), vy: rand(-240, -80), g: 900, life: 0.6, size: rand(3, 5), color: '#fbf3e0', vr: rand(-10, 10) });
      }
    }
  }

  // Les aiglons sortent de leur coquille (« Piou ! »), volettent jusqu'à Malice, lui font un bisou, et rentrent au nid.
  updateChicks(dt) {
    const C = this.chicks;
    if (!C) return;
    const w = this.world;
    const p = w.player;
    for (const c of C) {
      c.t += dt;
      if (c.t < 0) continue;
      const home = { x: this.slotX(c.i), y: this.slotY() - 8 };
      const cheek = { x: p.cx + (c.i - 1) * 14, y: p.y + 8 - (c.i % 2) * 10 };
      if (c.st === 'pop') {
        if (c.t > 0 && !c.peeped) {
          c.peeped = true;
          Sound.sfx.peep();
          this.pop(home.x, home.y - 30, 'Piou !', '#fff6d0', 18);
        }
        c.x = home.x;
        c.y = home.y - Math.min(1, c.t * 4) * 8;
        if (c.t > 1.2 + c.i * 0.2) {
          c.st = 'go';
          c.t = 0;
          c.fx = c.x;
          c.fy = c.y;
        }
      } else if (c.st === 'go') {
        const u = Math.min(1, c.t / 0.9);
        c.x = lerp(c.fx, cheek.x, u);
        c.y = lerp(c.fy, cheek.y, u) - Math.sin(u * Math.PI) * 60;
        if (u >= 1) {
          c.st = 'kiss';
          c.t = 0;
          Sound.sfx.kiss();
          this.pop(cheek.x, cheek.y - 24, 'Smack !', '#ff9ad0', 18);
          w.spawn({ type: 'heart', x: cheek.x, y: cheek.y, vy: -70, life: 1.1, size: 1 });
        }
      } else if (c.st === 'kiss') {
        c.x = cheek.x;
        c.y = cheek.y;
        if (c.t > 0.45) {
          c.st = 'back';
          c.t = 0;
          c.fx = c.x;
          c.fy = c.y;
        }
      } else if (c.st === 'back') {
        const u = Math.min(1, c.t / 0.9);
        c.x = lerp(c.fx, home.x, u);
        c.y = lerp(c.fy, home.y, u) - Math.sin(u * Math.PI) * 70;
        if (u >= 1) c.st = 'home';
      } else {
        c.x = home.x;
        c.y = home.y;
      }
    }
  }

  // La plume dorée : elle descend en se balançant jusqu'à Malice (gardée dans la sauvegarde, voir Game.giveGift).
  updateGift(dt) {
    const G = this.gift;
    if (!G || G.got) return;
    const w = this.world;
    const p = w.player;
    G.t += dt;
    const u = Math.min(1, G.t / G.dur);
    G.x = lerp(G.x, p.cx, Math.min(1, dt * 3 + u * u * 0.3));
    G.y = lerp(G.y, p.y + 10, Math.min(1, dt * 2.2 + u * u * 0.3));
    G.rot = Math.sin(G.t * 4) * 0.5;
    if (Math.random() < dt * 20) w.spawn({ type: 'spark', x: G.x + rand(-10, 10), y: G.y + rand(-16, 16), vy: -30, life: 0.5, size: rand(3, 5), color: '#ffe680' });
    if (u >= 1) {
      G.got = true;
      w.game.giveGift('plume');
      this.pop(p.cx, p.y - 34, 'Une plume dorée !', '#ffe14d', 24);
      Sound.sfx.goldFeather();
      for (let i = 0; i < 14; i++) {
        w.spawn({ type: 'spark', x: p.cx, y: p.y + 20, vx: rand(-200, 200), vy: rand(-260, -40), life: 0.7, size: rand(3, 6), color: choose(['#ffe14d', '#fff6c0', '#ffb030']) });
      }
    }
  }

  // ---------- Ce qui bouge tout le temps ----------
  update(dt) {
    const hud = this.hudK;
    super.update(dt);
    if (this.state !== 'sleep') this.updateThings(dt);
    this.animate(dt);
    // son cri, et ce qui arrive un peu plus tard
    if (this.cry) {
      this.cry.t -= dt;
      if (this.cry.t <= 0) this.cry = null;
    }
    for (const L of this.later) {
      L.t -= dt;
      if (L.t <= 0) L.run();
    }
    this.later = this.later.filter((L) => L.t > 0);
    // (dès que les œufs éclosent, ses vies s'en vont du haut de l'écran : on y voit l'envol)
    if (this.state === 'beaten' && this.flags['o-hatch']) this.hudK = approach(hud, 0, dt * 2.5);
  }

  // (avant que ses œufs éclosent, à la fin : le silence, même après une pause ; voir Game.levelMusic)
  get quiet() { return this.state === 'beaten' && !this.flags['o-hatch']; }

  // elle vole vers (x, y), en ralentissant en arrivant
  goTo(x, y, sp, dt) {
    const dx = x - this.px;
    const ox = this.px;
    this.px = approach(this.px, x, sp * dt * clamp(Math.abs(dx) / 90, 0.25, 1));
    this.py = approach(this.py, y, sp * 0.8 * dt * clamp(Math.abs(y - this.py) / 60, 0.3, 1));
    this.mvx = dt > 0 ? (this.px - ox) / dt : 0;
  }

  // Ce qui change son dessin : ses ailes (battues, levées, repliées, tombantes), penchée, son humeur…
  animate(dt) {
    const p = this.world.player;
    const P = this.state === 'sleep' ? 'perch' : this.pose;
    if (this.state === 'sleep' || (this.state === 'wake' && this.sitting)) this.pose = 'perch';
    let wing = 0;
    let flapV = 0;
    let tilt = 0;
    let droop = 0;
    switch (P) {
      case 'fly': wing = 0.42; flapV = 7; tilt = clamp(this.mvx / 900, -0.25, 0.25) * this.facing; break;
      case 'aim': wing = 0.95; flapV = 3; tilt = -0.15; break;
      case 'dive': wing = 0.05; tilt = 1.1; break;
      case 'swoop': wing = 0.32; flapV = 2; tilt = 0.08; break;
      case 'land': wing = 0.7; flapV = 3; break;
      case 'rest': wing = 0.14; droop = 1; tilt = 0.15; break;
      case 'hop': wing = 0.9; flapV = 16; tilt = -0.25; break;
      case 'stand': wing = 0.08; break;
      default: wing = 0; break;
    }
    this.wing = approach(this.wing, wing, dt * 4);
    this.droop = approach(this.droop, droop, dt * 3);
    this.tilt = approach(this.tilt, tilt, dt * (P === 'dive' ? 8 : 4));
    this.flapV = approach(this.flapV, flapV, dt * 20);
    this.flapT += dt * this.flapV;
    if (this.flapV > 0.5 && Math.floor((this.flapT - dt * this.flapV) / TAU_AIGLE) !== Math.floor(this.flapT / TAU_AIGLE) && P !== 'swoop' &&
      this.world.onScreen({ x: this.px - 80, y: this.py - 60, w: 160, h: 120 }, 0) && this.flapV > 5) Sound.sfx.eagleFlap();
    // de quel côté elle regarde : vers où elle vole, sinon vers Malice
    if (Math.abs(this.mvx) > 40 && P !== 'dive') this.facing = Math.sign(this.mvx);
    else if (P !== 'swoop' && P !== 'dive' && this.state !== 'sleep' && !this.ride) this.facing = Math.sign(p.cx - this.px) || this.facing;
    // l'humeur
    if (this.state === 'fight') {
      const a = this.act;
      if (a === 'rest') this.mood = 'tired';
      else if (a === 'hopped') this.mood = 'surprised';
      else if (a === 'wait') this.mood = 'open';
      else if (a !== 'ouch' && a !== 'lull') this.mood = 'angry';
    }
    this.beak = approach(this.beak, this.say && this.say.t > 0.2 ? 0.5 + Math.sin(this.t * 14) * 0.5 : this.act === 'rest' || P === 'aim' || this.mood === 'surprised' ? 0.8 : 0, dt * 8);
    this.puff = approach(this.puff, 0, dt * 1.2);
    this.nestShake = approach(this.nestShake, 0, dt * 1.5);
    if (this.state === 'beaten' || this.state === 'friend') this.blush = approach(this.blush, 1, dt);
  }

  // ---------- Sa boîte ----------
  // Elle n'existe que quand Maman Aigle est en bas : en piqué, en rase-mottes, posée par terre. Le reste du temps, elle
  // vole tout là-haut, et rien ne la touche. (La boîte reste toujours au-dessus de l'arène, même quand elle s'envole à
  // la fin : le jeu ne fait bouger que ce qui est près de l'écran.)
  box() {
    const A = this.arena;
    const b = this.body();
    const low = this.state === 'fight' && (this.act === 'dive' || this.act === 'thud' || this.act === 'swoop' || this.act === 'rest' || this.act === 'wait' || this.act === 'hopped');
    this.x = clamp(b.x, A ? A.x0 : b.x, A ? Math.min(A.x1, this.world.width) - b.w : b.x);
    this.w = b.w;
    this.h = b.h;
    this.y = low ? b.y : -9999;
    this.stompDepth = this.act === 'rest' ? 44 : 24;
  }

  // son corps (selon sa pose)
  body() {
    switch (this.act) {
      case 'dive':
      case 'thud': return { x: this.px - 34, y: this.py - 30, w: 68, h: 58 };
      case 'swoop': return { x: this.px - 50, y: this.py - 20, w: 100, h: 40 };
      case 'rest': return { x: this.px - 55, y: this.py - 40, w: 110, h: 40 + AIGLE.rest };
      case 'wait': return { x: this.px - 60, y: this.py - 70, w: 120, h: 70 + AIGLE.stand };
      default: return { x: this.px - 50, y: this.py - 40, w: 100, h: 80 };
    }
  }

  // Sa bulle : au-dessus d'elle, ou sous elle quand elle vole tout en haut (sinon elle passerait sous ses vies).
  sayAt() {
    if (this.py < this.groundY - 250) return { x: this.px, y: this.py + 56, below: true };
    return { x: this.px, y: this.py - 76 };
  }

  // Le petit conseil : au-dessus de Malice, mais au-dessus du « ! » du piqué quand il est tout près d'elle (sinon la
  // bulle le cacherait).
  tipAt() {
    const p = this.world.player;
    const m = this.mark;
    if (m && this.act === 'aim' && Math.abs(m.x - p.cx) < 140) return { x: p.cx, y: Math.min(p.y - 30, m.g - 128) };
    return { x: p.cx, y: p.y - 30 };
  }

  // ---------- Dessin ----------
  // à gauche, un mur de fumée du volcan (on ne redescend pas par où l'on est arrivé)
  drawWall(ctx, x, k, side) {
    if (side < 0) AigleArt.smokeWall(ctx, x, AIGLE.camY, this.groundY, k, this.t);
  }

  // Le nid (et Maman Aigle quand elle est dedans), les œufs, ce qui est par terre, et les ombres.
  drawDecor(ctx) {
    const N = this.nest;
    const shake = this.nestShake > 0 ? Math.sin(this.t * 60) * 3 * this.nestShake : 0;
    // les œufs dans le nid (et les coquilles, à la fin)
    for (const o of this.things) {
      if (o.kind === 'egg' && o.st === 'home') AigleArt.egg(ctx, o.x + shake, o.y, 0, this.t + o.i);
      if (o.kind === 'egg' && o.st === 'shell') AigleArt.shell(ctx, o.x, o.y + 4);
    }
    if (this.chicks) for (const c of this.chicks) if (c.st === 'pop' || c.st === 'home') AigleArt.chick(ctx, c.x, c.y, this.t + c.i, c.st === 'pop' ? 1 : 0, 1);
    if (this.sitting) this.drawEagle(ctx);
    // (le nid abîmé par le vent : il manque des brindilles, qui reviennent une par une)
    const missing = this.phase === 2 && this.state === 'fight' ? this.twigsNeeded() - this.repaired : 0;
    AigleArt.nest(ctx, N.x + shake, N.y, missing, this.t);
    // l'ombre là où elle va se poser
    if (this.act === 'land' && this.landAt) {
      const k = Math.min(1, this.actT / this.landAt.dur);
      ctx.fillStyle = `rgba(40,20,10,${0.12 + 0.2 * k})`;
      ellipsePath(ctx, this.landAt.x, this.landAt.g - 2, 30 + 34 * k, 5 + 3 * k);
      ctx.fill();
    }
    // l'ombre du piqué (le « ! » est dessiné par-dessus Malice, voir drawWarning)
    const m = this.mark;
    if (m && (this.act === 'aim' || this.act === 'dive')) {
      const k = this.act === 'aim' ? Math.min(1, this.actT / m.warn) : 1;
      ctx.fillStyle = `rgba(90,30,0,${0.2 + 0.3 * k})`;
      ellipsePath(ctx, m.x, m.g - 2, 18 + 28 * k, 4 + 3 * k);
      ctx.fill();
    }
    // ce qui est par terre (ou qui roule)
    for (const o of this.things) {
      if (o.st === 'rest' || o.st === 'roll') this.drawThing(ctx, o);
    }
  }

  drawThing(ctx, o) {
    if (o.kind === 'egg') AigleArt.egg(ctx, o.x, o.y, o.rot, this.t + o.i);
    else if (o.kind === 'twig') AigleArt.twig(ctx, o.x, o.y, o.rot, o.st === 'float');
    else if (o.kind === 'note') AigleArt.note(ctx, o.x, o.y, o.i, this.t, o.k);
    else AigleArt.bit(ctx, o.x, o.y, o.rot, this.bitsNeeded(), o.i, this.t);
  }

  drawBody(ctx) {
    if (!this.sitting) this.drawEagle(ctx);
  }

  drawEagle(ctx) {
    AigleArt.eagle(ctx, this.px, this.py, {
      t: this.t, facing: this.facing, wing: this.wing, flap: this.flapV > 0.5 ? Math.sin(this.flapT) : 0, droop: this.droop,
      tilt: this.tilt, mood: this.mood, beak: this.beak, blush: this.blush, puff: this.puff, tears: this.tears,
      legs: this.pose === 'stand' || this.pose === 'land' || this.pose === 'perch' ? 1 : 0, sitting: this.sitting || this.pose === 'rest',
      tongue: this.act === 'rest',
    });
  }

  // par-dessus Malice : le « ! » du piqué, les flèches du rase-mottes, ce qui flotte dans le vent, les notes
  // attrapées, les aiglons et la plume dorée
  drawWarning(ctx) {
    // son cri (« Kiiii ! ») : il la suit, sous elle quand elle vole tout en haut (sinon il passerait sous ses vies), au
    // -dessus de ses ailes levées quand elle est en bas
    const C = this.cry;
    if (C) {
      const A = this.arena;
      const high = this.py < this.groundY - 200;
      const k = Math.min(1, (C.dur - C.t) * 8);
      ctx.save();
      ctx.globalAlpha = Math.min(1, C.t * 4);
      drawOutlinedText(ctx, C.text, clamp(this.px, A.x0 + 90, A.x1 - 90), high ? this.py + 84 : this.py - 128, 20 + 4 * k, '#fff3c8');
      ctx.restore();
    }
    const m = this.mark;
    if (m && this.act === 'aim') AigleArt.alert(ctx, m.x, m.g - 92, this.actT, m.warn);
    const S = this.swoop;
    if (S && this.act === 'swoopWarn') AigleArt.swoopArrows(ctx, this, S, this.actT, this.t);
    const p = this.world.player;
    let got = 0;
    for (const o of this.things) {
      if (o.st === 'float' || o.st === 'fly') this.drawThing(ctx, o);
      if (o.kind === 'note' && o.st === 'got' && !p.dead) {
        // les notes attrapées tournent au-dessus de la tête de Malice
        const a = this.t * 2.4 + got * 2.1;
        AigleArt.note(ctx, p.cx + Math.cos(a) * 24, p.y - 34 + Math.sin(a) * 6, o.i, this.t, 0.5);
        got++;
      }
    }
    if (this.chicks) for (const c of this.chicks) if (c.st !== 'pop' && c.st !== 'home') AigleArt.chick(ctx, c.x, c.y, this.t + c.i, 0, c.st === 'kiss' ? 2 : 1);
    if (this.gift && !this.gift.got) AigleArt.goldFeather(ctx, this.gift.x, this.gift.y, this.gift.rot || 0, 1, this.t);
  }

  // (la vie i est pleine tant que i < life, et c'est la plus à droite qui s'en va : l'œuf, la manche gagnée en premier,
  // est donc tout à droite, et le dessin, la dernière manche, tout à gauche)
  drawLife(ctx, x, y, full, t, i) {
    AigleArt.life(ctx, x, y, full, this.lifeMax - 1 - (i || 0));
  }

  // ---------- Le vol jusqu'au Cœur du Volcan ----------
  // Par-dessus tout l'écran (le monde l'appelle juste avant ses petites particules, voir World.render ; en pixels de
  // l'écran) : le ciel du soir, une mer de nuages roses qui défile, et à droite, la grande roche du volcan avec l'entrée
  // du Cœur du Volcan, une porte pleine de lumière de lave. Maman Aigle traverse l'écran avec Malice sur son dos, de plus
  // en plus petite (elle s'éloigne), et entre dans la porte. Tout reste sous ce qui est écrit en haut de l'écran, et loin
  // des boutons d'une tablette (en bas à gauche et à droite).
  drawScreen(ctx) {
    const F = this.flight;
    if (!F) return;
    const t = F.t;
    const T = MamanAigle.END;
    const fly = T.door - T.fade;
    const p = this.world.player;
    // (on passe d'abord dans un nuage : l'écran devient tout blanc, puis le vol apparaît)
    const cloud = (k) => {
      ctx.fillStyle = `rgba(255,246,240,${clamp(k, 0, 1).toFixed(2)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    };
    const IN = 0.35;
    if (t < IN) {
      cloud(t / IN);
      return;
    }
    ctx.save();
    const glow = t > fly ? Math.max(0, 1 - (t - fly) * 1.2) : 0;
    AigleArt.flightScene(ctx, this.t, glow);
    // elle traverse l'écran : de la gauche, au-dessus des nuages, jusqu'à la porte (une courbe), de plus en plus petite
    const u = clamp((t - IN) / (fly - IN), 0, 1);
    const e = u * u * (3 - 2 * u);
    const D = AigleArt.DOOR;
    const x0 = 170;
    const y0 = 250;
    const cx = 400;
    const cy = 110;
    const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * D.x;
    const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * (D.y + 8) + Math.sin(this.t * 3) * 6 * (1 - e);
    const k = lerp(0.8, 0.16, e);
    // (une traînée d'étincelles derrière elle)
    if (u < 1) {
      F.trail.push({ x: x - 60 * k, y: y + 10 * k, t: this.t });
      if (F.trail.length > 24) F.trail.shift();
    }
    for (const q of F.trail) {
      const a = 1 - (this.t - q.t) / 0.6;
      if (a <= 0) continue;
      ctx.fillStyle = `rgba(255,243,160,${(0.8 * a).toFixed(2)})`;
      circlePath(ctx, q.x - (this.t - q.t) * 40, q.y, 2 + 3 * a);
      ctx.fill();
    }
    if (u < 1) {
      ctx.save();
      // (en entrant dans la porte, elle disparaît dans la lumière)
      ctx.globalAlpha *= clamp((1 - u) / 0.08, 0, 1);
      ctx.translate(x, y);
      ctx.scale(k, k);
      ctx.translate(-this.px, -this.py);
      this.drawEagle(ctx);
      p.draw(ctx);
      ctx.restore();
    }
    // le nom de la porte, quand on s'en approche (en haut, au milieu : sous ce qui est écrit en haut de l'écran)
    if (u > 0.4) {
      const a = clamp((u - 0.4) * 4, 0, 1);
      ctx.globalAlpha = a;
      drawOutlinedText(ctx, 'Le Cœur du Volcan !', 440, 92, 30 + Math.sin(this.t * 4) * 1.2, '#ffe14d');
    }
    ctx.globalAlpha = 1;
    if (t < IN + 0.5) cloud(1 - (t - IN) / 0.5);
    ctx.restore();
  }
}

// la fin, en secondes : elle reconnaît le bébé oiseau (Malice recule d'un bond), pardon, les œufs éclosent, la plume
// dorée, elle se pose à côté de Malice, Malice monte sur son dos, elles s'envolent (ride), l'écran passe au vol au-dessus
// de la mer de nuages (fade), elles entrent dans le Cœur du Volcan (door), et le niveau est fini (end)
MamanAigle.END = { sorry: 3.4, hatch: 6.2, gift: 10.2, climb: 13.2, board: 14.6, ride: 15.3, fade: 16.3, door: 20, end: 20.7 };
const TAU_AIGLE = Math.PI * 2;

// ======================= LES DESSINS =======================
const AigleArt = (() => {
  const TAU = Math.PI * 2;
  // les couleurs de Maman Aigle
  const C = {
    dark: '#5a3418', mid: '#8a5a2e', light: '#b8803e', belly: '#f2dcb0', bellyLine: '#cfa874',
    head: '#fffaf0', headLine: '#c9bba4', beak: '#ffb627', beakDark: '#d8841a', leg: '#f4b42a', scarf: '#ff7ab0',
  };
  // les trois notes : do (rouge), ré (jaune), mi (bleu)
  const NOTE = ['#ff6a6a', '#ffc83a', '#5ab8ff'];

  function sprite(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'));
    return c;
  }

  // ---------- Maman Aigle ----------
  // Une aile (vue de côté), de l'épaule (à gauche) jusqu'au bout des plumes (à droite), en cache (far : celle de
  // derrière, plus sombre).
  const wingImg = {};
  function wingSprite(far) {
    const key = far ? 'far' : 'near';
    if (wingImg[key]) return wingImg[key];
    wingImg[key] = sprite(160, 90, (g) => {
      g.translate(10, 40);
      // les grandes plumes du bout, en éventail
      for (let i = 0; i < 6; i++) {
        const a = -0.38 + i * 0.16;
        g.save();
        g.rotate(a);
        g.fillStyle = i % 2 ? C.dark : '#6a4020';
        ellipsePath(g, 92, 6, 48, 9);
        g.fill();
        g.strokeStyle = '#3a200c';
        g.lineWidth = 1.5;
        g.stroke();
        g.restore();
      }
      // le haut de l'aile
      g.fillStyle = C.mid;
      g.beginPath();
      g.moveTo(-6, -14);
      g.quadraticCurveTo(50, -28, 96, -4);
      g.quadraticCurveTo(70, 26, 0, 20);
      g.closePath();
      g.fill();
      g.strokeStyle = '#3a200c';
      g.lineWidth = 2;
      g.stroke();
      // les rangées de petites plumes
      g.fillStyle = C.light;
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < 5; i++) {
          ellipsePath(g, 12 + i * 15 + r * 8, -6 + r * 12, 9, 6);
          g.fill();
        }
      }
      g.strokeStyle = 'rgba(58,32,12,0.45)';
      g.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.arc(10 + i * 15, 8, 8, 0.2, Math.PI - 0.2);
        g.stroke();
      }
      // (celle de derrière : dans l'ombre du corps)
      if (far) {
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = 'rgba(30,10,0,0.3)';
        g.fillRect(-10, -40, 160, 90);
      }
    });
    return wingImg[key];
  }

  // Son corps (le ventre clair, la queue), en cache : il ne change jamais.
  let bodyImg = null;
  function bodySprite() {
    if (bodyImg) return bodyImg;
    bodyImg = sprite(170, 130, (g) => {
      g.translate(95, 62);
      // la queue : un éventail de plumes brunes au bout blanc
      for (let i = 0; i < 5; i++) {
        g.save();
        g.translate(-40, 16);
        g.rotate(Math.PI - 0.55 + i * 0.16);
        g.fillStyle = C.mid;
        ellipsePath(g, 30, 0, 32, 9);
        g.fill();
        g.strokeStyle = '#3a200c';
        g.lineWidth = 1.5;
        g.stroke();
        g.fillStyle = '#f4ead8';
        ellipsePath(g, 52, 0, 9, 6);
        g.fill();
        g.restore();
      }
      // le corps
      const gr = g.createRadialGradient(-6, -10, 6, 0, 6, 52);
      gr.addColorStop(0, C.light);
      gr.addColorStop(0.6, C.mid);
      gr.addColorStop(1, C.dark);
      g.fillStyle = gr;
      ellipsePath(g, 0, 6, 47, 38);
      g.fill();
      g.strokeStyle = '#3a200c';
      g.lineWidth = 2.5;
      g.stroke();
      // le ventre clair, avec des petites plumes
      g.fillStyle = C.belly;
      ellipsePath(g, 12, 14, 30, 26);
      g.fill();
      g.strokeStyle = C.bellyLine;
      g.lineWidth = 1.4;
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.arc(0 + i * 12 + (r % 2) * 6, 2 + r * 11, 5, 0.3, Math.PI - 0.3);
          g.stroke();
        }
      }
    });
    return bodyImg;
  }

  // une aile, posée à l'épaule (x, y) ; k : 0 repliée le long du dos, 1 levée bien haut ; droop : tombante (fatiguée)
  function drawWing(ctx, x, y, k, droop, far) {
    const a = lerp(-(Math.PI + 0.32), -Math.PI / 2 - 0.35, clamp(k, -0.2, 1.25)) - droop * 0.22;
    const s = (lerp(0.62, 1, clamp(k * 1.4, 0, 1)) + droop * 0.25) * 0.86;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(s, far ? 0.85 : 1);
    ctx.drawImage(wingSprite(far), -10, -40);
    ctx.restore();
  }

  // Maman Aigle, son milieu en (x, y). o : facing, wing, flap, droop, tilt, mood, beak, blush, puff, tears, legs,
  // sitting, tongue
  function eagle(ctx, x, y, o) {
    const f = o.facing || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f, 1);
    ctx.rotate(o.tilt || 0);
    const wk = (o.wing || 0) + (o.flap || 0) * 0.42;
    // l'aile de derrière
    drawWing(ctx, 2, -14, wk + 0.12, o.droop || 0, true);
    // les pattes
    if (o.legs) legs(ctx, o.sitting);
    else tucked(ctx);
    // le corps (ébouriffé quand elle a eu peur)
    const pf = 1 + (o.puff || 0) * 0.08;
    ctx.save();
    ctx.scale(pf, pf);
    ctx.drawImage(bodySprite(), -95, -62);
    ctx.restore();
    // le foulard rose à pois
    scarf(ctx, o.t);
    // la tête
    head(ctx, o);
    // l'aile de devant
    drawWing(ctx, -6, -8, wk, o.droop || 0, false);
    ctx.restore();
  }

  function legs(ctx, sitting) {
    const len = sitting ? 8 : 22;
    ctx.strokeStyle = C.leg;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    for (const lx of [-6, 16]) {
      ctx.beginPath();
      ctx.moveTo(lx, 30);
      ctx.lineTo(lx, 30 + len);
      ctx.stroke();
      // les doigts
      ctx.lineWidth = 4;
      for (const d of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.moveTo(lx, 30 + len);
        ctx.lineTo(lx + d + 3, 34 + len);
        ctx.stroke();
      }
      ctx.lineWidth = 7;
    }
  }

  function tucked(ctx) {
    ctx.fillStyle = C.leg;
    ellipsePath(ctx, -14, 38, 9, 5, 0.3);
    ctx.fill();
    ellipsePath(ctx, 2, 40, 9, 5, 0.3);
    ctx.fill();
  }

  function scarf(ctx, t) {
    ctx.fillStyle = C.scarf;
    ctx.beginPath();
    ctx.moveTo(14, -30);
    ctx.quadraticCurveTo(34, -18, 52, -30);
    ctx.lineTo(50, -20);
    ctx.quadraticCurveTo(34, -6, 16, -20);
    ctx.closePath();
    ctx.fill();
    // le bout du nœud, qui flotte un peu
    ctx.beginPath();
    ctx.moveTo(18, -22);
    ctx.lineTo(4 + Math.sin(t * 5) * 2, -10);
    ctx.lineTo(14, -6 + Math.sin(t * 5 + 1) * 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c8407a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy] of [[24, -22], [36, -18], [46, -24], [10, -12]]) {
      circlePath(ctx, dx, dy, 1.8);
      ctx.fill();
    }
  }

  function head(ctx, o) {
    const hx = 40;
    const hy = -40;
    // la petite houppette
    ctx.fillStyle = C.head;
    ctx.strokeStyle = C.headLine;
    ctx.lineWidth = 2;
    for (const [a, l] of [[-2.4, 18], [-2.1, 22], [-2.7, 15]]) {
      ctx.beginPath();
      ellipsePath(ctx, hx + Math.cos(a) * 20, hy + Math.sin(a) * 20, l * 0.55, 5, a);
      ctx.fill();
      ctx.stroke();
    }
    circlePath(ctx, hx, hy, 25);
    ctx.fill();
    ctx.stroke();
    // les joues roses
    if (o.blush > 0.05) {
      ctx.fillStyle = `rgba(255,120,160,${0.45 * o.blush})`;
      ellipsePath(ctx, hx + 8, hy + 10, 7, 4);
      ctx.fill();
    }
    beak(ctx, hx, hy, o);
    eyes(ctx, hx, hy, o);
  }

  function beak(ctx, hx, hy, o) {
    const open = clamp(o.beak || 0, 0, 1) * 8;
    // le bas du bec
    ctx.fillStyle = C.beakDark;
    ctx.beginPath();
    ctx.moveTo(hx + 16, hy + 4);
    ctx.quadraticCurveTo(hx + 30, hy + 6 + open, hx + 38, hy + 4 + open * 0.8);
    ctx.lineTo(hx + 18, hy + 10 + open * 0.5);
    ctx.closePath();
    ctx.fill();
    if (o.tongue && open > 3) {
      ctx.fillStyle = '#ff7a9a';
      ellipsePath(ctx, hx + 30, hy + 8 + open * 0.8, 6, 3);
      ctx.fill();
    }
    // le haut du bec, crochu
    ctx.fillStyle = C.beak;
    ctx.strokeStyle = '#a0600a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx + 14, hy - 8);
    ctx.quadraticCurveTo(hx + 36, hy - 12, hx + 44, hy + 2);
    ctx.quadraticCurveTo(hx + 46, hy + 10, hx + 40, hy + 10);
    ctx.quadraticCurveTo(hx + 38, hy + 4, hx + 32, hy + 3);
    ctx.lineTo(hx + 15, hy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a0600a';
    circlePath(ctx, hx + 24, hy - 4, 1.4);
    ctx.fill();
  }

  function eyes(ctx, hx, hy, o) {
    const ex = hx + 6;
    const ey = hy - 6;
    const m = o.mood || 'open';
    ctx.lineCap = 'round';
    if (m === 'sleep') {
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
      lashes(ctx, ex, ey + 4, 1);
      return;
    }
    if (m === 'happy') {
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(ex, ey + 3, 6, Math.PI + 0.3, -0.3);
      ctx.stroke();
      lashes(ctx, ex, ey - 2, -1);
      return;
    }
    if (m === 'heart') {
      ctx.fillStyle = '#ff5a8a';
      ctx.save();
      ctx.translate(ex, ey);
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-9, -2, -5, -9, 0, -4);
      ctx.bezierCurveTo(5, -9, 9, -2, 0, 5);
      ctx.fill();
      ctx.restore();
      tearDrops(ctx, ex, ey, o);
      return;
    }
    const big = m === 'surprised' || m === 'wide' ? 1.25 : 1;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1.8;
    ellipsePath(ctx, ex, ey, 7 * big, 8 * big);
    ctx.fill();
    ctx.stroke();
    const pr = m === 'surprised' ? 2.6 : 4.4;
    ctx.fillStyle = '#c8801a';
    circlePath(ctx, ex + 2, ey + 1, pr + 1.4);
    ctx.fill();
    ctx.fillStyle = '#2a1a0a';
    circlePath(ctx, ex + 2.5, ey + 1, pr);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circlePath(ctx, ex + 3.6, ey - 1.4, 1.5);
    ctx.fill();
    // les paupières (fatiguée : à moitié fermées)
    if (m === 'tired') {
      ctx.fillStyle = C.head;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 8, 9, 0, Math.PI, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - 8, ey);
      ctx.lineTo(ex + 8, ey);
      ctx.stroke();
    }
    lashes(ctx, ex, ey - 7 * big, -1);
    // les sourcils : fâchée (vers le bec), inquiète (vers le haut)
    if (m === 'angry' || m === 'worried') {
      ctx.strokeStyle = '#6a5040';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (m === 'angry') {
        ctx.moveTo(ex - 8, ey - 14);
        ctx.lineTo(ex + 8, ey - 9);
      } else {
        ctx.moveTo(ex - 8, ey - 10);
        ctx.lineTo(ex + 7, ey - 15);
      }
      ctx.stroke();
    }
    tearDrops(ctx, ex, ey, o);
  }

  function lashes(ctx, ex, ey, dir) {
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = -0.5 - k * 0.45;
      const ax = ex - 2 + Math.cos(a) * 6;
      const ay = ey + dir * 0 + Math.sin(a) * 2;
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + Math.cos(a) * 4, ay + dir * -Math.abs(Math.sin(a)) * 4);
    }
    ctx.stroke();
  }

  function tearDrops(ctx, ex, ey, o) {
    if (!(o.tears > 0.05)) return;
    const k = (o.t * 1.2) % 1;
    ctx.fillStyle = `rgba(140,210,255,${0.9 * o.tears})`;
    ellipsePath(ctx, ex - 4, ey + 9 + k * 14, 2.4, 3.4);
    ctx.fill();
  }

  // ---------- Le nid (missing : les brindilles qui manquent, emportées par le vent) ----------
  function nest(ctx, x, y, missing, t) {
    Scenery.eagleNest(ctx, x, y);
    if (missing <= 0) return;
    // des trous dans le bord du nid, et des brindilles qui dépassent tout de travers
    for (let i = 0; i < missing; i++) {
      const dx = -96 + (i * 197) % 190;
      const dy = -40 + (i % 3) * 8;
      ctx.fillStyle = 'rgba(40,20,8,0.75)';
      ellipsePath(ctx, x + dx, y + dy, 12, 6, 0.2 * i);
      ctx.fill();
      ctx.strokeStyle = '#8a5a2a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + dx - 6, y + dy);
      ctx.lineTo(x + dx + 10 + Math.sin(t * 3 + i) * 2, y + dy - 22);
      ctx.stroke();
    }
  }

  // ---------- Les œufs ----------
  // un œuf (son milieu en x, y), crème avec des taches brunes
  function egg(ctx, x, y, rot, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 18);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#ead8b8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.bezierCurveTo(11, -17, 14, 2, 13, 7);
    ctx.bezierCurveTo(12, 14, 6, 15, 0, 15);
    ctx.bezierCurveTo(-6, 15, -12, 14, -13, 7);
    ctx.bezierCurveTo(-14, 2, -11, -17, 0, -17);
    ctx.fill();
    ctx.strokeStyle = '#a88a60';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#b07a4a';
    for (const [dx, dy, r] of [[-4, -6, 2.2], [5, -1, 1.6], [-2, 6, 1.8], [6, 8, 1.3], [1, -11, 1.2]]) {
      circlePath(ctx, dx, dy, r);
      ctx.fill();
    }
    ctx.restore();
  }

  // dans les mains de Malice (ses coordonnées : les pieds en 0, 0)
  function heldEgg(ctx) {
    ctx.save();
    ctx.translate(15, -28);
    ctx.scale(0.8, 0.8);
    egg(ctx, 0, 0, 0, 0);
    ctx.restore();
  }

  // la coquille vide, après l'éclosion
  function shell(ctx, x, y) {
    ctx.fillStyle = '#fbf3e0';
    ctx.strokeStyle = '#a88a60';
    ctx.lineWidth = 1.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-13, 2);
    ctx.lineTo(-9, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(1, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(13, 2);
    ctx.bezierCurveTo(12, 12, -12, 12, -13, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Les brindilles ----------
  function twigShape(ctx) {
    ctx.strokeStyle = '#6a3e1a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-22, 4);
    ctx.lineTo(22, -4);
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -12);
    ctx.moveTo(-10, 2);
    ctx.lineTo(-16, 10);
    ctx.stroke();
    ctx.strokeStyle = '#a8703a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-20, 3);
    ctx.lineTo(20, -5);
    ctx.stroke();
    // une petite feuille
    ctx.fillStyle = '#8ac24a';
    ellipsePath(ctx, 10, -14, 5, 3, -0.6);
    ctx.fill();
  }

  function twig(ctx, x, y, rot, windy) {
    ctx.save();
    ctx.translate(x, y);
    if (windy) wind(ctx, 0, 0);
    ctx.rotate(rot || 0);
    twigShape(ctx);
    ctx.restore();
  }

  // un petit souffle de vent autour de ce qui flotte (pour qu'on voie que le vent le tient)
  function wind(ctx, x, y) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const k = (performance.now() / 600) % 1;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(x - 6 + i * 12, y + 10 - i * 22, 16, Math.PI * (0.1 + k * 0.4), Math.PI * (0.7 + k * 0.4));
      ctx.stroke();
    }
  }

  // la botte de brindilles dans les bras de Malice (n : combien)
  function heldTwigs(ctx, n) {
    ctx.save();
    ctx.translate(14, -28);
    for (let i = 0; i < Math.min(n, 6); i++) {
      ctx.save();
      ctx.rotate(-0.5 + i * 0.2);
      ctx.scale(0.7, 0.7);
      twigShape(ctx);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- Les notes de musique ----------
  function note(ctx, x, y, i, t, k) {
    if (k <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= Math.min(1, k * 1.5);
    const s = 0.6 + 0.4 * Math.min(1, k);
    ctx.scale(s, s);
    // une lueur
    ctx.fillStyle = 'rgba(255,255,220,0.35)';
    circlePath(ctx, 0, 0, 26 + Math.sin(t * 5 + i) * 3);
    ctx.fill();
    ctx.rotate(Math.sin(t * 3 + i) * 0.2);
    ctx.fillStyle = NOTE[i];
    ctx.strokeStyle = '#3a2040';
    ctx.lineWidth = 2.5;
    ellipsePath(ctx, -6, 10, 10, 7, -0.4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(3, -20);
    ctx.quadraticCurveTo(16, -14, 14, -2);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = NOTE[i];
    ctx.beginPath();
    ctx.moveTo(3, 6);
    ctx.lineTo(3, -18);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    circlePath(ctx, -9, 7, 2.4);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Le dessin du bébé oiseau ----------
  // Le dessin de Malice, en cache : le bébé oiseau violet sur son rocher, au milieu de la lave, aux crayons de couleur.
  let paperImg = null;
  const PW = 96;
  const PH = 72;
  function paper() {
    if (paperImg) return paperImg;
    paperImg = sprite(PW, PH, (g) => {
      g.fillStyle = '#fffbe8';
      g.fillRect(0, 0, PW, PH);
      // la lave et le rocher
      g.fillStyle = '#ff8a3a';
      g.fillRect(4, 52, PW - 8, 16);
      g.fillStyle = '#ffd04a';
      for (let i = 0; i < 6; i++) g.fillRect(8 + i * 15, 56 + (i % 2) * 4, 8, 3);
      g.fillStyle = '#8a7a74';
      g.beginPath();
      g.moveTo(26, 58);
      g.lineTo(34, 40);
      g.lineTo(62, 38);
      g.lineTo(70, 58);
      g.closePath();
      g.fill();
      // le bébé oiseau (violet, comme dans le jeu)
      g.fillStyle = '#6c5cf0';
      circlePath(g, 48, 28, 13);
      g.fill();
      g.fillStyle = '#ffffff';
      ellipsePath(g, 48, 32, 8, 7);
      g.fill();
      g.fillStyle = '#1a1a1a';
      circlePath(g, 43, 25, 2.2);
      g.fill();
      circlePath(g, 53, 25, 2.2);
      g.fill();
      g.fillStyle = '#ffb627';
      g.beginPath();
      g.moveTo(45, 29);
      g.lineTo(51, 29);
      g.lineTo(48, 34);
      g.closePath();
      g.fill();
      g.strokeStyle = '#5a49e0';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(47, 15);
      g.quadraticCurveTo(44, 8, 47, 6);
      g.stroke();
      // un cœur, et le soleil (c'est Malice qui l'a dessiné)
      g.fillStyle = '#ff5a8a';
      g.beginPath();
      g.moveTo(80, 18);
      g.bezierCurveTo(72, 12, 76, 5, 80, 10);
      g.bezierCurveTo(84, 5, 88, 12, 80, 18);
      g.fill();
      g.fillStyle = '#ffd84a';
      circlePath(g, 14, 14, 7);
      g.fill();
      g.strokeStyle = '#ffd84a';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        g.beginPath();
        g.moveTo(14 + Math.cos(a) * 9, 14 + Math.sin(a) * 9);
        g.lineTo(14 + Math.cos(a) * 13, 14 + Math.sin(a) * 13);
        g.stroke();
      }
      g.strokeStyle = '#d8c8a0';
      g.lineWidth = 2;
      g.strokeRect(1, 1, PW - 2, PH - 2);
    });
    return paperImg;
  }

  // le découpage : 2 morceaux (2 × 1), 3 (3 × 1), 4 (2 × 2), 6 (3 × 2)
  function grid(n) {
    if (n <= 2) return [2, 1];
    if (n === 3) return [3, 1];
    if (n === 4) return [2, 2];
    return [3, 2];
  }

  function piece(ctx, n, i, x, y, s) {
    const [cols, rows] = grid(n);
    const cw = PW / cols;
    const ch = PH / rows;
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    ctx.drawImage(paper(), cx, cy, cw, ch, x + cx * s - (PW * s) / 2, y + cy * s - (PH * s) / 2, cw * s, ch * s);
  }

  // un morceau qui traîne par terre, ou qui flotte dans le vent
  function bit(ctx, x, y, rot, n, i, t) {
    const [cols, rows] = grid(n);
    const cw = PW / cols;
    const ch = PH / rows;
    ctx.save();
    ctx.translate(x, y);
    // (il brille un peu : on le voit bien)
    ctx.fillStyle = `rgba(255,255,200,${0.3 + Math.sin(t * 5 + i) * 0.12})`;
    circlePath(ctx, 0, 0, 26);
    ctx.fill();
    ctx.rotate(rot || 0);
    const s = 0.9;
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect((-cw * s) / 2 + 2, (-ch * s) / 2 + 3, cw * s, ch * s);
    ctx.drawImage(paper(), cx, cy, cw, ch, (-cw * s) / 2, (-ch * s) / 2, cw * s, ch * s);
    ctx.strokeStyle = '#c8b890';
    ctx.lineWidth = 1;
    ctx.strokeRect((-cw * s) / 2, (-ch * s) / 2, cw * s, ch * s);
    ctx.restore();
  }

  // le dessin dans les mains de Malice : les morceaux déjà trouvés (got), les autres en pointillés ; show : elle le
  // montre bien haut, en grand
  function heldDrawing(ctx, n, got, t, show) {
    const s = show ? 0.62 : 0.42;
    const x = show ? 10 : 14;
    const y = show ? -54 : -30;
    const [cols, rows] = grid(n);
    ctx.save();
    if (show) {
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 3) * 0.05);
      ctx.translate(-x, -y);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - (PW * s) / 2, y - (PH * s) / 2, PW * s, PH * s);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(120,90,60,0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - (PW * s) / 2, y - (PH * s) / 2, PW * s, PH * s);
    ctx.setLineDash([]);
    for (const i of got) piece(ctx, n, i, x, y, s);
    if (cols * rows > 1 && !show) {
      ctx.strokeStyle = 'rgba(200,180,140,0.9)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x - (PW * s) / 2, y - (PH * s) / 2, PW * s, PH * s);
    }
    ctx.restore();
  }

  // ---------- Les aiglons ----------
  // Un aiglon tout duveteux (pop : il sort de sa coquille, avec un bout de coquille sur la tête ; kiss : il fait un
  // bisou, le bec en avant)
  function chick(ctx, x, y, t, pop, mode) {
    ctx.save();
    ctx.translate(x, y);
    const flap = mode === 1 && !pop ? Math.sin(t * 30) * 0.6 : 0;
    // les petites ailes
    ctx.fillStyle = '#e8dcc8';
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 11, 2);
      ctx.rotate(s * (0.4 + flap));
      ellipsePath(ctx, s * 5, 0, 7, 4);
      ctx.fill();
      ctx.restore();
    }
    // le duvet
    ctx.fillStyle = '#fbf6ec';
    ctx.strokeStyle = '#cfc2a8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const r = 13 + (i % 2) * 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // les yeux et le gros bec jaune
    ctx.fillStyle = '#1a1a1a';
    circlePath(ctx, -4, -3, 2.2);
    ctx.fill();
    circlePath(ctx, 5, -3, 2.2);
    ctx.fill();
    ctx.fillStyle = '#ffb627';
    ctx.beginPath();
    if (mode === 2) {
      ctx.moveTo(-1, 1);
      ctx.lineTo(10, 3);
      ctx.lineTo(-1, 7);
    } else {
      ctx.moveTo(-3, 1);
      ctx.lineTo(5, 1);
      ctx.lineTo(1, 8);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,130,160,0.5)';
    circlePath(ctx, -8, 3, 2.5);
    ctx.fill();
    circlePath(ctx, 9, 3, 2.5);
    ctx.fill();
    if (pop) {
      // un bout de coquille sur la tête
      ctx.fillStyle = '#fbf3e0';
      ctx.strokeStyle = '#a88a60';
      ctx.beginPath();
      ctx.moveTo(-9, -10);
      ctx.lineTo(-5, -16);
      ctx.lineTo(-1, -12);
      ctx.lineTo(3, -17);
      ctx.lineTo(8, -10);
      ctx.quadraticCurveTo(0, -20, -9, -10);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- La plume dorée ----------
  function goldFeather(ctx, x, y, rot, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s, s);
    const g = ctx.createLinearGradient(-8, -26, 8, 26);
    g.addColorStop(0, '#fff6b0');
    g.addColorStop(0.5, '#ffd23a');
    g.addColorStop(1, '#d89a10');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#a06a08';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(13, -16, 12, 10, 1, 22);
    ctx.bezierCurveTo(-11, 10, -12, -16, 0, -28);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#b87a10';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(1, 30);
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(0.3, -14 + i * 8);
      ctx.lineTo(8, -18 + i * 8);
      ctx.moveTo(0.3, -12 + i * 8);
      ctx.lineTo(-7, -16 + i * 8);
    }
    ctx.stroke();
    // elle scintille
    const k = (Math.sin(t * 6) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * k})`;
    ctx.translate(5, -12);
    Art.starShape(ctx, 4 + k * 3, 0.35);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Les avertissements ----------
  // le « ! » au-dessus de l'ombre du piqué (assez gros pour un petit téléphone ; il palpite, puis il clignote vite
  // pendant les 0,3 dernières secondes)
  function alert(ctx, x, y, t, warn) {
    if (t > warn - 0.3 && Math.floor(t * 16) % 2 !== 0) return;
    const s = 1.4 * (1 + Math.sin(t * 9) * 0.06);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#ffe94a';
    ctx.strokeStyle = '#7a2a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(15, 11);
    ctx.lineTo(-15, 11);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = '#7a2a00';
    ctx.font = '700 17px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 3);
    ctx.restore();
  }

  // les flèches du rase-mottes : par terre, là où elle va passer, qui avancent dans son sens
  function swoopArrows(ctx, B, S, t, time) {
    const k = Math.min(1, t / S.warn);
    const A = B.arena;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.5 * k;
    ctx.fillStyle = '#fff3c8';
    ctx.strokeStyle = '#7a2a00';
    ctx.lineWidth = 2;
    const step = 120;
    const off = ((time * 160) % step) * S.dir;
    for (let x = A.x0 + 40; x < A.x1 - 20; x += step) {
      const ax = x + off;
      if (ax < A.x0 + 10 || ax > A.x1 - 10) continue;
      const g = B.groundAt(ax) - 26;
      ctx.save();
      ctx.translate(ax, g);
      ctx.scale(S.dir, 1);
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(4, -6);
      ctx.lineTo(4, -12);
      ctx.lineTo(16, 0);
      ctx.lineTo(4, 12);
      ctx.lineTo(4, 6);
      ctx.lineTo(-14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    alert(ctx, B.px + S.dir * 70, B.py - 60, t, S.warn);
  }

  // ---------- Le mur de fumée, à gauche de l'arène ----------
  function smokeWall(ctx, x, top, bottom, k, t) {
    ctx.save();
    ctx.globalAlpha = k;
    const h = bottom - top;
    for (let i = 0; i < 9; i++) {
      const y = bottom - ((i * 64 + t * 40) % h);
      const r = 30 + (i % 3) * 8;
      ctx.fillStyle = i % 2 ? 'rgba(90,80,90,0.75)' : 'rgba(120,108,116,0.7)';
      circlePath(ctx, x - 6 + Math.sin(t * 1.3 + i) * 6, y, r);
      ctx.fill();
    }
    // des braises
    ctx.fillStyle = '#ffb040';
    for (let i = 0; i < 5; i++) {
      const y = bottom - ((i * 97 + t * 90) % h);
      circlePath(ctx, x + Math.sin(t * 3 + i * 2) * 14, y, 2.5);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Ses vies, en haut de l'écran : un œuf, une plume, une brindille, une note, le dessin ----------
  function life(ctx, x, y, full, i) {
    ctx.save();
    ctx.translate(x, y);
    if (full) {
      // (un petit rond clair derrière : la plume brune et la brindille se voient bien sur le fond violet)
      ctx.fillStyle = 'rgba(255,240,215,0.38)';
      circlePath(ctx, 0, 0, 19);
      ctx.fill();
    } else ctx.globalAlpha *= 0.3;
    switch (i) {
      case 0: ctx.scale(0.9, 0.9); egg(ctx, 0, 0, 0, 0); break;
      case 1: {
        // une plume brune
        ctx.rotate(0.5);
        ctx.fillStyle = C.mid;
        ctx.strokeStyle = '#3a200c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.bezierCurveTo(10, -8, 9, 8, 0, 16);
        ctx.bezierCurveTo(-9, 8, -10, -8, 0, -18);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#f4ead8';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 22);
        ctx.stroke();
        break;
      }
      case 2: ctx.rotate(-0.6); ctx.scale(0.85, 0.85); twigShape(ctx); break;
      case 3: ctx.scale(0.62, 0.62); note(ctx, 0, 0, 0, 0, 1); break;
      default:
        ctx.rotate(-0.08);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(-15, -10, 32, 24);
        ctx.drawImage(paper(), -16, -12, 32, 24);
        break;
    }
    ctx.restore();
  }

  // ---------- Le vol jusqu'au Cœur du Volcan (à la fin, par-dessus tout l'écran) ----------
  // DOOR : l'entrée du Cœur du Volcan, en pixels de l'écran (son milieu, sa largeur, sa hauteur) : à droite, mais sous
  // les petits boutons du haut et au-dessus des boutons d'une tablette.
  const DOOR = { x: 620, y: 140, w: 96, h: 116 };
  let flightBg = null;

  // le décor qui ne bouge pas (en cache) : le ciel du soir, des sommets lointains, et la grande roche du volcan, à
  // droite, avec ses coulées de lave
  function flightBackground() {
    if (flightBg) return flightBg;
    flightBg = sprite(VIEW_W, VIEW_H, (g) => {
      const sky = g.createLinearGradient(0, 0, 0, VIEW_H);
      sky.addColorStop(0, '#4a2242');
      sky.addColorStop(0.4, '#b44c36');
      sky.addColorStop(0.68, '#ff9a5a');
      sky.addColorStop(1, '#ffd09a');
      g.fillStyle = sky;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      // un grand soleil couchant, tout au fond
      g.fillStyle = 'rgba(255,230,170,0.55)';
      circlePath(g, 250, 330, 70);
      g.fill();
      // des sommets lointains qui percent la mer de nuages
      g.fillStyle = '#a8647a';
      for (const [x, h, w] of [[90, 120, 150], [300, 80, 120], [440, 140, 170]]) {
        g.beginPath();
        g.moveTo(x - w, 400);
        g.lineTo(x - 18, 400 - h);
        g.quadraticCurveTo(x, 400 - h - 8, x + 18, 400 - h);
        g.lineTo(x + w, 400);
        g.closePath();
        g.fill();
      }
      // la grande roche du volcan (son sommet fume, tout en haut à droite)
      const rock = g.createLinearGradient(520, 0, 960, 0);
      rock.addColorStop(0, '#6a3242');
      rock.addColorStop(1, '#3e1c2a');
      g.fillStyle = rock;
      g.beginPath();
      g.moveTo(400, 430);
      g.bezierCurveTo(465, 330, 505, 250, 525, 160);
      g.bezierCurveTo(540, 90, 565, 40, 605, 0);
      g.lineTo(VIEW_W, 0);
      g.lineTo(VIEW_W, 430);
      g.closePath();
      g.fill();
      // des couches de roche
      g.strokeStyle = 'rgba(30,10,20,0.35)';
      g.lineWidth = 3;
      for (const y of [60, 250, 330]) {
        g.beginPath();
        g.moveTo(600 + (y < 100 ? 20 : -60), y);
        g.quadraticCurveTo(780, y + 22, VIEW_W, y - 6);
        g.stroke();
      }
      // des coulées de lave qui descendent la roche
      g.lineCap = 'round';
      for (const [x, y] of [[800, 0], [900, 30]]) {
        g.strokeStyle = 'rgba(255,110,30,0.85)';
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(x - 20, y + 120, x + 30, y + 220, x - 10, 430);
        g.stroke();
        g.strokeStyle = 'rgba(255,220,110,0.8)';
        g.lineWidth = 2.5;
        g.stroke();
      }
      // le cadre de la porte : de grosses pierres en arc
      const D = DOOR;
      const r = D.w / 2;
      const top = D.y - D.h / 2 + r;
      g.fillStyle = '#2a0e18';
      g.beginPath();
      g.moveTo(D.x - r - 16, D.y + D.h / 2 + 6);
      g.lineTo(D.x - r - 16, top);
      g.arc(D.x, top, r + 16, Math.PI, 0);
      g.lineTo(D.x + r + 16, D.y + D.h / 2 + 6);
      g.closePath();
      g.fill();
      for (let i = 0; i <= 10; i++) {
        const k = i / 10;
        let sx;
        let sy;
        let a;
        if (k < 0.3) {
          sx = D.x - r - 8;
          sy = D.y + D.h / 2 - (k / 0.3) * (D.y + D.h / 2 - top);
          a = 0;
        } else if (k > 0.7) {
          sx = D.x + r + 8;
          sy = top + ((k - 0.7) / 0.3) * (D.y + D.h / 2 - top);
          a = 0;
        } else {
          a = Math.PI + ((k - 0.3) / 0.4) * Math.PI;
          sx = D.x + Math.cos(a) * (r + 8);
          sy = top + Math.sin(a) * (r + 8);
          a += Math.PI / 2;
        }
        g.save();
        g.translate(sx, sy);
        g.rotate(a);
        g.fillStyle = i % 2 ? '#9a7466' : '#b08a78';
        g.strokeStyle = '#3a1a22';
        g.lineWidth = 2;
        roundRectPath(g, -10, -8, 20, 16, 5);
        g.fill();
        g.stroke();
        g.restore();
      }
    });
    return flightBg;
  }

  // la scène du vol (sans Maman Aigle) ; glow : l'éclat de la porte quand elle vient d'y entrer (de 1 à 0)
  function flightScene(ctx, t, glow) {
    ctx.drawImage(flightBackground(), 0, 0, VIEW_W, VIEW_H);
    const D = DOOR;
    const r = D.w / 2;
    const top = D.y - D.h / 2 + r;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    // la fumée du sommet
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.1 + i / 6) % 1;
      ctx.fillStyle = `rgba(110,84,96,${(0.5 * (1 - ph)).toFixed(2)})`;
      circlePath(ctx, 790 + Math.sin(i * 2.3 + t * 0.5) * 16 + ph * 60, 10 - ph * 80, 30 + ph * 50);
      ctx.fill();
    }
    // la lumière de lave qui sort de la porte
    const halo = ctx.createRadialGradient(D.x, D.y, 10, D.x, D.y, 150 + glow * 120);
    halo.addColorStop(0, `rgba(255,190,80,${(0.55 + 0.15 * pulse + glow * 0.4).toFixed(2)})`);
    halo.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = halo;
    circlePath(ctx, D.x, D.y, 150 + glow * 120);
    ctx.fill();
    // le dedans de la porte : tout brillant de lave
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(D.x - r, D.y + D.h / 2);
    ctx.lineTo(D.x - r, top);
    ctx.arc(D.x, top, r, Math.PI, 0);
    ctx.lineTo(D.x + r, D.y + D.h / 2);
    ctx.closePath();
    const inside = ctx.createRadialGradient(D.x, D.y + 20, 6, D.x, D.y + 10, D.h * 0.75);
    inside.addColorStop(0, '#fffbe0');
    inside.addColorStop(0.35 - 0.1 * pulse, '#ffd060');
    inside.addColorStop(0.75, '#ff7a20');
    inside.addColorStop(1, '#b8301a');
    ctx.fillStyle = inside;
    ctx.fill();
    ctx.clip();
    // (des bulles de lave qui montent, au fond)
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.6 + i / 5) % 1;
      ctx.fillStyle = `rgba(255,250,200,${(0.7 * (1 - ph)).toFixed(2)})`;
      circlePath(ctx, D.x - 30 + i * 15 + Math.sin(t * 2 + i) * 4, D.y + D.h / 2 - ph * D.h, 3 + 2 * (1 - ph));
      ctx.fill();
    }
    if (glow > 0) {
      ctx.fillStyle = `rgba(255,255,230,${(glow * 0.8).toFixed(2)})`;
      ctx.fillRect(D.x - r, D.y - D.h / 2, D.w, D.h);
    }
    ctx.restore();
    // un filet de lave qui coule du seuil
    ctx.strokeStyle = `rgba(255,${150 + Math.floor(50 * pulse)},50,0.9)`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(D.x - 10, D.y + D.h / 2 + 4);
    ctx.bezierCurveTo(D.x - 20, D.y + D.h / 2 + 60, D.x + 10, D.y + D.h / 2 + 110, D.x - 6, 400);
    ctx.stroke();
    // la mer de nuages roses, qui défile (on vole vers la droite) : deux rangées
    for (const [y, sp, c1, c2, n] of [[388, 26, '#f6c2b4', '#e4a29c', 10], [440, 48, '#ffd8c8', '#eeaaa2', 9]]) {
      ctx.fillStyle = c2;
      ctx.fillRect(0, y + 30, VIEW_W, VIEW_H - y - 30);
      for (let i = 0; i < n; i++) {
        const w = 1200 / n;
        const x = (((i * w - t * sp) % 1200) + 1200) % 1200 - 120;
        const h = hash(i * 3.7 + y);
        ctx.fillStyle = c2;
        circlePath(ctx, x, y + 34, 52 + h * 22);
        ctx.fill();
        ctx.fillStyle = c1;
        circlePath(ctx, x - 10, y + 26, 46 + h * 20);
        ctx.fill();
        circlePath(ctx, x + 44, y + 36, 34 + h * 14);
        ctx.fill();
      }
      ctx.fillStyle = c1;
      ctx.fillRect(0, y + 60, VIEW_W, VIEW_H - y - 60);
    }
    // le vent
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const x = (((hash(i) * 1300 - t * 420) % 1300) + 1300) % 1300 - 160;
      const y = 120 + hash(i * 7.1) * 200;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 70, y);
      ctx.stroke();
    }
  }

  return {
    NOTE, eagle, egg, heldEgg, shell, nest, twig, twigShape, heldTwigs, note, bit, heldDrawing, chick, goldFeather,
    alert, swoopArrows, smokeWall, life, paper, DOOR, flightScene,
  };
})();

BOSSES.aigle = MamanAigle;
