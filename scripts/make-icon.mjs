// assets/icon.svg → PNG(16~256) 래스터화 → build/icon.ico + assets/icon.png(256)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import pngToIco from 'png-to-ico'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIZES = [16, 24, 32, 48, 64, 128, 256]

const svg = await readFile(path.join(root, 'assets', 'icon.svg'))

const pngs = SIZES.map((size) => {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  console.log(`render ${String(size).padStart(3)}px  ${png.length} bytes`)
  return png
})

await mkdir(path.join(root, 'build'), { recursive: true })
await writeFile(path.join(root, 'assets', 'icon.png'), pngs[SIZES.indexOf(256)])
await writeFile(path.join(root, 'build', 'icon.ico'), await pngToIco(pngs))

console.log(`done: assets/icon.png (256px), build/icon.ico (${SIZES.join(', ')})`)
