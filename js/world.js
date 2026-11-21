'use strict';

const LUTIN_BLOCKS = 'LFKCS';
// le bouchon en chocolat (le Défi du Bocal à éclairs) : il est solide, et seul un éclair au chocolat lancé avec le
// bocal le fait fondre (voir meltPlug)
const PLUG = '%';
// la glace du Glacier Fumant : un bloc solide où l'on glisse (voir ICE_PHYS dans entities.js, et iceUnder)
const ICE = '+';
// u : bloc magique du Lutin (il disparaît tout seul)
const isSolidCh = (ch) => ch === '#' || ch === 'B' || ch === 'M' || ch === 'u' || ch === ICE || ch === PLUG || LUTIN_BLOCKS.includes(ch);
// plateformes qu'on traverse par dessous : planche, nuage… pont arc-en-ciel, ou paratonnerre (le Phare sur la Falaise)
const isLedgeCh = (ch) => ch === '-' || ch === '=' || ch === 'z';
// l'eau de la rivière (la Rivière aux Nénuphars)
const WATER = '_';
// les éboulis de la Grande Glissade : une case où passe la pente de cailloux (voir "glissades" et findScree)
const SCREE = '>';
// La caméra de la Grande Glissade : comme dans un niveau où l'on grimpe, elle suit le sol où Malice a les pieds, ses
// pieds un peu plus haut sur l'écran (feet, une part de la hauteur de l'écran : on voit bien la pente qui descend
// devant elle) ; en glissant, elle regarde plus loin devant (ahead pixels). Pour le fond : voir render.
const SCREE_CAM = { feet: 0.6, ahead: 170 };
const SCREE_BG = 240;
// En arrivant sur la pente, ou en y restant, ses pieds se posent sur les cailloux s'ils en sont à moins de stick pixels
// (en descendant la pente, ils la suivent sans décoller ; voir screeSnap).
const SCREE_STICK = 18;
// la bave des escargots : elle glisse pendant SLIME_WET secondes, puis elle sèche (et disparaît à SLIME_TIME)
const SLIME_WET = 7;
const SLIME_TIME = 9;
// les minerais de la grotte, dans l'ordre de Art.GEMS : or, rubis, émeraude, topaze, diamant
const GEM_CHARS = 'gretd';
const MAGIC_TIME = 6;
const MAGIC_MAX = 4;
// la caméra "basVisible" (voir updateCamera) : elle monte quand le haut de Malice arrive à CAM_HEAD pixels du
// haut de l'écran, et le haut de Malice n'est jamais à moins de CAM_HEAD_MIN pixels du haut de l'écran
const CAM_HEAD = 100;
const CAM_HEAD_MIN = 40;
// la caméra des niveaux où l'on grimpe ("grimpe", voir updateCamera) : les pieds de Malice sont à CLIMB_FEET de la
// hauteur de l'écran (on voit bien l'étage du dessus) ; sa tête n'est jamais à moins de CLIMB_TOP pixels du haut de
// l'écran, ni ses pieds à moins de CLIMB_BOTTOM pixels du bas
const CLIMB_FEET = 0.78;
const CLIMB_FEET_CRUE = 0.66;
const CLIMB_TOP = 36;
const CLIMB_BOTTOM = 24;
// le Phare sur la Falaise : sa grande lumière fait un tour en turn secondes (elle a deux faisceaux) ;
// le fond, autour du phare : la mer au loin (voir Scenery BG.storm), et depuis la falaise, le phare tout petit au loin
// (far : de 1, bien visible, à 0 ; ang : sa lumière, voir render) ; quand on monte, le fond descend de sea pixels au plus
// (ensuite, la mer reste à l'horizon : en haut du phare, aussi haut soit-il, on la voit toujours au même endroit)
const LIGHTHOUSE = { turn: 7, sea: 633 };
const LIGHTHOUSE_BG = { sea: true, far: 0, ang: 0 };
// un orage qui n'est que sur un étage apparaît en fondu, sur STORM_FADE pixels de glissement de l'écran
const STORM_FADE = 150;
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
    // le Moulin à Vent : les moulins (leurs planches sont dans platforms), et la pluie ("pluie")
    this.mills = [];
    this.rain = !!def.pluie;
    this.rainT = 0;
    // la Crue : l'eau de la rivière qui déborde et monte (voir Flood ; créée plus bas, quand on sait où Malice repart)
    this.flood = null;
    // le Phare sur la Falaise : les paratonnerres (z : leurs plaques restent dans les cases, voir LightningRod), et le
    // phare ("phare" : sa tour et sa galerie, dans le décor ; le rocher : passé le rocher, l'écran reste à sa droite)
    this.rods = [];
    const ph = def.phare;
    this.lighthouse = ph ? {
      x0: ph.tour[0] * TILE, x1: (ph.tour[1] + 1) * TILE, top: ph.galerie * TILE,
      rock0: ph.rocher[0], rock1: ph.rocher[1], rockX: ph.rocher[0] * TILE, foot: this.height,
    } : null;
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
    // le Bord du Cratère : les colonnes où le volcan gronde et crache des pierres de lave ("volcan" : [début, fin]), les
    // pierres qui tombent ou refroidissent par terre (voir LavaBomb), le grondement (rumble : combien de temps la terre
    // tremble encore), et le volcan du fond qui crache (belch, de 1 à 0) ; pas de grondement juste après une reprise
    this.volcan = def.volcan || [];
    this.bombs = [];
    // (les zones où le volcan a déjà grondé une fois : voir lavaTargets)
    this.volcanSeen = new Set();
    this.volcanT = 3;
    this.rumble = 0;
    this.belch = 0;
    // le grand nid de Maman Aigle, sur son pic ("nid" : [colonne, rangée du sol où il est posé]), dans le décor
    this.nest = def.nid ? { x: (def.nid[0] + 0.5) * TILE, y: def.nid[1] * TILE } : null;
    this.flash = 0;
    this.flashT = 3;
    this.shakeMag = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.cam = { x: 0, y: 0 };
    this.look = 60;
    // monde des bonbons : la lave est une rivière de chocolat
    // (le Marais aux Cabanes : c'est de la boue, où l'on s'enfonce pareil)
    this.mud = def.theme === 'marsh';
    this.choco = def.theme === 'candy' || this.mud;
    // (ses couleurs : les gouttes, les éclaboussures, Malice enfoncée dedans… voir SINK)
    this.sink = this.mud ? SINK.mud : SINK.choco;
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
    // le Glacier Fumant : des plaques de glace dans le niveau (les cases +), et leurs fumerolles (voir findVents)
    this.ice = false;
    this.vents = [];
    // les petites scènes pour rire, qui ne touchent à rien (la taupe qui sort voir Malice la tête en bas)
    this.gags = [];
    // le pont de corde qui s'enfonce sous les pieds de Malice : où (x, rangée), et de combien (k, de 0 à 1)
    this.sag = { x: 0, r: -1, k: 0 };
    this.bunnies = [];
    this.terrier = def.terrier || 0;
    // Dans le Vieux Chêne : les lianes (J), et les petites bêtes du décor (écureuils, nids) qui ne touchent à rien ;
    // le tronc ("tronc" : sa première et sa dernière colonne, murs compris) : dehors, on le voit de l'extérieur
    this.vines = [];
    this.decos = [];
    this.trunk = def.tronc ? { c0: def.tronc[0], c1: def.tronc[1], x0: def.tronc[0] * TILE, x1: (def.tronc[1] + 1) * TILE } : null;
    // (la caméra des niveaux où l'on grimpe suit l'étage où Malice a les pieds : voir updateCamera)
    this.camFeet = 0;
    this.facadeK = 1;
    // "cachette" : le coin secret tout en haut d'un arbre, caché derrière un gros feuillage (k : de 1, fermé, à 0)
    const hd = def.cachette;
    this.hideout = hd ? { x0: hd[0] * TILE, y0: hd[1] * TILE, x1: (hd[2] + 1) * TILE, y1: (hd[3] + 1) * TILE, k: 1, found: false } : null;
    // "feuillage" : de gros feuillages dans le décor (les lianes y sont accrochées ; on passe à travers)
    this.foliage = (def.feuillage || []).map((f) => ({ x0: f[0] * TILE, y0: f[1] * TILE, x1: (f[2] + 1) * TILE, y1: (f[3] + 1) * TILE }));
    // les branches (=) sur les grands arbres du sous-bois (voir "branches" dans Scenery.THEMES)
    this.branchy = !!Scenery.THEMES[this.theme].branches;
    // (et ses murs, au-dessus du sol : de grosses souches d'arbres, avec de l'écorce et de la mousse dessus)
    this.stumps = !!Scenery.THEMES[this.theme].stumps;
    const bunnySpots = [];
    // le boss du bout du niveau (voir boss.js), et son arène quand on ne peut plus en sortir
    this.boss = null;
    this.arena = null;

    // la Grande Glissade : les pentes d'éboulis ("glissades"), où l'on glisse sans pouvoir s'arrêter (voir findScree ;
    // avant les ennemis : les hérissons de roche se posent sur la pente)
    this.scree = def.glissades ? this.findScree(def.glissades) : null;
    this.screeHit = null;

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
          case 'h': this.enemies.push(new Hedgehog(this, mx - 20, by - 30)); break;
          // le Glacier Fumant : un pingouin grincheux (ses pieds sur le sol de la case du dessous)
          case '1': this.enemies.push(new GrumpyPenguin(this, mx, by)); break;
          case ICE: this.ice = true; keep = true; break;
          // la Grande Glissade : un hérisson de roche, posé sur la pente (sa case reste des éboulis), ou sur le sol de la
          // case du dessous
          case '0':
            if (this.screeCell(c, r)) {
              this.tiles[r][c] = SCREE;
              keep = true;
            }
            this.enemies.push(new RockHog(this, mx, by));
            break;
          case 's': this.enemies.push(new Boar(this, mx - 28, by - 40)); break;
          case 'f': this.enemies.push(new Frog(this, mx - 20, by - 30)); break;
          // le moulin à vent : l'axe de ses ailes (ses planches sont des plateformes, voir Windmill)
          case 'x': this.mills.push(new Windmill(this, mx, y + TILE / 2)); break;
          // la Crue : un petit nuage grognon (il flotte au-dessus du sol de son étage)
          case 'a': this.enemies.push(new GrumpyCloud(this, mx, y + TILE / 2)); break;
          case '&':
            this.boss = Boss.create(this, def.boss, mx, by);
            if (this.boss) this.enemies.push(this.boss);
            break;
          case 'i': this.fireflies.push(new Fireflies(this, mx, y + TILE / 2)); break;
          case 'j': this.glows.push({ x: mx, y: by, v: hash2(c, r) }); break;
          // le Phare sur la Falaise : la plaque d'un paratonnerre (elle reste dans les cases : voir findRods)
          case 'z': keep = true; break;
          case 'n':
          case 'c':
            // un nénuphar posé sur l'eau (sous lui, la rivière continue)
            this.platforms.push(new LilyPad(this, mx, y + 14, ch === 'c'));
            this.tiles[r][c] = WATER;
            keep = true;
            break;
          case 'l': bunnySpots.push({ x: mx, y: by, r }); break;
          case 'J': {
            // une liane : elle pend du haut de la première case J, aussi longue que les J du dessous
            if (this.tiles[r - 1] && def.map[r - 1][c] === 'J') break;
            let n = 1;
            while (r + n < this.rows && def.map[r + n][c] === 'J') n++;
            this.vines.push(new Vine(this, mx, y, n * TILE));
            break;
          }
          case 'q': this.decos.push(new Squirrel(this, mx, by)); break;
          case 'k': this.decos.push(new Nest(this, mx, by)); break;
          case 'p': this.decos.push(new SecretNest(this, mx, by, c + ',' + r)); break;
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
    // (le sol du départ, P : dans un niveau où l'on grimpe, on y marche comme dans un niveau ordinaire, voir Checkpoint)
    this.startFloor = start.y;
    // (le boss cache l'arrivée jusqu'à ce qu'il soit battu, et appelle ses aides)
    if (this.boss) this.boss.setup();
    // les fleurs parlent dans l'ordre, de gauche à droite (pendant le retour, c'est le bébé oiseau) ;
    // dans un niveau où l'on grimpe ("grimpe"), de bas en haut, et les drapeaux aussi
    const order = def.grimpe ? (a, b) => b.y - a.y || a.x - b.x : (a, b) => a.x - b.x;
    flowerSpots.sort(order);
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
    // les drapeaux sont numérotés de gauche à droite (même s'il y en a un plus bas, dans un terrier), ou de bas en haut
    this.checkpoints.sort(order);
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
    // la Crue : à la reprise d'un drapeau, l'eau est arrêtée sous l'étage du drapeau (voir Flood)
    if (def.crue) this.flood = new Flood(this, def.crue, start);
    // les escargots, les hérissons et les sangliers partent du côté opposé à l'endroit où Malice apparaît
    // (au début, ou à un drapeau) : ils ne foncent pas tout de suite sur elle
    for (const e of this.enemies) {
      if (e instanceof Snail || e instanceof Hedgehog || e instanceof Boar) e.dir = e.cx < start.x ? -1 : 1;
      // (les pingouins grincheux, eux, regardent du côté où elle arrive : ils sont tous loin des drapeaux, et une bosse ou
      // un trou les sépare du drapeau d'avant)
      if (e instanceof GrumpyPenguin) e.dir = e.cx < start.x ? 1 : -1;
    }
    // les paratonnerres (chaque suite de z côte à côte), numérotés de bas en haut
    this.rods = this.findRods();
    // le Glacier Fumant : les fumerolles, là où la glace touche la roche chaude (voir findVents)
    this.vents = this.ice ? this.findVents() : [];
    this.ventSnd = 0;
    // (le pied du phare : le haut du sol, sous le milieu de sa tour)
    if (this.lighthouse) {
      const L = this.lighthouse;
      const mid = Math.floor((L.x0 + L.x1) / 2 / TILE);
      let r = this.rows;
      while (r > 0 && isSolidCh(this.tileAt(mid, r - 1))) r--;
      L.foot = r * TILE;
    }
    // le terrier : les trous cachés sous un bloc lutin, et les cases des galeries (voir burrowCells)
    this.shafts = this.findShafts();
    this.burrowCache = null;
    this.crowns = this.findCrowns();
    // les Champignons Géants : les grands chapeaux de champignons (voir findCaps)
    this.caps = Scenery.THEMES[this.theme].caps ? this.findCaps() : [];
    // le Marais aux Cabanes : les cabanes sur pilotis et les ponts de corde (voir findCabins)
    this.cabins = Scenery.THEMES[this.theme].cabins ? this.findCabins() : null;
    this.bridges = this.cabins ? this.findBridges() : [];
    // (et la brume au ras de la boue : les suites de cases de boue à la surface, voir drawMist)
    this.mists = this.mud ? this.runsOf((c, r) => this.tiles[r][c] === '~' && (r === 0 || this.tiles[r - 1][c] !== '~')) : [];
    // le Vieux Chêne : sa porte (les cases vides tout en bas de son mur de gauche), et ce que le fond doit savoir
    // (la hauteur du niveau ; "couronne" : la rangée où le tronc s'ouvre en haut, sous les feuilles)
    if (this.trunk) {
      this.door = this.findDoor();
      this.oakInfo = { height: this.height, crown: (def.couronne || 0) * TILE };
    }
    this.updateCamera(0, true);
  }

  // Une friandise juste au-dessus du sol s'y pose ; en l'air, elle reste au milieu de sa case
  // (sinon Malice attraperait sans sauter celles qui flottent juste au-dessus de sa tête).
  treatY(kind, c, r) {
    const below = this.tileAt(c, r + 1);
    if (isSolidCh(below) || below === '-' || below === 'z') return (r + 1) * TILE - ITEM_SIZE[kind] / 2 - 3;
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

  // ---------- La Grande Glissade : les pentes d'éboulis ----------
  // Chaque glissade [c0, r0, c1, r1] est une pente toute droite, du coin en haut à gauche de la case (c0, r0) jusqu'au
  // coin en bas à droite de la case (c1, r1). Les cases > de la carte sont celles où passe la pente (ailleurs, sur sa
  // ligne, il y a un rocher ou un trou), et sous la pente, c'est de la terre (#). Pour chaque colonne : ses pentes
  // (lines) ; fill : les cases de terre juste sous les éboulis (on ne s'y cogne pas, on glisse sur la pente au-dessus).
  findScree(list) {
    const T = TILE;
    const lines = new Array(this.cols).fill(null);
    for (const [c0, r0, c1, r1] of list) {
      const L = { x0: c0 * T, y0: r0 * T, x1: (c1 + 1) * T, k: (r1 + 1 - r0) / (c1 + 1 - c0) };
      for (let c = Math.max(0, c0); c <= Math.min(this.cols - 1, c1); c++) (lines[c] = lines[c] || []).push(L);
    }
    const fill = new Uint8Array(this.rows * this.cols);
    // rock : les cases de terre au-dessus de la pente (les rochers posés dessus : dessinés comme de grosses pierres)
    const rock = new Uint8Array(this.rows * this.cols);
    // (déjà là pour screeCell, juste en dessous)
    this.scree = { lines, fill, rock };
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 1; r++) {
        // (un hérisson de roche posé sur la pente : sa case aussi, voir le constructeur)
        const ch = this.tiles[r][c];
        if (ch !== SCREE && !(ch === '0' && this.screeCell(c, r))) continue;
        for (let rr = r + 1; rr < this.rows && isSolidCh(this.tiles[rr][c]); rr++) fill[rr * this.cols + c] = 1;
      }
      // (un rocher : de la terre là où passe la pente, et au-dessus)
      for (const L of lines[c] || []) {
        const y = L.y0 + L.k * (c * TILE + TILE / 2 - L.x0);
        for (let r = Math.floor(y / TILE); r >= 0 && this.tiles[r][c] === '#'; r--) rock[r * this.cols + c] = 1;
      }
    }
    return this.scree;
  }

  // La pente d'une glissade passe-t-elle dans la case (c, r) ?
  screeCell(c, r) {
    const ls = this.scree && this.scree.lines[c];
    return !!ls && ls.some((L) => {
      const ya = L.y0 + L.k * (c * TILE - L.x0);
      const yb = ya + L.k * TILE;
      return yb > r * TILE + 0.5 && ya < (r + 1) * TILE - 0.5;
    });
  }

  // La hauteur de la pente d'éboulis à x (la plus proche de near), ou null s'il n'y a pas d'éboulis là (pas de pente,
  // ou un rocher, ou un trou). line : la pente trouvée (sa pente k), dans screeHit.
  screeY(x, near) {
    const S = this.scree;
    const c = Math.floor(x / TILE);
    const ls = S && c >= 0 && c < this.cols ? S.lines[c] : null;
    if (!ls) return null;
    let best = null;
    for (const L of ls) {
      const y = L.y0 + L.k * (x - L.x0);
      if (this.tileAt(c, Math.floor((y - 1) / TILE)) !== SCREE && this.tileAt(c, Math.floor((y + 1) / TILE)) !== SCREE) continue;
      if (best === null || Math.abs(y - near) < Math.abs(best - near)) {
        best = y;
        this.screeHit = L;
      }
    }
    return best;
  }

  // Après avoir bougé (voir moveBody) : les pieds sur la pente ? b.slope : la pente où il glisse (ou null).
  // On s'y pose en arrivant d'au-dessus ; posé dessus, on la suit en descendant (sans décoller), et en la remontant ;
  // en sautant (on monte), on la quitte.
  screeSnap(b, prevBottom, res) {
    const was = b.slope;
    b.slope = null;
    if (b.vy < 0) return;
    const feet = b.y + b.h;
    const sy = this.screeY(b.x + b.w / 2, feet);
    if (sy === null) return;
    // (déjà posé plus haut : sur un rocher, au bord de la pente)
    if (b.onGround && feet <= sy + 0.5) return;
    const from = feet >= sy && prevBottom <= sy + (was ? SCREE_STICK : 2);
    const stick = was && feet < sy && sy - feet <= SCREE_STICK;
    if (!from && !stick) return;
    b.y = sy - b.h;
    b.vy = 0;
    b.onGround = true;
    b.slope = this.screeHit;
    res.landed = true;
  }

  // Tombée dans une crevasse, sous la pente : le bord d'en face (les cases > de la colonne c, entre les rangées r0 et r1)
  // est un mur, sinon on rentrerait dans la terre sous les éboulis. x : le bord de la colonne qu'on touche.
  screeWall(b, c, r0, r1, x) {
    let found = false;
    for (let r = r0; r <= r1 && !found; r++) found = this.tileAt(c, r) === SCREE;
    if (!found) return false;
    const sy = this.screeY(x, b.y + b.h);
    return sy !== null && b.y + b.h > sy + SCREE_STICK;
  }

  // Une case de terre juste sous les éboulis (sa première rangée), sous un corps qui a les pieds sur la pente (voir
  // moveBody) ?
  underScree(b, c, r) {
    if (!this.scree || this.scree.fill[r * this.cols + c] !== 1) return false;
    const sy = this.screeY(b.x + b.w / 2, b.y + b.h);
    return sy !== null && r * TILE < sy + TILE;
  }

  // Déplace un objet en tenant compte des murs, du sol et des plateformes traversables.
  moveBody(b, dt, onFloorHit) {
    const T = TILE;
    const res = { wall: 0, landed: false, ceil: null };
    if (b.vx !== 0) {
      b.x += b.vx * dt;
      const r0 = Math.floor(b.y / T);
      const r1 = Math.floor((b.y + b.h - 0.01) / T);
      // (sur la pente d'éboulis, la terre juste sous les pieds n'est pas un mur : on remonte la pente sans s'y cogner)
      const fill = b.slope && this.scree ? this.scree.fill : null;
      const step = b.y + b.h - SCREE_STICK;
      if (b.vx > 0) {
        const c = Math.floor((b.x + b.w - 0.01) / T);
        for (let r = r0; r <= r1; r++) {
          if (isSolidCh(this.tileAt(c, r)) && !(fill && r * T > step && fill[r * this.cols + c] === 1)) {
            b.x = c * T - b.w;
            res.wall = 1;
            break;
          }
        }
        if (!res.wall && this.scree && this.screeWall(b, c, r0, r1, c * T + 1)) {
          b.x = c * T - b.w;
          res.wall = 1;
        }
      } else {
        const c = Math.floor(b.x / T);
        for (let r = r0; r <= r1; r++) {
          if (isSolidCh(this.tileAt(c, r)) && !(fill && r * T > step && fill[r * this.cols + c] === 1)) {
            b.x = (c + 1) * T;
            res.wall = -1;
            break;
          }
        }
        if (!res.wall && this.scree && this.screeWall(b, c, r0, r1, (c + 1) * T - 1)) {
          b.x = (c + 1) * T;
          res.wall = -1;
        }
      }
      if (res.wall) b.vx = 0;
    }
    const prevBottom = b.y + b.h;
    b.y += b.vy * dt;
    b.onGround = false;
    const scree = !!this.scree;
    const c0 = Math.floor((b.x + 0.01) / T);
    const c1 = Math.floor((b.x + b.w - 0.01) / T);
    if (b.vy > 0) {
      const r = Math.floor((b.y + b.h) / T);
      let tiles = [];
      for (let c = c0; c <= c1; c++) {
        const ch = this.tileAt(c, r);
        // (sur la pente d'éboulis, on se pose sur la pente, pas sur la terre en dessous : voir screeSnap)
        if (scree && this.underScree(b, c, r)) continue;
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
    if (scree) this.screeSnap(b, prevBottom, res);
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
    // (la Crue : l'eau qui a monté ; la Grande Glissade : la pente d'éboulis)
    let f = this.flood && this.flood.y >= fromY ? this.flood.y : Infinity;
    if (this.scree) {
      const sy = this.screeY(x, fromY);
      if (sy !== null && sy >= fromY) f = Math.min(f, sy);
    }
    for (let r = Math.max(0, Math.floor(fromY / TILE)); r < this.rows && r * TILE < f; r++) {
      const ch = this.tileAt(c, r);
      if (isSolidCh(ch) || isLedgeCh(ch)) return r * TILE;
      if (ch === '~' || ch === WATER) return r * TILE + 12;
    }
    return f < Infinity ? f : this.height + 200;
  }

  // Au-dessus de la lave (ou du chocolat, ou de la boue) ? Il suffit d'un bout de Malice,
  // et une planche ou un nuage au-dessus de la lave compte aussi (on ne peut pas y esquiver).
  overLava(b) {
    for (const x of [b.x + 2, b.x + b.w / 2, b.x + b.w - 2]) {
      const c = Math.floor(x / TILE);
      for (let r = Math.max(0, Math.floor((b.y + b.h - 1) / TILE)); r < this.rows; r++) {
        const ch = this.tileAt(c, r);
        if (ch === '~') return true;
        if (isSolidCh(ch) || ch === WATER) break;
      }
    }
    return false;
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
    // la Crue : l'eau remplit tout ce qui est vide sous sa surface
    if (this.flood && feet > this.flood.y + deep) return this.flood.y;
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

  // Un drapeau qu'on voit : le mât (et sa boule, son tissu) ou son papillon, qui voltige autour.
  flagSeen(cp) {
    return this.onScreen({ x: cp.x - 50, y: cp.y - 140, w: 110, h: 150 }, 40) || (!!cp.butterfly && this.onScreen(cp.butterfly, 80));
  }

  // Une plateforme qu'on voit (seulement celles dont on connaît la taille : les autres sont toujours dessinées ; les
  // planches du moulin regardent elles-mêmes si on voit le moulin).
  platformSeen(pl) {
    return !(pl instanceof MovingPlatform || pl instanceof LilyPad) || this.onScreen(pl, 120);
  }

  // ---------- Les Grands Arbres ----------
  // Un tronc (|) est dans le décor : on passe devant. Il continue derrière une branche qui le traverse,
  // et derrière ce qui est posé dessus (friandise, ennemi…).
  trunkAt(c, r) {
    const ch = this.tileAt(c, r);
    // (le bloc magique du Lutin posé devant un tronc)
    if (ch === 'u' && this.magic.some((m) => m.c === c && m.r === r && m.under === '|')) return true;
    const ledge = ch === '-' || (ch === '=' && this.branchy);
    return ch === '|' || (this.tileAt(c, r + 1) === '|' && (ledge || this.tileAt(c, r - 1) === '|'));
  }

  // ---------- Les Champignons Géants ----------
  // Chaque rangée de "-" (ou de "M") côte à côte est un seul grand chapeau de champignon, posé sur un grand pied
  // qui descend jusqu'au sol (ou jusqu'à un autre chapeau, ou tout au fond d'un trou). Le pied est dans le décor :
  // on passe devant. Les "M" font rebondir, comme d'habitude (voir Player.springTile) : ce sont les chapeaux bleus.
  findCaps() {
    const caps = [];
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const ch = this.tiles[r][c];
        if (ch !== '-' && ch !== 'M') { c++; continue; }
        let e = c;
        while (e + 1 < this.cols && this.tiles[r][e + 1] === ch) e++;
        const n = e - c + 1;
        const bouncy = ch === 'M';
        // le pied descend sous le milieu du chapeau, jusqu'à la première case où il peut se poser
        const mid = Math.floor((c + e) / 2);
        let rb = r + 1;
        while (rb < this.rows && !isSolidCh(this.tiles[rb][mid]) && !isLedgeCh(this.tiles[rb][mid])) rb++;
        const foot = rb < this.rows;
        const top = r * TILE + Scenery.capRim(bouncy) - 4;
        const bottom = foot ? rb * TILE + 6 : this.height + 40;
        const sw = n === 1 ? 16 : n === 2 ? 24 : Math.min(44, 16 + n * 6);
        caps.push({
          c0: c, c1: e, r, n, bouncy, v: Math.floor(hash2(c, r) * 4),
          stalk: { x: (c + e + 1) * TILE / 2 - sw / 2, top, h: Math.round(Math.max(0, bottom - top)), sw, foot },
        });
        c = e + 1;
      }
    }
    return caps;
  }

  // Les pieds des grands champignons (derrière tout le reste).
  drawStalks(ctx, camX) {
    for (const k of this.caps) {
      const st = k.stalk;
      if (st.h <= 0 || st.x + st.sw + 20 < camX || st.x - 20 > camX + VIEW_W) continue;
      const img = Scenery.stalkSprite(st.sw, st.h, st.foot);
      ctx.drawImage(img, st.x - 12, st.top, st.sw + 24, st.h + 10);
    }
  }

  // Les chapeaux (avec les cases, à l'échelle de l'écran) : un chapeau qui fait rebondir s'écrase un peu.
  drawCaps(ctx, s, camX, camY) {
    const T = TILE;
    for (const k of this.caps) {
      const x0 = k.c0 * T;
      const x1 = (k.c1 + 1) * T;
      if (x1 + 10 < camX || x0 - 10 > camX + VIEW_W) continue;
      let squash = 0;
      if (k.bouncy) {
        for (let c = k.c0; c <= k.c1; c++) {
          const v = this.springs.get(c + ',' + k.r);
          if (v !== undefined) {
            const q = v / 0.4;
            squash = Math.max(squash, Math.sin(q * Math.PI) * (1 - q) * 12);
          }
        }
      }
      const img = Scenery.capSprite(k.n, k.bouncy, k.v);
      const dx = Math.round((x0 - 8 - camX) * s);
      const dy = Math.round((k.r * T - 8 + squash - camY) * s);
      const dx2 = Math.round((x1 + 8 - camX) * s);
      const dy2 = Math.round((k.r * T + Scenery.capRim(k.bouncy) + 22 + squash - camY) * s);
      ctx.drawImage(img, dx, dy, dx2 - dx, dy2 - dy);
    }
  }

  // ---------- Le Marais aux Cabanes ----------
  // Chaque rangée de "-" côte à côte est le plancher d'une cabane sur pilotis (3 cases ou plus, et de la place
  // au-dessus : la cabane est dans le décor, on passe devant), ou une petite plate-forme sur un pilotis. Les pilotis
  // descendent jusqu'au sol, jusqu'à un autre plancher, ou s'enfoncent dans la boue.
  findCabins() {
    const T = TILE;
    const free = (c, r) => r < 0 || this.tileAt(c, r) === '.';
    return this.runsOf((c, r) => this.tiles[r][c] === '-').map(({ r, c0: c, c1: e }) => {
      const n = e - c + 1;
      let hut = n >= 3;
      for (let k = c - 1; k <= e + 1 && hut; k++) {
        for (let rr = r - 3; rr < r; rr++) if (!free(k, rr)) hut = false;
      }
      const x0 = c * T;
      const x1 = (e + 1) * T;
      const xs = n >= 3 ? [x0 + 9, x1 - 9] : [(x0 + x1) / 2];
      if (n >= 6) xs.push((x0 + x1) / 2);
      const legs = xs.map((x) => {
        const lc = Math.floor(x / T);
        let rb = r + 1;
        while (rb < this.rows && !isSolidCh(this.tiles[rb][lc]) && !isLedgeCh(this.tiles[rb][lc]) && this.tiles[rb][lc] !== '~') rb++;
        const bottom = rb >= this.rows ? this.height + 40 : this.tiles[rb][lc] === '~' ? rb * T + 40 : rb * T + 4;
        return { x, top: r * T + 10, bottom };
      });
      return { c0: c, c1: e, r, n, hut, legs, v: Math.floor(hash2(c, r) * 3) };
    });
  }

  // Les ponts de corde (les "=" côte à côte), avec leurs poteaux aux deux bouts.
  findBridges() {
    return this.runsOf((c, r) => this.tiles[r][c] === '=').map(({ r, c0, c1 }) => (
      { x0: c0 * TILE, x1: (c1 + 1) * TILE, r, ph: hash2(c0, r) * 6 }
    ));
  }

  // ---------- Le Phare sur la Falaise ----------
  // Les paratonnerres : chaque suite de z côte à côte, numérotés de bas en haut (un sur deux est à contretemps).
  findRods() {
    const runs = this.runsOf((c, r) => this.tiles[r][c] === 'z');
    runs.sort((a, b) => b.r - a.r || a.c0 - b.c0);
    return runs.map((o, k) => new LightningRod(this, o.c0, o.c1, o.r, k));
  }

  // La grande lumière du phare tourne (LIGHTHOUSE.turn secondes par tour) : son angle (0 : vers la droite ; π/2 : vers
  // nous ; elle a deux faisceaux, l'un en face de l'autre : elle nous éclaire deux fois par tour, voir render).
  beamAngle() {
    return (this.t / LIGHTHOUSE.turn) * Math.PI * 2;
  }

  // Le phare, dans le décor (derrière tout) : sa tour, sa lanterne tout en haut et sa lumière qui tourne.
  drawLighthouse(ctx, camX, camY) {
    const L = this.lighthouse;
    if (L.x1 < camX - 400 || L.x0 > camX + VIEW_W + 400) return;
    Scenery.lighthouse(ctx, L.x0, L.x1, L.top, L.foot, camY, this.t, this.beamAngle());
  }

  // Les suites de cases côte à côte, sur une même rangée, pour lesquelles is(c, r) est vrai : [{ r, c0, c1 }].
  runsOf(is) {
    const out = [];
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        if (!is(c, r)) { c++; continue; }
        let e = c;
        while (e + 1 < this.cols && is(e + 1, r)) e++;
        out.push({ r, c0: c, c1: e });
        c = e + 1;
      }
    }
    return out;
  }

  // Le pont s'enfonce un peu sous les pieds de Malice (ça se voit aussi un peu plus loin, et ça remonte doucement).
  updateSag(dt) {
    const p = this.player;
    const r = Math.round((p.y + p.h) / TILE);
    const on = p.onGround && !p.platform && !p.dead && this.tileAt(Math.floor(p.cx / TILE), r) === '=';
    const S = this.sag;
    if (on) {
      if (S.r !== r) S.k = 0;
      S.r = r;
      S.x = p.cx;
      // (il s'enfonce vite sous ses pieds ; quand elle s'en va, il remonte plus doucement)
      S.k = Math.min(1, S.k + dt * 9);
    } else {
      S.k = Math.max(0, S.k - dt * 4);
    }
  }

  // De combien le pont de la rangée r est enfoncé en x (en pixels).
  bridgeDip(x, r) {
    const S = this.sag;
    if (!this.cabins || S.k <= 0 || r !== S.r || this.tileAt(Math.floor(x / TILE), r) !== '=') return 0;
    const b = this.bridges.find((bb) => bb.r === r && x >= bb.x0 && x <= bb.x1);
    if (!b) return 0;
    // (jamais aux deux bouts, attachés aux poteaux)
    const ends = Math.min(1, (x - b.x0) / TILE, (b.x1 - x) / TILE);
    const near = Math.max(0, 1 - Math.abs(x - S.x) / (TILE * 2.2));
    return 5 * S.k * ends * (0.35 + 0.65 * near);
  }

  // Les pilotis et les cabanes (derrière tout le reste ; les planchers sont des cases, voir drawTiles).
  drawCabins(ctx, camX) {
    if (!this.cabins) return;
    for (const k of this.cabins) {
      const x0 = k.c0 * TILE;
      const x1 = (k.c1 + 1) * TILE;
      if (x1 + 40 < camX || x0 - 40 > camX + VIEW_W) continue;
      for (const leg of k.legs) Scenery.stilt(ctx, leg.x, leg.top, leg.bottom);
      if (k.hut) {
        const img = Scenery.cabinSprite(k.n, k.v);
        const w = k.n * TILE + 24;
        ctx.drawImage(img, x0 - 12, k.r * TILE - Scenery.CABIN_H, w, Scenery.CABIN_H + 4);
      }
    }
  }

  // Les ponts de corde : des planches attachées entre deux cordes qui pendent, et qui se balancent un peu.
  drawBridges(ctx, camX) {
    for (const b of this.bridges) {
      if (b.x1 + 30 < camX || b.x0 - 30 > camX + VIEW_W) continue;
      Scenery.ropeBridge(ctx, b.x0, b.x1, b.r * TILE, this.t + b.ph, (x) => this.bridgeDip(x, b.r));
    }
  }

  // La brume tout au ras de la boue (par-dessus : elle est légère, on voit toujours bien la boue et ce qui s'y passe).
  drawMist(ctx, camX) {
    for (const m of this.mists) {
      const x0 = m.c0 * TILE;
      const x1 = (m.c1 + 1) * TILE;
      if (x1 + 2 * TILE < camX || x0 - 2 * TILE > camX + VIEW_W) continue;
      Scenery.mudMist(ctx, x0, x1, m.r * TILE + 12, this.t);
    }
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

  // ---------- Le Glacier Fumant ----------
  // De la glace sous les pieds ? (la case sous le milieu de son corps ; au bord, à moitié dans le vide, la case
  // sous l'autre pied)
  iceUnder(b) {
    const r = Math.floor((b.y + b.h + 2) / TILE);
    const mid = this.tileAt(Math.floor((b.x + b.w / 2) / TILE), r);
    if (mid === ICE) return true;
    if (isSolidCh(mid) || isLedgeCh(mid)) return false;
    return this.tileAt(Math.floor((b.x + 3) / TILE), r) === ICE || this.tileAt(Math.floor((b.x + b.w - 3) / TILE), r) === ICE;
  }

  // Les fumerolles : de la vapeur sort de la fente entre une plaque de glace et la roche chaude (ou la lave), sur le
  // dessus du sol. { x, y : le bas de la fente ; v : pour que chacune fume à son rythme }
  findVents() {
    const out = [];
    const hot = (ch) => ch === '#' || ch === '~';
    for (let r = 1; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 1; c++) {
        const a = this.tiles[r][c];
        const b = this.tiles[r][c + 1];
        if (!((a === ICE && hot(b)) || (hot(a) && b === ICE))) continue;
        if (this.tiles[r - 1][c] !== '.' || this.tiles[r - 1][c + 1] !== '.') continue;
        out.push({ x: (c + 1) * TILE, y: r * TILE, v: hash2(c, r) });
      }
    }
    return out;
  }

  // La vapeur des fumerolles qu'on voit (avec une marge : elle monte haut), et un « pschhh » de temps en temps, pour la
  // plus proche de Malice.
  drawVents(ctx, camX) {
    for (const v of this.vents) {
      if (v.x < camX - 120 || v.x > camX + VIEW_W + 120 || v.y < this.cam.y - 40 || v.y - 200 > this.cam.y + VIEW_H) continue;
      Scenery.steamVent(ctx, v.x, v.y, this.t, v.v);
    }
  }

  updateVents(dt) {
    this.ventSnd -= dt;
    if (this.ventSnd > 0 || !this.vents.length) return;
    this.ventSnd = rand(2.5, 4.5);
    const p = this.player;
    const v = this.vents.find((q) => Math.abs(q.x - p.cx) < 320 && Math.abs(q.y - (p.y + p.h)) < 200);
    if (v && !p.dead) Sound.sfx.steam();
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

  // Un éclair au chocolat lancé (le bocal à éclairs) touche un bouchon en chocolat : il fond, avec ceux qui sont
  // collés au-dessus et en dessous (tout le bouchon d'un coup), et le passage est ouvert.
  meltPlug(c, r) {
    let r0 = r;
    let r1 = r;
    while (this.tileAt(c, r0 - 1) === PLUG) r0--;
    while (this.tileAt(c, r1 + 1) === PLUG) r1++;
    const cx = c * TILE + TILE / 2;
    for (let k = r0; k <= r1; k++) {
      this.tiles[k][c] = '.';
      const cy = k * TILE + TILE / 2;
      for (let i = 0; i < 6; i++) {
        this.spawn({
          type: 'debris', x: cx + rand(-16, 16), y: cy + rand(-16, 16),
          vx: rand(-220, 220), vy: rand(-420, -120), g: 1600, life: 0.8, size: rand(7, 12),
          color: i % 3 ? '#6b3a1f' : '#9a5a2e', vr: rand(-10, 10),
        });
      }
      this.puff(cx, cy, '#c08a5e');
    }
    for (let i = 0; i < 10; i++) {
      this.spawn({ type: 'spark', x: cx, y: (r1 + 0.5) * TILE, vx: rand(-240, 240), vy: rand(-260, -40), g: 600, life: 0.5, size: rand(4, 7), color: i % 2 ? '#fff59a' : '#ffffff' });
    }
    Sound.sfx.bocalZap();
    Sound.sfx.splat();
    this.shake(4);
    this.popText(cx, r0 * TILE - 6, 'Ça fond !', '#ffe08a', 24);
  }

  breakBlock(c, r) {
    let ch = this.tiles[r][c];
    // l'étoile, c'est seulement pour Super Malice : les autres ont déjà leur pouvoir (5 bonbons à la place)
    if (ch === 'S' && this.player.hero !== 'malice') ch = 'L';
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

  // (below : la bulle est sous (x, y), sa pointe vers le haut ; sinon au-dessus, sa pointe vers le bas)
  bubble(x, y, text, alpha, below) {
    if (x < this.cam.x - 60 || x > this.cam.x + VIEW_W + 60) return;
    this.bubbles.push({ x, y, text, alpha, below: !!below });
  }

  // ---------- Mise à jour ----------
  update(dt) {
    this.t += dt;
    const p = this.player;
    for (const pl of this.platforms) pl.update(dt);
    for (const rod of this.rods) rod.update(dt);
    p.update(dt);
    if (this.arena) this.keepInArena(p);
    if (this.flood) this.flood.update(dt);
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
    for (const v of this.vines) v.update(dt);
    for (const d of this.decos) d.update(dt);
    if (this.hideout) this.updateHideout(dt);
    if (this.trunk) this.facadeK = this.facadeAt(p);
    for (const a of this.anchors) a.update(dt);
    for (const d of this.puffs) d.update(dt);
    for (const b of this.bunnies) b.update(dt);
    for (const g of this.gags) g.update(dt);
    if (this.cabins) this.updateSag(dt);
    for (const f of this.fireflies) f.update(dt);
    if (this.goal) this.goal.update(dt);
    if (this.def.sequel) p.birdTalk = this.flowers.reduce((m, f) => Math.max(m, f.show), 0);
    this.updateMagic(dt);
    this.updateStorms(dt);
    if (this.volcan.length || this.bombs.length) this.updateVolcano(dt);
    this.updateWinds(dt);
    this.updateUpdrafts(dt);
    this.updateSlime(dt);
    if (this.ice) this.updateVents(dt);
    if (this.rain) this.updateRain(dt);
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
    this.gags = this.gags.filter((g) => !g.dead);
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
      // (en boule, le bord de l'arène est comme un mur : elle se relève, ou repart dans l'autre sens)
      if (b.ball && b.rollDir < 0) b.rollBump(-1);
    }
    if (b.x + b.w > A.x1) {
      b.x = A.x1 - b.w;
      if (b.vx > 0) b.vx = 0;
      if (b.ball && b.rollDir > 0) b.rollBump(1);
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
    // (sous l'eau, on ne touche rien ; ni emportée par la toupie de Bourrasque, voir Player.carry)
    if (p.dive > 0 || p.carry) return;
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
      // en boule (la roulade), Malice passe sous les ennemis ou à travers : ni elle ni eux n'ont mal
      // (rolledInto : un ennemi qui fait quelque chose quand elle roule contre lui, comme Ronchon étourdi)
      if (p.ball) {
        if (e.rolledInto) e.rolledInto(p);
        continue;
      }
      // projetée par un sanglier (la tête en bas), elle ne touche plus à rien tant qu'elle n'est pas debout
      if (p.tumbling()) continue;
      // (stompDepth : sur un grand boss tout affaissé, on compte qu'on lui saute dessus même en arrivant un peu bas)
      if (stomps(e.y + (e.stompDepth || 18))) {
        // un sanglier qui fonce : on rebondit sur son dos, sans rien lui faire (il faut attendre qu'il s'arrête)
        if (e.stompable && !e.stompable()) {
          p.bounceOff();
          Sound.sfx.boing(false);
          continue;
        }
        // un hérisson en boule : on se pique ! (si elle ne peut pas avoir mal, elle rebondit sur ses piquants)
        // Dans les deux cas, elle repart vers l'avant, par-dessus : en arrière, elle retomberait dans le trou
        // qu'elle vient de sauter, et sans la pousser, elle rebondirait dessus comme sur un trampoline.
        if (e.prickly && e.prickly()) {
          const fwd = Math.sign(p.vx) || p.facing;
          if (p.hurt(e, e.ouch)) {
            if (!p.dead) p.vx = fwd * Math.abs(p.vx);
          } else {
            p.bounceOff();
            p.vx = fwd * OUCH.pins.vx;
          }
          continue;
        }
        e.stomp();
        p.bounceOff();
        continue;
      }
      // (le sanglier projette Malice par-dessus son dos ; quand il ne fonce pas, il la repousse sans lui faire mal)
      // (attention : onHit est déjà pris par les boss, voir boss.js : « il vient de perdre une vie »)
      if (e.harmful()) {
        if (p.hurt(e, e.ouch) && e.tossed) e.tossed(p);
      } else if (e.nudge) {
        e.nudge(p);
      }
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
    // le bocal à éclairs (badge de Malice) : un éclair au chocolat qui tombe tout près d'elle, ou qui refroidit par
    // terre, va dans son bocal s'il n'est pas plein (voir Eclair.catches) ; sinon, il fait mal comme d'habitude
    const bocal = this.game.hasBadge('bocal') && !p.dead;
    for (const ec of this.eclairs) {
      if (bocal && this.game.bocal < BOCAL_MAX && ec.catches(pb)) {
        ec.caught(p);
        continue;
      }
      const b = ec.box();
      if (b && boxOverlap(pb, b.x, b.y, b.w, b.h)) p.hurt(b, 'zap');
    }
    // une pierre de lave qui tombe, ou qui arrive par terre : Malice est toute noircie de suie (« Kof kof ! »)
    for (const lb of this.bombs) {
      const b = lb.box();
      if (b && boxOverlap(pb, b.x, b.y, b.w, b.h)) p.hurt(b, 'soot');
    }
    // les pieds sur un paratonnerre qui grésille : électrocutée, comme par un éclair au chocolat
    for (const rod of this.rods) {
      if (rod.touches(p, pb) && p.hurt(rod.pushFrom(p), 'zap') && !p.dead) rod.eject(p);
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
    // (dans un niveau où l'on grimpe, un orage peut n'être que sur un étage : [début, fin, rangée de son sol])
    const z = this.storms.find(([a, b, r]) => col >= a - 3 && col <= b + 2 && (r === undefined || Math.abs(p.groundY - r * TILE) < TILE));
    // (un petit nuage, d'une seule colonne, se repose quand le bocal de Malice est plein : on peut rester dessous
    // sans être électrocutée ; c'est un orage plus large qui apprend que le bocal plein fait mal)
    // (s'il grondait déjà, il se calme : l'éclair qu'il annonçait ne tombe pas)
    const resting = z && z[0] === z[1] && this.game.hasBadge('bocal') && this.game.bocal >= BOCAL_MAX;
    if (resting) {
      for (const ec of this.eclairs) if (ec.phase === 'warn' && Math.abs(ec.x - (z[0] + 0.5) * TILE) < TILE) ec.dead = true;
    }
    if (!z || resting) {
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

  // Le Bord du Cratère ("volcan" : les colonnes [début, fin] où le volcan gronde, et s'il en crache plus : [début, fin,
  // pierres en plus], ou plus souvent : [début, fin, pierres en plus, combien de fois diff.lavaEvery]) : de temps en temps (diff.lavaEvery), la terre tremble un tout petit peu, le volcan gronde (au
  // loin, dans le fond, il crache), et des pierres de lave tombent autour de Malice (diff.lavaStones, plus celles de la
  // zone), chacune annoncée par son ombre par terre (voir LavaBomb). Jamais pendant
  // qu'une fleur parle, ni quand Malice est en l'air, sur une plateforme qui bouge, sur la pente, ou tout près d'un trou :
  // elle peut toujours s'écarter (en avançant ou en reculant).
  updateVolcano(dt) {
    const p = this.player;
    this.belch = Math.max(0, this.belch - dt * 0.7);
    if (this.rumble > 0) {
      this.rumble -= dt;
      this.shake(1.6);
    }
    for (const b of this.bombs) b.update(dt);
    this.bombs = this.bombs.filter((b) => !b.dead);
    if (p.dead || p.won) return;
    const col = p.cx / TILE;
    const z = this.volcan.find(([a, b]) => col >= a && col <= b + 1);
    if (!z) {
      this.volcanT = Math.max(this.volcanT, 1.2);
      return;
    }
    this.volcanT -= dt;
    if (this.volcanT > 0) return;
    // (pas tout de suite : on réessaie un peu plus tard)
    this.volcanT = 0.3;
    // (les pierres qui refroidissent par terre ne comptent pas : elles ne font plus mal)
    if (!p.onGround || p.platform || p.slope || p.hurtT > 0 || p.tumbling() || this.bombs.some((b) => b.phase !== 'cool')) return;
    if (this.flowers.some((f) => f.show > 0.2) || this.nearPit(p)) return;
    const spots = this.lavaTargets(p, z);
    if (!spots.length) return;
    this.volcanSeen.add(z[0]);
    this.volcanT = rand(this.diff.lavaEvery[0], this.diff.lavaEvery[1]) * (z[3] || 1);
    this.rumble = 0.9;
    this.belch = 1;
    Sound.sfx.volcanoRumble();
    // (les pierres tombent l'une après l'autre)
    spots.forEach(([x, gy, wn], i) => this.bombs.push(new LavaBomb(this, x, gy, (wn || this.diff.lavaWarn) + i * 0.3)));
  }

  // Un trou (ou de la lave) à moins d'une case et demie devant ou derrière Malice, sur son sol ?
  nearPit(p) {
    const feet = p.y + p.h;
    for (const dx of [-1.5, -0.75, 0.75, 1.5]) {
      const x = p.cx + dx * TILE;
      const gy = this.surfaceBelow(x, feet - TILE * 0.5);
      if (gy > feet + TILE * 1.5 || this.tileAt(Math.floor(x / TILE), Math.floor(gy / TILE)) === '~') return true;
    }
    return false;
  }

  // Où tombent les pierres de lave : la première là où Malice arriverait si elle continuait d'avancer comme maintenant
  // (tout près d'elle si elle ne bouge pas : il faut bouger), les autres de part et d'autre, à 160 pixels au moins
  // l'une de l'autre (assez de place entre deux ombres pour s'y mettre). Seulement sur un sol bien plat et solide (pas
  // sur la lave, ni la pente, ni une plateforme qui bouge), à peu près à sa hauteur, dans la zone, et toujours à
  // l'écran (l'ombre se voit dès qu'elle apparaît), jamais plus loin que LAVA_AIM.ahead pixels devant elle ; sur la
  // glace, jamais avant l'endroit où elle peut s'arrêter. Au premier grondement d'une zone (celui qui apprend), une
  // seule pierre, juste au-delà de l'endroit où elle arriverait : si elle avance sans s'arrêter, elle la voit tomber
  // devant elle, et passe quand ce n'est plus qu'une pierre chaude (si l'écran est trop court pour ça, la pierre
  // s'annonce un peu moins longtemps, jamais moins de LAVA_AIM.minWarn secondes). [x, sol, annonce (0 : diff.lavaWarn)]
  lavaTargets(p, z) {
    const n = this.diff.lavaStones + (z[2] || 0);
    const feet = p.y + p.h;
    const warn = this.diff.lavaWarn;
    const lo = Math.max(z[0] * TILE + 30, this.cam.x + LAVA_AIM.edge);
    const hi = Math.min((z[1] + 1) * TILE - 30, this.cam.x + VIEW_W - LAVA_AIM.edge);
    const out = [];
    // (sur la glace : la distance qu'il lui faut pour s'arrêter en lâchant tout, plus la pierre, plus un peu ; aucune
    // pierre entre elle et ce point-là)
    const icy = p.icy && Math.abs(p.vx) > 60 ? (p.vx * p.vx) / (2 * ICE_PHYS.dec) + LAVA_BOMB.r + 40 : 0;
    const tryAt = (x, wn) => {
      if (x < lo || x > hi || out.some(([ox]) => Math.abs(ox - x) < 160)) return;
      if (icy && Math.sign(p.vx) * (x - p.cx) > -LAVA_BOMB.r - 30 && Math.sign(p.vx) * (x - p.cx) < icy) return;
      const gy = this.lavaGround(x, feet);
      if (gy !== null) out.push([x, gy, wn || 0]);
    };
    if (!this.volcanSeen.has(z[0])) {
      const v = Math.abs(p.vx);
      const dir = v > 30 ? Math.sign(p.vx) : p.facing;
      const room = (dir > 0 ? hi - p.cx : p.cx - lo) - 10;
      for (let k = 0; k < 8 && !out.length; k++) {
        let d = Math.max(v * warn + LAVA_AIM.pass, icy) * rand(1, 1.15);
        let wn = warn;
        if (d > room) {
          d = room - rand(0, 40);
          if (v > 30) wn = Math.min(warn, (d - LAVA_AIM.pass) / v);
        }
        if (wn >= LAVA_AIM.minWarn) tryAt(p.cx + dir * d, wn);
      }
      // (les autres pierres : plus loin encore, ou derrière elle, jamais sur son chemin avant que la première tombe ;
      // dans la première zone du niveau, celle où l'on découvre le volcan, une seule)
      for (let k = 0; k < 12 && out.length && out.length < n && z !== this.volcan[0]; k++) {
        tryAt(k % 2 ? out[0][0] + dir * rand(160, 260) : p.cx - dir * rand(90, 220), out[0][2]);
      }
      return out;
    }
    const ahead = p.vx * warn;
    for (let k = 0; k < 8 && !out.length; k++) {
      let dx = clamp(ahead * rand(0.7, 1) * (k < 4 ? 1 : 0.4) + p.facing * rand(-20, 60), -LAVA_AIM.ahead, LAVA_AIM.ahead);
      if (icy) dx = Math.sign(p.vx) * Math.max(Math.sign(p.vx) * dx, icy);
      tryAt(p.cx + dx);
    }
    for (let k = 0; k < 12 && out.length && out.length < n; k++) {
      const side = (out.length % 2 ? 1 : -1) * p.facing * (Math.random() < 0.3 ? -1 : 1);
      tryAt(out[0][0] + side * rand(160, 260));
    }
    return out;
  }

  // Le sol où peut tomber une pierre de lave en x (entre deux cases plus haut et trois plus bas que les pieds de Malice),
  // ou null : un sol plat et solide sous la pierre, et une case de plus de chaque côté (jamais au bord d'une marche ou
  // d'un trou, là où l'on prend son élan ou retombe d'un saut : le coup de la pierre y pousserait Malice dans la lave).
  lavaGround(x, feet) {
    const gy = this.surfaceBelow(x, feet - TILE * 2.2);
    if (gy > feet + TILE * 3) return null;
    for (const dx of [-84, -56, -28, 0, 28, 56, 84]) {
      const g2 = this.surfaceBelow(x + dx, gy - TILE * 0.5);
      if (Math.abs(g2 - gy) > 1) return null;
      const ch = this.tileAt(Math.floor((x + dx) / TILE), Math.floor(gy / TILE));
      if (!isSolidCh(ch) && !isLedgeCh(ch)) return null;
    }
    if (this.scree && this.screeCell(Math.floor(x / TILE), Math.floor(gy / TILE) - 1)) return null;
    return gy;
  }

  // La pluie (le Moulin à Vent) : des gouttes qui éclaboussent le sol, partout à l'écran (dessin : Scenery.rain).
  updateRain(dt) {
    this.rainT += dt * 30;
    while (this.rainT >= 1) {
      this.rainT--;
      const x = this.cam.x + rand(0, VIEW_W);
      const y = this.surfaceBelow(x, this.cam.y);
      if (y > this.cam.y + VIEW_H || y >= this.height) continue;
      this.spawn({ type: 'ring', x, y: y - 1, life: 0.22, size: rand(8, 14), color: 'rgba(220,240,255,0.7)', flat: true });
      for (let i = 0; i < 2; i++) {
        this.spawn({ type: 'dot', x, y: y - 2, vx: rand(-50, 50), vy: rand(-110, -50), g: 900, life: 0.22, size: rand(1.1, 1.7), color: '#e4f2ff' });
      }
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

  // ---------- Le Vieux Chêne ----------
  // La porte du tronc : les cases vides en bas de la première colonne du tronc (leur haut et leur bas, en pixels).
  findDoor() {
    const c = this.trunk.c0;
    let r1 = this.rows - 1;
    while (r1 > 0 && isSolidCh(this.tileAt(c, r1))) r1--;
    let r0 = r1;
    while (r0 > 0 && !isSolidCh(this.tileAt(c, r0 - 1))) r0--;
    return { x: this.trunk.x0, y0: r0 * TILE, y1: (r1 + 1) * TILE };
  }

  // ---------- La cachette (le coin secret tout en haut d'un arbre, "cachette" dans levels.js) ----------
  // Le feuillage s'écarte (en bruissant) quand Malice y entre ; une fois trouvée, la cachette reste un tout petit peu
  // entrouverte (on devine ce qu'il y a dedans, sans voir un gros pavé de feuilles transparent).
  updateHideout(dt) {
    const h = this.hideout;
    const p = this.player;
    const inside = !p.dead && p.x + p.w > h.x0 && p.x < h.x1 && p.y + p.h > h.y0 && p.y < h.y1;
    if (inside !== !!h.inside) {
      h.inside = inside;
      Sound.sfx.leaves();
      for (let i = 0; i < 10; i++) {
        this.spawn({ type: 'leaf', x: p.cx + rand(-30, 30), y: p.y + rand(-10, 40), vx: rand(-120, 120), vy: rand(-160, -20), g: 160, drag: 1.5, life: 1.3, size: rand(0.7, 1), vr: rand(-6, 6), wob: rand(0, 6), color: choose(['#4fb84a', '#6fd25a', '#3a9e3e']) });
      }
      if (inside && !h.found) {
        h.found = true;
        Sound.sfx.secret();
        this.popText(p.cx, p.y - 20, 'Un passage secret !', '#fff27a', 26);
      }
    }
    h.k = approach(h.k, inside ? 0 : h.found ? 0.85 : 1, dt * (inside ? 3 : 1.2));
  }

  // Malice est dans le tronc (passé le mur de gauche, épais de deux cases) ?
  insideTrunk(p) {
    return p.cx > this.trunk.x0 + 2.2 * TILE && p.cx < this.trunk.x1;
  }

  // Dehors, on voit le tronc de l'extérieur (son écorce, et la porte) : elle s'efface quand Malice passe la porte
  // (de 1, dehors, à 0, dedans).
  facadeAt(p) {
    return 1 - clamp((p.cx - this.trunk.x0 - 20) / 90, 0, 1);
  }

  // Le fond : dedans, le bois du tronc creux (voir Scenery BG.oak) ; dehors, à gauche du tronc, la forêt
  // (comme si on était en bas d'un niveau ordinaire, pour que ses collines soient à leur place).
  drawOakBackground(ctx) {
    const ox = Math.round(this.trunk.x0 - this.cam.x);
    if (ox > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, Math.min(VIEW_W, ox), VIEW_H);
      ctx.clip();
      Scenery.drawBackground(ctx, 'forest', this.cam.x, this.cam.y - Math.max(0, this.height - VIEW_H) + 84, this.t);
      ctx.restore();
    }
    if (ox < VIEW_W) {
      ctx.save();
      ctx.beginPath();
      // (dehors, le tronc vu de l'extérieur cache tout l'intérieur, sauf par la porte)
      if (this.facadeK >= 0.99) ctx.rect(ox, this.door.y0 - this.cam.y - 16, 2 * TILE, this.door.y1 - this.door.y0 + 16);
      else ctx.rect(Math.max(0, ox), 0, VIEW_W - Math.max(0, ox), VIEW_H);
      ctx.clip();
      Scenery.drawBackground(ctx, this.theme, this.cam.x, this.cam.y, this.t, 0, this.oakInfo);
      ctx.restore();
    }
  }

  // Dehors, le tronc vu de l'extérieur cache tout ce qui est derrière son mur de gauche (on ne voit dedans que par
  // la porte, dans l'épaisseur du mur) : à droite de ce x, on ne dessine rien.
  facadeEnd() {
    return this.trunk && this.facadeK >= 0.99 ? this.trunk.x0 + 2 * TILE : Infinity;
  }

  // Le tronc vu de dehors : de l'écorce sur toute sa largeur, avec la porte (le trou du bas du mur de gauche,
  // là où il n'y a pas de bois), des racines, de la mousse ; on voit l'intérieur par la porte.
  drawFacade(ctx, camX, camY) {
    const T = this.trunk;
    if (T.x0 > camX + VIEW_W + 40) return;
    Scenery.oakFacade(ctx, T.x0, T.x1, camY, this.door, this.facadeK, this.t, camX);
  }

  updateCamera(dt, snap) {
    const p = this.player;
    if (p.dead) return;
    // en courant, on voit plus loin devant (et encore plus loin en glissant sur les éboulis)
    // (du côté où elle glisse : vers la gauche aussi, en remontant la pente avec un pouvoir, ou en sautant en arrière)
    const sliding = this.scree && (p.slope || p.slideAir);
    const ahead = sliding ? (p.vx < -40 ? -1 : 1) * SCREE_CAM.ahead : p.facing * (p.running ? 110 : 60);
    this.look = snap ? ahead : approach(this.look, ahead, dt * 140);
    let tx = p.cx - VIEW_W * 0.45 + this.look;
    let ty = p.y + p.h / 2 - VIEW_H * 0.56;
    tx = clamp(tx, 0, Math.max(0, this.width - VIEW_W));
    // dans le tronc du Vieux Chêne, l'écran reste entre ses deux murs (on ne voit pas dehors)
    if (this.trunk && this.insideTrunk(p)) tx = clamp(tx, this.trunk.x0, Math.max(this.trunk.x0, this.trunk.x1 - VIEW_W));
    // passé le rocher du phare, l'écran reste à sa droite (on ne voit plus la falaise, tout en bas)
    const L = this.lighthouse;
    if (L && p.cx > (L.rock1 + 1) * TILE) tx = Math.max(tx, Math.min(L.rockX, this.width - VIEW_W));
    // pendant le combat contre un boss, l'écran reste sur son arène
    if (this.arena) tx = clamp(tx, this.arena.x0, this.arena.x1 - VIEW_W);
    // Dans un niveau où l'on grimpe ("grimpe") : la caméra suit l'étage où Malice a les pieds (par terre, à une
    // liane, ou dans l'eau), assez bas sur l'écran pour bien voir où l'on monte. Pendant un saut, elle ne bouge pas
    // (sauf si Malice va sortir de l'écran) ; si elle tombe plus bas que son étage, elle la suit.
    // (pendant le combat contre un boss, tout en haut : l'écran reste sur le haut de l'arène, voir Boss.setup)
    const fixed = this.arena && this.arena.camY != null;
    // (pareil dans un niveau plus haut que l'écran, "haut" : la caméra suit la branche ou le chapeau où elle a les pieds)
    // (et dans la Grande Glissade, qui descend bien plus bas que l'écran : la caméra suit la pente où elle glisse)
    const climb = (this.def.grimpe || this.def.haut || !!this.scree) && !fixed;
    if (climb) {
      const feet = p.y + p.h;
      const g = p.grap && p.grap.phase === 'swing' ? p.grap : null;
      // (à une liane : là où seraient ses pieds si elle pendait tout droit, pour que l'écran ne suive pas le balancement)
      if (g) this.camFeet = g.anchor.y + g.len + p.h - g.hy;
      else if (snap || p.onGround || p.swim || feet > this.camFeet) this.camFeet = feet;
      // (dans la Crue, ses pieds sont un peu plus haut sur l'écran : on voit mieux l'eau qui monte derrière elle)
      ty = this.camFeet - VIEW_H * (this.flood ? CLIMB_FEET_CRUE : this.scree ? SCREE_CAM.feet : CLIMB_FEET);
    }
    // le terrier secret : la caméra ne descend sous terre que quand Malice y est
    const under = this.terrier && p.y + p.h > (this.terrier - 1) * TILE;
    const bottom = this.terrier && !under ? this.terrier * TILE : this.height;
    ty = clamp(ty, 0, Math.max(0, bottom - VIEW_H));
    // (le bas du niveau reste à l'écran : la boue sous les ponts, voir "basVisible" dans levels.js ; la caméra ne
    // monte que quand Malice saute très haut, même au-dessus du haut du niveau : sa tête ne sort pas de l'écran)
    const high = this.def.basVisible;
    if (high) ty = Math.min(Math.max(0, bottom - VIEW_H), p.y - CAM_HEAD);
    if (fixed) ty = this.arena.camY;
    if (snap) {
      this.cam.x = tx;
      this.cam.y = ty;
    } else {
      this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 7);
      this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 5);
      // sous terre (en tombant dans le terrier), ses pieds ne sortent jamais de l'écran par le bas
      if (under) this.cam.y = clamp(this.cam.y, p.y + p.h + 20 - VIEW_H, Math.max(0, bottom - VIEW_H));
      // (et avec basVisible, sa tête ne sort jamais de l'écran par le haut, même si la caméra est en retard)
      if (high) this.cam.y = Math.min(this.cam.y, p.y - CAM_HEAD_MIN);
    }
    // (en grimpant, ni sa tête ni ses pieds ne sortent de l'écran, même pendant un très haut saut ou une chute)
    // (dans un niveau "haut", sans plafond, un super saut tout en haut l'emmène au-dessus du haut du niveau, dans le
    // ciel : la caméra la suit)
    if (climb) {
      const lo = Math.max(0, this.height - VIEW_H);
      const top = this.def.haut ? Math.min(0, p.y - CLIMB_TOP) : 0;
      this.cam.y = clamp(clamp(this.cam.y, p.y + p.h + CLIMB_BOTTOM - VIEW_H, p.y - CLIMB_TOP), top, lo);
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
    if (this.trunk) this.drawOakBackground(ctx);
    // (un niveau plus haut que l'écran, "haut" : tout en bas, le fond est à sa place, comme dans un niveau ordinaire)
    // (dans la Crue aussi, et trois fois plus vite : dès qu'on grimpe, les collines du fond descendent sous l'écran, pour
    // qu'on ne les prenne pas pour le sol, et tout en haut, on est dans le ciel)
    else if (sky > 0) {
      const lift = this.cam.y - Math.max(0, this.height - VIEW_H);
      // (autour du phare, la mer au loin : voir Scenery BG.storm ; on la voit descendre doucement quand on monte)
      // (la Grande Glissade descend bien plus bas que l'écran : le fond monte bien moins vite que la pente, de SCREE_BG
      // pixels sur toute la descente, pour qu'on voie toujours le ciel et le volcan au loin ; tout en bas, il est à sa
      // place, comme dans un niveau ordinaire)
      const cy = this.flood ? lift * 3 + 84 : this.def.haut ? lift + 84 : this.lighthouse ? Math.max(lift * 0.25, -LIGHTHOUSE.sea) + 84
        : this.scree ? 84 + SCREE_BG * (this.cam.y / Math.max(1, this.height - VIEW_H) - 1) : this.cam.y;
      // (depuis la falaise, le phare au loin, tout petit ; il s'efface derrière le rocher, juste avant qu'on voie le vrai)
      if (this.lighthouse) {
        LIGHTHOUSE_BG.far = clamp((this.lighthouse.x0 - VIEW_W - 60 - this.cam.x) / 200, 0, 1);
        LIGHTHOUSE_BG.ang = this.beamAngle();
      }
      // (au Bord du Cratère, le volcan du fond crache quand il gronde : belch)
      Scenery.drawBackground(ctx, this.theme, this.cam.x, cy, this.t, this.volcan.length ? this.belch : this.flash, this.lighthouse ? LIGHTHOUSE_BG : null);
    }
    if (sky < VIEW_H) ctx.restore();
    // le Phare sur la Falaise : quand sa grande lumière tourne vers nous, elle éclaire tout le fond (seulement le fond :
    // ce qui est devant, et surtout les dangers, se voit toujours aussi bien)
    if (this.lighthouse) {
      const k = Math.pow(Math.abs(Math.sin(this.beamAngle())), 12);
      if (k > 0.01) {
        ctx.fillStyle = `rgba(255,236,170,${0.16 * k})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    }
    // la pluie, au loin (plus fine, derrière tout le reste)
    if (this.rain) Scenery.rain(ctx, this.t, this.cam.x, this.cam.y, false);
    ctx.save();
    ctx.translate(-camX, -camY);
    this.lights.length = 0;
    // le ciel de l'arène du boss, derrière tout le décor (le beau soleil, à la fin de Bourrasque : voir Boss.drawSky)
    if (this.boss) this.boss.drawSkyArena(ctx);
    if (this.lighthouse) this.drawLighthouse(ctx, camX, camY);
    for (const rod of this.rods) rod.drawSky(ctx);
    this.drawStormClouds(ctx);
    this.drawWinds(ctx);
    this.drawTrunks(ctx, camX, camY);
    this.drawStalks(ctx, camX);
    this.drawCabins(ctx, camX);
    this.drawCrowns(ctx);
    this.drawUpdrafts(ctx);
    this.runs = this.waterRuns(camX);
    this.drawBurrow(ctx, camX, camY);
    this.drawTunnels(ctx, camX, camY);
    this.drawRiverBeds(ctx);
    // la Crue : l'eau du fond (derrière tout ce qui bouge ; l'eau de devant est dessinée plus loin)
    if (this.flood) this.flood.draw(ctx, false);
    this.drawDecor(ctx, camX, camY);
    // les moulins à vent : la tour et les ailes (leurs planches sont dessinées avec les plateformes)
    for (const m of this.mills) {
      if (m.seen(camX)) m.draw(ctx);
    }
    // (dehors, ce qui est derrière la façade du Vieux Chêne n'est pas dessiné : voir facadeEnd)
    const xMax = this.facadeEnd();
    for (const v of this.vines) {
      if (v.x > camX - v.len - 60 && v.x < camX + VIEW_W + v.len + 60 && v.x - v.len < xMax && v.y < camY + VIEW_H + 20 && v.y + v.len > camY - 60) v.draw(ctx);
    }
    // (les gros feuillages du décor, devant le haut des lianes qui y sont accrochées)
    for (const f of this.foliage) {
      if (f.x1 + 60 > camX && f.x0 - 60 < camX + VIEW_W) Scenery.hideout(ctx, f.x0, f.y0, f.x1, f.y1, 1, this.t);
    }
    // (les fleurs-lanternes qu'on voit : cherchées une fois par image)
    this.glowsSeen = this.glows.filter((gl) => gl.x > camX - 150 && gl.x < camX + VIEW_W + 150);
    for (const gl of this.glowsSeen) Scenery.glowFlower(ctx, gl.x, gl.y, gl.v, this.t);
    // (dans un long niveau, on ne dessine que ce qu'on voit, avec une marge pour ce qui dépasse : le dessin ne coûte pas
    // plus cher quand le niveau est plus long. Une fleur qui parle montre sa bulle même un peu hors de l'écran.)
    for (const f of this.flowers) {
      if (f.show > 0.05 || this.onScreen(f, 150)) f.draw(ctx);
    }
    ctx.restore();

    this.drawTiles(ctx, s, camX, camY);

    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawBridges(ctx, camX);
    this.drawPuddles(ctx, camX);
    this.drawSlime(ctx);
    if (this.vents.length) this.drawVents(ctx, camX);
    this.drawReeds(ctx, false);
    this.drawLutinShine(ctx, camX, camY);
    this.drawMagic(ctx);
    for (const rod of this.rods) rod.draw(ctx);
    for (const cp of this.checkpoints) {
      if (this.flagSeen(cp)) cp.draw(ctx);
    }
    for (const d of this.puffs) {
      if (d.x > camX - 140 && d.x < camX + VIEW_W + 140) d.draw(ctx);
    }
    for (const d of this.decos) {
      if (this.onScreen(d, 80)) d.draw(ctx);
    }
    // le grand nid de Maman Aigle, sur son pic
    if (this.nest && this.onScreen({ x: this.nest.x - 130, y: this.nest.y - 100, w: 260, h: 120 })) Scenery.eagleNest(ctx, this.nest.x, this.nest.y);
    if (this.goal) this.goal.draw(ctx);
    // (les nénuphars qui flottent sont dessinés par-dessus l'eau, plus loin)
    for (const pl of this.platforms) {
      if (!pl.onWater && this.platformSeen(pl)) pl.draw(ctx);
    }
    for (const a of this.anchors) {
      if (this.onScreen(a, 100)) a.draw(ctx);
    }
    // (seulement ce qu'on voit, avec une marge pour le halo d'un bonus ; mais pendant le combat contre un boss, tout ce
    // qu'il lance, même de loin)
    for (const it of this.items) {
      if (it.x < xMax && (this.arena || this.onScreen(it, 80))) it.draw(ctx);
    }
    for (const ce of this.critters) {
      if (this.onScreen(ce, 80)) ce.draw(ctx);
    }
    for (const b of this.bunnies) {
      if (b.x > camX - 80 && b.x < camX + VIEW_W + 80) b.draw(ctx);
    }
    // l'arène du boss : son décor et ses murs (même quand le boss n'est pas à l'écran)
    if (this.boss) this.boss.drawArena(ctx);
    // (seulement ceux qu'on voit : dans un niveau où l'on grimpe, ceux des autres étages ne sont pas dessinés ; pendant
    // le combat contre un boss, tous)
    for (const e of this.enemies) {
      if (e.x + e.w > camX - 80 && e.x < Math.min(camX + VIEW_W + 80, xMax) &&
        (e === this.boss || this.arena || (e.y + e.h > camY - 240 && e.y < camY + VIEW_H + 240))) e.draw(ctx);
    }
    for (const ec of this.eclairs) ec.draw(ctx);
    for (const lb of this.bombs) {
      if (this.onScreen({ x: lb.x - 60, y: Math.min(lb.y, lb.groundY) - 60, w: 120, h: 120 })) lb.draw(ctx);
    }
    for (const h of this.hazards) {
      if (!(h instanceof Stalactite) || this.onScreen(h, 120)) h.draw(ctx);
    }
    for (const pr of this.projectiles) pr.draw(ctx);
    for (const g of this.gags) g.draw(ctx);
    // dehors, le tronc du Vieux Chêne vu de l'extérieur (il s'efface quand Malice entre)
    if (this.trunk && this.facadeK > 0.01) this.drawFacade(ctx, camX, camY);
    // le feuillage qui cache le coin secret (il s'écarte quand Malice entre)
    const hd = this.hideout;
    if (hd && hd.x1 + 40 > camX && hd.x0 - 40 < camX + VIEW_W) Scenery.hideout(ctx, hd.x0, hd.y0, hd.x1, hd.y1, hd.k, this.t);
    this.player.draw(ctx);
    if (this.goal && this.goal.drawFront) this.goal.drawFront(ctx);
    for (const ec of this.eclairs) ec.drawWarning(ctx);
    for (const lb of this.bombs) {
      if (this.onScreen({ x: lb.x - 40, y: lb.groundY - 110, w: 80, h: 120 })) lb.drawWarning(ctx);
    }
    for (const rod of this.rods) rod.drawWarning(ctx);
    // (l'ombre des grenouilles sauteuses, là où elles vont retomber)
    for (const e of this.enemies) {
      if (e.drawWarning) e.drawWarning(ctx);
    }
    this.drawLava(ctx, camX, camY);
    if (this.mud) this.drawMist(ctx, camX);
    this.drawWater(ctx);
    if (this.flood) this.flood.draw(ctx, true);
    for (const pl of this.platforms) {
      if (pl.onWater && this.platformSeen(pl)) pl.draw(ctx);
    }
    this.drawReeds(ctx, true);
    if (this.dark) this.drawDarkness(ctx, camX, camY);
    // (par-dessus la nuit : le cœur des fleurs qui brillent, et les lucioles)
    for (const gl of this.glowsSeen) Scenery.glowFlowerShine(ctx, gl.x, gl.y, gl.v, this.t);
    for (const f of this.fireflies) {
      if (this.onScreen(f, 60)) f.draw(ctx);
    }
    // (la fin d'un boss peut se jouer par-dessus tout l'écran, en pixels de l'écran : le vol de Maman Aigle jusqu'au
    // Cœur du Volcan ; les confettis du « Bravo ! » passent par-dessus)
    if (this.boss && this.boss.drawScreen) {
      ctx.save();
      ctx.translate(camX, camY);
      this.boss.drawScreen(ctx);
      ctx.restore();
    }
    this.drawParticles(ctx);
    ctx.restore();
    // la pluie, tout près (par-dessus tout, sauf les bulles des fleurs qui parlent)
    if (this.rain) Scenery.rain(ctx, this.t, this.cam.x, this.cam.y, true);
    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawBubbles(ctx);
    ctx.restore();
  }

  drawTiles(ctx, s, camX, camY) {
    const T = TILE;
    const c0 = Math.max(0, Math.floor(camX / T) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / T) + 1, Math.ceil(this.facadeEnd() / T) - 1);
    const r0 = Math.max(0, Math.floor(camY / T) - 1);
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / T) + 1);
    const pad = Scenery.PAD;
    const th = this.theme;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // (le trou caché sous un bloc lutin, dans le terrier, compte comme du sol : pas de bord dessiné)
    // (les éboulis de la Grande Glissade aussi : la terre sous la pente n'a pas d'herbe, ni de bord)
    // (et la glace du Glacier Fumant : la roche sous une plaque de glace n'a pas de neige dessus)
    const isG = (c, r) => (r >= this.rows ? true : this.tileAt(c, r) === '#' || this.tileAt(c, r) === SCREE || this.tileAt(c, r) === ICE || this.hiddenShaft(c, r));
    // (les grands chapeaux de champignons sont dessinés à part : voir drawCaps)
    const capped = this.caps.length > 0;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = this.tiles[r][c];
        // (les troncs sont dessinés avant, avec le feuillage : voir drawTrunks)
        // (les plaques des paratonnerres aussi, avec leur pointe : voir LightningRod)
        if (ch === '.' || ch === '~' || ch === '|' || ch === WATER || ch === 'z') continue;
        if (capped && (ch === '-' || ch === 'M')) continue;
        // (les ponts de corde du marais sont dessinés à part : voir drawBridges)
        if (ch === '=' && this.cabins) continue;
        let img = null;
        if (ch === '#' && this.scree && this.scree.rock[r * this.cols + c]) {
          // un rocher sur la pente d'éboulis (la Grande Glissade) : une grosse pierre grise
          const rk = (cc, rr) => rr >= 0 && cc >= 0 && cc < this.cols && this.scree.rock[rr * this.cols + cc] === 1;
          img = Scenery.boulderSprite(!rk(c, r - 1), !rk(c - 1, r), !rk(c + 1, r), Math.floor(hash2(c, r) * 3));
        } else if (ch === '#') {
          // (pas d'herbe au fond de la rivière ; sous terre, dans le terrier, de la terre toute nue)
          const m = { t: !isG(c, r - 1) && r > 0 && this.tileAt(c, r - 1) !== WATER, l: !isG(c - 1, r), r: !isG(c + 1, r), b: !isG(c, r + 1) };
          img = Scenery.groundSprite(this.tileTheme(c, r), m, Math.floor(hash2(c, r) * 4));
        } else if (ch === ICE) {
          // une plaque de glace (le Glacier Fumant) : ses bords là où il n'y a ni glace ni roche à côté
          const ice = (cc, rr) => rr >= this.rows || (cc >= 0 && cc < this.cols && (this.tiles[rr] ? isSolidCh(this.tiles[rr][cc]) && !LUTIN_BLOCKS.includes(this.tiles[rr][cc]) && this.tiles[rr][cc] !== 'B' : false));
          const m = { t: r === 0 || !ice(c, r - 1), l: !ice(c - 1, r), r: !ice(c + 1, r), b: !ice(c, r + 1) };
          img = Scenery.iceSprite(m, Math.floor(hash2(c, r) * 4));
        } else if (ch === 'B') {
          img = Scenery.brickSprite(th);
        } else if (LUTIN_BLOCKS.includes(ch)) {
          img = Scenery.lutinSprite();
        } else if (ch === PLUG) {
          img = Scenery.plugSprite(this.tileAt(c, r - 1) !== PLUG, this.tileAt(c, r + 1) !== PLUG);
        } else if (ch === '-') {
          // (dans le terrier, les plateformes sont des racines)
          const pth = this.terrier && r >= this.terrier - 2 ? 'burrow' : this.tileTheme(c, r);
          img = Scenery.platformSprite(pth, this.tileAt(c - 1, r) !== '-', this.tileAt(c + 1, r) !== '-', Math.floor(hash2(c, r) * 3));
        } else if (ch === '=' && this.branchy) {
          // (dans le sous-bois : une branche des grands arbres)
          img = Scenery.platformSprite('treetops', this.tileAt(c - 1, r) !== '=', this.tileAt(c + 1, r) !== '=', Math.floor(hash2(c, r) * 3));
        } else if (ch === '=') {
          img = Scenery.rainbowSprite(this.tileAt(c - 1, r) !== '=', this.tileAt(c + 1, r) !== '=');
        } else if (ch === SCREE) {
          // la pente d'éboulis (la Grande Glissade) : la terre sous la pente, et les cailloux dessus
          const ls = this.scree && this.scree.lines[c];
          if (!ls) continue;
          // (la pente qui passe le plus près du milieu de la case)
          const mid = (l) => Math.abs(l.y0 + l.k * (c * T + T / 2 - l.x0) - (r + 0.5) * T);
          const L = ls.reduce((a, l) => (mid(l) < mid(a) ? l : a));
          const yl = Math.round(L.y0 + L.k * (c * T - L.x0) - r * T);
          const yr = Math.round(L.y0 + L.k * ((c + 1) * T - L.x0) - r * T);
          img = Scenery.screeSprite(this.tileTheme(c, r), yl, yr, !isG(c - 1, r), !isG(c + 1, r), Math.floor(hash2(c, r) * 3));
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
    if (capped) this.drawCaps(ctx, s, camX, camY);
    ctx.restore();
  }

  // Les flaques d'eau, posées sur le sol (les cases w qui se touchent font une seule flaque).
  drawPuddles(ctx, camX) {
    const T = TILE;
    const c0 = Math.max(0, Math.floor(camX / T) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / T) + 1);
    // (seulement les rangées qu'on voit : dans un niveau très haut, les autres étages ne coûtent rien)
    const r0 = Math.max(0, Math.floor(this.cam.y / T) - 2);
    const r1 = Math.min(this.rows - 1, Math.ceil((this.cam.y + VIEW_H) / T) + 1);
    for (let r = r0; r <= r1; r++) {
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
    const r0 = Math.max(0, Math.floor(camY / TILE) - 1);
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / TILE) + 1);
    for (let r = r0; r <= r1; r++) {
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

  drawDecor(ctx, camX, camY) {
    const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
    // (dans un niveau où l'on grimpe, il y a un sol à chaque étage : on cherche dans toutes les rangées qu'on voit)
    const climb = this.def.grimpe;
    const r0 = climb ? Math.max(1, Math.floor(camY / TILE)) : 1;
    const r1 = climb ? Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / TILE) + 1) : this.rows - 1;
    for (let c = c0; c <= c1; c++) {
      for (let r = r0; r <= r1; r++) {
        if (this.tiles[r][c] !== '#') continue;
        // (pas de fleur sur un rocher de la Grande Glissade)
        if (this.scree && this.scree.rock[r * this.cols + c]) break;
        // sous un plafond (grotte), on cherche le vrai sol plus bas
        if (this.tiles[r - 1][c] === '#') continue;
        // (un bloc magique du Lutin posé par terre ne fait pas disparaître l'herbe)
        if (this.tiles[r - 1][c] !== '.' && this.tiles[r - 1][c] !== 'u') {
          if (climb) continue;
          break;
        }
        const h = hash2(c * 3.1, r * 1.7);
        if (h < 0.42) {
          const v = hash2(c, r + 9);
          const x = c * TILE + 10 + h * 50;
          // (le décor reste celui du niveau sous le puits de lumière d'un terrier : seul le tronc en change)
          Scenery.decor(ctx, this.trunk ? this.tileTheme(c, r) : this.theme, x, r * TILE + 2, v, this.t);
          // les petits champignons de la grotte (et les petites fleurs de la nuit) brillent dans le noir
          if (this.dark && v < (this.night ? 0.4 : 0.5)) this.lights.push({ x, y: r * TILE - 8, r: 46, a: 0.55 });
        }
        if (!climb) break;
      }
    }
  }

  // Le décor d'une case : celui du niveau (sous terre, dans un terrier, de la terre ; dehors, devant le
  // Vieux Chêne, la forêt ; et dans le sous-bois, au-dessus du sol, l'écorce des grosses souches).
  tileTheme(c, r) {
    if (this.terrier && r >= this.terrier) return 'burrow';
    if (this.stumps && r < this.rows - 2 && this.tiles[r][c] === '#') return 'treetops';
    if (this.trunk && c < this.trunk.c0) return 'forest';
    // (autour du phare, au-dessus du sol de la falaise : les paliers de pierre et les planches)
    const L = this.lighthouse;
    if (L && c > L.rock1 && r * TILE < L.foot) return 'phare';
    return this.theme;
  }

  drawStormClouds(ctx) {
    for (const [a, b, r] of this.storms) {
      const x0 = a * TILE;
      const x1 = (b + 1) * TILE;
      if (x1 < this.cam.x - 200 || x0 > this.cam.x + VIEW_W + 200) continue;
      // (un orage qui n'est que sur un étage : seulement quand on voit cet étage ; il apparaît et disparaît en
      // fondu, pendant que l'écran glisse d'un étage à l'autre)
      let k = 1;
      if (r !== undefined) {
        k = clamp(Math.min(r * TILE - this.cam.y + 40, this.cam.y + VIEW_H + 240 - r * TILE) / STORM_FADE, 0, 1);
        if (k <= 0) continue;
      }
      const y = this.cam.y + 18;
      ctx.globalAlpha = k;
      for (let x = x0; x < x1; x += 90) {
        const h = hash(x * 0.37);
        Scenery.fluffyCloud(ctx, x + h * 30, y + h * 22 + Math.sin(this.t + h * 6) * 4, 0.95 + h * 0.4, '#6b3d28', '#3f2015');
      }
      ctx.globalAlpha = 1;
    }
  }

  drawLava(ctx, camX, camY) {
    const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor(camY / TILE));
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / TILE));
    const run = this.mud ? Scenery.drawMudRun : this.choco ? Scenery.drawChocoRun : Scenery.drawLavaRun;
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

  // "galeries" (voir levels.js) : les passages bas sous un plafond (une ou deux cases vides entre deux cases
  // solides, dessus et dessous, comme les tunnels du Défi de la Roulade) sont des galeries de terre, comme
  // celles du terrier : une butte se lit comme une colline percée d'un tunnel. (Le terrier, c'est drawBurrow.)
  drawTunnels(ctx, camX, camY) {
    if (!this.def.galeries) return;
    const T = TILE;
    const solid = (c, r) => isSolidCh(this.tileAt(c, r));
    const open = (c, r) => !solid(c, r) && this.tileAt(c, r) !== WATER;
    const c0 = Math.max(0, Math.floor(camX / T) - 1);
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + VIEW_W) / T) + 1);
    const r0 = Math.max(1, Math.floor(camY / T) - 1);
    const r1 = Math.min(this.rows - 2, Math.ceil((camY + VIEW_H) / T) + 1);
    const cells = [];
    for (let r = r0; r <= r1; r++) {
      if (this.terrier && r >= this.terrier - 2) break;
      for (let c = c0; c <= c1; c++) {
        if (!open(c, r)) continue;
        const low = solid(c, r - 1) && solid(c, r + 1);
        const tall = (solid(c, r - 1) && open(c, r + 1) && solid(c, r + 2)) || (solid(c, r - 2) && open(c, r - 1) && solid(c, r + 1));
        if (low || tall) cells.push({ c, r, ceil: solid(c, r - 1) });
      }
    }
    if (!cells.length) return;
    // la terre derrière (et derrière les bords arrondis des cases du dessus et du dessous : pas de ciel entre elles)
    ctx.fillStyle = '#5c3c22';
    ctx.beginPath();
    for (const k of cells) ctx.rect(k.c * T - 0.5, k.r * T - T / 2, T + 1, T * 2);
    ctx.fill();
    for (const k of cells) {
      const floor = this.tiles[k.r + 1][k.c] === '#';
      Scenery.burrowCell(ctx, k.c * T, k.r * T, hash2(k.c * 1.3, k.r * 2.1), this.t, { ceil: k.ceil, floor, surface: false });
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
    const th0 = Scenery.THEMES[this.theme];
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        // derrière l'écorce des gros troncs, du bois : on ne voit pas le ciel entre deux cases
        // (mais pas derrière la mousse du dessus, qui est arrondie ; les souches du sous-bois aussi)
        const th = this.stumps ? Scenery.THEMES[this.tileTheme(c, r)] : th0;
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
    // (et les rangées qu'on voit, avec de quoi couvrir la plus grande de ces lumières)
    const r0 = Math.max(0, Math.floor(camY / T) - 4);
    const r1 = Math.min(this.rows - 1, Math.ceil((camY + VIEW_H) / T) + 3);
    for (let r = r0; r <= r1; r++) {
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
      // (seulement celles qu'on voit ; un texte qui flotte est plus large)
      if (!this.onScreen(q, q.type === 'text' ? 400 : 150)) continue;
      // (hold : elle ne s'efface que pendant ses hold dernières secondes, comme le grand « L'eau monte ! »)
      const a = Math.max(0, Math.min(1, q.life / (q.hold || q.max)));
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
          ctx.lineWidth = (q.flat ? 2 : 4) * a;
          // (flat : à plat sur le sol, comme une goutte de pluie qui éclabousse)
          if (q.flat) ellipsePath(ctx, q.x, q.y, q.size * (1 - a) + 3, (q.size * (1 - a) + 3) * 0.3);
          else circlePath(ctx, q.x, q.y, q.size * (1 - a) + 4);
          ctx.stroke();
          break;
        case 'heart':
          Art.heart(ctx, q.x, q.y, 1.3, '#ff4f8a');
          break;
        case 'flake':
          // un flocon de neige (éternué par Malice, le nez tout rouge) qui tourne en flottant
          ctx.translate(q.x + Math.sin(q.life * 6 + q.rot) * 3, q.y);
          ctx.rotate(q.rot);
          Art.snowflake(ctx, q.size);
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
      const y = b.below ? b.y + 10 : Math.max(this.cam.y + 6, b.y - h);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRectPath(ctx, x + 2, y + 4, w, h, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, x, y, w, h, 14);
      ctx.fill();
      ctx.beginPath();
      const tx = clamp(b.x, x + 16, x + w - 16);
      const ty = b.below ? y + 1 : y + h - 1;
      ctx.moveTo(tx - 8, ty);
      ctx.lineTo(tx + 8, ty);
      ctx.lineTo(tx, b.below ? y - 10 : y + h + 10);
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
