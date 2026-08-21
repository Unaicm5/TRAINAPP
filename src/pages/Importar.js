import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { Card, Btn, PageHeader, Badge, Avatar, SectionLabel } from '../components/UI'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function isYoutubeLink(val) {
  if (!val) return false
  const s = String(val).trim()
  return s.includes('youtube.com') || s.includes('youtu.be')
}

function parseExcelSessions(workbook) {
  const sessions = []

  workbook.SheetNames.forEach(sheetName => {
    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

    // F2 (index 1): microciclo col B (index 1), título col C (index 2)
    const fila2 = rows[1] || []
    const microciclo = fila2[1] ? String(fila2[1]).trim() : ''
    const titulo = fila2[2] ? String(fila2[2]).trim() : sheetName

    // F4 (index 3): contar días
    const fila4 = rows[3] || []
    const diasCeldas = [fila4[2], fila4[3], fila4[4]].filter(d => d !== null && d !== undefined && String(d).trim() !== '')
    const numDias = diasCeldas.length || 1

    // F8+ (index 7+): ejercicios
    const bloques = []
    let currentBloque = null

    for (let i = 7; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue

      const bloqueNombre = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : null
      const ejercicioVal = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : null
      const reps = row[3] !== null && row[3] !== undefined ? String(row[3]).trim() : ''
      const series = row[4] !== null && row[4] !== undefined && row[4] !== 0 ? String(row[4]) : ''
      const carga = row[5] !== null && row[5] !== undefined && row[5] !== 0 ? String(row[5]).trim() : ''
      const descanso = row[6] !== null && row[6] !== undefined ? String(row[6]).trim() : ''
      const indicaciones = row[7] !== null && row[7] !== undefined ? String(row[7]).trim() : ''

      if (!ejercicioVal && !bloqueNombre) continue

      // Nuevo bloque si hay nombre en col B
      if (bloqueNombre) {
        currentBloque = { nombre: bloqueNombre, ejercicios: [] }
        bloques.push(currentBloque)
      }

      if (!ejercicioVal) continue

      // Si no hay bloque aún, crear uno vacío
      if (!currentBloque) {
        currentBloque = { nombre: '', ejercicios: [] }
        bloques.push(currentBloque)
      }

      const esLink = isYoutubeLink(ejercicioVal)
      const esTextoLibre = !esLink

      // Si es texto libre y no tiene reps/series, es el bloque final descriptivo
      if (esTextoLibre && !reps && !series) {
        currentBloque.ejercicios.push({
          name: ejercicioVal,
          video: '',
          reps: '',
          series: '',
          carga: '',
          descanso: '',
          indicaciones: '',
          esTexto: true,
        })
      } else {
        currentBloque.ejercicios.push({
          name: esTextoLibre ? ejercicioVal : '',
          video: esLink ? ejercicioVal : '',
          reps,
          series,
          carga: carga !== '0' ? carga : '',
          descanso,
          indicaciones,
          esTexto: false,
        })
      }
    }

    sessions.push({
      sheetName,
      nombre: titulo,
      microciclo,
      numDias,
      bloques,
      diasAsignados: Array(numDias).fill(''),
    })
  })

  return sessions
}

