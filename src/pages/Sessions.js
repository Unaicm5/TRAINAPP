import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Btn, Badge, Avatar, PageHeader, EmptyState, formatDate, rpeColor } from '../components/UI'

export default function Sessions({ navTo, showToast, session }) {
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id)
    const ids = (c || []).map(cl => cl.id)
    let s = []
    if (ids.length) {
      const { data } = await supabase.from('sessions').select('*').in('client_id', ids).order('date', { ascending: false })
      s = data || []
    }
    setClients(c || [])
    setSessions(s)
    setLoading(false)
  }

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.client_id === filter)

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>

  return (
    <div>
      <PageHeader title="Sesiones" sub="Todas las sesiones asignadas"
        action={<Btn onClick={() => clients[0] && navTo('client-detail', clients[0].id)}><i className="ti ti-plus"></i> Nueva sesión</Btn>} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Btn size="sm" variant={filter === 'all' ? 'primary' : 'ghost'} onClick={() => setFilter('all')}>Todas</Btn>
        {clients.map(c => <Btn key={c.id} size="sm" variant={filter === c.id ? 'primary' : 'ghost'} onClick={() => setFilter(c.id)}>{c.name}</Btn>)}
      </div>

      {filtered.length === 0
        ? <EmptyState icon="ti-calendar" text="Sin sesiones" />
        : filtered.map(s => {
          const c = clients.find(cl => cl.id === s.client_id)
          const exLines = s.exercises ? s.exercises.split('\n').filter(Boolean) : []
          const vidLines = s.videos ? s.videos.split('\n').filter(Boolean) : []
          return (
            <div key={s.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div>
                  {c && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Avatar name={c.name} color={c.color || '#a3e635'} size={22} />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.name}</span>
                  </div>}
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{formatDate(s.date)} · {s.micro} · RPE obj. {s.rpe_target}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {s.done ? <Badge color={rpeColor(s.rpe)}>✓ RPE {s.rpe}</Badge> : <Badge color="gray">Pendiente</Badge>}
                  <Btn size="sm" variant="ghost" onClick={() => setDetail(detail?.id === s.id ? null : s)}>
                    <i className={`ti ti-chevron-${detail?.id === s.id ? 'up' : 'down'}`}></i>
                  </Btn>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {exLines.slice(0, 3).map((e, i) => <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)', border: '0.5px solid var(--border)' }}>{e.split('·')[0].trim()}</span>)}
                {exLines.length > 3 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)', border: '0.5px solid var(--border)' }}>+{exLines.length - 3} más</span>}
              </div>

              {detail?.id === s.id && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {s.notes && <div style={{ background: 'rgba(245,158,11,0.06)', borderLeft: '2px solid var(--amber)', padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#fcd34d', borderRadius: '0 var(--r-xs) var(--r-xs) 0' }}>{s.notes}</div>}
                  {exLines.map((e, i) => {
                    const parts = e.split('·').map(p => p.trim())
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < exLines.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{parts[0]}</div>
                          <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                            {parts.slice(1).map((p, j) => <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>{p}</span>)}
                          </div>
                        </div>
                        {vidLines[i] && <a href={vidLines[i]} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-xs)', color: '#fca5a5', fontSize: 12, textDecoration: 'none' }}>
                          <i className="ti ti-brand-youtube"></i> Ver
                        </a>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}
