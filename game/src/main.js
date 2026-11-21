// Boot and the one loop: input is read every frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one),
// and the renderer paints what is there. The game moves between six
// screens: title, play, paused, level clear, game over and win.
//
// ?seed=N fixes the run's randomness. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, updateWorld, worldThrowPebble, EVENT_PICKUP, EVENT_PEBBLE, EVENT_ALERT, EVENT_SUSPICIOUS, EVENT_CAUGHT, EVENT_CLEAR, EVENT_FOOTSTEP, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, ACTION_MUTE, createInput } from './input.js';
import { createRenderer, draw, ratingFor, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CLEAR, SCREEN_OVER, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import {
  ensureAudio,
  toggleMute,
  playFootstep,
  playSuspicious,
  playAlert,
  playPebble,
  playPickup,
  playCaught,
  playLevelClear,
  playWin,
} from './audio.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
createRandom(seed); // The run is seeded; gameplay itself is deterministic.

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best time then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name);
  let painted = 0;
  function paint() {
    draw(renderer, scene.world, scene.screen, { bestMs: scene.best });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let levelIndex = 0;
  let lives = LIVES;
  let world = createWorld(0, lives);
  let best = readBest();
  let totalMs = 0;
  let clearInfo = null;
  let accumulator = 0;
  let last = performance.now();

  function handleEvents(events) {
    for (const event of events) {
      if (event.type === EVENT_FOOTSTEP) playFootstep(event.alt);
      else if (event.type === EVENT_SUSPICIOUS) playSuspicious();
      else if (event.type === EVENT_ALERT) playAlert();
      else if (event.type === EVENT_PEBBLE) playPebble();
      else if (event.type === EVENT_PICKUP) playPickup();
      else if (event.type === EVENT_CAUGHT) {
        playCaught();
        lives -= 1;
        world.lives = lives;
        if (lives <= 0) {
          screen = SCREEN_OVER;
        } else {
          world = createWorld(levelIndex, lives);
        }
      } else if (event.type === EVENT_CLEAR) {
        playLevelClear();
        totalMs += world.timer * 1000;
        clearInfo = { rating: ratingFor(world), timer: world.timer };
        screen = SCREEN_CLEAR;
      } else if (event.type === EVENT_WIN) {
        playWin();
        totalMs += world.timer * 1000;
        const isBest = best === 0 || totalMs < best;
        if (isBest) {
          best = totalMs;
          saveBest(totalMs);
        }
        screen = SCREEN_WIN;
        world.winIsBest = isBest;
      }
    }
  }

  function startRun() {
    levelIndex = 0;
    lives = LIVES;
    totalMs = 0;
    world = createWorld(0, lives);
    screen = SCREEN_PLAY;
  }

  function onAction(action) {
    ensureAudio();
    if (action === ACTION_MUTE) {
      toggleMute();
      return;
    }
    if (action === ACTION_PAUSE && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      return;
    }
    if (action === ACTION_RESTART && screen !== SCREEN_TITLE) {
      world = createWorld(levelIndex, lives);
      screen = SCREEN_PLAY;
      return;
    }
    if (action !== ACTION_CONFIRM) return;
    if (screen === SCREEN_TITLE) startRun();
    else if (screen === SCREEN_CLEAR) {
      levelIndex += 1;
      world = createWorld(levelIndex, lives);
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_OVER) {
      lives = LIVES;
      world = createWorld(levelIndex, lives);
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_WIN) startRun();
    else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
  }

  function onClick(wx, wy) {
    ensureAudio();
    if (screen === SCREEN_TITLE) {
      startRun();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    // Clicks land in canvas pixels; the playfield starts under the HUD.
    const events = [];
    worldThrowPebble(world, wx, wy - 48, events);
    handleEvents(events);
  }

  const input = createInput(canvas, onAction, onClick);

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = [];
        updateWorld(world, input.keys, STEP, events);
        handleEvents(events);
        if (screen !== SCREEN_PLAY) break;
      }
    }
    const extra = {
      bestMs: best,
      totalMs,
      isBest: !!world.winIsBest,
      rating: clearInfo?.rating ?? 'GHOST',
    };
    draw(renderer, world, screen, extra);
    status.textContent =
      screen === SCREEN_PLAY
        ? `${world.level.name}. ${world.level.objective}. Alert: ${world.alertLevel}.`
        : '';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
