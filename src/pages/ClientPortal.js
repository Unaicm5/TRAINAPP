import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Badge, SectionLabel, formatDate, rpeColor } from '../components/UI'

export default function ClientPortal({ session, showToast }) {
  const [clientData, setClientData] = useState(null)
  const [sessions, setSessions] = useState([])
  const [vals, setVals] = useState([])
  const [objs, setObjs] = useState([])
  const [plans, setPlans] = useState([])
  const [tab, setTab] = useState('sesiones')
  const [loading, setLoading] = useState(true)
  const [registerModal, setRegisterModal] = useState(null)
  const [regForm, setRegForm] = useState({ rpe: 7, sleep: 7, fatigue: 4, pain: 2, loads: '', client_notes: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    // Find client by email
    const { data: c } = await supabase.from('clients').select('*').eq('email', session.user.email).single()
    if (!c) { setLoading(false); return }
    setClientData(c)
    const { data: s } = await supabase.from('sessions').select('*').eq('client_id', c.id).order('date', { ascending: false })
    const { data: v } = await supabase.from('valoraciones').select('*').eq('client_id', c.id).eq('visible', true).order('date', { ascending: false })
    const { data: o } = await supabase.from('objetivos').select('*').eq('client_id', c.id).eq('visible', true)
    const { data: p } = await supabase.from('planes_nutricionales').select('*').eq('client_id', c.id).eq('visible', true).order('date', { ascending: false })
    setSessions(s || [])
    setVals(v || [])
    setObjs(o || [])
    setPlans(p || [])
    setLoading(false)
  }

  const registerSession = async () => {
    await supabase.from('sessions').update({ done: true, ...regForm }).eq('id', registerModal)
    showToast('¡Sesión registrada! ✓')
    setRegisterModal(null)
    loadData()
  }

  const logout = async () => { await supabase.auth.signOut() }

  const calcPct = (o) => {
    const start = parseFloat(o.start_val) || 0
    const target = parseFloat(o.target_val) || 1
    const current = parseFloat(o.current_val) || 0
    if (o.type === 'continuous') return current <= target ? 100 : Math.max(0, 100 - (current - target) * 10)
    if (target === start) return current >= target ? 100 : 0
    return Math.max(0, Math.min(100, ((current - start) / (target - start)) * 100))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text2)' }}>Cargando...</p>
    </div>
  )

  if (!clientData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <i className="ti ti-clock" style={{ fontSize: 48, color: 'var(--text3)', display: 'block', marginBottom: 16 }}></i>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, marginBottom: 8 }}>Cuenta pendiente de activar</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>Tu entrenador aún no ha vinculado tu cuenta.<br />Escríbele para que lo active.</p>
        <button onClick={logout} style={{ marginTop: 24, padding: '8px 20px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>Cerrar sesión</button>
      </div>
    </div>
  )

  const done = sessions.filter(s => s.done).length
  const pending = sessions.filter(s => !s.done)
  const todaySession = pending[0]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>

      {/* HEADER */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Hola de nuevo,</p>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 700 }}>{clientData.name} 👋</h1>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${clientData.color || '#a3e635'}22`, color: clientData.color || '#a3e635', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
            {clientData.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>SESIONES</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: 'var(--accent)' }}>{done}/{sessions.length}</div>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>OBJETIVOS</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>{objs.length}</div>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>MICROCICLO</div>
            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--accent)', marginTop: 4 }}>{clientData.micro || 'MC1'}</div>
          </div>
        </div>
      </div>

      {/* SESIÓN DE HOY */}
      {todaySession && (
        <div style={{ padding: '16px 20px 0' }}>
          <SectionLabel>Próxima sesión</SectionLabel>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif' }}>{todaySession.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{formatDate(todaySession.date)} · {todaySession.micro}</div>
              </div>
              <Badge color="accent">RPE {todaySession.rpe_target}</Badge>
            </div>
            {todaySession.notes && <div style={{ background: 'rgba(245,158,11,0.06)', borderLeft: '2px solid var(--amber)', padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#fcd34d', borderRadius: '0 var(--r-xs) var(--r-xs) 0', lineHeight: 1.5 }}>{todaySession.notes}</div>}
            {todaySession.exercises && todaySession.exercises.split('\n').filter(Boolean).map((e, i) => {
              const parts = e.split('·').map(p => p.trim())
              const vids = todaySession.videos ? todaySession.videos.split('\n').filter(Boolean) : []
              return (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{parts[0]}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                        {parts.slice(1).map((p, j) => <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>{p}</span>)}
                      </div>
                    </div>
                    {vids[i] && <a href={vids[i]} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-xs)', color: '#fca5a5', fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
                      <i className="ti ti-brand-youtube"></i> Ver
                    </a>}
                  </div>
                </div>
              )
            })}
            <button onClick={() => setRegisterModal(todaySession.id)} style={{ width: '100%', marginTop: 14, padding: '11px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>
              ✓ Registrar sesión completada
            </button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: 3, gap: 3, marginBottom: 16 }}>
          {[['sesiones', 'Sesiones'], ['objetivos', 'Objetivos'], ['valoraciones', 'Valoraciones'], ['nutricion', 'Nutrición']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '7px 4px', border: tab === id ? '0.5px solid var(--border2)' : 'none', borderRadius: 'var(--r-xs)', fontSize: 11, cursor: 'pointer', color: tab === id ? 'var(--text)' : 'var(--text2)', background: tab === id ? 'var(--bg2)' : 'transparent', fontWeight: tab === id ? 500 : 'normal', fontFamily: 'DM Sans,sans-serif' }}>{label}</button>
          ))}
        </div>

        {/* SESIONES */}
        {tab === 'sesiones' && sessions.map(s => (
          <div key={s.id} style={{ background: 'var(--bg2)', border: `1px solid ${s.done ? 'var(--gborder)' : 'var(--border)'}`, borderRadius: 'var(--r)', padding: 14, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{formatDate(s.date)} · {s.micro}</div>
              </div>
              {s.done ? <Badge color={rpeColor(s.rpe)}>✓ RPE {s.rpe}</Badge> : <Badge color="gray">Pendiente</Badge>}
            </div>
            {s.done && s.client_notes && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, fontStyle: 'italic' }}>"{s.client_notes}"</div>}
          </div>
        ))}
        {tab === 'sesiones' && sessions.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: 32 }}>Tu entrenador aún no ha asignado sesiones</p>}

        {/* OBJETIVOS */}
        {tab === 'objetivos' && objs.map(o => {
          const pct = calcPct(o)
          const color = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : pct >= 30 ? 'var(--amber)' : 'var(--text3)'
          const label = pct >= 100 ? '✓ Conseguido' : pct >= 60 ? 'En progreso' : pct >= 30 ? 'Ritmo lento' : 'Iniciando'
          return (
            <div key={o.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{o.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Actual: {o.current_val} · Meta: {o.target_val}{o.deadline ? ` · Límite: ${formatDate(o.deadline)}` : ' · Continuo'}</div>
              <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: color, width: `${Math.min(pct, 100)}%`, transition: 'width 0.8s' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color }}>{Math.round(pct)}% — {label}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{o.type === 'continuous' ? 'Continuo' : formatDate(o.deadline)}</span>
              </div>
            </div>
          )
        })}
        {tab === 'objetivos' && objs.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: 32 }}>Tu entrenador aún no ha definido objetivos</p>}

        {/* VALORACIONES */}
        {tab === 'valoraciones' && (() => {
          const cats = [...new Set(vals.map(v => v.category))]
          return cats.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: 32 }}>Sin valoraciones visibles aún</p>
            : cats.map(cat => (
              <div key={cat}>
                <SectionLabel>{cat}</SectionLabel>
                <Card style={{ marginBottom: 8, padding: '0 16px' }}>
                  {vals.filter(v => v.category === cat).map((v, i, arr) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(v.date)}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--accent)' }}>{v.value}</div>
                    </div>
                  ))}
                </Card>
              </div>
            ))
        })()}

        {/* NUTRICIÓN */}
        {tab === 'nutricion' && plans.map(p => (
          <Card key={p.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>{p.goal}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
              {[['KCAL', p.kcal, 'var(--accent)'], ['PROT', `${p.prot}g`, 'var(--blue)'], ['HC', `${p.hc}g`, 'var(--amber)'], ['GRASA', `${p.fat}g`, 'var(--red)']].map(([l, v, c]) => (
                <div key={l} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: c }}>{v}</div>
                </div>
              ))}
            </div>
            {p.comidas && p.comidas.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < p.comidas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ background: 'var(--accent-dim)', border: '0.5px solid var(--accent-border)', borderRadius: 6, padding: '3px 7px', minWidth: 46, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'DM Mono,monospace' }}>{m.hora}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{m.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{m.alimentos}</div>
                </div>
              </div>
            ))}
            {p.notes && <div style={{ background: 'rgba(245,158,11,0.06)', borderLeft: '2px solid var(--amber)', padding: '8px 12px', marginTop: 12, fontSize: 12, color: '#fcd34d', lineHeight: 1.5 }}>📋 {p.notes}</div>}
          </Card>
        ))}
        {tab === 'nutricion' && plans.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: 32 }}>Sin plan nutricional asignado aún</p>}
      </div>

      {/* MODAL REGISTRAR */}
      {registerModal && (
        <div onClick={e => e.target === e.currentTarget && setRegisterModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r) var(--r) 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700 }}>Registrar sesión</h2>
              <button onClick={() => setRegisterModal(null)} style={{ background: 'var(--bg4)', border: 'none', color: 'var(--text2)', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>RPE real</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[5, 6, 7, 8, 9].map(n => (
                  <button key={n} onClick={() => setRegForm({ ...regForm, rpe: n })} style={{ flex: 1, padding: '10px 0', border: `1px solid ${regForm.rpe === n ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, background: regForm.rpe === n ? 'var(--accent)' : 'var(--bg3)', color: regForm.rpe === n ? '#000' : 'var(--text2)', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>{n}</button>
                ))}
              </div>
            </div>
            {[['Sueño', 'sleep', 'Malo', 'Genial'], ['Fatiga muscular', 'fatigue', 'Ninguna', 'Mucha'], ['Dolor / molestia', 'pain', 'Nada', 'Mucho']].map(([label, key, left, right]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{regForm[key]}</span>
                </div>
                <input type="range" min="1" max="10" value={regForm[key]} onChange={e => setRegForm({ ...regForm, [key]: parseInt(e.target.value) })} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}><span>{left}</span><span>{right}</span></div>
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Cargas usadas</label>
              <input value={regForm.loads} onChange={e => setRegForm({ ...regForm, loads: e.target.value })} placeholder="KB 12kg, Press 10kg..." style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: 14, padding: '9px 12px' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Notas</label>
              <textarea value={regForm.client_notes} onChange={e => setRegForm({ ...regForm, client_notes: e.target.value })} placeholder="¿Cómo fue la sesión?" style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: 14, padding: '9px 12px', resize: 'none', height: 70 }} />
            </div>
            <button onClick={registerSession} style={{ width: '100%', padding: '13px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>Guardar sesión</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 100, maxWidth: 480, margin: '0 auto' }}>
        {[['sesiones', 'ti-calendar', 'Sesiones'], ['objetivos', 'ti-target', 'Objetivos'], ['valoraciones', 'ti-chart-bar', 'Tests'], ['nutricion', 'ti-apple', 'Nutrición']].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer', color: tab === id ? 'var(--accent)' : 'var(--text3)', fontFamily: 'DM Sans,sans-serif', fontSize: 10 }}>
            <i className={`ti ${icon}`} style={{ fontSize: 22 }}></i>
            <span>{label}</span>
          </button>
        ))}
        <button onClick={logout} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', fontFamily: 'DM Sans,sans-serif', fontSize: 10 }}>
          <i className="ti ti-logout" style={{ fontSize: 22 }}></i>
          <span>Salir</span>
        </button>
      </div>
    </div>
  )
}
