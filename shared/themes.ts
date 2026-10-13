import type { Settings, ThemeSetting } from './ipc'

export const THEME_PRESET_IDS = ['midnight', 'graphite', 'plum', 'mist', 'paper'] as const
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
  'selection-foreground': string
  'selection-border': string
  'inactive-selection': string
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
const DEFAULT_BLACK_PALETTE: ThemePalette = {
    name: '기본 블랙', note: '블랙 바탕과 또렷한 변경 표시', scheme: 'dark',
    bg: '#0e0e0e', chrome: '#181818', text: '#ededed', muted: '#adadad',
    'line-number': '#999999', border: '#303030', accent: '#a6c5ff', 'accent-bg': '#262626',
    keyword: '#d1b8ee', string: '#d3dca8', number: '#ecc79e', comment: '#b4b4b4',
    selection: '#2455a4', 'selection-foreground': '#ffffff', 'selection-border': '#89b9ff', 'inactive-selection': '#29405f',
    added: '#163328', 'word-add': '#25543d',
    deleted: '#391e1e', 'word-del': '#603030', rim: '#424242', shadow: '#00000066',
    glow: '#a6c5ff20', 'add-foreground': '#78dfa4', 'del-foreground': '#ff9990'
}

export const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  midnight: {
    name: '밤하늘', note: '짙은 밤색과 푸른 포인트', scheme: 'dark',
    bg: '#15202b', chrome: '#1d2b39', text: '#e0e9ee', muted: '#a8bdca',
    'line-number': '#94adbe', border: '#394e60', accent: '#a1cce6', 'accent-bg': '#2c4256',
    keyword: '#c2b6e4', string: '#d2c39e', number: '#a6d6c5', comment: '#a8bdca',
    selection: '#2455a4', 'selection-foreground': '#ffffff', 'selection-border': '#89b9ff', 'inactive-selection': '#29405f',
    added: '#1b3c30', 'word-add': '#295640',
    deleted: '#40252a', 'word-del': '#60343c', rim: '#4e6479', shadow: '#07111b55',
    glow: '#a1cce620', 'add-foreground': '#85e0ad', 'del-foreground': '#ffaca4'
  },
  graphite: {
    name: '흑연', note: '회색 바탕과 따뜻한 포인트', scheme: 'dark',
    bg: '#25282d', chrome: '#2c3036', text: '#e6e4e0', muted: '#b7b3aa',
    'line-number': '#aaa79f', border: '#50545a', accent: '#dfbe92', 'accent-bg': '#473e34',
    keyword: '#d5b1cf', string: '#b8ceb0', number: '#e3c3a0', comment: '#b7b3aa',
    selection: '#2455a4', 'selection-foreground': '#ffffff', 'selection-border': '#89b9ff', 'inactive-selection': '#29405f',
    added: '#284335', 'word-add': '#365642',
    deleted: '#4b2a2b', 'word-del': '#66393b', rim: '#656970', shadow: '#10121555',
    glow: '#dfbe921c', 'add-foreground': '#a2e5b9', 'del-foreground': '#ffafa7'
  },
  plum: {
    name: '자주빛', note: '자주색 바탕과 은은한 색 대비', scheme: 'dark',
    bg: '#241d29', chrome: '#302637', text: '#eee3ec', muted: '#c2acc1',
    'line-number': '#b79eb7', border: '#57425c', accent: '#d4b3ca', 'accent-bg': '#47344b',
    keyword: '#d8aed3', string: '#b9d1ba', number: '#e3c49e', comment: '#c2acc1',
    selection: '#2455a4', 'selection-foreground': '#ffffff', 'selection-border': '#89b9ff', 'inactive-selection': '#29405f',
    added: '#264332', 'word-add': '#36563f',
    deleted: '#4b2835', 'word-del': '#683849', rim: '#6b5271', shadow: '#130d1855',
    glow: '#d4b3ca20', 'add-foreground': '#9be1b4', 'del-foreground': '#ffabb8'
  },
  mist: {
    name: '청안개', note: '청록 회색과 차분한 밝기', scheme: 'dark',
    bg: '#273539', chrome: '#304146', text: '#e2ece9', muted: '#b6c6c4',
    'line-number': '#a6bcb9', border: '#52696c', accent: '#bdd6ce', 'accent-bg': '#3a5255',
    keyword: '#c5c9e6', string: '#c9d4ac', number: '#dec3b8', comment: '#b6c6c4',
    selection: '#2455a4', 'selection-foreground': '#ffffff', 'selection-border': '#89b9ff', 'inactive-selection': '#29405f',
    added: '#304e3c', 'word-add': '#41634b',
    deleted: '#51343b', 'word-del': '#69414c', rim: '#668083', shadow: '#16242850',
    glow: '#bdd6ce1c', 'add-foreground': '#b5efbf', 'del-foreground': '#ffc2c0'
  },
  paper: {
    name: '백지', note: '따뜻한 밝은 바탕과 또렷한 글자', scheme: 'light',
    bg: '#fdfcf9', chrome: '#f3f1eb', text: '#303337', muted: '#60665f',
    'line-number': '#71766f', border: '#c7ccc3', accent: '#365b80', 'accent-bg': '#e4eaf0',
    keyword: '#78466d', string: '#426745', number: '#885333', comment: '#60665f',
    selection: '#bed8ff', 'selection-foreground': '#152b4b', 'selection-border': '#3566ab', 'inactive-selection': '#d6e3f5',
    added: '#e0efdf', 'word-add': '#badcb9',
    deleted: '#f8e2df', 'word-del': '#f0bfb9', rim: '#dce0d7', shadow: '#30333722',
    glow: '#365b8017', 'add-foreground': '#28603b', 'del-foreground': '#963e38'
  }
}

// Read-only compatibility aliases for saved settings. These IDs never appear
// in the picker or select a retained external palette.
const LEGACY_THEME_IDS: Readonly<Record<string, ThemePreset | 'dark'>> = {
  ink: 'dark', 'deep-dark': 'dark', 'navy-dark': 'midnight', 'one-dark': 'graphite',
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
  const themePreset = isThemePreset(migrated) && theme !== 'system' && THEME_PALETTES[migrated].scheme === theme ? migrated : 'legacy'
  return { theme, themePreset }
}

export function resolveTheme(settings: Pick<Settings, 'theme' | 'themePreset'>, systemDark: boolean): ThemePalette {
  const { theme, themePreset } = sanitizeTheme(settings)
  if (themePreset !== 'legacy') return THEME_PALETTES[themePreset]
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  return {
    ...(dark ? DEFAULT_BLACK_PALETTE : THEME_PALETTES.paper),
    name: dark ? '기본 블랙' : '기본 라이트',
    bg: dark ? '#0e0e0e' : '#ffffff',
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
