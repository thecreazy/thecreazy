import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://canellariccardo.it',
  integrations: [tailwind(), sitemap()],
  output: 'static',
  vite: {
    assetsInclude: ['**/*.glsl'],
    build: {
      target: 'es2020',
    },
  },
})
