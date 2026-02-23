import { describe, it, expect } from 'vitest';
import { circlesOverlap } from './collision.js';

// ---------------------------------------------------------------------------
// circlesOverlap
// ---------------------------------------------------------------------------

describe('circlesOverlap', () => {
  it('returns true when circles fully overlap (same position)', () => {
    const a = { x: 100, y: 100, radius: 20 };
    const b = { x: 100, y: 100, radius: 15 };
    expect(circlesOverlap(a, b)).toBe(true);
  });

  it('returns true when circles partially overlap', () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 15, y: 0, radius: 10 };
    // Distance = 15, radii sum = 20 → overlap
    expect(circlesOverlap(a, b)).toBe(true);
  });

  it('returns true when circles are exactly touching (edge case)', () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 20, y: 0, radius: 10 };
    // Distance = 20, radii sum = 20 → touching
    expect(circlesOverlap(a, b)).toBe(true);
  });

  it('returns false when circles are separated', () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 25, y: 0, radius: 10 };
    // Distance = 25, radii sum = 20 → no overlap
    expect(circlesOverlap(a, b)).toBe(false);
  });

  it('returns false when circles are far apart', () => {
    const a = { x: 0, y: 0, radius: 5 };
    const b = { x: 1000, y: 1000, radius: 5 };
    expect(circlesOverlap(a, b)).toBe(false);
  });

  it('works with diagonal distance', () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 7, y: 7, radius: 10 };
    // Distance ≈ 9.9, radii sum = 20 → overlap
    expect(circlesOverlap(a, b)).toBe(true);
  });

  it('works when first circle has zero radius', () => {
    const a = { x: 5, y: 5, radius: 0 };
    const b = { x: 5, y: 5, radius: 10 };
    // Point inside circle → overlap
    expect(circlesOverlap(a, b)).toBe(true);
  });
});
