const { spawn } = require('node:child_process')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const env = { ...process.env, DIFFDESK_SWAP_MINIMUM: process.argv.includes('--minimum') ? '1' : '0' }
delete env.ELECTRON_RUN_AS_NODE
const child = spawn(require('electron'), [path.join(root, 'qa-swap.cjs')], { cwd: root, windowsHide: true, stdio: 'inherit', env })
child.on('error', error => { console.error(error); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
