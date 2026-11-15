'use strict';

// =====================================================================
//  PÉPÉ CHÊNE ET RONCHON : le boss de la Forêt (tout en haut du Vieux Chêne, le 2-4)
//  Pépé Chêne est le vieux Roi de la Forêt : un gros tronc tout ridé, avec une couronne de feuilles, des sourcils
//  de mousse, une barbe de lichen et un nez en nœud de bois. Il radote et il ronfle. Ronchon, son hérisson, est son
//  garde du corps : quand Malice arrive, il le pique pour le réveiller (« Hein ? Qui ose grimper dans mon tronc ? »).
//  Ils ont trois vies à eux deux (les trois glands en haut de l'écran), et chaque coup se donne d'une autre façon :
//   1. Ronchon gratte le sol en grognant… puis fonce en boule vers Malice. On saute par-dessus : il se cogne (contre
//      le bord, un bloc ou Pépé Chêne) et voit des étoiles. Vite, on lui saute dessus (ou on le pousse : il roule
//      jusqu'à Pépé Chêne, bonk !).
//   2. Pépé Chêne lui met un casque (une cupule de gland) : il ne voit plus d'étoiles en se cognant. Mais les chips au
//      vinaigre (sur le petit champignon, au bord) le font éternuer si fort qu'il perd ses piquants : on lui saute
//      dessus. (Les chips sur Pépé Chêne : il éternue, et ça souffle les piquants de Ronchon aussi.) Ronchon fonce
//      toujours, et se cogne sans mal (« Tonk ! Même pas mal ! »).
//   3. Ronchon, tout nu, se cache derrière Pépé Chêne, qui se fâche : il fait tomber de gros glands. On saute dessus
//      pour les renvoyer : ils repartent sur son nez en nœud de bois. Toc !
//  Pendant tout le combat, Pépé Chêne fait tomber des glands (un gland tremble là-haut, son ombre grandit par terre)
//  et sortir ses racines du sol (la terre se soulève et tremble avant). Le caramel colle les piquants de Ronchon
//  (il ne peut plus se mettre en boule : on lui saute dessus), et les pouvoirs qui renversent le font tomber
//  étourdi (dans la première manche) ou le touchent quand il ne peut pas se défendre.
//  À la fin, Pépé Chêne fait pousser des fleurs partout et se rendort tout content ; Ronchon, ses piquants repoussés
//  avec des fleurs, rougit et fait un câlin à Malice.
// =====================================================================

// Sa boîte : la largeur de son tronc, et sa hauteur (des racines au haut de la tête, sans la couronne).
const CHENE_W = 116;
const CHENE_H = 190;
// La hauteur (y) où pendent les glands avant de tomber, sous les feuilles du haut (plus bas que le haut de l'écran,
// pour qu'on les voie bien sous les vies).
const CHENE_HANG = 112;
// Ronchon : sa boîte déroulé (largeur, hauteur), et en boule.
const RONCHON_W = 58;
const RONCHON_H = 42;
const RONCHON_BALL = 50;

class PepeChene extends Boss {
  // x : le milieu de la case du &, y : le sol
  constructor(world, x, y) {
    // (le & est sur l'avant-dernière colonne : son tronc touche presque le mur du chêne)
    const px = x - 26;
    super(world, px - CHENE_W / 2, y - CHENE_H, CHENE_W, CHENE_H, {
      name: 'Pépé Chêne\net Ronchon', song: 'boss-foret', life: 3, intro: 4.2, introShort: 1.6,
    });
    this.groundY = y;
    this.px = px;
    this.dir = -1;
    // ce qu'il fait : idle, shake (il secoue ses branches : des glands), slam (il tape par terre : des racines),
    // sneeze (les chips), sticky (le caramel), ouch (on a touché Ronchon ou son nez)
    this.act = 'idle';
    this.actT = 0;
    this.timer = 0;
    this.plan = 0;
    // le dessin : yeux ouverts (0 : il dort), bras (voir CheneArt.king), nez rouge, sourcils froncés, content…
    this.eyes = 0;
    this.arm = 1.3;
    this.armBack = 1.3;
    this.wiggle = 0;
    this.nose = 0;
    this.grumpy = 0;
    this.happy = 0;
    this.squash = 0;
    this.wobble = 0;
    this.crown = 0;
    this.mouth = 0;
    this.sneezeK = 0;
    this.zzzT = 0.5;
    this.chatT = 9;
    this.chats = 0;
    this.glue = 0;
    this.bonkT = 0;
    this.ronchon = null;
    this.flowers = [];
    this.bloomT = 0;
    this.hintT = 0;
    this.dizzies = 0;
    this.sneezes = 0;
    this.stool = 0;
  }

  setup() {
    super.setup();
    const w = this.world;
    // Ronchon garde l'entrée, juste devant les racines de Pépé Chêne (dessiné derrière lui : il s'y cache)
    this.ronchon = new CheneRonchon(w, this, this.x - 56);
    w.enemies.splice(w.enemies.indexOf(this), 0, this.ronchon);
    // les fleurs qui pousseront à la fin (de Pépé Chêne jusqu'au bord de l'arène)
    const A = this.arena;
    for (let x = this.x - 24, i = 0; x > A.x0 + 20; x -= rand(52, 70), i++) {
      this.flowers.push({ x: x + rand(-8, 8), at: 1.3 + i * 0.09, k: 0, c: i % 5, s: rand(0.85, 1.15), done: false });
    }
  }

  // le bout de son nez en nœud de bois (là où arrivent les glands renvoyés)
  nosePos() {
    return { x: this.px - 22, y: this.groundY - 120 };
  }

  get cx() { return this.px; }

  // ---------- Avant et pendant le réveil ----------
  asleep(dt) {
    this.eyes = 0;
    this.snore(dt);
  }

  // il ronfle : des Z qui montent de sa bouche
  snore(dt) {
    const w = this.world;
    this.mouth = 0.35 + Math.sin(this.t * 2.2) * 0.25;
    this.zzzT -= dt;
    if (this.zzzT > 0) return;
    this.zzzT = 1.4;
    w.spawn({ type: 'text', x: this.px - 40, y: this.groundY - 100, vx: -22, vy: -46, life: 1.7, text: 'Z', color: '#eaf6ff', size: 18 });
    w.spawn({ type: 'text', x: this.px - 52, y: this.groundY - 112, vx: -30, vy: -52, life: 1.3, text: 'z', color: '#eaf6ff', size: 13 });
    if (w.onScreen(this, 40) && !w.player.dead) Sound.sfx.snore();
  }

  // quand Ronchon le pique pour le réveiller (une fois le réveil un peu avancé)
  prickTime() { return this.short ? 0.4 : 1.05; }

  wake(dt, k) {
    const w = this.world;
    const t = this.stateT;
    const tp = this.prickTime();
    if (t < tp) {
      this.snore(dt);
      return;
    }
    // Aïe ! Il sursaute, ses yeux s'ouvrent tout grands, et des feuilles tombent de sa couronne
    if (this.once('prick')) {
      this.eyes = 1;
      this.squash = 1;
      this.mouth = 1;
      Sound.sfx.oakWake();
      w.popText(this.x + 4, this.groundY - 40, 'Aïe\u00a0!', '#ffe0a8', 22);
      this.leaves(8);
    }
    this.mouth = approach(this.mouth, 0, dt * 2);
    this.squash = approach(this.squash, 0, dt * 3);
    this.crown = Math.sin(t * 9) * 0.12 * Math.max(0, 1 - (t - tp) * 1.5);
    if (t > tp + 0.25 && this.once('say')) {
      if (this.short) this.speak('Encore toi\u00a0? Ronchon, à l\'attaque\u00a0!', 1.3);
      else this.speak('Hein\u00a0? Quoi\u00a0? Qui ose grimper dans mon tronc\u00a0?', 2.4);
    }
    if (!this.short && t > tp + 2.75 && this.once('say2')) {
      this.grumpy = 1;
      this.speak('Ronchon\u00a0! À l\'attaque\u00a0!', 1.1);
    }
    if (k >= 1) {
      this.act = 'idle';
      this.actT = 0;
      this.timer = 2.4 / this.k;
      this.pushFromRonchon();
    }
  }

  // Le combat commence : si Malice est venue se mettre contre Ronchon pendant le réveil, il la repousse d'un coup
  // de museau (sans piquer), vers le milieu de l'arène, avec un moment de grâce : elle le voit ensuite se mettre en
  // boule (« ! ») avant d'avoir mal.
  pushFromRonchon() {
    const p = this.world.player;
    const R = this.ronchon;
    if (p.dead || Math.abs(p.cx - R.home) > 1.5 * TILE || p.y + p.h < this.groundY - 2 * TILE) return;
    p.vx = -420;
    p.vy = Math.min(p.vy, -460);
    p.onGround = false;
    p.platform = null;
    this.grace = BOSS_GRACE;
    // (pas de deuxième coup de museau qui la renverrait de l'autre côté, pendant qu'elle passe au-dessus de lui)
    R.nudgeT = 0.6;
    Sound.sfx.hogGrunt();
    R.pop('Grrr\u00a0!', '#ffd0a0', 18, 60);
  }

  // ---------- Le combat ----------
  fight(dt) {
    const K = this.k;
    this.actT += dt;
    if (this.bonkT > 0) this.bonkT -= dt;
    if (this.source) this.stool = approach(this.stool, 1, dt * 2.5);
    this.animate(dt);
    switch (this.act) {
      case 'idle':
        this.timer -= dt;
        if (this.timer <= 0 && this.canAttack()) this.attack();
        break;
      case 'shake':
        // il secoue ses branches tout là-haut : les glands tremblent (voir CheneGland)
        if (this.actT > 0.7) this.rest(this.gap());
        break;
      case 'slam':
        // il lève le bras… et tape par terre : la terre se soulève là où est Malice
        if (this.actT > 0.3 && this.once('slam' + this.plan)) this.raiseRoots();
        if (this.actT > 0.7) this.rest(this.gap());
        break;
      case 'sneeze':
        // a… a… ATCHOUM !
        if (this.actT > 0.75 && this.once('sneeze' + this.sneezes)) this.atchoum();
        if (this.actT > 1.5) this.rest(1 / K);
        break;
      case 'sticky':
        // les mains pleines de caramel : il ne peut plus rien faire tomber, il les secoue
        this.glue -= dt;
        if (this.glue <= 0) {
          Sound.sfx.unstuck();
          this.rest(0.8 / K);
        }
        break;
      case 'ouch':
        if (this.recover <= 0) this.rest(1.4 / K);
        break;
      default: break;
    }
    this.advise(dt);
    this.radote(dt);
  }

  rest(timer) {
    this.act = 'idle';
    this.actT = 0;
    this.timer = timer;
  }

  // le temps entre deux attaques
  gap() {
    return [2.0, 1.7, 1.5][this.phase] / this.k;
  }

  // Ce qui le fait bouger : ses bras, ses yeux, son nez qui redevient marron…
  animate(dt) {
    const a = this.act;
    const arm = a === 'shake' ? -0.55 + Math.sin(this.t * 26) * 0.22 : a === 'slam' ? (this.actT < 0.25 ? -0.9 : 1.25)
      : a === 'sneeze' ? (this.actT < 0.75 ? -0.3 : 0.6) : a === 'sticky' ? 0.2 + Math.sin(this.t * 18) * 0.35 : a === 'ouch' ? -0.6 : 1.3;
    this.arm = approach(this.arm, arm, dt * (a === 'slam' && this.actT >= 0.25 ? 14 : 6));
    this.armBack = approach(this.armBack, a === 'shake' ? -0.6 + Math.cos(this.t * 24) * 0.22 : a === 'sticky' ? 0.2 - Math.sin(this.t * 18) * 0.35 : 1.3, dt * 6);
    this.eyes = approach(this.eyes, a === 'sneeze' && this.actT < 0.75 ? 0.25 : 1, dt * 4);
    this.nose = approach(this.nose, 0, dt * 0.6);
    this.grumpy = approach(this.grumpy, this.phase >= 2 || a === 'ouch' ? 1 : 0.55, dt * 2);
    this.squash = approach(this.squash, 0, dt * 3);
    this.sneezeK = approach(this.sneezeK, a === 'sneeze' && this.actT < 0.75 ? 1 : 0, dt * (this.actT < 0.75 ? 1.6 : 6));
    this.crown = approach(this.crown, 0, dt * 0.5) * Math.pow(0.1, dt);
    this.mouth = approach(this.mouth, this.say && this.say.t > 0.2 ? 0.45 + Math.sin(this.t * 14) * 0.35 : a === 'sneeze' ? 0.8 : 0, dt * 6);
    this.wobble *= Math.pow(0.05, dt);
  }

  // Un gland ou une racine à la fois (on voit toujours venir ce qui arrive).
  threats() {
    let n = 0;
    for (const e of this.world.enemies) {
      if (e.dead || e.boss !== this) continue;
      if (e instanceof CheneRacine || (e instanceof CheneGland && (e.state === 'hang' || e.state === 'fall'))) n++;
    }
    return n;
  }

  // les gros glands qui attendent par terre (troisième manche)
  restingAcorns() {
    return this.world.enemies.filter((e) => e instanceof CheneGland && !e.dead && e.state === 'rest');
  }

  canAttack() {
    const R = this.ronchon;
    const p = this.world.player;
    if (p.dead || this.grace > 0 || this.threats() > 0) return false;
    // pas pendant que Ronchon gratte le sol ou fonce (en Difficile, à partir de la deuxième manche, si)
    if (this.phase < 2 && R.charging() && !(this.k > 1.2 && this.phase >= 1)) return false;
    return true;
  }

  // La suite de ses attaques, selon la manche (en Bébé, moins de racines).
  attack() {
    const baby = this.k < 0.9;
    const seq = [
      ['acorn'],
      baby ? ['acorn', 'acorn', 'root'] : ['acorn', 'root'],
      baby ? ['big', 'big', 'root'] : ['big', 'root', 'big'],
    ][this.phase];
    let what = seq[this.plan % seq.length];
    this.plan++;
    // (pas plus de trois gros glands par terre à la fois)
    if (what === 'big' && this.restingAcorns().length >= 3) what = 'root';
    this.actT = 0;
    if (what === 'root') {
      this.act = 'slam';
      Sound.sfx.rootRumble();
    } else {
      this.act = 'shake';
      this.dropAcorns(what === 'big');
    }
  }

