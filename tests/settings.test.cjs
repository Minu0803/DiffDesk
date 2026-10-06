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
    settings.patchSettings({theme:'dark',themePreset:'deep-dark',wordWrap:true})
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'settings.json'),'utf8')).themePreset,'deep-dark')
    delete require.cache[modulePath]
    settings=require(modulePath)
    assert.equal(settings.initSettings().themePreset,'deep-dark')
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
