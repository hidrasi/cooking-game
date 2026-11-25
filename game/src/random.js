// Tiny seeded PRNG (mulberry32) so staged screenshots and replays are stable.
// The game uses one global instance; shots and tests can reseed it.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rng = {
  _next: mulberry32(1),
  seed(s) { this._next = mulberry32(s); },
  next() { return this._next(); },
  range(min, max) { return min + this.next() * (max - min); },
  int(min, max) { return Math.floor(this.range(min, max + 1)); },
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; },
  shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  },
};
