import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, MetricCard, Grid, Badge, Avatar, SectionLabel, formatDate, rpeColor } from '../components/UI'

export default function Dashboard({ navTo, session }) {
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id)
    const clientIds = (c || []).map(cl => cl.id)
    let s = []
    if (clientIds.length) {
      const { data } = await supabase.from('sessions').select('*').in('client_id', clientIds).order('created_at', { ascending: false }).limit(20)
      s = data || []
    }
    setClients(c || [])
    setSessions(s)
    setLoading(false)
  }

  const done = sessions.filter(s => s.done)
  const pending = sessions.filter(s => !s.done)
  const rpes = done.filter(s => s.rpe).map(s => s.rpe)
  const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—'
  const sleeps = done.filter(s => s.sleep).map(s => s.sleep)
  const avgSleep = sleeps.length ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : '—'
  const alerts = done.filter(s => s.pain > 5 || (s.rpe && s.rpe_target && s.rpe > s.rpe_target + 1))

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Buenos días 👋</h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>Aquí tienes el resumen de hoy</p>
      </div>

      <Grid cols={4} style={{ marginBottom: 24 }}>
        <MetricCard label="Clientes" value={clients.length} color="var(--accent)" sub="activos" />
        <MetricCard label="Sesiones hechas" value={done.length} color="var(--green)" sub="registradas" />
        <MetricCard label="RPE medio" value={avgRpe} color="var(--amber)" />
        <MetricCard label="Sueño medio" value={avgSleep} color="var(--green)" />
      </Grid>

      <Grid cols={2}>
        <div>
          <SectionLabel>Actividad reciente</SectionLabel>
          {done.slice(0, 5).map(s => {
            const c = clients.find(cl => cl.id === s.client_id)
            return (
              <Card key={s.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                {c && <Avatar name={c.name} color={c.color || '#a3e635'} size={34} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c?.name} · {formatDate(s.date)}</div>
                </div>
                {s.rpe && <Badge color={rpeColor(s.rpe)}>RPE {s.rpe}</Badge>}
              </Card>
            )
          })}
          {done.length === 0 && <Card style={{ padding: '14px 16px' }}><p style={{ fontSize: 13, color: 'var(--text3)' }}>Sin actividad reciente</p></Card>}
        </div>

        <div>
          <SectionLabel>Alertas</SectionLabel>
          {alerts.length > 0 ? alerts.map(s => {
            const c = clients.find(cl => cl.id === s.client_id)
            return (
              <Card key={s.id} style={{ marginBottom: 8, padding: '12px 16px', borderColor: s.pain > 5 ? 'var(--rborder)' : 'var(--aborder)', background: s.pain > 5 ? 'var(--rdim)' : 'var(--adim)' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: s.pain > 5 ? 'var(--red)' : 'var(--amber)' }}>
                  {s.pain > 5 ? `⚠ ${c?.name} — dolor ${s.pain}/10` : `↑ ${c?.name} — RPE ${s.rpe} (obj. ${s.rpe_target})`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.name}</div>
              </Card>
            )
          }) : <Card style={{ padding: '14px 16px' }}><p style={{ fontSize: 13, color: 'var(--text3)' }}>Sin alertas 🎉</p></Card>}

          <SectionLabel>Pendientes</SectionLabel>
          {pending.slice(0, 3).map(s => {
            const c = clients.find(cl => cl.id === s.client_id)
            return (
              <Card key={s.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                {c && <Avatar name={c.name} color={c.color || '#a3e635'} size={34} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c?.name} · {formatDate(s.date)}</div>
                </div>
                <Badge color="gray">Pendiente</Badge>
              </Card>
            )
          })}
          {pending.length === 0 && <Card style={{ padding: '14px 16px' }}><p style={{ fontSize: 13, color: 'var(--text3)' }}>Todo completado ✓</p></Card>}
        </div>
      </Grid>
    </div>
  )
}
