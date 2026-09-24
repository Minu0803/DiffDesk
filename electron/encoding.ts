import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as iconv from 'iconv-lite'
import * as jschardet from 'jschardet'
import { FilePayload, MAX_FILE_BYTES } from '../shared/ipc'

// 20MB 전체를 훑으면 감지에 수 초가 걸릴 수 있어 앞부분만 샘플링
const DETECT_SAMPLE_BYTES = 1024 * 1024
const DETECT_MIN_CONFIDENCE = 0.8

interface BomInfo {
  encoding: 'utf8' | 'utf16le' | 'utf16be'
  length: number
}

function sniffBom(buf: Buffer): BomInfo | null {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return { encoding: 'utf8', length: 3 }
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return { encoding: 'utf16le', length: 2 }
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return { encoding: 'utf16be', length: 2 }
  }
  return null
}

// 한국어 환경 보정: jschardet가 EUC-KR/CP949 텍스트를 GB2312·windows-949 등으로 오탐하는 일이 잦다.
// iconv-lite의 euc-kr 코덱은 cp949 테이블 기반이라 euc-kr 수렴으로 확장 한글까지 커버된다.
const EUC_KR_ALIASES = new Set([
  'euckr', 'cp949', 'windows949', 'uhc', 'ksc56011987',
  'gb2312', 'gbk', 'gb18030'
])

function normalizeEncoding(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (EUC_KR_ALIASES.has(key)) return 'euc-kr'
  if (key === 'ascii' || key === 'utf8') return 'utf8'
  if (key === 'utf16le' || key === 'utf16') return 'utf16le'
  if (key === 'utf16be') return 'utf16be'
  return iconv.encodingExists(raw) ? raw.toLowerCase() : 'utf8'
}

export function detectAndDecode(name: string, filePath: string, raw: Buffer, truncated: boolean): FilePayload {
  const bom = sniffBom(raw)
  const body = bom ? raw.subarray(bom.length) : raw
  let encoding = 'utf8'
  if (bom) {
    encoding = bom.encoding
  } else if (body.length > 0) {
    let detected: jschardet.IDetectedMap | null = null
    try {
      detected = jschardet.detect(body.length > DETECT_SAMPLE_BYTES ? body.subarray(0, DETECT_SAMPLE_BYTES) : body)
    } catch {
      detected = null
    }
    // detected.encoding은 타입상 string이지만 판별 실패 시 런타임 null
    if (detected && detected.encoding && detected.confidence >= DETECT_MIN_CONFIDENCE) {
      encoding = normalizeEncoding(detected.encoding)
    }
  }
  return {
    path: filePath,
    name,
    content: iconv.decode(body, encoding, { stripBOM: false }),
    encoding,
    hadBom: bom !== null,
    truncated
  }
}

export async function readFilePayload(filePath: string): Promise<FilePayload> {
  const abs = path.resolve(filePath)
  let file: fs.FileHandle | undefined
  try {
    file = await fs.open(abs, 'r')
    const stat = await file.stat()
    if (!stat.isFile()) throw new Error('not a regular file')
    const total = Math.min(stat.size, MAX_FILE_BYTES)
    const buf = Buffer.allocUnsafe(total)
    let offset = 0
    while (offset < total) {
      const { bytesRead } = await file.read(buf, offset, total - offset, offset)
      if (bytesRead <= 0) break
      offset += bytesRead
    }
    const data = offset === total ? buf : buf.subarray(0, offset)
    return detectAndDecode(path.basename(abs), abs, data, stat.size > MAX_FILE_BYTES)
  } catch {
    throw new Error(`파일을 읽을 수 없습니다: ${abs}`)
  } finally {
    await file?.close().catch(() => undefined)
  }
}

export function decodeBufferPayload(name: string, data: ArrayBuffer | Uint8Array): FilePayload {
  const raw = data instanceof Uint8Array
    ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    : Buffer.from(data)
  const truncated = raw.length > MAX_FILE_BYTES
  return detectAndDecode(name, '', truncated ? raw.subarray(0, MAX_FILE_BYTES) : raw, truncated)
}

export function encodeForSave(content: string, encoding: string, hadBom: boolean): Buffer {
  const target = iconv.encodingExists(encoding) ? encoding : 'utf8'
  return iconv.encode(content, target, { addBOM: hadBom })
}
