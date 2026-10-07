import { createStage } from './state'
import { layoutPastel } from './pastel'
import { createLoader } from './loader'
import { initWorks } from '../works'
import { initArticles } from '../articles'
import { initCv } from '../cv'
import { initCursor } from '../cursor'

const scroller = document.getElementById('scroll')
const pastel = document.getElementById('pastel-img')
const sections = ['hero', 'projects', 'blog', 'cv']
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => !!el)

// Loading screen: what has to be ready before the site shows.
const loader = createLoader(['fonts', 'pastel', 'page', 'diamond', 'holo'])
document.fonts.ready.then(() => loader.done('fonts'))
if (document.readyState === 'complete') loader.done('page')
else window.addEventListener('load', () => loader.done('page'))

if (scroller && sections.length === 4) {
  const stage = createStage(scroller, sections)

  if (pastel instanceof HTMLImageElement) {
    layoutPastel(pastel)
    window.addEventListener('resize', () => layoutPastel(pastel))
    pastel
      .decode()
      .catch(() => undefined)
      .then(() => loader.done('pastel'))
  } else {
    loader.done('pastel')
  }

  // Nav diamonds
  const nav = document.querySelector<HTMLElement>('.section-nav')
  const dots = document.querySelectorAll<HTMLElement>('[data-nav-dot]')
  stage.subscribe(({ active }) => {
    nav?.classList.toggle('is-intro', active === 0)
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === active)
      if (i === active) d.setAttribute('aria-current', 'true')
      else d.removeAttribute('aria-current')
    })
  })

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Entrance of [data-reveal-group] blocks, once, when they scroll into view.
  // Scrolling fast (more than ~1.5 screens per second) skips the animation:
  // whoever flies past still finds the text there.
  if (!reducedMotion) {
    let speed = 0
    let lastY = scroller.scrollTop
    let lastT = performance.now()
    scroller.addEventListener(
      'scroll',
      () => {
        const now = performance.now()
        const dt = Math.max(now - lastT, 1)
        // Smoothed, in viewports per second.
        const v = (Math.abs(scroller.scrollTop - lastY) / scroller.clientHeight / dt) * 1000
        speed = speed * 0.6 + v * 0.4
        lastY = scroller.scrollTop
        lastT = now
      },
      { passive: true }
    )
    const isFast = () => speed > 1.5 && performance.now() - lastT < 150

    const groups = document.querySelectorAll<HTMLElement>('[data-reveal-group]')
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add(isFast() ? 'is-shown' : 'is-revealed')
          observer.unobserve(e.target)
        }),
      { root: scroller, threshold: 0.15 }
    )
    groups.forEach((g) => observer.observe(g))
    document.documentElement.classList.add('can-reveal')
  }

  // What i code: pinned horizontal track.
  initWorks(stage, scroller, reducedMotion)

  // What i write: pinned stage, articles crossfade with the scroll.
  initArticles(stage)

  // My cv: the list follows the tower.
  initCv(stage)

  // Custom cursor (fine pointers only).
  initCursor(stage, reducedMotion)

  // WebGL layers: separate chunks, started right away (the loader covers
  // them). Without WebGL the diamond and the holo surfaces simply aren't
  // there and the page works as is.
  const diamondCanvas = document.getElementById('diamond') as HTMLCanvasElement | null
  const holoCanvas = document.getElementById('holo') as HTMLCanvasElement | null

  async function initDiamond() {
    if (!diamondCanvas) return loader.done('diamond')
    try {
      const { createDiamond } = await import('../diamond/scene')
      const diamond = await createDiamond(diamondCanvas, { reducedMotion })
      stage.subscribe(diamond.update)
      document.documentElement.classList.add('has-diamond')
      // The CV section becomes a pinned track: positions changed.
      stage.refresh()
    } catch (e) {
      diamondCanvas.remove()
      console.warn('WebGL not available:', e)
    }
    loader.done('diamond')
  }

  async function initHolo() {
    if (!holoCanvas) return loader.done('holo')
    try {
      const { createHoloSurfaces } = await import('../holo/surfaces')
      const holo = await createHoloSurfaces(holoCanvas, { reducedMotion })
      stage.subscribe(holo.update)
      document.documentElement.classList.add('has-holo')
    } catch (e) {
      holoCanvas.remove()
      console.warn('Holo surfaces not available:', e)
    }
    loader.done('holo')
  }

  initDiamond()
  initHolo()
} else {
  ;['pastel', 'diamond', 'holo'].forEach((step) => loader.done(step))
}
