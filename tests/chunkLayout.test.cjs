const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const file = path.join(__dirname, '../src/lib/chunkLayout.ts')
const layout = fs.existsSync(file) ? require(file) : {}

test('dense anchors retain all pairs without overlapping click regions', () => {
  assert.equal(typeof layout.packChunkButtons, 'function', 'dense packing is implemented')
  const packed = layout.packChunkButtons([50,68,86,104,122,140], 220)
  assert.equal(packed.length, 6)
  for (let i=1;i<packed.length;i++) assert.ok(packed[i].top >= packed[i-1].top + packed[i-1].height)
  assert.ok(packed.every(p=>p.top>=0 && p.top+p.height<=220))
})

test('scrolled edge anchors stay within visible gutter', () => {
  assert.equal(typeof layout.packChunkButtons, 'function')
  const packed = layout.packChunkButtons([0,18,196], 200)
  assert.equal(packed.length, 3)
  assert.ok(packed.every(p=>p.top>=0 && p.top+p.height<=200))
})

test('a block clipped by the bottom edge does not shrink unrelated click targets', () => {
  const packed=layout.packChunkButtons([0,234,342,504],506)
  assert.ok(packed.every(p=>p.height===26))
})

test('a captured merge request becomes stale after either model changes', () => {
  assert.equal(typeof layout.isCurrentChunk, 'function', 'version guard is implemented')
  const c={ originalStartLineNumber:3,originalEndLineNumber:3,modifiedStartLineNumber:3,modifiedEndLineNumber:3 }
  const request={ change:c,originalVersion:2,modifiedVersion:4 }
  assert.equal(layout.isCurrentChunk(request,2,4,[{...c}]), true)
  assert.equal(layout.isCurrentChunk(request,3,4,[c]), false)
  assert.equal(layout.isCurrentChunk(request,2,5,[c]), false)
  assert.equal(layout.isCurrentChunk(request,2,4,[]), false)
})

test('scrolling into a long changed block keeps its controls at the viewport edge', () => {
  assert.equal(typeof layout.visibleChunkAnchor,'function')
  assert.equal(layout.visibleChunkAnchor(-120,300,200),0)
  assert.equal(layout.visibleChunkAnchor(-120,-1,200),null)
  assert.equal(layout.visibleChunkAnchor(201,300,200),null)
  assert.equal(layout.visibleChunkAnchor(30,80,200),30)
})
