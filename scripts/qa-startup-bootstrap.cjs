// Measure the real empty-document startup without touching the user's profile.
const { app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const output = process.env.DIFFDESK_STARTUP_OUTPUT
const started = performance.now()
const profile = path.join(root, 'build', 'qa-startup-profile')
fs.mkdirSync(profile, { recursive: true })
const { DEFAULT_SETTINGS } = require('../dist-electron/shared/ipc.js')
const { themePatchFor } = require('../dist-electron/shared/themes.js')
const theme = process.env.DIFFDESK_STARTUP_THEME || 'light'
fs.writeFileSync(path.join(profile, 'settings.json'), JSON.stringify({ ...DEFAULT_SETTINGS, ...themePatchFor(theme) }))
app.setPath('userData', profile)
const timings = {}
const errors = []
app.whenReady().then(() => { timings.appReadyMs = performance.now() - started })
const timeout = setTimeout(() => { console.error('Startup QA timed out'); app.exit(1) }, 20000)
app.on('browser-window-created', (_event, win) => {
  if (process.env.DIFFDESK_STARTUP_MINIMUM === '1') win.setSize(960, 600)
  win.webContents.setBackgroundThrottling(false)
  win.show = () => { win.setOpacity(0); win.setSkipTaskbar(true); win.showInactive() }
  win.once('ready-to-show', () => { timings.windowReadyMs = performance.now() - started })
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message) })
  win.webContents.once('did-finish-load', async () => {
    timings.loadedMs = performance.now() - started
    try {
      const data = await win.webContents.executeJavaScript(`new Promise(resolve => {
        const started=performance.now();
        function check() {
          const editors=document.querySelectorAll('.monaco-editor textarea');
          const band=document.querySelector('.dd-band');
          if (editors.length>=2 && band) {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve({
              editorReadyMs: performance.now(),
              verdict: band.textContent,
              hintInBand: !!band.querySelector('.dd-band__hint'),
              editorOverlayHint: !!document.querySelector('.dd-editor-area .dd-empty-hint'),
              paints: performance.getEntriesByType('paint').map(e=>({name:e.name,ms:e.startTime})),
              resources: performance.getEntriesByType('resource').map(e=>({name:e.name.split('/').pop(),bytes:e.decodedBodySize})),
              width:innerWidth
            })))
          } else if(performance.now()-started>10000) resolve({error:'Editor did not initialize'})
          else setTimeout(check,20)
        }
        check()
      })`)
      timings.usableMs = performance.now() - started
      // Wait for the initial comparison to settle, also catching a missed first publication.
      await new Promise(resolve => setTimeout(resolve, 800))
      data.settledVerdict = await win.webContents.executeJavaScript(`document.querySelector('.dd-band').textContent`)
      fs.writeFileSync(output, JSON.stringify({ ...timings, ...data, errors }, null, 2))
      const image = await win.webContents.capturePage()
      fs.writeFileSync(output.replace(/\.json$/, '.png'), image.toPNG())
      if (process.env.DIFFDESK_STARTUP_SMOKE === '1') {
        // Monaco focus/undo events need a focused native window, even when its
        // pixels are transparent. An inactive screenshot window cannot test them.
        win.focus()
        await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const start=performance.now();function check(){if(document.hasFocus())resolve();else if(performance.now()-start>3000)reject(new Error('Smoke test window needs focus'));else setTimeout(check,30)}check()})`)
        const smoke = await win.webContents.executeJavaScript(`(async () => {
          const assert=(condition,message)=>{if(!condition)throw new Error(message)};
          const waitFor=async (test,message)=>{
            const start=performance.now();
            while(!test()){if(performance.now()-start>5000)throw new Error(message);await new Promise(r=>setTimeout(r,30))}
          };
          const band=()=>document.querySelector('.dd-band');
          const checkHint=()=>{
            const hint=band().querySelector('.dd-band__hint');
            assert(!!hint,'Empty hint must be in the status band');
            assert(!document.querySelector('.dd-editor-area .dd-empty-hint'),'Hint must not overlap the editors');
            assert(hint.scrollWidth<=hint.clientWidth,'Hint must fit at the current window width');
          };
          checkHint();
          const area=document.querySelector('.dd-editor-area'), rect=area.getBoundingClientRect();
          const dt=new DataTransfer();
          dt.items.add(new File(['const amount = 1;\\n'], 'startup-left.ts', {type:'text/plain'}));
          dt.items.add(new File(['const amount = 2;\\n'], 'startup-right.ts', {type:'text/plain'}));
          area.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt,clientX:rect.left+rect.width*.25,clientY:rect.top+50}));
          await waitFor(()=>band().classList.contains('dd-band--diff')&&!!document.querySelector('.dd-chunk-btn--ltr:not(:disabled)'),'Dropped files must produce a usable diff');
          assert(!band().querySelector('.dd-band__hint'),'Hint must disappear when content is loaded');
          assert(document.querySelector('.dd-statusbar').textContent.includes('TypeScript'),'File language detection must still work');
          await waitFor(()=>new Set([...document.querySelectorAll('.view-line span')].map(e=>getComputedStyle(e).color)).size>1,'Syntax highlighting must load');
          document.querySelector('.dd-chunk-btn--ltr:not(:disabled)').click();
          await waitFor(()=>band().classList.contains('dd-band--same'),'Partial merge must make documents equal');
          const undo=document.querySelector('.dd-status-undo');
          assert(undo.textContent.includes('오른쪽')&&!undo.disabled,'Merge undo must target the right editor');
          undo.click();
          await waitFor(()=>band().classList.contains('dd-band--diff'),'Undo must restore the diff');
          document.querySelector('button[title^="나란히·한줄 전환"]').click();
          await waitFor(()=>document.querySelector('.dd-app').dataset.sideBySide==='false','Inline mode must work');
          document.querySelector('button[title^="나란히·한줄 전환"]').click();
          document.querySelector('button[title="양쪽 모두 지우기"]').click();
          await waitFor(()=>!!band().querySelector('.dd-band__hint')&&!band().textContent.includes('계산 중'),'Clearing must restore a settled empty state');
          checkHint();
          return { drop:true, autoLanguage:true, syntax:true, merge:true, undo:true, inline:true, clear:true, hintFits:true, width:innerWidth, theme:document.documentElement.dataset.preset||document.documentElement.dataset.theme };
        })()`)
        await win.webContents.executeJavaScript(`document.querySelector('.monaco-editor textarea').focus()`)
        win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'F', modifiers: ['control'] })
        win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'F', modifiers: ['control'] })
        smoke.find = await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const start=performance.now();function check(){if(document.querySelector('.find-widget.visible'))resolve(true);else if(performance.now()-start>3000)reject(new Error('Ctrl+F must still open find'));else setTimeout(check,30)}check()})`)
        fs.writeFileSync(output.replace(/\.json$/, '-smoke.json'), JSON.stringify(smoke, null, 2))
        console.log(JSON.stringify({ smoke }))
      }
      clearTimeout(timeout)
      app.exit(data.error || errors.length ? 1 : 0)
    } catch (error) { console.error(error); app.exit(1) }
  })
})
require('../dist-electron/electron/main.js')
