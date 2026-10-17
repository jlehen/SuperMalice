'use strict';

// Regroupe clavier, écran tactile et manette en une seule liste d'actions.
const Input = (() => {
  const ACTIONS = ['left', 'right', 'down', 'jump', 'caramel', 'chips', 'grapple', 'pause'];
  const keys = {};
  const touch = {};
  const pad = {};
  const tapped = {};
  const held = {};
  const prev = {};
  const pressed = {};
  let capture = false;

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
  let touchButtons = [];
  const pointers = new Map();

  function btnAt(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const el of touchButtons) {
      if (el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      const m = Math.min(24, r.width * 0.25);
      if (x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m) {
        const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2);
        if (d < bestD) { bestD = d; best = el; }
      }
    }
    return best;
  }

  function refreshTouch() {
    const before = Object.assign({}, touch);
    ACTIONS.forEach((a) => { touch[a] = false; });
    touchButtons.forEach((el) => el.classList.remove('on'));
    for (const el of pointers.values()) {
      if (!el) continue;
      touch[el.dataset.btn] = true;
      el.classList.add('on');
    }
    ACTIONS.forEach((a) => { if (touch[a] && !before[a]) tapped[a] = true; });
  }

  function bindTouch(layer) {
    touchButtons = Array.from(layer.querySelectorAll('[data-btn]'));
    layer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.unlock();
      pointers.set(e.pointerId, btnAt(e.clientX, e.clientY));
      refreshTouch();
    });
    layer.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      e.preventDefault();
      const el = btnAt(e.clientX, e.clientY);
      if (el !== pointers.get(e.pointerId)) {
        pointers.set(e.pointerId, el);
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
      if (b(1) || b(3)) pad.chips = true;
      if (b(4) || b(5) || b(6) || b(7)) pad.grapple = true;
      if (b(9)) pad.pause = true;
    }
  }

  // Appelé une fois par image. Les appuis "pressed" restent mémorisés
  // jusqu'à ce qu'une étape de jeu les consomme (voir consume()).
  function update() {
    pollPad();
    ACTIONS.forEach((a) => {
      const h = !!(keys[a] || touch[a] || pad[a]);
      if ((h && !prev[a]) || tapped[a]) pressed[a] = true;
      tapped[a] = false;
      held[a] = h;
      prev[a] = h;
    });
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
  }

  return {
    held,
    pressed,
    update,
    consume,
    reset,
    bindTouch,
    clearTouch,
    setCapture(v) { capture = v; },
  };
})();
