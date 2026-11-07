'use strict';

// =====================================================================
//  LES BOSS
//  Au bout du dernier niveau de chaque monde, un boss garde son arène. Ici, ce que tous les boss
//  ont en commun ; chaque boss a son propre fichier dans js/boss/ (l'Épouvantail de la Prairie est le premier).
//
//  Pour mettre un boss dans un niveau (levels.js) :
//   boss: "epouvantail"     le nom du boss (voir BOSSES, à la fin de chaque fichier de js/boss/)
//   arene: [192, 211]       la première et la dernière colonne de son arène (l'écran fait 20 cases de large)
//   &                       dans la carte du niveau : là où il attend (sur le sol de la case du dessous)
//   G                       l'arrivée : elle n'apparaît que quand le boss est battu
//  Le drapeau d'avant l'arène est l'endroit où l'on repart si l'on perd une vie pendant le combat.
//
//  Quand Malice entre dans l'arène (3 cases après sa première colonne), le boss se réveille : la caméra se fixe
//  sur l'arène, on ne peut plus en sortir (ni en volant, ni en sautant), sa musique commence et ses vies
//  s'affichent en haut de l'écran. Si Malice perd une vie, tout le niveau repart du drapeau : le boss est
//  de nouveau tout neuf (et son réveil est plus court). Quand il n'a plus de vie, il est battu : ses aides
//  s'en vont, il fait sa petite fin, puis l'arène s'ouvre et l'arrivée apparaît.
//
//  Ce qu'un boss (class Truc extends Boss) écrit, s'il en a besoin :
//   asleep(dt)               avant le réveil
//   wake(dt, k)              la petite mise en scène du réveil (k va de 0 à 1)
//   fight(dt)                le combat : ses attaques (this.phase : 0 au début, puis 1, puis 2 après chaque coup)
//   takes(how)               peut-il perdre une vie maintenant ? how : 'stomp' (Malice lui saute dessus),
//                            'bump' (un pouvoir qui renverse, ou un tir de pouvoir), 'star' (l'étoile)
//   shot(kind)               il reçoit du caramel ou des chips (par défaut, comme un coup)
//   onBounce()               Malice lui saute dessus quand il ne peut pas être touché (elle rebondit)
//   onHit(how)               il vient de perdre une vie (mais il lui en reste)
//   onBeaten()               le dernier coup ; puis outro(dt, t) : sa fin (renvoie true quand c'est fini)
//   after(dt)                une fois battu (il reste là, gentil)
//   box()                    sa boîte (this.x, this.y, this.w, this.h) selon sa pose ; stompDepth : la hauteur,
//                            depuis le haut de sa boîte, où l'on compte qu'on lui saute dessus
//   dangerous()              est-ce qu'il fait mal quand on le touche (en plein combat) ?
//   drawBody(ctx)            son dessin (seulement quand il est à l'écran)
//   drawDecor(ctx)           le décor de son arène (dessiné même quand il n'est pas à l'écran)
//   drawWall(ctx, x, k, side) le mur qui ferme l'arène (side : -1 à gauche, 1 à droite ; k : de 0, caché, à 1,
//                            fermé) ; le niveau le dessine de chaque côté qui n'est pas le bout du niveau
//   drawLife(ctx, x, y, full, t)  une de ses vies dans le haut de l'écran (un chapeau, une citrouille…)
//   sayAt()                  d'où sort sa bulle quand il parle
//   light()                  sa lumière, la nuit
//  Et ce que la base lui donne :
//   speak(text, dur)         il dit quelque chose (une bulle au-dessus de lui ; « Malice » devient le nom du personnage)
//   hint(text, dur)          un petit conseil, dans une bulle au-dessus de Malice ({CARAMEL}, {SAUT}… : voir textFor)
//   once(key)                vrai la première fois seulement (une mise en scène qui ne se joue qu'une fois)
//   addSource(kind, x, y)    du caramel (ou des chips) qui repousse là, quand on n'en a presque plus
//   shoo()                   il pousse Malice hors de lui, vers le milieu de l'arène, sans lui faire mal (avec un petit
//                            moment de grâce) : à la fin du réveil, et quand elle est coincée entre lui et un bord.
//  Ses aides (corbeaux, citrouilles…) sont des ennemis ordinaires avec this.boss : quand il est battu,
//  ils s'en vont tout seuls (leave()). Leurs classes commencent par le nom du boss (ScareCrow, ScarePumpkin…),
//  pour ne jamais se mélanger avec celles d'un autre boss.
//  La difficulté : w.diff.bossK (plus petit en Bébé : il est plus lent ; plus grand en Difficile).
// =====================================================================

