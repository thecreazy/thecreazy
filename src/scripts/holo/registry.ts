// Live state of every DOM element that has a WebGL holo surface under it
// ([data-holo]). Written by the DOM side (tilt, hover, focus), read by the
// WebGL side every frame so that the surface follows the element exactly.

export interface HoloSurfaceState {
  /** CSS rotateX / rotateY of the element's face, degrees. */
  tiltX: number
  tiltY: number
  /** 0 = rim only, 1 = fully lit holographic surface. */
  active: number
  /** Highlight position in the element, 0..1 from the top-left corner. */
  pointerX: number
  pointerY: number
}

/** CSS perspective (px) shared by the DOM transform and the shader. */
export const TILT_PERSPECTIVE = 900

const states = new WeakMap<Element, HoloSurfaceState>()

export function holoState(el: Element): HoloSurfaceState {
  let state = states.get(el)
  if (!state) {
    state = { tiltX: 0, tiltY: 0, active: 0, pointerX: 0.5, pointerY: 0.5 }
    states.set(el, state)
  }
  return state
}