export default function Importar({ session, showToast, navTo, clienteId, clienteNombre, clienteColor, onBack }) {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(
    clienteId ? { id: clienteId, name: clienteNombre, color: clienteColor } : null
  )
  const [existingNames, setExistingNames] = useState([])
  const [parsedSessions, setParsedSessions] = useState([])
  const [step, setStep] = useState(clienteId ? 2 : 1)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)

  React.useEffect(() => {
    if (!clienteId) {
      supabase.from('clients').select('*').eq('trainer_id', session.user.id).then(({ data }) => setClients(data || []))
    } else {
      supabase.from('sessions').select('name').eq('client_id', clienteId).then(({ data }) => {
        setExistingNames((data || []).map(s => s.name))
      })
    }
  }, [])

  const selectClient = async (c) => {
    setSelectedClient(c)
    const { data } = await supabase.from('sessions').select('name').eq('client_id', c.id)
    setExistingNames((data || []).map(s => s.name))
    setStep(2)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' })
      const sessions = parseExcelSessions(wb)
      const withNew = sessions.map(s => ({
        ...s,
        isNew: !existingNames.some(n => n.startsWith(s.nombre)),
        selected: !existingNames.some(n => n.startsWith(s.nombre)),
      }))
      setParsedSessions(withNew)
      setStep(3)
    }
    reader.readAsArrayBuffer(file)
  }

  const updateDia = (si, di, value) => {
    setParsedSessions(parsedSessions.map((s, i) => i === si ? {
      ...s,
      diasAsignados: s.diasAsignados.map((d, j) => j === di ? value : d)
    } : s))
  }

  const toggleSelect = (si) => {
    setParsedSessions(parsedSessions.map((s, i) => i === si ? { ...s, selected: !s.selected } : s))
  }

  const getNextDate = (diaName) => {
    if (!diaName) return new Date().toISOString().split('T')[0]
    const idx = DIAS_SEMANA.indexOf(diaName)
    if (idx === -1) return new Date().toISOString().split('T')[0]
    const today = new Date()
    const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1
    let diff = idx - todayIdx
    if (diff <= 0) diff += 7
    const d = new Date(today)
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  }

  const importSessions = async () => {
    setImporting(true)
    const toImport = parsedSessions.filter(s => s.selected && s.isNew)
    let count = 0
    for (const s of toImport) {
      if (s.numDias <= 1) {
        const date = getNextDate(s.diasAsignados[0])
        const { error } = await supabase.from('sessions').insert({
          client_id: selectedClient.id,
          name: s.nombre,
          micro: s.microciclo,
          mesociclo: '',
          date,
          rpe_target: 7,
          exercises: JSON.stringify(s.bloques),
          done: false,
        })
        if (!error) count++
      } else {
        for (let di = 0; di < s.numDias; di++) {
          const date = getNextDate(s.diasAsignados[di])
          const { error } = await supabase.from('sessions').insert({
            client_id: selectedClient.id,
            name: s.nombre + (s.numDias > 1 ? ` — Día ${di + 1}` : ''),
            micro: s.microciclo,
            mesociclo: '',
            date,
            rpe_target: 7,
            exercises: JSON.stringify(s.bloques),
            done: false,
          })
          if (!error) count++
        }
      }
    }
    setImported(count)
    setImporting(false)
    setStep(4)
    showToast(`${count} sesiones importadas ✓`)
  }

  return (
    <div>
      {onBack && (
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 13, cursor: 'pointer', marginBottom: 20, border: 'none', background: 'none', fontFamily: 'DM Sans,sans-serif' }}>
          <i className="ti ti-arrow-left"></i> Volver al perfil
        </button>
      )}

      <PageHeader title="Importar sesiones desde Excel" sub="Cada hoja del Excel = una sesión. Solo se importan las nuevas." />

      {/* STEP 1 — Elegir cliente */}
      {step === 1 && (
        <div>
          <SectionLabel>Elige el cliente</SectionLabel>
          {clients.map(c => (
            <Card key={c.id} onClick={() => selectClient(c)} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
              <Avatar name={c.name} color={c.color || '#a3e635'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: 'Syne,sans-serif' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.goal}</div>
              </div>
              <i className="ti ti-chevron-right" style={{ color: 'var(--text3)' }}></i>
            </Card>
          ))}
        </div>
      )}

      {/* STEP 2 — Subir Excel */}
      {step === 2 && (
        <div>
          {selectedClient && (
            <Card style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <Avatar name={selectedClient.name} color={selectedClient.color || '#a3e635'} size={36} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedClient.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{existingNames.length} sesiones ya en la app</div>
              </div>
            </Card>
          )}
          <div style={{ border: '2px dashed var(--accent-border)', borderRadius: 'var(--r)', padding: '48px 20px', textAlign: 'center', background: 'var(--accent-dim)' }}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 52, color: 'var(--accent)', display: 'block', marginBottom: 14 }}></i>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Sube el Excel de sesiones</p>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Cada hoja = una sesión. Solo importa las que no existen ya.</p>
            <label style={{ display: 'inline-block', padding: '10px 28px', background: 'var(--accent)', color: '#000', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>
              Elegir archivo .xlsx
              <input type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* STEP 3 — Revisar */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text2)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{parsedSessions.filter(s => s.isNew).length} sesiones nuevas</span>
              {parsedSessions.filter(s => !s.isNew).length > 0 && <span style={{ color: 'var(--text3)' }}> · {parsedSessions.filter(s => !s.isNew).length} ya existen (omitidas)</span>}
            </p>
            <Btn onClick={importSessions} disabled={importing || !parsedSessions.some(s => s.selected && s.isNew)}>
              {importing ? 'Importando...' : `Importar ${parsedSessions.filter(s => s.selected && s.isNew).length}`}
            </Btn>
          </div>

          {parsedSessions.map((s, si) => (
            <Card key={si} style={{ marginBottom: 10, opacity: !s.isNew ? 0.45 : 1, borderColor: s.selected && s.isNew ? 'var(--accent-border)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: s.isNew && s.selected ? 14 : 0 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{s.sheetName} — {s.nombre}</span>
                    <Badge color={s.isNew ? 'green' : 'gray'}>{s.isNew ? 'Nueva' : 'Ya existe'}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {s.microciclo} · {s.bloques.length} bloques · {s.bloques.reduce((a, b) => a + b.ejercicios.length, 0)} ejercicios · {s.numDias} día{s.numDias > 1 ? 's' : ''}
                  </div>
                </div>
                {s.isNew && (
                  <button onClick={() => toggleSelect(si)} style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${s.selected ? 'var(--accent)' : 'var(--text3)'}`, background: s.selected ? 'var(--accent)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.selected && <i className="ti ti-check" style={{ fontSize: 12, color: '#000' }}></i>}
                  </button>
                )}
              </div>

              {s.isNew && s.selected && s.numDias > 0 && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Asigna el día de la semana:</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.diasAsignados.map((dia, di) => (
                      <div key={di} style={{ flex: '1 1 130px' }}>
                        <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Día {di + 1}</label>
                        <select value={dia} onChange={e => updateDia(si, di, e.target.value)} style={{ fontSize: 13, padding: '6px 8px' }}>
                          <option value="">Sin asignar</option>
                          {DIAS_SEMANA.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}

          <Btn onClick={importSessions} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={importing || !parsedSessions.some(s => s.selected && s.isNew)}>
            {importing ? 'Importando...' : `Importar ${parsedSessions.filter(s => s.selected && s.isNew).length} sesiones`}
          </Btn>
        </div>
      )}

      {/* STEP 4 — Hecho */}
      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gdim)', border: '1px solid var(--gborder)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <i className="ti ti-check" style={{ fontSize: 32, color: 'var(--green)' }}></i>
          </div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Listo!</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>{imported} sesiones importadas para {selectedClient?.name}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {onBack && <Btn onClick={onBack}>Ver sesiones</Btn>}
            {!onBack && selectedClient && <Btn onClick={() => navTo('client-detail', selectedClient.id)}>Ver sesiones</Btn>}
            <Btn variant="ghost" onClick={() => { setParsedSessions([]); setStep(clienteId ? 2 : 1) }}>Importar más</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
