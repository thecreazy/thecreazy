import { createStage } from './state'
import { paintPastel, layoutPastel } from './pastel'
import { initWorks } from '../works'

const scroller = document.getElementById('scroll')
const pastel = document.getElementById('pastel-canvas') as HTMLCanvasElement | null
const sections = ['hero', 'projects', 'blog', 'cv']
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => !!el)

if (scroller && sections.length === 4) {
  const stage = createStage(scroller, sections)

  if (pastel) {
    paintPastel(pastel)
    layoutPastel(pastel)
    window.addEventListener('resize', () => layoutPastel(pastel))
  }

  // Nav diamonds
  const dots = document.querySelectorAll<HTMLElement>('[data-nav-dot]')
  stage.subscribe(({ active }) => {
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === active)
      if (i === active) d.setAttribute('aria-current', 'true')
      else d.removeAttribute('aria-current')
    })
  })

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Entrance of [data-reveal-group] blocks, once, when they scroll into view.
  if (!reducedMotion) {
    const groups = document.querySelectorAll<HTMLElement>('[data-reveal-group]')
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('is-revealed')
          observer.unobserve(e.target)
        }),
      { root: scroller, threshold: 0.2 }
    )
    groups.forEach((g) => observer.observe(g))
    document.documentElement.classList.add('can-reveal')
  }

  // What i code: pinned horizontal track.
  initWorks(stage, scroller, reducedMotion)

  // WebGL layers: separate chunks, loaded after everything else. Without
  // WebGL the diamond and the holo surfaces simply aren't there and the page
  // works as is.
  const diamondCanvas = document.getElementById('diamond') as HTMLCanvasElement | null
  const holoCanvas = document.getElementById('holo') as HTMLCanvasElement | null

  async function initDiamond() {
    if (!diamondCanvas) return
    try {
      const { createDiamond } = await import('../diamond/scene')
      const diamond = await createDiamond(diamondCanvas, { reducedMotion })
      stage.subscribe(diamond.update)
      document.documentElement.classList.add('has-diamond')
    } catch (e) {
      diamondCanvas.remove()
      console.warn('WebGL not available:', e)
    }
  }

  async function initHolo() {
    if (!holoCanvas) return
    try {
      const { createHoloSurfaces } = await import('../holo/surfaces')
      const holo = await createHoloSurfaces(holoCanvas, { reducedMotion })
      stage.subscribe(holo.update)
      document.documentElement.classList.add('has-holo')
    } catch (e) {
      holoCanvas.remove()
      console.warn('Holo surfaces not available:', e)
    }
  }

  const initWebGL = () => {
    initDiamond()
    initHolo()
  }
  if (document.readyState === 'complete') initWebGL()
  else window.addEventListener('load', initWebGL)
}
