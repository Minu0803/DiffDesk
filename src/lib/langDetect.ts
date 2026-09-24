import * as monaco from 'monaco-editor'

/** UI-SPEC §4.4 큐레이션 목록 ('자동'은 셀렉트에서 value=''로 별도 표기) */
export const LANGUAGE_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'json', label: 'JSON' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'xml', label: 'XML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'sql', label: 'SQL' },
  { id: 'csharp', label: 'C#' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'shell', label: 'Shell' },
  { id: 'powershell', label: 'PowerShell' },
  { id: 'yaml', label: 'YAML' },
  { id: 'ini', label: 'INI' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'swift', label: 'Swift' },
  { id: 'dockerfile', label: 'Dockerfile' }
]

export function languageLabel(id: string): string {
  const hit = LANGUAGE_OPTIONS.find((o) => o.id === id)
  if (hit) return hit.label
  if (!id) return 'Plain Text'
  return id.charAt(0).toUpperCase() + id.slice(1)
}

/** 파일명 기반 자동 감지 — monaco 언어 레지스트리의 filenames/extensions 활용. 미확정이면 null */
export function detectLanguage(fileName: string): string | null {
  if (!fileName) return null
  const lower = fileName.toLowerCase()
  const dot = lower.lastIndexOf('.')
  const ext = dot >= 0 ? lower.slice(dot) : ''
  const languages = monaco.languages.getLanguages()
  for (const lang of languages) {
    if (lang.filenames?.some((f) => f.toLowerCase() === lower)) return lang.id
  }
  if (!ext) return null
  for (const lang of languages) {
    if (lang.extensions?.some((e) => e.toLowerCase() === ext)) return lang.id
  }
  return null
}
