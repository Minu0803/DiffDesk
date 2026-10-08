import type * as monaco from 'monaco-editor'
import { THEME_PALETTES, THEME_PRESET_IDS, resolveTheme, sanitizeTheme } from '../../shared/themes'
import type { ThemePalette } from '../../shared/themes'
import type { Settings } from '../../shared/ipc'

export function monacoThemeName(settings: Pick<Settings, 'theme' | 'themePreset'>, scheme: 'dark' | 'light'): string {
  const { themePreset } = sanitizeTheme(settings)
  return themePreset === 'legacy' ? (scheme === 'dark' ? MONACO_THEME_DARK : MONACO_THEME_LIGHT) : 'diffdesk-' + themePreset
}

export function makeMonacoTheme(p: ThemePalette): monaco.editor.IStandaloneThemeData {
  return {
    base: p.scheme === 'dark' ? 'vs-dark' : 'vs', inherit: false,
    rules: [
      { token: '', foreground: p.text.slice(1) },
      { token: 'keyword', foreground: p.keyword.slice(1) },
      { token: 'type', foreground: p.keyword.slice(1) },
      { token: 'tag', foreground: p.keyword.slice(1) },
      { token: 'string', foreground: p.string.slice(1) },
      { token: 'number', foreground: p.number.slice(1) },
      { token: 'comment', foreground: p.comment.slice(1) },
      { token: 'delimiter', foreground: p.text.slice(1) }
    ],
    colors: {
      'editor.background': p.bg, 'editor.foreground': p.text,
      'editorLineNumber.foreground': p['line-number'], 'editorLineNumber.activeForeground': p.text,
      'editorCursor.foreground': p.text,
      'editor.selectionBackground': p.selection, 'editor.inactiveSelectionBackground': p.selection,
      'editor.selectionHighlightBackground': p['accent-bg'], 'editor.lineHighlightBackground': p.bg,
      'editor.lineHighlightBorder': '#00000000',
      'diffEditor.insertedTextBackground': p['word-add'], 'diffEditor.removedTextBackground': p['word-del'],
      'diffEditor.insertedLineBackground': p.added, 'diffEditor.removedLineBackground': p.deleted,
      'diffEditorGutter.insertedLineBackground': p.added, 'diffEditorGutter.removedLineBackground': p.deleted,
      'diffEditor.diagonalFill': p.border + '66', 'diffEditor.border': p.border,
      'diffEditorOverview.insertedForeground': p['add-foreground'], 'diffEditorOverview.removedForeground': p['del-foreground'],
      'editorWidget.background': p.chrome, 'editorWidget.border': p.border,
      'editorHoverWidget.background': p.chrome, 'editorHoverWidget.foreground': p.text, 'editorHoverWidget.border': p.border,
      'editorSuggestWidget.background': p.chrome, 'editorSuggestWidget.foreground': p.text, 'editorSuggestWidget.border': p.border,
      'input.background': p.bg, 'input.foreground': p.text, 'input.border': p.border,
      'scrollbarSlider.background': p.muted + '66', 'scrollbarSlider.hoverBackground': p.muted + '99',
      'scrollbarSlider.activeBackground': p.muted + 'bb', 'focusBorder': '#00000000'
    }
  }
}

export const MONACO_THEME_LIGHT = 'diffdesk-light'
export const MONACO_THEME_DARK = 'diffdesk-dark'
// tokens.css의 --dd-font-mono와 반드시 동일 값
export const MONO_FONT_STACK = "'Cascadia Code', 'D2Coding', Consolas, 'Courier New', monospace"

// Register only DiffDesk's authored rules and colors, including the default
// light/dark choices. Monaco's base enum sets the color scheme; inherit:false
// prevents inheriting its theme-specific syntax rules and palette.
export function registerMonacoThemes(m: typeof monaco): void {
  for (const id of THEME_PRESET_IDS) m.editor.defineTheme('diffdesk-' + id, makeMonacoTheme(THEME_PALETTES[id]))
  m.editor.defineTheme(MONACO_THEME_DARK, makeMonacoTheme(resolveTheme({ theme: 'dark', themePreset: 'legacy' }, true)))
  m.editor.defineTheme(MONACO_THEME_LIGHT, makeMonacoTheme(resolveTheme({ theme: 'light', themePreset: 'legacy' }, false)))
}
