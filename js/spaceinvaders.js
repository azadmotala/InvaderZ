/*
  spaceinvaders.js

  the core logic for the space invaders game.

*/

/*  
    Game Class

    The Game class represents a Space Invaders game.
    Create an instance of it, change any of the default values
    in the settings, and call 'start' to run the game.

    Call 'initialise' before 'start' to set the canvas the game
    will draw to.

    Call 'moveShip' or 'shipFire' to control the ship.

    Listen for 'gameWon' or 'gameLost' events to handle the game
    ending.
*/

//  Constants for the keyboard.
var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;

//  The three kinds of invader, as in the arcade game: squids in the top row,
//  octopuses in the bottom two and crabs in between, with the arcade points.
//  Each is drawn from pixel grids in two poses that swap as the fleet
//  marches: # is the body, o is an eye and . is see-through.
var INVADER_TYPES = {
  squid: {
    points: 30,
    poses: [
      ['...##...',
       '..####..',
       '.######.',
       '##o##o##',
       '########',
       '..#..#..',
       '.#.##.#.',
       '#.#..#.#'],
      ['...##...',
       '..####..',
       '.######.',
       '##o##o##',
       '########',
       '.#.##.#.',
       '#......#',
       '.#....#.']
    ]
  },
  crab: {
    points: 20,
    poses: [
      ['..#.....#..',
       '...#...#...',
       '..#######..',
       '.##o###o##.',
       '###########',
       '#.#######.#',
       '#.#.....#.#',
       '...##.##...'],
      ['..#.....#..',
       '#..#...#..#',
       '#.#######.#',
       '###o###o###',
       '###########',
       '.#########.',
       '..#.....#..',
       '.#.......#.']
    ]
  },
  octopus: {
    points: 10,
    poses: [
      ['....####....',
       '.##########.',
       '############',
       '###oo##oo###',
       '############',
       '...##..##...',
       '..##.##.##..',
       '##........##'],
      ['....####....',
       '.##########.',
       '############',
       '###oo##oo###',
       '############',
       '..###..###..',
       '.##..##..##.',
       '..##....##..']
    ]
  }
};

//  How many game pixels each grid pixel takes up.
var INVADER_PIXEL_SIZE = 1.5;

//  The invaders swap poses each time the fleet moves this far.
var INVADER_STEP = 16;

//  The march, and the heartbeat with it, never goes faster than this, so the
//  heartbeat stays a beat rather than a buzz.
var INVADER_MAX_STEPS_PER_SECOND = 8;

//  The heartbeat: four low notes, each lower than the last, one per step of
//  the fleet, as in the arcade game. Frequencies in Hz.
var HEARTBEAT_NOTES = [98, 87.3, 77.8, 73.4];

//  The mystery UFO that crosses the top now and then, as in the arcade game.
var UFO_PIXELS = [
  '.....######.....',
  '...##########...',
  '..############..',
  '.##.##.##.##.##.',
  '################',
  '..###..##..###..',
  '...#........#...'
];
var UFO_COLOUR = '#ff4b4b';

//  Its mystery score, picked from the arcade game's table: usually 50 or
//  100, sometimes 150 and rarely 300.
var UFO_POINTS = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100];

//  It doesn't come once the fleet is down to fewer invaders than this.
var UFO_MIN_INVADERS = 8;

//  The two notes of its warble, in Hz.
var UFO_NOTES = [740, 880];

//  Invader body colours. Green is the original, like the invaders in the
//  game this is based on.
var INVADER_COLOURS = ['#ffa726', '#64dd17', '#2962ff'];
var ORIGINAL_INVADER_COLOUR = 1;

//  Creates an instance of the Game class.
function Game() {

  //  Set the initial config.
  this.config = {
    bombRate: 0.05,
    bombMinVelocity: 50,
    bombMaxVelocity: 50,
    invaderInitialVelocity: 25,
    invaderAcceleration: 0,
    invaderDropDistance: 20,
    invaderSpeedUpMax: 5,
    rocketVelocity: 120,
    rocketMaxFireRate: 2,
    gameWidth: 400,
    gameHeight: 300,
    fps: 50,
    debugMode: false,
    invaderRanks: 5,
    invaderFiles: 10,
    shipSpeed: 120,
    levelDifficultyMultiplier: 0.2,
    limitLevelIncrease: 25,
    ufoSpeed: 70,
    ufoMinInterval: 15,
    ufoMaxInterval: 30
  };

  //  All state is in the variables below.
  this.lives = 3;
  this.width = 0;
  this.height = 0;
  this.gameBounds = { left: 0, top: 0, right: 0, bottom: 0 };
  this.intervalId = 0;
  this.score = 0;
  this.level = 1;

  //  The state stack.
  this.stateStack = [];

  //  Input/output
  this.pressedKeys = {};
  this.gameCanvas = null;

  //  All sounds.
  this.sounds = null;

  //  Touch input: true once the player is using a touch screen, the finger
  //  that's steering the ship, and how far it has dragged (in game pixels)
  //  since the last update.
  this.touchMode = false;
  this.touch = null;
  this.touchDrag = 0;

  //  Called whenever the state changes, so the page can update its buttons.
  this.onStateChange = null;

  //  Invader colour: the original, or with randomColours on, a new colour
  //  for each wave.
  this.randomColours = false;
  this.invaderColour = ORIGINAL_INVADER_COLOUR;

  //  Every kind of invader, drawn once in each colour and pose:
  //  invaderSprites[type][colour][pose].
  this.invaderSprites = {};
  for (var type in INVADER_TYPES) {
    this.invaderSprites[type] = INVADER_COLOURS.map(function(colour) {
      return INVADER_TYPES[type].poses.map(function(pixels) {
        return drawPixelSprite(pixels, colour);
      });
    });
  }
  this.ufoSprite = drawPixelSprite(UFO_PIXELS, UFO_COLOUR);
}