  // Des glands tremblent là-haut, au-dessus de Malice (et à côté d'elle, quand il y en a plusieurs).
  dropAcorns(big, away) {
    const w = this.world;
    const p = w.player;
    const K = this.k;
    const n = big ? (K < 0.9 ? 1 : K > 1.2 ? 3 : 2) : (K > 1.1 ? 2 : 1);
    const lo = this.arena.x0 + 34;
    const hi = this.x - 34;
    const xs = [];
    for (let i = 0; i < n; i++) {
      let x = away ? rand(lo, hi) : p.cx + (i === 0 ? rand(-12, 12) : (i % 2 ? 1 : -1) * rand(110, 150) * Math.ceil(i / 2));
      x = clamp(x, lo, hi);
      // (jamais deux glands l'un sur l'autre ; avec away, jamais sur Malice)
      let tries = 0;
      while (tries++ < 12 && (xs.some((o) => Math.abs(o - x) < 80) || (away && Math.abs(x - p.cx) < 110))) x = rand(lo, hi);
      xs.push(x);
    }
    xs.forEach((x, i) => w.enemies.push(new CheneGland(w, this, x, big, ((big ? 1.15 : 1.0) / K) + i * 0.18)));
    Sound.sfx.acornShake();
  }

  // La terre se soulève là où est Malice (et, en Difficile, un peu plus loin aussi).
  raiseRoots() {
    const w = this.world;
    const p = w.player;
    const lo = this.arena.x0 + 30;
    const hi = this.x - 24;
    const x = clamp(p.cx, lo, hi);
    w.enemies.push(new CheneRacine(w, this, x, 1.05 / this.k));
    if (this.k > 1.2 && this.phase >= 2) {
      const x2 = clamp(x + (x - lo > hi - x ? -1 : 1) * 170, lo, hi);
      w.enemies.push(new CheneRacine(w, this, x2, 1.05 / this.k + 0.35));
    }
    w.shake(4);
  }

  // des feuilles tombent de sa couronne
  leaves(n) {
    const w = this.world;
    for (let i = 0; i < n; i++) {
      w.spawn({
        type: 'leaf', x: this.px + rand(-40, 40), y: this.groundY - CHENE_H - rand(0, 20), vx: rand(-80, 80), vy: rand(20, 90), g: 60,
        life: rand(1.2, 1.8), size: rand(0.9, 1.3), rot: rand(0, 6), vr: rand(-4, 4), wob: rand(0, 6), color: choose(['#6aa83a', '#8cc04a', '#e0b23a']),
      });
    }
  }

  // ---------- Les chips et le caramel ----------
  shot(kind) {
    const w = this.world;
    if (this.act === 'sneeze' || this.act === 'ouch') return;
    if (kind === 'chips') {
      this.act = 'sneeze';
      this.actT = 0;
      this.sneezes++;
      Sound.sfx.crunch();
      Sound.sfx.sneezeUp();
      w.popText(this.px - 70, this.groundY - 215, 'Du vinaigre\u00a0?! A… a…', '#d8ffb0', 20);
    } else {
      this.act = 'sticky';
      this.actT = 0;
      this.glue = 2.4 / this.k;
      Sound.sfx.stick();
      w.popText(this.px - 70, this.groundY - 215, 'Pouah, c\'est collant\u00a0!', '#ffcf6a', 20);
    }
  }

  // ATCHOUM ! Ses feuilles s'envolent ; le souffle fait perdre ses piquants à Ronchon (les deux premières manches),
  // ou fait tomber de gros glands de sa couronne, loin de Malice (la dernière).
  atchoum() {
    const w = this.world;
    Sound.sfx.sneeze();
    w.shake(7);
    w.popText(this.px - 40, this.groundY - 160, 'ATCHOUM\u00a0!', '#ffffff', 34);
    this.leaves(14);
    const n = this.nosePos();
    for (let i = 0; i < 10; i++) {
      w.spawn({ type: 'smoke', x: n.x - 10, y: n.y + rand(-10, 10), vx: -rand(260, 520), vy: rand(-60, 60), life: 0.6, size: rand(6, 11), color: '#eef8e0' });
    }
    if (this.phase < 2) this.ronchon.blowOff(true);
    else this.dropAcorns(true, true);
  }

  // ---------- Ce qui le touche ----------
  // Ronchon, quand il ne peut pas se défendre (les deux premières manches) ; puis un gros gland renvoyé sur son nez.
  takes(how, part) {
    if (part === this.ronchon) return this.phase < 2 && part.open();
    if (part instanceof CheneGland) return this.phase >= 2 && how === 'acorn';
    return false;
  }

  onHit(how, part) {
    const w = this.world;
    this.act = 'ouch';
    this.actT = 0;
    this.grumpy = 1;
    this.tip = null;
    // (un petit moment de calme : ce qui allait tomber ou sortir s'en va)
    for (const e of w.enemies) {
      if (!e.dead && e.boss === this && (e instanceof CheneRacine || (e instanceof CheneGland && e.state !== 'back'))) e.leave();
    }
    if (part === this.ronchon) part.ouchHit(how);
    if (this.phase === 1) {
      this.speak('Mon pauvre Ronchon\u00a0! Tiens, mets ton casque\u00a0!', 2.4);
      // les chips au vinaigre arrivent, sur un petit champignon au bord de l'arène (elles repoussent)
      this.addSource('chips', this.arena.x0 + 3.5 * TILE, this.groundY - 20, true);
      Sound.sfx.itemAppear();
    } else {
      this.speak('Ronchon, tu es tout nu\u00a0! Bon… À moi de jouer\u00a0!', 2.4);
    }
  }

  onBounce() {
    const w = this.world;
    const p = w.player;
    Sound.sfx.boing(false);
    // Il ne bouge pas : sans ça, Malice rebondirait sur sa couronne sans fin, et le combat n'avancerait plus.
    // Elle glisse vers le milieu de l'arène (avec un moment de grâce : elle retombe peut-être sur Ronchon).
    if (this.state === 'fight') {
      p.vx = -Math.max(Math.abs(p.vx), 420);
      p.boostT = 0.3;
      this.grace = BOSS_GRACE;
      if (this.once('h-crown' + this.phase)) {
        this.hint(this.phase < 2 ? 'Pépé Chêne ne sent rien sur sa couronne\u00a0: c\'est Ronchon qu\'il faut attraper\u00a0!'
          : 'Pépé Chêne ne sent rien sur sa couronne\u00a0: renvoie-lui les gros glands sur le nez\u00a0!', 3.5);
      }
    }
    if (this.bonkT > 0) return;
    this.bonkT = 1.2;
    this.crown = 0.4;
    if (this.state === 'fight') w.popText(this.px, this.groundY - 220, 'Hé, ma couronne\u00a0!', '#ffe0a8', 20);
    else if (this.state === 'friend') w.popText(this.px, this.groundY - 220, 'Zzz… hi hi… Zzz…', '#eaf6ff', 18);
  }

  // Il est un peu comme un mur : on ne rentre pas dans son tronc (sans avoir mal).
  nudge(p) {
    if (p.cx >= this.px) return;
    const lim = this.x + 16 - p.w;
    if (p.x > lim) {
      p.x = lim;
      if (p.vx > 0) p.vx = 0;
    }
  }

  dangerous() { return false; }

  // ---------- Les petits conseils ----------
  advise(dt) {
    const g = this.world.game;
    const R = this.ronchon;
    this.hintT += dt;
    if (this.tip && this.tip.t > 0) return;
    // (tout nu ou collé : dans les deux premières manches, les chips et le caramel marchent dès le début)
    if (this.phase < 2 && R.state === 'bald' && R.stT > 0.7 && this.once('h-bald' + R.sneezes)) this.hint('Il a perdu ses piquants\u00a0: saute-lui dessus\u00a0!', 3);
    else if (this.phase < 2 && R.state === 'glued' && R.stT > 0.7 && this.once('h-glue' + R.glues)) this.hint('Le caramel colle ses piquants\u00a0: saute-lui dessus\u00a0!', 3);
    else if (this.phase === 0) {
      if (R.state === 'scratch' && this.once('h-jump')) this.hint('Attention, Ronchon va foncer\u00a0! Saute par-dessus\u00a0: il va se cogner\u00a0!', 3.5);
      else if (R.state === 'dizzy' && R.stT > 0.9 && this.once('h-dizzy' + Math.floor(this.dizzies / 3))) this.hint('Ronchon voit des étoiles\u00a0: saute-lui dessus\u00a0!', 3);
    } else if (this.phase === 1) {
      if ((R.state === 'home' || R.state === 'walk') && this.hintT > (this.flags['h-chips'] ? 16 : 1.5) && R.sneezes === 0) {
        this.flags['h-chips'] = true;
        this.hintT = 0;
        this.hint(g.chips > 0
          ? 'Les chips au vinaigre font éternuer\u00a0! Lance-les sur Ronchon avec {CHIPS}\u00a0!'
          : 'Avec son casque, il ne voit plus d\'étoiles… Prends les chips au vinaigre, sur le petit champignon\u00a0!', 4.5);
      }
    } else {
      const rest = this.restingAcorns();
      if (rest.length && this.hintT > (this.flags['h-acorn'] ? 12 : 0.3) && rest.some((a) => a.stT > (this.flags['h-acorn'] ? 2 : 0.2))) {
        this.flags['h-acorn'] = true;
        this.hintT = 0;
        this.hint('Saute sur les gros glands pour les renvoyer sur le nez de Pépé Chêne\u00a0!', 4.5);
      }
    }
  }

  // Il radote (quand on n'a rien d'autre à dire).
  radote(dt) {
    this.chatT -= dt;
    if (this.chatT > 0 || (this.say && this.say.t > 0) || (this.tip && this.tip.t > 0) || this.act !== 'idle') return;
    this.chatT = 13;
    const L = [
      'De mon temps, les glands étaient bien plus gros…',
      'Où ai-je mis ma couronne\u00a0? Ah… elle est sur ma tête.',
      'J\'ai trois cents ans, tu sais. Ou quatre cents\u00a0?',
      'Ronchon\u00a0! C\'est l\'heure de ma sieste, non\u00a0?',
    ];
    this.speak(L[this.chats++ % L.length], 2.6);
  }

  // ---------- La fin ----------
  onBeaten() {
    const w = this.world;
    this.act = 'beaten';
    this.nose = 1;
    this.grumpy = 0;
    this.say = null;
    this.wobble = 1;
    this.crown = 0.5;
    Sound.sfx.noseToc();
    w.popText(this.px - 40, this.groundY - 190, 'TOC\u00a0!', '#ffe27a', 38);
    this.leaves(16);
  }

  outro(dt, t) {
    this.arm = approach(this.arm, t > 1.2 && t < 3.4 ? -0.7 : 1.3, dt * 4);
    this.armBack = approach(this.armBack, t > 1.2 && t < 3.4 ? -0.7 : 1.3, dt * 4);
    this.nose = approach(this.nose, 0, dt * 0.3);
    this.wobble = t < 1 ? Math.sin(t * 13) * (1 - t) : 0;
    this.crown = approach(this.crown, 0, dt * 0.4);
    this.happy = approach(this.happy, t > 1.1 ? 1 : 0, dt * 2);
    this.grumpy = 0;
    if (t > 0.4 && this.once('ouille')) this.speak('Ouille, mon nez\u00a0!', 1.1);
    if (t > 1.2 && this.once('bravo')) this.speak('Bon, bon… Tu as gagné, Malice. Tiens, des fleurs\u00a0!', 2.2);
    // des fleurs poussent partout dans la couronne du chêne
    this.bloom(t);
    // puis il se rendort, tout content
    if (t > 3.6) {
      this.eyes = approach(this.eyes, 0, dt * 1.5);
      this.snore(dt);
    } else {
      this.mouth = approach(this.mouth, this.say && this.say.t > 0.2 ? 0.45 + Math.sin(this.t * 14) * 0.35 : 0, dt * 6);
    }
    return t > 4.4;
  }

  bloom(t) {
    const w = this.world;
    this.flowers.forEach((f, i) => {
      f.k = clamp((t - f.at) / 0.35, 0, 1);
      if (f.k > 0 && !f.done) {
        f.done = true;
        Sound.sfx.bloom(i);
        for (let j = 0; j < 4; j++) {
          w.spawn({ type: 'spark', x: f.x, y: this.groundY - 14, vx: rand(-80, 80), vy: rand(-160, -60), life: 0.5, size: rand(3, 5), color: CheneArt.FLOWER[f.c] });
        }
      }
    });
  }

  // (une fois battu) il dort, tout content, et ronfle ; il marmonne un merci quand Malice passe tout près
  after(dt) {
    const p = this.world.player;
    this.eyes = 0;
    this.happy = 1;
    this.snore(dt);
    if (Math.abs(p.cx - this.px) < 200 && this.once('bye')) this.speak('Zzz… Merci, Malice… Zzz…', 2.2);
    for (const f of this.flowers) f.k = 1;
  }

  box() {
    this.x = this.px - CHENE_W / 2;
    this.y = this.groundY - CHENE_H;
    this.w = CHENE_W;
    this.h = CHENE_H;
    this.onGround = true;
    this.stompDepth = 22;
  }

  // (sa bulle : au-dessus de sa couronne, un peu vers le milieu de l'arène pour ne pas sortir de l'écran)
  sayAt() {
    return { x: this.px - 70, y: this.groundY - CHENE_H - 52 };
  }

  // ---------- Dessin ----------
  drawWall(ctx, x, k, side) {
    // (à droite, c'est déjà le mur du chêne)
    if (side < 0) CheneArt.vineWall(ctx, x, this.groundY, k, this.t);
  }

  // les feuilles du haut, le petit champignon des chips, et les fleurs de la fin
  drawDecor(ctx) {
    const A = this.arena;
    CheneArt.garland(ctx, A.x0, A.x1);
    if (this.source) CheneArt.stool(ctx, this.source.x, this.groundY, this.stool);
    for (const f of this.flowers) {
      if (f.k > 0) CheneArt.flower(ctx, f.x, this.groundY, f.k * f.s, f.c, this.t);
    }
  }

  // ses vies : des glands (sur un petit rond vert)
  drawLife(ctx, x, y, full) {
    CheneArt.lifeAcorn(ctx, x, y, full);
  }

