// Real native mouse drags and captures in an isolated profile. No production
// editor handles or renderer test API are needed; this file is not packaged.
const { app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { PNG } = require('pngjs')
const root = path.resolve(__dirname, '..')
require('./test-register.cjs')
const { QA_LEFT, QA_RIGHT } = require('../src/qa/sample.ts')
const { DEFAULT_SETTINGS } = require('../dist-electron/shared/ipc.js')
const { themePatchFor, resolveTheme } = require('../dist-electron/shared/themes.js')
const theme = process.env.DIFFDESK_APPEARANCE_THEME || 'dark'
const label = process.env.DIFFDESK_APPEARANCE_LABEL || 'dark-1'
const minimum = process.env.DIFFDESK_APPEARANCE_MINIMUM === '1'
const outputDir = process.env.DIFFDESK_APPEARANCE_OUTPUT || path.join(root, 'build/appearance')
const profile = path.join(root, 'build/appearance-profile-' + label)
fs.mkdirSync(profile, { recursive: true })
fs.mkdirSync(outputDir, { recursive: true })
const settings = process.env.DIFFDESK_APPEARANCE_LEGACY_BLACK === '1'
  ? { ...DEFAULT_SETTINGS, theme: 'dark', themePreset: 'ink' }
  : { ...DEFAULT_SETTINGS, ...themePatchFor(theme) }
fs.writeFileSync(path.join(profile, 'settings.json'), JSON.stringify(settings))
app.setPath('userData', profile)
const errors = []
const timer = setTimeout(() => { console.error('Appearance QA timed out'); app.exit(1) }, 45000)
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const assert = (condition, message) => { if (!condition) throw new Error(message) }

app.on('browser-window-created', (_event, win) => {
  if (minimum) win.setSize(960, 600)
  win.webContents.setBackgroundThrottling(false)
  win.show = () => { win.setOpacity(0); win.setSkipTaskbar(true); win.showInactive() }
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message) })
  const js = async code => {
    try { return await win.webContents.executeJavaScript(code) }
    catch (error) { console.error('QA renderer probe failed:', code); throw error }
  }
  const waitFor = async (code, message) => {
    const start = Date.now()
    while (!await js(code)) { if (Date.now() - start > 8000) throw new Error(message); await pause(40) }
  }
  const capture = async name => {
    await pause(120)
    const image = await win.webContents.capturePage()
    fs.writeFileSync(path.join(outputDir, label + '-' + name + '.png'), image.toPNG())
    return PNG.sync.read(image.toPNG())
  }
  const mouse = (type, p, extra = {}) => win.webContents.sendInputEvent({ type, x: Math.round(p.x), y: Math.round(p.y), ...extra })
  const drag = async (from, to) => {
    mouse('mouseDown', from, { button: 'left', clickCount: 1, modifiers: ['leftButtonDown'] })
    for (let step = 1; step <= 8; step++) {
      mouse('mouseMove', { x: from.x + (to.x - from.x) * step / 8, y: from.y + (to.y - from.y) * step / 8 }, { modifiers: ['leftButtonDown'] })
      await pause(20)
    }
    mouse('mouseUp', to, { button: 'left', clickCount: 1 })
    await pause(100)
  }
  win.webContents.once('did-finish-load', async () => {
    try {
      await waitFor(`document.querySelectorAll('.monaco-editor textarea').length >= 2 && document.querySelector('.dd-band__hint')`, 'Editors did not initialize')
      win.focus()
      await waitFor('document.hasFocus()', 'The native drag test needs focus')
      await js(`document.querySelector('.dd-theme-trigger').click()`)
      await waitFor(`!!document.querySelector('.dd-theme-menu')`, 'Theme menu must open')
      const themeChoices = await js(`(() => {
        const menu=document.querySelector('.dd-theme-menu'), inputs=[...menu.querySelectorAll('input')];
        return {values:inputs.map(e=>e.value),blackCount:[...menu.querySelectorAll('.dd-theme-option__label')].filter(e=>e.firstChild.textContent==='기본 블랙').length,oldInk:menu.textContent.includes('먹색'),selected:menu.querySelector('input:checked').value};
      })()`)
      assert(!themeChoices.values.includes('ink') && !themeChoices.oldInk && themeChoices.blackCount === 1, 'Theme menu must offer only one black option')
      if (theme === 'dark') assert(themeChoices.selected === 'dark', 'Stored black settings must select the canonical black option')
      await js(`document.querySelector('.dd-theme-menu').getAnimations().forEach(animation=>animation.finish())`)
      await capture('themes')
      await js(`document.querySelector('.dd-theme-trigger').click()`)
      await js(`(() => {
        const area = document.querySelector('.dd-editor-area'), r = area.getBoundingClientRect(), dt = new DataTransfer();
        dt.items.add(new File([${JSON.stringify(QA_LEFT)}], 'sample-left.ts', {type:'text/plain'}));
        dt.items.add(new File([${JSON.stringify(QA_RIGHT)}], 'sample-right.ts', {type:'text/plain'}));
        area.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt,clientX:r.left+80,clientY:r.top+30}));
      })()`)
      await waitFor(`document.querySelectorAll('.dd-chunk-btn:not(:disabled)').length >= 2 && document.querySelector('.dd-band').textContent.includes('차이 5개')`, 'Sample diff did not settle')
      await waitFor(`new Set([...document.querySelectorAll('.view-line span')].map(e=>getComputedStyle(e).color)).size>3`, 'Syntax colors did not load')
      await capture('diff')
      const points = await js(`(() => {
        const editor=document.querySelectorAll('.monaco-editor')[0];
        const line=text=>[...editor.querySelectorAll('.view-line')].find(e=>e.textContent.replace(/\u00a0/g,' ').includes(text));
        const a=line('let sum = 0').getBoundingClientRect(), b=line('sum += item.price').getBoundingClientRect();
        return {from:{x:a.left+22,y:a.top+a.height/2},to:{x:b.left+95,y:b.top+b.height/2}};
      })()`)
      await drag(points.from, points.to)
      await waitFor(`document.querySelector('.dd-statusbar__position').textContent.includes('선택')`, 'Native drag must update the selected range')
      const selected = await js(`(() => {
        const s=[...document.querySelectorAll('.selected-text')].filter(e=>e.getBoundingClientRect().width>20), r=s[0].getBoundingClientRect(), style=getComputedStyle(s[0]);
        const status=document.querySelector('.dd-statusbar');
        return {label:document.querySelector('.dd-statusbar__position').textContent,rect:{x:r.x,y:r.y,width:r.width,height:r.height},color:style.backgroundColor,z:style.zIndex,shadow:style.boxShadow,scale:devicePixelRatio,statusOverflow:status.scrollWidth>status.clientWidth};
      })()`)
      const png = await capture('selection')
      const palette = resolveTheme(settings, true)
      const wanted = [1,3,5].map(i=>parseInt(palette.selection.slice(i,i+2),16))
      const foreground = [1,3,5].map(i=>parseInt(palette['selection-foreground'].slice(i,i+2),16))
      const r = selected.rect, ratio = selected.scale
      let pixels = 0
      let glyphPixels = 0
      for (let y=Math.ceil((r.y+2)*ratio);y<Math.floor((r.y+r.height-2)*ratio);y++) for(let x=Math.ceil((r.x+2)*ratio);x<Math.floor((r.x+r.width-2)*ratio);x++) {
        const offset=(y*png.width+x)*4
        // Native capture can apply the display's color profile.
        if(wanted.every((v,i)=>Math.abs(v-png.data[offset+i])<=8)) pixels++
        if(foreground.every((v,i)=>Math.abs(v-png.data[offset+i])<=35)) glyphPixels++
      }
      assert(pixels > 20, 'Selection background must actually paint above changed text')
      assert(glyphPixels > 5, 'Selected code must remain visible above its selection background')
      assert(selected.z === '1', 'Selection must stay above diff backgrounds')
      assert(!selected.statusOverflow, 'Selection range must fit in the status bar')
      const selectedColors = await js(`[...document.querySelectorAll('.view-line .dd-selected-text')].map(e=>getComputedStyle(e).color)`)
      assert(selectedColors.length > 0 && new Set(selectedColors).size === 1, 'Selected syntax must use a consistent readable foreground')
      // Reverse the drag, then collapse the selection with a click.
      await drag(points.to, points.from)
      const reverseLabel = await js(`document.querySelector('.dd-statusbar__position').textContent`)
      assert(reverseLabel === selected.label, 'Reverse drag must report the same normalized range')
      mouse('mouseDown', points.from, {button:'left',clickCount:1,modifiers:['leftButtonDown']}); mouse('mouseUp', points.from, {button:'left',clickCount:1})
      await waitFor(`!document.querySelector('.dd-statusbar__position').textContent.includes('선택')`, 'Clicking must clear selection feedback')
      // Check drop feedback before and after moving the native split sash.
      const drop = await js(`(() => {
        const area=document.querySelector('.dd-editor-area'), r=area.getBoundingClientRect(), dt=new DataTransfer();
        dt.items.add(new File(['preview'], 'preview.txt'));
        area.dispatchEvent(new DragEvent('dragover',{bubbles:true,dataTransfer:dt,clientX:r.right-80,clientY:r.top+80}));
        return true;
      })()`)
      await waitFor(`document.querySelector('.dd-drop-overlay--right').classList.contains('is-visible')`, 'Right drop target must be highlighted')
      await capture('drop')
      await js(`window.dispatchEvent(new DragEvent('dragend',{bubbles:true}))`)
      await waitFor(`!document.querySelector('.dd-drop-overlay.is-visible')`, 'Cancelled drag must clear its target')
      const sash = await js(`(() => {const r=document.querySelector('.monaco-sash.vertical').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+100}})()`)
      await drag(sash, {x:sash.x-100,y:sash.y})
      await pause(150)
      const layout = await js(`(() => {
        const lane=document.querySelector('.dd-merge-lane').getBoundingClientRect(), left=document.querySelector('.dd-drop-overlay--left').getBoundingClientRect(), right=document.querySelector('.dd-drop-overlay--right').getBoundingClientRect(), status=document.querySelector('.dd-statusbar'), app=document.querySelector('.dd-app').getBoundingClientRect();
        return {width:innerWidth,background:getComputedStyle(document.body).backgroundColor,startup:window.api.initialBackground,laneWidth:lane.width,dropAligned:Math.abs(left.right-lane.left)<2&&Math.abs(right.left-lane.right)<2,toolbarOverflow:[...document.querySelectorAll('.dd-toolbar button,.dd-toolbar select')].filter(e=>e.getBoundingClientRect().right>app.right).length,statusOverflow:status.scrollWidth>status.clientWidth,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches};
      })()`)
      assert(layout.dropAligned, 'Drop overlays must follow a moved split')
      assert(!layout.toolbarOverflow && !layout.statusOverflow, 'Chrome must fit the window')
      assert(layout.startup === palette.bg, 'Native first paint must match the palette')
      if (minimum) assert(layout.reduced, 'Reduced motion must be active')
      // Focus switches restore the focused editor's range. Replacing selected
      // text must clear feedback/decorations, and undo must remain available.
      await drag(points.from, points.to)
      const rightPoints = await js(`(() => {
        const editor=document.querySelectorAll('.monaco-editor')[1], line=[...editor.querySelectorAll('.view-line')].find(e=>e.textContent.replace(/\u00a0/g,' ').includes('const sum = items.reduce')), r=line.getBoundingClientRect();
        return {from:{x:r.left+22,y:r.top+r.height/2},to:{x:r.left+130,y:r.top+r.height/2}};
      })()`)
      await drag(rightPoints.from, rightPoints.to)
      await waitFor(`document.querySelector('.dd-statusbar__position').textContent.includes('선택 14:') && document.querySelector('.dd-status-undo').textContent.includes('오른쪽')`, 'Focused range must follow the right editor')
      await js(`document.querySelectorAll('.monaco-editor textarea')[0].focus()`)
      await waitFor(`document.querySelector('.dd-statusbar__position').textContent === ${JSON.stringify(selected.label)}`, 'Refocusing must restore the left range')
      win.webContents.insertText('replacement')
      await waitFor(`!document.querySelector('.dd-statusbar__position').textContent.includes('선택') && !document.querySelectorAll('.monaco-editor')[0].querySelector('.dd-selected-text')`, 'Typing must clear selected-range feedback and styling')
      await js(`document.querySelector('.dd-status-undo').click()`)
      await waitFor(`document.querySelector('.dd-band').textContent.includes('차이 5개')`, 'Undo must restore the sample diff')
      await js(`document.querySelectorAll('.monaco-editor textarea')[1].focus()`)
      await waitFor(`document.querySelector('.dd-statusbar__position').textContent.includes('선택')`, 'Right selection must survive the focus switch')
      await js(`document.querySelector('.dd-pane-header--right button:last-child').click()`)
      await waitFor(`!document.querySelectorAll('.monaco-editor')[1].querySelector('.dd-selected-text') && !document.querySelector('.dd-statusbar__position').textContent.includes('선택')`, 'Clearing a selected document must remove its selection feedback and decorations')
      await js(`(() => {const area=document.querySelector('.dd-editor-area'),r=area.getBoundingClientRect(),dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(QA_RIGHT)}],'reloaded-right.ts'));area.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt,clientX:r.right-80,clientY:r.top+80}));})()`)
      await waitFor(`document.querySelector('.dd-pane-header--right').textContent.includes('reloaded-right.ts') && !document.querySelector('.dd-statusbar__position').textContent.includes('선택')`, 'Reloading must keep selection feedback clear')
      assert(!errors.length, 'Renderer must have no error messages')
      fs.writeFileSync(path.join(outputDir, label + '.json'), JSON.stringify({ ...layout, themeChoices, selection: selected.label, selectionPixels: pixels, selectedGlyphPixels:glyphPixels, reverseDrag:true, selectionCleared:true, selectionFocus:true, replaceSelection:true, undo:true, clearSelectedDocument:true, reload:true, drop, cancelledDrop:true, errors }, null, 2))
      clearTimeout(timer)
      app.exit(0)
    } catch (error) { console.error(error); app.exit(1) }
  })
})
require('../dist-electron/electron/main.js')