//  Initialis the Game with a canvas.
Game.prototype.initialise = function(gameCanvas) {

  //  Set the game canvas.
  this.gameCanvas = gameCanvas;

  //  Set the game width and height.
  this.width = gameCanvas.width;
  this.height = gameCanvas.height;

  //  Set the state game bounds.
  this.gameBounds = {
    left: gameCanvas.width / 2 - this.config.gameWidth / 2,
    right: gameCanvas.width / 2 + this.config.gameWidth / 2,
    top: gameCanvas.height / 2 - this.config.gameHeight / 2,
    bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
  };
};

Game.prototype.moveToState = function(state) {

  //  If we are in a state, leave it.
  if (this.currentState() && this.currentState().leave) {
    this.currentState().leave(game);
    this.stateStack.pop();
  }

  //  If there's an enter function for the new state, call it.
  if (state.enter) {
    state.enter(game);
  }

  //  Set the current state.
  this.stateStack.pop();
  this.stateStack.push(state);
  this.stateChanged();
};

Game.prototype.stateChanged = function() {
  if (this.onStateChange) {
    this.onStateChange();
  }
};

//  Start the Game.
Game.prototype.start = function() {

  //  Move into the 'welcome' state.
  this.moveToState(new WelcomeState());

  //  Set the game variables.
  this.lives = 3;
  this.config.debugMode = /debug=true/.test(window.location.href);

  //  Start the game loop.
  var game = this;
  this.intervalId = setInterval(function() { GameLoop(game); }, 1000 / this.config.fps);

};

