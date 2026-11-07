'use strict';

// Regroupe clavier, écran tactile et manette en une seule liste d'actions.
const Input = (() => {
  // roll : la roulade (voir plus bas, « askRoll »)
  const ACTIONS = ['left', 'right', 'down', 'jump', 'caramel', 'chips', 'grapple', 'power', 'pause', 'roll'];
  const keys = {};
  const touch = {};
  const pad = {};
  const tapped = {};
  const held = {};
  const prev = {};
  const pressed = {};
  let capture = false;

  // La roulade (badge Roulade) : c'est ici qu'on décide qu'elle est demandée (pressed.roll),
  // et dans quel sens (rollDir) :
  //  - au clavier (ou avec deux doigts sur la tablette) : on appuie sur ↓ en tenant ← ou → ;
  //  - sur la tablette : le pouce qui marche glisse de ◀ ou ▶ jusqu'à ▼ (il garde sa flèche) ;
  //  - à la manette : bas et avant tenus ensemble un petit moment (PAD_ROLL secondes), et pas
  //    seulement en passant par la diagonale entre → et ↓ (pour s'accroupir).
  // Ce n'est pas « bas » : le pouce qui glisse jusqu'à ▼ ne fait pas écraser en l'air.
  const PAD_ROLL = 0.12;
  let rollAsk = 0;
  let downWas = false;
  let padDiag = 0;
  let lastNow = 0;

  // Courir : un appui rapide sur une direction, puis on rappuie et on reste appuyé.
  const RUN_TAP = 0.35; // durée max de l'appui rapide (secondes)
  const RUN_GAP = 0.35; // temps max entre le lâcher et le deuxième appui
  const run = { left: false, right: false };
  const downAt = { left: 0, right: 0 };
  const tapEnd = { left: -Infinity, right: -Infinity };

  // On utilise la position physique des touches (e.code) : ZQSD sur un clavier
  // AZERTY correspond à WASD sur un clavier QWERTY, donc les deux marchent.
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    ArrowDown: 'down', KeyS: 'down',
    KeyX: 'caramel', KeyJ: 'caramel',
    KeyC: 'chips', KeyK: 'chips',
    KeyV: 'grapple', KeyL: 'grapple',
    KeyB: 'power', KeyI: 'power',
    Escape: 'pause', KeyP: 'pause',
  };

  window.addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    if (!e.repeat) tapped[a] = true;
    keys[a] = true;
    if (capture) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYMAP[e.code];
    if (a) keys[a] = false;
  });
  window.addEventListener('blur', () => {
    ACTIONS.forEach((a) => { keys[a] = false; touch[a] = false; });
  });

  // ---------- Boutons tactiles ----------
  // Pas besoin de viser : tout le côté gauche de l'écran sert à marcher
  // (◀ ou ▶ selon où se pose le doigt) et tout le côté droit
  // à sauter. Les petits boutons (▼, caramel, chips, moustache, pouvoir) ne comptent
  // que si le doigt se pose dessus.
  // Un doigt garde son bouton jusqu'à ce qu'il se lève : il peut seulement
  // glisser de ◀ à ▶, pour ne jamais lancer des chips en voulant sauter, ni
  // s'écraser en l'air en voulant avancer.
  const SMALL_LEFT = ['down'];
  const SMALL_RIGHT = ['caramel', 'chips', 'grapple', 'power'];
  let touchButtons = [];
  const B = {};
  const pointers = new Map();
  // Le pouce qui glisse jusqu'à ▼ : il doit vraiment y entrer (ROLL_IN fois le rayon de ▼) en ayant bougé
  // depuis là où il s'est posé (ROLL_MOVE fois le rayon d'une flèche), et vraiment en sortir (ROLL_OUT)
  // pour recommencer : un pouce qui tremble au bord de ▼ ne fait pas plusieurs roulades.
  const ROLL_IN = 0.9;
  const ROLL_OUT = 1.4;
  const ROLL_MOVE = 1;
  const arrowDir = (el) => (el === B.left ? -1 : 1);

  function circle(el) {
    const r = el.getBoundingClientRect();
    return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, r: r.width / 2 };
  }

  // Le point (x, y) est-il dans le cercle du bouton el, agrandi k fois ? (jamais si le bouton est caché)
  function near(el, x, y, k) {
    if (!el || el.offsetParent === null) return false;
    const c = circle(el);
    return Math.hypot(x - c.x, y - c.y) <= c.r * k;
  }

  function pick(x, y) {
    const left = x < window.innerWidth / 2;
    for (const name of left ? SMALL_LEFT : SMALL_RIGHT) {
      if (near(B[name], x, y, 1.2)) return { el: B[name] };
    }
    if (!left) return { el: B.jump };
    const l = circle(B.left);
    const r = circle(B.right);
    // la frontière est un peu plus près de ◀ : on avance bien plus souvent qu'on ne recule
    const mid = l.x + (r.x - l.x) * 0.45;
    return { el: x < mid ? B.left : B.right, mid, slack: (r.x - l.x) * 0.08 };
  }

  // Une petite vibration (Android) : on sent que l'appui est pris sans regarder.
  function buzz() {
    if (navigator.vibrate) navigator.vibrate(12);
  }

  function refreshTouch() {
    const before = Object.assign({}, touch);
    ACTIONS.forEach((a) => { touch[a] = false; });
    touchButtons.forEach((el) => el.classList.remove('on'));
    for (const p of pointers.values()) {
      touch[p.el.dataset.btn] = true;
      p.el.classList.add('on');
      if (p.roll) touch.roll = true;
    }
    ACTIONS.forEach((a) => { if (touch[a] && !before[a]) tapped[a] = true; });
  }

  function bindTouch(layer) {
    touchButtons = Array.from(layer.querySelectorAll('[data-btn]'));
    touchButtons.forEach((el) => { B[el.dataset.btn] = el; });
    // iOS : sans ça, deux pouces posés ressemblent à un zoom, et le navigateur
    // peut retarder ou annuler l'appui.
    const block = (e) => { if (e.cancelable) e.preventDefault(); };
    layer.addEventListener('touchstart', block, { passive: false });
    layer.addEventListener('touchmove', block, { passive: false });
    layer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.unlock();
      const p = pick(e.clientX, e.clientY);
      // (là où il s'est posé : pour la roulade, il faut qu'il ait vraiment bougé)
      p.x0 = e.clientX;
      p.y0 = e.clientY;
      pointers.set(e.pointerId, p);
      buzz();
      refreshTouch();
    });
    layer.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p || p.mid === undefined) return;
      e.preventDefault();
      // le pouce glisse jusqu'à ▼ : une roulade (il garde sa flèche)
      const x = e.clientX;
      const y = e.clientY;
      if (!p.roll && near(B.down, x, y, ROLL_IN) && Math.hypot(x - p.x0, y - p.y0) >= circle(p.el).r * ROLL_MOVE) {
        p.roll = true;
        api.rollDir = arrowDir(p.el);
        buzz();
        refreshTouch();
      } else if (p.roll && !near(B.down, x, y, ROLL_OUT)) {
        p.roll = false;
        refreshTouch();
      }
      if (p.roll) return;
      let el = p.el;
      if (e.clientX < p.mid - p.slack) el = B.left;
      else if (e.clientX > p.mid + p.slack) el = B.right;
      if (el !== p.el) {
        p.el = el;
        buzz();
        refreshTouch();
      }
    });
    const end = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      refreshTouch();
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);
    layer.addEventListener('lostpointercapture', end);
    layer.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function clearTouch() {
    pointers.clear();
    refreshTouch();
  }

  // ---------- Manette ----------
  function pollPad() {
    ACTIONS.forEach((a) => { pad[a] = false; });
    if (!navigator.getGamepads) return;
    for (const gp of navigator.getGamepads()) {
      if (!gp) continue;
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0;
      const ay = gp.axes[1] || 0;
      if (ax < -0.4 || b(14)) pad.left = true;
      if (ax > 0.4 || b(15)) pad.right = true;
      if (ay > 0.6 || b(13)) pad.down = true;
      if (b(0) || b(12)) pad.jump = true;
      if (b(2)) pad.caramel = true;
      if (b(1)) pad.chips = true;
      if (b(3)) pad.power = true;
      if (b(4) || b(5) || b(6) || b(7)) pad.grapple = true;
      if (b(9)) pad.pause = true;
    }
  }

  function updateRun(a, h, now) {
    if (h && !prev[a]) {
      run[a] = now - tapEnd[a] <= RUN_GAP;
      downAt[a] = now;
    } else if (!h && (prev[a] || tapped[a])) {
      // un appui si rapide qu'il tient entre deux images compte aussi
      tapEnd[a] = !prev[a] || now - downAt[a] <= RUN_TAP ? now : -Infinity;
    }
    if (!h) run[a] = false;
  }

  // Appelé une fois par image. Les appuis "pressed" restent mémorisés
  // jusqu'à ce qu'une étape de jeu les consomme (voir consume()).
  function update() {
    pollPad();
    const now = performance.now() / 1000;
    // la roulade : ↓ appuyé en tenant ← ou → (clavier, deux doigts), ou bas et avant tenus à la manette
    const side = (o) => (o.right ? 1 : 0) - (o.left ? 1 : 0);
    const down = !!(keys.down || touch.down);
    const dir = side({ right: keys.right || touch.right, left: keys.left || touch.left });
    if (dir && ((down && !downWas) || tapped.down)) rollAsk = dir;
    downWas = down;
    const padDir = side(pad);
    if (pad.down && padDir) {
      const before = padDiag;
      padDiag += Math.min(0.1, now - lastNow);
      if (before < PAD_ROLL && padDiag >= PAD_ROLL) rollAsk = padDir;
    } else {
      padDiag = 0;
    }
    lastNow = now;
    ACTIONS.forEach((a) => {
      const h = !!(keys[a] || touch[a] || pad[a]);
      if (a === 'left' || a === 'right') updateRun(a, h, now);
      if ((h && !prev[a]) || tapped[a]) pressed[a] = true;
      tapped[a] = false;
      held[a] = h;
      prev[a] = h;
    });
    if (rollAsk) {
      api.rollDir = rollAsk;
      pressed.roll = true;
      rollAsk = 0;
    }
  }

  function consume() {
    ACTIONS.forEach((a) => { pressed[a] = false; });
  }

  // Oublie les appuis en cours : une touche encore enfoncée ne compte
  // pas comme un nouvel appui (utile en sortant d'un menu).
  function reset() {
    ACTIONS.forEach((a) => {
      pressed[a] = false;
      tapped[a] = false;
      prev[a] = !!(keys[a] || touch[a] || pad[a]);
    });
    // (pareil pour la roulade : ↓ ou la diagonale de la manette déjà tenus ne comptent pas)
    rollAsk = 0;
    downWas = !!(keys.down || touch.down);
    padDiag = PAD_ROLL;
  }

  const api = {
    held,
    pressed,
    run,
    rollDir: 1,
    update,
    consume,
    reset,
    bindTouch,
    clearTouch,
    setCapture(v) { capture = v; },
  };
  return api;
})();
