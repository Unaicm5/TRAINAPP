import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, MetricCard, Grid, Avatar, SectionLabel, formatDate } from '../components/UI'

export default function Dashboard({ navTo, session }) {
  const [clients, setClients] = useState([])
  const [messages, setMessages] = useState([])
  const [notas, setNotas] = useState([])
  const [newNota, setNewNota] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id)
    const { data: m } = await supabase.from('mensajes').select('*').eq('trainer_id', session.user.id).eq('read', false).order('created_at', { ascending: false })
    const { data: n } = await supabase.from('notas').select('*').eq('trainer_id', session.user.id).order('created_at', { ascending: false })
    setClients(c || [])
    setMessages(m || [])
    setNotas(n || [])
    setLoading(false)
  }

  const addNota = async () => {
    if (!newNota.trim()) return
    await supabase.from('notas').insert({ trainer_id: session.user.id, content: newNota, done: false })
    setNewNota('')
    loadData()
  }

  const toggleNota = async (id, done) => {
    await supabase.from('notas').update({ done: !done }).eq('id', id)
    loadData()
  }

  const deleteNota = async (id) => {
    await supabase.from('notas').delete().eq('id', id)
    loadData()
  }

  const markMessageRead = async (id) => {
    await supabase.from('mensajes').update({ read: true }).eq('id', id)
    loadData()
  }

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>

  const pendingNotas = notas.filter(n => !n.done)
  const doneNotas = notas.filter(n => n.done)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Buenos días 👋</h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>Aquí tienes el resumen de hoy</p>
      </div>

      <Grid cols={2} style={{ marginBottom: 24 }}>
        <MetricCard label="Clientes" value={clients.length} color="var(--accent)" sub="activos" />
        <MetricCard label="Mensajes sin leer" value={messages.length} color={messages.length > 0 ? 'var(--red)' : 'var(--green)'} />
      </Grid>

      <Grid cols={2}>
        <div>
          <SectionLabel>Alertas — mensajes de clientes</SectionLabel>
          {messages.length > 0 ? messages.map(m => {
            const c = clients.find(cl => cl.id === m.client_id)
            return (
              <Card key={m.id} style={{ marginBottom: 8, padding: '12px 16px', borderColor: 'var(--aborder)', background: 'var(--adim)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {c && <Avatar name={c.name} color={c.color || '#a3e635'} size={32} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c?.name || 'Cliente'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>{m.content}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{formatDate(m.created_at?.split('T')[0])}</div>
                  </div>
                  <button onClick={() => markMessageRead(m.id)} style={{ background: 'var(--bg4)', border: 'none', color: 'var(--text2)', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 14, flexShrink: 0 }} title="Marcar como leído">✓</button>
                </div>
              </Card>
            )
          }) : <Card style={{ padding: '14px 16px' }}><p style={{ fontSize: 13, color: 'var(--text3)' }}>Sin mensajes nuevos 🎉</p></Card>}
        </div>

        <div>
          <SectionLabel>Notas</SectionLabel>
          <Card style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: pendingNotas.length || doneNotas.length ? 14 : 0 }}>
              <input value={newNota} onChange={e => setNewNota(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNota()} placeholder="Añadir una nota..." style={{ flex: 1 }} />
              <button onClick={addNota} style={{ padding: '0 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>+</button>
            </div>
            {pendingNotas.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => toggleNota(n.id, n.done)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--text3)', background: 'none', cursor: 'pointer', flexShrink: 0 }}></button>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{n.content}</span>
                <button onClick={() => deleteNota(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ))}
            {doneNotas.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => toggleNota(n.id, n.done)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--green)', background: 'var(--green)', cursor: 'pointer', flexShrink: 0, color: '#000', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text3)', textDecoration: 'line-through' }}>{n.content}</span>
                <button onClick={() => deleteNota(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ))}
            {notas.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)' }}>Sin notas todavía</p>}
          </Card>
        </div>
      </Grid>
    </div>
  )
}
