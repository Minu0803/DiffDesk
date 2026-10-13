// Verify an NSIS setup payload against the current Windows x64 app and build.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const asar = require('@electron/asar')
const root = path.resolve(__dirname, '..')
if (!process.argv[2]) throw new Error('Usage: node scripts/qa-setup-package.cjs <setup.exe> [report-label]')
const setup = path.resolve(process.argv[2])
if (path.extname(setup).toLowerCase() !== '.exe') throw new Error('Expected an NSIS setup EXE')
const label = process.argv[3] || 'setup'
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Use a simple report label')
const unpacked = path.join(path.dirname(setup), 'win-unpacked')
const sevenZip = path.join(root, 'node_modules/7zip-bin/win/x64/7za.exe')
fs.mkdirSync(path.join(root, 'build'), { recursive: true })
const extracted = fs.mkdtempSync(path.join(root, 'build/' + label + '-extracted-'))
execFileSync(sevenZip, ['t', setup, '-bd'], { windowsHide: true, stdio: 'pipe' })
execFileSync(sevenZip, ['x', setup, '-y', '-bd', '-o' + extracted], { windowsHide: true, stdio: 'pipe' })
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const files = (directory, prefix = '') => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const relative = prefix + entry.name
  return entry.isDirectory() ? files(path.join(directory, entry.name), relative + '/') : [relative]
})
let packageFiles = 0
for (const relative of files(unpacked)) {
  const dest = path.join(extracted, relative)
  if (!fs.existsSync(dest) || hash(fs.readFileSync(dest)) !== hash(fs.readFileSync(path.join(unpacked, relative)))) throw new Error('Setup payload mismatch: ' + relative)
  packageFiles++
}
const archive = path.join(extracted, 'resources/app.asar')
let buildFiles = 0
for (const folder of ['dist', 'dist-electron']) for (const relative of files(path.join(root, folder))) {
  const source = fs.readFileSync(path.join(root, folder, relative))
  if (hash(source) !== hash(asar.extractFile(archive, path.join(folder, relative)))) throw new Error('ASAR is not current: ' + folder + '/' + relative)
  buildFiles++
}
const qaFiles = asar.listPackage(archive).map(p => p.replaceAll('\\', '/')).filter(p => /^\/(scripts|tests)\/|\/qa-[^/]+\.cjs$/.test(p))
if (qaFiles.length) throw new Error('QA scripts were packaged')
const notices = [
  ['node_modules/electron/dist/LICENSE', 'LICENSE.electron.txt'],
  ['node_modules/electron/dist/LICENSES.chromium.html', 'LICENSES.chromium.html'],
  ['node_modules/monaco-editor/LICENSE', 'resources/licenses/Monaco-LICENSE.txt'],
  ['node_modules/react/LICENSE', 'resources/licenses/React-LICENSE.txt'],
  ['node_modules/react-dom/LICENSE', 'resources/licenses/ReactDOM-LICENSE.txt']
]
for (const [source, relative] of notices) if (hash(fs.readFileSync(path.join(root, source))) !== hash(fs.readFileSync(path.join(extracted, relative)))) throw new Error('License notice mismatch: ' + relative)
const exe = fs.readFileSync(path.join(extracted, 'DiffDesk.exe'))
const peOffset = exe.readUInt32LE(0x3c)
if (exe.readUInt16LE(peOffset + 4) !== 0x8664) throw new Error('Executable is not Windows x64')
const result = { setup, size: fs.statSync(setup).size, sha256: hash(fs.readFileSync(setup)), extracted, executable: path.join(extracted, 'DiffDesk.exe'), archiveIntegrity: true, setupPayloadIntegrity: true, x64: true, packageFiles, buildFiles, mismatches: 0, qaFiles: qaFiles.length, licenseNotices: notices.map(([, relative]) => relative) }
fs.writeFileSync(path.join(root, 'build/' + label + '-package-verification.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result))
