/**
 * Bullet–asteroid collision handler.
 *
 * Provides a pure, unit-testable function that processes collisions between
 * active bullets and active asteroids each update tick.
 *
 * Collision rules:
 * - A bullet can destroy at most one asteroid per tick (first hit wins).
 * - When a bullet hits an asteroid the asteroid breaks up via `asteroid.breakup()`.
 * - Child asteroids spawned from breakup are added to the live asteroid list
 *   but are NOT tested against the bullet that triggered the breakup.
 * - The player's score is incremented by the asteroid's tier point value.
 * - After all checks, bullets and asteroids marked for removal are purged.
 */

import { circlesOverlap } from './collision.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process all bullet–asteroid collisions for a single update tick.
 *
 * This function is intentionally pure (no side-effects on external state) so
 * it can be unit-tested easily.  The caller is responsible for applying the
 * returned mutations to the actual game state.
 *
 * @param {import('./bullet.js').Bullet[]} bullets   – mutable array of active bullets
 * @param {import('./asteroid.js').Asteroid[]} asteroids – mutable array of active asteroids
 * @returns {{
 *   bulletsToRemove: Set<import('./bullet.js').Bullet>,
 *   asteroidsToRemove: Set<import('./asteroid.js').Asteroid>,
 *   newAsteroids: import('./asteroid.js').Asteroid[],
 *   scoreDelta: number,
 * }}
 */
export function processBulletAsteroidCollisions(bullets, asteroids) {
  /** @type {Set<import('./bullet.js').Bullet>} */
  const bulletsToRemove = new Set();

  /** @type {Set<import('./asteroid.js').Asteroid>} */
  const asteroidsToRemove = new Set();

  /** Child asteroids spawned from breakup this tick. */
  const newAsteroids = [];

  /** Total score earned this tick. */
  let scoreDelta = 0;

  // Iterate every bullet against every asteroid that was active at the start
  // of this tick.  The `asteroids` array length is captured before the loop so
  // children appended during this tick are never tested against any bullet.
  const asteroidCount = asteroids.length;

  for (const bullet of bullets) {
    // A single bullet can only destroy one asteroid per tick.
    if (bulletsToRemove.has(bullet)) continue;

    for (let i = 0; i < asteroidCount; i++) {
      const asteroid = asteroids[i];

      // Skip asteroids already destroyed by a previous bullet this tick.
      if (asteroidsToRemove.has(asteroid)) continue;

      if (circlesOverlap(bullet, asteroid)) {
        // Mark bullet as consumed — it cannot hit anything else.
        bulletsToRemove.add(bullet);

        // Mark asteroid for removal.
        asteroidsToRemove.add(asteroid);

        // Break up the asteroid (spawns children or nothing if smallest tier).
        const { children, score } = asteroid.breakup();
        scoreDelta += score;

        // Collect children — they'll be added to the live list after all
        // collision checks are done.
        for (const child of children) {
          newAsteroids.push(child);
        }

        // First collision wins for this bullet; stop checking asteroids.
        break;
      }
    }
  }

  return { bulletsToRemove, asteroidsToRemove, newAsteroids, scoreDelta };
}

/**
 * Apply the results of collision processing to the live game arrays and score.
 *
 * Mutates `bullets` and `asteroids` in-place: removes destroyed entities and
 * appends newly spawned child asteroids.
 *
 * @param {import('./bullet.js').Bullet[]} bullets
 * @param {import('./asteroid.js').Asteroid[]} asteroids
 * @param {{
 *   bulletsToRemove: Set<import('./bullet.js').Bullet>,
 *   asteroidsToRemove: Set<import('./asteroid.js').Asteroid>,
 *   newAsteroids: import('./asteroid.js').Asteroid[],
 *   scoreDelta: number,
 * }} result – return value of `processBulletAsteroidCollisions`
 * @returns {{ bullets: import('./bullet.js').Bullet[], asteroids: import('./asteroid.js').Asteroid[], scoreDelta: number }}
 */
export function applyCollisionResults(bullets, asteroids, result) {
  const { bulletsToRemove, asteroidsToRemove, newAsteroids, scoreDelta } = result;

  // Purge destroyed bullets.
  const survivingBullets = bullets.filter((b) => !bulletsToRemove.has(b));

  // Purge destroyed asteroids, then append children.
  const survivingAsteroids = asteroids.filter((a) => !asteroidsToRemove.has(a));
  for (const child of newAsteroids) {
    survivingAsteroids.push(child);
  }

  return { bullets: survivingBullets, asteroids: survivingAsteroids, scoreDelta };
}
