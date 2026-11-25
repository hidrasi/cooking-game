// Dapur Kilat — every pixel is drawn here with canvas shapes, no images.
// One function per thing: the floor, each station kind, the chef, the food,
// the HUD, and the title / game-over screens.

import { CANVAS_W, CANVAS_H, HUD_H, INGREDIENTS, RECIPES, componentName } from './config.js';
import { isPlate, isItem } from './cooking.js';
import { patienceFrac } from './orders.js';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// --- Food icons ------------------------------------------------------------
// Each ingredient is a small vector drawing, so the game needs no image files.
export function drawIngredient(ctx, base, x, y, s, stage = 'raw') {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 32; // unit scale: drawings are made on a 32px grid
  if (base === 'nasi') {
    circle(ctx, 0, 4 * u, 13 * u, '#e8e2cf');
    ctx.fillStyle = '#fbf8ec';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12 * u, 6 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fffdf2';
    for (let i = -2; i <= 2; i += 1) circle(ctx, i * 4 * u, -3 * u - Math.abs(i) * u, 2.4 * u, '#fffdf2');
    ctx.strokeStyle = '#b8a97e';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.ellipse(0, 4 * u, 13 * u, 5 * u, 0, 0, Math.PI);
    ctx.stroke();
  } else if (base === 'mie') {
    ctx.strokeStyle = '#e9a91c';
    ctx.lineWidth = 2.6 * u;
    for (let r = 4; r <= 11; r += 3.5) {
      ctx.beginPath();
      ctx.arc(0, 1 * u, r * u, 0.3, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.strokeStyle = '#b97d0e';
    ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    ctx.moveTo(-8 * u, -8 * u);
    ctx.lineTo(9 * u, 6 * u);
    ctx.stroke();
  } else if (base === 'telur') {
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.ellipse(0, 1 * u, 13 * u, 10 * u, 0, 0, TAU);
    ctx.fill();
    circle(ctx, 1 * u, 1 * u, 5.5 * u, '#f7b733');
    circle(ctx, 2.5 * u, -0.5 * u, 2 * u, '#ffd76a');
  } else if (base === 'ayam') {
    ctx.rotate(-0.6);
    ctx.fillStyle = '#d97b3f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * u, 8 * u, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#b45a24';
    ctx.beginPath();
    ctx.ellipse(-2 * u, 1 * u, 6 * u, 4.5 * u, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#f5e6d0';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(9 * u, 0);
    ctx.lineTo(15 * u, 0);
    ctx.stroke();
    circle(ctx, 15 * u, -2.5 * u, 2.4 * u, '#f5e6d0');
    circle(ctx, 15 * u, 2.5 * u, 2.4 * u, '#f5e6d0');
  } else if (base === 'cabai') {
    ctx.strokeStyle = '#d92b1f';
    ctx.lineWidth = 6 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10 * u, -6 * u);
    ctx.quadraticCurveTo(2 * u, 2 * u, 8 * u, 10 * u);
    ctx.stroke();
    ctx.strokeStyle = '#3f9e4d';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(-10 * u, -6 * u);
    ctx.lineTo(-13 * u, -11 * u);
    ctx.stroke();
  } else if (base === 'sawi') {
    ctx.fillStyle = '#4caf5e';
    ctx.beginPath();
    ctx.ellipse(-4 * u, -2 * u, 7 * u, 11 * u, -0.5, 0, TAU);
    ctx.ellipse(4 * u, -2 * u, 7 * u, 11 * u, 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7ed07f';
    ctx.beginPath();
    ctx.ellipse(0, -4 * u, 5 * u, 9 * u, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#e8f5e9';
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.moveTo(0, 10 * u);
    ctx.lineTo(0, -10 * u);
    ctx.stroke();
  } else if (base === 'tomat') {
    circle(ctx, 0, 2 * u, 11 * u, '#ef4b2f');
    circle(ctx, -3 * u, -1 * u, 3.5 * u, '#ff8a6b');
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath();
    ctx.moveTo(0, -8 * u);
    ctx.lineTo(-6 * u, -13 * u);
    ctx.lineTo(-1 * u, -9 * u);
    ctx.lineTo(2 * u, -14 * u);
    ctx.lineTo(6 * u, -9 * u);
    ctx.closePath();
    ctx.fill();
  }
  if (stage === 'burnt') {
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, 13 * u, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlateIcon(ctx, components, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 32;
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.ellipse(0, 2 * u, 15 * u, 6 * u, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 1.6 * u;
  ctx.beginPath();
  ctx.ellipse(0, 2 * u, 15 * u, 6 * u, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 10 * u, 4 * u, 0, 0, TAU);
  ctx.stroke();
  components.forEach((comp, i) => {
    const spots = [[-5, -2], [5, -3], [0, -6]];
    const [dx, dy] = spots[i % spots.length];
    drawIngredient(ctx, comp, dx * u, dy * u, 13 * u);
  });
  ctx.restore();
}

// --- Kitchen ---------------------------------------------------------------
function drawFloor(ctx) {
  const tile = 64;
  for (let y = HUD_H; y < CANVAS_H; y += tile) {
    for (let x = 0; x < CANVAS_W; x += tile) {
      const odd = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = odd ? '#f3e3c2' : '#ecd9b4';
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // subtle grout
  ctx.strokeStyle = 'rgba(120, 90, 50, 0.18)';
  ctx.lineWidth = 1;
  for (let y = HUD_H; y <= CANVAS_H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
  for (let x = 0; x <= CANVAS_W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, HUD_H); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
}

function counterTop(ctx, rect, base, top) {
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fillStyle = base;
  ctx.fill();
  rr(ctx, rect.x + 2, rect.y + 2, rect.w - 4, 14, 6);
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = 'rgba(60, 35, 15, 0.35)';
  ctx.lineWidth = 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.stroke();
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, frac)); ctx.stroke();
}

function drawStation(ctx, game, station, now) {
  const r = station.rect;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  if (station.kind === 'crate') {
    counterTop(ctx, r, '#8a5a2b', '#a9713a');
    drawIngredient(ctx, station.stock, cx, cy - 2, 30);
    text(ctx, INGREDIENTS[station.stock].name, cx, r.y + r.h - 6, 11, '#fff', '700', 'center');
  } else if (station.kind === 'board') {
    counterTop(ctx, r, '#7c4a21', '#9c6234');
    ctx.fillStyle = '#e8c99a';
    rr(ctx, r.x + 14, r.y + 18, r.w - 28, r.h - 30, 6);
    ctx.fill();
    if (station.item) {
      drawIngredient(ctx, station.item.base, cx, cy + 2, 30, station.item.stage);
      if (station.item.processing === 'chopping') {
        drawProgressRing(ctx, cx, cy + 2, 20, station.item.progress, '#e8a13c');
        // chopping knife, bobbing
        const bob = Math.sin(now * 18) * 3;
        ctx.strokeStyle = '#cfd6dd';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + 12, cy - 14 + bob);
        ctx.lineTo(cx + 26, cy - 2 + bob);
        ctx.stroke();
      }
    } else {
      text(ctx, 'TALENAN', cx, cy + 4, 11, '#8a6a44', '700', 'center');
    }
  } else if (station.kind === 'stove') {
    counterTop(ctx, r, '#5b5f66', '#7d838c');
    circle(ctx, cx, cy, 24, '#2f3338');
    circle(ctx, cx, cy, 18, '#454a51');
    if (station.item) {
      const item = station.item;
      // pot
      ctx.fillStyle = '#3c3f45';
      rr(ctx, cx - 20, cy - 14, 40, 26, 5);
      ctx.fill();
      drawIngredient(ctx, item.base, cx, cy - 2, 22, item.stage);
      if (item.processing === 'cooking') {
        const frac = item.stage === 'cooked' ? 1 - item.burn : item.progress;
        const color = item.stage === 'cooked' ? '#e23b2e' : '#4caf5e';
        drawProgressRing(ctx, cx, cy - 2, 24, frac, color);
        if (item.stage === 'cooked') text(ctx, 'AMBIL!', cx, cy + 34, 11, '#e23b2e', '800', 'center');
      }
      if (item.stage === 'burnt') text(ctx, 'GOSONG', cx, cy + 34, 11, '#3a2a18', '800', 'center');
    } else {
      text(ctx, 'KOMPOR', cx, cy + 4, 11, '#d8dde2', '700', 'center');
    }
  } else if (station.kind === 'plate') {
    counterTop(ctx, r, '#7c4a21', '#9c6234');
    // stack of clean plates
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = '#f2f2f2';
      ctx.beginPath();
      ctx.ellipse(r.x + 34, r.y + 44 - i * 5, 20, 6, 0, 0, TAU);
      ctx.fill();
    }
    if (station.plate) {
      drawPlateIcon(ctx, station.plate.components, cx + 30, cy + 6, 44);
      if (station.plate.components.length > 0) {
        text(ctx, station.plate.components.map(componentName).join(' + '), cx + 30, r.y + r.h - 6, 10, '#fff', '700', 'center');
      }
    } else {
      text(ctx, 'PIRING', cx + 20, cy + 4, 12, '#fff', '700', 'center');
    }
  } else if (station.kind === 'serve') {
    counterTop(ctx, r, '#6b4a8a', '#8a68ad');
    text(ctx, '🔔  SAJIKAN', cx, cy - 4, 18, '#fff', '800', 'center');
    text(ctx, 'antar piring jadi ke sini', cx, cy + 18, 11, '#e8dcf5', '600', 'center');
  } else if (station.kind === 'trash') {
    counterTop(ctx, r, '#4a4a4a', '#666');
    ctx.fillStyle = '#333';
    rr(ctx, r.x + 22, r.y + 16, r.w - 44, r.h - 26, 6);
    ctx.fill();
    text(ctx, '🗑', cx, cy + 8, 22, '#ddd', '700', 'center');
    text(ctx, 'SAMPAH', cx, r.y + r.h - 6, 10, '#fff', '700', 'center');
  }
}

// --- Chef ------------------------------------------------------------------
function drawChef(ctx, player, now) {
  const { x, y, dir } = player;
  const bob = player.walking ? Math.sin(player.walkPhase) * 2.5 : 0;
  ctx.save();
  ctx.translate(x, y + bob * 0.4);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 20, 7, 0, 0, TAU);
  ctx.fill();
  // feet
  const step = player.walking ? Math.sin(player.walkPhase) * 6 : 0;
  ctx.fillStyle = '#3a2c1c';
  ctx.beginPath();
  ctx.ellipse(-7 + step * 0.4, 18, 6, 4, 0, 0, TAU);
  ctx.ellipse(7 - step * 0.4, 18, 6, 4, 0, 0, TAU);
  ctx.fill();
  // body (chef coat + apron)
  circle(ctx, 0, 2, 17, '#ffffff');
  ctx.fillStyle = '#7fb3e8';
  rr(ctx, -11, -2, 22, 20, 7);
  ctx.fill();
  ctx.fillStyle = '#5a8fc7';
  ctx.fillRect(-2, -2, 4, 20);
  // head
  circle(ctx, 0, -16, 12, '#f2c89b');
  // chef hat
  ctx.fillStyle = '#ffffff';
  rr(ctx, -13, -32, 26, 12, 5);
  ctx.fill();
  circle(ctx, -8, -32, 7, '#ffffff');
  circle(ctx, 0, -34, 8, '#ffffff');
  circle(ctx, 8, -32, 7, '#ffffff');
  // face
  ctx.fillStyle = '#222';
  circle(ctx, dir * 4 - 3, -17, 1.6, '#222');
  circle(ctx, dir * 4 + 3, -17, 1.6, '#222');
  ctx.strokeStyle = '#a85f2e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(dir * 3, -12, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawCarried(ctx, player) {
  const thing = player.carrying;
  if (!thing) return;
  if (isItem(thing)) {
    // Ingredients are held out in front, like the plate — above the hat
    // they read as sprouting from the chef's head.
    drawIngredient(ctx, thing.base, player.x + player.dir * 18, player.y - 26, 30, thing.stage);
    if (thing.processing === 'cooking' && thing.stage === 'cooked') {
      text(ctx, 'AMBIL!', player.x, player.y - 64, 10, '#e23b2e', '800', 'center');
    }
  } else if (isPlate(thing)) {
    // A plate is held out in front, where it reads against the apron.
    drawPlateIcon(ctx, thing.components, player.x + player.dir * 18, player.y - 26, 42);
  }
}

// --- HUD -------------------------------------------------------------------
function drawOrders(ctx, game) {
  const x0 = 16;
  text(ctx, 'PESANAN', x0, 24, 13, '#ffe9b0', '800');
  // Tickets must end before the clock cluster (clock text starts ~x=800).
  // Row starts at x=112; with 4 orders the tickets shrink to fit.
  const ticketW = game.orders.length > 3 ? 158 : 196;
  game.orders.forEach((order, i) => {
    const x = x0 + 96 + i * (ticketW + 12);
    const y = 10;
    const w = ticketW;
    const h = 70;
    const frac = patienceFrac(order);
    rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = '#fff8e7';
    ctx.fill();
    ctx.strokeStyle = frac < 0.3 ? '#e23b2e' : '#d9c08a';
    ctx.lineWidth = frac < 0.3 ? 3 : 2;
    rr(ctx, x, y, w, h, 10);
    ctx.stroke();
    text(ctx, `#${order.id} ${order.recipe.name}`, x + 10, y + 20, 14, '#3a2a18', '800');
    text(ctx, `$${order.recipe.value}`, x + w - 10, y + 20, 13, '#2e7d3c', '800', 'right');
    order.recipe.components.forEach((comp, j) => {
      drawIngredient(ctx, comp, x + 22 + j * 34, y + 42, 24);
    });
    // patience bar
    ctx.fillStyle = '#e8dcc2';
    rr(ctx, x + 10, y + 58, w - 20, 7, 3);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f7a832' : '#e23b2e';
    rr(ctx, x + 10, y + 58, (w - 20) * frac, 7, 3);
    ctx.fill();
  });
  if (game.orders.length === 0) {
    text(ctx, 'Belum ada pesanan — bersiap!', x0 + 96, 48, 13, '#ffe9b0', '600');
  }
}

function drawHud(ctx, game) {
  // top bar
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = '#5d4028';
  ctx.fillRect(0, HUD_H - 6, CANVAS_W, 6);
  drawOrders(ctx, game);
  // right cluster: coins, combo, clock
  const rx = CANVAS_W - 16;
  text(ctx, `🪙 ${game.coins}`, rx, 30, 22, '#ffd76a', '800', 'right');
  if (game.combo >= 2) {
    text(ctx, `🔥 KOMBO x${game.combo}`, rx, 56, 14, '#ff9d5c', '800', 'right');
  }
  const left = Math.max(0, Math.ceil(game.shiftLength - game.time));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const urgent = left <= 30;
  text(ctx, `${mm}:${ss}`, rx - 150, 30, 22, urgent ? '#ff6b5e' : '#fff', '800', 'right');
  text(ctx, urgent ? 'RUSH!' : 'SHIFT', rx - 150, 56, 12, urgent ? '#ff6b5e' : '#d8c3a5', '800', 'right');
  // shift progress
  const frac = Math.min(1, game.time / game.shiftLength);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, 16, HUD_H - 14, CANVAS_W - 32, 5, 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  rr(ctx, 16, HUD_H - 14, (CANVAS_W - 32) * frac, 5, 2);
  ctx.fill();
  if (game.lastAction) {
    // Dark pill behind the hint so it reads over the light floor.
    const label = game.lastAction;
    ctx.font = '700 13px "Trebuchet MS", Verdana, sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(43, 29, 18, 0.78)';
    rr(ctx, CANVAS_W / 2 - tw / 2 - 12, HUD_H + 8, tw + 24, 26, 13);
    ctx.fill();
    text(ctx, label, CANVAS_W / 2, HUD_H + 22, 13, '#fff', '700', 'center');
  }
}

// --- Screens ---------------------------------------------------------------
function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(43, 29, 18, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, '👨‍🍳  DAPUR KILAT', CANVAS_W / 2, 150, 64, '#ffd76a', '800', 'center');
  text(ctx, 'Restoran paling sibuk di kota — masak cepat, sajikan tepat waktu!', CANVAS_W / 2, 196, 19, '#fff', '600', 'center');
  const lines = [
    'Ambil bahan dari peti di kiri, cincang di talenan, masak di kompor.',
    'Susun di piring, lalu antar ke jendela SAJIKAN sebelum pelanggan pergi.',
    'Pesanan cepat = tip besar. Kombo beruntun = bonus. Jangan sampai gosong!',
  ];
  lines.forEach((line, i) => text(ctx, line, CANVAS_W / 2, 258 + i * 30, 16, '#ffe9b0', '600', 'center'));
  const pulse = 0.6 + 0.4 * Math.sin(game.now * 3);
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan ENTER atau klik untuk mulai', CANVAS_W / 2, 400, 22, '#fff', '800', 'center');
  ctx.globalAlpha = 1;
  text(ctx, 'WASD / Panah bergerak  •  E / Spasi ambil & letak  •  Klik jalan ke titik  •  P jeda  •  M suara', CANVAS_W / 2, 450, 14, '#d8c3a5', '600', 'center');
  text(ctx, 'Shift 3 menit  •  4 resep  •  Bintang 1★ 400  •  2★ 850  •  3★ 1300', CANVAS_W / 2, 486, 14, '#d8c3a5', '600', 'center');
}

function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(43, 29, 18, 0.86)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SHIFT SELESAI!', CANVAS_W / 2, 140, 52, '#ffd76a', '800', 'center');
  const stars = game.stars;
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), CANVAS_W / 2, 205, 44, '#ffd76a', '800', 'center');
  text(ctx, `Koin: ${game.coins}`, CANVAS_W / 2, 270, 26, '#fff', '800', 'center');
  text(ctx, `Hidangan tersaji: ${game.served}   •   Pesanan gagal: ${game.misses}   •   Kombo terbaik: x${game.bestCombo}`, CANVAS_W / 2, 312, 17, '#ffe9b0', '600', 'center');
  const verdict = stars === 3 ? 'Koki bintang tiga! Dapur ini milikmu. 🏆'
    : stars === 2 ? 'Dapur yang rapi — hampir sempurna!'
    : stars === 1 ? 'Shift yang lumayan. Latihan lagi yuk!'
    : 'Dapur kacau balau… coba lagi, Chef!';
  text(ctx, verdict, CANVAS_W / 2, 356, 18, '#fff', '700', 'center');
  const pulse = 0.6 + 0.4 * Math.sin(game.now * 3);
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan R untuk main lagi', CANVAS_W / 2, 430, 20, '#fff', '800', 'center');
  ctx.globalAlpha = 1;
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43, 29, 18, 0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'JEDA', CANVAS_W / 2, CANVAS_H / 2, 56, '#fff', '800', 'center');
  text(ctx, 'Tekan P untuk lanjut', CANVAS_W / 2, CANVAS_H / 2 + 44, 16, '#ffe9b0', '600', 'center');
}

// --- Particles & floats ----------------------------------------------------
function drawParticles(ctx, game) {
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.6);
    circle(ctx, p.x, p.y, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  for (const f of game.floats) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 20, f.color, '800', 'center');
  }
  ctx.globalAlpha = 1;
}

// --- Main render -----------------------------------------------------------
export function render(ctx, game) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloor(ctx);
  // highlight the station the chef can use right now
  if (game.mode === 'playing' && game.nearest) {
    const r = game.nearest.rect;
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.9)';
    ctx.lineWidth = 3;
    rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10);
    ctx.stroke();
  }
  for (const station of game.stations) drawStation(ctx, game, station, game.now);
  drawChef(ctx, game.player, game.now);
  drawCarried(ctx, game.player);
  drawParticles(ctx, game);
  drawHud(ctx, game);
  if (game.mode === 'title') drawTitle(ctx, game);
  if (game.mode === 'over') drawGameOver(ctx, game);
  if (game.paused) drawPaused(ctx);
}
