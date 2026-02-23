/**
 * Canvas renderer module.
 *
 * Provides a fullscreen, DPI-aware canvas that automatically resizes to fill
 * the viewport.  All drawing through `ctx` uses CSS-pixel coordinates thanks
 * to the DPR transform applied in resizeCanvas().
 */

// ---------------------------------------------------------------------------
// Element setup
// ---------------------------------------------------------------------------

/** @type {HTMLCanvasElement} */
const canvas =
  document.getElementById('game') ??
  (() => {
    const el = document.createElement('canvas');
    el.id = 'game';
    document.body.appendChild(el);
    return el;
  })();

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** Current logical width in CSS pixels. */
let logicalWidth = 0;
/** Current logical height in CSS pixels. */
let logicalHeight = 0;

// ---------------------------------------------------------------------------
// Resize handling
// ---------------------------------------------------------------------------

/**
 * Resize the canvas backing buffer and CSS dimensions to match the viewport,
 * accounting for the device pixel ratio so content stays crisp on HiDPI
 * screens.
 */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  logicalWidth = window.innerWidth;
  logicalHeight = window.innerHeight;

  // Set the backing-buffer size (actual pixels rendered)
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;

  // Set CSS display size (logical / CSS pixels)
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  // Scale the context so all subsequent draw calls use CSS-pixel coords
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  console.log(
    `[canvas] resize — CSS: ${logicalWidth}×${logicalHeight}, ` +
      `buffer: ${canvas.width}×${canvas.height}, dpr: ${dpr}`,
  );
}

// Perform initial sizing and listen for future viewport changes
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Returns the current logical width (CSS pixels). */
function getWidth() {
  return logicalWidth;
}

/** Returns the current logical height (CSS pixels). */
function getHeight() {
  return logicalHeight;
}

/**
 * Clear the entire canvas.  Fills with solid black so the background is
 * always opaque (matches the body background colour set in style.css).
 */
function clear() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { canvas, ctx, getWidth, getHeight, clear };
