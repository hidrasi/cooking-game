// Dapur Kilat — staged scenes for the 4 screenshots (?shot=play|assembly|rush|serve).
// Each scene sets up one exact moment of the game with a fixed seed, then
// freezes the clock so the render is stable for the screenshot.

import { rng } from './random.js';
import { makeItem, makePlate } from './cooking.js';
import { makeOrder, resetOrderIds } from './orders.js';
import { stationById } from './kitchen.js';

function placeOn(stations, id, item) {
  const st = stationById(stations, id);
  if (st) {
    st.item = item;
    return st;
  }
  return null;
}

function cookOn(stations, id, base, progress) {
  const item = makeItem(base);
  item.stage = 'raw';
  item.progress = progress;
  item.processing = 'cooking';
  return placeOn(stations, id, item);
}

function chopOn(stations, id, base, progress) {
  const item = makeItem(base);
  item.stage = 'raw';
  item.progress = progress;
  item.processing = 'chopping';
  return placeOn(stations, id, item);
}

function setOrders(game, specs) {
  resetOrderIds();
  game.orders = specs.map(([key, patienceLeft], i) => {
    const order = makeOrder(key, game.time);
    order.id = i + 1;
    order.patienceLeft = patienceLeft;
    return order;
  });
}

export function stageShot(game, name) {
  rng.seed(20261125);
  resetOrderIds();
  game.mode = 'playing';
  game.paused = false;
  game.frozen = true; // clock frozen: render only
  game.particles = [];
  game.floats = [];
  game.combo = 0;
  game.misses = 0;
  game.served = 0;
  game.lastAction = '';
  game.player.x = 512;
  game.player.y = 360;
  game.player.carrying = null;
  game.player.moveTarget = null;
  for (const s of game.stations) {
    s.item = null;
    s.plate = null;
  }

  if (name === 'play') {
    // The cover: a busy mid-game moment — chopping, cooking, orders waiting.
    game.time = 45;
    game.coins = 260;
    setOrders(game, [['nasi_goreng', 30], ['mie_ayam', 38], ['soto_ayam', 22]]);
    chopOn(game.stations, 'board1', 'cabai', 0.55);
    cookOn(game.stations, 'stove1', 'mie', 0.6);
    const plate = makePlate();
    plate.components = ['nasi', 'telur'];
    stationById(game.stations, 'plate').plate = plate;
    game.player.x = 470;
    game.player.y = 300;
    game.player.carrying = makeItem('ayam');
    game.player.carrying.stage = 'chopped';
    game.lastAction = 'Ayam siap dimasak — ke kompor!';
  } else if (name === 'assembly') {
    // One dish mid-assembly: the plate on the counter has 2 of 3 components.
    game.time = 80;
    game.coins = 540;
    game.combo = 3;
    setOrders(game, [['soto_ayam', 34], ['capcay', 41]]);
    const plate = makePlate();
    plate.components = ['nasi', 'ayam'];
    stationById(game.stations, 'plate').plate = plate;
    game.player.x = 512;
    game.player.y = 520;
    const tomat = makeItem('tomat');
    tomat.stage = 'chopped';
    game.player.carrying = tomat;
    game.lastAction = 'Tomat iris — tinggal susun di piring!';
  } else if (name === 'rush') {
    // The final rush: four orders, both burners and both boards working.
    game.time = 152;
    game.coins = 980;
    game.combo = 5;
    setOrders(game, [['mie_ayam', 12], ['nasi_goreng', 18], ['capcay', 26], ['soto_ayam', 9]]);
    chopOn(game.stations, 'board1', 'sawi', 0.7);
    chopOn(game.stations, 'board2', 'ayam', 0.4);
    cookOn(game.stations, 'stove1', 'ayam', 0.85);
    const telur = makeItem('telur');
    telur.stage = 'cooked';
    telur.processing = 'cooking';
    telur.burn = 0.55;
    placeOn(game.stations, 'stove2', telur);
    const plate = makePlate();
    plate.components = ['mie'];
    stationById(game.stations, 'plate').plate = plate;
    game.player.x = 700;
    game.player.y = 300;
    game.player.carrying = makeItem('cabai');
    game.player.carrying.stage = 'chopped';
    game.lastAction = 'RUSH! 4 pesanan menunggu!';
    for (let i = 0; i < 14; i += 1) {
      game.particles.push({
        x: 920 + Math.random() * 60, y: 200 + Math.random() * 160,
        vx: 0, vy: -30, life: 0.8, color: 'rgba(255,255,255,0.7)', size: 3,
      });
    }
  } else if (name === 'serve') {
    // The payoff: a finished Nasi Goreng carried to the serving window.
    game.time = 120;
    game.coins = 1240;
    game.combo = 4;
    game.served = 9;
    setOrders(game, [['nasi_goreng', 28], ['mie_ayam', 40]]);
    const plate = makePlate();
    plate.components = ['nasi', 'telur', 'cabai'];
    game.player.x = 880;
    game.player.y = 220;
    game.player.carrying = plate;
    game.floats.push({ x: 884, y: 190, text: '+180', color: '#2e7d3c', life: 3 });
    game.lastAction = 'Nasi Goreng selesai — sajikan!';
  } else {
    game.frozen = false;
  }
  game.now = 0;
}