const BOSSES = {};

// Après chaque coup, il ne peut plus être touché pendant ce temps (secondes).
const BOSS_RECOVER = 1.6;
// Quand il pousse Malice hors de lui, il ne lui fait pas mal pendant ce temps (secondes).
const BOSS_GRACE = 1;
// Malice ne reste jamais entre un boss et le bord de l'arène s'il y a moins de place que ça : il la pousse
// vers le milieu (sinon elle y serait coincée, sans pouvoir éviter ses attaques).
const BOSS_CORNER = 3 * TILE;

class Boss extends Enemy {
  // o : name (son nom, en haut de l'écran), song (sa musique, voir music.js), life (ses vies),
  //     intro (durée du réveil, en secondes), introShort (le réveil quand on revient après avoir perdu une vie)
  constructor(world, x, y, w, h, o) {
    super(world, x, y, w, h);
    this.name = o.name;
    this.song = o.song;
    this.lifeMax = o.life || 3;
    this.life = this.lifeMax;
    this.introLong = o.intro || 2;
    this.introShort = o.introShort || 1;
    this.state = 'sleep';
    this.stateT = 0;
    this.recover = 0;
    this.grace = 0;
    this.arena = null;
    this.goal = null;
    this.wallK = 0;
    this.hudK = 0;
    // la vie qu'il vient de perdre, qui s'envole du haut de l'écran
    this.lost = null;
    this.stompDepth = 18;
    // ce qu'il dit, le petit conseil, et ce qui ne se joue qu'une fois
    this.say = null;
    this.tip = null;
    this.flags = {};
    // le caramel (ou les chips) qui repousse dans l'arène
    this.source = null;
  }

  // Une fois le niveau lu : son arène, et l'arrivée cachée jusqu'à ce qu'il soit battu.
  setup() {
    const w = this.world;
    const ar = w.def.arene || [Math.max(0, w.cols - 20), w.cols - 1];
    this.arena = { x0: ar[0] * TILE, x1: (ar[1] + 1) * TILE, y0: 0 };
    this.goal = w.goal;
    w.goal = null;
    // (on ne repasse pas par le grand réveil quand on revient après avoir perdu une vie)
    this.short = w.game.bossSeen.has(w.def.key);
  }

  get phase() { return this.lifeMax - this.life; }
  // en plein combat (sa musique joue)
  get fighting() { return this.state === 'wake' || this.state === 'fight'; }
  get k() { return this.world.diff.bossK; }

  setState(s) {
    this.state = s;
    this.stateT = 0;
  }

  once(key) {
    if (this.flags[key]) return false;
    this.flags[key] = true;
    return true;
  }

