import { defineConfig } from 'vite'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

//  The game loads its scripts with plain <script> tags, and its images and
//  sounds by path at runtime, so Vite never sees them. Copy them into the
//  build as-is. The home-screen icons are named inside icons/manifest.webmanifest,
//  which Vite doesn't read, so copy those too.
const runtimeDirs = ['js', 'images', 'sounds', 'icons']

function copyRuntimeFiles() {
  let root
  return {
    name: 'copy-runtime-files',
    apply: 'build',
    configResolved(config) {
      root = config.root
    },
    generateBundle() {
      for (const dir of runtimeDirs) {
        for (const file of readdirSync(join(root, dir))) {
          this.emitFile({
            type: 'asset',
            fileName: `${dir}/${file}`,
            source: readFileSync(join(root, dir, file))
          })
        }
      }
    },
    //  Vite turns the manifest link into an inline data: URL, which can't
    //  find the icons beside it. Point it back at the copied manifest.
    transformIndexHtml: {
      enforce: 'post',
      transform(html) {
        return html.replace(/<link href="[^"]*" rel="manifest">/,
          '<link href="./icons/manifest.webmanifest" rel="manifest">')
      }
    }
  }
}

export default defineConfig({
  //  Relative paths, so the build works from any folder, e.g. GitHub Pages' /invaders/.
  base: './',
  plugins: [copyRuntimeFiles()]
})
