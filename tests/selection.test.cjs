const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const source = path.join(__dirname, '../src/lib/selection.ts')
const { selectionLabel } = fs.existsSync(source) ? require(source) : {}
const range = (startLineNumber, startColumn, endLineNumber, endColumn) => ({ startLineNumber, startColumn, endLineNumber, endColumn })

test('clearing a selection removes its range feedback', () => {
  assert.equal(typeof selectionLabel, 'function', 'selection feedback is implemented')
  assert.equal(selectionLabel(null), '')
  assert.equal(selectionLabel([range(3, 2, 3, 2)]), '')
})

test('selection feedback includes both endpoints and only covered lines', () => {
  assert.equal(typeof selectionLabel, 'function', 'selection feedback is implemented')
  assert.equal(selectionLabel([range(14, 3, 17, 4)]), '선택 14:3 → 17:4 · 4줄')
  assert.equal(selectionLabel([range(14, 3, 17, 1)]), '선택 14:3 → 17:1 · 3줄')
  assert.equal(selectionLabel([range(3, 2, 3, 5)]), '선택 3:2 → 3:5 · 1줄')
})

test('multiple selections report each selected range and ignore empty cursors', () => {
  assert.equal(typeof selectionLabel, 'function', 'selection feedback is implemented')
  assert.equal(selectionLabel([range(1, 1, 2, 1), range(4, 1, 5, 2), range(8, 2, 8, 2)]), '선택 2곳 · 3줄')
})
