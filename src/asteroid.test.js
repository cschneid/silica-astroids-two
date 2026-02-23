import { describe, it, expect } from 'vitest';
import {
  Asteroid,
  ASTEROID_SCORES,
  TIER_RADII,
  generateAsteroidShape,
} from './asteroid.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('ASTEROID_SCORES', () => {
  it('maps tier 1 to 20 points', () => {
    expect(ASTEROID_SCORES[1]).toBe(20);
  });

  it('maps tier 2 to 50 points', () => {
    expect(ASTEROID_SCORES[2]).toBe(50);
  });

  it('maps tier 3 to 100 points', () => {
    expect(ASTEROID_SCORES[3]).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Shape generation
// ---------------------------------------------------------------------------

describe('generateAsteroidShape', () => {
  it('returns an array of vertex objects with x and y', () => {
    const shape = generateAsteroidShape(40);
    expect(shape.length).toBeGreaterThan(0);
    for (const v of shape) {
      expect(v).toHaveProperty('x');
      expect(v).toHaveProperty('y');
      expect(typeof v.x).toBe('number');
      expect(typeof v.y).toBe('number');
    }
  });

  it('generates vertices roughly within the radius (± jitter)', () => {
    const radius = 40;
    const shape = generateAsteroidShape(radius);
    for (const v of shape) {
      const dist = Math.sqrt(v.x ** 2 + v.y ** 2);
      // With 0.3 jitter the distance should be between 0.7r and 1.3r
      expect(dist).toBeGreaterThanOrEqual(radius * 0.65); // small tolerance
      expect(dist).toBeLessThanOrEqual(radius * 1.35);
    }
  });
});

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('Asteroid constructor', () => {
  it('creates an asteroid with the correct tier and radius', () => {
    const a = new Asteroid({ tier: 1, x: 100, y: 200, vx: 1, vy: -1 });
    expect(a.tier).toBe(1);
    expect(a.radius).toBe(TIER_RADII[1]);
  });

  it('assigns position and velocity', () => {
    const a = new Asteroid({ tier: 2, x: 50, y: 60, vx: 3, vy: -4 });
    expect(a.x).toBe(50);
    expect(a.y).toBe(60);
    expect(a.vx).toBe(3);
    expect(a.vy).toBe(-4);
  });

  it('auto-generates a shape if none provided', () => {
    const a = new Asteroid({ tier: 1, x: 0, y: 0, vx: 0, vy: 0 });
    expect(Array.isArray(a.shape)).toBe(true);
    expect(a.shape.length).toBeGreaterThan(0);
  });

  it('uses a custom shape when provided', () => {
    const custom = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
    const a = new Asteroid({
      tier: 1,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      shape: custom,
    });
    expect(a.shape).toBe(custom);
  });

  it('auto-generates angular velocity when not provided', () => {
    const a = new Asteroid({ tier: 1, x: 0, y: 0, vx: 0, vy: 0 });
    expect(typeof a.angularVelocity).toBe('number');
  });

  it('uses provided angular velocity', () => {
    const a = new Asteroid({
      tier: 1,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angularVelocity: 1.5,
    });
    expect(a.angularVelocity).toBe(1.5);
  });

  it('throws for invalid tier', () => {
    expect(
      () => new Asteroid({ tier: 0, x: 0, y: 0, vx: 0, vy: 0 }),
    ).toThrow(RangeError);
    expect(
      () => new Asteroid({ tier: 4, x: 0, y: 0, vx: 0, vy: 0 }),
    ).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// breakup() — tier 1 (large → 2 medium)
// ---------------------------------------------------------------------------

describe('breakup() — tier 1', () => {
  function makeTier1() {
    return new Asteroid({ tier: 1, x: 400, y: 300, vx: 50, vy: -30 });
  }

  it('returns exactly 2 children', () => {
    const { children } = makeTier1().breakup();
    expect(children).toHaveLength(2);
  });

  it('children are tier 2 with correct radius', () => {
    const { children } = makeTier1().breakup();
    for (const child of children) {
      expect(child).toBeInstanceOf(Asteroid);
      expect(child.tier).toBe(2);
      expect(child.radius).toBe(TIER_RADII[2]);
    }
  });

  it('returns score of 20 (tier 1 score)', () => {
    const { score } = makeTier1().breakup();
    expect(score).toBe(20);
  });

  it('children are positioned near the parent', () => {
    const parent = makeTier1();
    const { children } = parent.breakup();
    const maxOffset = parent.radius * 0.3;
    for (const child of children) {
      expect(Math.abs(child.x - parent.x)).toBeLessThanOrEqual(maxOffset);
      expect(Math.abs(child.y - parent.y)).toBeLessThanOrEqual(maxOffset);
    }
  });

  it('children have faster speed than parent', () => {
    const parent = makeTier1();
    const parentSpeed = Math.sqrt(parent.vx ** 2 + parent.vy ** 2);
    const { children } = parent.breakup();
    for (const child of children) {
      const childSpeed = Math.sqrt(child.vx ** 2 + child.vy ** 2);
      expect(childSpeed).toBeGreaterThanOrEqual(parentSpeed * 1.2 * 0.99); // tiny float tolerance
      expect(childSpeed).toBeLessThanOrEqual(parentSpeed * 1.5 * 1.01);
    }
  });

  it('each child has a unique shape array', () => {
    const { children } = makeTier1().breakup();
    expect(children[0].shape).not.toBe(children[1].shape);
  });

  it('each child has a numeric angular velocity', () => {
    const { children } = makeTier1().breakup();
    for (const child of children) {
      expect(typeof child.angularVelocity).toBe('number');
      expect(Number.isFinite(child.angularVelocity)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// breakup() — tier 2 (medium → 2 small)
// ---------------------------------------------------------------------------

describe('breakup() — tier 2', () => {
  function makeTier2() {
    return new Asteroid({ tier: 2, x: 200, y: 150, vx: -20, vy: 40 });
  }

  it('returns exactly 2 children', () => {
    const { children } = makeTier2().breakup();
    expect(children).toHaveLength(2);
  });

  it('children are tier 3 with correct radius', () => {
    const { children } = makeTier2().breakup();
    for (const child of children) {
      expect(child.tier).toBe(3);
      expect(child.radius).toBe(TIER_RADII[3]);
    }
  });

  it('returns score of 50 (tier 2 score)', () => {
    const { score } = makeTier2().breakup();
    expect(score).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// breakup() — tier 3 (small → destroyed)
// ---------------------------------------------------------------------------

describe('breakup() — tier 3', () => {
  function makeTier3() {
    return new Asteroid({ tier: 3, x: 100, y: 100, vx: 10, vy: 10 });
  }

  it('returns an empty children array', () => {
    const { children } = makeTier3().breakup();
    expect(children).toEqual([]);
  });

  it('returns score of 100 (tier 3 score)', () => {
    const { score } = makeTier3().breakup();
    expect(score).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// breakup() — child velocity direction
// ---------------------------------------------------------------------------

describe('breakup() — velocity deflection', () => {
  it('children velocity vectors are rotated (not identical to parent)', () => {
    // Run multiple times to reduce flake risk from tiny random angles
    let anyDifferent = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const parent = new Asteroid({
        tier: 1,
        x: 0,
        y: 0,
        vx: 100,
        vy: 0,
      });
      const { children } = parent.breakup();
      // At least one child should have a non-zero vy since the parent only
      // had vx. The deflection angle is ≥15°, so vy will be noticeable.
      for (const child of children) {
        if (Math.abs(child.vy) > 1) {
          anyDifferent = true;
        }
      }
    }
    expect(anyDifferent).toBe(true);
  });

  it('deflection angle is within the specified range', () => {
    // For a parent moving purely in x, the deflection angle of each child
    // can be computed from atan2(vy, vx). We check it lands in the union
    // [-30°, -15°] ∪ [15°, 30°] (before speed scaling, angle is the same).
    for (let i = 0; i < 50; i++) {
      const parent = new Asteroid({
        tier: 1,
        x: 0,
        y: 0,
        vx: 100,
        vy: 0,
      });
      const { children } = parent.breakup();
      for (const child of children) {
        const angleDeg =
          (Math.atan2(child.vy, child.vx) * 180) / Math.PI;
        const absAngle = Math.abs(angleDeg);
        // Should be between 15° and 30° (with small float tolerance)
        expect(absAngle).toBeGreaterThanOrEqual(14.9);
        expect(absAngle).toBeLessThanOrEqual(30.1);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// breakup() does NOT mutate the parent
// ---------------------------------------------------------------------------

describe('breakup() — parent unchanged', () => {
  it('does not modify the parent asteroid properties', () => {
    const parent = new Asteroid({
      tier: 1,
      x: 400,
      y: 300,
      vx: 50,
      vy: -30,
    });
    const origX = parent.x;
    const origY = parent.y;
    const origVx = parent.vx;
    const origVy = parent.vy;
    const origTier = parent.tier;

    parent.breakup();

    expect(parent.x).toBe(origX);
    expect(parent.y).toBe(origY);
    expect(parent.vx).toBe(origVx);
    expect(parent.vy).toBe(origVy);
    expect(parent.tier).toBe(origTier);
  });
});
