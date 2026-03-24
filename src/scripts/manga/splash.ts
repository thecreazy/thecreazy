import { SPLASH_ID } from './constants'

export function showSplash(): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement('div')
    el.id = SPLASH_ID
    el.innerHTML = `
      <div class="splash-title">MANGA MODE<br>ACTIVATED!</div>
      <div class="splash-sub">[ ↑↑↓↓←→←→BA ]</div>
    `
    document.body.appendChild(el)
    setTimeout(resolve, 1400)
  })
}
