/**
 * Tests for the game-loop module.
 *
 * Uses jsdom environment (configured in vite.config.js) for browser globals.
 * The canvas module is mocked to avoid DOM side-effects from the real module.
 * requestAnimationFrame is replaced with a manual pump so we control timing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock canvas module
// ---------------------------------------------------------------------------

const mockCtx = {
  clearRect: vi.fn(),
  fillText: vi.fn(),
  font: '',
  fillStyle: '',
};

const mockCanvas = {
  width: 800,
  height: 600,
};

let mockLogicalWidth = 1024;
let mockLogicalHeight = 768;

vi.mock('../canvas.js', () => ({
  canvas: mockCanvas,
  ctx: mockCtx,
  getWidth: () => mockLogicalWidth,
  getHeight: () => mockLogicalHeight,
}));

// ---------------------------------------------------------------------------
// rAF pump — replaces real requestAnimationFrame with a manual queue
// ---------------------------------------------------------------------------

/** Queued rAF callbacks. */
let rafQueue = [];
let rafId = 0;

function mockRaf(cb) {
  rafId++;
  rafQueue.push({ id: rafId, cb });
  return rafId;
}

/**
 * Flush the oldest queued rAF callback, passing the given timestamp.
 * Returns true if a callback was flushed.
 */
