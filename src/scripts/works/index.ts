import type { Stage } from '../stage/state'
import { holoState, TILT_PERSPECTIVE } from '../holo/registry'
import { scrollToY } from '../stage/smooth'

// "What i code": the section pins to the screen and vertical scroll drives
// a horizontal track of projects. The project closest to the centre (or
// under the mouse) lights up and tilts like a holographic card.

const MAX_TILT_X = 7
const MAX_TILT_Y = 11
const EASE = 0.12

interface Target {
  tiltX: number
  tiltY: number
  pointerX: number
  pointerY: number
  hovered: boolean
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function initWorks(stage: Stage, scroller: HTMLElement, reducedMotion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-works]')
  const pin = section?.querySelector<HTMLElement>('[data-works-pin]')
  const track = section?.querySelector<HTMLElement>('[data-works-track]')
  const counter = section?.querySelector<HTMLElement>('[data-works-current]')
  if (!section || !pin || !track) return

  // Without motion the section stays a plain vertical list (CSS default).
  if (reducedMotion) return
  document.documentElement.classList.add('works-horizontal')

  const items = [...section.querySelectorAll<HTMLElement>('[data-work]')]
  const surfaces = [...section.querySelectorAll<HTMLElement>('[data-holo]')]
  const targets = new Map<HTMLElement, Target>()
  surfaces.forEach((el) =>
    targets.set(el, { tiltX: 0, tiltY: 0, pointerX: 0.5, pointerY: 0.5, hovered: false })
  )

  // ─── pinned horizontal scroll ────────────────────────────────────────────
  let distance = 0

  function measure() {
    distance = Math.max(0, track!.scrollWidth - pin!.clientWidth)
    section!.style.height = `${pin!.clientHeight + distance}px`
    stage.refresh()
  }

  measure()
  window.addEventListener('resize', measure)
  document.fonts.ready.then(measure)

  let focused = -1

  stage.subscribe(({ works }) => {
    track.style.transform = `translate3d(${-works * distance}px, 0, 0)`

    // The project closest to the centre of the screen is the focused one.
    const centre = window.innerWidth / 2
    let best = Infinity
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const d = Math.abs(r.left + r.width / 2 - centre)
      if (d < best) {
        best = d
        focused = i
      }
    })
    if (counter) counter.textContent = String(focused + 1).padStart(2, '0')
  })

  // ─── tilt + highlight (mouse) ────────────────────────────────────────────
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    surfaces.forEach((el) => {
      const target = targets.get(el)!
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect()
        const nx = clamp01((e.clientX - r.left) / r.width)
        const ny = clamp01((e.clientY - r.top) / r.height)
        target.hovered = true
        target.pointerX = nx
        target.pointerY = ny
        // Text surfaces only get the moving highlight, not the tilt.
        if (el.hasAttribute('data-holo-text')) return
        target.tiltY = (nx - 0.5) * 2 * MAX_TILT_Y
        target.tiltX = -(ny - 0.5) * 2 * MAX_TILT_X
      })
      el.addEventListener('pointerleave', () => {
        Object.assign(target, { tiltX: 0, tiltY: 0, hovered: false })
      })
    })
  }

  // ─── keyboard: bring the focused project into view ───────────────────────
  section.addEventListener('focusin', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-holo]')
    pin.scrollLeft = 0
    if (!el || !distance) return
    const centre = el.offsetLeft + el.offsetWidth / 2
    const p = clamp01((centre - pin.clientWidth / 2) / distance)
    scrollToY(scroller, section.offsetTop + p * distance)
  })

  // ─── per-frame easing ────────────────────────────────────────────────────
  function tick() {
    requestAnimationFrame(tick)
    const r = section!.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight) return

    const centre = window.innerWidth / 2
    surfaces.forEach((el) => {
      const target = targets.get(el)!
      const state = holoState(el)
      const rect = el.getBoundingClientRect()
      const isFocused = items[focused] === el

      // Without the mouse, the highlight drifts with the horizontal position.
      const px = target.hovered
        ? target.pointerX
        : clamp01(0.5 + (centre - (rect.left + rect.width / 2)) / rect.width)
      const py = target.hovered ? target.pointerY : 0.35

      state.tiltX = lerp(state.tiltX, target.tiltX, EASE)
      state.tiltY = lerp(state.tiltY, target.tiltY, EASE)
      state.pointerX = lerp(state.pointerX, px, EASE)
      state.pointerY = lerp(state.pointerY, py, EASE)
      state.active = lerp(state.active, target.hovered || isFocused ? 1 : 0, EASE * 0.6)

      const face = el.querySelector<HTMLElement>('[data-holo-face]')
      if (face) {
        face.style.transform = `perspective(${TILT_PERSPECTIVE}px) rotateX(${state.tiltX.toFixed(2)}deg) rotateY(${state.tiltY.toFixed(2)}deg)`
      }
    })
  }
  tick()
}
