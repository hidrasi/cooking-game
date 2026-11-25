// Dapur Kilat — the order board: spawning orders, patience, expiry.
// Pure logic, no DOM: Node tests import this file directly.

import { RECIPES, RECIPE_KEYS, orderPatience, MAX_ORDERS, spawnInterval } from './config.js';
import { rng } from './random.js';

let nextOrderId = 1;

export function makeOrder(recipeKey, now) {
  const patience = orderPatience();
  return {
    id: nextOrderId,
    recipeKey,
    recipe: RECIPES[recipeKey],
    patience,
    patienceLeft: patience,
    bornAt: now,
  };
}

export function resetOrderIds() { nextOrderId = 1; }

// Pick a recipe for the next order. Early on it favours the two simplest
// dishes; later every recipe is equally likely.
export function pickRecipe(elapsed, shiftLength) {
  const t = Math.min(1, elapsed / shiftLength);
  if (t < 0.25 && rng.next() < 0.7) {
    return rng.pick(['nasi_goreng', 'mie_ayam']);
  }
  return rng.pick(RECIPE_KEYS);
}

// One tick of the order board. Mutates orders in place.
// Returns { expired: [orders that walked out], spawned: order|null }.
export function tickOrders(orders, dt, elapsed, state) {
  const expired = [];
  for (let i = orders.length - 1; i >= 0; i -= 1) {
    orders[i].patienceLeft -= dt;
    if (orders[i].patienceLeft <= 0) expired.push(orders.splice(i, 1)[0]);
  }
  let spawned = null;
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && orders.length < MAX_ORDERS) {
    spawned = makeOrder(pickRecipe(elapsed, state.shiftLength), elapsed);
    nextOrderId += 1;
    orders.push(spawned);
    state.spawnIn = spawnInterval(elapsed);
  }
  return { expired, spawned };
}

// Find the oldest order waiting for this recipe (the one a served dish fills).
export function findOrderFor(orders, recipeKey) {
  return orders.find((o) => o.recipeKey === recipeKey) || null;
}

export function removeOrder(orders, id) {
  const i = orders.findIndex((o) => o.id === id);
  if (i >= 0) return orders.splice(i, 1)[0];
  return null;
}

export function patienceFrac(order) {
  return Math.max(0, order.patienceLeft / order.patience);
}