//  Returns the current state.
Game.prototype.currentState = function() {
  return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

//  Mutes or unmutes the game.
Game.prototype.mute = function(mute) {

  //  If we've been told to mute, mute.
  if (mute === true) {
    this.sounds.mute = true;
  } else if (mute === false) {
    this.sounds.mute = false;
  } else {
    // Toggle mute instead...
    this.sounds.mute = this.sounds.mute ? false : true;
  }
};

//  The main loop.
function GameLoop(game) {
  var currentState = game.currentState();
  if (currentState) {

    //  Delta t is the time to update/draw.
    var dt = 1 / game.config.fps;

    //  Get the drawing context.
    var ctx = this.gameCanvas.getContext("2d");

    //  Update if we have an update function. Also draw
    //  if we have a draw function.
    if (currentState.update) {
      currentState.update(game, dt);
    }
    if (currentState.draw) {
      currentState.draw(game, dt, ctx);
    }
  }
}

Game.prototype.pushState = function(state) {

  //  If there's an enter function for the new state, call it.
  if (state.enter) {
    state.enter(game);
  }
  //  Set the current state.
  this.stateStack.push(state);
  this.stateChanged();
};

Game.prototype.popState = function() {

  //  Leave and pop the state.
  if (this.currentState()) {
    if (this.currentState().leave) {
      this.currentState().leave(game);
    }

    //  Set the current state.
    this.stateStack.pop();
    this.stateChanged();
  }
};

//  Switches between the original invader colour and random colours. A wave
//  in play changes straight away; otherwise the next wave picks.
Game.prototype.toggleRandomColours = function() {
  this.randomColours = !this.randomColours;
  var state = this.currentState();
  if (state instanceof PlayState || state instanceof PauseState) {
    this.pickInvaderColour();
  }
};

//  Picks the invader colour for a wave. With random colours on, it's never
//  the colour that's showing now, so every wave looks different.
Game.prototype.pickInvaderColour = function() {
  if (!this.randomColours) {
    this.invaderColour = ORIGINAL_INVADER_COLOUR;
    return;
  }
  var colour = Math.floor(Math.random() * (INVADER_COLOURS.length - 1));
  this.invaderColour = colour >= this.invaderColour ? colour + 1 : colour;
};

//  Pauses or resumes play. Does nothing outside of play.
Game.prototype.togglePause = function() {
  var state = this.currentState();
  if (state instanceof PauseState) {
    this.popState();
  } else if (state instanceof PlayState) {
    this.pushState(new PauseState());
  }
};

//  The stop function stops the game.
Game.prototype.stop = function Stop() {
  clearInterval(this.intervalId);
};

//  Inform the game a key is down.
Game.prototype.keyDown = function(keyCode) {
  this.pressedKeys[keyCode] = true;
  //  Delegate to the current state too.
  if (this.currentState() && this.currentState().keyDown) {
    this.currentState().keyDown(this, keyCode);
  }
};

//  Touch controls: drag anywhere to move the ship, and it keeps firing while
//  a finger is down, like holding the space bar.
Game.prototype.touchstart = function(e) {
  this.touchMode = true;
  if (!this.touch) {
    var touch = e.changedTouches[0];
    this.touch = { id: touch.identifier, x: touch.clientX };
  }
  this.pressedKeys[KEY_SPACE] = true;

  //  A tap resumes a paused game. Otherwise it acts like the space bar.
  var state = this.currentState();
  if (state instanceof PauseState) {
    this.popState();
  } else if (state && state.keyDown) {
    state.keyDown(this, KEY_SPACE);
  }
};

Game.prototype.touchmove = function(e) {
  for (var i = 0; i < e.changedTouches.length; i++) {
    var touch = e.changedTouches[i];
    if (!this.touch || touch.identifier !== this.touch.id) {
      continue;
    }

    //  Only steer during play, and convert from screen to game pixels.
    if (this.currentState() instanceof PlayState) {
      var scale = this.gameCanvas.getBoundingClientRect().width / this.width;
      this.touchDrag += (touch.clientX - this.touch.x) / scale;
    }
    this.touch.x = touch.clientX;
  }
};

Game.prototype.touchend = function(e) {
  if (e.touches.length === 0) {
    this.touch = null;
    delete this.pressedKeys[KEY_SPACE];
    return;
  }

  //  If the steering finger lifted, steer with one that's still down.
  for (var i = 0; i < e.changedTouches.length; i++) {
    if (this.touch && e.changedTouches[i].identifier === this.touch.id) {
      this.touch = { id: e.touches[0].identifier, x: e.touches[0].clientX };
    }
  }
};

//  Inform the game a key is up.
Game.prototype.keyUp = function(keyCode) {
  delete this.pressedKeys[keyCode];
  //  Delegate to the current state too.
  if (this.currentState() && this.currentState().keyUp) {
    this.currentState().keyUp(this, keyCode);
  }
};

function WelcomeState() {

}

WelcomeState.prototype.enter = function(game) {

  // Create and load the sounds.
  game.sounds = new Sounds();
  game.sounds.init();
  game.sounds.loadSound('shoot', 'sounds/shoot.wav');
  game.sounds.loadSound('bang', 'sounds/bang.wav');
  game.sounds.loadSound('explosion', 'sounds/explosion.wav');
};

WelcomeState.prototype.update = function(game, dt) {


};

WelcomeState.prototype.draw = function(game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "30px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("Space Invaders", game.width / 2, game.height / 2 - 40);
  ctx.font = "16px Arial";
  if (game.touchMode) {
    ctx.fillText("Tap to start", game.width / 2, game.height / 2);
    ctx.fillText("Drag anywhere to move. Hold to keep firing.", game.width / 2, game.height / 2 + 30);
  } else {
    ctx.fillText("Press 'Space' or touch to start.", game.width / 2, game.height / 2);
  }
};

WelcomeState.prototype.keyDown = function(game, keyCode) {
  if (keyCode == KEY_SPACE) {
    //  Space starts the game.
    game.level = 1;
    game.score = 0;
    game.lives = 3;
    game.moveToState(new LevelIntroState(game.level));
  }
};

function GameOverState() {

}

GameOverState.prototype.update = function(game, dt) {

};

GameOverState.prototype.draw = function(game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "30px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "center";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", game.width / 2, game.height / 2 - 40);
  ctx.font = "16px Arial";
  ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height / 2);
  ctx.font = "16px Arial";
  ctx.fillText(game.touchMode ? "Tap to play again." : "Press 'Space' to play again.", game.width / 2, game.height / 2 + 40);
};

GameOverState.prototype.keyDown = function(game, keyCode) {
  if (keyCode == KEY_SPACE) {
    //  Space restarts the game.
    game.lives = 3;
    game.score = 0;
    game.level = 1;
    game.moveToState(new LevelIntroState(1));
  }
};

