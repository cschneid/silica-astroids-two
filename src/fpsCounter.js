/**
 * FPS debug counter overlay.
 *
 * Renders a rolling-average FPS value in the top-left corner of the canvas.
 * Toggle visibility with the backtick (`) key.  The counter defaults to
 * **visible** in development builds.
 *
 * Usage (inside the render loop):
 *
 *   updateFPS(timestamp);   // call every frame with rAF timestamp
 *   renderFPS(ctx);         // call *after* all other rendering
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Number of recent frame deltas used for the rolling average. */
const ROLLING_WINDOW = 30;

/** Minimum interval (ms) between display-value refreshes. */
const DISPLAY_INTERVAL_MS = 250;

/** Padding from the top-left corner of the canvas (CSS pixels). */
const PAD = 10;

/** Font used for the counter text. */
const FONT = '14px monospace';

/** Horizontal padding inside the background rectangle. */
const BG_PAD_X = 6;

/** Vertical padding inside the background rectangle. */
const BG_PAD_Y = 4;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/**
 * Controls whether the FPS counter is rendered.  When `false` the render
 * call is skipped entirely (not just hidden).
 *
 * Defaults to `true` when running under Vite's dev server
 * (`import.meta.env.DEV`) and `false` in production builds.
 */
let showFPS = import.meta.env.DEV;

/** Circular buffer of recent frame durations (ms). */
const frameTimes = [];

/** Timestamp of the previous frame (ms), or `null` if this is the first. */
let prevTimestamp = null;

/** The FPS value currently shown on screen (integer). */
let displayedFPS = 0;

/** Timestamp (ms) when `displayedFPS` was last recalculated. */
let lastDisplayUpdate = 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record a new frame timestamp and recalculate the displayed FPS when the
 * display interval has elapsed.  Call once per frame **before** `renderFPS`.
 *
 * @param {number} timestamp  The `DOMHighResTimeStamp` provided by
 *                            `requestAnimationFrame`.
 */
function updateFPS(timestamp) {
  if (prevTimestamp !== null) {
    const delta = timestamp - prevTimestamp;

    // Maintain rolling window
    frameTimes.push(delta);
    if (frameTimes.length > ROLLING_WINDOW) {
      frameTimes.shift();
    }

    // Throttle display updates to ~4 times per second
    if (timestamp - lastDisplayUpdate >= DISPLAY_INTERVAL_MS && frameTimes.length > 0) {
      const avgDelta =
        frameTimes.reduce((sum, d) => sum + d, 0) / frameTimes.length;
      displayedFPS = Math.round(1000 / avgDelta);
      lastDisplayUpdate = timestamp;
    }
  }

  prevTimestamp = timestamp;
}

/**
 * Draw the FPS counter overlay.  Call **after** all other game rendering so
 * the counter is always on top.  Does nothing when `showFPS` is `false`.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function renderFPS(ctx) {
  if (!showFPS) return;

  const text = `FPS: ${displayedFPS}`;

  ctx.save();

  ctx.font = FONT;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = 14; // matches font-size

  // Semi-transparent black background for readability
  const bgX = PAD - BG_PAD_X;
  const bgY = PAD - BG_PAD_Y;
  const bgW = textWidth + BG_PAD_X * 2;
  const bgH = textHeight + BG_PAD_Y * 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(bgX, bgY, bgW, bgH);

  // White text
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'top';
  ctx.fillText(text, PAD, PAD);

  ctx.restore();
}

/**
 * Toggle the FPS counter on or off.
 *
 * @returns {boolean} The new visibility state.
 */
function toggleFPS() {
  showFPS = !showFPS;
  return showFPS;
}

/**
 * Returns whether the FPS counter is currently visible.
 *
 * @returns {boolean}
 */
function isFPSVisible() {
  return showFPS;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { updateFPS, renderFPS, toggleFPS, isFPSVisible };
