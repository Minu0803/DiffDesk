import type * as monaco from 'monaco-editor'

export const MONACO_THEME_LIGHT = 'diffdesk-light'
export const MONACO_THEME_DARK = 'diffdesk-dark'
// tokens.css의 --dd-font-mono와 반드시 동일 값
export const MONO_FONT_STACK = "'Cascadia Code', 'D2Coding', Consolas, 'Courier New', monospace"

// Monaco는 css 변수를 못 받으므로 tokens.css 팔레트와 같은 hex를 직접 기입 (#RRGGBB/#RRGGBBAA)
export function registerMonacoThemes(m: typeof monaco): void {
  m.editor.defineTheme(MONACO_THEME_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      // --dd-bg와 동일 — 백엔드 창 backgroundColor(#17181d)와 3자 동기 계약
      'editor.background': '#17181d',
      'editor.foreground': '#d7dae0',
      'editorLineNumber.foreground': '#6f7590',
      'editorLineNumber.activeForeground': '#ced3e0',
      'editorCursor.foreground': '#d7dae0',
      'editor.selectionBackground': '#3a3f6e',
      'editor.inactiveSelectionBackground': '#3a3f6e66',
      'editor.selectionHighlightBackground': '#8b93ff26',
      'editor.lineHighlightBackground': '#a5adff0f',
      'editor.lineHighlightBorder': '#00000000',

      'diffEditor.insertedTextBackground': '#2ea04355',
      'diffEditor.removedTextBackground': '#e5534b55',
      'diffEditor.insertedLineBackground': '#2ea04326',
      'diffEditor.removedLineBackground': '#e5534b26',
      'diffEditor.diagonalFill': '#3c404d66',
      'diffEditor.border': '#33363f',
      'diffEditorOverview.insertedForeground': '#2ea04399',
      'diffEditorOverview.removedForeground': '#e5534b99',

      'editorWidget.background': '#1e2027',
      'editorWidget.border': '#33363f',
      'scrollbarSlider.background': '#7e849266',
      'scrollbarSlider.hoverBackground': '#7e849299',
      'scrollbarSlider.activeBackground': '#7e8492cc',
      // 불투명 focusBorder는 포커스된 에디터/디프 gutter에 1px outline 박스를 그린다 — 투명 고정
      'focusBorder': '#00000000'
    }
  })

  m.editor.defineTheme(MONACO_THEME_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1f2328',
      'editorLineNumber.foreground': '#8f95a8',
      'editorLineNumber.activeForeground': '#1f2328',
      'editorCursor.foreground': '#1f2328',
      'editor.selectionBackground': '#c7ccf2',
      'editor.inactiveSelectionBackground': '#c7ccf280',
      'editor.selectionHighlightBackground': '#c7ccf24d',
      'editor.lineHighlightBackground': '#5558ce0a',
      'editor.lineHighlightBorder': '#00000000',

      'diffEditor.insertedTextBackground': '#2ea04340',
      'diffEditor.removedTextBackground': '#cf222e33',
      'diffEditor.insertedLineBackground': '#2ea0431a',
      'diffEditor.removedLineBackground': '#cf222e14',
      'diffEditor.diagonalFill': '#dcdfea66',
      'diffEditor.border': '#dcdfea',
      'diffEditorOverview.insertedForeground': '#2ea043b3',
      'diffEditorOverview.removedForeground': '#cf222eb3',

      'editorWidget.background': '#f8f9fc',
      'editorWidget.border': '#dcdfea',
      'scrollbarSlider.background': '#8c959f4d',
      'scrollbarSlider.hoverBackground': '#8c959f80',
      'scrollbarSlider.activeBackground': '#8c959fb3',
      'focusBorder': '#00000000'
    }
  })
}
