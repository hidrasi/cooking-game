// Dapur Kilat — shared constants: canvas, kitchen layout, ingredients, recipes.
// Every module imports from here so the whole game agrees on one set of numbers.

export const CANVAS_W = 1024;
export const CANVAS_H = 640;
export const HUD_H = 92;
export const SHIFT_LENGTH = 180; // seconds per shift
export const MAX_ORDERS = 4;
export const PLAYER_SPEED = 265; // px per second
export const PLAYER_RADIUS = 18;
export const INTERACT_DIST = 52; // how close the chef must be to a station

// --- Ingredients -----------------------------------------------------------
// chop: seconds on a chopping board (0 = never chopped)
// cook: seconds on a stove burner (0 = never cooked)
// burn: seconds after "done" before the item is burnt and must be binned
export const INGREDIENTS = {
  nasi:  { name: 'Nasi',   color: '#f5f0dc', dark: '#cbbf9a', chop: 0,   cook: 0, burn: 0, emoji: '🍚' },
  mie:   { name: 'Mie',    color: '#f7c948', dark: '#c89a1e', chop: 0,   cook: 3, burn: 6, emoji: '🍜' },
  telur: { name: 'Telur',  color: '#fff3c4', dark: '#d9b45b', chop: 0,   cook: 3, burn: 6, emoji: '🥚' },
  ayam:  { name: 'Ayam',   color: '#e8a06a', dark: '#a85f2e', chop: 2,   cook: 4, burn: 6, emoji: '🍗' },
  cabai: { name: 'Cabai',  color: '#e23b2e', dark: '#8f1d14', chop: 2,   cook: 0, burn: 0, emoji: '🌶️' },
  sawi:  { name: 'Sawi',   color: '#58b368', dark: '#2e7d3c', chop: 2,   cook: 0, burn: 0, emoji: '🥬' },
  tomat: { name: 'Tomat',  color: '#ff6b4a', dark: '#c23a1e', chop: 2,   cook: 0, burn: 0, emoji: '🍅' },
};

// A servable component is an ingredient after its required prep.
// nasi is ready as-is; mie/telur need cooking; ayam needs chop + cook;
// cabai/sawi/tomat need chopping only.
export function componentIdOf(item) {
  if (!item || item.stage === 'burnt') return null;
  if (item.base === 'nasi' && item.stage === 'raw') return 'nasi';
  if (item.stage === 'cooked') return item.base; // mie, telur, ayam
  // Chopped-only ingredients (cabai, sawi, tomat) are done after chopping;
  // ayam still needs the stove, so chopped ayam is not a component yet.
  if (item.stage === 'chopped' && INGREDIENTS[item.base].cook === 0) return item.base;
  return null;
}

export function componentName(id) {
  const map = {
    nasi: 'Nasi', mie: 'Mie Rebus', telur: 'Telur Goreng', ayam: 'Ayam Goreng',
    cabai: 'Cabai Iris', sawi: 'Sawi Iris', tomat: 'Tomat Iris',
  };
  return map[id] || id;
}

// --- Recipes ---------------------------------------------------------------
// components: the component ids a finished plate must hold (any order).
export const RECIPES = {
  nasi_goreng: {
    name: 'Nasi Goreng', value: 120, color: '#d98e32',
    components: ['nasi', 'telur', 'cabai'],
  },
  mie_ayam: {
    name: 'Mie Ayam', value: 140, color: '#c96a1e',
    components: ['mie', 'ayam', 'sawi'],
  },
  soto_ayam: {
    name: 'Soto Ayam', value: 130, color: '#e0a83c',
    components: ['nasi', 'ayam', 'tomat'],
  },
  capcay: {
    name: 'Capcay', value: 150, color: '#4d9e57',
    components: ['sawi', 'tomat', 'ayam'],
  },
};
export const RECIPE_KEYS = Object.keys(RECIPES);

// --- Kitchen layout (pixels, canvas space) ---------------------------------
// Top wall (y 88..152): two chopping boards, then the serving window.
// Left wall (x 0..64): seven ingredient crates. Right wall (x 960..1024):
// two stove burners. Bottom wall (y 576..640): plating counter + trash bin.
export const STATION_DEFS = [
  { id: 'board1', kind: 'board', label: 'Talenan', rect: { x: 96,  y: 88, w: 128, h: 64 } },
  { id: 'board2', kind: 'board', label: 'Talenan', rect: { x: 240, y: 88, w: 128, h: 64 } },
  { id: 'serve',  kind: 'serve', label: 'Sajikan', rect: { x: 768, y: 88, w: 232, h: 64 } },
  { id: 'crate_nasi',  kind: 'crate', stock: 'nasi',  rect: { x: 0, y: 160, w: 64, h: 64 } },
  { id: 'crate_mie',   kind: 'crate', stock: 'mie',   rect: { x: 0, y: 224, w: 64, h: 64 } },
  { id: 'crate_telur', kind: 'crate', stock: 'telur', rect: { x: 0, y: 288, w: 64, h: 64 } },
  { id: 'crate_ayam',  kind: 'crate', stock: 'ayam',  rect: { x: 0, y: 352, w: 64, h: 64 } },
  { id: 'crate_cabai', kind: 'crate', stock: 'cabai', rect: { x: 0, y: 416, w: 64, h: 64 } },
  { id: 'crate_sawi',  kind: 'crate', stock: 'sawi',  rect: { x: 0, y: 480, w: 64, h: 64 } },
  { id: 'crate_tomat', kind: 'crate', stock: 'tomat', rect: { x: 0, y: 544, w: 64, h: 64 } },
  { id: 'stove1', kind: 'stove', label: 'Kompor', rect: { x: 960, y: 180, w: 64, h: 120 } },
  { id: 'stove2', kind: 'stove', label: 'Kompor', rect: { x: 960, y: 320, w: 64, h: 120 } },
  { id: 'plate',  kind: 'plate', label: 'Piring',  rect: { x: 400, y: 576, w: 224, h: 64 } },
  { id: 'trash',  kind: 'trash', label: 'Sampah',  rect: { x: 896, y: 576, w: 104, h: 64 } },
];

// Walkable floor bounds (inside the walls, outside the counters).
export const FLOOR = { x0: 72, y0: 160, x1: 952, y1: 568 };

// Order spawn pacing: seconds between new orders, easing from slow to fast.
export function spawnInterval(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_LENGTH);
  return 15 - 9 * t; // 15s early, ~6s in the final rush
}

export function orderPatience() { return 48; } // seconds before an order walks out

export function starCutoffs() { return [400, 850, 1300]; }
