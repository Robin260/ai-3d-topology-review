import { copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const routes = ['home', 'evaluate', 'pk', 'statistics']

await Promise.all(routes.map(async (route) => {
  const directory = join('dist', route)
  await mkdir(directory, { recursive: true })
  await copyFile(join('dist', 'index.html'), join(directory, 'index.html'))
}))

console.log(`Static route entries prepared: ${routes.join(', ')}`)

