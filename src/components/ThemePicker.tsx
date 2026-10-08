import { useEffect, useRef, useState } from 'react'
import { THEME_PALETTES, THEME_PRESET_IDS, isThemePreset } from '../../shared/themes'
import type { ThemeSelection } from '../../shared/themes'
import { MotionButton } from './MotionButton'

const LABELS = { system: '시스템', light: '기본 라이트', dark: '기본 다크' }

export function ThemePicker({ value, onChange }: { value: ThemeSelection; onChange: (value: ThemeSelection) => void }) {
  const [open, setOpen] = useState(false)
  const picker = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const pointer = useRef(false)
  const name = isThemePreset(value) ? THEME_PALETTES[value].name : LABELS[value]
  const close = (focus = false) => { setOpen(false); if (focus) trigger.current?.focus() }
  useEffect(() => {
    if (!open) return
    picker.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
    const outside = (e: PointerEvent) => { if (!picker.current?.contains(e.target as Node)) setOpen(false) }
    const focusOut = (e: FocusEvent) => { if (!picker.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', focusOut)
    return () => {document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',focusOut)}
  }, [open])
  return <div className="dd-theme-picker" ref={picker} onKeyDown={e=>{
    pointer.current=false
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true)}
    if(open&&(e.key==='Enter'||e.key===' ')&&e.target instanceof HTMLInputElement){e.preventDefault();close(true)}
  }}>
    <MotionButton type="button" className="dd-btn dd-theme-trigger" aria-label={'테마 선택: '+name} aria-expanded={open} aria-controls="dd-theme-menu"
      onClick={e=>{trigger.current=e.currentTarget;setOpen(!open)}}>
      <span className="dd-theme-dot" aria-hidden="true" />{name}<span className="dd-theme-chevron" aria-hidden="true">⌄</span>
    </MotionButton>
    {open && <div className="dd-theme-menu" id="dd-theme-menu"><fieldset><legend>테마 선택</legend>
      {(['system', ...THEME_PRESET_IDS, 'light', 'dark'] as ThemeSelection[]).map(id=>{
        const p=isThemePreset(id)?THEME_PALETTES[id]:null
        return <label key={id} className={'dd-theme-option'+(value===id?' is-selected':'')} onPointerDown={()=>{pointer.current=true}}>
          <input type="radio" name="dd-theme" value={id} checked={value===id} onClick={e=>{if(e.detail>0&&value===id)close(true)}} onChange={()=>{onChange(id);if(pointer.current)close(true);pointer.current=false}} />
          <span className="dd-theme-option__label">{p?.name||LABELS[id as keyof typeof LABELS]}<small>{p?.note||(id==='system'?'운영체제의 밝기 설정 따름':'DiffDesk 기본 팔레트')}</small></span>
          {p && <span className="dd-theme-swatches" aria-hidden="true">{[p.bg,p.keyword,p.string].map((color,i)=><i key={i} style={{backgroundColor:color}} />)}</span>}
        </label>
      })}
    </fieldset></div>}
  </div>
}
