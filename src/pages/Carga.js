import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, MetricCard, Grid, PageHeader } from '../components/UI'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const chartOpts = (extra = {}) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { ticks: { color: '#52525b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    x: { ticks: { color: '#52525b', font: { size: 11 } }, grid: { display: false } }
  }, ...extra
})

export default function Carga({ session }) {
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: c } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id)
    const ids = (c || []).map(cl => cl.id)
    let s = []
    if (ids.length) {
      const { data } = await supabase.from('sessions').select('*').in('client_id', ids).eq('done', true)
      s = data || []
    }
    setClients(c || [])
    setSessions(s)
    setLoading(false)
  }

  if (loading) return <p style={{ color: 'var(--text2)' }}>Cargando...</p>

  const rpes = sessions.filter(s => s.rpe).map(s => s.rpe)
  const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—'
  const sleeps = sessions.filter(s => s.sleep).map(s => s.sleep)
  const avgSleep = sleeps.length ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : '—'
  const pains = sessions.filter(s => s.pain).map(s => s.pain)
  const avgPain = pains.length ? (pains.reduce((a, b) => a + b, 0) / pains.length).toFixed(1) : '—'

  const clientRpes = clients.map(c => {
    const r = sessions.filter(s => s.client_id === c.id && s.rpe).map(s => s.rpe)
    return r.length ? (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1) : 0
  })

  const clientLoads = clients.map(c => {
    const cs = sessions.filter(s => s.client_id === c.id && s.rpe)
    return cs.reduce((a, s) => a + s.rpe * 10, 0)
  })

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const wellByDay = last7.map(day => {
    const daySess = sessions.filter(s => s.date === day && s.sleep)
    return daySess.length ? (daySess.reduce((a, s) => a + s.sleep, 0) / daySess.length).toFixed(1) : null
  })

  return (
    <div>
      <PageHeader title="Control de carga" sub="RPE, wellness y carga de todos tus clientes" />

      <Grid cols={4} style={{ marginBottom: 24 }}>
        <MetricCard label="Sesiones registradas" value={sessions.length} color="var(--accent)" />
        <MetricCard label="RPE grupo" value={avgRpe} color="var(--amber)" />
        <MetricCard label="Sueño grupo" value={avgSleep} color="var(--green)" />
        <MetricCard label="Dolor grupo" value={avgPain} color={parseFloat(avgPain) > 4 ? 'var(--red)' : 'var(--green)'} />
      </Grid>

      {clients.length === 0
        ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>Añade clientes y registra sesiones para ver los datos.</p>
        : <Grid cols={2}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>RPE medio por cliente</div>
            <div style={{ height: 180 }}>
              <Bar data={{ labels: clients.map(c => c.name), datasets: [{ data: clientRpes, backgroundColor: clients.map(c => `${c.color || '#a3e635'}88`), borderColor: clients.map(c => c.color || '#a3e635'), borderWidth: 1, borderRadius: 6 }] }} options={chartOpts({ scales: { y: { min: 0, max: 10, ticks: { color: '#52525b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, x: { ticks: { color: '#52525b', font: { size: 11 } }, grid: { display: false } } } })} />
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Wellness (sueño) — últimos 7 días</div>
            <div style={{ height: 180 }}>
              <Line data={{ labels: last7.map(d => d.slice(5)), datasets: [{ data: wellByDay, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#22c55e', spanGaps: true }] }} options={chartOpts({ scales: { y: { min: 0, max: 10, ticks: { color: '#52525b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, x: { ticks: { color: '#52525b', font: { size: 11 } }, grid: { display: false } } } })} />
            </div>
          </Card>
          <Card style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Carga acumulada por cliente (UA)</div>
            <div style={{ height: 200 }}>
              <Bar data={{ labels: clients.map(c => c.name), datasets: [{ data: clientLoads, backgroundColor: clients.map(c => `${c.color || '#a3e635'}55`), borderColor: clients.map(c => c.color || '#a3e635'), borderWidth: 1, borderRadius: 6 }] }} options={chartOpts({ scales: { y: { beginAtZero: true, ticks: { color: '#52525b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, x: { ticks: { color: '#52525b', font: { size: 11 } }, grid: { display: false } } } })} />
            </div>
          </Card>
        </Grid>}
    </div>
  )
}