  drawBody(ctx) {
    const p = this.world.player;
    CheneArt.king(ctx, this.px, this.groundY, {
      t: this.t, eyes: this.eyes, arm: this.arm, armBack: this.armBack, nose: this.nose, grumpy: this.grumpy,
      happy: this.happy, squash: this.squash, wobble: this.wobble, crown: this.crown, mouth: this.mouth,
      sneeze: this.sneezeK, sticky: this.act === 'sticky', look: clamp((p.cx - (this.px - 30)) / 300, -1, 1),
      lookY: clamp((p.cy - (this.groundY - 140)) / 200, -1, 1), dizzy: this.state === 'beaten' && this.stateT < 1.2,
      sleep: this.state === 'sleep' || (this.state === 'wake' && this.stateT < this.prickTime()), flowers: this.happy,
    });
  }
}

// ======================= RONCHON, LE HÉRISSON GARDE DU CORPS =======================
// (w.diff.hogNear : à combien de cases il se met en boule quand Malice approche, comme les hérissons du 2-2)
class CheneRonchon extends Enemy {
  constructor(world, boss, x) {
    super(world, x - RONCHON_W / 2, boss.groundY - RONCHON_H, RONCHON_W, RONCHON_H);
    this.boss = boss;
    this.ouch = 'pins'; // ça pique (voir OUCH)
    this.groundY = boss.groundY;
    this.px = x;
    this.home = x;
    this.dir = -1;
    // guard (il somnole), alert (le réveil), home, curl, scratch, back, roll, dizzy, kicked, walk, rebound, sneeze,
    // bald, regrow, glued, ouch, helmet, hide, friend, hug
    this.state = 'guard';
    this.stT = 0;
    this.flags = {};
    this.curl = 0;
    this.rot = 0;
    this.speed = 0;
    this.timer = 0;
    this.chargeT = 0;
    this.hopY = 0;
    this.hopV = 0;
    this.helmet = 0;
    this.capY = 0;
    this.capFly = null;
    this.spines = 1;
    this.blush = 0;
    this.sneezeK = 0;
    this.scratchK = 0;
    this.flowers = 0;
    this.nudgeT = 0;
    this.say = null;
    this.sneezes = 0;
    this.glues = 0;
    this.dustT = 0;
    this.heartT = 0;
  }

  get k() { return this.world.diff.bossK; }

  setSt(s) {
    this.state = s;
    this.stT = 0;
    this.flags = {};
  }

  once(key) {
    if (this.flags[key]) return false;
    this.flags[key] = true;
    return true;
  }

  speak(text, dur) {
    this.say = { text: this.world.game.textFor(text), t: dur, dur };
  }

  // Est-ce qu'on peut lui faire perdre une vie maintenant ? (étourdi, poussé, sans piquants, ou collé)
  open() {
    return this.boss.phase < 2 && (this.state === 'dizzy' || this.state === 'kicked' || this.state === 'bald' || this.state === 'glued');
  }

  // Il gratte le sol ou fonce (Pépé Chêne attend un peu avant de faire tomber ses glands).
  charging() {
    return this.state === 'scratch' || this.state === 'back' || this.state === 'roll';
  }

  curled() {
    return this.state === 'curl' && this.curl > 0.5;
  }

  // Malice arrive tout près de lui (à sa hauteur, ou en lui tombant dessus) ?
  // (pas pendant le moment de grâce : Malice que Pépé Chêne vient de repousser passe au-dessus de lui)
  near(p) {
    if (this.boss.grace > 0) return false;
    const feet = p.y + p.h;
    return !p.dead && Math.abs(p.cx - this.px) < this.world.diff.hogNear * TILE && feet > this.groundY - 3 * TILE;
  }

  face(p) {
    if (Math.abs(p.cx - this.px) > 8) this.dir = Math.sign(p.cx - this.px);
  }

  // il marche jusqu'à x (renvoie true quand il y est)
  walkTo(x, sp, dt) {
    const d = x - this.px;
    if (Math.abs(d) < 2) {
      this.px = x;
      this.speed = 0;
      return true;
    }
    this.dir = Math.sign(d);
    this.px += clamp(d, -sp * dt, sp * dt);
    this.legPhase += dt * 12;
    this.speed = sp;
    return false;
  }

  hop(v) {
    this.hopV = -v;
    if (this.hopY >= 0) this.hopY = -0.01;
  }

  // les bords : le bord de l'arène à gauche (avec ses lianes), Pépé Chêne à droite
  limits() {
    const B = this.boss;
    return { lo: B.arena.x0 + 22 + RONCHON_W / 2, hi: B.x + 6 - RONCHON_BALL / 2 };
  }

  // (ses petits mots, toujours bien dans l'écran)
  pop(text, color, size, dy) {
    this.world.popText(Math.max(this.px, this.boss.arena.x0 + 70), this.groundY - (dy || 64), text, color, size);
  }

  ai(dt) {
    const B = this.boss;
    const w = this.world;
    const p = w.player;
    const K = this.k;
    this.stT += dt;
    if (this.nudgeT > 0) this.nudgeT -= dt;
    if (this.say) this.say.t -= dt;
    // le petit saut (quand il sursaute, ou se cogne)
    if (this.hopY < 0 || this.hopV < 0) {
      this.hopV += 2400 * dt;
      this.hopY += this.hopV * dt;
      if (this.hopY >= 0) {
        this.hopY = 0;
        this.hopV = 0;
      }
    }
    this.blush = approach(this.blush, this.spines < 0.5 || this.state === 'hug' || this.state === 'friend' ? 1 : 0, dt * 2);
    this.sneezeK = approach(this.sneezeK, this.state === 'sneeze' && this.stT < 0.8 ? 1 : 0, dt * (this.state === 'sneeze' ? 1.4 : 6));
    this.scratchK = this.state === 'scratch' ? 1 : approach(this.scratchK, 0, dt * 6);
    this.updateCap(dt);
    const ballUp = this.state === 'curl' || this.state === 'roll' || this.state === 'kicked';
    this.curl = approach(this.curl, ballUp ? 1 : 0, dt / 0.16);
    const L = this.limits();
    switch (this.state) {
      case 'guard':
        // il somnole debout, à côté de Pépé Chêne
        if (B.state === 'wake' || B.state === 'fight') this.setSt('alert');
        break;
      case 'alert': {
        // « ! » : il a vu Malice. Il court piquer Pépé Chêne pour le réveiller, puis revient à sa place.
        const tp = B.prickTime();
        if (this.once('!')) {
          this.face(p);
          this.hop(420);
          this.pop('!', '#ff4040', 30, 64);
          Sound.sfx.hogCurl();
        }
        if (!B.short && this.stT > 0.3 && this.once('grr')) {
          Sound.sfx.hogGrunt();
          this.pop('Grrr\u00a0!', '#ffd0a0', 20, 70);
        }
        if (this.stT > (B.short ? 0.08 : 0.6) && this.stT < tp) this.walkTo(B.x + 8 - RONCHON_W / 2, 260, dt);
        if (this.stT >= tp && this.once('prick')) {
          this.dir = 1;
          w.popText(B.x - 4, this.groundY - 54, 'Pic\u00a0!', '#ffffff', 22);
          for (let i = 0; i < 5; i++) {
            w.spawn({ type: 'spark', x: B.x, y: this.groundY - 20, vx: rand(20, 160), vy: rand(-160, -40), life: 0.35, size: rand(3, 5), color: '#fff6a0' });
          }
        }
        if (this.stT > tp + 0.3 && this.walkTo(this.home, 220, dt)) this.face(p);
        if (B.state === 'fight') {
          this.px = this.home;
          this.toHome(0.9 / K);
        }
        break;
      }
      case 'home':
        this.atHome(dt);
        break;
      case 'curl':
        // en boule, tout plein de piquants : on ne peut pas lui sauter dessus (ça pique !)
        this.chargeT -= dt;
        if (!this.near(p) && this.stT > 0.5) this.setSt('home');
        else if (this.stT > 1.4 / K && this.chargeT <= 0 && B.threats() === 0 && !p.dead) this.startScratch();
        if (B.phase >= 2) this.hide();
        break;
      case 'scratch': {
        // il gratte le sol en grognant (c'est l'annonce) : il va foncer !
        if (this.stT < 0.5) this.face(p);
        this.dustT -= dt;
        if (this.dustT <= 0) {
          this.dustT = 0.16;
          for (let i = 0; i < 3; i++) {
            w.spawn({ type: 'dust', x: this.px - this.dir * 18, y: this.groundY, vx: -this.dir * rand(60, 160), vy: rand(-120, -30), life: 0.4, size: rand(4, 7) });
          }
          if (w.onScreen(this)) Sound.sfx.hogScratch();
        }
        if (this.stT >= 1.2 / K) {
          // (Malice est collée à lui : il recule d'abord un peu, pour qu'elle ait le temps de sauter)
          if (Math.abs(p.cx - this.px) < 52 && Math.abs(p.y + p.h - this.groundY) < 60) this.setSt('back');
          else this.startRoll();
        }
        break;
      }
      case 'back':
        this.px = clamp(this.px - this.dir * 130 * dt, L.lo, L.hi);
        if (this.stT > 0.25 + 0.15 / K) this.startRoll();
        break;
      case 'roll': {
        // il fonce en boule, tout droit, jusqu'à se cogner
        this.px += this.dir * this.speed * dt;
        this.rot += (this.dir * this.speed * dt) / (RONCHON_BALL / 2);
        this.dustT -= dt;
        if (this.dustT <= 0) {
          this.dustT = 0.08;
          w.spawn({ type: 'dust', x: this.px - this.dir * 20, y: this.groundY, vx: -this.dir * rand(30, 90), vy: rand(-60, -10), life: 0.3, size: rand(3, 6) });
        }
        const block = w.boxSolid(this.px + this.dir * (RONCHON_BALL / 2 + 2), this.groundY - 40, 4, 30);
        if (this.px <= L.lo || this.px >= L.hi || block) {
          this.px = clamp(this.px, L.lo, L.hi);
          this.bump(this.px >= L.hi && !block);
        }
        break;
      }
      case 'kicked': {
        // poussé par Malice : il roule, tout étourdi, jusqu'au bord… ou jusqu'à Pépé Chêne (bonk !)
        this.px += this.dir * this.speed * dt;
        this.rot += (this.dir * this.speed * dt) / (RONCHON_BALL / 2);
        if (this.px >= L.hi) {
          this.px = L.hi;
          if (!B.hitWith('kick', this)) this.dizzy(1.5 / K, true);
        } else if (this.px <= L.lo) {
          this.px = L.lo;
          // (tout nu, il le reste, avec ce qui lui restait de temps : on peut toujours lui sauter dessus)
          if (this.spines < 1) {
            this.setSt('bald');
            this.timer = Math.max(this.timer, 1.5 / K);
          } else this.dizzy(Math.max(this.timer, 1.5 / K), true);
        }
        break;
      }
      case 'dizzy':
        // il voit des étoiles
        this.timer -= dt;
        if (this.timer <= 0) {
          this.hop(260);
          this.stay();
          this.pop('Grrr…', '#ffd0a0', 18, 60);
        }
        break;
      case 'rebound':
        // il a son casque : tonk ! même pas mal, il recule d'un petit bond
        this.px = clamp(this.px - this.dir * 160 * dt * Math.max(0, 1 - this.stT * 2), L.lo, L.hi);
        if (this.stT > 0.7) this.stay();
        break;
      case 'walk':
        // il retourne à sa place, devant Pépé Chêne ; s'il est prêt en chemin, il refonce de là (pas trop près de Malice)
        this.chargeT -= dt;
        if (B.phase >= 2) this.hide();
        else if (this.walkTo(this.home, 170 * K, dt)) this.toHome(this.chargeT);
        else if (this.chargeT <= 0 && B.threats() === 0 && B.grace <= 0 && !p.dead && Math.abs(p.cx - this.px) > 110) this.startScratch();
        break;
      case 'sneeze':
        // a… a… (il gonfle, le museau en l'air) ATCHOUM !
        if (this.stT > 0.8) this.blowOff(false);
        break;
      case 'bald':
        // tout nu, tout rose, il rougit : vite, on lui saute dessus ! (en Bébé, il le reste)
        this.timer -= dt;
        if (this.timer <= 0) {
          this.setSt('regrow');
          Sound.sfx.hogCurl();
        }
        break;
      case 'regrow':
        this.spines = Math.min(1, this.stT / 0.6);
        if (this.stT > 0.8) {
          this.spines = 1;
          this.pop('Hé hé\u00a0! Repoussés\u00a0!', '#ffd0a0', 18, 60);
          if (B.phase === 1 && this.helmet < 1) this.giveHelmet();
          else this.stay();
        }
        break;
      case 'glued':
        // le caramel colle ses piquants : il ne peut plus se mettre en boule (en Bébé, il le reste)
        this.timer -= dt;
        if (this.timer <= 0) {
          Sound.sfx.unstuck();
          this.stay();
        }
        break;
      case 'ouch':
        // pouic ! (Pépé Chêne vient de perdre une vie)
        if (this.stT > 1.4) {
          if (B.phase >= 2) this.hide();
          else if (this.spines < 1) this.setSt('regrow');
          else this.giveHelmet();
        }
        break;
      case 'helmet':
        // Pépé Chêne lui lance son casque (une cupule de gland), qui lui tombe sur la tête
        if (this.stT > 0.9) {
          this.helmet = 1;
          this.stay();
        }
        break;
      case 'hide':
        // tout nu, il se cache derrière Pépé Chêne… mais on voit dépasser ses petites fesses roses
        if (this.walkTo(B.px + 62, 320, dt)) this.dir = -1;
        break;
      case 'friend': {
        // ses piquants repoussent, avec des fleurs ; il rougit… et vient faire un câlin à Malice
        this.spines = Math.min(1, this.spines + dt * 1.5);
        this.flowers = Math.min(1, this.flowers + dt * 1.2);
        if (B.state === 'beaten' && B.stateT < 2.1) break;
        if (this.once('hello')) this.speak('Pardon… On est amis\u00a0?', 2.2);
        const target = p.cx + (p.cx < this.px ? 34 : -34);
        if (this.walkTo(clamp(target, L.lo, B.x - 30), 210, dt) || Math.abs(p.cx - this.px) < 46) {
          this.setSt('hug');
          this.face(p);
          Sound.sfx.hug();
        }
        break;
      }
      case 'hug':
        this.spines = Math.min(1, this.spines + dt * 1.5);
        this.flowers = Math.min(1, this.flowers + dt * 1.2);
        this.face(p);
        this.heartT -= dt;
        if (this.heartT <= 0 && this.stT < 3) {
          this.heartT = 0.35;
          w.spawn({ type: 'heart', x: this.px + rand(-14, 14), y: this.groundY - 50, vx: rand(-30, 30), vy: rand(-120, -70), life: 0.9, size: 1 });
        }
        // (s'il est loin d'elle, il la rejoint)
        if (Math.abs(p.cx - this.px) > 120) this.walkTo(clamp(p.cx + (p.cx < this.px ? 40 : -40), L.lo, B.x - 30), 200, dt);
        break;
      default: break;
    }
    this.box();
  }

