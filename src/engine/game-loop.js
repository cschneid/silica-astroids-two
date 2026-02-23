/**
 * Game loop module with fixed-timestep accumulator.
 *
 * Exports `startLoop(updateFn, renderFn)` which drives the core game cycle:
 *   1. Physics updates at a fixed 1/60s timestep via an accumulator (multiple
 *      updates may fire per frame if the frame took longer than one tick).
 *   2. A single render pass per frame, preceded by a `clearRect` wipe.
 *   3. An optional debug overlay showing current FPS.
 *
 * The canvas is automatically resized to fill the viewport on `window.resize`.
 */

import { canvas, ctx, getWidth, getHeight } from '../canvas.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed physics timestep in seconds (1/60 s ≈ 16.67 ms). */
const FIXED_DT = 1 / 60;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** Whether the debug FPS overlay is rendered. */
let showDebug = false;

// ---------------------------------------------------------------------------
// Resize handling
// ---------------------------------------------------------------------------

/**
 * Keep canvas `width` / `height` attributes in sync with the viewport so the
 * drawing surface always covers the full window.
 */
function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  console.log(
    `[game-loop] resize — ${canvas.width}×${canvas.height}`,
  );
}

window.addEventListener('resize', handleResize);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enable or disable the debug FPS overlay.
 *
 * When enabled, current FPS is rendered in white monospace text at (10, 20).
 *
 * @param {boolean} enabled
 */
export function setDebug(enabled) {
  showDebug = enabled;
}

/**
 * Start the main game loop.
 *
 * `updateFn` is called zero or more times per frame with a fixed delta of
 * 1/60 s.  `renderFn` is called exactly once per frame after physics have
 * been stepped, receiving the canvas 2D rendering context.
 *
 * @param {(dt: number) => void}                      updateFn
 * @param {(ctx: CanvasRenderingContext2D) => void}    renderFn
 */
export function startLoop(updateFn, renderFn) {
  let lastTime = 0;
  let accumulator = 0;

  // FPS tracking
  let fps = 0;
  let frameCount = 0;
  let fpsTimer = 0;

  /** @param {number} timestamp  DOMHighResTimeStamp from rAF */
  function loop(timestamp) {
    // First frame — just record the timestamp so the first delta is zero.
    if (lastTime === 0) {
      lastTime = timestamp;
      requestAnimationFrame(loop);
      return;
    }

    const elapsed = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;

    // ----- FPS counter --------------------------------------------------
    frameCount++;
    fpsTimer += elapsed;
    if (fpsTimer >= 1) {
      fps = frameCount;
      frameCount = 0;
      fpsTimer -= 1;
    }

    // ----- Fixed-timestep physics updates --------------------------------
    accumulator += elapsed;

    while (accumulator >= FIXED_DT) {
      updateFn(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    // ----- Render --------------------------------------------------------
    ctx.clearRect(0, 0, getWidth(), getHeight());
    renderFn(ctx);

    // ----- Debug overlay -------------------------------------------------
    if (showDebug) {
      ctx.font = '14px monospace';
      ctx.fillStyle = 'white';
      ctx.fillText(`FPS: ${fps}`, 10, 20);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
