// Native document-exchange regression check, using only real app controls.
const { app, Menu } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..')
const minimum = process.env.DIFFDESK_SWAP_MINIMUM === '1'
const outputDir = process.env.DIFFDESK_SWAP_OUTPUT || path.join(root, 'build/swap-qa')
const label = 'swap' + (minimum ? '-min' : '')
const profile = fs.mkdtempSync(path.join(root, 'build/swap-profile-'))
fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(path.join(profile, 'settings.json'), JSON.stringify({ ...require('../dist-electron/shared/ipc.js').DEFAULT_SETTINGS, theme: 'dark' }))
app.setPath('userData', profile)
const errors = []
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const timer = setTimeout(() => { console.error('Swap QA timed out'); app.exit(1) }, 35000)
const source = 'source first\nshared second\n\nsource fourth\nsource fifth\nsource last'
const target = 'target first\nshared second\ntarget third\ntarget fourth\ntarget last'
app.on('browser-window-created', (_event, win) => {
  if (minimum) win.setSize(960, 600)
  win.webContents.setBackgroundThrottling(false)
  win.show = () => { win.setOpacity(0); win.setSkipTaskbar(true); win.showInactive() }
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message) })
  const js = code => win.webContents.executeJavaScript(code)
  const snapshot = () => js(`(() => {
    const editors=[...document.querySelectorAll('.monaco-editor')];
    const text=ed=>[...ed.querySelectorAll('.view-lines .view-line')].map(line=>line.textContent.replace(/\u00a0/g,' ')).join(String.fromCharCode(10));
    const headers=[...document.querySelectorAll('.dd-pane-header')];
    const lane=document.querySelector('.dd-merge-lane').getBoundingClientRect();
    const toolbar=document.querySelector('.dd-toolbar');
    return {left:text(editors[0]),right:text(editors[1]),names:headers.map(h=>h.querySelector('.dd-pane-header__name').textContent),roles:headers.map(h=>h.querySelector('.dd-pane-role').textContent),dirty:headers.map(h=>!!h.querySelector('.dd-pane-header__dirty')),laneWidth:lane.width,gutterHeading:document.querySelector('.dd-gutter-heading')?.textContent,toolbarOverflow:toolbar.scrollWidth>toolbar.clientWidth,feedback:document.querySelector('.dd-statusbar__feedback').textContent};
  })()`)
  const wait = async (condition, message) => {
    const started = Date.now()
    while (!await condition()) { if (Date.now() - started > 6000) throw new Error(message); await pause(40) }
  }
  const load = async (left = source, right = target) => {
    await js(`(() => {const area=document.querySelector('.dd-editor-area'),rect=area.getBoundingClientRect(),data=new DataTransfer();data.items.add(new File([${JSON.stringify(left)}],'source.txt'));data.items.add(new File([${JSON.stringify(right)}],'target.txt'));area.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:rect.left+80,clientY:rect.top+80}));})()`)
    await wait(async () => { const data = await snapshot(); return data.left === left && data.right === right }, 'Fixture documents must load completely')
  }
  const exchange = () => js(`document.querySelector('button[aria-label="좌우 전체 내용 교환"]').click()`)
  const check = async (left, right) => {
    await wait(async () => { const data = await snapshot(); return data.left === left && data.right === right }, 'Both complete contents must exchange')
    const data = await snapshot()
    assert.deepEqual(data.roles, ['− 원본', '+ 대상'], 'Pane roles must remain fixed')
    return data
  }
  win.webContents.once('did-finish-load', async () => {
    try {
      await wait(() => js(`document.querySelectorAll('.monaco-editor textarea').length>=2 && !!document.querySelector('.dd-band__hint')`), 'App must initialize')
      await load()
      assert.ok(await js(`!!document.querySelector('button[aria-label="좌우 전체 내용 교환"]')`), 'The toolbar must expose an explicit full-content exchange action')
      win.focus()
      await js(`document.querySelectorAll('.monaco-editor textarea')[0].focus()`)
      win.webContents.sendInputEvent({type:'keyDown',keyCode:'Home',modifiers:['control']})
      win.webContents.sendInputEvent({type:'keyUp',keyCode:'Home',modifiers:['control']})
      await win.webContents.insertText('edited ')
      await check('edited ' + source, target)
      await exchange()
      const swapped = await check(target, 'edited ' + source)
      assert.deepEqual(swapped.names, ['target.txt', 'source.txt'], 'Document names must follow their current contents')
      assert.deepEqual(swapped.dirty, [false, true], 'Unsaved edits must follow the exchanged document')
      assert.ok(swapped.feedback.includes('교환'), 'The completed action must provide visible feedback')
      assert.equal(swapped.laneWidth, 64, 'The existing merge lane must stay unchanged')
      assert.equal(swapped.gutterHeading, '부분 병합', 'The existing merge heading must stay unchanged')
      assert.equal(swapped.toolbarOverflow, false, 'The exchange action must fit in the toolbar')
      await wait(() => js(`!document.querySelector('.dd-band').textContent.includes('계산 중')`), 'Diff recomputation must finish before capture')
      fs.writeFileSync(path.join(outputDir, label + '.png'), (await win.webContents.capturePage()).toPNG())
      await exchange()
      const restored = await check('edited ' + source, target)
      assert.deepEqual(restored.names, ['source.txt', 'target.txt'], 'A second exchange must restore both documents')
      const menu = Menu.getApplicationMenu().items.find(item => item.label === '비교')
      const swapItem = menu.submenu.items.find(item => item.label === '좌우 전체 내용 교환')
      assert.ok(swapItem, 'Native menu must expose the same action')
      assert.equal(swapItem.accelerator, 'Ctrl+Alt+X')
      swapItem.click(swapItem, win)
      await check(target, 'edited ' + source)
      await load(source, '')
      await exchange()
      await check('', source)
      await load('', target)
      await exchange()
      await check(target, '')
      await load('', '')
      await exchange()
      await check('', '')
      await load()
      await wait(() => js(`!!document.querySelector('.dd-chunk-btn:not(:disabled)')`), 'Partial merge must be ready')
      await js(`document.querySelector('.dd-chunk-btn:not(:disabled)').click()`)
      await wait(() => js(`!!document.querySelector('.dd-merge-receipt')`), 'Partial merge must show its receipt')
      await check(source, 'source first\nshared second\ntarget third\ntarget fourth\ntarget last')
      const merged = await snapshot()
      await exchange()
      await check(merged.right, merged.left)
      assert.equal(await js(`!!document.querySelector('.dd-merge-receipt')`), false, 'Full exchange must clear the previous partial-merge receipt')
      await load()
      await js(`document.querySelectorAll('.monaco-editor textarea')[0].focus()`)
      const toggleView = () => js(`[...document.querySelectorAll('.dd-toolbar button')].find(button=>button.title.startsWith('나란히·한줄')).click()`)
      await toggleView()
      await wait(() => js(`document.querySelector('.dd-app').dataset.sideBySide==='false'`), 'Inline view must open')
      await exchange()
      await wait(() => js(`document.querySelector('.dd-pane-header--left .dd-pane-header__name').textContent==='target.txt'`), 'Inline exchange must update document headers')
      assert.equal(await js(`document.querySelectorAll('.monaco-editor')[1].contains(document.activeElement)`), true, 'Inline exchange must focus the visible target editor')
      await toggleView()
      await check(target, source)
      assert.equal(errors.length, 0, 'The renderer must report no errors')
      const result = { fullContents: true, includesUnsavedEdits: true, fixedRoles: true, doubleExchange: true, nativeMenu: true, emptyLeft: true, emptyRight: true, bothEmpty: true, includesPartialMerge: true, clearsOldReceipt: true, inlineView: true, minimum, laneWidth: swapped.laneWidth, toolbarOverflow: swapped.toolbarOverflow, swapped, errors }
      fs.writeFileSync(path.join(outputDir, label + '.json'), JSON.stringify(result, null, 2))
      console.log(JSON.stringify(result))
      clearTimeout(timer)
      app.exit(0)
    } catch (error) { console.error(error); if (errors.length) console.error(JSON.stringify({ rendererErrors: errors })); app.exit(1) }
  })
})
require('../dist-electron/electron/main.js')
