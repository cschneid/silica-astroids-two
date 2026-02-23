import { describe, it, expect } from 'vitest';
import { Asteroid, ASTEROID_SCORES } from './asteroid.js';
import { Bullet } from './bullet.js';
import {
  processBulletAsteroidCollisions,
  applyCollisionResults,
} from './bullet-asteroid-collision.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a bullet at a given position heading upward. */
function makeBullet(x, y) {
  return new Bullet({ x, y, vx: 0, vy: -300 });
}

/** Create a tier-1 (large) asteroid at a given position. */
function makeLargeAsteroid(x, y) {
  return new Asteroid({ tier: 1, x, y, vx: 10, vy: 5 });
}

/** Create a tier-2 (medium) asteroid at a given position. */
function makeMediumAsteroid(x, y) {
  return new Asteroid({ tier: 2, x, y, vx: -15, vy: 20 });
}

/** Create a tier-3 (small) asteroid at a given position. */
function makeSmallAsteroid(x, y) {
  return new Asteroid({ tier: 3, x, y, vx: 5, vy: -10 });
}

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — basic collision
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — basic collision', () => {
  it('detects a bullet hitting a large asteroid', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeLargeAsteroid(100, 100); // same position → overlap

    const result = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(result.bulletsToRemove.has(bullet)).toBe(true);
    expect(result.asteroidsToRemove.has(asteroid)).toBe(true);
  });

  it('detects a bullet hitting a medium asteroid', () => {
    const bullet = makeBullet(200, 200);
    const asteroid = makeMediumAsteroid(200, 200);

    const result = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(result.bulletsToRemove.has(bullet)).toBe(true);
    expect(result.asteroidsToRemove.has(asteroid)).toBe(true);
  });

  it('detects a bullet hitting a small asteroid', () => {
    const bullet = makeBullet(300, 300);
    const asteroid = makeSmallAsteroid(300, 300);

    const result = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(result.bulletsToRemove.has(bullet)).toBe(true);
    expect(result.asteroidsToRemove.has(asteroid)).toBe(true);
  });

  it('does not flag a miss', () => {
    const bullet = makeBullet(0, 0);
    const asteroid = makeLargeAsteroid(500, 500); // far away

    const result = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(result.bulletsToRemove.size).toBe(0);
    expect(result.asteroidsToRemove.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — scoring
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — scoring', () => {
  it('awards 20 points for destroying a large (tier 1) asteroid', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeLargeAsteroid(100, 100);

    const { scoreDelta } = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(scoreDelta).toBe(ASTEROID_SCORES[1]); // 20
  });

  it('awards 50 points for destroying a medium (tier 2) asteroid', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeMediumAsteroid(100, 100);

    const { scoreDelta } = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(scoreDelta).toBe(ASTEROID_SCORES[2]); // 50
  });

  it('awards 100 points for destroying a small (tier 3) asteroid', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeSmallAsteroid(100, 100);

    const { scoreDelta } = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(scoreDelta).toBe(ASTEROID_SCORES[3]); // 100
  });

  it('accumulates score from multiple collisions', () => {
    // Two bullets, two asteroids, both hit
    const b1 = makeBullet(100, 100);
    const b2 = makeBullet(500, 500);
    const a1 = makeLargeAsteroid(100, 100); // 20 pts
    const a2 = makeSmallAsteroid(500, 500); // 100 pts

    const { scoreDelta } = processBulletAsteroidCollisions([b1, b2], [a1, a2]);

    expect(scoreDelta).toBe(120);
  });

  it('returns 0 score when nothing collides', () => {
    const bullet = makeBullet(0, 0);
    const asteroid = makeLargeAsteroid(999, 999);

    const { scoreDelta } = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(scoreDelta).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — breakup children
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — breakup children', () => {
  it('spawns 2 children when a large asteroid is hit', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeLargeAsteroid(100, 100);

    const { newAsteroids } = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(newAsteroids).toHaveLength(2);
    for (const child of newAsteroids) {
      expect(child).toBeInstanceOf(Asteroid);
      expect(child.tier).toBe(2);
    }
  });

  it('spawns 2 children when a medium asteroid is hit', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeMediumAsteroid(100, 100);

    const { newAsteroids } = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(newAsteroids).toHaveLength(2);
    for (const child of newAsteroids) {
      expect(child.tier).toBe(3);
    }
  });

  it('spawns no children when a small asteroid is hit', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeSmallAsteroid(100, 100);

    const { newAsteroids } = processBulletAsteroidCollisions([bullet], [asteroid]);

    expect(newAsteroids).toHaveLength(0);
  });

  it('accumulates children from multiple breakups', () => {
    const b1 = makeBullet(100, 100);
    const b2 = makeBullet(500, 500);
    const a1 = makeLargeAsteroid(100, 100); // → 2 tier-2 children
    const a2 = makeMediumAsteroid(500, 500); // → 2 tier-3 children

    const { newAsteroids } = processBulletAsteroidCollisions([b1, b2], [a1, a2]);

    expect(newAsteroids).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — single bullet / one asteroid rule
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — bullet consumption', () => {
  it('a bullet can only destroy one asteroid per tick (first hit wins)', () => {
    // Two asteroids stacked at the same position; one bullet
    const bullet = makeBullet(100, 100);
    const a1 = makeLargeAsteroid(100, 100);
    const a2 = makeMediumAsteroid(100, 100);

    const result = processBulletAsteroidCollisions([bullet], [a1, a2]);

    expect(result.bulletsToRemove.size).toBe(1);
    // Only one of the two asteroids should be destroyed
    expect(result.asteroidsToRemove.size).toBe(1);
    expect(result.asteroidsToRemove.has(a1)).toBe(true); // first in array wins
    expect(result.asteroidsToRemove.has(a2)).toBe(false);
  });

  it('consumed bullet does not test against remaining asteroids', () => {
    // Bullet hits a1 first, should NOT also hit a2
    const bullet = makeBullet(100, 100);
    const a1 = makeLargeAsteroid(100, 100);
    const a2 = makeLargeAsteroid(100, 100);

    const result = processBulletAsteroidCollisions([bullet], [a1, a2]);

    // Only the first asteroid is destroyed
    expect(result.asteroidsToRemove.size).toBe(1);
    expect(result.asteroidsToRemove.has(a1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — child asteroids not tested
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — children immune to triggering bullet', () => {
  it('child asteroids from breakup are NOT tested against any bullet this tick', () => {
    // One bullet destroys a large asteroid → children spawned at same position.
    // A second bullet at that position should NOT hit the children (because
    // children are not added to the test set during iteration).
    const b1 = makeBullet(100, 100);
    const b2 = makeBullet(100, 100); // second bullet, same spot
    const asteroid = makeLargeAsteroid(100, 100);

    const result = processBulletAsteroidCollisions([b1, b2], [asteroid]);

    // Only 1 asteroid destroyed (the parent), children are immune
    expect(result.asteroidsToRemove.size).toBe(1);
    // Only 1 bullet consumed (the one that hit the parent)
    expect(result.bulletsToRemove.size).toBe(1);
    // Children are returned as new asteroids
    expect(result.newAsteroids.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — already-destroyed asteroid skipped
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — skip destroyed asteroids', () => {
  it('a second bullet cannot hit an asteroid already destroyed this tick', () => {
    const b1 = makeBullet(100, 100);
    const b2 = makeBullet(100, 100);
    const asteroid = makeLargeAsteroid(100, 100);

    const result = processBulletAsteroidCollisions([b1, b2], [asteroid]);

    // Asteroid destroyed by b1; b2 should NOT also hit it
    expect(result.asteroidsToRemove.size).toBe(1);
    expect(result.bulletsToRemove.size).toBe(1);
    // b2 survives because there's nothing left to hit
    expect(result.bulletsToRemove.has(b1)).toBe(true);
    expect(result.bulletsToRemove.has(b2)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — empty inputs
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — edge cases', () => {
  it('handles empty bullets array', () => {
    const asteroid = makeLargeAsteroid(100, 100);
    const result = processBulletAsteroidCollisions([], [asteroid]);

    expect(result.bulletsToRemove.size).toBe(0);
    expect(result.asteroidsToRemove.size).toBe(0);
    expect(result.newAsteroids).toHaveLength(0);
    expect(result.scoreDelta).toBe(0);
  });

  it('handles empty asteroids array', () => {
    const bullet = makeBullet(100, 100);
    const result = processBulletAsteroidCollisions([bullet], []);

    expect(result.bulletsToRemove.size).toBe(0);
    expect(result.asteroidsToRemove.size).toBe(0);
    expect(result.newAsteroids).toHaveLength(0);
    expect(result.scoreDelta).toBe(0);
  });

  it('handles both arrays empty', () => {
    const result = processBulletAsteroidCollisions([], []);

    expect(result.bulletsToRemove.size).toBe(0);
    expect(result.asteroidsToRemove.size).toBe(0);
    expect(result.newAsteroids).toHaveLength(0);
    expect(result.scoreDelta).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// processBulletAsteroidCollisions — multi-bullet / multi-asteroid scenarios
// ---------------------------------------------------------------------------

describe('processBulletAsteroidCollisions — complex scenarios', () => {
  it('multiple bullets can each destroy separate asteroids', () => {
    const b1 = makeBullet(100, 100);
    const b2 = makeBullet(400, 400);
    const b3 = makeBullet(700, 700);
    const a1 = makeLargeAsteroid(100, 100);
    const a2 = makeMediumAsteroid(400, 400);
    const a3 = makeSmallAsteroid(700, 700);

    const result = processBulletAsteroidCollisions([b1, b2, b3], [a1, a2, a3]);

    expect(result.bulletsToRemove.size).toBe(3);
    expect(result.asteroidsToRemove.size).toBe(3);
    // 20 + 50 + 100
    expect(result.scoreDelta).toBe(170);
  });

  it('some bullets miss while others hit', () => {
    const bHit = makeBullet(100, 100);
    const bMiss = makeBullet(999, 999);
    const asteroid = makeLargeAsteroid(100, 100);

    const result = processBulletAsteroidCollisions([bHit, bMiss], [asteroid]);

    expect(result.bulletsToRemove.size).toBe(1);
    expect(result.bulletsToRemove.has(bHit)).toBe(true);
    expect(result.bulletsToRemove.has(bMiss)).toBe(false);
    expect(result.asteroidsToRemove.size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// applyCollisionResults
// ---------------------------------------------------------------------------

describe('applyCollisionResults', () => {
  it('removes destroyed bullets and asteroids from arrays', () => {
    const b1 = makeBullet(100, 100);
    const b2 = makeBullet(999, 999); // survivor
    const a1 = makeLargeAsteroid(100, 100);
    const a2 = makeLargeAsteroid(800, 800); // survivor

    const result = processBulletAsteroidCollisions([b1, b2], [a1, a2]);
    const applied = applyCollisionResults([b1, b2], [a1, a2], result);

    expect(applied.bullets).toHaveLength(1);
    expect(applied.bullets[0]).toBe(b2);
    // a1 destroyed → removed; children added
    expect(applied.asteroids).not.toContain(a1);
    expect(applied.asteroids).toContain(a2);
  });

  it('appends child asteroids to the surviving asteroids array', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeLargeAsteroid(100, 100);

    const result = processBulletAsteroidCollisions([bullet], [asteroid]);
    const applied = applyCollisionResults([bullet], [asteroid], result);

    // Parent removed, 2 children added
    expect(applied.asteroids).not.toContain(asteroid);
    expect(applied.asteroids).toHaveLength(2);
    for (const a of applied.asteroids) {
      expect(a.tier).toBe(2);
    }
  });

  it('returns the correct scoreDelta', () => {
    const bullet = makeBullet(100, 100);
    const asteroid = makeMediumAsteroid(100, 100);

    const result = processBulletAsteroidCollisions([bullet], [asteroid]);
    const applied = applyCollisionResults([bullet], [asteroid], result);

    expect(applied.scoreDelta).toBe(50);
  });

  it('does not mutate the original input arrays', () => {
    const b1 = makeBullet(100, 100);
    const a1 = makeLargeAsteroid(100, 100);
    const bullets = [b1];
    const asteroids = [a1];

    const result = processBulletAsteroidCollisions(bullets, asteroids);
    applyCollisionResults(bullets, asteroids, result);

    // Original arrays unchanged
    expect(bullets).toHaveLength(1);
    expect(bullets[0]).toBe(b1);
    expect(asteroids).toHaveLength(1);
    expect(asteroids[0]).toBe(a1);
  });
});
