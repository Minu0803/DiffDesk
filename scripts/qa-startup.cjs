const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const label = process.argv[2] || 'current'
const check = process.argv.includes('--check')
const smoke = process.argv.includes('--smoke')
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Use a simple label')
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
fs.mkdirSync(path.join(root, 'build'), { recursive: true })
;(async () => {
  const runs = []
  for (let i = 1; i <= (smoke ? 1 : 3); i++) {
    const output = path.join(root, 'build', `startup-${label}-${i}.json`)
    const started = performance.now()
    const code = await new Promise((resolve, reject) => {
      const child = spawn(require('electron'), [path.join(root, 'qa-startup.cjs')], {
        cwd: root, windowsHide: true, env: { ...env, DIFFDESK_STARTUP_OUTPUT: output, DIFFDESK_STARTUP_SMOKE: smoke ? '1' : '0' }, stdio: 'inherit'
      })
      child.on('error', reject)
      child.on('exit', resolve)
    })
    if (code !== 0) throw new Error(`Startup QA exited ${code}`)
    const data = JSON.parse(fs.readFileSync(output, 'utf8'))
    if (check && data.settledVerdict.includes('비교 계산 중')) throw new Error('Empty documents must finish their initial comparison')
    runs.push(data)
    console.log(JSON.stringify({ run: i, totalMs: Math.round(performance.now() - started), usableMs: Math.round(data.usableMs), rendererMs: Math.round(data.editorReadyMs), verdict: data.settledVerdict, hintInBand: data.hintInBand, editorOverlayHint: data.editorOverlayHint }))
  }
  const median = key => runs.map(r => r[key]).sort((a, b) => a - b)[Math.floor(runs.length / 2)]
  console.log(JSON.stringify({ label, medianUsableMs: Math.round(median('usableMs')), medianRendererMs: Math.round(median('editorReadyMs')) }))
})().catch(error => { console.error(error); process.exitCode = 1 })
