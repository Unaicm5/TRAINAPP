import React, { useState } from 'react'

export function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:20,cursor:onClick?'pointer':'default',...style}}>{children}</div>
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    green: { bg: 'var(--gdim)', text: 'var(--green)', border: 'var(--gborder)' },
    amber: { bg: 'var(--adim)', text: 'var(--amber)', border: 'var(--aborder)' },
    red: { bg: 'var(--rdim)', text: 'var(--red)', border: 'var(--rborder)' },
    accent: { bg: 'var(--accent-dim)', text: 'var(--accent)', border: 'var(--accent-border)' },
    blue: { bg: 'var(--bdim)', text: 'var(--blue)', border: 'var(--bborder)' },
    gray: { bg: 'var(--bg4)', text: 'var(--text3)', border: 'var(--border)' },
  }
  const c = colors[color] || colors.gray
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:500,padding:'3px 9px',borderRadius:99,background:c.bg,color:c.text,border:`0.5px solid ${c.border}`}}>{children}</span>
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', style, disabled }) {
  const base = { display:'inline-flex',alignItems:'center',gap:6,borderRadius:'var(--r-sm)',fontFamily:'DM Sans,sans-serif',cursor:disabled?'not-allowed':'pointer',border:'none',transition:'all 0.15s',opacity:disabled?0.6:1 }
  const sizes = { sm: { padding:'5px 12px',fontSize:12 }, md: { padding:'8px 16px',fontSize:13 }, lg: { padding:'11px 20px',fontSize:14 } }
  const variants = {
    primary: { background:'var(--accent)',color:'#000',fontWeight:500 },
    ghost: { background:'transparent',color:'var(--text2)',border:'1px solid var(--border)' },
    danger: { background:'var(--rdim)',color:'var(--red)',border:'0.5px solid var(--rborder)' },
  }
  return <button onClick={onClick} disabled={disabled} style={{...base,...sizes[size],...variants[variant],...style}}>{children}</button>
}

export function Modal({ id, title, open, onClose, children }) {
  if (!open) return null
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:'var(--r) var(--r) 0 0',width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700}}>{title}</h2>
          <button onClick={onClose} style={{background:'var(--bg4)',border:'none',color:'var(--text2)',width:30,height:30,borderRadius:'50%',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormGroup({ label, children }) {
  return <div style={{marginBottom:14}}><label style={{fontSize:13,color:'var(--text2)',display:'block',marginBottom:5}}>{label}</label>{children}</div>
}

export function SectionLabel({ children, style }) {
  return <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'DM Mono,monospace',margin:'20px 0 10px',...style}}>{children}</div>
}

export function MetricCard({ label, value, color, sub }) {
  return (
    <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:16}}>
      <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:'DM Mono,monospace',marginBottom:6}}>{label}</div>
      <div style={{fontSize:28,fontWeight:600,fontFamily:'Syne,sans-serif',letterSpacing:'-0.02em',color:color||'var(--text)'}}>{value}</div>
      {sub && <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{sub}</div>}
    </div>
  )
}

export function Grid({ cols = 2, gap = 12, children, style }) {
  return <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`,gap,...style}}>{children}</div>
}

export function RPESelector({ value, onChange }) {
  return (
    <div style={{display:'flex',gap:6}}>
      {[5,6,7,8,9].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{flex:1,padding:'8px 0',border:`1px solid ${value===n?'var(--accent)':'var(--border)'}`,borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,background:value===n?'var(--accent)':'var(--bg3)',color:value===n?'#000':'var(--text2)',cursor:'pointer',fontFamily:'Syne,sans-serif',transition:'all 0.1s'}}>{n}</button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange }) {
  return (
    <label style={{position:'relative',width:40,height:22,cursor:'pointer',flexShrink:0,display:'inline-block'}}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{opacity:0,width:0,height:0}} />
      <span style={{position:'absolute',inset:0,background:checked?'var(--accent)':'var(--bg4)',border:`0.5px solid ${checked?'var(--accent)':'var(--border2)'}`,borderRadius:99,transition:'0.2s'}}>
        <span style={{position:'absolute',width:16,height:16,left:checked?22:2,top:2,background:checked?'#000':'white',borderRadius:'50%',transition:'0.2s'}}></span>
      </span>
    </label>
  )
}

export function Avatar({ name, color, size = 44 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:`${color}22`,color,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontSize:size*0.3,fontWeight:700,flexShrink:0}}>{initials}</div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{display:'flex',background:'var(--bg3)',borderRadius:'var(--r-sm)',padding:3,gap:3,marginBottom:18}}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{flex:1,padding:7,border:active===t.id?'0.5px solid var(--border2)':'none',borderRadius:'var(--r-xs)',fontSize:12,cursor:'pointer',color:active===t.id?'var(--text)':'var(--text2)',background:active===t.id?'var(--bg2)':'transparent',fontWeight:active===t.id?500:'normal',fontFamily:'DM Sans,sans-serif',transition:'all 0.15s'}}>{t.label}</button>
      ))}
    </div>
  )
}

export function WellnessSlider({ label, value, onChange, leftLabel, rightLabel }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:13,color:'var(--text2)'}}>{label}</span>
        <span style={{fontSize:14,fontWeight:600,fontFamily:'Syne,sans-serif',color:'var(--accent)'}}>{value}</span>
      </div>
      <input type="range" min="1" max="10" value={value} onChange={e => onChange(parseInt(e.target.value))} />
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginTop:2}}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  )
}

export function EmptyState({ icon, text, action }) {
  return (
    <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)'}}>
      <i className={`ti ${icon}`} style={{fontSize:36,marginBottom:12,display:'block'}}></i>
      <p style={{fontSize:14,marginBottom:action?16:0}}>{text}</p>
      {action}
    </div>
  )
}

export function PageHeader({ title, sub, action }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
      <div>
        <h1 style={{fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:700,letterSpacing:'-0.02em'}}>{title}</h1>
        {sub && <p style={{fontSize:14,color:'var(--text2)',marginTop:4}}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function rpeColor(r) {
  if (r <= 6) return 'green'
  if (r <= 7) return 'accent'
  if (r <= 8) return 'amber'
  return 'red'
}
