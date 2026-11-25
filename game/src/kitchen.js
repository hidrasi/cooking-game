// Dapur Kilat — the kitchen itself: stations, walls and collision.
// Stations are plain data; this module owns their geometry and the
// chef's movement against them. No DOM, no canvas here.

import { STATION_DEFS, FLOOR, PLAYER_RADIUS, INTERACT_DIST } from './config.js';

export function makeStations() {
  return STATION_DEFS.map((def) => ({
    ...def,
    rect: { ...def.rect },
    // board / stove hold one item being processed; plate holds one plate.
    item: null,
    plate: null,
  }));
}

export function stationById(stations, id) {
  return stations.find((s) => s.id === id) || null;
}

export function crates(stations) {
  return stations.filter((s) => s.kind === 'crate');
}

function distToRect(px, py, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  return Math.hypot(px - cx, py - cy);
}

// The closest station the chef can reach from (px, py), or null.
export function nearestStation(stations, px, py, maxDist = INTERACT_DIST) {
  let best = null;
  let bestD = maxDist;
  for (const s of stations) {
    const d = distToRect(px, py, s.rect);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

// The station whose rect contains the point (for mouse clicks).
export function stationAtPoint(stations, px, py) {
  for (const s of stations) {
    const r = s.rect;
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return s;
  }
  return null;
}

function hitsStation(stations, x, y, r) {
  for (const s of stations) {
    const rect = s.rect;
    const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    if (Math.hypot(x - cx, y - cy) < r) return true;
  }
  return false;
}

// Move the chef by (dx, dy) with axis-separated collision: the chef slides
// along counters instead of sticking to them. Returns the new position.
export function moveChef(stations, x, y, dx, dy) {
  const r = PLAYER_RADIUS;
  let nx = x + dx;
  let ny = y;
  const inFloorX = nx - r >= FLOOR.x0 - 8 && nx + r <= FLOOR.x1 + 8;
  if (!inFloorX || hitsStation(stations, nx, ny, r)) nx = x;
  ny = y + dy;
  const inFloorY = ny - r >= FLOOR.y0 - 8 && ny + r <= FLOOR.y1 + 8;
  if (!inFloorY || hitsStation(stations, nx, ny, r)) ny = y;
  // Clamp inside the canvas so the chef never leaves the kitchen.
  nx = Math.max(24, Math.min(1000, nx));
  ny = Math.max(112, Math.min(616, ny));
  return { x: nx, y: ny };
}

// A point just in front of a station (where the chef stands to use it).
export function stationFront(station) {
  const r = station.rect;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  if (r.y < 160) return { x: cx, y: r.y + r.h + 34 }; // top wall: stand below
  if (r.x < 72) return { x: r.x + r.w + 34, y: cy }; // left wall: stand right
  if (r.x > 900) return { x: r.x - 34, y: cy }; // right wall: stand left
  return { x: cx, y: r.y - 34 }; // bottom wall: stand above
}
