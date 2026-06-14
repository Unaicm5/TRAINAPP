import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Sessions from './pages/Sessions'
import Valoraciones from './pages/Valoraciones'
import Carga from './pages/Carga'
import Nutricion from './pages/Nutricion'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const navTo = (p, clientId = null) => {
    setPage(p)
    if (clientId) setSelectedClientId(clientId)
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:48,height:48,background:'var(--accent)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <i className="ti ti-bolt" style={{fontSize:24,color:'#000'}}></i>
        </div>
        <p style={{color:'var(--text2)',fontSize:14}}>Cargando...</p>
      </div>
    </div>
  )

  if (!session) return <Login onLogin={() => {}} />

  const props = { navTo, showToast, session }

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar page={page} navTo={navTo} session={session} />
      <main style={{flex:1,padding:'28px 32px',maxWidth:1100,marginLeft:220,paddingBottom:80}}>
        {page === 'dashboard' && <Dashboard {...props} />}
        {page === 'clients' && <Clients {...props} />}
        {page === 'client-detail' && <ClientDetail {...props} clientId={selectedClientId} />}
        {page === 'sessions' && <Sessions {...props} />}
        {page === 'valoraciones' && <Valoraciones {...props} />}
        {page === 'carga' && <Carga {...props} />}
        {page === 'nutricion' && <Nutricion {...props} />}
      </main>
      {toast && <Toast message={toast} />}
    </div>
  )
}
