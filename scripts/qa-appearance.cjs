const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const outputDir = process.env.DIFFDESK_APPEARANCE_OUTPUT || path.join(root, 'docs/implementation/2026-10-11-appearance-assets')
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

async function run(theme, scale = '1', minimum = false) {
  const legacyBlack = process.argv.includes('--legacy-black')
  const label = `${theme}-${scale}${minimum ? '-min' : ''}${legacyBlack ? '-legacy' : ''}`
  const code = await new Promise((resolve, reject) => {
    const child = spawn(require('electron'), [path.join(root, 'qa-appearance.cjs'), `--force-device-scale-factor=${scale}`, ...(minimum ? ['--force-prefers-reduced-motion'] : [])], {
      cwd: root, windowsHide: true, stdio: 'inherit',
      env: { ...env, DIFFDESK_APPEARANCE_THEME: theme, DIFFDESK_APPEARANCE_MINIMUM: minimum ? '1' : '0', DIFFDESK_APPEARANCE_LABEL: label, DIFFDESK_APPEARANCE_OUTPUT: outputDir, DIFFDESK_APPEARANCE_LEGACY_BLACK: legacyBlack ? '1' : '0' }
    })
    child.on('error', reject)
    child.on('exit', resolve)
  })
  if (code !== 0) throw new Error(`Appearance QA ${label} exited ${code}`)
  const data = JSON.parse(fs.readFileSync(path.join(outputDir, label + '.json'), 'utf8'))
  console.log(JSON.stringify({ label, ...data }))
}

;(async () => {
  if (process.argv.includes('--single')) return run('dark')
  for (const scale of ['1', '1.25', '1.5']) await run('dark', scale)
  for (const theme of ['midnight', 'graphite', 'plum', 'mist', 'paper', 'light']) await run(theme)
  await run('dark', '1', true)
})().catch(error => { console.error(error); process.exitCode = 1 })
