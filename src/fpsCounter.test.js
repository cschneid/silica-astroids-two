/**
 * Tests for the FPS debug counter overlay module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Helper: dynamically import a fresh copy of the module so each test starts
 * with clean internal state (frameTimes, prevTimestamp, etc.).
 */
async function loadModule() {
  vi.resetModules();
  return import('./fpsCounter.js');
}

/**
 * Create a minimal mock CanvasRenderingContext2D with spies for the methods
 * used by `renderFPS`.
 */
function mockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 56 })),
    font: '',
    fillStyle: '',
    textBaseline: '',
  };
}

// ---------------------------------------------------------------------------
// Toggle behaviour
// ---------------------------------------------------------------------------

describe('toggleFPS / isFPSVisible', () => {
  it('defaults to visible in dev mode (import.meta.env.DEV is true)', async () => {
    const { isFPSVisible } = await loadModule();
    // Vitest runs via Vite in dev mode, so import.meta.env.DEV === true
    expect(isFPSVisible()).toBe(true);
  });

  it('toggles off then on', async () => {
    const { toggleFPS, isFPSVisible } = await loadModule();

    const afterOff = toggleFPS();
    expect(afterOff).toBe(false);
    expect(isFPSVisible()).toBe(false);

    const afterOn = toggleFPS();
    expect(afterOn).toBe(true);
    expect(isFPSVisible()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateFPS – rolling average & display throttle
// ---------------------------------------------------------------------------

describe('updateFPS', () => {
  it('calculates FPS from steady 60 fps frame deltas', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    const DELTA = 1000 / 60; // ~16.667 ms per frame

    // Feed 31 frames (need prevTimestamp set on frame 0, then 30 deltas)
    for (let i = 0; i <= 30; i++) {
      updateFPS(i * DELTA);
    }

    // After 30+ deltas and > 250 ms elapsed, display should have updated
    renderFPS(ctx);

    // The fillText call should contain "FPS: 60"
    expect(ctx.fillText).toHaveBeenCalled();
    const text = ctx.fillText.mock.calls[0][0];
    expect(text).toBe('FPS: 60');
  });

  it('calculates FPS from steady 30 fps frame deltas', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    const DELTA = 1000 / 30; // ~33.333 ms per frame

    for (let i = 0; i <= 30; i++) {
      updateFPS(i * DELTA);
    }

    renderFPS(ctx);

    const text = ctx.fillText.mock.calls[0][0];
    expect(text).toBe('FPS: 30');
  });

  it('uses a rolling window of at most 30 frames', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    // Feed 31 frames at 60 fps (0 → 30 * 16.667)
    const DELTA_60 = 1000 / 60;
    for (let i = 0; i <= 30; i++) {
      updateFPS(i * DELTA_60);
    }

    // Feed 60 frames at 30 fps — enough to fully flush old deltas from the
    // rolling window AND guarantee the display has updated multiple times
    // after the window is clean (30 frames flush + 30 more to ensure a
    // 250 ms display-refresh boundary is crossed with a clean window).
    const DELTA_30 = 1000 / 30;
    const startTime = 30 * DELTA_60;
    for (let i = 1; i <= 60; i++) {
      updateFPS(startTime + i * DELTA_30);
    }

    renderFPS(ctx);

    const text = ctx.fillText.mock.calls[0][0];
    expect(text).toBe('FPS: 30');
  });

  it('throttles display updates to at most every 250 ms', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    // First frame sets prevTimestamp; no delta yet
    updateFPS(0);

    // Second frame: delta = 10ms (100 fps). Timestamp = 10 ms, which is
    // < 250 ms since the last display update (0), so display should NOT
    // have updated yet and displayedFPS stays at initial value of 0.
    updateFPS(10);

    renderFPS(ctx);
    const textEarly = ctx.fillText.mock.calls[0][0];
    expect(textEarly).toBe('FPS: 0');

    // Now jump ahead past 250 ms with consistent 10 ms deltas
    ctx.fillText.mockClear();
    for (let t = 20; t <= 260; t += 10) {
      updateFPS(t);
    }

    renderFPS(ctx);
    const textLater = ctx.fillText.mock.calls[0][0];
    // Should now show 100 fps (1000 / 10)
    expect(textLater).toBe('FPS: 100');
  });
});

// ---------------------------------------------------------------------------
// renderFPS – drawing behaviour
// ---------------------------------------------------------------------------

describe('renderFPS', () => {
  it('skips rendering entirely when showFPS is false', async () => {
    const { updateFPS, renderFPS, toggleFPS } = await loadModule();
    const ctx = mockCtx();

    // Prime with a couple of frames
    updateFPS(0);
    updateFPS(16.667);

    toggleFPS(); // turn off

    renderFPS(ctx);

    expect(ctx.save).not.toHaveBeenCalled();
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('draws background rect and text when visible', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    // Feed enough frames to trigger a display update
    for (let i = 0; i <= 30; i++) {
      updateFPS(i * 16.667);
    }

    renderFPS(ctx);

    // Should save/restore context
    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.restore).toHaveBeenCalledOnce();

    // Should draw background rectangle (semi-transparent black)
    expect(ctx.fillRect).toHaveBeenCalled();

    // Should draw text
    expect(ctx.fillText).toHaveBeenCalled();
    const text = ctx.fillText.mock.calls[0][0];
    expect(text).toMatch(/^FPS: \d+$/);
  });

  it('renders text at 10px padding from top-left', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    updateFPS(0);
    updateFPS(16.667);

    renderFPS(ctx);

    // fillText(text, x, y) — x and y should both be 10 (PAD)
    const [, x, y] = ctx.fillText.mock.calls[0];
    expect(x).toBe(10);
    expect(y).toBe(10);
  });

  it('sets monospace font at 14px', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    updateFPS(0);
    updateFPS(16.667);

    renderFPS(ctx);

    // Font is set after ctx.save()
    expect(ctx.font).toBe('14px monospace');
  });

  it('displays value as integer (no decimals)', async () => {
    const { updateFPS, renderFPS } = await loadModule();
    const ctx = mockCtx();

    // Use a delta that produces a non-integer raw FPS: 1000/17 ≈ 58.82
    for (let i = 0; i <= 30; i++) {
      updateFPS(i * 17);
    }

    renderFPS(ctx);

    const text = ctx.fillText.mock.calls[0][0];
    // Should be "FPS: 59" (Math.round of 58.82)
    expect(text).toMatch(/^FPS: \d+$/);
    // Verify no decimal point
    expect(text).not.toContain('.');
  });
});