  // à sa place : il regarde Malice ; il se met en boule si elle approche ; puis il gratte le sol pour foncer
  atHome(dt) {
    const B = this.boss;
    const p = this.world.player;
    if (B.phase >= 2) {
      this.hide();
      return;
    }
    if (Math.abs(this.px - this.home) > 2) {
      this.setSt('walk');
      return;
    }
    this.face(p);
    this.chargeT -= dt;
    if (this.near(p) && this.curl < 0.1) {
      this.setSt('curl');
      this.pop('!', '#ff4040', 26, 60);
      Sound.sfx.hogCurl();
      return;
    }
    if (this.chargeT <= 0 && B.threats() === 0 && B.grace <= 0 && !p.dead) this.startScratch();
  }

  // il se remet d'aplomb, et retourne à sa place, devant Pépé Chêne (mais il refonce en chemin, s'il est prêt)
  // (sans ses piquants, il les fait d'abord repousser : jamais tout nu en marchant, et son casque revient)
  stay() {
    if (this.spines < 1) {
      this.setSt('regrow');
      Sound.sfx.hogCurl();
      return;
    }
    this.setSt('walk');
    this.chargeT = (1.5 - 0.25 * this.boss.phase) / this.k;
  }

  toHome(wait) {
    this.setSt('home');
    this.chargeT = wait;
  }

  startScratch() {
    const w = this.world;
    this.setSt('scratch');
    this.face(w.player);
    this.dustT = 0;
    Sound.sfx.hogGrunt();
    this.pop('Grrr\u00a0!', '#ff9a7a', 22, 64);
  }

  startRoll() {
    this.setSt('roll');
    this.speed = (330 + 40 * this.boss.phase) * this.k;
    this.dustT = 0;
    if (this.world.onScreen(this)) Sound.sfx.hogRoll();
  }

  // Bong ! Il se cogne (contre le bord, un bloc, ou Pépé Chêne).
  bump(intoKing) {
    const w = this.world;
    const B = this.boss;
    w.shake(5);
    this.hop(380);
    if (this.helmet > 0.5) {
      // avec son casque, même pas mal
      Sound.sfx.helmetTonk();
      this.pop('Tonk\u00a0! Même pas mal\u00a0!', '#ffe0a8', 20, 70);
      this.setSt('rebound');
      return;
    }
    Sound.sfx.hogBonk();
    this.pop('Bong\u00a0!', '#ffe27a', 26, 70);
    if (intoKing) {
      B.wobble = 0.6;
      B.squash = 0.6;
      B.leaves(4);
      const L = ['Aïe\u00a0! Ronchon, regarde devant toi\u00a0!', 'Ouille\u00a0! Mes racines\u00a0!', 'Hé\u00a0! Doucement, Ronchon\u00a0!'];
      if (B.state === 'fight' && !(B.say && B.say.t > 0)) B.speak(L[B.dizzies % L.length], 1.6);
    }
    this.dizzy(3.8 / this.k, false);
  }

  dizzy(time, again) {
    this.setSt('dizzy');
    this.timer = time;
    if (!again) this.boss.dizzies++;
    this.boss.tip = null;
  }

  // Les pouvoirs qui renversent (et l'étoile) : s'il ne peut pas se défendre, c'est un coup ; dans la première
  // manche, sinon, il tombe étourdi ; avec son casque, il rebondit.
  kill(type) {
    const B = this.boss;
    if (B.state !== 'fight') return false;
    if (this.open()) return B.hitWith(type === 'star' ? 'star' : 'bump', this);
    const busy = ['home', 'curl', 'scratch', 'back', 'roll', 'walk', 'rebound'];
    if (!busy.includes(this.state)) return false;
    if (B.phase === 0) {
      this.hop(380);
      Sound.sfx.hogBonk();
      this.dizzy(3.8 / this.k, false);
      return true;
    }
    if (this.state === 'roll') {
      this.bump(false);
      return true;
    }
    return false;
  }

  // Sauté dessus : quand il ne peut pas se défendre, c'est un coup ; sinon (voir stompable), Malice rebondit.
  stomp() {
    if (this.boss.hitWith('stomp', this)) return;
    if (this.state === 'friend' || this.state === 'hug') this.pop('Hi hi\u00a0!', '#ffd0e0', 18, 60);
  }

  // (en boule à sa place : les piquants, ça pique ; quand il fonce : on rebondit sans rien lui faire)
  stompable() {
    if (this.boss.state !== 'fight') return true;
    return this.open() || this.curled();
  }

  // (pendant le moment de grâce de Pépé Chêne, quand il vient de la repousser, Ronchon ne pique pas non plus)
  prickly() {
    return this.boss.state === 'fight' && this.boss.grace <= 0 && this.curled();
  }

  harmful() {
    return this.boss.state === 'fight' && this.boss.grace <= 0 && !this.dying && (this.state === 'roll' || this.curled());
  }

  // Étourdi (ou tout nu), on peut le pousser : il roule jusqu'à Pépé Chêne… Sinon, il repousse Malice en grognant.
  nudge(p) {
    if (this.boss.state !== 'fight' || this.nudgeT > 0) return;
    if (this.state === 'dizzy' || this.state === 'bald') {
      this.kick(Math.sign(this.px - p.cx) || 1);
      return;
    }
    if (this.state === 'hide' || p.invuln > 0 || p.hurtT > 0) return;
    this.nudgeT = 0.6;
    // (pendant le moment de grâce, Pépé Chêne vient de la repousser : toujours vers le milieu de l'arène, jamais
    // coincée entre eux deux)
    const d = this.boss.grace > 0 ? -1 : Math.sign(p.cx - this.px) || -1;
    p.vx = d * 280;
    p.vy = Math.min(p.vy, -260);
    p.onGround = false;
    p.platform = null;
    Sound.sfx.hogGrunt();
    this.pop('Grrr\u00a0!', '#ffd0a0', 18, 60);
  }

  // en roulade, Malice le pousse aussi
  rolledInto(p) {
    if (this.boss.state === 'fight' && (this.state === 'dizzy' || this.state === 'bald')) this.kick(p.rollDir || Math.sign(this.px - p.cx) || 1);
  }

  kick(d) {
    this.setSt('kicked');
    this.dir = d;
    this.speed = 560;
    this.nudgeT = 0.6;
    Sound.sfx.kick();
    this.pop('Roule, Ronchon\u00a0!', '#ffffff', 18, 60);
  }

  // Les chips au vinaigre : il éternue. Le caramel : il colle ses piquants.
  hitBy(kind) {
    const w = this.world;
    const B = this.boss;
    if (B.state !== 'fight' || !['home', 'curl', 'scratch', 'back', 'roll', 'walk', 'rebound', 'dizzy'].includes(this.state)) return;
    w.game.addScore(50);
    if (kind === 'chips') {
      this.setSt('sneeze');
      Sound.sfx.crunch();
      Sound.sfx.sneezeUp();
      this.pop('A… a…', '#d8ffb0', 22, 64);
    } else {
      this.setSt('glued');
      this.timer = w.diff.forever ? Infinity : 5 / this.k;
      this.glues++;
      // (le vieux conseil s'efface : le bon arrive, « saute-lui dessus », voir advise)
      B.tip = null;
      Sound.sfx.stick();
      this.pop('Collé\u00a0!', '#ffcf6a', 24, 64);
    }
  }

  // ATCHOUM ! Ses piquants s'envolent (et son casque aussi). (byKing : c'est Pépé Chêne qui a éternué)
  blowOff(byKing) {
    const w = this.world;
    if (byKing && !['home', 'curl', 'scratch', 'back', 'roll', 'walk', 'rebound', 'dizzy', 'sneeze'].includes(this.state)) return;
    if (!byKing) {
      Sound.sfx.sneeze();
      this.pop('ATCHOUM\u00a0!', '#ffffff', 28, 70);
    }
    Sound.sfx.spinesFly();
    this.sneezes++;
    this.spines = 0;
    // (le conseil des chips s'efface : le bon arrive, « saute-lui dessus », voir advise)
    this.boss.tip = null;
    for (let i = 0; i < 22; i++) {
      const a = rand(-Math.PI, 0);
      const sp = rand(200, 460);
      w.spawn({
        type: 'straw', x: this.px + rand(-14, 14), y: this.groundY - rand(16, 34), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        g: 1000, drag: 1.2, life: rand(0.7, 1.1), size: rand(7, 11), vr: rand(-12, 12), color: choose(['#5a3c26', '#ead6ae', '#6e4c30']),
      });
    }
    if (this.helmet > 0.5) this.loseHelmet();
    this.setSt('bald');
    this.hop(300);
    this.timer = w.diff.forever ? Infinity : 6 / this.k;
    this.pop(byKing ? 'Pépé\u00a0! Mes piquants\u00a0!' : 'Mes piquants\u00a0!', '#ffd0e0', 20, 90);
  }

  loseHelmet() {
    this.helmet = 0;
    this.capFly = { x: this.px, y: this.groundY - 40, vx: -this.dir * 120, vy: -520, rot: 0 };
    Sound.sfx.helmetTonk();
  }

  giveHelmet() {
    this.setSt('helmet');
    this.capY = -320;
  }

  updateCap(dt) {
    if (this.state === 'helmet') this.capY = Math.min(0, this.capY + (200 + this.stT * 900) * dt);
    const C = this.capFly;
    if (C) {
      C.vy += 1600 * dt;
      C.x += C.vx * dt;
      C.y += C.vy * dt;
      C.rot += dt * 9;
      if (C.y > this.groundY + 40) this.capFly = null;
    }
  }

  // Pépé Chêne vient de perdre une vie (on a touché Ronchon) : pouic !
  ouchHit() {
    const w = this.world;
    this.setSt('ouch');
    this.hop(520);
    Sound.sfx.stomp();
    this.pop('Pouic\u00a0!', '#ffe0b0', 24, 70);
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'spark', x: this.px, y: this.groundY - 30, vx: rand(-180, 180), vy: rand(-240, -60), life: 0.45, size: rand(4, 7), color: '#fff6a0' });
    }
  }

  hide() {
    if (this.state === 'hide') return;
    this.setSt('hide');
    this.speak('Je suis tout nu\u00a0! Je me cache\u00a0!', 1.8);
  }

  // Pépé Chêne est battu : Ronchon redevient gentil (voir 'friend').
  leave() {
    this.setSt('friend');
    this.helmet = 0;
  }

  shotBox() {
    if (this.state === 'hide' || this.state === 'friend' || this.state === 'hug') return { x: this.x, y: -9999, w: 0, h: 0 };
    return { x: this.x, y: this.y - 18, w: this.w, h: this.h + 18 };
  }

  box() {
    const ball = this.curl > 0.5;
    this.w = ball ? RONCHON_BALL : RONCHON_W;
    this.h = ball ? RONCHON_BALL : RONCHON_H;
    this.x = this.px - this.w / 2;
    this.y = this.groundY + this.hopY - this.h;
    this.onGround = this.hopY >= 0;
    this.stompDepth = ball ? 18 : 24;
  }

  draw(ctx) {
    const w = this.world;
    const B = this.boss;
    const st = this.state;
    if (this.onGround) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ellipsePath(ctx, this.px, this.groundY + 1, 26, 5);
      ctx.fill();
    }
    CheneArt.ronchon(ctx, this.px, this.groundY + this.hopY, {
      t: this.t, dir: this.dir, curl: this.curl, rot: this.rot, spines: this.spines, helmet: this.helmet,
      capY: st === 'helmet' ? this.capY : null, blush: this.blush, sneeze: this.sneezeK, scratch: this.scratchK,
      moving: this.speed > 0 && st !== 'roll' && st !== 'kicked', phase: this.legPhase, dizzy: st === 'dizzy' || st === 'kicked',
      grumpy: B.state !== 'beaten' && B.state !== 'friend' && st !== 'bald' && st !== 'hide', sleepy: st === 'guard',
      hug: st === 'hug', flowers: this.flowers, shy: st === 'bald' || st === 'hide', ouch: st === 'ouch',
    });
    if (st === 'glued') {
      const fade = this.timer === Infinity ? 1 : Math.min(1, this.timer / 1.5);
      const blink = this.timer < 2 && Math.floor(this.timer * 8) % 2 === 0 ? 0.5 : 1;
      Art.caramelGoo(ctx, this.px, this.groundY + 1, this.w, 20, this.t, fade * blink);
    }
    const C = this.capFly;
    if (C) {
      ctx.save();
      ctx.translate(C.x, C.y);
      ctx.rotate(C.rot);
      CheneArt.cap(ctx, 0, 0, 1);
      ctx.restore();
    }
    if (this.say && this.say.t > 0) w.bubble(this.px, this.groundY - 74, this.say.text, Boss.fade(this.say));
  }
}

// ======================= LES GLANDS QUI TOMBENT =======================
// Un gland tremble au bout de sa brindille, sous les feuilles du haut (son ombre grandit par terre)… puis il tombe.
// Les petits (deux premières manches) se cassent en touchant le sol ; les gros (la dernière) rebondissent et attendent
// par terre : on saute dessus, et ils repartent sur le nez de Pépé Chêne.
class CheneGland extends Enemy {
  constructor(world, boss, x, big, warn) {
    const r = big ? 17 : 11;
    super(world, x - r, CHENE_HANG - r, r * 2, r * 2.3);
    this.boss = boss;
    this.ouch = 'head'; // une bosse sous la casquette (voir OUCH)
    this.big = big;
    this.r = r;
    this.gx = x;
    this.gy = CHENE_HANG;
    this.vy = 0;
    this.rot = 0;
    this.vr = 0;
    this.state = 'hang';
    this.stT = 0;
    this.warn = warn;
    this.bounces = 0;
    this.rest = world.diff.forever ? 8 : 4.8 / world.diff.bossK;
    this.from = null;
    // (les chips et le caramel passent à travers : ils vont jusqu'à Pépé Chêne ou Ronchon, voir Throwable)
    this.passThrow = true;
  }

