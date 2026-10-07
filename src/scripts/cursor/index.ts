import type { Stage, StageState } from '../stage/state'
import { LANDED, slabProgress } from '../cv/build'

// Custom cursor (see components/ui/Cursor.astro): the diamond follows the
// pointer with a little lag, wears the skin of the current section, and on
// links opens into a frame with an orbiting ticker naming the action.

const EASE = 0.3
const RING_CHARS = 34

const skinFor = (st: StageState) =>
  st.cv > 0.5 ? 'cv' : st.frame > 0.5 ? 'frame' : st.holo > 0.5 ? 'holo' : 'intro'

// What the ticker says on a link: data-cursor, else aria-label, else text.
function labelFor(el: HTMLElement) {
  const raw = el.dataset.cursor || el.getAttribute('aria-label') || el.textContent || 'open'
  const text = raw.replace(/[→↓/]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 28)
  // Repeat it all around the ring.
  const unit = `${text} · `
  return unit.repeat(Math.max(1, Math.ceil(RING_CHARS / unit.length)))
}

export function initCursor(stage: Stage, reducedMotion: boolean) {
  if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  const dot = document.querySelector<HTMLElement>('[data-cursor-dot]')
  const ring = document.querySelector<HTMLElement>('[data-cursor-ring]')
  const label = document.querySelector<SVGTextPathElement>('[data-cursor-label]')
  const diamond = dot?.querySelector<HTMLElement>('.cursor-diamond')
  if (!dot || !ring || !label || !diamond) return

  document.documentElement.classList.add('has-cursor')

  let x = -100
  let y = -100
  let tx = x
  let ty = y
  let seen = false

  const setVisible = (v: boolean) => {
    dot.classList.toggle('is-visible', v)
    ring.classList.toggle('is-visible', v)
  }

  document.addEventListener('pointermove', (e) => {
    tx = e.clientX
    ty = e.clientY
    if (!seen) {
      seen = true
      x = tx
      y = ty
    }
    setVisible(true)
  })
  document.documentElement.addEventListener('pointerleave', () => setVisible(false))
  document.documentElement.addEventListener('pointerenter', () => seen && setVisible(true))

  // Links and buttons: open the frame and name the action.
  let target: HTMLElement | null = null
  document.addEventListener('pointerover', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('a, button')
    if (el === target) return
    target = el
    dot.classList.toggle('is-hover', !!el)
    ring.classList.toggle('is-hover', !!el)
    if (el) label.textContent = labelFor(el)
  })

  // Skin of the section + a quarter turn every time a CV slab lands.
  const entries = document.querySelectorAll('[data-cv-entry]').length
  let landed = 0
  stage.subscribe((st) => {
    dot.dataset.skin = skinFor(st)
    let count = 0
    for (let k = 0; k < entries; k++) if (slabProgress(st.build, k, entries) >= LANDED) count++
    if (count > landed && dot.dataset.skin === 'cv') {
      diamond.animate([{ rotate: '0deg' }, { rotate: '90deg' }], {
        duration: 450,
        easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      })
    }
    landed = count
  })

  function tick() {
    requestAnimationFrame(tick)
    x += (tx - x) * EASE
    y += (ty - y) * EASE
    const t = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    dot!.style.transform = t
    ring!.style.transform = t
  }
  tick()
}
