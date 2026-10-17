'use strict';

// Taille d'une case du décor et taille logique de l'écran (16/9).
const TILE = 48;
const VIEW_W = 960;
const VIEW_H = 540;
// Pas de simulation fixe (120 fois par seconde) : le jeu tourne pareil sur tous les écrans.
const STEP = 1 / 120;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
const approach = (v, target, delta) =>
  v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

// Petit hasard déterministe (toujours le même résultat pour le même nombre),
// utilisé pour décorer le décor sans qu'il "clignote" d'une image à l'autre.
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const hash2 = (a, b) => hash(a * 57.31 + b * 113.97);

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function boxOverlap(a, x, y, w, h) {
  return a.x < x + w && a.x + a.w > x && a.y < y + h && a.y + a.h > y;
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circlePath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2);
}

function ellipsePath(ctx, x, y, rx, ry, rot) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
}

// Sauvegarde dans le navigateur (niveaux débloqués, difficulté, son).
const Save = {
  key: 'superMalice.v1',
  load() {
    try {
      return Object.assign({ unlocked: 1, difficulty: 'gentil', muted: false },
        JSON.parse(localStorage.getItem(this.key) || '{}'));
    } catch (e) {
      return { unlocked: 1, difficulty: 'gentil', muted: false };
    }
  },
  save(data) {
    try { localStorage.setItem(this.key, JSON.stringify(data)); } catch (e) { /* navigation privée */ }
  },
};