  update(dt) {
    const w = this.world;
    const p = w.player;
    this.t += dt;
    this.stateT += dt;
    if (this.recover > 0) this.recover -= dt;
    if (this.grace > 0) this.grace -= dt;
    if (this.say) this.say.t -= dt;
    if (this.tip) this.tip.t -= dt;
    // le mur de l'arène monte (fermé) ou redescend (ouvert)
    this.wallK = approach(this.wallK, w.arena === this.arena ? 1 : 0, dt * 1.8);
    this.hudK = approach(this.hudK, this.fighting || this.state === 'beaten' ? 1 : 0, dt * 2.5);
    if (this.lost) {
      this.lost.t += dt;
      if (this.lost.t > 1.2) this.lost = null;
    }
    if (this.fighting) this.updateSource(dt);
    switch (this.state) {
      case 'sleep':
        this.asleep(dt);
        if (!p.dead && !p.won && p.cx > this.arena.x0 + 3 * TILE) this.start();
        break;
      case 'wake': {
        const dur = this.short ? this.introShort : this.introLong;
        this.wake(dt, Math.min(1, this.stateT / dur));
        if (this.stateT >= dur) {
          this.setState('fight');
          // (Malice est peut-être venue se mettre dans lui, ou derrière lui, pendant son réveil)
          this.box();
          this.shoo();
        }
        break;
      }
      case 'fight':
        this.keepOut();
        this.fight(dt);
        break;
      case 'beaten':
        if (this.outro(dt, this.stateT)) this.finish();
        break;
      default:
        this.after(dt);
        break;
    }
    this.box();
  }

  // Malice est entrée dans l'arène : il se réveille, et on ne peut plus en sortir.
  // (avec l'étoile, sa musique ne commence qu'à la fin de l'étoile : voir onStarEnd et levelMusic dans game.js)
  start() {
    const w = this.world;
    this.setState('wake');
    w.arena = this.arena;
    w.game.bossSeen.add(w.def.key);
    if (!(w.player.star > 0)) Sound.playMusic(this.song);
  }

  // ---------- Ce qui le touche ----------
  // Tout passe par ici : sauté dessus, renversé par un pouvoir, l'étoile.
  hitWith(how) {
    if (this.state !== 'fight' || this.recover > 0 || !this.takes(how)) return false;
    const w = this.world;
    this.life--;
    this.recover = BOSS_RECOVER;
    this.lost = { i: this.life, t: 0 };
    this.tip = null;
    w.game.addScore(1000);
    w.shake(8);
    if (this.life <= 0) {
      this.setState('beaten');
      // ses aides s'en vont
      for (const e of w.enemies) {
        if (e.boss === this && !e.dead && e.leave) e.leave();
      }
      w.game.addScore(5000);
      if (!(w.player.star > 0)) Sound.stopMusic();
      this.onBeaten();
    } else {
      this.onHit(how);
    }
    return true;
  }

  // (appelés par le jeu, comme pour les autres ennemis)
  stomp() {
    if (!this.hitWith('stomp')) this.onBounce();
  }

  kill(type) {
    return this.hitWith(type === 'star' ? 'star' : 'bump');
  }

  hitBy(kind) {
    if (this.state === 'fight') this.shot(kind);
  }

  harmful() {
    return this.state === 'fight' && this.recover <= 0 && this.grace <= 0 && this.dangerous();
  }

  // Le combat est fini : l'arène s'ouvre, l'arrivée apparaît, et la musique du niveau revient
  // (avec l'étoile, c'est la fin de l'étoile qui la remettra).
  finish() {
    const w = this.world;
    this.setState('friend');
    w.arena = null;
    this.tip = null;
    if (this.goal) {
      w.goal = this.goal;
      // (il faut aller la toucher : Malice est peut-être déjà plus loin)
      this.goal.touch = true;
      const g = this.goal;
      w.puff(g.x, g.y - 40, '#fff6c0');
      for (let i = 0; i < 16; i++) {
        w.spawn({ type: 'spark', x: g.x + rand(-20, 40), y: g.y - rand(0, 200), vx: rand(-90, 90), vy: rand(-160, 20), life: 0.8, size: rand(4, 8), color: choose(['#fff59a', '#ff9fd8', '#ffffff']) });
      }
      Sound.sfx.itemAppear();
    }
    if (!(w.player.star > 0)) Sound.playMusic(w.game.levelMusic());
  }

