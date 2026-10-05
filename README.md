<div align="center">

<img src="images/ufo.png" alt="Mystery UFO" width="64">

<img src="images/squid.png" alt="Squid invader" width="32">&nbsp;&nbsp;&nbsp;<img src="images/crab.png" alt="Crab invader" width="44">&nbsp;&nbsp;&nbsp;<img src="images/octopus.png" alt="Octopus invader" width="48">

# Invaders

**The arcade classic, in plain JavaScript. Clear the sky and they come back faster.**

<a href="https://azadmotala.github.io/invaders/"><img src="https://img.shields.io/badge/%E2%96%B6%20Play%20now-in%20your%20browser-2ea44f?style=for-the-badge" alt="Play now in your browser" height="36"></a>

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![Keyboard and touch](https://img.shields.io/badge/controls-keyboard%20%2B%20touch-2ea44f)
![Vite](https://img.shields.io/badge/dev%20server-Vite-646CFF?logo=vite&logoColor=white)
[![Latest release](https://img.shields.io/github/v/release/azadmotala/invaders)](https://github.com/azadmotala/invaders/releases)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

<a href="https://azadmotala.github.io/invaders/"><img src="docs/screenshot.png" alt="Invaders gameplay: rows of green squid, crab and octopus invaders over a starfield, a red mystery UFO crossing above them, four chipped green shields, and the player's ship firing up from below" width="480"></a>

[How to play](#how-to-play) · [Run it locally](#run-it-locally) · [Tweak it](#tweak-it) · [What's new](https://github.com/azadmotala/invaders/releases) · [Credits](#credits) · [License](#license)

</div>

## The game

The fleet marches side to side, drops a row every time it hits the edge, and bombs you on the way down. Shoot every last one and the next wave turns up faster, bigger and quicker to bomb. Let them reach the bottom and it's over.

The fleet lines up like the 1978 arcade game: squids along the top, crabs in the middle and octopuses in the bottom two rows, all marching in two poses to a four-note heartbeat. They come in their original green. Switch on random colours and every wave turns up in a different colour from the last.

Every so often a red mystery UFO warbles across the top. Shoot it for a mystery score.

Four shields stand between you and the fleet. Bombs blast holes in them from above and your own shots blast them from below, so they wear away as you play, and invaders crush whatever they march into. You get fresh shields with every wave.

## How to play

Play it in your browser at **[azadmotala.github.io/invaders](https://azadmotala.github.io/invaders/)**. Nothing to install. On a phone or tablet, the game fills the screen and you steer with your thumb.

| | Computer | Phone or tablet |
|---|---|---|
| Start / play again | <kbd>Space</kbd> | Tap |
| Move | <kbd>←</kbd> <kbd>→</kbd> | Drag anywhere on the screen. The ship follows your finger and stops when you let go |
| Fire | <kbd>Space</kbd> (hold it down to keep firing) | Keep your finger down |
| Pause | <kbd>P</kbd> or the **Pause** button | **Pause** button, or switch to another app |
| Sound on/off | **Mute** button | **Mute** button |
| Invader colours | **Random colours** button | **Random colours** button |

On a computer the buttons sit under the game. On a phone or tablet they're in the top corner.

The start screen shows which version you're playing. If it's older than the [latest release](https://github.com/azadmotala/invaders/releases), reload the page. On a phone, use the reload button in the address bar, since pulling down to refresh doesn't work in the game.

### Rules

- You get three lives. Each bomb that hits your ship costs one. You earn one extra life when your score reaches 1,500, as in the arcade game.
- If an invader reaches the bottom or crashes into your ship, the game ends right there.
- Squids are worth 30 points, crabs 20 and octopuses 10, the same as the arcade game. Clear a wave and you get a bonus of 50 × that level.
- The mystery UFO is usually worth 50 or 100, sometimes 150 and now and then 300. It comes every 15 to 30 seconds, but not once the fleet is down to its last 7 invaders.
- Your high score is saved in your browser on that device, the moment you beat it. It shows during play, on the start screen and when the game ends.

### Family leaderboard

The game can keep a top 10 shared by a family or group of friends, on any device. Open the game with a private code at the end of the link, like `https://azadmotala.github.io/invaders/?board=yourcode`, and send that link to everyone who should be on the board. Each device remembers the board after opening the link once. Only people who know the code can see the board or add to it.

- When a score makes the top 10, you're asked for your initials: three letters, like the arcade game. The last ones used on that device are filled in, so on a shared computer just type over them.
- The first time a device opens a board, it offers the high score it already has.
- No connection? A score that makes the board waits on the device, shown in grey, and goes up when the board can be reached again. The game plays the same either way.

### It gets harder

Every level, the invaders move faster, drop bombs more often, and the bombs fall faster. The fleet gets bigger too. You get a faster trigger finger to keep up.

The fleet and your fire rate stop growing at level 25. The invaders' speed doesn't.

Within each wave, the fleet speeds up as you thin it out, like the arcade game. It's gentle at first: with half the invaders left they're about 1.4 times as fast, and with a quarter left twice as fast. The last few move three times as fast as the full fleet did. The heartbeat speeds up with them, up to eight beats a second.

## Run it locally

Use a local web server. You can open `index.html` straight from disk, but your browser won't load the sound effects that way, so you'd be playing in silence.

With [Node.js](https://nodejs.org):

```bash
git clone https://github.com/azadmotala/invaders.git
cd invaders
npm install
npm run dev
```

Then open http://localhost:3000.

No Node? Any static server works. From the project folder, with Python:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

To put it online, upload the folder as it is to any static host, such as GitHub Pages or Netlify. There's nothing to build. `npm run build` also makes a ready-to-upload copy in `dist/`, without the README and project files.

## Tweak it

All the tuning sits in the `config` object at the top of [`js/spaceinvaders.js`](js/spaceinvaders.js). The fleet, bomb and fire-rate numbers are base values that grow with each level.

| Setting | Default | What it changes |
|---|---|---|
| `invaderInitialVelocity` | `25` | How fast the fleet moves |
| `bombRate` | `0.05` | How often the front row drops bombs |
| `invaderRanks` / `invaderFiles` | `5` / `10` | Rows and columns in the fleet |
| `shipSpeed` | `120` | How fast your ship moves |
| `rocketMaxFireRate` | `2` | Shots per second |
| `levelDifficultyMultiplier` | `0.2` | How much harder each level gets |
| `invaderSpeedUpMax` | `3` | How much faster the last invaders in a wave get (`1` turns the speed-up off) |
| `ufoMinInterval` / `ufoMaxInterval` | `15` / `30` | Seconds between mystery UFOs |
| `ufoSpeed` | `70` | How fast the mystery UFO flies |
| `touchShipSpeed` | `360` | Top speed of the ship when you drag it on a touch screen |
| `shieldCount` | `4` | How many shields there are (`0` for none) |
| `extraLifeScore` | `1500` | The score that earns the extra life (`0` for none) |

The invaders are drawn in code. `INVADER_TYPES`, near the top of the same file, holds each kind's pixel grids for its two poses and how many points it's worth. Edit a grid to redraw an invader, or add colours to `INVADER_COLOURS`. The mystery UFO (`UFO_PIXELS`) and the shields (`SHIELD_PIXELS`) are drawn the same way.

Add `?debug=true` to the URL and the game outlines the play area.

### The leaderboard's Firebase project

The leaderboard is kept in Firebase. `js/leaderboard.js` names the project (`API_KEY` and `PROJECT_ID`); those identify it and are meant to be public. What can be read and added is decided by [`firestore.rules`](firestore.rules), which go in the Firebase console under Firestore Database → Rules. To use your own project, create one with a Firestore database and Anonymous sign-in turned on, put its values in `js/leaderboard.js`, and publish the rules.

### Releasing a version

Set the new version in two places: `"version"` in `package.json`, and the `?v=` at the end of each stylesheet and script link in `index.html`. The `?v=` makes browsers load the new files instead of older cached copies, and the start screen reads its version from there.

## Project layout

```
invaders/
├── index.html            Page, canvas, input handling and touch-screen layout
├── js/
│   ├── spaceinvaders.js  Game loop, ship, invaders, UFO, shields, scoring and sound
│   ├── leaderboard.js    Family leaderboard in Firebase, with a queue for offline play
│   └── starfield.js      Scrolling star background
├── css/                  Page styles
├── images/               Ship sprite, and invader and UFO pictures for the README
├── sounds/               Sound effects
├── docs/                 Screenshot
├── firestore.rules       Who can read and add leaderboard scores
└── vite.config.js        Settings for npm run build
```

## Credits

Invaders is based on [spaceinvaders](https://github.com/dwmkerr/spaceinvaders) by Dave Kerr, which supplies the game engine, the starfield and the core gameplay. This version adds a pixel-art ship, the arcade game's three kinds of invader drawn in code with their marching poses and points, the heartbeat, the speed-up, the mystery UFO, the shields and the extra life, a saved high score, a family leaderboard, an option to give every wave a new colour, Pause and Mute buttons, and touch controls for phones and tablets.

## License

[MIT](LICENSE). The original spaceinvaders code is also MIT, and its copyright notice is kept in the LICENSE file.
