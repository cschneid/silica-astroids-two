/**
 * Asteroid entity module.
 *
 * Defines the Asteroid class used in the game.  Asteroids come in three tiers
 * (1 = large, 2 = medium, 3 = small) and can break into smaller children when
 * destroyed.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Point values awarded when an asteroid of a given tier is destroyed. */
export const ASTEROID_SCORES = { 1: 20, 2: 50, 3: 100 };

/** Radius (in CSS pixels) for each asteroid tier. */
export const TIER_RADII = { 1: 40, 2: 20, 3: 10 };

/**
 * Number of vertices used when generating the jagged polygon shape.
 * More vertices → more detailed / irregular outline.
 */
const SHAPE_VERTEX_COUNT = 10;

/**
 * How much each vertex can deviate from the base radius, expressed as a
 * fraction of the radius.  A value of 0.3 means vertices sit between
 * 0.7 × radius and 1.3 × radius.
 */
const SHAPE_JITTER = 0.3;

/** Angular-velocity range for newly created asteroids (radians / second). */
const MIN_ANGULAR_VELOCITY = -2;
const MAX_ANGULAR_VELOCITY = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a random jagged polygon shape for an asteroid.
 *
 * The shape is an array of `{ x, y }` offsets relative to the asteroid's
 * centre.  Points are distributed evenly around a circle, with each point's
 * distance from the centre randomly jittered so the outline looks rough and
 * natural.
 *
 * @param {number} radius – base radius to build the shape around
 * @returns {{ x: number, y: number }[]} array of vertex offsets
 */
export function generateAsteroidShape(radius) {
  const vertices = [];
  const angleStep = (Math.PI * 2) / SHAPE_VERTEX_COUNT;

  for (let i = 0; i < SHAPE_VERTEX_COUNT; i++) {
    const angle = i * angleStep;
    const jitter = 1 - SHAPE_JITTER + Math.random() * (SHAPE_JITTER * 2);
    const r = radius * jitter;
    vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }

  return vertices;
}

/**
 * Return a random angular velocity within the standard spawning range.
 * @returns {number} angular velocity in radians / second
 */
function randomAngularVelocity() {
  return (
    MIN_ANGULAR_VELOCITY +
    Math.random() * (MAX_ANGULAR_VELOCITY - MIN_ANGULAR_VELOCITY)
  );
}

// ---------------------------------------------------------------------------
// Asteroid class
// ---------------------------------------------------------------------------

export class Asteroid {
  /**
   * @param {object} opts
   * @param {number} opts.tier        – 1 (large), 2 (medium), or 3 (small)
   * @param {number} opts.x           – initial x position (CSS pixels)
   * @param {number} opts.y           – initial y position (CSS pixels)
   * @param {number} opts.vx          – horizontal velocity (px / s)
   * @param {number} opts.vy          – vertical velocity (px / s)
   * @param {number} [opts.rotation]  – initial rotation angle (radians)
   * @param {number} [opts.angularVelocity] – spin speed (rad / s)
   * @param {{ x: number, y: number }[]} [opts.shape] – custom shape; auto-generated if omitted
   */
  constructor({ tier, x, y, vx, vy, rotation, angularVelocity, shape }) {
    if (tier < 1 || tier > 3) {
      throw new RangeError(`Invalid asteroid tier: ${tier} (must be 1–3)`);
    }

    /** @type {1|2|3} */
    this.tier = tier;

    /** Radius derived from tier. */
    this.radius = TIER_RADII[tier];

    /** Position. */
    this.x = x;
    this.y = y;

    /** Velocity vector. */
    this.vx = vx;
    this.vy = vy;

    /** Current rotation angle (radians). */
    this.rotation = rotation ?? 0;

    /** Angular velocity (radians / second). */
    this.angularVelocity = angularVelocity ?? randomAngularVelocity();

    /** Jagged-polygon shape offsets. */
    this.shape = shape ?? generateAsteroidShape(this.radius);
  }

  // -------------------------------------------------------------------------
  // Breakup
  // -------------------------------------------------------------------------

  /**
   * Break this asteroid into smaller children (or score points if smallest).
   *
   * - Tier 1 → 2 tier-2 children
   * - Tier 2 → 2 tier-3 children
   * - Tier 3 → no children (fully destroyed)
   *
   * The caller is responsible for removing the parent asteroid from whatever
   * entity list it belongs to and adding the returned children.
   *
   * @returns {{ children: Asteroid[], score: number }}
   */
  breakup() {
    const score = ASTEROID_SCORES[this.tier];

    // Smallest tier: no children to spawn.
    if (this.tier === 3) {
      return { children: [], score };
    }

    const childTier = /** @type {1|2|3} */ (this.tier + 1);
    const children = [];

    for (let i = 0; i < 2; i++) {
      // --- Position offset ---------------------------------------------------
      // Each child is offset from the parent centre by ±(radius * 0.3) on each
      // axis so they don't stack perfectly on top of each other.
      const offsetX = (Math.random() * 2 - 1) * this.radius * 0.3;
      const offsetY = (Math.random() * 2 - 1) * this.radius * 0.3;

      // --- Velocity ----------------------------------------------------------
      // Rotate the parent velocity by a random angle in
      //   [-30°, -15°] ∪ [15°, 30°]
      // and scale by a factor in [1.2, 1.5].
      const angleDeg = randomDeflectionAngle();
      const angleRad = (angleDeg * Math.PI) / 180;
      const speedScale = 1.2 + Math.random() * 0.3; // [1.2, 1.5)

      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const childVx = (this.vx * cos - this.vy * sin) * speedScale;
      const childVy = (this.vx * sin + this.vy * cos) * speedScale;

      children.push(
        new Asteroid({
          tier: childTier,
          x: this.x + offsetX,
          y: this.y + offsetY,
          vx: childVx,
          vy: childVy,
          // Fresh random shape & spin for each child.
        }),
      );
    }

    return { children, score };
  }
}

// ---------------------------------------------------------------------------
// Private helpers (below class so they don't clutter the public API)
// ---------------------------------------------------------------------------

/**
 * Return a random deflection angle from the union [-30, -15] ∪ [15, 30].
 *
 * One child should go "left-ish" and the other "right-ish", but this function
 * itself just picks uniformly from the full union; the caller can rely on two
 * independent draws to naturally produce diverging trajectories.
 *
 * @returns {number} angle in degrees
 */
function randomDeflectionAngle() {
  // The union has total length 30 (15 + 15).  Pick a uniform value in [0, 30)
  // and map it to the two intervals.
  const t = Math.random() * 30;
  if (t < 15) {
    return -30 + t; // maps to [-30, -15)
  }
  return 15 + (t - 15); // maps to [15, 30)
}
