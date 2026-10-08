# canellariccardo.it — Project README

## The idea

The core concept hasn't changed since day one: the **README.md** is the single source of truth.
Everything you see on the site — name, tagline, projects, blog posts, CV entries, contact
address — is parsed from the GitHub README at build time. Update the README, the site updates
automatically.

The only companion to the README are the **article cover images** (see
[Content conventions](#content-conventions)).

## History

- **v1** — custom Node.js pipeline (Markdown → showdown → HTML, Less), on GCP Cloud Run.
- **v2 (2024)** — Astro + Vercel revamp with a retro terminal look: themes, manga-mode easter
  egg, dev-mode panel, WebGL noise background.
- **v3 (2026)** — new visual identity built around **the diamond**: a 3D slab that guides the
  page and changes skin section by section. The retro theme and its extras were retired.

## The diamond

One page, scrolled freely. A white slab with the name ticking along its sides sits in the
middle of a watercolour intro, then rises and parks at the top of the screen. From there it
changes with every section:

| Section          | Diamond                                                             | Section content                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intro**        | White slab, "Riccardo / Canella" ticker, breathing light            | Watercolour pastel background, name, tagline, bullets and socials (word-by-word entrance)                                                                                                                                                           |
| **What i code**  | Holographic iridescent shader, quarter turn while the track scrolls | Pinned section: vertical scroll drives a horizontal track of all projects; panels share the diamond's holo shader (rim at rest, fully lit + 3D tilt when centred or hovered); "more on github" filled with the shader                               |
| **What i write** | Empty frame; its band shows the title of the current article        | Heading pinned inside the frame's opening; the latest 5 articles crossfade with the scroll in a frame with the title ticking on all four sides (light/dark picked per side from the photo); "read article" button; full-width "all articles" ticker |
| **My cv**        | White again, becomes the cap of a tower                             | Pinned section: one slab per job drops into place (oldest at the bottom), the list lights up as they land, the tower turns; then the list gives way to the closing words (email, socials, ©)                                                        |

Around it: a loading screen (a small turning slab + real progress), section nav as small
diamonds, and a custom cursor — a mini diamond wearing the current skin that opens into a frame
with an orbiting ticker naming the action on links.

## Tech stack

| Layer                | Tool                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Framework            | [Astro 4](https://astro.build) (static output)                                                                              |
| Styling              | Scoped component CSS + global tokens (Tailwind integration only provides the base reset)                                    |
| 3D                   | [Three.js](https://threejs.org) — diamond scene, holo shader, CV tower; lazy-loaded chunks                                  |
| Smooth scrolling     | [Lenis](https://lenis.darkroom.engineering) — wheel input only, on the `#scroll` container                                  |
| Images               | `astro:assets` (responsive webp) + [sharp](https://sharp.pixelplumbing.com) (cover edge tones at build time)                |
| Fonts                | Instrument Serif, Courier Prime, Archivo Black (Google Fonts; local TTFs for the OG image)                                  |
| OG image             | [Satori](https://github.com/vercel/satori) + [@resvg/resvg-js](https://github.com/yisibl/resvg-js)                          |
| Sitemap              | [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) (pinned to `~3.2.1`: 3.3+ needs Astro 5) |
| Package manager      | [pnpm](https://pnpm.io), pinned via `package.json#packageManager` (Vercel uses the same version)                            |
| Linting / formatting | ESLint (flat config, typescript-eslint, eslint-plugin-astro) + Prettier                                                     |
| Releases             | [Changesets](https://github.com/changesets/changesets)                                                                      |
| Hosting              | [Vercel](https://vercel.com)                                                                                                |

## Architecture

```
README.md ──► src/lib/parseReadme.ts ──► src/pages/index.astro
                                              │
                    Hero · Projects · Blog · CV (sections, plain HTML)
                                              │
src/scripts/stage/state.ts   ◄── scroll of #scroll (fixed scroll container)
   one normalised state: move, intro, holo, works, frame, cv, build, active
                                              │
   ┌──────────────┬──────────────┬────────────┴───┬──────────────┬─────────────┐
   CSS variables  diamond/       holo/            works/         articles/ ·
   (--intro,      scene.ts       surfaces.ts      horizontal     cv/ · cursor/
   --veil, --lift) (WebGL, top)  (WebGL, under    track, tilt    DOM sections
                                 the content)
```

- **Single state, many layers.** `stage/state.ts` turns the scroll position and the section
  positions into normalised values; every layer subscribes to it, so the diamond, the
  background, the masks and the DOM always agree.
- **Layers** (bottom → top): pastel background · holo canvas (WebGL surfaces synced to DOM
  elements marked `[data-holo]`) · scrolling content (masked under the parked diamond) · diamond
  canvas · nav, cursor, loader.
- **Measured from 3D:** the diamond writes `--veil-h` (its parked bottom edge) and `--hole-*`
  (the opening of the frame skin) as CSS variables, used by the layout.
- **Timing shared by 3D and DOM:** `cv/build.ts` defines when slabs land, the tower turns and
  the outro appears, for both the WebGL tower and the list.

**Generated at build time:**

- `/og.png` — 1200×630 OG image via Satori (pastel + flat diamond with the name)
- responsive webp covers for the articles, plus their per-side light/dark tones
- `/sitemap-index.xml` + `/sitemap-0.xml`

## Content conventions

All in **README.md**, parsed by `src/lib/parseReadme.ts`:

- **Hero** — `# Name`, `### tagline` (the first sentence becomes the eyebrow, the rest the intro
  paragraph), `- bullets`. The email in the tagline must be written `user[at]domain`: it is
  never written whole in the HTML, JS assembles it.
- **Socials** — links under `## Where you can find me:`.
- **What i code** — `- [Name](url) description` under `## What i code:`; all are shown, in
  order.
- **What i write** — `- YEAR` then nested `- [emoji Title](url)` under `## What i write:`; the
  latest 5 are shown.
- **My cv** — `- [Company](url) Role (period)` or plain `- Text (period)` under `## My cv:`,
  newest first.

**Article covers** live in `src/assets/articles/`, named after the slug of the article title
(lowercase, non-alphanumerics → `-`, apostrophes dropped), e.g.
`we-broke-our-codebases-for-humans-agents-want-them-back-in-one-piece.webp`.
`.webp`, `.jpg`, `.jpeg` and `.png` work. An article without a cover gets a dark frame. On
phones covers are shown turned 90° in a vertical frame.

**Pastel background** — `src/assets/pastel.webp` is pre-rendered (painting it at runtime was
too slow on phones). To change it, edit `src/scripts/stage/paintPastel.ts` (seeded, so
reproducible), run it on a canvas in a browser and save `canvas.toDataURL('image/webp', 0.86)`.

## Fallbacks & accessibility

- **No JavaScript** — all content is plain HTML: no loader, normal scrolling, vertical lists.
- **No WebGL** — no diamond or holo surfaces; sections fall back to plain layouts (the CV is a
  list followed by the closing words).
- **Reduced motion** — no smooth scrolling, no horizontal pinning (projects as a vertical list), no tilt, no tower
  drops or turns, static tickers, no entrance animation, native cursor.
- **Touch** — native cursor and native scrolling (no Lenis); nav diamonds only on the intro on
  phones; WebGL pixel ratio capped at 1.5.
- Text entrance is skipped when scrolling fast, so it never hides content.
- `lang="en"`, OG + Twitter meta, `robots.txt`, sitemap, `site.webmanifest`.

## Project structure

```
src/
├── assets/
│   ├── articles/            # article covers, named by title slug
│   ├── fonts/               # TTFs for the OG image
│   └── pastel.webp          # pre-rendered watercolour background
├── components/
│   ├── sections/            # Hero, Projects, Blog, CV
│   └── ui/                  # SectionNav, Cursor, Loader
├── layouts/
│   └── BaseLayout.astro     # layers, fonts, meta
├── lib/
│   ├── parseReadme.ts       # README → typed data
│   ├── articleImages.ts     # cover lookup by slug + edge tones (sharp)
│   └── types.ts
├── pages/
│   ├── index.astro
│   └── og.png.ts            # OG image endpoint (prerendered)
├── scripts/
│   ├── stage/               # scroll state, loader, pastel layout/painter, pixel ratio
│   ├── diamond/             # scene, skins (textures, holo shader, frame), CV tower
│   ├── holo/                # WebGL surfaces under DOM elements + shared state
│   ├── works/               # what i code: pinned horizontal track, tilt
│   ├── articles/            # what i write: scroll-driven crossfade
│   ├── cv/                  # tower timing, list/outro states
│   └── cursor/              # custom cursor
└── styles/
    └── global.css           # tokens, layers, masks, shared typography
public/
├── robots.txt
├── site.webmanifest
└── *.png / *.ico            # favicons
```

## Development

```sh
pnpm install
pnpm dev          # dev server (reloads when README.md changes)
pnpm build        # static build in dist/
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm changeset    # describe a change for the next release
```

## Performance

The WebGL layers load as separate chunks behind the loading screen; the pastel is a single
~300 KB image; covers are responsive webp; phones render WebGL at a capped pixel ratio.
Lighthouse scores for v3 are still to be measured (the v2 scores no longer apply).

## Why I stopped GCP

The original v1 architecture ran on GCP Cloud Run + a regional load balancer + Cloudflare SSL.

<img src="https://canellariccardo.it/public/gcpbilling.png" width="100%" />

28 EUR for half a month is too much for a static personal page. Switched to Vercel — same
features, zero cost.

![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=thecreazy&style=for-the-badge)