  // ---------- Malice n'est jamais coincée ----------
  // Est-elle (par terre, ou presque) entre lui et un bord de l'arène trop proche ?
  cornered(p) {
    const A = this.arena;
    if (p.y + p.h < this.y + this.h - 3 * TILE) return false;
    if (p.cx > this.cx) return A.x1 - (this.x + this.w) < BOSS_CORNER;
    return this.x - A.x0 < BOSS_CORNER;
  }

  // Tant qu'il ne peut pas être touché, il ne la laisse pas coincée contre un bord (collé, on peut lui sauter
  // dessus de n'importe où).
  keepOut() {
    const p = this.world.player;
    if (this.grace > 0 || p.dead || this.takes('stomp')) return;
    if (this.cornered(p)) this.shoo();
  }

  // Il pousse doucement Malice hors de lui (et loin d'un bord trop proche), vers le milieu de l'arène,
  // sans lui faire mal : un petit bond, et un moment de grâce.
  shoo() {
    const p = this.world.player;
    if (p.dead || p.won) return;
    const A = this.arena;
    const inside = overlap(p, { x: this.x - 4, y: this.y, w: this.w + 8, h: this.h });
    if (!inside && !this.cornered(p)) return;
    let d = Math.sign(p.cx - this.cx) || -1;
    const room = d > 0 ? A.x1 - (this.x + this.w) : this.x - A.x0;
    if (room < BOSS_CORNER) d = -d;
    p.vx = d * 520;
    p.vy = Math.min(p.vy, -560);
    p.onGround = false;
    p.platform = null;
    p.boostT = 0.4;
    this.grace = BOSS_GRACE;
  }

  // ---------- Ce qu'il dit, et le petit conseil ----------
  speak(text, dur) {
    this.say = { text: this.world.game.textFor(text), t: dur, dur };
  }

  hint(text, dur) {
    const d = dur || 4;
    this.tip = { text: this.world.game.textFor(text), t: d, dur: d };
  }

  sayAt() {
    return { x: this.cx, y: this.y - 20 };
  }

  // (une bulle qui apparaît et disparaît en douceur)
  static fade(b) {
    return clamp(Math.min(b.t * 3, (b.dur - b.t) * 6), 0, 1);
  }

  // ---------- Le caramel (ou les chips) qui repousse ----------
  // x : le milieu, y : le bas de la friandise (posée sur une souche, par exemple)
  addSource(kind, x, y) {
    this.source = { kind, x, y, item: null, t: 0 };
    this.source.item = this.makeTreat(false);
  }

  // (en repoussant, elle sort d'en dessous)
  makeTreat(grow) {
    const S = this.source;
    const half = ITEM_SIZE[S.kind] / 2;
    const it = new Item(this.world, S.kind, S.x, grow ? S.y - half + TILE * 0.95 : S.y - half, grow);
    this.world.items.push(it);
    return it;
  }

  // quand on en a moins de 3 et qu'il n'y en a plus, elle repousse un peu plus tard
  updateSource(dt) {
    const S = this.source;
    if (!S || (S.item && !S.item.dead)) return;
    if (this.world.game[S.kind] >= 3) {
      S.t = 0;
      return;
    }
    S.t += dt;
    if (S.t > 2.2) {
      S.t = 0;
      S.item = this.makeTreat(true);
      Sound.sfx.itemAppear();
    }
  }

  // ---------- Par défaut (chaque boss en remplace une partie) ----------
  asleep() {}
  wake() {}
  fight() {}
  after() {}
  takes() { return true; }
  shot(kind) { this.hitWith(kind); }
  onBounce() {}
  onHit() {}
  onBeaten() {}
  outro(dt, t) { return t > 1; }
  box() {}
  dangerous() { return true; }
  drawBody() {}
  drawDecor() {}
  drawWall() {}
  drawLife(ctx, x, y, full) {
    Art.heart(ctx, x, y, 1.4, full ? '#ff7a2e' : 'rgba(255,255,255,0.25)', full ? '#7a2a08' : 'rgba(255,255,255,0.4)');
  }

