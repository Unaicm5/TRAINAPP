import React from 'react'
export default function Toast({ message }) {
  return (
    <div style={{position:'fixed',bottom:100,left:'50%',transform:'translateX(-50%)',background:'var(--bg2)',border:'1px solid var(--accent-border)',borderRadius:'var(--r)',padding:'12px 20px',fontSize:13,color:'var(--accent)',zIndex:999,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>
      {message}
    </div>
  )
}
