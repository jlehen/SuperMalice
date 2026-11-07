'use strict';

// forever : les ennemis collés par le caramel ou essoufflés par les chips le restent pour toujours.
// starTime : combien de secondes dure l'étoile.
// starLava : avec l'étoile, la lave ne brûle pas : Malice rebondit dessus.
// batSpeed, birdSpeed, gummySpeed : vitesse des chauves-souris, oiseaux grincheux et oursons en gélatine.
// eyeFlee : vitesse des gros yeux bonbons qui s'enfuient. windK : force du vent. darkR : lumière autour de Malice dans la grotte.
const DIFFS = {
  bebe: {
    name: 'Bébé', lives: Infinity, eyeChase: 90, cubeFuse: 2.5, shootMin: 3.6, shootMax: 5,
    dotSpeed: 130, eclairMin: 2.4, eclairMax: 3.5, gameOver: null, forever: true, starTime: 30,
    starLava: true, batSpeed: 130, birdSpeed: 80, gummySpeed: 90, eyeFlee: 140, windK: 0.55, darkR: 280,
  },
  gentil: {
    name: 'Gentil', lives: Infinity, eyeChase: 115, cubeFuse: 1.9, shootMin: 2.8, shootMax: 3.8,
    dotSpeed: 165, eclairMin: 1.8, eclairMax: 2.7, gameOver: null, forever: false, starTime: STAR_TIME,
    starLava: false, batSpeed: 160, birdSpeed: 100, gummySpeed: 115, eyeFlee: 175, windK: 0.8, darkR: 240,
  },
  classique: {
    name: 'Classique', lives: 3, eyeChase: 135, cubeFuse: 1.55, shootMin: 2.2, shootMax: 3.2,
    dotSpeed: 200, eclairMin: 1.35, eclairMax: 2.1, gameOver: 'level', forever: false, starTime: STAR_TIME,
    starLava: false, batSpeed: 190, birdSpeed: 120, gummySpeed: 135, eyeFlee: 195, windK: 1, darkR: 215,
  },
  difficile: {
    name: 'Difficile', lives: 3, eyeChase: 155, cubeFuse: 1.3, shootMin: 1.7, shootMax: 2.6,
    dotSpeed: 235, eclairMin: 1.0, eclairMax: 1.7, gameOver: 'game', forever: false, starTime: STAR_TIME,
    starLava: false, batSpeed: 220, birdSpeed: 140, gummySpeed: 155, eyeFlee: 215, windK: 1.15, darkR: 195,
  },
};

// Les vrais niveaux (1 à 8) et les stages d'entraînement aux badges.
const NORMAL_LEVELS = LEVELS.map((l, i) => (l.badge ? -1 : i)).filter((i) => i >= 0);
// Le retour à la maison commence au premier niveau « sequel » (la grotte).
const SEQUEL_START = LEVELS.findIndex((l) => l.sequel);
const TRAINING_LEVELS = LEVELS.map((l, i) => (l.badge ? i : -1)).filter((i) => i >= 0);
const BADGE_AT = {};
LEVELS.forEach((l, i) => { if (l.badge) BADGE_AT[l.badge] = i; });
const BADGE_INFO = {
  saut: { name: 'Super Saut', desc: 'Accroupis-toi, puis saute deux fois plus haut !' },
  grappin: { name: 'Moustache-Grappin', desc: 'Accroche ta moustache aux anneaux dorés !' },
};

