// Watercolour pastel background of the intro: src/assets/pastel.webp.
//
// In the WebGL original a 1024px texture covered an 80×80 plane ~19.4 units
// from the camera, with the view centred at ~(0.5, 0.417) of the texture:
// only a small crop was ever visible, magnified ~4.5×. The asset (painted
// by paintPastel.ts) is that crop only (texture region CROP) at 3× the
// texture's resolution, so it stays sharp; here it is positioned as the
// original plane would be.

const PLANE = 80
const DISTANCE = 19.4
const CENTER_X = 0.5
const CENTER_Y = 0.417
/** Texture region contained in the asset (fractions of the texture). */
const CROP = { x0: 0.2, x1: 0.8, y0: 0.24, y1: 0.6 }

export function layoutPastel(el: HTMLElement) {
  const w = window.innerWidth
  const h = window.innerHeight
  const aspect = w / h
  const fov = aspect < 1 ? 50 + (1 - aspect) * 35 : 50
  const visible = 2 * Math.tan((fov * Math.PI) / 360) * DISTANCE
  // Size of the whole texture on screen.
  const size = (h * PLANE) / visible

  Object.assign(el.style, {
    width: `${(CROP.x1 - CROP.x0) * size}px`,
    height: `${(CROP.y1 - CROP.y0) * size}px`,
    left: `${w / 2 - (CENTER_X - CROP.x0) * size}px`,
    top: `${h / 2 - (CENTER_Y - CROP.y0) * size}px`,
  })
}