  get groundY() { return this.boss.groundY; }

  ai(dt) {
    const w = this.world;
    const B = this.boss;
    this.stT += dt;
    switch (this.state) {
      case 'hang':
        // il tremble de plus en plus
        this.rot = Math.sin(this.t * 34) * 0.22 * Math.min(1, this.stT / this.warn + 0.3);
        if (this.stT >= this.warn) {
          this.state = 'fall';
          this.stT = 0;
          this.vy = 60;
          if (w.onScreen(this, 60)) Sound.sfx.acornFall();
        }
        break;
      case 'fall': {
        this.vy += (this.big ? 1300 : 1500) * dt;
        this.gy += this.vy * dt;
        this.rot += dt * 2;
        const bottom = this.groundY - this.r * 1.15;
        if (this.gy >= bottom) {
          this.gy = bottom;
          this.land();
        }
        break;
      }
      case 'bounce': {
        this.vy += 1500 * dt;
        this.gy += this.vy * dt;
        this.gx = clamp(this.gx + this.vx * dt, B.arena.x0 + this.r, B.x - this.r);
        this.rot += this.vr * dt;
        const bottom = this.groundY - this.r * 1.15;
        if (this.gy >= bottom) {
          this.gy = bottom;
          this.bounces++;
          if (this.bounces >= 2) {
            this.state = 'rest';
            this.stT = 0;
            this.vy = 0;
            this.vx = 0;
          } else {
            this.vy = -150;
            this.vr *= 0.5;
            Sound.sfx.acornLand(true);
          }
        }
        break;
      }
      case 'rest':
        // par terre, il se balance doucement (et brille : on peut le renvoyer !)
        this.rot = approach(this.rot, Math.sin(this.t * 4) * 0.12, dt * 3);
        if (this.stT > this.rest) {
          // (il s'enfonce dans le bois du plancher et disparaît)
          this.dead = true;
          w.puff(this.gx, this.groundY - 8, '#e8d8b0');
        }
        break;
      case 'back': {
        // il repart sur le nez de Pépé Chêne, en faisant un grand arc
        const k = Math.min(1, this.stT / 0.55);
        const n = B.nosePos();
        this.gx = lerp(this.from.x, n.x, k);
        this.gy = lerp(this.from.y, n.y, k) - Math.sin(k * Math.PI) * 120;
        this.rot += dt * 16;
        if (k >= 1) this.hitNose();
        break;
      }
      default: break;
    }
    this.box();
  }

  land() {
    const w = this.world;
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'dust', x: this.gx + rand(-12, 12), y: this.groundY, vx: rand(-90, 90), vy: rand(-80, -20), life: 0.4, size: rand(4, 7) });
    }
    if (!this.big) {
      // crac ! il se casse en deux
      Sound.sfx.acornLand(false);
      this.crack();
      return;
    }
    Sound.sfx.acornLand(true);
    w.shake(3);
    this.state = 'bounce';
    this.vy = -320;
    this.vx = rand(-40, 40);
    this.vr = rand(-6, 6);
  }

  crack() {
    const w = this.world;
    this.dead = true;
    for (let i = 0; i < 6; i++) {
      w.spawn({ type: 'debris', x: this.gx + rand(-6, 6), y: this.gy, vx: rand(-200, 200), vy: rand(-380, -140), g: 1500, life: 0.6, size: rand(4, 7), color: choose(['#b8792e', '#7a5a32', '#e8c890']), vr: rand(-12, 12) });
    }
  }

  // Sauté dessus (ou renversé par un pouvoir) : un gros gland repart sur le nez de Pépé Chêne ; un petit se casse.
  sendBack() {
    const w = this.world;
    if (this.state === 'back' || this.state === 'hang') return false;
    if (!this.big) {
      w.popText(this.gx, this.gy - 20, 'Crac\u00a0!', '#ffcf8a', 20);
      this.crack();
      return true;
    }
    this.state = 'back';
    this.stT = 0;
    this.from = { x: this.gx, y: this.gy };
    Sound.sfx.acornKick();
    w.popText(this.gx, this.gy - 26, 'Hop\u00a0!', '#ffffff', 22);
    return true;
  }

  hitNose() {
    const w = this.world;
    const B = this.boss;
    const n = B.nosePos();
    this.dead = true;
    if (B.hitWith('acorn', this)) {
      // (le dernier coup : TOC ! voir onBeaten)
    } else {
      Sound.sfx.acornLand(true);
      w.popText(n.x, n.y - 30, 'Toc\u00a0!', '#ffe0a8', 20);
    }
    B.nose = 1;
    for (let i = 0; i < 8; i++) {
      w.spawn({ type: 'debris', x: n.x, y: n.y, vx: rand(-260, 60), vy: rand(-380, -100), g: 1400, life: 0.7, size: rand(5, 8), color: choose(['#b8792e', '#7a5a32', '#e8c890']), vr: rand(-12, 12) });
    }
  }

  stomp() {
    this.sendBack();
  }

  kill() {
    return this.sendBack();
  }

  // (le caramel ou les chips ne lui font rien : voir passThrow)
  hitBy() {}

  // dans l'arbre, il ne touche personne ; par terre non plus (seulement en tombant)
  harmful() {
    return this.state === 'fall';
  }

  // (par terre, on le pousse un peu en marchant dessus)
  nudge(p) {
    if (this.state !== 'rest') return;
    const d = Math.sign(this.gx - p.cx) || 1;
    this.gx = clamp(this.gx + d * 90 * STEP, this.boss.arena.x0 + this.r, this.boss.x - this.r);
    this.rot += d * 0.05;
  }

  leave() {
    if (this.state === 'back') return;
    this.dead = true;
    this.world.puff(this.gx, this.gy, '#e8d8b0');
  }

  shotBox() {
    if (this.state === 'hang') return { x: this.x, y: -9999, w: 0, h: 0 };
    return this;
  }

  // (par terre, sa boîte est plus large et plus haute que lui : on le touche facilement en sautant dessus)
  box() {
    if (this.state === 'rest' || this.state === 'bounce') {
      this.w = 52;
      this.h = this.r * 2.3 + 14;
      this.stompDepth = 30;
    } else {
      this.w = this.r * 2;
      this.h = this.r * 2.3;
      this.stompDepth = 18;
    }
    this.x = this.gx - this.w / 2;
    this.y = this.gy + this.r * 1.15 - this.h;
    this.onGround = this.state === 'rest';
  }

  get cx() { return this.gx; }

  draw(ctx) {
    const B = this.boss;
    if (this.state === 'hang' || this.state === 'fall') {
      // son ombre par terre, qui grandit
      const k = this.state === 'hang' ? Math.min(1, this.stT / this.warn) * 0.6 : 0.6 + Math.min(0.4, (this.gy - CHENE_HANG) / 600);
      ctx.fillStyle = `rgba(40,20,0,${0.2 + 0.3 * k})`;
      ellipsePath(ctx, this.gx, B.groundY + 1, this.r * (0.9 + 1.2 * k), 3 + 3 * k);
      ctx.fill();
    } else if (this.state !== 'back') {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ellipsePath(ctx, this.gx, B.groundY + 1, this.r, 4);
      ctx.fill();
    }
    if (this.state === 'hang') CheneArt.twig(ctx, this.gx, this.gy - this.r * 0.9, this.rot, this.t);
    const blink = this.state === 'rest' && this.stT > this.rest - 1.2 && Math.floor(this.stT * 8) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.5;
    CheneArt.acorn(ctx, this.gx, this.gy, this.r, this.rot, { shine: this.state === 'rest' ? 1 : 0, t: this.t });
    ctx.globalAlpha = 1;
  }
}

// ======================= LES RACINES QUI SORTENT DU SOL =======================
// La terre se soulève et tremble (avec un grondement)… puis une racine sort d'un coup, tout droit, et repart sous le
// plancher. Elle pique les fesses (voir OUCH.butt).
class CheneRacine extends Enemy {
  constructor(world, boss, x, warn) {
    super(world, x - 16, boss.groundY + 20, 32, 1);
    this.boss = boss;
    this.ouch = 'butt';
    this.rx = x;
    this.state = 'warn';
    this.stT = 0;
    this.warn = warn;
    this.len = 0;
    this.dustT = 0;
    this.seed = rand(0, 10);
    this.passThrow = true;
  }

  get groundY() { return this.boss.groundY; }

  ai(dt) {
    const w = this.world;
    this.stT += dt;
    switch (this.state) {
      case 'warn':
        // la terre se soulève et tremble, des miettes de bois sautent
        this.dustT -= dt;
        if (this.dustT <= 0) {
          this.dustT = 0.09;
          w.spawn({ type: 'debris', x: this.rx + rand(-16, 16), y: this.groundY - 2, vx: rand(-60, 60), vy: rand(-220, -90), g: 1200, life: 0.4, size: rand(3, 5), color: choose(['#e0c090', '#b8885a', '#9a7048']), vr: rand(-10, 10) });
        }
        if (this.stT >= this.warn) {
          this.state = 'up';
          this.stT = 0;
          if (w.onScreen(this, 200)) Sound.sfx.rootBurst();
          w.shake(4);
          for (let i = 0; i < 8; i++) {
            w.spawn({ type: 'debris', x: this.rx + rand(-14, 14), y: this.groundY - 4, vx: rand(-200, 200), vy: rand(-420, -160), g: 1400, life: 0.6, size: rand(4, 8), color: choose(['#7a5232', '#5a3a22', '#9a7048']), vr: rand(-12, 12) });
          }
        }
        break;
      case 'up':
        this.len = Math.min(110, this.len + dt * 900);
        if (this.stT > 0.8) {
          this.state = 'down';
          this.stT = 0;
        }
        break;
      case 'down':
        this.len = Math.max(0, this.len - dt * 380);
        if (this.len <= 0) this.dead = true;
        break;
      default: break;
    }
    this.box();
  }

  box() {
    this.x = this.rx - 16;
    this.w = 32;
    if (this.len < 4) {
      this.y = this.groundY + 20;
      this.h = 1;
    } else {
      this.y = this.groundY - this.len;
      this.h = this.len;
    }
  }

  harmful() {
    return this.state === 'up' && this.len > 30;
  }

  // sautée dessus, ou renversée par un pouvoir : elle rentre sous terre
  retract() {
    if (this.state !== 'up') return false;
    this.state = 'down';
    this.stT = 0;
    return true;
  }

  stomp() { this.retract(); }

  kill() { return this.retract(); }

  hitBy() {}

  leave() {
    this.dead = true;
    if (this.len > 4) this.world.puff(this.rx, this.groundY - this.len / 2, '#c8a878');
  }

  shotBox() {
    return this.len > 4 ? this : { x: this.x, y: -9999, w: 0, h: 0 };
  }

  get cx() { return this.rx; }

  draw(ctx) {
    if (this.state === 'warn') CheneArt.mound(ctx, this.rx, this.groundY, Math.min(1, this.stT / this.warn), this.t);
    else CheneArt.root(ctx, this.rx, this.groundY, this.len, this.seed, this.t);
  }
}