//  Create a PlayState with the game config and the level you are on.
function PlayState(config, level) {
  this.config = config;
  this.level = level;

  //  Game state.
  this.invaderCurrentVelocity = 10;
  this.invaderCurrentDropDistance = 0;
  this.invadersAreDropping = false;
  this.lastRocketTime = null;

  //  How many invaders the wave started with.
  this.invaderCount = 0;

  //  Which pose the invaders are in, and how far they've moved since it changed.
  this.invaderPose = 0;
  this.invaderStepDistance = 0;

  //  The heartbeat note to play on the next step.
  this.heartbeatNote = 0;

  //  The mystery UFO, if one is flying, how long until the next one comes,
  //  and the score to show where one was shot.
  this.ufo = null;
  this.ufoTimer = 0;
  this.ufoScore = null;

  //  Where a touch drag is taking the ship, if anywhere.
  this.shipTargetX = null;

  //  Game entities.
  this.ship = null;
  this.invaders = [];
  this.rockets = [];
  this.bombs = [];
}

PlayState.prototype.enter = function(game) {

  //  Create the ship.
  this.ship = new Ship(game.width / 2, game.gameBounds.bottom);

  //  Setup initial state.
  this.invaderCurrentVelocity = 10;
  this.invaderCurrentDropDistance = 0;
  this.invadersAreDropping = false;
  game.touchDrag = 0;

  //  Set the ship speed for this level, as well as invader params.
  var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
  var limitLevel = (this.level < this.config.limitLevelIncrease ? this.level : this.config.limitLevelIncrease);
  this.shipSpeed = this.config.shipSpeed;
  this.invaderInitialVelocity = this.config.invaderInitialVelocity + 1.5 * (levelMultiplier * this.config.invaderInitialVelocity);
  this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
  this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
  this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);
  this.rocketMaxFireRate = this.config.rocketMaxFireRate + 0.4 * limitLevel;

  //  Create the invaders.
  var ranks = this.config.invaderRanks + 0.1 * limitLevel;
  var files = this.config.invaderFiles + 0.2 * limitLevel;
  var invaders = [];
  var rankCount = Math.ceil(ranks);
  game.pickInvaderColour();
  for (var rank = 0; rank < ranks; rank++) {
    //  Squids in the top row, octopuses in the bottom two, crabs in between.
    var type = rank === 0 ? 'squid' : (rank >= rankCount - 2 ? 'octopus' : 'crab');
    for (var file = 0; file < files; file++) {
      invaders.push(new Invader(
        (game.width / 2) + ((files / 2 - file) * 200 / files),
        (game.gameBounds.top + rank * 20),
        rank, file, type));
    }
  }
  this.invaders = invaders;
  this.invaderCount = invaders.length;
  this.resetUfoTimer();
  this.invaderCurrentVelocity = this.invaderInitialVelocity;
  this.invaderVelocity = { x: -this.invaderInitialVelocity, y: 0 };
  this.invaderNextVelocity = null;
};

//  Like the arcade game, the fleet speeds up as you thin it out. It's gentle
//  at first: with half the invaders left it's about 1.4 times as fast, with
//  a quarter left twice as fast, and the last few reach invaderSpeedUpMax.
PlayState.prototype.fleetSpeedUp = function() {
  return Math.min(Math.sqrt(this.invaderCount / this.invaders.length), this.config.invaderSpeedUpMax);
};

//  Sets how long until the next mystery UFO comes.
PlayState.prototype.resetUfoTimer = function() {
  this.ufoTimer = this.config.ufoMinInterval + Math.random() * (this.config.ufoMaxInterval - this.config.ufoMinInterval);
};

//  The mystery UFO crosses the top now and then, from either side, warbling
//  as it goes. As in the arcade game, it stops coming once the fleet is down
//  to its last few.
PlayState.prototype.updateUfo = function(game, dt) {
  var margin = 20 + UFO_PIXELS[0].length * INVADER_PIXEL_SIZE / 2;
  if (!this.ufo) {
    if (this.invaders.length >= UFO_MIN_INVADERS) {
      this.ufoTimer -= dt;
      if (this.ufoTimer <= 0) {
        var fromLeft = Math.random() < 0.5;
        this.ufo = new Ufo(
          fromLeft ? game.gameBounds.left - margin : game.gameBounds.right + margin,
          game.gameBounds.top - 16,
          fromLeft ? this.config.ufoSpeed : -this.config.ufoSpeed);
      }
    }
  } else {
    this.ufo.x += this.ufo.velocity * dt;
    this.ufo.noteTime -= dt;
    if (this.ufo.noteTime <= 0) {
      game.sounds.playNote(UFO_NOTES[this.ufo.note], 0.07, 0.04);
      this.ufo.note = (this.ufo.note + 1) % UFO_NOTES.length;
      this.ufo.noteTime = 0.08;
    }

    //  Gone off the far side.
    if (this.ufo.x < game.gameBounds.left - margin || this.ufo.x > game.gameBounds.right + margin) {
      this.ufo = null;
      this.resetUfoTimer();
    }
  }

  //  A shot UFO's score shows for a second.
  if (this.ufoScore) {
    this.ufoScore.timeLeft -= dt;
    if (this.ufoScore.timeLeft <= 0) {
      this.ufoScore = null;
    }
  }
};

