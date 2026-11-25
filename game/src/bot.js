// Dapur Kilat — the autopilot: plays the game by itself (?bot=1).
// It proves the game is winnable end to end and doubles as an attract mode.
// Every tick it picks one station to walk to; arrival triggers interact().

import { stationFront } from './kitchen.js';
import {
  isItem, isPlate, canChop, canCook, componentIdOf,
  plateIsComplete, canAddToPlate,
} from './cooking.js';

function serveStation(game) {
  return game.stations.find((s) => s.kind === 'serve');
}
function plateStation(game) {
  return game.stations.find((s) => s.kind === 'plate');
}
function trashStation(game) {
  return game.stations.find((s) => s.kind === 'trash');
}
function freeBoard(game) {
  return game.stations.find((s) => s.kind === 'board' && !s.item) || null;
}
function freeStove(game) {
  return game.stations.find((s) => s.kind === 'stove' && !s.item) || null;
}

// A board/stove holding a finished (or parked) item worth picking up.
// A cooked item still counts: its "cooking" flag is the burn timer now.
function finishedStationItem(game) {
  return game.stations.find(
    (s) => (s.kind === 'board' || s.kind === 'stove') && s.item
      && (!s.item.processing || s.item.stage === 'cooked'),
  ) || null;
}

// The oldest order whose recipe still fits these plate components.
function orderForComponents(game, components) {
  return game.orders.find((o) => components.every((c) => o.recipe.components.includes(c))) || null;
}

function firstMissing(order, components) {
  return order.recipe.components.find((c) => !components.includes(c)) || null;
}

// Where to get (or finish) one component: a station holding it ready, a
// parked raw copy, or the crate it comes from. null = wait for it to finish.
function produceTarget(game, comp) {
  // Ready now, even if its burn timer is still ticking on the stove.
  for (const s of game.stations) {
    if ((s.kind === 'board' || s.kind === 'stove') && s.item
      && componentIdOf(s.item) === comp) return s;
  }
  // Genuinely still chopping / cooking (not yet a component): wait.
  for (const s of game.stations) {
    if ((s.kind === 'board' || s.kind === 'stove') && s.item && s.item.processing
      && s.item.base === comp && s.item.stage !== 'cooked') return null;
  }
  for (const s of game.stations) {
    if (s.kind === 'board' && s.item && !s.item.processing && s.item.base === comp) return s;
  }
  return game.stations.find((s) => s.kind === 'crate' && s.stock === comp) || null;
}

function chooseTarget(game) {
  const hands = game.player.carrying;
  const plateSt = plateStation(game);

  // 1. Finished dish in hand: serve it.
  if (isPlate(hands) && plateIsComplete(hands)) return serveStation(game);

  // 2. Half-built plate in hand: put it on the counter first. The chef
  // carries one thing only, so the next component is fetched with empty
  // hands (branch 4 takes it from there).
  if (isPlate(hands)) {
    return plateSt;
  }

  // 3. An item in hand.
  if (isItem(hands)) {
    const comp = componentIdOf(hands);
    if (comp) {
      // The plating counter adds a component to the plate there, or hands
      // the chef a fresh plate with the component on it.
      if (plateSt.plate && canAddToPlate(plateSt.plate, comp)) return plateSt;
      if (!plateSt.plate) return plateSt;
      return trashStation(game);
    }
    if (canChop(hands)) {
      const board = freeBoard(game);
      return board || null;
    }
    if (canCook(hands)) {
      const stove = freeStove(game);
      return stove || null;
    }
    return trashStation(game); // burnt or otherwise useless
  }

  // 4. Empty hands.
  if (plateSt.plate && plateIsComplete(plateSt.plate)) return plateSt;
  const done = finishedStationItem(game);
  if (done) return done;
  if (plateSt.plate && plateSt.plate.components.length > 0) {
    const order = orderForComponents(game, plateSt.plate.components);
    if (order) {
      const missing = firstMissing(order, plateSt.plate.components);
      if (missing) return produceTarget(game, missing);
    }
    return plateSt; // plate matches no order: take it and bin it
  }
  const order = game.orders[0];
  if (!order) return null; // no orders yet: wait
  return produceTarget(game, order.recipe.components[0]);
}

export function botStep(game, dt) {
  game.botCooldown = (game.botCooldown || 0) - dt;
  if (game.botCooldown > 0) return;
  const target = chooseTarget(game);
  if (!target) return;
  // Walk there and let the arrival handler do the interacting: calling
  // interact() here too would fire it twice on the same station.
  const front = stationFront(target);
  game.player.moveTarget = front;
  game.player.pendingInteract = target;
  game.botCooldown = 0.12;
}
