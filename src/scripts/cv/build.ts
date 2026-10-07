// Timing of the CV tower, shared by the WebGL tower and the DOM list so the
// two always agree. `build` is the progress through the pinned CV section.

/** Slabs land during [0, BUILD_END]; the rest is the final quarter turn. */
export const BUILD_END = 0.8

/** A slab counts as landed (and its entry lights up) past this progress. */
export const LANDED = 0.6

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/** 0 → 1 while slab k (0 = oldest, at the bottom) of n drops into place. */
export const slabProgress = (build: number, k: number, n: number) =>
  clamp01((build / BUILD_END) * n - k)

/** 0 → 1 during the final turn of the finished tower. */
export const turnProgress = (build: number) => clamp01((build - BUILD_END) / (1 - BUILD_END))