PlayState.prototype.update = function(game, dt) {

  //  If the left or right arrow keys are pressed, move
  //  the ship. Check this on ticks rather than via a keydown
  //  event for smooth movement, otherwise the ship would move
  //  more like a text editor caret.
  if (game.pressedKeys[KEY_LEFT]) {
    this.ship.x -= this.shipSpeed * dt;
  }
  if (game.pressedKeys[KEY_RIGHT]) {
    this.ship.x += this.shipSpeed * dt;
  }

  //  A touch drag moves the ship's target, and the ship heads there at the
  //  same speed as the arrow keys, so touch players get no speed advantage.
  if (game.touchDrag) {
    var from = this.shipTargetX === null ? this.ship.x : this.shipTargetX;
    this.shipTargetX = Math.min(Math.max(from + game.touchDrag, game.gameBounds.left), game.gameBounds.right);
    game.touchDrag = 0;
  }
  if (this.shipTargetX !== null) {
    var step = this.shipSpeed * dt;
    var gap = this.shipTargetX - this.ship.x;
    if (Math.abs(gap) <= step) {
      this.ship.x = this.shipTargetX;
      this.shipTargetX = null;
    } else {
      this.ship.x += gap > 0 ? step : -step;
    }
  }
  if (game.pressedKeys[KEY_SPACE]) {
    this.fireRocket();
  }

  //  Keep the ship in bounds.
  if (this.ship.x < game.gameBounds.left) {
    this.ship.x = game.gameBounds.left;
  }
  if (this.ship.x > game.gameBounds.right) {
    this.ship.x = game.gameBounds.right;
  }

  //  Move each bomb.
  for (var i = 0; i < this.bombs.length; i++) {
    var bomb = this.bombs[i];
    bomb.y += dt * bomb.velocity;

    //  If the rocket has gone off the screen remove it.
    if (bomb.y > this.height) {
      this.bombs.splice(i--, 1);
    }
  }

  //  Move each rocket.
  for (i = 0; i < this.rockets.length; i++) {
    var rocket = this.rockets[i];
    rocket.y -= dt * rocket.velocity;

    //  If the rocket has gone off the screen remove it.
    if (rocket.y < 0) {
      this.rockets.splice(i--, 1);
    }
  }

  //  Move the invaders, faster the fewer are left. A drop stops at exactly
  //  invaderDropDistance, however fast the fleet is going.
  var speedUp = this.fleetSpeedUp();
  var dx = this.invaderVelocity.x * speedUp * dt;
  var dy = this.invaderVelocity.y * speedUp * dt;
  if (this.invadersAreDropping) {
    dy = Math.min(dy, this.config.invaderDropDistance - this.invaderCurrentDropDistance);
  }
  var hitLeft = false, hitRight = false, hitBottom = false;
  for (i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    var newx = invader.x + dx;
    var newy = invader.y + dy;
    if (hitLeft == false && newx < game.gameBounds.left) {
      hitLeft = true;
    }
    else if (hitRight == false && newx > game.gameBounds.right) {
      hitRight = true;
    }
    else if (hitBottom == false && newy > game.gameBounds.bottom) {
      hitBottom = true;
    }

    if (!hitLeft && !hitRight && !hitBottom) {
      invader.x = newx;
      invader.y = newy;
    }
  }

  //  Update invader velocities.
  if (this.invadersAreDropping) {
    this.invaderCurrentDropDistance += dy;
    if (this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
      this.invadersAreDropping = false;
      this.invaderVelocity = this.invaderNextVelocity;
      this.invaderCurrentDropDistance = 0;
    }
  }
  //  If we've hit the left, move down then right.
  if (hitLeft) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = { x: 0, y: this.invaderCurrentVelocity };
    this.invadersAreDropping = true;
    this.invaderNextVelocity = { x: this.invaderCurrentVelocity, y: 0 };
  }
  //  If we've hit the right, move down then left.
  if (hitRight) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = { x: 0, y: this.invaderCurrentVelocity };
    this.invadersAreDropping = true;
    this.invaderNextVelocity = { x: -this.invaderCurrentVelocity, y: 0 };
  }
  //  If we've hit the bottom, it's game over.
  if (hitBottom) {
    game.lives = 0;
  }

  //  Each time the fleet moves a step, swap the invaders' pose so they march,
  //  and play the next heartbeat note. The faster they go, the faster both
  //  go, until steps lengthen to stay under INVADER_MAX_STEPS_PER_SECOND.
  var moved = Math.abs(dx) + Math.abs(dy);
  var step = Math.max(INVADER_STEP, moved / dt / INVADER_MAX_STEPS_PER_SECOND);
  this.invaderStepDistance += moved;
  if (this.invaderStepDistance >= step) {
    this.invaderStepDistance = 0;
    this.invaderPose = 1 - this.invaderPose;
    game.sounds.playNote(HEARTBEAT_NOTES[this.heartbeatNote], 0.12);
    this.heartbeatNote = (this.heartbeatNote + 1) % HEARTBEAT_NOTES.length;
  }

  this.updateUfo(game, dt);

  //  Check for a rocket hitting the UFO, for its mystery score.
  for (i = 0; this.ufo && i < this.rockets.length; i++) {
    var shot = this.rockets[i];
    var ufo = this.ufo;
    if (shot.x >= ufo.x - ufo.width / 2 && shot.x <= ufo.x + ufo.width / 2 &&
      shot.y >= ufo.y - ufo.height / 2 && shot.y <= ufo.y + ufo.height / 2) {
      var points = UFO_POINTS[Math.floor(Math.random() * UFO_POINTS.length)];
      game.score += points;
      this.ufoScore = { points: points, x: ufo.x, y: ufo.y, timeLeft: 1 };
      this.rockets.splice(i, 1);
      this.ufo = null;
      this.resetUfoTimer();
      game.sounds.playSound('bang');
    }
  }

  //  Check for rocket/invader collisions.
  for (i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    var bang = false;

    for (var j = 0; j < this.rockets.length; j++) {
      var rocket = this.rockets[j];

      if (rocket.x >= (invader.x - invader.width / 2) && rocket.x <= (invader.x + invader.width / 2) &&
        rocket.y >= (invader.y - invader.height / 2) && rocket.y <= (invader.y + invader.height / 2)) {

        //  Remove the rocket, set 'bang' so we don't process
        //  this rocket again.
        this.rockets.splice(j--, 1);
        bang = true;
        game.score += INVADER_TYPES[invader.type].points;
        break;
      }
    }
    if (bang) {
      this.invaders.splice(i--, 1);
      game.sounds.playSound('bang');
    }
  }

  //  Find all of the front rank invaders.
  var frontRankInvaders = {};
  for (var i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    //  If we have no invader for game file, or the invader
    //  for game file is futher behind, set the front
    //  rank invader to game one.
    if (!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
      frontRankInvaders[invader.file] = invader;
    }
  }

  //  Give each front rank invader a chance to drop a bomb.
  for (var i = 0; i < this.config.invaderFiles; i++) {
    var invader = frontRankInvaders[i];
    if (!invader) continue;
    var chance = this.bombRate * dt;
    if (chance > Math.random()) {
      //  Fire!
      this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2,
        this.bombMinVelocity + Math.random() * (this.bombMaxVelocity - this.bombMinVelocity)));
    }
  }

  //  Check for bomb/ship collisions.
  for (var i = 0; i < this.bombs.length; i++) {
    var bomb = this.bombs[i];
    if (bomb.x >= (this.ship.x - this.ship.width / 2) && bomb.x <= (this.ship.x + this.ship.width / 2) &&
      bomb.y >= (this.ship.y - this.ship.height / 2) && bomb.y <= (this.ship.y + this.ship.height / 2)) {
      this.bombs.splice(i--, 1);
      game.lives--;
      game.sounds.playSound('explosion');
    }

  }

  //  Check for invader/ship collisions.
  for (var i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    if ((invader.x + invader.width / 2) > (this.ship.x - this.ship.width / 2) &&
      (invader.x - invader.width / 2) < (this.ship.x + this.ship.width / 2) &&
      (invader.y + invader.height / 2) > (this.ship.y - this.ship.height / 2) &&
      (invader.y - invader.height / 2) < (this.ship.y + this.ship.height / 2)) {
      //  Dead by collision!
      game.lives = 0;
      game.sounds.playSound('explosion');
    }
  }

  //  Check for failure
  if (game.lives <= 0) {
    game.moveToState(new GameOverState());
  }

  //  Check for victory
  if (this.invaders.length === 0) {
    game.score += this.level * 50;
    game.level += 1;
    game.moveToState(new LevelIntroState(game.level));
  }
};

