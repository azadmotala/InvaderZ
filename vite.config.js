import { defineConfig } from 'vite'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

//  The game loads its scripts with plain <script> tags, and its images and
//  sounds by path at runtime, so Vite never sees them. Copy them into the
//  build as-is.
const runtimeDirs = ['js', 'images', 'sounds']

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
    }
  }
}

export default defineConfig({
  //  Relative paths, so the build works from any folder, e.g. GitHub Pages' /invaders/.
  base: './',
  plugins: [copyRuntimeFiles()]
})
