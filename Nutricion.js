import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Btn, Modal, FormGroup, PageHeader, SectionLabel, Toggle, EmptyState, formatDate } from '../components/UI'

const GOALS = ['Pérdida de grasa', 'Ganancia muscular', 'Mantenimiento', 'Rendimiento deportivo', 'Otro']
const MEAL_DEFAULTS = [
  { nombre: 'Desayuno', hora: '08:00' }, { nombre: 'Media mañana', hora: '11:00' },
  { nombre: 'Comida', hora: '14:00' }, { nombre: 'Merienda', hora: '17:00' },
  { nombre: 'Pre-entreno', hora: '18:30' }, { nombre: 'Cena', hora: '21:00' }
]

export default function Nutricion({ showToast, session }) {
  const [clients, setClients] = useState([])
  const [plans, setPlans] = useState([])
  const [selClient, setSelClient] = useState(null)
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nMeals, setNMeals] = useState(4)
  const [comidas, setComidas] = useState(MEAL_DEFAULTS.slice(0, 4).map(m => ({ ...m, alimentos: '' })))
  const [form, setForm] = useState({ name: '', date: new Date().toISOString().split('T')[0], goal: GOALS[0], kcal: '', prot: '', hc: '', fat: '', notes: '', visible: true })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id)
    setClients(c || [])
    if (!selClient && c && c.length) setSelClient(c[0].id)
    const ids = (c || []).map(cl => cl.id)
    if (ids.length) {
      const { data: p } = await supabase.from('planes_nutricionales').select('*').in('client_id', ids).order('date', { ascending: false })
      setPlans(p || [])
    }
    setLoading(false)
  }

  const updateMeals = (n) => {
    setNMeals(n)
    setComidas(Array.from({ length: n }, (_, i) => comidas[i] || { ...MEAL_DEFAULTS[i] || { nombre: `Comida ${i + 1}`, hora: '12:00' }, alimentos: '' }))
  }

  const addPlan = async () => {
    if (!form.name) return
    const { error } = await supabase.from('planes_nutricionales').insert({
      ...form, client_id: selClient,
      kcal: parseInt(form.kcal) || 0, prot: parseInt(form.prot) || 0,
      hc: parseInt(form.hc) || 0, fat: parseInt(form.fat) || 0,
      meals: nMeals, comidas
    })
    if (!error) { showToast('Plan guardado ✓'); setModal(false); loadData() }
  }

  const savePlan = async () => {
    const { error } = await supabase.from('planes_nutricionales').update({
      name: editModal.name, kcal: parseInt(editModal.kcal) || 0,
      prot: parseInt(editModal.prot) || 0, hc: parseInt(editModal.hc) || 0,
      fat: parseInt(editModal.fat) || 0, notes: editModal.notes, visible: editModal.visible
    }).eq('id', editModal.id)
    if (!error) { showToast('Plan actualizado ✓'); setEditModal(null); loadData() }
  }

  const deletePlan = async (id) => {
    if (!window.confirm('¿Eliminar este plan?')) return
    await supabase.from('planes_nutricionales').delete().eq('id', id)
    showToast('Plan eliminado'); setEditModal(null); loadData()
  }

  const toggleVis = async (id, visible) => {
    await supabase.from('planes_nutricionales').update({ visible: !visible }).eq('id', id)
    loadData()
  }

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>

  const clientPlans = plans.filter(p => p.client_id === selClient)

  return (
    <div>
      <PageHeader title="Nutrición" sub="Planes nutricionales por cliente"
        action={<Btn onClick={() => setModal(true)}><i className="ti ti-plus"></i> Nuevo plan</Btn>} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {clients.map(c => <Btn key={c.id} size="sm" variant={selClient === c.id ? 'primary' : 'ghost'} onClick={() => setSelClient(c.id)}>{c.name}</Btn>)}
      </div>

      {clientPlans.length === 0
        ? <EmptyState icon="ti-apple" text="Sin planes nutricionales" action={<Btn onClick={() => setModal(true)}>Crear primer plan</Btn>} />
        : clientPlans.map(p => (
          <Card key={p.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Syne,sans-serif' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{p.goal} · Desde {formatDate(p.date)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => toggleVis(p.id, p.visible)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, cursor: 'pointer', border: '0.5px solid', background: p.visible ? 'var(--gdim)' : 'var(--bg4)', color: p.visible ? 'var(--green)' : 'var(--text3)', borderColor: p.visible ? 'var(--gborder)' : 'var(--border)', fontFamily: 'DM Mono,monospace' }}>{p.visible ? 'Visible' : 'Oculto'}</button>
                <Btn size="sm" variant="ghost" onClick={() => setEditModal({ ...p })}><i className="ti ti-pencil"></i></Btn>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {[['KCAL', p.kcal, 'var(--accent)'], ['PROT', `${p.prot}g`, 'var(--blue)'], ['HC', `${p.hc}g`, 'var(--amber)'], ['GRASA', `${p.fat}g`, 'var(--red)']].map(([l, v, c]) => (
                <div key={l} style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: c }}>{v}</div>
                </div>
              ))}
            </div>

            {p.comidas && p.comidas.length > 0 && (
              <>
                <SectionLabel style={{ margin: '0 0 8px' }}>Distribución de comidas</SectionLabel>
                {p.comidas.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < p.comidas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ background: 'var(--accent-dim)', border: '0.5px solid var(--accent-border)', borderRadius: 'var(--r-xs)', padding: '4px 8px', minWidth: 52, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'DM Mono,monospace' }}>{m.hora}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{m.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{m.alimentos}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {p.notes && <div style={{ background: 'rgba(245,158,11,0.06)', borderLeft: '2px solid var(--amber)', borderRadius: '0 var(--r-xs) var(--r-xs) 0', padding: '10px 14px', marginTop: 14, fontSize: 13, color: '#fcd34d', lineHeight: 1.5 }}>📋 {p.notes}</div>}
          </Card>
        ))}

      {/* MODAL NUEVO PLAN */}
      <Modal title="Nuevo plan nutricional" open={modal} onClose={() => setModal(false)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Cliente">
            <select value={selClient || ''} onChange={e => setSelClient(e.target.value)}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Nombre del plan"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Plan de volumen..." /></FormGroup>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Fecha inicio"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></FormGroup>
          <FormGroup label="Objetivo">
            <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
              {GOALS.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormGroup>
        </div>
        <SectionLabel style={{ margin: '4px 0 8px' }}>Macros diarios</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
          <FormGroup label="Kcal"><input type="number" value={form.kcal} onChange={e => setForm({ ...form, kcal: e.target.value })} placeholder="2400" /></FormGroup>
          <FormGroup label="Prot (g)"><input type="number" value={form.prot} onChange={e => setForm({ ...form, prot: e.target.value })} placeholder="180" /></FormGroup>
          <FormGroup label="HC (g)"><input type="number" value={form.hc} onChange={e => setForm({ ...form, hc: e.target.value })} placeholder="280" /></FormGroup>
          <FormGroup label="Grasa (g)"><input type="number" value={form.fat} onChange={e => setForm({ ...form, fat: e.target.value })} placeholder="70" /></FormGroup>
        </div>
        <FormGroup label="Número de comidas">
          <select value={nMeals} onChange={e => updateMeals(parseInt(e.target.value))}>
            {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} comidas</option>)}
          </select>
        </FormGroup>
        {comidas.map((m, i) => (
          <div key={i} style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <FormGroup label="Nombre"><input value={m.nombre} onChange={e => setComidas(comidas.map((c, j) => j === i ? { ...c, nombre: e.target.value } : c))} /></FormGroup>
              <FormGroup label="Hora"><input type="time" value={m.hora} onChange={e => setComidas(comidas.map((c, j) => j === i ? { ...c, hora: e.target.value } : c))} /></FormGroup>
            </div>
            <FormGroup label="Alimentos"><input value={m.alimentos} onChange={e => setComidas(comidas.map((c, j) => j === i ? { ...c, alimentos: e.target.value } : c))} placeholder="Avena 60g + leche + plátano..." /></FormGroup>
          </div>
        ))}
        <FormGroup label="Notas generales"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Hidratación, suplementación..." /></FormGroup>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text2)' }}>Visible para el cliente</label>
          <Toggle checked={form.visible} onChange={v => setForm({ ...form, visible: v })} />
        </div>
        <Btn onClick={addPlan} style={{ width: '100%', justifyContent: 'center' }}>Guardar plan</Btn>
      </Modal>

      {/* MODAL EDITAR */}
      {editModal && (
        <Modal title="Editar plan" open={!!editModal} onClose={() => setEditModal(null)}>
          <FormGroup label="Nombre"><input value={editModal.name} onChange={e => setEditModal({ ...editModal, name: e.target.value })} /></FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
            <FormGroup label="Kcal"><input type="number" value={editModal.kcal} onChange={e => setEditModal({ ...editModal, kcal: e.target.value })} /></FormGroup>
            <FormGroup label="Prot"><input type="number" value={editModal.prot} onChange={e => setEditModal({ ...editModal, prot: e.target.value })} /></FormGroup>
            <FormGroup label="HC"><input type="number" value={editModal.hc} onChange={e => setEditModal({ ...editModal, hc: e.target.value })} /></FormGroup>
            <FormGroup label="Grasa"><input type="number" value={editModal.fat} onChange={e => setEditModal({ ...editModal, fat: e.target.value })} /></FormGroup>
          </div>
          <FormGroup label="Notas"><textarea value={editModal.notes || ''} onChange={e => setEditModal({ ...editModal, notes: e.target.value })} /></FormGroup>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)' }}>Visible para el cliente</label>
            <Toggle checked={editModal.visible} onChange={v => setEditModal({ ...editModal, visible: v })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={savePlan} style={{ flex: 1, justifyContent: 'center' }}>Guardar cambios</Btn>
            <Btn variant="danger" onClick={() => deletePlan(editModal.id)}><i className="ti ti-trash"></i></Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
