// Pixel ratio for the WebGL canvases: phones get 1.5 at most, plenty at
// their density and ~44% fewer pixels to shade than 2 (battery, heat).
export const canvasPixelRatio = () =>
  Math.min(window.devicePixelRatio, window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2)
