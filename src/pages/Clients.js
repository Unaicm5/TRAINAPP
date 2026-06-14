import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Btn, Modal, FormGroup, PageHeader, Avatar, Badge, EmptyState } from '../components/UI'

const COLORS = ['#a3e635','#60a5fa','#f472b6','#fb923c','#c084fc','#34d399']
const GOALS = ['Fuerza y potencia','Pérdida de grasa','Rendimiento deportivo','Movilidad y salud','Otro']

export default function Clients({ navTo, showToast, session }) {
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', age: '', goal: GOALS[0], micro: 'Microciclo 1', color: COLORS[0], notes: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id).order('created_at')
    const ids = (c || []).map(cl => cl.id)
    let s = []
    if (ids.length) {
      const { data } = await supabase.from('sessions').select('id,client_id,done,rpe').in('client_id', ids)
      s = data || []
    }
    setClients(c || [])
    setSessions(s)
    setLoading(false)
  }

  const addClient = async () => {
    if (!form.name.trim()) return
    const { error } = await supabase.from('clients').insert({ ...form, age: parseInt(form.age) || null, trainer_id: session.user.id })
    if (!error) { showToast(`${form.name} añadido ✓`); setModal(false); setForm({ name: '', age: '', goal: GOALS[0], micro: 'Microciclo 1', color: COLORS[0], notes: '' }); loadData() }
  }

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>

  return (
    <div>
      <PageHeader title="Clientes" sub={`${clients.length} clientes activos`}
        action={<Btn onClick={() => setModal(true)}><i className="ti ti-plus"></i> Nuevo cliente</Btn>} />

      {clients.length === 0
        ? <EmptyState icon="ti-users" text="Sin clientes aún" action={<Btn onClick={() => setModal(true)}>Añadir primer cliente</Btn>} />
        : clients.map(c => {
          const cSess = sessions.filter(s => s.client_id === c.id)
          const done = cSess.filter(s => s.done).length
          const rpes = cSess.filter(s => s.done && s.rpe).map(s => s.rpe)
          const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—'
          return (
            <Card key={c.id} onClick={() => navTo('client-detail', c.id)} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
              <Avatar name={c.name} color={c.color || '#a3e635'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: 'Syne,sans-serif' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{c.goal} · {c.micro}</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif' }}>{done}/{cSess.length}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace' }}>sesiones</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--amber)' }}>{avgRpe}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace' }}>RPE med.</div>
                </div>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize: 18, color: 'var(--text3)' }}></i>
            </Card>
          )
        })}

      <Modal title="Nuevo cliente" open={modal} onClose={() => setModal(false)}>
        <FormGroup label="Nombre completo"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Carlos Martínez" /></FormGroup>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Edad"><input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="28" /></FormGroup>
          <FormGroup label="Objetivo"><select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>{GOALS.map(g => <option key={g}>{g}</option>)}</select></FormGroup>
        </div>
        <FormGroup label="Microciclo"><input value={form.micro} onChange={e => setForm({ ...form, micro: e.target.value })} placeholder="Microciclo 1" /></FormGroup>
        <FormGroup label="Color">
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {COLORS.map(col => <div key={col} onClick={() => setForm({ ...form, color: col })} style={{ width: 28, height: 28, borderRadius: '50%', background: col, cursor: 'pointer', border: form.color === col ? '3px solid white' : '2px solid transparent' }}></div>)}
          </div>
        </FormGroup>
        <FormGroup label="Notas"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Historial, lesiones..." /></FormGroup>
        <Btn onClick={addClient} style={{ width: '100%', justifyContent: 'center' }}>Añadir cliente</Btn>
      </Modal>
    </div>
  )
}
