[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hidrasi/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hidrasi/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Kilat — a cooking game

Entry for the [make.fun best-cooking-game-20261125-0137 bounty](https://make.fun/bounty/best-cooking-game-20261125-0137): build the best cooking game you can.

**Dapur Kilat** ("Lightning Kitchen") is a fast, top-down 2D cooking game that
runs offline in a desktop browser from static files. You are the chef of the
busiest restaurant in town, working one 3-minute shift.

## How to play

- **Move** with WASD / arrow keys, or click anywhere to walk there.
- **E / Space** (or click a station) to pick up and put down.
- Take ingredients from the crates on the left wall, chop them on the
  chopping boards, cook them on the stoves — and watch the burn timer.
- Stack the finished components on a plate at the plating counter, then carry
  the dish to the **SAJIKAN** (serve) window before the order's patience
  runs out.
- Fast serves earn tips; serving in a row builds a combo bonus. Burnt food
  goes in the trash. **P** pauses, **M** mutes.

## The menu

| Dish | Components | Value |
| --- | --- | --- |
| Nasi Goreng | Nasi + Telur Goreng + Cabai Iris | $120 |
| Mie Ayam | Mie Rebus + Ayam Goreng + Sawi Iris | $140 |
| Soto Ayam | Nasi + Ayam Goreng + Tomat Iris | $130 |
| Capcay | Sawi Iris + Tomat Iris + Ayam Goreng | $150 |

Orders arrive on the board at the top and get faster as the shift goes on;
the last 30 seconds are the rush. Score 400+ for 1★, 850+ for 2★,
1300+ for 3★.

## Files

- `game/index.html` — the page; `game/src/` holds one module per job:
  `config.js` (rules, recipes, layout), `kitchen.js` (stations, collision),
  `cooking.js` (chop / cook / burn / plating), `orders.js` (order board),
  `player.js` (movement, interaction), `render.js` (all canvas art),
  `audio.js` (synthesized WebAudio effects), `random.js` (seeded RNG),
  `shots.js` (staged screenshot scenes), `bot.js` (autopilot),
  `main.js` (loop, state machine, input).
- `main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and
  writes `/output/dossier.json` with `buildDossier` from
  `vendor/makefun-game.ts`.
- `screenshots/` holds 4 real renders of the game in a browser.
- `?shot=play|assembly|rush|serve` stages one screenshot scene;
  `?bot=1` lets the autopilot play the shift by itself.

All art is drawn in code with canvas shapes and all sound is synthesized
with WebAudio — no image, font or audio files, no network requests.
