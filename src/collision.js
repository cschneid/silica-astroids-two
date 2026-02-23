/**
 * Collision detection utilities.
 *
 * Provides circle-circle overlap testing used by the game's collision system.
 * All entities (asteroids, bullets, ship) are modelled as circles for the
 * purposes of collision detection.
 */

/**
 * Test whether two circles overlap.
 *
 * @param {{ x: number, y: number, radius: number }} a – first circle
 * @param {{ x: number, y: number, radius: number }} b – second circle
 * @returns {boolean} true if the circles overlap (touching counts as overlap)
 */
export function circlesOverlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const radiiSum = a.radius + b.radius;
  return distSq <= radiiSum * radiiSum;
}
