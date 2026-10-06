// Isolated native launch/first-paint check. Used with Electron's existing
// --qa-screenshot switch; never reads or changes the user's application profile.
const { app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const scale = process.env.DIFFDESK_QA_SCALE || '1'
const preset = process.env.DIFFDESK_QA_PRESET || 'deep-dark'
const minimum = process.env.DIFFDESK_QA_MINIMUM === '1'
const profile = path.join(root, 'build', 'qa-profile-' + preset + '-' + scale)
fs.mkdirSync(profile, { recursive: true })
const settings = require('../dist-electron/shared/ipc.js').DEFAULT_SETTINGS
const { themePatchFor } = require('../dist-electron/shared/themes.js')
fs.writeFileSync(path.join(profile, 'settings.json'), JSON.stringify({ ...settings, ...themePatchFor(preset) }))
app.setPath('userData', profile)
const output = path.join(root, 'docs', 'implementation', '2026-10-06-assets', 'native-' + preset + '-' + scale + (minimum?'-min':'') + '.json')
app.on('browser-window-created', (_event, window) => {
  window.webContents.setBackgroundThrottling(false)
  if(minimum)window.setSize(960,800)
  // Keep this screenshot helper hidden. Production window behavior is untouched.
  window.show = () => { window.setOpacity(0); window.setSkipTaskbar(true); window.showInactive() }
  window.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const data = await window.webContents.executeJavaScript(`(() => {
          const app=document.querySelector('.dd-app'), area=document.querySelector('.dd-editor-area');
          const lane=document.querySelector('.dd-merge-lane').getBoundingClientRect();
          const buttons=[...document.querySelectorAll('.dd-chunk-btn')].map(e=>e.getBoundingClientRect());
          const nums=[...document.querySelectorAll('.line-numbers')].map(e=>e.getBoundingClientRect());
          return { nativeApi:!!window.api, startup:window.api.initialBackground, savedPreset:window.api.initialSettings.themePreset,
            appliedPreset:document.documentElement.dataset.preset, background:getComputedStyle(document.body).backgroundColor,
            scale:devicePixelRatio, width:app.getBoundingClientRect().width, codeHeight:area.getBoundingClientRect().height,
            reduced:matchMedia('(prefers-reduced-motion: reduce)').matches, faceTransition:getComputedStyle(document.querySelector('.dd-button-face')).transitionDuration,
            laneWidth:lane.width, buttons:buttons.length, inLane:buttons.every(b=>b.left>=lane.left&&b.right<=lane.right),
            numberOverlap:buttons.reduce((v,b)=>v+nums.filter(n=>b.left<n.right&&b.right>n.left&&b.top<n.bottom&&b.bottom>n.top).length,0),
            firstButton:buttons.length?{x:buttons[0].x,y:buttons[0].y,width:buttons[0].width,height:buttons[0].height}:null,
            firstFace:(()=>{const f=document.querySelector('.dd-chunk-face');const r=f.getBoundingClientRect(),s=getComputedStyle(f);let parents=[];for(let p=f;p;p=p.parentElement){const c=getComputedStyle(p),r=p.getBoundingClientRect();parents.push({class:p.className,visibility:c.visibility,opacity:c.opacity,z:c.zIndex,width:r.width,height:r.height,overflow:c.overflow})}return {x:r.x,y:r.y,width:r.width,height:r.height,display:s.display,opacity:s.opacity,color:s.color,text:f.textContent,background:s.backgroundColor,parents}})(),
            toolbarOverflow:[...document.querySelectorAll('.dd-toolbar button,.dd-toolbar select')].filter(e=>e.getBoundingClientRect().right>app.getBoundingClientRect().right).length };
        })()`)
        fs.writeFileSync(output, JSON.stringify(data, null, 2))
      } catch (error) { console.error(error); process.exitCode = 1 }
    }, 2000)
  })
})
require('../dist-electron/electron/main.js')
