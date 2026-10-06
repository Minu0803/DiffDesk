export interface DiffVersions { original: number; modified: number }

/** Every attached computation belongs to one model-version pair. Invalidate
 * BEFORE Monaco's content listeners run: 0.52 can publish an older in-flight
 * result after an edit. Replacing only the public diff view model cancels that
 * computation; the two text models, editors, undo and selections stay intact. */
export function createFreshDiffSession<VM extends { dispose(): void }>(
  engine: { createViewModel(): VM; setModel(vm: VM): void },
  readVersions: () => DiffVersions,
  debounceMs = 100
) {
  let owner: VM | null = null
  let versions: DiffVersions | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  const recompute = () => {
    clearTimeout(timer)
    if (disposed) return
    const previous = owner
    owner = engine.createViewModel()
    versions = readVersions()
    engine.setModel(owner)
    previous?.dispose()
  }
  return {
    recompute,
    invalidate() { versions = null; clearTimeout(timer); if(!disposed)timer=setTimeout(recompute,debounceMs) },
    getVersions(): DiffVersions | null {
      const current=readVersions()
      return versions && current.original===versions.original && current.modified===versions.modified ? {...versions} : null
    },
    dispose() { disposed=true;clearTimeout(timer);versions=null;owner?.dispose();owner=null }
  }
}
