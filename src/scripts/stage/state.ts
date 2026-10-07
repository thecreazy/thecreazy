// Single source of truth for the scroll-driven "stage": every visual layer
// (pastel background, text colour, top mask, nav diamonds, WebGL diamond)
// reads the same normalised values computed here from section positions.

export interface StageState {
  /** 0 → 1 while the diamond rises from the centre to the top. */
  move: number
  /** 1 on the pastel intro, 0 once the night background has taken over. */
  intro: number
  /** intro skin → holographic skin (what i code). */
  holo: number
  /** progress through the pinned horizontal track of what i code. */
  works: number
  /** holographic skin → empty frame (what i write). */
  frame: number
  /** frame → white skin (my cv). */
  cv: number
  /** final exit: spin, grow, dissolve. */
  exit: number
  /** index of the section currently in view. */
  active: number
}

export type StageListener = (state: StageState) => void

export type Stage = ReturnType<typeof createStage>

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smoothstep = (t: number) => t * t * (3 - 2 * t)

// Progress of a transition driven by a section's top edge: 0 when the edge
// sits `start` viewports from the top, 1 after it travelled `len` more.
const ramp = (top: number, vh: number, start: number, len: number) =>
  clamp01((start * vh - top) / (len * vh))

export function createStage(scroller: HTMLElement, sections: HTMLElement[]) {
  const [, projects, blog, cv] = sections
  const listeners = new Set<StageListener>()
  const root = document.documentElement
  let state: StageState
  let queued = false

  function compute(): StageState {
    const vh = scroller.clientHeight
    const top = (el: HTMLElement) => el.getBoundingClientRect().top

    const projectsTop = top(projects)
    const blogTop = top(blog)
    const cvTop = top(cv)

    let active = 0
    sections.forEach((el, i) => {
      if (top(el) <= vh * 0.5) active = i
    })

    return {
      move: smoothstep(clamp01(scroller.scrollTop / (vh * 0.6))),
      intro: 1 - ramp(projectsTop, vh, 1.1, 0.4),
      holo: ramp(projectsTop, vh, 0.7, 0.3),
      works: clamp01(-projectsTop / Math.max(1, projects.offsetHeight - vh)),
      frame: ramp(blogTop, vh, 0.7, 0.3),
      cv: ramp(cvTop, vh, 0.7, 0.3),
      exit: ramp(cvTop, vh, 0.3, 0.6),
      active,
    }
  }

  function update() {
    queued = false
    state = compute()
    root.style.setProperty('--intro', state.intro.toFixed(4))
    root.style.setProperty('--veil', (state.move * (1 - state.exit)).toFixed(4))
    listeners.forEach((fn) => fn(state))
  }

  function schedule() {
    if (queued) return
    queued = true
    requestAnimationFrame(update)
  }

  scroller.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  update()

  return {
    subscribe(fn: StageListener) {
      listeners.add(fn)
      fn(state)
      return () => listeners.delete(fn)
    },
    refresh: schedule,
  }
}
