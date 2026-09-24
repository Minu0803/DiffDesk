export interface PaneMeta {
  path: string
  name: string
  encoding: string
  hadBom: boolean
  truncated: boolean
  dirty: boolean
}

export function emptyPaneMeta(): PaneMeta {
  return { path: '', name: '', encoding: 'utf8', hadBom: false, truncated: false, dirty: false }
}

const ENCODING_LABELS: Record<string, string> = {
  utf8: 'UTF-8',
  'utf-8': 'UTF-8',
  utf16le: 'UTF-16 LE',
  'utf-16le': 'UTF-16 LE',
  'euc-kr': 'EUC-KR',
  euckr: 'EUC-KR',
  cp949: 'CP949',
  ascii: 'ASCII',
  latin1: 'Latin-1'
}

export function encodingLabel(encoding: string): string {
  return ENCODING_LABELS[encoding.toLowerCase()] ?? encoding.toUpperCase()
}
