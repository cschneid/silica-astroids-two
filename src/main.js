/**
 * Application entry point.
 *
 * Imports the canvas renderer and the engine game loop, then starts the loop
 * with stub update/render callbacks.  This serves as verification that the
 * game-loop module is wired up correctly: you should see a solid black
 * fullscreen canvas with no scrollbars that stays crisp and resizes smoothly.
 */

import { canvas, getWidth, getHeight } from './canvas.js';
import { startLoop, setDebug } from './engine/game-loop.js';

// Log initial state so DPI scaling can be verified in the console
console.log(
  `[main] canvas ready — logical: ${getWidth()}×${getHeight()}, ` +
    `buffer: ${canvas.width}×${canvas.height}`,
);

// Enable the FPS debug overlay during development
setDebug(true);

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------

/**
 * Physics / game-state update (called at a fixed 1/60 s timestep).
 *
 * @param {number} _dt  Fixed delta time in seconds.
 */
function update(_dt) {
  // Future game logic will go here.
}

/**
 * Render the current game state (called once per frame).
 *
 * @param {CanvasRenderingContext2D} _ctx  Canvas 2D rendering context.
 */
function render(_ctx) {
  // Future game rendering will go here.
}

startLoop(update, render);