PlayState.prototype.draw = function(game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  //  Draw ship.
  // ctx.fillStyle = '#999999';
  // ctx.fillRect(this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);
  //  Positions are centres (collisions, rockets and bombs all use them that
  //  way), so draw sprites centred on them.
  ctx.drawImage(this.ship.image, this.ship.x - this.ship.width / 2, this.ship.y - this.ship.height / 2, this.ship.width, this.ship.height);

  //  Draw invaders.
  // ctx.fillStyle = '#006600';
  // for (var i = 0; i < this.invaders.length; i++) {
  //   var invader = this.invaders[i];
  //   ctx.fillRect(invader.x - invader.width / 2, invader.y - invader.height / 2, invader.width, invader.height);
  // }

  //  Scale the invader pixel art up without blurring it, lined up with whole
  //  screen pixels so it doesn't shimmer as it moves.
  var pixelScale = ctx.getTransform ? ctx.getTransform().a : 1;
  var snap = function(value) { return Math.round(value * pixelScale) / pixelScale; };
  ctx.imageSmoothingEnabled = false;
  for (var i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    var invaderSprite = game.invaderSprites[invader.type][game.invaderColour][this.invaderPose];
    ctx.drawImage(invaderSprite, snap(invader.x - invader.width / 2), snap(invader.y - invader.height / 2),
      snap(invader.width), snap(invader.height));
  }
  var ufo = this.ufo;
  if (ufo) {
    ctx.drawImage(game.ufoSprite, snap(ufo.x - ufo.width / 2), snap(ufo.y - ufo.height / 2),
      snap(ufo.width), snap(ufo.height));
  }
  ctx.imageSmoothingEnabled = true;

  //  The score for a UFO that's just been shot, where it was.
  if (this.ufoScore) {
    ctx.font = "12px Arial";
    ctx.fillStyle = UFO_COLOUR;
    ctx.textAlign = "center";
    ctx.fillText(this.ufoScore.points, this.ufoScore.x, this.ufoScore.y);
  }


  //  Draw bombs.
  ctx.fillStyle = '#ff5555';
  for (var i = 0; i < this.bombs.length; i++) {
    var bomb = this.bombs[i];
    ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
  }

  //  Draw rockets.
  ctx.fillStyle = '#ff0000';
  for (var i = 0; i < this.rockets.length; i++) {
    var rocket = this.rockets[i];
    ctx.fillRect(rocket.x, rocket.y - 2, 1, 4);
  }

  //  Draw info.
  var textYpos = game.gameBounds.bottom + ((game.height - game.gameBounds.bottom) / 2) + 14 / 2;
  ctx.font = "14px Arial";
  ctx.fillStyle = '#ffffff';
  var info = "Lives: " + game.lives;
  ctx.textAlign = "left";
  ctx.fillText(info, game.gameBounds.left, textYpos);
  info = "Score: " + game.score + ", Level: " + game.level;
  ctx.textAlign = "right";
  ctx.fillText(info, game.gameBounds.right, textYpos);

  //  If we're in debug mode, draw bounds.
  if (this.config.debugMode) {
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(0, 0, game.width, game.height);
    ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
      game.gameBounds.right - game.gameBounds.left,
      game.gameBounds.bottom - game.gameBounds.top);
  }

};

