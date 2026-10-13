const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const themePath = require('node:path').join(__dirname, '../shared/themes.ts')
const themes = fs.existsSync(themePath) ? require(themePath) : {}
const { DEFAULT_SETTINGS } = require('../shared/ipc.ts')
const monacoThemes = require('../src/themes/monacoThemes.ts')

test('default dark and system dark resolve to the neutral black palette', () => {
  assert.equal(typeof themes.resolveTheme, 'function', 'theme resolution is implemented')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'dark' }, false).bg, '#0e0e0e')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'light' }, true).bg, '#ffffff')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'system' }, true).bg, '#0e0e0e')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'dark' }, false).chrome, '#181818')
})

test('former Ink settings select the single default black option', () => {
  assert.equal(typeof themes.themePatchFor, 'function', 'preset selection is implemented')
  const patch = themes.sanitizeTheme({ theme: 'dark', themePreset: 'ink' })
  assert.equal(patch.theme, 'dark')
  assert.equal(patch.themePreset, 'legacy')
  assert.equal(themes.themeSelection(patch), 'dark')
  assert.equal(themes.THEME_PRESET_IDS.includes('ink'), false)
  assert.equal(monacoThemes.monacoThemeName(patch, 'dark'), monacoThemes.MONACO_THEME_DARK)
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, ...patch }, false).bg, '#0e0e0e')
})

test('malformed, mismatched and system presets fall back to existing theme safely', () => {
  assert.equal(typeof themes.resolveTheme, 'function')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'dark', themePreset: 'toString' }, false).bg, '#0e0e0e')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'light', themePreset: 'deep-dark' }, true).bg, '#ffffff')
  assert.equal(themes.resolveTheme({ ...DEFAULT_SETTINGS, theme: 'system', themePreset: 'deep-dark' }, false).bg, '#ffffff')
})

test('each offered preset resolves consistently for CSS, editor and window', () => {
  assert.equal(typeof themes.themePatchFor, 'function')
  for (const [selection, bg, mode] of [
    ['midnight', '#15202b', 'dark'],
    ['graphite', '#25282d', 'dark'], ['plum', '#241d29', 'dark'],
    ['mist', '#273539', 'dark'], ['paper', '#fdfcf9', 'light']
  ]) {
    const patch = themes.themePatchFor(selection)
    const p = themes.resolveTheme({ ...DEFAULT_SETTINGS, ...patch }, mode !== 'dark')
    assert.equal(p.bg, bg)
    assert.equal(p.scheme, mode)
    assert.equal(themes.themeSelection({ ...DEFAULT_SETTINGS, ...patch }), selection)
  }
})

test('Monaco gives selected text an opaque blue surface and readable foreground', () => {
  assert.equal(typeof monacoThemes.makeMonacoTheme, 'function')
  const p=themes.resolveTheme({...DEFAULT_SETTINGS,...themes.themePatchFor('dark')},false)
  const t=monacoThemes.makeMonacoTheme(p)
  assert.equal(t.colors['editor.background'],'#0e0e0e')
  assert.equal(t.colors['editor.selectionBackground'],'#2455a4')
  assert.equal(t.colors['editor.selectionForeground'],'#ffffff')
  assert.notEqual(t.colors['editor.selectionBackground'],t.colors['diffEditor.insertedTextBackground'])
  assert.notEqual(t.colors['editor.selectionBackground'],t.colors['diffEditor.removedTextBackground'])
  assert.equal(t.colors['diffEditorGutter.insertedLineBackground'],p.added)
})

test('old saved presets resolve to the replacement palette and editor theme', () => {
  for (const [oldId, newId, mode, bg] of [
    ['deep-dark', 'dark', 'dark', '#0e0e0e'], ['navy-dark', 'midnight', 'dark', '#15202b'],
    ['one-dark', 'graphite', 'dark', '#25282d'], ['dracula', 'plum', 'dark', '#241d29'],
    ['nord', 'mist', 'dark', '#273539'], ['github-light', 'paper', 'light', '#fdfcf9']
  ]) {
    const stored = { ...DEFAULT_SETTINGS, theme: mode, themePreset: oldId }
    assert.equal(themes.themeSelection(stored), newId)
    assert.equal(themes.resolveTheme(stored, mode === 'light').bg, bg)
    assert.equal(monacoThemes.monacoThemeName(stored, mode), newId === 'dark' ? monacoThemes.MONACO_THEME_DARK : 'diffdesk-' + newId)
  }
})

test('custom palette text stays readable in the editor, chrome and diff blocks', () => {
  function luminance(hex) {
    const linear = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
  }
  function contrast(fg, bg) { const a = luminance(fg), b = luminance(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
  for (const id of ['dark', ...themes.THEME_PRESET_IDS]) {
    const p = themes.resolveTheme(themes.themePatchFor(id), false)
    for (const key of ['text', 'line-number', 'keyword', 'string', 'number', 'comment']) assert.ok(contrast(p[key], p.bg) >= 4.5, `${id}: ${key} on editor`)
    assert.ok(contrast(p.muted, p.chrome) >= 4.5, `${id}: muted on chrome`)
    assert.ok(contrast(p['add-foreground'], p.added) >= 4.5, `${id}: added verdict`)
    assert.ok(contrast(p['del-foreground'], p.deleted) >= 4.5, `${id}: removed verdict`)
    assert.ok(contrast(p['selection-foreground'], p.selection) >= 4.5, `${id}: selected text`)
    assert.ok(contrast(p['selection-foreground'], p['inactive-selection']) >= 4.5, `${id}: inactive selected text`)
  }
})
