// Loading screen progress (components/ui/Loader.astro): each named step
// reports when it's ready; when all are, html.is-loading becomes
// html.is-ready, the loader fades out and the diamond fades in. A timeout
// lets the site through anyway if something hangs.

const TIMEOUT = 8000

export function createLoader(steps: string[]) {
  const root = document.documentElement
  const el = document.querySelector<HTMLElement>('[data-loader]')
  const pct = el?.querySelector<HTMLElement>('[data-loader-pct]')
  const pending = new Set(steps)
  const readyCallbacks: (() => void)[] = []
  let finished = false

  function finish() {
    if (finished) return
    finished = true
    if (pct) pct.textContent = '100%'
    root.classList.remove('is-loading')
    root.classList.add('is-ready')
    readyCallbacks.forEach((fn) => fn())
    // Gone from the DOM once faded.
    setTimeout(() => el?.remove(), 1000)
  }

  setTimeout(finish, TIMEOUT)

  return {
    /** Run `fn` once the loader has gone (right away if it already has). */
    onReady(fn: () => void) {
      if (finished) fn()
      else readyCallbacks.push(fn)
    },
    done(step: string) {
      if (!pending.delete(step)) return
      if (pct) pct.textContent = `${Math.round((1 - pending.size / steps.length) * 100)}%`
      if (!pending.size) finish()
    },
  }
}
