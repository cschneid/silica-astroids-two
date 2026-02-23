import { describe, it, expect } from 'vitest';
import { Bullet, BULLET_RADIUS } from './bullet.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('BULLET_RADIUS', () => {
  it('is a positive number', () => {
    expect(BULLET_RADIUS).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('Bullet constructor', () => {
  it('assigns position', () => {
    const b = new Bullet({ x: 100, y: 200, vx: 0, vy: -300 });
    expect(b.x).toBe(100);
    expect(b.y).toBe(200);
  });

  it('assigns velocity', () => {
    const b = new Bullet({ x: 0, y: 0, vx: 10, vy: -20 });
    expect(b.vx).toBe(10);
    expect(b.vy).toBe(-20);
  });

  it('assigns the default bullet radius', () => {
    const b = new Bullet({ x: 0, y: 0, vx: 0, vy: 0 });
    expect(b.radius).toBe(BULLET_RADIUS);
  });
});
