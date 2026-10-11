/*
 * Fixed, evenly scattered star positions for the canvas
 * backgrounds (demo + game), as fractions of the canvas size.
 * A seeded generator keeps them identical every frame, so
 * the stars don't flicker or line up in diagonal streaks.
 */
function seededRandom(seed: number) {
  let state = seed;

  return () => {
    // Mulberry32
    state = (state + 0x6d2b79f5) | 0;

    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(4153);

export const STARS = Array.from({ length: 90 }, () => ({
  x: random(),
  y: random(),
  size: random() < 0.25 ? 2.5 : 1.5,
}));
