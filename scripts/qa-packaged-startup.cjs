// End-to-end launch comparison, including portable extraction and cleanup.
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const executable = path.resolve(process.argv[2])
const label = process.argv[3] || 'packaged'
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Use a simple label')
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
;(async () => {
  fs.mkdirSync(path.join(root, 'build'), { recursive: true })
  // A running normal instance exits the QA launch with code 0. Unique paths
  // ensure that an old screenshot can never make that exit look successful.
  const captureDir = fs.mkdtempSync(path.join(root, 'build', `startup-${label}-`))
  const runs = []
  for (let i = 1; i <= 3; i++) {
    const output = path.join(captureDir, `run-${i}.png`)
    const started = performance.now()
    const startedWallMs = Date.now()
    const code = await new Promise((resolve, reject) => {
      const child = spawn(executable, [`--qa-screenshot=${output}`], { cwd: root, windowsHide: true, env, stdio: 'inherit' })
      child.on('error', reject)
      child.on('exit', resolve)
    })
    if (code !== 0) throw new Error(`Packaged startup QA exited ${code}`)
    if (!fs.existsSync(output)) throw new Error('No QA screenshot was produced. Close other DiffDesk instances before benchmarking.')
    const totalMs = Math.round(performance.now() - started)
    // The app captures 2500ms after did-finish-load. File timestamp excludes
    // portable cleanup; subtracting that wait estimates launch-to-load time.
    const loadEstimateMs = Math.round(fs.statSync(output).mtimeMs - startedWallMs - 2500)
    runs.push({ totalMs, loadEstimateMs })
    console.log(JSON.stringify({ label, run: i, totalMs, loadEstimateMs }))
  }
  const median = key => runs.map(r => r[key]).sort((a, b) => a - b)[1]
  const data = { label, executable, runs, medianTotalMs: median('totalMs'), medianLoadEstimateMs: median('loadEstimateMs'), screenshotWaitMs: 2500 }
  fs.writeFileSync(path.join(root, 'build', `startup-${label}.json`), JSON.stringify(data, null, 2))
  console.log(JSON.stringify(data))
})().catch(error => { console.error(error); process.exitCode = 1 })
