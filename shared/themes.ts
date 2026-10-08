import type { Settings, ThemeSetting } from './ipc'

export const THEME_PRESET_IDS = ['ink', 'midnight', 'graphite', 'plum', 'mist', 'paper'] as const
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

// DiffDesk's own palettes, authored here from neutral surfaces and readable
// syntax/diff colors. No external theme definitions or theme palette imports.
// This is the shared source for CSS, Monaco and the native window background.
export const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  ink: {
    name: '먹색', note: '검은 바탕과 부드러운 잉크색', scheme: 'dark',
    bg: '#111315', chrome: '#1b1e21', text: '#e5e8eb', muted: '#a8afb5',
    'line-number': '#969fa8', border: '#394047', accent: '#b6c4e5', 'accent-bg': '#293546',
    keyword: '#c9b4dc', string: '#c8c29f', number: '#9ecdbf', comment: '#a8afb5',
    selection: '#39445c', added: '#1d3027', 'word-add': '#2a493b',
    deleted: '#321f29', 'word-del': '#4f2e3d', rim: '#48515a', shadow: '#05060760',
    glow: '#b6c4e51b', 'add-foreground': '#b2d4bd', 'del-foreground': '#e3b4c3'
  },
  midnight: {
    name: '밤하늘', note: '짙은 밤색과 푸른 포인트', scheme: 'dark',
    bg: '#15202b', chrome: '#1d2b39', text: '#e0e9ee', muted: '#a8bdca',
    'line-number': '#94adbe', border: '#394e60', accent: '#a1cce6', 'accent-bg': '#2c4256',
    keyword: '#c2b6e4', string: '#d2c39e', number: '#a6d6c5', comment: '#a8bdca',
    selection: '#3b526d', added: '#1e382f', 'word-add': '#2b5141',
    deleted: '#392936', 'word-del': '#533948', rim: '#4e6479', shadow: '#07111b55',
    glow: '#a1cce620', 'add-foreground': '#b3d9bd', 'del-foreground': '#e8bacb'
  },
  graphite: {
    name: '흑연', note: '회색 바탕과 따뜻한 포인트', scheme: 'dark',
    bg: '#25282d', chrome: '#2c3036', text: '#e6e4e0', muted: '#b7b3aa',
    'line-number': '#aaa79f', border: '#50545a', accent: '#dfbe92', 'accent-bg': '#473e34',
    keyword: '#d5b1cf', string: '#b8ceb0', number: '#e3c3a0', comment: '#b7b3aa',
    selection: '#4b4b60', added: '#2e3c31', 'word-add': '#405443',
    deleted: '#432e37', 'word-del': '#5b3a48', rim: '#656970', shadow: '#10121555',
    glow: '#dfbe921c', 'add-foreground': '#c0dbb9', 'del-foreground': '#edbdc8'
  },
  plum: {
    name: '자주빛', note: '자주색 바탕과 은은한 색 대비', scheme: 'dark',
    bg: '#241d29', chrome: '#302637', text: '#eee3ec', muted: '#c2acc1',
    'line-number': '#b79eb7', border: '#57425c', accent: '#d4b3ca', 'accent-bg': '#47344b',
    keyword: '#d8aed3', string: '#b9d1ba', number: '#e3c49e', comment: '#c2acc1',
    selection: '#59425f', added: '#2b3a31', 'word-add': '#3b5142',
    deleted: '#452c38', 'word-del': '#633b4d', rim: '#6b5271', shadow: '#130d1855',
    glow: '#d4b3ca20', 'add-foreground': '#bddbbf', 'del-foreground': '#ebbbce'
  },
  mist: {
    name: '청안개', note: '청록 회색과 차분한 밝기', scheme: 'dark',
    bg: '#273539', chrome: '#304146', text: '#e2ece9', muted: '#b6c6c4',
    'line-number': '#a6bcb9', border: '#52696c', accent: '#bdd6ce', 'accent-bg': '#3a5255',
    keyword: '#c5c9e6', string: '#c9d4ac', number: '#dec3b8', comment: '#b6c6c4',
    selection: '#4b626c', added: '#33473b', 'word-add': '#46614e',
    deleted: '#49363f', 'word-del': '#634650', rim: '#668083', shadow: '#16242850',
    glow: '#bdd6ce1c', 'add-foreground': '#c7e0bd', 'del-foreground': '#f0c2cc'
  },
  paper: {
    name: '백지', note: '따뜻한 밝은 바탕과 또렷한 글자', scheme: 'light',
    bg: '#fdfcf9', chrome: '#f3f1eb', text: '#303337', muted: '#60665f',
    'line-number': '#71766f', border: '#c7ccc3', accent: '#365b80', 'accent-bg': '#e4eaf0',
    keyword: '#78466d', string: '#426745', number: '#885333', comment: '#60665f',
    selection: '#d3e0ee', added: '#eaf1e5', 'word-add': '#d4e4ca',
    deleted: '#f7eaea', 'word-del': '#edcfd4', rim: '#dce0d7', shadow: '#30333722',
    glow: '#365b8017', 'add-foreground': '#365f3d', 'del-foreground': '#863d52'
  }
}

// Read-only compatibility aliases for saved settings. These IDs never appear
// in the picker or select a retained external palette.
const LEGACY_THEME_IDS: Readonly<Record<string, ThemePreset>> = {
  'deep-dark': 'ink', 'navy-dark': 'midnight', 'one-dark': 'graphite',
  dracula: 'plum', nord: 'mist', 'github-light': 'paper'
}

export function isThemePreset(value: unknown): value is ThemePreset {
  return typeof value === 'string' && THEME_PRESET_IDS.includes(value as ThemePreset)
}

export function sanitizeTheme(raw: { theme?: unknown; themePreset?: unknown }): Pick<Settings, 'theme' | 'themePreset'> {
  const theme = raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system'
  const value = raw.themePreset
  const migrated = isThemePreset(value) ? value
    : typeof value === 'string' && Object.hasOwn(LEGACY_THEME_IDS, value) ? LEGACY_THEME_IDS[value] : null
  const themePreset = migrated && theme !== 'system' && THEME_PALETTES[migrated].scheme === theme ? migrated : 'legacy'
  return { theme, themePreset }
}

export function resolveTheme(settings: Pick<Settings, 'theme' | 'themePreset'>, systemDark: boolean): ThemePalette {
  const { theme, themePreset } = sanitizeTheme(settings)
  if (themePreset !== 'legacy') return THEME_PALETTES[themePreset]
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  return {
    ...THEME_PALETTES[dark ? 'midnight' : 'paper'],
    name: dark ? '기본 다크' : '기본 라이트',
    bg: dark ? '#17181d' : '#ffffff',
    scheme: dark ? 'dark' : 'light'
  }
}

export function themeSelection(settings: Pick<Settings, 'theme' | 'themePreset'>): ThemeSelection {
  const clean = sanitizeTheme(settings)
  return clean.themePreset === 'legacy' ? clean.theme : clean.themePreset
}

export function themePatchFor(selection: ThemeSelection): Pick<Settings, 'theme' | 'themePreset'> {
  return isThemePreset(selection) ? { theme: THEME_PALETTES[selection].scheme, themePreset: selection } : { theme: selection, themePreset: 'legacy' }
}
