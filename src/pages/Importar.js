import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { Card, Btn, FormGroup, PageHeader, Badge, Avatar, SectionLabel } from '../components/UI'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function parseExcelSessions(workbook) {
  const sessions = []
  workbook.SheetNames.forEach(sheetName => {
    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

    // Fila 2 (index 1): microciclo y nombre
    const fila2 = rows[1] || []
    const microciclo = fila2[1] ? String(fila2[1]).trim() : ''
    const nombreSesion = fila2[2] ? String(fila2[2]).trim() : sheetName

    // Fila 4 (index 3): días
    const fila4 = rows[3] || []
    const numDias = [fila4[2], fila4[3], fila4[4], fila4[5]].filter(d => d !== null && d !== undefined).length

    // Filas 8+ (index 7+): ejercicios
    const bloques = []
    let currentBloque = null

    for (let i = 7; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.every(c => c === null || c === undefined || c === '')) continue

      const bloqueName = row[1] ? String(row[1]).trim() : null
      const ejercicio = row[2] ? String(row[2]).trim() : null
      const reps = row[3] !== null && row[3] !== undefined ? String(row[3]).trim() : ''
      const series = row[4] !== null && row[4] !== undefined ? String(row[4]) : ''
      const carga = row[5] !== null && row[5] !== undefined ? String(row[5]).trim() : ''
      const descanso = row[6] ? String(row[6]).trim() : ''
      const indicaciones = row[7] ? String(row[7]).trim() : ''

      if (!ejercicio) continue

      if (bloqueName) {
        currentBloque = { nombre: bloqueName, ejercicios: [] }
        bloques.push(currentBloque)
      } else if (!currentBloque) {
        currentBloque = { nombre: '', ejercicios: [] }
        bloques.push(currentBloque)
      }

      // Si el ejercicio es un link de YouTube
      const isVideo = ejercicio.includes('youtube.com') || ejercicio.includes('youtu.be')
      currentBloque.ejercicios.push({
        name: isVideo ? '' : ejercicio,
        video: isVideo ? ejercicio : '',
        reps: reps || '',
        series: series || '',
        carga: carga !== '0' ? carga : '',
        descanso: descanso || '',
        indicaciones: indicaciones || '',
      })
    }

    sessions.push({
      sheetName,
      nombre: nombreSesion,
      microciclo,
      numDias,
      bloques,
      diasAsignados: Array(numDias || 3).fill(''),
    })
  })
  return sessions
}