PlayState.prototype.keyDown = function(game, keyCode) {

  if (keyCode == KEY_SPACE) {
    //  Fire!
    this.fireRocket();
  }
  if (keyCode == 80) {
    //  Push the pause state.
    game.pushState(new PauseState());
  }
};

PlayState.prototype.keyUp = function(game, keyCode) {

};

PlayState.prototype.fireRocket = function() {
  //  If we have no last rocket time, or the last rocket time 
  //  is older than the max rocket rate, we can fire.
  if (this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.rocketMaxFireRate)) {
    //  Add a rocket.
    this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
    this.lastRocketTime = (new Date()).valueOf();

    //  Play the 'shoot' sound.
    game.sounds.playSound('shoot');
  }
};

function PauseState() {

}

PauseState.prototype.keyDown = function(game, keyCode) {

  if (keyCode == 80) {
    //  Pop the pause state.
    game.popState();
  }
};

PauseState.prototype.draw = function(game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "14px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("Paused", game.width / 2, game.height / 2);
  if (game.touchMode) {
    ctx.fillText("Tap to resume.", game.width / 2, game.height / 2 + 24);
  }
  return;
};

/*  
    Level Intro State

    The Level Intro state shows a 'Level X' message and
    a countdown for the level.
*/
function LevelIntroState(level) {
  this.level = level;
  this.countdownMessage = "3";
}

LevelIntroState.prototype.update = function(game, dt) {

  //  Update the countdown.
  if (this.countdown === undefined) {
    this.countdown = 3; // countdown from 3 secs
  }
  this.countdown -= dt;
  if (this.countdown < 2) {
    this.countdownMessage = "2";
  }
  if (this.countdown < 1) {
    this.countdownMessage = "1";
  }
  if (this.countdown <= 0) {
    //  Move to the next level, popping this state.
    game.moveToState(new PlayState(game.config, this.level));
  }
};

LevelIntroState.prototype.draw = function(game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "36px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("Level " + this.level, game.width / 2, game.height / 2);
  ctx.font = "24px Arial";
  ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height / 2 + 36);
  return;
};