function flushRaf(timestamp) {
  if (rafQueue.length === 0) return false;
  const { cb } = rafQueue.shift();
  cb(timestamp);
  return true;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  rafQueue = [];
  rafId = 0;
  mockLogicalWidth = 1024;
  mockLogicalHeight = 768;
  mockCanvas.width = 800;
  mockCanvas.height = 600;
  mockCtx.font = '';
  mockCtx.fillStyle = '';

  // Replace rAF with our manual pump
  vi.stubGlobal('requestAnimationFrame', mockRaf);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('game-loop', () => {
  /**
   * Dynamic import so mocks are in place before module-level code runs.
   * vi.resetModules() ensures a fresh module instance each time.
   */
  async function loadModule() {
    vi.resetModules();
    return import('./game-loop.js');
  }

  // -----------------------------------------------------------------------
  // startLoop basics
  // -----------------------------------------------------------------------

  describe('startLoop()', () => {
    it('schedules a requestAnimationFrame callback', async () => {
      const { startLoop } = await loadModule();
      const update = vi.fn();
      const render = vi.fn();

      startLoop(update, render);

      expect(rafQueue.length).toBe(1);
    });

    it('does not call update or render on the first frame (timestamp init)', async () => {
      const { startLoop } = await loadModule();
      const update = vi.fn();
      const render = vi.fn();

      startLoop(update, render);

      // First frame only records the timestamp, no game logic runs
      flushRaf(1000);

      expect(update).not.toHaveBeenCalled();
      expect(render).not.toHaveBeenCalled();
    });

    it('calls render with the canvas 2D context on the second frame', async () => {
      const { startLoop } = await loadModule();
      const update = vi.fn();
      const render = vi.fn();

      startLoop(update, render);

      flushRaf(1000);         // frame 1: init
      flushRaf(1016.6667);    // frame 2: real loop tick

      expect(render).toHaveBeenCalledTimes(1);
      expect(render).toHaveBeenCalledWith(mockCtx);
    });
  });

  // -----------------------------------------------------------------------
  // Fixed-timestep accumulator
  // -----------------------------------------------------------------------

  describe('fixed-timestep accumulator', () => {
    it('calls updateFn with the fixed timestep (1/60 s)', async () => {
      const { startLoop } = await loadModule();
      const update = vi.fn();

      startLoop(update, vi.fn());

      flushRaf(1000);         // init
      flushRaf(1016.6667);    // ~1 tick elapsed

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(1 / 60);
    });

    it('fires multiple physics updates when a frame takes longer than one tick', async () => {
      const { startLoop } = await loadModule();
      const update = vi.fn();

      startLoop(update, vi.fn());

      flushRaf(1000);   // init
      flushRaf(1050);   // 50 ms elapsed = 3 ticks (50 / 16.6667 ≈ 3)

      expect(update).toHaveBeenCalledTimes(3);
      // Every call receives the fixed timestep
      for (const call of update.mock.calls) {
        expect(call[0]).toBe(1 / 60);
      }
    });

    it('does not call update when elapsed time is less than one tick', async () => {
      const { startLoop } = await loadModule();
      const update = vi.fn();
      const render = vi.fn();

      startLoop(update, render);

      flushRaf(1000);   // init
      flushRaf(1005);   // only 5 ms — below the 16.67 ms threshold

      expect(update).not.toHaveBeenCalled();
      // render is still called once per frame regardless
      expect(render).toHaveBeenCalledTimes(1);
    });

    it('accumulates leftover time across frames', async () => {
      const { startLoop } = await loadModule();
      const update = vi.fn();

      startLoop(update, vi.fn());

      flushRaf(1000);    // init
      flushRaf(1010);    // 10 ms — not enough for a tick yet

      expect(update).toHaveBeenCalledTimes(0);

      flushRaf(1020);    // +10 ms — accumulated = 20 ms, enough for 1 tick

      expect(update).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // Canvas clearing
  // -----------------------------------------------------------------------

  describe('canvas clearing', () => {
    it('calls clearRect(0, 0, width, height) before renderFn each frame', async () => {
      const { startLoop } = await loadModule();
      const callOrder = [];
      const render = vi.fn(() => callOrder.push('render'));
      mockCtx.clearRect.mockImplementation(() => callOrder.push('clearRect'));

      startLoop(vi.fn(), render);

      flushRaf(1000);
      flushRaf(1016.67);

      expect(mockCtx.clearRect).toHaveBeenCalledWith(
        0, 0, mockLogicalWidth, mockLogicalHeight,
      );
      // clearRect must happen before render
      expect(callOrder).toEqual(['clearRect', 'render']);
    });

    it('clears the canvas every frame', async () => {
      const { startLoop } = await loadModule();

      startLoop(vi.fn(), vi.fn());

      flushRaf(1000);
      flushRaf(1016.67);
      flushRaf(1033.33);
      flushRaf(1050.00);

      // 3 render frames (first frame is init only)
      expect(mockCtx.clearRect).toHaveBeenCalledTimes(3);
    });
  });

  // -----------------------------------------------------------------------
  // Debug FPS overlay
  // -----------------------------------------------------------------------

  describe('debug overlay', () => {
    it('does not render FPS when debug is disabled (default)', async () => {
      const { startLoop } = await loadModule();

      startLoop(vi.fn(), vi.fn());

      flushRaf(1000);
      flushRaf(1016.67);

      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });

    it('renders FPS in white monospace at (10, 20) when debug is enabled', async () => {
      const { startLoop, setDebug } = await loadModule();
      setDebug(true);

      startLoop(vi.fn(), vi.fn());

      flushRaf(1000);
      flushRaf(1016.67);

      expect(mockCtx.font).toBe('14px monospace');
      expect(mockCtx.fillStyle).toBe('white');
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringMatching(/^FPS: \d+$/),
        10,
        20,
      );
    });

    it('setDebug(false) disables the overlay after it was enabled', async () => {
      const { startLoop, setDebug } = await loadModule();
      setDebug(true);

      startLoop(vi.fn(), vi.fn());

      flushRaf(1000);
      flushRaf(1016.67);
      expect(mockCtx.fillText).toHaveBeenCalled();

      setDebug(false);
      mockCtx.fillText.mockClear();

      flushRaf(1033.33);
      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Window resize
  // -----------------------------------------------------------------------

  describe('window resize handling', () => {
    it('updates canvas width/height to window.innerWidth/innerHeight on resize', async () => {
      await loadModule();

      // Simulate a window resize
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
      window.dispatchEvent(new Event('resize'));

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
    });

    it('handles multiple resize events', async () => {
      await loadModule();

      Object.defineProperty(window, 'innerWidth', { value: 640, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 480, configurable: true });
      window.dispatchEvent(new Event('resize'));

      expect(mockCanvas.width).toBe(640);
      expect(mockCanvas.height).toBe(480);

      Object.defineProperty(window, 'innerWidth', { value: 2560, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1440, configurable: true });
      window.dispatchEvent(new Event('resize'));

      expect(mockCanvas.width).toBe(2560);
      expect(mockCanvas.height).toBe(1440);
    });
  });

  // -----------------------------------------------------------------------
  // Continuous scheduling
  // -----------------------------------------------------------------------

  describe('continuous loop', () => {
    it('schedules the next rAF after each frame', async () => {
      const { startLoop } = await loadModule();

      startLoop(vi.fn(), vi.fn());

      // startLoop queued 1 callback
      expect(rafQueue.length).toBe(1);

      // After init frame, a new callback is queued
      flushRaf(1000);
      expect(rafQueue.length).toBe(1);

      // After real frame, another callback is queued
      flushRaf(1016.67);
      expect(rafQueue.length).toBe(1);

      // And again
      flushRaf(1033.33);
      expect(rafQueue.length).toBe(1);
    });
  });
});