export default function Importar({ session, showToast, navTo }) {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [parsedSessions, setParsedSessions] = useState([])
  const [existingNames, setExistingNames] = useState([])
  const [step, setStep] = useState(1) // 1=elegir cliente, 2=subir excel, 3=revisar, 4=importado
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)

  React.useEffect(() => {
    supabase.from('clients').select('*').eq('trainer_id', session.user.id).then(({ data }) => setClients(data || []))
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
      // Mark which ones are new
      const withNew = sessions.map(s => ({
        ...s,
        isNew: !existingNames.includes(s.nombre),
        selected: !existingNames.includes(s.nombre),
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

  const importSessions = async () => {
    setImporting(true)
    const toImport = parsedSessions.filter(s => s.selected && s.isNew)
    let count = 0
    for (const s of toImport) {
      // Calculate date based on dias assigned (use next occurrence of that weekday)
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

      for (let di = 0; di < s.diasAsignados.length; di++) {
        const diaName = s.diasAsignados[di]
        const date = getNextDate(diaName)
        await supabase.from('sessions').insert({
          client_id: selectedClient.id,
          name: s.nombre + (s.numDias > 1 ? ` — Día ${di + 1}` : ''),
          micro: s.microciclo,
          mesociclo: '',
          date,
          rpe_target: 7,
          exercises: JSON.stringify(s.bloques),
          done: false,
        })
        count++
      }
    }
    setImported(count)
    setImporting(false)
    setStep(4)
    showToast(`${count} sesiones importadas ✓`)
  }

  return (
    <div>
      <PageHeader title="Importar sesiones" sub="Sube un Excel y carga todas las sesiones automáticamente" />

      {/* STEP 1 — Elegir cliente */}
      {step === 1 && (
        <div>
          <SectionLabel>Elige el cliente</SectionLabel>
          {clients.map(c => (
            <Card key={c.id} onClick={() => selectClient(c)} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
              <Avatar name={c.name} color={c.color || '#a3e635'} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: 'Syne,sans-serif' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.goal}</div>
              </div>
              <i className="ti ti-chevron-right" style={{ marginLeft: 'auto', color: 'var(--text3)' }}></i>
            </Card>
          ))}
        </div>
      )}

      {/* STEP 2 — Subir Excel */}
      {step === 2 && (
        <div>
          <Card style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <Avatar name={selectedClient.name} color={selectedClient.color || '#a3e635'} size={36} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedClient.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{existingNames.length} sesiones ya en la app</div>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => setStep(1)} style={{ marginLeft: 'auto' }}>Cambiar</Btn>
          </Card>

          <div style={{ border: '2px dashed var(--accent-border)', borderRadius: 'var(--r)', padding: '40px 20px', textAlign: 'center', background: 'var(--accent-dim)' }}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 48, color: 'var(--accent)', display: 'block', marginBottom: 12 }}></i>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Sube el Excel de sesiones</p>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Cada hoja = una sesión. Solo se importarán las nuevas.</p>
            <label style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--accent)', color: '#000', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Elegir archivo
              <input type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* STEP 3 — Revisar y asignar días */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{parsedSessions.filter(s => s.isNew).length} sesiones nuevas</span>
                {parsedSessions.filter(s => !s.isNew).length > 0 && <span> · {parsedSessions.filter(s => !s.isNew).length} ya existían (se omiten)</span>}
              </p>
            </div>
            <Btn onClick={importSessions} disabled={importing || !parsedSessions.some(s => s.selected && s.isNew)}>
              {importing ? 'Importando...' : `Importar ${parsedSessions.filter(s => s.selected && s.isNew).length} sesiones`}
            </Btn>
          </div>

          {parsedSessions.map((s, si) => (
            <Card key={si} style={{ marginBottom: 10, opacity: !s.isNew ? 0.5 : 1, borderColor: s.selected && s.isNew ? 'var(--accent-border)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: s.isNew ? 12 : 0 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{s.nombre}</span>
                    <Badge color={s.isNew ? 'green' : 'gray'}>{s.isNew ? 'Nueva' : 'Ya existe'}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.microciclo} · {s.bloques.length} bloques · {s.bloques.reduce((a, b) => a + b.ejercicios.length, 0)} ejercicios</div>
                </div>
                {s.isNew && (
                  <button onClick={() => toggleSelect(si)} style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${s.selected ? 'var(--accent)' : 'var(--text3)'}`, background: s.selected ? 'var(--accent)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.selected && <i className="ti ti-check" style={{ fontSize: 12, color: '#000' }}></i>}
                  </button>
                )}
              </div>

              {s.isNew && s.selected && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Asigna el día de la semana a cada día de entreno:</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.diasAsignados.map((dia, di) => (
                      <div key={di} style={{ flex: '1 1 140px' }}>
                        <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Día {di + 1}</label>
                        <select value={dia} onChange={e => updateDia(si, di, e.target.value)} style={{ fontSize: 13, padding: '6px 10px' }}>
                          <option value="">Sin asignar</option>
                          {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
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
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Importación completada!</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>{imported} sesiones importadas para {selectedClient.name}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={() => navTo('client-detail', selectedClient.id)}>Ver sesiones de {selectedClient.name}</Btn>
            <Btn variant="ghost" onClick={() => { setStep(1); setParsedSessions([]); setSelectedClient(null) }}>Importar otro Excel</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
