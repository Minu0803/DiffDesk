const { spawn } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const { PNG } = require('pngjs')
const root = path.resolve(__dirname, '..')
const executable = require('electron')

async function run(scale, preset = 'deep-dark', minimum = false) {
  const output = path.join(root,'docs/implementation/2026-10-06-assets',`native-${preset}-${scale}${minimum?'-min':''}.png`)
  const args=[path.join(root,'qa-electron.cjs'),`--qa-screenshot=${output}`,`--force-device-scale-factor=${scale}`]
  if(minimum)args.push('--force-prefers-reduced-motion')
  const code=await new Promise((resolve,reject)=>{
    const env={...process.env,DIFFDESK_QA_SCALE:scale,DIFFDESK_QA_PRESET:preset,DIFFDESK_QA_MINIMUM:minimum?'1':'0'}
    delete env.ELECTRON_RUN_AS_NODE
    const child=spawn(executable,args,{cwd:root,windowsHide:true,env,stdio:'inherit'})
    child.on('error',reject);child.on('exit',resolve)
  })
  if(code!==0)throw new Error(`native QA exited ${code}`)
  const data=JSON.parse(fs.readFileSync(output.replace('.png','.json'),'utf8'))
  if(!data.nativeApi||data.savedPreset!==preset||data.appliedPreset!==preset||data.laneWidth!==64||data.numberOverlap!==0||!data.inLane||data.toolbarOverflow!==0)throw new Error(JSON.stringify(data))
  if(minimum && (!data.reduced||data.faceTransition!=='0s'))throw new Error('Reduced motion styling was not applied')
  if(preset==='deep-dark'){
    const image=PNG.sync.read(fs.readFileSync(output)),rect=data.firstButton,ratio=Number(data.scale),values=[]
    for(let y=Math.ceil(rect.y*ratio);y<Math.floor((rect.y+rect.height)*ratio);y++)for(let x=Math.ceil(rect.x*ratio);x<Math.floor((rect.x+rect.width)*ratio);x++){const i=(y*image.width+x)*4;values.push(image.data[i],image.data[i+1],image.data[i+2])}
    if(Math.max(...values)<90)throw new Error('Merge arrow is present in DOM but not painted above the lane')
  }
  const {firstFace,...summary}=data
  console.log(JSON.stringify({preset,scale,output,...summary}))
}
(async()=>{if(process.argv.includes('--minimum'))await run('1','deep-dark',true);else if(process.argv.includes('--single'))await run('1');else {for(const scale of ['1','1.25','1.5'])await run(scale);await run('1','github-light');await run('1','deep-dark',true)}})().catch(error=>{console.error(error);process.exitCode=1})
