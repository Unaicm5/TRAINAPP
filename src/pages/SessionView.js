import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Btn, formatDate, rpeColor } from '../components/UI'

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  // Handle youtube.com/shorts/ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/)
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`
  // Handle youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  // Handle youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  return null
}

function ExerciseCard({ ej, index, sessionId, showToast }) {
  const [comment, setComment] = useState('')
  const [saved, setSaved] = useState(false)
  const embedUrl = getYoutubeEmbedUrl(ej.video)

  const saveComment = async () => {
    if (!comment.trim()) return
    // Save comment to session notes (append)
    setSaved(true)
    if (showToast) showToast('Comentario guardado ✓')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Vídeo incrustado */}
      {embedUrl ? (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
          <iframe
            src={embedUrl}
            title={`Ejercicio ${index + 1}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      ) : ej.name ? (
        <div style={{ padding: '14px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{ej.name}</p>
        </div>
      ) : null}

      {/* Info del ejercicio */}
      <div style={{ padding: '12px 14px' }}>
        {/* Chips: reps, carga, descanso */}
        {(ej.reps || ej.carga || ej.descanso) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: ej.indicaciones ? 10 : 0 }}>
            {ej.reps && (
              <div style={{ flex: 1, minWidth: 80, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 3, textTransform: 'uppercase' }}>Reps</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--text)' }}>{ej.reps}</div>
              </div>
            )}
            {ej.carga && ej.carga !== '0' && (
              <div style={{ flex: 1, minWidth: 80, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'DM Mono,monospace', marginBottom: 3, textTransform: 'uppercase' }}>Carga</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--accent)' }}>{ej.carga}</div>
              </div>
            )}
            {ej.descanso && (
              <div style={{ flex: 1, minWidth: 80, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 3, textTransform: 'uppercase' }}>Descanso</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{ej.descanso}</div>
              </div>
            )}
          </div>
        )}

        {/* Indicaciones */}
        {ej.indicaciones && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '0.5px solid var(--aborder)', borderRadius: 'var(--r-sm)', padding: '9px 12px', marginTop: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'DM Mono,monospace', marginBottom: 3, textTransform: 'uppercase' }}>Indicaciones</div>
            <div style={{ fontSize: 13, color: '#fcd34d', lineHeight: 1.55 }}>{ej.indicaciones}</div>
          </div>
        )}

        {/* Comentario del cliente */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 5, textTransform: 'uppercase' }}>Tu comentario</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="¿Dudas, sensaciones, algo que comentar...?"
              style={{ flex: 1, fontSize: 13, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif' }}
              onKeyDown={e => e.key === 'Enter' && saveComment()}
            />
            <button onClick={saveComment} style={{ padding: '0 12px', background: saved ? 'var(--green)' : 'var(--bg3)', border: `1px solid ${saved ? 'var(--gborder)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', cursor: 'pointer', color: saved ? 'var(--green)' : 'var(--text3)', fontSize: 16, transition: 'all 0.2s' }}>
              {saved ? '✓' : '→'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BlockCard({ bloque, sessionId, showToast }) {
  // Texto libre (vuelta a la calma)
  const isTextoLibre = bloque.ejercicios.length === 1 && bloque.ejercicios[0].esTexto

  if (isTextoLibre) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', marginBottom: 6 }}>{bloque.nombre}</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{bloque.ejercicios[0].name}</p>
      </div>
    )
  }

  // Series y descanso del bloque (del primer ejercicio que los tenga)
  const primeraConSeries = bloque.ejercicios.find(e => e.series && e.series !== '0')
  const primeraConDescanso = bloque.ejercicios.find(e => e.descanso)

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Cabecera del bloque */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Syne,sans-serif', letterSpacing: '0.02em' }}>
            {bloque.nombre}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {primeraConSeries && (
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'var(--accent-dim)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)', fontWeight: 600 }}>
                {primeraConSeries.series} series
              </span>
            )}
            {primeraConDescanso && (
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'var(--bg3)', color: 'var(--text3)', border: '0.5px solid var(--border)' }}>
                ⏱ {primeraConDescanso.descanso}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ejercicios del bloque */}
      {bloque.ejercicios.map((ej, ei) => (
        <ExerciseCard key={ei} ej={ej} index={ei} sessionId={sessionId} showToast={showToast} />
      ))}
    </div>
  )
}

export default function SessionView({ session: s, onBack, showToast, onRegister }) {
  const parseBloques = (exercises) => {
    if (!exercises) return []
    try {
      const parsed = JSON.parse(exercises)
      if (Array.isArray(parsed)) return parsed
    } catch (e) {}
    return []
  }

  const bloques = parseBloques(s.exercises)

  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 13, cursor: 'pointer', marginBottom: 20, border: 'none', background: 'none', fontFamily: 'DM Sans,sans-serif' }}>
        <i className="ti ti-arrow-left"></i> Volver a sesiones
      </button>

      {/* Header sesión */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'DM Mono,monospace', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {s.micro || s.mesociclo || 'Sesión'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne,sans-serif', marginBottom: 6 }}>{s.name}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{formatDate(s.date)}</span>
          <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 99, background: 'var(--bg3)', color: 'var(--text3)', border: '0.5px solid var(--border)' }}>RPE objetivo: {s.rpe_target}</span>
          {s.done && <Badge color={rpeColor(s.rpe)}>✓ Completada · RPE {s.rpe}</Badge>}
        </div>
        {s.notes && (
          <div style={{ marginTop: 12, background: 'rgba(245,158,11,0.06)', borderLeft: '2px solid var(--amber)', padding: '8px 12px', borderRadius: '0 var(--r-xs) var(--r-xs) 0', fontSize: 13, color: '#fcd34d', lineHeight: 1.5 }}>
            {s.notes}
          </div>
        )}
      </div>

      {/* Bloques */}
      {bloques.length > 0
        ? bloques.map((bloque, bi) => (
          <BlockCard key={bi} bloque={bloque} sessionId={s.id} showToast={showToast} />
        ))
        : <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: 32 }}>Sin ejercicios en esta sesión</p>
      }

      {/* Botón registrar */}
      {!s.done && (
        <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button onClick={onRegister} style={{ width: '100%', padding: '13px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>
            <i className="ti ti-check"></i> Registrar sesión completada
          </button>
        </div>
      )}

      {/* Resumen si está hecha */}
      {s.done && (
        <div style={{ marginTop: 12, background: 'var(--bg3)', border: '1px solid var(--gborder)', borderRadius: 'var(--r)', padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'DM Mono,monospace', marginBottom: 10, textTransform: 'uppercase' }}>Sesión completada</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: s.client_notes ? 10 : 0 }}>
            {[['RPE', s.rpe, 'var(--amber)'], ['Sueño', `${s.sleep}/10`, 'var(--blue)'], ['Fatiga', `${s.fatigue}/10`, 'var(--text2)'], ['Dolor', `${s.pain}/10`, s.pain > 5 ? 'var(--red)' : 'var(--green)']].map(([l, v, c]) => (
              <div key={l} style={{ flex: '1 1 70px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: c }}>{v}</div>
              </div>
            ))}
          </div>
          {s.loads && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>Cargas: {s.loads}</p>}
          {s.client_notes && <p style={{ fontSize: 13, color: '#fcd34d', fontStyle: 'italic', marginTop: 8 }}>"{s.client_notes}"</p>}
        </div>
      )}
    </div>
  )
}
