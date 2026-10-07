import type { Stage } from '../stage/state'
import { LANDED, OUTRO, slabProgress } from './build'

// My cv: the list mirrors the tower. Each entry lights up when its slab has
// landed; the most recent landed one is the current one. Once the tower is
// built, the closing words take the list's place.

export function initCv(stage: Stage) {
  // Contact address: assembled here, never written whole in the HTML.
  document.querySelectorAll<HTMLAnchorElement>('[data-mail-user]').forEach((a) => {
    const address = `${a.dataset.mailUser}@${a.dataset.mailDomain}`
    a.href = `mailto:${address}`
    a.textContent = address
  })

  const section = document.getElementById('cv')
  const entries = [...document.querySelectorAll<HTMLElement>('[data-cv-entry]')]
  const n = entries.length
  if (!n) return

  stage.subscribe(({ build }) => {
    section?.classList.toggle('is-outro', build >= OUTRO)
    let current = -1
    // DOM order is newest first; slab k = 0 is the oldest.
    entries.forEach((el, i) => {
      const landed = slabProgress(build, n - 1 - i, n) >= LANDED
      el.classList.toggle('is-landed', landed)
      if (landed && current === -1) current = i
    })
    entries.forEach((el, i) => el.classList.toggle('is-current', i === current))
  })
}
