const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const Module = require('node:module')

test('preset persists across settings reload without putting a preset into nativeTheme', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'diffdesk-theme-test-'))
  const originalLoad=Module._load
  let source='system'
  const nativeTheme={get themeSource(){return source},set themeSource(value){assert.ok(['system','light','dark'].includes(value));source=value}}
  Module._load=function(name,...args){return name==='electron'?{app:{getPath:()=>dir},nativeTheme}:originalLoad.call(this,name,...args)}
  const modulePath=require.resolve('../electron/settings.ts')
  try {
    delete require.cache[modulePath]
    let settings=require(modulePath)
    settings.initSettings()
    settings.patchSettings({theme:'dark',themePreset:'ink',wordWrap:true})
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'settings.json'),'utf8')).themePreset,'ink')
    delete require.cache[modulePath]
    settings=require(modulePath)
    assert.equal(settings.initSettings().themePreset,'ink')
    assert.equal(settings.getSettings().wordWrap,true)
    assert.equal(source,'dark')
    settings.patchSettings({theme:'system',themePreset:'invalid-preset'})
    assert.equal(settings.getSettings().themePreset,'legacy')
  } finally {
    Module._load=originalLoad
    delete require.cache[modulePath]
    fs.rmSync(dir,{recursive:true,force:true})
  }
})

test('old preset settings migrate on load and save under the new ID without losing options', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diffdesk-theme-migration-'))
  const originalLoad = Module._load
  const nativeTheme = { themeSource: 'system' }
  Module._load = function(name, ...args) { return name === 'electron' ? { app: { getPath: () => dir }, nativeTheme } : originalLoad.call(this, name, ...args) }
  const modulePath = require.resolve('../electron/settings.ts')
  try {
    for (const [oldId, newId, theme] of [['one-dark', 'graphite', 'dark'], ['dracula', 'plum', 'dark'], ['nord', 'mist', 'dark'], ['github-light', 'paper', 'light']]) {
      fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify({ theme, themePreset: oldId, wordWrap: true, fontSize: 16 }))
      delete require.cache[modulePath]
      const settings = require(modulePath)
      assert.equal(settings.initSettings().themePreset, newId)
      assert.equal(nativeTheme.themeSource, theme)
      settings.patchSettings({ ignoreTrimWhitespace: true })
      const saved = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'))
      assert.equal(saved.themePreset, newId)
      assert.equal(saved.wordWrap, true)
      assert.equal(saved.fontSize, 16)
    }
  } finally {
    Module._load = originalLoad
    delete require.cache[modulePath]
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
