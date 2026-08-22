import React, { useState } from 'react'
import { Badge, formatDate, rpeColor } from '../components/UI'

const BLOCK_COLORS = [
  { bg: 'rgba(99,102,241,0.12)', border: '#6366f1', text: '#a5b4fc', light: 'rgba(99,102,241,0.25)' },
  { bg: 'rgba(163,230,53,0.1)', border: '#a3e635', text: '#bef264', light: 'rgba(163,230,53,0.25)' },
  { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', text: '#fcd34d', light: 'rgba(245,158,11,0.25)' },
  { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#fca5a5', light: 'rgba(239,68,68,0.25)' },
  { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', text: '#86efac', light: 'rgba(34,197,94,0.25)' },
  { bg: 'rgba(96,165,250,0.1)', border: '#60a5fa', text: '#93c5fd', light: 'rgba(96,165,250,0.25)' },
]

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  const s = String(url).trim()
  const shortsMatch = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/)
  if (shortsMatch) return 'https://www.youtube.com/embed/' + shortsMatch[1]
  const shortMatch = s.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) return 'https://www.youtube.com/embed/' + shortMatch[1]
  const watchMatch = s.match(/[?&]v=([a-zA-Z0-9_-]+)/)
  if (watchMatch) return 'https://www.youtube.com/embed/' + watchMatch[1]
  return null
}

