const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const file=path.join(__dirname,'../src/lib/freshDiff.ts')
const fresh=fs.existsSync(file)?require(file):{}

test('a late worker publication cannot acquire new versions after an edit', () => {
  assert.equal(typeof fresh.createFreshDiffSession,'function','fresh computation sessions exist')
  let versions={original:1,modified:1}, attached=null
  let disposeCount=0
  const engine={createViewModel:()=>({dispose(){disposeCount++}}),setModel(vm){attached=vm}}
  const session=fresh.createFreshDiffSession(engine,()=>({...versions}),100)
  session.recompute()
  assert.deepEqual(session.getVersions(),{original:1,modified:1})
  const oldWorkerOwner=attached
  versions={original:2,modified:1}
  session.invalidate()
  // A publication from the old engine may arrive now. Approval must remain null,
  // instead of stamping that old worker's ranges with model version 2.
  assert.equal(session.getVersions(),null)
  session.recompute()
  assert.notEqual(attached,oldWorkerOwner)
  assert.deepEqual(session.getVersions(),{original:2,modified:1})
  assert.ok(disposeCount>=1)
  versions={original:3,modified:1}
  assert.equal(session.getVersions(),null)
  session.dispose()
})

test('rapid edits coalesce before starting a fresh computation', async () => {
  assert.equal(typeof fresh.createFreshDiffSession,'function')
  let versions={original:1,modified:1},computations=0
  const engine={createViewModel:()=>{computations++;return {dispose(){}}},setModel(){}}
  const session=fresh.createFreshDiffSession(engine,()=>({...versions}),5)
  session.recompute()
  session.invalidate();versions.modified=2;session.invalidate();versions.modified=3;session.invalidate()
  await new Promise(resolve=>setTimeout(resolve,20))
  assert.equal(computations,2)
  assert.deepEqual(session.getVersions(),{original:1,modified:3})
  session.dispose()
})
