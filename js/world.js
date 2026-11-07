'use strict';

const LUTIN_BLOCKS = 'LFKCS';
// u : bloc magique du Lutin (il disparaît tout seul)
const isSolidCh = (ch) => ch === '#' || ch === 'B' || ch === 'M' || ch === 'u' || LUTIN_BLOCKS.includes(ch);
// plateformes qu'on traverse par dessous : planche, nuage… ou pont arc-en-ciel
const isLedgeCh = (ch) => ch === '-' || ch === '=';
// l'eau de la rivière (la Rivière aux Nénuphars)
const WATER = '_';
// la bave des escargots : elle glisse pendant SLIME_WET secondes, puis elle sèche (et disparaît à SLIME_TIME)
const SLIME_WET = 7;
const SLIME_TIME = 9;
// les minerais de la grotte, dans l'ordre de Art.GEMS : or, rubis, émeraude, topaze, diamant
const GEM_CHARS = 'gretd';
const MAGIC_TIME = 6;
const MAGIC_MAX = 4;
// Une tache de lumière (pour percer le noir) : dessinée une fois, puis agrandie à la taille de chaque lumière.
let LIGHT_BLOB = null;
function lightBlob() {
  if (!LIGHT_BLOB) {
    LIGHT_BLOB = document.createElement('canvas');
    LIGHT_BLOB.width = 128;
    LIGHT_BLOB.height = 128;
    const g = LIGHT_BLOB.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.55, 'rgba(0,0,0,0.8)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  }
  return LIGHT_BLOB;
}

// Un niveau en cours de jeu : le décor, les personnages et tout ce qui bouge.
class World {
  constructor(game, def, checkpointIdx) {
    this.game = game;
    this.def = def;
    this.theme = def.theme;
    this.diff = game.diff;
    this.t = 0;
    this.tiles = def.map.map((row) => row.split(''));
    // sans badges (tous sauf Malice), le niveau a des plateformes en plus (voir "sansBadges" dans levels.js)
    const noBadge = !game.withBadges() && def.sansBadges;
    if (noBadge) {
      for (const [r, c, s] of noBadge.add || []) {
        for (let i = 0; i < s.length; i++) this.tiles[r][c + i] = s[i];
      }
    }
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
    this.critters = [];
    this.anchors = [];
    this.eclairs = [];
    this.particles = [];
    this.bubbles = [];
    this.magic = [];
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
    // monde des bonbons : la lave est une rivière de chocolat
    this.choco = def.theme === 'candy';
    // grotte : il fait noir, sauf autour de Malice et de ce qui brille ;
    // la nuit (dark: 'nuit'), c'est plus doux, et la lune, les lucioles et les fleurs qui brillent éclairent
    this.dark = !!def.dark;
    this.night = def.dark === 'nuit';
    this.fireflies = [];
    this.glows = [];
    this.glowsSeen = [];
    // le grand champ du bout, sous la lune : [première colonne, dernière colonne]
    this.moonlight = def.clairDeLune || null;
    this.lightT = 0;
    this.lightBoost = 0;
    this.lightColor = '#ffffff';
    this.lights = [];
    // vent : [première colonne, dernière colonne, sens]
    this.winds = (def.winds || []).map(([a, b, dir], i) => ({ a, b, dir, ph: i * 1.7, on: false }));
    // champignons et guimauves qui s'écrasent quand on rebondit dessus
    this.springs = new Map();
    // pissenlits géants, et courants d'air qui font monter : [première colonne, dernière colonne, rangée]
    this.puffs = [];
    this.updrafts = (def.updrafts || []).map(([a, b, row]) => ({ a, b, top: row * TILE - 12 }));
    // la Rivière aux Nénuphars : la bave des escargots, les lapins, et le terrier secret
    // (les rangées à partir de "terrier" sont sous terre : la caméra n'y descend que si Malice y va)
    this.slime = [];
    this.bunnies = [];
    this.terrier = def.terrier || 0;
    const bunnySpots = [];
    // le boss du bout du niveau (voir boss.js), et son arène quand on ne peut plus en sortir
    this.boss = null;
    this.arena = null;

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
          case 'o': this.items.push(new Item(this, 'candy', mx, this.treatY('candy', c, r))); break;
          case 'y': this.items.push(new Item(this, 'lollipop', mx, this.treatY('lollipop', c, r))); break;
          case 'b': this.items.push(new Item(this, 'ball', mx, this.treatY('ball', c, r))); break;
          case '!': this.checkpoints.push(new Checkpoint(this, mx, by, this.checkpoints.length)); break;
          case 'G': this.goal = new Goal(this, mx, by); break;
          case 'N': this.goal = new BirdGoal(this, mx, by); break;
          case 'H': this.platforms.push(new MovingPlatform(this, x, y, 'h')); break;
          case 'I': this.platforms.push(new MovingPlatform(this, x, y, 'v')); break;
          case 'T': flowerSpots.push({ x: mx, y: by }); break;
          case '@': if (game.withBadges()) this.anchors.push(new Anchor(this, mx, y + TILE / 2)); break;
          case 'Z': this.goal = new BadgeGoal(this, mx, by, def.badge); break;
          case 'X': this.goal = new FamilyGoal(this, mx, by); break;
          case 'V': this.enemies.push(new Bat(this, mx - 20, y)); break;
          case 'Y': this.enemies.push(new GrumpyBird(this, mx - 22, y + 6)); break;
          case 'U': this.enemies.push(new GummyBear(this, mx - 17, by - 40)); break;
          case 'Q':
            // un œil bonbon déjà attrapé dans ce niveau ne revient pas (pas de vies à l'infini)
            if (!game.caughtEyes.has(c + ',' + r)) {
              const ce = new CandyEye(this, mx - 16, by - 34);
              ce.key = c + ',' + r;
              this.critters.push(ce);
            }
            break;
          case 'A': this.hazards.push(new Stalactite(this, x, y)); break;
          case 'O': this.enemies.push(new Snail(this, mx - 22, by - 30)); break;
          case 'm': this.enemies.push(new Mole(this, mx, by)); break;
          case '&':
            this.boss = Boss.create(this, def.boss, mx, by);
            if (this.boss) this.enemies.push(this.boss);
            break;
          case 'i': this.fireflies.push(new Fireflies(this, mx, y + TILE / 2)); break;
          case 'j': this.glows.push({ x: mx, y: by, v: hash2(c, r) }); break;
          case 'n':
          case 'c':
            // un nénuphar posé sur l'eau (sous lui, la rivière continue)
            this.platforms.push(new LilyPad(this, mx, y + 14, ch === 'c'));
            this.tiles[r][c] = WATER;
            keep = true;
            break;
          case 'l': bunnySpots.push({ x: mx, y: by, r }); break;
          case '*': {
            // planté sur une branche ou sur le sol, ou bien qui flotte en l'air
            const below = this.tileAt(c, r + 1);
            const planted = isSolidCh(below) || isLedgeCh(below);
            this.puffs.push(new Dandelion(this, mx, planted ? by : y + TILE / 2, planted));
            break;
          }
          default:
            if (GEM_CHARS.includes(ch)) {
              const it = new Item(this, 'gem', mx, y + TILE / 2);
              it.gem = GEM_CHARS.indexOf(ch);
              this.items.push(it);
            } else keep = true;
        }
        if (!keep) this.tiles[r][c] = '.';
      }
    }
    // (le boss cache l'arrivée jusqu'à ce qu'il soit battu, et appelle ses aides)
    if (this.boss) this.boss.setup();
    // les fleurs parlent dans l'ordre, de gauche à droite (pendant le retour, c'est le bébé oiseau)
    flowerSpots.sort((a, b) => a.x - b.x);
    const talk = Object.assign((def.talk || []).slice(), noBadge ? noBadge.talk : null);
    flowerSpots.forEach((f, i) => {
      const Talker = def.sequel ? BirdTip : TalkFlower;
      this.flowers.push(new Talker(this, f.x, f.y, game.textFor(talk[i] || '')));
    });
    // les lapins : ceux qui sont sur l'herbe sortent la tête de leur trou (sans rien dire) ;
    // ceux du terrier parlent, dans l'ordre de gauche à droite ("lapins")
    bunnySpots.sort((a, b) => a.x - b.x);
    let said = 0;
    bunnySpots.forEach((b) => {
      const peek = !this.terrier || b.r < this.terrier - 2;
      const msg = peek ? '' : (def.lapins || [])[said++] || '';
      this.bunnies.push(new Bunny(this, b.x, b.y, peek, game.textFor(msg)));
    });
    // les drapeaux sont numérotés de gauche à droite (même s'il y en a un plus bas, dans un terrier)
    this.checkpoints.sort((a, b) => a.x - b.x);
    this.checkpoints.forEach((cp, i) => { cp.idx = i; });
    if (checkpointIdx >= 0 && this.checkpoints[checkpointIdx]) {
      const cp = this.checkpoints[checkpointIdx];
      start = { x: cp.x + 20, y: cp.y };
      for (let i = 0; i <= checkpointIdx; i++) this.checkpoints[i].activate(false);
    }
    this.player = new Player(this, start.x - 14, start.y - 56);
    this.player.y = start.y - this.player.h;
    // (si elle tombe à l'eau et que l'endroit où elle était a disparu, elle ressort ici)
    this.startPos = { x: start.x, y: start.y, pad: null };
    // les escargots partent du côté opposé à l'endroit où Malice apparaît (au début, ou à un drapeau) :
    // ils ne foncent pas tout de suite sur elle
    for (const e of this.enemies) {
      if (e instanceof Snail) e.dir = e.cx < start.x ? -1 : 1;
    }
    // le terrier : les trous cachés sous un bloc lutin, et les cases des galeries (voir burrowCells)
    this.shafts = this.findShafts();
    this.burrowCache = null;
    this.crowns = this.findCrowns();
    this.updateCamera(0, true);
  }

  // Une friandise juste au-dessus du sol s'y pose ; en l'air, elle reste au milieu de sa case
  // (sinon Malice attraperait sans sauter celles qui flottent juste au-dessus de sa tête).
  treatY(kind, c, r) {
    const below = this.tileAt(c, r + 1);
    if (isSolidCh(below) || below === '-') return (r + 1) * TILE - ITEM_SIZE[kind] / 2 - 3;
    return r * TILE + TILE / 2;
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
        if (isSolidCh(ch) || (isLedgeCh(ch) && prevBottom <= r * T + 0.5)) tiles.push({ c, r, ch });
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
    return isSolidCh(below) || isLedgeCh(below);
  }

  surfaceBelow(x, fromY) {
    const c = Math.floor(x / TILE);
    for (let r = Math.max(0, Math.floor(fromY / TILE)); r < this.rows; r++) {
      const ch = this.tileAt(c, r);
      if (isSolidCh(ch) || isLedgeCh(ch)) return r * TILE;
      if (ch === '~' || ch === WATER) return r * TILE + 12;
    }
    return this.height + 200;
  }

  // Les pieds dans une flaque d'eau (w) ?
  inPuddle(b) {
    const feet = b.y + b.h;
    const r = Math.floor((feet - 4) / TILE);
    const c0 = Math.floor((b.x + 6) / TILE);
    const c1 = Math.floor((b.x + b.w - 6) / TILE);
    for (let c = c0; c <= c1; c++) {
      if (this.tileAt(c, r) === 'w' && feet > (r + 1) * TILE - 12) return true;
    }
    return false;
  }

  // Plouf ! des gouttes qui sautent et une petite vague.
  splash(x, y) {
    Sound.sfx.splash();
    this.spawn({ type: 'ring', x, y: y - 2, life: 0.35, size: 34, color: 'rgba(170,225,255,0.9)' });
    for (let i = 0; i < 12; i++) {
      this.spawn({ type: 'dot', x: x + rand(-14, 14), y: y - 4, vx: rand(-170, 170), vy: rand(-380, -140), g: 1300, life: 0.55, size: rand(2.2, 4), color: i % 3 ? '#8fd8ff' : '#ffffff' });
    }
  }

  inLava(b) {
    const y = b.y + b.h - 4;
    // sous la dernière rangée, on est encore dedans (Malice s'enfonce dans le chocolat)
    const r = Math.min(Math.floor(y / TILE), this.rows - 1);
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

  // La rivière : si les pieds sont dans l'eau, plus bas que deep sous la surface, renvoie la hauteur
  // de la surface (sinon null).
  waterSurface(b, deep) {
    const feet = b.y + b.h;
    const r = Math.min(Math.floor((feet - 4) / TILE), this.rows - 1);
    const c0 = Math.floor((b.x + 4) / TILE);
    const c1 = Math.floor((b.x + b.w - 4) / TILE);
    for (let c = c0; c <= c1; c++) {
      if (this.tileAt(c, r) !== WATER) continue;
      let top = r;
      while (this.tileAt(c, top - 1) === WATER) top--;
      const surface = top * TILE + 14;
      if (feet > surface + deep) return surface;
    }
    return null;
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
          const box = { x: c * TILE + 5, y: r * TILE + 20, w: TILE - 10, h: TILE - 20, ouch: 'butt' };
          if (overlap(b, box)) return box;
        } else if (ch === 'v') {
          const box = { x: c * TILE + 5, y: r * TILE, w: TILE - 10, h: TILE - 20, ouch: 'head' };
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

  // ---------- Les Grands Arbres ----------
  // Un tronc (|) est dans le décor : on passe devant. Il continue derrière une branche qui le traverse,
  // et derrière ce qui est posé dessus (friandise, ennemi…).
  trunkAt(c, r) {
    const ch = this.tileAt(c, r);
    // (le bloc magique du Lutin posé devant un tronc)
    if (ch === 'u' && this.magic.some((m) => m.c === c && m.r === r && m.under === '|')) return true;
    return ch === '|' || (this.tileAt(c, r + 1) === '|' && (ch === '-' || this.tileAt(c, r - 1) === '|'));
  }

  // Le feuillage en haut de chaque tronc : une grosse touffe par tronc (les colonnes côte à côte).
  findCrowns() {
    const crowns = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.trunkAt(c, r) || (r > 0 && this.trunkAt(c, r - 1)) || this.trunkAt(c - 1, r)) continue;
        let e = c;
        while (this.trunkAt(e + 1, r) && !(r > 0 && this.trunkAt(e + 1, r - 1))) e++;
        crowns.push({ x: (c + e + 1) * TILE / 2, y: r * TILE, w: (e - c + 1) * TILE, v: hash2(c, r) });
      }
    }
    return crowns;
  }

  // Le courant d'air où se trouve Malice (s'il y en a un).
  updraftAt(b) {
    const col = (b.x + b.w / 2) / TILE;
    return this.updrafts.find((z) => col >= z.a && col < z.b + 1) || null;
  }

  // Une graine de pissenlit qui s'envole.
  seed(x, y, vx, vy) {
    this.spawn({ type: 'seed', x, y, vx, vy, g: -12, drag: 0.8, life: rand(1.8, 2.8), size: rand(0.9, 1.25), wob: rand(0, 6) });
  }

  // Dans un courant d'air, des feuilles montent en tournoyant.
  updateUpdrafts(dt) {
    for (const z of this.updrafts) {
      const x0 = z.a * TILE;
      const x1 = (z.b + 1) * TILE;
      if (x1 < this.cam.x - 60 || x0 > this.cam.x + VIEW_W + 60 || Math.random() > dt * 7) continue;
      this.spawn({
        type: 'leaf', x: rand(x0 + 10, x1 - 10), y: this.cam.y + VIEW_H + 10, vx: rand(-20, 20), vy: rand(-240, -170),
        life: rand(2.2, 3), size: rand(1.2, 1.7), vr: rand(-4, 4), wob: rand(0, 6), color: choose(['#7ccf4f', '#a8e05a', '#ffd84a', '#58b53c']),
      });
    }
  }

  // ---------- La bave des escargots ----------
  addSlime(x, y) {
    if (this.slime.length > 700) this.slime.shift();
    this.slime.push({ x, y, t: 0, v: Math.random() });
  }

  updateSlime(dt) {
    for (const s of this.slime) s.t += dt;
    if (this.slime.length && this.slime[0].t >= SLIME_TIME) this.slime = this.slime.filter((s) => s.t < SLIME_TIME);
  }

  // De la bave encore toute fraîche sous les pieds ?
  slimeUnder(b) {
    const feet = b.y + b.h;
    for (const s of this.slime) {
      if (s.t < SLIME_WET && Math.abs(s.y - feet) < 3 && s.x > b.x - 4 && s.x < b.x + b.w + 4) return true;
    }
    return false;
  }

  drawSlime(ctx) {
    for (const s of this.slime) {
      if (s.x < this.cam.x - 20 || s.x > this.cam.x + VIEW_W + 20) continue;
      Art.slimeDrop(ctx, s.x, s.y, s.t, s.v, SLIME_WET, SLIME_TIME);
    }
  }

  // ---------- Blocs magiques du Lutin ----------
  addMagicBlock(c, r) {
    const under = r >= 0 && r < this.rows && c >= 0 && c < this.cols ? this.tiles[r][c] : '#';
    // (aussi dans une flaque ou devant un tronc d'arbre : ils reviennent quand le bloc s'en va)
    if (under !== '.' && under !== 'w' && under !== '|') return false;
    const box = { x: c * TILE, y: r * TILE, w: TILE, h: TILE };
    if (this.enemies.some((e) => !e.dying && overlap(e, box))) return false;
    if (this.items.some((it) => !it.dead && overlap(it, box))) return false;
    if (this.critters.some((ce) => !ce.dead && overlap(ce, box))) return false;
    // pas sur le trajet d'une plateforme qui bouge, ni juste au-dessus d'un nénuphar (voir blockZone)
    if (this.platforms.some((pl) => overlap(pl.blockZone(), box))) return false;
    // pas plus de 4 à la fois : le plus vieux s'en va
    if (this.magic.length >= MAGIC_MAX) this.removeMagic(this.magic[0]);
    this.tiles[r][c] = 'u';
    this.burrowCache = null;
    this.magic.push({ c, r, t: 0, under });
    Sound.sfx.magic();
    for (let i = 0; i < 12; i++) {
      this.spawn({ type: 'spark', x: c * TILE + rand(0, TILE), y: r * TILE + rand(0, TILE), vx: rand(-90, 90), vy: rand(-140, -20), life: 0.5, size: rand(3, 6), color: i % 2 ? '#fff6a0' : '#7dff9a' });
    }
    return true;
  }

  removeMagic(m) {
    this.magic = this.magic.filter((o) => o !== m);
    if (this.tiles[m.r][m.c] === 'u') this.tiles[m.r][m.c] = m.under || '.';
    this.burrowCache = null;
    Sound.sfx.magicGone();
    this.puff(m.c * TILE + TILE / 2, m.r * TILE + TILE / 2, '#d8ffe0');
  }

  updateMagic(dt) {
    for (const m of this.magic.slice()) {
      m.t += dt;
      if (m.t >= MAGIC_TIME) this.removeMagic(m);
    }
  }

  drawMagic(ctx) {
    const img = Scenery.lutinSprite();
    const pad = Scenery.PAD;
    for (const m of this.magic) {
      // il apparaît en grossissant, puis clignote avant de disparaître
      const left = MAGIC_TIME - m.t;
      if (left < 1.5 && Math.floor(left * 8) % 2 === 0) continue;
      const k = Math.min(1, m.t / 0.12);
      const cx = m.c * TILE + TILE / 2;
      const cy = m.r * TILE + TILE / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(k, k);
      ctx.globalAlpha = 0.92;
      ctx.drawImage(img, -TILE / 2 - pad, -TILE / 2 - pad, TILE + pad * 2, TILE + pad * 2);
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(this.t * 6 + m.c);
      ctx.fillStyle = '#d8ffe0';
      roundRectPath(ctx, -TILE / 2, -TILE / 2, TILE, TILE - 2, 9);
      ctx.fill();
      ctx.restore();
    }
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
    this.burrowCache = null;
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
      case 'gem': {
        const gem = Art.GEMS[it.gem];
        this.lightUp(gem.color);
        Sound.sfx.gem(it.gem);
        this.popText(cx, cy, gem.name + ' !', gem.color, 22);
        this.spawn({ type: 'ring', x: cx, y: cy + it.h / 2, life: 0.5, size: 80, color: gem.color });
        break;
      }
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
    if (this.arena) this.keepInArena(p);
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
    if (this.def.sequel) {
      let best = null;
      for (const f of this.flowers) {
        f.active = false;
        if (f.isNear() && (!best || Math.abs(p.cx - f.x) < Math.abs(p.cx - best.x))) best = f;
      }
      if (best) best.active = true;
    }
    for (const f of this.flowers) f.update(dt);
    for (const ce of this.critters) ce.update(dt);
    for (const a of this.anchors) a.update(dt);
    for (const d of this.puffs) d.update(dt);
    for (const b of this.bunnies) b.update(dt);
    for (const f of this.fireflies) f.update(dt);
    if (this.goal) this.goal.update(dt);
    if (this.def.sequel) p.birdTalk = this.flowers.reduce((m, f) => Math.max(m, f.show), 0);
    this.updateMagic(dt);
    this.updateStorms(dt);
    this.updateWinds(dt);
    this.updateUpdrafts(dt);
    this.updateSlime(dt);
    this.updateLight(dt);
    for (const [k, v] of this.springs) {
      if (v > 0.4) this.springs.delete(k); else this.springs.set(k, v + dt);
    }
    if (!p.dead && !p.won) this.interactions();
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.hazards = this.hazards.filter((h) => !h.dead);
    this.projectiles = this.projectiles.filter((h) => !h.dead);
    this.items = this.items.filter((h) => !h.dead);
    this.eclairs = this.eclairs.filter((h) => !h.dead);
    this.critters = this.critters.filter((h) => !h.dead);
    this.updateParticles(dt);
    this.updateCamera(dt, false);
  }

  // L'arène d'un boss : on n'en sort pas tant qu'il n'est pas battu (ni en marchant, ni en volant, ni en
  // grimpant tout là-haut : on reste toujours sur l'écran).
  keepInArena(b) {
    const A = this.arena;
    if (b.y < A.y0) {
      b.y = A.y0;
      if (b.vy < 0) b.vy = 0;
    }
    if (b.x < A.x0) {
      b.x = A.x0;
      if (b.vx < 0) b.vx = 0;
    }
    if (b.x + b.w > A.x1) {
      b.x = A.x1 - b.w;
      if (b.vx > 0) b.vx = 0;
    }
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
    // (sous l'eau, on ne touche rien)
    if (p.dive > 0) return;
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
      if (p.knocks()) {
        knockEnemy(p, e, p.pow.knockWord);
        continue;
      }
      // (stompDepth : sur un grand boss tout affaissé, on compte qu'on lui saute dessus même en arrivant un peu bas)
      if (stomps(e.y + (e.stompDepth || 18))) {
        e.stomp();
        p.bounceOff();
        continue;
      }
      if (e.harmful()) p.hurt(e, e.ouch);
    }
    for (const h of this.hazards) {
      if (h.dead || (h.harmful && !h.harmful()) || !overlap(pb, h)) continue;
      if (p.star > 0 || p.knocks()) {
        h.dead = true;
        this.puff(h.x + h.w / 2, h.y + h.h / 2, '#ddd');
      } else if (h instanceof BlackDot && stomps(h.y + 12)) {
        h.squash();
        p.bounceOff();
      } else if (p.hurt(h, h.ouch)) {
        if (h instanceof BlackDot) h.dead = true;
        else if (h instanceof Stalactite) h.crash();
      }
    }
    for (const ec of this.eclairs) {
      const b = ec.box();
      if (b && boxOverlap(pb, b.x, b.y, b.w, b.h)) p.hurt(b, 'zap');
    }
    const th = this.thornHit(pb);
    if (th) p.hurt(th, th.ouch);
    for (const it of this.items) {
      if (!it.dead && it.appear <= 0 && overlap(pb, it)) this.collect(it);
    }
    for (const ce of this.critters) {
      if (!ce.dead && overlap(pb, ce)) this.catchEye(ce);
    }
    // les pissenlits géants : on les attrape en les touchant (mais si l'on reste immobile dessus
    // pendant qu'il repousse, on ne le reprend pas tout seul : il faut bouger, ou sauter)
    const still = p.onGround && Math.abs(p.vx) < 1 && !Input.held.left && !Input.held.right;
    for (const d of this.puffs) {
      const touch = !p.grap && overlap(pb, d.box());
      if (touch && d.ready() && (!d.touched || !still)) p.grabPuff(d);
      d.touched = touch;
    }
  }

  // On a attrapé un gros œil bonbon : une vie en plus et tous les cœurs !
  catchEye(ce) {
    const p = this.player;
    const cx = ce.cx;
    const cy = ce.y;
    ce.dead = true;
    this.game.caughtEyes.add(ce.key);
    p.heal(this.game.energyMax);
    this.game.extraLife(cx, cy - 10);
    Sound.sfx.eyeCatch();
    this.game.addScore(500);
    for (let i = 0; i < 8; i++) {
      this.spawn({ type: 'heart', x: cx + rand(-16, 16), y: cy + 10, vy: rand(-160, -60), vx: rand(-60, 60), life: 1, size: 1 });
    }
    for (let i = 0; i < 10; i++) {
      this.spawn({ type: 'spark', x: cx, y: cy + 16, vx: rand(-180, 180), vy: rand(-200, 60), life: 0.5, size: rand(4, 7), color: choose(['#ff9fd8', '#fff59a', '#7fd3ff']) });
    }
  }

  // ---------- Vent (montagne des nuages) ----------
  // Le vent souffle par rafales : 3 secondes de vent, puis 2 secondes de calme.
  gust(z) {
    const k = (this.t + z.ph) % 5;
    if (k > 3.4) return 0;
    return Math.min(1, k / 0.4, (3.4 - k) / 0.4);
  }

  windZone(x) {
    const col = x / TILE;
    return this.winds.find((z) => col >= z.a && col < z.b + 1) || null;
  }

  // vitesse en plus (pixels par seconde) donnée par le vent ; plus forte en l'air
  windPush(b) {
    const z = this.windZone(b.x + b.w / 2);
    if (!z) return 0;
    return z.dir * this.gust(z) * (b.onGround ? 75 : 160) * this.diff.windK;
  }

  updateWinds(dt) {
    const p = this.player;
    for (const z of this.winds) {
      const g = this.gust(z);
      const x0 = z.a * TILE;
      const x1 = (z.b + 1) * TILE;
      const seen = x1 > this.cam.x - 100 && x0 < this.cam.x + VIEW_W + 100;
      if (g > 0.5 && !z.on && seen && p.cx > x0 - 500 && p.cx < x1 + 300) Sound.sfx.wind();
      z.on = g > 0.5;
      if (!seen || g <= 0) continue;
      // traînées de vent
      if (Math.random() < dt * 30 * g) {
        const x = z.dir > 0 ? Math.max(x0, this.cam.x) + rand(-40, 200) : Math.min(x1, this.cam.x + VIEW_W) - rand(-40, 200);
        this.spawn({ type: 'wind', x, y: this.cam.y + rand(60, VIEW_H - 40), vx: z.dir * rand(420, 620), life: rand(0.5, 0.9), size: rand(30, 60), dir: z.dir });
      }
    }
  }

  // ---------- Champignons et guimauves ----------
  springAt(c, r, big) {
    this.springs.set(c + ',' + r, 0);
    Sound.sfx.boing(big);
    const cx = c * TILE + TILE / 2;
    const cols = this.theme === 'candy' ? ['#ffffff', '#ffb3d9'] : ['#9ffcff', '#ffffff'];
    for (let i = 0; i < (big ? 14 : 8); i++) {
      this.spawn({ type: 'spark', x: cx + rand(-18, 18), y: r * TILE, vx: rand(-160, 160), vy: rand(-260, -60), life: 0.45, size: rand(3, 6), color: cols[i % 2] });
    }
    if (big) this.spawn({ type: 'ring', x: cx, y: r * TILE, life: 0.4, size: 60, color: 'rgba(255,255,255,0.9)' });
  }

  // ---------- Lumière (grotte) ----------
  // Un minerai ramassé : la lumière autour de Malice grandit un moment, de la couleur du minerai.
  lightUp(color) {
    this.lightT = 12;
    this.lightColor = color;
  }

  updateLight(dt) {
    if (this.lightT > 0) {
      this.lightT -= dt;
      this.lightBoost = Math.min(1, this.lightBoost + dt * 2.5);
    } else {
      this.lightBoost = Math.max(0, this.lightBoost - dt / 1.5);
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
      if (q.drag) q.vx *= Math.max(0, 1 - q.drag * dt);
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.vr) q.rot += q.vr * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  updateCamera(dt, snap) {
    const p = this.player;
    if (p.dead) return;
    // en courant, on voit plus loin devant
    const ahead = p.facing * (p.running ? 110 : 60);
    this.look = snap ? ahead : approach(this.look, ahead, dt * 140);
    let tx = p.cx - VIEW_W * 0.45 + this.look;
    let ty = p.y + p.h / 2 - VIEW_H * 0.56;
    tx = clamp(tx, 0, Math.max(0, this.width - VIEW_W));
    // pendant le combat contre un boss, l'écran reste sur son arène
    if (this.arena) tx = clamp(tx, this.arena.x0, this.arena.x1 - VIEW_W);
    // le terrier secret : la caméra ne descend sous terre que quand Malice y est
    const under = this.terrier && p.y + p.h > (this.terrier - 1) * TILE;
    const bottom = this.terrier && !under ? this.terrier * TILE : this.height;
    ty = clamp(ty, 0, Math.max(0, bottom - VIEW_H));
    if (snap) {
      this.cam.x = tx;
      this.cam.y = ty;
    } else {
      this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 7);
      this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 5);
      // sous terre (en tombant dans le terrier), ses pieds ne sortent jamais de l'écran par le bas
      if (under) this.cam.y = clamp(this.cam.y, p.y + p.h + 20 - VIEW_H, Math.max(0, bottom - VIEW_H));
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
    // avec un terrier, sous la surface tout est caché par la terre, les galeries ou le fond de la rivière :
    // on ne dessine le ciel et les collines que là où on les voit (jusqu'un peu sous l'herbe, pour l'eau)
    const sky = this.terrier ? (this.terrier - 2) * TILE + 16 - this.cam.y : VIEW_H;
    if (sky < VIEW_H) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, VIEW_W, Math.max(0, sky));
      ctx.clip();
    }
    if (sky > 0) Scenery.drawBackground(ctx, this.theme, this.cam.x, this.cam.y, this.t, this.flash);
    if (sky < VIEW_H) ctx.restore();
    ctx.save();
    ctx.translate(-camX, -camY);
    this.lights.length = 0;
    this.drawStormClouds(ctx);
    this.drawWinds(ctx);
    this.drawTrunks(ctx, camX, camY);
    this.drawCrowns(ctx);
    this.drawUpdrafts(ctx);
    this.runs = this.waterRuns(camX);
    this.drawBurrow(ctx, camX, camY);
    this.drawRiverBeds(ctx);
    this.drawDecor(ctx, camX);
    // (les fleurs-lanternes qu'on voit : cherchées une fois par image)
    this.glowsSeen = this.glows.filter((gl) => gl.x > camX - 150 && gl.x < camX + VIEW_W + 150);
    for (const gl of this.glowsSeen) Scenery.glowFlower(ctx, gl.x, gl.y, gl.v, this.t);
    for (const f of this.flowers) f.draw(ctx);
    ctx.restore();

    this.drawTiles(ctx, s, camX, camY);

    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawPuddles(ctx, camX);
    this.drawSlime(ctx);
    this.drawReeds(ctx, false);
    this.drawLutinShine(ctx, camX, camY);
    this.drawMagic(ctx);
    for (const cp of this.checkpoints) cp.draw(ctx);
    for (const d of this.puffs) {
      if (d.x > camX - 140 && d.x < camX + VIEW_W + 140) d.draw(ctx);
    }
    if (this.goal) this.goal.draw(ctx);
    // (les nénuphars qui flottent sont dessinés par-dessus l'eau, plus loin)
    for (const pl of this.platforms) {
      if (!pl.onWater) pl.draw(ctx);
    }
    for (const a of this.anchors) a.draw(ctx);
    for (const it of this.items) it.draw(ctx);
    for (const ce of this.critters) {
      if (this.onScreen(ce, 80)) ce.draw(ctx);
    }
    for (const b of this.bunnies) {
      if (b.x > camX - 80 && b.x < camX + VIEW_W + 80) b.draw(ctx);
    }
    // l'arène du boss : son décor et ses murs (même quand le boss n'est pas à l'écran)
    if (this.boss) this.boss.drawArena(ctx);
    for (const e of this.enemies) {
      if (e.x + e.w > camX - 80 && e.x < camX + VIEW_W + 80) e.draw(ctx);
    }
    for (const ec of this.eclairs) ec.draw(ctx);
    for (const h of this.hazards) h.draw(ctx);
    for (const pr of this.projectiles) pr.draw(ctx);
    this.player.draw(ctx);
    if (this.goal && this.goal.drawFront) this.goal.drawFront(ctx);
    for (const ec of this.eclairs) ec.drawWarning(ctx);
    this.drawLava(ctx, camX, camY);
    this.drawWater(ctx);
    for (const pl of this.platforms) {
      if (pl.onWater) pl.draw(ctx);
    }
    this.drawReeds(ctx, true);
    if (this.dark) this.drawDarkness(ctx, camX, camY);
    // (par-dessus la nuit : le cœur des fleurs qui brillent, et les lucioles)
    for (const gl of this.glowsSeen) Scenery.glowFlowerShine(ctx, gl.x, gl.y, gl.v, this.t);
    for (const f of this.fireflies) {
      if (this.onScreen(f, 60)) f.draw(ctx);
    }
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
    // (le trou caché sous un bloc lutin, dans le terrier, compte comme du sol : pas de bord dessiné)
    const isG = (c, r) => (r >= this.rows ? true : this.tileAt(c, r) === '#' || this.hiddenShaft(c, r));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = this.tiles[r][c];
        // (les troncs sont dessinés avant, avec le feuillage : voir drawTrunks)
        if (ch === '.' || ch === '~' || ch === '|' || ch === WATER) continue;
        let img = null;
        if (ch === '#') {
          // (pas d'herbe au fond de la rivière ; sous terre, dans le terrier, de la terre toute nue)
          const m = { t: !isG(c, r - 1) && r > 0 && this.tileAt(c, r - 1) !== WATER, l: !isG(c - 1, r), r: !isG(c + 1, r), b: !isG(c, r + 1) };
          img = Scenery.groundSprite(this.terrier && r >= this.terrier ? 'burrow' : th, m, Math.floor(hash2(c, r) * 4));
        } else if (ch === 'B') {
          img = Scenery.brickSprite(th);
        } else if (LUTIN_BLOCKS.includes(ch)) {
          img = Scenery.lutinSprite();
        } else if (ch === '-') {
          // (dans le terrier, les plateformes sont des racines)
          const pth = this.terrier && r >= this.terrier - 2 ? 'burrow' : th;
          img = Scenery.platformSprite(pth, this.tileAt(c - 1, r) !== '-', this.tileAt(c + 1, r) !== '-', Math.floor(hash2(c, r) * 3));
        } else if (ch === '=') {
          img = Scenery.rainbowSprite(this.tileAt(c - 1, r) !== '=', this.tileAt(c + 1, r) !== '=');
        } else if (ch === 'M') {
          img = Scenery.bounceSprite(th);
        } else if (ch === '^' || ch === 'v') {
          img = Scenery.thornSprite(th, ch === 'v', Math.floor(hash2(c, r) * 3));
        }
        if (!img) continue;
        const dx = Math.round((c * T - pad - camX) * s);
        let dy = Math.round((r * T - pad - camY) * s);
        if (ch === 'M' && this.springs.has(c + ',' + r)) {
          // le champignon s'écrase puis reprend sa forme
          const k = this.springs.get(c + ',' + r) / 0.4;
          dy += Math.round(Math.sin(k * Math.PI) * (1 - k) * 12 * s);
        }
        const dx2 = Math.round(((c + 1) * T + pad - camX) * s);
        const dy2 = Math.round(((r + 1) * T + pad - camY) * s);
        ctx.drawImage(img, dx, dy, dx2 - dx, dy2 - dy);
      }
    }
    ctx.restore();
  }

  // Les flaques d'eau, posées sur le sol (les cases w qui se touchent font une seule flaque).
  drawPuddles(ctx, camX) {
    const T = TILE;
    const c0 = Math.max(0, Math.floor(camX / T) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / T) + 1);
    for (let r = 0; r < this.rows; r++) {
      let c = c0;
      while (c <= c1) {
        if (this.tiles[r][c] !== 'w') { c++; continue; }
        let e = c;
        while (e + 1 < this.cols && this.tiles[r][e + 1] === 'w') e++;
        Scenery.puddle(ctx, c * T - 4, (e + 1) * T + 4, (r + 1) * T, this.t + c);
        c = e + 1;
      }
    }
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
        // sous un plafond (grotte), on cherche le vrai sol plus bas
        if (this.tiles[r - 1][c] === '#') continue;
        // (un bloc magique du Lutin posé par terre ne fait pas disparaître l'herbe)
        if (this.tiles[r - 1][c] !== '.' && this.tiles[r - 1][c] !== 'u') break;
        const h = hash2(c * 3.1, r * 1.7);
        if (h < 0.42) {
          const v = hash2(c, r + 9);
          const x = c * TILE + 10 + h * 50;
          Scenery.decor(ctx, this.theme, x, r * TILE + 2, v, this.t);
          // les petits champignons de la grotte (et les petites fleurs de la nuit) brillent dans le noir
          if (this.dark && v < (this.night ? 0.4 : 0.5)) this.lights.push({ x, y: r * TILE - 8, r: 46, a: 0.55 });
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
    const run = this.choco ? Scenery.drawChocoRun : Scenery.drawLavaRun;
    for (let r = r0; r <= r1; r++) {
      let c = c0;
      while (c <= c1) {
        if (this.tiles[r][c] !== '~') { c++; continue; }
        const surface = this.tileAt(c, r - 1) !== '~';
        let e = c;
        while (e + 1 <= c1 && this.tiles[r][e + 1] === '~' && (this.tileAt(e + 1, r - 1) !== '~') === surface) e++;
        let bottom = (r + 1) * TILE;
        if (r === this.rows - 1) bottom += 40;
        run(ctx, c * TILE, (e + 1) * TILE, r * TILE, surface, bottom, this.t);
        // dans le noir de la grotte, la lave éclaire
        if (this.dark && surface) {
          for (let k = c; k <= e; k++) this.lights.push({ x: k * TILE + TILE / 2, y: r * TILE + 10, r: 95, a: 0.7 });
        }
        c = e + 1;
      }
    }
  }

  // ---------- La Rivière aux Nénuphars ----------
  // Les morceaux de rivière qu'on voit : [première colonne, dernière colonne, rangée de la surface, fond].
  // (sous la surface, l'eau descend jusqu'à la première case qui n'est pas de l'eau ; calculés une fois par image)
  waterRuns(camX) {
    const c0 = Math.max(0, Math.floor(camX / TILE) - 2);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / TILE) + 2);
    const runs = [];
    for (let r = 1; r < this.rows; r++) {
      let c = c0;
      while (c <= c1) {
        if (this.tiles[r][c] !== WATER || this.tiles[r - 1][c] === WATER) { c++; continue; }
        let e = c;
        while (e + 1 <= c1 && this.tiles[r][e + 1] === WATER && this.tiles[r - 1][e + 1] !== WATER) e++;
        let b = r;
        while (b + 1 < this.rows && this.tiles[b + 1][c] === WATER) b++;
        runs.push({ c0: c, c1: e, r, bottom: (b + 1) * TILE + (b === this.rows - 1 ? 40 : 0) });
        c = e + 1;
      }
    }
    return runs;
  }

  // Le fond de la rivière (derrière tout) et l'eau elle-même (devant Malice : on voit la Sirène nager dedans,
  // et les nénuphars qui ont coulé).
  drawRiverBeds(ctx) {
    for (const w of this.runs) {
      Scenery.riverBed(ctx, w.c0 * TILE, (w.c1 + 1) * TILE, w.r * TILE, w.bottom, this.t);
    }
  }

  drawWater(ctx) {
    for (const w of this.runs) {
      Scenery.drawWaterRun(ctx, w.c0 * TILE, (w.c1 + 1) * TILE, w.r * TILE, w.bottom, this.t);
    }
  }

  // Les roseaux et les quenouilles au bord de l'eau (front : les petites herbes devant l'eau).
  drawReeds(ctx, front) {
    for (const w of this.runs) {
      const y = w.r * TILE;
      // une berge à gauche et à droite (s'il y a du sol)
      if (this.tileAt(w.c0 - 1, w.r) === '#') Scenery.reeds(ctx, w.c0 * TILE, y, 1, hash2(w.c0, w.r), this.t, front);
      if (this.tileAt(w.c1 + 1, w.r) === '#') Scenery.reeds(ctx, (w.c1 + 1) * TILE, y, -1, hash2(w.c1, w.r + 3), this.t, front);
    }
  }

  // ---------- Le terrier secret ----------
  // Les trous qui descendent au terrier, cachés sous un bloc lutin posé dans le sol (rangée "terrier" - 2) :
  // case du trou -> case du bloc qui le bouche.
  findShafts() {
    const shafts = new Map();
    if (!this.terrier) return shafts;
    const top = this.terrier - 2;
    for (let c = 0; c < this.cols; c++) {
      if (!LUTIN_BLOCKS.includes(this.tiles[top][c])) continue;
      for (let r = top + 1; r < this.terrier && !isSolidCh(this.tiles[r][c]); r++) shafts.set(r * this.cols + c, { c, r: top });
    }
    return shafts;
  }

  // Un trou caché : tant que son bloc lutin est là, on le dessine comme de la terre (sinon, on verrait le secret).
  hiddenShaft(c, r) {
    if (!this.shafts.size) return false;
    const lid = this.shafts.get(r * this.cols + c);
    return !!lid && LUTIN_BLOCKS.includes(this.tiles[lid.r][lid.c]);
  }

  // Les cases du terrier, colonne par colonne : les galeries (open) et la terre (pour la peindre derrière).
  // Calculées une fois, puis à nouveau quand une case change (bloc cassé, bloc magique du Lutin).
  burrowCells() {
    if (this.burrowCache) return this.burrowCache;
    const top = this.terrier - 2;
    const open = (c, r) => {
      const ch = this.tileAt(c, r);
      return r >= top && !isSolidCh(ch) && ch !== WATER && !this.hiddenShaft(c, r);
    };
    const dirt = Scenery.THEMES[this.theme].dirt;
    const cols = [];
    for (let c = 0; c < this.cols; c++) {
      const cells = [];
      for (let r = top; r < this.rows; r++) {
        if (open(c, r)) {
          // (par terre : seulement sur la terre, pas sur un bloc lutin)
          const floor = this.tileAt(c, r + 1) === '#';
          cells.push({
            r, open: true, v: hash2(c * 1.3, r * 2.1),
            o: { ceil: !open(c, r - 1) && r > top, floor, surface: r === top },
            lantern: floor && r !== top && hash2(c * 3.7, r) <= 0.34 ? hash2(c, r * 5) : -1,
          });
        } else if (this.tiles[r][c] === '#' || this.hiddenShaft(c, r)) {
          const hidden = this.hiddenShaft(c, r);
          cells.push({
            r, open: false, hidden, v: Math.floor(hash2(c, r) * 4),
            lip: this.tileAt(c, r - 1) === '#' || hidden ? 0 : 14, dirt: r >= this.terrier ? Scenery.THEMES.burrow.dirt : dirt,
          });
        }
      }
      // la lumière du jour tombe par un trou ouvert sur le ciel
      cols.push({ cells, beam: open(c, top) && !isSolidCh(this.tileAt(c, top - 1)) });
    }
    this.burrowCache = cols;
    return cols;
  }

  // Le terrier secret : des galeries de terre derrière tout ce qui n'est pas du sol (sous la rangée
  // "terrier" - 2 : le trou qui y descend aussi), des racines, et une lumière toute douce.
  drawBurrow(ctx, camX, camY) {
    if (!this.terrier) return;
    const T = TILE;
    const top = this.terrier - 2;
    const c0 = Math.max(0, Math.floor(camX / T) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / T) + 1);
    const r0 = Math.max(top, Math.floor(camY / T) - 1);
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / T) + 1);
    if (r0 > r1) return;
    const cols = this.burrowCells();
    const seen = (k) => k.r >= r0 && k.r <= r1;
    // derrière la terre, de la terre aussi : on ne voit pas le ciel entre deux cases
    // (mais pas derrière l'herbe du dessus, qui est arrondie)
    let any = false;
    for (let c = c0; c <= c1; c++) {
      for (const k of cols[c].cells) {
        if (!seen(k)) continue;
        if (k.open) { any = true; continue; }
        ctx.fillStyle = k.dirt;
        ctx.fillRect(c * T, k.r * T + k.lip, T + 1, T - k.lip + 1);
        // le trou sous le bloc lutin qui le bouche
        if (k.hidden) {
          const pad = Scenery.PAD;
          const img = Scenery.groundSprite(this.theme, { t: false, l: false, r: false, b: false }, k.v);
          ctx.drawImage(img, c * T - pad, k.r * T - pad, T + pad * 2, T + pad * 2);
        }
      }
    }
    if (!any) return;
    // le fond de terre, d'un seul morceau (pas de trait entre les cases)
    const g = ctx.createLinearGradient(0, top * T, 0, this.rows * T);
    g.addColorStop(0, '#6a4628');
    g.addColorStop(1, '#46301a');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let c = c0; c <= c1; c++) {
      for (const k of cols[c].cells) if (k.open && seen(k)) ctx.rect(c * T - 0.5, k.r * T - 0.5, T + 1, T + 1);
    }
    ctx.fill();
    for (let c = c0; c <= c1; c++) {
      for (const k of cols[c].cells) if (k.open && seen(k)) Scenery.burrowCell(ctx, c * T, k.r * T, k.v, this.t, k.o);
    }
    // la lumière du jour qui tombe par les trous, et la lumière douce des champignons qui brillent
    for (let c = c0; c <= c1; c++) {
      if (cols[c].beam) Scenery.burrowSunbeam(ctx, c * T, top * T, Math.min(this.rows, top + 9) * T, this.t + c);
    }
    for (let c = c0; c <= c1; c++) {
      for (const k of cols[c].cells) {
        if (k.open && k.lantern >= 0 && seen(k)) Scenery.burrowLantern(ctx, c * T + T / 2, (k.r + 1) * T, k.lantern, this.t);
      }
    }
  }

  // Petites flèches de vent qui défilent quand ça souffle.
  drawWinds(ctx) {
    for (const z of this.winds) {
      const g = this.gust(z);
      const x0 = z.a * TILE;
      const x1 = (z.b + 1) * TILE;
      if (g <= 0.02 || x1 < this.cam.x - 50 || x0 > this.cam.x + VIEW_W + 50) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, this.cam.y, x1 - x0, VIEW_H);
      ctx.clip();
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * g})`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const step = 150;
      const off = ((this.t * 260 * z.dir) % step + step) % step;
      for (let y = Math.floor(this.cam.y / 110) * 110 + 50; y < this.cam.y + VIEW_H; y += 110) {
        const shift = (Math.floor(y / 110) % 2) * 75;
        for (let x = x0 - step + off + shift; x < x1 + step; x += step) {
          ctx.beginPath();
          ctx.moveTo(x - z.dir * 9, y - 10);
          ctx.lineTo(x + z.dir * 3, y);
          ctx.lineTo(x - z.dir * 9, y + 10);
          ctx.moveTo(x + z.dir * 5, y - 10);
          ctx.lineTo(x + z.dir * 17, y);
          ctx.lineTo(x + z.dir * 5, y + 10);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // Les courants d'air qui montent : de longues traînées blanches qui ondulent vers le haut.
  drawUpdrafts(ctx) {
    for (const z of this.updrafts) {
      const x0 = z.a * TILE;
      const x1 = (z.b + 1) * TILE;
      if (x1 < this.cam.x - 50 || x0 > this.cam.x + VIEW_W + 50) continue;
      const top = z.top - 30;
      const g = ctx.createLinearGradient(0, top, 0, this.cam.y + VIEW_H);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.3, 'rgba(255,255,255,0.14)');
      g.addColorStop(1, 'rgba(255,255,255,0.2)');
      ctx.fillStyle = g;
      ctx.fillRect(x0 + 6, top, x1 - x0 - 12, this.cam.y + VIEW_H - top);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, top, x1 - x0, this.cam.y + VIEW_H - top);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const step = 90;
      for (let x = x0 + 22; x < x1 - 10; x += 34) {
        const off = (this.t * 160 + hash(x) * step) % step;
        for (let y = this.cam.y + VIEW_H + step - off; y > top - step; y -= step) {
          ctx.beginPath();
          ctx.moveTo(x + Math.sin(y * 0.05) * 5, y);
          ctx.quadraticCurveTo(x + Math.sin(y * 0.05 + 1.5) * 9, y - 15, x + Math.sin(y * 0.05 + 3) * 5, y - 30);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // Les troncs d'arbre (on passe devant), aussi derrière une branche qui les traverse.
  drawTrunks(ctx, camX, camY) {
    const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor(camY / TILE) - 1);
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / TILE) + 1);
    const th = Scenery.THEMES[this.theme];
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        // derrière l'écorce des gros troncs, du bois : on ne voit pas le ciel entre deux cases
        // (mais pas derrière la mousse du dessus, qui est arrondie)
        if (th.bark && this.tiles[r][c] === '#') {
          const more = (ch) => (ch === '#' ? 1 : 0);
          const top = this.tileAt(c, r - 1) === '#' ? 0 : 14;
          ctx.fillStyle = th.dirt;
          ctx.fillRect(c * TILE, r * TILE + top, TILE + more(this.tileAt(c + 1, r)), TILE - top + more(this.tileAt(c, r + 1)));
        }
        if (!this.trunkAt(c, r)) continue;
        const img = Scenery.trunkSprite(!this.trunkAt(c - 1, r), !this.trunkAt(c + 1, r), Math.floor(hash2(c, r) * 6));
        // (un tout petit peu plus haut que la case : pas de trait de ciel entre deux cases)
        ctx.drawImage(img, c * TILE, r * TILE, TILE, TILE + 1);
      }
    }
  }

  // Le feuillage en haut des troncs (devant les troncs, derrière les branches et derrière Malice).
  drawCrowns(ctx) {
    for (const k of this.crowns) {
      if (k.x + 200 < this.cam.x || k.x - 200 > this.cam.x + VIEW_W) continue;
      Scenery.crown(ctx, k.x, k.y, k.w, k.v, this.t);
    }
  }

  // Le noir de la grotte : on ne voit qu'autour de Malice et de ce qui brille.
  // La nuit, c'est plus doux : le ciel reste un peu clair, et tout ce qui fait mal brille un peu
  // (les yeux, les lampes des taupes…) : on le voit toujours venir.
  drawDarkness(ctx, camX, camY) {
    const p = this.player;
    // dessiné à moitié de la résolution (c'est flou de toute façon), puis agrandi : bien plus rapide sur tablette
    const s = this.game.scale / 2;
    const cw = Math.ceil(ctx.canvas.width / 2);
    const chh = Math.ceil(ctx.canvas.height / 2);
    if (!this.darkCv) this.darkCv = document.createElement('canvas');
    const cv = this.darkCv;
    if (cv.width !== cw || cv.height !== chh) {
      cv.width = cw;
      cv.height = chh;
    }
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, cw, chh);
    if (this.night) {
      // (au bout, sous le clair de lune du grand champ, il fait moins noir)
      const k = 1 - 0.55 * this.moonK(camX);
      const sky = g.createLinearGradient(0, 0, 0, chh);
      sky.addColorStop(0, `rgba(6,10,40,${0.42 * k})`);
      sky.addColorStop(0.5, `rgba(6,10,40,${0.78 * k})`);
      sky.addColorStop(1, `rgba(6,10,40,${0.9 * k})`);
      g.fillStyle = sky;
    } else {
      g.fillStyle = 'rgba(10,5,28,0.92)';
    }
    g.fillRect(0, 0, cw, chh);
    g.setTransform(s, 0, 0, s, -camX * s, -camY * s);
    g.globalCompositeOperation = 'destination-out';
    // (la nuit, la lumière autour de Malice est plus petite : c'est la lune et les lucioles qui éclairent)
    const R = this.diff.darkR * (this.night ? 0.6 : 1) + this.lightBoost * 170 + Math.sin(this.t * 7) * 3;
    const L = this.lights;
    L.push({ x: p.cx, y: p.cy - 6, r: R, a: 1 });
    const T = TILE;
    const c0 = Math.max(0, Math.floor(camX / T) - 2);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / T) + 2);
    for (let r = 0; r < this.rows; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = this.tiles[r][c];
        if (ch === 'M') L.push({ x: c * T + T / 2, y: r * T + 14, r: 120, a: 0.85 });
        else if (LUTIN_BLOCKS.includes(ch)) L.push({ x: c * T + T / 2, y: r * T + T / 2, r: 60, a: 0.5 });
      }
    }
    for (const it of this.items) {
      // les friandises restent dans le noir ; les minerais et les bonus brillent
      if (it.kind === 'candy' || it.kind === 'lollipop' || it.kind === 'ball' || !this.onScreen(it, 80)) continue;
      L.push({ x: it.x + it.w / 2, y: it.y + it.h / 2, r: it.kind === 'gem' ? 75 : 55, a: it.kind === 'gem' ? 0.9 : 0.65 });
    }
    for (const h of this.hazards) {
      // le bout en cristal des stalactites brille : on les voit venir
      if (h instanceof Stalactite && this.onScreen(h, 80)) L.push({ x: h.x + h.w / 2, y: h.y + h.h - 10, r: h.state === 'hang' ? 52 : 70, a: 0.75 });
    }
    for (const cp of this.checkpoints) {
      if (Math.abs(cp.x - p.cx) < VIEW_W) L.push({ x: cp.x + 10, y: cp.y - 70, r: cp.active ? 130 : 90, a: 0.75 });
    }
    if (this.goal) L.push({ x: this.goal.x + 20, y: this.goal.y - 110, r: 180, a: 0.9 });
    for (const e of this.enemies) {
      // les chauves-souris réveillées ont les yeux qui brillent un peu
      if (e instanceof Bat && e.state !== 'sleep' && !e.dying && this.onScreen(e)) L.push({ x: e.cx, y: e.cy, r: 42, a: 0.45 });
    }
    if (this.night) this.nightLights(L, camX, camY);
    const blob = lightBlob();
    for (const l of L) {
      g.globalAlpha = l.a;
      g.drawImage(blob, l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    g.globalAlpha = 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(cv, 0, 0, cw * 2, chh * 2);
    ctx.restore();
    // la lumière d'un minerai a sa couleur
    if (this.lightBoost > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 * this.lightBoost;
      const gl = ctx.createRadialGradient(p.cx, p.cy, 10, p.cx, p.cy, R);
      gl.addColorStop(0, this.lightColor);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(p.cx - R, p.cy - R, R * 2, R * 2);
      ctx.restore();
    }
  }

  // La nuit : ce qui éclaire en plus (la lune, les lucioles, les fleurs, l'eau de la rivière),
  // et une petite lumière autour de chaque ennemi (la lampe des taupes, même sous terre).
  nightLights(L, camX, camY) {
    const m = Scenery.moonPos(camX, camY);
    L.push({ x: camX + m.x, y: camY + m.y, r: m.r * 3.4, a: 0.9 });
    for (const e of this.enemies) {
      if (!this.onScreen(e, 80)) continue;
      L.push(e.light ? e.light() : { x: e.cx, y: e.cy, r: 58, a: 0.6 });
    }
    // ce qui tombe ou ce qu'on lance brille un peu aussi : on le voit toujours venir
    for (const h of this.hazards) {
      if (this.onScreen(h, 80)) L.push(h.light ? h.light() : { x: h.x + h.w / 2, y: h.y + h.h / 2, r: 58, a: 0.6 });
    }
    for (const pr of this.projectiles) {
      if (this.onScreen(pr, 60)) L.push(pr.light ? pr.light() : { x: pr.x + pr.w / 2, y: pr.y + pr.h / 2, r: 44, a: 0.55 });
    }
    for (const f of this.fireflies) {
      if (this.onScreen(f, 200)) L.push(f.light());
    }
    for (const gl of this.glowsSeen) L.push({ x: gl.x + 8, y: gl.y - 50, r: 110, a: 0.85 });
    for (const f of this.flowers) {
      if (f.x > camX - 80 && f.x < camX + VIEW_W + 80) L.push({ x: f.x, y: f.y - 36, r: 62, a: 0.6 });
    }
    // les pissenlits géants sont tout blancs sous la lune : on les voit de loin
    for (const d of this.puffs) {
      if (d.x < camX - 100 || d.x > camX + VIEW_W + 100 || !d.ready()) continue;
      const h = d.head();
      L.push({ x: h.x, y: h.y, r: 78, a: 0.7 });
    }
    // la lune se reflète dans la rivière (seulement là où on la voit)
    const c0 = Math.floor((camX - 80) / TILE);
    const c1 = Math.ceil((camX + VIEW_W + 80) / TILE);
    for (const w of this.runs) {
      for (let c = Math.max(w.c0, c0); c <= Math.min(w.c1, c1); c += 2) L.push({ x: c * TILE + TILE, y: w.r * TILE + 18, r: 72, a: 0.38 });
    }
  }

  // Combien on est sous le clair de lune du grand champ (de 0 à 1), d'après la caméra :
  // la lumière arrive doucement en approchant de la première colonne, et repart après la dernière.
  moonK(camX) {
    if (!this.moonlight) return 0;
    const x = camX + VIEW_W / 2;
    const [a, b] = this.moonlight;
    const into = (x - a * TILE + VIEW_W * 0.3) / (VIEW_W * 0.8);
    const out = ((b + 1) * TILE + VIEW_W * 0.3 - x) / (VIEW_W * 0.8);
    return clamp(Math.min(into, out), 0, 1);
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
        case 'note':
          // note de musique : contour fin pour que la couleur se voie bien
          ctx.font = `700 ${q.size}px Fredoka, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(255,255,255,0.9)';
          ctx.strokeText(q.text, q.x, q.y);
          ctx.fillStyle = q.color;
          ctx.fillText(q.text, q.x, q.y);
          break;
        case 'seed':
          // une graine de pissenlit qui se balance sous son parachute
          ctx.globalAlpha = Math.min(1, a * 2.5);
          Art.dandelionSeed(ctx, q.x + Math.sin(q.life * 3 + q.wob) * 6, q.y, q.size, Math.sin(q.life * 3 + q.wob) * 0.35);
          break;
        case 'fish':
          // le petit poisson qui saute de la casquette de Malice (il frétille)
          ctx.globalAlpha = Math.min(1, a * 4);
          ctx.translate(q.x, q.y);
          ctx.rotate(Math.atan2(q.vy, q.vx) + Math.sin(q.life * 30) * 0.25);
          Art.fish(ctx, 0, 0, q.size, q.hue, q.life);
          break;
        case 'leaf': {
          // une feuille qui monte en tournoyant (courant d'air)
          ctx.globalAlpha = Math.min(1, a * 3) * 0.85;
          ctx.translate(q.x + Math.sin(q.life * 2.5 + q.wob) * 12, q.y);
          ctx.rotate(q.rot);
          ctx.scale(q.size, q.size * Math.cos(q.life * 4 + q.wob));
          ctx.fillStyle = q.color;
          ctx.beginPath();
          ctx.moveTo(-8, 0);
          ctx.quadraticCurveTo(0, -6, 8, 0);
          ctx.quadraticCurveTo(0, 6, -8, 0);
          ctx.fill();
          ctx.strokeStyle = 'rgba(40,100,30,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(7, 0);
          ctx.stroke();
          break;
        }
        case 'straw':
          // un brin de paille qui vole en tournoyant (l'Épouvantail)
          ctx.translate(q.x, q.y);
          ctx.rotate(q.rot);
          ctx.strokeStyle = q.color;
          ctx.lineWidth = 2.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-q.size / 2, 0);
          ctx.lineTo(q.size / 2, 0);
          ctx.stroke();
          break;
        case 'feather':
          // une plume noire de corbeau qui se balance en tombant
          ctx.translate(q.x + Math.sin(q.life * 5 + q.rot) * 6, q.y);
          ctx.rotate(Math.sin(q.life * 4 + q.rot) * 0.6 + 0.4);
          ctx.scale(q.size, q.size);
          ctx.fillStyle = '#2a2444';
          ellipsePath(ctx, 0, 0, 8, 2.6, 0);
          ctx.fill();
          ctx.strokeStyle = '#8a80b0';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-9, 0);
          ctx.lineTo(7, 0);
          ctx.stroke();
          break;
        case 'wind': {
          ctx.globalAlpha = Math.min(1, a * 2) * 0.7;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(q.x, q.y);
          ctx.quadraticCurveTo(q.x - q.dir * q.size * 0.5, q.y - 5, q.x - q.dir * q.size, q.y);
          ctx.stroke();
          break;
        }
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
