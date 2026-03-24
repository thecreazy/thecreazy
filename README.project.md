# canellariccardo.it — Project README

## The idea

The core concept hasn't changed since day one: the **README.md** is the single source of truth.
Everything you see on the site — name, tagline, projects, blog posts, CV entries — is parsed from
the GitHub README at build time. Update the README, the site updates automatically.

## v1 → v2: the Astro revamp (2024)

The original site was a custom Node.js pipeline (Markdown → showdown → HTML, Less for styles),
hosted on GCP Cloud Run behind a regional load balancer and Cloudflare for SSL. It worked, but
cost ~28 EUR/month for a static page. The whole stack was replaced with **Astro + Vercel** — same
features, zero cost.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | [Astro 4](https://astro.build) (static output) |
| Styling | [Tailwind CSS](https://tailwindcss.com) + scoped component CSS |
| 3D background | [Three.js](https://threejs.org) — GLSL shader, lazy-loaded |
| OG image | [Satori](https://github.com/vercel/satori) + [@resvg/resvg-js](https://github.com/yisibl/resvg-js) |
| Sitemap | [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) |
| Package manager | [pnpm](https://pnpm.io) |
| Linting | [ESLint](https://eslint.org) (flat config, typescript-eslint, eslint-plugin-astro) |
| Formatting | [Prettier](https://prettier.io) + prettier-plugin-astro |
| Releases | [Changesets](https://github.com/changesets/changesets) |
| Hosting | [Vercel](https://vercel.com) |

## Architecture

```
README.md (GitHub)
       │
       ▼
src/lib/parseReadme.ts   ← parses MD into typed data at build time
       │
       ▼
src/pages/index.astro    ← single page, data passed to section components
       │
       ├── Hero.astro
       ├── Projects.astro
       ├── Blog.astro
       └── CV.astro
```

**Generated at build time:**
- `/og.png` — 1200×630 OG image via Satori (uses local `.woff` fonts)
- `/sitemap-index.xml` + `/sitemap-0.xml` — via @astrojs/sitemap
- `/robots.txt` — static file in `public/`

## Features

### Themes
Three visual modes, toggled at runtime and persisted in `localStorage`:
- **Dark** — default, dark terminal phosphor aesthetic
- **Light** — high-contrast, inverted palette
- **Manga mode** — easter egg activated via Konami code (`↑↑↓↓←→←→BA`). Grayscale filter,
  halftone screentone overlay, speed lines, speech bubbles (oval / spiky burst / jagged shout),
  blush marks, floating SFX text. Loaded 100% on-demand via dynamic import — zero bundle cost
  until activated.

### Custom cursor
Blinking caret cursor (CSS + SVG). Transforms into a circle outline on hover over interactive
elements. Hidden on touch devices.

### WebGL background
A GLSL noise shader rendered via Three.js on a full-screen canvas. Responds to theme changes via
`MutationObserver`. Lazy-loaded after `window.load` in a **separate JS chunk** — does not affect
the critical rendering path.

### Dev mode panel
Hidden overlay (`Ctrl+Shift+D`), with four tabs:
- **SOURCE** — raw page HTML
- **PERF** — live FPS counter, LCP, memory usage, WebGL status
- **THEME** — live CSS variable editor with color pickers
- **MATRIX** — Matrix rain animation

## Performance & accessibility

Lighthouse scores (local static build):

| Category | Score |
|---|---|
| Performance | 97–98 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

Key optimisations applied:
- Google Fonts loaded non-render-blocking (`media="print"` → `onload` swap, `display=optional`)
- Three.js split into a separate lazy chunk (`import()` instead of static import) — main JS bundle
  went from **454 KB to 1.8 KB**
- All font sizes ≥ 12px (WCAG legibility)
- Color contrast ratios ≥ 4.5:1 on both themes (WCAG AA)
- Nav dot touch targets expanded to 48×48px via `::before` pseudo-element
- `lang="en"` on `<html>`, full OG + Twitter card meta tags, `robots.txt`, `sitemap.xml`
- `site.webmanifest` with correct name, colors, and maskable icon

## Project structure

```
src/
├── components/
│   ├── sections/        # Hero, Projects, Blog, CV
│   └── ui/              # ThemeToggle, DevMode
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── parseReadme.ts   # README → typed data
│   └── types.ts
├── pages/
│   ├── index.astro
│   └── og.png.ts        # OG image endpoint (prerendered)
├── scripts/
│   ├── mangaMode.ts     # Konami easter egg
│   └── webgl/
│       └── scene.ts     # Three.js scene
└── styles/
    └── global.css
public/
├── robots.txt
├── site.webmanifest
└── *.png / *.ico        # Favicons
```

## Why I stopped GCP

The original v1 architecture ran on GCP Cloud Run + a regional load balancer + Cloudflare SSL.

<img src="https://canellariccardo.it/public/gcpbilling.png" width="100%" />

28 EUR for half a month is too much for a static personal page. Switched to Vercel — same
features, zero cost.

![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=thecreazy&style=for-the-badge)
