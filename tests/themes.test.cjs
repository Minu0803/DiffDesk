const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const themePath = require('node:path').join(__dirname, '../shared/themes.ts')
const themes = fs.existsSync(themePath) ? require(themePath) : {}
const { DEFAULT_SETTINGS } = require('../shared/ipc.ts')
const monacoThemes = require('../src/themes/monacoThemes.ts')

test('restoring legacy dark/light/system retains existing palette and native theme enum', () => {
  assert.equal(typeof themes.resolveTheme, 'function', 'theme resolution is implemented')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'dark' }, false).bg, '#17181d')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'light' }, true).bg, '#ffffff')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'system' }, true).bg, '#17181d')
})

test('Deep Dark uses neutral startup color and valid Electron themeSource', () => {
  assert.equal(typeof themes.themePatchFor, 'function', 'preset selection is implemented')
  const patch = themes.themePatchFor('deep-dark')
  assert.equal(patch.theme, 'dark')
  assert.equal(patch.themePreset, 'deep-dark')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, ...patch }, false).bg, '#101010')
})

test('malformed, mismatched and system presets fall back to existing theme safely', () => {
  assert.equal(typeof themes.resolveTheme, 'function')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'dark', themePreset: 'toString' }, false).bg, '#17181d')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'light', themePreset: 'deep-dark' }, true).bg, '#ffffff')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'system', themePreset: 'deep-dark' }, false).bg, '#ffffff')
})

test('each offered preset resolves consistently for CSS, editor and window', () => {
  assert.equal(typeof themes.themePatchFor, 'function')
  for (const [selection, bg, mode] of [
    ['deep-dark', '#101010', 'dark'], ['navy-dark', '#171c27', 'dark'],
    ['one-dark', '#282c34', 'dark'], ['dracula', '#282a36', 'dark'],
    ['nord', '#2e3440', 'dark'], ['github-light', '#ffffff', 'light']
  ]) {
    const patch = themes.themePatchFor(selection)
    const p = themes.resolveTheme({ ...DEFAULT_SETTINGS, ...patch }, mode !== 'dark')
    assert.equal(p.bg, bg)
    assert.equal(p.scheme, mode)
    assert.equal(themes.themeSelection({ ...DEFAULT_SETTINGS, ...patch }), selection)
  }
})

test('Monaco receives preset syntax and opaque diff/selection backgrounds', () => {
  assert.equal(typeof monacoThemes.makeMonacoTheme, 'function')
  const p=themes.resolveTheme({...DEFAULT_SETTINGS,...themes.themePatchFor('deep-dark')},false)
  const t=monacoThemes.makeMonacoTheme(p)
  assert.equal(t.colors['editor.background'],'#101010')
  assert.equal(t.colors['diffEditor.insertedTextBackground'],'#253c2c')
  assert.equal(t.colors['diffEditor.removedLineBackground'],'#291b1e')
  assert.equal(t.colors['editor.selectionBackground'],'#303a5a')
  assert.equal(t.rules.find(r=>r.token==='comment').foreground,'ababab')
})
