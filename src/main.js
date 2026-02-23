/**
 * Application entry point.
 *
 * Imports the canvas renderer and runs a basic render loop that clears the
 * screen each frame.  This serves as verification that the canvas module is
 * wired up correctly: you should see a solid black fullscreen canvas with no
 * scrollbars that stays crisp on retina displays and resizes smoothly.
 */

import { canvas, ctx, getWidth, getHeight, clear } from './canvas.js';
import { updateFPS, renderFPS, toggleFPS } from './fpsCounter.js';

// Log initial state so DPI scaling can be verified in the console
console.log(
  `[main] canvas ready — logical: ${getWidth()}×${getHeight()}, ` +
    `buffer: ${canvas.width}×${canvas.height}`,
);

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

window.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    const visible = toggleFPS();
    console.log(`[main] FPS counter ${visible ? 'on' : 'off'}`);
  }
});

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------

function frame(timestamp) {
  clear();

  // Future game rendering will go here.

  // FPS counter — always last so it renders on top of everything.
  updateFPS(timestamp);
  renderFPS(ctx);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
