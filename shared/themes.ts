import type { Settings, ThemeSetting } from './ipc'

export const THEME_PRESET_IDS = ['deep-dark', 'navy-dark', 'one-dark', 'dracula', 'nord', 'github-light'] as const
export type ThemePreset = typeof THEME_PRESET_IDS[number]
export type ThemeSelection = ThemeSetting | ThemePreset

export interface ThemePalette {
  name: string
  note: string
  scheme: 'light' | 'dark'
  bg: string
  chrome: string
  text: string
  muted: string
  'line-number': string
  border: string
  accent: string
  'accent-bg': string
  keyword: string
  string: string
  number: string
  comment: string
  selection: string
  added: string
  'word-add': string
  deleted: string
  'word-del': string
  rim: string
  shadow: string
  glow: string
  'add-foreground': string
  'del-foreground': string
}

// Single palette source for renderer tokens, Monaco and Electron window background.
export const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "deep-dark": {
    "name": "Deep Dark",
    "note": "무채색 블랙",
    "scheme": "dark",
    "bg": "#101010",
    "chrome": "#191919",
    "text": "#e4e4e4",
    "muted": "#a6a6a6",
    "line-number": "#8b8b8b",
    "border": "#343434",
    "accent": "#a7b4ff",
    "accent-bg": "#292e41",
    "keyword": "#bca2ef",
    "string": "#d4c295",
    "number": "#98d7cb",
    "comment": "#ababab",
    "selection": "#303a5a",
    "added": "#17251c",
    "word-add": "#253c2c",
    "deleted": "#291b1e",
    "word-del": "#432930",
    "rim": "#383838",
    "shadow": "#00000055",
    "glow": "#e4e4e416",
    "add-foreground": "#b7d8bf",
    "del-foreground": "#e3b8c0"
  },
  "navy-dark": {
    "name": "Navy Dark",
    "note": "은은한 네이비",
    "scheme": "dark",
    "bg": "#171c27",
    "chrome": "#1b2130",
    "text": "#dfe7f7",
    "muted": "#a3afc5",
    "line-number": "#a3afc5",
    "border": "#303b50",
    "accent": "#a6b5ff",
    "accent-bg": "#303c67",
    "keyword": "#bbaafa",
    "string": "#e5b296",
    "number": "#dfe7f7",
    "comment": "#a5bbac",
    "selection": "#303c67",
    "added": "#20352e",
    "word-add": "#294236",
    "deleted": "#342830",
    "word-del": "#432c35",
    "rim": "#45516a",
    "shadow": "#00000040",
    "glow": "#a6b5ff20",
    "add-foreground": "#a4d4b7",
    "del-foreground": "#e7b2be"
  },
  "one-dark": {
    "name": "One Dark",
    "note": "차분한 그래파이트",
    "scheme": "dark",
    "bg": "#282c34",
    "chrome": "#21252b",
    "text": "#bdc5d3",
    "muted": "#a0a8b7",
    "line-number": "#929caf",
    "border": "#3c4351",
    "accent": "#61afef",
    "accent-bg": "#2d3c4d",
    "keyword": "#d49ae8",
    "string": "#98c379",
    "number": "#e0ae82",
    "comment": "#b1b9c8",
    "selection": "#333946",
    "added": "#2d3b32",
    "word-add": "#334139",
    "deleted": "#3f3036",
    "word-del": "#49313b",
    "rim": "#454b57",
    "shadow": "#00000040",
    "glow": "#61afef1c",
    "add-foreground": "#b4d3a6",
    "del-foreground": "#e0adb8"
  },
  "dracula": {
    "name": "Dracula",
    "note": "보라·핑크 포인트",
    "scheme": "dark",
    "bg": "#282a36",
    "chrome": "#21222c",
    "text": "#f8f8f2",
    "muted": "#acb4ce",
    "line-number": "#9fa9c6",
    "border": "#44475a",
    "accent": "#bd93f9",
    "accent-bg": "#383145",
    "keyword": "#ff79c6",
    "string": "#f1fa8c",
    "number": "#ffb86c",
    "comment": "#a0abd0",
    "selection": "#343747",
    "added": "#283b31",
    "word-add": "#2d3f33",
    "deleted": "#412d38",
    "word-del": "#4b303e",
    "rim": "#494b61",
    "shadow": "#00000040",
    "glow": "#bd93f91c",
    "add-foreground": "#b4e2c2",
    "del-foreground": "#f0b6c5"
  },
  "nord": {
    "name": "Nord",
    "note": "서늘한 청회색",
    "scheme": "dark",
    "bg": "#2e3440",
    "chrome": "#272d38",
    "text": "#e5e9f0",
    "muted": "#afbacb",
    "line-number": "#a3b0c6",
    "border": "#465065",
    "accent": "#88c0d0",
    "accent-bg": "#304550",
    "keyword": "#9ab7d5",
    "string": "#b8d39f",
    "number": "#cbb2c5",
    "comment": "#aab6ca",
    "selection": "#3b4252",
    "added": "#303c36",
    "word-add": "#36443c",
    "deleted": "#40353d",
    "word-del": "#493844",
    "rim": "#505a6d",
    "shadow": "#00000035",
    "glow": "#88c0d01c",
    "add-foreground": "#bcd9bc",
    "del-foreground": "#e2b6c4"
  },
  "github-light": {
    "name": "GitHub Light",
    "note": "선명한 화이트",
    "scheme": "light",
    "bg": "#ffffff",
    "chrome": "#f6f8fa",
    "text": "#1f2328",
    "muted": "#59636e",
    "line-number": "#59636e",
    "border": "#d1d9e0",
    "accent": "#0969da",
    "accent-bg": "#e8f1fc",
    "keyword": "#a40e26",
    "string": "#0a3069",
    "number": "#0550ae",
    "comment": "#57606a",
    "selection": "#ddebff",
    "added": "#eff8f1",
    "word-add": "#dceee0",
    "deleted": "#fff1f2",
    "word-del": "#f7dde1",
    "rim": "#ffffff",
    "shadow": "#1f232820",
    "glow": "#0969da15",
    "add-foreground": "#28613a",
    "del-foreground": "#942c40"
  }
}

