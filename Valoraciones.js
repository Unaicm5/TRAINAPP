import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Btn, Modal, FormGroup, PageHeader, SectionLabel, Toggle, EmptyState, formatDate } from '../components/UI'

const CATS = ['Fuerza', 'Aeróbico / Anaeróbico', 'Movilidad', 'Composición corporal', 'Funcional', 'Otro']

export default function Valoraciones({ navTo, showToast, session }) {
  const [clients, setClients] = useState([])
  const [vals, setVals] = useState([])
  const [selClient, setSelClient] = useState(null)
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', value: '', category: CATS[0], date: new Date().toISOString().split('T')[0], visible: true, notes: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id)
    setClients(c || [])
    if (!selClient && c && c.length) setSelClient(c[0].id)
    const ids = (c || []).map(cl => cl.id)
    if (ids.length) {
      const { data: v } = await supabase.from('valoraciones').select('*').in('client_id', ids).order('date', { ascending: false })
      setVals(v || [])
    }
    setLoading(false)
  }

  const addVal = async () => {
    if (!form.name || !form.value) return
    const { error } = await supabase.from('valoraciones').insert({ ...form, client_id: selClient })
    if (!error) { showToast('Valoración guardada ✓'); setModal(false); setForm({ name: '', value: '', category: CATS[0], date: new Date().toISOString().split('T')[0], visible: true, notes: '' }); loadData() }
  }

  const toggleVis = async (id, visible) => {
    await supabase.from('valoraciones').update({ visible: !visible }).eq('id', id)
    loadData()
  }

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>

  const clientVals = vals.filter(v => v.client_id === selClient)
  const cats = [...new Set(clientVals.map(v => v.category))]

  return (
    <div>
      <PageHeader title="Valoraciones" sub="Resultados y métricas por cliente"
        action={<Btn onClick={() => setModal(true)}><i className="ti ti-plus"></i> Registrar</Btn>} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {clients.map(c => (
          <Btn key={c.id} size="sm" variant={selClient === c.id ? 'primary' : 'ghost'} onClick={() => setSelClient(c.id)}>{c.name}</Btn>
        ))}
      </div>

      {cats.length === 0
        ? <EmptyState icon="ti-chart-bar" text="Sin valoraciones para este cliente" action={<Btn onClick={() => setModal(true)}>Añadir primera valoración</Btn>} />
        : cats.map(cat => (
          <div key={cat}>
            <SectionLabel>{cat}</SectionLabel>
            <Card style={{ marginBottom: 8, padding: '0 20px' }}>
              {clientVals.filter(v => v.category === cat).map((v, i, arr) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(v.date)}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', minWidth: 80, textAlign: 'right' }}>{v.value}</div>
                  <button onClick={() => toggleVis(v.id, v.visible)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, cursor: 'pointer', border: '0.5px solid', background: v.visible ? 'var(--gdim)' : 'var(--bg4)', color: v.visible ? 'var(--green)' : 'var(--text3)', borderColor: v.visible ? 'var(--gborder)' : 'var(--border)', fontFamily: 'DM Mono,monospace', whiteSpace: 'nowrap' }}>
                    {v.visible ? 'Visible' : 'Oculto'}
                  </button>
                </div>
              ))}
            </Card>
          </div>
        ))}

      <Modal title="Nueva valoración" open={modal} onClose={() => setModal(false)}>
        <FormGroup label="Cliente">
          <select value={selClient || ''} onChange={e => setSelClient(e.target.value)}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormGroup>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Test / Métrica"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Squat 1RM, VO₂Max..." /></FormGroup>
          <FormGroup label="Resultado"><input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="102 kg, 48.4 ml..." /></FormGroup>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Categoría">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Fecha"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></FormGroup>
        </div>
        <FormGroup label="Notas"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones..." style={{ height: 60 }} /></FormGroup>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text2)' }}>Visible para el cliente</label>
          <Toggle checked={form.visible} onChange={v => setForm({ ...form, visible: v })} />
        </div>
        <Btn onClick={addVal} style={{ width: '100%', justifyContent: 'center' }}>Guardar valoración</Btn>
      </Modal>
    </div>
  )
}
