import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Btn, Badge, Avatar, Tabs, SectionLabel, MetricCard, Grid, Modal, FormGroup, RPESelector, WellnessSlider, Toggle, EmptyState, formatDate, rpeColor } from '../components/UI'
import Importar from './Importar'

export default function ClientDetail({ clientId, navTo, showToast, session }) {
  const [client, setClient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [vals, setVals] = useState([])
  const [objs, setObjs] = useState([])
  const [tab, setTab] = useState('sesiones')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('detail') // 'detail' | 'importar'
  const [registerModal, setRegisterModal] = useState(null)
  const [objModal, setObjModal] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)
  const [clientNote, setClientNote] = useState({}) // {sessionId: text}
  const [regForm, setRegForm] = useState({ rpe: 7, sleep: 7, fatigue: 4, pain: 2, loads: '', client_notes: '' })
  const [objForm, setObjForm] = useState({ title: '', start_val: '', current_val: '', target_val: '', type: 'deadline', deadline: '', visible: true })

  useEffect(() => { if (clientId) loadData() }, [clientId])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('id', clientId).single()
    const { data: s } = await supabase.from('sessions').select('*').eq('client_id', clientId).order('date', { ascending: false })
    const { data: v } = await supabase.from('valoraciones').select('*').eq('client_id', clientId).order('date', { ascending: false })
    const { data: o } = await supabase.from('objetivos').select('*').eq('client_id', clientId)
    setClient(c)
    setSessions(s || [])
    setVals(v || [])
    setObjs(o || [])
    setLoading(false)
  }

  const registerSession = async () => {
    await supabase.from('sessions').update({ done: true, ...regForm }).eq('id', registerModal)
    showToast('Sesión registrada ✓')
    setRegisterModal(null)
    loadData()
  }

  const addObjetivo = async () => {
    const { error } = await supabase.from('objetivos').insert({ ...objForm, client_id: clientId })
    if (!error) { showToast('Objetivo añadido ✓'); setObjModal(false); loadData() }
  }

  const toggleValVis = async (id, visible) => {
    await supabase.from('valoraciones').update({ visible: !visible }).eq('id', id)
    loadData()
  }

  const toggleObjVis = async (id, visible) => {
    await supabase.from('objetivos').update({ visible: !visible }).eq('id', id)
    loadData()
  }

  const calcPct = (o) => {
    const start = parseFloat(o.start_val) || 0
    const target = parseFloat(o.target_val) || 1
    const current = parseFloat(o.current_val) || 0
    if (o.type === 'continuous') return current <= target ? 100 : Math.max(0, 100 - (current - target) * 10)
    if (target === start) return current >= target ? 100 : 0
    return Math.max(0, Math.min(100, ((current - start) / (target - start)) * 100))
  }

  const objStatus = (pct) => {
    if (pct >= 100) return { label: '✓ Conseguido', color: 'var(--green)', bg: 'rgba(34,197,94,0.06)', border: 'var(--gborder)' }
    if (pct >= 60) return { label: 'En progreso', color: 'var(--accent)', bg: 'rgba(163,230,53,0.06)', border: 'var(--accent-border)' }
    if (pct >= 30) return { label: 'Ritmo lento', color: 'var(--amber)', bg: 'rgba(245,158,11,0.06)', border: 'var(--aborder)' }
    return { label: 'Iniciando', color: 'var(--text3)', bg: 'var(--bg3)', border: 'var(--border)' }
  }

  const parseBloques = (exercises) => {
    if (!exercises) return []
    try {
      const parsed = JSON.parse(exercises)
      if (Array.isArray(parsed)) return parsed
    } catch (e) {}
    return [{ nombre: 'Ejercicios', ejercicios: exercises.split('\n').filter(Boolean).map(line => {
      const parts = line.split('·').map(p => p.trim())
      return { name: parts[0], video: '', reps: parts[1] || '', series: parts[2] || '', carga: parts[3] || '', descanso: '', indicaciones: '', esTexto: false }
    })}]
  }

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>
  if (!client) return <p style={{ color: 'var(--text2)' }}>Cliente no encontrado</p>

  // If showing importer
  if (view === 'importar') {
    return (
      <Importar
        session={session}
        showToast={showToast}
        navTo={navTo}
        clienteId={clientId}
        clienteNombre={client.name}
        clienteColor={client.color}
        onBack={() => { setView('detail'); loadData() }}
      />
    )
  }

  const done = sessions.filter(s => s.done)
  const rpes = done.filter(s => s.rpe).map(s => s.rpe)
  const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—'
  const lastSession = sessions[0]
  const currentMicro = (lastSession?.micro || '—').replace('Microciclo ', 'MC').replace('microciclo ', 'MC').replace('MICROCICLO ', 'MC')
  const currentMeso = (lastSession?.mesociclo || '—').replace('Mesociclo ', 'MS').replace('mesociclo ', 'MS')
  const cats = [...new Set(vals.map(v => v.category))]

  return (
    <div>
      <button onClick={() => navTo('clients')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 13, cursor: 'pointer', marginBottom: 20, border: 'none', background: 'none', fontFamily: 'DM Sans,sans-serif' }}>
        <i className="ti ti-arrow-left"></i> Todos los clientes
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Avatar name={client.name} color={client.color || '#a3e635'} size={52} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 700 }}>{client.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{client.age ? `${client.age} años · ` : ''}{client.goal}</p>
        </div>
        <Btn size="sm" variant="ghost" onClick={() => setView('importar')}><i className="ti ti-file-upload"></i> Importar Excel</Btn>
        <Btn size="sm" variant="ghost" onClick={() => setObjModal(true)}><i className="ti ti-target"></i> Objetivo</Btn>
      </div>

      <Grid cols={4} style={{ marginBottom: 20 }}>
        <MetricCard label="Sesiones" value={`${done.length}/${sessions.length}`} color="var(--accent)" sub="completadas" />
        <MetricCard label="RPE medio" value={avgRpe} color="var(--amber)" sub="todas las sesiones" />
        <MetricCard label="Microciclo" value={currentMicro} color="var(--blue)" sub="actual" />
        <MetricCard label="Mesociclo" value={currentMeso} color="var(--text)" sub="actual" />
      </Grid>

      <Tabs tabs={[{ id: 'sesiones', label: 'Sesiones' }, { id: 'valoraciones', label: 'Valoraciones' }, { id: 'objetivos', label: 'Objetivos' }]} active={tab} onChange={setTab} />

      {/* SESIONES */}
      {tab === 'sesiones' && (
        <div>
          {sessions.length === 0
            ? <EmptyState icon="ti-calendar" text="Sin sesiones aún" action={<Btn onClick={() => setView('importar')}><i className="ti ti-file-upload"></i> Importar desde Excel</Btn>} />
            : sessions.map(s => {
              const bloquesParsed = parseBloques(s.exercises)
              const isExpanded = expandedSession === s.id
              return (
                <div key={s.id} style={{ background: 'var(--bg2)', border: `1px solid ${isExpanded ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 'var(--r)', marginBottom: 8, overflow: 'hidden' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: 16 }} onClick={() => setExpandedSession(isExpanded ? null : s.id)} style={{ padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>{s.sheetName || s.micro}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', marginBottom: 2 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{formatDate(s.date)}{s.micro ? ` · ${s.micro}` : ''} · RPE obj. {s.rpe_target}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      {s.done ? <Badge color={rpeColor(s.rpe)}>✓ RPE {s.rpe}</Badge> : <Badge color="gray">Pendiente</Badge>}
                      <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: 16, color: 'var(--text3)' }}></i>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
                      {s.notes && <div style={{ background: 'rgba(245,158,11,0.06)', borderLeft: '2px solid var(--amber)', padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#fcd34d', borderRadius: '0 var(--r-xs) var(--r-xs) 0', lineHeight: 1.5 }}>{s.notes}</div>}

                      {bloquesParsed.map((bloque, bi) => (
                        <div key={bi} style={{ marginBottom: 18 }}>
                          {bloque.nombre && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono,monospace', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--accent-border)' }}>
                              {bloque.nombre}
                              {/* Series del bloque si el primer ejercicio las tiene */}
                              {bloque.ejercicios[0]?.series && <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 10 }}>{bloque.ejercicios[0].series} series</span>}
                            </div>
                          )}

                          {bloque.ejercicios.map((ej, ei) => {
                            // Texto libre (vuelta a la calma, etc.)
                            if (ej.esTexto) {
                              return (
                                <div key={ei} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                                  {ej.name}
                                </div>
                              )
                            }

                            return (
                              <div key={ei} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: ei < bloque.ejercicios.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ flex: 1 }}>
                                  {/* Chips: reps, carga, descanso */}
                                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: ej.indicaciones ? 6 : 0 }}>
                                    {ej.reps && <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text2)', border: '0.5px solid var(--border)' }}>{ej.reps} reps</span>}
                                    {ej.carga && ej.carga !== '0' && <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 99, background: 'var(--accent-dim)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>{ej.carga}</span>}
                                    {ej.descanso && <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)', border: '0.5px solid var(--border)' }}>⏱ {ej.descanso}</span>}
                                  </div>
                                  {/* Indicaciones */}
                                  {ej.indicaciones && (
                                    <div style={{ fontSize: 12, color: '#fcd34d', marginTop: 5, lineHeight: 1.5, background: 'rgba(245,158,11,0.06)', borderLeft: '2px solid var(--amber)', padding: '5px 10px', borderRadius: '0 4px 4px 0' }}>
                                      {ej.indicaciones}
                                    </div>
                                  )}
                                </div>
                                {/* Botón YouTube */}
                                {ej.video && (
                                  <a href={ej.video} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-xs)', color: '#fca5a5', fontSize: 12, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                    <i className="ti ti-brand-youtube"></i> Ver
                                  </a>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}

                      {/* Registrar sesión */}
                      {!s.done ? (
                        <Btn onClick={() => setRegisterModal(s.id)} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                          <i className="ti ti-check"></i> Registrar sesión completada
                        </Btn>
                      ) : (
                        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg3)', borderRadius: 'var(--r-sm)' }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: s.client_notes ? 8 : 0 }}>
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Sueño {s.sleep}/10</span>
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Fatiga {s.fatigue}/10</span>
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Dolor {s.pain}/10</span>
                            {s.loads && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.loads}</span>}
                          </div>
                          {s.client_notes && <div style={{ fontSize: 12, color: '#fcd34d', fontStyle: 'italic' }}>"{s.client_notes}"</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* VALORACIONES */}
      {tab === 'valoraciones' && (
        <div>
          <Btn size="sm" variant="ghost" onClick={() => navTo('valoraciones')} style={{ marginBottom: 12 }}><i className="ti ti-plus"></i> Añadir valoración</Btn>
          {cats.length === 0
            ? <EmptyState icon="ti-chart-bar" text="Sin valoraciones" />
            : cats.map(cat => (
              <div key={cat}>
                <SectionLabel>{cat}</SectionLabel>
                <Card style={{ marginBottom: 8, padding: '0 20px' }}>
                  {vals.filter(v => v.category === cat).map((v, i, arr) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(v.date)}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', minWidth: 70, textAlign: 'right' }}>{v.value}</div>
                      <button onClick={() => toggleValVis(v.id, v.visible)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, cursor: 'pointer', border: '0.5px solid', background: v.visible ? 'var(--gdim)' : 'var(--bg4)', color: v.visible ? 'var(--green)' : 'var(--text3)', borderColor: v.visible ? 'var(--gborder)' : 'var(--border)', fontFamily: 'DM Mono,monospace' }}>
                        {v.visible ? 'Visible' : 'Oculto'}
                      </button>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
        </div>
      )}

      {/* OBJETIVOS */}
      {tab === 'objetivos' && (
        <div>
          <Btn size="sm" variant="ghost" onClick={() => setObjModal(true)} style={{ marginBottom: 12 }}><i className="ti ti-plus"></i> Añadir objetivo</Btn>
          {objs.length === 0
            ? <EmptyState icon="ti-target" text="Sin objetivos" />
            : objs.map(o => {
              const pct = calcPct(o)
              const st = objStatus(pct)
              return (
                <div key={o.id} style={{ borderRadius: 'var(--r)', padding: 16, marginBottom: 8, border: `1px solid ${st.border}`, background: st.bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Syne,sans-serif' }}>{o.title}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Badge color={pct >= 100 ? 'green' : pct >= 60 ? 'accent' : pct >= 30 ? 'amber' : 'gray'}>{st.label}</Badge>
                      <Toggle checked={o.visible} onChange={() => toggleObjVis(o.id, o.visible)} />
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                    {o.start_val ? `Inicio: ${o.start_val} · ` : ''}Actual: {o.current_val} · Meta: {o.target_val}
                    {o.deadline ? ` · Límite: ${formatDate(o.deadline)}` : ' · Continuo'}
                  </p>
                  <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: st.color, width: `${Math.min(pct, 100)}%`, transition: 'width 0.8s ease' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: st.color }}>{Math.round(pct)}%</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{o.type === 'continuous' ? 'Continuo' : formatDate(o.deadline)}</span>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* MODAL REGISTRAR */}
      <Modal title="Registrar sesión" open={!!registerModal} onClose={() => setRegisterModal(null)}>
        <FormGroup label="RPE real"><RPESelector value={regForm.rpe} onChange={v => setRegForm({ ...regForm, rpe: v })} /></FormGroup>
        <WellnessSlider label="Sueño" value={regForm.sleep} onChange={v => setRegForm({ ...regForm, sleep: v })} leftLabel="Malo" rightLabel="Genial" />
        <WellnessSlider label="Fatiga muscular" value={regForm.fatigue} onChange={v => setRegForm({ ...regForm, fatigue: v })} leftLabel="Ninguna" rightLabel="Mucha" />
        <WellnessSlider label="Dolor / molestia" value={regForm.pain} onChange={v => setRegForm({ ...regForm, pain: v })} leftLabel="Nada" rightLabel="Mucho" />
        <FormGroup label="Cargas usadas"><input value={regForm.loads} onChange={e => setRegForm({ ...regForm, loads: e.target.value })} placeholder="KB 12kg, Press 10kg..." /></FormGroup>
        <FormGroup label="Notas del cliente"><textarea value={regForm.client_notes} onChange={e => setRegForm({ ...regForm, client_notes: e.target.value })} placeholder="¿Cómo fue?" /></FormGroup>
        <Btn onClick={registerSession} style={{ width: '100%', justifyContent: 'center' }}>Guardar sesión</Btn>
      </Modal>

      {/* MODAL OBJETIVO */}
      <Modal title="Nuevo objetivo" open={objModal} onClose={() => setObjModal(false)}>
        <FormGroup label="Objetivo"><input value={objForm.title} onChange={e => setObjForm({ ...objForm, title: e.target.value })} placeholder="Squat 1RM → 110 kg" /></FormGroup>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormGroup label="Valor inicial"><input value={objForm.start_val} onChange={e => setObjForm({ ...objForm, start_val: e.target.value })} placeholder="94 kg" /></FormGroup>
          <FormGroup label="Valor actual"><input value={objForm.current_val} onChange={e => setObjForm({ ...objForm, current_val: e.target.value })} placeholder="98 kg" /></FormGroup>
          <FormGroup label="Meta"><input value={objForm.target_val} onChange={e => setObjForm({ ...objForm, target_val: e.target.value })} placeholder="110 kg" /></FormGroup>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Tipo">
            <select value={objForm.type} onChange={e => setObjForm({ ...objForm, type: e.target.value })}>
              <option value="deadline">Con fecha límite</option>
              <option value="continuous">Continuo</option>
            </select>
          </FormGroup>
          <FormGroup label="Fecha límite"><input type="date" value={objForm.deadline} onChange={e => setObjForm({ ...objForm, deadline: e.target.value })} /></FormGroup>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text2)' }}>Visible para el cliente</label>
          <Toggle checked={objForm.visible} onChange={v => setObjForm({ ...objForm, visible: v })} />
        </div>
        <Btn onClick={addObjetivo} style={{ width: '100%', justifyContent: 'center' }}>Guardar objetivo</Btn>
      </Modal>
    </div>
  )
}