export function isThemePreset(value: unknown): value is ThemePreset {
  return typeof value === 'string' && THEME_PRESET_IDS.includes(value as ThemePreset)
}

export function sanitizeTheme(raw: { theme?: unknown; themePreset?: unknown }): Pick<Settings, 'theme' | 'themePreset'> {
  const theme = raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system'
  const themePreset = isThemePreset(raw.themePreset) && theme !== 'system' && THEME_PALETTES[raw.themePreset].scheme === theme ? raw.themePreset : 'legacy'
  return { theme, themePreset }
}

export function resolveTheme(settings: Pick<Settings, 'theme' | 'themePreset'>, systemDark: boolean): ThemePalette {
  const { theme, themePreset } = sanitizeTheme(settings)
  if (themePreset !== 'legacy') return THEME_PALETTES[themePreset]
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  return { ...THEME_PALETTES[dark ? 'navy-dark' : 'github-light'], name: dark ? '기존 Dark' : '기존 Light', bg: dark ? '#17181d' : '#ffffff', scheme: dark ? 'dark' : 'light' }
}

export function themeSelection(settings: Pick<Settings, 'theme' | 'themePreset'>): ThemeSelection {
  const clean = sanitizeTheme(settings)
  return clean.themePreset === 'legacy' ? clean.theme : clean.themePreset
}

export function themePatchFor(selection: ThemeSelection): Pick<Settings, 'theme' | 'themePreset'> {
  return isThemePreset(selection) ? { theme: THEME_PALETTES[selection].scheme, themePreset: selection } : { theme: selection, themePreset: 'legacy' }
}
