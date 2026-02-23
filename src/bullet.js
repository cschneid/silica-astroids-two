/**
 * Bullet entity module.
 *
 * Defines the Bullet class used in the game.  Bullets are small, fast-moving
 * projectiles fired by the player's ship.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Radius (CSS pixels) used for bullet collision detection. */
export const BULLET_RADIUS = 3;

// ---------------------------------------------------------------------------
// Bullet class
// ---------------------------------------------------------------------------

export class Bullet {
  /**
   * @param {object} opts
   * @param {number} opts.x  – initial x position (CSS pixels)
   * @param {number} opts.y  – initial y position (CSS pixels)
   * @param {number} opts.vx – horizontal velocity (px / s)
   * @param {number} opts.vy – vertical velocity (px / s)
   */
  constructor({ x, y, vx, vy }) {
    /** Position. */
    this.x = x;
    this.y = y;

    /** Velocity vector. */
    this.vx = vx;
    this.vy = vy;

    /** Collision radius. */
    this.radius = BULLET_RADIUS;
  }
}
