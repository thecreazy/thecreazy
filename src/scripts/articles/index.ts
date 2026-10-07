import type { Stage } from '../stage/state'

// "What i write": the stage is pinned under the diamond while a tall track
// scrolls by; each step of the track crossfades to the next article. Every
// change is broadcast as an `article:change` event so the diamond can show
// the same title on its band.

export interface ArticleChange {
  title: string
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export function initArticles(stage: Stage) {
  const track = document.querySelector<HTMLElement>('[data-articles-track]')
  const root = track?.querySelector<HTMLElement>('[data-articles]')
  if (!track || !root) return
  const articles = [...root.querySelectorAll<HTMLElement>('[data-article]')]
  const steps = [...root.querySelectorAll<HTMLElement>('[data-article-step]')]
  const read = root.querySelector<HTMLAnchorElement>('[data-article-read]')
  if (!articles.length) return

  let current = 0

  function show(index: number) {
    if (index === current) return
    current = index
    articles.forEach((a, i) => {
      a.classList.toggle('is-active', i === current)
      if (i === current) a.removeAttribute('aria-hidden')
      else a.setAttribute('aria-hidden', 'true')
    })
    steps.forEach((s, i) => {
      if (i === current) s.setAttribute('aria-current', 'true')
      else s.removeAttribute('aria-current')
    })
    const { title = '', url } = articles[current].dataset
    root!.dataset.current = title
    if (read && url) {
      read.href = url
      read.setAttribute('aria-label', `Read “${title}”`)
    }
    window.dispatchEvent(new CustomEvent<ArticleChange>('article:change', { detail: { title } }))
  }

  stage.subscribe(() => {
    // 0 when the stage pins (track top at the sticky offset), 1 when it
    // un-pins (track bottom reaches the stage bottom).
    const r = track.getBoundingClientRect()
    const stickTop = parseFloat(getComputedStyle(root).top) || 0
    const travel = Math.max(1, r.height - root.offsetHeight)
    const progress = clamp01((stickTop - r.top) / travel) * articles.length
    const index = Math.min(articles.length - 1, Math.floor(progress))
    show(index)
    steps[index]?.style.setProperty('--progress', clamp01(progress - index).toFixed(3))
  })
}
