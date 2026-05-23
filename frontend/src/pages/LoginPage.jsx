import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [form,setForm]=useState({email:'',password:''})
  const [show,setShow]=useState(false)
  const [loading,setLoading]=useState(false)
  const login=useAuthStore(s=>s.login)
  const navigate=useNavigate()
  const handleSubmit=async(e)=>{
    e.preventDefault();setLoading(true)
    try{await login(form.email,form.password);toast.success('Signed in');navigate('/dashboard')}
    catch(err){toast.error(err.response?.data?.detail||'Invalid credentials')}
    finally{setLoading(false)}
  }
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex'}}>
      <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',padding:48}}>
        <div style={{width:'100%',maxWidth:380}} className="fade-in">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:40}}>
            <div style={{width:32,height:32,borderRadius:7,background:'var(--bg-3)',border:'1px solid var(--border-2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <ShieldAlert size={16} color="var(--text-2)"/>
            </div>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'var(--text)',letterSpacing:'-0.01em'}}>AnomalyGuard</span>
          </div>
          <h1 style={{fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',marginBottom:6}}>Sign in</h1>
          <p style={{fontSize:13,color:'var(--text-3)',marginBottom:32}}>Access your fraud detection dashboard</p>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label className="label">Email address</label>
              <input type="email" required className="input-field" placeholder="you@company.com"
                value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{position:'relative'}}>
                <input type={show?'text':'password'} required className="input-field" style={{paddingRight:40}} placeholder="••••••••"
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',display:'flex'}}>
                  {show?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>
            <div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'10px 14px'}}>
              <p style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)',margin:0}}>Demo — <span style={{color:'var(--text-2)'}}>admin@demo.com</span> / <span style={{color:'var(--text-2)'}}>password123</span></p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4}}>
              {loading?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Signing in…</>:'Sign in'}
            </button>
          </form>
          <div className="divider" style={{margin:'28px 0'}}/>
          <p style={{fontSize:13,color:'var(--text-3)',textAlign:'center'}}>No account?{' '}<Link to="/register" style={{color:'var(--text-2)',fontWeight:500,textDecoration:'none'}}>Create one</Link></p>
        </div>
      </div>
      <div style={{width:460,background:'var(--bg-2)',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',justifyContent:'center',padding:48}}>
        <div style={{marginBottom:40}}>
          <div className="section-tag" style={{marginBottom:16}}>System Status</div>
          {[['ML Model','Isolation Forest'],['Detection ROC-AUC','0.9998'],['API','FastAPI v0.111'],['Database','SQLite / PostgreSQL']].map(([k,v])=>(
            <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:12,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>{k}</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,color:'var(--text-2)',fontFamily:'DM Mono,monospace'}}>{v}</span>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--success)'}}/>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="section-tag" style={{marginBottom:16}}>Detects</div>
          {['Unusual transaction amounts','Off-hours activity','Geographic anomalies','High-velocity spending','International fraud patterns'].map(item=>(
            <div key={item} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0'}}>
              <div style={{width:3,height:3,borderRadius:'50%',background:'var(--text-3)',flexShrink:0}}/>
              <span style={{fontSize:12,color:'var(--text-3)'}}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