  // ---------- Dessin ----------
  // Son arène (le niveau l'appelle à chaque image, même quand il n'est pas à l'écran) : le décor, et les murs
  // des côtés qui ne sont pas le bout du niveau.
  drawArena(ctx) {
    const A = this.arena;
    const w = this.world;
    if (A.x1 < w.cam.x - 200 || A.x0 > w.cam.x + VIEW_W + 200) return;
    this.drawDecor(ctx);
    if (this.wallK > 0.01) {
      if (A.x0 > 0) this.drawWall(ctx, A.x0, this.wallK, -1);
      if (A.x1 < w.width) this.drawWall(ctx, A.x1, this.wallK, 1);
    }
  }

  draw(ctx) {
    const w = this.world;
    this.drawBody(ctx);
    if (this.say && this.say.t > 0) {
      const at = this.sayAt();
      w.bubble(at.x, at.y, this.say.text, Boss.fade(this.say));
    }
    if (this.tip && this.tip.t > 0 && this.state === 'fight') {
      const p = w.player;
      w.bubble(p.cx, p.y - 30, this.tip.text, Boss.fade(this.tip));
    }
  }

  // Ses vies, en haut de l'écran : son nom, et une icône par vie. La boîte se cale entre les munitions
  // (à gauche) et les petits boutons du haut (pause, son…), qui prennent plus de place sur un petit
  // téléphone : s'il n'y a pas assez de place, elle rétrécit.
  drawHUD(ctx, t) {
    const k = this.hudK;
    if (k <= 0.01) return;
    const n = this.lifeMax;
    const gap = 46;
    const w = 150 + n * gap;
    const right = Math.min(776, this.world.game.hudRight() - 10);
    const sc = clamp((right - 470) / w, 0.6, 1);
    ctx.save();
    ctx.translate(right - w * sc, 12 - (1 - k) * 80);
    ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(40,10,60,0.42)';
    roundRectPath(ctx, 0, 0, w, 58, 20);
    ctx.fill();
    drawOutlinedText(ctx, this.name, 16, 29, 19, '#ffe0a8', 'left');
    for (let i = 0; i < n; i++) {
      // pendant le réveil, ses vies arrivent une par une
      const pop = this.state === 'wake' ? clamp((this.stateT - 0.3 - i * 0.25) * 4, 0, 1) : 1;
      if (pop <= 0) continue;
      const full = i < this.life;
      ctx.save();
      ctx.translate(150 + i * gap + gap / 2 - 8, 34);
      const s = pop < 1 ? 0.4 + 0.75 * Math.sin(pop * Math.PI * 0.8) : 1 + (full && this.life === 1 ? Math.sin(t * 8) * 0.08 : 0);
      ctx.scale(s, s);
      this.drawLife(ctx, 0, 0, full, t);
      ctx.restore();
    }
    // la vie qu'il vient de perdre s'envole en tournant
    if (this.lost) {
      const L = this.lost;
      ctx.save();
      ctx.globalAlpha = clamp(1.2 - L.t, 0, 1);
      ctx.translate(150 + L.i * gap + gap / 2 - 8 + L.t * 60, 34 - L.t * 90 + L.t * L.t * 200);
      ctx.rotate(L.t * 7);
      ctx.scale(1 + L.t * 0.4, 1 + L.t * 0.4);
      this.drawLife(ctx, 0, 0, true, t);
      ctx.restore();
    }
    ctx.restore();
  }

  // Le boss du niveau (le nom écrit dans "boss" de levels.js), posé les pieds en (x, y).
  static create(world, name, x, y) {
    const B = BOSSES[name];
    if (!B) {
      console.error(`levels.js : le niveau « ${world.def.name} » a boss: "${name}", mais ce boss n'existe pas (voir js/boss/).`);
      return null;
    }
    return new B(world, x, y);
  }
}