/*
 
  Ship

  The ship has a position and that's about it.

*/
function Ship(x, y) {
  this.x = x;
  this.y = y;
  //  The same shape as images/player.png (50x48), so it isn't squashed.
  this.width = 20;
  this.height = 19;
  this.image = new Image();
  this.image.src = `images/player.png`;
}

/*
    Rocket

    Fired by the ship, they've got a position, velocity and state.

    */
function Rocket(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
}

/*
    Bomb

    Dropped by invaders, they've got position, velocity.

*/
function Bomb(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
}

/*
    Invader 

    Invader's have position, type, rank/file and that's about it. 
*/

function Invader(x, y, rank, file, type) {
  this.x = x;
  this.y = y;
  this.rank = rank;
  this.file = file;
  this.type = type;

  //  Sized from its pixel grid, so squids are narrow and octopuses wide.
  var pixels = INVADER_TYPES[type].poses[0];
  this.width = pixels[0].length * INVADER_PIXEL_SIZE;
  this.height = pixels.length * INVADER_PIXEL_SIZE;
}

/*
    UFO

    The mystery UFO flies straight across the top at a steady speed.
*/
function Ufo(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
  this.width = UFO_PIXELS[0].length * INVADER_PIXEL_SIZE;
  this.height = UFO_PIXELS.length * INVADER_PIXEL_SIZE;

  //  Which note of its warble is next, and how long until it plays.
  this.note = 0;
  this.noteTime = 0;
}

//  Draws a pixel grid (an invader pose or the UFO) in the given colour onto a
//  small canvas, one canvas pixel per grid pixel. Each is drawn once and
//  scaled up when the game draws.
function drawPixelSprite(pixels, colour) {
  var sprite = document.createElement('canvas');
  sprite.width = pixels[0].length;
  sprite.height = pixels.length;
  var ctx = sprite.getContext('2d');
  for (var y = 0; y < pixels.length; y++) {
    for (var x = 0; x < pixels[y].length; x++) {
      var pixel = pixels[y].charAt(x);
      if (pixel !== '.') {
        ctx.fillStyle = pixel === 'o' ? '#000000' : colour;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return sprite;
}


/*
    Game State

    A Game State is simply an update and draw proc.
    When a game is in the state, the update and draw procs are
    called, with a dt value (dt is delta time, i.e. the number)
    of seconds to update or draw).

*/
function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
  this.updateProc = updateProc;
  this.drawProc = drawProc;
  this.keyDown = keyDown;
  this.keyUp = keyUp;
  this.enter = enter;
  this.leave = leave;
}

/*

    Sounds

    The sounds class is used to asynchronously load sounds and allow
    them to be played.

*/
function Sounds() {

  //  The audio context.
  this.audioContext = null;

  //  The actual set of loaded sounds.
  this.sounds = {};
}

Sounds.prototype.init = function() {

  //  Create the audio context, paying attention to webkit browsers.
  context = window.AudioContext || window.webkitAudioContext;
  this.audioContext = new context();
  this.mute = false;
};

//  Browsers, iPhones especially, keep audio switched off until the player
//  interacts with the page, so call this from an input event.
Sounds.prototype.unlock = function() {
  if (this.audioContext.state === 'suspended') {
    this.audioContext.resume();
  }
};

Sounds.prototype.loadSound = function(name, url) {

  //  Reference to ourselves for closures.
  var self = this;

  //  Create an entry in the sounds object.
  this.sounds[name] = null;

  //  Create an asynchronous request for the sound.
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    self.audioContext.decodeAudioData(req.response, function(buffer) {
      self.sounds[name] = { buffer: buffer };
    });
  };
  try {
    req.send();
  } catch (e) {
    console.log("An exception occured getting sound the sound " + name + " this might be " +
      "because the page is running from the file system, not a webserver.");
    console.log(e);
  }
};

//  Plays a short note, made in code rather than from a sound file, for the
//  heartbeat and the UFO's warble. The volume is optional. Skipped while sound
//  is off, so notes can't pile up and all play at once when it comes back on.
Sounds.prototype.playNote = function(frequency, duration, level) {
  var context = this.audioContext;
  level = level || 0.15;
  if (this.mute === true || context.state !== 'running') {
    return;
  }

  //  A square wave with a quick start, held for half the note, then faded,
  //  so it thumps rather than clicks.
  var oscillator = context.createOscillator();
  var volume = context.createGain();
  var now = context.currentTime;
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(level, now + 0.005);
  volume.gain.setValueAtTime(level, now + duration / 2);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
};

Sounds.prototype.playSound = function(name) {

  //  If we've not got the sound, don't bother playing it.
  if (this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
    return;
  }

  //  Create a sound source, set the buffer, connect to the speakers and
  //  play the sound.
  var source = this.audioContext.createBufferSource();
  source.buffer = this.sounds[name].buffer;
  source.connect(this.audioContext.destination);
  source.start(0);
};
