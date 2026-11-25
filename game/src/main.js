// Dapur Kilat — the entry point: game loop, state machine, input, wiring.
// The game never talks to the network; every file it loads lives under game/.

import { CANVAS_W, CANVAS_H, SHIFT_LENGTH, starCutoffs } from './config.js';
import { rng } from './random.js';
import { makeStations, nearestStation } from './kitchen.js';
import { makePlayer, updatePlayer, interact, clickAt } from './player.js';
import { tickProcessing } from './cooking.js';
import { tickOrders } from './orders.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { botStep } from './bot.js';
import { sfx, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || '20261125');
const botParam = params.get('bot') === '1';

function freshState() {
  return {
    mode: 'title', // title | playing | over
    paused: false,
    frozen: false,
    bot: botParam,
    now: 0,
    time: 0,
    shiftLength: SHIFT_LENGTH,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    misses: 0,
    stars: 0,
    orders: [],
    spawnState: { spawnIn: 2, shiftLength: SHIFT_LENGTH },
    stations: makeStations(),
    player: makePlayer(),
    particles: [],
    floats: [],
    lastAction: '',
    lastHintAt: 0,
    nearest: null,
    input: { up: false, down: false, left: false, right: false },
    botCooldown: 0,
    lastTickSecond: -1,
  };
}

let game = freshState();

function startShift() {
  const keepBot = game.bot;
  game = freshState();
  game.bot = keepBot;
  game.mode = 'playing';
  rng.seed(seedParam);
  // Keep the test handle pointing at the live state object.
  window.__game = game;
}

function endShift() {
  game.mode = 'over';
  const [one, two, three] = starCutoffs();
  game.stars = game.coins >= three ? 3 : game.coins >= two ? 2 : game.coins >= one ? 1 : 0;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  sfx.jingle();
}

function update(dt) {
  game.now += dt;
  // Particles and floating texts always animate.
  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const p = game.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
  for (let i = game.floats.length - 1; i >= 0; i -= 1) {
    const f = game.floats[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) game.floats.splice(i, 1);
  }
  if (game.mode !== 'playing' || game.paused || game.frozen) return;

  game.time += dt;
  game.bestCombo = Math.max(game.bestCombo, game.combo);

  // Last-10-seconds tick.
  const left = game.shiftLength - game.time;
  const sec = Math.ceil(left);
  if (sec !== game.lastTickSecond) {
    game.lastTickSecond = sec;
    if (sec <= 10 && sec > 0) sfx.tick();
  }

  // Chopping and cooking on the stations.
  for (const station of game.stations) {
    if (!station.item || !station.item.processing) continue;
    const done = tickProcessing(station.item, dt);
    if (done === 'chopped') {
      sfx.chopped();
      game.lastAction = 'Selesai dicincang!';
    } else if (done === 'cooked') {
      sfx.cooked();
      game.lastAction = 'Matang! Ambil sebelum gosong!';
    } else if (done === 'burnt') {
      sfx.burnt();
      game.floats.push({
        x: station.rect.x + station.rect.w / 2, y: station.rect.y - 8,
        text: 'GOSONG!', color: '#e23b2e', life: 1.4,
      });
    }
  }

  // Orders: patience drains, new ones arrive, expired ones walk out.
  const { expired, spawned } = tickOrders(game.orders, dt, game.time, game.spawnState);
  if (spawned) sfx.orderIn();
  for (const lost of expired) {
    game.misses += 1;
    game.combo = 0;
    sfx.orderLost();
    game.floats.push({ x: 512, y: 130, text: `Pesanan #${lost.id} gagal!`, color: '#e23b2e', life: 1.6 });
  }

  // The chef, and the autopilot when it is on.
  if (game.bot) botStep(game, dt);
  updatePlayer(game, game.input, dt);
  game.nearest = nearestStation(game.stations, game.player.x, game.player.y);

  // Fade the action hint after a few seconds.
  if (game.lastAction && game.now - game.lastHintAt > 3.5) game.lastAction = '';

  if (game.time >= game.shiftLength) endShift();
}

let lastT = 0;
function frame(t) {
  const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000 || 0));
  lastT = t;
  update(dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}

// --- Input -----------------------------------------------------------------
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  const dir = KEYMAP[event.code];
  if (dir) {
    game.input[dir] = true;
    return;
  }
  if (event.repeat) return;
  if (event.code === 'KeyE' || event.code === 'Space') {
    if (game.mode === 'playing' && !game.paused) {
      game.lastAction = interact(game);
      game.lastHintAt = game.now;
    }
  } else if (event.code === 'Enter') {
    if (game.mode === 'title') startShift();
  } else if (event.code === 'KeyR') {
    if (game.mode === 'over') startShift();
  } else if (event.code === 'KeyP' || event.code === 'Escape') {
    if (game.mode === 'playing') game.paused = !game.paused;
  } else if (event.code === 'KeyM') {
    toggleMute();
  }
});

window.addEventListener('keyup', (event) => {
  const dir = KEYMAP[event.code];
  if (dir) game.input[dir] = false;
});

canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * CANVAS_W;
  const y = ((event.clientY - rect.top) / rect.height) * CANVAS_H;
  if (game.mode === 'title') {
    startShift();
    return;
  }
  if (game.mode === 'playing' && !game.paused) clickAt(game, x, y);
});

// --- Boot ------------------------------------------------------------------
// A staged screenshot (?shot=play|assembly|rush|serve) freezes one moment.
if (shotName) {
  if (hint) hint.style.display = 'none';
  startShift();
  stageShot(game, shotName);
} else if (botParam) {
  startShift();
}

// For tests and the autopilot: the whole game state, plus helpers.
window.__game = game;
window.__startShift = startShift;
window.__interact = () => interact(game);

requestAnimationFrame(frame);