// ======================= LES DESSINS =======================
// Pépé Chêne : un vieux tronc tout ridé (des racines, de la mousse, un champignon-étagère), ses bras en branches, une
// couronne de feuilles et de petits glands, de gros sourcils de mousse, une barbe et une moustache de lichen, et son
// nez en nœud de bois. Ronchon : un gros hérisson ronchon (le sourcil froncé), avec un casque en cupule de gland.
// Les glands, les racines, les feuilles du haut de l'arène, le mur de lianes, les fleurs et le petit champignon.
const CheneArt = (() => {
  const TAU = Math.PI * 2;
  const paint = (ctx, fill, line, lw) => Art.paint(ctx, fill, line, lw);
  const BARK = '#7b5434';
  const BARK_DARK = '#5a3a22';
  const BARK_LINE = '#3a2414';
  const MOSS = '#6f9a3c';
  const MOSS_LIGHT = '#9cc455';
  const LICHEN = '#d4dcae';
  const LICHEN_LINE = '#7c8a58';
  const FLOWER = ['#ff8ab8', '#ffd23a', '#b48cff', '#ffffff', '#ff9a5a'];

  // ---------- Pépé Chêne ----------
  // Son tronc (avec ses racines, sa mousse et son champignon) ne change jamais : dessiné une fois.
  let trunkImg = null;
  const TW = 260;
  const TH = 240;
  const TX = 130;
  const TY = 228;
  function trunkSprite() {
    if (trunkImg) return trunkImg;
    trunkImg = document.createElement('canvas');
    trunkImg.width = TW;
    trunkImg.height = TH;
    const ctx = trunkImg.getContext('2d');
    ctx.translate(TX, TY);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // les racines qui s'étalent par terre
    const roots = [[-1, 98, 26, 0.3], [-1, 74, 18, 0.8], [1, 92, 24, 0.5], [1, 64, 16, 1.2]];
    for (const [s, len, th, seed] of roots) {
      ctx.beginPath();
      ctx.moveTo(s * 30, -th - 8);
      ctx.quadraticCurveTo(s * (40 + len * 0.3), -th * 0.6 - 2 + seed * 3, s * len, -2);
      ctx.lineTo(s * (len - 10), 1);
      ctx.quadraticCurveTo(s * 40, 0, s * 20, 0);
      ctx.closePath();
      paint(ctx, BARK_DARK, BARK_LINE, 1.6);
    }
    // le tronc
    ctx.beginPath();
    ctx.moveTo(-58, 0);
    ctx.bezierCurveTo(-52, -40, -54, -110, -50, -150);
    ctx.bezierCurveTo(-48, -178, -30, -194, 0, -194);
    ctx.bezierCurveTo(30, -194, 48, -178, 50, -150);
    ctx.bezierCurveTo(54, -110, 52, -40, 60, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(-60, 0, 60, 0);
    g.addColorStop(0, '#94683f');
    g.addColorStop(0.45, BARK);
    g.addColorStop(1, '#5e3e24');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // les rides de l'écorce
    ctx.strokeStyle = 'rgba(58,36,20,0.55)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 8; i++) {
      const x = -48 + i * 13.5;
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(i * 2.1) * 4, 2);
      for (let y = 0; y > -200; y -= 20) ctx.lineTo(x + Math.sin(i * 1.7 + y * 0.05) * 4, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,230,190,0.13)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const x = -42 + i * 9;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.lineTo(x + Math.sin(i) * 3, -150);
      ctx.stroke();
    }
    // un trou dans le bois, en bas
    ellipsePath(ctx, 20, -40, 9, 13, 0);
    paint(ctx, '#2e1a0c', BARK_LINE, 1.2);
    // la mousse sur ses épaules et au pied
    ctx.fillStyle = MOSS;
    for (const [x, y, r] of [[-34, -176, 16], [-14, -188, 14], [10, -188, 15], [32, -178, 14], [44, -160, 10], [-46, -158, 9], [-40, -6, 12], [44, -8, 10]]) {
      circlePath(ctx, x, y, r);
      ctx.fill();
    }
    ctx.fillStyle = MOSS_LIGHT;
    for (const [x, y, r] of [[-30, -182, 7], [12, -193, 6], [34, -184, 6], [-42, -10, 5]]) {
      circlePath(ctx, x, y, r);
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-58, 0);
    ctx.bezierCurveTo(-52, -40, -54, -110, -50, -150);
    ctx.bezierCurveTo(-48, -178, -30, -194, 0, -194);
    ctx.bezierCurveTo(30, -194, 48, -178, 50, -150);
    ctx.bezierCurveTo(54, -110, 52, -40, 60, 0);
    ctx.strokeStyle = BARK_LINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    // un champignon-étagère sur son flanc
    for (const [y, w] of [[-62, 26], [-52, 18]]) {
      ctx.beginPath();
      ctx.moveTo(52, y);
      ctx.quadraticCurveTo(52 + w, y - 6, 52 + w * 0.9, y + 4);
      ctx.quadraticCurveTo(52 + w * 0.5, y + 8, 52, y + 5);
      ctx.closePath();
      paint(ctx, '#e8b860', '#7a5420', 1.2);
    }
    return trunkImg;
  }

  // une feuille de chêne (avec ses lobes), la tige en (0, 0), vers le haut
  function oakLeaf(ctx, len, fill, line) {
    const w = len * 0.36;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i <= 4; i++) {
      const y = -len * (0.15 + i * 0.2);
      ctx.quadraticCurveTo(-w * (i % 2 ? 1.15 : 0.7), y + len * 0.08, -w * (0.55 + (i % 2) * 0.3) * (1 - i * 0.12), y);
    }
    ctx.quadraticCurveTo(0, -len * 1.08, w * 0.45, -len * 0.95);
    for (let i = 4; i >= 0; i--) {
      const y = -len * (0.15 + i * 0.2);
      ctx.quadraticCurveTo(w * (i % 2 ? 1.15 : 0.7), y + len * 0.04, w * (0.55 + (i % 2) * 0.3) * (1 - i * 0.12), y + len * 0.1);
    }
    ctx.closePath();
    paint(ctx, fill, line, 1.2);
    ctx.strokeStyle = 'rgba(40,70,20,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len * 0.9);
    ctx.stroke();
  }

  // un bras en branche, de l'épaule (x, y) ; a : son angle (0 : à l'horizontale, vers dehors ; positif : vers le bas) ;
  // s : -1 le bras de devant (à gauche), 1 celui de derrière
  function branchArm(ctx, x, y, a, s, t, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, 1);
    ctx.rotate(a);
    const L = 48;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.quadraticCurveTo(L * 0.5, -10 + Math.sin(t * 2) * 2, L, -3);
    ctx.lineTo(L, 3);
    ctx.quadraticCurveTo(L * 0.5, 6, -4, 8);
    ctx.closePath();
    paint(ctx, BARK, BARK_LINE, 1.5);
    // les doigts (trois brindilles) et des feuilles
    for (const [fa, fl] of [[-0.6, 18], [0, 22], [0.6, 17]]) {
      const ex = L + Math.cos(fa) * fl;
      const ey = Math.sin(fa) * fl;
      ctx.strokeStyle = BARK_LINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(L - 2, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = BARK;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(fa + Math.PI / 2 + Math.sin(t * 3 + fa * 4) * 0.15);
      oakLeaf(ctx, 13, fa ? '#6aa83a' : '#7cbc44', '#2e5418');
      ctx.restore();
    }
    if (o && o.sticky) {
      ctx.fillStyle = '#d98a2e';
      circlePath(ctx, L + 8, 0, 11);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,230,160,0.7)';
      circlePath(ctx, L + 5, -4, 3);
      ctx.fill();
    }
    if (o && o.blossom) {
      ctx.fillStyle = FLOWER[0];
      for (let i = 0; i < 5; i++) {
        circlePath(ctx, L + 18 + Math.cos(i * 1.26) * 4, Math.sin(i * 1.26) * 4, 3);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd23a';
      circlePath(ctx, L + 18, 0, 2.2);
      ctx.fill();
    }
    ctx.restore();
  }

  // sa couronne de feuilles (et ses petits glands), posée sur sa tête en (0, 0)
  function crown(ctx, o) {
    const t = o.t;
    // les feuilles, en éventail (de grandes feuilles de chêne, le bout doré : c'est une couronne de roi !)
    const L = [24, 32, 36, 42, 36, 32, 24];
    for (let i = 0; i < 7; i++) {
      const a = -1.05 + i * (2.1 / 6);
      ctx.save();
      ctx.translate(Math.sin(a) * 26, 2 - Math.cos(a) * 4);
      ctx.rotate(a + Math.sin(t * 1.5 + i) * 0.03);
      oakLeaf(ctx, L[i], i % 2 ? '#5d9a36' : '#7cb342', '#24481a');
      ctx.fillStyle = '#ffd65a';
      circlePath(ctx, 0, -L[i] * 1.0, 3.2);
      paint(ctx, '#ffd65a', '#9a6a10', 1);
      ctx.restore();
    }
    // le bandeau doré, tressé de brindilles
    roundRectPath(ctx, -40, -6, 80, 14, 7);
    paint(ctx, '#e0a83a', '#6a4210', 1.6);
    ctx.strokeStyle = 'rgba(106,66,16,0.55)';
    ctx.lineWidth = 1.2;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 9 - 3, -5);
      ctx.lineTo(i * 9 + 3, 7);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,245,200,0.5)';
    roundRectPath(ctx, -34, -4, 68, 3, 1.5);
    ctx.fill();
    // trois petits glands, comme des pierres précieuses
    for (const x of [-22, 0, 22]) acorn(ctx, x, 2, 6, 0, {});
    // des fleurs, à la fin
    if (o.flowers > 0) {
      for (const [x, c] of [[-30, 0], [12, 1], [32, 2]]) flower(ctx, x, -4, o.flowers * 0.6, c, t, true);
    }
  }

  // o : t, eyes (0 : fermés, 1 : ouverts), arm / armBack (les angles des bras), nose (0 à 1 : tout rouge),
  //     grumpy (les sourcils froncés), happy (les joues roses, le sourire), squash, wobble, crown (la couronne penche),
  //     mouth (la bouche ouverte), sneeze (a… a… : le nez qui gonfle), sticky (les mains collées), look / lookY (vers
  //     Malice), dizzy (les yeux qui tournent), sleep, flowers
  function king(ctx, x, y, o) {
    const t = o.t;
    ctx.save();
    ctx.translate(x, y);
    if (o.wobble) ctx.rotate(o.wobble * 0.05);
    const breath = Math.sin(t * (o.sleep ? 1.6 : 2.2)) * (o.sleep ? 0.02 : 0.01);
    ctx.scale(1 + o.squash * 0.05 - breath * 0.5, 1 - o.squash * 0.07 + breath);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // le bras de derrière (derrière le tronc)
    branchArm(ctx, 46, -76, o.armBack, 1, t, { sticky: o.sticky, blossom: o.flowers > 0.5 });
    ctx.drawImage(trunkSprite(), -TX, -TY);
    // les joues
    if (o.happy > 0) {
      ctx.fillStyle = `rgba(255,120,130,${0.45 * o.happy})`;
      ellipsePath(ctx, -44, -126, 9, 6, 0);
      ctx.fill();
      ellipsePath(ctx, 8, -127, 8, 5.5, 0);
      ctx.fill();
    }
    face(ctx, o);
    // la couronne
    ctx.save();
    ctx.translate(-4, -190);
    ctx.rotate(o.crown * 0.35 - 0.06);
    crown(ctx, o);
    ctx.restore();
    // le bras de devant
    branchArm(ctx, -48, -70, o.arm, -1, t + 1, { sticky: o.sticky, blossom: o.flowers > 0.5 });
    ctx.restore();
  }

  // (le nez en nœud de bois, au milieu de la figure)
  const NOSE = { x: -20, y: -120, r: 13 };

  function face(ctx, o) {
    const t = o.t;
    // des rides au coin des yeux et sur le front (il est très vieux)
    ctx.strokeStyle = 'rgba(46,26,12,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const [x, y, s] of [[-48, -144, -1], [16, -146, 1]]) {
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(x, y + i * 5);
        ctx.lineTo(x + s * 7, y + i * 7);
      }
    }
    ctx.moveTo(-28, -170);
    ctx.quadraticCurveTo(-16, -174, -4, -170);
    ctx.moveTo(-24, -176);
    ctx.quadraticCurveTo(-16, -179, -8, -176);
    ctx.stroke();
    // les yeux (de grosses paupières de vieux monsieur ; fermés quand il dort)
    const blink = !o.sleep && (t % 4.3) < 0.12;
    const gr = o.grumpy || 0;
    for (const [ex, er, s] of [[-34, 10.5, 1], [-2, 9.5, -1]]) {
      const ey = -144;
      if (o.sleep || o.eyes < 0.15 || blink) {
        ctx.strokeStyle = BARK_LINE;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(ex, ey - 1, er * 0.8, 0.2, Math.PI - 0.2);
        ctx.stroke();
        continue;
      }
      const open = Math.min(1, o.eyes);
      ellipsePath(ctx, ex, ey, er, er * 1.12, 0);
      paint(ctx, '#fffdf2', BARK_LINE, 1.6);
      if (o.dizzy) {
        ctx.strokeStyle = '#3a2414';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = t * 10 + i * 0.7;
          const r = i * 0.45;
          if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
        }
        ctx.stroke();
      } else {
        const lx = clamp(o.look || 0, -1, 1) * er * 0.35;
        const ly = clamp(o.lookY || 0, -1, 1) * er * 0.3;
        circlePath(ctx, ex + lx, ey + ly + 2, er * 0.48);
        paint(ctx, '#2a1a10', null);
        ctx.fillStyle = '#ffffff';
        circlePath(ctx, ex + lx - 1.8, ey + ly, er * 0.17);
        ctx.fill();
      }
      // la paupière : à moitié baissée (il est fatigué), penchée quand il est fâché, levée quand il a peur
      const lid = clamp(0.42 + (1 - open) * 0.6 - (o.sneeze || 0) * 0.2 - (o.startle || 0) * 0.35, 0, 0.95);
      ctx.save();
      ellipsePath(ctx, ex, ey, er + 0.5, er * 1.12 + 0.5, 0);
      ctx.clip();
      ctx.beginPath();
      const top = ey - er * 1.2;
      const edge = top + er * 2.3 * lid;
      ctx.moveTo(ex - er - 2, top - 2);
      ctx.lineTo(ex + er + 2, top - 2);
      ctx.lineTo(ex + er + 2, edge + s * gr * 4);
      ctx.lineTo(ex - er - 2, edge - s * gr * 4);
      ctx.closePath();
      paint(ctx, '#8a5e38', null);
      ctx.strokeStyle = BARK_LINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex - er - 2, edge - s * gr * 4);
      ctx.lineTo(ex + er + 2, edge + s * gr * 4);
      ctx.stroke();
      ctx.restore();
    }
    // les gros sourcils de mousse, tout ébouriffés (froncés quand il est fâché, levés quand il est content)
    const up = (o.happy || 0) * 4 + (o.sneeze || 0) * 4;
    for (const [x0, x1, s] of [[-52, -20, 1], [-14, 14, -1]]) {
      const inner = s > 0 ? x1 : x0;
      const outer = s > 0 ? x0 : x1;
      const yIn = -158 + gr * 6 - up;
      const yOut = -163 - gr * 2 - up;
      ctx.beginPath();
      ctx.moveTo(outer - s * 3, yOut + 6);
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const bx = lerp(outer, inner, k);
        const by = lerp(yOut, yIn, k) - 6;
        ctx.lineTo(bx - s * 2, by - 4 - (i % 2) * 4);
        ctx.lineTo(bx, by);
      }
      ctx.lineTo(inner + s * 2, yIn + 3);
      ctx.quadraticCurveTo((inner + outer) / 2, lerp(yOut, yIn, 0.5) + 6, outer - s * 3, yOut + 6);
      ctx.closePath();
      paint(ctx, '#b4c290', '#56643a', 1.4);
    }
    // la barbe de lichen, longue et ondulée
    ctx.beginPath();
    ctx.moveTo(-52, -104);
    ctx.quadraticCurveTo(-60, -76, -46, -54);
    for (let i = 0; i < 6; i++) {
      const bx = -46 + i * 11;
      const sway = Math.sin(t * 1.8 + i * 0.9) * 1.6;
      ctx.quadraticCurveTo(bx + 4 + sway, -40 - (i % 2 ? 0 : 8) + (i === 2 || i === 3 ? 6 : 0), bx + 11, -52 + (i % 2) * 2);
    }
    ctx.quadraticCurveTo(26, -76, 14, -104);
    ctx.closePath();
    paint(ctx, '#c6d0a0', LICHEN_LINE, 1.4);
    ctx.strokeStyle = 'rgba(124,138,88,0.6)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const bx = -42 + i * 11;
      ctx.moveTo(bx, -92);
      ctx.quadraticCurveTo(bx + 3, -72, bx + 1, -56);
    }
    ctx.stroke();
    // la bouche (on la voit quand il parle, ronfle ou éternue ; un sourire quand il est content)
    const m = o.mouth || 0;
    if (m > 0.05) {
      ellipsePath(ctx, -20, -96, 8 + m * 3, 2 + m * 7, 0);
      paint(ctx, '#3a1408', BARK_LINE, 1.2);
      ctx.fillStyle = '#c84a4a';
      ellipsePath(ctx, -20, -96 + m * 4, 5 + m * 2, 1 + m * 3, 0);
      ctx.fill();
    } else if (o.happy > 0.3) {
      ctx.strokeStyle = BARK_LINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-20, -102, 9, 0.5, Math.PI - 0.5);
      ctx.stroke();
    }
    // la grosse moustache, qui frise au bout
    for (const s of [1, -1]) {
      const bx = -20;
      ctx.beginPath();
      ctx.moveTo(bx, -110);
      ctx.bezierCurveTo(bx - s * 14, -116, bx - s * 30, -110, bx - s * 34, -98 + Math.sin(t * 2.4) * 1);
      ctx.bezierCurveTo(bx - s * 36, -90, bx - s * 30, -86, bx - s * 27, -92);
      ctx.bezierCurveTo(bx - s * 24, -98, bx - s * 14, -96, bx, -100);
      ctx.closePath();
      paint(ctx, LICHEN, LICHEN_LINE, 1.4);
    }
    // le nez en nœud de bois (il gonfle avant d'éternuer, et rougit quand un gland le touche)
    const nr = NOSE.r + (o.sneeze || 0) * 4;
    const nx = NOSE.x;
    const ny = NOSE.y;
    ctx.fillStyle = 'rgba(40,20,8,0.3)';
    ellipsePath(ctx, nx + 3, ny + nr * 0.75, nr * 0.9, nr * 0.35, 0);
    ctx.fill();
    ellipsePath(ctx, nx, ny, nr * 1.05, nr, 0);
    const ng = ctx.createRadialGradient(nx - 4, ny - 5, 2, nx, ny, nr * 1.05);
    ng.addColorStop(0, '#b4885a');
    ng.addColorStop(1, '#6b4526');
    ctx.fillStyle = ng;
    ctx.fill();
    ctx.strokeStyle = BARK_LINE;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(58,36,20,0.55)';
    ctx.lineWidth = 1.3;
    for (const r of [nr * 0.62, nr * 0.32]) {
      ellipsePath(ctx, nx + 1, ny + 1, r * 1.05, r * 0.85, 0.3);
      ctx.stroke();
    }
    if (o.nose > 0.02) {
      ctx.fillStyle = `rgba(255,60,60,${0.65 * o.nose})`;
      ellipsePath(ctx, nx, ny, nr * 1.05, nr, 0);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,240,210,0.5)';
    ellipsePath(ctx, nx - 5, ny - 5, 4, 2.5, -0.5);
    ctx.fill();
    // les narines qui frémissent (a… a…)
    if (o.sneeze > 0.1) {
      ctx.fillStyle = '#2a1408';
      for (const dx of [-5, 5]) {
        ellipsePath(ctx, nx + dx, ny + nr * 0.6, 2.4 + o.sneeze * 1.5, 1.5 + o.sneeze, 0);
        ctx.fill();
      }
    }
  }

  // ---------- Ronchon ----------
  // Ronchon, les pieds en (x, y). o : t, dir, curl (0 : déroulé, 1 : en boule), rot (en boule, il tourne), spines
  // (ses piquants, 0 : tout nu), helmet (son casque), capY (le casque qui lui tombe dessus), blush, sneeze (a… a…),
  // scratch (il gratte le sol), moving, phase (les pattes), dizzy, grumpy, sleepy, hug, flowers, shy, ouch
  const S = 1.45;
  function ronchon(ctx, x, y, o) {
    const t = o.t;
    const dir = o.dir || 1;
    const k = clamp(o.curl || 0, 0, 1);
    const line = '#2e1c10';
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (k > 0.5) {
      // en boule : il roule
      ctx.translate(0, -RONCHON_BALL / 2);
      ctx.rotate(o.rot || 0);
      ctx.scale(dir * S, S);
      spineBall(ctx, 16.5, o.spines, t);
      ctx.restore();
      if (o.dizzy) dizzyStars(ctx, x, y - RONCHON_BALL - 6, t);
      return;
    }
    ctx.scale(dir * S, S);
    const puff = 1 + (o.sneeze || 0) * 0.12;
    if (o.ouch) ctx.rotate(Math.sin(t * 30) * 0.08);
    // les petites pattes (la patte avant gratte le sol)
    const ph = o.moving ? o.phase || 0 : 0;
    ctx.fillStyle = '#4a3020';
    const legs = [[-11, 0], [-4, Math.PI], [6, Math.PI * 0.5], [13, Math.PI * 1.5]];
    legs.forEach(([fx, s], i) => {
      let lx = fx + Math.cos(ph + s) * 1.6;
      let ly = -2.2 - (o.moving ? Math.max(0, Math.sin(ph + s)) * 2.5 : 0);
      if (o.scratch && i === 3) {
        lx = 13 + Math.sin(t * 22) * 4;
        ly = -3 - Math.abs(Math.cos(t * 22)) * 2;
      }
      if (o.hug && i >= 2) {
        // les pattes avant tendues pour un câlin
        lx = 16 + i * 2;
        ly = -18 - (i - 2) * 5 + Math.sin(t * 6 + i) * 1.5;
      }
      ellipsePath(ctx, lx, ly, 3.6, 2.4, 0);
      ctx.fill();
    });
    ctx.save();
    ctx.translate(0, -12);
    ctx.scale(puff, puff);
    ctx.translate(0, 12);
    const cx = -3;
    const cy = -13;
    const rx = 19;
    const ry = 12.5;
    // le manteau de piquants (il rétrécit quand il les perd)
    const sp = clamp(o.spines == null ? 1 : o.spines, 0, 1);
    if (sp > 0.02) {
      const a0 = -Math.PI - 0.25;
      const a1 = -0.3;
      const n = 13;
      const spike = 8 * sp;
      const P = (a, r) => [cx + Math.cos(a) * (rx + r), cy + Math.sin(a) * (ry + r)];
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        // (de mauvaise humeur, ses piquants se hérissent un peu)
        const bristle = o.grumpy ? Math.sin(t * 9 + i) * 0.8 : 0;
        const [ox, oy] = P(a, spike + (i % 2) * 1.5 + bristle);
        const [ix, iy] = P(a + (a1 - a0) / n / 2, -1);
        if (i === 0) ctx.moveTo(...P(a, -2));
        ctx.lineTo(ox, oy);
        if (i < n) ctx.lineTo(ix, iy);
      }
      ctx.lineTo(cx + 4, cy + ry * 0.4);
      ctx.closePath();
      paint(ctx, '#5a3c26', line, 1.3);
      ctx.strokeStyle = '#ead6ae';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 1; i < n; i += 2) {
        const a = a0 + ((a1 - a0) * i) / n;
        ctx.moveTo(...P(a, 1));
        ctx.lineTo(...P(a, spike * 0.55));
      }
      ctx.stroke();
      // à la fin : des petites fleurs au bout de ses piquants
      if (o.flowers > 0) {
        for (const i of [2, 5, 8, 11]) {
          const a = a0 + ((a1 - a0) * i) / n;
          const [fx, fy] = P(a, spike + 1);
          flower(ctx, fx, fy, o.flowers * 0.32, i % 5, t, true);
        }
      }
    }
    // le corps (tout rose quand il n'a plus de piquants)
    ellipsePath(ctx, cx, cy, rx - 2, ry - 2, 0);
    if (sp < 0.5) {
      ctx.fillStyle = '#f6b8c0';
      ctx.fill();
      ctx.strokeStyle = '#a85a68';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // la chair de poule
      ctx.fillStyle = 'rgba(200,110,130,0.6)';
      for (const [bx, by] of [[-12, -18], [-6, -21], [0, -17], [-15, -12], [-8, -14], [4, -20]]) {
        circlePath(ctx, bx, by, 0.9);
        ctx.fill();
      }
    } else {
      const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
      g.addColorStop(0, '#a27a54');
      g.addColorStop(1, '#6e4c30');
      ctx.fillStyle = g;
      ctx.fill();
    }
    // le museau, le gros nez noir, l'oreille
    const up = (o.sneeze || 0) * 3;
    ctx.beginPath();
    ctx.moveTo(3, -21);
    ctx.quadraticCurveTo(13, -19 - up, 22, -10.5 - up);
    ctx.quadraticCurveTo(14, -3, 3, -3);
    ctx.quadraticCurveTo(-2, -12, 3, -21);
    paint(ctx, '#f2dcb8', line, 1.2);
    circlePath(ctx, 22, -10.5 - up, 2.8 + (o.sneeze || 0) * 1.2);
    paint(ctx, '#1a1010', line, 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circlePath(ctx, 21.3, -11.6 - up, 0.9);
    ctx.fill();
    circlePath(ctx, 4, -21, 2.6);
    paint(ctx, '#d8b48a', line, 1);
    // les joues roses (il rougit)
    if (o.blush > 0.02) {
      ctx.fillStyle = `rgba(255,90,120,${0.55 * o.blush})`;
      ellipsePath(ctx, 11, -8, 4.2, 2.6, 0);
      ctx.fill();
    }
    // l'œil
    const ex = 12;
    const ey = -15;
    ctx.fillStyle = '#1a1010';
    if (o.dizzy) {
      circlePath(ctx, ex, ey, 3.2);
      paint(ctx, '#ffffff', line, 0.9);
      ctx.strokeStyle = '#1a1010';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = t * 9 + i * 0.75;
        const r = i * 0.22;
        if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
      }
      ctx.stroke();
    } else if (o.sleepy || o.sneeze > 0.3 || o.hug || o.ouch) {
      // fermé (il somnole, il va éternuer, il fait un câlin, ou il a mal)
      ctx.strokeStyle = '#1a1010';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      if (o.hug) ctx.arc(ex, ey + 1, 2.4, Math.PI + 0.3, -0.3);
      else if (o.ouch) {
        ctx.moveTo(ex - 2.5, ey - 2);
        ctx.lineTo(ex + 1, ey);
        ctx.lineTo(ex - 2.5, ey + 2);
      } else {
        ctx.moveTo(ex - 2.5, ey);
        ctx.lineTo(ex + 2.5, ey);
      }
      ctx.stroke();
    } else {
      // (tout gêné, il regarde par terre)
      const ly = o.shy ? 1 : 0;
      circlePath(ctx, ex, ey + ly, 2.2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circlePath(ctx, ex - 0.6, ey - 0.8 + ly, 0.8);
      ctx.fill();
    }
    // le gros sourcil tout froncé (ronchon !)
    if (o.grumpy && !o.dizzy && !o.hug) {
      ctx.strokeStyle = '#2a1408';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(7.5, -20.5);
      ctx.lineTo(16, -17);
      ctx.stroke();
    }
    // la bouche : boudeuse, ou toute ronde (il sursaute, il éternue), ou un sourire
    ctx.strokeStyle = '#5a2a20';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (o.ouch || o.sneeze > 0.3) {
      ellipsePath(ctx, 16, -6.5, 1.8, 1.8 + (o.sneeze || 0), 0);
      paint(ctx, '#5a2020', null);
    } else if (o.grumpy && !o.shy) {
      ctx.arc(16, -5, 2.2, Math.PI + 0.6, -0.3);
      ctx.stroke();
    } else {
      ctx.arc(16, -8, 2.2, 0.3, Math.PI - 0.6);
      ctx.stroke();
    }
    ctx.restore();
    // son casque : une cupule de gland
    if (o.helmet > 0.5 || o.capY != null) {
      ctx.save();
      ctx.translate(4, -24 + Math.min(0, o.capY || 0) / S);
      ctx.rotate(-0.15);
      cap(ctx, 0, 0, 0.75);
      ctx.restore();
    }
    ctx.restore();
    if (o.dizzy) dizzyStars(ctx, x + dir * 10, y - 52, t);
    // (tout nu : une goutte de gêne)
    if (o.shy && sp < 0.5) Art.sweat(ctx, x - dir * 18, y - 44 + Math.sin(t * 5) * 2, 1.1);
  }

  // la boule de piquants (en boule, il ne montre que le bout de son nez)
  function spineBall(ctx, r, sp, t) {
    const n = 18;
    const spike = 8.5 * clamp(sp == null ? 1 : sp, 0, 1);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const b = a + TAU / n / 2;
      const ro = r + spike + (i % 2) * 1.5;
      if (i === 0) ctx.moveTo(Math.cos(a) * ro, Math.sin(a) * ro); else ctx.lineTo(Math.cos(a) * ro, Math.sin(a) * ro);
      ctx.lineTo(Math.cos(b) * (r - 1), Math.sin(b) * (r - 1));
    }
    ctx.closePath();
    paint(ctx, sp < 0.5 ? '#f6b8c0' : '#5a3c26', '#2e1c10', 1.3);
    if (sp >= 0.5) {
      ctx.strokeStyle = '#ead6ae';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < n; i += 2) {
        const a = (i / n) * TAU;
        ctx.moveTo(Math.cos(a) * (r + 1), Math.sin(a) * (r + 1));
        ctx.lineTo(Math.cos(a) * (r + spike * 0.55), Math.sin(a) * (r + spike * 0.55));
      }
      ctx.stroke();
    }
    circlePath(ctx, 0, 0, r - 2);
    const g = ctx.createRadialGradient(-4, -5, 2, 0, 0, r);
    g.addColorStop(0, '#a27a54');
    g.addColorStop(1, '#5e3e24');
    ctx.fillStyle = g;
    ctx.fill();
    circlePath(ctx, 10, 7, 2.3);
    paint(ctx, '#1a1010', '#2e1c10', 0.8);
  }

  function dizzyStars(ctx, x, y, t) {
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + (i * TAU) / 3;
      ctx.save();
      ctx.translate(x + Math.cos(a) * 18, y + Math.sin(a) * 5);
      ctx.rotate(t * 4 + i);
      Art.starShape(ctx, 5, 0.45);
      paint(ctx, '#ffe94a', '#b07800', 0.9);
      ctx.restore();
    }
  }

  // la cupule d'un gland (le casque de Ronchon), centrée en (x, y)
  function cap(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-15, 4);
    ctx.quadraticCurveTo(-16, -11, 0, -12);
    ctx.quadraticCurveTo(16, -11, 15, 4);
    ctx.quadraticCurveTo(0, 7, -15, 4);
    ctx.closePath();
    paint(ctx, '#8a6436', '#3e2810', 1.4);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(62,40,16,0.55)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 8, -12);
      ctx.lineTo(i * 5 + 8, 6);
      ctx.moveTo(i * 5 + 8, -12);
      ctx.lineTo(i * 5 - 8, 6);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#3e2810';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(1, -12);
    ctx.lineTo(3, -17);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,190,0.3)';
    ellipsePath(ctx, -6, -6, 4, 2, -0.4);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Les glands ----------
  // un gland de rayon r centré en (x, y), tourné de rot ; o.shine : il brille (on peut le renvoyer)
  function acorn(ctx, x, y, r, rot, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    // le gland
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.3);
    ctx.bezierCurveTo(-r * 0.9, r * 0.6, -r * 0.3, r * 1.1, 0, r * 1.15);
    ctx.bezierCurveTo(r * 0.3, r * 1.1, r * 0.9, r * 0.6, r * 0.8, -r * 0.3);
    ctx.closePath();
    const g = ctx.createLinearGradient(-r, 0, r, 0);
    g.addColorStop(0, '#e0a24a');
    g.addColorStop(1, '#a5682a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#5a3412';
    ctx.lineWidth = r > 8 ? 1.4 : 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,245,210,0.5)';
    ellipsePath(ctx, -r * 0.35, r * 0.2, r * 0.16, r * 0.35, 0.2);
    ctx.fill();
    // la cupule
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, -r * 0.2);
    ctx.quadraticCurveTo(-r, -r * 0.95, 0, -r * 0.95);
    ctx.quadraticCurveTo(r, -r * 0.95, r * 0.95, -r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.05, -r * 0.95, -r * 0.2);
    ctx.closePath();
    paint(ctx, '#8a6436', '#3e2810', r > 8 ? 1.3 : 0.9);
    if (r > 8) {
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(62,40,16,0.5)';
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.3 - r * 0.4, -r);
        ctx.lineTo(i * r * 0.3 + r * 0.4, 0);
        ctx.moveTo(i * r * 0.3 + r * 0.4, -r);
        ctx.lineTo(i * r * 0.3 - r * 0.4, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.strokeStyle = '#3e2810';
    ctx.lineWidth = Math.max(1.5, r * 0.16);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.92);
    ctx.lineTo(r * 0.12, -r * 1.25);
    ctx.stroke();
    ctx.restore();
    // il brille : « bling ! »
    if (o && o.shine) {
      const s = 0.5 + 0.5 * Math.sin(o.t * 6);
      ctx.save();
      ctx.translate(x + r * 0.7, y - r * 0.9);
      ctx.rotate(o.t * 2);
      Art.starShape(ctx, 3 + s * 3, 0.4);
      paint(ctx, '#fff8c0', null);
      ctx.restore();
    }
  }

  // la brindille d'où pend un gland (avec deux feuilles), de y = 0 jusqu'au gland en (x, y)
  function twig(ctx, x, y, a, t) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.strokeStyle = '#5a3a22';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(Math.sin(a) * 30, (y + 30) / 2, Math.sin(a) * (y - 30) * 0.4, y);
    ctx.stroke();
    for (const [s, yy] of [[-1, 52], [1, 70]]) {
      ctx.save();
      ctx.translate(Math.sin(a) * (yy - 30) * 0.3, yy);
      ctx.rotate(s * 1.0 + a);
      oakLeaf(ctx, 16, '#6aa83a', '#2e5418');
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- Les racines ----------
  // la terre qui se soulève (k de 0 à 1) : une grosse bosse de terre qui tremble, fendue sur le dessus, et des
  // touffes d'herbe qui s'écartent
  function mound(ctx, x, y, k, t) {
    ctx.save();
    ctx.translate(x + Math.sin(t * 50) * (0.5 + k * 1.5), y);
    const w = 22 + k * 10;
    const h = 7 + k * 15 + Math.sin(t * 18) * 1.5 * k;
    ctx.beginPath();
    ctx.moveTo(-w - 4, 2);
    ctx.quadraticCurveTo(-w * 0.6, -h * 0.9, 0, -h);
    ctx.quadraticCurveTo(w * 0.6, -h * 0.9, w + 4, 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -h, 0, 2);
    g.addColorStop(0, '#a87a4a');
    g.addColorStop(1, '#6a4428');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#3a2414';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // la fente sur le dessus (elle s'ouvre)
    ctx.strokeStyle = '#2a160a';
    ctx.lineWidth = 1.5 + k * 2.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.55, -h * 0.55);
    ctx.lineTo(-w * 0.2, -h * 0.85);
    ctx.lineTo(w * 0.05, -h * 0.7);
    ctx.lineTo(w * 0.3, -h * 0.95);
    ctx.lineTo(w * 0.55, -h * 0.5);
    ctx.stroke();
    // des petits cailloux et des miettes de bois dessus
    ctx.fillStyle = '#e0c090';
    for (let i = 0; i < 4; i++) {
      const px = (i - 1.5) * w * 0.35;
      circlePath(ctx, px, -h * (0.55 + 0.3 * Math.cos(i * 1.3)) - Math.abs(Math.sin(t * 22 + i * 2)) * 4 * k, 1.8 + (i % 2));
      ctx.fill();
    }
    // les touffes d'herbe qui s'écartent sur les côtés
    ctx.strokeStyle = '#5aa83a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const bx = s * (w + 2 + i * 3);
        ctx.moveTo(bx, 1);
        ctx.lineTo(bx + s * (4 + k * 4), -7 - i * 2);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // une racine qui sort du plancher en (x, y), haute de h (seed : sa forme) : toute tordue, avec des radicelles
  function root(ctx, x, y, h, seed, t) {
    if (h < 2) return;
    ctx.save();
    ctx.translate(x, y);
    const bend = Math.sin(seed) * 12;
    const w0 = 16;
    // le corps : il ondule en montant, et le bout s'enroule un peu
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      pts.push({ x: Math.sin(k * 3.2 + seed) * 7 * k + bend * k * k, y: -h * k, w: w0 * (1 - k * 0.85) });
    }
    ctx.beginPath();
    ctx.moveTo(-w0 - 6, 2);
    pts.forEach((q) => ctx.lineTo(q.x - q.w, q.y));
    const tip = pts[pts.length - 1];
    ctx.quadraticCurveTo(tip.x + 4, tip.y - 8, tip.x + 8 + Math.sin(seed) * 3, tip.y + 2);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x + pts[i].w, pts[i].y);
    ctx.lineTo(w0 + 6, 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(-w0, 0, w0, 0);
    g.addColorStop(0, '#9a6c40');
    g.addColorStop(1, '#5a3a22');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = BARK_LINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    // les rides de l'écorce
    ctx.strokeStyle = 'rgba(40,24,10,0.5)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 1; i < 7; i++) {
      const q = pts[i];
      ctx.moveTo(q.x - q.w * 0.6, q.y + 3);
      ctx.lineTo(q.x + q.w * 0.5, q.y - 2);
    }
    ctx.stroke();
    // les radicelles qui gigotent
    for (const [i, s] of [[3, -1], [5, 1], [6, -1]]) {
      const q = pts[i];
      const wig = Math.sin(t * 7 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(q.x + s * q.w * 0.8, q.y + 4);
      ctx.quadraticCurveTo(q.x + s * (q.w + 10), q.y - 2, q.x + s * (q.w + 15), q.y - 12 + wig);
      ctx.quadraticCurveTo(q.x + s * (q.w + 8), q.y - 2, q.x + s * q.w * 0.8, q.y - 4);
      ctx.closePath();
      paint(ctx, '#7a5232', BARK_LINE, 1.3);
    }
    // les mottes de terre et les morceaux de plancher soulevés
    ctx.fillStyle = '#6a4428';
    ctx.strokeStyle = BARK_LINE;
    ctx.lineWidth = 1.2;
    for (const [dx, r] of [[-24, 6], [-15, 4.5], [17, 5.5], [26, 4]]) {
      ellipsePath(ctx, dx, -2, r * 1.3, r, 0);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- L'arène ----------
  // Les feuilles du haut de l'arène (la couronne du chêne, devant le fond) : dessinées une fois.
  let garlandImg = null;
  function garland(ctx, x0, x1) {
    const W = Math.round(x1 - x0);
    if (!garlandImg || garlandImg.width !== W) {
      garlandImg = document.createElement('canvas');
      garlandImg.width = W;
      garlandImg.height = 90;
      const g = garlandImg.getContext('2d');
      g.lineJoin = 'round';
      g.lineCap = 'round';
      // la grosse branche
      g.strokeStyle = '#4a2e18';
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(0, 24);
      for (let x = 0; x <= W; x += 60) g.quadraticCurveTo(x + 30, 30 + Math.sin(x * 0.03) * 8, x + 60, 22 + Math.cos(x * 0.05) * 5);
      g.stroke();
      g.strokeStyle = '#7a5232';
      g.lineWidth = 5;
      g.stroke();
      // des feuilles, serrées en haut, quelques-unes qui pendent
      for (let i = 0; i < W / 9; i++) {
        const x = (i * 9 + hash(i * 3.7) * 14) % (W + 20) - 10;
        const y = 4 + hash(i * 1.9) * 26 + (hash(i * 5.3) > 0.85 ? 22 : 0);
        g.save();
        g.translate(x, y);
        g.rotate(Math.PI + (hash(i * 2.3) - 0.5) * 2.2);
        oakLeaf(g, 18 + hash(i * 7.1) * 10, ['#4f8a2e', '#5d9a36', '#6aa83a', '#3e7426'][i % 4], '#24481a');
        g.restore();
      }
      // et de petits glands dans les feuilles
      for (let i = 0; i < W / 70; i++) acorn(g, 30 + i * 70 + hash(i) * 20, 30 + hash(i * 4.4) * 14, 6, 0.3 * (hash(i * 9) - 0.5), {});
    }
    ctx.drawImage(garlandImg, x0, 0);
  }

  // Le mur de l'arène (à gauche, au-dessus du trou par où l'on est arrivé) : des lianes qui poussent du sol jusqu'en
  // haut (k : de 0, cachées, à 1, tout en haut).
  let wallImg = null;
  function vineWall(ctx, x, ground, k, t) {
    if (!wallImg) {
      wallImg = document.createElement('canvas');
      wallImg.width = 60;
      wallImg.height = Math.ceil(ground) + 10;
      const g = wallImg.getContext('2d');
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (const [ox, ph, c] of [[14, 0, '#3e7426'], [26, 2.2, '#4f8a2e'], [38, 4.1, '#5d9a36']]) {
        g.strokeStyle = '#24481a';
        g.lineWidth = 7;
        g.beginPath();
        for (let y = ground; y >= 0; y -= 8) g.lineTo(ox + Math.sin(y * 0.04 + ph) * 9, y);
        g.stroke();
        g.strokeStyle = c;
        g.lineWidth = 4.5;
        g.stroke();
      }
      for (let y = ground - 10, i = 0; y > 0; y -= 17, i++) {
        g.save();
        g.translate(26 + Math.sin(y * 0.04 + i) * 14, y);
        g.rotate((i % 2 ? 1 : -1) * (0.7 + hash(i) * 0.6) + Math.PI / 2 * (i % 2 ? 1 : -1) * 0.3);
        oakLeaf(g, 14 + hash(i * 3) * 6, i % 3 ? '#6aa83a' : '#8cc04a', '#24481a');
        g.restore();
      }
    }
    const h = wallImg.height * k;
    if (h < 1) return;
    const sy = wallImg.height - h;
    ctx.drawImage(wallImg, 0, sy, 60, h, x - 6 + Math.sin(t * 2) * 1.5, sy - 10 + (1 - k) * 0, 60, h);
  }

  // une fleur qui pousse (k : sa taille), la tige en (x, y) ; c : sa couleur ; head : seulement la fleur
  function flower(ctx, x, y, k, c, t, head) {
    if (k <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    const pop = k < 1 ? k : 1 + Math.sin(t * 2 + x) * 0.03;
    ctx.scale(pop, pop);
    let hy = 0;
    if (!head) {
      ctx.strokeStyle = '#3e7a2a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3, -10, 0, -20);
      ctx.stroke();
      ctx.fillStyle = '#5aa83a';
      ellipsePath(ctx, 5, -8, 5, 2.2, -0.5);
      ctx.fill();
      hy = -22;
    }
    ctx.fillStyle = FLOWER[c % FLOWER.length];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + t * 0.3;
      ellipsePath(ctx, Math.cos(a) * 6, hy + Math.sin(a) * 6, 4.5, 3.2, a);
      ctx.fill();
    }
    ctx.fillStyle = c === 1 ? '#ff9a3a' : '#ffd23a';
    circlePath(ctx, 0, hy, 3.4);
    ctx.fill();
    ctx.restore();
  }

  // le petit champignon où poussent les chips (k : il sort du plancher)
  function stool(ctx, x, y, k) {
    if (k <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, k);
    roundRectPath(ctx, -6, -16, 12, 16, 4);
    paint(ctx, '#f4ead2', '#8a7454', 1.2);
    ctx.beginPath();
    ctx.moveTo(-20, -14);
    ctx.quadraticCurveTo(-18, -30, 0, -30);
    ctx.quadraticCurveTo(18, -30, 20, -14);
    ctx.quadraticCurveTo(0, -10, -20, -14);
    ctx.closePath();
    paint(ctx, '#d84a3a', '#6a1a10', 1.4);
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy, r] of [[-9, -22, 2.6], [4, -26, 2.2], [11, -19, 2]]) {
      circlePath(ctx, dx, dy, r);
      ctx.fill();
    }
    ctx.restore();
  }

  // une vie dans le haut de l'écran : un gland (sur un petit rond vert) ; perdue, il ne reste que la cupule
  function lifeAcorn(ctx, x, y, full) {
    ctx.save();
    ctx.fillStyle = full ? 'rgba(130,200,80,0.5)' : 'rgba(255,255,255,0.12)';
    circlePath(ctx, x, y, 19);
    ctx.fill();
    if (full) {
      acorn(ctx, x, y + 2, 12, -0.15, {});
    } else {
      ctx.globalAlpha *= 0.35;
      cap(ctx, x, y - 4, 0.75);
    }
    ctx.restore();
  }

  return { FLOWER, king, ronchon, cap, acorn, twig, mound, root, garland, vineWall, flower, stool, lifeAcorn };
})();

BOSSES.chene = PepeChene;
