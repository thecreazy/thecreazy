import { createStage } from './state'
import { paintPastel, layoutPastel } from './pastel'

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

  // WebGL diamond: separate chunk, loaded after everything else. Without
  // WebGL the diamond simply isn't there and the page works as is.
  const canvas = document.getElementById('diamond') as HTMLCanvasElement | null
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  async function initDiamond() {
    if (!canvas) return
    try {
      const { createDiamond } = await import('../diamond/scene')
      const diamond = await createDiamond(canvas, { reducedMotion })
      stage.subscribe(diamond.update)
      document.documentElement.classList.add('has-diamond')
    } catch (e) {
      canvas.remove()
      console.warn('WebGL not available:', e)
    }
  }

  if (document.readyState === 'complete') initDiamond()
  else window.addEventListener('load', () => initDiamond())
}
