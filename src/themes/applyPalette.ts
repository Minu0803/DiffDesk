import type { Settings } from '../../shared/ipc'
import { resolveTheme, sanitizeTheme } from '../../shared/themes'
import type { ThemePalette } from '../../shared/themes'

function tokens(p: ThemePalette): Record<string, string> {
  return {
    'bg': p.bg, 'bg-elev': p.chrome, 'fg': p.text, 'fg-muted': p.muted, 'fg-faint': p['line-number'],
    'bg-hover': p['accent-bg'], 'bg-active': p['accent-bg'], 'border': p.border, 'border-strong': p.rim,
    'accent': p.accent, 'accent-hover': p.accent, 'accent-soft': p['accent-bg'], 'accent-fg': p.bg,
    'focus-ring': p.accent, 'danger': p['del-foreground'], 'added': p['add-foreground'], 'added-bg': p.added,
    'removed': p['del-foreground'], 'removed-bg': p.deleted, 'modified': p.accent, 'modified-bg': p['accent-bg'],
    'chunkbtn-bg': p.bg, 'chunkbtn-fg': p.text, 'chunkbtn-border': p.border, 'chunkbtn-hover-bg': p['accent-bg'],
    'shadow': '0 1px 3px ' + p.shadow, 'scrollbar-thumb': p.muted + '66',
    'drop-overlay-bg': p.accent + '18', 'drop-overlay-border': p.accent, 'rim': p.rim, 'glow': p.glow
  }
}

export function applyPalette(settings: Pick<Settings, 'theme' | 'themePreset'>, systemDark: boolean): ThemePalette {
  const p = resolveTheme(settings, systemDark)
  const element = document.documentElement
  element.dataset.theme = p.scheme
  const { themePreset } = sanitizeTheme(settings)
  for (const key of Object.keys(tokens(p))) element.style.removeProperty('--dd-' + key)
  if (themePreset !== 'legacy') for (const [key, value] of Object.entries(tokens(p))) element.style.setProperty('--dd-' + key, value)
  element.dataset.preset = themePreset
  return p
}