function ExerciseCard({ ej, color, index }) {
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const embedUrl = getYoutubeEmbedUrl(ej.video)

  const handleSend = () => {
    if (!comment.trim()) return
    setSent(true)
    setTimeout(() => setSent(false), 2000)
  }

  if (ej.esTexto) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.7 }}>{ej.name}</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f0f11', border: '1px solid ' + color.border + '44', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
      {embedUrl ? (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
          <iframe
            src={embedUrl}
            title={'Ejercicio ' + (index + 1)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      ) : ej.name ? (
        <div style={{ padding: '12px 14px', background: color.bg, borderBottom: '1px solid ' + color.border + '44' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: color.text, fontFamily: 'Syne,sans-serif' }}>{ej.name}</p>
        </div>
      ) : null}

      <div style={{ padding: '12px 14px' }}>
        {(ej.reps || (ej.carga && ej.carga !== '0') || ej.descanso) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8, marginBottom: 12 }}>
            {ej.reps && (
              <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#a5b4fc', fontFamily: 'DM Mono,monospace', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reps</div>
                <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: '#e0e7ff' }}>{ej.reps}</div>
              </div>
            )}
            {ej.carga && ej.carga !== '0' && (
              <div style={{ background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.4)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#bef264', fontFamily: 'DM Mono,monospace', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Carga</div>
                <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: '#d9f99d' }}>{ej.carga}</div>
              </div>
            )}
            {ej.descanso && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#fcd34d', fontFamily: 'DM Mono,monospace', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descanso</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: '#fef08a' }}>{ej.descanso}</div>
              </div>
            )}
          </div>
        )}

        {ej.indicaciones && (
          <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', borderLeft: '3px solid #f59e0b', borderRadius: '0 8px 8px 0', padding: '8px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'DM Mono,monospace', marginBottom: 3, textTransform: 'uppercase' }}>Indicaciones</div>
            <p style={{ fontSize: 13, color: '#fef3c7', lineHeight: 1.55 }}>{ej.indicaciones}</p>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#52525b', fontFamily: 'DM Mono,monospace', marginBottom: 6, textTransform: 'uppercase' }}>Tu comentario</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Dudas, sensaciones..."
              style={{ flex: 1, fontSize: 13, padding: '7px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fafafa', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
            />
            <button onClick={handleSend} style={{ width: 34, height: 34, border: '1px solid ' + (sent ? '#22c55e' : 'rgba(255,255,255,0.12)'), borderRadius: 6, background: sent ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)', color: sent ? '#22c55e' : '#71717a', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {sent ? '✓' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SessionView({ session: s, onBack, showToast, onRegister }) {
  const [activeBlock, setActiveBlock] = useState(0)

  const parseBloques = (exercises) => {
    if (!exercises) return []
    try {
      const parsed = JSON.parse(exercises)
      if (Array.isArray(parsed)) return parsed.map((b, i) => ({ ...b, _index: i }))
    } catch (e) {}
    return []
  }

  const bloques = parseBloques(s.exercises)
  const activeBloque = bloques[activeBlock]
  const color = BLOCK_COLORS[activeBlock % BLOCK_COLORS.length]

  return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#71717a', fontSize: 13, cursor: 'pointer', marginBottom: 20, border: 'none', background: 'none', fontFamily: 'DM Sans,sans-serif' }}>
        <i className="ti ti-arrow-left"></i> Volver
      </button>

      <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: '#a3e635', fontFamily: 'DM Mono,monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{s.micro || 'Sesión'}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne,sans-serif', color: '#fafafa', marginBottom: 10, lineHeight: 1.2 }}>{s.name}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#71717a' }}>{formatDate(s.date)}</span>
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}>RPE objetivo: {s.rpe_target}</span>
          {s.done && <Badge color={rpeColor(s.rpe)}>{'✓ Completada · RPE ' + s.rpe}</Badge>}
        </div>
        {s.notes && (
          <div style={{ marginTop: 12, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderLeft: '3px solid #f59e0b', borderRadius: '0 8px 8px 0', padding: '8px 12px', fontSize: 13, color: '#fef3c7', lineHeight: 1.5 }}>{s.notes}</div>
        )}
      </div>

      {bloques.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
            {bloques.map((bloque, bi) => {
              const c = BLOCK_COLORS[bi % BLOCK_COLORS.length]
              const isActive = activeBlock === bi
              const primeraConSeries = bloque.ejercicios && bloque.ejercicios.find(e => e.series && e.series !== '0')
              return (
                <button key={bi} onClick={() => setActiveBlock(bi)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid ' + (isActive ? c.border : 'rgba(255,255,255,0.08)'), background: isActive ? c.bg : 'transparent', color: isActive ? c.text : '#71717a', fontSize: 12, fontWeight: isActive ? 600 : 400, fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {bloque.nombre || ('Bloque ' + (bi + 1))}
                  {primeraConSeries && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: isActive ? c.light : 'rgba(255,255,255,0.06)', color: isActive ? c.text : '#52525b' }}>{primeraConSeries.series}s</span>
                  )}
                </button>
              )
            })}
          </div>

          {activeBloque && (
            <div>
              <div style={{ background: color.bg, border: '1px solid ' + color.border + '55', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: color.text, fontFamily: 'Syne,sans-serif' }}>{activeBloque.nombre || ('Bloque ' + (activeBlock + 1))}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(() => {
                    const ps = activeBloque.ejercicios && activeBloque.ejercicios.find(e => e.series && e.series !== '0')
                    const pd = activeBloque.ejercicios && activeBloque.ejercicios.find(e => e.descanso)
                    return (
                      <>
                        {ps && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: color.light, color: color.text, fontWeight: 600 }}>{ps.series} series</span>}
                        {pd && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}>⏱ {pd.descanso}</span>}
                      </>
                    )
                  })()}
                </div>
              </div>
              {activeBloque.ejercicios && activeBloque.ejercicios.map((ej, ei) => (
                <ExerciseCard key={ei} ej={ej} color={color} index={ei} />
              ))}
            </div>
          )}
        </>
      )}

      {!s.done ? (
        <button onClick={onRegister} style={{ width: '100%', marginTop: 16, padding: '14px', background: '#a3e635', color: '#000', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <i className="ti ti-check"></i> Registrar sesión completada
        </button>
      ) : (
        <div style={{ marginTop: 16, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#22c55e', fontFamily: 'DM Mono,monospace', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sesión completada</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[['RPE', s.rpe, '#f59e0b'],['Sueño', s.sleep+'/10','#60a5fa'],['Fatiga',s.fatigue+'/10','#a1a1aa'],['Dolor',s.pain+'/10',s.pain>5?'#ef4444':'#22c55e']].map(([l,v,c])=>(
              <div key={l} style={{ background: '#0f0f11', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#52525b', fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: c }}>{v}</div>
              </div>
            ))}
          </div>
          {s.loads && <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: 10 }}>Cargas: {s.loads}</p>}
          {s.client_notes && <p style={{ fontSize: 13, color: '#fcd34d', fontStyle: 'italic', marginTop: 6 }}>"{s.client_notes}"</p>}
        </div>
      )}
    </div>
  )
}
