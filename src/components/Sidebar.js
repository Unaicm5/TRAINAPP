import React from 'react'
import { supabase } from '../lib/supabase'

const items = [
  { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { id: 'clients', icon: 'ti-users', label: 'Clientes' },
  { id: 'sessions', icon: 'ti-calendar', label: 'Sesiones' },
  { id: 'valoraciones', icon: 'ti-chart-bar', label: 'Valoraciones' },
  { id: 'carga', icon: 'ti-trending-up', label: 'Control carga' },
  { id: 'nutricion', icon: 'ti-apple', label: 'Nutrición' },
  { id: 'importar', icon: 'ti-file-upload', label: 'Importar Excel' },
]

export default function Sidebar({ page, navTo }) {
  const logout = async () => { await supabase.auth.signOut() }

  return (
    <nav style={{width:220,background:'var(--bg2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'20px 0',position:'fixed',top:0,left:0,height:'100vh',zIndex:100}}>
      <div style={{padding:'0 20px 24px',borderBottom:'1px solid var(--border)',marginBottom:8}}>
        <div style={{width:36,height:36,background:'var(--accent)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>
          <i className="ti ti-bolt" style={{fontSize:20,color:'#000'}}></i>
        </div>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700}}>TrainApp</div>
        <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>Panel de entrenador</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:2,padding:'0 10px',flex:1,overflowY:'auto'}}>
        {items.map(item => (
          <button key={item.id} onClick={() => navTo(item.id)}
            style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:13,
              color:page===item.id?'var(--accent)':'var(--text2)',
              background:page===item.id?'var(--accent-dim)':'transparent',
              border:page===item.id?'0.5px solid var(--accent-border)':'none',
              width:'100%',textAlign:'left',fontFamily:'DM Sans,sans-serif',transition:'all 0.15s',
              ...(item.id==='importar' ? {marginTop:8,borderTop:'1px solid var(--border)',paddingTop:14} : {})
            }}>
            <i className={`ti ${item.icon}`} style={{fontSize:18,flexShrink:0}}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div style={{padding:'16px 10px 0',borderTop:'1px solid var(--border)'}}>
        <button onClick={logout} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:13,color:'var(--text2)',background:'transparent',border:'none',width:'100%',fontFamily:'DM Sans,sans-serif'}}>
          <i className="ti ti-logout" style={{fontSize:18}}></i>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  )
}