// La musique d'un niveau (voir music.js) : une par monde, une par stage d'entraînement.
const levelSong = (lv) => (lv.badge ? 'badge-' + lv.badge : lv.theme);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const Game = {
  state: 'boot',
  t: 0,
  stateT: 0,
  energyMax: 5,
  levelIndex: 0,
  checkpoint: -1,
  lives: 3,
  candies: 0,
  score: 0,
  caramel: 0,
  chips: 0,
  world: null,
  isTouch: false,
  diffKey: 'gentil',
  diff: DIFFS.gentil,
  // le personnage choisi, et ceux qu'on peut choisir (Malice + 3 tirés au hasard)
  hero: 'malice',
  roster: ['malice'],

  init() {
    this.canvas = $('#game');
    this.ctx = this.canvas.getContext('2d');
    this.save = Save.load();
    if (!this.save.v) {
      // anciennes sauvegardes : il n'y avait pas encore de stages d'entraînement
      const n = Math.min(this.save.unlocked || 1, NORMAL_LEVELS.length);
      this.save.unlocked = NORMAL_LEVELS[n - 1] + 1;
      this.save.v = 2;
      Save.save(this.save);
    }
    this.diffKey = DIFFS[this.save.difficulty] ? this.save.difficulty : 'gentil';
    this.diff = DIFFS[this.diffKey];
    Sound.setMuted(this.save.muted);
    this.isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    document.body.classList.toggle('touch', this.isTouch);
    $('#version').textContent = 'version ' + (typeof GAME_VERSION === 'string' ? GAME_VERSION : 'dev');
    this.bindUI();
    Input.bindTouch($('#touch'));
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    this.resize();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'play') this.pause();
    });
    const unlock = () => Sound.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchend', unlock);
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && !this.isTouch) {
        this.isTouch = true;
        document.body.classList.add('touch');
        this.updateTouchUI();
      }
    });
    this.drawIcons();

    // À chaque chargement, 3 personnages tirés au hasard (Malice est toujours là).
    const others = HEROES.map((h) => h.id).filter((id) => id !== 'malice');
    for (let i = others.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [others[i], others[j]] = [others[j], others[i]];
    }
    this.roster = ['malice'].concat(others.slice(0, 3));
    // Méthode cachée pour tester tous les personnages : toucher 5 fois le numéro de version
    // (ou ?personnages=tous dans l'adresse).
    let taps = [];
    $('#version').addEventListener('click', () => {
      const now = performance.now();
      taps = taps.filter((t) => now - t < 3000).concat(now);
      if (taps.length >= 5) {
        taps = [];
        this.showAllHeroes();
      }
    });

    // Raccourcis pour tester : ?niveau=3 lance le niveau 3, ?stage=1 le 1er stage d'entraînement,
    // ?perso=licorne joue avec la licorne.
    const params = new URLSearchParams(location.search);
    if (params.get('personnages') === 'tous') this.roster = HEROES.map((h) => h.id);
    const perso = params.get('perso');
    if (HERO_BY_ID[perso]) {
      this.hero = perso;
      if (!this.roster.includes(perso)) this.roster[this.roster.length - 1] = perso;
    }
    const lv = parseInt(params.get('niveau') || params.get('level'), 10);
    const st = parseInt(params.get('stage'), 10);
    let start = -1;
    if (lv >= 1 && lv <= NORMAL_LEVELS.length) start = NORMAL_LEVELS[lv - 1];
    if (st >= 1 && st <= TRAINING_LEVELS.length) start = TRAINING_LEVELS[st - 1];
    if (start >= 0) {
      const d = params.get('difficulte');
      if (DIFFS[d]) { this.diffKey = d; this.diff = DIFFS[d]; }
      this.newGame(start);
    } else {
      this.toTitle();
    }
    this.last = performance.now();
    this.acc = 0;
    requestAnimationFrame((t) => this.frame(t));
  },

  // ---------- Écran ----------
  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / VIEW_W, vh / VIEW_H);
    const cssW = Math.floor(VIEW_W * scale);
    const cssH = Math.floor(VIEW_H * scale);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const frame = $('#frame');
    frame.style.width = cssW + 'px';
    frame.style.height = cssH + 'px';
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.scale = this.canvas.width / VIEW_W;
    document.documentElement.style.setProperty('--s', scale.toFixed(4));
    Scenery.setScale(this.scale);
    const portrait = vh > vw * 1.1;
    document.body.classList.toggle('portrait', portrait);
    if (portrait && this.isTouch && this.state === 'play') this.pause();
  },

  // ---------- Menus ----------
  showScreen(id) {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    $$('.screen').forEach((s) => s.classList.toggle('show', s.id === id));
    $('#screens').classList.toggle('active', !!id);
    const first = id && $(`#${id} button:not([disabled])`);
    if (first && !this.isTouch) setTimeout(() => first.focus({ preventScroll: true }), 30);
    this.updateTouchUI();
  },

  bindUI() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-action]');
      if (!b) return;
      Sound.unlock();
      Sound.sfx.confirm();
      this.action(b.dataset.action, b.dataset);
    });
    document.addEventListener('keydown', (e) => {
      if (!$('#screens').classList.contains('active')) return;
      const btns = $$('.screen.show button:not([disabled])');
      if (!btns.length) return;
      const i = btns.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
        btns[(i + d + btns.length) % btns.length].focus();
        Sound.sfx.select();
      } else if (e.key === 'Escape') {
        if (this.state === 'pause') this.resume();
        else {
          const back = $('.screen.show [data-action="back"], .screen.show [data-esc]');
          if (back) back.click();
        }
      }
    });
    $('#btn-pause').addEventListener('click', () => {
      Sound.unlock();
      if (this.state === 'play') this.pause();
      else if (this.state === 'pause') this.resume();
    });
    $('#btn-sound').addEventListener('click', () => {
      Sound.unlock();
      this.save.muted = !Sound.isMuted();
      Sound.setMuted(this.save.muted);
      Save.save(this.save);
      this.updateSoundBtn();
    });
    $('#btn-fs').addEventListener('click', () => this.toggleFullscreen());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') $('#btn-sound').click();
    });
    this.updateSoundBtn();
    const fsOk = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (!fsOk) $('#btn-fs').style.display = 'none';
  },

  updateSoundBtn() {
    const wave = Sound.isMuted()
      ? '<path d="M16 9l5 6M21 9l-5 6" fill="none" stroke-width="2.4" stroke-linecap="round"/>'
      : '<path d="M16 8.5c1.6 1.8 1.6 5.2 0 7M18.8 6c3 3.2 3 8.8 0 12" fill="none" stroke-width="2.2" stroke-linecap="round"/>';
    $('#btn-sound').innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 9.5h4l5-4.5v14l-5-4.5H3z"/>${wave}</svg>`;
  },

  toggleFullscreen() {
    const el = document.documentElement;
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (fs) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } catch (e) { /* pas grave */ }
  },

  action(a, data) {
    switch (a) {
      case 'play': this.showHeroes(); break;
      case 'heroes': this.showHeroes(); break;
      case 'hero': this.pickHero(data.hero); break;
      case 'help': this.showScreen('scr-help'); break;
      case 'back': this.toTitle(); break;
      case 'diff': this.pickDifficulty(data.diff); break;
      case 'level': this.newGame(parseInt(data.level, 10)); break;
      case 'resume': this.resume(); break;
      case 'restart': this.checkpoint = -1; this.lives = Math.max(this.lives, 1); this.enterIntro(); break;
      case 'menu': this.toTitle(); break;
      case 'retry': this.retry(); break;
      case 'sequel': this.startLevel(SEQUEL_START); break;
      case 'reset': this.showScreen('scr-reset'); break;
      case 'reset-no': this.showLevels(); break;
      case 'reset-yes':
        // on garde la difficulté et le réglage du son, on efface les niveaux débloqués
        this.save.unlocked = 1;
        Save.save(this.save);
        this.showLevels();
        break;
      default: break;
    }
  },

  toTitle() {
    this.state = 'title';
    this.stateT = 0;
    this.world = null;
    Input.setCapture(false);
    this.showScreen('scr-title');
    Sound.playMusic('title');
  },

  // ---------- Choix du personnage ----------
  showHeroes() {
    this.state = 'title';
    const box = $('#hero-list');
    box.innerHTML = '';
    const many = this.roster.length > 4;
    box.classList.toggle('many', many);
    $('#hero-note').textContent = many
      ? 'Tous les personnages (pour tester) !'
      : 'Les personnages changent à chaque fois qu\'on recharge le jeu !';
    for (const id of this.roster) {
      const h = HERO_BY_ID[id];
      const b = document.createElement('button');
      b.className = 'card hero ' + id;
      b.dataset.action = 'hero';
      b.dataset.hero = id;
      b.innerHTML = `<canvas></canvas><b>${h.name}</b><i>${h.power}</i><small>${this.powerText(h.desc)}</small>`;
      box.appendChild(b);
    }
    this.showScreen('scr-hero');
    const picked = $(`#hero-list [data-hero="${this.hero}"]`);
    if (picked && !this.isTouch) setTimeout(() => picked.focus({ preventScroll: true }), 40);
  },

  showAllHeroes() {
    this.roster = HEROES.map((h) => h.id);
    Sound.sfx.oneUp();
    this.showHeroes();
  },

  pickHero(id) {
    if (!HERO_BY_ID[id]) return;
    this.hero = id;
    this.showDifficulty();
  },

  // Les personnages bougent sur leurs cartes : celui qu'on montre du doigt marche.
  drawHeroCards() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const active = document.activeElement;
    for (const cv of $$('#hero-list canvas')) {
      const card = cv.parentElement;
      const id = card.dataset.hero;
      const r = cv.getBoundingClientRect();
      const W = Math.max(1, Math.round(r.width * dpr));
      const H = Math.max(1, Math.round(r.height * dpr));
      if (cv.width !== W || cv.height !== H) {
        cv.width = W;
        cv.height = H;
      }
      const g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, W, H);
      const k = H / 140;
      g.setTransform(k, 0, 0, k, 0, 0);
      const cx = W / k / 2;
      g.fillStyle = 'rgba(0,0,0,0.18)';
      ellipsePath(g, cx, 128, 34, 6);
      g.fill();
      const on = card === active || card.matches(':hover');
      const t = this.t + hash(id.length * 7.7 + id.charCodeAt(0)) * 10;
      Heroes.draw(g, id, cx, 128, { pose: on ? 'walk' : 'idle', t, ph: t * 11, facing: 1, scale: 1.75 });
    }
  },

  powerText(s) {
    return s.replace(/\{POUVOIR\}/g, this.isTouch ? 'Le bouton pouvoir' : 'La touche B');
  },

  showDifficulty() {
    this.state = 'title';
    $$('#scr-diff .card').forEach((c) => c.classList.toggle('picked', c.dataset.diff === this.diffKey));
    this.showScreen('scr-diff');
    const picked = $('#scr-diff .card.picked');
    if (picked && !this.isTouch) setTimeout(() => picked.focus({ preventScroll: true }), 40);
  },

  pickDifficulty(key) {
    this.diffKey = key;
    this.diff = DIFFS[key];
    this.save.difficulty = key;
    Save.save(this.save);
    if (this.save.unlocked > 1) this.showLevels();
    else this.newGame(0);
  },

  showLevels() {
    const box = $('#level-list');
    box.innerHTML = '';
    LEVELS.forEach((lv, i) => {
      const b = document.createElement('button');
      b.className = 'lvl theme-' + lv.theme;
      const locked = i + 1 > this.save.unlocked;
      b.disabled = locked;
      b.dataset.action = 'level';
      b.dataset.level = String(i);
      const num = lv.badge ? `<canvas data-icon="badge-${lv.badge}" width="54"></canvas>` : NORMAL_LEVELS.indexOf(i) + 1;
      const label = lv.badge ? `Stage ${BADGE_INFO[lv.badge].name}` : lv.name;
      b.innerHTML = `<span class="num">${locked ? '<canvas data-icon="lock" width="44"></canvas>' : num}</span><span class="nm">${label}</span>`;
      if (lv.badge) b.classList.add('training');
      box.appendChild(b);
    });
    this.drawIcons(box);
    $('#btn-reset').classList.toggle('hidden', this.save.unlocked <= 1);
    this.showScreen('scr-levels');
    const btns = $$('#level-list button:not([disabled])');
    if (btns.length && !this.isTouch) setTimeout(() => btns[btns.length - 1].focus({ preventScroll: true }), 40);
  },

  // ---------- Déroulement de la partie ----------
  newGame(levelIdx) {
    this.lives = this.diff.lives;
    this.candies = 0;
    this.score = 0;
    this.caramel = 0;
    this.chips = 0;
    this.startLevel(levelIdx);
  },

  startLevel(i) {
    this.levelIndex = i;
    this.checkpoint = -1;
    this.enterIntro();
  },

  enterIntro(short) {
    this.showScreen(null);
    this.state = 'intro';
    this.stateT = 0;
    this.introDur = short ? (this.diff.lives === Infinity ? 0.9 : 1.6) : 2.6;
    this.world = null;
    Sound.stopMusic();
    Input.setCapture(true);
    Input.reset();
  },

  beginPlay() {
    const lv = LEVELS[this.levelIndex];
    this.world = new World(this, lv, this.checkpoint);
    this.state = 'play';
    this.stateT = 0;
    this.bannerT = this.checkpoint < 0 ? 3.2 : 0;
    Sound.playMusic(levelSong(lv));
    Input.setCapture(true);
    this.updateTouchUI();
  },

  pause() {
    if (this.state !== 'play') return;
    this.state = 'pause';
    Sound.setMusicVolume(0.3);
    Input.setCapture(false);
    Input.clearTouch();
    this.showScreen('scr-pause');
  },

  resume() {
    if (this.state !== 'pause') return;
    this.showScreen(null);
    this.state = 'play';
    this.pauseLock = true;
    Sound.setMusicVolume(1);
    Input.setCapture(true);
    Input.reset();
  },

  onPlayerDeath() {
    this.state = 'dying';
    this.stateT = 0;
    Sound.stopMusic();
  },

  afterDeath() {
    if (this.diff.lives !== Infinity) this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
      return;
    }
    this.enterIntro(true);
  },

  gameOver() {
    this.state = 'gameover';
    this.stateT = 0;
    Sound.playMusic('gameover');
    const name = HERO_BY_ID[this.hero].name;
    let msg = `${name} n'a plus de vies… On recommence ce niveau !`;
    if (this.diff.gameOver === 'game') {
      msg = this.levelIndex >= SEQUEL_START
        ? `${name} n'a plus de vies… Retour au début du voyage, dans la grotte !`
        : `${name} n'a plus de vies… Retour au tout début de l'aventure !`;
    }
    $('#over-msg').textContent = msg;
    Input.setCapture(false);
    this.showScreen('scr-over');
  },

  retry() {
    this.lives = this.diff.lives;
    if (this.diff.gameOver === 'game') {
      this.candies = 0;
      this.score = 0;
      this.caramel = 0;
      this.chips = 0;
      // pendant le retour à la maison, on repart de la grotte
      this.startLevel(this.levelIndex >= SEQUEL_START ? SEQUEL_START : 0);
    } else {
      this.startLevel(this.levelIndex);
    }
  },

  levelComplete() {
    if (this.state !== 'play') return;
    const w = this.world;
    this.state = 'clear';
    this.stateT = 0;
    w.player.won = true;
    w.player.star = 0;
    w.player.grap = null;
    this.badgeWon = LEVELS[this.levelIndex].badge || null;
    Sound.playMusic(this.badgeWon ? 'badge' : 'clear');
    this.score += 1000;
    this.unlock(this.levelIndex + 2);
    for (let i = 0; i < 50; i++) {
      w.spawn({
        type: 'confetti', x: w.cam.x + rand(0, VIEW_W), y: w.cam.y - 20, vx: rand(-60, 60), vy: rand(50, 250),
        g: 120, life: 3, size: rand(6, 10), color: `hsl(${randInt(0, 360)},90%,60%)`,
      });
    }
  },

  unlock(n) {
    this.save.unlocked = Math.min(LEVELS.length, Math.max(this.save.unlocked, n));
    Save.save(this.save);
  },

  // kind : 'rescue' (le bébé oiseau sauvé dans le volcan) ou 'family' (il a retrouvé sa famille : fin du jeu)
  victory(kind) {
    if (this.state !== 'play') return;
    const w = this.world;
    this.state = 'victory';
    this.stateT = 0;
    this.victoryShown = false;
    this.victoryKind = kind || 'rescue';
    const p = w.player;
    p.won = true;
    p.star = 0;
    p.grap = null;
    this.score += 5000;
    if (this.victoryKind === 'family') {
      Sound.playMusic('family');
    } else {
      p.holding = (ctx) => Art.heldBird(ctx, w.t);
      Sound.sfx.chirp();
      Sound.playMusic('victory');
      // maintenant, il faut le ramener chez lui : la grotte est débloquée
      if (SEQUEL_START > 0) this.unlock(SEQUEL_START + 1);
    }
  },

  // Un gros œil bonbon attrapé : une vie en plus (en Bébé et Gentil, les vies sont déjà illimitées).
  extraLife(x, y) {
    const w = this.world;
    if (this.diff.lives !== Infinity) {
      this.lives++;
      w.popText(x, y, '+1 vie !', '#7dff9a', 26);
    } else {
      w.popText(x, y, 'Cœurs à fond !', '#ff7ab8', 24);
    }
  },

  onStarEnd() {
    if (this.state === 'play') Sound.playMusic(levelSong(LEVELS[this.levelIndex]));
  },

  setCheckpoint(i) {
    this.checkpoint = Math.max(this.checkpoint, i);
  },

  addCandies(n, x, y) {
    const before = this.candies;
    this.candies += n;
    this.score += n * 10;
    Sound.sfx.candy();
    const w = this.world;
    if (w) w.popText(x, y, '+' + n, '#fff3a0', n > 1 ? 22 : 16);
    if (Math.floor(before / 100) < Math.floor(this.candies / 100)) {
      if (this.diff.lives !== Infinity) {
        this.lives++;
        if (w) w.popText(w.player.cx, w.player.y - 30, '+1 vie !', '#7dff9a', 26);
      } else if (w) {
        w.popText(w.player.cx, w.player.y - 30, '100 friandises !', '#7dff9a', 24);
      }
      Sound.sfx.oneUp();
    }
  },

  addScore(n) {
    this.score += n;
  },

  // ---------- Boucle ----------
  frame(now) {
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    Input.update();
    this.acc += dt;
    let n = 0;
    while (this.acc >= STEP && n < 14) {
      this.step(STEP);
      Input.consume();
      this.acc -= STEP;
      n++;
    }
    if (n >= 14) this.acc = 0;
    this.render();
    this.updateTouchCounts();
    requestAnimationFrame((t) => this.frame(t));
  },

  step(dt) {
    this.t += dt;
    this.stateT += dt;
    const w = this.world;
    switch (this.state) {
      case 'intro':
        if (this.stateT > this.introDur || (this.stateT > 0.5 && Input.pressed.jump)) this.beginPlay();
        break;
      case 'play':
        if (!Input.held.pause) this.pauseLock = false;
        if (Input.pressed.pause && !this.pauseLock) {
          this.pause();
          break;
        }
        w.update(dt);
        if (this.bannerT > 0) this.bannerT -= dt;
        break;
      case 'dying':
        w.updateFrozen(dt);
        if (this.stateT > 2.4) this.afterDeath();
        break;
      case 'clear':
        w.update(dt);
        if (w.player.onGround && this.stateT > 0.6 && Math.floor(this.stateT * 2) % 2 === 0 && this.stateT < 3.4) {
          w.player.vy = -520;
          w.player.onGround = false;
        }
        if (this.stateT > (this.badgeWon ? 5.8 : 4.6) || (this.stateT > 1.5 && Input.pressed.jump)) {
          if (this.levelIndex + 1 < LEVELS.length) this.startLevel(this.levelIndex + 1);
          else this.toTitle();
        }
        break;
      case 'victory':
        w.update(dt);
        if (Math.random() < dt * 6) {
          w.spawn({ type: 'heart', x: w.player.cx + rand(-30, 30), y: w.player.y, vy: rand(-120, -50), life: 1.4, size: 1 });
        }
        if (Math.random() < dt * 30) {
          w.spawn({
            type: 'confetti', x: w.cam.x + rand(0, VIEW_W), y: w.cam.y - 10, vx: rand(-40, 40), vy: rand(60, 200),
            g: 80, life: 4, size: rand(6, 10), color: `hsl(${randInt(0, 360)},90%,60%)`,
          });
        }
        if (this.stateT > this.victoryDelay() && !this.victoryShown) {
          this.victoryShown = true;
          const family = this.victoryKind === 'family';
          $('#vic-msg').textContent = family
            ? 'Le bébé oiseau a retrouvé toute sa famille !'
            : `${HERO_BY_ID[this.hero].name} a sauvé le bébé oiseau ! Maintenant, ramène-le chez lui…`;
          $('#btn-sequel').classList.toggle('hidden', family);
          $('#vic-stats').textContent = `Friandises : ${this.candies}   •   Score : ${this.score}`;
          Input.setCapture(false);
          this.showScreen('scr-victory');
        }
        break;
      default:
        break;
    }
  },

  // ---------- Dessin ----------
  render() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (this.state === 'intro') {
      this.drawIntro(ctx);
    } else if (this.world) {
      this.world.render(ctx, s);
      this.drawHUD(ctx);
      if (this.state === 'clear') this.drawClear(ctx);
      if (this.state === 'victory' && this.victoryShown) {
        if (this.victoryKind === 'family') this.drawFamilyVictory(ctx);
        else this.drawVictory(ctx);
      }
      if (this.state === 'dying' && this.stateT > 1.6) {
        ctx.fillStyle = `rgba(20,5,30,${Math.min(1, (this.stateT - 1.6) / 0.8)})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      if (this.state === 'play' && this.stateT < 0.4) {
        ctx.fillStyle = `rgba(20,5,30,${1 - this.stateT / 0.4})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    } else {
      this.drawTitleScene(ctx);
      if ($('#scr-hero').classList.contains('show')) this.drawHeroCards();
    }
  },

  drawTitleScene(ctx) {
    const t = this.t;
    const camX = t * 110;
    Scenery.drawBackground(ctx, 'meadow', camX, 0, t);
    const s = this.scale;
    const top = VIEW_H - TILE * 2 + 6;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const pad = Scenery.PAD;
    for (let c = Math.floor(camX / TILE) - 1; c <= Math.ceil((camX + VIEW_W) / TILE) + 1; c++) {
      for (let r = 0; r < 3; r++) {
        const img = Scenery.groundSprite('meadow', { t: r === 0, l: false, r: false, b: false }, Math.floor(hash2(c, r) * 4));
        const dx = Math.round((c * TILE - pad - camX) * s);
        const dy = Math.round((top + r * TILE - pad) * s);
        const dx2 = Math.round(((c + 1) * TILE + pad - camX) * s);
        const dy2 = Math.round((top + (r + 1) * TILE + pad) * s);
        ctx.drawImage(img, dx, dy, dx2 - dx, dy2 - dy);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.translate(-camX, 0);
    for (let c = Math.floor(camX / TILE) - 1; c <= Math.ceil((camX + VIEW_W) / TILE) + 1; c++) {
      const h = hash(c * 3.7);
      if (h < 0.45) Scenery.decor(ctx, 'meadow', c * TILE + 10 + h * 50, top + 2, hash(c + 9), t);
    }
    ctx.restore();
    // bonbons qui défilent
    for (let i = 0; i < 6; i++) {
      const x = ((i * 190 - camX * 1) % 1140 + 1140) % 1140 - 90;
      const y = top - 70 - (i % 3) * 30 + Math.sin(t * 3 + i) * 4;
      if (i % 3 === 0) Art.lollipop(ctx, x, y, 1, t);
      else if (i % 3 === 1) Art.ball(ctx, x, y, 11, t);
      else Art.candy(ctx, x, y, 1, t, i);
    }
    // Malice court, poursuivie par un gros oeil
    const mx = 175;
    const hop = Math.max(0, Math.sin(t * 2.2)) > 0.97 ? 0 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ellipsePath(ctx, mx, top + 2, 26, 6);
    ctx.fill();
    Art.malice(ctx, mx, top + 2 - hop, { pose: 'walk', ph: t * 13, t, facing: 1, scale: 1.7 });
    const ex = 50 + Math.sin(t * 0.8) * 16;
    Art.eyeMonster(ctx, ex, top + 2, {
      dir: 1, legPhase: t * 16, look: { x: 1, y: -0.1 }, chasing: true, hue: 140, lid: 0, moving: true,
    });
    Art.rubik(ctx, VIEW_W - 120, top + 2 - Math.abs(Math.sin(t * 3)) * 30, {
      colors: TITLE_CUBE, top: TITLE_CUBE.slice(0, 3), side: TITLE_CUBE.slice(3, 6), angry: 0, look: { x: -1, y: 0 }, t,
    });
    Art.ladybug(ctx, VIEW_W - 170, top - 250 + Math.sin(t * 2) * 12, { dir: -1, t, fly: true, spots: 7, open: 0 });
  },

  drawIntro(ctx) {
    const lv = LEVELS[this.levelIndex];
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#2a1450');
    g.addColorStop(1, '#5a1f6a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < 40; i++) {
      const a = 0.3 + 0.3 * Math.sin(this.t * 2 + i);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      circlePath(ctx, hash(i) * VIEW_W, hash(i + 50) * VIEW_H, 1 + (i % 3));
      ctx.fill();
    }
    const k = Math.min(1, this.stateT / 0.35);
    ctx.save();
    ctx.globalAlpha = k;
    drawOutlinedText(ctx, this.levelLabel(this.levelIndex), VIEW_W / 2, 150, 34, lv.badge ? '#7ff0ff' : '#ffd84a');
    drawOutlinedText(ctx, lv.name, VIEW_W / 2, 205, lv.badge ? 42 : 50, '#ffffff');
    if (lv.badge) {
      Art.badge(ctx, VIEW_W / 2, 305, 42, lv.badge, this.t);
      drawOutlinedText(ctx, `Gagne le badge « ${BADGE_INFO[lv.badge].name} » !`, VIEW_W / 2, 400, 24, '#ffe2f4');
    } else {
      Heroes.head(ctx, this.hero, VIEW_W / 2 - 40, 300, 1.6);
      drawOutlinedText(ctx, '× ' + (this.lives === Infinity ? '∞' : this.lives), VIEW_W / 2 + 30, 302, 34, '#ffffff');
      drawOutlinedText(ctx, lv.intro || '', VIEW_W / 2, 400, 22, '#ffe2f4');
    }
    if (lv.sequel) {
      Art.babyBird(ctx, VIEW_W / 2, 472, this.t, { noNest: true, happy: true, chirp: Math.floor(this.t * 3) % 2 === 0 });
    } else if (lv.map.some((row) => row.includes('N'))) {
      Art.babyBird(ctx, VIEW_W / 2, 470, this.t, { chirp: Math.floor(this.t * 3) % 2 === 0 });
    }
    drawOutlinedText(ctx, `Difficulté : ${this.diff.name}`, VIEW_W / 2, 510, 16, '#c9b3ff');
    ctx.restore();
  },

  // la grande fin dure plus longtemps : on regarde le bébé rejoindre son nid
  victoryDelay() {
    return this.victoryKind === 'family' ? 5.5 : 3.2;
  },

  // Grande Malice qui serre le bébé oiseau dans ses bras.
  drawVictory(ctx) {
    const t = this.t;
    const k = Math.min(1, (this.stateT - 3.2) / 0.5);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(25,8,45,0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const g = ctx.createRadialGradient(165, 330, 20, 165, 330, 230);
    g.addColorStop(0, 'rgba(255,220,120,0.55)');
    g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 60, 420, 480);
    ctx.save();
    ctx.translate(165, 330);
    ctx.rotate(t * 0.3);
    ctx.fillStyle = 'rgba(255,240,180,0.18)';
    for (let i = 0; i < 10; i++) {
      ctx.rotate(Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18, 260);
      ctx.lineTo(18, 260);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const hop = Math.abs(Math.sin(t * 4)) * 14;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipsePath(ctx, 165, 478, 50 - hop, 10);
    ctx.fill();
    Heroes.draw(ctx, this.hero, 165, 476 - hop, {
      pose: 'hold', t, facing: 1, scale: 2.7, view: '3q',
      holding: (c) => Art.heldBird(c, t, { chirp: Math.floor(t * 3) % 2 === 0 }),
    });
    for (let i = 0; i < 6; i++) {
      const a = t * 1.5 + (i * Math.PI) / 3;
      Art.heart(ctx, 165 + Math.cos(a) * 120, 300 + Math.sin(a) * 80, 1.6 + Math.sin(t * 4 + i) * 0.2, '#ff4f8a');
    }
    ctx.restore();
  },

  // Fin du jeu : Malice fait coucou, et toute la famille oiseau chante dans son nid.
  drawFamilyVictory(ctx) {
    const t = this.t;
    const k = Math.min(1, (this.stateT - this.victoryDelay()) / 0.5);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(25,8,45,0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const g = ctx.createRadialGradient(200, 360, 20, 200, 360, 260);
    g.addColorStop(0, 'rgba(255,220,120,0.55)');
    g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 60, 480, 480);
    ctx.save();
    ctx.translate(200, 360);
    ctx.rotate(t * 0.3);
    ctx.fillStyle = 'rgba(255,240,180,0.18)';
    for (let i = 0; i < 10; i++) {
      ctx.rotate(Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18, 280);
      ctx.lineTo(18, 280);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // la famille dans son nid, à côté de Malice
    ctx.save();
    ctx.translate(220, 500);
    ctx.scale(1.55, 1.55);
    Art.birdNest(ctx, 0, 6, 150);
    const sing = (i) => Math.floor(t * 4 + i * 1.3) % 2 === 0;
    Art.bigBird(ctx, -52, -6, t, { kind: 'maman', sing: sing(0), hug: 0.6 + Math.sin(t * 3) * 0.3, dir: 1, happy: true });
    Art.bigBird(ctx, 52, -6, t + 1, { kind: 'papa', sing: sing(1), hug: 0.6 + Math.cos(t * 3) * 0.3, dir: -1, happy: true });
    [-28, -10, 10, 28].forEach((x, i) => {
      Art.babyBird(ctx, x, -8, t + i, { noNest: true, colors: i === 1 ? undefined : SIBLINGS[i > 1 ? i - 1 : i], chirp: sing(i + 2), happy: true });
    });
    ctx.restore();
    const hop = Math.abs(Math.sin(t * 4)) * 14;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipsePath(ctx, 400, 498, 40 - hop * 0.6, 8);
    ctx.fill();
    Heroes.draw(ctx, this.hero, 400, 496 - hop, { pose: 'win', t, facing: 1, scale: 2.1, view: '3q' });
    for (let i = 0; i < 7; i++) {
      const a = t * 1.2 + (i * Math.PI * 2) / 7;
      ctx.font = '700 32px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText(i % 2 ? '♪' : '♫', 260 + Math.cos(a) * 190, 270 + Math.sin(a) * 70);
      ctx.fillStyle = ['#ff4f9a', '#3fa8ff', '#ffb000', '#2fbf5a'][i % 4];
      ctx.fillText(i % 2 ? '♪' : '♫', 260 + Math.cos(a) * 190, 270 + Math.sin(a) * 70);
    }
    ctx.restore();
  },

  drawClear(ctx) {
    if (this.badgeWon) {
      this.drawBadgeWon(ctx);
      return;
    }
    const k = Math.min(1, this.stateT / 0.4);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(30,10,60,0.45)';
    roundRectPath(ctx, VIEW_W / 2 - 230, 120, 460, 150, 30);
    ctx.fill();
    const bounce = 1 + Math.sin(this.stateT * 6) * 0.04;
    ctx.translate(VIEW_W / 2, 175);
    ctx.scale(bounce, bounce);
    drawOutlinedText(ctx, 'Bravo !', 0, 0, 54, '#ffd84a');
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = k;
    drawOutlinedText(ctx, 'Niveau terminé', VIEW_W / 2, 225, 26, '#ffffff');
    Art.candy(ctx, VIEW_W / 2 - 60, 254, 0.9, this.t, 0);
    drawOutlinedText(ctx, `${this.candies}`, VIEW_W / 2 - 38, 255, 20, '#fff3a0', 'left');
    drawOutlinedText(ctx, `Score ${this.score}`, VIEW_W / 2 + 60, 255, 20, '#ffffff');
    ctx.restore();
  },

  drawBadgeWon(ctx) {
    const info = BADGE_INFO[this.badgeWon];
    const k = Math.min(1, this.stateT / 0.5);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(20,8,60,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.translate(VIEW_W / 2, 250);
    ctx.rotate(this.t * 0.4);
    ctx.fillStyle = 'rgba(255,240,160,0.16)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-22, 330);
      ctx.lineTo(22, 330);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const pop = Math.min(1, this.stateT / 0.6);
    const sc = pop < 1 ? 0.3 + 0.9 * Math.sin(pop * Math.PI * 0.6) : 1 + Math.sin(this.t * 3) * 0.03;
    ctx.save();
    ctx.translate(VIEW_W / 2, 250);
    ctx.scale(sc, sc);
    Art.badge(ctx, 0, 0, 70, this.badgeWon, this.t);
    ctx.restore();
    drawOutlinedText(ctx, 'Badge obtenu !', VIEW_W / 2, 95, 50, '#ffd84a');
    drawOutlinedText(ctx, info.name, VIEW_W / 2, 400, 36, '#7ff0ff');
    drawOutlinedText(ctx, info.desc, VIEW_W / 2, 445, 22, '#ffffff');
    ctx.restore();
  },

  drawHUD(ctx) {
    const w = this.world;
    const p = w.player;
    const t = this.t;
    ctx.save();
    ctx.fillStyle = 'rgba(40,10,60,0.32)';
    roundRectPath(ctx, 10, 10, 30 * this.energyMax + 22, 82, 20);
    ctx.fill();
    for (let i = 0; i < this.energyMax; i++) {
      const full = i < p.energy;
      const pulse = full && p.energy === 1 ? 1 + Math.sin(t * 10) * 0.12 : 1;
      Art.heart(ctx, 34 + i * 30, 34, 1.55 * pulse, full ? '#ff3d7f' : 'rgba(255,255,255,0.28)', full ? '#8a0d3a' : 'rgba(255,255,255,0.4)');
      if (full) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        circlePath(ctx, 30 + i * 30, 29, 2.4);
        ctx.fill();
      }
    }
    Heroes.head(ctx, this.hero, 34, 70, 0.75);
    drawOutlinedText(ctx, '×' + (this.lives === Infinity ? '∞' : this.lives), 52, 72, 20, '#ffffff', 'left');
    Art.candy(ctx, 112, 71, 0.8, t, 0);
    drawOutlinedText(ctx, String(this.candies), 130, 72, 20, '#fff3a0', 'left');
    let bx = 30;
    // le pouvoir du personnage (sur tablette, il y a un bouton)
    if (this.hero !== 'malice' && !this.isTouch) {
      this.keyCap(ctx, bx - 6, 112, 'B');
      drawOutlinedText(ctx, HERO_BY_ID[this.hero].power, bx + 8, 113, 15, '#ffe680', 'left');
      bx += 30 + ctx.measureText(HERO_BY_ID[this.hero].power).width;
    }
    for (const b of ['saut', 'grappin']) {
      if (!this.hasBadge(b)) continue;
      Art.badge(ctx, bx, 114, 14, b, t);
      if (b === 'grappin' && !this.isTouch) this.keyCap(ctx, bx + 26, 112, 'V');
      bx += b === 'grappin' && !this.isTouch ? 64 : 38;
    }

    // munitions
    let x = 250;
    const keys = !this.isTouch;
    if (this.caramel > 0) {
      ctx.fillStyle = 'rgba(40,10,60,0.32)';
      roundRectPath(ctx, x - 6, 14, keys ? 104 : 80, 44, 16);
      ctx.fill();
      Art.caramel(ctx, x + 16, 36, 0.85);
      drawOutlinedText(ctx, '×' + this.caramel, x + 34, 37, 20, '#ffcf6a', 'left');
      if (keys) this.keyCap(ctx, x + 80, 36, 'X');
      x += keys ? 112 : 88;
    }
    if (this.chips > 0) {
      ctx.fillStyle = 'rgba(40,10,60,0.32)';
      roundRectPath(ctx, x - 6, 14, keys ? 104 : 80, 44, 16);
      ctx.fill();
      Art.chipsBag(ctx, x + 16, 36, 0.8);
      drawOutlinedText(ctx, '×' + this.chips, x + 34, 37, 20, '#b6ff7a', 'left');
      if (keys) this.keyCap(ctx, x + 80, 36, 'C');
    }
    if (p.star > 0) {
      const k = p.star / this.diff.starTime;
      ctx.fillStyle = 'rgba(40,10,60,0.4)';
      roundRectPath(ctx, VIEW_W / 2 - 80, 64, 160, 18, 9);
      ctx.fill();
      ctx.fillStyle = `hsl(${Math.floor(t * 400) % 360},90%,62%)`;
      roundRectPath(ctx, VIEW_W / 2 - 76, 68, 152 * k, 10, 5);
      ctx.fill();
      Art.star(ctx, VIEW_W / 2 - 92, 73, 14, t);
      drawOutlinedText(ctx, String(Math.ceil(p.star)), VIEW_W / 2 + 98, 73, 18, '#fff27a', 'left');
    }
    if (this.bannerT > 0 && this.state === 'play') {
      const a = Math.min(1, this.bannerT / 0.6, (3.2 - this.bannerT) / 0.3);
      ctx.globalAlpha = Math.max(0, a);
      drawOutlinedText(ctx, LEVELS[this.levelIndex].name, VIEW_W / 2, 130, 36, '#ffffff');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },

  keyCap(ctx, x, y, label) {
    ctx.fillStyle = '#fff';
    roundRectPath(ctx, x - 10, y - 11, 20, 22, 5);
    ctx.fill();
    ctx.fillStyle = '#3a2a4a';
    ctx.font = '700 14px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 1);
  },

  hasBadge(b) {
    return BADGE_AT[b] !== undefined && this.levelIndex >= BADGE_AT[b];
  },

  levelLabel(i) {
    return LEVELS[i].badge ? 'Stage d\'entraînement' : `Niveau ${NORMAL_LEVELS.indexOf(i) + 1}`;
  },

  // Les fleurs expliquent les commandes selon l'appareil (clavier ou tactile).
  textFor(s) {
    const touch = this.isTouch;
    return s
      .replace(/Malice/g, HERO_BY_ID[this.hero].call)
      .replace(/\{POUVOIR\}/g, touch ? 'le bouton pouvoir' : 'la touche B')
      .replace(/\{BAS\}/g, touch ? 'le bouton ▼' : 'la flèche ↓')
      .replace(/\{SAUT\}/g, touch ? 'le gros bouton rose' : 'Espace')
      .replace(/\{GRAPPIN\}/g, touch ? 'le bouton moustache' : 'la touche V')
      .replace(/\{FLECHES\}/g, touch ? '◀ ▶' : '← →')
      .replace(/\{AVANCER\}/g, touch ? 'le bouton ▶' : 'la flèche →')
      .replace(/\{GAUCHE\}/g, touch ? 'le bouton ◀' : 'la flèche ←');
  },

  // ---------- Boutons tactiles ----------
  updateTouchUI() {
    $('#t-grapple').classList.toggle('hidden', !this.hasBadge('grappin'));
    $('#t-power').classList.toggle('hidden', this.hero === 'malice');
    if (this.powerIcon !== this.hero) {
      this.powerIcon = this.hero;
      this.drawIcons($('#t-power'));
    }
    const playing = this.state === 'play' || this.state === 'dying' || this.state === 'clear' || this.state === 'intro';
    $('#touch').classList.toggle('show', this.isTouch && playing);
    $('#hudbtns').classList.toggle('show', playing || this.state === 'pause');
  },

  updateTouchCounts() {
    if (this.state !== this.lastUiState) {
      this.lastUiState = this.state;
      this.updateTouchUI();
    }
    const c = this.caramel;
    const h = this.chips;
    if (c !== this.lastC) {
      this.lastC = c;
      $('#t-caramel').classList.toggle('empty', c <= 0);
      $('#t-caramel .count').textContent = c;
    }
    if (h !== this.lastH) {
      this.lastH = h;
      $('#t-chips').classList.toggle('empty', h <= 0);
      $('#t-chips .count').textContent = h;
    }
  },

  // Petites icônes dessinées pour l'aide et les boutons tactiles.
  drawIcons(root) {
    (root || document).querySelectorAll('canvas[data-icon]').forEach((cv) => {
      if (!cv.dataset.size) cv.dataset.size = cv.getAttribute('width');
      const size = parseInt(cv.dataset.size, 10);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = size * dpr;
      cv.height = size * dpr;
      cv.style.width = size + 'px';
      cv.style.height = size + 'px';
      const g = cv.getContext('2d');
      g.scale(dpr, dpr);
      const k = size / 48;
      g.scale(k, k);
      const c = 24;
      switch (cv.dataset.icon) {
        case 'fruit': Art.passionFruit(g, c, c + 2, 1.2); break;
        case 'caramel': Art.caramel(g, c, c, 1.3); break;
        case 'chips': Art.chipsBag(g, c, c + 2, 1.2); break;
        case 'star': Art.star(g, c, c, 19, 0); break;
        case 'candy': Art.candy(g, c, c, 1.3, 0, 0); break;
        case 'lollipop': Art.lollipop(g, c, c, 1.2, 0); break;
        case 'ball': Art.ball(g, c, c, 13, 0); break;
        case 'eye': Art.eyeMonster(g, c, 46, { dir: 1, look: { x: 0.7, y: 0.3 }, hue: 140, legPhase: 0, moving: false }); break;
        case 'rubik': Art.rubik(g, c - 3, 44, { colors: TITLE_CUBE, top: TITLE_CUBE.slice(0, 3), side: TITLE_CUBE.slice(3, 6), angry: 1, t: 0, look: { x: 0, y: 0 } }); break;
        case 'ladybug': g.translate(c - 4, 40); g.scale(0.8, 0.8); Art.ladybug(g, 0, 0, { dir: 1, spots: 7, open: 0.3 }); break;
        case 'eclair': Art.eclair(g, c, c, -0.3, 0.8); Art.sparks(g, c, c + 14, 22, 3, 0.9); break;
        case 'thorn': g.drawImage(Scenery.thornSprite('forest', false, 1), -Scenery.PAD * (1 / 1), -Scenery.PAD, 64, 64); break;
        case 'lava': Scenery.drawLavaRun(g, 0, 48, 14, true, 48, 0); break;
        case 'lutin': g.drawImage(Scenery.lutinSprite(), -Scenery.PAD, -Scenery.PAD, 64, 64); break;
        case 'bird': Art.babyBird(g, c, 44, 0, {}); break;
        case 'gem': Art.gem(g, c, c, 1.4, 'rubis', 0.4); break;
        case 'candyeye': Art.candyEye(g, c, 42, { dir: 1, look: { x: 0.5, y: 0 }, hue: 320 }); break;
        case 'bat': g.translate(c, 40); g.scale(0.9, 0.9); Art.bat(g, 0, 0, { dir: 1, flap: 1, t: 0 }); break;
        case 'grumpy': g.translate(c, 40); g.scale(0.85, 0.85); Art.grumpyBird(g, 0, 0, { dir: 1, flap: 1, t: 0 }); break;
        case 'gummy': Art.gummyBear(g, c, 45, { dir: 1, hue: 0, t: 0 }); break;
        case 'heart': Art.heart(g, c, c + 2, 3, '#ff3d7f', '#ffffff'); break;
        case 'badge-saut': Art.badge(g, c, c - 4, 17, 'saut', 0); break;
        case 'badge-grappin': Art.badge(g, c, c - 4, 17, 'grappin', 0); break;
        case 'mustache':
          Art.anchorRing(g, c, 16, 0, {});
          Art.mustacheRope(g, c, 44, c, 16, 0, true);
          break;
        case 'lock':
          g.strokeStyle = '#fff';
          g.lineWidth = 5;
          g.beginPath();
          g.arc(c, 20, 9, Math.PI, 0);
          g.stroke();
          roundRectPath(g, c - 14, 20, 28, 22, 5);
          g.fillStyle = '#fff';
          g.fill();
          g.fillStyle = '#6c4fe0';
          circlePath(g, c, 30, 3.5);
          g.fill();
          break;
        case 'fire': {
          const fg = g.createLinearGradient(0, 6, 0, 44);
          fg.addColorStop(0, '#ffe24a');
          fg.addColorStop(1, '#ff4a12');
          g.fillStyle = fg;
          g.strokeStyle = '#fff';
          g.lineWidth = 2.5;
          g.beginPath();
          g.moveTo(c, 4);
          g.bezierCurveTo(c + 22, 18, c + 18, 44, c, 44);
          g.bezierCurveTo(c - 18, 44, c - 20, 26, c - 8, 16);
          g.bezierCurveTo(c - 6, 24, c - 2, 26, c, 24);
          g.bezierCurveTo(c - 4, 16, c - 2, 10, c, 4);
          g.closePath();
          g.fill();
          g.stroke();
          break;
        }
        case 'malice': Art.malice(g, c - 2, 47, { pose: 'idle', t: 1, scale: 0.75 }); break;
        // le bouton pouvoir : la tête du personnage dans une étoile
        case 'power':
          Art.star(g, c, c, 23, 0);
          Heroes.head(g, this.hero, c, c + 1, 0.62);
          break;
        default: break;
      }
    });
  },
};

const TITLE_CUBE = ['#e8202a', '#ffd500', '#1f5fe0', '#16a34a', '#ff8a00', '#f6f6f6', '#ffd500', '#e8202a', '#1f5fe0'];

window.addEventListener('load', () => {
  const go = () => Game.init();
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load('700 20px Fredoka'), document.fonts.load('400 20px "Luckiest Guy"')]),
      new Promise((r) => setTimeout(r, 1500)),
    ]).then(go, go);
  } else {
    go();
  }
});
