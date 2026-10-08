import Lenis from 'lenis'

// Smooth scrolling for wheels (Lenis). Everything on the site is driven by
// the scroll position: a notched wheel moves it in ~100px steps, so the
// diamond, the horizontal track, the articles and the tower jumped with it.
// Lenis interpolates the wheel input on top of native scrolling (sticky,
// find-in-page, keyboard and assistive tech keep working). Touch keeps the
// native scroll; reduced motion gets no smoothing at all.

let lenis: Lenis | null = null

export function initSmoothScroll(scroller: HTMLElement, onScroll: () => void) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const content = scroller.firstElementChild
  if (!fine || reducedMotion || !content) return null

  lenis = new Lenis({
    wrapper: scroller,
    content,
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
  })

  // Same frame as Lenis moves the page: the stage state (and every layer
  // listening to it) updates before paint, so nothing lags behind.
  lenis.on('scroll', onScroll)

  // Lenis' frame runs first in each frame: it is registered before the
  // WebGL loops, which then render the state it just produced.
  const raf = (time: number) => {
    lenis?.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  return lenis
}

/** Scroll the page to `top`, smoothly through Lenis when it is active. */
export function scrollToY(scroller: HTMLElement, top: number) {
  if (lenis) lenis.scrollTo(top)
  else scroller.scrollTo({ top })
}
