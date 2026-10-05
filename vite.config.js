import { defineConfig } from 'vite'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

//  The game loads its scripts with plain <script> tags, and its images and
//  sounds by path at runtime, so Vite never sees them. Copy them into the
//  build as-is. The tab and home-screen icons in icons/ are copied too, and
//  linked as they are (see keepIconLinks).
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
    }
  }
}

//  The icon and manifest links in index.html point into icons/, copied as-is
//  above. Vite would rewrite them, inlining the small icons and the manifest
//  as data: URLs, and an inlined manifest can't find the icons it names. So
//  hide the links from Vite while it works, then put them back unchanged.
function keepIconLinks() {
  return [{
    name: 'hide-icon-links',
    apply: 'build',
    transformIndexHtml: {
      enforce: 'pre',
      transform: html => html.replace(/ href="\.\/icons\//g, ' data-icon-href="./icons/')
    }
  }, {
    name: 'restore-icon-links',
    apply: 'build',
    transformIndexHtml: {
      enforce: 'post',
      transform: html => html.replace(/ data-icon-href="/g, ' href="')
    }
  }]
}

export default defineConfig({
  //  Relative paths, so the build works from any folder, e.g. GitHub Pages' /invaders/.
  base: './',
  plugins: [copyRuntimeFiles(), keepIconLinks()]
})
