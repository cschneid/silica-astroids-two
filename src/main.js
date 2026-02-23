/**
 * Application entry point.
 *
 * Imports the canvas renderer and runs a basic render loop that clears the
 * screen each frame.  This serves as verification that the canvas module is
 * wired up correctly: you should see a solid black fullscreen canvas with no
 * scrollbars that stays crisp on retina displays and resizes smoothly.
 */

import { canvas, ctx, getWidth, getHeight, clear } from './canvas.js';

// Log initial state so DPI scaling can be verified in the console
console.log(
  `[main] canvas ready — logical: ${getWidth()}×${getHeight()}, ` +
    `buffer: ${canvas.width}×${canvas.height}`,
);

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------

function frame() {
  clear();

  // Future game rendering will go here.

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
