import { useRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

export function MotionButton({ children, faceClassName = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { faceClassName?: string }) {
  const faceRef = useRef<HTMLSpanElement>(null)
  const pressRef = useRef(0)
  const animate = (frames: Keyframe[], duration: number) => {
    const face = faceRef.current
    if (!face) return
    const current = getComputedStyle(face).transform
    face.getAnimations().forEach(a => a.cancel())
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { face.style.transform = ''; return }
    face.animate([{ transform: current === 'none' ? 'scale(1)' : current }, ...frames], { duration, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
  }
  const press = () => { if (!props.disabled) { pressRef.current = performance.now(); animate([{ transform: 'scale(.96)' }], 75) } }
  const release = () => { if (!pressRef.current) return; const quick=performance.now()-pressRef.current<75;pressRef.current=0;animate(quick?[{transform:'scale(.96)',offset:.15},{transform:'scale(1.008)',offset:.68},{transform:'scale(1)',offset:1}]:[{transform:'scale(1.008)',offset:.65},{transform:'scale(1)',offset:1}],240) }
  return <button {...props}
    onPointerDown={e=>{press();props.onPointerDown?.(e)}}
    onPointerUp={e=>{release();props.onPointerUp?.(e)}}
    onPointerLeave={e=>{release();props.onPointerLeave?.(e)}}
    onPointerCancel={e=>{release();props.onPointerCancel?.(e)}}
    onKeyDown={e=>{if(!e.repeat&&(e.key==='Enter'||e.key===' '))press();props.onKeyDown?.(e)}}
    onKeyUp={e=>{if(e.key==='Enter'||e.key===' ')release();props.onKeyUp?.(e)}}
    onClick={e=>{release();props.onClick?.(e)}}
  ><span className={'dd-button-face '+faceClassName} ref={faceRef}>{children}</span></button>
}
