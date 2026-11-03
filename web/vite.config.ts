import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// publicDir points at the parsed game data, so files that belong to the site itself
// (favicon, sitemap, social card) live in web/public and are copied into the build here.
function copySitePublicFiles(): Plugin {
  let outDir = ''
  let sourceDir = ''

  return {
    name: 'copy-site-public-files',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      sourceDir = resolve(config.root, 'public')
    },
    closeBundle() {
      cpSync(sourceDir, outDir, { recursive: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/LordsMobileTechTree/',
  publicDir: '../data/parsed',
  plugins: [react(), copySitePublicFiles()],
})
