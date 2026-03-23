const THEME_VARS = [
  '--color-bg',
  '--color-surface',
  '--color-border',
  '--color-accent',
  '--color-accent2',
  '--color-text',
  '--color-dim',
]

export function populateThemeEditor(): void {
  const editor = document.getElementById('theme-editor')
  if (!editor || editor.children.length > 0) return

  const root = document.documentElement

  THEME_VARS.forEach((v) => {
    const val = getComputedStyle(root).getPropertyValue(v).trim()

    const row = document.createElement('div')
    row.style.cssText =
      'display:flex;align-items:center;gap:16px;padding:8px 0;border-bottom:1px solid var(--color-border)'

    const swatch = document.createElement('input')
    swatch.type = 'color'
    swatch.value = val.startsWith('#') ? val : '#888888'
    swatch.style.cssText = 'width:32px;height:32px;border:none;background:none;cursor:none;padding:0'
    swatch.addEventListener('input', () => root.style.setProperty(v, swatch.value))

    const name = document.createElement('span')
    name.textContent = v
    name.style.cssText =
      'font-size:11px;color:var(--color-dim);flex:1;font-family:"IBM Plex Mono",monospace'

    const current = document.createElement('span')
    current.textContent = val
    current.style.cssText = 'font-size:11px;color:var(--color-accent);font-family:"IBM Plex Mono",monospace'

    row.appendChild(swatch)
    row.appendChild(name)
    row.appendChild(current)
    editor.appendChild(row)
  })
}
