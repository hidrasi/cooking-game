// Dapur Kilat — the chef: movement, carrying and every station interaction.
// The chef carries at most one thing: a food item or a plate.

import { PLAYER_SPEED, PLAYER_RADIUS } from './config.js';
import { moveChef, nearestStation, stationAtPoint, stationFront } from './kitchen.js';
import {
  makeItem, makePlate, isItem, isPlate, canChop, canCook,
  componentIdOf, plateIsComplete, recipeOfPlate, addToPlate, servePayout,
} from './cooking.js';
import { findOrderFor, removeOrder, patienceFrac } from './orders.js';
import { sfx } from './audio.js';

export function makePlayer() {
  return {
    x: 512, y: 360, dir: 1, // dir: 1 faces right, -1 faces left
    carrying: null,
    moveTarget: null,
    pendingInteract: null,
    walking: false,
    walkPhase: 0,
  };
}

function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color, life: 1.4 });
}

function burst(game, x, y, color, n = 10) {
  for (let i = 0; i < n; i += 1) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 140,
      vy: -40 - Math.random() * 90,
      life: 0.5 + Math.random() * 0.4,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

// --- Interaction -----------------------------------------------------------
// What happens when the chef presses E / Space (or clicks a station) next
// to the nearest station. Returns a short label for the HUD hint, or ''.
export function interact(game, forcedStation) {
  const { player, stations } = game;
  const station = forcedStation || nearestStation(stations, player.x, player.y);
  if (!station) return '';
  const hands = player.carrying;

  switch (station.kind) {
    case 'crate': {
      if (hands) { sfx.error(); return 'Tangan penuh!'; }
      player.carrying = makeItem(station.stock);
      sfx.pickup();
      return `Ambil ${station.stock}`;
    }
    case 'board': {
      if (!station.item && isItem(hands)) {
        station.item = hands;
        player.carrying = null;
        if (canChop(hands)) {
          station.item.processing = 'chopping';
          station.item.progress = 0;
          sfx.drop();
          return 'Mencincang…';
        }
        sfx.drop();
        return 'Letak di talenan';
      }
      if (station.item && !hands && !station.item.processing) {
        player.carrying = station.item;
        station.item = null;
        sfx.pickup();
        return 'Ambil dari talenan';
      }
      if (station.item && station.item.processing) return 'Masih dicincang…';
      sfx.error();
      return 'Butuh bahan yang bisa dicincang';
    }
    case 'stove': {
      if (!station.item && isItem(hands) && canCook(hands)) {
        station.item = hands;
        station.item.processing = 'cooking';
        station.item.progress = 0;
        station.item.burn = 0;
        player.carrying = null;
        sfx.sizzle();
        return 'Memasak…';
      }
      if (station.item && !hands) {
        station.item.processing = null;
        player.carrying = station.item;
        station.item = null;
        sfx.pickup();
        return 'Ambil dari kompor';
      }
      sfx.error();
      return 'Butuh bahan yang bisa dimasak';
    }
    case 'plate': {
      if (!station.plate && !hands) {
        player.carrying = makePlate();
        sfx.pickup();
        return 'Ambil piring kosong';
      }
      if (!station.plate && isPlate(hands)) {
        station.plate = hands;
        player.carrying = null;
        sfx.drop();
        return 'Letak piring';
      }
      // No plate on the counter but a ready component in hand: grab a fresh
      // plate and lay the component on it in one move.
      if (!station.plate && isItem(hands)) {
        const comp = componentIdOf(hands);
        if (comp) {
          const fresh = makePlate();
          addToPlate(fresh, comp);
          player.carrying = fresh;
          sfx.plate();
          return `Susun ${comp} di piring baru`;
        }
        sfx.error();
        return 'Bahan belum siap';
      }
      if (station.plate && isItem(hands)) {
        const comp = componentIdOf(hands);
        if (comp && addToPlate(station.plate, comp)) {
          player.carrying = null;
          sfx.plate();
          burst(game, station.rect.x + station.rect.w / 2, station.rect.y + 10, '#ffd76a', 8);
          return `Tambah ${comp}`;
        }
        sfx.error();
        return 'Bahan belum siap / sudah ada';
      }
      if (station.plate && !hands) {
        player.carrying = station.plate;
        station.plate = null;
        sfx.pickup();
        return 'Ambil piring';
      }
      sfx.error();
      return 'Piring penuh / tangan penuh';
    }
    case 'serve': {
      if (isPlate(hands) && plateIsComplete(hands)) {
        const recipeKey = recipeOfPlate(hands);
        const order = findOrderFor(game.orders, recipeKey);
        if (!order) {
          sfx.error();
          return 'Tidak ada pesanan ini';
        }
        const payout = servePayout(recipeKey, patienceFrac(order), game.combo);
        game.coins += payout;
        game.combo += 1;
        game.served += 1;
        removeOrder(game.orders, order.id);
        player.carrying = null;
        sfx.serve();
        const sx = station.rect.x + station.rect.w / 2;
        addFloat(game, sx, station.rect.y + 84, `+${payout}`, '#2e7d3c');
        burst(game, sx, station.rect.y + 70, '#ffd76a', 16);
        return `Tersaji! +${payout}`;
      }
      sfx.error();
      return 'Piring belum lengkap';
    }
    case 'trash': {
      if (hands) {
        player.carrying = null;
        sfx.drop();
        return 'Buang';
      }
      return '';
    }
    default:
      return '';
  }
}

// --- Movement --------------------------------------------------------------
export function updatePlayer(game, input, dt) {
  const { player, stations } = game;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;

  if (mx !== 0 || my !== 0) {
    player.moveTarget = null;
    player.pendingInteract = null;
    const len = Math.hypot(mx, my);
    const step = PLAYER_SPEED * dt;
    const pos = moveChef(stations, player.x, player.y, (mx / len) * step, (my / len) * step);
    player.x = pos.x;
    player.y = pos.y;
    if (mx !== 0) player.dir = mx > 0 ? 1 : -1;
    player.walking = true;
    player.walkPhase += dt * 11;
  } else if (player.moveTarget) {
    const dx = player.moveTarget.x - player.x;
    const dy = player.moveTarget.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      player.moveTarget = null;
      if (player.pendingInteract) {
        const target = player.pendingInteract;
        player.pendingInteract = null;
        // Use the intended station: at some front points a neighbouring
        // station (e.g. the chopping board above a crate) is closer by
        // proximity, so re-deriving it here would interact wrongly.
        game.lastAction = interact(game, target);
      }
      player.walking = false;
    } else {
      const step = Math.min(dist, PLAYER_SPEED * dt);
      const pos = moveChef(stations, player.x, player.y, (dx / dist) * step, (dy / dist) * step);
      player.x = pos.x;
      player.y = pos.y;
      if (dx !== 0) player.dir = dx > 0 ? 1 : -1;
      player.walking = true;
      player.walkPhase += dt * 11;
    }
  } else {
    player.walking = false;
  }
}

// Click handling: a click on a station walks the chef to it and uses it;
// a click on open floor just walks there.
export function clickAt(game, px, py) {
  const station = stationAtPoint(game.stations, px, py);
  if (station) {
    const front = stationFront(station);
    game.player.moveTarget = front;
    game.player.pendingInteract = station;
  } else {
    game.player.moveTarget = { x: px, y: py };
    game.player.pendingInteract = null;
  }
}

export { PLAYER_RADIUS };
