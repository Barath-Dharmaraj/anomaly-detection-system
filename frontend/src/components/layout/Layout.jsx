import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Zap, Upload, History, ShieldAlert, LogOut, Menu, X, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useWebSocket } from '@/hooks/useWebSocket'

const NAV = [
  { path:'/dashboard', icon:LayoutDashboard, label:'Dashboard' },
  { path:'/predict',   icon:Zap,             label:'Predict'   },
  { path:'/upload',    icon:Upload,           label:'Batch Upload' },
  { path:'/history',   icon:History,          label:'History'   },
  { path:'/admin',     icon:ShieldAlert,      label:'Admin'     },
]

export default function Layout() {
  const [open, setOpen] = useState(true)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { connected, liveEvents } = useWebSocket()
  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--bg)'}}>
      <aside style={{width:open?220:56,flexShrink:0,background:'var(--bg-2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',transition:'width 0.2s',overflow:'hidden'}}>
        <div style={{padding:'16px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,minHeight:56}}>
          <div style={{width:28,height:28,borderRadius:6,background:'var(--bg-4)',border:'1px solid var(--border-2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <ShieldAlert size={14} color="var(--text-2)"/>
          </div>
          {open && <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--text)',whiteSpace:'nowrap',letterSpacing:'-0.01em'}}>AnomalyGuard</span>}
          <button onClick={()=>setOpen(o=>!o)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',display:'flex',flexShrink:0}}>
            {open ? <X size={14}/> : <Menu size={14}/>}
          </button>
        </div>
        <nav style={{flex:1,padding:'12px 8px',display:'flex',flexDirection:'column',gap:2,overflowY:'auto'}}>
          {NAV.map(({path,icon:Icon,label})=>{
            const active = pathname===path
            return (
              <button key={path} onClick={()=>navigate(path)} className={active?'nav-link-active':'nav-link'}
                style={{justifyContent:open?'flex-start':'center'}} title={!open?label:undefined}>
                <Icon size={14} style={{flexShrink:0}}/>
                {open && <span>{label}</span>}
              </button>
            )
          })}
        </nav>
        <div style={{borderTop:'1px solid var(--border)',padding:'12px 8px',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px'}}>
            {connected
              ? <><Wifi size={12} color="var(--success)"/>{open&&<span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--success)'}}>Live</span>}</>
              : <><WifiOff size={12} color="var(--text-3)"/>{open&&<span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>Offline</span>}</>}
          </div>
          {open?(
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--bg-3)',borderRadius:6,border:'1px solid var(--border)'}}>
              <div style={{width:26,height:26,borderRadius:'50%',background:'var(--bg-4)',border:'1px solid var(--border-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--text-2)',flexShrink:0}}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.username}</div>
                <div style={{fontSize:11,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
              </div>
              <button onClick={()=>{logout();navigate('/login')}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',display:'flex'}}><LogOut size={13}/></button>
            </div>
          ):(
            <button onClick={()=>{logout();navigate('/login')}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',display:'flex',justifyContent:'center',padding:'6px'}}><LogOut size={14}/></button>
          )}
        </div>
      </aside>
      <main style={{flex:1,overflowY:'auto',background:'var(--bg)'}}>
        <Outlet context={{liveEvents,connected}}/>
      </main>
    </div>
  )
}
