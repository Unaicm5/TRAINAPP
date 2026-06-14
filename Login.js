import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('login')

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    let result
    if (mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
      if (!result.error) {
        await supabase.from('profiles').upsert({ id: result.data.user.id, name: email.split('@')[0], role: 'trainer' })
      }
    }
    if (result.error) setError(result.error.message)
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:20}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,background:'var(--accent)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
            <i className="ti ti-bolt" style={{fontSize:28,color:'#000'}}></i>
          </div>
          <h1 style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:700,marginBottom:4}}>TrainApp</h1>
          <p style={{color:'var(--text2)',fontSize:14}}>Panel de entrenador personal</p>
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24}}>
          <div style={{display:'flex',background:'var(--bg3)',borderRadius:'var(--r-sm)',padding:3,gap:3,marginBottom:20}}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{flex:1,padding:'7px',border:'none',borderRadius:'var(--r-xs)',fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',background:mode===m?'var(--bg2)':'transparent',color:mode===m?'var(--text)':'var(--text2)',fontWeight:mode===m?500:'normal',border:mode===m?'0.5px solid var(--border2)':'none'}}>
                {m === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            ))}
          </div>
          <form onSubmit={handle}>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,color:'var(--text2)',display:'block',marginBottom:5}}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:13,color:'var(--text2)',display:'block',marginBottom:5}}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p style={{color:'var(--red)',fontSize:13,marginBottom:12,background:'var(--rdim)',padding:'8px 12px',borderRadius:'var(--r-xs)'}}>{error}</p>}
            <button type="submit" disabled={loading} style={{width:'100%',padding:'11px',background:'var(--accent)',color:'#000',border:'none',borderRadius:'var(--r-sm)',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
