// Dapur Kilat — the cooking rules: chopping, cooking, burning, plating.
// Pure logic, no DOM: Node tests import this file directly.

import { INGREDIENTS, RECIPES, RECIPE_KEYS, componentIdOf } from './config.js';

// A carried / stationed food item. stage: raw -> chopped -> cooked (-> burnt).
export function makeItem(base) {
  return { kind: 'item', base, stage: 'raw', progress: 0, burn: 0, processing: null };
}

export function makePlate() {
  return { kind: 'plate', components: [] };
}

export function isPlate(thing) {
  return thing && thing.kind === 'plate';
}

export function isItem(thing) {
  return thing && thing.kind === 'item';
}

// --- Prep steps ------------------------------------------------------------
// Can this item be chopped now? (raw + a chop time)
export function canChop(item) {
  return isItem(item) && item.stage === 'raw' && INGREDIENTS[item.base].chop > 0;
}

// Can this item go on a burner now? (raw or chopped + a cook time)
export function canCook(item) {
  if (!isItem(item)) return false;
  if (INGREDIENTS[item.base].cook <= 0) return false;
  return item.stage === 'raw' || item.stage === 'chopped';
}

// Advance a processing item by dt seconds. Returns 'chopped' | 'cooked' |
// 'burnt' when a transition completes this tick, else null.
export function tickProcessing(item, dt) {
  if (!isItem(item) || !item.processing) return null;
  const spec = INGREDIENTS[item.base];
  if (item.processing === 'chopping') {
    item.progress += dt / spec.chop;
    if (item.progress >= 1) {
      item.stage = 'chopped';
      item.progress = 0;
      item.processing = null;
      return 'chopped';
    }
    return null;
  }
  if (item.processing === 'cooking') {
    if (item.stage !== 'cooked') {
      item.progress += dt / spec.cook;
      if (item.progress >= 1) {
        item.stage = 'cooked';
        item.progress = 0;
        item.burn = 0;
        return 'cooked';
      }
      return null;
    }
    // Cooked and sitting: it burns if nobody takes it.
    item.burn += dt / spec.burn;
    if (item.burn >= 1) {
      item.stage = 'burnt';
      item.processing = null;
      return 'burnt';
    }
    return null;
  }
  return null;
}

// --- Plates ----------------------------------------------------------------
export function plateIsComplete(plate) {
  return isPlate(plate) && plate.components.length > 0 && recipeOfPlate(plate) !== null;
}

// Which recipe does this plate hold, if its components match one exactly?
export function recipeOfPlate(plate) {
  if (!isPlate(plate) || plate.components.length === 0) return null;
  const have = [...plate.components].sort().join('|');
  for (const key of RECIPE_KEYS) {
    const want = [...RECIPES[key].components].sort().join('|');
    if (have === want) return key;
  }
  return null;
}

// Can this component go on the plate? (room for 3, not already on it)
export function canAddToPlate(plate, componentId) {
  if (!isPlate(plate) || !componentId) return false;
  if (plate.components.length >= 3) return false;
  if (plate.components.includes(componentId)) return false;
  return true;
}

export function addToPlate(plate, componentId) {
  if (!canAddToPlate(plate, componentId)) return false;
  plate.components.push(componentId);
  return true;
}

// --- Serving ---------------------------------------------------------------
// The payout for serving a dish: base value + speed tip, scaled by combo.
export function servePayout(recipeKey, patienceFrac, combo) {
  const recipe = RECIPES[recipeKey];
  const tip = Math.round(recipe.value * 0.5 * Math.max(0, patienceFrac));
  const comboBonus = 1 + 0.1 * Math.min(combo, 5);
  return Math.round((recipe.value + tip) * comboBonus);
}

export { componentIdOf };
